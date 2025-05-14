import React, { useState, useEffect } from "react";
import Navbar from "@/components/layout/Navbar";
import StatusBar from "@/components/dashboard/StatusBar";
import SurveyTable from "@/components/dashboard/SurveyTable";
import SurveyAnalytics from "@/components/dashboard/SurveyAnalytics";
import SurveyPopup from "@/components/dashboard/SurveyPopup";
import SurveyEmailSettings from "@/components/dashboard/SurveyEmailSettings";
import SurveyImport from "@/components/dashboard/SurveyImport";
import CurveDataWidget from "@/components/dashboard/CurveDataWidget";
import WellInformationWidget from "@/components/dashboard/WellInformationWidget";
import WellTrajectory3DInteractive from "@/components/dashboard/WellTrajectory3DInteractive";
import GammaPlot from "@/components/dashboard/GammaPlot";
import { SurveyData } from "@/components/dashboard/SurveyPopup";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Upload,
  FileText,
  Send,
  Download,
  CheckCircle,
  AlertCircle,
  XCircle,
  Info,
  Save,
  BarChart3,
  Box,
} from "lucide-react";
import { useWits } from "@/context/WitsContext";
import { useSurveys } from "@/context/SurveyContext";
import {
  determineQualityCheck,
  generateCSVContent,
  generateLASContent,
  downloadFile,
  parseCSVSurveys,
  parseTXTSurveys,
  parseLASSurveys,
  parseXLSXSurveys,
} from "@/utils/surveyUtils";
import { generateEmailContent, createMailtoUrl } from "@/utils/emailUtils";
import {
  calculateMotorYield,
  calculateDoglegNeeded,
  calculateSlideSeen,
  calculateSlideAhead,
  calculateProjectedInclination,
  calculateProjectedAzimuth,
} from "@/utils/directionalCalculations";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { OppSupportButton } from "@/components/dashboard/OppSupportButton";
import { NotificationCenter } from "@/components/dashboard/NotificationCenter";

const SurveysPage = () => {
  const { witsData, isReceiving } = useWits();
  const { toast } = useToast();
  const {
    surveys,
    addSurvey,
    updateSurvey,
    deleteSurvey,
    exportSurveys,
    exportFolderPath,
    setExportFolderPath,
    autoExportEnabled,
    setAutoExportEnabled,
    currentWellId,
  } = useSurveys();

  // Well information state - moved to the top to ensure it's initialized before use
  const [wellInfo, setWellInfo] = useState({
    wellName: localStorage.getItem("wellName") || "",
    rigName: localStorage.getItem("rigName") || "",
    sensorOffset: Number(localStorage.getItem("sensorOffset")) || 0,
  });

  // Get the latest survey for calculations
  const [latestSurvey, setLatestSurvey] = useState<SurveyData | null>(null);
  // Add error state to track and handle errors
  const [hasError, setHasError] = useState<boolean>(false);
  // File monitoring state
  const [fileMonitoringEnabled, setFileMonitoringEnabled] = useState(false);
  const [monitoredFilePath, setMonitoredFilePath] = useState<string>("");
  const [lastFileModified, setLastFileModified] = useState<number>(0);

  // Reset error state when surveys change and listen for survey events
  useEffect(() => {
    setHasError(false);

    // Listen for surveysLoaded events
    const handleSurveysLoaded = (event: CustomEvent) => {
      console.log("SurveysPage received surveysLoaded event:", event.detail);
      if (event.detail && event.detail.surveys) {
        // Force update the well info
        const wellName = localStorage.getItem("wellName") || "";
        const rigName = localStorage.getItem("rigName") || "";
        const sensorOffset = Number(localStorage.getItem("sensorOffset")) || 0;

        setWellInfo({
          wellName,
          rigName,
          sensorOffset,
        });
      }
    };

    // Listen for wellInfoUpdated events
    const handleWellInfoUpdated = (event: CustomEvent) => {
      console.log("SurveysPage received wellInfoUpdated event:", event.detail);
      if (event.detail) {
        const newWellInfo = { ...wellInfo };
        if (event.detail.wellName) newWellInfo.wellName = event.detail.wellName;
        if (event.detail.rigName) newWellInfo.rigName = event.detail.rigName;
        if (event.detail.sensorOffset !== undefined)
          newWellInfo.sensorOffset = event.detail.sensorOffset;

        setWellInfo(newWellInfo);
      }
    };

    window.addEventListener(
      "surveysLoaded",
      handleSurveysLoaded as EventListener,
    );
    window.addEventListener(
      "wellInfoUpdated",
      handleWellInfoUpdated as EventListener,
    );

    return () => {
      window.removeEventListener(
        "surveysLoaded",
        handleSurveysLoaded as EventListener,
      );
      window.removeEventListener(
        "wellInfoUpdated",
        handleWellInfoUpdated as EventListener,
      );
    };
  }, [surveys, wellInfo]);

  // Update well information when currentWellId changes
  useEffect(() => {
    if (currentWellId) {
      // Update well information from localStorage based on current well
      const wellName = localStorage.getItem("wellName") || "";
      const rigName = localStorage.getItem("rigName") || "";
      const sensorOffset = Number(localStorage.getItem("sensorOffset")) || 0;

      setWellInfo({
        wellName,
        rigName,
        sensorOffset,
      });

      console.log(`Updated well info for well ID: ${currentWellId}`, {
        wellName,
        rigName,
        sensorOffset,
      });

      // Force UI update by dispatching a custom event
      const wellInfoUpdatedEvent = new CustomEvent("wellInfoUpdated", {
        detail: { wellName, rigName, sensorOffset, wellId: currentWellId },
      });
      window.dispatchEvent(wellInfoUpdatedEvent);

      // Fetch the latest surveys for this well
      const fetchSurveysForCurrentWell = async () => {
        try {
          const { supabase } = await import("@/lib/supabase");

          const { data, error } = await supabase
            .from("surveys")
            .select("*")
            .eq("well_id", currentWellId)
            .order("timestamp", { ascending: false });

          if (error) {
            console.error("Error fetching surveys for current well:", error);
            return;
          }

          if (data && data.length > 0) {
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
              wellName: survey.well_name || wellName,
              rigName: survey.rig_name || rigName,
              qualityCheck: survey.quality_check,
              sensorOffset: survey.sensor_offset || sensorOffset,
              measuredDepth: survey.measured_depth,
              wellId: survey.well_id,
            }));

            // Update surveys in context
            formattedSurveys.forEach((survey) => addSurvey(survey));

            console.log(
              `SurveysPage: Loaded ${formattedSurveys.length} surveys for well ${currentWellId}`,
            );
          }
        } catch (error) {
          console.error("Error in fetchSurveysForCurrentWell:", error);
        }
      };

      fetchSurveysForCurrentWell();
    }
  }, [currentWellId, addSurvey]);

  // Check for file updates if monitoring is enabled
  useEffect(() => {
    if (!fileMonitoringEnabled || !monitoredFilePath) return;

    // Set up a polling mechanism to check for file changes
    const checkInterval = setInterval(async () => {
      try {
        console.log(`Monitoring file: ${monitoredFilePath}`);

        // In a web environment, we can't directly access the file system
        // Instead, we'll check if the user has granted access to the file
        // and if we have stored the file handle
        const fileHandleString = localStorage.getItem("monitoredFileHandle");

        if (fileHandleString) {
          try {
            // Try to parse the stored file handle
            const fileHandle = JSON.parse(fileHandleString);

            // Check if we can access the file
            if ("getFile" in fileHandle) {
              // Get the file
              const file = await fileHandle.getFile();

              // Check if the file has been modified since last check
              if (file.lastModified > lastFileModified) {
                console.log("File has been modified, updating surveys...");
                toast({
                  title: "File Change Detected",
                  description: `${monitoredFilePath} has been modified. Updating surveys...`,
                });

                // Update the last modified time
                setLastFileModified(file.lastModified);

                // Re-process the file based on its extension
                const fileExt = file.name.split(".").pop()?.toLowerCase();
                let parsedSurveys: SurveyData[] = [];

                if (["xls", "xlsx"].includes(fileExt || "")) {
                  parsedSurveys = await parseXLSXSurveys(
                    file,
                    wellInfo,
                    monitoredFilePath,
                  );
                } else {
                  // Handle text-based files
                  const reader = new FileReader();
                  const fileContent = await new Promise<string>(
                    (resolve, reject) => {
                      reader.onload = (e) =>
                        resolve(e.target?.result as string);
                      reader.onerror = () =>
                        reject(new Error("Error reading file"));
                      reader.readAsText(file);
                    },
                  );

                  if (fileExt === "csv") {
                    parsedSurveys = parseCSVSurveys(
                      fileContent,
                      wellInfo,
                      monitoredFilePath,
                    );
                  } else if (fileExt === "txt") {
                    parsedSurveys = parseTXTSurveys(
                      fileContent,
                      wellInfo,
                      monitoredFilePath,
                    );
                  } else if (fileExt === "las") {
                    parsedSurveys = parseLASSurveys(
                      fileContent,
                      wellInfo,
                      monitoredFilePath,
                    );
                  }
                }

                // Update surveys if we found any
                if (parsedSurveys.length > 0) {
                  // Clear existing surveys and add the new ones
                  // This assumes you have a function to clear surveys
                  // If not, you might need to modify this approach
                  parsedSurveys.forEach((survey) => addSurvey(survey));

                  toast({
                    title: "Surveys Updated",
                    description: `${parsedSurveys.length} surveys have been updated from the monitored file.`,
                  });
                }
              }
            }
          } catch (accessError) {
            console.error("Error accessing monitored file:", accessError);
            toast({
              title: "File Monitoring Error",
              description:
                "Could not access the monitored file. File monitoring has been disabled.",
              variant: "destructive",
            });
            setFileMonitoringEnabled(false);
          }
        }
      } catch (error) {
        console.error("Error monitoring file:", error);
        toast({
          title: "File Monitoring Error",
          description:
            "An error occurred while monitoring the file. File monitoring has been disabled.",
          variant: "destructive",
        });
        setFileMonitoringEnabled(false);
      }
    }, 5000); // Check every 5 seconds

    return () => clearInterval(checkInterval);
  }, [
    fileMonitoringEnabled,
    monitoredFilePath,
    lastFileModified,
    wellInfo,
    addSurvey,
  ]);

  // Update latest survey when surveys change
  useEffect(() => {
    try {
      if (!surveys || !Array.isArray(surveys)) {
        console.error("Surveys is not an array:", surveys);
        setLatestSurvey(null);
        return;
      }

      console.log(
        `SurveysPage: Processing ${surveys.length} surveys to find latest`,
      );

      if (surveys.length > 0) {
        // Validate surveys before sorting
        const validSurveys = surveys.filter((survey) => {
          try {
            return (
              survey &&
              typeof survey === "object" &&
              survey.timestamp &&
              new Date(survey.timestamp).getTime() > 0
            );
          } catch (e) {
            console.warn("Invalid survey detected:", survey, e);
            return false;
          }
        });

        if (validSurveys.length === 0) {
          console.warn("No valid surveys found after filtering");
          setLatestSurvey(null);
          return;
        }

        // Sort surveys by timestamp (newest first)
        const sortedSurveys = [...validSurveys].sort((a, b) => {
          try {
            return (
              new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
            );
          } catch (sortError) {
            console.error("Error comparing survey dates:", sortError);
            return 0; // Keep original order if comparison fails
          }
        });

        // Validate the latest survey before setting it
        const latest = sortedSurveys[0];
        if (latest && typeof latest === "object") {
          console.log("SurveysPage: Setting latest survey:", {
            id: latest.id,
            timestamp: latest.timestamp,
            inclination: latest.inclination,
            azimuth: latest.azimuth,
            bitDepth: latest.bitDepth,
            measuredDepth: latest.measuredDepth,
          });
          setLatestSurvey(latest);

          // Also update well info from the latest survey if needed
          if (latest.wellName || latest.rigName || latest.sensorOffset) {
            const updatedWellInfo = { ...wellInfo };
            if (latest.wellName) updatedWellInfo.wellName = latest.wellName;
            if (latest.rigName) updatedWellInfo.rigName = latest.rigName;
            if (latest.sensorOffset)
              updatedWellInfo.sensorOffset = latest.sensorOffset;

            setWellInfo(updatedWellInfo);
          }
        } else {
          console.warn("Latest survey is invalid:", latest);
          setLatestSurvey(null);
        }
      } else {
        console.log(
          "SurveysPage: No surveys available, setting latestSurvey to null",
        );
        setLatestSurvey(null);
      }
    } catch (error) {
      console.error("Error updating latest survey:", error);
      setLatestSurvey(null);
      setHasError(true);
    }
  }, [surveys, currentWellId, wellInfo]);

  // Fallback method for folder selection
  const fallbackFolderSelection = () => {
    // Create a temporary input element for folder selection
    const input = document.createElement("input");
    input.type = "file";
    input.webkitdirectory = true;
    input.directory = true;

    input.onchange = (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (files && files.length > 0) {
        // Get the folder path from the first file
        const folderPath = files[0].webkitRelativePath.split("/")[0];
        setExportFolderPath(folderPath);
        toast({
          title: "Export Folder Selected",
          description: `Files will be exported to: ${folderPath}`,
        });
      }
    };

    input.click();
  };

  const [editingSurvey, setEditingSurvey] = useState<SurveyData | null>(null);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
  const [isExportSettingsOpen, setIsExportSettingsOpen] = useState(false);
  const [selectedSurveys, setSelectedSurveys] = useState<string[]>([]);
  const [emailRecipient, setEmailRecipient] = useState("");
  const [emailSubject, setEmailSubject] = useState(
    `MWD Survey Report - Well ${wellInfo.wellName} - `,
  );
  const [emailBody, setEmailBody] = useState("");
  const [distroList, setDistroList] = useState<string[]>([]);
  const [includeCurveData, setIncludeCurveData] = useState(false);
  const [includeTargetLineStatus, setIncludeTargetLineStatus] = useState(false);

  // Update email subject when well name changes
  useEffect(() => {
    setEmailSubject(`MWD Survey Report - Well ${wellInfo.wellName} - `);
  }, [wellInfo.wellName]);

  const handleEditSurvey = (survey: SurveyData) => {
    setEditingSurvey(survey);
    setIsPopupOpen(true);
  };

  const handleDeleteSurvey = (id: string) => {
    try {
      if (!id) {
        console.error("Invalid survey ID for deletion:", id);
        toast({
          title: "Error",
          description: "Could not delete survey due to invalid ID.",
          variant: "destructive",
        });
        return;
      }

      deleteSurvey(id);

      toast({
        title: "Survey Deleted",
        description: "The survey has been removed from the database.",
        variant: "destructive",
      });
    } catch (error) {
      console.error("Error deleting survey:", error);
      toast({
        title: "Error",
        description: "An error occurred while deleting the survey.",
        variant: "destructive",
      });
    }
  };

  // Enhanced download file function that tries to use the File System Access API
  const enhancedDownloadFile = (content: string, filename: string) => {
    const blob = new Blob([content], { type: "text/plain" });

    // If we have a folder path and auto-export is enabled, try to save to that folder
    if (exportFolderPath) {
      try {
        // In a web environment, we can't directly write to the file system
        // Instead, we'll use the File System Access API if available
        if ("showSaveFilePicker" in window) {
          // This is a modern browser API that allows writing to files
          // Note: This requires user interaction and permissions
          const saveFile = async () => {
            try {
              // Try to use the previously granted permission if available
              let fileHandle;

              // Check if we have stored the directory handle
              const directoryHandle = localStorage.getItem(
                "exportDirectoryHandle",
              );

              if (directoryHandle) {
                try {
                  // Use the stored directory handle
                  const handle = JSON.parse(directoryHandle);
                  // Create a file in that directory
                  fileHandle = await handle.getFileHandle(filename, {
                    create: true,
                  });
                } catch (dirErr) {
                  console.error("Error using stored directory handle:", dirErr);
                  // Fall back to save file picker
                  fileHandle = await (window as any).showSaveFilePicker({
                    suggestedName: filename,
                    types: [
                      {
                        description: "Text Files",
                        accept: { "text/plain": [".csv", ".las", ".txt"] },
                      },
                    ],
                  });
                }
              } else {
                // No stored directory handle, use save file picker
                fileHandle = await (window as any).showSaveFilePicker({
                  suggestedName: filename,
                  types: [
                    {
                      description: "Text Files",
                      accept: { "text/plain": [".csv", ".las", ".txt"] },
                    },
                  ],
                });
              }

              const writable = await fileHandle.createWritable();
              await writable.write(blob);
              await writable.close();

              toast({
                title: "File Saved",
                description: `${filename} has been saved to the selected folder.`,
              });
            } catch (err) {
              console.error("Error saving file:", err);
              // Fall back to regular download
              downloadFile(content, filename);
            }
          };

          saveFile();
          return;
        }
      } catch (err) {
        console.error("Error with file system access:", err);
        // Fall back to regular download
      }
    }

    // Regular download fallback
    downloadFile(content, filename);
  };

  const handleExportSurveys = () => {
    try {
      if (!surveys || !Array.isArray(surveys)) {
        console.error("Cannot export surveys: invalid data", surveys);
        toast({
          title: "Export Failed",
          description: "Could not export surveys due to invalid data.",
          variant: "destructive",
        });
        return;
      }

      exportSurveys();

      // Generate CSV and LAS files
      const csvContent = generateCSVContent(surveys);
      const lasContent = generateLASContent(surveys);

      // Generate filenames
      const dateStr = new Date().toISOString().split("T")[0];
      const csvFilename = `mwd_surveys_${dateStr}.csv`;
      const lasFilename = `mwd_surveys_${dateStr}.las`;

      // Export the files
      enhancedDownloadFile(csvContent, csvFilename);
      enhancedDownloadFile(lasContent, lasFilename);

      toast({
        title: "Surveys Exported",
        description: "Survey data has been exported to CSV and LAS formats.",
      });
    } catch (error) {
      console.error("Error exporting surveys:", error);
      toast({
        title: "Export Failed",
        description: "An error occurred while exporting the surveys.",
        variant: "destructive",
      });
    }
  };

  const handleSaveSurvey = (updatedSurvey: SurveyData) => {
    try {
      // Validate the survey data to prevent errors
      if (!updatedSurvey || !updatedSurvey.id) {
        console.error("Invalid survey data received", updatedSurvey);
        toast({
          title: "Error Saving Survey",
          description: "Invalid survey data. Please try again.",
          variant: "destructive",
        });
        return;
      }

      if (editingSurvey) {
        // Update existing survey
        updateSurvey(updatedSurvey);
        toast({
          title: "Survey Updated",
          description: `Survey at ${new Date(updatedSurvey.timestamp).toLocaleString()} has been updated.`,
        });
      } else {
        // Add new survey
        addSurvey(updatedSurvey);
        toast({
          title: "Survey Added",
          description: `New survey at ${new Date(updatedSurvey.timestamp).toLocaleString()} has been added.`,
        });

        // Automatically select the newly added survey
        setSelectedSurveys([updatedSurvey.id]);

        // If auto-export is enabled, export the surveys
        if (autoExportEnabled) {
          try {
            // Generate CSV and LAS files
            const csvContent = generateCSVContent(
              surveys.concat(updatedSurvey),
            );
            const lasContent = generateLASContent(
              surveys.concat(updatedSurvey),
            );

            // Generate filenames
            const dateStr = new Date().toISOString().split("T")[0];
            const csvFilename = `mwd_surveys_${dateStr}.csv`;
            const lasFilename = `mwd_surveys_${dateStr}.las`;

            // Export the files
            enhancedDownloadFile(csvContent, csvFilename);
            enhancedDownloadFile(lasContent, lasFilename);

            toast({
              title: "Surveys Auto-Exported",
              description:
                "Survey data has been automatically exported to the selected folder.",
            });
          } catch (exportError) {
            console.error("Error during auto-export:", exportError);
            toast({
              title: "Auto-Export Failed",
              description: "There was an error exporting the survey data.",
              variant: "destructive",
            });
          }
        }
      }
      setEditingSurvey(null);
      setIsPopupOpen(false);
    } catch (error) {
      console.error("Error saving survey:", error);
      toast({
        title: "Error Saving Survey",
        description: "An unexpected error occurred while saving the survey.",
        variant: "destructive",
      });
    }
  };

  const handleImportSurveys = (importedSurveys: SurveyData[]) => {
    importedSurveys.forEach((survey) => addSurvey(survey));
    setIsImportOpen(false);
    toast({
      title: "Surveys Imported",
      description: `${importedSurveys.length} surveys have been imported successfully.`,
    });
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file extension
    const fileExt = file.name.split(".").pop()?.toLowerCase();
    if (!["csv", "txt", "las", "xls", "xlsx"].includes(fileExt || "")) {
      toast({
        title: "Invalid File Format",
        description: "Please upload a CSV, TXT, LAS, XLS, or XLSX file.",
        variant: "destructive",
      });
      event.target.value = "";
      return;
    }

    // Show processing toast
    toast({
      title: "File Uploaded",
      description: `${file.name} has been uploaded. Processing...`,
    });

    try {
      // Get the file path for monitoring if supported by the browser
      let filePath = "";
      if ("webkitRelativePath" in file) {
        filePath = file.webkitRelativePath || file.name;
      } else {
        filePath = file.name;
      }

      // Store the last modified time for file monitoring
      setLastFileModified(file.lastModified);

      // If file monitoring is enabled, set the monitored file path and store the file handle
      if (fileMonitoringEnabled) {
        setMonitoredFilePath(filePath);

        // Try to store the file handle for future access if the File System Access API is available
        if ("showOpenFilePicker" in window && file instanceof File) {
          try {
            // Store the file handle in localStorage if possible
            // Note: This is a simplified approach and might not work in all browsers
            // In a real implementation, you would use the File System Access API properly
            localStorage.setItem(
              "monitoredFileHandle",
              JSON.stringify({
                name: file.name,
                path: filePath,
                lastModified: file.lastModified,
                getFile: async () => file,
              }),
            );

            toast({
              title: "File Monitoring Enabled",
              description: `${file.name} will be monitored for changes.`,
            });
          } catch (storeError) {
            console.error("Error storing file handle:", storeError);
          }
        }
      }

      // Parse file content based on extension
      let parsedSurveys: SurveyData[] = [];

      if (["xls", "xlsx"].includes(fileExt || "")) {
        // Handle Excel files
        try {
          parsedSurveys = await parseXLSXSurveys(file, wellInfo, filePath);
        } catch (excelError) {
          console.error("Error parsing Excel file:", excelError);
          toast({
            title: "Error Processing Excel File",
            description:
              "There was an error processing the Excel file. Please check the format.",
            variant: "destructive",
          });
          event.target.value = "";
          return;
        }
      } else {
        // Handle text-based files (CSV, TXT, LAS)
        const reader = new FileReader();

        // Create a promise to handle the file reading
        const fileContent = await new Promise<string>((resolve, reject) => {
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.onerror = () => reject(new Error("Error reading file"));
          reader.readAsText(file);
        });

        // Parse based on file extension
        if (fileExt === "csv") {
          parsedSurveys = parseCSVSurveys(fileContent, wellInfo, filePath);
        } else if (fileExt === "txt") {
          parsedSurveys = parseTXTSurveys(fileContent, wellInfo, filePath);
        } else if (fileExt === "las") {
          parsedSurveys = parseLASSurveys(fileContent, wellInfo, filePath);
        }
      }

      // Add the parsed surveys
      if (parsedSurveys.length > 0) {
        parsedSurveys.forEach((survey) => addSurvey(survey));
        toast({
          title: "File Processed Successfully",
          description: `${parsedSurveys.length} surveys have been imported.`,
          variant: "default",
        });
      } else {
        toast({
          title: "No Valid Surveys Found",
          description: "The file did not contain any valid survey data.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error processing file:", error);
      toast({
        title: "Error Processing File",
        description:
          "There was an error processing the file. Please check the format.",
        variant: "destructive",
      });
    }

    // Clear the input
    event.target.value = "";
  };

  const handleSelectSurveys = (ids: string[]) => {
    setSelectedSurveys(ids);
  };

  const handleSendEmail = () => {
    const emailContent = generateEmailContent(
      selectedSurveys,
      surveys,
      wellInfo,
      witsData,
      includeCurveData,
      includeTargetLineStatus,
    );
    const subject = `MWD Survey Report - Well ${wellInfo.wellName} - ${new Date().toLocaleDateString()}`;

    // Create a mailto URL
    const mailtoUrl = createMailtoUrl(emailContent, subject, emailRecipient);

    // Open the default email client
    window.open(mailtoUrl);

    toast({
      title: "Email Draft Created",
      description: `An email draft has been created in your default email client with the survey data.`,
    });

    setIsEmailDialogOpen(false);
    setSelectedSurveys([]);
  };

  const handleToggleIncludeCurveData = () => {
    setIncludeCurveData(!includeCurveData);
  };

  // Safe render function to prevent white screen
  const safeRender = () => {
    try {
      return (
        <div className="min-h-screen bg-gray-950 text-gray-200">
          <Navbar />
          <OppSupportButton />
          <StatusBar
            wellName={wellInfo.wellName}
            sensorOffset={wellInfo.sensorOffset}
          />
          <div className="container mx-auto px-4 py-6">
            <div className="grid grid-cols-1 gap-6">
              <div className="flex justify-between items-center mb-4">
                <h1 className="text-2xl font-bold">Survey Management</h1>
                <div className="flex gap-2">
                  <NotificationCenter />
                  <Button
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={() => {
                      // Get the latest well information before creating a new survey
                      // This ensures we always use the most up-to-date well info
                      const currentWellInfo = { ...wellInfo };

                      // Create new survey with current WITS data and latest well info
                      const newSurvey: SurveyData = {
                        id: Date.now().toString(),
                        timestamp: new Date().toISOString(),
                        bitDepth: witsData.bitDepth,
                        measuredDepth:
                          witsData.bitDepth - currentWellInfo.sensorOffset,
                        sensorOffset: currentWellInfo.sensorOffset,
                        inclination: witsData.inclination,
                        azimuth: witsData.azimuth,
                        toolFace: witsData.toolFace,
                        bTotal: witsData.magneticField,
                        aTotal: witsData.gravity,
                        dip: witsData.dip,
                        toolTemp: witsData.toolTemp,
                        wellName: currentWellInfo.wellName,
                        rigName: currentWellInfo.rigName,
                        qualityCheck: {
                          status: "pass",
                          message: "All parameters within acceptable ranges",
                        },
                      };
                      // Set as new survey (not editing an existing one)
                      setEditingSurvey(null);
                      // Then set the new survey data and open the popup
                      setTimeout(() => {
                        setEditingSurvey(newSurvey);
                        setIsPopupOpen(true);
                      }, 0);
                    }}
                  >
                    Take New Survey
                  </Button>
                  <label htmlFor="file-upload">
                    <Button
                      variant="outline"
                      className="bg-gray-800 border-gray-700 hover:bg-gray-700 text-gray-300 cursor-pointer"
                      asChild
                    >
                      <div>
                        <Upload className="h-4 w-4 mr-2" />
                        Import Surveys
                      </div>
                    </Button>
                  </label>
                  <Button
                    variant="outline"
                    className="bg-gray-800 border-gray-700 hover:bg-gray-700 text-gray-300"
                    onClick={() => setIsExportSettingsOpen(true)}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export Settings
                  </Button>
                  <input
                    id="file-upload"
                    type="file"
                    accept=".csv,.txt,.las,.xls,.xlsx"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                </div>
              </div>

              <div
                className="grid grid-cols-1 lg:grid-cols-3 gap-6"
                data-testid="survey-analytics-grid"
              >
                {/* Survey Analytics */}
                <div className="lg:col-span-2">
                  <SurveyAnalytics
                    surveys={surveys}
                    onExport={handleExportSurveys}
                    trajectory={
                      <div className="bg-gray-900 border border-gray-800 rounded-md p-4 h-full">
                        <WellTrajectory3DInteractive
                          surveys={surveys.map((survey) => ({
                            md: survey.bitDepth || 0,
                            inc: survey.inclination || 0,
                            az: survey.azimuth || 0,
                            tvd: 0, // Will be calculated by the component
                            ns: 0, // Will be calculated by the component
                            ew: 0, // Will be calculated by the component
                          }))}
                          manualCurveData={{
                            motorYield: latestSurvey
                              ? calculateMotorYield(30, 2.0, 5)
                              : null,
                            doglegNeeded: latestSurvey
                              ? calculateDoglegNeeded(
                                  latestSurvey.inclination || 0,
                                  latestSurvey.azimuth || 0,
                                  35,
                                  275,
                                  100,
                                )
                              : null,
                            slideSeen: latestSurvey
                              ? calculateSlideSeen(
                                  calculateMotorYield(30, 2.0, 5),
                                  30,
                                  typeof witsData?.rotaryRpm === "number"
                                    ? witsData.rotaryRpm > 5
                                    : false,
                                )
                              : null,
                            slideAhead: latestSurvey
                              ? calculateSlideAhead(
                                  calculateMotorYield(30, 2.0, 5),
                                  30,
                                  5,
                                  typeof witsData?.rotaryRpm === "number"
                                    ? witsData.rotaryRpm > 5
                                    : false,
                                )
                              : null,
                            projectedInc: latestSurvey
                              ? calculateProjectedInclination(
                                  latestSurvey.inclination || 0,
                                  2.5,
                                  100,
                                )
                              : null,
                            projectedAz: latestSurvey
                              ? calculateProjectedAzimuth(
                                  latestSurvey.azimuth || 0,
                                  1.8,
                                  100,
                                )
                              : null,
                          }}
                        />
                      </div>
                    }
                    gamma={
                      <div className="bg-gray-900 border border-gray-800 rounded-md p-4 h-full">
                        <GammaPlot
                          isRealtime={isReceiving}
                          data={surveys.map((survey) => ({
                            tvd: survey.measuredDepth || survey.bitDepth || 0,
                            gamma: witsData.gamma || 50, // Use current gamma or default
                          }))}
                          onRefresh={() => {
                            toast({
                              title: "Gamma Plot Refreshed",
                              description:
                                "The gamma plot data has been refreshed.",
                            });
                          }}
                        />
                      </div>
                    }
                  />
                </div>

                {/* Right Column */}
                <div className="lg:col-span-1 space-y-6">
                  {/* Well Information Widget */}
                  <div className="mb-6 h-[375px] h-[-475px-]">
                    <WellInformationWidget
                      wellName={wellInfo.wellName}
                      rigName={wellInfo.rigName}
                      sensorOffset={wellInfo.sensorOffset}
                      onUpdate={(data) => {
                        setWellInfo(data);
                        toast({
                          title: "Well Information Updated",
                          description:
                            "Well information has been updated successfully.",
                        });
                      }}
                    />
                  </div>

                  {/* Email Settings */}
                  <SurveyEmailSettings
                    emailEnabled={false}
                    onToggleEmail={() => {}}
                    wellName={wellInfo.wellName}
                    rigName={wellInfo.rigName}
                  />

                  {/* Curve Data Widget */}
                  <div className="h-[250px]" data-testid="curve-data-container">
                    <CurveDataWidget
                      isRealtime={isReceiving || false}
                      slideDistance={30}
                      bendAngle={2.0}
                      bitToBendDistance={5}
                      targetInc={35}
                      targetAz={275}
                      distance={100}
                      wellInfo={wellInfo}
                      onSlideSeenChange={(value) =>
                        console.log("Slide seen changed:", value)
                      }
                      onSlideAheadChange={(value) =>
                        console.log("Slide ahead changed:", value)
                      }
                      onMotorYieldChange={(value) =>
                        console.log("Motor yield changed:", value)
                      }
                      onDoglegNeededChange={(value) =>
                        console.log("Dogleg needed changed:", value)
                      }
                      onProjectedIncChange={(value) =>
                        console.log("Projected inc changed:", value)
                      }
                      onProjectedAzChange={(value) =>
                        console.log("Projected az changed:", value)
                      }
                    />
                    {/* Using the shared context data instead of calculating locally */}
                    {console.log(
                      "SurveysPage - Using shared CurveData context",
                    )}
                  </div>
                </div>
              </div>

              {/* Survey Table */}
              <div>
                <SurveyTable
                  surveys={surveys}
                  onEditSurvey={handleEditSurvey}
                  onDeleteSurvey={handleDeleteSurvey}
                  onExportSurveys={handleExportSurveys}
                  onSelectSurveys={handleSelectSurveys}
                  selectedSurveys={selectedSurveys}
                  onEmailSurveys={() => setIsEmailDialogOpen(true)}
                />
              </div>
            </div>
          </div>
          {/* Survey Popup */}
          {isPopupOpen && editingSurvey && (
            <SurveyPopup
              isOpen={isPopupOpen}
              onClose={() => setIsPopupOpen(false)}
              onSave={(updatedSurvey) => {
                handleSaveSurvey(updatedSurvey);
              }}
              surveyData={editingSurvey}
              wellInfo={wellInfo}
            />
          )}
          {/* Survey Import */}
          {isImportOpen && (
            <SurveyImport onImportSurveys={handleImportSurveys} />
          )}
          {/* Export Settings Dialog */}
          <Dialog
            open={isExportSettingsOpen}
            onOpenChange={setIsExportSettingsOpen}
          >
            <DialogContent className="bg-gray-900 border-gray-800 text-gray-200">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold text-gray-200 flex items-center gap-2">
                  <Download className="h-5 w-5 text-blue-400" />
                  Export Settings
                </DialogTitle>
              </DialogHeader>

              <div className="mt-4 space-y-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="auto-export"
                    className="flex items-center justify-between"
                  >
                    <span>Auto-Export Surveys</span>
                    <Switch
                      id="auto-export"
                      checked={autoExportEnabled}
                      onCheckedChange={setAutoExportEnabled}
                    />
                  </Label>
                  <p className="text-xs text-gray-400">
                    When enabled, survey data will be automatically exported to
                    CSV and LAS formats whenever a new survey is added.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="file-monitoring"
                    className="flex items-center justify-between"
                  >
                    <span>File Monitoring</span>
                    <Switch
                      id="file-monitoring"
                      checked={fileMonitoringEnabled}
                      onCheckedChange={setFileMonitoringEnabled}
                    />
                  </Label>
                  <p className="text-xs text-gray-400">
                    When enabled, the system will monitor the imported survey
                    file for changes and automatically update the survey data
                    when the file is modified.
                  </p>
                  {fileMonitoringEnabled && monitoredFilePath && (
                    <div className="bg-gray-800/50 p-2 rounded-md border border-gray-700 text-xs text-gray-300">
                      Monitoring: {monitoredFilePath}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="export-folder">Export Folder Path</Label>
                  <div className="flex gap-2">
                    <Input
                      id="export-folder"
                      value={exportFolderPath}
                      onChange={(e) => setExportFolderPath(e.target.value)}
                      placeholder="C:\MWD_Surveys"
                      className="bg-gray-800 border-gray-700 text-gray-200"
                      readOnly
                    />
                    <Button
                      variant="outline"
                      className="bg-gray-800 border-gray-700 hover:bg-gray-700 text-gray-300"
                      onClick={async () => {
                        try {
                          // Try to use the File System Access API if available
                          if ("showDirectoryPicker" in window) {
                            const directoryHandle = await (
                              window as any
                            ).showDirectoryPicker();

                            // Store the directory handle for future use
                            try {
                              // Request permission to use the directory
                              const permission =
                                await directoryHandle.requestPermission({
                                  mode: "readwrite",
                                });
                              if (permission === "granted") {
                                // Store the directory handle for future use
                                localStorage.setItem(
                                  "exportDirectoryHandle",
                                  JSON.stringify(directoryHandle),
                                );

                                // Get the folder name
                                const folderName = directoryHandle.name;
                                setExportFolderPath(folderName);

                                toast({
                                  title: "Export Folder Selected",
                                  description: `Files will be exported to: ${folderName}`,
                                });
                              }
                            } catch (permErr) {
                              console.error("Permission error:", permErr);
                              // Fall back to the old method
                              fallbackFolderSelection();
                            }
                          } else {
                            // Fall back to the old method if the API is not available
                            fallbackFolderSelection();
                          }
                        } catch (err) {
                          console.error("Error selecting folder:", err);
                          // Fall back to the old method
                          fallbackFolderSelection();
                        }
                      }}
                    >
                      Browse
                    </Button>
                  </div>
                  <p className="text-xs text-gray-400">
                    Note: Due to browser security restrictions, files will be
                    downloaded to your default download folder. The path above
                    is for reference only.
                  </p>
                </div>

                <div className="bg-blue-900/20 p-3 rounded-md border border-blue-800">
                  <div className="flex items-start gap-2">
                    <Info className="h-5 w-5 text-blue-400 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-medium text-blue-400">
                        Export Information
                      </h4>
                      <p className="text-xs text-gray-400 mt-1">
                        Survey data will be exported in both CSV and LAS
                        formats. CSV files can be opened in spreadsheet
                        applications like Excel, while LAS files are compatible
                        with most well logging and directional drilling
                        software.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <DialogFooter className="mt-6">
                <Button
                  variant="outline"
                  onClick={() => setIsExportSettingsOpen(false)}
                  className="bg-gray-800 hover:bg-gray-700 text-gray-200 border-gray-700"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    setIsExportSettingsOpen(false);
                    toast({
                      title: "Export Settings Saved",
                      description: `Auto-export is now ${autoExportEnabled ? "enabled" : "disabled"}.`,
                    });
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Settings
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          {/* Email Preview Dialog */}
          <Dialog open={isEmailDialogOpen} onOpenChange={setIsEmailDialogOpen}>
            <DialogContent className="bg-gray-900 border-gray-800 text-gray-200 max-w-4xl">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold text-gray-200 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-400" />
                  Email Survey Data
                </DialogTitle>
              </DialogHeader>

              <div className="mt-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email-recipient">Recipient</Label>
                    <Input
                      id="email-recipient"
                      value={emailRecipient}
                      onChange={(e) => setEmailRecipient(e.target.value)}
                      className="bg-gray-800 border-gray-700 text-gray-200"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email-subject">Subject</Label>
                    <Input
                      id="email-subject"
                      value={`MWD Survey Report - Well ${wellInfo.wellName} - ${new Date().toLocaleDateString()}`}
                      className="bg-gray-800 border-gray-700 text-gray-200"
                      readOnly
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label>Email Preview</Label>
                    <Badge
                      variant="outline"
                      className="bg-blue-900/30 text-blue-400 border-blue-800"
                    >
                      {selectedSurveys.length} Surveys Selected
                    </Badge>
                  </div>
                  <div className="bg-gray-800/50 p-4 rounded-md border border-gray-800 font-mono text-sm whitespace-pre-wrap h-[400px] overflow-y-auto email-preview-container">
                    {generateEmailContent(
                      selectedSurveys,
                      surveys,
                      wellInfo,
                      witsData,
                      includeCurveData,
                      includeTargetLineStatus,
                    )}
                  </div>
                </div>

                <div className="bg-blue-900/20 p-3 rounded-md border border-blue-800">
                  <div className="flex items-start gap-2">
                    <Info className="h-5 w-5 text-blue-400 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-medium text-blue-400">
                        Email Information
                      </h4>
                      <p className="text-xs text-gray-400 mt-1">
                        This email will include a detailed survey report with
                        all selected surveys. The report includes directional
                        data, quality assessments, and calculated values such as
                        TVD and dogleg severity. Recipients can import this data
                        into their own directional drilling software.
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Clicking "Create Email Draft" will open your default
                        email client with all the survey data pre-populated. You
                        can review and make any final adjustments before
                        sending.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col md:flex-row gap-2">
                  <div className="flex-1 bg-gray-800/50 p-3 rounded-md border border-gray-800">
                    <h4 className="text-sm font-medium text-gray-300 mb-1">
                      Attachments
                    </h4>
                    {selectedSurveys.length > 0 ? (
                      <>
                        <div className="flex items-center gap-2 text-xs text-gray-400">
                          <CheckCircle className="h-3 w-3 text-green-400" />
                          <span>SurveyData.csv</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
                          <CheckCircle className="h-3 w-3 text-green-400" />
                          <span>WellTrajectory.pdf</span>
                        </div>
                      </>
                    ) : (
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <AlertCircle className="h-3 w-3 text-yellow-400" />
                        <span>No surveys selected</span>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 bg-gray-800/50 p-3 rounded-md border border-gray-800">
                    <h4 className="text-sm font-medium text-gray-300 mb-1">
                      Delivery Options
                    </h4>
                    <div className="flex items-center gap-2 text-xs">
                      <input
                        type="checkbox"
                        id="cc-field-engineer"
                        className="rounded bg-gray-700 border-gray-600 text-blue-600"
                      />
                      <label
                        htmlFor="cc-field-engineer"
                        className="text-gray-400"
                      >
                        CC Field Engineer
                      </label>
                    </div>
                    <div className="flex items-center gap-2 text-xs mt-1">
                      <input
                        type="checkbox"
                        id="high-priority"
                        className="rounded bg-gray-700 border-gray-600 text-blue-600"
                      />
                      <label htmlFor="high-priority" className="text-gray-400">
                        Mark as High Priority
                      </label>
                    </div>
                    <div className="flex items-center gap-2 text-xs mt-1">
                      <input
                        type="checkbox"
                        id="include-curve-data"
                        className="rounded bg-gray-700 border-gray-600 text-blue-600"
                        checked={includeCurveData}
                        onChange={handleToggleIncludeCurveData}
                      />
                      <label
                        htmlFor="include-curve-data"
                        className="text-gray-400"
                      >
                        Include Curve Data
                      </label>
                    </div>
                    <div className="flex items-center gap-2 text-xs mt-1">
                      <input
                        type="checkbox"
                        id="include-target-line-status"
                        className="rounded bg-gray-700 border-gray-600 text-blue-600"
                        checked={includeTargetLineStatus}
                        onChange={() =>
                          setIncludeTargetLineStatus(!includeTargetLineStatus)
                        }
                      />
                      <label
                        htmlFor="include-target-line-status"
                        className="text-gray-400"
                      >
                        Include Target Line Status
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              <DialogFooter className="mt-6">
                <Button
                  variant="outline"
                  onClick={() => setIsEmailDialogOpen(false)}
                  className="bg-gray-800 hover:bg-gray-700 text-gray-200 border-gray-700"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSendEmail}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Create Email Draft
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      );
    } catch (renderError) {
      console.error("Fatal error rendering SurveysPage:", renderError);
      setHasError(true);
      return (
        <div className="min-h-screen bg-gray-950 text-gray-200 p-8">
          <Navbar />
          <div className="container mx-auto px-4 py-6">
            <div className="bg-red-900/30 border border-red-800 rounded-md p-6 text-center">
              <h2 className="text-xl font-bold text-red-400 mb-2">
                Display Error
              </h2>
              <p className="text-gray-300 mb-4">
                There was an error displaying the survey management data. This
                could be due to invalid survey data or calculation errors.
              </p>
              <p className="text-gray-400 text-sm">
                Try refreshing the page or check the survey data for any
                inconsistencies.
              </p>
            </div>
          </div>
        </div>
      );
    }
  };

  return <ErrorBoundary>{safeRender()}</ErrorBoundary>;
};

export default SurveysPage;
