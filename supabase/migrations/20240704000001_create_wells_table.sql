-- Create wells table if it doesn't exist already
CREATE TABLE IF NOT EXISTS wells (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR NOT NULL,
  api_number VARCHAR,
  operator VARCHAR,
  location VARCHAR,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE,
  status VARCHAR DEFAULT 'active',
  rig_name VARCHAR,
  field_name VARCHAR,
  target_depth NUMERIC,
  current_depth NUMERIC,
  sensor_offset NUMERIC DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE
);

-- Enable realtime for the wells table
alter publication supabase_realtime add table wells;
