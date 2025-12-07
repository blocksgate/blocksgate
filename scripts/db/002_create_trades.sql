-- Create trades table to store transaction history
CREATE TABLE IF NOT EXISTS public.trades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tx_hash TEXT NOT NULL,
  token_in TEXT NOT NULL,
  token_out TEXT NOT NULL,
  amount_in NUMERIC NOT NULL,
  amount_out NUMERIC NOT NULL,
  price_at_time NUMERIC NOT NULL,
  slippage NUMERIC DEFAULT 0,
  gas_used NUMERIC,
  gas_price NUMERIC,
  fee NUMERIC DEFAULT 0,
  status TEXT CHECK (status IN ('pending', 'completed', 'failed')) DEFAULT 'pending',
  chain_id INTEGER NOT NULL,
  trade_type TEXT CHECK (trade_type IN ('swap', 'limit', 'arbitrage', 'flash', 'bridge')) DEFAULT 'swap',
  mev_protected BOOLEAN DEFAULT FALSE,
  profit_loss NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  executed_at TIMESTAMP WITH TIME ZONE
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_trades_user_id ON public.trades(user_id);
CREATE INDEX IF NOT EXISTS idx_trades_created_at ON public.trades(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_trades_status ON public.trades(status);

-- Enable RLS on trades
ALTER TABLE public.trades ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "trades_select_own"
  ON public.trades FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "trades_insert_own"
  ON public.trades FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "trades_update_own"
  ON public.trades FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "trades_delete_own"
  ON public.trades FOR DELETE
  USING (auth.uid() = user_id);
