"use client"

import { useEffect, useRef, useState } from "react"

const features = [
  {
    title: "Token Swaps",
    description: "Best-in-class pricing powered by 0x Swap API",
    category: "Trading",
    border: "neon-border-cyan",
    icon: "⚡",
  },
  {
    title: "Gasless Swaps",
    description: "Zero gas fees via meta-transactions",
    category: "Trading",
    border: "neon-border-pink",
    icon: "🔥",
  },
  {
    title: "Portfolio Analytics",
    description: "Real-time tracking with advanced metrics",
    category: "Analytics",
    border: "neon-border-cyan",
    icon: "📊",
  },
  {
    title: "Cross-Chain Trading",
    description: "Seamless multi-chain execution",
    category: "Advanced",
    border: "neon-border-purple",
    icon: "🌉",
  },
  {
    title: "Arbitrage Detection",
    description: "Automated opportunity discovery",
    category: "Advanced",
    border: "neon-border-pink",
    icon: "🎯",
  },
  {
    title: "Trading Bot",
    description: "Autonomous strategy execution",
    category: "Automation",
    border: "neon-border-cyan",
    icon: "🤖",
  },
]

interface FeatureCardProps {
  feature: (typeof features)[0]
  index: number
}

function FeatureCard({ feature, index }: FeatureCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [isHovered, setIsHovered] = useState(false)

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!cardRef.current || !isHovered) return

      const rect = cardRef.current.getBoundingClientRect()
      const x = e.clientX - rect.left - rect.width / 2
      const y = e.clientY - rect.top - rect.height / 2

      setMousePosition({ x: x / 20, y: y / 20 })
    }

    window.addEventListener("mousemove", handleMouseMove)
    return () => window.removeEventListener("mousemove", handleMouseMove)
  }, [isHovered])

  return (
    <div
      ref={cardRef}
      className={`${feature.border} bg-black p-8 group hover:shadow-2xl transition-all duration-300 cursor-pointer relative overflow-hidden`}
      style={{
        transform: isHovered
          ? `perspective(1000px) rotateX(${-mousePosition.y}deg) rotateY(${mousePosition.x}deg) scale(1.02)`
          : "none",
        transformStyle: "preserve-3d",
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false)
        setMousePosition({ x: 0, y: 0 })
      }}
    >
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-30 transition-opacity duration-300"
        style={{
          background: "linear-gradient(135deg, rgba(0,240,255,0.2), rgba(255,0,110,0.2))",
          transform: `translate(${mousePosition.x * 2}px, ${mousePosition.y * 2}px)`,
        }}
      />

      {/* Icon with glow */}
      <div className="text-5xl mb-6 transform group-hover:scale-110 transition-transform duration-300">
        {feature.icon}
      </div>

      {/* Category badge */}
      <div className="inline-block mb-6">
        <span className="text-xs font-black text-cyan-400 uppercase tracking-wider bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-500/30 group-hover:border-cyan-400 group-hover:bg-cyan-500/20 transition">
          {feature.category}
        </span>
      </div>

      {/* Title */}
      <h3 className="text-2xl font-black text-white mb-3 group-hover:text-cyan-400 transition relative z-10">
        {feature.title}
      </h3>

      {/* Description */}
      <p className="text-gray-400 leading-relaxed text-sm mb-6 relative z-10">{feature.description}</p>

      <div
        className="h-1 bg-gradient-to-r from-cyan-400 via-pink-500 to-purple-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"
        style={{
          transitionDelay: `${index * 50}ms`,
        }}
      />
    </div>
  )
}

export function Features() {
  return (
    <section id="features" className="py-32 px-4 sm:px-6 lg:px-8 bg-black relative overflow-hidden">
      <div className="absolute inset-0 grid-background opacity-20 pointer-events-none"></div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-24">
          <h2 className="text-6xl sm:text-7xl font-black mb-6 text-white">
            Everything you
            <br />
            <span className="gradient-neon">need to trade</span>
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Institutional-grade tools powered by 0x Protocol infrastructure
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <FeatureCard key={index} feature={feature} index={index} />
          ))}
        </div>
      </div>
    </section>
  )
}
