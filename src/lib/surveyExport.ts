/**
 * Survey Export Utilities
 * Handles exporting survey data to various formats
 */

import { SurveyData } from "@/components/dashboard/SurveyPopup";

/**
 * Export surveys to CSV format
 */
export const exportSurveysToCSV = (surveys: SurveyData[]): string => {
  // Sort surveys by timestamp (newest first)
  const sortedSurveys = [...surveys].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );

  // Define CSV headers
  const headers = [
    "Timestamp",
    "Bit Depth (ft)",
    "Inclination (°)",
    "Azimuth (°)",
    "Tool Face (°)",
    "Tool Temp (°F)",
    "B Total (μT)",
    "A Total (G)",
    "Quality Check",
    "Comments",
  ];

  // Create CSV content
  let csvContent = headers.join(",") + "\n";

  // Add survey data rows
  sortedSurveys.forEach((survey) => {
    const row = [
      new Date(survey.timestamp).toISOString(),
      survey.bitDepth.toFixed(2),
      survey.inclination.toFixed(2),
      survey.azimuth.toFixed(2),
      survey.toolFace.toFixed(2),
      survey.toolTemp.toFixed(2),
      (survey.bTotal || 0).toFixed(2),
      (survey.aTotal || 0).toFixed(2),
      survey.qualityCheck?.status || "N/A",
      `"${survey.comments || ""}"`,
    ];

    csvContent += row.join(",") + "\n";
  });

  return csvContent;
};

/**
 * Export surveys to JSON format
 */
export const exportSurveysToJSON = (surveys: SurveyData[]): string => {
  // Sort surveys by timestamp (newest first)
  const sortedSurveys = [...surveys].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );

  return JSON.stringify(sortedSurveys, null, 2);
};

/**
 * Export surveys to LAS format (Log ASCII Standard)
 */
export const exportSurveysToLAS = (
  surveys: SurveyData[],
  wellInfo: { wellName: string; rigName: string },
): string => {
  // Sort surveys by measured depth (ascending)
  const sortedSurveys = [...surveys].sort((a, b) => a.bitDepth - b.bitDepth);

  // Create LAS header
  let lasContent = "";

  // Version information section
  lasContent += "~VERSION INFORMATION\n";
  lasContent +=
    "VERS.                 2.0                                     : CWLS LOG ASCII STANDARD - VERSION 2.0\n";
  lasContent +=
    "WRAP.                 NO                                      : ONE LINE PER DEPTH STEP\n";
  lasContent += "\n";

  // Well information section
  lasContent += "~WELL INFORMATION\n";
  lasContent += `WELL.                  ${wellInfo.wellName}                    : WELL NAME\n`;
  lasContent += `RIG.                   ${wellInfo.rigName}                     : RIG NAME\n`;
  lasContent += `DATE.                  ${new Date().toISOString().split("T")[0]} : EXPORT DATE\n`;
  lasContent += "\n";

  // Curve information section
  lasContent += "~CURVE INFORMATION\n";
  lasContent += "DEPT.M                : MEASURED DEPTH (FT)\n";
  lasContent += "INCL.DEG              : INCLINATION (DEG)\n";
  lasContent += "AZIM.DEG              : AZIMUTH (DEG)\n";
  lasContent += "TF.DEG                : TOOL FACE (DEG)\n";
  lasContent += "TEMP.DEGF             : TEMPERATURE (DEG F)\n";
  lasContent += "BTOT.UT               : TOTAL MAGNETIC FIELD (MICROTESLA)\n";
  lasContent += "ATOT.G                : TOTAL GRAVITY (G)\n";
  lasContent += "\n";

  // Parameter information section
  lasContent += "~PARAMETER INFORMATION\n";
  lasContent += `DLIS.                  ${wellInfo.wellName}_SURVEYS            : SURVEYS FILE NAME\n`;
  lasContent += "\n";

  // ASCII Log Data section
  lasContent += "~ASCII LOG DATA\n";

  // Add survey data
  sortedSurveys.forEach((survey) => {
    lasContent +=
      [
        survey.bitDepth.toFixed(2),
        survey.inclination.toFixed(2),
        survey.azimuth.toFixed(2),
        survey.toolFace.toFixed(2),
        survey.toolTemp.toFixed(2),
        (survey.bTotal || 0).toFixed(2),
        (survey.aTotal || 0).toFixed(2),
      ].join(" ") + "\n";
  });

  return lasContent;
};

/**
 * Download data as a file
 */
export const downloadFile = (
  data: string,
  filename: string,
  mimeType: string,
): void => {
  const blob = new Blob([data], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();

  // Clean up
  setTimeout(() => {
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, 100);
};

/**
 * Export surveys to file
 */
export const exportSurveysToFile = (
  surveys: SurveyData[],
  format: "csv" | "json" | "las",
  wellInfo: { wellName: string; rigName: string },
): void => {
  if (surveys.length === 0) {
    console.warn("No surveys to export");
    return;
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const wellName = wellInfo.wellName.replace(/\s+/g, "_");

  switch (format) {
    case "csv":
      const csvData = exportSurveysToCSV(surveys);
      downloadFile(csvData, `${wellName}_surveys_${timestamp}.csv`, "text/csv");
      break;

    case "json":
      const jsonData = exportSurveysToJSON(surveys);
      downloadFile(
        jsonData,
        `${wellName}_surveys_${timestamp}.json`,
        "application/json",
      );
      break;

    case "las":
      const lasData = exportSurveysToLAS(surveys, wellInfo);
      downloadFile(
        lasData,
        `${wellName}_surveys_${timestamp}.las`,
        "text/plain",
      );
      break;

    default:
      console.error("Unsupported export format:", format);
  }
};

/**
 * Auto-export surveys based on settings
 */
export const autoExportSurveys = (
  surveys: SurveyData[],
  exportFolderPath: string,
  wellInfo: { wellName: string; rigName: string },
  format: "csv" | "json" | "las" = "csv",
): void => {
  if (!exportFolderPath || surveys.length === 0) return;

  try {
    // In a browser environment, we can't directly write to the file system
    // In a real implementation, this would use a backend API or Electron's file system API
    // For now, we'll just trigger a download
    exportSurveysToFile(surveys, format, wellInfo);

    console.log(`Auto-exported surveys to ${exportFolderPath}`);
  } catch (error) {
    console.error("Failed to auto-export surveys:", error);
  }
};
