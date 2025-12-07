-- Create portfolios table for tracking holdings
CREATE TABLE IF NOT EXISTS public.portfolios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token_address TEXT NOT NULL,
  token_symbol TEXT NOT NULL,
  token_name TEXT NOT NULL,
  balance NUMERIC NOT NULL DEFAULT 0,
  usd_value NUMERIC DEFAULT 0,
  cost_basis NUMERIC DEFAULT 0,
  unrealized_pl NUMERIC DEFAULT 0,
  chain_id INTEGER NOT NULL,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, token_address, chain_id)
);

-- Create index
CREATE INDEX IF NOT EXISTS idx_portfolios_user_id ON public.portfolios(user_id);

-- Enable RLS
ALTER TABLE public.portfolios ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "portfolios_select_own"
  ON public.portfolios FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "portfolios_insert_own"
  ON public.portfolios FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "portfolios_update_own"
  ON public.portfolios FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "portfolios_delete_own"
  ON public.portfolios FOR DELETE
  USING (auth.uid() = user_id);
