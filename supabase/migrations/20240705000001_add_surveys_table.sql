-- Create surveys table if it doesn't exist
CREATE TABLE IF NOT EXISTS surveys (
  id UUID PRIMARY KEY,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  bit_depth NUMERIC NOT NULL,
  inclination NUMERIC NOT NULL,
  azimuth NUMERIC NOT NULL,
  tool_face NUMERIC NOT NULL,
  b_total NUMERIC NOT NULL,
  a_total NUMERIC NOT NULL,
  dip NUMERIC NOT NULL,
  tool_temp NUMERIC NOT NULL,
  well_name TEXT,
  rig_name TEXT,
  quality_check JSONB,
  well_id UUID REFERENCES wells(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  sensor_offset NUMERIC,
  measured_depth NUMERIC,
  database_id UUID
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS surveys_well_id_idx ON surveys(well_id);
CREATE INDEX IF NOT EXISTS surveys_timestamp_idx ON surveys(timestamp);
