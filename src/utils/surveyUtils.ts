import { SurveyData } from "@/components/dashboard/SurveyPopup";
import * as XLSX from "xlsx";

/**
 * Determines the quality check status based on inclination and azimuth values
 */
export const determineQualityCheck = (inc: number, az: number) => {
  // Check for unrealistic values
  if (inc < 0 || inc > 180) {
    return {
      status: "fail" as const,
      message: "Inclination out of valid range (0-180 degrees)",
    };
  }

  if (az < 0 || az > 360) {
    return {
      status: "fail" as const,
      message: "Azimuth out of valid range (0-360 degrees)",
    };
  }

  // Check for suspicious values that might indicate sensor issues
  if (inc > 120) {
    return {
      status: "warning" as const,
      message: "Unusually high inclination value - verify sensor readings",
    };
  }

  // Check for near-vertical wellbore with uncertain azimuth
  if (inc < 3 && az !== 0) {
    return {
      status: "warning" as const,
      message: "Near-vertical wellbore - azimuth readings may be unreliable",
    };
  }

  // All checks passed
  return {
    status: "pass" as const,
    message: "All parameters within acceptable ranges",
  };
};

/**
 * Generates CSV content from survey data
 */
export const generateCSVContent = (surveysData: SurveyData[]): string => {
  // Sort surveys by timestamp (newest first)
  const sortedSurveys = [...surveysData].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );

  // Define CSV headers
  const headers = [
    "Bit Depth (ft)",
    "MD (ft)",
    "Inc (°)",
    "Azi (°)",
    "TF (°)",
    "TVD (ft)",
    "NS (ft)",
    "EW (ft)",
    "B Total",
    "A Total",
    "Dip (°)",
    "Temp (°F)",
    "Above/Below",
    "Left/Right",
    "Quality",
  ];

  // Create CSV content
  let csvContent = headers.join(",") + "\n";

  // Add survey data rows
  sortedSurveys.forEach((survey) => {
    // Calculate MD (if not provided)
    const md =
      survey.measuredDepth || survey.bitDepth - (survey.sensorOffset || 0);

    // Calculate TVD, NS, and EW values using measured depth
    const tvd = md * Math.cos((survey.inclination * Math.PI) / 180);
    const horizontalDistance =
      md * Math.sin((survey.inclination * Math.PI) / 180);
    const ns = horizontalDistance * Math.cos((survey.azimuth * Math.PI) / 180);
    const ew = horizontalDistance * Math.sin((survey.azimuth * Math.PI) / 180);

    // Calculate above/below based on target line (simplified)
    const aboveBelow = (ns * 0.8 - tvd * 0.2).toFixed(2);
    const aboveBelowPrefix = parseFloat(aboveBelow) >= 0 ? "+" : "";

    // Calculate left/right based on target line (simplified)
    const leftRight = (ew * 0.8 - tvd * 0.1).toFixed(2);
    const leftRightPrefix = parseFloat(leftRight) >= 0 ? "+" : "";

    const row = [
      survey.bitDepth.toFixed(2),
      md.toFixed(2),
      survey.inclination.toFixed(2),
      survey.azimuth.toFixed(2),
      survey.toolFace.toFixed(2),
      tvd.toFixed(2),
      ns.toFixed(2),
      ew.toFixed(2),
      survey.bTotal.toFixed(2),
      survey.aTotal.toFixed(3),
      survey.dip.toFixed(2),
      survey.toolTemp.toFixed(1),
      `${aboveBelowPrefix}${aboveBelow}`,
      `${leftRightPrefix}${leftRight}`,
      survey.qualityCheck.status,
    ];
    csvContent += row.join(",") + "\n";
  });

  return csvContent;
};

/**
 * Generates LAS content from survey data
 */
export const generateLASContent = (surveysData: SurveyData[]): string => {
  // Sort surveys by depth (shallowest to deepest)
  const sortedSurveys = [...surveysData].sort(
    (a, b) => a.bitDepth - b.bitDepth,
  );

  // Create LAS header
  let lasContent = "~VERSION INFORMATION\n";
  lasContent +=
    "VERS.                 2.0: CWLS LOG ASCII STANDARD - VERSION 2.0\n";
  lasContent += "WRAP.                  NO: ONE LINE PER DEPTH STEP\n";
  lasContent += "~WELL INFORMATION\n";

  // Add well information if available
  if (sortedSurveys.length > 0) {
    const latestSurvey = sortedSurveys[sortedSurveys.length - 1];
    lasContent += `WELL.             ${latestSurvey.wellName}: WELL NAME\n`;
    lasContent += `COMP.             New Well Technologies: COMPANY NAME\n`;
    lasContent += `RIG.              ${latestSurvey.rigName}: RIG NAME\n`;
    lasContent += `DATE.             ${new Date().toISOString().split("T")[0]}: EXPORT DATE\n`;
  }

  // Add curve information
  lasContent += "~CURVE INFORMATION\n";
  lasContent += "DEPT.M                : MEASURED DEPTH\n";
  lasContent += "INCL.DEG              : INCLINATION\n";
  lasContent += "AZIM.DEG              : AZIMUTH\n";
  lasContent += "TF.DEG                : TOOL FACE\n";
  lasContent += "BTOT.UT               : TOTAL MAGNETIC FIELD\n";
  lasContent += "ATOT.G                : TOTAL GRAVITY\n";
  lasContent += "DIP.DEG               : DIP ANGLE\n";
  lasContent += "TEMP.F                : TOOL TEMPERATURE\n";

  // Add parameter information
  lasContent += "~PARAMETER INFORMATION\n";
  lasContent += "~ASCII LOG DATA\n";

  // Add survey data
  sortedSurveys.forEach((survey) => {
    lasContent += `${survey.bitDepth.toFixed(2)} ${survey.inclination.toFixed(2)} ${survey.azimuth.toFixed(2)} ${survey.toolFace.toFixed(2)} ${survey.bTotal.toFixed(2)} ${survey.aTotal.toFixed(3)} ${survey.dip.toFixed(2)} ${survey.toolTemp.toFixed(1)}\n`;
  });

  return lasContent;
};

/**
 * Downloads a file with the given content and filename
 */
export const downloadFile = (content: string, filename: string) => {
  const blob = new Blob([content], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

/**
 * Helper function to find a value in data using multiple possible keys
 */
const findValueByKeys = (
  data: Record<string, any>,
  keys: string[],
  defaultValue: string = "0",
): string => {
  for (const key of keys) {
    if (data[key] !== undefined) {
      return data[key];
    }
  }
  return defaultValue;
};

/**
 * Interface for detected file headers
 */
export interface DetectedFileHeaders {
  headers: string[];
  originalHeaders: string[];
  fileType: "csv" | "txt" | "las" | "xlsx";
  filePath?: string;
}

// Store the last detected headers
let lastDetectedHeaders: DetectedFileHeaders | null = null;

/**
 * Get the last detected headers from file import
 */
export const getLastDetectedHeaders = (): DetectedFileHeaders | null => {
  return lastDetectedHeaders;
};

/**
 * Set the last detected headers
 */
export const setLastDetectedHeaders = (headers: DetectedFileHeaders | null) => {
  lastDetectedHeaders = headers;
};

/**
 * Detect if a line contains survey-related keywords
 */
export const isSurveyHeaderLine = (line: string): boolean => {
  const lowerLine = line.toLowerCase();
  // Check for combinations of keywords that would indicate this is a header line
  return (
    // Must have depth or survey related term
    (lowerLine.includes("depth") ||
      lowerLine.includes("md") ||
      lowerLine.includes("sd") ||
      lowerLine.includes("survey") ||
      lowerLine.includes("measured")) &&
    // Must have inclination related term
    (lowerLine.includes("inclination") ||
      lowerLine.includes("inc") ||
      lowerLine.includes("incl") ||
      lowerLine.includes("angle") ||
      lowerLine.includes("i")) &&
    // Must have azimuth related term
    (lowerLine.includes("azimuth") ||
      lowerLine.includes("az") ||
      lowerLine.includes("azi") ||
      lowerLine.includes("a") ||
      lowerLine.includes("heading"))
  );
};

/**
 * Parses CSV content into survey data
 */
export const parseCSVSurveys = (
  content: string,
  wellInfo: { wellName: string; rigName: string; sensorOffset: number },
  filePath?: string,
): SurveyData[] => {
  console.log("Starting CSV parsing");
  // Parse CSV content into survey data
  const lines = content.split("\n").filter((line) => line.trim().length > 0);
  console.log(`CSV: Found ${lines.length} lines in the file`);

  if (lines.length <= 1) {
    console.warn("CSV: File contains no data rows");
    return [];
  }

  // Try to detect if this is a survey report format (like the one from Altitude Energy Partners)
  const isReportFormat = lines.some(isSurveyHeaderLine);

  let startRow = 0;
  let headerRow = 0;

  if (isReportFormat) {
    console.log("CSV: Detected survey report format");
    // Find the header row in a report format
    for (let i = 0; i < Math.min(30, lines.length); i++) {
      if (isSurveyHeaderLine(lines[i])) {
        headerRow = i;
        startRow = i;
        console.log(`CSV: Found header row at line ${i}: ${lines[i]}`);
        break;
      }
    }
  }

  // Get headers from the identified header row
  const originalHeaders = lines[headerRow].split(",").map((h) => h.trim());
  const headers = originalHeaders.map((h) => h.toLowerCase());
  console.log(`CSV: Found ${headers.length} columns: ${headers.join(", ")}`);

  // Store the detected headers for later use
  setLastDetectedHeaders({
    headers,
    originalHeaders,
    fileType: "csv",
    filePath,
  });

  const surveys: SurveyData[] = [];

  // Start processing from the row after the header row
  // If the header row contains data (keywords and headers in same row), start from the next row
  // Otherwise, if it's a pure header row, start from the row after
  const dataStartRow = isReportFormat ? startRow + 1 : startRow + 1;
  console.log(`CSV: Starting data processing from row ${dataStartRow}`);

  for (let i = dataStartRow; i < lines.length; i++) {
    const line = lines[i];
    // Skip separator lines or empty lines
    if (line.includes("====") || line.trim().length === 0) continue;

    const values = line.split(",").map((v) => v.trim());
    if (values.length < 3) {
      // Need at least a few values to be a valid row
      console.log(
        `CSV: Skipping row ${i}, insufficient values: ${values.length}`,
      );
      continue;
    }

    const data: Record<string, any> = {};
    headers.forEach((header, index) => {
      if (index < values.length) {
        data[header] = values[index];
      }
    });

    try {
      // Create survey with required fields, using defaults for missing values
      const survey: SurveyData = {
        id: Date.now().toString() + "-" + i,
        timestamp: findValueByKeys(
          data,
          ["timestamp", "date", "time"],
          new Date().toISOString(),
        ),
        bitDepth:
          parseFloat(
            findValueByKeys(data, ["bitdepth", "depth", "measured", "survey"]),
          ) || 0,
        measuredDepth:
          parseFloat(
            findValueByKeys(data, [
              "measureddepth",
              "md",
              "measured depth",
              "measured",
              "sd",
              "bitdepth",
              "depth",
            ]),
          ) || 0,
        sensorOffset:
          parseFloat(
            findValueByKeys(data, ["sensoroffset", "sensor offset", "offset"]),
          ) || wellInfo.sensorOffset,
        inclination:
          parseFloat(findValueByKeys(data, ["inclination", "inc", "incl"])) ||
          0,
        azimuth:
          parseFloat(findValueByKeys(data, ["azimuth", "az", "azi"])) || 0,
        toolFace:
          parseFloat(findValueByKeys(data, ["toolface", "tf", "tool face"])) ||
          0,
        bTotal:
          parseFloat(
            findValueByKeys(data, [
              "btotal",
              "magneticfield",
              "magnetic field",
              "b total",
              "b",
            ]),
          ) || 0,
        aTotal:
          parseFloat(
            findValueByKeys(data, ["atotal", "gravity", "a total", "a"]),
          ) || 0,
        dip: parseFloat(findValueByKeys(data, ["dip"])) || 0,
        toolTemp:
          parseFloat(
            findValueByKeys(data, [
              "tooltemp",
              "temperature",
              "temp",
              "tool temp",
            ]),
          ) || 0,
        wellName: findValueByKeys(
          data,
          ["wellname", "well name", "well"],
          wellInfo.wellName,
        ),
        rigName: findValueByKeys(
          data,
          ["rigname", "rig name", "rig"],
          wellInfo.rigName,
        ),
        qualityCheck: determineQualityCheck(
          parseFloat(findValueByKeys(data, ["inclination", "inc", "incl"])) ||
            0,
          parseFloat(findValueByKeys(data, ["azimuth", "az", "azi"])) || 0,
        ),
      };

      // Only add the survey if it has valid bit depth and inclination/azimuth values
      if (survey.bitDepth > 0 || survey.inclination > 0 || survey.azimuth > 0) {
        surveys.push(survey);
      } else {
        console.log(`CSV: Skipping row ${i}, invalid survey data`);
      }
    } catch (error) {
      console.error(`CSV: Error processing row ${i}:`, error);
    }
  }

  console.log(`CSV: Successfully parsed ${surveys.length} surveys`);
  return surveys;
};

/**
 * Parses TXT content into survey data
 */
export const parseTXTSurveys = (
  content: string,
  wellInfo: { wellName: string; rigName: string; sensorOffset: number },
  filePath?: string,
): SurveyData[] => {
  console.log("Starting TXT parsing");
  // Parse TXT content into survey data (assuming space or tab delimited)
  const lines = content.split("\n").filter((line) => line.trim().length > 0);
  console.log(`TXT: Found ${lines.length} lines in the file`);

  if (lines.length <= 1) {
    console.warn("TXT: File contains no data rows");
    return [];
  }

  const surveys: SurveyData[] = [];

  // Try to detect if this is a survey report format (like the one from Altitude Energy Partners)
  const isReportFormat = lines.some(isSurveyHeaderLine);

  // Try to detect format based on first few lines
  const isTabDelimited = lines.some((line) => line.includes("\t"));
  const delimiter = isTabDelimited ? "\t" : /\s+/;
  console.log(`TXT: Using ${isTabDelimited ? "tab" : "space"} delimiter`);

  // Find header line (if exists)
  let headerLine = 0;
  for (let i = 0; i < Math.min(30, lines.length); i++) {
    if (isSurveyHeaderLine(lines[i])) {
      headerLine = i;
      console.log(`TXT: Found header at line ${i}: ${lines[i]}`);
      break;
    }
  }

  // If we're in report format and didn't find a header, look for a line with "Survey" and numbers
  if (isReportFormat && headerLine === 0) {
    for (let i = 0; i < Math.min(30, lines.length); i++) {
      if (lines[i].includes("Survey") && /\d+/.test(lines[i])) {
        headerLine = i - 1; // Assume header is the line before
        if (headerLine < 0) headerLine = 0;
        console.log(`TXT: Report format - using line ${headerLine} as header`);
        break;
      }
    }
  }

  // Parse headers
  let headers: string[] = [];
  let originalHeaders: string[] = [];
  try {
    originalHeaders = lines[headerLine]
      .split(delimiter)
      .map((h) => h.trim())
      .filter((h) => h.length > 0);
    headers = originalHeaders.map((h) => h.toLowerCase());
    console.log(`TXT: Found ${headers.length} columns: ${headers.join(", ")}`);

    // Store the detected headers for later use
    setLastDetectedHeaders({
      headers,
      originalHeaders,
      fileType: "txt",
      filePath,
    });
  } catch (error) {
    console.error("TXT: Error parsing headers:", error);
    return [];
  }

  // If headers are empty or invalid, try to create default headers
  if (headers.length < 3) {
    console.warn("TXT: Invalid headers, using default column names");
    headers = [
      "survey",
      "measured",
      "inclination",
      "azimuth",
      "course",
      "tvd",
      "ns",
      "ew",
    ];
    originalHeaders = [
      "Survey",
      "Measured",
      "Inclination",
      "Azimuth",
      "Course",
      "TVD",
      "NS",
      "EW",
    ];

    // Store the default headers
    setLastDetectedHeaders({
      headers,
      originalHeaders,
      fileType: "txt",
      filePath,
    });
  }

  for (let i = headerLine + 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line || line.includes("====")) continue; // Skip separator lines

    const values = line
      .split(delimiter)
      .map((v) => v.trim())
      .filter((v) => v.length > 0);

    if (values.length < 3) {
      console.log(
        `TXT: Skipping row ${i}, insufficient values: ${values.length}`,
      );
      continue; // Need at least a few values
    }

    try {
      const data: Record<string, any> = {};

      // Map values to headers
      headers.forEach((header, index) => {
        if (index < values.length) {
          data[header] = values[index];
        }
      });

      // If no headers matched, try to use positional mapping for common formats
      if (Object.keys(data).length === 0 && values.length >= 3) {
        // Assume first column is depth, second is inc, third is azimuth
        data["depth"] = values[0];
        data["inclination"] = values[1];
        data["azimuth"] = values[2];
        if (values.length > 3) data["toolface"] = values[3];
      }

      // Create survey with required fields
      const survey: SurveyData = {
        id: Date.now().toString() + "-" + i,
        timestamp: new Date().toISOString(),
        bitDepth:
          parseFloat(
            findValueByKeys(data, [
              "depth",
              "bitdepth",
              "md",
              "measured depth",
              "measured",
              "sd",
              "survey",
            ]),
          ) || 0,
        measuredDepth:
          parseFloat(
            findValueByKeys(data, [
              "measureddepth",
              "measured depth",
              "measured",
              "md",
              "sd",
              "depth",
            ]),
          ) || 0,
        sensorOffset:
          parseFloat(
            findValueByKeys(data, ["sensoroffset", "sensor offset", "offset"]),
          ) || wellInfo.sensorOffset,
        inclination:
          parseFloat(findValueByKeys(data, ["inclination", "inc", "incl"])) ||
          0,
        azimuth:
          parseFloat(findValueByKeys(data, ["azimuth", "az", "azi"])) || 0,
        toolFace:
          parseFloat(findValueByKeys(data, ["toolface", "tf", "tool face"])) ||
          0,
        bTotal:
          parseFloat(
            findValueByKeys(data, [
              "btotal",
              "magneticfield",
              "magnetic field",
              "b total",
              "b",
            ]),
          ) || 0,
        aTotal:
          parseFloat(
            findValueByKeys(data, ["atotal", "gravity", "a total", "a"]),
          ) || 0,
        dip: parseFloat(findValueByKeys(data, ["dip"])) || 0,
        toolTemp:
          parseFloat(
            findValueByKeys(data, [
              "tooltemp",
              "temperature",
              "temp",
              "tool temp",
            ]),
          ) || 0,
        wellName: findValueByKeys(
          data,
          ["wellname", "well name", "well"],
          wellInfo.wellName,
        ),
        rigName: findValueByKeys(
          data,
          ["rigname", "rig name", "rig"],
          wellInfo.rigName,
        ),
        qualityCheck: determineQualityCheck(
          parseFloat(findValueByKeys(data, ["inclination", "inc", "incl"])) ||
            0,
          parseFloat(findValueByKeys(data, ["azimuth", "az", "azi"])) || 0,
        ),
      };

      // Only add the survey if it has valid bit depth and inclination/azimuth values
      if (survey.bitDepth > 0 || survey.inclination > 0 || survey.azimuth > 0) {
        surveys.push(survey);
      } else {
        console.log(`TXT: Skipping row ${i}, invalid survey data`);
      }
    } catch (error) {
      console.error(`TXT: Error processing row ${i}:`, error);
    }
  }

  console.log(`TXT: Successfully parsed ${surveys.length} surveys`);
  return surveys;
};

/**
 * Parses LAS content into survey data
 */
export const parseLASSurveys = (
  content: string,
  wellInfo: { wellName: string; rigName: string; sensorOffset: number },
  filePath?: string,
): SurveyData[] => {
  console.log("Starting LAS parsing");
  // Parse LAS file content into survey data
  const lines = content.split("\n");
  const surveys: SurveyData[] = [];

  // Check if this is a valid LAS file
  if (
    !lines.some(
      (line) =>
        line.trim().startsWith("~V") || line.trim().startsWith("~VERSION"),
    )
  ) {
    console.warn("LAS: File does not appear to be a valid LAS file");
    // Try to detect if this might be a different format with headers in the same row as keywords
    const isReportFormat = lines.some(isSurveyHeaderLine);

    if (isReportFormat) {
      console.log("LAS: Detected survey report format instead of standard LAS");
      // This might be a CSV or TXT file mislabeled as LAS
      // Try to parse it using the CSV parser as a fallback
      return parseCSVSurveys(content, wellInfo, filePath);
    }
  }

  // Find the data section (starts with ~A)
  const dataStartIndex = lines.findIndex((line) =>
    line.trim().startsWith("~A"),
  );
  if (dataStartIndex === -1) {
    console.warn("LAS: No data section (~A) found in file");
    // Try to find any section that might contain data
    const potentialDataIndex = lines.findIndex((line) => {
      const trimmed = line.trim();
      return (
        trimmed.length > 0 &&
        !trimmed.startsWith("~") &&
        !trimmed.startsWith("#") &&
        /\d/.test(trimmed)
      ); // Contains at least one digit
    });

    if (potentialDataIndex === -1) return [];
    console.log(
      `LAS: Using line ${potentialDataIndex} as potential start of data section`,
    );
  }

  // Find curve information section (starts with ~C)
  const curveStartIndex = lines.findIndex((line) =>
    line.trim().startsWith("~C"),
  );

  // If no curve section is found, try to find a header row
  let headerRowIndex = -1;
  if (curveStartIndex === -1) {
    console.log("LAS: No curve section (~C) found, looking for header row");
    // Look for a line that might be a header row (contains keywords like depth, inc, az)
    for (let i = 0; i < Math.min(30, lines.length); i++) {
      if (isSurveyHeaderLine(lines[i])) {
        headerRowIndex = i;
        console.log(
          `LAS: Found potential header row at line ${i}: ${lines[i]}`,
        );
        break;
      }
    }
  }

  const curveEndIndex =
    curveStartIndex !== -1
      ? lines
          .slice(curveStartIndex + 1)
          .findIndex((line) => line.trim().startsWith("~")) +
        curveStartIndex +
        1
      : -1;

  // Parse curve names
  const curveNames: string[] = [];
  const originalCurveNames: string[] = [];

  if (curveStartIndex !== -1 && curveEndIndex !== -1) {
    // Standard LAS format with curve section
    for (let i = curveStartIndex + 1; i < curveEndIndex; i++) {
      const line = lines[i].trim();
      if (line && !line.startsWith("#")) {
        const parts = line.split(".").map((p) => p.trim());
        if (parts.length > 0) {
          const originalName = parts[0].split(/\s+/)[0];
          const name = originalName.toLowerCase();
          curveNames.push(name);
          originalCurveNames.push(originalName);
        }
      }
    }
  } else if (headerRowIndex !== -1) {
    // Non-standard format with header row
    // Try to parse headers from the identified header row
    // First check if it's tab or space delimited
    const headerLine = lines[headerRowIndex];
    const isTabDelimited = headerLine.includes("\t");
    const delimiter = isTabDelimited ? "\t" : /\s+/;

    const headers = headerLine
      .split(delimiter)
      .map((h) => h.trim())
      .filter((h) => h.length > 0);

    console.log(
      `LAS: Extracted ${headers.length} headers from line ${headerRowIndex}`,
    );

    headers.forEach((header) => {
      originalCurveNames.push(header);
      curveNames.push(header.toLowerCase());
    });
  }

  // Store the detected headers for later use
  if (curveNames.length > 0) {
    console.log(
      `LAS: Using ${curveNames.length} curve names: ${curveNames.join(", ")}`,
    );
    setLastDetectedHeaders({
      headers: curveNames,
      originalHeaders: originalCurveNames,
      fileType: "las",
      filePath,
    });
  } else {
    console.warn("LAS: No curve names or headers found");
  }

  // Determine where to start parsing data
  const effectiveDataStartIndex =
    dataStartIndex !== -1
      ? dataStartIndex + 1
      : headerRowIndex !== -1
        ? headerRowIndex + 1
        : 0;

  // Parse data lines
  for (let i = effectiveDataStartIndex; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line || line.startsWith("#") || line.startsWith("~")) continue;

    const values = line.split(/\s+/).filter((v) => v.trim());
    if (values.length < 3) continue; // Need at least depth, inc, az

    // Map values to curve names or use default mapping
    let depth = 0,
      inc = 0,
      az = 0,
      tf = 0,
      bTotal = 0,
      aTotal = 0,
      dip = 0,
      toolTemp = 0;

    if (curveNames.length > 0 && curveNames.length === values.length) {
      // Use curve names to map values
      const depthIndex = curveNames.findIndex(
        (n) =>
          n.includes("dept") ||
          n.includes("md") ||
          n === "depth" ||
          n.includes("survey"),
      );
      depth = depthIndex !== -1 ? parseFloat(values[depthIndex] || "0") : 0;

      const incIndex = curveNames.findIndex(
        (n) =>
          n.includes("inc") ||
          n === "incl" ||
          n === "inclination" ||
          n.includes("angle"),
      );
      inc = incIndex !== -1 ? parseFloat(values[incIndex] || "0") : 0;

      const azIndex = curveNames.findIndex(
        (n) =>
          n.includes("az") ||
          n === "azim" ||
          n === "azimuth" ||
          n.includes("heading"),
      );
      az = azIndex !== -1 ? parseFloat(values[azIndex] || "0") : 0;

      const tfIndex = curveNames.findIndex(
        (n) =>
          n.includes("tf") ||
          n === "toolface" ||
          n === "tool_face" ||
          n.includes("face"),
      );
      tf = tfIndex !== -1 ? parseFloat(values[tfIndex] || "0") : 0;

      // Try to find other parameters if available
      const bTotalIndex = curveNames.findIndex(
        (n) =>
          n.includes("btotal") ||
          n.includes("b_total") ||
          n.includes("magnetic") ||
          n === "b",
      );
      bTotal = bTotalIndex !== -1 ? parseFloat(values[bTotalIndex] || "0") : 0;

      const aTotalIndex = curveNames.findIndex(
        (n) =>
          n.includes("atotal") ||
          n.includes("a_total") ||
          n.includes("gravity") ||
          n === "a",
      );
      aTotal = aTotalIndex !== -1 ? parseFloat(values[aTotalIndex] || "0") : 0;

      const dipIndex = curveNames.findIndex((n) => n.includes("dip"));
      dip = dipIndex !== -1 ? parseFloat(values[dipIndex] || "0") : 0;

      const tempIndex = curveNames.findIndex(
        (n) => n.includes("temp") || n.includes("temperature"),
      );
      toolTemp = tempIndex !== -1 ? parseFloat(values[tempIndex] || "0") : 0;
    } else {
      // Assume standard order: depth, inc, az, (optional: tf)
      depth = parseFloat(values[0] || "0");
      inc = parseFloat(values[1] || "0");
      az = parseFloat(values[2] || "0");
      tf = values.length > 3 ? parseFloat(values[3] || "0") : 0;
      // If more values are available, try to use them
      bTotal = values.length > 4 ? parseFloat(values[4] || "0") : 0;
      aTotal = values.length > 5 ? parseFloat(values[5] || "0") : 0;
      dip = values.length > 6 ? parseFloat(values[6] || "0") : 0;
      toolTemp = values.length > 7 ? parseFloat(values[7] || "0") : 0;
    }

    const survey: SurveyData = {
      id: Date.now().toString() + "-" + i,
      timestamp: new Date().toISOString(),
      bitDepth: depth,
      measuredDepth: depth - wellInfo.sensorOffset,
      sensorOffset: wellInfo.sensorOffset,
      inclination: inc,
      azimuth: az,
      toolFace: tf,
      bTotal: bTotal,
      aTotal: aTotal,
      dip: dip,
      toolTemp: toolTemp,
      wellName: wellInfo.wellName,
      rigName: wellInfo.rigName,
      qualityCheck: determineQualityCheck(inc, az),
    };

    // Only add valid surveys
    if (depth > 0 || inc > 0 || az > 0) {
      surveys.push(survey);
    }
  }

  console.log(`LAS: Successfully parsed ${surveys.length} surveys`);
  return surveys;
};

/**
 * Parses Excel files (XLS/XLSX) into survey data
 */
export const parseXLSXSurveys = (
  file: File,
  wellInfo: { wellName: string; rigName: string; sensorOffset: number },
  filePath?: string,
): Promise<SurveyData[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        console.log("Starting Excel file parsing");
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });

        // Get the first sheet
        const firstSheetName = workbook.SheetNames[0];
        console.log(`Excel: Found sheet: ${firstSheetName}`);
        const worksheet = workbook.Sheets[firstSheetName];

        // Try different parsing options to handle various Excel formats
        let jsonData;
        try {
          // First try with header: 1 (array of arrays)
          jsonData = XLSX.utils.sheet_to_json(worksheet, {
            header: 1,
            defval: "", // Use empty string for empty cells
            blankrows: false, // Skip blank rows
          }) as any[];
          console.log(
            `Excel: Parsed ${jsonData.length} rows with array format`,
          );

          // If we got no data or just one row, try with header: true (array of objects)
          if (jsonData.length <= 1) {
            const objectData = XLSX.utils.sheet_to_json(worksheet, {
              defval: "",
              blankrows: false,
            }) as any[];
            console.log(
              `Excel: Parsed ${objectData.length} rows with object format`,
            );

            if (objectData.length > 0) {
              // Convert object format to array format for consistent processing
              const headers = Object.keys(objectData[0]);
              jsonData = [headers];
              objectData.forEach((row) => {
                const rowArray = headers.map((h) => row[h] || "");
                jsonData.push(rowArray);
              });
              console.log(
                `Excel: Converted object data to array format with ${jsonData.length} rows`,
              );
            }
          }
        } catch (parseError) {
          console.error(
            "Error in initial parsing, trying alternative method:",
            parseError,
          );
          // Try with raw cell references as a fallback
          const range = XLSX.utils.decode_range(worksheet["!ref"] || "A1:Z100");
          jsonData = [];
          const headers = [];

          // Extract headers from first row
          for (let c = range.s.c; c <= range.e.c; c++) {
            const cellAddress = XLSX.utils.encode_cell({ r: range.s.r, c });
            const cell = worksheet[cellAddress];
            headers.push(cell ? (cell.v || "").toString().toLowerCase() : "");
          }
          jsonData.push(headers);

          // Extract data rows
          for (let r = range.s.r + 1; r <= range.e.r; r++) {
            const row = [];
            for (let c = range.s.c; c <= range.e.c; c++) {
              const cellAddress = XLSX.utils.encode_cell({ r, c });
              const cell = worksheet[cellAddress];
              row.push(cell ? cell.v : "");
            }
            if (row.some((cell) => cell !== "")) {
              // Skip completely empty rows
              jsonData.push(row);
            }
          }
          console.log(
            `Excel: Parsed ${jsonData.length} rows using cell reference method`,
          );
        }

        if (!jsonData || jsonData.length < 2) {
          console.error("Excel file does not contain enough data", jsonData);
          reject(
            new Error(
              "Excel file does not contain enough data or has an unsupported format",
            ),
          );
          return;
        }

        // Check if this is a report format with headers in the same row as keywords
        let headerRowIndex = 0;
        let isReportFormat = false;

        // Look for a row that contains survey-related keywords
        for (let i = 0; i < Math.min(30, jsonData.length); i++) {
          const row = jsonData[i];
          if (!row || row.length === 0) continue;

          // Convert row to string for easier checking
          const rowStr = row.join(" ").toLowerCase();

          // Check if this row contains survey-related keywords
          if (
            // Use a similar check as isSurveyHeaderLine but adapted for joined array
            (rowStr.includes("depth") ||
              rowStr.includes("md") ||
              rowStr.includes("sd") ||
              rowStr.includes("survey") ||
              rowStr.includes("measured")) &&
            (rowStr.includes("inclination") ||
              rowStr.includes("inc") ||
              rowStr.includes("incl") ||
              rowStr.includes("angle") ||
              rowStr.includes(" i ")) &&
            (rowStr.includes("azimuth") ||
              rowStr.includes("az") ||
              rowStr.includes("azi") ||
              rowStr.includes(" a ") ||
              rowStr.includes("heading"))
          ) {
            console.log(
              `Excel: Found potential header row at line ${i}: ${rowStr}`,
            );
            headerRowIndex = i;
            isReportFormat = true;
            break;
          }
        }

        // If we found a report format, use that row as the header
        if (isReportFormat) {
          console.log(
            `Excel: Using row ${headerRowIndex} as header row for report format`,
          );
          // If the header row is not the first row, we need to adjust the data
          if (headerRowIndex > 0) {
            // Extract the header row and all rows after it
            jsonData = jsonData.slice(headerRowIndex);
            console.log(
              `Excel: Adjusted data to start from header row, now have ${jsonData.length} rows`,
            );
          }
        }

        // Get headers (first row)
        const originalHeaders = jsonData[0].map((h: any) =>
          typeof h === "string" ? h.trim() : String(h),
        );
        const normalizedHeaders = originalHeaders.map((h: string) =>
          typeof h === "string" ? h.toLowerCase() : String(h).toLowerCase(),
        );
        console.log(
          `Excel: Found ${normalizedHeaders.length} columns: ${normalizedHeaders.join(", ")}`,
        );

        // Store the detected headers for later use
        setLastDetectedHeaders({
          headers: normalizedHeaders,
          originalHeaders: originalHeaders,
          fileType: "xlsx",
          filePath,
        });

        const surveys: SurveyData[] = [];

        // Process each row (skip header row)
        for (let i = 1; i < jsonData.length; i++) {
          const row = jsonData[i];
          if (!row || row.length === 0) {
            console.log(`Excel: Skipping empty row ${i}`);
            continue;
          }

          // Check if row has any non-empty values
          const hasData = row.some(
            (cell: any) => cell !== null && cell !== undefined && cell !== "",
          );

          if (!hasData) {
            console.log(`Excel: Skipping row ${i} with no data`);
            continue;
          }

          // Create data object with header keys
          const data: Record<string, any> = {};
          normalizedHeaders.forEach((header: string, index: number) => {
            if (index < row.length) {
              data[header] = row[index];
            }
          });

          console.log(`Excel: Processing row ${i} with data:`, data);

          try {
            // Create survey with required fields, using defaults for missing values
            const survey: SurveyData = {
              id: Date.now().toString() + "-" + i,
              timestamp: findValueByKeys(
                data,
                ["timestamp", "date", "time", "survey date", "survey time"],
                new Date().toISOString(),
              ),
              bitDepth:
                parseFloat(
                  findValueByKeys(data, [
                    "bitdepth",
                    "bit depth",
                    "depth",
                    "bit_depth",
                    "survey",
                    "survey depth",
                    "survey_depth",
                    "hole depth",
                    "sd", // Added for compatibility
                  ]),
                ) || 0,
              measuredDepth:
                parseFloat(
                  findValueByKeys(data, [
                    "measureddepth",
                    "measured depth",
                    "md",
                    "measured_depth",
                    "sd",
                    "survey depth",
                    "bitdepth",
                    "depth",
                  ]),
                ) || 0,
              sensorOffset:
                parseFloat(
                  findValueByKeys(data, [
                    "sensoroffset",
                    "sensor offset",
                    "sensor_offset",
                    "offset",
                  ]),
                ) || wellInfo.sensorOffset,
              inclination:
                parseFloat(
                  findValueByKeys(data, [
                    "inclination",
                    "inc",
                    "incl",
                    "inc_angle",
                    "angle",
                    "inc angle",
                    "inc. angle",
                    "incl angle",
                    "incl. angle",
                    "i", // Added for compatibility
                  ]),
                ) || 0,
              azimuth:
                parseFloat(
                  findValueByKeys(data, [
                    "azimuth",
                    "az",
                    "azi",
                    "azm",
                    "heading",
                    "az angle",
                    "azi angle",
                    "az. angle",
                    "azi. angle",
                    "a", // Added for compatibility
                  ]),
                ) || 0,
              toolFace:
                parseFloat(
                  findValueByKeys(data, [
                    "toolface",
                    "tf",
                    "tool face",
                    "tool_face",
                    "gtf",
                    "mtf",
                  ]),
                ) || 0,
              bTotal:
                parseFloat(
                  findValueByKeys(data, [
                    "btotal",
                    "b_total",
                    "magneticfield",
                    "magnetic field",
                    "magnetic_field",
                    "b total",
                    "mag_field",
                    "total field",
                    "total magnetic field",
                    "b", // Added for compatibility
                  ]),
                ) || 0,
              aTotal:
                parseFloat(
                  findValueByKeys(data, [
                    "atotal",
                    "a_total",
                    "gravity",
                    "a total",
                    "g_total",
                    "total gravity",
                    "grav total",
                    "g", // Added for compatibility
                  ]),
                ) || 0,
              dip:
                parseFloat(
                  findValueByKeys(data, [
                    "dip",
                    "dip_angle",
                    "dip angle",
                    "magnetic dip",
                  ]),
                ) || 0,
              toolTemp:
                parseFloat(
                  findValueByKeys(data, [
                    "tooltemp",
                    "temperature",
                    "temp",
                    "tool temp",
                    "tool_temp",
                    "sensor temp",
                  ]),
                ) || 0,
              wellName: findValueByKeys(
                data,
                ["wellname", "well name", "well_name", "well", "well id"],
                wellInfo.wellName,
              ),
              rigName: findValueByKeys(
                data,
                ["rigname", "rig name", "rig_name", "rig", "rig id"],
                wellInfo.rigName,
              ),
              qualityCheck: determineQualityCheck(
                parseFloat(
                  findValueByKeys(data, [
                    "inclination",
                    "inc",
                    "incl",
                    "inc_angle",
                    "angle",
                    "inc angle",
                    "i", // Added for compatibility
                  ]),
                ) || 0,
                parseFloat(
                  findValueByKeys(data, [
                    "azimuth",
                    "az",
                    "azi",
                    "azm",
                    "heading",
                    "az angle",
                    "a", // Added for compatibility
                  ]),
                ) || 0,
              ),
            };

            // Only add the survey if it has valid bit depth or inclination/azimuth values
            if (
              survey.bitDepth > 0 ||
              survey.inclination > 0 ||
              survey.azimuth > 0
            ) {
              console.log(
                `Excel: Adding valid survey at depth ${survey.bitDepth}`,
              );
              surveys.push(survey);
            } else {
              console.log(
                `Excel: Skipping row ${i}, invalid survey data (all zeros)`,
              );
            }
          } catch (rowError) {
            console.error(`Excel: Error processing row ${i}:`, rowError);
            // Continue processing other rows even if one fails
          }
        }

        console.log(`Excel: Successfully parsed ${surveys.length} surveys`);
        if (surveys.length === 0) {
          // If we couldn't parse any surveys, try one more approach - look for numeric columns
          console.log(
            "Excel: No surveys found, trying numeric column detection",
          );
          const numericSurveys = extractSurveysFromNumericColumns(
            jsonData,
            wellInfo,
          );
          if (numericSurveys.length > 0) {
            console.log(
              `Excel: Found ${numericSurveys.length} surveys using numeric detection`,
            );
            resolve(numericSurveys);
            return;
          }
          reject(
            new Error(
              "Could not extract any valid survey data from the Excel file",
            ),
          );
          return;
        }

        resolve(surveys);
      } catch (error) {
        console.error("Error parsing Excel file:", error);
        reject(error);
      }
    };

    reader.onerror = (error) => {
      console.error("Error reading Excel file:", error);
      reject(error);
    };

    reader.readAsArrayBuffer(file);
  });
};

/**
 * Helper function to extract surveys from numeric columns when headers are unclear
 */
const extractSurveysFromNumericColumns = (
  jsonData: any[],
  wellInfo: { wellName: string; rigName: string; sensorOffset: number },
): SurveyData[] => {
  const surveys: SurveyData[] = [];

  // Skip the first row (assumed to be headers)
  for (let i = 1; i < jsonData.length; i++) {
    const row = jsonData[i];
    if (!row || row.length < 3) continue;

    // Look for numeric columns that might be depth, inc, and azimuth
    const numericColumns: number[] = [];
    row.forEach((value: any, index: number) => {
      if (
        typeof value === "number" ||
        (typeof value === "string" && !isNaN(parseFloat(value)))
      ) {
        numericColumns.push(index);
      }
    });

    if (numericColumns.length >= 3) {
      // Assume first numeric column is depth, second is inc, third is azimuth
      const depthIndex = numericColumns[0];
      const incIndex = numericColumns[1];
      const azIndex = numericColumns[2];

      const depth = parseFloat(row[depthIndex]);
      const inc = parseFloat(row[incIndex]);
      const az = parseFloat(row[azIndex]);

      if (
        !isNaN(depth) &&
        !isNaN(inc) &&
        !isNaN(az) &&
        (depth > 0 || inc > 0 || az > 0)
      ) {
        const survey: SurveyData = {
          id: Date.now().toString() + "-" + i,
          timestamp: new Date().toISOString(),
          bitDepth: depth,
          measuredDepth: depth - wellInfo.sensorOffset,
          sensorOffset: wellInfo.sensorOffset,
          inclination: inc,
          azimuth: az,
          toolFace:
            numericColumns.length > 3
              ? parseFloat(row[numericColumns[3]]) || 0
              : 0,
          bTotal:
            numericColumns.length > 4
              ? parseFloat(row[numericColumns[4]]) || 0
              : 0,
          aTotal:
            numericColumns.length > 5
              ? parseFloat(row[numericColumns[5]]) || 0
              : 0,
          dip:
            numericColumns.length > 6
              ? parseFloat(row[numericColumns[6]]) || 0
              : 0,
          toolTemp:
            numericColumns.length > 7
              ? parseFloat(row[numericColumns[7]]) || 0
              : 0,
          wellName: wellInfo.wellName,
          rigName: wellInfo.rigName,
          qualityCheck: determineQualityCheck(inc, az),
        };

        surveys.push(survey);
      }
    }
  }

  return surveys;
};
