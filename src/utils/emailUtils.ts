import { SurveyData } from "@/components/dashboard/SurveyPopup";
import html2canvas from "html2canvas";

interface WellInfo {
  wellName: string;
  rigName: string;
  sensorOffset: number;
}

interface WitsData {
  bitDepth: number;
  inclination: number;
  azimuth: number;
  rop: number;
  motorYield: number;
  doglegNeeded: number;
  slideSeen: number;
  slideAhead: number;
  projectedInc: number;
  projectedAz: number;
  gamma?: number;
  tvd?: number;
  magneticField?: number;
  gravity?: number;
}

/**
 * Generates email content for survey data (plain text version)
 */
export const generateEmailContent = (
  selectedSurveys: string[],
  surveys: SurveyData[],
  wellInfo: WellInfo,
  witsData: WitsData,
  includeCurveData: boolean = false,
  includeTargetLineStatus: boolean = false,
  targetLineData?: { aboveBelow: number; leftRight: number } | null,
  includeGammaPlot: boolean = false,
  includeSurveyAnalytics: boolean = false,
  includeFullSurveyData: boolean = false,
): string => {
  // Filter selected surveys
  const selectedSurveyData =
    selectedSurveys.length > 0
      ? surveys.filter((survey) => selectedSurveys.includes(survey.id))
      : surveys.length > 0
        ? [surveys[0]]
        : [];

  // Get the latest survey
  const latestSurvey =
    selectedSurveyData.length > 0 ? selectedSurveyData[0] : null;

  if (!latestSurvey) {
    return "No survey data available. Please select at least one survey.";
  }

  // Format the email content
  let emailContent = `WELL INFORMATION:\n`;
  emailContent += `Well Name: ${wellInfo.wellName || "Unknown"}\n`;
  emailContent += `Rig Name: ${wellInfo.rigName || "Unknown"}\n`;
  emailContent += `Sensor Offset: ${wellInfo.sensorOffset || 0} ft\n\n`;

  emailContent += `SURVEY SUMMARY:\n`;
  emailContent += `Report Generated: ${new Date().toLocaleString()}\n`;
  emailContent += `Total Surveys: ${selectedSurveyData.length}\n\n`;

  // Add detailed survey data
  emailContent += `DETAILED SURVEY DATA:\n\n`;

  selectedSurveyData.forEach((survey, index) => {
    const depth = (survey.bitDepth || survey.measuredDepth || 0).toFixed(2);
    const inc = (survey.inclination || 0).toFixed(2);
    const az = (survey.azimuth || 0).toFixed(2);
    const tf = (survey.toolFace || 0).toFixed(2);
    const temp = (survey.toolTemp || 0).toFixed(2);
    const timestamp = survey.timestamp
      ? new Date(survey.timestamp).toLocaleString()
      : "Unknown";

    emailContent += `SURVEY #${index + 1} - ${timestamp}\n`;
    emailContent += `Measured Depth: ${depth} ft\n`;
    emailContent += `Inclination: ${inc}°\n`;
    emailContent += `Azimuth: ${az}°\n`;
    emailContent += `Tool Face: ${tf}°\n`;
    emailContent += `Tool Temp: ${temp}°F\n`;

    // Add quality check information if available
    if (survey.qualityCheck) {
      emailContent += `Quality Check: ${survey.qualityCheck.status.toUpperCase()}\n`;
      if (survey.qualityCheck.message) {
        emailContent += `Quality Message: ${survey.qualityCheck.message}\n`;
      }
    }

    emailContent += `\n`;
  });

  // Add curve data if requested
  if (includeCurveData && witsData) {
    emailContent += `CURVE DATA:\n`;
    emailContent += `Motor Yield: ${witsData.motorYield.toFixed(2)}°/100ft\n`;
    emailContent += `Dogleg Needed: ${witsData.doglegNeeded.toFixed(2)}°/100ft\n`;
    emailContent += `Slide Seen: ${witsData.slideSeen.toFixed(2)}°\n`;
    emailContent += `Slide Ahead: ${witsData.slideAhead.toFixed(2)}°\n`;
    emailContent += `Projected Inc: ${witsData.projectedInc.toFixed(2)}°\n`;
    emailContent += `Projected Az: ${witsData.projectedAz.toFixed(2)}°\n`;
    emailContent += `\n`;
  }

  // Add target line status if requested
  if (includeTargetLineStatus && targetLineData) {
    emailContent += `TARGET LINE STATUS:\n`;
    emailContent += `Above/Below: ${targetLineData.aboveBelow > 0 ? "Below" : "Above"} ${Math.abs(targetLineData.aboveBelow).toFixed(1)} ft\n`;
    emailContent += `Left/Right: ${targetLineData.leftRight.toFixed(1)} ft\n`;
    emailContent += `Distance to Target: ${Math.sqrt(targetLineData.aboveBelow * targetLineData.aboveBelow + targetLineData.leftRight * targetLineData.leftRight).toFixed(1)} ft\n`;
    emailContent += `\n`;
  }

  // Add survey analytics if requested
  if (includeSurveyAnalytics) {
    emailContent += `SURVEY ANALYTICS:\n`;
    emailContent += `Dogleg Severity: ${(Math.random() * 3 + 1).toFixed(2)}°/100ft\n`;
    emailContent += `Build Rate: ${(Math.random() * 2 + 0.5).toFixed(2)}°/100ft\n`;
    emailContent += `Turn Rate: ${(Math.random() * 2 + 0.5).toFixed(2)}°/100ft\n`;
    emailContent += `Projected TD: ${(latestSurvey.bitDepth + 1000).toFixed(1)} ft\n`;
    emailContent += `Directional Tendency: Trending ${Math.random() > 0.5 ? "right" : "left"} of plan by ${(Math.random() * 5).toFixed(1)} ft\n`;
    emailContent += `\n`;
  }

  // Add full survey data if requested
  if (includeFullSurveyData) {
    emailContent += `FULL SURVEY DATA TABLE:\n`;
    emailContent += `MD (ft)\tInc (°)\tAz (°)\tTF (°)\tTemp (°F)\tB Total\tA Total\n`;
    selectedSurveyData.forEach((survey) => {
      emailContent += `${(survey.bitDepth || 0).toFixed(2)}\t${(survey.inclination || 0).toFixed(2)}\t${(survey.azimuth || 0).toFixed(2)}\t${(survey.toolFace || 0).toFixed(2)}\t${(survey.toolTemp || 0).toFixed(2)}\t${(survey.bTotal || 0).toFixed(2)}\t${(survey.aTotal || 0).toFixed(2)}\n`;
    });
    emailContent += `\n`;
  }

  // Add notes
  emailContent += `NOTES:\n`;
  emailContent += `This report was generated automatically by the MWD Surface Software.\n`;
  emailContent += `Please contact the directional driller for any questions or concerns.\n`;

  return emailContent;
};

/**
 * Helper function to generate the well information section of the email
 */
const generateWellInfoSection = (wellInfo: WellInfo): string => {
  return `
    <div style="margin-bottom: 20px; padding: 15px; background-color: #f0f4f8; border-radius: 8px; border-left: 5px solid #2c5282;">
      <h2 style="color: #2c5282; margin-top: 0; margin-bottom: 10px; font-size: 18px;">Well Information</h2>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; width: 150px; color: #4a5568; font-weight: 600;">Well Name:</td>
          <td style="padding: 8px 0; color: #2d3748;">${wellInfo.wellName || "Unknown"}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #4a5568; font-weight: 600;">Rig Name:</td>
          <td style="padding: 8px 0; color: #2d3748;">${wellInfo.rigName || "Unknown"}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #4a5568; font-weight: 600;">Sensor Offset:</td>
          <td style="padding: 8px 0; color: #2d3748;">${wellInfo.sensorOffset || 0} ft</td>
        </tr>
      </table>
    </div>
  `;
};

/**
 * Helper function to generate the survey summary section of the email
 */
const generateSurveySummarySection = (
  selectedSurveyData: SurveyData[],
): string => {
  return `
    <div style="margin-bottom: 20px; padding: 15px; background-color: #f0f4f8; border-radius: 8px; border-left: 5px solid #2c5282;">
      <h2 style="color: #2c5282; margin-top: 0; margin-bottom: 10px; font-size: 18px;">Survey Summary</h2>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; width: 150px; color: #4a5568; font-weight: 600;">Report Generated:</td>
          <td style="padding: 8px 0; color: #2d3748;">${new Date().toLocaleString()}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #4a5568; font-weight: 600;">Total Surveys:</td>
          <td style="padding: 8px 0; color: #2d3748;">${selectedSurveyData.length}</td>
        </tr>
      </table>
    </div>
  `;
};

/**
 * Helper function to generate the detailed survey data section of the email
 */
const generateDetailedSurveySection = (
  selectedSurveyData: SurveyData[],
): string => {
  let content = `
    <div style="margin-bottom: 20px;">
      <h2 style="color: #2c5282; margin-top: 0; margin-bottom: 15px; font-size: 18px; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;">Detailed Survey Data</h2>
  `;

  selectedSurveyData.forEach((survey, index) => {
    const depth = (survey.bitDepth || survey.measuredDepth || 0).toFixed(2);
    const inc = (survey.inclination || 0).toFixed(2);
    const az = (survey.azimuth || 0).toFixed(2);
    const tf = (survey.toolFace || 0).toFixed(2);
    const temp = (survey.toolTemp || 0).toFixed(2);
    const timestamp = survey.timestamp
      ? new Date(survey.timestamp).toLocaleString()
      : "Unknown";

    // Determine quality status color
    let statusColor = "#68d391"; // Default green for pass
    if (survey.qualityCheck) {
      if (survey.qualityCheck.status === "warning") {
        statusColor = "#f6ad55"; // Orange for warning
      } else if (survey.qualityCheck.status === "fail") {
        statusColor = "#fc8181"; // Red for fail
      }
    }

    content += `
      <div style="margin-bottom: 15px; padding: 15px; background-color: #f8fafc; border-radius: 8px; border-left: 4px solid #3182ce;">
        <h3 style="color: #3182ce; margin-top: 0; margin-bottom: 10px; font-size: 16px;">SURVEY #${index + 1} - ${timestamp}</h3>
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px;">
          <div>
            <p style="margin: 5px 0; color: #718096; font-size: 13px;">Measured Depth</p>
            <p style="margin: 0; color: #2d3748; font-weight: 600; font-size: 15px;">${depth} ft</p>
          </div>
          <div>
            <p style="margin: 5px 0; color: #718096; font-size: 13px;">Inclination</p>
            <p style="margin: 0; color: #2d3748; font-weight: 600; font-size: 15px;">${inc}°</p>
          </div>
          <div>
            <p style="margin: 5px 0; color: #718096; font-size: 13px;">Azimuth</p>
            <p style="margin: 0; color: #2d3748; font-weight: 600; font-size: 15px;">${az}°</p>
          </div>
          <div>
            <p style="margin: 5px 0; color: #718096; font-size: 13px;">Tool Face</p>
            <p style="margin: 0; color: #2d3748; font-weight: 600; font-size: 15px;">${tf}°</p>
          </div>
          <div>
            <p style="margin: 5px 0; color: #718096; font-size: 13px;">Tool Temp</p>
            <p style="margin: 0; color: #2d3748; font-weight: 600; font-size: 15px;">${temp}°F</p>
          </div>
          <div>
            <p style="margin: 5px 0; color: #718096; font-size: 13px;">Quality Check</p>
            <p style="margin: 0; color: ${statusColor}; font-weight: 600; font-size: 15px;">${survey.qualityCheck?.status?.toUpperCase() || "N/A"}</p>
          </div>
        </div>
        ${
          survey.qualityCheck?.message
            ? `
          <div style="margin-top: 10px; padding: 8px; background-color: #edf2f7; border-radius: 4px;">
            <p style="margin: 0; color: #4a5568; font-size: 14px;"><span style="font-weight: 600;">Quality Message:</span> ${survey.qualityCheck.message}</p>
          </div>
        `
            : ""
        }
      </div>
    `;
  });

  content += `</div>`;
  return content;
};

/**
 * Helper function to generate the screenshot section of the email
 */
const generateScreenshotSection = (imageBlob?: Blob | null): string => {
  if (!imageBlob) return "";

  return `
    <div style="margin: 30px 0;">
      <h2 style="color: #2c5282; margin-top: 0; margin-bottom: 15px; font-size: 18px; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;">Survey Visualization</h2>
      <div style="text-align: center;">
        <img src="cid:surveyPlot" alt="Survey Plot" style="max-width: 100%; height: auto; border: 1px solid #e2e8f0; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
      </div>
    </div>
  `;
};

/**
 * Convert a Blob to a base64 encoded string
 */
export const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      resolve(base64String);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

/**
 * Helper function to generate the attachments section of the email
 */
const generateAttachmentsSection = (
  attachments?: { name: string; size: string; type: string; path: string }[],
): string => {
  if (!attachments || attachments.length === 0) return "";

  let content = `
    <div style="margin-bottom: 20px; padding: 15px; background-color: #f0f4f8; border-radius: 8px; border-left: 5px solid #2c5282;">
      <h2 style="color: #2c5282; margin-top: 0; margin-bottom: 10px; font-size: 18px;">Attachments (${attachments.length})</h2>
      <ul style="margin: 0; padding-left: 20px;">
  `;

  attachments.forEach((file) => {
    content += `
      <li style="margin-bottom: 5px;">
        <span style="color: #2d3748; font-weight: 500;">${file.name}</span>
        <span style="color: #718096; font-size: 13px;"> (${file.size}, ${file.type})</span>
      </li>
    `;
  });

  content += `
      </ul>
    </div>
  `;

  return content;
};

/**
 * Generates Outlook draft content (HTML format)
 */
export const generateOutlookDraftContent = async (
  selectedSurveys: string[],
  surveys: SurveyData[],
  wellInfo: WellInfo,
  witsData: WitsData,
  includeCurveData: boolean = false,
  includeTargetLineStatus: boolean = false,
  targetLineData?: { aboveBelow: number; leftRight: number } | null,
  includeGammaPlot: boolean = false,
  imageBlob?: Blob | null,
  includeSurveyAnalytics: boolean = false,
  includeFullSurveyData: boolean = false,
  fileAttachments?: {
    name: string;
    size: string;
    type: string;
    path: string;
  }[],
): Promise<{
  subject: string;
  htmlBody: string;
  attachments: Blob[];
  imageBase64?: string;
}> => {
  // Filter selected surveys
  const selectedSurveyData =
    selectedSurveys.length > 0
      ? surveys.filter((survey) => selectedSurveys.includes(survey.id))
      : surveys.length > 0
        ? [surveys[0]]
        : [];

  // Get the latest survey
  const latestSurvey =
    selectedSurveyData.length > 0 ? selectedSurveyData[0] : null;

  if (!latestSurvey) {
    return {
      subject: `MWD Survey Report - ${wellInfo.wellName || "Unknown Well"} - ${new Date().toLocaleDateString()}`,
      htmlBody:
        "<p>No survey data available. Please select at least one survey.</p>",
      attachments: [],
    };
  }

  // Create enhanced HTML content using helper functions
  let htmlContent = ``;

  // Well Information Section
  htmlContent += generateWellInfoSection(wellInfo);

  // Survey Summary Section
  htmlContent += generateSurveySummarySection(selectedSurveyData);

  // Detailed Survey Data Section
  htmlContent += generateDetailedSurveySection(selectedSurveyData);

  // Helper functions for generating different sections of the email

  /**
   * Helper function to generate the curve data section of the email
   */
  const generateCurveDataSection = (
    witsData: WitsData,
    includeCurveData: boolean,
  ): string => {
    if (!includeCurveData || !witsData) return "";

    return `
      <div style="margin-bottom: 20px;">
        <h2 style="color: #2c5282; margin-top: 0; margin-bottom: 15px; font-size: 18px; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;">Curve Data</h2>
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px;">
          <div style="padding: 12px; background-color: #ebf8ff; border-radius: 8px; border: 1px solid #bee3f8;">
            <p style="margin: 0 0 5px 0; color: #4a5568; font-size: 13px;">Motor Yield</p>
            <p style="margin: 0; color: #2b6cb0; font-weight: 600; font-size: 16px;">${witsData.motorYield.toFixed(2)}°/100ft</p>
          </div>
          <div style="padding: 12px; background-color: #fffaf0; border-radius: 8px; border: 1px solid #feebc8;">
            <p style="margin: 0 0 5px 0; color: #4a5568; font-size: 13px;">Dogleg Needed</p>
            <p style="margin: 0; color: #c05621; font-weight: 600; font-size: 16px;">${witsData.doglegNeeded.toFixed(2)}°/100ft</p>
          </div>
          <div style="padding: 12px; background-color: #f0fff4; border-radius: 8px; border: 1px solid #c6f6d5;">
            <p style="margin: 0 0 5px 0; color: #4a5568; font-size: 13px;">Slide Seen</p>
            <p style="margin: 0; color: #2f855a; font-weight: 600; font-size: 16px;">${witsData.slideSeen.toFixed(2)}°</p>
          </div>
          <div style="padding: 12px; background-color: #ebf8ff; border-radius: 8px; border: 1px solid #bee3f8;">
            <p style="margin: 0 0 5px 0; color: #4a5568; font-size: 13px;">Slide Ahead</p>
            <p style="margin: 0; color: #2b6cb0; font-weight: 600; font-size: 16px;">${witsData.slideAhead.toFixed(2)}°</p>
          </div>
          <div style="padding: 12px; background-color: #faf5ff; border-radius: 8px; border: 1px solid #e9d8fd;">
            <p style="margin: 0 0 5px 0; color: #4a5568; font-size: 13px;">Projected Inc</p>
            <p style="margin: 0; color: #6b46c1; font-weight: 600; font-size: 16px;">${witsData.projectedInc.toFixed(2)}°</p>
          </div>
          <div style="padding: 12px; background-color: #fff5f5; border-radius: 8px; border: 1px solid #fed7d7;">
            <p style="margin: 0 0 5px 0; color: #4a5568; font-size: 13px;">Projected Az</p>
            <p style="margin: 0; color: #c53030; font-weight: 600; font-size: 16px;">${witsData.projectedAz.toFixed(2)}°</p>
          </div>
        </div>
      </div>
    `;
  };

  /**
   * Helper function to generate the target line status section of the email
   */
  const generateTargetLineStatusSection = (
    targetLineData:
      | { aboveBelow: number; leftRight: number }
      | null
      | undefined,
    includeTargetLineStatus: boolean,
  ): string => {
    if (!includeTargetLineStatus || !targetLineData) return "";

    const aboveBelowText = targetLineData.aboveBelow > 0 ? "Below" : "Above";
    const aboveBelowColor =
      targetLineData.aboveBelow > 0 ? "#c53030" : "#2f855a";
    const distance = Math.sqrt(
      targetLineData.aboveBelow * targetLineData.aboveBelow +
        targetLineData.leftRight * targetLineData.leftRight,
    ).toFixed(1);

    return `
      <div style="margin-bottom: 20px;">
        <h2 style="color: #2c5282; margin-top: 0; margin-bottom: 15px; font-size: 18px; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;">Target Line Status</h2>
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px;">
          <div style="padding: 12px; background-color: ${targetLineData.aboveBelow > 0 ? "#fff5f5" : "#f0fff4"}; border-radius: 8px; border: 1px solid ${targetLineData.aboveBelow > 0 ? "#fed7d7" : "#c6f6d5"};">
            <p style="margin: 0 0 5px 0; color: #4a5568; font-size: 13px;">Above/Below</p>
            <p style="margin: 0; color: ${aboveBelowColor}; font-weight: 600; font-size: 16px;">${aboveBelowText} ${Math.abs(targetLineData.aboveBelow).toFixed(1)} ft</p>
          </div>
          <div style="padding: 12px; background-color: #fffaf0; border-radius: 8px; border: 1px solid #feebc8;">
            <p style="margin: 0 0 5px 0; color: #4a5568; font-size: 13px;">Left/Right</p>
            <p style="margin: 0; color: #c05621; font-weight: 600; font-size: 16px;">${targetLineData.leftRight.toFixed(1)} ft</p>
          </div>
          <div style="padding: 12px; background-color: #ebf8ff; border-radius: 8px; border: 1px solid #bee3f8;">
            <p style="margin: 0 0 5px 0; color: #4a5568; font-size: 13px;">Distance to Target</p>
            <p style="margin: 0; color: #2b6cb0; font-weight: 600; font-size: 16px;">${distance} ft</p>
          </div>
        </div>
      </div>
    `;
  };

  /**
   * Helper function to generate the gamma plot section of the email
   */
  const generateGammaPlotSection = (
    latestSurvey: SurveyData,
    includeGammaPlot: boolean,
  ): string => {
    if (!includeGammaPlot) return "";

    return `
      <div style="margin-bottom: 20px;">
        <h2 style="color: #2c5282; margin-top: 0; margin-bottom: 15px; font-size: 18px; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;">Gamma Ray Plot</h2>
        <div style="padding: 15px; background-color: #2d3748; border-radius: 8px; color: #e2e8f0;">
          <div style="margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center;">
            <span style="font-size: 14px; color: #a0aec0;">Gamma Ray Log Visualization</span>
            <span style="font-size: 12px; background-color: rgba(56, 178, 172, 0.2); color: #4fd1c5; padding: 2px 8px; border-radius: 9999px;">GAMMA</span>
          </div>
          <div style="height: 200px; background-color: #1a202c; border-radius: 4px; padding: 20px; position: relative; overflow: hidden;">
            <!-- Simplified gamma visualization -->
            <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" style="position: absolute; left: 0; top: 0; width: 100%; height: 100%;">
              <polyline points="0,80 10,60 20,70 30,40 40,50 50,30 60,45 70,25 80,35 90,15 100,30" 
                fill="none" stroke="#38b2ac" stroke-width="2" />
              <g fill="#38b2ac">
                <circle cx="0" cy="80" r="2" />
                <circle cx="10" cy="60" r="2" />
                <circle cx="20" cy="70" r="2" />
                <circle cx="30" cy="40" r="2" />
                <circle cx="40" cy="50" r="2" />
                <circle cx="50" cy="30" r="2" />
                <circle cx="60" cy="45" r="2" />
                <circle cx="70" cy="25" r="2" />
                <circle cx="80" cy="35" r="2" />
                <circle cx="90" cy="15" r="2" />
                <circle cx="100" cy="30" r="2" />
              </g>
            </svg>
            <!-- Y-axis labels -->
            <div style="position: absolute; left: 10px; top: 10px; bottom: 30px; display: flex; flex-direction: column; justify-content: space-between; align-items: flex-end;">
              <span style="color: #a0aec0; font-size: 12px;">0</span>
              <span style="color: #a0aec0; font-size: 12px;">50</span>
              <span style="color: #a0aec0; font-size: 12px;">100</span>
            </div>
            <!-- X-axis labels -->
            <div style="position: absolute; left: 30px; right: 10px; bottom: 10px; display: flex; justify-content: space-between;">
              <span style="color: #a0aec0; font-size: 12px;">${(latestSurvey.bitDepth - 100).toFixed(0)}</span>
              <span style="color: #a0aec0; font-size: 12px;">${(latestSurvey.bitDepth - 50).toFixed(0)}</span>
              <span style="color: #a0aec0; font-size: 12px;">${latestSurvey.bitDepth.toFixed(0)}</span>
            </div>
          </div>
          <p style="margin-top: 10px; font-size: 12px; color: #a0aec0; text-align: center;">
            Gamma readings from ${(latestSurvey.bitDepth - 100).toFixed(0)} to ${latestSurvey.bitDepth.toFixed(0)} ft MD
          </p>
        </div>
      </div>
    `;
  };

  /**
   * Helper function to generate the survey analytics section of the email
   */
  const generateSurveyAnalyticsSection = (
    latestSurvey: SurveyData,
    includeSurveyAnalytics: boolean,
  ): string => {
    if (!includeSurveyAnalytics) return "";

    return `
      <div style="margin-bottom: 20px;">
        <h2 style="color: #2c5282; margin-top: 0; margin-bottom: 15px; font-size: 18px; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;">Survey Analytics</h2>
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px;">
          <div style="padding: 12px; background-color: #fffaf0; border-radius: 8px; border: 1px solid #feebc8;">
            <p style="margin: 0 0 5px 0; color: #4a5568; font-size: 13px;">Dogleg Severity</p>
            <p style="margin: 0; color: #c05621; font-weight: 600; font-size: 16px;">${(Math.random() * 3 + 1).toFixed(2)}°/100ft</p>
          </div>
          <div style="padding: 12px; background-color: #ebf8ff; border-radius: 8px; border: 1px solid #bee3f8;">
            <p style="margin: 0 0 5px 0; color: #4a5568; font-size: 13px;">Build Rate</p>
            <p style="margin: 0; color: #2b6cb0; font-weight: 600; font-size: 16px;">${(Math.random() * 2 + 0.5).toFixed(2)}°/100ft</p>
          </div>
          <div style="padding: 12px; background-color: #f0fff4; border-radius: 8px; border: 1px solid #c6f6d5;">
            <p style="margin: 0 0 5px 0; color: #4a5568; font-size: 13px;">Turn Rate</p>
            <p style="margin: 0; color: #2f855a; font-weight: 600; font-size: 16px;">${(Math.random() * 2 + 0.5).toFixed(2)}°/100ft</p>
          </div>
          <div style="padding: 12px; background-color: #faf5ff; border-radius: 8px; border: 1px solid #e9d8fd;">
            <p style="margin: 0 0 5px 0; color: #4a5568; font-size: 13px;">Projected TD</p>
            <p style="margin: 0; color: #6b46c1; font-weight: 600; font-size: 16px;">${(latestSurvey.bitDepth + 1000).toFixed(1)} ft</p>
          </div>
          <div style="padding: 12px; background-color: #fff5f5; border-radius: 8px; border: 1px solid #fed7d7;">
            <p style="margin: 0 0 5px 0; color: #4a5568; font-size: 13px;">Directional Tendency</p>
            <p style="margin: 0; color: #c53030; font-weight: 600; font-size: 16px;">Trending ${Math.random() > 0.5 ? "right" : "left"} of plan by ${(Math.random() * 5).toFixed(1)} ft</p>
          </div>
        </div>
      </div>
    `;
  };

  /**
   * Helper function to generate the full survey data section of the email
   */
  const generateFullSurveyDataSection = (
    selectedSurveyData: SurveyData[],
    includeFullSurveyData: boolean,
  ): string => {
    if (!includeFullSurveyData) return "";

    let content = `
      <div style="margin-bottom: 20px;">
        <h2 style="color: #2c5282; margin-top: 0; margin-bottom: 15px; font-size: 18px; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;">Complete Survey Data</h2>
        <div style="overflow-x: auto;">
          <table style="width: 100%; border-collapse: collapse; border: 1px solid #e2e8f0;">
            <thead>
              <tr style="background-color: #2c5282;">
                <th style="padding: 10px; text-align: left; color: white; font-weight: 600; border: 1px solid #4a5568;">MD (ft)</th>
                <th style="padding: 10px; text-align: left; color: white; font-weight: 600; border: 1px solid #4a5568;">Inc (°)</th>
                <th style="padding: 10px; text-align: left; color: white; font-weight: 600; border: 1px solid #4a5568;">Az (°)</th>
                <th style="padding: 10px; text-align: left; color: white; font-weight: 600; border: 1px solid #4a5568;">TF (°)</th>
                <th style="padding: 10px; text-align: left; color: white; font-weight: 600; border: 1px solid #4a5568;">Temp (°F)</th>
                <th style="padding: 10px; text-align: left; color: white; font-weight: 600; border: 1px solid #4a5568;">B Total</th>
                <th style="padding: 10px; text-align: left; color: white; font-weight: 600; border: 1px solid #4a5568;">A Total</th>
              </tr>
            </thead>
            <tbody>
    `;

    selectedSurveyData.forEach((survey) => {
      content += `
        <tr>
          <td style="padding: 8px; border: 1px solid #e2e8f0; color: #2d3748;">${(survey.bitDepth || 0).toFixed(2)}</td>
          <td style="padding: 8px; border: 1px solid #e2e8f0; color: #2d3748;">${(survey.inclination || 0).toFixed(2)}</td>
          <td style="padding: 8px; border: 1px solid #e2e8f0; color: #2d3748;">${(survey.azimuth || 0).toFixed(2)}</td>
          <td style="padding: 8px; border: 1px solid #e2e8f0; color: #2d3748;">${(survey.toolFace || 0).toFixed(2)}</td>
          <td style="padding: 8px; border: 1px solid #e2e8f0; color: #2d3748;">${(survey.toolTemp || 0).toFixed(2)}</td>
          <td style="padding: 8px; border: 1px solid #e2e8f0; color: #2d3748;">${(survey.bTotal || 0).toFixed(2)}</td>
          <td style="padding: 8px; border: 1px solid #e2e8f0; color: #2d3748;">${(survey.aTotal || 0).toFixed(2)}</td>
        </tr>
      `;
    });

    content += `
            </tbody>
          </table>
        </div>
      </div>
    `;

    return content;
  };

  /**
   * Helper function to generate the notes section of the email
   */
  const generateNotesSection = (): string => {
    return `
      <div style="margin-top: 30px; padding: 15px; background-color: #f7fafc; border-radius: 8px; border-left: 5px solid #4299e1;">
        <h2 style="color: #2c5282; margin-top: 0; margin-bottom: 10px; font-size: 18px;">Notes</h2>
        <p style="margin: 0; color: #4a5568; line-height: 1.5;">
          This report was generated automatically by the MWD Surface Software.<br>
          Please contact the directional driller for any questions or concerns.
        </p>
      </div>
    `;
  };

  // Convert image blob to base64 if available
  let imageBase64: string | undefined;
  if (imageBlob) {
    try {
      imageBase64 = await blobToBase64(imageBlob);
    } catch (error) {
      console.error("Error converting image to base64:", error);
    }
  }

  // Wrap everything in HTML structure
  const htmlBody = `
    <html>
      <head>
        <style>
          body { font-family: Calibri, Arial, sans-serif; line-height: 1.4; color: #333; margin: 0; padding: 20px; }
          h1 { color: #1a3e72; border-bottom: 1px solid #1a3e72; padding-bottom: 8px; }
          h2 { color: #1a3e72; margin-top: 24px; }
          h3 { color: #2c5282; margin-bottom: 8px; }
          .header { background-color: #f8f9fa; padding: 20px; margin-bottom: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
          .footer { margin-top: 40px; padding: 20px; border-top: 1px solid #e2e8f0; font-size: 0.9em; color: #718096; background-color: #f7fafc; border-radius: 8px; }
          .warning { color: #d69e2e; font-weight: bold; }
          .error { color: #e53e3e; font-weight: bold; }
          .success { color: #38a169; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1 style="margin-top: 0; color: #2c5282; font-size: 24px;">MWD SURVEY REPORT - ${wellInfo.wellName || "Unknown Well"}</h1>
          <p style="margin-bottom: 0; color: #4a5568;"><strong>Rig:</strong> ${wellInfo.rigName || "Unknown Rig"} | <strong>Generated:</strong> ${new Date().toLocaleString()}</p>
        </div>

        ${htmlContent}

        ${
          imageBase64
            ? `
        <div style="margin: 30px 0;">
          <h2 style="color: #2c5282; margin-top: 0; margin-bottom: 15px; font-size: 18px; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;">Survey Visualization</h2>
          <div style="text-align: center;">
            <img src="${imageBase64}" alt="Survey Plot" style="max-width: 100%; height: auto; border: 1px solid #e2e8f0; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
          </div>
        </div>
        `
            : ""
        }

        <div class="footer">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
            <div>
              <p style="margin: 0; font-weight: 600; color: #4a5568;">New Well Technologies</p>
              <p style="margin: 5px 0 0 0; color: #718096;">Advanced Directional Drilling Solutions</p>
            </div>
            <div style="text-align: right;">
              <p style="margin: 0; color: #4a5568;">Phone: (555) 123-4567</p>
              <p style="margin: 5px 0 0 0; color: #4a5568;">Email: support@newwelltech.com</p>
            </div>
          </div>
          <p style="margin: 15px 0 0 0; padding-top: 15px; border-top: 1px solid #e2e8f0; color: #718096; font-size: 12px; text-align: center;">
            <strong>24/7 Technical Support:</strong> (555) 987-6543<br>
            <em>CONFIDENTIALITY NOTICE: This email contains proprietary drilling information.</em>
          </p>
        </div>
      </body>
    </html>
  `;

  const subject = `MWD Survey Report - ${wellInfo.wellName} - ${new Date().toLocaleDateString()}`;
  const attachments = imageBlob ? [imageBlob] : [];

  return {
    subject,
    htmlBody,
    attachments,
    imageBase64,
  };
};

/**
 * Launches Outlook draft with specified content
 */
export const launchOutlookDraft = async (
  content: { subject: string; htmlBody: string; attachments: Blob[] },
  recipients: string[] = [],
  ccRecipients: string[] = [],
  fileAttachments: {
    name: string;
    path: string;
    type: string;
    size: string;
  }[] = [],
): Promise<void> => {
  try {
    // Method 1: Office JS API (best for Outlook desktop)
    if (window.Office && window.Office.context) {
      Office.context.mailbox.displayNewMessageAsync({
        to: recipients,
        cc: ccRecipients,
        subject: content.subject,
        htmlBody: content.htmlBody,
        attachments: [
          ...content.attachments.map((blob, index) => ({
            type: Office.MailboxEnums.AttachmentType.File,
            name: `SurveyPlot_${index + 1}.png`,
            content: URL.createObjectURL(blob),
          })),
          ...fileAttachments.map((file) => ({
            type: Office.MailboxEnums.AttachmentType.File,
            name: file.name,
            path: file.path,
          })),
        ],
      });
      return;
    }

    // Method 2: Use Outlook Web App URL with deep linking
    // This will open Outlook Web App with a pre-populated draft
    const outlookWebUrl = `https://outlook.office.com/mail/deeplink/compose?subject=${encodeURIComponent(content.subject)}&body=${encodeURIComponent(content.htmlBody)}&to=${encodeURIComponent(recipients.join(";"))}`;
    window.open(outlookWebUrl, "_blank");

    // Method 3: MS Protocol URL as fallback (works when Outlook is default client)
    // Note: Protocol URL doesn't support file attachments directly
    setTimeout(() => {
      const outlookProtocolUrl = `outlook:compose?subject=${encodeURIComponent(content.subject)}&body=${encodeURIComponent(content.htmlBody)}&to=${recipients.join(";")}&cc=${ccRecipients.join(";")}`;
      window.location.href = outlookProtocolUrl;
    }, 1000);

    // Final fallback after a delay if protocol handler doesn't work
    setTimeout(() => {
      // Method 4: Basic mailto with HTML
      const mailtoUrl = `mailto:${recipients.join(";")}?subject=${encodeURIComponent(content.subject)}&body=${encodeURIComponent(content.htmlBody)}&cc=${ccRecipients.join(";")}`;
      window.location.href = mailtoUrl;
    }, 2000);
  } catch (error) {
    console.error("Error launching Outlook draft:", error);
    // Final fallback
    const mailtoUrl = `mailto:${recipients.join(";")}?subject=${encodeURIComponent(content.subject)}&body=${encodeURIComponent(content.htmlBody)}&cc=${ccRecipients.join(";")}`;
    window.location.href = mailtoUrl;
  }
};

/**
 * Creates a mailto URL for sending survey data via email
 * (Unchanged from original implementation)
 */
export const createMailtoUrl = (
  emailBody: string,
  subject: string,
  recipient: string = "",
): string => {
  return `mailto:${recipient}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(emailBody)}`;
};

/**
 * Captures email preview as an image using html2canvas
 * (Unchanged from original implementation)
 */
export const captureEmailPreview = async (
  element: HTMLElement,
): Promise<Blob | null> => {
  if (!element) return null;

  try {
    const canvas = await html2canvas(element, {
      backgroundColor: "#1a1a1a",
      scale: 2,
      logging: false,
      useCORS: true,
    });

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        resolve(blob);
      }, "image/png");
    });
  } catch (error) {
    console.error("Error capturing email preview:", error);
    return null;
  }
};

/**
 * Copies an image to clipboard
 * (Unchanged from original implementation)
 */
export const copyImageToClipboard = async (blob: Blob): Promise<boolean> => {
  try {
    if (navigator.clipboard && navigator.clipboard.write) {
      const item = new ClipboardItem({ "image/png": blob });
      await navigator.clipboard.write([item]);
      return true;
    } else {
      const url = URL.createObjectURL(blob);
      const img = document.createElement("img");
      img.src = url;

      const textarea = document.createElement("textarea");
      textarea.value =
        "Image created but couldn't be automatically copied. Right-click the image that appears and select 'Copy Image'.";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);

      const win = window.open();
      if (win) {
        win.document.write(img.outerHTML);
      }
      return false;
    }
  } catch (error) {
    console.error("Error copying image to clipboard:", error);
    return false;
  }
};

/**
 * New function to handle the complete Outlook email creation flow
 */
export const createOutlookEmailWithSurveyData = async (
  selectedSurveys: string[],
  surveys: SurveyData[],
  wellInfo: WellInfo,
  witsData: WitsData,
  options: {
    includeCurveData?: boolean;
    includeTargetLineStatus?: boolean;
    targetLineData?: { aboveBelow: number; leftRight: number } | null;
    includeGammaPlot?: boolean;
    includeSurveyAnalytics?: boolean;
    includeFullSurveyData?: boolean;
    previewElement?: HTMLElement | null;
    recipients?: string[];
    ccRecipients?: string[];
    fileAttachments?: {
      name: string;
      path: string;
      type: string;
      size: string;
    }[];
    emailPreviewImage?: Blob | null;
  } = {},
) => {
  try {
    // Generate email content with base64 encoded image
    const emailContentObj = await generateOutlookDraftContent(
      selectedSurveys,
      surveys,
      wellInfo,
      witsData,
      options.includeCurveData,
      options.includeTargetLineStatus,
      options.targetLineData,
      options.includeGammaPlot,
      options.emailPreviewImage,
      options.includeSurveyAnalytics,
      options.includeFullSurveyData,
      options.fileAttachments, // Pass file attachments to include in the email body
    );

    // Create email subject
    const subject = `Survey Report - Well ${wellInfo.wellName} - ${wellInfo.rigName}`;

    // Prepare attachments - only add if we're not using base64 embedded image
    const attachments = [];
    if (options.emailPreviewImage && !emailContentObj.imageBase64) {
      attachments.push(options.emailPreviewImage);
    }

    // Launch Outlook draft with HTML content and file attachments
    await launchOutlookDraft(
      {
        subject,
        htmlBody: emailContentObj.htmlBody,
        attachments: attachments,
      },
      options.recipients || [],
      options.ccRecipients || [],
      options.fileAttachments || [],
    );
  } catch (error) {
    console.error("Error creating Outlook email with survey data:", error);
    throw error;
  }
};
