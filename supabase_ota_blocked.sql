-- Create table for OTA blocked dates (from iCal sync)
CREATE TABLE IF NOT EXISTS ota_blocked_dates (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    room_id text NOT NULL,
    blocked_date date NOT NULL,
    source text DEFAULT 'ical',
    synced_at timestamp with time zone DEFAULT now(),
    UNIQUE(room_id, blocked_date)
);

-- Enable RLS
ALTER TABLE ota_blocked_dates ENABLE ROW LEVEL SECURITY;

-- Public read access (for booking form)
CREATE POLICY "Allow public read of blocked dates"
ON ota_blocked_dates FOR SELECT
USING (true);

-- Allow insert/delete for anon (for sync operations)
CREATE POLICY "Allow anon insert blocked dates"
ON ota_blocked_dates FOR INSERT
WITH CHECK (true);

CREATE POLICY "Allow anon delete blocked dates"
ON ota_blocked_dates FOR DELETE
USING (true);

-- Index for fast room lookups
CREATE INDEX IF NOT EXISTS idx_ota_blocked_room ON ota_blocked_dates(room_id);
