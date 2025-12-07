// Utility client for making authenticated API requests

export async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  // Use relative path for Next.js API routes
  const url = `/api${endpoint}`

  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    credentials: "include", // Include cookies for authentication
  })

  if (!response.ok) {
    try {
      const error = await response.json()
      throw new Error(error.error || error.message || `API request failed: ${response.status}`)
    } catch (e) {
      // If response is not JSON, throw generic error
      throw new Error(`API request failed: ${response.status} ${response.statusText}`)
    }
  }

  return response.json()
}

export function getTrades(limit = 50, offset = 0, status?: string) {
  const params = new URLSearchParams({
    limit: limit.toString(),
    offset: offset.toString(),
  })
  if (status) params.append("status", status)
  return apiRequest(`/trades?${params}`)
}

export function getPortfolio(chainId?: number) {
  const params = new URLSearchParams()
  if (chainId) params.append("chain_id", chainId.toString())
  return apiRequest(`/portfolio?${params}`)
}

export function getOrders(status?: string) {
  const params = new URLSearchParams()
  if (status) params.append("status", status)
  return apiRequest(`/orders?${params}`)
}

export function getProfile() {
  return apiRequest(`/profile`)
}

export function updateProfile(data: Record<string, unknown>) {
  return apiRequest(`/profile`, {
    method: "PATCH",
    body: JSON.stringify(data),
  })
}

export function createTrade(tradeData: Record<string, unknown>) {
  return apiRequest(`/trades`, {
    method: "POST",
    body: JSON.stringify(tradeData),
  })
}

export function updateTrade(id: string, tradeData: Record<string, unknown>) {
  return apiRequest(`/trades/${id}`, {
    method: "PATCH",
    body: JSON.stringify(tradeData),
  })
}

export function updatePortfolio(portfolioData: Record<string, unknown>) {
  return apiRequest(`/portfolio`, {
    method: "POST",
    body: JSON.stringify(portfolioData),
  })
}

export function createOrder(orderData: Record<string, unknown>) {
  return apiRequest(`/orders`, {
    method: "POST",
    body: JSON.stringify(orderData),
  })
}

export function getPortfolioAnalytics() {
  return apiRequest(`/analytics/portfolio`)
}
