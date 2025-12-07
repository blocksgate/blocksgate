-- Create orders table for limit orders and pending trades
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token_in TEXT NOT NULL,
  token_out TEXT NOT NULL,
  amount_in NUMERIC NOT NULL,
  min_amount_out NUMERIC NOT NULL,
  price_target NUMERIC NOT NULL,
  status TEXT CHECK (status IN ('pending', 'filled', 'cancelled', 'expired')) DEFAULT 'pending',
  order_type TEXT CHECK (order_type IN ('limit', 'dca', 'stop-loss')) DEFAULT 'limit',
  chain_id INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  filled_at TIMESTAMP WITH TIME ZONE,
  filled_amount_in NUMERIC,
  filled_amount_out NUMERIC
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);

-- Enable RLS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "orders_select_own"
  ON public.orders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "orders_insert_own"
  ON public.orders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "orders_update_own"
  ON public.orders FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "orders_delete_own"
  ON public.orders FOR DELETE
  USING (auth.uid() = user_id);
