"use client"

import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useEffect, useRef } from "react"

export function Hero() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    canvas.width = canvas.offsetWidth * window.devicePixelRatio
    canvas.height = canvas.offsetHeight * window.devicePixelRatio
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio)

    const particles: Array<{
      x: number
      y: number
      vx: number
      vy: number
      size: number
      color: string
      life: number
    }> = []

    const colors = ["#00f0ff", "#ff006e", "#8000ff", "#00ff88"]

    const createParticles = () => {
      if (particles.length < 40) {
        for (let i = 0; i < 2; i++) {
          particles.push({
            x: Math.random() * canvas.offsetWidth,
            y: Math.random() * canvas.offsetHeight,
            vx: (Math.random() - 0.5) * 2,
            vy: (Math.random() - 0.5) * 2,
            size: Math.random() * 3 + 1,
            color: colors[Math.floor(Math.random() * colors.length)],
            life: 1,
          })
        }
      }
    }

    const animate = () => {
      ctx.fillStyle = "rgba(0, 0, 0, 0.05)"
      ctx.fillRect(0, 0, canvas.offsetWidth, canvas.offsetHeight)

      createParticles()

      particles.forEach((particle, index) => {
        particle.x += particle.vx
        particle.y += particle.vy
        particle.life -= 0.005

        if (particle.life <= 0) {
          particles.splice(index, 1)
          return
        }

        ctx.fillStyle = particle.color
        ctx.globalAlpha = particle.life * 0.6
        ctx.beginPath()
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2)
        ctx.fill()
        ctx.globalAlpha = 1
      })

      // Draw connection lines between nearby particles
      particles.forEach((particle, i) => {
        particles.slice(i + 1).forEach((otherParticle) => {
          const dx = particle.x - otherParticle.x
          const dy = particle.y - otherParticle.y
          const distance = Math.sqrt(dx * dx + dy * dy)

          if (distance < 150) {
            ctx.strokeStyle = particle.color
            ctx.globalAlpha = (1 - distance / 150) * particle.life * 0.3
            ctx.lineWidth = 0.5
            ctx.beginPath()
            ctx.moveTo(particle.x, particle.y)
            ctx.lineTo(otherParticle.x, otherParticle.y)
            ctx.stroke()
            ctx.globalAlpha = 1
          }
        })
      })

      requestAnimationFrame(animate)
    }

    animate()
  }, [])

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
      <canvas ref={canvasRef} className="absolute inset-0 z-0 w-full h-full" style={{ filter: "blur(1px)" }} />

      <div className="absolute inset-0 z-0 grid-background opacity-20"></div>

      {/* Animated background elements */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/20 rounded-full mix-blend-screen filter blur-3xl opacity-40 animate-pulse"></div>
        <div
          className="absolute top-1/3 right-1/4 w-96 h-96 bg-pink-500/20 rounded-full mix-blend-screen filter blur-3xl opacity-40 animate-pulse"
          style={{ animationDelay: "1s" }}
        ></div>
        <div
          className="absolute bottom-1/4 left-1/2 w-96 h-96 bg-purple-500/20 rounded-full mix-blend-screen filter blur-3xl opacity-30"
          style={{ animationDelay: "2s" }}
        ></div>
      </div>

      {/* Floating neon particles */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        {[...Array(8)].map((_, i) => {
          // Use a deterministic seed based on index to avoid hydration mismatch
          // This ensures server and client render the same positions
          const seed = i * 0.618033988749895 // Golden ratio for better distribution
          const left = ((seed * 100) % 100).toFixed(2)
          const top = (((seed * 1.618033988749895) * 100) % 100).toFixed(2)
          
          return (
            <div
              key={i}
              className="absolute w-1 h-1 bg-cyan-400 rounded-full opacity-70 float-particle"
              style={{
                left: `${left}%`,
                top: `${top}%`,
                animationDelay: `${i * 0.75}s`,
              }}
            ></div>
          )
        })}
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="mb-8 inline-block">
          <div className="neon-border-cyan px-4 py-2 bg-black">
            <span className="text-xs text-cyan-400 font-bold tracking-widest">NEXT GENERATION DEFI</span>
          </div>
        </div>

        <h1 className="text-6xl sm:text-7xl lg:text-8xl font-black mb-6 leading-tight text-white">
          Secure and
          <br />
          <span className="gradient-neon">Powerful</span>
        </h1>

        <p className="text-lg sm:text-xl text-gray-400 mb-12 max-w-2xl mx-auto leading-relaxed">
          Experience next-generation DeFi with enterprise-grade security. Trade tokens, manage portfolios, and execute
          advanced strategies powered by 0x Protocol infrastructure.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-20">
          <Link href="/dashboard">
            <Button className="w-full sm:w-auto h-13 px-10 neon-border-cyan bg-black text-cyan-400 font-bold text-base hover:shadow-lg hover:shadow-cyan-500/60 transition duration-300 hover:scale-105">
              Start Trading
            </Button>
          </Link>
          <Button className="w-full sm:w-auto h-13 px-10 neon-border-pink bg-black text-pink-400 font-bold text-base hover:shadow-lg hover:shadow-pink-500/60 transition duration-300 hover:scale-105">
            View Docs
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-4xl mx-auto">
          {[
            { value: "$2.4B", label: "Total Volume Traded" },
            { value: "50K+", label: "Active Traders" },
            { value: "0.02%", label: "Average Fee" },
          ].map((stat, i) => (
            <div
              key={i}
              className="neon-border-cyan bg-black p-6 hover:shadow-lg hover:shadow-cyan-500/40 transition group hover:scale-105 duration-300"
            >
              <div className="text-4xl font-black gradient-cyan-neon mb-2">{stat.value}</div>
              <div className="text-xs text-gray-400 font-medium uppercase tracking-wide">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
