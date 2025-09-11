-- Update all existing open links to use standard 'open' slug
UPDATE public.links 
SET slug = 'open' 
WHERE type = 'open' AND slug LIKE 'open-%';