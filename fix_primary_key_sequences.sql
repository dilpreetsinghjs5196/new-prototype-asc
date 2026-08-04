-- Reset and synchronize auto-incrementing ID sequences for primary tables
-- Run this in your Supabase SQL Editor if you ever get "duplicate key value violates unique constraint" errors

SELECT setval(pg_get_serial_sequence('public.surgeries', 'id'), COALESCE((SELECT MAX(id) FROM public.surgeries), 1), true);
SELECT setval(pg_get_serial_sequence('public.patients', 'id'), COALESCE((SELECT MAX(id) FROM public.patients), 1), true);
SELECT setval(pg_get_serial_sequence('public.surgeons', 'id'), COALESCE((SELECT MAX(id) FROM public.surgeons), 1), true);
