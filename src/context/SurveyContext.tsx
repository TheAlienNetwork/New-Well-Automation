import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";
import { SurveyData } from "@/components/dashboard/SurveyPopup";

interface SurveyContextType {
  surveys: SurveyData[];
  addSurvey: (survey: SurveyData) => void;
  updateSurvey: (updatedSurvey: SurveyData) => void;
  deleteSurvey: (id: string) => void;
  clearSurveys: () => void;
  exportSurveys: () => void;
  exportFolderPath: string;
  setExportFolderPath: (path: string) => void;
  autoExportEnabled: boolean;
  setAutoExportEnabled: (enabled: boolean) => void;
  loadSurveysForWell: (wellId: string) => Promise<void>;
}

const SurveyContext = createContext<SurveyContextType | undefined>(undefined);

// Local storage keys
const SURVEYS_STORAGE_KEY = "mwd_surveys_data";
const EXPORT_FOLDER_PATH_KEY = "mwd_export_folder_path";
const AUTO_EXPORT_ENABLED_KEY = "mwd_auto_export_enabled";

// Define SurveyProvider component as a named function declaration
// This ensures consistent exports for Fast Refresh
function SurveyProvider({ children }: { children: ReactNode }) {
  // Initialize state from localStorage if available
  const [surveys, setSurveys] = useState<SurveyData[]>(() => {
    try {
      const storedSurveys = localStorage.getItem(SURVEYS_STORAGE_KEY);
      return storedSurveys ? JSON.parse(storedSurveys) : [];
    } catch (error) {
      console.error("Error loading surveys from localStorage:", error);
      return [];
    }
  });

  const [exportFolderPath, setExportFolderPath] = useState<string>(() => {
    return localStorage.getItem(EXPORT_FOLDER_PATH_KEY) || "";
  });

  const [autoExportEnabled, setAutoExportEnabled] = useState<boolean>(() => {
    return localStorage.getItem(AUTO_EXPORT_ENABLED_KEY) === "true";
  });

  // Listen for well changes by monitoring currentWellId in localStorage and custom events
  useEffect(() => {
    // Force clear surveys on mount to ensure we start fresh
    setSurveys([]);
    localStorage.removeItem(SURVEYS_STORAGE_KEY);

    // Store the initial well ID for comparison
    const initialWellId = localStorage.getItem("currentWellId");
    console.log("SurveyContext initialized with well ID:", initialWellId);

    // If we have an initial well ID, load surveys for it
    if (initialWellId) {
      setTimeout(() => loadSurveysForWell(initialWellId), 300);
    }

    // Handle the clearSurveys custom event
    const handleClearSurveys = () => {
      console.log("Received clearSurveys event, clearing all surveys");
      setSurveys([]);
      localStorage.removeItem(SURVEYS_STORAGE_KEY);
    };

    // Handle the surveysLoaded custom event
    const handleSurveysLoaded = (event: CustomEvent) => {
      console.log("Received surveysLoaded event", event.detail);
      if (event.detail && event.detail.surveys) {
        setSurveys(event.detail.surveys);
      }
    };

    // Handle the wellChanged custom event
    const handleWellChanged = (event: CustomEvent) => {
      console.log("Well changed event received:", event.detail);

      // Clear surveys immediately when well changes
      setSurveys([]);
      localStorage.removeItem(SURVEYS_STORAGE_KEY);

      // First, save any existing surveys for the previous well
      const saveExistingSurveys = async () => {
        console.log(
          "Starting saveExistingSurveys for previous well ID:",
          event.detail.previousWellId,
        );
        if (event.detail.previousWellId && surveys.length > 0) {
          try {
            console.log(
              `Saving ${surveys.length} surveys for previous well ${event.detail.previousWellId}`,
            );
            const { supabase } = await import("@/lib/supabase");

            // Save each survey that belongs to the previous well
            for (const survey of surveys) {
              // Check if survey already exists
              const { data: existingSurvey } = await supabase
                .from("surveys")
                .select("id")
                .eq("id", String(survey.id))
                .single();

              if (!existingSurvey) {
                // Insert new survey
                await supabase.from("surveys").insert([
                  {
                    id: String(survey.id),
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
                    well_id: event.detail.previousWellId,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                    sensor_offset: survey.sensorOffset,
                    measured_depth: survey.measuredDepth,
                  },
                ]);
              }
            }
          } catch (error) {
            console.error("Error saving surveys for previous well:", error);
          }
        }
      };

      // If we have a new well ID, load surveys for that well
      const loadNewWellSurveys = async () => {
        console.log(
          "Starting loadNewWellSurveys for new well ID:",
          event.detail.newWellId,
        );
        // Clear surveys first to ensure we start fresh
        setSurveys([]);
        localStorage.removeItem(SURVEYS_STORAGE_KEY);

        if (event.detail.newWellId) {
          try {
            console.log(
              "Loading surveys for new well ID:",
              event.detail.newWellId,
            );
            const { supabase } = await import("@/lib/supabase");

            const { data, error } = await supabase
              .from("surveys")
              .select("*")
              .eq("well_id", event.detail.newWellId);

            if (error) {
              console.error("Error loading surveys for new well:", error);
              return;
            }

            if (data && data.length > 0) {
              console.log(
                `Found ${data.length} surveys for new well ${event.detail.newWellId}`,
              );

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

              // Set the surveys in state
              setSurveys(formattedSurveys);

              // Also update localStorage
              localStorage.setItem(
                SURVEYS_STORAGE_KEY,
                JSON.stringify(formattedSurveys),
              );
            } else {
              console.log(
                `No surveys found for new well ${event.detail.newWellId}`,
              );
              // Clear surveys if none found for this well
              setSurveys([]);
              localStorage.removeItem(SURVEYS_STORAGE_KEY);
            }
          } catch (error) {
            console.error("Error loading surveys for new well:", error);
          }
        }
      };

      // First save existing surveys, then load new ones
      saveExistingSurveys().then(() => {
        console.log("Finished saving existing surveys, now loading new ones");
        setTimeout(() => {
          loadNewWellSurveys();

          // Dispatch an event to notify other components that surveys have been loaded
          const surveysLoadedEvent = new CustomEvent("surveysLoaded", {
            detail: { wellId: event.detail.newWellId },
          });
          window.dispatchEvent(surveysLoadedEvent);
        }, 300); // Add a delay to ensure database operations complete
      });
    };

    // Handle localStorage changes
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === SURVEYS_STORAGE_KEY) {
        const newSurveys = JSON.parse(event.newValue || "[]");
        setSurveys(newSurveys);
      }
    };

    // Set up event listeners
    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("wellChanged", handleWellChanged as EventListener);
    window.addEventListener(
      "clearSurveys",
      handleClearSurveys as EventListener,
    );
    window.addEventListener(
      "surveysLoaded",
      handleSurveysLoaded as EventListener,
    );

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener(
        "wellChanged",
        handleWellChanged as EventListener,
      );
      window.removeEventListener(
        "clearSurveys",
        handleClearSurveys as EventListener,
      );
      window.removeEventListener(
        "surveysLoaded",
        handleSurveysLoaded as EventListener,
      );
    };
  }, []);

  // Save surveys to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(SURVEYS_STORAGE_KEY, JSON.stringify(surveys));
    } catch (error) {
      console.error("Error saving surveys to localStorage:", error);
    }
  }, [surveys]);

  // Save export folder path to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(EXPORT_FOLDER_PATH_KEY, exportFolderPath);
  }, [exportFolderPath]);

  // Save auto export setting to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(AUTO_EXPORT_ENABLED_KEY, autoExportEnabled.toString());
  }, [autoExportEnabled]);

  // Helper function to validate and sanitize survey data
  const validateAndSanitizeSurvey = (survey: SurveyData): SurveyData => {
    // Get current well ID if not provided in the survey
    const currentWellId =
      survey.wellId || localStorage.getItem("currentWellId") || undefined;

    return {
      ...survey,
      // Ensure ID exists
      id: survey.id || `survey-${Date.now()}`,
      // Ensure timestamp exists
      timestamp: survey.timestamp || new Date().toISOString(),
      // Ensure numeric fields have valid values
      bitDepth: isNaN(survey.bitDepth) ? 0 : survey.bitDepth,
      inclination: isNaN(survey.inclination) ? 0 : survey.inclination,
      azimuth: isNaN(survey.azimuth) ? 0 : survey.azimuth,
      toolFace: isNaN(survey.toolFace) ? 0 : survey.toolFace,
      bTotal: isNaN(survey.bTotal) ? 0 : survey.bTotal,
      aTotal: isNaN(survey.aTotal) ? 0 : survey.aTotal,
      dip: isNaN(survey.dip) ? 0 : survey.dip,
      toolTemp: isNaN(survey.toolTemp) ? 0 : survey.toolTemp,
      // Ensure string fields are not undefined
      wellName: survey.wellName || localStorage.getItem("wellName") || "",
      rigName: survey.rigName || localStorage.getItem("rigName") || "",
      // Ensure qualityCheck exists
      qualityCheck: survey.qualityCheck || {
        status: "pass",
        message: "Default quality check",
      },
      // Add well ID if available
      wellId: currentWellId,
      // Ensure sensorOffset is valid
      sensorOffset: isNaN(survey.sensorOffset)
        ? Number(localStorage.getItem("sensorOffset")) || 0
        : survey.sensorOffset,
      // Ensure measuredDepth is calculated if not provided
      measuredDepth:
        survey.measuredDepth ||
        survey.bitDepth -
          (isNaN(survey.sensorOffset)
            ? Number(localStorage.getItem("sensorOffset")) || 0
            : survey.sensorOffset),
    };
  };

  // Helper function to check for duplicate surveys
  const isDuplicateSurvey = (
    newSurvey: SurveyData,
    existingSurveys: SurveyData[],
  ): boolean => {
    // Check if a survey with the same ID already exists
    const surveyExists = existingSurveys.some((s) => s.id === newSurvey.id);
    if (surveyExists) {
      console.log(
        "Survey with ID",
        newSurvey.id,
        "already exists. Not adding duplicate.",
      );
      return true;
    }

    // Check for surveys with very similar timestamp and depth (potential duplicates)
    // Only check for duplicates if both timestamp and bitDepth are valid
    const isValidTimestamp =
      newSurvey.timestamp && !isNaN(new Date(newSurvey.timestamp).getTime());
    const isValidDepth = !isNaN(newSurvey.bitDepth) && newSurvey.bitDepth > 0;

    if (isValidTimestamp && isValidDepth) {
      const potentialDuplicate = existingSurveys.find((s) => {
        try {
          const timeDiff = Math.abs(
            new Date(s.timestamp).getTime() -
              new Date(newSurvey.timestamp).getTime(),
          );
          const depthDiff = Math.abs(s.bitDepth - newSurvey.bitDepth);

          // If timestamp is within 5 seconds and depth is within 0.5 feet, consider it a duplicate
          return timeDiff < 5000 && depthDiff < 0.5;
        } catch (error) {
          console.error("Error checking for duplicate:", error);
          return false;
        }
      });

      if (potentialDuplicate) {
        console.log(
          "Potential duplicate survey detected. Not adding survey with similar timestamp and depth.",
          "Existing:",
          potentialDuplicate,
          "New:",
          newSurvey,
        );
        return true;
      }
    }

    return false;
  };

  const addSurvey = (survey: SurveyData) => {
    try {
      console.log("Adding survey to context:", survey);

      // Get current well ID
      const currentWellId = localStorage.getItem("currentWellId");

      // Validate and sanitize the survey data
      const sanitizedSurvey = validateAndSanitizeSurvey(survey);

      // Add well ID to the survey if available
      if (currentWellId) {
        sanitizedSurvey.wellId = currentWellId;
      }

      console.log("Sanitized survey data:", sanitizedSurvey);

      setSurveys((prevSurveys) => {
        // Check for duplicates
        if (isDuplicateSurvey(sanitizedSurvey, prevSurveys)) {
          return prevSurveys;
        }

        // If no duplicates found, add the new survey to the beginning of the array
        // so that the latest survey appears at the bottom of the table
        console.log("Adding new survey to state");
        return [sanitizedSurvey, ...prevSurveys];
      });

      // Always try to save to database, even if we don't have a well ID
      // This ensures surveys are saved even for newly created wells
      const saveSurveyToDatabase = async () => {
        try {
          const { supabase } = await import("@/lib/supabase");

          // Check if survey already exists
          const { data: existingSurvey } = await supabase
            .from("surveys")
            .select("id")
            .eq("id", String(sanitizedSurvey.id))
            .single();

          if (!existingSurvey) {
            // Insert new survey
            const { error } = await supabase.from("surveys").insert([
              {
                id: String(sanitizedSurvey.id),
                timestamp: sanitizedSurvey.timestamp,
                bit_depth: sanitizedSurvey.bitDepth,
                inclination: sanitizedSurvey.inclination,
                azimuth: sanitizedSurvey.azimuth,
                tool_face: sanitizedSurvey.toolFace,
                b_total: sanitizedSurvey.bTotal,
                a_total: sanitizedSurvey.aTotal,
                dip: sanitizedSurvey.dip,
                tool_temp: sanitizedSurvey.toolTemp,
                well_name: sanitizedSurvey.wellName,
                rig_name: sanitizedSurvey.rigName,
                quality_check: sanitizedSurvey.qualityCheck,
                well_id: currentWellId || null,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                sensor_offset: sanitizedSurvey.sensorOffset,
                measured_depth: sanitizedSurvey.measuredDepth,
              },
            ]);

            if (error) {
              console.error("Error saving survey to database:", error);
            } else {
              console.log("Survey saved to database successfully");
            }
          }
        } catch (error) {
          console.error("Error in saveSurveyToDatabase:", error);
        }
      };

      saveSurveyToDatabase();
    } catch (error) {
      console.error("Error adding survey:", error);
      // Return without crashing
    }
  };

  const updateSurvey = async (updatedSurvey: SurveyData) => {
    try {
      // Validate and sanitize the survey data
      const sanitizedSurvey = validateAndSanitizeSurvey(updatedSurvey);
      const currentWellId = localStorage.getItem("currentWellId");

      // Update in local state
      setSurveys((prevSurveys) => {
        // Check if the survey exists before updating
        const surveyExists = prevSurveys.some(
          (s) => s.id === sanitizedSurvey.id,
        );

        if (!surveyExists) {
          console.log(
            "Survey with ID",
            sanitizedSurvey.id,
            "does not exist. Adding instead of updating.",
          );
          return [...prevSurveys, sanitizedSurvey];
        }

        // If survey exists, update it
        return prevSurveys.map((survey) =>
          survey.id === sanitizedSurvey.id ? sanitizedSurvey : survey,
        );
      });

      // Update in database
      const updateSurveyInDatabase = async () => {
        try {
          console.log("Updating survey in database:", sanitizedSurvey.id);
          const { supabase } = await import("@/lib/supabase");

          // Check if survey exists in database
          const { data: existingSurvey } = await supabase
            .from("surveys")
            .select("id")
            .eq("id", String(sanitizedSurvey.id))
            .single();

          if (existingSurvey) {
            // Update existing survey
            const { error } = await supabase
              .from("surveys")
              .update({
                timestamp: sanitizedSurvey.timestamp,
                bit_depth: sanitizedSurvey.bitDepth,
                inclination: sanitizedSurvey.inclination,
                azimuth: sanitizedSurvey.azimuth,
                tool_face: sanitizedSurvey.toolFace,
                b_total: sanitizedSurvey.bTotal,
                a_total: sanitizedSurvey.aTotal,
                dip: sanitizedSurvey.dip,
                tool_temp: sanitizedSurvey.toolTemp,
                well_name: sanitizedSurvey.wellName,
                rig_name: sanitizedSurvey.rigName,
                quality_check: sanitizedSurvey.qualityCheck,
                well_id: sanitizedSurvey.wellId || currentWellId || null,
                updated_at: new Date().toISOString(),
                sensor_offset: sanitizedSurvey.sensorOffset,
                measured_depth: sanitizedSurvey.measuredDepth,
              })
              .eq("id", String(sanitizedSurvey.id));

            if (error) {
              console.error("Error updating survey in database:", error);
            } else {
              console.log("Survey updated in database successfully");
            }
          } else {
            // If survey doesn't exist in database, insert it
            console.log("Survey not found in database, inserting instead");
            const { error } = await supabase.from("surveys").insert([
              {
                id: String(sanitizedSurvey.id),
                timestamp: sanitizedSurvey.timestamp,
                bit_depth: sanitizedSurvey.bitDepth,
                inclination: sanitizedSurvey.inclination,
                azimuth: sanitizedSurvey.azimuth,
                tool_face: sanitizedSurvey.toolFace,
                b_total: sanitizedSurvey.bTotal,
                a_total: sanitizedSurvey.aTotal,
                dip: sanitizedSurvey.dip,
                tool_temp: sanitizedSurvey.toolTemp,
                well_name: sanitizedSurvey.wellName,
                rig_name: sanitizedSurvey.rigName,
                quality_check: sanitizedSurvey.qualityCheck,
                well_id: sanitizedSurvey.wellId || currentWellId || null,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                sensor_offset: sanitizedSurvey.sensorOffset,
                measured_depth: sanitizedSurvey.measuredDepth,
              },
            ]);

            if (error) {
              console.error("Error inserting survey to database:", error);
            } else {
              console.log("Survey inserted to database successfully");
            }
          }
        } catch (error) {
          console.error("Error in updateSurveyInDatabase:", error);
        }
      };

      // Execute database update
      updateSurveyInDatabase();
    } catch (error) {
      console.error("Error updating survey:", error);
      // Return without crashing
    }
  };

  const deleteSurvey = async (id: string) => {
    try {
      // First, delete from local state
      setSurveys((prevSurveys) =>
        prevSurveys.filter((survey) => survey.id !== id),
      );

      // Then delete from database
      const { supabase } = await import("@/lib/supabase");

      const { error } = await supabase
        .from("surveys")
        .delete()
        .eq("id", String(id));

      if (error) {
        console.error("Error deleting survey from database:", error);
      } else {
        console.log(`Survey ${id} successfully deleted from database`);
      }
    } catch (error) {
      console.error("Error in deleteSurvey:", error);
    }
  };

  // Clear all surveys from state and localStorage
  const clearSurveys = () => {
    console.log("Clearing all surveys from state and localStorage");
    setSurveys([]);
    localStorage.removeItem(SURVEYS_STORAGE_KEY);
    return true;
  };

  // Load surveys for a specific well
  const loadSurveysForWell = async (wellId: string) => {
    try {
      console.log("SurveyContext: Loading surveys for well ID:", wellId);

      // Always clear existing surveys first to prevent data mixing
      clearSurveys();

      // Notify UI components that surveys are being cleared
      const clearEvent = new CustomEvent("clearSurveys", {});
      window.dispatchEvent(clearEvent);

      const { supabase } = await import("@/lib/supabase");

      // First get well information to update context
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

      const { data, error } = await supabase
        .from("surveys")
        .select("*")
        .eq("well_id", wellId)
        .order("timestamp", { ascending: true });

      if (error) {
        console.error("Error loading surveys for well:", error);
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
          wellName: survey.well_name || wellData?.name || "",
          rigName: survey.rig_name || wellData?.rig_name || "",
          qualityCheck: survey.quality_check,
          sensorOffset: survey.sensor_offset || wellData?.sensor_offset || 0,
          measuredDepth: survey.measured_depth,
          wellId: survey.well_id,
        }));

        // Set the surveys in state
        setSurveys(formattedSurveys);

        // Also update localStorage
        localStorage.setItem(
          SURVEYS_STORAGE_KEY,
          JSON.stringify(formattedSurveys),
        );

        // Dispatch an event to notify other components that surveys have been loaded
        const surveysLoadedEvent = new CustomEvent("surveysLoaded", {
          detail: { surveys: formattedSurveys, wellId },
        });
        window.dispatchEvent(surveysLoadedEvent);

        console.log(
          "SurveyContext: Dispatched surveysLoaded event with",
          formattedSurveys.length,
          "surveys",
        );
      } else {
        console.log(`No surveys found for well ${wellId}`);
        // Clear surveys if none found for this well
        clearSurveys();

        // Dispatch an empty surveys loaded event to update UI
        const surveysLoadedEvent = new CustomEvent("surveysLoaded", {
          detail: { surveys: [], wellId },
        });
        window.dispatchEvent(surveysLoadedEvent);
      }

      // Update the last well ID
      localStorage.setItem("lastWellId", wellId);
    } catch (error) {
      console.error("Error in loadSurveysForWell:", error);
    }
  };

  // Load surveys when the component mounts based on the current well ID
  useEffect(() => {
    const lastWellId = localStorage.getItem("lastWellId");
    const currentWellId = localStorage.getItem("currentWellId");

    // Always clear surveys first to prevent data from previous wells showing up
    clearSurveys();

    // Then try to load surveys for the current well ID on mount
    if (currentWellId) {
      // Small delay to ensure clearing is complete
      setTimeout(() => loadSurveysForWell(currentWellId), 100);
    } else if (lastWellId && !currentWellId) {
      // If we had a well before but not now, clear surveys
      console.log("No current well ID, clearing surveys");
      localStorage.removeItem("lastWellId");
    }
  }, []);

  // Auto-save surveys to database if connected
  useEffect(() => {
    const autoSaveSurveys = async () => {
      const currentWellId = localStorage.getItem("currentWellId");
      if (surveys.length > 0) {
        try {
          console.log("Auto-saving surveys to database...");
          // Import dynamically to avoid circular dependencies
          const { supabase } = await import("@/lib/supabase");

          // Get well info from localStorage
          const wellName = localStorage.getItem("wellName") || "Unknown Well";
          const rigName = localStorage.getItem("rigName") || "Unknown Rig";
          const currentDatabaseId = localStorage.getItem("currentDatabaseId");

          // Prepare surveys for database insertion
          const surveysToSave = surveys.map((survey) => ({
            ...survey,
            wellName: survey.wellName || wellName,
            rigName: survey.rigName || rigName,
            saved_at: new Date().toISOString(),
            database_id: currentDatabaseId,
            wellId: survey.wellId || currentWellId || null,
          }));

          // Track success/failure for each survey
          const saveResults = [];

          // Check if surveys already exist in database to avoid duplicates
          for (const survey of surveysToSave) {
            try {
              const { data: existingSurvey, error: checkError } = await supabase
                .from("surveys")
                .select("id")
                .eq("id", String(survey.id))
                .single();

              if (checkError && checkError.code !== "PGRST116") {
                // PGRST116 is the error code for no rows returned
                console.error(
                  `Error checking for existing survey ${survey.id}:`,
                  checkError,
                );
                saveResults.push({
                  id: survey.id,
                  success: false,
                  error: checkError.message,
                });
                continue;
              }

              if (!existingSurvey) {
                // Insert new survey
                const { error: insertError } = await supabase
                  .from("surveys")
                  .insert([
                    {
                      id: String(survey.id),
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
                      database_id: survey.database_id || currentDatabaseId,
                      well_id: survey.wellId || currentWellId || null,
                      created_at: new Date().toISOString(),
                      updated_at: new Date().toISOString(),
                      sensor_offset: survey.sensorOffset,
                      measured_depth: survey.measuredDepth,
                    },
                  ]);

                if (insertError) {
                  console.error(
                    `Error inserting survey ${survey.id}:`,
                    insertError,
                  );
                  saveResults.push({
                    id: survey.id,
                    success: false,
                    error: insertError.message,
                  });
                } else {
                  saveResults.push({ id: survey.id, success: true });
                }
              } else {
                saveResults.push({
                  id: survey.id,
                  success: true,
                  skipped: true,
                });
              }
            } catch (surveyError) {
              console.error(
                `Exception processing survey ${survey.id}:`,
                surveyError,
              );
              saveResults.push({
                id: survey.id,
                success: false,
                error: surveyError.message || "Unknown error",
              });
            }
          }

          const successCount = saveResults.filter((r) => r.success).length;
          const skippedCount = saveResults.filter((r) => r.skipped).length;
          const failedCount = saveResults.filter((r) => !r.success).length;

          console.log(
            `Auto-save complete: ${successCount} surveys saved, ${skippedCount} skipped, ${failedCount} failed`,
          );
        } catch (error) {
          console.error("Error auto-saving surveys to database:", error);
        }
      }
    };

    // Auto-save when surveys change
    const autoSaveTimeout = setTimeout(autoSaveSurveys, 5000); // 5 second delay to avoid too frequent saves

    return () => clearTimeout(autoSaveTimeout);
  }, [surveys, autoExportEnabled]);

  const exportSurveys = () => {
    console.log("Exporting surveys...", surveys);

    if (surveys.length === 0) {
      console.warn("No surveys to export");
      return;
    }

    // Import dynamically to avoid circular dependencies
    import("@/lib/surveyExport")
      .then(({ exportSurveysToFile }) => {
        // Get well info from localStorage or use defaults
        const wellName = localStorage.getItem("wellName") || "Unknown Well";
        const rigName = localStorage.getItem("rigName") || "Unknown Rig";

        // Export to CSV format by default
        exportSurveysToFile(surveys, "csv", { wellName, rigName });
      })
      .catch((error) => {
        console.error("Failed to export surveys:", error);
      });
  };

  return (
    <SurveyContext.Provider
      value={{
        surveys,
        addSurvey,
        updateSurvey,
        deleteSurvey,
        clearSurveys,
        exportSurveys,
        exportFolderPath,
        setExportFolderPath,
        autoExportEnabled,
        setAutoExportEnabled,
        loadSurveysForWell,
      }}
    >
      {children}
    </SurveyContext.Provider>
  );
}

// Define useSurveys hook
export const useSurveys = () => {
  const context = useContext(SurveyContext);
  if (context === undefined) {
    throw new Error("useSurveys must be used within a SurveyProvider");
  }
  return context;
};

// Export the provider as a named export to ensure consistent exports for Fast Refresh
export { SurveyProvider };
