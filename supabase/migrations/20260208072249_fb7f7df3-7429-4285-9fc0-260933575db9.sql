-- Create grades table for simple division list
CREATE TABLE public.grades (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add grade_id to games table
ALTER TABLE public.games ADD COLUMN grade_id UUID REFERENCES public.grades(id);

-- Create trainings table for recurring training sessions
CREATE TABLE public.trainings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  venue_id UUID REFERENCES public.venues(id),
  grade_id UUID REFERENCES public.grades(id),
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create training exceptions table for cancelled/modified sessions
CREATE TABLE public.training_exceptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  training_id UUID NOT NULL REFERENCES public.trainings(id) ON DELETE CASCADE,
  exception_date DATE NOT NULL,
  is_cancelled BOOLEAN NOT NULL DEFAULT true,
  override_start_time TIME,
  override_end_time TIME,
  override_venue_id UUID REFERENCES public.venues(id),
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(training_id, exception_date)
);

-- Enable RLS on all new tables
ALTER TABLE public.grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trainings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_exceptions ENABLE ROW LEVEL SECURITY;

-- RLS policies for grades
CREATE POLICY "Anyone can view grades" ON public.grades FOR SELECT USING (true);
CREATE POLICY "Admins can insert grades" ON public.grades FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update grades" ON public.grades FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete grades" ON public.grades FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Service role full access grades" ON public.grades FOR ALL USING (true) WITH CHECK (true);

-- RLS policies for trainings
CREATE POLICY "Anyone can view trainings" ON public.trainings FOR SELECT USING (true);
CREATE POLICY "Admins can insert trainings" ON public.trainings FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update trainings" ON public.trainings FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete trainings" ON public.trainings FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Service role full access trainings" ON public.trainings FOR ALL USING (true) WITH CHECK (true);

-- RLS policies for training_exceptions
CREATE POLICY "Anyone can view training exceptions" ON public.training_exceptions FOR SELECT USING (true);
CREATE POLICY "Admins can insert training exceptions" ON public.training_exceptions FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update training exceptions" ON public.training_exceptions FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete training exceptions" ON public.training_exceptions FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Service role full access training_exceptions" ON public.training_exceptions FOR ALL USING (true) WITH CHECK (true);

-- Add triggers for updated_at
CREATE TRIGGER update_grades_updated_at BEFORE UPDATE ON public.grades FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_trainings_updated_at BEFORE UPDATE ON public.trainings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();