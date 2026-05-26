-- SQL Migration to create user_roadmaps table

CREATE TABLE IF NOT EXISTS public.user_roadmaps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    steps JSONB NOT NULL DEFAULT '[]', -- Array of step objects: { id, title, description, xp, courseId }
    is_custom BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.user_roadmaps ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own roadmaps" ON public.user_roadmaps;
DROP POLICY IF EXISTS "Users can insert own roadmaps" ON public.user_roadmaps;
DROP POLICY IF EXISTS "Users can update own roadmaps" ON public.user_roadmaps;
DROP POLICY IF EXISTS "Users can delete own roadmaps" ON public.user_roadmaps;

-- Create RLS Policies
CREATE POLICY "Users can view own roadmaps" ON public.user_roadmaps
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own roadmaps" ON public.user_roadmaps
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own roadmaps" ON public.user_roadmaps
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own roadmaps" ON public.user_roadmaps
    FOR DELETE USING (auth.uid() = user_id);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_user_roadmaps_modtime ON public.user_roadmaps;
CREATE TRIGGER update_user_roadmaps_modtime BEFORE UPDATE ON public.user_roadmaps
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
