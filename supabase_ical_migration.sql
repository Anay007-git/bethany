-- Add iCal import URL column to rooms table for OTA sync
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS ical_import_url text;
