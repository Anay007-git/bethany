-- ========================================================================
-- BETHANY HOMESTAY: FAMILY & COUPLE MONTHLY ROOM SUBSCRIPTION MIGRATION
-- Authoritative Schema for Subscriptions, Applications, Occupants,
-- Recurring Mandates, Room Allocations, and Atomic Concurrency Booking
-- ========================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. SUBSCRIPTION USERS (Public Member Identity)
CREATE TABLE IF NOT EXISTS subscription_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    phone TEXT,
    auth_provider TEXT NOT NULL CHECK (auth_provider IN ('google', 'email_otp', 'manual')),
    is_email_verified BOOLEAN DEFAULT FALSE,
    otp_code TEXT,
    otp_expires_at TIMESTAMP WITH TIME ZONE,
    otp_attempts INT DEFAULT 0,
    last_otp_sent_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index on email for fast lookups
CREATE INDEX IF NOT EXISTS idx_subscription_users_email ON subscription_users(email);

-- 2. SUBSCRIPTION APPLICATIONS (Application Lifecycle)
-- Statuses: draft, pending_approval, additional_info_required, approved, rejected
CREATE TABLE IF NOT EXISTS subscription_applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES subscription_users(id) ON DELETE CASCADE,
    category TEXT NOT NULL CHECK (category IN ('couple', 'family')),
    primary_name TEXT NOT NULL,
    primary_email TEXT NOT NULL,
    primary_phone TEXT NOT NULL,
    primary_address TEXT NOT NULL,
    id_proof_type TEXT NOT NULL DEFAULT 'Aadhaar / Passport',
    id_proof_number TEXT,
    status TEXT NOT NULL CHECK (status IN ('draft', 'pending_approval', 'additional_info_required', 'approved', 'rejected')) DEFAULT 'draft',
    admin_notes TEXT,
    rejection_reason TEXT,
    reviewed_by TEXT,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    rules_accepted BOOLEAN NOT NULL DEFAULT FALSE,
    rules_accepted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscription_applications_user ON subscription_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_subscription_applications_status ON subscription_applications(status);

-- 3. SUBSCRIPTION OCCUPANTS (Max 4 occupants total, including primary applicant)
CREATE TABLE IF NOT EXISTS subscription_occupants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_id UUID NOT NULL REFERENCES subscription_applications(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    age INT NOT NULL CHECK (age >= 0 AND age <= 120),
    relationship TEXT NOT NULL, -- 'Self' (Primary Applicant), 'Spouse', 'Child', 'Parent', etc.
    id_proof_details TEXT,
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscription_occupants_app ON subscription_occupants(application_id);

-- Enforce Max 4 Occupants per Application via Trigger
CREATE OR REPLACE FUNCTION check_max_occupants()
RETURNS TRIGGER AS $$
DECLARE
    occupant_count INT;
BEGIN
    SELECT COUNT(*) INTO occupant_count
    FROM subscription_occupants
    WHERE application_id = NEW.application_id;

    IF occupant_count >= 4 THEN
        RAISE EXCEPTION 'A subscription application cannot have more than 4 occupants (including the primary applicant).';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_check_max_occupants ON subscription_occupants;
CREATE TRIGGER trg_check_max_occupants
BEFORE INSERT ON subscription_occupants
FOR EACH ROW
EXECUTE FUNCTION check_max_occupants();

-- 4. SUBSCRIPTION PLANS (Configurable Plans with 3-Month Minimum Commitment)
CREATE TABLE IF NOT EXISTS subscription_plans (
    id TEXT PRIMARY KEY, -- e.g. 'family_sanctuary_tier', 'couple_serenity_tier'
    title TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('couple', 'family', 'both')),
    monthly_price DECIMAL(10,2) NOT NULL,
    commitment_months INT NOT NULL DEFAULT 3 CHECK (commitment_months >= 3),
    nights_per_month INT NOT NULL DEFAULT 5,
    description TEXT,
    perks JSONB DEFAULT '[]'::jsonb,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seed default initial plans if not already present
INSERT INTO subscription_plans (id, title, category, monthly_price, commitment_months, nights_per_month, description, perks)
VALUES
(
    'couple_serenity_tier',
    'Couple Himalayan Serenity',
    'couple',
    18500.00,
    3,
    5,
    'Exclusive 5 nights monthly mountain retreat tailored for couples seeking peace and scenic productivity.',
    '["5 Nights / Month across Carmel or Jordan Suites", "Complimentary Himalayan Organic Breakfast", "High-Speed Wi-Fi for Remote Work", "Flexible Mid-Week & Weekend Booking", "3-Month Commitment with AutoPay"]'::jsonb
),
(
    'family_sanctuary_tier',
    'Family Mountain Sanctuary',
    'family',
    27500.00,
    3,
    6,
    'Spacious 6 nights monthly family sanctuary for up to 4 family members with private courtyard & mountain views.',
    '["6 Nights / Month across Carmel, Zion, or Sion Suites", "Full Homestay Kitchen & Meal Dining Access", "Up to 4 Verified Family Occupants", "Priority Reservation on Subscription Inventory", "3-Month Commitment with AutoPay"]'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    monthly_price = EXCLUDED.monthly_price,
    nights_per_month = EXCLUDED.nights_per_month,
    perks = EXCLUDED.perks;

-- 5. MEMBERSHIPS (Active Member Subscriptions)
CREATE TABLE IF NOT EXISTS subscription_memberships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES subscription_users(id),
    application_id UUID NOT NULL REFERENCES subscription_applications(id),
    plan_id TEXT NOT NULL REFERENCES subscription_plans(id),
    status TEXT NOT NULL CHECK (status IN ('pending_mandate', 'active', 'grace_period', 'paused', 'cancelled', 'expired')) DEFAULT 'pending_mandate',
    start_date DATE NOT NULL,
    renewal_date DATE NOT NULL,
    commitment_end_date DATE NOT NULL, -- At least start_date + 3 months
    monthly_price DECIMAL(10,2) NOT NULL,
    nights_allocated_monthly INT NOT NULL,
    nights_remaining_current_period INT NOT NULL,
    auto_pay_authorized BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscription_memberships_user ON subscription_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_subscription_memberships_status ON subscription_memberships(status);

-- 6. SUBSCRIPTION MANDATES (Recurring e-Mandates & RBI Compliance)
CREATE TABLE IF NOT EXISTS subscription_mandates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    membership_id UUID NOT NULL REFERENCES subscription_memberships(id) ON DELETE CASCADE,
    gateway TEXT NOT NULL DEFAULT 'phonepe_recurring', -- or 'razorpay_subscriptions'
    mandate_id TEXT NOT NULL UNIQUE,
    mandate_status TEXT NOT NULL CHECK (mandate_status IN ('initiated', 'active', 'failed', 'revoked', 'expired')) DEFAULT 'initiated',
    max_amount DECIMAL(10,2) NOT NULL,
    payment_method TEXT DEFAULT 'upi_autopay', -- 'upi_autopay', 'card_emandate'
    auto_pay_authorized_at TIMESTAMP WITH TIME ZONE,
    next_billing_date DATE,
    failure_count INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. SUBSCRIPTION ROOM ALLOCATIONS (Dedicated Admin Inventory)
-- Administrators allocate specific rooms on specific dates for subscription members.
-- Only dates present with is_available = true can be booked by members!
CREATE TABLE IF NOT EXISTS subscription_room_allocations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id TEXT NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    allocated_date DATE NOT NULL,
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (room_id, allocated_date)
);

CREATE INDEX IF NOT EXISTS idx_allocations_room_date ON subscription_room_allocations(room_id, allocated_date);

-- 8. SUBSCRIPTION BOOKINGS (Member Reservations)
CREATE TABLE IF NOT EXISTS subscription_bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    membership_id UUID NOT NULL REFERENCES subscription_memberships(id),
    user_id UUID NOT NULL REFERENCES subscription_users(id),
    room_id TEXT NOT NULL REFERENCES rooms(id),
    check_in DATE NOT NULL,
    check_out DATE NOT NULL,
    nights INT NOT NULL CHECK (nights > 0),
    attending_occupants JSONB NOT NULL DEFAULT '[]'::jsonb, -- Occupants list (names & IDs)
    special_notes TEXT,
    status TEXT NOT NULL CHECK (status IN ('confirmed', 'completed', 'cancelled')) DEFAULT 'confirmed',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscription_bookings_dates ON subscription_bookings(room_id, check_in, check_out);

-- 9. PAYMENT TRANSACTIONS & WEBHOOK AUDIT
CREATE TABLE IF NOT EXISTS subscription_payment_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id TEXT NOT NULL UNIQUE, -- For idempotency
    gateway TEXT NOT NULL,
    event_type TEXT NOT NULL, -- e.g. 'mandate.activated', 'subscription.charged', 'charge.failed'
    membership_id UUID REFERENCES subscription_memberships(id),
    payload JSONB NOT NULL,
    processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_events_id ON subscription_payment_events(event_id);

-- 10. ATOMIC CONCURRENCY FUNCTION
-- Validates that a requested date range:
-- 1. Is explicitly allocated for subscription bookings (in subscription_room_allocations)
-- 2. Does NOT overlap with any public website/walk-in booking in `bookings`
-- 3. Does NOT overlap with any OTA blocked dates in `ota_blocked_dates`
-- 4. Does NOT overlap with another member's subscription booking in `subscription_bookings`
CREATE OR REPLACE FUNCTION book_subscription_stay_atomic(
    p_membership_id UUID,
    p_user_id UUID,
    p_room_id TEXT,
    p_check_in DATE,
    p_check_out DATE,
    p_nights INT,
    p_attending_occupants JSONB,
    p_special_notes TEXT DEFAULT ''
)
RETURNS JSONB AS $$
DECLARE
    v_allocated_count INT;
    v_public_overlap_count INT;
    v_ota_overlap_count INT;
    v_sub_overlap_count INT;
    v_remaining_nights INT;
    v_membership_status TEXT;
    v_booking_id UUID;
BEGIN
    -- 1. Check membership status and remaining night balance
    SELECT status, nights_remaining_current_period
    INTO v_membership_status, v_remaining_nights
    FROM subscription_memberships
    WHERE id = p_membership_id AND user_id = p_user_id;

    IF v_membership_status IS NULL OR v_membership_status != 'active' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Membership is not currently active.');
    END IF;

    IF v_remaining_nights < p_nights THEN
        RETURN jsonb_build_object('success', false, 'error', 'Insufficient remaining nights for this period.');
    END IF;

    -- 2. Verify all dates in range [p_check_in, p_check_out - 1] are explicitly allocated
    SELECT COUNT(*) INTO v_allocated_count
    FROM subscription_room_allocations
    WHERE room_id = p_room_id
      AND allocated_date >= p_check_in
      AND allocated_date < p_check_out
      AND is_available = TRUE;

    IF v_allocated_count < p_nights THEN
        RETURN jsonb_build_object('success', false, 'error', 'One or more selected dates are not allocated for subscription bookings.');
    END IF;

    -- 3. Cross-channel validation: Check public bookings table
    -- Overlap condition: check_in < p_check_out AND check_out > p_check_in
    SELECT COUNT(*) INTO v_public_overlap_count
    FROM bookings
    WHERE status IN ('confirmed', 'booked', 'pending')
      AND check_in < p_check_out
      AND check_out > p_check_in
      AND room_ids @> jsonb_build_array(jsonb_build_object('id', p_room_id));

    IF v_public_overlap_count > 0 THEN
        RETURN jsonb_build_object('success', false, 'error', 'The room is already reserved for a standard stay on these dates.');
    END IF;

    -- 4. Check OTA blocked dates
    SELECT COUNT(*) INTO v_ota_overlap_count
    FROM ota_blocked_dates
    WHERE room_id = p_room_id
      AND blocked_date >= p_check_in
      AND blocked_date < p_check_out;

    IF v_ota_overlap_count > 0 THEN
        RETURN jsonb_build_object('success', false, 'error', 'The room is blocked by OTA synchronization on these dates.');
    END IF;

    -- 5. Check other subscription bookings
    SELECT COUNT(*) INTO v_sub_overlap_count
    FROM subscription_bookings
    WHERE room_id = p_room_id
      AND status = 'confirmed'
      AND check_in < p_check_out
      AND check_out > p_check_in;

    IF v_sub_overlap_count > 0 THEN
        RETURN jsonb_build_object('success', false, 'error', 'The room is already booked by another member on these dates.');
    END IF;

    -- 6. Insert atomic booking
    INSERT INTO subscription_bookings (
        membership_id,
        user_id,
        room_id,
        check_in,
        check_out,
        nights,
        attending_occupants,
        special_notes,
        status
    ) VALUES (
        p_membership_id,
        p_user_id,
        p_room_id,
        p_check_in,
        p_check_out,
        p_nights,
        p_attending_occupants,
        p_special_notes,
        'confirmed'
    ) RETURNING id INTO v_booking_id;

    -- 7. Deduct nights balance
    UPDATE subscription_memberships
    SET nights_remaining_current_period = nights_remaining_current_period - p_nights,
        updated_at = NOW()
    WHERE id = p_membership_id;

    RETURN jsonb_build_object(
        'success', true,
        'booking_id', v_booking_id,
        'remaining_nights', v_remaining_nights - p_nights
    );
END;
$$ LANGUAGE plpgsql;

-- 11. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE subscription_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_occupants ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_mandates ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_room_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_payment_events ENABLE ROW LEVEL SECURITY;

-- Public/Anon access policies for subscription tables
CREATE POLICY "Allow read plans" ON subscription_plans FOR SELECT USING (true);
CREATE POLICY "Allow user all subscription_users" ON subscription_users FOR ALL USING (true);
CREATE POLICY "Allow user all subscription_applications" ON subscription_applications FOR ALL USING (true);
CREATE POLICY "Allow user all subscription_occupants" ON subscription_occupants FOR ALL USING (true);
CREATE POLICY "Allow user all subscription_memberships" ON subscription_memberships FOR ALL USING (true);
CREATE POLICY "Allow user all subscription_mandates" ON subscription_mandates FOR ALL USING (true);
CREATE POLICY "Allow user all subscription_room_allocations" ON subscription_room_allocations FOR ALL USING (true);
CREATE POLICY "Allow user all subscription_bookings" ON subscription_bookings FOR ALL USING (true);
CREATE POLICY "Allow user all subscription_payment_events" ON subscription_payment_events FOR ALL USING (true);
