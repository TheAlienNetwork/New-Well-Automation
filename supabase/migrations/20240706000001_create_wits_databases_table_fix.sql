-- Create wits_databases table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.wits_databases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  well_id UUID REFERENCES public.wells(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_modified TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID,
  is_active BOOLEAN DEFAULT true,
  data_count INTEGER DEFAULT 0,
  settings JSONB DEFAULT '{}'::jsonb
);

-- Enable row level security
ALTER TABLE public.wits_databases ENABLE ROW LEVEL SECURITY;

-- Create policies
DROP POLICY IF EXISTS "Users can view their own databases" ON public.wits_databases;
CREATE POLICY "Users can view their own databases"
  ON public.wits_databases
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can insert their own databases" ON public.wits_databases;
CREATE POLICY "Users can insert their own databases"
  ON public.wits_databases
  FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update their own databases" ON public.wits_databases;
CREATE POLICY "Users can update their own databases"
  ON public.wits_databases
  FOR UPDATE
  USING (true);

DROP POLICY IF EXISTS "Users can delete their own databases" ON public.wits_databases;
CREATE POLICY "Users can delete their own databases"
  ON public.wits_databases
  FOR DELETE
  USING (true);

-- Enable realtime
alter publication supabase_realtime add table public.wits_databases;