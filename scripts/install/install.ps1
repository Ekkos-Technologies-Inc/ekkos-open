# ─────────────────────────────────────────────────────────────────────────────
#  ekkOS_ Installer — Windows PowerShell
#  https://ekkos.dev
#
#  Usage:
#    irm https://ekkos.dev/i | iex
#
#  View this script before running:
#    irm https://ekkos.dev/i
#
#  Source code:
#    https://github.com/Ekkos-Technologies-Inc/ekkos-open/blob/main/scripts/install/install.ps1
#
#  Alternative install (no pipe-to-shell):
#    npm install -g @ekkos/cli; ekkos init
# ─────────────────────────────────────────────────────────────────────────────

# Bypass execution policy for this session so npm.ps1 and other scripts can run
Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process -Force
$ErrorActionPreference = "Stop"

function Write-Banner {
  Write-Host ""
  Write-Host "  ┌──────────────────────────────────────┐" -ForegroundColor Cyan
  Write-Host "  │         ekkOS_ Installer             │" -ForegroundColor Cyan
  Write-Host "  │  The Intelligence Layer for AI Dev   │" -ForegroundColor Cyan
  Write-Host "  └──────────────────────────────────────┘" -ForegroundColor Cyan
  Write-Host ""
}

function Write-Info($msg)    { Write-Host "  → $msg" -ForegroundColor Cyan }
function Write-Ok($msg)      { Write-Host "  ✓ $msg" -ForegroundColor Green }
function Write-Warn($msg)    { Write-Host "  ! $msg" -ForegroundColor Yellow }
function Write-Fail($msg)    { Write-Host "  ✗ $msg" -ForegroundColor Red; exit 1 }


function Write-Step($num, $total, $msg) {
  $pct = [math]::Floor(($num - 1) / $total * 100)
  Write-Host ""
  Write-Host "  ┌─ Step $num/$total [$pct%] ─────────────────────────" -ForegroundColor DarkCyan
  Write-Host "  │ $msg" -ForegroundColor White
  Write-Host "  └──────────────────────────────────────────" -ForegroundColor DarkCyan
}

$totalSteps = 6

Write-Banner

# ── Step 1: Check for Node.js ──────────────────────
Write-Step 1 $totalSteps "Checking Node.js..."

$nodePath = Get-Command node -ErrorAction SilentlyContinue
if ($nodePath) {
  $nodeVersion = & node -v
  Write-Ok "Node.js $nodeVersion found"
} else {
  Write-Warn "Node.js not found — installing..."

  # Try winget first (built into Windows 10/11)
  $wingetPath = Get-Command winget -ErrorAction SilentlyContinue
  if ($wingetPath) {
    Write-Info "Installing via winget..."
    winget install OpenJS.NodeJS.LTS --accept-package-agreements --accept-source-agreements
  } else {
    # Fall back to direct download
    Write-Info "winget not available — downloading Node.js installer..."
    $installerUrl = "https://nodejs.org/dist/v22.15.0/node-v22.15.0-x64.msi"
    $installerPath = Join-Path $env:TEMP "node-installer.msi"

    [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
    Invoke-WebRequest -Uri $installerUrl -OutFile $installerPath -UseBasicParsing

    Write-Info "Running Node.js installer..."
    Start-Process msiexec.exe -ArgumentList "/i", $installerPath, "/qn", "/norestart" -Wait -NoNewWindow
    Remove-Item $installerPath -ErrorAction SilentlyContinue
  }

  # Refresh PATH so node/npm are available immediately
  $machinePath = [Environment]::GetEnvironmentVariable("Path", "Machine")
  $userPath = [Environment]::GetEnvironmentVariable("Path", "User")
  $env:Path = "$machinePath;$userPath"

  # Also check common Node.js install locations
  $commonPaths = @(
    "$env:ProgramFiles\nodejs",
    "$env:ProgramFiles(x86)\nodejs",
    "$env:APPDATA\nvm\current"
  )
  foreach ($p in $commonPaths) {
    if ((Test-Path $p) -and ($env:Path -notlike "*$p*")) {
      $env:Path = "$p;$env:Path"
    }
  }

  # Verify
  $nodePath = Get-Command node -ErrorAction SilentlyContinue
  if ($nodePath) {
    $nodeVersion = & node -v
    Write-Ok "Node.js $nodeVersion installed"
  } else {
    Write-Fail "Node.js installation failed. Install manually from https://nodejs.org and reopen PowerShell."
  }
}

# ── Step 2: Check npm ──────────────────────────────
Write-Step 2 $totalSteps "Checking npm..."

$npmPath = Get-Command npm -ErrorAction SilentlyContinue
if (-not $npmPath) {
  Write-Fail "npm not found. Reinstall Node.js from https://nodejs.org"
}
$npmVersion = "$(& npm -v 2>&1)"
Write-Ok "npm v$npmVersion found"

# ── Step 3: Kill stale ekkOS processes ─────────────
Write-Step 3 $totalSteps "Cleaning stale processes..."
$staleProcs = Get-Process node -ErrorAction SilentlyContinue |
  Where-Object { $_.CommandLine -like "*ekkos*" -or $_.CommandLine -like "*@ekkos*" }

if ($staleProcs) {
  Write-Warn "Killing $($staleProcs.Count) stale ekkOS process(es)..."
  $staleProcs | Stop-Process -Force -ErrorAction SilentlyContinue
  Start-Sleep -Seconds 1
  Write-Ok "Stale processes cleared"
} else {
  Write-Ok "No stale processes found"
}

# ── Step 4: Clean stale npm shim files ────────────
Write-Step 4 $totalSteps "Cleaning npm shim files..."

$npmPrefix = "$env:APPDATA\npm"
$staleShims = Get-ChildItem "$npmPrefix\.*ekkos*", "$npmPrefix\.*cli*" -ErrorAction SilentlyContinue

if ($staleShims) {
  Write-Info "Cleaning $($staleShims.Count) stale npm shim file(s)..."
  $staleShims | Remove-Item -Force -ErrorAction SilentlyContinue
  Write-Ok "Stale shims removed"
} else {
  Write-Ok "No stale shims found"
}

# Also remove old ekkos binaries that might be locked
$oldBins = @("ekkos", "ekkos.cmd", "ekkos.ps1", "ekkos-mcp", "ekkos-mcp.cmd", "ekkos-mcp.ps1", "ekkos-mcp-server", "ekkos-mcp-server.cmd", "ekkos-mcp-server.ps1", "ekkos-capture", "ekkos-capture.cmd", "ekkos-capture.ps1", "cli", "cli.cmd", "cli.ps1")
foreach ($bin in $oldBins) {
  $binPath = "$npmPrefix\$bin"
  if (Test-Path $binPath) {
    Remove-Item $binPath -Force -ErrorAction SilentlyContinue
  }
}

# ── Step 5: Install ekkOS CLI ──────────────────────
Write-Step 5 $totalSteps "Installing @ekkos/cli (this may take a minute)..."

# Get npm prefix for checking install success
$npmPrefix = "$env:APPDATA\npm"
$cliPackagePath = "$npmPrefix\node_modules\@ekkos\cli\dist\index.js"

# Run npm install (don't trust exit code in irm|iex context)
$prevEAP = $ErrorActionPreference
$ErrorActionPreference = 'SilentlyContinue'

# Run npm install with a simple progress indicator
$startTime = Get-Date
Write-Host ""
Write-Host "  ⏳ Installing packages (this takes 60-90 seconds)..." -ForegroundColor Cyan

# Run npm synchronously
$npmOutput = cmd /c "npm install -g @ekkos/cli@latest --force 2>&1"

# Check for errors in output
$hasError = $false
$npmOutput -split "`n" | ForEach-Object {
  if ($_ -match "npm error|npm ERR|EPERM|EACCES|EBUSY") {
    Write-Host "  $_" -ForegroundColor Red
    $hasError = $true
  }
}

$totalTime = [math]::Round(((Get-Date) - $startTime).TotalSeconds, 1)
if (-not $hasError) {
  Write-Host "  ✓ npm install completed ($totalTime s)" -ForegroundColor Green
}

$ErrorActionPreference = $prevEAP

# Check if package actually installed (ignore exit code)
if (-not (Test-Path $cliPackagePath)) {
  Write-Warn "Package not found — cleaning cache and retrying..."

  $ErrorActionPreference = 'SilentlyContinue'
  Write-Host "  Cleaning npm cache..." -ForegroundColor DarkGray
  cmd /c "npm cache clean --force 2>&1" | Out-Null

  Write-Host "  Retrying install..." -ForegroundColor DarkGray
  cmd /c "npm install -g @ekkos/cli@latest --force 2>&1" | ForEach-Object {
    $txt = [string]$_
    if ($txt.Trim() -and ($txt -match "npm error|npm ERR|EPERM|EACCES|EBUSY")) {
      Write-Host "  $txt" -ForegroundColor Red
    }
  }
  $ErrorActionPreference = $prevEAP

  if (-not (Test-Path $cliPackagePath)) {
    Write-Host ""
    Write-Host "  ┌─────────────────────────────────────────────────┐" -ForegroundColor Red
    Write-Host "  │  Installation failed. Try these steps:          │" -ForegroundColor Red
    Write-Host "  └─────────────────────────────────────────────────┘" -ForegroundColor Red
    Write-Host ""
    Write-Host "  1. Close VS Code, Cursor, and any terminals" -ForegroundColor Yellow
    Write-Host "  2. Open PowerShell as Administrator" -ForegroundColor Yellow
    Write-Host "  3. Run: " -ForegroundColor Yellow -NoNewline
    Write-Host "npm install -g @ekkos/cli@latest" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "  Still failing? Check: https://docs.ekkos.dev/troubleshoot" -ForegroundColor DarkGray
    Write-Host ""
    exit 1
  }
}

Write-Ok "Package installed"

# ── Step 6: Verify installation ────────────────────
Write-Step 6 $totalSteps "Verifying installation..."

$npmBinDir = "$env:APPDATA\npm"
$cliEntryPoint = "$npmBinDir\node_modules\@ekkos\cli\dist\index.js"
$mcpEntryPoint = "$npmBinDir\node_modules\@ekkos\cli\dist\mcp\index.js"

if (-not (Test-Path $cliEntryPoint)) {
  Write-Fail "Package not installed. Run: npm install -g @ekkos/cli@latest"
}

Write-Ok "Package found"

# Add functions to PowerShell profile (reliable, no shim files needed)
Write-Info "Configuring PowerShell..."

$profileDir = Split-Path $PROFILE -Parent
if (-not (Test-Path $profileDir)) {
  New-Item -ItemType Directory -Path $profileDir -Force | Out-Null
}

$ekkosBlock = @'

# === ekkOS CLI ===
function global:ekkos { & node "CLIPATH" @args }
function global:ekkos-mcp { & node "MCPPATH" @args }
# =================

'@.Replace("CLIPATH", $cliEntryPoint).Replace("MCPPATH", $mcpEntryPoint)

if (Test-Path $PROFILE) {
  $content = Get-Content $PROFILE -Raw -ErrorAction SilentlyContinue
  if ($content -and $content.Contains("ekkOS CLI")) {
    # Update existing block
    $content = $content -replace '(?s)# === ekkOS CLI ===.*?# =================', $ekkosBlock.Trim()
    Set-Content -Path $PROFILE -Value $content -NoNewline
    Write-Host "    ✓ Updated profile" -ForegroundColor Green
  } else {
    Add-Content -Path $PROFILE -Value $ekkosBlock
    Write-Host "    ✓ Added to profile" -ForegroundColor Green
  }
} else {
  Set-Content -Path $PROFILE -Value $ekkosBlock
  Write-Host "    ✓ Created profile" -ForegroundColor Green
}

# Make available NOW (no restart needed)
Invoke-Expression "function global:ekkos { & node '$cliEntryPoint' @args }"
Invoke-Expression "function global:ekkos-mcp { & node '$mcpEntryPoint' @args }"

# Also create .cmd files for cmd.exe / Windows Terminal compatibility
Write-Info "Creating cmd.exe wrappers (for Windows Terminal)..."

$ekkosBinDir = Join-Path $env:USERPROFILE ".ekkos\bin"
if (-not (Test-Path $ekkosBinDir)) {
  New-Item -ItemType Directory -Path $ekkosBinDir -Force | Out-Null
}

# ekkos.cmd - wrapper that calls node directly (works in cmd.exe)
$cmdContent = "@echo off" + [Environment]::NewLine + "node `"$cliEntryPoint`" %*"
Set-Content -Path (Join-Path $ekkosBinDir "ekkos.cmd") -Value $cmdContent -Force
Write-Host "    ✓ Created ekkos.cmd" -ForegroundColor Green

# ekkos-mcp.cmd
$mcpCmdContent = "@echo off" + [Environment]::NewLine + "node `"$mcpEntryPoint`" %*"
Set-Content -Path (Join-Path $ekkosBinDir "ekkos-mcp.cmd") -Value $mcpCmdContent -Force
Write-Host "    ✓ Created ekkos-mcp.cmd" -ForegroundColor Green

# Add to PATH if not already there
$userPath = [Environment]::GetEnvironmentVariable("Path", "User")
if ($userPath -notlike "*$ekkosBinDir*") {
  [Environment]::SetEnvironmentVariable("Path", "$ekkosBinDir;$userPath", "User")
  $env:Path = "$ekkosBinDir;$env:Path"
  Write-Host "    ✓ Added to PATH" -ForegroundColor Green
} else {
  Write-Host "    ✓ Already in PATH" -ForegroundColor Green
}

$ver = & node "$cliEntryPoint" --version 2>$null
if ($ver) { Write-Ok "ekkOS CLI $ver ready" } else { Write-Ok "ekkOS CLI ready" }

# ── Done ───────────────────────────────────────────

Write-Host ""
Write-Host "  ┌──────────────────────────────────────┐" -ForegroundColor Green
Write-Host "  │  ████████████████████████████ 100%   │" -ForegroundColor Green
Write-Host "  │       Installation complete!         │" -ForegroundColor Green
Write-Host "  └──────────────────────────────────────┘" -ForegroundColor Green
Write-Host ""

# Auto-run ekkos init
Write-Host "  → Running ekkos init..." -ForegroundColor Cyan
Write-Host ""

& node "$cliEntryPoint" init

Write-Host ""
Write-Host "  ┌──────────────────────────────────────────────┐" -ForegroundColor Green
Write-Host "  │           ✓ Installation complete!           │" -ForegroundColor Green
Write-Host "  └──────────────────────────────────────────────┘" -ForegroundColor Green
Write-Host ""
Write-Host "  ekkos command is ready! Just type:" -ForegroundColor White
Write-Host ""
Write-Host "    ekkos" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Docs:  https://docs.ekkos.dev" -ForegroundColor DarkGray
Write-Host "  Help:  ekkos --help" -ForegroundColor DarkGray
Write-Host ""
