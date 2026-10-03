param(
    [switch]$TestConnection,
    [switch]$Deploy,
    [switch]$DeployFrontend,
    [switch]$DeployBackend,
    [switch]$RunSql
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

if ($TestConnection -or (-not $Deploy -and -not $DeployFrontend -and -not $DeployBackend -and -not $RunSql)) {
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

    $frontendDests = @(
        $RemotePublicHtml
    )

    foreach ($fdest in $frontendDests) {
        Write-Host "Uploading dist.zip to $fdest..." -ForegroundColor Cyan
        scp -P $Port -o StrictHostKeyChecking=no $DistZip "$User@${HostName}:${fdest}/dist.zip"
        Write-Host "Extracting dist.zip in $fdest..." -ForegroundColor Cyan
        Execute-RemoteCommand "cd $fdest && unzip -o dist.zip && rm dist.zip"
    }

    Write-Host "[SUCCESS] Frontend deployed to $RemotePublicHtml successfully!" -ForegroundColor Green
}

if ($Deploy -or $DeployBackend) {
    Write-Host ""
    Write-Host "=========================================" -ForegroundColor Cyan
    Write-Host " Deploying Backend changes" -ForegroundColor Cyan
    Write-Host "=========================================" -ForegroundColor Cyan

    $BackendController = Join-Path $WorkspaceRoot "backend\app\Controllers\Api\SubcontractMastersController.php"
    $DailyWagesRegisterController = Join-Path $WorkspaceRoot "backend\app\Controllers\Api\DailyWagesRegisterController.php"
    $NavigationController = Join-Path $WorkspaceRoot "backend\app\Controllers\Api\NavigationController.php"
    $ClientsController = Join-Path $WorkspaceRoot "backend\app\Controllers\Api\ClientsController.php"
    $ClientModel = Join-Path $WorkspaceRoot "backend\app\Models\ClientModel.php"
    $BackendRoutes = Join-Path $WorkspaceRoot "backend\app\Config\Routes.php"
    $BackendPaths = Join-Path $WorkspaceRoot "backend\app\Config\Paths.php"

    $destinations = @(
        $RemotePublicHtml
    )

    foreach ($dest in $destinations) {
        Write-Host "Uploading controllers, models, routes, and paths to $dest..." -ForegroundColor Cyan
        scp -P $Port -o StrictHostKeyChecking=no $BackendController "$User@${HostName}:${dest}/backend/app/Controllers/Api/SubcontractMastersController.php"
        scp -P $Port -o StrictHostKeyChecking=no $DailyWagesRegisterController "$User@${HostName}:${dest}/backend/app/Controllers/Api/DailyWagesRegisterController.php"
        scp -P $Port -o StrictHostKeyChecking=no $NavigationController "$User@${HostName}:${dest}/backend/app/Controllers/Api/NavigationController.php"
        scp -P $Port -o StrictHostKeyChecking=no $ClientsController "$User@${HostName}:${dest}/backend/app/Controllers/Api/ClientsController.php"
        scp -P $Port -o StrictHostKeyChecking=no $ClientModel "$User@${HostName}:${dest}/backend/app/Models/ClientModel.php"
        scp -P $Port -o StrictHostKeyChecking=no $BackendRoutes "$User@${HostName}:${dest}/backend/app/Config/Routes.php"
        scp -P $Port -o StrictHostKeyChecking=no $BackendPaths "$User@${HostName}:${dest}/backend/app/Config/Paths.php"

        Write-Host "Ensuring writable directories exist with proper permissions..." -ForegroundColor Cyan
        Execute-RemoteCommand "cd $dest/backend && mkdir -p writable/cache writable/logs writable/session writable/uploads writable/debugbar && chmod -R 775 writable"
    }

    Write-Host "[SUCCESS] Backend controllers, routes, paths, and writable folders deployed successfully!" -ForegroundColor Green
}

if ($Deploy -or $RunSql) {
    Write-Host ""
    Write-Host "=========================================" -ForegroundColor Cyan
    Write-Host " Running Database SQL Migrations" -ForegroundColor Cyan
    Write-Host "=========================================" -ForegroundColor Cyan

    $SqlFile = Join-Path $WorkspaceRoot "sub_work_schema.sql"
    if (Test-Path $SqlFile) {
        Write-Host "Uploading sub_work_schema.sql..." -ForegroundColor Cyan
        scp -P $Port -o StrictHostKeyChecking=no $SqlFile "$User@${HostName}:sub_work_schema.sql"

        Write-Host "Executing SQL schema on remote database..." -ForegroundColor Cyan
        $DbUser = "u589483802_CDfoundation"
        $DbPass = "CDfoundation@123"
        $DbName = "u589483802_CDfoundation"
        $SqlCmd = "mysql -u $DbUser -p'$DbPass' $DbName < sub_work_schema.sql"
        $SqlResult = Execute-RemoteCommand "$SqlCmd && rm -f sub_work_schema.sql && echo 'SQL Execution Completed Successfully!'"
        Write-Host $SqlResult
        Write-Host "[SUCCESS] Sub Work SQL schema migrated successfully!" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "=========================================" -ForegroundColor Green
Write-Host " Deployment Completed Successfully! " -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green

