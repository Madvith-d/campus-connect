-- Add gradient color fields to events table for persistent color theming
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS gradient_colors JSONB,
ADD COLUMN IF NOT EXISTS gradient_css TEXT;

-- Add comment explaining the fields
COMMENT ON COLUMN public.events.gradient_colors IS 'JSON object containing extracted color palette (vibrant, muted, darkVibrant, etc.)';
COMMENT ON COLUMN public.events.gradient_css IS 'Pre-computed CSS gradient string for performance';

-- Create an index on gradient_colors for potential future queries
CREATE INDEX IF NOT EXISTS idx_events_gradient_colors ON public.events USING GIN (gradient_colors);