-- 1. Create ROOMS Table
create table if not exists rooms (
  id text primary key, -- 'carmel', 'jordan', 'sion', 'zion'
  name text not null,
  price_high_season decimal(10,2) not null,
  price_low_season decimal(10,2) not null,
  capacity text not null, -- Display text e.g. "4 Adults"
  view_type text,
  size text,
  features text[], -- JSON array or Postgres array
  images text[], -- JSON array or Postgres array
  description text,
  ical_import_url text, -- For OTA Sync
  is_active boolean default true,
  created_at timestamp with time zone default now()
);

-- 2. Enable RLS
alter table rooms enable row level security;

-- 3. Policies
create policy "Allow public read rooms" on rooms for select using (true);
create policy "Allow all access to rooms for admin" on rooms for all using (true); -- Simplified access

-- 4. Seed Data (Existing Rooms)
insert into rooms (id, name, price_high_season, price_low_season, capacity, view_type, size, features, images)
values 
('carmel', 'Carmel', 3600, 3000, '4 Adults + 1 Kid', 'Mountain View', '616 sq.ft (57 sq.mt)', 
 ARRAY['Attached Bathroom', 'Daily Housekeeping', 'Wi-Fi', 'Air Purifier'], 
 ARRAY['https://r1imghtlak.mmtcdn.com/bc566280898d11ec90380a58a9feac02.jpg?output-quality=75&downsize=*:500&crop=990:500', 
       'https://r1imghtlak.mmtcdn.com/6ff89f94-7679-4e40-a7c5-aa5b01a354a9.jpg?output-quality=75&downsize=*:500&crop=990:500', 
       'https://r1imghtlak.mmtcdn.com/cd07ac6a898d11ecae540a58a9feac02.jpg?output-quality=75&downsize=*:500&crop=990:500']),

('jordan', 'Jordan', 3000, 2500, '4 Adults', 'Courtyard View', '380 sq.ft (35 sq.mt)', 
 ARRAY['Attached Bathroom'], 
 ARRAY['https://r1imghtlak.mmtcdn.com/cd07ac6a898d11ecae540a58a9feac02.jpg?output-quality=75&downsize=*:500&crop=990:500', 
       'https://r1imghtlak.mmtcdn.com/e3a1d318-3eea-4b47-a1ee-9b5d41b619dd.jpg?output-quality=75&downsize=*:500&crop=990:500', 
       'https://r1imghtlak.mmtcdn.com/d5e107d3-6fb4-40f4-af8d-41fd9d277ee0.jpg?output-quality=75&downsize=*:500&crop=990:500']),

('sion', 'Sion Room', 3000, 2500, '4 Adults', 'City View', '320 sq.ft (28 sq.mt)', 
 ARRAY['Attached Bathroom'], 
 ARRAY['https://r1imghtlak.mmtcdn.com/d13f1656898d11ec8dd80a58a9feac02.jpg?output-quality=75&downsize=*:500&crop=990:500', 
       'https://r1imghtlak.mmtcdn.com/e2ee5312898d11ec93030a58a9feac02.jpg?output-quality=75&downsize=*:500&crop=990:500', 
       'https://r1imghtlak.mmtcdn.com/bc566280898d11ec90380a58a9feac02.jpg?output-quality=75&downsize=*:500&crop=990:500']),

('zion', 'Zion', 3000, 2500, '4 Adults', 'City View', '528 sq.ft (48 sq.mt)', 
 ARRAY['Attached Bathroom'], 
 ARRAY['https://r1imghtlak.mmtcdn.com/e2ee5312898d11ec93030a58a9feac02.jpg?output-quality=75&downsize=*:500&crop=990:500', 
       'https://r1imghtlak.mmtcdn.com/6ff89f94-7679-4e40-a7c5-aa5b01a354a9.jpg?output-quality=75&downsize=*:500&crop=990:500', 
       'https://r1imghtlak.mmtcdn.com/cd07ac6a898d11ecae540a58a9feac02.jpg?output-quality=75&downsize=*:500&crop=990:500'])
on conflict (id) do nothing;
