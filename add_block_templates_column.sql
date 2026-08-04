-- Add block_templates column to surgeons table in Supabase
ALTER TABLE public.surgeons 
ADD COLUMN IF NOT EXISTS block_templates JSONB DEFAULT '[]'::jsonb;
