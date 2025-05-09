import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { getDatabases } from "@/lib/database";
import { supabase } from "@/lib/supabase";

interface DatabaseInfo {
  id: string;
  name: string;
  created_at: string;
  size: string;
  tables_count: number;
  last_modified: string;
  is_active: boolean;
  description?: string;
  user_id?: string;
}

export function useDatabaseManagement() {
  const { toast } = useToast();
  const [databases, setDatabases] = useState<DatabaseInfo[]>([]);
  const [selectedDatabaseId, setSelectedDatabaseId] = useState<string | null>(
    localStorage.getItem("currentDatabaseId"),
  );
  const [isLoading, setIsLoading] = useState(false);
  const [operationType, setOperationType] = useState<string>("");

  // Fetch databases on component mount
  useEffect(() => {
    fetchDatabases();
  }, []);

  // Fetch databases from Supabase using the utility function
  const fetchDatabases = async () => {
    setIsLoading(true);
    setOperationType("fetching");
    try {
      // Get all databases without user filtering
      console.log("Fetching all databases without user filtering");
      const data = await getDatabases();
      console.log("Fetched databases:", data);

      if (data && data.length > 0) {
        setDatabases(data as DatabaseInfo[]);

        // If no database is selected but we have databases, select the first one
        if (!selectedDatabaseId) {
          setSelectedDatabaseId(data[0].id);
          localStorage.setItem("currentDatabaseId", data[0].id);
          console.log(`Selected first database: ${data[0].id}`);
        }
      } else {
        // No databases found
        setDatabases([]);
        setSelectedDatabaseId(null);
        localStorage.removeItem("currentDatabaseId");
        console.log("No databases found, cleared selection");

        toast({
          title: "No Databases",
          description:
            "No databases found. Create a new database to get started.",
        });
      }
    } catch (error: any) {
      console.error("Error fetching databases:", error);
      toast({
        title: "Error",
        description: `Failed to fetch databases: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setOperationType("");
    }
  };

  // Handle database selection
  const handleSelectDatabase = async (databaseId: string) => {
    try {
      if (databaseId === selectedDatabaseId) {
        console.log("Database already selected, no action needed");
        return;
      }

      setIsLoading(true);
      setOperationType("selecting");

      toast({
        title: "Selecting Database",
        description: "Loading selected database...",
      });

      // Verify the database exists before proceeding
      const { data: dbExists, error: dbCheckError } = await supabase
        .from("wits_databases")
        .select("id")
        .eq("id", databaseId)
        .single();

      if (dbCheckError || !dbExists) {
        throw new Error(
          "Selected database does not exist or cannot be accessed",
        );
      }

      // Set the selected database ID
      setSelectedDatabaseId(databaseId);
      localStorage.setItem("currentDatabaseId", databaseId);
      console.log(`Set currentDatabaseId to ${databaseId} in localStorage`);

      // Get the selected database name for the toast message
      const selectedDb = databases.find((db) => db.id === databaseId);

      toast({
        title: "Database Selected",
        description: `Successfully switched to database: ${selectedDb?.name || "Unknown"}`,
      });

      // Update the database's last_modified timestamp and access count
      try {
        const { data: dbStats } = await supabase
          .from("wits_databases")
          .select("access_count")
          .eq("id", databaseId)
          .single();

        const accessCount = dbStats?.access_count
          ? dbStats.access_count + 1
          : 1;

        await supabase
          .from("wits_databases")
          .update({
            last_modified: new Date().toISOString(),
            access_count: accessCount,
            last_accessed: new Date().toISOString(),
          })
          .eq("id", databaseId);

        console.log(
          `Updated database stats: access count ${accessCount}, last modified and accessed timestamps`,
        );
      } catch (updateError) {
        console.warn("Failed to update database statistics:", updateError);
      }

      // Refresh the database list to show updated stats
      fetchDatabases();
    } catch (error: any) {
      console.error("Error selecting database:", error);
      toast({
        title: "Error",
        description: `Failed to select database: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setOperationType("");
    }
  };

  return {
    databases,
    setDatabases,
    selectedDatabaseId,
    setSelectedDatabaseId,
    isLoading,
    setIsLoading,
    operationType,
    setOperationType,
    fetchDatabases,
    handleSelectDatabase,
  };
}
