import React from "react";
import { Button } from "@/components/ui/button";
import { useSurveys } from "@/context/SurveyContext";
import { toast } from "@/components/ui/use-toast";

const SurveyFixStoryboard = () => {
  const { surveys, clearSurveys } = useSurveys();

  const handleClearSurveys = () => {
    clearSurveys();
    toast({
      title: "Surveys Cleared",
      description: "All surveys have been removed from storage.",
      variant: "default",
    });
  };

  const surveyCount = Array.isArray(surveys) ? surveys.length : 0;
  const hasInvalidSurveys =
    Array.isArray(surveys) &&
    surveys.some((survey) => {
      return (
        !survey ||
        typeof survey !== "object" ||
        !survey.id ||
        typeof survey.bitDepth !== "number" ||
        typeof survey.inclination !== "number" ||
        typeof survey.azimuth !== "number"
      );
    });

  return (
    <div className="bg-gray-950 text-gray-200 min-h-screen p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Survey Data Troubleshooter</h1>

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Survey Data Status</h2>

          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-gray-800/50 rounded-md">
              <span>Total Surveys:</span>
              <span className="font-mono">{surveyCount}</span>
            </div>

            <div className="flex justify-between items-center p-3 bg-gray-800/50 rounded-md">
              <span>Invalid Surveys Detected:</span>
              <span
                className={`font-mono ${hasInvalidSurveys ? "text-red-400" : "text-green-400"}`}
              >
                {hasInvalidSurveys ? "Yes" : "No"}
              </span>
            </div>
          </div>

          {hasInvalidSurveys && (
            <div className="mt-4 p-4 bg-red-900/20 border border-red-800 rounded-md">
              <p className="text-red-400 font-medium mb-2">
                Warning: Invalid Survey Data Detected
              </p>
              <p className="text-sm text-gray-300 mb-3">
                Some of your survey data appears to be invalid or corrupted.
                This can cause display errors in the Directional Page and other
                components. It's recommended to clear all surveys and start
                fresh.
              </p>
            </div>
          )}
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Fix Options</h2>

          <div className="space-y-4">
            <div className="p-4 border border-gray-800 rounded-md">
              <h3 className="text-lg font-medium mb-2">Clear All Surveys</h3>
              <p className="text-sm text-gray-400 mb-4">
                This will remove all survey data from local storage. Use this
                option if you're experiencing display errors or if invalid
                survey data has been detected.
              </p>
              <Button
                variant="destructive"
                onClick={handleClearSurveys}
                className="w-full"
              >
                Clear All Surveys
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SurveyFixStoryboard;
