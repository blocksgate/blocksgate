// Structured logging utility with Sentry integration

import { captureException, captureMessage, addBreadcrumb } from "./sentry"

export enum LogLevel {
  DEBUG = "debug",
  INFO = "info",
  WARN = "warn",
  ERROR = "error",
}

interface LogContext {
  [key: string]: any
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === "development"

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString()
    const contextStr = context ? ` ${JSON.stringify(context)}` : ""
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`
  }

  private log(level: LogLevel, message: string, context?: LogContext, error?: Error) {
    const formattedMessage = this.formatMessage(level, message, context)

    // Add breadcrumb to Sentry
    addBreadcrumb(message, level, context)

    // Console logging
    switch (level) {
      case LogLevel.DEBUG:
        if (this.isDevelopment) {
          console.debug(formattedMessage)
        }
        break
      case LogLevel.INFO:
        console.info(formattedMessage)
        break
      case LogLevel.WARN:
        console.warn(formattedMessage)
        if (error) {
          captureMessage(message, "warning", context)
        }
        break
      case LogLevel.ERROR:
        console.error(formattedMessage, error)
        if (error) {
          captureException(error, context)
        } else {
          captureMessage(message, "error", context)
        }
        break
    }
  }

  debug(message: string, context?: LogContext) {
    this.log(LogLevel.DEBUG, message, context)
  }

  info(message: string, context?: LogContext) {
    this.log(LogLevel.INFO, message, context)
  }

  warn(message: string, context?: LogContext, error?: Error) {
    this.log(LogLevel.WARN, message, context, error)
  }

  error(message: string, context?: LogContext, error?: Error) {
    this.log(LogLevel.ERROR, message, context, error)
  }

  // Specialized logging methods
  apiRequest(method: string, path: string, statusCode: number, duration?: number) {
    this.info("API Request", {
      method,
      path,
      statusCode,
      duration: duration ? `${duration}ms` : undefined,
    })
  }

  tradeExecution(tradeId: string, txHash: string, status: string, profit?: number) {
    this.info("Trade Execution", {
      tradeId,
      txHash,
      status,
      profit,
    })
  }

  botStrategy(strategyId: string, action: string, result: string) {
    this.info("Bot Strategy", {
      strategyId,
      action,
      result,
    })
  }

  arbitrageOpportunity(opportunityId: string, profit: number, executed: boolean) {
    this.info("Arbitrage Opportunity", {
      opportunityId,
      profit,
      executed,
    })
  }

  priceUpdate(token: string, price: number, source: string) {
    if (this.isDevelopment) {
      this.debug("Price Update", {
        token,
        price,
        source,
      })
    }
  }

  performanceMetric(metric: string, value: number, unit: string) {
    this.info("Performance Metric", {
      metric,
      value,
      unit,
    })
  }
}

// Singleton instance
export const logger = new Logger()

// Export convenience methods
export const log = {
  debug: (message: string, context?: LogContext) => logger.debug(message, context),
  info: (message: string, context?: LogContext) => logger.info(message, context),
  warn: (message: string, context?: LogContext, error?: Error) => logger.warn(message, context, error),
  error: (message: string, context?: LogContext, error?: Error) => logger.error(message, context, error),
  apiRequest: (method: string, path: string, statusCode: number, duration?: number) =>
    logger.apiRequest(method, path, statusCode, duration),
  tradeExecution: (tradeId: string, txHash: string, status: string, profit?: number) =>
    logger.tradeExecution(tradeId, txHash, status, profit),
  botStrategy: (strategyId: string, action: string, result: string) =>
    logger.botStrategy(strategyId, action, result),
  arbitrageOpportunity: (opportunityId: string, profit: number, executed: boolean) =>
    logger.arbitrageOpportunity(opportunityId, profit, executed),
  priceUpdate: (token: string, price: number, source: string) => logger.priceUpdate(token, price, source),
  performanceMetric: (metric: string, value: number, unit: string) =>
    logger.performanceMetric(metric, value, unit),
}

