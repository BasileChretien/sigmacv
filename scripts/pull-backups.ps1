<#
.SYNOPSIS
  Pull SigmaCV's Postgres dumps from the production VPS to the controller's own
  machine, verifying each file by SHA-256.

.DESCRIPTION
  The offsite copy lives on the maintainer's PC rather than a cloud bucket, and
  the direction matters: the server cannot reach a machine behind a home NAT, so
  this PULLS over SSH instead of the server pushing.

  Why the controller's own machine is a good target here: it introduces NO new
  sub-processor. The privacy notice already says the controller is based in Japan
  and that Japan-EU transfers rest on the 2019 mutual adequacy decision, so a
  copy held by the controller is covered by a statement that already exists. A
  third-party bucket would need declaring; this does not.

  Accepted trade-off, stated plainly: a single PC is one device. Theft, failure
  or ransomware can take it, and ransomware specifically targets mounted backup
  folders. This is the only offsite copy by choice.

  ENCRYPTION AT REST -- read this before changing it.
  Until 2026-09-02 this header claimed the copy was protected by "BitLocker being
  ON". It was not: 'manage-bde -status' reported BOTH volumes Fully Decrypted,
  Protection Off, no key protectors. The claim had never been checked, so ~150
  users' accounts, emails and CVs sat unencrypted on an endpoint while the
  documentation said otherwise.

  So the dumps are now encrypted HERE, by this script, and do not depend on the
  state of the disk they land on. Each file is encrypted with age to a RECIPIENT
  PUBLIC KEY: encrypting needs only the public key, so this PC never holds the
  means to decrypt. Someone who steals the machine gets ciphertext and nothing
  else -- which is a stronger property than full-disk encryption on a machine
  that is usually powered on.

  The private key belongs in a password manager, NOT on this disk. If it is lost,
  every backup here is lost with it; that is the trade the design makes on
  purpose. Whole-disk encryption is still worth turning on, but it protects a
  different thing (a powered-off machine) and is no longer what this relies on.

  Also rely on the staleness warning below, which is what makes "the PC is
  usually on" safe rather than merely hopeful.

.EXAMPLE
  ./pull-backups.ps1 -RemoteHost root@sigmacv.org

.NOTES
  Uses the OpenSSH client bundled with Windows 10/11 -- no extra dependencies.
  Never deletes anything on the server; the server's own rotation owns that.
#>
[CmdletBinding()]
param(
  [string]$RemoteHost = $env:SIGMACV_HOST,
  [string]$RemoteDir = "/root/sigmacv-backups",
  [string]$LocalDir = "$env:USERPROFILE\SigmaCV-Backups",
  # One prefix per database dumped by scripts/pg-backup.sh. Staleness and pruning
  # are evaluated PER PREFIX: with a single mixed pool, MinKeep could be satisfied
  # entirely by one database's dumps while another silently stopped being copied,
  # and the newest-file staleness check would be answered by whichever database
  # still worked. Both failures would look healthy.
  [string[]]$Prefixes = @("sigmacv", "metabase", "plausible", "clickhouse"),
  [int]$KeepDays = 14,
  [int]$MinKeep = 7,
  [int]$MaxAgeHours = 48,
  # age recipient (public key, "age1..."). Set SIGMACV_BACKUP_AGE_RECIPIENT once:
  #   age-keygen -o key.txt      # then move the SECRET line to a password manager
  #   [Environment]::SetEnvironmentVariable("SIGMACV_BACKUP_AGE_RECIPIENT","age1...","User")
  [string]$AgeRecipient = $env:SIGMACV_BACKUP_AGE_RECIPIENT,
  # Deliberate escape hatch, not a default. Without it the script REFUSES to store
  # plaintext -- a pull that fails loudly is recoverable; one that quietly writes
  # personal data in the clear is how this problem happened in the first place.
  [switch]$AllowPlaintext,
  # Encrypt pre-existing plaintext dumps and delete the originals. Only ever
  # deletes a plaintext file the SERVER still holds, so a wrong recipient key can
  # never destroy the only copy.
  [switch]$MigratePlaintext,
  [string]$LogFile = "$env:USERPROFILE\SigmaCV-Backups\pull-backups.log"
)

$ErrorActionPreference = "Stop"
$script:Failed = $false

function Write-Log {
  param([string]$Message, [switch]$IsError)
  $line = "{0}  {1}" -f (Get-Date -Format "yyyy-MM-ddTHH:mm:ssK"), $Message
  if ($IsError) { Write-Host $line -ForegroundColor Red } else { Write-Host $line }
  try { Add-Content -LiteralPath $LogFile -Value $line -ErrorAction Stop } catch { }
}

function Fail {
  param([string]$Message)
  Write-Log "FAIL: $Message" -IsError
  exit 1
}

if (-not $RemoteHost) {
  Fail "No remote host. Pass -RemoteHost root@sigmacv.org or set SIGMACV_HOST."
}
foreach ($cmd in @("ssh", "scp")) {
  if (-not (Get-Command $cmd -ErrorAction SilentlyContinue)) {
    Fail "$cmd not found. Install the Windows OpenSSH Client (Settings > Optional features)."
  }
}
if ($MinKeep -lt 1) { Fail "MinKeep must be >= 1 so pruning can never empty the local copy." }

New-Item -ItemType Directory -Force -Path $LocalDir | Out-Null
Write-Log "=== SigmaCV backup pull from $RemoteHost ==="

# --- 0. Encryption preconditions ---------------------------------------------
# Fail CLOSED. A pull that stops is visible in the scheduled task and recoverable;
# one that quietly writes ~150 users' personal data in the clear is not, and is
# exactly what went unnoticed until 2026-09-02.
$Encrypt = -not $AllowPlaintext
if ($Encrypt) {
  $ageCmd = (Get-Command age -ErrorAction SilentlyContinue)
  if (-not $ageCmd) {
    Fail "age is not on PATH -- install it (winget install FiloSottile.age) or pass -AllowPlaintext to deliberately store dumps unencrypted."
  }
  if (-not $AgeRecipient) {
    Fail "no age recipient. Set SIGMACV_BACKUP_AGE_RECIPIENT to your age public key (age1...), or pass -AllowPlaintext to deliberately store dumps unencrypted."
  }
  if ($AgeRecipient -notmatch '^age1[0-9a-z]{10,}$') {
    Fail "AgeRecipient does not look like an age public key (expected 'age1...'): '$AgeRecipient'"
  }
  Write-Log "  encrypting at rest to $AgeRecipient"
} else {
  Write-Log "  ! -AllowPlaintext: dumps will be stored UNENCRYPTED" -IsError
}

# Encrypt one file to <path>.age and record the plaintext hash beside it, so a
# future restore can prove it decrypted to the right bytes. Returns $true on
# success. Never deletes anything -- callers decide that.
function Protect-Dump {
  param([string]$PlainPath, [string]$Sha256)
  $agePath = "$PlainPath.age"
  if (Test-Path -LiteralPath $agePath) { Remove-Item -LiteralPath $agePath -Force }
  & age -r $AgeRecipient -o $agePath $PlainPath 2>&1 | Out-Null
  if ($LASTEXITCODE -ne 0 -or -not (Test-Path -LiteralPath $agePath)) {
    Write-Log "  ! age failed for $(Split-Path $PlainPath -Leaf)" -IsError
    return $false
  }
  # Sanity-check the artefact really is an age file rather than a truncated write.
  # The private key lives in a password manager, so a full round-trip cannot be
  # verified here -- the header check plus age's own exit code is what is available.
  $head = [System.Text.Encoding]::ASCII.GetString([System.IO.File]::ReadAllBytes($agePath)[0..20])
  if ($head -notlike "age-encryption.org*") {
    Remove-Item -LiteralPath $agePath -Force
    Write-Log "  ! $(Split-Path $agePath -Leaf) is not a valid age file -- discarded" -IsError
    return $false
  }
  Set-Content -LiteralPath "$PlainPath.sha256" -Value $Sha256 -Encoding ASCII
  return $true
}

# --- 1. What does the server have? -------------------------------------------
# Matches `*.gz`, not `*.sql.gz`: the ClickHouse artefact is a `.tar.gz` (schema +
# per-table Native data + manifest), so an extension-anchored glob would silently
# leave the analytics backup on the server. Transfer is catch-all rather than one
# glob per prefix:
# a database added to pg-backup.sh is then copied offsite automatically instead of
# being silently skipped until someone remembers to edit this script too. The
# per-prefix guarantees are enforced below, on what actually arrived.
$remoteList = & ssh -o BatchMode=yes -o ConnectTimeout=20 $RemoteHost "ls -1 $RemoteDir/*.gz 2>/dev/null" 2>&1
if ($LASTEXITCODE -ne 0) {
  Fail "ssh to $RemoteHost failed: $remoteList"
}
$remoteFiles = @($remoteList | Where-Object { $_ -match "\.gz$" } | ForEach-Object { $_.Trim() })
if ($remoteFiles.Count -eq 0) { Fail "no dumps found in ${RemoteDir} on the server" }
Write-Log "  server holds $($remoteFiles.Count) dump(s)"

# --- 2. Hash every remote dump, in ONE call -----------------------------------
# Originally this ran one `ssh sha256sum` per file, piped into `Select-Object
# -First 1`. That was wrong twice over: `-First` stops the pipeline early and can
# terminate ssh before it exits cleanly, so $LASTEXITCODE went non-zero and a
# perfectly valid hash was rejected ("could not hash ... (got '<valid hash>')").
# It also cost a round trip per file. One call fixes both, and the exit code is
# captured immediately rather than after a pipeline that may have killed ssh.
$hashOutput = & ssh -o BatchMode=yes -o ConnectTimeout=20 $RemoteHost "sha256sum $RemoteDir/*.gz" 2>&1
$hashExit = $LASTEXITCODE
if ($hashExit -ne 0) {
  Fail "could not hash the dumps on the server (ssh exit ${hashExit}): $($hashOutput | Select-Object -First 3)"
}

$remoteHashes = @{}
foreach ($line in $hashOutput) {
  # sha256sum prints: "<64 hex>  /path/to/file"
  if ("$line" -match '^([0-9a-f]{64})\s+(\S.*)$') {
    $remoteHashes[(Split-Path $Matches[2] -Leaf)] = $Matches[1]
  }
}
if ($remoteHashes.Count -eq 0) { Fail "no usable hashes parsed from the server" }
Write-Log "  hashed $($remoteHashes.Count) dump(s) on the server"

# --- 2. Fetch anything missing, then verify by hash ---------------------------
# A completed scp is not proof: a truncated transfer exits 0 often enough to
# matter, and a silently corrupt backup is the failure mode this whole chain
# exists to prevent. So every file is hashed on both ends.
$fetched = 0
foreach ($remotePath in $remoteFiles) {
  $name = Split-Path $remotePath -Leaf
  $localPath = Join-Path $LocalDir $name

  $remoteHash = $remoteHashes[$name]
  if (-not $remoteHash) {
    Write-Log "  ! no server hash for $name -- skipping" -IsError
    $script:Failed = $true
    continue
  }

  # Already held? When encrypting, the stored artefact is <name>.age and its
  # ciphertext differs on every run (age uses an ephemeral key), so it cannot be
  # compared to the server hash -- presence of the .age plus its recorded
  # plaintext hash is the check.
  if ($Encrypt) {
    if (Test-Path -LiteralPath "$localPath.age") {
      $recorded = if (Test-Path -LiteralPath "$localPath.sha256") { (Get-Content -LiteralPath "$localPath.sha256" -Raw).Trim() } else { "" }
      if ($recorded -eq $remoteHash) { continue }  # already held, and it is this dump
      Write-Log "  ! $name.age does not match the server dump -- refetching"
      Remove-Item -LiteralPath "$localPath.age" -Force
    }
  } elseif (Test-Path -LiteralPath $localPath) {
    $localHash = (Get-FileHash -LiteralPath $localPath -Algorithm SHA256).Hash.ToLower()
    if ($localHash -eq $remoteHash) { continue }  # already have it, intact
    Write-Log "  ! $name differs from the server copy -- refetching"
    Remove-Item -LiteralPath $localPath -Force
  }

  # -p keeps the server's mtime, so the staleness check below measures the age of
  # the DUMP, not the age of the copy. Without it every pulled file looks fresh.
  & scp -p -o BatchMode=yes "${RemoteHost}:${remotePath}" "$localPath" 2>&1 | Out-Null
  if ($LASTEXITCODE -ne 0 -or -not (Test-Path -LiteralPath $localPath)) {
    Write-Log "  ! scp failed for $name" -IsError
    $script:Failed = $true
    continue
  }

  $localHash = (Get-FileHash -LiteralPath $localPath -Algorithm SHA256).Hash.ToLower()
  if ($localHash -ne $remoteHash) {
    Remove-Item -LiteralPath $localPath -Force
    Write-Log "  ! $name failed hash verification after transfer -- removed" -IsError
    $script:Failed = $true
    continue
  }
  $sizeMb = [math]::Round((Get-Item -LiteralPath $localPath).Length / 1MB, 1)

  if ($Encrypt) {
    # Encrypt only AFTER the hash proves the transfer, so a corrupt download is
    # never sealed into an artefact nobody can check. Deleting the plaintext here
    # is safe whatever happens next: this file still exists on the server, so a
    # bad recipient key costs a re-pull, not the backup.
    if (-not (Protect-Dump -PlainPath $localPath -Sha256 $remoteHash)) {
      Remove-Item -LiteralPath $localPath -Force
      $script:Failed = $true
      continue
    }
    Remove-Item -LiteralPath $localPath -Force
    $fetched++
    Write-Log "  + $name.age ($sizeMb MB plaintext, verified + encrypted)"
  } else {
    $fetched++
    Write-Log "  + $name ($sizeMb MB, verified)"
  }
}
Write-Log "  fetched $fetched new dump(s)"

# --- 2b. Pre-existing plaintext ----------------------------------------------
# Dumps pulled before encryption existed are still sitting here in the clear.
# Encrypt them, and delete the plaintext ONLY where the server still holds the
# same file -- so even a wrong recipient key can never destroy the only copy.
# Anything the server has already rotated away is encrypted but KEPT, and named
# in the log, because deleting it would be irreversible.
if ($Encrypt) {
  $plain = @(Get-ChildItem -LiteralPath $LocalDir -Filter "*.gz" -File)
  if ($plain.Count -gt 0) {
    if (-not $MigratePlaintext) {
      Write-Log "  ! $($plain.Count) plaintext dump(s) still present -- re-run with -MigratePlaintext to encrypt them" -IsError
      $script:Failed = $true
    } else {
      $migrated = 0; $kept = 0
      foreach ($f in $plain) {
        $h = (Get-FileHash -LiteralPath $f.FullName -Algorithm SHA256).Hash.ToLower()
        if (-not (Protect-Dump -PlainPath $f.FullName -Sha256 $h)) { $script:Failed = $true; continue }
        if ($remoteHashes.ContainsKey($f.Name) -and $remoteHashes[$f.Name] -eq $h) {
          Remove-Item -LiteralPath $f.FullName -Force
          $migrated++
        } else {
          $kept++
          Write-Log "    kept plaintext $($f.Name) -- the server no longer has it, so deleting it here is irreversible; remove by hand once you have confirmed you can decrypt the .age"
        }
      }
      Write-Log "  migrated $migrated plaintext dump(s) to .age, kept $kept (server-only copy gone)"
    }
  }
}

# --- 3 & 4. Staleness and pruning, PER DATABASE -------------------------------
# Both are evaluated per prefix rather than over one mixed pool. A single pool
# would let one database's dumps satisfy MinKeep and answer the staleness check
# on behalf of another that had silently stopped being produced -- the pool would
# look healthy while a database went unbacked-up.
# What counts as "a dump held locally" depends on whether they are encrypted:
# the stored artefact is <name>.gz.age, and globbing *.gz would find none of them
# and report every database as missing.
$heldPattern = if ($Encrypt) { "*.gz.age" } else { "*.gz" }
$totalHeld = 0
foreach ($prefix in $Prefixes) {
  $local = @(Get-ChildItem -LiteralPath $LocalDir -Filter "$prefix-$heldPattern" -File | Sort-Object LastWriteTime -Descending)

  if ($local.Count -eq 0) {
    Write-Log "  ! [$prefix] no dumps present locally after the pull" -IsError
    $script:Failed = $true
    continue
  }

  $newest = $local[0]
  $ageHours = [math]::Round(((Get-Date) - $newest.LastWriteTime).TotalHours, 1)
  Write-Log "  [$prefix] newest: $($newest.Name) (${ageHours}h old, limit ${MaxAgeHours}h)"
  if ($ageHours -gt $MaxAgeHours) {
    Write-Log "  ! [$prefix] newest dump is ${ageHours}h old -- either this PC has been off, or the server's dump cron has stopped for this database" -IsError
    $script:Failed = $true
  }

  # Prune, never below MinKeep -- applied within this database's own set.
  if ($local.Count -gt $MinKeep) {
    $cutoff = (Get-Date).AddDays(-$KeepDays)
    $stale = @($local | Select-Object -Skip $MinKeep | Where-Object { $_.LastWriteTime -lt $cutoff })
    foreach ($f in $stale) {
      Remove-Item -LiteralPath $f.FullName -Force
      # The recorded plaintext hash is only meaningful next to its artefact.
      $sidecar = ($f.FullName -replace '\.age$', '') + ".sha256"
      if (Test-Path -LiteralPath $sidecar) { Remove-Item -LiteralPath $sidecar -Force }
      Write-Log "  - pruned $($f.Name)"
    }
  }

  $held = @(Get-ChildItem -LiteralPath $LocalDir -Filter "$prefix-$heldPattern" -File).Count
  $totalHeld += $held
  Write-Log "  [$prefix] local copy holds $held dump(s)"
}
Write-Log "  local copy holds $totalHeld dump(s) across $($Prefixes.Count) database(s)"

if ($script:Failed) {
  Write-Log "FINISHED WITH PROBLEMS -- see the lines marked ! above" -IsError
  exit 1
}
if ($Encrypt) {
  Write-Log "  decrypt with: age -d -i <identity-file> <name>.gz.age > <name>.gz"
  Write-Log "  then check it against the recorded hash in <name>.gz.sha256"
}
Write-Log "OK: local offsite copy is current and hash-verified."
exit 0
