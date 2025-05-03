/**
 * Utility functions for importing survey data from various file formats
 */

// Define possible header mappings for common survey file formats
const headerMappings = {
  // Measured Depth variations
  md: ["md", "measured depth", "depth", "meas depth", "sd", "survey depth"],

  // Inclination variations
  inc: ["inc", "inclination", "incl", "angle", "dip", "inclinacion"],

  // Azimuth variations
  az: ["az", "azimuth", "azi", "azim", "azm", "bearing", "direction"],

  // TVD variations
  tvd: ["tvd", "true vertical depth", "vertical depth", "true depth"],

  // North/South variations
  ns: ["ns", "north", "north/south", "n/s", "northing", "y"],

  // East/West variations
  ew: ["ew", "east", "east/west", "e/w", "easting", "x"],

  // Gamma variations
  gamma: ["gamma", "gamma ray", "gr", "gam", "gamma radiation"],

  // Timestamp variations
  timestamp: [
    "timestamp",
    "time",
    "date",
    "datetime",
    "survey time",
    "survey date",
  ],
};

/**
 * Normalizes a header string for comparison
 * @param header - The header string to normalize
 * @returns Normalized header string
 */
const normalizeHeader = (header: string): string => {
  return header
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]/g, "");
};

/**
 * Maps a header to a standard field name
 * @param header - The header to map
 * @returns The standard field name or null if no match
 */
const mapHeaderToField = (header: string): string | null => {
  const normalizedHeader = normalizeHeader(header);

  for (const [field, variations] of Object.entries(headerMappings)) {
    if (variations.some((v) => normalizeHeader(v) === normalizedHeader)) {
      return field;
    }
  }

  return null;
};

/**
 * Parses CSV data into an array of survey objects
 * @param csvData - The CSV data as a string
 * @returns Array of survey objects
 */
export const parseSurveyCSV = (csvData: string) => {
  // Split into lines and filter out empty lines
  const lines = csvData.split("\n").filter((line) => line.trim().length > 0);

  if (lines.length < 2) {
    throw new Error(
      "CSV file must contain at least a header row and one data row",
    );
  }

  // Parse header row
  const headerRow = lines[0].split(",").map((header) => header.trim());

  // Map headers to standard field names
  const fieldMap = headerRow.map((header) => ({
    original: header,
    mapped: mapHeaderToField(header),
  }));

  // Check if we have at least the essential fields (md, inc, az)
  const hasMD = fieldMap.some((field) => field.mapped === "md");
  const hasInc = fieldMap.some((field) => field.mapped === "inc");
  const hasAz = fieldMap.some((field) => field.mapped === "az");

  if (!hasMD || !hasInc || !hasAz) {
    throw new Error(
      "CSV file must contain at least MD/Depth, Inclination, and Azimuth columns",
    );
  }

  // Parse data rows
  const surveys = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(",").map((value) => value.trim());

    // Skip rows with incorrect number of columns
    if (values.length !== headerRow.length) {
      console.warn(`Skipping row ${i + 1}: incorrect number of columns`);
      continue;
    }

    const survey: Record<string, any> = {};

    // Map values to fields
    for (let j = 0; j < fieldMap.length; j++) {
      const { mapped, original } = fieldMap[j];

      if (mapped) {
        // Convert numeric values
        if (["md", "inc", "az", "tvd", "ns", "ew", "gamma"].includes(mapped)) {
          survey[mapped] = parseFloat(values[j]) || 0;
        } else {
          survey[mapped] = values[j];
        }
      } else {
        // Store unmapped fields with original header
        survey[original] = values[j];
      }
    }

    // Convert to standard survey format
    const standardSurvey = {
      bitDepth: survey.md || 0,
      inclination: survey.inc || 0,
      azimuth: survey.az || 0,
      tvd: survey.tvd || null,
      northSouth: survey.ns || null,
      eastWest: survey.ew || null,
      gamma: survey.gamma || null,
      timestamp: survey.timestamp || new Date().toISOString(),
      // Include any other fields as custom data
      customData: Object.entries(survey)
        .filter(
          ([key]) =>
            ![
              "md",
              "inc",
              "az",
              "tvd",
              "ns",
              "ew",
              "gamma",
              "timestamp",
            ].includes(key),
        )
        .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {}),
    };

    surveys.push(standardSurvey);
  }

  return surveys;
};

/**
 * Parses Excel data into an array of survey objects
 * @param excelData - The Excel data as an array of arrays
 * @returns Array of survey objects
 */
export const parseSurveyExcel = (excelData: any[][]) => {
  if (!excelData || excelData.length < 2) {
    throw new Error(
      "Excel file must contain at least a header row and one data row",
    );
  }

  // Parse header row
  const headerRow = excelData[0].map((header) =>
    header !== null && header !== undefined ? String(header).trim() : "",
  );

  // Map headers to standard field names
  const fieldMap = headerRow.map((header) => ({
    original: header,
    mapped: mapHeaderToField(header),
  }));

  // Check if we have at least the essential fields (md, inc, az)
  const hasMD = fieldMap.some((field) => field.mapped === "md");
  const hasInc = fieldMap.some((field) => field.mapped === "inc");
  const hasAz = fieldMap.some((field) => field.mapped === "az");

  if (!hasMD || !hasInc || !hasAz) {
    throw new Error(
      "Excel file must contain at least MD/Depth, Inclination, and Azimuth columns",
    );
  }

  // Parse data rows
  const surveys = [];

  for (let i = 1; i < excelData.length; i++) {
    const values = excelData[i];

    // Skip rows with incorrect number of columns
    if (values.length !== headerRow.length) {
      console.warn(`Skipping row ${i + 1}: incorrect number of columns`);
      continue;
    }

    const survey: Record<string, any> = {};

    // Map values to fields
    for (let j = 0; j < fieldMap.length; j++) {
      const { mapped, original } = fieldMap[j];
      const value = values[j];

      if (mapped) {
        // Convert numeric values
        if (["md", "inc", "az", "tvd", "ns", "ew", "gamma"].includes(mapped)) {
          survey[mapped] =
            typeof value === "number" ? value : parseFloat(String(value)) || 0;
        } else {
          survey[mapped] =
            value !== null && value !== undefined ? String(value) : "";
        }
      } else if (original) {
        // Store unmapped fields with original header
        survey[original] = value;
      }
    }

    // Convert to standard survey format
    const standardSurvey = {
      bitDepth: survey.md || 0,
      inclination: survey.inc || 0,
      azimuth: survey.az || 0,
      tvd: survey.tvd || null,
      northSouth: survey.ns || null,
      eastWest: survey.ew || null,
      gamma: survey.gamma || null,
      timestamp: survey.timestamp || new Date().toISOString(),
      // Include any other fields as custom data
      customData: Object.entries(survey)
        .filter(
          ([key]) =>
            ![
              "md",
              "inc",
              "az",
              "tvd",
              "ns",
              "ew",
              "gamma",
              "timestamp",
            ].includes(key),
        )
        .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {}),
    };

    surveys.push(standardSurvey);
  }

  return surveys;
};

/**
 * Detects the header row in a CSV or Excel file
 * @param data - Array of rows from the file
 * @returns Index of the header row or 0 if not found
 */
export const detectHeaderRow = (data: string[][]) => {
  // Look for a row that has the most matches with our header mappings
  let bestRowIndex = 0;
  let bestMatchCount = 0;

  for (let i = 0; i < Math.min(10, data.length); i++) {
    // Check first 10 rows at most
    const row = data[i];
    let matchCount = 0;

    for (const cell of row) {
      if (mapHeaderToField(cell) !== null) {
        matchCount++;
      }
    }

    if (matchCount > bestMatchCount) {
      bestMatchCount = matchCount;
      bestRowIndex = i;
    }
  }

  return bestRowIndex;
};

/**
 * Parses a text file with delimited data (CSV, TSV, etc.)
 * @param fileContent - The file content as a string
 * @returns Array of survey objects
 */
export const parseDelimitedFile = (fileContent: string) => {
  // Try to detect the delimiter
  const firstLine = fileContent.split("\n")[0];
  let delimiter = ",";

  if (firstLine.includes("\t")) {
    delimiter = "\t";
  } else if (firstLine.includes(";")) {
    delimiter = ";";
  } else if (firstLine.includes("|")) {
    delimiter = "|";
  }

  // Split into lines and parse each line
  const lines = fileContent
    .split("\n")
    .filter((line) => line.trim().length > 0)
    .map((line) => line.split(delimiter).map((cell) => cell.trim()));

  // Detect header row
  const headerRowIndex = detectHeaderRow(lines);

  // Extract header and data rows
  const headerRow = lines[headerRowIndex];
  const dataRows = lines.slice(headerRowIndex + 1);

  // Map headers to standard field names
  const fieldMap = headerRow.map((header) => ({
    original: header,
    mapped: mapHeaderToField(header),
  }));

  // Check if we have at least the essential fields (md, inc, az)
  const hasMD = fieldMap.some((field) => field.mapped === "md");
  const hasInc = fieldMap.some((field) => field.mapped === "inc");
  const hasAz = fieldMap.some((field) => field.mapped === "az");

  if (!hasMD || !hasInc || !hasAz) {
    throw new Error(
      "File must contain at least MD/Depth, Inclination, and Azimuth columns",
    );
  }

  // Parse data rows
  const surveys = [];

  for (const values of dataRows) {
    // Skip rows with incorrect number of columns
    if (values.length !== headerRow.length) {
      continue;
    }

    const survey: Record<string, any> = {};

    // Map values to fields
    for (let j = 0; j < fieldMap.length; j++) {
      const { mapped, original } = fieldMap[j];

      if (mapped) {
        // Convert numeric values
        if (["md", "inc", "az", "tvd", "ns", "ew", "gamma"].includes(mapped)) {
          survey[mapped] = parseFloat(values[j]) || 0;
        } else {
          survey[mapped] = values[j];
        }
      } else {
        // Store unmapped fields with original header
        survey[original] = values[j];
      }
    }

    // Convert to standard survey format
    const standardSurvey = {
      bitDepth: survey.md || 0,
      inclination: survey.inc || 0,
      azimuth: survey.az || 0,
      tvd: survey.tvd || null,
      northSouth: survey.ns || null,
      eastWest: survey.ew || null,
      gamma: survey.gamma || null,
      timestamp: survey.timestamp || new Date().toISOString(),
      // Include any other fields as custom data
      customData: Object.entries(survey)
        .filter(
          ([key]) =>
            ![
              "md",
              "inc",
              "az",
              "tvd",
              "ns",
              "ew",
              "gamma",
              "timestamp",
            ].includes(key),
        )
        .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {}),
    };

    surveys.push(standardSurvey);
  }

  return surveys;
};
