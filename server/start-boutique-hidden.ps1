# Silent 24/7 launcher for Maison 704 Boutique Server (port 5174)
# Invoked by Windows Scheduled Task "Maison704BoutiqueServer" at logon.

$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $PSScriptRoot
$serverScript = Join-Path $projectRoot 'server\boutique-server.mjs'
$dataDir = Join-Path $projectRoot 'data'
$stdoutLog = Join-Path $dataDir 'boutique-server.log'
$stderrLog = Join-Path $dataDir 'boutique-server.err.log'

if (-not (Test-Path -LiteralPath $dataDir)) {
    New-Item -ItemType Directory -Path $dataDir -Force | Out-Null
}

# Resolve Node.js binary reliably even when Task Scheduler has a minimal PATH
$nodeExe = 'C:\Program Files\nodejs\node.exe'
if (-not (Test-Path -LiteralPath $nodeExe)) {
    $nodeCmd = Get-Command node -ErrorAction SilentlyContinue
    if ($nodeCmd) {
        $nodeExe = $nodeCmd.Source
    } else {
        throw 'Node.js executable not found. Install Node.js or update $nodeExe in server/start-boutique-hidden.ps1.'
    }
}

# Avoid launching a duplicate instance if boutique-server.mjs is already running
$existing = Get-CimInstance Win32_Process -Filter "Name = 'node.exe'" -ErrorAction SilentlyContinue |
    Where-Object { $_.CommandLine -like '*boutique-server.mjs*' }

if ($existing) {
    exit 0
}

# Start server/boutique-server.mjs completely hidden with zero console window
Start-Process `
    -FilePath $nodeExe `
    -ArgumentList 'server/boutique-server.mjs' `
    -WorkingDirectory $projectRoot `
    -WindowStyle Hidden `
    -RedirectStandardOutput $stdoutLog `
    -RedirectStandardError $stderrLog
