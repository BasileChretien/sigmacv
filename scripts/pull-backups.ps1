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
  folders. This is the only offsite copy by choice. Rely on:
    * BitLocker being ON (personal data at rest), and
    * the staleness warning below, which is what makes "the PC is usually on"
      safe rather than merely hopeful.

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
  [string[]]$Prefixes = @("sigmacv", "metabase", "plausible"),
  [int]$KeepDays = 14,
  [int]$MinKeep = 7,
  [int]$MaxAgeHours = 48,
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

# --- 1. What does the server have? -------------------------------------------
# Transfer is deliberately catch-all (`*.sql.gz`) rather than one glob per prefix:
# a database added to pg-backup.sh is then copied offsite automatically instead of
# being silently skipped until someone remembers to edit this script too. The
# per-prefix guarantees are enforced below, on what actually arrived.
$remoteList = & ssh -o BatchMode=yes -o ConnectTimeout=20 $RemoteHost "ls -1 $RemoteDir/*.sql.gz 2>/dev/null" 2>&1
if ($LASTEXITCODE -ne 0) {
  Fail "ssh to $RemoteHost failed: $remoteList"
}
$remoteFiles = @($remoteList | Where-Object { $_ -match "\.sql\.gz$" } | ForEach-Object { $_.Trim() })
if ($remoteFiles.Count -eq 0) { Fail "no dumps found in ${RemoteDir} on the server" }
Write-Log "  server holds $($remoteFiles.Count) dump(s)"

# --- 2. Hash every remote dump, in ONE call -----------------------------------
# Originally this ran one `ssh sha256sum` per file, piped into `Select-Object
# -First 1`. That was wrong twice over: `-First` stops the pipeline early and can
# terminate ssh before it exits cleanly, so $LASTEXITCODE went non-zero and a
# perfectly valid hash was rejected ("could not hash ... (got '<valid hash>')").
# It also cost a round trip per file. One call fixes both, and the exit code is
# captured immediately rather than after a pipeline that may have killed ssh.
$hashOutput = & ssh -o BatchMode=yes -o ConnectTimeout=20 $RemoteHost "sha256sum $RemoteDir/*.sql.gz" 2>&1
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

  if (Test-Path -LiteralPath $localPath) {
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
  $fetched++
  $sizeMb = [math]::Round((Get-Item -LiteralPath $localPath).Length / 1MB, 1)
  Write-Log "  + $name ($sizeMb MB, verified)"
}
Write-Log "  fetched $fetched new dump(s)"

# --- 3 & 4. Staleness and pruning, PER DATABASE -------------------------------
# Both are evaluated per prefix rather than over one mixed pool. A single pool
# would let one database's dumps satisfy MinKeep and answer the staleness check
# on behalf of another that had silently stopped being produced -- the pool would
# look healthy while a database went unbacked-up.
$totalHeld = 0
foreach ($prefix in $Prefixes) {
  $local = @(Get-ChildItem -LiteralPath $LocalDir -Filter "$prefix-*.sql.gz" -File | Sort-Object LastWriteTime -Descending)

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
      Write-Log "  - pruned $($f.Name)"
    }
  }

  $held = @(Get-ChildItem -LiteralPath $LocalDir -Filter "$prefix-*.sql.gz" -File).Count
  $totalHeld += $held
  Write-Log "  [$prefix] local copy holds $held dump(s)"
}
Write-Log "  local copy holds $totalHeld dump(s) across $($Prefixes.Count) database(s)"

if ($script:Failed) {
  Write-Log "FINISHED WITH PROBLEMS -- see the lines marked ! above" -IsError
  exit 1
}
Write-Log "OK: local offsite copy is current and hash-verified."
exit 0
