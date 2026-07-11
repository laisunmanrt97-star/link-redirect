import { useEffect, useRef } from 'react'

interface Particle {
  angle: number
  radius: number
  baseRadius: number
  y: number
  size: number
  speed: number
  opacity: number
  pulse: number
  pulseSpeed: number
  orbitSpeed: number
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
    let time = 0

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      initParticles()
    }

    const initParticles = () => {
      const count = Math.min(Math.floor((canvas.width * canvas.height) / 10000), 150)
      const centerY = canvas.height / 2
      const maxRadius = Math.min(canvas.width, canvas.height) * 0.45

      particles = Array.from({ length: count }, () => {
        const radius = Math.random() * maxRadius
        return {
          angle: Math.random() * Math.PI * 2 + (radius / maxRadius) * Math.PI * 0.5, // spiral offset
          radius,
          baseRadius: radius,
          y: centerY + (Math.random() - 0.5) * maxRadius * 0.4,
          size: Math.random() * 2.2 + 0.3,
          speed: 0.001 + (1 - radius / maxRadius) * 0.003, // inner orbits faster
          opacity: Math.random() * 0.4 + 0.1,
          pulse: Math.random() * Math.PI * 2,
          pulseSpeed: Math.random() * 0.008 + 0.002,
          orbitSpeed: 0.0008 + Math.random() * 0.0008,
        }
      })
    }

    const draw = () => {
      time += 0.002
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      const centerX = canvas.width / 2
      const centerY = canvas.height / 2

      // center glow
      const cg = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 80)
      cg.addColorStop(0, 'rgba(0, 229, 255, 0.04)')
      cg.addColorStop(0.5, 'rgba(0, 229, 255, 0.02)')
      cg.addColorStop(1, 'rgba(0, 229, 255, 0)')
      ctx.fillStyle = cg
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      for (const p of particles) {
        p.pulse += p.pulseSpeed

        // Spiral rotation
        p.angle += p.speed
        p.radius = p.baseRadius + Math.sin(time * 2 + p.baseRadius * 0.1) * p.baseRadius * 0.015
        p.y += Math.sin(time + p.angle) * 0.08

        const x = centerX + Math.cos(p.angle) * p.radius
        const y = p.y + Math.sin(p.angle) * p.radius * 0.4 // squash for galaxy tilt

        const pulseOpacity = p.opacity + Math.sin(p.pulse) * 0.15
        const alpha = Math.max(0.04, Math.min(0.6, pulseOpacity))
        const distFromCenter = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2)
        const brightness = Math.max(0.3, 1 - distFromCenter / (Math.min(canvas.width, canvas.height) * 0.5))

        // star
        ctx.beginPath()
        ctx.arc(x, y, p.size * brightness, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(0, 229, 255, ${alpha * brightness})`
        ctx.fill()

        // glow on brighter stars
        if (brightness > 0.6) {
          ctx.beginPath()
          ctx.arc(x, y, p.size * brightness * 4, 0, Math.PI * 2)
          ctx.fillStyle = `rgba(0, 229, 255, ${alpha * brightness * 0.06})`
          ctx.fill()
        }
      }

      // connection lines — near particles across the spiral arms
      const px: [number, number, number][] = particles.map((p) => {
        const x = centerX + Math.cos(p.angle) * p.radius
        const y = p.y + Math.sin(p.angle) * p.radius * 0.4
        return [x, y, p.radius]
      })

      const connectionDist = 90
      for (let i = 0; i < px.length; i++) {
        for (let j = i + 1; j < px.length; j++) {
          const dx = px[i][0] - px[j][0]
          const dy = px[i][1] - px[j][1]
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < connectionDist) {
            const alpha = (1 - dist / connectionDist) * 0.08
            ctx.beginPath()
            ctx.moveTo(px[i][0], px[i][1])
            ctx.lineTo(px[j][0], px[j][1])
            ctx.strokeStyle = `rgba(0, 229, 255, ${alpha})`
            ctx.lineWidth = 0.4
            ctx.stroke()
          }
        }
      }

      animId = requestAnimationFrame(draw)
    }

    window.addEventListener('resize', resize)
    resize()
    draw()

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 0 }}
    />
  )
}
