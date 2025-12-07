"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { ChevronDown } from "lucide-react"
import { useState } from "react"

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: "📊" },
  {
    name: "Trading",
    icon: "🔄",
    submenu: [
      { name: "Swap", href: "/dashboard/swap" },
      { name: "Advanced Swaps", href: "/dashboard/advanced-swaps" },
      { name: "Limit Orders", href: "/dashboard/limit-orders" },
    ],
  },
  {
    name: "Liquidity",
    icon: "💧",
    submenu: [
      { name: "Pools", href: "/dashboard/pools" },
      { name: "Cross-chain", href: "/dashboard/cross-chain" },
    ],
  },
  {
    name: "Analytics & Insights",
    icon: "📈",
    submenu: [
      { name: "Trading Analytics", href: "/dashboard/analytics" },
      { name: "Arbitrage Monitor", href: "/dashboard/arbitrage" },
      { name: "Flash Swaps", href: "/dashboard/flash-swaps" },
    ],
  },
  {
    name: "Automation",
    icon: "🤖",
    submenu: [{ name: "Trading Bot", href: "/dashboard/trading-bot" }],
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const [expandedMenu, setExpandedMenu] = useState<string | null>(null)

  const getExpandedMenus = () => {
    for (const item of navigation) {
      if (item.submenu) {
        if (item.submenu.some((sub) => pathname.startsWith(sub.href))) {
          return item.name
        }
      }
    }
    return null
  }

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-gradient-to-b from-black to-gray-950 border-r border-white/10 hidden md:flex flex-col">
      <div className="p-6 border-b border-white/10">
        <Link
          href="/"
          className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent"
        >
          ogdefi
        </Link>
      </div>

      <nav className="flex-1 overflow-auto p-4 space-y-2">
        {navigation.map((item) => {
          const isActive =
            pathname === item.href || (item.submenu && item.submenu.some((sub) => pathname.startsWith(sub.href)))
          const isExpanded = expandedMenu === item.name || getExpandedMenus() === item.name

          return (
            <div key={item.name}>
              {item.submenu ? (
                <>
                  <button
                    onClick={() => setExpandedMenu(isExpanded ? null : item.name)}
                    className={cn(
                      "w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg transition-colors",
                      isActive
                        ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                        : "text-gray-400 hover:text-white hover:bg-white/5",
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{item.icon}</span>
                      <span className="text-sm font-medium">{item.name}</span>
                    </div>
                    <ChevronDown size={16} className={cn("transition-transform", isExpanded ? "rotate-180" : "")} />
                  </button>

                  {isExpanded && (
                    <div className="ml-8 space-y-1 mt-1">
                      {item.submenu.map((subitem) => {
                        const isSubActive = pathname === subitem.href
                        return (
                          <Link
                            key={subitem.href}
                            href={subitem.href}
                            className={cn(
                              "flex items-center gap-3 px-4 py-2 rounded-lg text-sm transition-colors",
                              isSubActive
                                ? "text-pink-400 bg-white/5"
                                : "text-gray-400 hover:text-white hover:bg-white/5",
                            )}
                          >
                            <span className="w-1 h-1 rounded-full bg-current"></span>
                            {subitem.name}
                          </Link>
                        )
                      })}
                    </div>
                  )}
                </>
              ) : (
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                    pathname === item.href
                      ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                      : "text-gray-400 hover:text-white hover:bg-white/5",
                  )}
                >
                  <span className="text-xl">{item.icon}</span>
                  <span className="text-sm font-medium">{item.name}</span>
                </Link>
              )}
            </div>
          )
        })}
      </nav>

      <div className="p-4 border-t border-white/10">
        <div className="glass-effect rounded-lg p-4 text-center">
          <div className="text-sm text-gray-400 mb-2">Total Balance</div>
          <div className="text-2xl font-bold text-white">$12,450.80</div>
          <div className="text-xs text-green-400 mt-2">↑ 12.5% (24h)</div>
        </div>
      </div>
    </aside>
  )
}
