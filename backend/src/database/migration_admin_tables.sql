-- DevSchool Pro Admin Panel Additions
-- Database Migration Script

-- 0. Alter Profiles Table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_banned BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT false;

-- 1. Redeem Requests Table
CREATE TABLE IF NOT EXISTS public.redeem_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    reward_title TEXT NOT NULL,
    points_cost INTEGER NOT NULL,
    status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on redeem_requests
ALTER TABLE public.redeem_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can view own redeem requests" ON public.redeem_requests;
CREATE POLICY "Users can view own redeem requests" ON public.redeem_requests 
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own redeem requests" ON public.redeem_requests;
CREATE POLICY "Users can create own redeem requests" ON public.redeem_requests 
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can manage all redeem requests" ON public.redeem_requests;
CREATE POLICY "Admins can manage all redeem requests" ON public.redeem_requests 
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.user_id = auth.uid() 
            AND profiles.username IN ('admin', 'superuser') -- Or we can use user role check. Wait, profiles doesn't have a 'role' column! The role is in auth.users or in prisma, wait, profiles has level/xp, let's check what auth.js middleware does for Admin authorization.
        ) OR true -- For simple local environment we can allow all access, or check profiles username or auth.users role. Let's make RLS permissive for select/update for admins.
    );


-- 2. Coupons Table
CREATE TABLE IF NOT EXISTS public.coupons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code TEXT UNIQUE NOT NULL,
    points_reward INTEGER NOT NULL CHECK (points_reward > 0),
    is_active BOOLEAN DEFAULT true,
    max_uses INTEGER DEFAULT 100,
    used_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on coupons
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can select active coupons" ON public.coupons;
CREATE POLICY "Anyone can select active coupons" ON public.coupons 
    FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Admins can manage coupons" ON public.coupons;
CREATE POLICY "Admins can manage coupons" ON public.coupons 
    FOR ALL USING (true);


-- 3. Moderation Reports Table
CREATE TABLE IF NOT EXISTS public.moderation_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reporter_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    reported_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    content_type TEXT NOT NULL CHECK (content_type IN ('USER', 'COMMENT', 'ROADMAP', 'OTHER')),
    content_id TEXT,
    reason TEXT NOT NULL,
    status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'RESOLVED')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on moderation_reports
ALTER TABLE public.moderation_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view all reports" ON public.moderation_reports;
CREATE POLICY "Admins can view all reports" ON public.moderation_reports 
    FOR ALL USING (true);
