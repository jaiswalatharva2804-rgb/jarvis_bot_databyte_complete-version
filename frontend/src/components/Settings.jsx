import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function Settings({ isOpen, onClose }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="bg-black/90 border border-amberplasma/30 rounded-2xl p-6 w-[500px] max-h-[600px] overflow-auto neon-outline"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-amberplasma">Settings</h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="space-y-6">
              {/* Animation Intensity */}
              <div>
                <label className="block text-sm font-medium mb-2">Animation Intensity</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  defaultValue="70"
                  className="w-full accent-amberplasma"
                />
              </div>

              {/* Theme Accent Color */}
              <div>
                <label className="block text-sm font-medium mb-2">Theme Accent Color</label>
                <div className="flex gap-3">
                  <button className="w-12 h-12 rounded-full bg-amberplasma border-2 border-white"></button>
                  <button className="w-12 h-12 rounded-full bg-cyancore border-2 border-transparent hover:border-white"></button>
                  <button className="w-12 h-12 rounded-full bg-purple-500 border-2 border-transparent hover:border-white"></button>
                  <button className="w-12 h-12 rounded-full bg-green-500 border-2 border-transparent hover:border-white"></button>
                </div>
              </div>

              {/* Terminal Style */}
              <div>
                <label className="block text-sm font-medium mb-2">Terminal Style</label>
                <select className="w-full bg-white/5 border border-gray-600 rounded p-2 outline-none focus:border-cyancore">
                  <option>Holographic</option>
                  <option>Matrix</option>
                  <option>Minimal</option>
                </select>
              </div>

              {/* AI Response Verbosity */}
              <div>
                <label className="block text-sm font-medium mb-2">AI Response Verbosity</label>
                <select className="w-full bg-white/5 border border-gray-600 rounded p-2 outline-none focus:border-cyancore">
                  <option>Concise</option>
                  <option>Balanced</option>
                  <option>Detailed</option>
                </select>
              </div>

              {/* Voice Mode */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Voice Mode</span>
                <label className="relative inline-block w-12 h-6">
                  <input type="checkbox" className="sr-only peer" />
                  <div className="w-12 h-6 bg-gray-700 peer-checked:bg-amberplasma rounded-full peer-checked:after:translate-x-6 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                </label>
              </div>

              {/* Sound Effects */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Sound Effects</span>
                <label className="relative inline-block w-12 h-6">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-12 h-6 bg-gray-700 peer-checked:bg-amberplasma rounded-full peer-checked:after:translate-x-6 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                </label>
              </div>

              {/* Particle Effects */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Particle Effects</span>
                <label className="relative inline-block w-12 h-6">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-12 h-6 bg-gray-700 peer-checked:bg-amberplasma rounded-full peer-checked:after:translate-x-6 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                </label>
              </div>
            </div>

            <button
              onClick={onClose}
              className="mt-6 w-full bg-amberplasma text-black font-semibold py-2 rounded hover:bg-amberplasma/90 transition-colors"
            >
              Save Settings
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
