import { describe, it, expect, beforeEach } from 'vitest'
import { getCachedPrice, setCachedPrice, clearPriceCache } from '../lib/price-cache'

describe('price-cache', () => {
  beforeEach(() => {
    clearPriceCache()
  })

  it('sets and gets cached price', () => {
    expect(getCachedPrice('token1')).toBeNull()
    setCachedPrice('token1', 123.45)
    expect(getCachedPrice('token1')).toBe(123.45)
  })

  it('clears cache for a token', () => {
    setCachedPrice('token2', 1)
    expect(getCachedPrice('token2')).toBe(1)
    clearPriceCache('token2')
    expect(getCachedPrice('token2')).toBeNull()
  })
})
