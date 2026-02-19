import React from 'react'

export default function Sidebar({ onOpenSettings }) {
  return (
    <aside className="absolute left-4 top-6 w-56 h-auto p-3 bg-black/30 backdrop-blur-md rounded-lg border border-black/40 neon-outline z-10">
      <div className="space-y-3">
        <button className="w-full text-left px-2 py-1 rounded hover:bg-white/5 transition-colors text-sm">
          New Session
        </button>
        <button className="w-full text-left px-2 py-1 rounded hover:bg-white/5 transition-colors text-sm">
          Chat History
        </button>
        <button 
          onClick={onOpenSettings} 
          className="w-full text-left px-2 py-1 rounded hover:bg-white/5 transition-colors text-sm"
        >
          Settings
        </button>
        <div className="mt-2 px-2 text-sm text-gray-400">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
            AI Mode: Cinematic
          </div>
        </div>
      </div>
    </aside>
  )
}
