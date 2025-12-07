import { Database } from "./supabase"

// Database table schemas
export interface DbSystemMetric {
  id: string
  timestamp: string
  cpu_usage: number
  memory_usage: number
  active_users: number
  requests_per_minute: number
  average_response_time: number
  error_rate: number
}

export interface DbSystemAlert {
  id: string
  type: "error" | "warning" | "info"
  message: string
  details: Record<string, any>
  timestamp: string
}

export interface DbAuditLog {
  id: string
  timestamp: string
  action: string
  details: {
    message: string
    error: string
    stack?: string
  }
}

// Runtime interfaces
export interface SystemMetric {
  timestamp: string
  cpu_usage: number
  memory_usage: number
  active_users: number
  requests_per_minute: number
  average_response_time: number
  error_rate: number
}

export interface SystemAlert {
  type: "error" | "warning" | "info"
  message: string
  details: Record<string, any>
  timestamp: string
}

export interface AuditLog {
  action: string
  details: {
    message: string
    error: string
    stack?: string
  }
  timestamp: string
}

// Database type definitions
export interface Tables {
  system_metrics: {
    Row: DbSystemMetric
    Insert: Omit<DbSystemMetric, "id">
    Update: Partial<DbSystemMetric>
  }
  system_alerts: {
    Row: DbSystemAlert
    Insert: Omit<DbSystemAlert, "id">
    Update: Partial<DbSystemAlert>
  }
  audit_logs: {
    Row: DbAuditLog
    Insert: Omit<DbAuditLog, "id">
    Update: Partial<DbAuditLog>
  }
}