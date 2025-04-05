import { createContext, useContext, useState, ReactNode } from "react";
import { SurveyData } from "@/components/dashboard/SurveyPopup";

interface SurveyContextType {
  surveys: SurveyData[];
  addSurvey: (survey: SurveyData) => void;
  updateSurvey: (updatedSurvey: SurveyData) => void;
  deleteSurvey: (id: string) => void;
  exportSurveys: () => void;
}

const SurveyContext = createContext<SurveyContextType | undefined>(undefined);

// Using function declaration for SurveyProvider
function SurveyProvider({ children }: { children: ReactNode }) {
  const [surveys, setSurveys] = useState<SurveyData[]>([]);

  const addSurvey = (survey: SurveyData) => {
    setSurveys((prevSurveys) => {
      // Check if a survey with the same ID already exists
      const surveyExists = prevSurveys.some((s) => s.id === survey.id);

      // If survey already exists, don't add it again
      if (surveyExists) {
        console.log(
          "Survey with ID",
          survey.id,
          "already exists. Not adding duplicate.",
        );
        return prevSurveys;
      }

      // Check for surveys with very similar timestamp and depth (potential duplicates)
      const potentialDuplicate = prevSurveys.find((s) => {
        const timeDiff = Math.abs(
          new Date(s.timestamp).getTime() -
            new Date(survey.timestamp).getTime(),
        );
        const depthDiff = Math.abs(s.bitDepth - survey.bitDepth);

        // If timestamp is within 5 seconds and depth is within 0.5 feet, consider it a duplicate
        return timeDiff < 5000 && depthDiff < 0.5;
      });

      if (potentialDuplicate) {
        console.log(
          "Potential duplicate survey detected. Not adding survey with similar timestamp and depth.",
        );
        return prevSurveys;
      }

      // If no duplicates found, add the new survey
      return [...prevSurveys, survey];
    });
  };

  const updateSurvey = (updatedSurvey: SurveyData) => {
    setSurveys((prevSurveys) => {
      // Check if the survey exists before updating
      const surveyExists = prevSurveys.some((s) => s.id === updatedSurvey.id);

      if (!surveyExists) {
        console.log(
          "Survey with ID",
          updatedSurvey.id,
          "does not exist. Adding instead of updating.",
        );
        return [...prevSurveys, updatedSurvey];
      }

      // If survey exists, update it
      return prevSurveys.map((survey) =>
        survey.id === updatedSurvey.id ? updatedSurvey : survey,
      );
    });
  };

  const deleteSurvey = (id: string) => {
    setSurveys((prevSurveys) =>
      prevSurveys.filter((survey) => survey.id !== id),
    );
  };

  const exportSurveys = () => {
    console.log("Exporting surveys...", surveys);
    // Implementation for exporting surveys would go here

    // Sort surveys by timestamp before exporting
    const sortedSurveys = [...surveys].sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );

    // Here you would implement the actual export functionality
    // For example, converting to CSV and triggering a download
    console.log("Sorted surveys ready for export:", sortedSurveys);
  };

  return (
    <SurveyContext.Provider
      value={{
        surveys,
        addSurvey,
        updateSurvey,
        deleteSurvey,
        exportSurveys,
      }}
    >
      {children}
    </SurveyContext.Provider>
  );
}

// Using function declaration for useSurveys
function useSurveys() {
  const context = useContext(SurveyContext);
  if (context === undefined) {
    throw new Error("useSurveys must be used within a SurveyProvider");
  }
  return context;
}

export { SurveyProvider, useSurveys };
