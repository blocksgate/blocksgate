CREATE OR REPLACE FUNCTION public.get_request_rate(window_minutes integer DEFAULT 5)
  RETURNS numeric
  LANGUAGE plpgsql
  SECURITY DEFINER
AS $$
DECLARE
  request_count numeric;
BEGIN
  SELECT 
    ROUND(COUNT(*) / window_minutes::numeric, 2)
  INTO request_count
  FROM audit_logs
  WHERE 
    created_at > NOW() - (window_minutes || ' minutes')::interval
    AND action = 'request';
  RETURN request_count;
END;
$$;