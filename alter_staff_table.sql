-- Run this script in your Supabase SQL Editor to add the necessary columns for the Staff Management feature

ALTER TABLE public.staff 
ADD COLUMN IF NOT EXISTS department text,
ADD COLUMN IF NOT EXISTS specialty text,
ADD COLUMN IF NOT EXISTS license_id text,
ADD COLUMN IF NOT EXISTS phone text,
ADD COLUMN IF NOT EXISTS email text,
ADD COLUMN IF NOT EXISTS hourly_rate numeric(10,2),
ADD COLUMN IF NOT EXISTS monthly_salary numeric(10,2),
ADD COLUMN IF NOT EXISTS benefits numeric(10,2);
