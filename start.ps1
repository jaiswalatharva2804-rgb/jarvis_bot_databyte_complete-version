# Jarvis Jr - Complete System Startup Script for Windows
Write-Host "🤖 Starting Jarvis Jr Complete System..." -ForegroundColor Cyan
Write-Host ""

# Check if backend dependencies are installed
Write-Host "Checking backend dependencies..." -ForegroundColor Yellow
try {
    python -c "import fastapi" 2>$null
} catch {
    Write-Host "Installing backend dependencies..." -ForegroundColor Yellow
    Set-Location backend
    pip install -r requirements.txt
    Set-Location ..
}

# Check if frontend dependencies are installed
if (-Not (Test-Path "frontend\node_modules")) {
    Write-Host "Installing frontend dependencies..." -ForegroundColor Yellow
    Set-Location frontend
    npm install
    Set-Location ..
}

# Check Ollama
Write-Host "Checking Ollama..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:11434/api/tags" -TimeoutSec 2 -ErrorAction SilentlyContinue
} catch {
    Write-Host "⚠️  WARNING: Ollama is not running or not installed" -ForegroundColor Red
    Write-Host "   Please install Ollama from https://ollama.ai" -ForegroundColor Red
    Write-Host "   Then run: ollama pull qwen2.5-coder:7b" -ForegroundColor Red
    Write-Host ""
}

# Check Docker
Write-Host "Checking Docker..." -ForegroundColor Yellow
try {
    docker ps 2>$null | Out-Null
} catch {
    Write-Host "⚠️  WARNING: Docker is not running or not installed" -ForegroundColor Red
    Write-Host "   Please install Docker Desktop from https://docs.docker.com/get-docker/" -ForegroundColor Red
    Write-Host "   Make sure Docker Desktop is running" -ForegroundColor Red
    Write-Host ""
}

# Start backend server
Write-Host "Starting backend server..." -ForegroundColor Green
$backendJob = Start-Job -ScriptBlock {
    Set-Location $using:PWD
    Set-Location backend
    python api_server.py
}

Write-Host "Waiting for backend to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

# Start frontend development server
Write-Host "Starting frontend development server..." -ForegroundColor Green
$frontendJob = Start-Job -ScriptBlock {
    Set-Location $using:PWD
    Set-Location frontend
    npm run dev
}

Write-Host ""
Write-Host "✅ Jarvis Jr is running!" -ForegroundColor Green
Write-Host ""
Write-Host "📍 Backend API: http://localhost:8000" -ForegroundColor Cyan
Write-Host "📍 Frontend UI: http://localhost:5173" -ForegroundColor Cyan
Write-Host ""
Write-Host "📋 Backend Job ID: $($backendJob.Id)" -ForegroundColor Gray
Write-Host "📋 Frontend Job ID: $($frontendJob.Id)" -ForegroundColor Gray
Write-Host ""
Write-Host "Press Ctrl+C to stop, then run:" -ForegroundColor Yellow
Write-Host "Stop-Job $($backendJob.Id), $($frontendJob.Id); Remove-Job $($backendJob.Id), $($frontendJob.Id)" -ForegroundColor Gray
Write-Host ""
Write-Host "Viewing logs (Ctrl+C to exit log view)..." -ForegroundColor Yellow
Write-Host ""

# Monitor both jobs and display output
try {
    while ($true) {
        $backendOutput = Receive-Job -Job $backendJob
        $frontendOutput = Receive-Job -Job $frontendJob
        
        if ($backendOutput) {
            Write-Host "[Backend] " -ForegroundColor Blue -NoNewline
            Write-Host $backendOutput
        }
        
        if ($frontendOutput) {
            Write-Host "[Frontend] " -ForegroundColor Magenta -NoNewline
            Write-Host $frontendOutput
        }
        
        # Check if jobs are still running
        if (($backendJob.State -eq "Completed" -or $backendJob.State -eq "Failed") -and 
            ($frontendJob.State -eq "Completed" -or $frontendJob.State -eq "Failed")) {
            Write-Host "Both jobs have stopped." -ForegroundColor Red
            break
        }
        
        Start-Sleep -Milliseconds 500
    }
} finally {
    Write-Host ""
    Write-Host "Stopping servers..." -ForegroundColor Yellow
    Stop-Job $backendJob, $frontendJob
    Remove-Job $backendJob, $frontendJob
    Write-Host "All servers stopped." -ForegroundColor Green
}
