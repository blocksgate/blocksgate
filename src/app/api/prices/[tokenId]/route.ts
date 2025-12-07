import { type NextRequest, NextResponse } from "next/server"
import { priceFeed } from "@/lib/price-feed"

export async function GET(request: NextRequest, { params }: { params: Promise<{ tokenId: string }> }) {
  try {
    const { tokenId } = await params
    const tokenData = await priceFeed.getTokenData(tokenId)
    return NextResponse.json(tokenData)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch token data" },
      { status: 500 },
    )
  }
}
