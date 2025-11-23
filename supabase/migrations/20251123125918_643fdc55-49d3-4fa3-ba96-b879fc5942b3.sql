-- Add site_title and site_description columns to events table
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS site_title TEXT DEFAULT 'אישור הגעה לאירוע',
ADD COLUMN IF NOT EXISTS site_description TEXT DEFAULT 'מערכת אישור הגעה מתקדמת לאירועים. הזמינו אורחים בקלות ונהלו את רשימת המוזמנים';

-- Add comment to explain the columns
COMMENT ON COLUMN public.events.site_title IS 'The title that appears in browser tab and social media shares';
COMMENT ON COLUMN public.events.site_description IS 'The description that appears in search results and social media shares';