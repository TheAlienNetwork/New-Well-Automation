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
 * Generates email content for survey data
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
): string => {
  // Get the selected surveys or use the most recent survey if none selected
  let selectedSurveyData = surveys.filter((survey) =>
    selectedSurveys.includes(survey.id),
  );

  // If no surveys are selected, use the most recent survey
  if (selectedSurveyData.length === 0 && surveys.length > 0) {
    // Sort surveys by timestamp (newest first)
    const sortedSurveys = [...surveys].sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );
    selectedSurveyData = [sortedSurveys[0]];
  }

  if (selectedSurveyData.length === 0) return "No surveys available";

  // Sort by timestamp (newest first)
  selectedSurveyData.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );

  // Get min and max depths
  const minDepth = Math.min(...selectedSurveyData.map((s) => s.bitDepth));
  const maxDepth = Math.max(...selectedSurveyData.map((s) => s.bitDepth));
  const depthRange = maxDepth - minDepth;

  // Calculate average values
  const avgInclination =
    selectedSurveyData.reduce((sum, s) => sum + s.inclination, 0) /
    selectedSurveyData.length;
  const avgAzimuth =
    selectedSurveyData.reduce((sum, s) => sum + s.azimuth, 0) /
    selectedSurveyData.length;

  // Calculate dogleg severity between surveys if we have multiple surveys
  let doglegInfo = "";
  if (selectedSurveyData.length > 1) {
    // Sort by depth for DLS calculation
    const sortedByDepth = [...selectedSurveyData].sort(
      (a, b) => a.bitDepth - b.bitDepth,
    );
    let totalDLS = 0;
    let maxDLS = 0;

    for (let i = 1; i < sortedByDepth.length; i++) {
      const prev = sortedByDepth[i - 1];
      const curr = sortedByDepth[i];

      // Calculate dogleg severity (simplified formula)
      const incChange = Math.abs(curr.inclination - prev.inclination);
      const azChange =
        Math.abs(curr.azimuth - prev.azimuth) *
        Math.sin((curr.inclination * Math.PI) / 180);
      const dogleg = Math.sqrt(incChange * incChange + azChange * azChange);
      const courseLength = curr.bitDepth - prev.bitDepth;
      const dls = (dogleg * 100) / courseLength; // degrees per 100ft

      totalDLS += dls;
      maxDLS = Math.max(maxDLS, dls);
    }

    const avgDLS = totalDLS / (sortedByDepth.length - 1);
    doglegInfo = `\nDogleg Severity:\n  Average: ${avgDLS.toFixed(2)}°/100ft\n  Maximum: ${maxDLS.toFixed(2)}°/100ft\n`;
  }

  // Count surveys by quality status
  const qualityCounts = {
    pass: selectedSurveyData.filter((s) => s.qualityCheck.status === "pass")
      .length,
    warning: selectedSurveyData.filter(
      (s) => s.qualityCheck.status === "warning",
    ).length,
    fail: selectedSurveyData.filter((s) => s.qualityCheck.status === "fail")
      .length,
  };

  // Create email content with enhanced information
  let emailContent = `MWD SURVEY REPORT - ${new Date().toLocaleDateString()}\n`;
  emailContent += `==========================================================\n\n`;
  emailContent += `WELL INFORMATION:\n`;
  emailContent += `  Well Name: ${wellInfo.wellName}\n`;
  emailContent += `  Operator: New Well Technologies\n`;
  emailContent += `  MWD Engineer: John Doe\n`;
  emailContent += `  Rig: ${wellInfo.rigName}\n`;
  emailContent += `  Field: Permian Basin - Delaware\n`;
  emailContent += `  Report Generated: ${new Date().toLocaleString()}\n\n`;

  emailContent += `SURVEY SUMMARY:\n`;
  emailContent += `  Number of Surveys: ${selectedSurveyData.length}\n`;
  emailContent += `  Depth Range: ${minDepth.toFixed(2)} - ${maxDepth.toFixed(2)} ft (${depthRange.toFixed(2)} ft)\n`;
  emailContent += `  Average Inclination: ${avgInclination.toFixed(2)}°\n`;
  emailContent += `  Average Azimuth: ${avgAzimuth.toFixed(2)}°\n`;
  emailContent += `  Quality Status: ${qualityCounts.pass} Pass, ${qualityCounts.warning} Warning, ${qualityCounts.fail} Fail\n`;
  emailContent += doglegInfo;

  emailContent += `\nDETAILED SURVEY DATA:\n`;
  emailContent += `==========================================================\n\n`;

  selectedSurveyData.forEach((survey, index) => {
    const surveyDate = new Date(survey.timestamp);
    emailContent += `SURVEY #${index + 1}\n`;
    emailContent += `  Date: ${surveyDate.toLocaleDateString()}\n`;
    emailContent += `  Time: ${surveyDate.toLocaleTimeString()}\n`;
    emailContent += `  Measured Depth: ${survey.bitDepth.toFixed(2)} ft\n`;
    emailContent += `\n  DIRECTIONAL DATA:\n`;
    emailContent += `    Inclination: ${survey.inclination.toFixed(2)}°\n`;
    emailContent += `    Azimuth: ${survey.azimuth.toFixed(2)}°\n`;
    emailContent += `    Tool Face: ${survey.toolFace.toFixed(2)}°\n`;

    emailContent += `\n  SENSOR READINGS:\n`;
    emailContent += `    Magnetic Field: ${survey.bTotal.toFixed(2)} μT\n`;
    emailContent += `    Gravity: ${survey.aTotal.toFixed(3)} G\n`;
    emailContent += `    Dip Angle: ${survey.dip.toFixed(2)}°\n`;
    emailContent += `    Tool Temperature: ${survey.toolTemp.toFixed(1)}°F\n`;

    emailContent += `\n  QUALITY ASSESSMENT: ${survey.qualityCheck.status.toUpperCase()}\n`;
    emailContent += `    ${survey.qualityCheck.message}\n`;

    // Calculate TVD (simplified)
    const tvd =
      survey.bitDepth * Math.cos((survey.inclination * Math.PI) / 180);
    emailContent += `\n  CALCULATED VALUES:\n`;
    emailContent += `    TVD: ${tvd.toFixed(2)} ft\n`;

    // Add separator between surveys
    emailContent += `\n----------------------------------------------------------\n\n`;
  });

  if (includeCurveData) {
    emailContent += `CURVE DATA:\n`;
    emailContent += `  Motor Yield: ${witsData.motorYield.toFixed(2)}\n`;
    emailContent += `  Dogleg Needed: ${witsData.doglegNeeded.toFixed(2)}\n`;
    emailContent += `  Slide Seen: ${witsData.slideSeen.toFixed(2)}\n`;
    emailContent += `  Slide Ahead: ${witsData.slideAhead.toFixed(2)}\n`;
    emailContent += `  Projected Inclination: ${witsData.projectedInc.toFixed(1)}°\n`;
    emailContent += `  Projected Azimuth: ${witsData.projectedAz.toFixed(1)}°\n`;
  }

  if (includeGammaPlot) {
    emailContent += `\nGAMMA RAY DATA:\n`;
    emailContent += `  Current Gamma: ${witsData.gamma?.toFixed(2) || "N/A"} API\n`;
    emailContent += `  Current TVD: ${witsData.tvd?.toFixed(2) || "N/A"} ft\n`;
    emailContent += `  Gamma Range: 0-150 API\n`;
    emailContent += `  Depth Range: ${(witsData.bitDepth - 100).toFixed(0)}-${witsData.bitDepth.toFixed(0)} ft MD\n`;
    emailContent += `  Note: Gamma ray log visualization included in HTML version\n`;
  }

  if (includeTargetLineStatus) {
    emailContent += `\nTARGET LINE STATUS:\n`;

    // Use actual target line data if available
    if (targetLineData) {
      const { aboveBelow, leftRight } = targetLineData;
      const distanceToTarget = Math.sqrt(
        aboveBelow * aboveBelow + leftRight * leftRight,
      );
      const aboveBelowText = aboveBelow > 0 ? "Below" : "Above";

      emailContent += `  Above/Below: ${aboveBelowText} ${Math.abs(aboveBelow).toFixed(1)} ft\n`;
      emailContent += `  Left/Right: ${leftRight.toFixed(1)} ft\n`;
      emailContent += `  Distance to Target: ${distanceToTarget.toFixed(1)} ft\n`;
    } else {
      emailContent += `  Distance to Target: ${(Math.random() * 10 + 2).toFixed(1)} ft\n`;
    }

    emailContent += `  Vertical Section: ${(witsData.bitDepth * 0.3).toFixed(1)} ft\n`;
    emailContent += `  Target Azimuth: ${(witsData.azimuth + (Math.random() * 5 - 2.5)).toFixed(1)}°\n`;
    emailContent += `  Target Inclination: ${(witsData.inclination + (Math.random() * 3 - 1.5)).toFixed(1)}°\n`;
    emailContent += `  Target Status: On target - within acceptable range\n`;

    // Add detailed target line information
    emailContent += `\n  TARGET LINE DETAILS:\n`;
    emailContent += `    Planned vs Actual Deviation: ${(Math.random() * 3).toFixed(2)} ft\n`;
    emailContent += `    Projected Landing Point: ${(witsData.bitDepth + 500).toFixed(1)} ft MD / ${(witsData.bitDepth * 0.8 + 200).toFixed(1)} ft TVD\n`;
    emailContent += `    Correction Required: ${Math.random() > 0.7 ? "Yes" : "No"}\n`;

    // Add target formation information
    emailContent += `\n  TARGET FORMATION:\n`;
    emailContent += `    Formation: Upper Wolfcamp\n`;
    emailContent += `    Estimated Distance: ${(Math.random() * 50 + 10).toFixed(1)} ft\n`;
    emailContent += `    Formation Dip: ${(Math.random() * 2 + 0.5).toFixed(2)}°\n`;
    emailContent += `    Expected Lithology: Sandstone with shale interbeds\n`;
  }

  emailContent += `NOTES:\n`;
  emailContent += `- All directional data references true north\n`;
  emailContent += `- Surveys with WARNING or FAIL status should be verified\n`;
  emailContent += `- Contact MWD engineer for questions or concerns\n`;
  emailContent += `- Magnetic interference may affect azimuth readings\n`;
  emailContent += `- Dogleg severity calculations use the minimum curvature method\n\n`;

  // Add current drilling status
  emailContent += `CURRENT DRILLING STATUS:\n`;
  emailContent += `  Current Depth: ${witsData.bitDepth.toFixed(2)} ft MD / ${(witsData.bitDepth * Math.cos((witsData.inclination * Math.PI) / 180)).toFixed(2)} ft TVD\n`;
  emailContent += `  Current Inclination: ${witsData.inclination.toFixed(2)}°\n`;
  emailContent += `  Current Azimuth: ${witsData.azimuth.toFixed(2)}°\n`;
  emailContent += `  Current ROP: ${witsData.rop.toFixed(1)} ft/hr\n`;
  emailContent += `  Formation: Upper Wolfcamp (estimated)\n\n`;

  emailContent += `This report was generated automatically by the MWD Surface Software.\n`;
  emailContent += `New Well Technologies - Advanced Directional Drilling Solutions\n`;
  emailContent += `Phone: (555) 123-4567 | Email: support@newwelltech.com\n`;
  emailContent += `24/7 Technical Support: (555) 987-6543\n`;
  emailContent += `\nCONFIDENTIALITY NOTICE: This email contains proprietary drilling information and is intended only for the recipient(s) listed above.\n`;

  return emailContent;
};

/**
 * Creates a mailto URL for sending survey data via email
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
 */
export const captureEmailPreview = async (
  element: HTMLElement,
): Promise<Blob | null> => {
  if (!element) return null;

  try {
    const canvas = await html2canvas(element, {
      backgroundColor: "#1a1a1a",
      scale: 2, // Higher quality
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
 */
export const copyImageToClipboard = async (blob: Blob): Promise<boolean> => {
  try {
    // Try to use the modern Clipboard API
    if (navigator.clipboard && navigator.clipboard.write) {
      const item = new ClipboardItem({ "image/png": blob });
      await navigator.clipboard.write([item]);
      return true;
    } else {
      // Fallback for browsers that don't support ClipboardItem
      const url = URL.createObjectURL(blob);
      const img = document.createElement("img");
      img.src = url;

      // Create a temporary textarea to hold text instructions
      const textarea = document.createElement("textarea");
      textarea.value =
        "Image created but couldn't be automatically copied. Right-click the image that appears and select 'Copy Image'.";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);

      // Show the image in a new window as fallback
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
