-- Create risk_limits and stop_loss_orders tables

-- Risk limits table
CREATE TABLE IF NOT EXISTS public.risk_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  max_loss_per_trade NUMERIC NOT NULL DEFAULT 100,
  max_loss_per_day NUMERIC NOT NULL DEFAULT 500,
  max_position_size NUMERIC NOT NULL DEFAULT 10,
  max_slippage NUMERIC NOT NULL DEFAULT 1,
  stop_loss_enabled BOOLEAN DEFAULT TRUE,
  take_profit_enabled BOOLEAN DEFAULT TRUE,
  risk_per_trade NUMERIC NOT NULL DEFAULT 2,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Stop-loss orders table
CREATE TABLE IF NOT EXISTS public.stop_loss_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  position_size NUMERIC NOT NULL,
  entry_price NUMERIC NOT NULL,
  stop_loss_price NUMERIC NOT NULL,
  take_profit_price NUMERIC,
  active BOOLEAN DEFAULT TRUE,
  triggered BOOLEAN DEFAULT FALSE,
  triggered_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_risk_limits_user_id ON public.risk_limits(user_id);
CREATE INDEX IF NOT EXISTS idx_stop_loss_orders_user_id ON public.stop_loss_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_stop_loss_orders_active ON public.stop_loss_orders(active);
CREATE INDEX IF NOT EXISTS idx_stop_loss_orders_token ON public.stop_loss_orders(token);

-- Enable RLS
ALTER TABLE public.risk_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stop_loss_orders ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for risk_limits
CREATE POLICY "risk_limits_select_own"
  ON public.risk_limits FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "risk_limits_insert_own"
  ON public.risk_limits FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "risk_limits_update_own"
  ON public.risk_limits FOR UPDATE
  USING (auth.uid() = user_id);

-- Create RLS policies for stop_loss_orders
CREATE POLICY "stop_loss_orders_select_own"
  ON public.stop_loss_orders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "stop_loss_orders_insert_own"
  ON public.stop_loss_orders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "stop_loss_orders_update_own"
  ON public.stop_loss_orders FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "stop_loss_orders_delete_own"
  ON public.stop_loss_orders FOR DELETE
  USING (auth.uid() = user_id);

