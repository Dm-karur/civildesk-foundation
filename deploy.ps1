param(
    [switch]$TestConnection,
    [switch]$Deploy,
    [switch]$DeployFrontend,
    [switch]$DeployBackend
)

$ErrorActionPreference = "Stop"
$WorkspaceRoot = $PSScriptRoot

# Load Configuration
$ConfigFile = Join-Path $WorkspaceRoot "deploy_config.json"
if (-not (Test-Path $ConfigFile)) {
    Write-Error "deploy_config.json not found in $WorkspaceRoot"
    exit 1
}

$Config = Get-Content -Raw $ConfigFile | ConvertFrom-Json
$HostName = $Config.host
$Port = $Config.port
$User = $Config.username
$Password = $Config.password
$RemotePublicHtml = $Config.remote_path

# Create temporary askpass script
$AskPassCmd = Join-Path $WorkspaceRoot "askpass.cmd"
Set-Content -Path $AskPassCmd -Value "@echo $Password" -NoNewline
$env:SSH_ASKPASS = $AskPassCmd
$env:SSH_ASKPASS_REQUIRE = "force"

function Execute-RemoteCommand {
    param([string]$Command)
    ssh -p $Port -o StrictHostKeyChecking=no "$User@$HostName" "$Command"
}

# 1. Connection Test
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host " Testing SSH Connection to ${HostName}:${Port} as $User" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

try {
    $TestResult = Execute-RemoteCommand "echo 'SSH Connection OK'; uname -a; whoami"
    Write-Host "[SUCCESS] SSH connection established successfully!" -ForegroundColor Green
    Write-Host $TestResult
} catch {
    Write-Error "[FAILED] Could not connect via SSH: $_"
    exit 1
}

if ($TestConnection -or (-not $Deploy -and -not $DeployFrontend -and -not $DeployBackend)) {
    Write-Host ""
    Write-Host "[INFO] Safe Mode: Connection verified. Deployment was NOT executed." -ForegroundColor Yellow
    Write-Host "Remote public_html path: $RemotePublicHtml" -ForegroundColor Gray
    Write-Host "To deploy in the future, run: .\deploy.ps1 -Deploy" -ForegroundColor Gray
    exit 0
}

# 2. Deployment Execution (Only if -Deploy is explicitly passed)
if ($Deploy -or $DeployFrontend) {
    Write-Host ""
    Write-Host "=========================================" -ForegroundColor Cyan
    Write-Host " Deploying Frontend to $RemotePublicHtml" -ForegroundColor Cyan
    Write-Host "=========================================" -ForegroundColor Cyan

    $DistZip = Join-Path $WorkspaceRoot "dist.zip"
    Write-Host "Building frontend..." -ForegroundColor Cyan
    Push-Location (Join-Path $WorkspaceRoot "frontend")
    npm run build
    if (Test-Path $DistZip) { Remove-Item $DistZip -Force }
    Get-ChildItem -Path "dist" -Force | Compress-Archive -DestinationPath $DistZip -Force
    Pop-Location

    Write-Host "Uploading dist.zip via SCP..." -ForegroundColor Cyan
    scp -P $Port -o StrictHostKeyChecking=no $DistZip "$User@${HostName}:${RemotePublicHtml}/dist.zip"

    Write-Host "Extracting dist.zip on remote server..." -ForegroundColor Cyan
    Execute-RemoteCommand "cd $RemotePublicHtml && unzip -o dist.zip && rm dist.zip"

    Write-Host "[SUCCESS] Frontend deployed successfully!" -ForegroundColor Green
}

if ($Deploy -or $DeployBackend) {
    Write-Host ""
    Write-Host "=========================================" -ForegroundColor Cyan
    Write-Host " Deploying Backend changes" -ForegroundColor Cyan
    Write-Host "=========================================" -ForegroundColor Cyan

    $BackendController = Join-Path $WorkspaceRoot "backend\app\Controllers\Api\SubcontractMastersController.php"
    $BackendRoutes = Join-Path $WorkspaceRoot "backend\app\Config\Routes.php"

    Write-Host "Uploading SubcontractMastersController.php..." -ForegroundColor Cyan
    scp -P $Port -o StrictHostKeyChecking=no $BackendController "$User@${HostName}:${RemotePublicHtml}/backend/app/Controllers/Api/SubcontractMastersController.php"

    Write-Host "Uploading Routes.php..." -ForegroundColor Cyan
    scp -P $Port -o StrictHostKeyChecking=no $BackendRoutes "$User@${HostName}:${RemotePublicHtml}/backend/app/Config/Routes.php"

    Write-Host "[SUCCESS] Backend controllers and routes deployed successfully!" -ForegroundColor Green
}

Write-Host ""
Write-Host "=========================================" -ForegroundColor Green
Write-Host " Deployment Completed Successfully! " -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green
