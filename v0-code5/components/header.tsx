"use client"

import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useState } from "react"

export function Header() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <header className="fixed top-0 w-full z-50">
      <div className="absolute inset-0 neon-border opacity-75 pointer-events-none" />
      <div className="absolute inset-0 glass-morphism" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2 group relative z-10">
            <div className="w-8 h-8 rounded-lg neon-border-cyan flex items-center justify-center glow-cyan transition-all duration-300 group-hover:scale-110">
              <span className="text-cyan-400 font-bold text-lg neon-flicker">◆</span>
            </div>
            <span className="text-lg font-bold text-white group-hover:text-cyan-400 transition-colors duration-300">
              ogdefi
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-12 absolute left-1/2 -translate-x-1/2 relative z-10">
            <Link
              href="#features"
              className="text-sm text-gray-300 hover:text-cyan-400 transition duration-300 relative group"
            >
              Features
              <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-cyan-400 to-pink-500 group-hover:w-full transition-all duration-300" />
            </Link>
            <Link
              href="#docs"
              className="text-sm text-gray-300 hover:text-cyan-400 transition duration-300 relative group"
            >
              Docs
              <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-cyan-400 to-pink-500 group-hover:w-full transition-all duration-300" />
            </Link>
            <Link
              href="https://0x.org"
              target="_blank"
              className="text-sm text-gray-300 hover:text-cyan-400 transition duration-300 relative group"
            >
              0x Protocol
              <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-cyan-400 to-pink-500 group-hover:w-full transition-all duration-300" />
            </Link>
          </nav>

          <div className="flex items-center gap-3 relative z-10">
            <Button
              variant="ghost"
              className="text-gray-300 hover:text-cyan-400 border border-cyan-500/40 hover:border-cyan-400 bg-transparent hover:bg-cyan-500/10 text-sm transition duration-300 hover:shadow-lg hover:shadow-cyan-500/30"
            >
              Connect
            </Button>
            <Link href="/dashboard">
              <Button className="neon-border-cyan bg-black text-cyan-400 font-bold text-sm hover:shadow-lg hover:shadow-cyan-500/50 transition-all duration-300 hover:scale-105">
                Launch
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </header>
  )
}
