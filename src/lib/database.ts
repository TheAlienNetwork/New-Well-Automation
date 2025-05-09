import { supabase } from "./supabase";
import type { Tables, TablesInsert } from "@/types/supabase";

// Get a well by ID
export async function getWell(wellId: string) {
  try {
    const { data, error } = await supabase
      .from("wells")
      .select("*")
      .eq("id", wellId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error fetching well:", error);
    return null;
  }
}

// Create a new well
export async function createWell(wellData: Partial<Tables["wells"]["Insert"]>) {
  try {
    const { data, error } = await supabase
      .from("wells")
      .insert([wellData])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error creating well:", error);
    throw error;
  }
}

// Update a well by ID
export async function updateWell(
  wellId: string,
  wellData: Partial<Tables["wells"]["Update"]>,
) {
  try {
    const { data, error } = await supabase
      .from("wells")
      .update(wellData)
      .eq("id", wellId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error updating well:", error);
    throw error;
  }
}

// Get active wells
export async function getActiveWells() {
  try {
    const { data, error } = await supabase
      .from("wells")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error fetching active wells:", error);
    return [];
  }
}

// Get databases with optional filtering
export async function getDatabases(options?: {
  userId?: string;
  isActive?: boolean;
}) {
  try {
    let query = supabase.from("wits_databases").select("*");

    // Remove userId filtering as it might be preventing databases from showing
    // if (options?.userId) {
    //   query = query.eq("user_id", options.userId);
    // }

    if (options?.isActive !== undefined) {
      query = query.eq("is_active", options.isActive);
    }

    const { data, error } = await query.order("created_at", {
      ascending: false,
    });

    if (error) throw error;
    console.log("Fetched databases raw result:", data);
    return data;
  } catch (error) {
    console.error("Error fetching databases:", error);
    return [];
  }
}

// Create a new database
export async function createDatabase(
  databaseData: Partial<Tables["wits_databases"]["Insert"]>,
) {
  try {
    console.log("Creating database with data:", databaseData);
    const { data, error } = await supabase
      .from("wits_databases")
      .insert([databaseData])
      .select()
      .single();

    if (error) {
      console.error("Supabase error creating database:", error);
      throw error;
    }

    console.log("Database created successfully:", data);
    return data;
  } catch (error) {
    console.error("Error creating database:", error);
    throw error;
  }
}

// Delete a database by ID
export async function deleteDatabase(databaseId: string) {
  try {
    const { error } = await supabase
      .from("wits_databases")
      .delete()
      .eq("id", databaseId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error deleting database:", error);
    throw error;
  }
}

// Update database statistics
export async function updateDatabaseStats(
  databaseId: string,
  stats: Partial<Tables["wits_databases"]["Update"]>,
) {
  try {
    const { error } = await supabase
      .from("wits_databases")
      .update(stats)
      .eq("id", databaseId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error updating database stats:", error);
    return false;
  }
}
