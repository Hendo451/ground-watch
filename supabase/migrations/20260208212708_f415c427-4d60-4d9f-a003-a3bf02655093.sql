-- Add warmup_minutes column to games table
-- This represents the time before game start when players are warming up and exposed to lightning
ALTER TABLE public.games 
ADD COLUMN warmup_minutes integer NOT NULL DEFAULT 45;

-- Add a comment for documentation
COMMENT ON COLUMN public.games.warmup_minutes IS 'Minutes before start_time when players begin warming up outdoors';