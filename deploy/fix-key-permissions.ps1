# Fix fyp-relevancy-key.pem permissions for Windows OpenSSH.
# Usage: .\deploy\fix-key-permissions.ps1

$ErrorActionPreference = "Stop"
$RepoRoot = Split-Path $PSScriptRoot -Parent
$keyPath = Join-Path $RepoRoot "fyp-relevancy-key.pem"

if (-not (Test-Path $keyPath)) {
    Write-Host "Key not found: $keyPath" -ForegroundColor Red
    exit 1
}

Write-Host "Fixing permissions on: $keyPath" -ForegroundColor Cyan

icacls $keyPath /inheritance:r | Out-Null
icacls $keyPath /grant:r "${env:USERNAME}:(R)" | Out-Null
icacls $keyPath /remove "Authenticated Users" 2>$null | Out-Null
icacls $keyPath /remove "BUILTIN\Users" 2>$null | Out-Null
icacls $keyPath /remove "BUILTIN\Administrators" 2>$null | Out-Null
icacls $keyPath /remove "NT AUTHORITY\SYSTEM" 2>$null | Out-Null

Write-Host "Done. Current ACL:" -ForegroundColor Green
icacls $keyPath
