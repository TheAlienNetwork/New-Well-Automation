import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing Supabase environment variables");
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// WITS Connections
export const getWitsConnections = async () => {
  const { data, error } = await supabase
    .from("wits_connections")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching WITS connections:", error);
    throw error;
  }

  return data;
};

export const getWitsConnection = async (id: string) => {
  const { data, error } = await supabase
    .from("wits_connections")
    .select("*, wits_channel_mappings(*)")
    .eq("id", id)
    .single();

  if (error) {
    console.error(`Error fetching WITS connection ${id}:`, error);
    throw error;
  }

  return data;
};

export const createWitsConnection = async (connection: any) => {
  const { data, error } = await supabase
    .from("wits_connections")
    .insert(connection)
    .select()
    .single();

  if (error) {
    console.error("Error creating WITS connection:", error);
    throw error;
  }

  return data;
};

export const updateWitsConnection = async (id: string, updates: any) => {
  const { data, error } = await supabase
    .from("wits_connections")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error(`Error updating WITS connection ${id}:`, error);
    throw error;
  }

  return data;
};

export const deleteWitsConnection = async (id: string) => {
  const { error } = await supabase
    .from("wits_connections")
    .delete()
    .eq("id", id);

  if (error) {
    console.error(`Error deleting WITS connection ${id}:`, error);
    throw error;
  }

  return true;
};

// WITS Channel Mappings
export const createWitsChannelMapping = async (mapping: any) => {
  const { data, error } = await supabase
    .from("wits_channel_mappings")
    .insert(mapping)
    .select()
    .single();

  if (error) {
    console.error("Error creating WITS channel mapping:", error);
    throw error;
  }

  return data;
};

export const updateWitsChannelMapping = async (id: string, updates: any) => {
  const { data, error } = await supabase
    .from("wits_channel_mappings")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error(`Error updating WITS channel mapping ${id}:`, error);
    throw error;
  }

  return data;
};

// Surveys
export const getSurveys = async (wellId?: string, limit = 100) => {
  let query = supabase
    .from("surveys")
    .select("*")
    .order("timestamp", { ascending: false })
    .limit(limit);

  if (wellId) {
    query = query.eq("well_id", wellId);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching surveys:", error);
    throw error;
  }

  return data;
};

export const createSurvey = async (survey: any) => {
  const { data, error } = await supabase
    .from("surveys")
    .insert(survey)
    .select()
    .single();

  if (error) {
    console.error("Error creating survey:", error);
    throw error;
  }

  return data;
};

export const createSurveyBatch = async (surveys: any[]) => {
  const { data, error } = await supabase
    .from("surveys")
    .insert(surveys)
    .select();

  if (error) {
    console.error("Error creating survey batch:", error);
    throw error;
  }

  return data;
};

// Wells
export const getWells = async () => {
  const { data, error } = await supabase
    .from("wells")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching wells:", error);
    throw error;
  }

  return data;
};

export const getWell = async (id: string) => {
  const { data, error } = await supabase
    .from("wells")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error(`Error fetching well ${id}:`, error);
    throw error;
  }

  return data;
};

export const createWell = async (well: any) => {
  const { data, error } = await supabase
    .from("wells")
    .insert(well)
    .select()
    .single();

  if (error) {
    console.error("Error creating well:", error);
    throw error;
  }

  return data;
};

export const updateWell = async (id: string, updates: any) => {
  const { data, error } = await supabase
    .from("wells")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error(`Error updating well ${id}:`, error);
    throw error;
  }

  return data;
};

// WITS Logs
export const createWitsLog = async (log: any) => {
  const { data, error } = await supabase
    .from("wits_logs")
    .insert(log)
    .select()
    .single();

  if (error) {
    console.error("Error creating WITS log:", error);
    throw error;
  }

  return data;
};

export const getWitsLogs = async (
  connectionId: string,
  limit = 100,
  logType?: string,
) => {
  let query = supabase
    .from("wits_logs")
    .select("*")
    .eq("connection_id", connectionId)
    .order("timestamp", { ascending: false })
    .limit(limit);

  if (logType) {
    query = query.eq("log_type", logType);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching WITS logs:", error);
    throw error;
  }

  return data;
};
