-- Enums
CREATE TYPE public.link_type AS ENUM ('open', 'personal');
CREATE TYPE public.field_type AS ENUM ('text', 'number', 'select', 'checkbox', 'textarea');

-- Timestamp trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Events
CREATE TABLE IF NOT EXISTS public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  event_date TIMESTAMPTZ,
  location TEXT,
  theme JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_events_updated_at
BEFORE UPDATE ON public.events
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Event languages (optional translation payload per locale)
CREATE TABLE IF NOT EXISTS public.event_languages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  locale TEXT NOT NULL,
  is_default BOOLEAN NOT NULL DEFAULT false,
  translations JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(event_id, locale)
);

CREATE TRIGGER trg_event_languages_updated_at
BEFORE UPDATE ON public.event_languages
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Guests (for personal invitations)
CREATE TABLE IF NOT EXISTS public.guests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  email TEXT,
  group_name TEXT,
  language TEXT,
  notes TEXT,
  men_count INTEGER NOT NULL DEFAULT 0 CHECK (men_count >= 0),
  women_count INTEGER NOT NULL DEFAULT 0 CHECK (women_count >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_guests_event_id ON public.guests(event_id);

CREATE TRIGGER trg_guests_updated_at
BEFORE UPDATE ON public.guests
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Links (open/personal)
CREATE TABLE IF NOT EXISTS public.links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  type public.link_type NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  max_uses INTEGER,
  uses_count INTEGER NOT NULL DEFAULT 0,
  expires_at TIMESTAMPTZ,
  guest_id UUID REFERENCES public.guests(id) ON DELETE SET NULL,
  settings JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_links_event_id ON public.links(event_id);
CREATE INDEX IF NOT EXISTS idx_links_type ON public.links(type);

CREATE TRIGGER trg_links_updated_at
BEFORE UPDATE ON public.links
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Custom fields configuration per event & link type
CREATE TABLE IF NOT EXISTS public.custom_fields_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  link_type public.link_type NOT NULL,
  key TEXT NOT NULL,
  label TEXT NOT NULL,
  field_type public.field_type NOT NULL,
  required BOOLEAN NOT NULL DEFAULT false,
  options JSONB,
  order_index INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(event_id, link_type, key)
);

CREATE INDEX IF NOT EXISTS idx_cfc_event_type ON public.custom_fields_config(event_id, link_type);

CREATE TRIGGER trg_cfc_updated_at
BEFORE UPDATE ON public.custom_fields_config
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RSVP submissions
CREATE TABLE IF NOT EXISTS public.rsvp_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  link_id UUID REFERENCES public.links(id) ON DELETE SET NULL,
  guest_id UUID REFERENCES public.guests(id) ON DELETE SET NULL,
  full_name TEXT,
  men_count INTEGER NOT NULL DEFAULT 0 CHECK (men_count >= 0),
  women_count INTEGER NOT NULL DEFAULT 0 CHECK (women_count >= 0),
  answers JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'submitted',
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rsvp_event_id ON public.rsvp_submissions(event_id);
CREATE INDEX IF NOT EXISTS idx_rsvp_link_id ON public.rsvp_submissions(link_id);
CREATE INDEX IF NOT EXISTS idx_rsvp_guest_id ON public.rsvp_submissions(guest_id);

CREATE TRIGGER trg_rsvp_updated_at
BEFORE UPDATE ON public.rsvp_submissions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_languages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_fields_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rsvp_submissions ENABLE ROW LEVEL SECURITY;

-- Public read policies for content needed by public pages (can be tightened later)
CREATE POLICY "Public can read events" ON public.events
FOR SELECT USING (true);

CREATE POLICY "Public can read event languages" ON public.event_languages
FOR SELECT USING (true);

CREATE POLICY "Public can read links" ON public.links
FOR SELECT USING (true);

CREATE POLICY "Public can read custom fields config" ON public.custom_fields_config
FOR SELECT USING (true);

-- Allow public RSVP submissions (insert/select). Tighten later when auth is added.
CREATE POLICY "Public can insert RSVP submissions" ON public.rsvp_submissions
FOR INSERT WITH CHECK (true);

CREATE POLICY "Public can read RSVP submissions" ON public.rsvp_submissions
FOR SELECT USING (true);

-- Guests are typically managed by admins; for now allow public read only.
CREATE POLICY "Public can read guests" ON public.guests
FOR SELECT USING (true);
