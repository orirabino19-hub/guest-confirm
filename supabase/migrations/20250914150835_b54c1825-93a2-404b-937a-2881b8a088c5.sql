-- Add client authentication fields to events table
ALTER TABLE public.events 
ADD COLUMN client_username TEXT,
ADD COLUMN client_password TEXT,
ADD COLUMN client_access_enabled BOOLEAN DEFAULT false;

-- Add unique constraint on client_username to prevent duplicates
ALTER TABLE public.events 
ADD CONSTRAINT unique_client_username UNIQUE (client_username);

-- Create index for faster client login queries
CREATE INDEX idx_events_client_username ON public.events(client_username) WHERE client_username IS NOT NULL;