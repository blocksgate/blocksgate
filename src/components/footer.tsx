"use client"

import Link from "next/link"
import { useEffect, useRef, useState } from "react"

export function Footer() {
  const footerRef = useRef<HTMLElement>(null)
  const [isInView, setIsInView] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true)
        }
      },
      { threshold: 0.2 },
    )

    if (footerRef.current) {
      observer.observe(footerRef.current)
    }

    return () => observer.disconnect()
  }, [])

  return (
    <footer ref={footerRef} className="border-t border-cyan-500/20 bg-black py-16 relative overflow-hidden">
      <div className="absolute inset-0 grid-background opacity-5 pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid md:grid-cols-4 gap-12 mb-12">
          {/* Logo section */}
          <div
            className="neon-border-cyan bg-black p-6 rounded-lg"
            style={{
              opacity: isInView ? 1 : 0,
              transform: isInView ? "translateY(0)" : "translateY(20px)",
              transition: "all 0.6s ease-out",
            }}
          >
            <h3 className="text-2xl font-black text-white mb-3 gradient-neon">ogdefi</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              The future of decentralized finance, powered by 0x Protocol.
            </p>
          </div>

          {/* Product column */}
          <div
            style={{
              opacity: isInView ? 1 : 0,
              transform: isInView ? "translateY(0)" : "translateY(20px)",
              transition: "all 0.6s ease-out 100ms",
            }}
          >
            <h4 className="text-sm font-black text-cyan-400 mb-6 uppercase tracking-wider border-b border-cyan-500/30 pb-3">
              Product
            </h4>
            <ul className="space-y-3">
              {["Trading", "Pools", "API"].map((item) => (
                <li key={item}>
                  <Link
                    href="#"
                    className="text-gray-400 hover:text-cyan-400 text-sm transition duration-300 hover:translate-x-1 inline-block"
                  >
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Developers column */}
          <div
            style={{
              opacity: isInView ? 1 : 0,
              transform: isInView ? "translateY(0)" : "translateY(20px)",
              transition: "all 0.6s ease-out 200ms",
            }}
          >
            <h4 className="text-sm font-black text-pink-400 mb-6 uppercase tracking-wider border-b border-pink-500/30 pb-3">
              Developers
            </h4>
            <ul className="space-y-3">
              {["Docs", "GitHub", "SDK"].map((item) => (
                <li key={item}>
                  <Link
                    href="#"
                    className="text-gray-400 hover:text-pink-400 text-sm transition duration-300 hover:translate-x-1 inline-block"
                  >
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal column */}
          <div
            style={{
              opacity: isInView ? 1 : 0,
              transform: isInView ? "translateY(0)" : "translateY(20px)",
              transition: "all 0.6s ease-out 300ms",
            }}
          >
            <h4 className="text-sm font-black text-purple-400 mb-6 uppercase tracking-wider border-b border-purple-500/30 pb-3">
              Legal
            </h4>
            <ul className="space-y-3">
              {["Terms", "Privacy", "Security"].map((item) => (
                <li key={item}>
                  <Link
                    href="#"
                    className="text-gray-400 hover:text-purple-400 text-sm transition duration-300 hover:translate-x-1 inline-block"
                  >
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-cyan-500/20 pt-8">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-6">
            <p className="text-gray-400 text-sm">© 2025 ogdefi. Built on 0x Protocol.</p>
            <div className="flex gap-8">
              {["Twitter", "Discord", "Telegram"].map((link, index) => (
                <Link
                  key={link}
                  href="#"
                  className="text-gray-400 hover:text-cyan-400 text-sm transition duration-300 relative group"
                  style={{
                    animation: isInView ? `float-up 3s ease-in-out ${index * 0.2}s infinite` : "none",
                  }}
                >
                  {link}
                  <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-cyan-400 to-pink-500 group-hover:w-full transition-all duration-300" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
