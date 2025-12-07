// Simple script to simulate arbitrage SSE streaming locally
import fetch from 'node-fetch'

const SSE_URL = process.env.ARB_SSE_URL || 'http://localhost:3000/api/arbitrage/opportunities?pairs=WETH/USDC|WBTC/USDC&interval=3000'

async function run() {
  const res = await fetch(SSE_URL)
  if (!res.body) throw new Error('No response body')

  res.body.on('data', (chunk: Buffer) => {
    const lines = chunk.toString().split('\n')
    for (const line of lines) {
      if (line.startsWith('data:')) {
        try {
          const payload = JSON.parse(line.replace('data: ', ''))
          console.log('Arbitrage opportunities:', payload)
        } catch (err) {
          console.warn('Failed to parse SSE data:', err)
        }
      }
    }
  })

  res.body.on('end', () => {
    console.log('SSE stream ended')
  })
}

run().catch((err) => {
  console.error('SSE demo error:', err)
})
