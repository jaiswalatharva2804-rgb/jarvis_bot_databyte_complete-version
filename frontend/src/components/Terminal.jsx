import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function Terminal({ messages = [], onSend, isSpeaking = false }) {
  const [value, setValue] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [continuousMode, setContinuousMode] = useState(false)
  const scrollRef = useRef()
  const recognitionRef = useRef(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  useEffect(() => {
    // Initialize Web Speech API
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition()
      recognition.continuous = true
      recognition.interimResults = true
      recognition.lang = 'en-US'
      recognition.maxAlternatives = 1

      let finalTranscriptBuffer = ''

      recognition.onresult = (event) => {
        let interimTranscript = ''
        let finalTranscript = ''
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript
          if (event.results[i].isFinal) {
            finalTranscript += transcript
          } else {
            interimTranscript += transcript
          }
        }
        
        // Check for voice commands in interim results
        const lowerTranscript = (finalTranscript + interimTranscript).toLowerCase().trim()
        
        // Stop/Pause commands
        if (lowerTranscript.includes('stop listening') || 
            lowerTranscript.includes('stop jarvis') ||
            lowerTranscript.includes('pause listening') ||
            lowerTranscript.includes('jarvis stop')) {
          recognition.stop()
          setIsListening(false)
          setContinuousMode(false)
          setValue('')
          finalTranscriptBuffer = ''
          return
        }
        
        // Start commands
        if (lowerTranscript.includes('start listening') || 
            lowerTranscript.includes('jarvis listen') ||
            lowerTranscript.includes('begin listening')) {
          setIsListening(true)
          setValue('')
          finalTranscriptBuffer = ''
          return
        }
        
        // Accumulate final transcripts
        if (finalTranscript) {
          finalTranscriptBuffer += finalTranscript + ' '
        }
        
        // Show current transcript (accumulated + interim)
        setValue((finalTranscriptBuffer + interimTranscript).trim())
      }

      recognition.onspeechend = () => {
        // User stopped speaking, send after delay
        setTimeout(() => {
          if (finalTranscriptBuffer.trim()) {
            onSend(finalTranscriptBuffer.trim())
            finalTranscriptBuffer = ''
            setValue('')
          }
        }, 1000)
      }

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error)
        // Don't stop on minor errors
        if (event.error !== 'no-speech' && event.error !== 'aborted') {
          setIsListening(false)
        }
      }

      recognition.onend = () => {
        // Keep recognition running if button is still pressed or continuous mode active
        if (isListening || continuousMode) {
          setTimeout(() => {
            try {
              recognition.start()
            } catch (e) {
              // Already started
            }
          }, 100)
        }
      }

      recognitionRef.current = recognition
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
    }
  }, [onSend, continuousMode, isListening])

  function handleSend(e) {
    e.preventDefault()
    if (!value.trim()) return
    onSend(value.trim())
    setValue('')
  }

  function handleRun() {
    if (!value.trim()) return
    onSend(value.trim())
    setValue('')
  }

  function toggleVoiceInput() {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in your browser. Please use Chrome or Edge.')
      return
    }

    if (isListening) {
      recognitionRef.current.stop()
      setIsListening(false)
    } else {
      recognitionRef.current.start()
      setIsListening(true)
    }
  }

  function toggleContinuousMode() {
    const newMode = !continuousMode
    setContinuousMode(newMode)
    
    if (newMode && recognitionRef.current) {
      setIsListening(true)
      recognitionRef.current.start()
    } else if (!newMode && recognitionRef.current) {
      recognitionRef.current.stop()
      setIsListening(false)
    }
  }

  return (
    <>
      {/* Command Palette - Top Right Corner */}
      <motion.div 
        initial={{ x: 60, opacity: 0 }} 
        animate={{ x: 0, opacity: 1 }} 
        className="w-[350px] max-h-[450px] bg-black/70 backdrop-blur-md border border-amberplasma/30 rounded-lg p-4 neon-outline flex flex-col"
      >
        {/* Header */}
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-xs font-mono tracking-wider text-gray-500">COMMAND PALETTE</div>
            {isSpeaking && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-2 text-xs text-amberplasma"
              >
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 0.8, repeat: Infinity }}
                  className="w-2 h-2 bg-amberplasma rounded-full"
                />
                Speaking...
              </motion.div>
            )}
          </div>
          <button
            onClick={toggleContinuousMode}
            className={`text-xs px-3 py-1 rounded transition-colors ${
              continuousMode
                ? 'bg-green-500 text-white font-semibold'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            {continuousMode ? '🎤 ACTIVE' : 'Voice OFF'}
          </button>
        </div>

        {/* Command line output */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-auto p-3 space-y-1 text-xs leading-5 font-mono bg-black/40 rounded border border-white/5"
        >
        {messages.map((m, i) => (
          <div key={i}>
            {m.role === 'user' && (
              <div className="text-cyancore">
                <span className="text-gray-500">$</span> {m.text}
              </div>
            )}
            {m.role === 'assistant' && (
              <div className="text-green-400 whitespace-pre-wrap mt-1">
                {m.text}
              </div>
            )}
            {m.role === 'system' && (
              <div className="text-gray-400 whitespace-pre-wrap">
                {m.text}
              </div>
            )}
          </div>
        ))}
        </div>
      </motion.div>

      {/* Chat-style Input Bar - Bottom Center */}
      <motion.div
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="fixed bottom-6 left-1/2 transform -translate-x-1/2 -ml-8 w-[700px] bg-black/80 backdrop-blur-md border border-amberplasma/30 rounded-full px-4 py-3 neon-outline flex items-center gap-3 shadow-2xl"
      >
        {/* Voice button */}
        <button
          type="button"
          onClick={toggleVoiceInput}
          className={`relative p-2 rounded-full transition-all flex-shrink-0 ${
            isListening 
              ? 'bg-red-500/20 text-red-400' 
              : 'bg-amberplasma/10 text-amberplasma hover:bg-amberplasma/20'
          }`}
        >
          <AnimatePresence>
            {isListening && (
              <motion.div
                className="absolute inset-0 rounded-full bg-red-500/30"
                animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
            )}
          </AnimatePresence>
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M7 4a3 3 0 016 0v6a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" />
          </svg>
        </button>

        {/* Input field */}
        <form onSubmit={handleSend} className="flex-1 flex items-center gap-2">
          <span className="text-cyancore font-mono text-sm">$</span>
          <input 
            value={value} 
            onChange={(e) => setValue(e.target.value)} 
            placeholder={continuousMode ? (isListening ? "Listening..." : "Voice mode active...") : (isListening ? "Listening..." : "Type a command...")} 
            className="flex-1 bg-transparent font-mono text-sm outline-none text-white placeholder-gray-500" 
            autoFocus
          />
        </form>

        {/* RUN button */}
        <button 
          onClick={handleRun}
          className="bg-amberplasma px-6 py-2 rounded-full text-black font-bold text-sm hover:bg-amberplasma/90 transition-colors flex-shrink-0 shadow-lg"
        >
          RUN
        </button>
      </motion.div>
    </>
  )
}
