-- Create sport intensity enum
CREATE TYPE public.sport_intensity AS ENUM ('category_1', 'category_2', 'category_3');

-- Create heat status enum
CREATE TYPE public.heat_status AS ENUM ('low', 'moderate', 'high', 'extreme');

-- Add sport_intensity to venues table
ALTER TABLE public.venues 
ADD COLUMN sport_intensity public.sport_intensity NOT NULL DEFAULT 'category_1';

-- Add heat monitoring columns to games table
ALTER TABLE public.games 
ADD COLUMN heat_status public.heat_status NOT NULL DEFAULT 'low',
ADD COLUMN last_temp_c numeric NULL,
ADD COLUMN last_humidity integer NULL,
ADD COLUMN last_heat_check_at timestamp with time zone NULL;

-- Create heat_alerts table for logging heat-related alerts
CREATE TABLE public.heat_alerts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  venue_id uuid REFERENCES public.venues(id) ON DELETE CASCADE,
  game_id uuid REFERENCES public.games(id) ON DELETE CASCADE,
  official_id uuid REFERENCES public.officials(id) ON DELETE SET NULL,
  alert_type text NOT NULL,
  heat_status public.heat_status NOT NULL,
  temp_c numeric NOT NULL,
  humidity integer NOT NULL,
  message text NOT NULL,
  sent_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on heat_alerts
ALTER TABLE public.heat_alerts ENABLE ROW LEVEL SECURITY;

-- RLS policies for heat_alerts
CREATE POLICY "Anyone can view heat alerts" 
ON public.heat_alerts 
FOR SELECT 
USING (true);

CREATE POLICY "Service role full access heat_alerts" 
ON public.heat_alerts 
FOR ALL 
USING (true)
WITH CHECK (true);

CREATE POLICY "Admins can insert heat alerts" 
ON public.heat_alerts 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Add index for querying recent heat alerts
CREATE INDEX idx_heat_alerts_venue_sent ON public.heat_alerts(venue_id, sent_at DESC);

-- Enable realtime for games table (already enabled but ensure heat_status changes are captured)
-- Note: games table already has realtime enabled