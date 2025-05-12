import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import {
  Building2 as BuildingIcon,
  Plus,
  Trash2,
  RefreshCw,
  Edit,
  Save,
  Database,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { createWell, getActiveWells, updateWell } from "@/lib/database";
import { useUser } from "@/context/UserContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface WellInfo {
  id: string;
  name: string;
  api_number?: string;
  operator?: string;
  location?: string;
  created_at: string;
  updated_at?: string;
  status?: string;
  rig_name?: string;
  field_name?: string;
  target_depth?: number;
  current_depth?: number;
  sensor_offset?: number;
  is_active?: boolean;
}

interface WellManagementProps {
  onRefresh?: () => void;
}

const WellManagement: React.FC<WellManagementProps> = ({ onRefresh }) => {
  const { toast } = useToast();
  const { userProfile, updateUserProfile, setCurrentWell, clearCurrentWell } =
    useUser();

  const [wells, setWells] = useState<WellInfo[]>([]);
  const [selectedWellId, setSelectedWellId] = useState<string | null>(
    userProfile.currentWellId || null,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [operationType, setOperationType] = useState<string>("");

  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Form states
  const [newWellName, setNewWellName] = useState("");
  const [newRigName, setNewRigName] = useState("");
  const [newApiNumber, setNewApiNumber] = useState("");
  const [newOperator, setNewOperator] = useState("");
  const [newLocation, setNewLocation] = useState("");
  const [newSensorOffset, setNewSensorOffset] = useState(0);

  // Edit form states
  const [editWellId, setEditWellId] = useState<string | null>(null);
  const [editWellName, setEditWellName] = useState("");
  const [editRigName, setEditRigName] = useState("");
  const [editApiNumber, setEditApiNumber] = useState("");
  const [editOperator, setEditOperator] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [editSensorOffset, setEditSensorOffset] = useState(0);

  // Fetch wells on component mount
  useEffect(() => {
    fetchWells();

    // Listen for well updates
    const handleWellUpdated = () => {
      // Check if the selected well ID matches the current well ID in localStorage
      const currentWellId = localStorage.getItem("currentWellId");
      if (currentWellId !== selectedWellId) {
        setSelectedWellId(currentWellId);
      }
    };

    window.addEventListener("wellUpdated", handleWellUpdated);

    return () => {
      window.removeEventListener("wellUpdated", handleWellUpdated);
    };
  }, []);

  // Fetch wells from Supabase
  const fetchWells = async () => {
    setIsLoading(true);
    setOperationType("fetching");
    try {
      const data = await getActiveWells();
      console.log("Fetched wells:", data);

      if (data && data.length > 0) {
        setWells(data as WellInfo[]);

        // If no well is selected but we have wells, select the first one
        if (!selectedWellId) {
          handleSelectWell(data[0].id);
        }
      } else {
        // No wells found
        setWells([]);
        setSelectedWellId(null);
        clearCurrentWell();
        console.log("No wells found, cleared selection");

        toast({
          title: "No Wells",
          description: "No wells found. Create a new well to get started.",
        });
      }
    } catch (error: any) {
      console.error("Error fetching wells:", error);
      toast({
        title: "Error",
        description: `Failed to fetch wells: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setOperationType("");
    }
  };

  // Load surveys for a specific well
  const loadSurveysForWell = async (wellId: string) => {
    try {
      // Prevent duplicate loading operations
      if (isLoading && operationType === "loading") {
        console.log("Already loading surveys, skipping request");
        return;
      }

      setIsLoading(true);
      setOperationType("loading");

      // First clear any existing surveys
      localStorage.removeItem("mwd_surveys_data");
      const clearEvent = new CustomEvent("clearSurveys", {});
      window.dispatchEvent(clearEvent);

      // Wait a moment to ensure surveys are cleared
      await new Promise((resolve) => setTimeout(resolve, 100));

      console.log("Loading surveys for well ID:", wellId);
      const { data, error } = await supabase
        .from("surveys")
        .select("*")
        .eq("well_id", wellId)
        .order("timestamp", { ascending: false });

      if (error) {
        console.error("Error loading surveys for well:", error);
        toast({
          title: "Error",
          description: `Failed to load surveys: ${error.message}`,
          variant: "destructive",
        });
        return;
      }

      if (data && data.length > 0) {
        console.log(`Found ${data.length} surveys for well ${wellId}`);

        // Convert database format to application format
        const formattedSurveys = data.map((survey) => ({
          id: survey.id,
          timestamp: survey.timestamp,
          bitDepth: survey.bit_depth,
          inclination: survey.inclination,
          azimuth: survey.azimuth,
          toolFace: survey.tool_face,
          bTotal: survey.b_total,
          aTotal: survey.a_total,
          dip: survey.dip,
          toolTemp: survey.tool_temp,
          wellName: survey.well_name,
          rigName: survey.rig_name,
          qualityCheck: survey.quality_check,
          sensorOffset: survey.sensor_offset,
          measuredDepth: survey.measured_depth,
          wellId: survey.well_id,
        }));

        // Update localStorage with the loaded surveys
        localStorage.setItem(
          "mwd_surveys_data",
          JSON.stringify(formattedSurveys),
        );

        // Get the well data to update well info in localStorage
        const { data: wellData, error: wellError } = await supabase
          .from("wells")
          .select("name, rig_name, sensor_offset")
          .eq("id", wellId)
          .single();

        if (!wellError && wellData) {
          // Update localStorage with well information
          localStorage.setItem("wellName", wellData.name || "");
          localStorage.setItem("rigName", wellData.rig_name || "");
          localStorage.setItem(
            "sensorOffset",
            String(wellData.sensor_offset || 0),
          );
          localStorage.setItem("currentWellId", wellId);

          // Update user profile with well information
          updateUserProfile({
            currentWellId: wellId,
            wellName: wellData.name,
            rigName: wellData.rig_name || "",
            sensorOffset: wellData.sensor_offset || 0,
          });
        }

        // Dispatch an event to notify the SurveyContext that surveys have been loaded
        const loadEvent = new CustomEvent("surveysLoaded", {
          detail: { surveys: formattedSurveys, wellId: wellId },
        });
        window.dispatchEvent(loadEvent);

        // Dispatch a wellInfoUpdated event to update the status bar
        const wellInfoEvent = new CustomEvent("wellInfoUpdated", {
          detail: {
            wellName: wellData?.name || "",
            rigName: wellData?.rig_name || "",
            sensorOffset: wellData?.sensor_offset || 0,
            wellId: wellId,
          },
        });
        window.dispatchEvent(wellInfoEvent);

        toast({
          title: "Surveys Loaded",
          description: `Successfully loaded ${data.length} surveys for well: ${wells.find((w) => w.id === wellId)?.name || "Unknown"}`,
        });
      } else {
        console.log(`No surveys found for well ${wellId}`);
        // Clear surveys if none found for this well
        localStorage.removeItem("mwd_surveys_data");

        // Get the well data to update well info in localStorage
        const { data: wellData, error: wellError } = await supabase
          .from("wells")
          .select("name, rig_name, sensor_offset")
          .eq("id", wellId)
          .single();

        if (!wellError && wellData) {
          // Update localStorage with well information
          localStorage.setItem("wellName", wellData.name || "");
          localStorage.setItem("rigName", wellData.rig_name || "");
          localStorage.setItem(
            "sensorOffset",
            String(wellData.sensor_offset || 0),
          );
          localStorage.setItem("currentWellId", wellId);

          // Update user profile with well information
          updateUserProfile({
            currentWellId: wellId,
            wellName: wellData.name,
            rigName: wellData.rig_name || "",
            sensorOffset: wellData.sensor_offset || 0,
          });

          // Dispatch a wellInfoUpdated event to update the status bar
          const wellInfoEvent = new CustomEvent("wellInfoUpdated", {
            detail: {
              wellName: wellData.name || "",
              rigName: wellData.rig_name || "",
              sensorOffset: wellData.sensor_offset || 0,
              wellId: wellId,
            },
          });
          window.dispatchEvent(wellInfoEvent);
        }

        // Dispatch an event to notify the SurveyContext that surveys have been cleared
        const clearEvent = new CustomEvent("clearSurveys", {});
        window.dispatchEvent(clearEvent);

        toast({
          title: "No Surveys",
          description: "No surveys found for this well.",
        });
      }
    } catch (error: any) {
      console.error("Error in loadSurveysForWell:", error);
      toast({
        title: "Error",
        description: `Failed to load surveys: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      // Add a small delay before setting isLoading to false to prevent rapid clicking
      setTimeout(() => {
        setIsLoading(false);
        setOperationType("");
      }, 500);
    }
  };

  // Handle well selection
  const handleSelectWell = async (wellId: string) => {
    try {
      if (wellId === selectedWellId) {
        console.log("Well already selected, no action needed");
        // Even if already selected, force reload surveys
        loadSurveysForWell(wellId);
        return;
      }

      // Prevent duplicate operations
      if (isLoading) {
        console.log("Operation in progress, please wait...");
        toast({
          title: "Operation in Progress",
          description: "Please wait for the current operation to complete.",
        });
        return;
      }

      setIsLoading(true);
      setOperationType("selecting");

      // Set the selected well ID immediately to provide visual feedback
      setSelectedWellId(wellId);

      toast({
        title: "Selecting Well",
        description: "Loading selected well...",
      });

      // Verify the well exists before proceeding
      const { data: wellExists, error: wellCheckError } = await supabase
        .from("wells")
        .select("*")
        .eq("id", wellId)
        .single();

      if (wellCheckError || !wellExists) {
        throw new Error("Selected well does not exist or cannot be accessed");
      }

      // Get the previous well ID for saving surveys
      const previousWellId = localStorage.getItem("currentWellId");

      // Update user profile with well information
      updateUserProfile({
        currentWellId: wellId,
        wellName: wellExists.name,
        rigName: wellExists.rig_name || "",
        sensorOffset: wellExists.sensor_offset || 0,
      });

      // Update localStorage with well information
      localStorage.setItem("wellName", wellExists.name || "");
      localStorage.setItem("rigName", wellExists.rig_name || "");
      localStorage.setItem(
        "sensorOffset",
        String(wellExists.sensor_offset || 0),
      );
      localStorage.setItem("currentWellId", wellId);

      // Force a save of any existing surveys before switching wells
      const forceSaveSurveys = async () => {
        try {
          const { supabase } = await import("@/lib/supabase");
          const surveysData = localStorage.getItem("mwd_surveys_data");

          if (surveysData && previousWellId) {
            const surveys = JSON.parse(surveysData);
            if (surveys && surveys.length > 0) {
              console.log("Force saving surveys before switching wells");

              // Save each survey that belongs to the current well
              for (const survey of surveys) {
                if (!survey.id) continue;

                // Check if survey already exists
                const { data: existingSurvey } = await supabase
                  .from("surveys")
                  .select("id")
                  .eq("id", survey.id)
                  .single();

                if (!existingSurvey) {
                  // Insert new survey
                  await supabase.from("surveys").insert([
                    {
                      id: survey.id,
                      timestamp: survey.timestamp,
                      bit_depth: survey.bitDepth,
                      inclination: survey.inclination,
                      azimuth: survey.azimuth,
                      tool_face: survey.toolFace,
                      b_total: survey.bTotal,
                      a_total: survey.aTotal,
                      dip: survey.dip,
                      tool_temp: survey.toolTemp,
                      well_name: survey.wellName,
                      rig_name: survey.rigName,
                      quality_check: survey.qualityCheck,
                      well_id: previousWellId,
                      created_at: new Date().toISOString(),
                      updated_at: new Date().toISOString(),
                      sensor_offset: survey.sensorOffset,
                      measured_depth: survey.measuredDepth,
                    },
                  ]);
                }
              }
            }
          }
        } catch (error) {
          console.error("Error force saving surveys:", error);
        }
      };

      // Force save surveys then set the current well
      await forceSaveSurveys();

      // Clear surveys from localStorage to ensure we start fresh with the new well
      localStorage.removeItem("mwd_surveys_data");

      // Force clear any existing surveys in memory
      const clearEvent = new CustomEvent("clearSurveys", {});
      window.dispatchEvent(clearEvent);

      // Set the current well - this will trigger the wellChanged event
      // which will load the surveys for this well
      setCurrentWell(wellId);

      // Wait a moment to ensure the well is set before loading surveys
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Get the selected well name for the toast message
      const selectedWell = wells.find((well) => well.id === wellId);

      toast({
        title: "Well Selected",
        description: `Successfully switched to well: ${selectedWell?.name || "Unknown"}`,
      });

      // Update the well's last_modified timestamp
      try {
        await updateWell(wellId, {
          updated_at: new Date().toISOString(),
        });

        console.log(`Updated well last modified timestamp`);
      } catch (updateError) {
        console.warn("Failed to update well statistics:", updateError);
      }

      // If onRefresh callback is provided, call it
      if (onRefresh) {
        onRefresh();
      }

      // Refresh the well list to show updated stats
      fetchWells();

      // Force UI update by dispatching a custom event
      const wellInfoUpdatedEvent = new CustomEvent("wellInfoUpdated", {
        detail: {
          wellName: wellExists.name,
          rigName: wellExists.rig_name || "",
          sensorOffset: wellExists.sensor_offset || 0,
          wellId: wellId,
        },
      });
      window.dispatchEvent(wellInfoUpdatedEvent);

      // Dispatch wellChanged event
      const wellChangedEvent = new CustomEvent("wellChanged", {
        detail: {
          previousWellId: previousWellId,
          newWellId: wellId,
        },
      });
      window.dispatchEvent(wellChangedEvent);

      // Always load surveys for the selected well
      await loadSurveysForWell(wellId);
    } catch (error: any) {
      console.error("Error selecting well:", error);
      toast({
        title: "Error",
        description: `Failed to select well: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setOperationType("");
    }
  };

  // Handle creating a new well
  const handleCreateWell = async () => {
    if (!newWellName.trim()) {
      toast({
        title: "Error",
        description: "Well name cannot be empty",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setOperationType("creating");

    try {
      // Create a new well
      const newWell = await createWell({
        name: newWellName,
        api_number: newApiNumber,
        operator: newOperator,
        location: newLocation,
        rig_name: newRigName,
        sensor_offset: newSensorOffset,
        is_active: true,
        created_at: new Date().toISOString(),
      });

      console.log("New well created:", newWell);

      // Reset form fields
      setNewWellName("");
      setNewRigName("");
      setNewApiNumber("");
      setNewOperator("");
      setNewLocation("");
      setNewSensorOffset(0);
      setCreateDialogOpen(false);

      // First save any existing surveys for the current well
      const saveCurrentSurveys = async () => {
        try {
          const { supabase } = await import("@/lib/supabase");
          const surveysData = localStorage.getItem("mwd_surveys_data");
          const currentWellId = userProfile.currentWellId;

          if (surveysData && currentWellId) {
            const surveys = JSON.parse(surveysData);
            if (surveys && surveys.length > 0) {
              console.log("Saving existing surveys before creating new well");

              // Save each survey that belongs to the current well
              for (const survey of surveys) {
                if (!survey.id) continue;

                // Check if survey already exists
                const { data: existingSurvey } = await supabase
                  .from("surveys")
                  .select("id")
                  .eq("id", survey.id)
                  .single();

                if (!existingSurvey) {
                  // Insert new survey
                  await supabase.from("surveys").insert([
                    {
                      id: survey.id,
                      timestamp: survey.timestamp,
                      bit_depth: survey.bitDepth,
                      inclination: survey.inclination,
                      azimuth: survey.azimuth,
                      tool_face: survey.toolFace,
                      b_total: survey.bTotal,
                      a_total: survey.aTotal,
                      dip: survey.dip,
                      tool_temp: survey.toolTemp,
                      well_name: survey.wellName,
                      rig_name: survey.rigName,
                      quality_check: survey.qualityCheck,
                      well_id: currentWellId,
                      created_at: new Date().toISOString(),
                      updated_at: new Date().toISOString(),
                      sensor_offset: survey.sensorOffset,
                      measured_depth: survey.measuredDepth,
                    },
                  ]);
                }
              }
            }
          }
        } catch (error) {
          console.error("Error saving current surveys:", error);
        }
      };

      await saveCurrentSurveys();

      // Clear any existing data in the context before selecting the new well
      clearCurrentWell();

      // Clear surveys from localStorage to ensure we start fresh with the new well
      localStorage.removeItem("mwd_surveys_data");

      // Force clear any existing surveys in memory
      const clearEvent = new CustomEvent("clearSurveys", {});
      window.dispatchEvent(clearEvent);

      // Update user profile with the new well information
      updateUserProfile({
        currentWellId: newWell.id,
        wellName: newWell.name,
        rigName: newRigName || "",
        sensorOffset: newSensorOffset || 0,
      });

      // Set the selected well ID
      setSelectedWellId(newWell.id);

      toast({
        title: "Well Created",
        description: `Successfully created well: ${newWell.name} with no data`,
      });

      // If onRefresh callback is provided, call it to refresh the UI
      if (onRefresh) {
        onRefresh();
      }

      // Refresh the well list
      fetchWells();
    } catch (error: any) {
      console.error("Error creating well:", error);
      toast({
        title: "Error",
        description: `Failed to create well: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setOperationType("");
    }
  };

  // Handle opening the edit dialog
  const handleEditClick = (wellId: string) => {
    const well = wells.find((w) => w.id === wellId);
    if (well) {
      setEditWellId(well.id);
      setEditWellName(well.name);
      setEditRigName(well.rig_name || "");
      setEditApiNumber(well.api_number || "");
      setEditOperator(well.operator || "");
      setEditLocation(well.location || "");
      setEditSensorOffset(well.sensor_offset || 0);
      setEditDialogOpen(true);
    }
  };

  // Handle updating a well
  const handleUpdateWell = async () => {
    if (!editWellId) return;

    if (!editWellName.trim()) {
      toast({
        title: "Error",
        description: "Well name cannot be empty",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setOperationType("updating");

    try {
      // Update the well
      await updateWell(editWellId, {
        name: editWellName,
        api_number: editApiNumber,
        operator: editOperator,
        location: editLocation,
        rig_name: editRigName,
        sensor_offset: editSensorOffset,
        updated_at: new Date().toISOString(),
      });

      // Close the dialog
      setEditDialogOpen(false);

      // If this is the currently selected well, update the user profile
      if (editWellId === selectedWellId) {
        updateUserProfile({
          wellName: editWellName,
          rigName: editRigName,
          sensorOffset: editSensorOffset,
        });
      }

      toast({
        title: "Well Updated",
        description: `Successfully updated well: ${editWellName}`,
      });

      // Refresh the well list
      fetchWells();
    } catch (error: any) {
      console.error("Error updating well:", error);
      toast({
        title: "Error",
        description: `Failed to update well: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setOperationType("");
    }
  };

  // Handle deleting a well
  const handleDeleteWell = async () => {
    if (!editWellId) return;

    setIsLoading(true);
    setOperationType("deleting");

    try {
      // Instead of actually deleting, just mark as inactive
      await updateWell(editWellId, {
        is_active: false,
        updated_at: new Date().toISOString(),
      });

      // Close the dialog
      setDeleteDialogOpen(false);

      // If this was the selected well, clear the selection
      if (editWellId === selectedWellId) {
        setSelectedWellId(null);
        clearCurrentWell();
      }

      toast({
        title: "Well Deleted",
        description: `Successfully deleted well`,
      });

      // Refresh the well list
      fetchWells();
    } catch (error: any) {
      console.error("Error deleting well:", error);
      toast({
        title: "Error",
        description: `Failed to delete well: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setOperationType("");
    }
  };

  // Get the selected well object once instead of calling find() multiple times
  const selectedWell = selectedWellId
    ? wells.find((well) => well.id === selectedWellId)
    : null;

  return (
    <>
      <div className="grid grid-cols-1 gap-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-200">Well Management</h1>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="bg-gray-800 border-gray-700 hover:bg-gray-700 text-gray-300"
              onClick={fetchWells}
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${isLoading && operationType === "fetching" ? "animate-spin" : ""}`}
              />
              {isLoading && operationType === "fetching"
                ? "Refreshing..."
                : "Refresh"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="bg-gray-800 border-gray-700 hover:bg-gray-700 text-gray-300"
              onClick={() => setCreateDialogOpen(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              New Well
            </Button>
          </div>
        </div>

        <Card className="bg-gray-900 border-gray-800 shadow-lg overflow-hidden">
          <CardHeader className="p-4 pb-2 border-b border-gray-800">
            <div className="flex items-center gap-2">
              <BuildingIcon className="h-5 w-5 text-blue-400" />
              <CardTitle className="text-lg font-medium text-gray-200">
                Available Wells
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-800/50 border-b border-gray-800">
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Well Name
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Rig Name
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      API Number
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Operator
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Location
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {!wells || wells.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-4 py-8 text-center text-gray-500"
                      >
                        No wells found. Create a new well to get started.
                      </td>
                    </tr>
                  ) : (
                    wells.map((well) => (
                      <tr
                        key={well.id}
                        className={`hover:bg-gray-800/30 ${well.id === selectedWellId ? "bg-blue-900/20" : ""}`}
                      >
                        <td
                          className="px-4 py-2 text-sm font-medium cursor-pointer"
                          onClick={() => handleSelectWell(well.id)}
                        >
                          {well.name}
                        </td>
                        <td
                          className="px-4 py-2 text-sm text-gray-400 cursor-pointer"
                          onClick={() => handleSelectWell(well.id)}
                        >
                          {well.rig_name || "--"}
                        </td>
                        <td
                          className="px-4 py-2 text-sm text-gray-400 cursor-pointer"
                          onClick={() => handleSelectWell(well.id)}
                        >
                          {well.api_number || "--"}
                        </td>
                        <td
                          className="px-4 py-2 text-sm text-gray-400 cursor-pointer"
                          onClick={() => handleSelectWell(well.id)}
                        >
                          {well.operator || "--"}
                        </td>
                        <td
                          className="px-4 py-2 text-sm text-gray-400 cursor-pointer"
                          onClick={() => handleSelectWell(well.id)}
                        >
                          {well.location || "--"}
                        </td>
                        <td
                          className="px-4 py-2 text-sm text-gray-400 cursor-pointer"
                          onClick={() => handleSelectWell(well.id)}
                        >
                          <div className="flex flex-col">
                            <span>
                              {new Date(well.created_at).toLocaleDateString()}
                            </span>
                            <span className="text-xs text-blue-400">
                              {well.survey_count || 0} surveys
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-2 text-sm">
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-gray-400 hover:text-green-400 hover:bg-gray-800"
                              onClick={() => loadSurveysForWell(well.id)}
                              title="Load surveys for this well"
                              disabled={isLoading}
                            >
                              <Database className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-gray-400 hover:text-blue-400 hover:bg-gray-800"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditClick(well.id);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-gray-400 hover:text-red-400 hover:bg-gray-800"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditWellId(well.id);
                                setDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800 shadow-lg overflow-hidden">
          <CardHeader className="p-4 pb-2 border-b border-gray-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BuildingIcon className="h-5 w-5 text-green-400" />
                <CardTitle className="text-lg font-medium text-gray-200">
                  Selected Well
                </CardTitle>
              </div>
              {selectedWellId && (
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-gray-800 border-gray-700 hover:bg-gray-700 text-gray-300"
                  onClick={() => loadSurveysForWell(selectedWellId)}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Loading Surveys...
                    </>
                  ) : (
                    <>
                      <Database className="h-4 w-4 mr-2" />
                      Load Surveys
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-4">
            <div className="space-y-4">
              {selectedWell ? (
                <div className="p-3 bg-gray-800/50 rounded-md border border-gray-800">
                  <div className="flex items-center gap-2">
                    <BuildingIcon className="h-4 w-4 text-blue-400" />
                    <span className="font-medium">{selectedWell.name}</span>
                  </div>
                  <div className="mt-2 text-xs text-gray-500">
                    Rig Name: {selectedWell.rig_name || "--"}
                  </div>
                  <div className="mt-1 text-xs text-gray-500">
                    API Number: {selectedWell.api_number || "--"}
                  </div>
                  <div className="mt-1 text-xs text-gray-500">
                    Operator: {selectedWell.operator || "--"}
                  </div>
                  <div className="mt-1 text-xs text-gray-500">
                    Location: {selectedWell.location || "--"}
                  </div>
                  <div className="mt-1 text-xs text-gray-500">
                    Sensor Offset: {selectedWell.sensor_offset || 0} ft
                  </div>
                  <div className="mt-1 text-xs text-gray-500">
                    Created:{" "}
                    {new Date(selectedWell.created_at).toLocaleDateString()}
                  </div>
                  <div className="mt-1 text-xs text-gray-500">
                    Last Updated:{" "}
                    {selectedWell.updated_at
                      ? new Date(selectedWell.updated_at).toLocaleDateString()
                      : "--"}
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-gray-800/50 rounded-md border border-gray-800 text-gray-500">
                  No well selected
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Create Well Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="bg-gray-900 border border-gray-800 text-gray-200 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-gray-200">Create New Well</DialogTitle>
            <DialogDescription className="text-gray-400">
              Enter information for your new well.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="wellName" className="text-gray-400">
                Well Name *
              </Label>
              <Input
                id="wellName"
                placeholder="Alpha-123"
                value={newWellName}
                onChange={(e) => setNewWellName(e.target.value)}
                className="bg-gray-800 border-gray-700 text-gray-200"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="rigName" className="text-gray-400">
                Rig Name
              </Label>
              <Input
                id="rigName"
                placeholder="Precision Drilling #42"
                value={newRigName}
                onChange={(e) => setNewRigName(e.target.value)}
                className="bg-gray-800 border-gray-700 text-gray-200"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="apiNumber" className="text-gray-400">
                API Number
              </Label>
              <Input
                id="apiNumber"
                placeholder="42-123-45678"
                value={newApiNumber}
                onChange={(e) => setNewApiNumber(e.target.value)}
                className="bg-gray-800 border-gray-700 text-gray-200"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="operator" className="text-gray-400">
                Operator
              </Label>
              <Input
                id="operator"
                placeholder="Acme Oil & Gas"
                value={newOperator}
                onChange={(e) => setNewOperator(e.target.value)}
                className="bg-gray-800 border-gray-700 text-gray-200"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location" className="text-gray-400">
                Location
              </Label>
              <Input
                id="location"
                placeholder="Permian Basin, TX"
                value={newLocation}
                onChange={(e) => setNewLocation(e.target.value)}
                className="bg-gray-800 border-gray-700 text-gray-200"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sensorOffset" className="text-gray-400">
                Sensor Offset (ft)
              </Label>
              <Input
                id="sensorOffset"
                type="number"
                step="0.1"
                placeholder="0"
                value={newSensorOffset}
                onChange={(e) =>
                  setNewSensorOffset(parseFloat(e.target.value) || 0)
                }
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
              onClick={handleCreateWell}
              className="bg-blue-600 hover:bg-blue-700 text-white"
              disabled={isLoading}
            >
              {isLoading && operationType === "creating" ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Well
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Well Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="bg-gray-900 border border-gray-800 text-gray-200 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-gray-200">Edit Well</DialogTitle>
            <DialogDescription className="text-gray-400">
              Update well information.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="editWellName" className="text-gray-400">
                Well Name *
              </Label>
              <Input
                id="editWellName"
                value={editWellName}
                onChange={(e) => setEditWellName(e.target.value)}
                className="bg-gray-800 border-gray-700 text-gray-200"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="editRigName" className="text-gray-400">
                Rig Name
              </Label>
              <Input
                id="editRigName"
                value={editRigName}
                onChange={(e) => setEditRigName(e.target.value)}
                className="bg-gray-800 border-gray-700 text-gray-200"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="editApiNumber" className="text-gray-400">
                API Number
              </Label>
              <Input
                id="editApiNumber"
                value={editApiNumber}
                onChange={(e) => setEditApiNumber(e.target.value)}
                className="bg-gray-800 border-gray-700 text-gray-200"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="editOperator" className="text-gray-400">
                Operator
              </Label>
              <Input
                id="editOperator"
                value={editOperator}
                onChange={(e) => setEditOperator(e.target.value)}
                className="bg-gray-800 border-gray-700 text-gray-200"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="editLocation" className="text-gray-400">
                Location
              </Label>
              <Input
                id="editLocation"
                value={editLocation}
                onChange={(e) => setEditLocation(e.target.value)}
                className="bg-gray-800 border-gray-700 text-gray-200"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="editSensorOffset" className="text-gray-400">
                Sensor Offset (ft)
              </Label>
              <Input
                id="editSensorOffset"
                type="number"
                step="0.1"
                value={editSensorOffset}
                onChange={(e) =>
                  setEditSensorOffset(parseFloat(e.target.value) || 0)
                }
                className="bg-gray-800 border-gray-700 text-gray-200"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditDialogOpen(false)}
              className="bg-gray-800 border-gray-700 hover:bg-gray-700 text-gray-300"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateWell}
              className="bg-blue-600 hover:bg-blue-700 text-white"
              disabled={isLoading}
            >
              {isLoading && operationType === "updating" ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Well Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="bg-gray-900 border border-gray-800 text-gray-200 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-gray-200">Delete Well</DialogTitle>
            <DialogDescription className="text-gray-400">
              Are you sure you want to delete this well? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="p-3 bg-red-900/20 border border-red-800 rounded-md">
              <div className="flex items-center gap-2">
                <Trash2 className="h-5 w-5 text-red-400" />
                <span className="text-sm font-medium text-red-400">
                  Warning: Data Loss
                </span>
              </div>
              <p className="mt-1 text-xs text-gray-400">
                Deleting this well will remove it from your available wells
                list. Any associated data will be preserved but no longer
                accessible through the UI.
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
              onClick={handleDeleteWell}
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
                  Delete Well
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default WellManagement;
