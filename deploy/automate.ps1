# One-shot: local V2 checks, test backend, upload setup script, run on EC2, test again.
# Usage from repo root:  .\deploy\automate.ps1
# Optional:             .\deploy\automate.ps1 -SetupOnly
# Optional:             .\deploy\automate.ps1 -TestOnly
# Optional:             .\deploy\automate.ps1 -SkipLocalChecks

param(
    [switch]$SetupOnly,
    [switch]$TestOnly,
    [switch]$SkipLocalChecks
)

$ErrorActionPreference = "Stop"
$RepoRoot = Split-Path $PSScriptRoot -Parent
$configPath = Join-Path $PSScriptRoot "ec2.config"
$BackendDir = Join-Path $RepoRoot "backend"

if (-not (Test-Path $configPath)) {
    Write-Host "Missing deploy\ec2.config - copy from ec2.config.example and set EC2_HOST" -ForegroundColor Red
    exit 1
}

$config = @{}
Get-Content $configPath | ForEach-Object {
    if ($_ -match '^\s*#' -or $_ -notmatch '=') { return }
    $n, $v = $_ -split '=', 2
    $config[$n.Trim()] = $v.Trim()
}

$host_ = $config["EC2_HOST"]
$user = if ($config["EC2_USER"]) { $config["EC2_USER"] } else { "ubuntu" }
$keyPath = Join-Path $RepoRoot $config["EC2_KEY_PATH"]
$apiUrl = $config["VITE_API_URL"]
$vercelUrl = $config["VERCEL_URL"]

if (-not $host_ -or -not (Test-Path $keyPath)) {
    Write-Host "Check EC2_HOST and fyp-relevancy-key.pem in repo root." -ForegroundColor Red
    exit 1
}

& (Join-Path $PSScriptRoot "fix-key-permissions.ps1")
$sshTarget = "${user}@${host_}"
$sshArgs = @("-i", $keyPath, "-o", "StrictHostKeyChecking=accept-new")

function Test-Backend {
    param([string]$Label, [string]$Url)
    Write-Host "`n[$Label] GET $Url/docs" -ForegroundColor Cyan
    try {
        $r = Invoke-WebRequest -Uri "$Url/docs" -UseBasicParsing -TimeoutSec 15
        Write-Host "OK - HTTP $($r.StatusCode)" -ForegroundColor Green
        return $true
    } catch {
        Write-Host "FAIL - $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

function Invoke-LocalPreDeployChecks {
    Write-Host "`n[Local] Pre-deployment checks (V2 + tests + E2E)..." -ForegroundColor Cyan
    Push-Location $BackendDir
    $env:PYTHONPATH = "."
    try {
        Write-Host "  -> verify_v2_predeploy" -ForegroundColor DarkGray
        python -m scripts.verify_v2_predeploy
        if ($LASTEXITCODE -ne 0) { throw "verify_v2_predeploy failed" }

        Write-Host "  -> pytest" -ForegroundColor DarkGray
        python -m pytest tests/ -q --tb=short
        if ($LASTEXITCODE -ne 0) { throw "pytest failed" }

        Write-Host "  -> export_local_db (fresh dump for EC2)" -ForegroundColor DarkGray
        python scripts/export_local_db.py
        if ($LASTEXITCODE -ne 0) { throw "export_local_db failed" }

        Write-Host "  -> verify_e2e_flows" -ForegroundColor DarkGray
        python -m scripts.verify_e2e_flows
        if ($LASTEXITCODE -ne 0) { throw "verify_e2e_flows failed" }

        Write-Host "Local pre-deployment checks: PASS" -ForegroundColor Green
    } finally {
        Pop-Location
    }
}

if (-not $TestOnly -and -not $SkipLocalChecks) {
    Invoke-LocalPreDeployChecks
}

if (-not $SetupOnly) {
    $null = Test-Backend "Before setup" $apiUrl
}

if (-not $TestOnly) {
    Write-Host "`n[Setup] Uploading backend files to EC2..." -ForegroundColor Cyan
    $remoteScript = Join-Path $PSScriptRoot "remote-setup.sh"
    scp @sshArgs $remoteScript "${sshTarget}:~/remote-setup.sh"
    scp -r @sshArgs (Join-Path $RepoRoot "backend\app") "${sshTarget}:~/FYP-Relevancy-checker/backend/"
    scp -r @sshArgs (Join-Path $RepoRoot "backend\scripts") "${sshTarget}:~/FYP-Relevancy-checker/backend/"
    scp @sshArgs (Join-Path $RepoRoot "backend\requirements.txt") "${sshTarget}:~/FYP-Relevancy-checker/backend/requirements.txt"

    $dumpPath = Join-Path $BackendDir "local_database_dump.json"
    if (Test-Path $dumpPath) {
        Write-Host "[Setup] Uploading local_database_dump.json (V2 scores)..." -ForegroundColor Cyan
        scp @sshArgs $dumpPath "${sshTarget}:~/FYP-Relevancy-checker/backend/local_database_dump.json"
    } else {
        Write-Host "WARN: No local_database_dump.json — EC2 will run backfill instead" -ForegroundColor Yellow
    }

    Write-Host "[Setup] Running remote setup — about 10 to 20 min on first run (V2 model download)..." -ForegroundColor Cyan
    $vercelEnv = if ($vercelUrl) { "VERCEL_URL=$vercelUrl" } else { "" }
    ssh @sshArgs $sshTarget "sed -i 's/\r$//' ~/remote-setup.sh && chmod +x ~/remote-setup.sh && $vercelEnv /bin/bash ~/remote-setup.sh"
}

Start-Sleep -Seconds 3
$ok = Test-Backend "After setup" $apiUrl

Write-Host "`n--- Summary ---" -ForegroundColor Yellow
Write-Host "Vercel env: VITE_API_URL = $apiUrl"
Write-Host "Live frontend: $vercelUrl"
Write-Host "V2: semantic similarity enabled on EC2 (all-MiniLM-L6-v2)"
Write-Host "Redeploy Vercel: Dashboard -> Deployments -> Redeploy (or: npx vercel --prod)"
if (-not $ok) {
    Write-Host "`nIf backend failed, SSH in and check:" -ForegroundColor Yellow
    Write-Host "  .\deploy\connect.ps1"
    Write-Host "  nano ~/FYP-Relevancy-checker/backend/.env   # DB_PASSWORD, HF_TOKEN"
    Write-Host "  tail -80 ~/uvicorn.log"
    Write-Host "  cd ~/FYP-Relevancy-checker/backend && source venv/bin/activate && python -m scripts.verify_v2_predeploy"
}
