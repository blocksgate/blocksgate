// Comprehensive error handling utility

export interface ErrorContext {
  userId?: string
  action?: string
  component?: string
  metadata?: Record<string, any>
}

export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public context?: ErrorContext,
    public cause?: Error
  ) {
    super(message)
    this.name = "AppError"
    Object.setPrototypeOf(this, AppError.prototype)
  }
}

export class ErrorHandler {
  /**
   * Handle and log errors with context
   */
  static handleError(error: unknown, context?: ErrorContext): AppError {
    let appError: AppError

    if (error instanceof AppError) {
      appError = error
    } else if (error instanceof Error) {
      appError = new AppError(
        error.message,
        "UNKNOWN_ERROR",
        500,
        context,
        error
      )
    } else {
      appError = new AppError(
        String(error),
        "UNKNOWN_ERROR",
        500,
        context
      )
    }

    // Log error
    this.logError(appError, context)

    // Send to error tracking (Sentry, etc.)
    this.trackError(appError, context)

    return appError
  }

  /**
   * Log error to console with structured format
   */
  private static logError(error: AppError, context?: ErrorContext): void {
    const logData = {
      error: {
        message: error.message,
        code: error.code,
        statusCode: error.statusCode,
        stack: error.stack,
      },
      context: context || {},
      timestamp: new Date().toISOString(),
    }

    if (error.statusCode >= 500) {
      console.error("[ErrorHandler] Server Error:", logData)
    } else {
      console.warn("[ErrorHandler] Client Error:", logData)
    }
  }

  /**
   * Track error in external service (Sentry, etc.)
   */
  private static trackError(error: AppError, context?: ErrorContext): void {
    if (typeof window !== "undefined" && (window as any).Sentry) {
      (window as any).Sentry.captureException(error, {
        tags: {
          errorCode: error.code,
          statusCode: error.statusCode.toString(),
        },
        extra: {
          context: context || {},
        },
      })
    }
  }

  /**
   * Get user-friendly error message
   */
  static getUserFriendlyMessage(error: AppError): string {
    const userMessages: Record<string, string> = {
      UNAUTHORIZED: "You are not authorized to perform this action",
      NOT_FOUND: "The requested resource was not found",
      VALIDATION_ERROR: "Please check your input and try again",
      NETWORK_ERROR: "Network error. Please check your connection",
      RATE_LIMIT_EXCEEDED: "Too many requests. Please try again later",
      INSUFFICIENT_BALANCE: "Insufficient balance for this transaction",
      TRANSACTION_FAILED: "Transaction failed. Please try again",
      QUOTE_EXPIRED: "Quote expired. Please get a new quote",
      SLIPPAGE_EXCEEDED: "Slippage tolerance exceeded",
      UNKNOWN_ERROR: "An unexpected error occurred. Please try again",
    }

    return userMessages[error.code] || error.message || "An error occurred"
  }

  /**
   * Create error from API response
   */
  static fromApiResponse(response: Response, context?: ErrorContext): AppError {
    const statusCode = response.status
    let code = "UNKNOWN_ERROR"

    switch (statusCode) {
      case 401:
        code = "UNAUTHORIZED"
        break
      case 403:
        code = "FORBIDDEN"
        break
      case 404:
        code = "NOT_FOUND"
        break
      case 429:
        code = "RATE_LIMIT_EXCEEDED"
        break
      case 400:
        code = "VALIDATION_ERROR"
        break
      case 500:
        code = "SERVER_ERROR"
        break
    }

    return new AppError(
      `API Error: ${response.statusText}`,
      code,
      statusCode,
      context
    )
  }

  /**
   * Create validation error
   */
  static validationError(message: string, field?: string): AppError {
    return new AppError(
      message,
      "VALIDATION_ERROR",
      400,
      { metadata: { field } }
    )
  }

  /**
   * Create network error
   */
  static networkError(message: string = "Network request failed"): AppError {
    return new AppError(message, "NETWORK_ERROR", 0)
  }

  /**
   * Create transaction error
   */
  static transactionError(message: string, txHash?: string): AppError {
    return new AppError(
      message,
      "TRANSACTION_FAILED",
      500,
      { metadata: { txHash } }
    )
  }

  /**
   * Retry logic wrapper
   */
  static async withRetry<T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    delay: number = 1000,
    context?: ErrorContext
  ): Promise<T> {
    let lastError: Error | null = null

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await fn()
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error))
        
        if (attempt === maxRetries) {
          throw this.handleError(lastError, context)
        }

        // Wait before retrying (exponential backoff)
        await new Promise((resolve) => setTimeout(resolve, delay * attempt))
      }
    }

    throw this.handleError(lastError || new Error("Retry failed"), context)
  }
}

// Export convenience functions
export const handleError = ErrorHandler.handleError.bind(ErrorHandler)
export const getUserFriendlyMessage = ErrorHandler.getUserFriendlyMessage.bind(ErrorHandler)
export const validationError = ErrorHandler.validationError.bind(ErrorHandler)
export const networkError = ErrorHandler.networkError.bind(ErrorHandler)
export const transactionError = ErrorHandler.transactionError.bind(ErrorHandler)
export const withRetry = ErrorHandler.withRetry.bind(ErrorHandler)

