-- TEST DATA GENERATION SCRIPT
-- Copy and run this entire block in the Supabase SQL Editor.

-- This script will:
-- 1. Create a dummy guest ("Test Guest").
-- 2. Create a booking linked to that guest.

WITH new_guest AS (
  INSERT INTO guests (full_name, email, phone)
  VALUES ('Test Guest', 'test@guest.com', '+91-9876543210')
  RETURNING id
)
INSERT INTO bookings (
  guest_id, 
  room_ids, 
  check_in, 
  check_out, 
  guests_count, 
  total_price, 
  meal_preferences, 
  special_requests, 
  status,
  source
)
SELECT 
  id, 
  '[{"id": "r1", "name": "Cozy Haven"}, {"id": "r2", "name": "Mountain View"}]'::jsonb, 
  CURRENT_DATE, 
  CURRENT_DATE + 3, -- 3 days from now
  2, 
  15000.00, 
  'Breakfast (Veg: 2) | Dinner (NonVeg: 2)', 
  'This is a test booking to verify database connectivity.', 
  'confirmed',
  'test_script'
FROM new_guest;

-- Select the inserted data to verify
SELECT * FROM bookings WHERE source = 'test_script' ORDER BY created_at DESC LIMIT 1;
