-- Add labels column to custom_fields_config table to store translations for all languages
ALTER TABLE custom_fields_config 
ADD COLUMN IF NOT EXISTS labels JSONB DEFAULT '{}'::jsonb;

COMMENT ON COLUMN custom_fields_config.labels IS 'Stores label translations for different languages as key-value pairs (e.g., {"de": "Deutsch Label", "fr": "Label Français"})';