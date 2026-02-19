import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function HUD({ orbState }) {
  return (
    <div className="absolute inset-0 pointer-events-none z-0">
      {/* Top right HUD fragment */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: orbState !== 'idle' ? 0.7 : 0.3, x: 0 }}
        className="absolute top-8 right-8 text-xs font-mono text-amberplasma/70"
      >
        <div className="space-y-1">
          <div>SYSTEM: ONLINE</div>
          <div>NEURAL NET: {orbState === 'speaking' ? 'ACTIVE' : orbState === 'thinking' ? 'PROCESSING' : 'STANDBY'}</div>
          <div>LATENCY: {orbState === 'speaking' ? '12ms' : '8ms'}</div>
        </div>
      </motion.div>

      {/* Floating scan lines */}
      <AnimatePresence>
        {orbState !== 'idle' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.15 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0"
          >
            <div className="absolute top-1/4 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyancore to-transparent"></div>
            <div className="absolute top-1/2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amberplasma to-transparent"></div>
            <div className="absolute top-3/4 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyancore to-transparent"></div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Corner brackets */}
      <div className="absolute top-4 left-4 w-12 h-12 border-l-2 border-t-2 border-amberplasma/20"></div>
      <div className="absolute top-4 right-4 w-12 h-12 border-r-2 border-t-2 border-amberplasma/20"></div>
      <div className="absolute bottom-4 left-4 w-12 h-12 border-l-2 border-b-2 border-amberplasma/20"></div>
      <div className="absolute bottom-4 right-4 w-12 h-12 border-r-2 border-b-2 border-amberplasma/20"></div>
    </div>
  )
}
