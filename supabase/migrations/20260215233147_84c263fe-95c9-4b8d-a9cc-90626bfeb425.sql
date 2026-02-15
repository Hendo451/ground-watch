
-- Add default_sport column to venues table
ALTER TABLE public.venues ADD COLUMN default_sport text;

-- Add sport_intensity column to games table (per-game override)
ALTER TABLE public.games ADD COLUMN sport_intensity public.sport_intensity;

-- Backfill: set games.sport_intensity from the joined venue's sport_intensity
UPDATE public.games g
SET sport_intensity = v.sport_intensity
FROM public.venues v
WHERE g.venue_id = v.id;
