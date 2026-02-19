import React, { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { MeshSurfaceSampler } from 'three/examples/jsm/math/MeshSurfaceSampler.js'

// Vertex Shader - Exact from the repo
const vertexShader = `
attribute vec3 position;
attribute vec3 secPosition;
attribute vec3 thirdPosition;
attribute float vertexIndex;
attribute float phaseValue;
attribute vec4 randomValue;
uniform float u_switch_01;
uniform float u_switch_02;
uniform float u_switch_03;
uniform float u_animationRange;
uniform float u_particle_animation_range;
uniform float u_time;
uniform float u_particle_range;
uniform float maxOffsetRatio;
uniform float minDurationRatio;
uniform mat4 modelMatrix;
uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
varying float vRandomAlpha;

#ifndef PI
#define PI 3.141592653589793
#endif

float getVertexAnimationValue(float value) {
    float offsetRatio = randomValue.x * maxOffsetRatio;
    float maxDurationRatio = 1.0 - offsetRatio;
    float durationRatio = maxDurationRatio * (minDurationRatio + (1.0 - minDurationRatio) * randomValue.y);
    float vertexAnimationValue = max(0.0, value - offsetRatio);
    vertexAnimationValue = min(vertexAnimationValue, durationRatio);
    vertexAnimationValue = vertexAnimationValue / durationRatio;
    return vertexAnimationValue;
}

float sineInOut(float t) {
  return -0.5 * (cos(PI * t) - 1.0);
}

void main() {
    vRandomAlpha = randomValue.x + 0.30;

    vec3 firstAnimationPosition = position * sineInOut(getVertexAnimationValue(u_switch_01));
    vec3 secAnimationPosition = secPosition * sineInOut(getVertexAnimationValue(u_switch_02));
    vec3 thirdAnimationPosition = thirdPosition * sineInOut(getVertexAnimationValue(u_switch_03));

    float moveRange = u_particle_range;
    float randX = moveRange * sineInOut(getVertexAnimationValue(sin(u_time + phaseValue)));
    float randY = moveRange * sineInOut(getVertexAnimationValue(cos(u_time + phaseValue)));
    float randZ = randX + randY;

    vec3 loopPosition = (firstAnimationPosition + secAnimationPosition + thirdAnimationPosition) * (1.0 + u_particle_animation_range * sineInOut(getVertexAnimationValue(u_animationRange)));
    vec3 allPosition = loopPosition;
    vec3 finalPosition = allPosition + vec3(randX, randY, randZ);

    gl_Position = projectionMatrix * modelViewMatrix * vec4(finalPosition, 1.0 );

    float sizeRange = 2.0 * phaseValue;
    float sizeMoveRange = 20.0;
    gl_PointSize = 20.0 + sizeRange + sizeMoveRange * sineInOut(getVertexAnimationValue(sin(u_time * 2.0 * phaseValue)));
}
`

// Fragment Shader - Exact from the repo
const fragmentShader = `
precision mediump float;

varying float vRandomAlpha;
uniform sampler2D u_texture;

void main() {
    vec2 p = gl_PointCoord * 2.0 - 1.0;
    float len = length(p);
    float alpha = max(1.0 - len, 0.0);

    vec4 texture = texture2D(u_texture, gl_PointCoord);

    gl_FragColor = texture * vec4(1.0, 1.0, 1.0, alpha * vRandomAlpha);
}
`

export default function Orb({ state = 'idle', intensity = 0.5, audioData = null }) {
  const mountRef = useRef()
  const frameRef = useRef()
  const mouseRef = useRef({ x: 0, y: 0 })
  const targetMouseRef = useRef({ x: 0, y: 0 })
  const isDraggingRef = useRef(false)
  const previousMouseRef = useRef({ x: 0, y: 0 })
  const rotationRef = useRef({ x: 0, y: 0 })
  const targetRotationRef = useRef({ x: 0, y: 0 })
  const colorCycleRef = useRef(0)
  const audioFrequencyRef = useRef(0)

  useEffect(() => {
    const el = mountRef.current
    if (!el) return

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(45, el.clientWidth / el.clientHeight, 0.1, 100)
    camera.position.set(0, 0, 3.5)
    camera.lookAt(new THREE.Vector3(0, 0, 0))

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })
    renderer.setSize(el.clientWidth, el.clientHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    el.appendChild(renderer.domElement)

    // Mouse movement and drag tracking
    function onMouseMove(event) {
      const x = (event.clientX / window.innerWidth) * 2 - 1
      const y = -(event.clientY / window.innerHeight) * 2 + 1
      
      targetMouseRef.current.x = x
      targetMouseRef.current.y = y
      
      // Handle drag rotation
      if (isDraggingRef.current) {
        const deltaX = event.clientX - previousMouseRef.current.x
        const deltaY = event.clientY - previousMouseRef.current.y
        
        targetRotationRef.current.y += deltaX * 0.01
        targetRotationRef.current.x += deltaY * 0.01
        
        previousMouseRef.current.x = event.clientX
        previousMouseRef.current.y = event.clientY
      }
    }
    
    function onMouseDown(event) {
      isDraggingRef.current = true
      previousMouseRef.current.x = event.clientX
      previousMouseRef.current.y = event.clientY
    }
    
    function onMouseUp() {
      isDraggingRef.current = false
    }
    
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mousedown', onMouseDown)
    window.addEventListener('mouseup', onMouseUp)

    // Helper function to sample particles from geometry surface
    function getGeometryPosition(geometry, vertexNum) {
      const material = new THREE.MeshBasicMaterial()
      const mesh = new THREE.Mesh(geometry, material)
      const sampler = new MeshSurfaceSampler(mesh).build()
      const particlesPosition = new Float32Array(vertexNum * 3)
      
      for (let i = 0; i < vertexNum; i++) {
        const newPosition = new THREE.Vector3()
        const normal = new THREE.Vector3()
        sampler.sample(newPosition, normal)
        particlesPosition.set([newPosition.x, newPosition.y, newPosition.z], i * 3)
      }
      
      return particlesPosition
    }

    // Create canvas texture for particle color - sharper rendering
    function createTexture(color) {
      const size = 128
      const dpr = window.devicePixelRatio || 1
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      canvas.width = size * dpr
      canvas.height = size * dpr
      canvas.style.width = size + 'px'
      canvas.style.height = size + 'px'
      ctx.scale(dpr, dpr)
      
      // Create radial gradient for smooth, sharp particles
      const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
      gradient.addColorStop(0, color)
      gradient.addColorStop(0.4, color)
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)')
      
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, size, size)
      
      const texture = new THREE.Texture(canvas)
      texture.needsUpdate = true
      return { texture, canvas, ctx }
    }
    
    // Color palette for cycling
    const colorPalette = [
      '#FFB000', // JARVIS gold
      '#00E5FF', // Cyan
      '#FF5AC6', // Pink/Magenta
      '#FFE88E', // Yellow
      '#FF6B35', // Orange
      '#00D9FF'  // Bright cyan
    ]
    
    const textureData = createTexture(colorPalette[0])

    // Create fluid sphere particle system - smaller particles
    const vertexNum = 2500
    const geometry = new THREE.BufferGeometry()
    
    // Single fluid sphere that responds to mouse - smaller size to fit frame
    const spherePos = getGeometryPosition(new THREE.SphereGeometry(0.85, 64, 64), vertexNum)
    
    // Set attributes - only one position (fluid sphere)
    geometry.setAttribute('position', new THREE.BufferAttribute(spherePos, 3))
    geometry.setAttribute('secPosition', new THREE.BufferAttribute(spherePos, 3))
    geometry.setAttribute('thirdPosition', new THREE.BufferAttribute(spherePos, 3))
    
    // Random values and phases
    const vertexIndex = []
    const randomValue = []
    const phaseValue = []
    
    for (let i = 0; i < vertexNum; i++) {
      vertexIndex.push(i)
      phaseValue.push((Math.random() - 0.5) * 2.0)
      randomValue.push(Math.random(), Math.random(), Math.random(), Math.random())
    }
    
    geometry.setAttribute('vertexIndex', new THREE.BufferAttribute(new Float32Array(vertexIndex), 1))
    geometry.setAttribute('phaseValue', new THREE.BufferAttribute(new Float32Array(phaseValue), 1))
    geometry.setAttribute('randomValue', new THREE.BufferAttribute(new Float32Array(randomValue), 4))
    
    // Shader material with repo settings - smaller particles
    const material = new THREE.RawShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        u_switch_01: { type: "f", value: 1.0 },
        u_switch_02: { type: "f", value: 0.0 },
        u_switch_03: { type: "f", value: 0.0 },
        u_time: { type: "f", value: 0.0 },
        u_particle_range: { type: "f", value: 0.15 },
        u_particle_animation_range: { type: "f", value: 0.50 },
        u_animationRange: { type: "f", value: 1.0 },
        u_texture: { type: "t", value: textureData.texture },
        maxOffsetRatio: { type: "f", value: 0.4 },
        minDurationRatio: { type: "f", value: 0.3 }
      },
      depthTest: false,
      transparent: true,
      blending: THREE.AdditiveBlending
    })
    
    const mesh = new THREE.Points(geometry, material)
    const group = new THREE.Group()
    group.add(mesh)
    
    // Add network connection lines between particles
    const lineGeometry = new THREE.BufferGeometry()
    const linePositions = []
    const lineColors = []
    const maxConnections = 3
    const connectionDistance = 0.25
    
    // Create connections between nearby particles
    for (let i = 0; i < vertexNum; i++) {
      const i3 = i * 3
      let connections = 0
      
      for (let j = i + 1; j < vertexNum && connections < maxConnections; j++) {
        const j3 = j * 3
        
        const dx = spherePos[i3] - spherePos[j3]
        const dy = spherePos[i3 + 1] - spherePos[j3 + 1]
        const dz = spherePos[i3 + 2] - spherePos[j3 + 2]
        const distance = Math.sqrt(dx * dx + dy * dy + dz * dz)
        
        if (distance < connectionDistance) {
          linePositions.push(
            spherePos[i3], spherePos[i3 + 1], spherePos[i3 + 2],
            spherePos[j3], spherePos[j3 + 1], spherePos[j3 + 2]
          )
          
          // Initial gold color (will be updated dynamically)
          lineColors.push(1, 0.69, 0, 0.3)
          lineColors.push(1, 0.69, 0, 0.3)
          
          connections++
        }
      }
    }
    
    lineGeometry.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3))
    lineGeometry.setAttribute('color', new THREE.Float32BufferAttribute(lineColors, 4))
    
    const lineMaterial = new THREE.LineBasicMaterial({ 
      vertexColors: true,
      transparent: true,
      opacity: 0.4,
      blending: THREE.AdditiveBlending
    })
    
    const linesMesh = new THREE.LineSegments(lineGeometry, lineMaterial)
    group.add(linesMesh)
    
    scene.add(group)

    // Create innermost core particle system
    const innerCoreVertexNum = 800
    const innerCoreGeometry = new THREE.BufferGeometry()
    const innerCorePos = getGeometryPosition(new THREE.SphereGeometry(0.3, 32, 32), innerCoreVertexNum)
    
    innerCoreGeometry.setAttribute('position', new THREE.BufferAttribute(innerCorePos, 3))
    innerCoreGeometry.setAttribute('secPosition', new THREE.BufferAttribute(innerCorePos, 3))
    innerCoreGeometry.setAttribute('thirdPosition', new THREE.BufferAttribute(innerCorePos, 3))
    
    const innerCoreVertexIndex = []
    const innerCoreRandomValue = []
    const innerCorePhaseValue = []
    
    for (let i = 0; i < innerCoreVertexNum; i++) {
      innerCoreVertexIndex.push(i)
      innerCorePhaseValue.push((Math.random() - 0.5) * 2.0)
      innerCoreRandomValue.push(Math.random(), Math.random(), Math.random(), Math.random())
    }
    
    innerCoreGeometry.setAttribute('vertexIndex', new THREE.BufferAttribute(new Float32Array(innerCoreVertexIndex), 1))
    innerCoreGeometry.setAttribute('phaseValue', new THREE.BufferAttribute(new Float32Array(innerCorePhaseValue), 1))
    innerCoreGeometry.setAttribute('randomValue', new THREE.BufferAttribute(new Float32Array(innerCoreRandomValue), 4))
    
    const innerCoreTextureData = createTexture(colorPalette[0])
    
    const innerCoreMaterial = new THREE.RawShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        u_switch_01: { type: "f", value: 1.0 },
        u_switch_02: { type: "f", value: 0.0 },
        u_switch_03: { type: "f", value: 0.0 },
        u_time: { type: "f", value: 0.0 },
        u_particle_range: { type: "f", value: 0.1 },
        u_particle_animation_range: { type: "f", value: 0.4 },
        u_animationRange: { type: "f", value: 1.0 },
        u_texture: { type: "t", value: innerCoreTextureData.texture },
        maxOffsetRatio: { type: "f", value: 0.4 },
        minDurationRatio: { type: "f", value: 0.3 }
      },
      depthTest: false,
      transparent: true,
      blending: THREE.AdditiveBlending
    })
    
    const innerCoreParticles = new THREE.Points(innerCoreGeometry, innerCoreMaterial)
    scene.add(innerCoreParticles)
    
    const innerCoreOriginalPositions = new Float32Array(innerCorePos)
    const innerCoreVelocities = new Float32Array(innerCoreVertexNum * 3)
    
    // Create outer glow particle system
    const glowVertexNum = 600
    const glowGeometry = new THREE.BufferGeometry()
    const glowPos = getGeometryPosition(new THREE.SphereGeometry(0.4, 32, 32), glowVertexNum)
    
    glowGeometry.setAttribute('position', new THREE.BufferAttribute(glowPos, 3))
    glowGeometry.setAttribute('secPosition', new THREE.BufferAttribute(glowPos, 3))
    glowGeometry.setAttribute('thirdPosition', new THREE.BufferAttribute(glowPos, 3))
    
    const glowVertexIndex = []
    const glowRandomValue = []
    const glowPhaseValue = []
    
    for (let i = 0; i < glowVertexNum; i++) {
      glowVertexIndex.push(i)
      glowPhaseValue.push((Math.random() - 0.5) * 2.0)
      glowRandomValue.push(Math.random(), Math.random(), Math.random(), Math.random())
    }
    
    glowGeometry.setAttribute('vertexIndex', new THREE.BufferAttribute(new Float32Array(glowVertexIndex), 1))
    glowGeometry.setAttribute('phaseValue', new THREE.BufferAttribute(new Float32Array(glowPhaseValue), 1))
    glowGeometry.setAttribute('randomValue', new THREE.BufferAttribute(new Float32Array(glowRandomValue), 4))
    
    const glowTextureData = createTexture(colorPalette[0])
    
    const glowMaterial = new THREE.RawShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        u_switch_01: { type: "f", value: 1.0 },
        u_switch_02: { type: "f", value: 0.0 },
        u_switch_03: { type: "f", value: 0.0 },
        u_time: { type: "f", value: 0.0 },
        u_particle_range: { type: "f", value: 0.12 },
        u_particle_animation_range: { type: "f", value: 0.45 },
        u_animationRange: { type: "f", value: 1.0 },
        u_texture: { type: "t", value: glowTextureData.texture },
        maxOffsetRatio: { type: "f", value: 0.4 },
        minDurationRatio: { type: "f", value: 0.3 }
      },
      depthTest: false,
      transparent: true,
      blending: THREE.AdditiveBlending
    })
    
    const glowParticles = new THREE.Points(glowGeometry, glowMaterial)
    scene.add(glowParticles)
    
    const glowOriginalPositions = new Float32Array(glowPos)
    const glowVelocities = new Float32Array(glowVertexNum * 3)
    
    // Add geometric wireframe rings
    const ringGeometry1 = new THREE.TorusGeometry(1.0, 0.003, 8, 64)
    const ringMaterial = new THREE.MeshBasicMaterial({
      color: 0xFFB000,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending
    })
    const ring1 = new THREE.Mesh(ringGeometry1, ringMaterial)
    scene.add(ring1)
    
    const ring2 = ring1.clone()
    ring2.rotation.x = Math.PI / 2
    scene.add(ring2)
    
    const ring3 = ring1.clone()
    ring3.rotation.y = Math.PI / 2
    scene.add(ring3)
    
    // Add dodecahedron structure
    const dodecahedron = new THREE.Mesh(
      new THREE.DodecahedronGeometry(1.25, 0),
      new THREE.MeshBasicMaterial({
        color: 0xFFB000,
        wireframe: true,
        transparent: true,
        opacity: 0.5,
        blending: THREE.AdditiveBlending
      })
    )
    scene.add(dodecahedron)
    
    // Add energy beams connecting points on outer sphere
    const beamGeometry = new THREE.BufferGeometry()
    const beamPositions = []
    const beamColors = []
    const numBeams = 12
    
    for (let i = 0; i < numBeams; i++) {
      // Random points on outer sphere
      const theta1 = Math.random() * Math.PI * 2
      const phi1 = Math.random() * Math.PI
      const theta2 = Math.random() * Math.PI * 2
      const phi2 = Math.random() * Math.PI
      
      const radius = 1.15
      
      const x1 = radius * Math.sin(phi1) * Math.cos(theta1)
      const y1 = radius * Math.sin(phi1) * Math.sin(theta1)
      const z1 = radius * Math.cos(phi1)
      
      const x2 = radius * Math.sin(phi2) * Math.cos(theta2)
      const y2 = radius * Math.sin(phi2) * Math.sin(theta2)
      const z2 = radius * Math.cos(phi2)
      
      beamPositions.push(x1, y1, z1, x2, y2, z2)
      
      // Initial gold color (will be updated dynamically)
      beamColors.push(1, 0.69, 0, 0.9)
      beamColors.push(1, 0.69, 0, 0.9)
    }
    
    beamGeometry.setAttribute('position', new THREE.Float32BufferAttribute(beamPositions, 3))
    beamGeometry.setAttribute('color', new THREE.Float32BufferAttribute(beamColors, 4))
    
    const beamMaterial = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
      linewidth: 2
    })
    
    const beamLines = new THREE.LineSegments(beamGeometry, beamMaterial)
    scene.add(beamLines)

    // Store original positions for fluid movement
    const originalPositions = new Float32Array(spherePos)
    const velocities = new Float32Array(vertexNum * 3)

    // Animation loop
    let time = 0
    const colorTransitionDuration = 8.0 // Change color every 8 seconds
    
    function updateParticleColor() {
      colorCycleRef.current += 0.01
      
      // Cycle through colors smoothly
      const colorIndex = Math.floor(colorCycleRef.current / colorTransitionDuration) % colorPalette.length
      const nextColorIndex = (colorIndex + 1) % colorPalette.length
      const t = (colorCycleRef.current % colorTransitionDuration) / colorTransitionDuration
      
      // Smooth color interpolation
      const currentColor = colorPalette[colorIndex]
      const nextColor = colorPalette[nextColorIndex]
      
      // Parse hex colors
      const c1 = {
        r: parseInt(currentColor.slice(1, 3), 16),
        g: parseInt(currentColor.slice(3, 5), 16),
        b: parseInt(currentColor.slice(5, 7), 16)
      }
      const c2 = {
        r: parseInt(nextColor.slice(1, 3), 16),
        g: parseInt(nextColor.slice(3, 5), 16),
        b: parseInt(nextColor.slice(5, 7), 16)
      }
      
      // Interpolate
      const r = Math.round(c1.r + (c2.r - c1.r) * t)
      const g = Math.round(c1.g + (c2.g - c1.g) * t)
      const b = Math.round(c1.b + (c2.b - c1.b) * t)
      const interpolatedColor = `rgb(${r}, ${g}, ${b})`
      
      // Update texture
      const size = 128
      const ctx = textureData.ctx
      ctx.clearRect(0, 0, size, size)
      
      const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
      gradient.addColorStop(0, interpolatedColor)
      gradient.addColorStop(0.4, interpolatedColor)
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)')
      
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, size, size)
      
      textureData.texture.needsUpdate = true
      
      // Update inner core texture
      const innerCtx = innerCoreTextureData.ctx
      innerCtx.clearRect(0, 0, size, size)
      const innerGradient = innerCtx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
      innerGradient.addColorStop(0, interpolatedColor)
      innerGradient.addColorStop(0.4, interpolatedColor)
      innerGradient.addColorStop(1, 'rgba(0, 0, 0, 0)')
      innerCtx.fillStyle = innerGradient
      innerCtx.fillRect(0, 0, size, size)
      innerCoreTextureData.texture.needsUpdate = true
      
      // Update outer glow texture
      const glowCtx = glowTextureData.ctx
      glowCtx.clearRect(0, 0, size, size)
      const glowGradient = glowCtx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
      glowGradient.addColorStop(0, interpolatedColor)
      glowGradient.addColorStop(0.4, interpolatedColor)
      glowGradient.addColorStop(1, 'rgba(0, 0, 0, 0)')
      glowCtx.fillStyle = glowGradient
      glowCtx.fillRect(0, 0, size, size)
      glowTextureData.texture.needsUpdate = true
      
      // Update structure colors to match particles
      const threeColor = new THREE.Color(interpolatedColor)
      ringMaterial.color.copy(threeColor)
      dodecahedron.material.color.copy(threeColor)
      
      // Update line colors
      const lineColors = lineGeometry.attributes.color.array
      for (let i = 0; i < lineColors.length; i += 4) {
        lineColors[i] = r / 255
        lineColors[i + 1] = g / 255
        lineColors[i + 2] = b / 255
      }
      lineGeometry.attributes.color.needsUpdate = true
      
      // Update beam colors
      const beamColors = beamGeometry.attributes.color.array
      for (let i = 0; i < beamColors.length; i += 4) {
        beamColors[i] = r / 255
        beamColors[i + 1] = g / 255
        beamColors[i + 2] = b / 255
      }
      beamGeometry.attributes.color.needsUpdate = true
    }
    
    function animate() {
      time += 0.01
      
      // Update particle color cycling
      updateParticleColor()

      // Smooth mouse follow
      mouseRef.current.x += (targetMouseRef.current.x - mouseRef.current.x) * 0.05
      mouseRef.current.y += (targetMouseRef.current.y - mouseRef.current.y) * 0.05
      
      // Smooth rotation follow
      rotationRef.current.x += (targetRotationRef.current.x - rotationRef.current.x) * 0.1
      rotationRef.current.y += (targetRotationRef.current.y - rotationRef.current.y) * 0.1
      
      // Apply rotation to group and geometric elements
      group.rotation.x = rotationRef.current.x
      group.rotation.y = rotationRef.current.y
      
      ring1.rotation.z += 0.003
      ring2.rotation.x = Math.PI / 2 + rotationRef.current.x
      ring2.rotation.y = rotationRef.current.y
      ring2.rotation.z += 0.002
      
      ring3.rotation.y = Math.PI / 2 + rotationRef.current.y
      ring3.rotation.x = rotationRef.current.x
      ring3.rotation.z += 0.0025
      
      // Animate dodecahedron - opposite rotation
      dodecahedron.rotation.x = -rotationRef.current.x
      dodecahedron.rotation.y = -rotationRef.current.y
      dodecahedron.rotation.z -= 0.0015
      
      // Animate energy beams - pulsing opacity
      beamMaterial.opacity = 0.4 + Math.sin(time * 2) * 0.2
      
      // Rotate beam lines
      beamLines.rotation.x = rotationRef.current.x
      beamLines.rotation.y = rotationRef.current.y
      beamLines.rotation.z += 0.002

      // Update time uniform for all particle systems
      material.uniforms.u_time.value = time
      innerCoreMaterial.uniforms.u_time.value = time
      glowMaterial.uniforms.u_time.value = time

      // Audio-reactive frequency when speaking
      if (audioData && state === 'speaking') {
        const avgFrequency = audioData.reduce((a, b) => a + b, 0) / audioData.length
        audioFrequencyRef.current = avgFrequency / 255 // Normalize to 0-1
      } else {
        audioFrequencyRef.current *= 0.9 // Smooth decay when not speaking
      }

      // State-based particle movement with audio reactivity
      let stateIntensity = state === 'speaking' ? 2.5 : state === 'thinking' ? 1.8 : 1.0
      
      // Add audio frequency boost when speaking
      if (state === 'speaking' && audioFrequencyRef.current > 0.1) {
        stateIntensity += audioFrequencyRef.current * 3.0 // Boost based on audio
      }
      
      material.uniforms.u_particle_range.value = 0.15 * stateIntensity

      // Fluid particle movement based on mouse
      const positions = geometry.attributes.position.array
      const mouseForce = 0.3
      const returnForce = 0.02
      const friction = 0.95
      
      for (let i = 0; i < vertexNum; i++) {
        const i3 = i * 3
        
        // Current position
        const x = positions[i3]
        const y = positions[i3 + 1]
        const z = positions[i3 + 2]
        
        // Original position
        const ox = originalPositions[i3]
        const oy = originalPositions[i3 + 1]
        const oz = originalPositions[i3 + 2]
        
        // Mouse interaction - push particles away from mouse
        const mouseX = mouseRef.current.x * 2
        const mouseY = mouseRef.current.y * 2
        const dx = x - mouseX
        const dy = y - mouseY
        const distance = Math.sqrt(dx * dx + dy * dy + z * z)
        
        if (distance < 1.5) {
          const force = (1.5 - distance) * mouseForce
          velocities[i3] += (dx / distance) * force
          velocities[i3 + 1] += (dy / distance) * force
          velocities[i3 + 2] += (z / distance) * force * 0.5
        }
        
        // Return to original position (fluid effect)
        velocities[i3] += (ox - x) * returnForce
        velocities[i3 + 1] += (oy - y) * returnForce
        velocities[i3 + 2] += (oz - z) * returnForce
        
        // Audio-reactive movement when speaking
        if (state === 'speaking' && audioFrequencyRef.current > 0.1) {
          const pulseForce = Math.sin(time * 3 + i * 0.1) * 0.008 * audioFrequencyRef.current * 5
          const angle = Math.atan2(oy, ox)
          velocities[i3] += Math.cos(angle) * pulseForce
          velocities[i3 + 1] += Math.sin(angle) * pulseForce
          velocities[i3 + 2] += Math.sin(time * 2 + i * 0.1) * pulseForce * 0.5
        }
        
        // Apply velocity with friction
        velocities[i3] *= friction
        velocities[i3 + 1] *= friction
        velocities[i3 + 2] *= friction
        
        // Update position
        positions[i3] += velocities[i3]
        positions[i3 + 1] += velocities[i3 + 1]
        positions[i3 + 2] += velocities[i3 + 2]
      }
      
      geometry.attributes.position.needsUpdate = true

      // Animate innermost core particles
      const innerCorePositions = innerCoreGeometry.attributes.position.array
      const innerMouseForce = 0.2
      const innerReturnForce = 0.03
      const innerFriction = 0.92
      
      for (let i = 0; i < innerCoreVertexNum; i++) {
        const i3 = i * 3
        
        const x = innerCorePositions[i3]
        const y = innerCorePositions[i3 + 1]
        const z = innerCorePositions[i3 + 2]
        
        const ox = innerCoreOriginalPositions[i3]
        const oy = innerCoreOriginalPositions[i3 + 1]
        const oz = innerCoreOriginalPositions[i3 + 2]
        
        // Mouse interaction
        const mouseX = mouseRef.current.x * 2
        const mouseY = mouseRef.current.y * 2
        const dx = x - mouseX
        const dy = y - mouseY
        const distance = Math.sqrt(dx * dx + dy * dy + z * z)
        
        if (distance < 1.0) {
          const force = (1.0 - distance) * innerMouseForce
          innerCoreVelocities[i3] += (dx / distance) * force
          innerCoreVelocities[i3 + 1] += (dy / distance) * force
          innerCoreVelocities[i3 + 2] += (z / distance) * force * 0.5
        }
        
        // Pulsing energy effect
        let pulseForce = Math.sin(time * 3 + i * 0.1) * 0.008
        
        // Audio-reactive boost when speaking
        if (state === 'speaking' && audioFrequencyRef.current > 0.1) {
          pulseForce *= (1 + audioFrequencyRef.current * 4)
        }
        
        const dist = Math.sqrt(x*x + y*y + z*z)
        if (dist > 0) {
          innerCoreVelocities[i3] += (x / dist) * pulseForce
          innerCoreVelocities[i3 + 1] += (y / dist) * pulseForce
          innerCoreVelocities[i3 + 2] += (z / dist) * pulseForce
        }
        
        // Return to original position
        innerCoreVelocities[i3] += (ox - x) * innerReturnForce
        innerCoreVelocities[i3 + 1] += (oy - y) * innerReturnForce
        innerCoreVelocities[i3 + 2] += (oz - z) * innerReturnForce
        
        // Apply friction
        innerCoreVelocities[i3] *= innerFriction
        innerCoreVelocities[i3 + 1] *= innerFriction
        innerCoreVelocities[i3 + 2] *= innerFriction
        
        // Update position
        innerCorePositions[i3] += innerCoreVelocities[i3]
        innerCorePositions[i3 + 1] += innerCoreVelocities[i3 + 1]
        innerCorePositions[i3 + 2] += innerCoreVelocities[i3 + 2]
      }
      
      innerCoreGeometry.attributes.position.needsUpdate = true
      innerCoreParticles.rotation.x = rotationRef.current.x
      innerCoreParticles.rotation.y = rotationRef.current.y
      
      // Animate outer glow particles
      const glowPositions = glowGeometry.attributes.position.array
      const glowMouseForce = 0.25
      const glowReturnForce = 0.025
      const glowFriction = 0.93
      
      for (let i = 0; i < glowVertexNum; i++) {
        const i3 = i * 3
        
        const x = glowPositions[i3]
        const y = glowPositions[i3 + 1]
        const z = glowPositions[i3 + 2]
        
        const ox = glowOriginalPositions[i3]
        const oy = glowOriginalPositions[i3 + 1]
        const oz = glowOriginalPositions[i3 + 2]
        
        // Mouse interaction
        const mouseX = mouseRef.current.x * 2
        const mouseY = mouseRef.current.y * 2
        const dx = x - mouseX
        const dy = y - mouseY
        const distance = Math.sqrt(dx * dx + dy * dy + z * z)
        
        if (distance < 1.2) {
          const force = (1.2 - distance) * glowMouseForce
          glowVelocities[i3] += (dx / distance) * force
          glowVelocities[i3 + 1] += (dy / distance) * force
          glowVelocities[i3 + 2] += (z / distance) * force * 0.5
        }
        
        // Gentle pulsing effect
        let pulseForce = Math.sin(time * 3 + i * 0.1) * 0.008
        
        // Audio-reactive boost when speaking
        if (state === 'speaking' && audioFrequencyRef.current > 0.1) {
          pulseForce *= (1 + audioFrequencyRef.current * 4)
        }
        
        const dist = Math.sqrt(x*x + y*y + z*z)
        if (dist > 0) {
          glowVelocities[i3] += (x / dist) * pulseForce
          glowVelocities[i3 + 1] += (y / dist) * pulseForce
          glowVelocities[i3 + 2] += (z / dist) * pulseForce
        }
        
        // Return to original position
        glowVelocities[i3] += (ox - x) * glowReturnForce
        glowVelocities[i3 + 1] += (oy - y) * glowReturnForce
        glowVelocities[i3 + 2] += (oz - z) * glowReturnForce
        
        // Apply friction
        glowVelocities[i3] *= glowFriction
        glowVelocities[i3 + 1] *= glowFriction
        glowVelocities[i3 + 2] *= glowFriction
        
        // Update position
        glowPositions[i3] += glowVelocities[i3]
        glowPositions[i3 + 1] += glowVelocities[i3 + 1]
        glowPositions[i3 + 2] += glowVelocities[i3 + 2]
      }
      
      glowGeometry.attributes.position.needsUpdate = true
      glowParticles.rotation.x = rotationRef.current.x
      glowParticles.rotation.y = rotationRef.current.y

      // Apply user rotation from dragging
      group.rotation.x = rotationRef.current.x
      group.rotation.y = rotationRef.current.y
      
      // Add subtle auto-rotation when not dragging
      if (!isDraggingRef.current) {
        targetRotationRef.current.y += 0.001
      }

      renderer.render(scene, camera)
      frameRef.current = requestAnimationFrame(animate)
    }
    animate()

    function onResize() {
      if (!el) return
      camera.aspect = el.clientWidth / el.clientHeight
      camera.updateProjectionMatrix()
      renderer.setSize(el.clientWidth, el.clientHeight)
    }
    window.addEventListener('resize', onResize)

    return () => {
      cancelAnimationFrame(frameRef.current)
      window.removeEventListener('resize', onResize)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mousedown', onMouseDown)
      window.removeEventListener('mouseup', onMouseUp)
      renderer.dispose()
      if (el.contains(renderer.domElement)) {
        el.removeChild(renderer.domElement)
      }
    }
  }, [state, intensity])

  return (
    <div ref={mountRef} className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ width: '100vw', height: '100vh' }} />
  )
}
