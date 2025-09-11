-- Add first_name and last_name columns to guests table
ALTER TABLE public.guests 
ADD COLUMN first_name TEXT,
ADD COLUMN last_name TEXT;

-- Add first_name and last_name columns to rsvp_submissions table  
ALTER TABLE public.rsvp_submissions
ADD COLUMN first_name TEXT,
ADD COLUMN last_name TEXT;

-- Update existing data by splitting full_name where possible
-- For guests table
UPDATE public.guests 
SET 
  first_name = CASE 
    WHEN full_name IS NOT NULL AND trim(full_name) != '' THEN
      CASE 
        WHEN position(' ' in trim(full_name)) > 0 THEN
          trim(substring(trim(full_name) from 1 for position(' ' in trim(full_name)) - 1))
        ELSE
          trim(full_name)
      END
    ELSE NULL
  END,
  last_name = CASE 
    WHEN full_name IS NOT NULL AND trim(full_name) != '' AND position(' ' in trim(full_name)) > 0 THEN
      trim(substring(trim(full_name) from position(' ' in trim(full_name)) + 1))
    ELSE NULL
  END
WHERE full_name IS NOT NULL;

-- For rsvp_submissions table
UPDATE public.rsvp_submissions 
SET 
  first_name = CASE 
    WHEN full_name IS NOT NULL AND trim(full_name) != '' THEN
      CASE 
        WHEN position(' ' in trim(full_name)) > 0 THEN
          trim(substring(trim(full_name) from 1 for position(' ' in trim(full_name)) - 1))
        ELSE
          trim(full_name)
      END
    ELSE NULL
  END,
  last_name = CASE 
    WHEN full_name IS NOT NULL AND trim(full_name) != '' AND position(' ' in trim(full_name)) > 0 THEN
      trim(substring(trim(full_name) from position(' ' in trim(full_name)) + 1))
    ELSE NULL
  END
WHERE full_name IS NOT NULL;