import { supabase } from "./supabase/client"
import { EventEmitter } from "events"
import { captureException, captureMessage } from "@sentry/node"
import { SystemMetric, SystemAlert } from "./types/monitoring"
import type { Database } from "./types/supabase"

type Tables = Database['public']['Tables']
type DbInsert<T extends keyof Tables> = Tables[T]['Insert']

class MonitoringSystem extends EventEmitter {
  private metrics: SystemMetric = {
    timestamp: new Date().toISOString(),
    cpu_usage: 0,
    memory_usage: 0,
    active_users: 0,
    requests_per_minute: 0,
    average_response_time: 0,
    error_rate: 0,
  }

  private readonly alertThresholds = {
    cpu_usage: 80, // 80%
    memory_usage: 85, // 85%
    error_rate: 5, // 5%
    response_time: 1000, // 1 second
  }

  private alerts: SystemAlert[] = []
  private metricsHistory: SystemMetric[] = []

  constructor() {
    super()
    this.startMetricsCollection()
  }

  private startMetricsCollection() {
    setInterval(() => this.collectMetrics(), 60000) // Every minute
    setInterval(() => this.checkAlerts(), 30000) // Every 30 seconds
  }

  private async collectMetrics() {
    try {
      // Collect system metrics
      const metrics: SystemMetric = {
        timestamp: new Date().toISOString(),
        cpu_usage: await this.getCPUUsage(),
        memory_usage: await this.getMemoryUsage(),
        active_users: await this.getActiveUsers(),
        requests_per_minute: await this.getRequestRate(),
        average_response_time: await this.getAverageResponseTime(),
        error_rate: await this.getErrorRate(),
      }

      this.metrics = metrics
      this.metricsHistory.push(metrics)

      // Keep last 24 hours of metrics
      if (this.metricsHistory.length > 1440) {
        this.metricsHistory.shift()
      }

      // Emit metrics update
      this.emit("metrics_update", metrics)

      // Store metrics in database
      await this.storeMetrics(metrics)
    } catch (error) {
      this.logError("Failed to collect metrics", error)
    }
  }

  private async checkAlerts() {
    try {
      const { metrics } = this
      
      // Check CPU usage
      if (metrics.cpu_usage > this.alertThresholds.cpu_usage) {
        this.createAlert("warning", "High CPU Usage", {
          current: metrics.cpu_usage,
          threshold: this.alertThresholds.cpu_usage,
        })
      }

      // Check memory usage
      if (metrics.memory_usage > this.alertThresholds.memory_usage) {
        this.createAlert("warning", "High Memory Usage", {
          current: metrics.memory_usage,
          threshold: this.alertThresholds.memory_usage,
        })
      }

      // Check error rate
      if (metrics.error_rate > this.alertThresholds.error_rate) {
        this.createAlert("error", "High Error Rate", {
          current: metrics.error_rate,
          threshold: this.alertThresholds.error_rate,
        })
      }

      // Check response time
      if (metrics.average_response_time > this.alertThresholds.response_time) {
        this.createAlert("warning", "High Response Time", {
          current: metrics.average_response_time,
          threshold: this.alertThresholds.response_time,
        })
      }
    } catch (error) {
      this.logError("Failed to check alerts", error)
    }
  }

  private async getCPUUsage(): Promise<number> {
    // Implementation depends on your hosting environment
    return process.cpuUsage().user / 1000000
  }

  private async getMemoryUsage(): Promise<number> {
    const used = process.memoryUsage().heapUsed
    const total = process.memoryUsage().heapTotal
    return (used / total) * 100
  }

  private async getActiveUsers(): Promise<number> {
    const { data, error } = await supabase
      .rpc('get_active_sessions_count', { window_minutes: 5 } as any)

    if (error) throw error
    return data ?? 0
  }

  private async getRequestRate(): Promise<number> {
    const { data, error } = await supabase
      .rpc('get_request_rate', { window_minutes: 1 } as any)

    if (error) throw error
    return data ?? 0
  }

  private async getAverageResponseTime(): Promise<number> {
    // Implementation depends on your API monitoring system
    return 0
  }

  private async getErrorRate(): Promise<number> {
    const timeWindow = new Date(Date.now() - 300000).toISOString() // Last 5 minutes
    
    const { count: errorCount } = await supabase
      .from("audit_logs")
      .select("*", { head: true })
      .eq("action", "error")
      .gt("created_at", timeWindow)

    const { count: totalCount } = await supabase
      .from("audit_logs")
      .select("*", { head: true })
      .gt("created_at", timeWindow)

    const numErrors = errorCount ?? 0
    const total = totalCount ?? 0
    return total > 0 ? (numErrors / total) * 100 : 0
  }

  private async storeMetrics(metrics: SystemMetric) {
    const { error } = await supabase
      .from('system_metrics')
      .insert({
        timestamp: metrics.timestamp,
        cpu_usage: metrics.cpu_usage,
        memory_usage: metrics.memory_usage,
        active_users: metrics.active_users,
        requests_per_minute: metrics.requests_per_minute,
        average_response_time: metrics.average_response_time,
        error_rate: metrics.error_rate
      } as any)

    if (error) throw error
  }

  private async createAlert(type: SystemAlert["type"], message: string, details: Record<string, any>) {
    const alert: SystemAlert = {
      type,
      message,
      details,
      timestamp: new Date().toISOString(),
    }

    this.alerts.push(alert)
    this.emit("alert", alert)

    try {
      const { error } = await supabase
        .from('system_alerts')
        .insert({
          type: alert.type,
          message: alert.message,
          details: alert.details,
          timestamp: alert.timestamp
        } as any)

      if (error) throw error

      if (type === "error") {
        captureMessage(message, {
          level: "error",
          extra: details,
        })
      }
    } catch (error) {
      this.logError("Failed to store alert", error)
    }

    // Keep last 100 alerts
    if (this.alerts.length > 100) {
      this.alerts.shift()
    }
  }

  async logError(message: string, error: unknown) {
    console.error(message, error)
    captureException(error, {
      extra: { message },
    })

    try {
      const { error: dbError } = await supabase
        .from('audit_logs')
        .insert({
          action: "error",
          details: {
            message,
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
          },
          timestamp: new Date().toISOString()
        } as any)

      if (dbError) throw dbError
    } catch (err) {
      console.error("Failed to store error in audit logs:", err)
    }
  }

  async getMetrics(timeRange: "1h" | "24h" | "7d" = "1h"): Promise<SystemMetric[]> {
    const startTime = new Date()
    switch (timeRange) {
      case "7d":
        startTime.setDate(startTime.getDate() - 7)
        break
      case "24h":
        startTime.setDate(startTime.getDate() - 1)
        break
      case "1h":
        startTime.setHours(startTime.getHours() - 1)
        break
    }

    const { data, error } = await supabase
      .from("system_metrics")
      .select("*")
      .gt("timestamp", startTime.toISOString())
      .order("timestamp", { ascending: true })

    if (error) throw error
    return data ?? []
  }

  async getAlerts(timeRange: "1h" | "24h" | "7d" = "24h"): Promise<SystemAlert[]> {
    const startTime = new Date()
    switch (timeRange) {
      case "7d":
        startTime.setDate(startTime.getDate() - 7)
        break
      case "24h":
        startTime.setDate(startTime.getDate() - 1)
        break
      case "1h":
        startTime.setHours(startTime.getHours() - 1)
        break
    }

    const { data, error } = await supabase
      .from("system_alerts")
      .select("*")
      .gt("timestamp", startTime.getTime())
      .order("timestamp", { ascending: false })

    if (error) throw error
    return data ?? []
  }

  getCurrentMetrics(): SystemMetric {
    return this.metrics
  }

  getRecentAlerts(): SystemAlert[] {
    return this.alerts
  }
}

export const monitoring = new MonitoringSystem()