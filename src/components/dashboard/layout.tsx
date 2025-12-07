"use client"

import type React from "react"
import { Sidebar } from "./sidebar"
import { TopNav } from "./top-nav"

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="ml-0 md:ml-64 flex flex-col">
        <TopNav />
        <main className="flex-1 overflow-auto bg-gradient-to-b from-background to-background/50">
          <div className="p-6 md:p-8 max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  )
}
