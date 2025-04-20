import { createContext, useContext, useState, ReactNode } from "react";
import { SurveyData } from "@/components/dashboard/SurveyPopup";

interface SurveyContextType {
  surveys: SurveyData[];
  addSurvey: (survey: SurveyData) => void;
  updateSurvey: (updatedSurvey: SurveyData) => void;
  deleteSurvey: (id: string) => void;
  exportSurveys: () => void;
  exportFolderPath: string;
  setExportFolderPath: (path: string) => void;
  autoExportEnabled: boolean;
  setAutoExportEnabled: (enabled: boolean) => void;
}

const SurveyContext = createContext<SurveyContextType | undefined>(undefined);

// Define SurveyProvider component separately from export
const SurveyProviderComponent = ({ children }: { children: ReactNode }) => {
  const [surveys, setSurveys] = useState<SurveyData[]>([]);
  const [exportFolderPath, setExportFolderPath] = useState<string>("");
  const [autoExportEnabled, setAutoExportEnabled] = useState<boolean>(false);

  const addSurvey = (survey: SurveyData) => {
    try {
      // Validate and sanitize the survey data
      const sanitizedSurvey = {
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
        wellName: survey.wellName || "",
        rigName: survey.rigName || "",
        // Ensure qualityCheck exists
        qualityCheck: survey.qualityCheck || {
          status: "pass",
          message: "Default quality check",
        },
      };

      setSurveys((prevSurveys) => {
        // Check if a survey with the same ID already exists
        const surveyExists = prevSurveys.some(
          (s) => s.id === sanitizedSurvey.id,
        );

        // If survey already exists, don't add it again
        if (surveyExists) {
          console.log(
            "Survey with ID",
            sanitizedSurvey.id,
            "already exists. Not adding duplicate.",
          );
          return prevSurveys;
        }

        // Check for surveys with very similar timestamp and depth (potential duplicates)
        const potentialDuplicate = prevSurveys.find((s) => {
          try {
            const timeDiff = Math.abs(
              new Date(s.timestamp).getTime() -
                new Date(sanitizedSurvey.timestamp).getTime(),
            );
            const depthDiff = Math.abs(s.bitDepth - sanitizedSurvey.bitDepth);

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
          );
          return prevSurveys;
        }

        // If no duplicates found, add the new survey
        return [...prevSurveys, sanitizedSurvey];
      });
    } catch (error) {
      console.error("Error adding survey:", error);
      // Return without crashing
    }
  };

  const updateSurvey = (updatedSurvey: SurveyData) => {
    try {
      // Validate and sanitize the survey data
      const sanitizedSurvey = {
        ...updatedSurvey,
        // Ensure ID exists
        id: updatedSurvey.id || `survey-${Date.now()}`,
        // Ensure timestamp exists
        timestamp: updatedSurvey.timestamp || new Date().toISOString(),
        // Ensure numeric fields have valid values
        bitDepth: isNaN(updatedSurvey.bitDepth) ? 0 : updatedSurvey.bitDepth,
        inclination: isNaN(updatedSurvey.inclination)
          ? 0
          : updatedSurvey.inclination,
        azimuth: isNaN(updatedSurvey.azimuth) ? 0 : updatedSurvey.azimuth,
        toolFace: isNaN(updatedSurvey.toolFace) ? 0 : updatedSurvey.toolFace,
        bTotal: isNaN(updatedSurvey.bTotal) ? 0 : updatedSurvey.bTotal,
        aTotal: isNaN(updatedSurvey.aTotal) ? 0 : updatedSurvey.aTotal,
        dip: isNaN(updatedSurvey.dip) ? 0 : updatedSurvey.dip,
        toolTemp: isNaN(updatedSurvey.toolTemp) ? 0 : updatedSurvey.toolTemp,
        // Ensure string fields are not undefined
        wellName: updatedSurvey.wellName || "",
        rigName: updatedSurvey.rigName || "",
        // Ensure qualityCheck exists
        qualityCheck: updatedSurvey.qualityCheck || {
          status: "pass",
          message: "Default quality check",
        },
      };

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
    } catch (error) {
      console.error("Error updating survey:", error);
      // Return without crashing
    }
  };

  const deleteSurvey = (id: string) => {
    setSurveys((prevSurveys) =>
      prevSurveys.filter((survey) => survey.id !== id),
    );
  };

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
        exportSurveys,
        exportFolderPath,
        setExportFolderPath,
        autoExportEnabled,
        setAutoExportEnabled,
      }}
    >
      {children}
    </SurveyContext.Provider>
  );
};

// Define useSurveys hook separately from export
const useSurveysHook = () => {
  const context = useContext(SurveyContext);
  if (context === undefined) {
    throw new Error("useSurveys must be used within a SurveyProvider");
  }
  return context;
};

// Export the components separately for better compatibility with Fast Refresh
export const SurveyProvider = SurveyProviderComponent;
export const useSurveys = useSurveysHook;
