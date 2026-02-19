# Jarvis Jr — Interactive AI Operating Core

A cinematic, futuristic AI assistant web application inspired by advanced sci-fi AI systems like JARVIS.

## Features

- **Holographic AI Orb** with Three.js (nucleus, rotating rings, particle field)
- **Real-time streaming simulation** with orb animations synced to text generation
- **Command terminal** with glassmorphism UI
- **HUD overlay** with system status and scan lines
- **Settings panel** for customization
- **Responsive design** with smooth Framer Motion animations

## Quick Start

1. **Install dependencies:**

```bash
npm install
```

2. **Run development server:**

```bash
npm run dev
```

3. **Open browser** at `http://localhost:5173`

## Tech Stack

- **Vite** + **React**
- **Tailwind CSS** for styling
- **Three.js** for 3D orb visualization
- **Framer Motion** for UI animations

## Project Structure

```
jarvis jr/
├── src/
│   ├── components/
│   │   ├── Orb.jsx        # Three.js animated orb
│   │   ├── Terminal.jsx   # Chat interface
│   │   ├── Sidebar.jsx    # Navigation
│   │   ├── Settings.jsx   # Settings modal
│   │   └── HUD.jsx        # Holographic overlay
│   ├── App.jsx            # Main app with state
│   ├── main.jsx           # React entry
│   └── index.css          # Global styles
├── index.html
├── vite.config.js
└── package.json
```

## Next Steps

- Connect to real AI streaming backend (OpenAI, Anthropic, etc.)
- Add advanced shaders for more cinematic orb effects
- Implement voice mode and sound effects
- Add chat history persistence
- Mobile responsive enhancements

## License

MIT
