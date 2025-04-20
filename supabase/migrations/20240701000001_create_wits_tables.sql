-- Create tables for WITS data and surveys

-- Table for storing WITS connection configurations
CREATE TABLE IF NOT EXISTS wits_connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  protocol TEXT NOT NULL,
  ip_address TEXT,
  port INTEGER,
  wits_level TEXT,
  auto_connect BOOLEAN DEFAULT false,
  auto_reconnect BOOLEAN DEFAULT true,
  enable_logging BOOLEAN DEFAULT true,
  log_data BOOLEAN DEFAULT true,
  timeout INTEGER DEFAULT 30,
  retry_interval INTEGER DEFAULT 5,
  serial_port TEXT,
  baud_rate INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for storing WITS channel mappings
CREATE TABLE IF NOT EXISTS wits_channel_mappings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  connection_id UUID REFERENCES wits_connections(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  wits_id INTEGER NOT NULL,
  channel INTEGER NOT NULL,
  unit TEXT,
  active BOOLEAN DEFAULT true,
  mapping_type TEXT NOT NULL, -- 'drilling', 'directional', etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for storing survey data
CREATE TABLE IF NOT EXISTS surveys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  well_id UUID,
  measured_depth NUMERIC NOT NULL,
  inclination NUMERIC NOT NULL,
  azimuth NUMERIC NOT NULL,
  tool_face NUMERIC,
  gamma NUMERIC,
  tvd NUMERIC,
  northing NUMERIC,
  easting NUMERIC,
  dls NUMERIC,
  vibration NUMERIC,
  temperature NUMERIC,
  magnetic_field NUMERIC,
  gravity NUMERIC,
  signal_quality NUMERIC,
  battery_level NUMERIC,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for storing wells information
CREATE TABLE IF NOT EXISTS wells (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  operator TEXT,
  rig TEXT,
  field TEXT,
  location TEXT,
  surface_latitude NUMERIC,
  surface_longitude NUMERIC,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for storing WITS raw data logs
CREATE TABLE IF NOT EXISTS wits_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  connection_id UUID REFERENCES wits_connections(id) ON DELETE CASCADE,
  log_type TEXT NOT NULL, -- 'connection', 'data', 'error'
  message TEXT NOT NULL,
  raw_data JSONB,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable realtime for all tables
alter publication supabase_realtime add table wits_connections;
alter publication supabase_realtime add table wits_channel_mappings;
alter publication supabase_realtime add table surveys;
alter publication supabase_realtime add table wells;
alter publication supabase_realtime add table wits_logs;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_surveys_well_id ON surveys(well_id);
CREATE INDEX IF NOT EXISTS idx_surveys_timestamp ON surveys(timestamp);
CREATE INDEX IF NOT EXISTS idx_wits_channel_mappings_connection_id ON wits_channel_mappings(connection_id);
CREATE INDEX IF NOT EXISTS idx_wits_logs_connection_id ON wits_logs(connection_id);
CREATE INDEX IF NOT EXISTS idx_wits_logs_timestamp ON wits_logs(timestamp);
