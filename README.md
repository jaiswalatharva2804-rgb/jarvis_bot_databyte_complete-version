# Jarvis Jr - Complete Integration

This project integrates a Python backend (Jarvis Jr CLI) with a React frontend for a complete natural language command line interface experience.

## Project Structure

```
jarvis jr complete version/
├── backend/              # Python backend with FastAPI
│   ├── jarvis/          # Core Jarvis modules
│   ├── api_server.py    # FastAPI server
│   └── requirements.txt # Python dependencies
└── frontend/            # React frontend with Vite
    ├── src/             # React components
    ├── .env             # Environment configuration
    └── package.json     # Node dependencies
```

## Prerequisites

### Backend Requirements
1. **Python 3.8+**
2. **Docker** - For sandboxing dangerous commands
   - Download: https://docs.docker.com/get-docker/
   - On Windows: Install Docker Desktop and ensure it's running
3. **Ollama** - Local LLM server
   - Download: https://ollama.ai
   - Install and pull model: `ollama pull qwen2.5-coder:7b`

### Frontend Requirements
1. **Node.js 16+** and npm
   - Download: https://nodejs.org/

## Installation

### 1. Install Backend Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Install Frontend Dependencies

```bash
cd frontend
npm install
```

### 3. Configure Ollama

```bash
# Install Ollama (visit https://ollama.ai for OS-specific instructions)

# Pull the required model
ollama pull qwen2.5-coder:7b
```

### 4. Start Docker

Make sure Docker Desktop is running (on Windows) or Docker daemon is active (on Linux).

## Running the Application

### Option 1: Run Backend and Frontend Separately

**Terminal 1 - Start Backend Server:**
```bash
cd backend
python api_server.py
```
The backend will start on http://localhost:8000

**Terminal 2 - Start Frontend:**
```bash
cd frontend
npm run dev
```
The frontend will start on http://localhost:5173

### Option 2: Use the Startup Script

**Windows (PowerShell):**
```powershell
.\start.ps1
```

**Linux/Mac:**
```bash
chmod +x start.sh
./start.sh
```

## Usage

1. Open your browser to http://localhost:5173
2. You'll see the Jarvis interface with:
   - Animated orb in the center
   - Terminal command palette in the top right
   - Command input bar at the bottom

3. Type natural language commands:
   - "list all python files in current directory"
   - "create a backup of config.json"
   - "find all files larger than 100MB"
   - "delete all .tmp files"

4. Voice commands:
   - Click the microphone button to enable voice input
   - Say your command naturally
   - Toggle "Voice OFF" to "🎤 ACTIVE" for continuous listening

## Features

### Backend Features
- ✅ Natural language to bash command translation
- ✅ Local LLM via Ollama (100% offline)
- ✅ Docker sandbox for dangerous commands
- ✅ Three-tier safety classification (safe, moderate, dangerous)
- ✅ RESTful API and WebSocket support
- ✅ Session management and conversation context

### Frontend Features
- ✅ Beautiful animated UI with glowing orb
- ✅ Real-time command execution
- ✅ Voice input with continuous mode
- ✅ Text-to-speech responses
- ✅ Streaming command output
- ✅ System status monitoring

## API Endpoints

### REST API

- `GET /` - API information
- `GET /status` - Check system status (Ollama, Docker availability)
- `POST /command` - Execute a command
  ```json
  {
    "text": "list python files",
    "session_id": "optional-session-id"
  }
  ```
- `DELETE /session/{session_id}` - Delete session and cleanup

### WebSocket

- `ws://localhost:8000/ws/{session_id}` - Real-time command execution
  - Send: `{"text": "your command"}`
  - Receive: Status updates, responses, command outputs

## Safety Features

Commands are analyzed and classified:

- **🟢 Safe**: Run directly (ls, cat, grep, pwd, etc.)
- **🟡 Moderate**: Run in Docker with warning (mkdir, touch, wget, etc.)
- **🔴 Dangerous**: Require confirmation + Docker isolation (rm -rf, dd, etc.)

## Configuration

### Backend Configuration

Edit `backend/jarvis/config.py`:
```python
ollama_host = "http://localhost:11434"
ollama_model = "qwen2.5-coder:7b"
```

### Frontend Configuration

Edit `frontend/.env`:
```
VITE_API_URL=http://localhost:8000
```

## Troubleshooting

### Backend Issues

**"Ollama not available"**
- Ensure Ollama is installed and running
- Check model is downloaded: `ollama list`
- Pull if needed: `ollama pull qwen2.5-coder:7b`

**"Docker not available"**
- Ensure Docker Desktop is running (Windows)
- Check Docker daemon: `docker ps`
- Safe commands will still work without Docker

### Frontend Issues

**"Cannot connect to backend"**
- Ensure backend server is running on port 8000
- Check `frontend/.env` has correct API URL
- Check CORS settings in `backend/api_server.py`

**Voice recognition not working**
- Voice features require Chrome or Edge browser
- Allow microphone permissions when prompted
- Voice API only works on HTTPS or localhost

## Development

### Backend Development

Run in development mode with auto-reload:
```bash
cd backend
uvicorn api_server:app --reload --host 0.0.0.0 --port 8000
```

### Frontend Development

The Vite dev server has hot module replacement:
```bash
cd frontend
npm run dev
```

### Build for Production

**Frontend:**
```bash
cd frontend
npm run build
```
Output will be in `frontend/dist/`

## Architecture

```
┌─────────────────┐         HTTP/WS          ┌──────────────────┐
│                 │ ◄────────────────────────►│                  │
│  React Frontend │                           │  FastAPI Backend │
│                 │   Commands & Responses    │                  │
└─────────────────┘                           └──────────────────┘
                                                       │
                                    ┌──────────────────┼──────────────────┐
                                    │                  │                  │
                              ┌─────▼──────┐    ┌─────▼──────┐    ┌─────▼──────┐
                              │   Ollama   │    │   Docker   │    │   Shell    │
                              │    LLM     │    │  Sandbox   │    │  Executor  │
                              └────────────┘    └────────────┘    └────────────┘
```

## License

See individual component licenses.

## Credits

- Backend: Jarvis Jr by sai-rakesh-k
- Frontend: Jarvis Bot Databyte UI by jaiswalatharva2804-rgb
- Integration: Combined system
