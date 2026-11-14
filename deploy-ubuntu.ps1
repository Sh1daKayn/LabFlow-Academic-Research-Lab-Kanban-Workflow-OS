<#
.SYNOPSIS
  One-click deploy from local Windows PC to a Linux server via git bundle + SSH.
  Bypasses GitHub network restrictions on domestic cloud servers while keeping
  remote .data/labflow-state.json and .env completely intact.

.EXAMPLE
  .\deploy-ubuntu.ps1 -Target "XiaoZhang@152.136.201.71"
  .\deploy-ubuntu.ps1 -Target "user@server-ip" -Port 3001 -Mirror:$true
#>
param(
  [string]$Target = $env:LABFLOW_DEPLOY_TARGET,
  [int]$Port = 3000,
  [string]$RemoteDir = "~/LabFlow-Academic-Research-Lab-Kanban-Workflow-OS",
  [bool]$Mirror = $true
)

$ErrorActionPreference = "Stop"

$RepoDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$LocalConfig = Join-Path $RepoDir ".deploy.local"
if ([string]::IsNullOrWhiteSpace($Target) -and (Test-Path $LocalConfig)) {
  $Target = (Get-Content $LocalConfig -First 1).Trim()
}

if ([string]::IsNullOrWhiteSpace($Target)) {
  Write-Error "Missing -Target (e.g. .\deploy-ubuntu.ps1 -Target user@server-ip) or .deploy.local file."
  exit 1
}

Push-Location $RepoDir
$BundleFile = Join-Path $env:TEMP ("labflow-deploy-" + [guid]::NewGuid().ToString("N") + ".bundle")

try {
  Write-Host "==> [1/3] Creating git bundle from HEAD..." -ForegroundColor Cyan
  git bundle create $BundleFile HEAD
  if ($LASTEXITCODE -ne 0) { throw "git bundle create failed" }

  Write-Host "==> [2/3] Uploading bundle & update.sh to $Target via scp..." -ForegroundColor Cyan
  scp $BundleFile (Join-Path $RepoDir "update.sh") "${Target}:~/"
  if ($LASTEXITCODE -ne 0) { throw "scp upload failed" }

  $RemoteBundleName = Split-Path -Leaf $BundleFile
  $MirrorFlag = if ($Mirror) { "--mirror" } else { "" }

  Write-Host "==> [3/3] Running remote update.sh on $Target (Port $Port)..." -ForegroundColor Cyan
  $RemoteCmd = @"
set -euo pipefail
TARGET_DIR=$RemoteDir
if [ ! -d "`$TARGET_DIR/.git" ]; then
  git clone ~/$RemoteBundleName "`$TARGET_DIR"
fi
cp ~/update.sh "`$TARGET_DIR/update.sh"
sed -i 's/\r$//' "`$TARGET_DIR/update.sh"
chmod +x "`$TARGET_DIR/update.sh"
"`$TARGET_DIR/update.sh" --bundle ~/$RemoteBundleName --port $Port $MirrorFlag
rm -f ~/$RemoteBundleName ~/update.sh
"@
  $RemoteCmdUnix = ($RemoteCmd -replace "`r`n", "`n") + "`n"
  $RemoteCmdUnix | ssh $Target "bash -s"
  if ($LASTEXITCODE -ne 0) { throw "Remote update failed" }

  Write-Host "==> Deploy finished cleanly!" -ForegroundColor Green
}
finally {
  Pop-Location
  if (Test-Path $BundleFile) {
    Remove-Item -Force $BundleFile
  }
}
