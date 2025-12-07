-- Create price history table for analytics
CREATE TABLE IF NOT EXISTS public.price_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token_address TEXT NOT NULL,
  token_symbol TEXT NOT NULL,
  chain_id INTEGER NOT NULL,
  price_usd NUMERIC NOT NULL,
  market_cap NUMERIC,
  volume_24h NUMERIC,
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_price_history_token ON public.price_history(token_address, chain_id);
CREATE INDEX IF NOT EXISTS idx_price_history_recorded_at ON public.price_history(recorded_at DESC);

-- Price history doesn't need RLS as it's public data
