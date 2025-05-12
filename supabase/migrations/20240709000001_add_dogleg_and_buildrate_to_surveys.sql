-- Add dogleg_severity and build_rate columns to surveys table
ALTER TABLE surveys ADD COLUMN IF NOT EXISTS dogleg_severity NUMERIC DEFAULT 0;
ALTER TABLE surveys ADD COLUMN IF NOT EXISTS build_rate NUMERIC DEFAULT 0;
