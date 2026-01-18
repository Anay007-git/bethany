-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. GUESTS TABLE
create table guests (
  id uuid default uuid_generate_v4() primary key,
  full_name text not null,
  email text, -- Optional because some might book via phone
  phone text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. BOOKINGS TABLE
create table bookings (
  id uuid default uuid_generate_v4() primary key,
  guest_id uuid references guests(id),
  room_id text not null, -- 'carmel', 'zion', etc.
  check_in date not null,
  check_out date not null,
  status text default 'pending', -- pending, confirmed, cancelled
  total_amount numeric,
  guest_count int,
  meal_plan jsonb, -- Stores { breakfast: {veg: 2}, lunch: {...} }
  message text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. PAYMENTS TABLE
create table payments (
  id uuid default uuid_generate_v4() primary key,
  booking_id uuid references bookings(id),
  amount numeric not null,
  currency text default 'INR',
  status text default 'pending', -- pending, success, failed
  payment_method text, -- 'razorpay', 'cash', etc.
  transaction_id text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. RLS POLICIES (Row Level Security)
-- Enable RLS
alter table guests enable row level security;
alter table bookings enable row level security;
alter table payments enable row level security;

-- Allow public read access to bookings (for calendar availability)
create policy "Public read bookings"
  on bookings for select
  using (true);

-- Allow public insert (for booking form)
create policy "Public insert bookings"
  on bookings for insert
  with check (true);

create policy "Public insert guests"
  on guests for insert
  with check (true);

-- (In a real app, you'd lock this down, but for this portfolio/demo, public write is okay for the booking form)
