"use client"

import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertCircle, RefreshCw } from "lucide-react"

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: React.ErrorInfo | null
}

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<ErrorFallbackProps>
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}

interface ErrorFallbackProps {
  error: Error | null
  errorInfo: React.ErrorInfo | null
  resetError: () => void
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("[ErrorBoundary] Error caught:", error, errorInfo)
    this.setState({
      error,
      errorInfo,
    })

    // Call optional error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }

    // Log to error tracking service (Sentry, etc.)
    if (typeof window !== "undefined" && (window as any).Sentry) {
      (window as any).Sentry.captureException(error, {
        contexts: {
          react: {
            componentStack: errorInfo.componentStack,
          },
        },
      })
    }
  }

  resetError = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        const Fallback = this.props.fallback
        return (
          <Fallback
            error={this.state.error}
            errorInfo={this.state.errorInfo}
            resetError={this.resetError}
          />
        )
      }

      return (
        <DefaultErrorFallback
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          resetError={this.resetError}
        />
      )
    }

    return this.props.children
  }
}

function DefaultErrorFallback({ error, errorInfo, resetError }: ErrorFallbackProps) {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-2xl border-destructive/50">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <CardTitle className="text-destructive">Something went wrong</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-destructive/10 p-4">
            <p className="text-sm font-medium text-destructive">
              {error?.message || "An unexpected error occurred"}
            </p>
          </div>

          {process.env.NODE_ENV === "development" && errorInfo && (
            <details className="rounded-lg bg-muted p-4">
              <summary className="cursor-pointer text-sm font-medium text-muted-foreground">
                Error Details (Development Only)
              </summary>
              <pre className="mt-2 overflow-auto text-xs">
                {error?.stack}
                {errorInfo.componentStack}
              </pre>
            </details>
          )}

          <div className="flex gap-2">
            <Button onClick={resetError} variant="default">
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
            <Button
              onClick={() => (window.location.href = "/dashboard")}
              variant="outline"
            >
              Go to Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export { ErrorBoundary, type ErrorBoundaryProps, type ErrorFallbackProps }

