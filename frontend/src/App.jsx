import React, { useState, useRef, useEffect } from 'react'
import Orb from './components/Orb'
import Terminal from './components/Terminal'
import Sidebar from './components/Sidebar'
import Settings from './components/Settings'
import HUD from './components/HUD'
import logo from './assets/databyte-logo.png'
import JarvisAPI from './api/jarvisAPI'

export default function App() {
  const [orbState, setOrbState] = useState('idle') // idle, thinking, speaking, interact
  const [messages, setMessages] = useState([{
    role: 'system',
    text: `> JARVIS INTERFACE INITIALIZED\n> Connecting to backend...\n\nJARVIS: Good day. I am JARVIS, your virtual assistant. How may I help you?`
  }])
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [audioData, setAudioData] = useState(null)
  const [backendStatus, setBackendStatus] = useState('connecting')
  const streamingRef = useRef(false)
  const utteranceRef = useRef(null)
  const audioContextRef = useRef(null)
  const analyserRef = useRef(null)
  const animationFrameRef = useRef(null)
  const apiRef = useRef(null)

  // Set up Web Audio API for speech analysis
  useEffect(() => {
    // Create audio context (will be activated on user interaction)
    if (!audioContextRef.current && 'AudioContext' in window) {
      audioContextRef.current = new AudioContext()
      analyserRef.current = audioContextRef.current.createAnalyser()
      analyserRef.current.fftSize = 256
      
      // Connect the speech synthesis audio to the analyser
      const dest = audioContextRef.current.createMediaStreamDestination()
      analyserRef.current.connect(dest)
    }
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      if (audioContextRef.current) {
        audioContextRef.current.close()
      }
    }
  }, [])

  // Initialize API and check backend status
  useEffect(() => {
    apiRef.current = new JarvisAPI()
    
    // Check backend status
    apiRef.current.checkStatus().then(status => {
      if (status.ollama_available && status.docker_available) {
        setBackendStatus('ready')
        setMessages(m => [...m.slice(0, 1), {
          role: 'system',
          text: `> Backend connected\n> Ollama: ${status.ollama_available ? 'ONLINE' : 'OFFLINE'}\n> Docker: ${status.docker_available ? 'ONLINE' : 'OFFLINE'}\n> Model: ${status.model}\n> All systems ready`
        }])
      } else {
        setBackendStatus('degraded')
        setMessages(m => [...m.slice(0, 1), {
          role: 'system',
          text: `> Backend connected (degraded mode)\n> Ollama: ${status.ollama_available ? 'ONLINE' : 'OFFLINE'}\n> Docker: ${status.docker_available ? 'OFFLINE' : 'ONLINE'}\n> Some features may be limited`
        }])
      }
    }).catch(error => {
      setBackendStatus('offline')
      setMessages(m => [...m.slice(0, 1), {
        role: 'system',
        text: `> ERROR: Cannot connect to backend server\n> Please ensure the backend is running on http://localhost:8000\n> Run: python backend/api_server.py`
      }])
    })

    return () => {
      if (apiRef.current) {
        apiRef.current.disconnectWebSocket()
      }
    }
  }, [])

  function analyzeAudio() {
    if (!analyserRef.current || !isSpeaking) {
      setAudioData(null)
      return
    }

    const bufferLength = analyserRef.current.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)
    analyserRef.current.getByteFrequencyData(dataArray)
    setAudioData(Array.from(dataArray))

    animationFrameRef.current = requestAnimationFrame(analyzeAudio)
  }

  useEffect(() => {
    if (isSpeaking) {
      if (audioContextRef.current?.state === 'suspended') {
        audioContextRef.current.resume()
      }
      analyzeAudio()
    } else {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      setAudioData(null)
    }
  }, [isSpeaking])

  function extractSpeakableText(text) {
    // Extract what should be spoken aloud
    
    // Check if it's an echo command - just speak the message
    const executingEchoMatch = text.match(/\[EXECUTING\]\s+echo\s+["']([^"'\n]+)["']/i);
    if (executingEchoMatch) {
      return executingEchoMatch[1].trim();
    }
    
    // Extract output from echo commands
    const outputMatch = text.match(/Output:\s*\n(.+?)(?:\n\n|$)/s);
    if (outputMatch) {
      const output = outputMatch[1].trim();
      // If output looks like a simple answer (not a file list or technical data), speak it
      if (output.length < 200 && !output.includes('\n') && !output.match(/^[\d\s\-:]+$/)) {
        return output;
      }
    }
    
    // If text contains "JARVIS:" extract that part
    const jarvisMatch = text.match(/JARVIS:\s*(.+?)(?:\n|$)/);
    if (jarvisMatch) {
      return jarvisMatch[1].trim();
    }
    
    // For questions or simple responses without technical markers
    if (!text.includes('[EXECUTING]') && !text.includes('[COMPLETE]') && !text.includes('Output:')) {
      return text.replace(/\[.*?\]/g, '').trim();
    }
    
    // Default: don't speak technical output
    return '';
  }

  function speakText(text) {
    if ('speechSynthesis' in window) {
      // Extract only the speakable part
      const speakableText = extractSpeakableText(text);
      
      // If nothing meaningful to speak, skip
      if (!speakableText || speakableText.length < 3) {
        setIsSpeaking(false);
        setOrbState('idle');
        return;
      }
      
      // Cancel any ongoing speech
      window.speechSynthesis.cancel()
      
      const utterance = new SpeechSynthesisUtterance(speakableText)
      utterance.rate = 1.0
      utterance.pitch = 1.0
      utterance.volume = 1.0
      
      utterance.onstart = () => {
        setIsSpeaking(true)
        setOrbState('speaking')
      }
      
      utterance.onend = () => {
        setIsSpeaking(false)
        setOrbState('idle')
      }
      
      utteranceRef.current = utterance
      window.speechSynthesis.speak(utterance)
    }
  }

  function sendMessage(text) {
    if (backendStatus === 'offline') {
      setMessages(m => [...m, 
        { role: 'user', text },
        { role: 'system', text: 'ERROR: Backend server is offline. Please start the backend server.' }
      ])
      return
    }

    setMessages(m => [...m, { role: 'user', text }])
    setOrbState('thinking')

    // Send command to backend API
    apiRef.current.sendCommand(text)
      .then(result => {
        setOrbState('speaking')
        
        let responseText = result.response
        
        // If it's a command with output, format nicely
        if (result.is_command && result.command) {
          const statusPrefix = result.success ? '[COMPLETE]' : '[FAILED]'
          const commandInfo = `[EXECUTING] ${result.command}\n${statusPrefix} Exit code: ${result.success ? '0' : 'non-zero'}\n`
          
          if (result.output && result.output !== 'Command executed with no output') {
            responseText = commandInfo + `\nOutput:\n${result.output}\n\nJARVIS: Command executed successfully, sir.`
          } else {
            responseText = commandInfo + `\nJARVIS: Command "${result.command}" has been processed.`
          }
        }
        
        // Stream the response for visual effect
        streamResponse(responseText)
      })
      .catch(error => {
        console.error('Command execution failed:', error)
        setOrbState('idle')
        setMessages(m => [...m, {
          role: 'system',
          text: `ERROR: ${error.message || 'Failed to execute command'}`
        }])
      })
  }

  function streamResponse(fullText) {
    streamingRef.current = true
    let idx = 0
    const chunkSize = 15
    const chunks = []
    
    const interval = setInterval(() => {
      const nextChunk = fullText.slice(idx, idx + chunkSize)
      if (!nextChunk) {
        clearInterval(interval)
        streamingRef.current = false
        setOrbState('idle')
        setMessages(m => [...m, { role: 'assistant', text: chunks.join('') }])
        
        // Speak the response after streaming completes
        setTimeout(() => {
          speakText(fullText)
        }, 300)
        return
      }
      
      chunks.push(nextChunk)
      idx += chunkSize
      
      // Update terminal with partial stream
      setMessages(m => {
        const copy = [...m]
        const last = copy[copy.length - 1]
        if (last && last.role === 'assistant') {
          last.text = chunks.join('')
          return copy
        }
        return [...m, { role: 'assistant', text: chunks.join('') }]
      })
    }, 70)
  }

  return (
    <div className="h-screen w-screen relative overflow-hidden">
      {/* Databyte Logo - Bottom Left */}
      <div className="absolute left-6 bottom-6 z-10">
        <img src={logo} alt="Databyte" className="w-16 h-16 opacity-60 hover:opacity-90 transition-opacity" />
      </div>

      <HUD orbState={orbState} />
      <Sidebar onOpenSettings={() => setSettingsOpen(true)} />
      <Orb state={orbState} intensity={orbState === 'speaking' ? 2.5 : orbState === 'thinking' ? 1.5 : 0.8} audioData={audioData} />

      {/* Command Palette - Top Right */}
      <div className="absolute right-6 top-6">
        <Terminal messages={messages} onSend={sendMessage} isSpeaking={isSpeaking} />
      </div>

      <Settings isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  )
}
