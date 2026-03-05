-- Add heat and lightning monitoring fields to trainings table
ALTER TABLE public.trainings ADD COLUMN IF NOT EXISTS sport_intensity sport_intensity;
ALTER TABLE public.trainings ADD COLUMN IF NOT EXISTS heat_status heat_status NOT NULL DEFAULT 'low';
ALTER TABLE public.trainings ADD COLUMN IF NOT EXISTS last_temp_c NUMERIC;
ALTER TABLE public.trainings ADD COLUMN IF NOT EXISTS last_humidity INTEGER;
ALTER TABLE public.trainings ADD COLUMN IF NOT EXISTS last_heat_check_at TIMESTAMPTZ;
ALTER TABLE public.trainings ADD COLUMN IF NOT EXISTS weather_icon TEXT;
ALTER TABLE public.trainings ADD COLUMN IF NOT EXISTS status lightning_status NOT NULL DEFAULT 'green';
ALTER TABLE public.trainings ADD COLUMN IF NOT EXISTS countdown_end TIMESTAMPTZ;
ALTER TABLE public.trainings ADD COLUMN IF NOT EXISTS last_strike_distance NUMERIC(6,2);
ALTER TABLE public.trainings ADD COLUMN IF NOT EXISTS last_strike_at TIMESTAMPTZ;
ALTER TABLE public.trainings ADD COLUMN IF NOT EXISTS last_strike_lat NUMERIC;
ALTER TABLE public.trainings ADD COLUMN IF NOT EXISTS last_strike_lng NUMERIC;
ALTER TABLE public.trainings ADD COLUMN IF NOT EXISTS lightning_forecast TEXT DEFAULT 'clear';

-- Extend lightning_strikes to support training sessions (make game_id optional)
ALTER TABLE public.lightning_strikes ADD COLUMN IF NOT EXISTS training_id UUID REFERENCES public.trainings(id) ON DELETE CASCADE;
ALTER TABLE public.lightning_strikes ALTER COLUMN game_id DROP NOT NULL;

-- Extend alert tables to support training sessions
ALTER TABLE public.heat_alerts ADD COLUMN IF NOT EXISTS training_id UUID REFERENCES public.trainings(id) ON DELETE CASCADE;
ALTER TABLE public.lightning_alerts ADD COLUMN IF NOT EXISTS training_id UUID REFERENCES public.trainings(id) ON DELETE CASCADE;
