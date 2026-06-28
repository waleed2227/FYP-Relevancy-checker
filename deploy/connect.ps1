# SSH into EC2 using fyp-relevancy-key.pem from repo root.
# Usage: .\deploy\connect.ps1
# First time: copy deploy\ec2.config.example → deploy\ec2.config and set EC2_HOST

$ErrorActionPreference = "Stop"
$RepoRoot = Split-Path $PSScriptRoot -Parent

$configPath = Join-Path $PSScriptRoot "ec2.config"
$host_ = $env:EC2_HOST
$user = $env:EC2_USER
$keyRel = "fyp-relevancy-key.pem"

if (Test-Path $configPath) {
    Get-Content $configPath | ForEach-Object {
        if ($_ -match '^\s*#' -or $_ -notmatch '=') { return }
        $name, $value = $_ -split '=', 2
        $name = $name.Trim()
        $value = $value.Trim()
        switch ($name) {
            "EC2_HOST" { if (-not $host_) { $host_ = $value } }
            "EC2_USER" { if (-not $user) { $user = $value } }
            "EC2_KEY_PATH" { $keyRel = $value }
        }
    }
}

if (-not $host_ -or $host_ -eq "YOUR_PUBLIC_IPV4") {
    Write-Host "Set EC2_HOST in deploy\ec2.config (copy from ec2.config.example)" -ForegroundColor Red
    exit 1
}

if (-not $user) { $user = "ubuntu" }

$keyPath = Join-Path $RepoRoot $keyRel
if (-not (Test-Path $keyPath)) {
    Write-Host "Key not found: $keyPath" -ForegroundColor Red
    Write-Host "Place fyp-relevancy-key.pem in the repo root." -ForegroundColor Yellow
    exit 1
}

icacls $keyPath /inheritance:r /grant:r "${env:USERNAME}:(R)" 2>$null | Out-Null

Write-Host "Connecting to ${user}@${host_} ..." -ForegroundColor Cyan
ssh -i $keyPath "${user}@${host_}"
