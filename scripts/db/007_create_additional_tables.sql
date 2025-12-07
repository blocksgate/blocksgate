-- Price History Table
CREATE TABLE IF NOT EXISTS price_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    token_id VARCHAR(255) NOT NULL,
    price DECIMAL(24,8) NOT NULL,
    market_cap DECIMAL(24,2),
    volume_24h DECIMAL(24,2),
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add indices for price history
CREATE INDEX idx_price_history_token_timestamp ON price_history(token_id, timestamp);
CREATE INDEX idx_price_history_timestamp ON price_history(timestamp);

-- Portfolio Positions Table
CREATE TABLE IF NOT EXISTS portfolio_positions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    token VARCHAR(255) NOT NULL,
    amount DECIMAL(24,8) NOT NULL DEFAULT 0,
    average_entry_price DECIMAL(24,8) NOT NULL,
    current_price DECIMAL(24,8) NOT NULL,
    unrealized_pnl DECIMAL(24,8) NOT NULL DEFAULT 0,
    realized_pnl DECIMAL(24,8) NOT NULL DEFAULT 0,
    last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, token)
);

-- Add indices for portfolio positions
CREATE INDEX idx_portfolio_positions_user ON portfolio_positions(user_id);
CREATE INDEX idx_portfolio_positions_token ON portfolio_positions(token);
CREATE INDEX idx_portfolio_positions_user_token ON portfolio_positions(user_id, token);

-- User Roles Table
CREATE TYPE user_role AS ENUM ('user', 'trader', 'admin');

CREATE TABLE IF NOT EXISTS user_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role user_role NOT NULL DEFAULT 'user',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Add index for user roles
CREATE INDEX idx_user_roles_user ON user_roles(user_id);

-- Audit Logs Table
CREATE TYPE audit_action AS ENUM (
    'login', 'logout', 'trade', 'order', 'deposit', 'withdraw',
    'settings_change', 'role_change', 'password_change'
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action audit_action NOT NULL,
    details JSONB NOT NULL DEFAULT '{}'::jsonb,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add indices for audit logs
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- Add indices for existing tables
CREATE INDEX IF NOT EXISTS idx_trades_user_executed ON trades(user_id, executed_at);
CREATE INDEX IF NOT EXISTS idx_trades_executed_at ON trades(executed_at);
CREATE INDEX IF NOT EXISTS idx_orders_user_status ON orders(user_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_user_roles_updated_at
    BEFORE UPDATE ON user_roles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();