-- Create the ot_extra_cost table
CREATE TABLE IF NOT EXISTS public.ot_extra_cost (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cpt_codes TEXT NOT NULL,
    supply_cost NUMERIC(10, 2) DEFAULT 0.00,
    implant_cost NUMERIC(10, 2) DEFAULT 0.00,
    labour_cost NUMERIC(10, 2) DEFAULT 0.00,
    or_room_cost NUMERIC(10, 2) DEFAULT 0.00,
    medication_cost NUMERIC(10, 2) DEFAULT 0.00,
    tray_cost NUMERIC(10, 2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add a unique constraint if cpt_codes should be unique per row
-- ALTER TABLE public.ot_extra_cost ADD CONSTRAINT ot_extra_cost_cpt_codes_key UNIQUE (cpt_codes);

-- Enable Row Level Security
ALTER TABLE public.ot_extra_cost ENABLE ROW LEVEL SECURITY;

-- Create policy to allow read access to everyone (or anon)
CREATE POLICY "Enable read access for all users" ON public.ot_extra_cost
    FOR SELECT
    TO public
    USING (true);

-- Create policy to allow insert/update/delete for public/anon users
CREATE POLICY "Enable insert for all users" ON public.ot_extra_cost
    FOR INSERT
    TO public
    WITH CHECK (true);

CREATE POLICY "Enable update for all users" ON public.ot_extra_cost
    FOR UPDATE
    TO public
    USING (true);
