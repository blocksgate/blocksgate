-- Create notifications and notification_settings tables

-- Notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('trade', 'order', 'price_alert', 'system', 'transaction')) NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notification settings table
CREATE TABLE IF NOT EXISTS public.notification_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  email_enabled BOOLEAN DEFAULT TRUE,
  in_app_enabled BOOLEAN DEFAULT TRUE,
  telegram_enabled BOOLEAN DEFAULT FALSE,
  discord_enabled BOOLEAN DEFAULT FALSE,
  price_alerts_enabled BOOLEAN DEFAULT TRUE,
  trade_notifications_enabled BOOLEAN DEFAULT TRUE,
  order_notifications_enabled BOOLEAN DEFAULT TRUE,
  telegram_chat_id TEXT,
  discord_webhook_url TEXT,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Price alerts table
CREATE TABLE IF NOT EXISTS public.price_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  target_price NUMERIC NOT NULL,
  condition TEXT CHECK (condition IN ('above', 'below')) NOT NULL,
  active BOOLEAN DEFAULT TRUE,
  triggered_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_notification_settings_user_id ON public.notification_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_price_alerts_user_id ON public.price_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_price_alerts_active ON public.price_alerts(active);
CREATE INDEX IF NOT EXISTS idx_price_alerts_token ON public.price_alerts(token);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.price_alerts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for notifications
CREATE POLICY "notifications_select_own"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "notifications_insert_own"
  ON public.notifications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "notifications_update_own"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- Create RLS policies for notification_settings
CREATE POLICY "notification_settings_select_own"
  ON public.notification_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "notification_settings_insert_own"
  ON public.notification_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "notification_settings_update_own"
  ON public.notification_settings FOR UPDATE
  USING (auth.uid() = user_id);

-- Create RLS policies for price_alerts
CREATE POLICY "price_alerts_select_own"
  ON public.price_alerts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "price_alerts_insert_own"
  ON public.price_alerts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "price_alerts_update_own"
  ON public.price_alerts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "price_alerts_delete_own"
  ON public.price_alerts FOR DELETE
  USING (auth.uid() = user_id);

