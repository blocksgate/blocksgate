import { describe, it, expect, beforeEach, vi } from 'vitest'
import { RpcManager } from '../lib/rpc-manager'

describe('RpcManager', () => {
  let originalFetch: any

  beforeEach(() => {
    originalFetch = global.fetch
    // mock fetch to simulate RPC provider returning JSON-RPC responses
    global.fetch = vi.fn(async (url: any, opts: any) => {
      return {
        ok: true,
        json: async () => ({ jsonrpc: '2.0', result: '0x10', id: 1 }),
      }
    }) as any
  })

  afterEach(() => {
    global.fetch = originalFetch
  })

  it('calls provider and returns block number', async () => {
    const manager = new RpcManager(1)
    const block = await manager.getBlockNumber()
    expect(block).toBeDefined()
    expect(typeof block).toBe('string')
  })
})
