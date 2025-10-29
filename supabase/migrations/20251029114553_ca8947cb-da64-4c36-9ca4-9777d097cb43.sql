-- Create a new table for URL shortening system (separate from links table)
CREATE TABLE public.short_urls (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  target_url TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  clicks_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.short_urls ENABLE ROW LEVEL SECURITY;

-- Create policies for public access
CREATE POLICY "Public can read active short URLs"
ON public.short_urls
FOR SELECT
USING (is_active = true);

CREATE POLICY "Public can insert short URLs"
ON public.short_urls
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Public can update short URLs"
ON public.short_urls
FOR UPDATE
USING (true);

CREATE POLICY "Public can delete short URLs"
ON public.short_urls
FOR DELETE
USING (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_short_urls_updated_at
BEFORE UPDATE ON public.short_urls
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index on slug for faster lookups
CREATE INDEX idx_short_urls_slug ON public.short_urls(slug);
CREATE INDEX idx_short_urls_active ON public.short_urls(is_active);