-- Create app roles enum
CREATE TYPE public.app_role AS ENUM ('admin', 'viewer');

-- User roles table for admin access control
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role public.app_role NOT NULL DEFAULT 'viewer',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles (avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Users can view their own roles
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Service role full access
CREATE POLICY "Service role manages roles" ON public.user_roles FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Drop overly permissive policies and replace with admin-only policies
DROP POLICY IF EXISTS "Authenticated users can insert venues" ON public.venues;
DROP POLICY IF EXISTS "Authenticated users can update venues" ON public.venues;
DROP POLICY IF EXISTS "Authenticated users can delete venues" ON public.venues;
DROP POLICY IF EXISTS "Authenticated users can insert officials" ON public.officials;
DROP POLICY IF EXISTS "Authenticated users can update officials" ON public.officials;
DROP POLICY IF EXISTS "Authenticated users can delete officials" ON public.officials;
DROP POLICY IF EXISTS "Authenticated users can insert games" ON public.games;
DROP POLICY IF EXISTS "Authenticated users can update games" ON public.games;
DROP POLICY IF EXISTS "Authenticated users can delete games" ON public.games;
DROP POLICY IF EXISTS "Authenticated users can insert alerts" ON public.lightning_alerts;

-- Admin-only write policies for venues
CREATE POLICY "Admins can insert venues" ON public.venues FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update venues" ON public.venues FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete venues" ON public.venues FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Admin-only write policies for officials
CREATE POLICY "Admins can insert officials" ON public.officials FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update officials" ON public.officials FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete officials" ON public.officials FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Admin-only write policies for games
CREATE POLICY "Admins can insert games" ON public.games FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update games" ON public.games FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete games" ON public.games FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Admins and service role can insert alerts
CREATE POLICY "Admins can insert alerts" ON public.lightning_alerts FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));