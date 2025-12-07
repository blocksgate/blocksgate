"use client"

import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useEffect, useRef, useState } from "react"

export function CTA() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isInView, setIsInView] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true)
        }
      },
      { threshold: 0.3 },
    )

    if (containerRef.current) {
      observer.observe(containerRef.current)
    }

    return () => observer.disconnect()
  }, [])

  return (
    <section
      id="cta"
      className="py-24 px-4 sm:px-6 lg:px-8 bg-black border-t border-cyan-500/20 relative overflow-hidden"
    >
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/4 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" />
        <div
          className="absolute top-1/3 right-1/4 w-72 h-72 bg-pink-500/10 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        />
      </div>

      <div className="max-w-3xl mx-auto relative z-10">
        <div
          ref={containerRef}
          className="neon-border bg-black p-12 text-center hover:shadow-2xl hover:shadow-purple-500/30 transition-all duration-300 group"
          style={{
            opacity: isInView ? 1 : 0.3,
            transform: isInView ? "scale(1)" : "scale(0.95)",
            transition: "all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)",
          }}
        >
          <div className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-300">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent skew-x-12 group-hover:translate-x-full transition-transform duration-1000" />
          </div>

          <div className="relative z-10">
            <h2 className="text-5xl sm:text-6xl font-black mb-6 text-white group-hover:gradient-neon transition-all duration-300">
              Ready to
              <br />
              <span className="gradient-neon">Transform Trading</span>
            </h2>
            <p className="text-gray-400 mb-10 text-lg leading-relaxed">
              Join thousands of traders and investors using ogdefi to manage their digital assets with confidence.
            </p>

            <Link href="/dashboard">
              <Button className="relative h-14 px-10 neon-border-pink bg-black text-pink-400 font-bold text-base hover:shadow-xl hover:shadow-pink-500/60 transition-all duration-300 group/btn overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-pink-500/20 to-purple-500/20 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300" />
                <span className="relative z-10">Launch App & Start Trading</span>
              </Button>
            </Link>
          </div>
        </div>

        <div className="mt-12 flex justify-center gap-8">
          <div className="w-12 h-0.5 bg-gradient-to-r from-transparent to-cyan-400 opacity-50 group-hover:opacity-100 transition-opacity" />
          <div className="w-1 h-1 rounded-full bg-cyan-400 opacity-50" />
          <div className="w-12 h-0.5 bg-gradient-to-l from-transparent to-pink-400 opacity-50 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>
    </section>
  )
}
