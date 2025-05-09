import React, { useState } from "react";
import Navbar from "@/components/layout/Navbar";
import StatusBar from "@/components/dashboard/StatusBar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Check, X, AlertCircle, RefreshCw, Trash2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { createDatabase } from "@/lib/database";
import { useDatabaseManagement } from "@/hooks/useDatabaseManagement";
import DatabaseManagement from "@/components/dashboard/DatabaseManagement";
import WellManagement from "@/components/dashboard/WellManagement";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const DatabaseManagementPage = () => {
  const { toast } = useToast();
  const {
    databases,
    selectedDatabaseId,
    isLoading,
    operationType,
    setOperationType,
    setIsLoading,
    fetchDatabases,
    handleSelectDatabase,
    setSelectedDatabaseId,
  } = useDatabaseManagement();

  const [activeTab, setActiveTab] = useState("wells");

  const [clearingData, setClearingData] = useState(false);

  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [backupDialogOpen, setBackupDialogOpen] = useState(false);
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
  const [newDatabaseName, setNewDatabaseName] = useState("");
  const [restoreFile, setRestoreFile] = useState<File | null>(null);

  // Database download states
  const [downloadDialogOpen, setDownloadDialogOpen] = useState(false);
  const [downloadFormat, setDownloadFormat] = useState<"json" | "csv">("json");
  const [downloadOptions, setDownloadOptions] = useState({
    includeSurveys: true,
    includeWitsData: true,
    includeConnections: true,
    includeMappings: true,
  });

  // Clear all data in the database
  const clearDatabaseData = async () => {
    try {
      console.log("Clearing database data...");

      // Clear surveys table
      const { error: surveysError } = await supabase
        .from("surveys")
        .delete()
        .not("id", "is", null);
      if (surveysError) {
        console.error("Error clearing surveys:", surveysError);
      } else {
        console.log("Successfully cleared surveys table");
      }

      // Clear WITS data table
      const { error: witsError } = await supabase
        .from("wits_data")
        .delete()
        .not("id", "is", null);
      if (witsError) {
        console.error("Error clearing WITS data:", witsError);
      } else {
        console.log("Successfully cleared WITS data table");
      }

      // Clear WITS connections table
      const { error: connectionsError } = await supabase
        .from("wits_connections")
        .delete()
        .not("id", "is", null);
      if (connectionsError) {
        console.error("Error clearing WITS connections:", connectionsError);
      } else {
        console.log("Successfully cleared WITS connections table");
      }

      // Clear WITS channel mappings table
      const { error: mappingsError } = await supabase
        .from("wits_channel_mappings")
        .delete()
        .not("id", "is", null);
      if (mappingsError) {
        console.error("Error clearing WITS channel mappings:", mappingsError);
      } else {
        console.log("Successfully cleared WITS channel mappings table");
      }

      return true;
    } catch (error) {
      console.error("Error clearing database data:", error);
      return false;
    }
  };

  // Clear application data from local storage and state
  const clearApplicationData = async () => {
    try {
      console.log("Clearing application data...");

      // Clear surveys from local storage
      localStorage.removeItem("mwd_surveys_data");
      console.log("Cleared surveys from local storage");

      // Clear WITS data from local storage
      localStorage.removeItem("wits_data");
      localStorage.removeItem("wits_connection");
      localStorage.removeItem("wits_mappings");
      localStorage.removeItem("lastWitsDataSaveTime");
      localStorage.removeItem("failedWitsSaves");
      console.log("Cleared WITS data from local storage");

      // Clear any other application-specific data
      // Keep wellName and rigName as they might be needed for new surveys

      // Import the necessary contexts to clear their state
      try {
        // Dynamically import to avoid circular dependencies
        const { useSurveys } = await import("@/context/SurveyContext");
        const { useWits } = await import("@/context/WitsContext");

        // Clear surveys context if available in this component scope
        try {
          const surveysContext = useSurveys();
          if (surveysContext && surveysContext.clearSurveys) {
            const result = surveysContext.clearSurveys();
            console.log("Successfully cleared surveys context:", result);
          }
        } catch (e) {
          console.log("Survey context not available in this scope:", e);
        }

        // Clear WITS context if available in this component scope
        try {
          const witsContext = useWits();
          if (witsContext && witsContext.clearWitsData) {
            const result = witsContext.clearWitsData();
            console.log("Successfully cleared WITS context:", result);
          }
        } catch (e) {
          console.log("WITS context not available in this scope:", e);
        }
      } catch (e) {
        console.warn("Could not clear context data:", e);
      }

      return true;
    } catch (error) {
      console.error("Error clearing application data:", error);
      return false;
    }
  };

  // Create a new database using the utility function and clear existing data
  const handleCreateDatabase = async () => {
    if (!newDatabaseName.trim()) {
      toast({
        title: "Error",
        description: "Database name cannot be empty",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setClearingData(true);
    setOperationType("creating");

    try {
      toast({
        title: "Creating Database",
        description: "Clearing existing data and creating new database...",
      });

      // First clear existing application data from local storage and context
      const appClearResult = await clearApplicationData();
      if (!appClearResult) {
        console.warn("Some application data could not be cleared");
      }

      // Then clear existing data in Supabase tables
      const dbClearResult = await clearDatabaseData();
      if (!dbClearResult) {
        console.warn("Some database data could not be cleared");
      }

      // Don't filter by user ID to ensure database is visible
      const userId = null;

      // Get current timestamp for consistent use
      const currentTimestamp = new Date().toISOString();
      const currentDateString = new Date().toLocaleDateString();

      // Get well and rig names for the new database
      const wellName = localStorage.getItem("wellName") || "Unknown Well";
      const rigName = localStorage.getItem("rigName") || "Unknown Rig";

      // Create a new database record using the utility function
      const newDb = await createDatabase({
        name: newDatabaseName,
        created_at: currentTimestamp,
        size: "0 MB",
        tables_count: 0,
        last_modified: currentTimestamp,
        is_active: true,
        user_id: userId,
        description: `Created on ${currentDateString}`,
        well_name: wellName,
        rig_name: rigName,
        access_count: 1,
        last_accessed: currentTimestamp,
      });

      console.log("New database created:", newDb);

      // Set the newly created database as the selected one
      if (newDb && newDb.id) {
        setSelectedDatabaseId(newDb.id);
        localStorage.setItem("currentDatabaseId", newDb.id);
        console.log(`Set currentDatabaseId to ${newDb.id} in localStorage`);
      }

      // Update the local state with the new database
      await fetchDatabases(); // Wait for the fetch to complete
      setNewDatabaseName("");
      setCreateDialogOpen(false);

      // Create initial database metadata
      try {
        // Create a default WITS connection for the new database
        const { error: connectionError } = await supabase
          .from("wits_connections")
          .insert([
            {
              database_id: newDb.id,
              name: "Default Connection",
              host: "localhost",
              port: 5000,
              protocol: "TCP",
              created_at: currentTimestamp,
              is_active: true,
              description: `Default connection created with database on ${currentDateString}`,
            },
          ]);

        if (connectionError) {
          console.warn(
            "Failed to create default WITS connection:",
            connectionError,
          );
        } else {
          console.log("Created default WITS connection for new database");
        }
      } catch (metadataError) {
        console.warn(
          "Failed to create initial database metadata:",
          metadataError,
        );
      }

      toast({
        title: "Database Created",
        description: `Successfully created database: ${newDb.name}`,
      });
    } catch (error: any) {
      toast({
        title: "Database Creation Failed",
        description:
          error.message || "An error occurred while creating the database",
        variant: "destructive",
      });
      console.error("Error creating database:", error);
    } finally {
      setIsLoading(false);
      setClearingData(false);
      setOperationType("");
    }
  };

  // Delete a database
  const handleDeleteDatabase = async () => {
    if (!selectedDatabaseId) {
      toast({
        title: "Error",
        description: "Please select a database to delete",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setOperationType("deleting");

    try {
      // Delete the database record from Supabase
      const { error } = await supabase
        .from("wits_databases")
        .delete()
        .eq("id", selectedDatabaseId);

      if (error) {
        throw error;
      }

      // Refresh the database list
      fetchDatabases();
      setDeleteDialogOpen(false);

      toast({
        title: "Database Deleted",
        description: "Successfully deleted the database",
      });
    } catch (error: any) {
      console.error("Error deleting database:", error);
      toast({
        title: "Delete Failed",
        description:
          error.message || "An error occurred while deleting the database",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setOperationType("");
    }
  };

  // Handle database download with format options
  const handleDatabaseDownload = async () => {
    if (!selectedDatabaseId) {
      toast({
        title: "Error",
        description: "Please select a database to download data from",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setOperationType("downloading");
    toast({
      title: "Preparing Download",
      description: "Gathering database data for download...",
    });

    try {
      // Get the selected database info
      const selectedDb = databases.find((db) => db.id === selectedDatabaseId);

      if (!selectedDb) {
        throw new Error("Selected database not found");
      }

      // Fetch database metadata
      const { data: dbData, error: dbError } = await supabase
        .from("wits_databases")
        .select("*")
        .eq("id", selectedDatabaseId)
        .single();

      if (dbError) throw dbError;

      // Initialize data object
      const downloadData: any = {
        database: dbData,
        metadata: {
          exported_at: new Date().toISOString(),
          version: "1.2",
          app_version: "1.0.0",
          format: downloadFormat,
          description: "MWD Surface Software Database Export",
          options: downloadOptions,
        },
      };

      // Fetch surveys if selected
      if (downloadOptions.includeSurveys) {
        const { data: surveysData, error: surveysError } = await supabase
          .from("surveys")
          .select("*")
          .eq("database_id", selectedDatabaseId);

        if (surveysError) {
          console.warn("Error fetching surveys for download:", surveysError);
          toast({
            title: "Warning",
            description:
              "Could not fetch survey data. Continuing with other data.",
          });
        } else {
          downloadData.surveys = surveysData || [];
        }
      }

      // Fetch WITS data if selected
      if (downloadOptions.includeWitsData) {
        // For WITS data, we might need to limit the amount due to size constraints
        const { data: witsData, error: witsError } = await supabase
          .from("wits_data")
          .select("*")
          .eq("database_id", selectedDatabaseId)
          .order("timestamp", { ascending: false })
          .limit(1000); // Limit to most recent 1000 records

        if (witsError) {
          console.warn("Error fetching WITS data for download:", witsError);
          toast({
            title: "Warning",
            description:
              "Could not fetch WITS data. Continuing with other data.",
          });
        } else {
          downloadData.wits_data = witsData || [];
        }
      }

      // Fetch connection settings if selected
      if (downloadOptions.includeConnections) {
        const { data: connectionsData, error: connectionsError } =
          await supabase
            .from("wits_connections")
            .select("*")
            .eq("database_id", selectedDatabaseId);

        if (connectionsError) {
          console.warn(
            "Error fetching connections for download:",
            connectionsError,
          );
        } else {
          downloadData.connections = connectionsData || [];
        }
      }

      // Fetch channel mappings if selected
      if (downloadOptions.includeMappings) {
        const { data: mappingsData, error: mappingsError } = await supabase
          .from("wits_channel_mappings")
          .select("*")
          .eq("database_id", selectedDatabaseId);

        if (mappingsError) {
          console.warn("Error fetching mappings for download:", mappingsError);
        } else {
          downloadData.channel_mappings = mappingsData || [];
        }
      }

      // Generate the download file based on format
      if (downloadFormat === "json") {
        // JSON format - full data structure
        const jsonString = JSON.stringify(downloadData, null, 2);
        const blob = new Blob([jsonString], { type: "application/json" });
        const url = URL.createObjectURL(blob);

        // Create a download link and trigger it
        const downloadLink = document.createElement("a");
        downloadLink.href = url;
        downloadLink.download = `${selectedDb.name.replace(/\s+/g, "_")}_data_${new Date().toISOString().split("T")[0]}.json`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
      } else {
        // CSV format - convert data to CSV
        // We'll need to handle each data type separately
        let csvContent = "";

        // Helper function to convert object to CSV row
        const objectToCsvRow = (obj: any) => {
          const values = Object.values(obj);
          return values
            .map((value) => {
              if (value === null || value === undefined) return "";
              if (typeof value === "object") return JSON.stringify(value);
              return String(value);
            })
            .join(",");
        };

        // Helper function to create CSV content for a dataset
        const createCsvForDataset = (dataset: any[], title: string) => {
          if (!dataset || dataset.length === 0) return "";

          // Create header row from first object keys
          const headers = Object.keys(dataset[0]).join(",");

          // Create data rows
          const rows = dataset.map(objectToCsvRow).join("\n");

          return `${title}\n${headers}\n${rows}\n\n`;
        };

        // Add each selected dataset to CSV content
        if (downloadOptions.includeSurveys && downloadData.surveys) {
          csvContent += createCsvForDataset(downloadData.surveys, "SURVEYS");
        }

        if (downloadOptions.includeWitsData && downloadData.wits_data) {
          csvContent += createCsvForDataset(
            downloadData.wits_data,
            "WITS DATA",
          );
        }

        if (downloadOptions.includeConnections && downloadData.connections) {
          csvContent += createCsvForDataset(
            downloadData.connections,
            "CONNECTIONS",
          );
        }

        if (downloadOptions.includeMappings && downloadData.channel_mappings) {
          csvContent += createCsvForDataset(
            downloadData.channel_mappings,
            "CHANNEL MAPPINGS",
          );
        }

        // Create and trigger download
        const blob = new Blob([csvContent], {
          type: "text/csv;charset=utf-8;",
        });
        const url = URL.createObjectURL(blob);

        const downloadLink = document.createElement("a");
        downloadLink.href = url;
        downloadLink.download = `${selectedDb.name.replace(/\s+/g, "_")}_data_${new Date().toISOString().split("T")[0]}.csv`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
      }

      setDownloadDialogOpen(false);

      toast({
        title: "Download Complete",
        description: `Successfully exported data from database: ${selectedDb.name}`,
      });
    } catch (error: any) {
      console.error("Error downloading database data:", error);
      toast({
        title: "Download Failed",
        description:
          error.message ||
          "An error occurred while downloading the database data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setOperationType("");
    }
  };

  // Download database as a backup file
  const handleDatabaseBackup = async () => {
    if (!selectedDatabaseId) {
      toast({
        title: "Error",
        description: "Please select a database to backup",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setOperationType("backing up");

    try {
      // Get the selected database info
      const selectedDb = databases.find((db) => db.id === selectedDatabaseId);

      if (!selectedDb) {
        throw new Error("Selected database not found");
      }

      // Fetch all data related to this database
      const { data: dbData, error: dbError } = await supabase
        .from("wits_databases")
        .select("*")
        .eq("id", selectedDatabaseId)
        .single();

      if (dbError) throw dbError;

      // Fetch all surveys related to this database
      const { data: surveysData, error: surveysError } = await supabase
        .from("surveys")
        .select("*")
        .eq("database_id", selectedDatabaseId);

      if (surveysError) {
        console.warn("Error fetching surveys for backup:", surveysError);
      }

      // Fetch all WITS data related to this database
      const { data: witsData, error: witsError } = await supabase
        .from("wits_data")
        .select("*")
        .eq("database_id", selectedDatabaseId);

      if (witsError) {
        console.warn("Error fetching WITS data for backup:", witsError);
      }

      // Fetch all WITS connections related to this database
      const { data: witsConnectionsData, error: witsConnectionsError } =
        await supabase
          .from("wits_connections")
          .select("*")
          .eq("database_id", selectedDatabaseId);

      // Fetch all WITS channel mappings related to this database
      const { data: witsChannelMappingsData, error: witsChannelMappingsError } =
        await supabase
          .from("wits_channel_mappings")
          .select("*")
          .eq("database_id", selectedDatabaseId);

      // Prepare the backup object with all related data
      const backupData = {
        database: dbData,
        surveys: surveysData || [],
        wits_data: witsData || [],
        wits_connections: witsConnectionsData || [],
        wits_channel_mappings: witsChannelMappingsData || [],
        metadata: {
          exported_at: new Date().toISOString(),
          version: "1.1",
          app_version: "1.0.0",
          description: "MWD Surface Software Database Backup",
        },
      };

      // Convert to JSON and create a downloadable blob
      const jsonString = JSON.stringify(backupData, null, 2);
      const blob = new Blob([jsonString], { type: "application/json" });
      const url = URL.createObjectURL(blob);

      // Create a download link and trigger it
      const downloadLink = document.createElement("a");
      downloadLink.href = url;
      downloadLink.download = `${selectedDb.name.replace(/\s+/g, "_")}_backup_${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);

      setBackupDialogOpen(false);

      toast({
        title: "Backup Complete",
        description: `Successfully exported database: ${selectedDb.name}`,
      });
    } catch (error: any) {
      console.error("Error backing up database:", error);
      toast({
        title: "Backup Failed",
        description:
          error.message || "An error occurred while backing up the database",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setOperationType("");
    }
  };

  // Restore database from a backup file
  const handleDatabaseRestore = async () => {
    if (!restoreFile) {
      toast({
        title: "Error",
        description: "Please select a backup file to restore",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setOperationType("restoring");
    toast({
      title: "Restoring Database",
      description: "Starting database restoration process...",
    });

    try {
      // First clear existing application data
      await clearApplicationData();

      // Read the file content
      const fileContent = await restoreFile.text();
      let backupData;

      try {
        backupData = JSON.parse(fileContent);
        console.log("Successfully parsed backup file");
      } catch (e) {
        throw new Error(
          "Invalid backup file format. The file must be a valid JSON file.",
        );
      }

      // Enhanced validation of backup data structure
      if (!backupData.database || !backupData.metadata) {
        throw new Error(
          "Invalid backup file structure. Missing required database or metadata sections.",
        );
      }

      // Additional validation for required fields
      if (!backupData.database.name) {
        throw new Error("Invalid backup: Missing database name.");
      }

      // Validate metadata version compatibility
      const backupVersion = parseFloat(backupData.metadata.version || "1.0");
      const currentVersion = 1.2; // Current app version for backup format

      if (backupVersion > currentVersion) {
        console.warn(
          `Backup version (${backupVersion}) is newer than current app version (${currentVersion}). Some features may not be imported correctly.`,
        );
        toast({
          title: "Warning",
          description: `Backup was created with a newer version. Some data may not import correctly.`,
          variant: "warning",
        });
      }

      // Get user ID if available
      const userId = localStorage.getItem("userId") || null;

      // Get current timestamp for consistent use
      const currentTimestamp = new Date().toISOString();
      const backupDate = new Date(
        backupData.metadata.exported_at || currentTimestamp,
      ).toLocaleDateString();

      // Create a new database record from the backup
      const { data: newDb, error: dbError } = await supabase
        .from("wits_databases")
        .insert([
          {
            name: `${backupData.database.name} (Restored)`,
            created_at: currentTimestamp,
            size: backupData.database.size || "0 MB",
            tables_count: backupData.database.tables_count || 0,
            last_modified: currentTimestamp,
            is_active: true,
            user_id: userId,
            description: `Restored from backup created on ${backupDate}`,
          },
        ])
        .select()
        .single();

      if (dbError) throw dbError;

      console.log("Created new database from backup:", newDb);

      toast({
        title: "Restore Progress",
        description: "Database created. Restoring data...",
      });

      // Track restoration progress
      let restoredItems = 0;
      let totalItems = 0;
      let errors = 0;

      // If there are surveys in the backup, restore them with the new database ID
      if (backupData.surveys && backupData.surveys.length > 0) {
        totalItems += backupData.surveys.length;
        console.log(`Restoring ${backupData.surveys.length} surveys...`);

        // Process surveys in batches to avoid payload size limits
        const BATCH_SIZE = 100;
        for (let i = 0; i < backupData.surveys.length; i += BATCH_SIZE) {
          const batch = backupData.surveys.slice(i, i + BATCH_SIZE);

          const surveysToRestore = batch.map((survey: any) => ({
            ...survey,
            id: undefined, // Let Supabase generate new IDs
            database_id: newDb.id,
            created_at: survey.created_at || currentTimestamp,
            updated_at: currentTimestamp,
          }));

          const { error: surveysError } = await supabase
            .from("surveys")
            .insert(surveysToRestore);

          if (surveysError) {
            console.error("Error restoring surveys batch:", surveysError);
            errors++;
          } else {
            restoredItems += batch.length;
            console.log(
              `Restored ${batch.length} surveys (batch ${i / BATCH_SIZE + 1})`,
            );
          }
        }

        // Store surveys in local storage for immediate use
        localStorage.setItem(
          "mwd_surveys_data",
          JSON.stringify(backupData.surveys),
        );
        console.log("Stored restored surveys in localStorage");

        // Extract well and rig names from the most recent survey
        if (backupData.surveys.length > 0) {
          // Sort by timestamp to get the most recent
          const sortedSurveys = [...backupData.surveys].sort(
            (a, b) =>
              new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
          );

          const mostRecentSurvey = sortedSurveys[0];
          if (mostRecentSurvey.well_name) {
            localStorage.setItem("wellName", mostRecentSurvey.well_name);
            console.log(`Set wellName to ${mostRecentSurvey.well_name}`);
          }
          if (mostRecentSurvey.rig_name) {
            localStorage.setItem("rigName", mostRecentSurvey.rig_name);
            console.log(`Set rigName to ${mostRecentSurvey.rig_name}`);
          }
        }
      }

      // If there is WITS data in the backup, restore it with the new database ID
      if (backupData.wits_data && backupData.wits_data.length > 0) {
        totalItems += backupData.wits_data.length;
        console.log(
          `Restoring ${backupData.wits_data.length} WITS data records...`,
        );

        // Process WITS data in batches
        const BATCH_SIZE = 100;
        for (let i = 0; i < backupData.wits_data.length; i += BATCH_SIZE) {
          const batch = backupData.wits_data.slice(i, i + BATCH_SIZE);

          const witsDataToRestore = batch.map((data: any) => ({
            ...data,
            id: undefined, // Let Supabase generate new IDs
            database_id: newDb.id,
            created_at: data.created_at || currentTimestamp,
            updated_at: currentTimestamp,
          }));

          const { error: witsError } = await supabase
            .from("wits_data")
            .insert(witsDataToRestore);

          if (witsError) {
            console.error("Error restoring WITS data batch:", witsError);
            errors++;
          } else {
            restoredItems += batch.length;
            console.log(
              `Restored ${batch.length} WITS data records (batch ${i / BATCH_SIZE + 1})`,
            );
          }
        }

        // Store a subset of WITS data in local storage for immediate use
        const recentWitsData = backupData.wits_data
          .sort(
            (a: any, b: any) =>
              new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
          )
          .slice(0, 100); // Only store the 100 most recent records

        localStorage.setItem("wits_data", JSON.stringify(recentWitsData));
        console.log("Stored recent WITS data in localStorage");
      }

      // Restore WITS connections if available
      if (
        backupData.wits_connections &&
        backupData.wits_connections.length > 0
      ) {
        totalItems += backupData.wits_connections.length;
        console.log(
          `Restoring ${backupData.wits_connections.length} WITS connections...`,
        );

        const connectionsToRestore = backupData.wits_connections.map(
          (connection: any) => ({
            ...connection,
            id: undefined,
            database_id: newDb.id,
            created_at: connection.created_at || currentTimestamp,
          }),
        );

        const { error: connectionsError } = await supabase
          .from("wits_connections")
          .insert(connectionsToRestore);

        if (connectionsError) {
          console.error("Error restoring WITS connections:", connectionsError);
          errors++;
        } else {
          restoredItems += connectionsToRestore.length;
          console.log(
            `Restored ${connectionsToRestore.length} WITS connections`,
          );

          // Store the most recent connection in local storage
          if (connectionsToRestore.length > 0) {
            const sortedConnections = [...connectionsToRestore].sort(
              (a, b) =>
                new Date(b.created_at).getTime() -
                new Date(a.created_at).getTime(),
            );

            localStorage.setItem(
              "wits_connection",
              JSON.stringify(sortedConnections[0]),
            );
            console.log("Stored most recent WITS connection in localStorage");
          }
        }
      }

      // Restore WITS channel mappings if available
      if (
        backupData.wits_channel_mappings &&
        backupData.wits_channel_mappings.length > 0
      ) {
        totalItems += backupData.wits_channel_mappings.length;
        console.log(
          `Restoring ${backupData.wits_channel_mappings.length} WITS channel mappings...`,
        );

        const mappingsToRestore = backupData.wits_channel_mappings.map(
          (mapping: any) => ({
            ...mapping,
            id: undefined,
            database_id: newDb.id,
            created_at: mapping.created_at || currentTimestamp,
          }),
        );

        const { error: mappingsError } = await supabase
          .from("wits_channel_mappings")
          .insert(mappingsToRestore);

        if (mappingsError) {
          console.error(
            "Error restoring WITS channel mappings:",
            mappingsError,
          );
          errors++;
        } else {
          restoredItems += mappingsToRestore.length;
          console.log(
            `Restored ${mappingsToRestore.length} WITS channel mappings`,
          );

          // Store mappings in local storage
          localStorage.setItem(
            "wits_mappings",
            JSON.stringify(mappingsToRestore),
          );
          console.log("Stored WITS channel mappings in localStorage");
        }
      }

      // Update the database record with the actual restored data counts
      const { error: updateError } = await supabase
        .from("wits_databases")
        .update({
          tables_count: 4, // Surveys, WITS data, connections, mappings
          size: `${(restoredItems * 0.001).toFixed(2)} MB`, // Rough estimate
          description: `Restored from backup created on ${backupDate}. ${restoredItems} items restored with ${errors} errors.`,
          last_modified: currentTimestamp,
        })
        .eq("id", newDb.id);

      if (updateError) {
        console.warn(
          "Error updating database stats after restore:",
          updateError,
        );
      } else {
        console.log("Updated database stats after restore");
      }

      // Refresh the database list
      fetchDatabases();
      setRestoreFile(null);
      setRestoreDialogOpen(false);

      toast({
        title: "Database Restored",
        description: `Successfully restored database: ${newDb.name} with ${restoredItems} items${errors > 0 ? ` (${errors} errors)` : ""}.`,
      });
    } catch (error: any) {
      console.error("Error restoring database:", error);
      toast({
        title: "Restore Failed",
        description:
          error.message || "An error occurred while restoring the database",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setOperationType("");
    }
  };

  // Handle delete button click
  const handleDeleteClick = (databaseId: string) => {
    setDeleteDialogOpen(true);
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-200">
      <Navbar />
      <StatusBar />
      <div className="container mx-auto px-4 py-6">
        <Tabs
          defaultValue="wells"
          value={activeTab}
          onValueChange={setActiveTab}
        >
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold text-gray-200">
              Database Management
            </h1>
            <TabsList className="bg-gray-800">
              <TabsTrigger value="wells">Wells</TabsTrigger>
              <TabsTrigger value="databases">Databases</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="wells" className="space-y-4">
            <WellManagement />
          </TabsContent>

          <TabsContent value="databases" className="space-y-4">
            <DatabaseManagement
              databases={databases}
              selectedDatabaseId={selectedDatabaseId}
              isLoading={isLoading}
              operationType={operationType}
              onRefresh={fetchDatabases}
              onCreateClick={() => setCreateDialogOpen(true)}
              onSelectDatabase={handleSelectDatabase}
              onDeleteClick={handleDeleteClick}
              onBackupClick={() => setBackupDialogOpen(true)}
              onRestoreClick={() => setRestoreDialogOpen(true)}
              onDownloadClick={() => setDownloadDialogOpen(true)}
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* Create Database Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="bg-gray-900 border border-gray-800 text-gray-200 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-gray-200">
              Create New Database
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Enter a name for your new database.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="dbName" className="text-gray-400">
                Database Name
              </Label>
              <Input
                id="dbName"
                placeholder="My WITS Database"
                value={newDatabaseName}
                onChange={(e) => setNewDatabaseName(e.target.value)}
                className="bg-gray-800 border-gray-700 text-gray-200"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCreateDialogOpen(false)}
              className="bg-gray-800 border-gray-700 hover:bg-gray-700 text-gray-300"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateDatabase}
              className="bg-blue-600 hover:bg-blue-700 text-white"
              disabled={isLoading}
            >
              {isLoading && operationType === "creating" ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  {clearingData ? "Clearing data..." : "Creating..."}
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Create Database
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Database Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="bg-gray-900 border border-gray-800 text-gray-200 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-gray-200">Delete Database</DialogTitle>
            <DialogDescription className="text-gray-400">
              Are you sure you want to delete this database? This action cannot
              be undone.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="p-3 bg-red-900/20 border border-red-800 rounded-md">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-400" />
                <span className="text-sm font-medium text-red-400">
                  Warning: Data Loss
                </span>
              </div>
              <p className="mt-1 text-xs text-gray-400">
                Deleting this database will permanently remove all associated
                data, including surveys, WITS data, and configuration settings.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              className="bg-gray-800 border-gray-700 hover:bg-gray-700 text-gray-300"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeleteDatabase}
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={isLoading}
            >
              {isLoading && operationType === "deleting" ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Backup Database Dialog */}
      <Dialog open={backupDialogOpen} onOpenChange={setBackupDialogOpen}>
        <DialogContent className="bg-gray-900 border border-gray-800 text-gray-200 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-gray-200">Backup Database</DialogTitle>
            <DialogDescription className="text-gray-400">
              Create a complete backup of your database that can be restored
              later.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <div className="text-sm text-gray-400">
                Selected database:{" "}
                <span className="font-medium text-gray-200">
                  {databases.find((db) => db.id === selectedDatabaseId)?.name}
                </span>
              </div>
              <p className="text-xs text-gray-500">
                The backup will include all surveys, WITS data, connection
                settings, and channel mappings associated with this database.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setBackupDialogOpen(false)}
              className="bg-gray-800 border-gray-700 hover:bg-gray-700 text-gray-300"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDatabaseBackup}
              className="bg-blue-600 hover:bg-blue-700 text-white"
              disabled={isLoading}
            >
              {isLoading && operationType === "backing up" ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Backing up...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Download Backup
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Restore Database Dialog */}
      <Dialog open={restoreDialogOpen} onOpenChange={setRestoreDialogOpen}>
        <DialogContent className="bg-gray-900 border border-gray-800 text-gray-200 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-gray-200">
              Restore Database
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Restore a database from a previously created backup file.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="backupFile" className="text-gray-400">
                Backup File
              </Label>
              <Input
                id="backupFile"
                type="file"
                accept=".json"
                onChange={(e) =>
                  setRestoreFile(e.target.files ? e.target.files[0] : null)
                }
                className="bg-gray-800 border-gray-700 text-gray-200"
              />
              <p className="text-xs text-gray-500">
                Select a database backup file (.json) to restore.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRestoreDialogOpen(false)}
              className="bg-gray-800 border-gray-700 hover:bg-gray-700 text-gray-300"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDatabaseRestore}
              className="bg-blue-600 hover:bg-blue-700 text-white"
              disabled={isLoading || !restoreFile}
            >
              {isLoading && operationType === "restoring" ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Restoring...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Restore Database
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Database Download Dialog */}
      <Dialog open={downloadDialogOpen} onOpenChange={setDownloadDialogOpen}>
        <DialogContent className="bg-gray-900 border border-gray-800 text-gray-200 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-gray-200">
              Download Database Data
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Select which data to download and in what format.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <div className="text-sm text-gray-400">
                Selected database:{" "}
                <span className="font-medium text-gray-200">
                  {databases.find((db) => db.id === selectedDatabaseId)?.name}
                </span>
              </div>

              <div className="space-y-2 pt-2">
                <Label className="text-gray-400">Download Format</Label>
                <div className="flex space-x-4">
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="format-json"
                      name="format"
                      value="json"
                      checked={downloadFormat === "json"}
                      onChange={() => setDownloadFormat("json")}
                      className="text-blue-600"
                    />
                    <Label htmlFor="format-json" className="text-gray-300">
                      JSON (Complete backup)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="format-csv"
                      name="format"
                      value="csv"
                      checked={downloadFormat === "csv"}
                      onChange={() => setDownloadFormat("csv")}
                      className="text-blue-600"
                    />
                    <Label htmlFor="format-csv" className="text-gray-300">
                      CSV (Data only)
                    </Label>
                  </div>
                </div>
              </div>

              <div className="space-y-2 pt-4">
                <Label className="text-gray-400">Include Data</Label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="include-surveys"
                      checked={downloadOptions.includeSurveys}
                      onChange={(e) =>
                        setDownloadOptions({
                          ...downloadOptions,
                          includeSurveys: e.target.checked,
                        })
                      }
                      className="text-blue-600"
                    />
                    <Label htmlFor="include-surveys" className="text-gray-300">
                      Survey Data
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="include-wits"
                      checked={downloadOptions.includeWitsData}
                      onChange={(e) =>
                        setDownloadOptions({
                          ...downloadOptions,
                          includeWitsData: e.target.checked,
                        })
                      }
                      className="text-blue-600"
                    />
                    <Label htmlFor="include-wits" className="text-gray-300">
                      WITS Data
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="include-connections"
                      checked={downloadOptions.includeConnections}
                      onChange={(e) =>
                        setDownloadOptions({
                          ...downloadOptions,
                          includeConnections: e.target.checked,
                        })
                      }
                      className="text-blue-600"
                    />
                    <Label
                      htmlFor="include-connections"
                      className="text-gray-300"
                    >
                      Connection Settings
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="include-mappings"
                      checked={downloadOptions.includeMappings}
                      onChange={(e) =>
                        setDownloadOptions({
                          ...downloadOptions,
                          includeMappings: e.target.checked,
                        })
                      }
                      className="text-blue-600"
                    />
                    <Label htmlFor="include-mappings" className="text-gray-300">
                      Channel Mappings
                    </Label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDownloadDialogOpen(false)}
              className="bg-gray-800 border-gray-700 hover:bg-gray-700 text-gray-300"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDatabaseDownload}
              className="bg-blue-600 hover:bg-blue-700 text-white"
              disabled={isLoading}
            >
              {isLoading && operationType === "downloading" ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Preparing Download...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Download Data
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DatabaseManagementPage;
