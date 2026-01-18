-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. GUESTS TABLE
-- Stores unique guest information for CRM / Marketing
create table guests (
  id uuid primary key default uuid_generate_v4(),
  full_name text not null,
  email text not null,
  phone text not null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- 2. BOOKINGS TABLE
-- Stores main reservation details
create table bookings (
  id uuid primary key default uuid_generate_v4(),
  guest_id uuid references guests(id), 
  room_ids jsonb not null, -- Stores array of selected rooms [{"id": "r1", "name": "Room 1"}]
  check_in date not null,
  check_out date not null,
  guests_count int not null,
  total_price decimal(10,2) not null,
  meal_preferences text, -- Stores "Breakfast (Veg: 2) | Lunch (NonVeg: 1)" etc.
  special_requests text, -- Stores guest message
  status text check (status in ('pending', 'confirmed', 'cancelled', 'booked')) default 'pending',
  source text default 'website', -- 'website', 'airbnb', 'walk-in'
  created_at timestamp with time zone default now()
);

-- 3. PAYMENTS TABLE
-- Future-proof for Payment Gateway
create table payments (
  id uuid primary key default uuid_generate_v4(),
  booking_id uuid references bookings(id),
  amount decimal(10,2) not null,
  currency text default 'INR',
  status text check (status in ('pending', 'completed', 'failed')) default 'pending',
  transaction_id text, -- From Gateway (Razopay/Stripe)
  payment_method text, -- 'upi', 'card', 'cash'
  created_at timestamp with time zone default now()
);

-- RLS POLICIES (Row Level Security)
-- Allow public insert (for booking form)
alter table guests enable row level security;
alter table bookings enable row level security;
alter table payments enable row level security;

-- Policy: Allow anon key to INSERT (Create Booking)
create policy "Allow public insert guests" on guests for insert with check (true);
create policy "Allow public insert bookings" on bookings for insert with check (true);
create policy "Allow public insert payments" on payments for insert with check (true);

-- Policy: Allow anon to READ (Required for .select() after insert)
create policy "Allow public read guests" on guests for select using (true);
create policy "Allow public read bookings" on bookings for select using (true);
create policy "Allow public read payments" on payments for select using (true); 

-- Policy: Allow anon to UPDATE (Required for Admin Dashboard to change status)
-- Ideally this should be authenticated, but for this simplified setup:
create policy "Allow public update bookings" on bookings for update using (true); 
