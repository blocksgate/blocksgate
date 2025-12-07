import { NextResponse } from "next/server"

/**
 * WebSocket endpoint for real-time arbitrage opportunities
 * 
 * This endpoint provides Server-Sent Events (SSE) for real-time arbitrage updates
 * since Next.js API routes don't support WebSocket directly.
 * 
 * Alternative: Use a WebSocket server (e.g., Socket.io) for true WebSocket support
 */
export async function GET(request: Request) {
  // Check if this is an SSE request
  const acceptHeader = request.headers.get("accept")
  if (acceptHeader?.includes("text/event-stream")) {
    // Set up SSE headers
    const headers = new Headers({
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Cache-Control",
    })

    // Create a readable stream for SSE
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder()
        
        // Send initial connection message
        controller.enqueue(encoder.encode("data: {\"type\":\"connected\"}\n\n"))

        // Poll for arbitrage opportunities every 30 seconds (reduced frequency to avoid API rate limits)
        const interval = setInterval(async () => {
          try {
            // Import here to avoid circular dependencies
            const { detectArbitrageOpportunities } = await import("@/lib/arbitrage-detector")
            
            // Only detect if 0x API key is configured
            const hasApiKey = process.env.ZX_API_KEY || process.env.NEXT_PUBLIC_0X_API_KEY
            if (!hasApiKey) {
              // Send message that API key is needed
              controller.enqueue(encoder.encode(`data: {\"type\":\"info\",\"message\":\"0x API key not configured - arbitrage detection disabled\"}\n\n`))
              return
            }
            
            const opportunities = await detectArbitrageOpportunities(1, undefined, 0.5) // Increased min profit to 0.5%
            
            // Send opportunities as SSE events
            if (opportunities.length > 0) {
              for (const opp of opportunities) {
                const data = JSON.stringify({
                  type: "arbitrage_opportunity",
                  ...opp,
                })
                controller.enqueue(encoder.encode(`data: ${data}\n\n`))
              }
            } else {
              // Send heartbeat to keep connection alive
              controller.enqueue(encoder.encode(`data: {\"type\":\"heartbeat\",\"timestamp\":${Date.now()}}\n\n`))
            }
          } catch (error) {
            // Only log unexpected errors, not "no route" errors
            const errorMessage = error instanceof Error ? error.message : String(error)
            if (!errorMessage.includes("no Route") && !errorMessage.includes("No swap route")) {
              console.error("[Arbitrage SSE] Error:", error)
            }
            // Don't send error to client for expected errors
          }
        }, 30000) // Poll every 30 seconds to reduce API calls

        // Clean up on client disconnect
        request.signal.addEventListener("abort", () => {
          clearInterval(interval)
          controller.close()
        })
      },
    })

    return new Response(stream, { headers })
  }

  // Return regular JSON response for non-SSE requests
  return NextResponse.json({
    error: "This endpoint supports Server-Sent Events (SSE). Use Accept: text/event-stream header.",
    usage: "Connect with EventSource or fetch with Accept: text/event-stream header",
  })
}

