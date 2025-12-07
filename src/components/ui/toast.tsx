"use client"

import { Toaster as SonnerToaster } from "sonner"

export function Toaster() {
  return (
    <SonnerToaster
      position="top-right"
      expand={true}
      richColors={true}
      closeButton={true}
      toastOptions={{
        style: {
          background: "hsl(var(--background))",
          border: "1px solid hsl(var(--border))",
          color: "hsl(var(--foreground))",
        },
        className: "toast",
      }}
    />
  )
}

