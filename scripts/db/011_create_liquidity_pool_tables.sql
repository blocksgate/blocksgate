-- Create lp_positions table for tracking liquidity pool positions

CREATE TABLE IF NOT EXISTS public.lp_positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pool_id TEXT NOT NULL,
  token0 TEXT NOT NULL,
  token1 TEXT NOT NULL,
  token0Amount NUMERIC NOT NULL,
  token1Amount NUMERIC NOT NULL,
  lpTokens NUMERIC NOT NULL,
  feeTier NUMERIC NOT NULL,
  feesEarned NUMERIC DEFAULT 0,
  impermanentLoss NUMERIC DEFAULT 0,
  chain_id INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_lp_positions_user_id ON public.lp_positions(user_id);
CREATE INDEX IF NOT EXISTS idx_lp_positions_pool_id ON public.lp_positions(pool_id);
CREATE INDEX IF NOT EXISTS idx_lp_positions_chain_id ON public.lp_positions(chain_id);

-- Enable RLS
ALTER TABLE public.lp_positions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "lp_positions_select_own"
  ON public.lp_positions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "lp_positions_insert_own"
  ON public.lp_positions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "lp_positions_update_own"
  ON public.lp_positions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "lp_positions_delete_own"
  ON public.lp_positions FOR DELETE
  USING (auth.uid() = user_id);

