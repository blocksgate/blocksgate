CREATE OR REPLACE FUNCTION public.get_active_sessions_count(window_minutes integer DEFAULT 5)
  RETURNS bigint
  LANGUAGE plpgsql
  SECURITY DEFINER
AS $$
DECLARE
  active_count bigint;
BEGIN
  SELECT COUNT(*)
  INTO active_count
  FROM active_sessions
  WHERE last_seen > NOW() - (window_minutes || ' minutes')::interval;
  RETURN active_count;
END;
$$;