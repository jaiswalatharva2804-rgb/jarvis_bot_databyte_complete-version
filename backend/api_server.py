"""
FastAPI server for Jarvis Jr
Provides REST API and WebSocket support for the frontend
"""
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Dict, Any
import asyncio
import json
from datetime import datetime

from jarvis.llm_handler import LLMHandler
from jarvis.context import ConversationContext
from jarvis.executor import CommandExecutor
from jarvis.command_analyzer import SafetyLevel, CommandAnalyzer
from jarvis.config import config

app = FastAPI(title="Jarvis Jr API", version="1.0.0")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Store active sessions
sessions: Dict[str, Dict[str, Any]] = {}


class CommandRequest(BaseModel):
    text: str
    session_id: Optional[str] = "default"


class CommandResponse(BaseModel):
    success: bool
    response: str
    is_command: bool
    command: Optional[str] = None
    safety_level: Optional[str] = None
    output: Optional[str] = None
    error: Optional[str] = None


class StatusResponse(BaseModel):
    status: str
    ollama_available: bool
    docker_available: bool
    model: str


def get_or_create_session(session_id: str) -> Dict[str, Any]:
    """Get or create a session with LLM handler, context, and executor"""
    if session_id not in sessions:
        context = ConversationContext()
        sessions[session_id] = {
            "llm": LLMHandler(warmup=False),
            "context": context,
            "executor": CommandExecutor(context),
            "analyzer": CommandAnalyzer(),
            "created_at": datetime.now()
        }
    return sessions[session_id]


@app.get("/")
async def root():
    """Root endpoint"""
    return {"message": "Jarvis Jr API Server", "version": "1.0.0"}


@app.get("/status", response_model=StatusResponse)
async def get_status():
    """Check system status"""
    import requests
    import docker
    
    # Check Ollama
    ollama_ok = False
    try:
        res = requests.get(f"{config.ollama_host}/api/tags", timeout=2)
        models = res.json().get("models", [])
        ollama_ok = any(m["name"] == config.ollama_model for m in models)
    except Exception:
        pass
    
    # Check Docker
    docker_ok = False
    try:
        client = docker.from_env()
        client.ping()
        docker_ok = True
    except Exception:
        pass
    
    return StatusResponse(
        status="ready" if (ollama_ok and docker_ok) else "degraded",
        ollama_available=ollama_ok,
        docker_available=docker_ok,
        model=config.ollama_model
    )


@app.post("/command", response_model=CommandResponse)
async def execute_command(request: CommandRequest):
    """Execute a natural language command"""
    try:
        session = get_or_create_session(request.session_id)
        llm = session["llm"]
        context = session["context"]
        executor = session["executor"]
        analyzer = session["analyzer"]
        
        # Add user message to context
        context.add_user_message(request.text)
        
        # Get recent context for LLM
        recent_context = context.get_recent_context()
        
        # Generate command from natural language
        response, is_command = llm.generate_command(request.text, recent_context)
        
        # Add assistant message to context
        context.add_assistant_message(response)
        llm.add_to_context(request.text, response)
        
        if not is_command:
            # It's a question or clarification
            return CommandResponse(
                success=True,
                response=response,
                is_command=False
            )
        
        # Extract the actual command
        command = llm._extract_command(response)
        
        if not command:
            return CommandResponse(
                success=True,
                response=response,
                is_command=False
            )
        
        # Analyze safety
        safety, reason = analyzer.analyze(command)
        uses_docker = analyzer.should_use_docker(safety)
        
        # Execute the command
        exit_code, stdout, stderr, safety_level = executor.execute(command, auto_confirm=True)
        
        output = stdout if stdout else stderr if stderr else "Command executed with no output"
        
        return CommandResponse(
            success=exit_code == 0,
            response=response,
            is_command=True,
            command=command,
            safety_level=safety.value,
            output=output,
            error=stderr if stderr else None
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.websocket("/ws/{session_id}")
async def websocket_endpoint(websocket: WebSocket, session_id: str):
    """WebSocket endpoint for real-time streaming"""
    await websocket.accept()
    
    session = get_or_create_session(session_id)
    llm = session["llm"]
    context = session["context"]
    executor = session["executor"]
    analyzer = session["analyzer"]
    
    try:
        while True:
            # Receive message from client
            data = await websocket.receive_text()
            message = json.loads(data)
            
            user_input = message.get("text", "")
            if not user_input:
                continue
            
            # Add to context
            context.add_user_message(user_input)
            recent_context = context.get_recent_context()
            
            # Send thinking status
            await websocket.send_json({
                "type": "status",
                "status": "thinking"
            })
            
            # Generate command
            try:
                response, is_command = llm.generate_command(user_input, recent_context)
                context.add_assistant_message(response)
                llm.add_to_context(user_input, response)
                
                # Send response
                await websocket.send_json({
                    "type": "response",
                    "text": response,
                    "is_command": is_command
                })
                
                if is_command:
                    command = llm._extract_command(response)
                    
                    if command:
                        # Analyze safety
                        safety, reason = analyzer.analyze(command)
                        
                        await websocket.send_json({
                            "type": "command",
                            "command": command,
                            "safety": safety.value,
                            "reason": reason
                        })
                        
                        # Send executing status
                        await websocket.send_json({
                            "type": "status",
                            "status": "executing"
                        })
                        
                        # Execute command
                        exit_code, stdout, stderr, safety_level = executor.execute(
                            command, auto_confirm=True
                        )
                        
                        # Send output
                        output = stdout if stdout else stderr if stderr else "Command executed with no output"
                        await websocket.send_json({
                            "type": "output",
                            "exit_code": exit_code,
                            "stdout": stdout,
                            "stderr": stderr,
                            "output": output,
                            "success": exit_code == 0
                        })
                
                # Send idle status
                await websocket.send_json({
                    "type": "status",
                    "status": "idle"
                })
                
            except Exception as e:
                await websocket.send_json({
                    "type": "error",
                    "error": str(e)
                })
                await websocket.send_json({
                    "type": "status",
                    "status": "idle"
                })
                
    except WebSocketDisconnect:
        print(f"WebSocket disconnected: {session_id}")
    except Exception as e:
        print(f"WebSocket error: {e}")
        await websocket.close()


@app.delete("/session/{session_id}")
async def delete_session(session_id: str):
    """Delete a session and cleanup resources"""
    if session_id in sessions:
        session = sessions[session_id]
        session["executor"].cleanup()
        del sessions[session_id]
        return {"message": f"Session {session_id} deleted"}
    return {"message": "Session not found"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
