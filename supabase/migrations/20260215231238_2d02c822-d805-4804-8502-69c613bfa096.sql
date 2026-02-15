
-- Create settings table (single-row org-wide preferences)
CREATE TABLE public.settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  default_warmup_minutes integer NOT NULL DEFAULT 45,
  upcoming_days_window integer NOT NULL DEFAULT 7,
  countdown_duration_minutes integer NOT NULL DEFAULT 30,
  sms_alerts_enabled boolean NOT NULL DEFAULT true,
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Anyone can read settings
CREATE POLICY "Anyone can view settings"
  ON public.settings FOR SELECT
  USING (true);

-- Only admins can update
CREATE POLICY "Admins can update settings"
  ON public.settings FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Service role full access
CREATE POLICY "Service role full access settings"
  ON public.settings FOR ALL
  USING (true)
  WITH CHECK (true);

-- Seed with one default row
INSERT INTO public.settings (id) VALUES (gen_random_uuid());
