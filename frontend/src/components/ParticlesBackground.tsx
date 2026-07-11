import { useEffect, useRef } from 'react'

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  baseSize: number
  opacity: number
  pulse: number
  pulseSpeed: number
  angle: number
  orbitRadius: number
  orbitSpeed: number
  centerX: number
  centerY: number
}

export function ParticlesBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animId: number
    let particles: Particle[] = []
    const mouse = { x: -9999, y: -9999, active: false }

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      initParticles()
    }

    const initParticles = () => {
      const w = canvas.width
      const h = canvas.height
      const count = Math.min(Math.floor((w * h) / 8000), 200)
      const centerX = w / 2
      const centerY = h / 2

      particles = Array.from({ length: count }, () => {
        const angle = Math.random() * Math.PI * 2
        const orbitRadius = Math.random() * Math.min(w, h) * 0.45
        const orbitSpeed = (0.0003 + Math.random() * 0.0008) * (Math.random() > 0.5 ? 1 : -1)

        return {
          x: centerX + Math.cos(angle) * orbitRadius,
          y: centerY + Math.sin(angle) * orbitRadius * 0.35,
          vx: 0,
          vy: 0,
          size: Math.random() * 2 + 0.5,
          baseSize: Math.random() * 2 + 0.5,
          opacity: Math.random() * 0.4 + 0.15,
          pulse: Math.random() * Math.PI * 2,
          pulseSpeed: Math.random() * 0.008 + 0.002,
          angle,
          orbitRadius,
          orbitSpeed,
          centerX: centerX + (Math.random() - 0.5) * w * 0.2,
          centerY: centerY + (Math.random() - 0.5) * h * 0.2,
        }
      })
    }

    const draw = () => {
      const w = canvas.width
      const h = canvas.height
      ctx.clearRect(0, 0, w, h)

      // center glow
      const cg = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.min(w, h) * 0.3)
      cg.addColorStop(0, 'rgba(0, 229, 255, 0.03)')
      cg.addColorStop(0.5, 'rgba(0, 229, 255, 0.015)')
      cg.addColorStop(1, 'rgba(0, 229, 255, 0)')
      ctx.fillStyle = cg
      ctx.fillRect(0, 0, w, h)

      // mouse influence
      const mInfX = mouse.active ? mouse.x : w / 2
      const mInfY = mouse.active ? mouse.y : h / 2
      const mRadius = Math.min(w, h) * 0.15

      for (const p of particles) {
        p.pulse += p.pulseSpeed

        // orbital motion
        p.angle += p.orbitSpeed
        const targetX = p.centerX + Math.cos(p.angle) * p.orbitRadius
        const targetY = p.centerY + Math.sin(p.angle) * p.orbitRadius * 0.35

        // mouse interaction — gentle attraction
        const dx = mInfX - p.x
        const dy = mInfY - p.y
        const dist = Math.sqrt(dx * dx + dy * dy)
        let attractX = 0
        let attractY = 0
        if (dist < mRadius && mouse.active) {
          const force = (1 - dist / mRadius) * 0.015
          attractX = dx * force
          attractY = dy * force
        }

        // elastic toward orbital target
        p.vx += (targetX - p.x) * 0.005 + attractX
        p.vy += (targetY - p.y) * 0.005 + attractY
        p.vx *= 0.94
        p.vy *= 0.94
        p.x += p.vx
        p.y += p.vy

        const pulseOpacity = p.opacity + Math.sin(p.pulse) * 0.12
        const alpha = Math.max(0.04, Math.min(0.6, pulseOpacity))

        // size pulse
        const sizePulse = 1 + Math.sin(p.pulse) * 0.3
        const sz = p.baseSize * sizePulse

        // star
        ctx.beginPath()
        ctx.arc(p.x, p.y, sz, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(0, 229, 255, ${alpha})`
        ctx.fill()

        // glow on bigger
        if (sz > 1.5) {
          ctx.beginPath()
          ctx.arc(p.x, p.y, sz * 3.5, 0, Math.PI * 2)
          ctx.fillStyle = `rgba(0, 229, 255, ${alpha * 0.06})`
          ctx.fill()
        }
      }

      // connection lines
      const connectionDist = 100
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x
          const dy = particles[i].y - particles[j].y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < connectionDist) {
            const alpha = (1 - dist / connectionDist) * 0.08
            ctx.beginPath()
            ctx.moveTo(particles[i].x, particles[i].y)
            ctx.lineTo(particles[j].x, particles[j].y)
            ctx.strokeStyle = `rgba(0, 229, 255, ${alpha})`
            ctx.lineWidth = 0.4
            ctx.stroke()
          }
        }
      }

      animId = requestAnimationFrame(draw)
    }

    const onMouse = (e: MouseEvent) => {
      mouse.x = e.clientX
      mouse.y = e.clientY
      mouse.active = true
    }
    const onLeave = () => { mouse.active = false }

    window.addEventListener('resize', resize)
    window.addEventListener('mousemove', onMouse)
    window.addEventListener('mouseout', onLeave)
    resize()
    draw()

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', resize)
      window.removeEventListener('mousemove', onMouse)
      window.removeEventListener('mouseout', onLeave)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0"
      style={{ zIndex: 0, width: '100vw', height: '100vh' }}
    />
  )
}
