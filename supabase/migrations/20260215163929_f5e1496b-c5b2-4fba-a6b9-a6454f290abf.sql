ALTER TABLE public.events
  ADD COLUMN rsvp_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN rsvp_open_date timestamptz,
  ADD COLUMN rsvp_close_date timestamptz;