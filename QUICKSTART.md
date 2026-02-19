# 🚀 Quick Start Guide - Jarvis Jr

## ⚡ Fast Setup (5 minutes)

### Step 1: Install Prerequisites

**Install these before starting:**

1. **Python 3.8+** - [Download here](https://www.python.org/downloads/)
2. **Node.js 16+** - [Download here](https://nodejs.org/)
3. **Docker Desktop** - [Download here](https://docs.docker.com/get-docker/)
4. **Ollama** - [Download here](https://ollama.ai)

### Step 2: Setup Ollama

Open a terminal and run:
```bash
ollama pull qwen2.5-coder:7b
```

This downloads the AI model (about 4.5GB). Wait for it to complete.

### Step 3: Start Docker

- **Windows**: Open Docker Desktop and wait for it to start
- **Linux/Mac**: Ensure Docker daemon is running

### Step 4: Run the Application

**Windows PowerShell:**
```powershell
.\start.ps1
```

**Linux/Mac:**
```bash
chmod +x start.sh
./start.sh
```

The script will:
- ✅ Install all dependencies automatically
- ✅ Start the backend server (port 8000)
- ✅ Start the frontend (port 5173)

### Step 5: Open the Interface

Open your browser to: **http://localhost:5173**

You should see the Jarvis interface with a glowing orb!

## 🎯 Try These Commands

Type these in the command input:

```
list all files in current directory
```

```
create a folder called test
```

```
show me all python files
```

```
find files larger than 10MB
```

## 🎤 Voice Commands

1. Click the **microphone button** (bottom left of input bar)
2. Say your command: "list all python files"
3. Click **RUN** or wait for auto-execution

**Continuous Voice Mode:**
- Click **"Voice OFF"** button to enable continuous listening
- It will automatically listen and execute commands
- Say **"stop listening"** or **"jarvis stop"** to pause

## ❓ Troubleshooting

### "Cannot connect to backend"
**Fix:** Make sure the backend started successfully. Open http://localhost:8000/status in your browser. You should see:
```json
{
  "status": "ready",
  "ollama_available": true,
  "docker_available": true,
  "model": "qwen2.5-coder:7b"
}
```

### "Ollama not available"
**Fix:** 
1. Check Ollama is running: `ollama list`
2. Pull the model: `ollama pull qwen2.5-coder:7b`
3. Restart the application

### "Docker not available"
**Fix:**
1. **Windows**: Open Docker Desktop
2. **Linux**: `sudo systemctl start docker`
3. **Mac**: Open Docker Desktop
4. Verify: `docker ps`

### Voice recognition doesn't work
**Fix:**
- Use Chrome or Edge browser (Firefox/Safari don't support it)
- Allow microphone permissions when prompted
- Voice only works on localhost or HTTPS

## 🛠️ Manual Start (Alternative)

If the startup script doesn't work:

**Terminal 1 - Backend:**
```bash
cd backend
pip install -r requirements.txt
python api_server.py
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm install
npm run dev
```

## 📚 Next Steps

- Read the full [README.md](README.md) for detailed documentation
- Explore safety features (safe, moderate, dangerous commands)
- Try complex commands with multiple steps
- Check out the WebSocket API for real-time integration

## 🎨 UI Features

- **Orb States:**
  - 🔵 Idle (blue pulse)
  - 🟡 Thinking (yellow spin)
  - 🟢 Speaking (green with audio visualization)

- **Command Palette (top right):** Shows all command history and outputs

- **Status Indicators:** HUD shows system status in corners

- **Voice Controls:** Microphone button and continuous mode toggle

## 💡 Tips

1. **Be specific**: Instead of "show files", say "list all files in current directory"
2. **Specify paths**: "find python files in /home/user/projects"
3. **Safety first**: Dangerous commands (like rm -rf) require confirmation
4. **Use voice naturally**: Say commands as you would to a person
5. **Check outputs**: Review command output in the terminal panel

## 🆘 Get Help

If you're stuck:
1. Check [README.md](README.md) for full documentation
2. Verify all prerequisites are installed
3. Check backend status at http://localhost:8000/status
4. Look for errors in terminal where servers are running

---

**Enjoy using Jarvis Jr! 🤖**
