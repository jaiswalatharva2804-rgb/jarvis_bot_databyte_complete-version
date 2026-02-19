# Setup Verification Script for Windows
Write-Host "🔍 Jarvis Jr - Setup Verification" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""

$allGood = $true

# Check Python
Write-Host "Checking Python..." -NoNewline
try {
    $pythonVersion = python --version 2>&1
    if ($pythonVersion -match "Python 3\.([8-9]|[1-9][0-9])") {
        Write-Host " ✅ $pythonVersion" -ForegroundColor Green
    } else {
        Write-Host " ❌ Python 3.8+ required, found: $pythonVersion" -ForegroundColor Red
        $allGood = $false
    }
} catch {
    Write-Host " ❌ Python not found" -ForegroundColor Red
    Write-Host "   Install from: https://www.python.org/downloads/" -ForegroundColor Yellow
    $allGood = $false
}

# Check Node.js
Write-Host "Checking Node.js..." -NoNewline
try {
    $nodeVersion = node --version 2>&1
    if ($nodeVersion -match "v([1-9][6-9]|[2-9][0-9])") {
        Write-Host " ✅ $nodeVersion" -ForegroundColor Green
    } else {
        Write-Host " ❌ Node.js 16+ required, found: $nodeVersion" -ForegroundColor Red
        $allGood = $false
    }
} catch {
    Write-Host " ❌ Node.js not found" -ForegroundColor Red
    Write-Host "   Install from: https://nodejs.org/" -ForegroundColor Yellow
    $allGood = $false
}

# Check npm
Write-Host "Checking npm..." -NoNewline
try {
    $npmVersion = npm --version 2>&1
    Write-Host " ✅ v$npmVersion" -ForegroundColor Green
} catch {
    Write-Host " ❌ npm not found" -ForegroundColor Red
    $allGood = $false
}

# Check Docker
Write-Host "Checking Docker..." -NoNewline
try {
    docker ps 2>$null | Out-Null
    $dockerVersion = docker --version 2>&1
    Write-Host " ✅ $dockerVersion (running)" -ForegroundColor Green
} catch {
    Write-Host " ❌ Docker not running or not installed" -ForegroundColor Red
    Write-Host "   Install from: https://docs.docker.com/get-docker/" -ForegroundColor Yellow
    Write-Host "   Make sure Docker Desktop is running" -ForegroundColor Yellow
    $allGood = $false
}

# Check Ollama
Write-Host "Checking Ollama..." -NoNewline
try {
    $response = Invoke-WebRequest -Uri "http://localhost:11434/api/tags" -TimeoutSec 2 -ErrorAction Stop
    $data = $response.Content | ConvertFrom-Json
    $hasModel = $data.models | Where-Object { $_.name -eq "qwen2.5-coder:7b" }
    
    if ($hasModel) {
        Write-Host " ✅ Running with qwen2.5-coder:7b" -ForegroundColor Green
    } else {
        Write-Host " ⚠️  Running but model not found" -ForegroundColor Yellow
        Write-Host "   Run: ollama pull qwen2.5-coder:7b" -ForegroundColor Yellow
        $allGood = $false
    }
} catch {
    Write-Host " ❌ Ollama not running or not installed" -ForegroundColor Red
    Write-Host "   Install from: https://ollama.ai" -ForegroundColor Yellow
    Write-Host "   Then run: ollama pull qwen2.5-coder:7b" -ForegroundColor Yellow
    $allGood = $false
}

Write-Host ""
Write-Host "Checking Project Structure..." -ForegroundColor Cyan

# Check backend
Write-Host "Backend folder..." -NoNewline
if (Test-Path "backend/api_server.py") {
    Write-Host " ✅" -ForegroundColor Green
} else {
    Write-Host " ❌ backend/api_server.py not found" -ForegroundColor Red
    $allGood = $false
}

# Check frontend
Write-Host "Frontend folder..." -NoNewline
if (Test-Path "frontend/package.json") {
    Write-Host " ✅" -ForegroundColor Green
} else {
    Write-Host " ❌ frontend/package.json not found" -ForegroundColor Red
    $allGood = $false
}

# Check backend dependencies
Write-Host "Backend dependencies..." -NoNewline
try {
    Set-Location backend
    python -c "import fastapi, uvicorn, ollama, docker" 2>$null
    Set-Location ..
    Write-Host " ✅ Installed" -ForegroundColor Green
} catch {
    Set-Location ..
    Write-Host " ⚠️  Not installed" -ForegroundColor Yellow
    Write-Host "   Run: cd backend && pip install -r requirements.txt" -ForegroundColor Yellow
}

# Check frontend dependencies
Write-Host "Frontend dependencies..." -NoNewline
if (Test-Path "frontend/node_modules") {
    Write-Host " ✅ Installed" -ForegroundColor Green
} else {
    Write-Host " ⚠️  Not installed" -ForegroundColor Yellow
    Write-Host "   Run: cd frontend && npm install" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=================================" -ForegroundColor Cyan

if ($allGood) {
    Write-Host "✅ All prerequisites met!" -ForegroundColor Green
    Write-Host ""
    Write-Host "You can now start Jarvis Jr:" -ForegroundColor Cyan
    Write-Host "  .\start.ps1" -ForegroundColor White
    Write-Host ""
    Write-Host "Or manually:" -ForegroundColor Cyan
    Write-Host "  Terminal 1: cd backend && python api_server.py" -ForegroundColor White
    Write-Host "  Terminal 2: cd frontend && npm run dev" -ForegroundColor White
} else {
    Write-Host "❌ Some prerequisites are missing" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please install the missing components and run this script again." -ForegroundColor Yellow
    Write-Host "See QUICKSTART.md for detailed setup instructions." -ForegroundColor Yellow
}

Write-Host ""
