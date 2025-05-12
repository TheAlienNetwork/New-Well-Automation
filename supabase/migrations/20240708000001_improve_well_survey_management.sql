-- Improve well and survey management with better indexing and constraints

-- Add indexes to improve query performance
CREATE INDEX IF NOT EXISTS idx_surveys_well_id ON surveys(well_id);
CREATE INDEX IF NOT EXISTS idx_surveys_timestamp ON surveys(timestamp);
CREATE INDEX IF NOT EXISTS idx_wells_is_active ON wells(is_active);

-- Add a composite index for common query patterns
CREATE INDEX IF NOT EXISTS idx_surveys_well_timestamp ON surveys(well_id, timestamp);

-- Add a trigger to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply the trigger to wells table
DROP TRIGGER IF EXISTS update_wells_updated_at ON wells;
CREATE TRIGGER update_wells_updated_at
BEFORE UPDATE ON wells
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Apply the trigger to surveys table
DROP TRIGGER IF EXISTS update_surveys_updated_at ON surveys;
CREATE TRIGGER update_surveys_updated_at
BEFORE UPDATE ON surveys
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Add a function to get the latest survey for a well
CREATE OR REPLACE FUNCTION get_latest_survey_for_well(well_id_param UUID)
RETURNS TABLE (
    id UUID,
    timestamp TIMESTAMPTZ,
    bit_depth NUMERIC,
    inclination NUMERIC,
    azimuth NUMERIC,
    tool_face NUMERIC,
    sensor_offset NUMERIC,
    measured_depth NUMERIC,
    well_id UUID,
    well_name TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.id,
        s.timestamp,
        s.bit_depth,
        s.inclination,
        s.azimuth,
        s.tool_face,
        s.sensor_offset,
        s.measured_depth,
        s.well_id,
        w.name as well_name
    FROM 
        surveys s
    JOIN 
        wells w ON s.well_id = w.id
    WHERE 
        s.well_id = well_id_param
    ORDER BY 
        s.timestamp DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Enable realtime for wells and surveys tables
alter publication supabase_realtime add table wells;
alter publication supabase_realtime add table surveys;
