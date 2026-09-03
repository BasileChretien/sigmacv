<#
.SYNOPSIS
  Confirm the VPS produced last night's backups and that both verifiers passed.

.DESCRIPTION
  scripts/pg-backup.sh and scripts/clickhouse-backup.sh run from cron on the VPS,
  and scripts/verify-backup.sh + scripts/clickhouse-verify-backup.sh prove the
  results restore. All four write to logs nobody reads. This checks them in one
  command, and exits non-zero if anything is missing -- so "the backups are fine"
  is something observed rather than assumed.

  Checks, for a given UTC day (default: today):
    * a dump exists for EACH of the four streams (sigmacv, metabase, plausible,
      clickhouse) -- per stream, so one silently stopping is visible rather than
      hidden behind the other three
    * the Postgres verifier logged OK that day
    * the ClickHouse verifier logged OK that day

.PARAMETER WaitUntilUtc
  Sleep until this UTC time (HH:mm) before checking, for arming the check ahead of
  the cron window. Cron runs 03:30 / 03:40 (dumps) and 04:15 / 04:45 (verifiers),
  so 04:50 is the first moment all four have finished.

.EXAMPLE
  ./check-nightly-backups.ps1 -RemoteHost root@sigmacv.org

.EXAMPLE
  ./check-nightly-backups.ps1 -RemoteHost root@sigmacv.org -WaitUntilUtc 04:50

.NOTES
  SSH: this deliberately resolves Windows OpenSSH by absolute path rather than
  trusting PATH. Git for Windows ships its own ssh that reads a different key
  store and fails with "Permission denied (publickey)" against this host. That
  matters most when the script is launched from a bash-ish context (a Monitor
  watch, a git hook, WSL), which inherits a PATH where Git's ssh wins -- a
  scheduled check then "runs" for hours and verifies nothing.
#>
[CmdletBinding()]
param(
  [string]$RemoteHost = $env:SIGMACV_HOST,
  [string]$RemoteDir = "/root/sigmacv-backups",
  [string]$VerifyLog = "/var/log/sigmacv-backup-verify.log",
  [string]$DumpLog = "/var/log/sigmacv-backup.log",
  [string[]]$Prefixes = @("sigmacv", "metabase", "plausible", "clickhouse"),
  [string]$WaitUntilUtc = "",
  [string]$ForUtcDate = ""
)

$ErrorActionPreference = "Stop"
$script:Failed = $false

function Say($m) { Write-Output $m }
function Bad($m) { Write-Output $m; $script:Failed = $true }

if (-not $RemoteHost) {
  Say "FAIL: no -RemoteHost given and SIGMACV_HOST is unset."
  exit 1
}

# --- SSH: absolute path, never whatever PATH happens to offer -----------------
$Ssh = Join-Path $env:SystemRoot "System32\OpenSSH\ssh.exe"
if (-not (Test-Path -LiteralPath $Ssh)) {
  $fallback = (Get-Command ssh -ErrorAction SilentlyContinue)
  if (-not $fallback) {
    Say "FAIL: Windows OpenSSH not found at $Ssh and no ssh on PATH."
    exit 1
  }
  $Ssh = $fallback.Source
  if ($Ssh -match "\\Git\\") {
    Say "WARNING: falling back to Git's ssh ($Ssh), which typically cannot"
    Say "         authenticate to this host. Expect 'Permission denied (publickey)'."
  }
}

# --- Optional wait ------------------------------------------------------------
if ($WaitUntilUtc) {
  if ($WaitUntilUtc -notmatch '^([01]\d|2[0-3]):([0-5]\d)$') {
    Say "FAIL: -WaitUntilUtc must be HH:mm (24h), got '$WaitUntilUtc'."
    exit 1
  }
  $h, $m = $WaitUntilUtc.Split(":")
  $target = [DateTime]::UtcNow.Date.AddHours([int]$h).AddMinutes([int]$m)
  if ([DateTime]::UtcNow -ge $target) { $target = $target.AddDays(1) }
  Say "waiting until $($target.ToString('yyyy-MM-dd HH:mm')) UTC ..."
  while ([DateTime]::UtcNow -lt $target) { Start-Sleep -Seconds 120 }
}

# The day is resolved AFTER any wait, so a watch armed before midnight UTC checks
# the day the dumps were actually written rather than the day it was armed.
$day = if ($ForUtcDate) { $ForUtcDate } else { [DateTime]::UtcNow.ToString("yyyyMMdd") }
$iso = [DateTime]::ParseExact($day, "yyyyMMdd", $null).ToString("yyyy-MM-dd")

Say "=== SigmaCV nightly backup check - $([DateTime]::UtcNow.ToString('yyyy-MM-dd HH:mm')) UTC, for $iso ==="
# Printed because picking the wrong ssh is the failure that started this script:
# a scheduled run authenticated against nothing for two hours and reported it as
# an ssh error rather than a backup problem. Seeing which binary ran ends that
# ambiguity immediately.
Say "  ssh: $Ssh"

function Invoke-Remote([string]$Command) {
  $out = & $Ssh -o BatchMode=yes -o ConnectTimeout=30 $RemoteHost $Command 2>&1
  if ($LASTEXITCODE -ne 0) {
    Bad "  FAIL ssh exited $LASTEXITCODE : $($out | Select-Object -First 2)"
    return $null
  }
  return $out
}

# --- 1. One dump per stream, dated $day ---------------------------------------
$listing = Invoke-Remote "ls -1 $RemoteDir 2>/dev/null"
if ($null -eq $listing) { Say "=== check aborted ==="; exit 1 }

foreach ($p in $Prefixes) {
  $hit = @($listing | Where-Object { $_ -like "$p-$day-*" })
  if ($hit.Count -gt 0) {
    Say "  DUMP   OK      $($p.PadRight(11)) $($hit[-1])"
  } else {
    $newest = @($listing | Where-Object { $_ -like "$p-*" } | Sort-Object)
    $seen = if ($newest.Count) { $newest[-1] } else { "none at all" }
    Bad "  DUMP   MISSING $($p.PadRight(11)) nothing for $iso (newest: $seen)"
  }
}

# --- 2. Both verifiers logged a pass that day ---------------------------------
# Anchored on the run header's date, then the OK line that follows it: an OK from
# a previous day must not be read as today's.
$verify = Invoke-Remote "grep -E 'backup verification|^OK: |^FAIL' $VerifyLog | tail -40"
if ($null -ne $verify) {
  $joined = ($verify -join "`n")
  foreach ($v in @(
      @{ Name = "postgres"; Header = "=== SigmaCV backup verification - $iso" },
      @{ Name = "clickhouse"; Header = "=== SigmaCV ClickHouse backup verification - $iso" })) {
    # The log uses an em dash; match loosely on the distinctive parts instead.
    $pattern = ($v.Header -replace '^=== ', '') -replace ' - .*$', ''
    $lines = @($verify | Select-String -SimpleMatch $pattern | Where-Object { "$_" -match [regex]::Escape($iso) })
    if ($lines.Count -eq 0) {
      Bad "  VERIFY MISSING $($v.Name.PadRight(11)) no run logged for $iso"
      continue
    }
    # Take everything after the last matching header and look for its OK line.
    $idx = $joined.LastIndexOf("$($lines[-1])")
    $tail = $joined.Substring($idx)
    if ($tail -match "(?m)^OK: ") {
      Say "  VERIFY OK      $($v.Name.PadRight(11)) $iso"
    } else {
      Bad "  VERIFY FAILED  $($v.Name.PadRight(11)) ran on $iso but did not log OK"
    }
  }
}

# --- 3. Dump-cron log tail, which catches a script that ran and failed ---------
# Two distinct signals, and both need care:
#   * an explicit failure line, which pg-backup.sh writes as "FAIL: " or
#     "FAIL[prefix]: ". Matched CASE-SENSITIVELY and anchored, because PowerShell's
#     -match is case-insensitive by default and a bare "FAIL" happily matches the
#     word "failed" in the SUCCESS line "summary: 3 database(s) backed up, 0
#     failed". That false positive is not harmless: a check that cries wolf gets
#     ignored, which costs you the real alarm later.
#   * the summary line's own failure count, which is the authoritative tally.
$dump = Invoke-Remote "tail -8 $DumpLog"
if ($null -ne $dump) {
  $bad = @($dump | Where-Object { "$_" -cmatch '^\s*FAIL(\[|:)' })
  if ($bad.Count -gt 0) {
    Bad "  DUMP LOG shows failures:"
    $bad | ForEach-Object { Say "    $_" }
  }
  foreach ($line in $dump) {
    if ("$line" -match 'summary:\s*\d+\s+database\(s\) backed up,\s*(\d+)\s+failed') {
      if ([int]$Matches[1] -gt 0) { Bad "  DUMP LOG summary reports $($Matches[1]) failed database(s): $line" }
    }
  }
}

if ($script:Failed) {
  Say "=== PROBLEMS FOUND - see the lines above ==="
  exit 1
}
Say "OK: all $($Prefixes.Count) dumps present for $iso, both verifiers passed."
exit 0
