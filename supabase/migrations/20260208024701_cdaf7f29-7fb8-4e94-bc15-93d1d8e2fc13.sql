-- Create enum for lightning status
CREATE TYPE public.lightning_status AS ENUM ('green', 'orange', 'red');

-- Venues table
CREATE TABLE public.venues (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    latitude NUMERIC(10, 6) NOT NULL,
    longitude NUMERIC(10, 6) NOT NULL,
    safe_zone_radius INTEGER NOT NULL DEFAULT 16,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Officials table
CREATE TABLE public.officials (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    mobile TEXT NOT NULL,
    venue_id UUID REFERENCES public.venues(id) ON DELETE SET NULL,
    alerts_enabled BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Games table (scheduled game windows)
CREATE TABLE public.games (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    venue_id UUID NOT NULL REFERENCES public.venues(id) ON DELETE CASCADE,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    status public.lightning_status NOT NULL DEFAULT 'green',
    countdown_end TIMESTAMP WITH TIME ZONE,
    last_strike_distance NUMERIC(6, 2),
    last_strike_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Lightning alerts log (for audit trail)
CREATE TABLE public.lightning_alerts (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    game_id UUID REFERENCES public.games(id) ON DELETE CASCADE,
    venue_id UUID REFERENCES public.venues(id) ON DELETE CASCADE,
    official_id UUID REFERENCES public.officials(id) ON DELETE SET NULL,
    alert_type TEXT NOT NULL, -- 'red', 'orange', 'all_clear'
    distance_km NUMERIC(6, 2),
    message TEXT NOT NULL,
    sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.officials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lightning_alerts ENABLE ROW LEVEL SECURITY;

-- Public read access for all tables (this is a safety management app, visibility is important)
CREATE POLICY "Anyone can view venues" ON public.venues FOR SELECT USING (true);
CREATE POLICY "Anyone can view games" ON public.games FOR SELECT USING (true);
CREATE POLICY "Anyone can view officials" ON public.officials FOR SELECT USING (true);
CREATE POLICY "Anyone can view alerts" ON public.lightning_alerts FOR SELECT USING (true);

-- Authenticated users can manage data (admin functionality)
CREATE POLICY "Authenticated users can insert venues" ON public.venues FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update venues" ON public.venues FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete venues" ON public.venues FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert officials" ON public.officials FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update officials" ON public.officials FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete officials" ON public.officials FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert games" ON public.games FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update games" ON public.games FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete games" ON public.games FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert alerts" ON public.lightning_alerts FOR INSERT TO authenticated WITH CHECK (true);

-- Service role can do everything (for edge functions)
CREATE POLICY "Service role full access venues" ON public.venues FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access officials" ON public.officials FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access games" ON public.games FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access alerts" ON public.lightning_alerts FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Create trigger function for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Add triggers
CREATE TRIGGER update_venues_updated_at BEFORE UPDATE ON public.venues FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_officials_updated_at BEFORE UPDATE ON public.officials FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_games_updated_at BEFORE UPDATE ON public.games FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for games (live status updates)
ALTER PUBLICATION supabase_realtime ADD TABLE public.games;