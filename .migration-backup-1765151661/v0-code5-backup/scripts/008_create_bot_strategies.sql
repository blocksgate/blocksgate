-- Create bot_strategies table for trading bot configurations
CREATE TABLE IF NOT EXISTS public.bot_strategies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  strategy_type TEXT CHECK (strategy_type IN ('dca', 'grid', 'momentum', 'mean_reversion', 'arbitrage')) NOT NULL,
  status TEXT CHECK (status IN ('active', 'paused', 'stopped')) DEFAULT 'paused',
  config JSONB NOT NULL, -- Strategy-specific configuration
  token_pair TEXT NOT NULL, -- e.g., "ETH/USDC"
  chain_id INTEGER NOT NULL DEFAULT 1,
  total_trades INTEGER DEFAULT 0,
  total_profit NUMERIC DEFAULT 0,
  win_rate NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_executed_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_bot_strategies_user_id ON public.bot_strategies(user_id);
CREATE INDEX IF NOT EXISTS idx_bot_strategies_status ON public.bot_strategies(status);
CREATE INDEX IF NOT EXISTS idx_bot_strategies_strategy_type ON public.bot_strategies(strategy_type);

-- Enable RLS
ALTER TABLE public.bot_strategies ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "bot_strategies_select_own"
  ON public.bot_strategies FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "bot_strategies_insert_own"
  ON public.bot_strategies FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "bot_strategies_update_own"
  ON public.bot_strategies FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "bot_strategies_delete_own"
  ON public.bot_strategies FOR DELETE
  USING (auth.uid() = user_id);

-- Create bot_executions table to track strategy executions
CREATE TABLE IF NOT EXISTS public.bot_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  strategy_id UUID NOT NULL REFERENCES public.bot_strategies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL, -- 'buy', 'sell', 'skip'
  token_in TEXT,
  token_out TEXT,
  amount_in NUMERIC,
  amount_out NUMERIC,
  price NUMERIC,
  tx_hash TEXT,
  status TEXT CHECK (status IN ('pending', 'completed', 'failed')) DEFAULT 'pending',
  profit_loss NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_bot_executions_strategy_id ON public.bot_executions(strategy_id);
CREATE INDEX IF NOT EXISTS idx_bot_executions_user_id ON public.bot_executions(user_id);
CREATE INDEX IF NOT EXISTS idx_bot_executions_created_at ON public.bot_executions(created_at DESC);

-- Enable RLS
ALTER TABLE public.bot_executions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "bot_executions_select_own"
  ON public.bot_executions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "bot_executions_insert_own"
  ON public.bot_executions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

