-- Create system_metrics table
CREATE TABLE IF NOT EXISTS system_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp timestamptz NOT NULL,
  cpu_usage numeric NOT NULL,
  memory_usage numeric NOT NULL,
  active_users integer NOT NULL,
  requests_per_minute integer NOT NULL,
  average_response_time numeric NOT NULL,
  error_rate numeric NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create index on timestamp for range queries
CREATE INDEX IF NOT EXISTS idx_system_metrics_timestamp ON system_metrics (timestamp);

-- Create system_alerts table
CREATE TABLE IF NOT EXISTS system_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL CHECK (type IN ('error', 'warning', 'info')),
  message text NOT NULL,
  details jsonb NOT NULL DEFAULT '{}',
  timestamp timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create index on timestamp and type for filtering
CREATE INDEX IF NOT EXISTS idx_system_alerts_timestamp ON system_alerts (timestamp);
CREATE INDEX IF NOT EXISTS idx_system_alerts_type ON system_alerts (type);

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp timestamptz NOT NULL,
  action text NOT NULL,
  details jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Create index on timestamp and action for filtering
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs (timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs (action);