"use client"
import { Bell, Settings, Menu } from "lucide-react"
import { useState } from "react"
import { WalletButton } from "@/components/wallet-button"

export function TopNav() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <nav className="sticky top-0 z-40 bg-black/80 border-b border-white/10 backdrop-blur-md">
      <div className="px-4 md:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden text-gray-400 hover:text-white"
          >
            <Menu size={24} />
          </button>
          <h1 className="text-xl font-semibold text-white hidden sm:block">Dashboard</h1>
        </div>

        <div className="flex items-center gap-4">
          <button className="relative text-gray-400 hover:text-white transition">
            <Bell size={20} />
            <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>
          <WalletButton />
          <button className="text-gray-400 hover:text-white transition">
            <Settings size={20} />
          </button>
        </div>
      </div>
    </nav>
  )
}
