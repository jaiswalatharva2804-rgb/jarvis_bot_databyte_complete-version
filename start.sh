#!/bin/bash

echo "🤖 Starting Jarvis Jr Complete System..."
echo ""

# Check if backend dependencies are installed
if ! python -c "import fastapi" 2>/dev/null; then
    echo "Installing backend dependencies..."
    cd backend
    pip install -r requirements.txt
    cd ..
fi

# Check if frontend dependencies are installed
if [ ! -d "frontend/node_modules" ]; then
    echo "Installing frontend dependencies..."
    cd frontend
    npm install
    cd ..
fi

# Check Ollama
echo "Checking Ollama..."
if ! curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
    echo "⚠️  WARNING: Ollama is not running or not installed"
    echo "   Please install Ollama from https://ollama.ai"
    echo "   Then run: ollama pull qwen2.5-coder:7b"
    echo ""
fi

# Check Docker
echo "Checking Docker..."
if ! docker ps > /dev/null 2>&1; then
    echo "⚠️  WARNING: Docker is not running or not installed"
    echo "   Please install Docker from https://docs.docker.com/get-docker/"
    echo ""
fi

echo "Starting backend server..."
cd backend
python api_server.py &
BACKEND_PID=$!
cd ..

echo "Waiting for backend to start..."
sleep 3

echo "Starting frontend development server..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "✅ Jarvis Jr is running!"
echo ""
echo "📍 Backend API: http://localhost:8000"
echo "📍 Frontend UI: http://localhost:5173"
echo ""
echo "Press Ctrl+C to stop all servers..."

# Wait for Ctrl+C
trap "kill $BACKEND_PID $FRONTEND_PID; exit" INT
wait
