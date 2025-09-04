-- Allow public write access for admin-facing tables (no auth yet)
-- EVENTS
CREATE POLICY "Public can insert events"
ON public.events
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Public can update events"
ON public.events
FOR UPDATE
USING (true)
WITH CHECK (true);

CREATE POLICY "Public can delete events"
ON public.events
FOR DELETE
USING (true);

-- EVENT LANGUAGES
CREATE POLICY "Public can insert event languages"
ON public.event_languages
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Public can update event languages"
ON public.event_languages
FOR UPDATE
USING (true)
WITH CHECK (true);

CREATE POLICY "Public can delete event languages"
ON public.event_languages
FOR DELETE
USING (true);

-- CUSTOM FIELDS CONFIG
CREATE POLICY "Public can insert custom fields config"
ON public.custom_fields_config
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Public can update custom fields config"
ON public.custom_fields_config
FOR UPDATE
USING (true)
WITH CHECK (true);

CREATE POLICY "Public can delete custom fields config"
ON public.custom_fields_config
FOR DELETE
USING (true);

-- GUESTS
CREATE POLICY "Public can insert guests"
ON public.guests
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Public can update guests"
ON public.guests
FOR UPDATE
USING (true)
WITH CHECK (true);

CREATE POLICY "Public can delete guests"
ON public.guests
FOR DELETE
USING (true);

-- LINKS
CREATE POLICY "Public can insert links"
ON public.links
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Public can update links"
ON public.links
FOR UPDATE
USING (true)
WITH CHECK (true);

CREATE POLICY "Public can delete links"
ON public.links
FOR DELETE
USING (true);