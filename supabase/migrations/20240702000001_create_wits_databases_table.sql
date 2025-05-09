-- Create the wits_databases table if it doesn't exist
CREATE TABLE IF NOT EXISTS wits_databases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  size TEXT DEFAULT '0 MB',
  tables_count INTEGER DEFAULT 0,
  last_modified TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE,
  user_id UUID,
  description TEXT,
  well_name TEXT,
  rig_name TEXT,
  access_count INTEGER DEFAULT 0,
  last_accessed TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable row level security
ALTER TABLE wits_databases ENABLE ROW LEVEL SECURITY;

-- Create policy for public access
DROP POLICY IF EXISTS "Public access to wits_databases";
CREATE POLICY "Public access to wits_databases"
  ON wits_databases
  FOR ALL
  USING (true);

-- Enable realtime
alter publication supabase_realtime add table wits_databases;