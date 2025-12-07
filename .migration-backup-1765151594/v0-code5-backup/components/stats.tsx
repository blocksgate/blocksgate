"use client"

import { useEffect, useRef, useState } from "react"

export function Stats() {
  const stats = [
    { label: "Total Liquidity", value: "$2.4B", change: "+12.5%", border: "neon-border-cyan" },
    { label: "Daily Volume", value: "$450M", change: "+8.2%", border: "neon-border-pink" },
    { label: "Supported Tokens", value: "1,200+", change: "+45", border: "neon-border-purple" },
    { label: "Average Slippage", value: "0.03%", change: "-0.01%", border: "neon-border-cyan" },
  ]

  return (
    <section
      id="analytics"
      className="py-24 px-4 sm:px-6 lg:px-8 bg-black border-t border-cyan-500/20 relative overflow-hidden"
    >
      <div className="absolute inset-0 grid-background opacity-10 pointer-events-none"></div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <StatCard key={index} stat={stat} index={index} />
          ))}
        </div>
      </div>
    </section>
  )
}

interface StatCardProps {
  stat: any
  index: number
}

function StatCard({ stat, index }: StatCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [isInView, setIsInView] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true)
        }
      },
      { threshold: 0.1 },
    )

    if (cardRef.current) {
      observer.observe(cardRef.current)
    }

    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={cardRef}
      className={`${stat.border} bg-black p-8 hover:shadow-2xl transition-all duration-300 group relative overflow-hidden`}
      style={{
        opacity: isInView ? 1 : 0.3,
        transform: isInView ? "translateY(0)" : "translateY(20px)",
        transition: `all 0.6s ease-out ${index * 100}ms`,
      }}
    >
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-pink-500/20 blur-xl animate-pulse" />
      </div>

      <div className="text-xs text-gray-400 mb-4 font-bold uppercase tracking-wider relative z-10">{stat.label}</div>

      <div className="text-4xl font-black text-white mb-3 group-hover:gradient-cyan-neon transition relative z-10">
        {stat.value}
      </div>

      <div className="flex items-center gap-2">
        <span className={`text-sm font-bold ${stat.change.startsWith("-") ? "text-red-400" : "text-green-400"}`}>
          {stat.change.startsWith("-") ? "↓" : "↑"} {stat.change}
        </span>
        <div
          className={`w-2 h-2 rounded-full ${stat.change.startsWith("-") ? "bg-red-400" : "bg-green-400"} animate-pulse`}
          style={{
            animationDelay: `${index * 0.2}s`,
          }}
        />
      </div>
    </div>
  )
}
