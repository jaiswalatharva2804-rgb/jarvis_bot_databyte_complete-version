#!/bin/bash

echo "🔍 Jarvis Jr - Setup Verification"
echo "================================="
echo ""

all_good=true

# Check Python
echo -n "Checking Python..."
if command -v python3 &> /dev/null; then
    python_version=$(python3 --version 2>&1)
    if [[ $python_version =~ Python\ 3\.([8-9]|[1-9][0-9]) ]]; then
        echo " ✅ $python_version"
    else
        echo " ❌ Python 3.8+ required, found: $python_version"
        all_good=false
    fi
elif command -v python &> /dev/null; then
    python_version=$(python --version 2>&1)
    if [[ $python_version =~ Python\ 3\.([8-9]|[1-9][0-9]) ]]; then
        echo " ✅ $python_version"
    else
        echo " ❌ Python 3.8+ required, found: $python_version"
        all_good=false
    fi
else
    echo " ❌ Python not found"
    echo "   Install from: https://www.python.org/downloads/"
    all_good=false
fi

# Check Node.js
echo -n "Checking Node.js..."
if command -v node &> /dev/null; then
    node_version=$(node --version 2>&1)
    if [[ $node_version =~ v([1-9][6-9]|[2-9][0-9]) ]]; then
        echo " ✅ $node_version"
    else
        echo " ❌ Node.js 16+ required, found: $node_version"
        all_good=false
    fi
else
    echo " ❌ Node.js not found"
    echo "   Install from: https://nodejs.org/"
    all_good=false
fi

# Check npm
echo -n "Checking npm..."
if command -v npm &> /dev/null; then
    npm_version=$(npm --version 2>&1)
    echo " ✅ v$npm_version"
else
    echo " ❌ npm not found"
    all_good=false
fi

# Check Docker
echo -n "Checking Docker..."
if docker ps &> /dev/null; then
    docker_version=$(docker --version 2>&1)
    echo " ✅ $docker_version (running)"
else
    echo " ❌ Docker not running or not installed"
    echo "   Install from: https://docs.docker.com/get-docker/"
    all_good=false
fi

# Check Ollama
echo -n "Checking Ollama..."
if curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
    models=$(curl -s http://localhost:11434/api/tags)
    if echo "$models" | grep -q "qwen2.5-coder:7b"; then
        echo " ✅ Running with qwen2.5-coder:7b"
    else
        echo " ⚠️  Running but model not found"
        echo "   Run: ollama pull qwen2.5-coder:7b"
        all_good=false
    fi
else
    echo " ❌ Ollama not running or not installed"
    echo "   Install from: https://ollama.ai"
    echo "   Then run: ollama pull qwen2.5-coder:7b"
    all_good=false
fi

echo ""
echo "Checking Project Structure..."

# Check backend
echo -n "Backend folder..."
if [ -f "backend/api_server.py" ]; then
    echo " ✅"
else
    echo " ❌ backend/api_server.py not found"
    all_good=false
fi

# Check frontend
echo -n "Frontend folder..."
if [ -f "frontend/package.json" ]; then
    echo " ✅"
else
    echo " ❌ frontend/package.json not found"
    all_good=false
fi

# Check backend dependencies
echo -n "Backend dependencies..."
cd backend 2>/dev/null
if python3 -c "import fastapi, uvicorn, ollama, docker" 2>/dev/null || python -c "import fastapi, uvicorn, ollama, docker" 2>/dev/null; then
    echo " ✅ Installed"
else
    echo " ⚠️  Not installed"
    echo "   Run: cd backend && pip install -r requirements.txt"
fi
cd ..

# Check frontend dependencies
echo -n "Frontend dependencies..."
if [ -d "frontend/node_modules" ]; then
    echo " ✅ Installed"
else
    echo " ⚠️  Not installed"
    echo "   Run: cd frontend && npm install"
fi

echo ""
echo "================================="

if [ "$all_good" = true ]; then
    echo "✅ All prerequisites met!"
    echo ""
    echo "You can now start Jarvis Jr:"
    echo "  ./start.sh"
    echo ""
    echo "Or manually:"
    echo "  Terminal 1: cd backend && python api_server.py"
    echo "  Terminal 2: cd frontend && npm run dev"
else
    echo "❌ Some prerequisites are missing"
    echo ""
    echo "Please install the missing components and run this script again."
    echo "See QUICKSTART.md for detailed setup instructions."
fi

echo ""
