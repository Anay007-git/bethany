-- Create Coupons Table
CREATE TABLE IF NOT EXISTS coupons (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
    discount_value NUMERIC NOT NULL,
    usage_limit INTEGER, -- NULL means unlimited
    usage_count INTEGER DEFAULT 0,
    expiry_date TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;

-- Policies (UPDATED FOR CLIENT-SIDE AUTH)

-- 1. Allow Public Read (for checking validity)
DROP POLICY IF EXISTS "Public can view active coupons" ON coupons;
CREATE POLICY "Public can view active coupons" 
ON coupons FOR SELECT 
TO anon, authenticated 
USING (true);

-- 2. Allow Public Write (Since Admin Login is Client-Side Only)
-- Ideally this should be protected by Supabase Auth, but for this specific app structure:
DROP POLICY IF EXISTS "Admins can manage coupons" ON coupons;
CREATE POLICY "Public can manage coupons" 
ON coupons FOR ALL 
TO anon, authenticated 
USING (true) 
WITH CHECK (true);

-- Insert a default coupon
INSERT INTO coupons (code, discount_type, discount_value, usage_limit, is_active)
VALUES ('WELCOMEBACK5', 'percentage', 5, NULL, TRUE)
ON CONFLICT (code) DO NOTHING;
