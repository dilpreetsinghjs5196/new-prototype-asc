-- Create Agent Logging Tables as per Section 23 of agent/project.md

-- 1. agent_runs
CREATE TABLE IF NOT EXISTS public.agent_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id TEXT NOT NULL,
    agent_name TEXT NOT NULL,
    status TEXT NOT NULL, -- 'running', 'completed', 'failed'
    input_data JSONB,
    output_data JSONB,
    confidence NUMERIC(4, 3),
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    error TEXT
);

-- 2. agent_tasks
CREATE TABLE IF NOT EXISTS public.agent_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id TEXT NOT NULL,
    parent_task_id TEXT,
    agent_name TEXT NOT NULL,
    action TEXT NOT NULL,
    depends_on JSONB DEFAULT '[]'::jsonb,
    status TEXT NOT NULL, -- 'pending', 'running', 'completed', 'failed', 'blocked'
    input_data JSONB,
    output_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- 3. agent_events
CREATE TABLE IF NOT EXISTS public.agent_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id TEXT NOT NULL,
    source_agent TEXT NOT NULL,
    target_agent TEXT NOT NULL,
    event_type TEXT NOT NULL,
    payload JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. agent_context
CREATE TABLE IF NOT EXISTS public.agent_context (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id TEXT UNIQUE NOT NULL,
    patient_id TEXT,
    surgery_id TEXT,
    context_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    version INTEGER NOT NULL DEFAULT 1,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. agent_approvals
CREATE TABLE IF NOT EXISTS public.agent_approvals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id TEXT NOT NULL,
    agent_name TEXT NOT NULL,
    decision TEXT NOT NULL, -- 'approved', 'rejected', 'modified'
    approved_by TEXT,
    comments TEXT,
    approved_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS (Row Level Security) - default open for development / authenticated users
ALTER TABLE public.agent_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_context ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_approvals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read/write access for development"
    ON public.agent_runs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read/write access for development"
    ON public.agent_tasks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read/write access for development"
    ON public.agent_events FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read/write access for development"
    ON public.agent_context FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read/write access for development"
    ON public.agent_approvals FOR ALL USING (true) WITH CHECK (true);
