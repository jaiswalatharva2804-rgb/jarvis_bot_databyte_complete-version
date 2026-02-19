// API configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

class JarvisAPI {
  constructor(baseURL = API_BASE_URL) {
    this.baseURL = baseURL;
    this.ws = null;
    this.sessionId = this.generateSessionId();
  }

  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async checkStatus() {
    try {
      const response = await fetch(`${this.baseURL}/status`);
      return await response.json();
    } catch (error) {
      console.error('Failed to check status:', error);
      return { status: 'offline', ollama_available: false, docker_available: false };
    }
  }

  async sendCommand(text) {
    try {
      const response = await fetch(`${this.baseURL}/command`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          session_id: this.sessionId,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to send command:', error);
      throw error;
    }
  }

  connectWebSocket(callbacks) {
    const wsURL = `${this.baseURL.replace('http', 'ws')}/ws/${this.sessionId}`;
    
    this.ws = new WebSocket(wsURL);

    this.ws.onopen = () => {
      console.log('WebSocket connected');
      callbacks.onConnect?.();
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        callbacks.onMessage?.(data);
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      callbacks.onError?.(error);
    };

    this.ws.onclose = () => {
      console.log('WebSocket disconnected');
      callbacks.onDisconnect?.();
    };

    return this.ws;
  }

  sendWebSocketMessage(text) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ text }));
    }
  }

  disconnectWebSocket() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

export default JarvisAPI;
