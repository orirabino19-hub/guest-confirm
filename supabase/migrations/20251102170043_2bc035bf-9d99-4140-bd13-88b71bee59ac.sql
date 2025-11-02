-- Add accordion_form_enabled column to events table
ALTER TABLE events 
ADD COLUMN accordion_form_enabled boolean DEFAULT false;

COMMENT ON COLUMN events.accordion_form_enabled IS 'Enable accordion-style form where user selects gender first, then fills details';