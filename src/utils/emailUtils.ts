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
  rotaryRpm?: number;
  toolFace?: number;
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

  // Use the HTML email template generator
  const { generateHtmlEmailTemplate } = await import("./htmlEmailTemplate");

  // Generate HTML email content
  const htmlBody = generateHtmlEmailTemplate(
    selectedSurveys,
    surveys,
    wellInfo,
    witsData,
    {
      includeCurveData,
      includeTargetLineStatus,
      targetLineData,
      includeGammaPlot,
      includeSurveyAnalytics,
      includeFullSurveyData,
    },
  );

  const subject = `MWD Survey Report - ${wellInfo.wellName || "Unknown Well"} - ${new Date().toLocaleDateString()}`;
  const attachments = [];

  // Add screenshot as attachment if available
  if (imageBlob) {
    attachments.push(imageBlob);
  }

  return {
    subject,
    htmlBody,
    attachments,
  };
};

/**
 * Creates a mailto URL for sending survey data via email
 */
export const createMailtoUrl = (
  emailBody: string,
  subject: string,
  recipient: string = "",
  isHtml: boolean = false,
): string => {
  // For HTML emails, we need to use a different approach
  if (isHtml) {
    // Most email clients don't support HTML in mailto links
    // So we'll just include a plain text version
    const plainTextBody = emailBody.replace(/<[^>]*>/g, "");
    return `mailto:${recipient}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(plainTextBody)}`;
  }

  return `mailto:${recipient}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(emailBody)}`;
};

/**
 * Captures email preview as an image using html2canvas
 */
export const captureEmailPreview = async (
  element: HTMLElement,
): Promise<Blob | null> => {
  if (!element) {
    console.error("No element provided to captureEmailPreview");
    return null;
  }

  try {
    console.log("Starting html2canvas capture");
    // Add a small delay to ensure the element is fully rendered
    await new Promise((resolve) => setTimeout(resolve, 100));

    const canvas = await html2canvas(element, {
      backgroundColor: "#1a1a1a",
      scale: 1.5, // Higher scale for better quality
      logging: true, // Enable logging for debugging
      useCORS: true,
      allowTaint: true, // Allow tainted canvas for better compatibility
      foreignObjectRendering: false, // Disable foreignObject rendering for better compatibility
      onclone: (clonedDoc) => {
        // Make sure all elements in the cloned document are visible
        const emailPreviewContainer = clonedDoc.querySelector(
          ".email-preview-container",
        );
        if (emailPreviewContainer) {
          emailPreviewContainer.setAttribute(
            "style",
            "display: block !important; visibility: visible !important; opacity: 1 !important;",
          );
        }
      },
    });

    console.log("Canvas created with dimensions", {
      width: canvas.width,
      height: canvas.height,
    });

    return new Promise((resolve) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            console.error("Failed to create blob from canvas");
            resolve(null);
            return;
          }

          console.log("Blob created from canvas", {
            size: `${Math.round(blob.size / 1024)}KB`,
            type: blob.type,
          });

          resolve(blob);
        },
        "image/png",
        0.9, // Use 0.9 quality for better image quality
      );
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
 * Convert Blob to base64 string
 */
const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
      } else {
        reject(new Error("Failed to convert blob to base64"));
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

import { isElectron, getElectronBridge } from "@/lib/electronBridge";

/**
 * New function to handle the complete Outlook email creation flow
 */
export const createOutlookEmailWithSurveyData = async (
  selectedSurveyIds: string[],
  surveysToUse: SurveyData[],
  wellInfoData: WellInfo,
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
      file?: File;
    }[];
    emailPreviewImage?: Blob | null;
    embedScreenshot?: boolean;
    useScreenshotInEmail?: boolean;
    replaceBodyWithScreenshot?: boolean;
  } = {},
) => {
  console.log("Creating Outlook email with options:", {
    includeCurveData: options.includeCurveData,
    includeTargetLineStatus: options.includeTargetLineStatus,
    includeGammaPlot: options.includeGammaPlot,
    includeSurveyAnalytics: options.includeSurveyAnalytics,
    includeFullSurveyData: options.includeFullSurveyData,
    hasEmailPreviewImage: !!options.emailPreviewImage,
    embedScreenshot: options.embedScreenshot,
    replaceBodyWithScreenshot: options.replaceBodyWithScreenshot,
    attachmentsCount: options.fileAttachments?.length || 0,
    isElectronApp: isElectron(),
  });

  try {
    // Generate email content based on options
    const { subject, htmlBody, attachments } =
      await generateOutlookDraftContent(
        selectedSurveyIds,
        surveysToUse,
        wellInfoData,
        witsData,
        options.includeCurveData,
        options.includeTargetLineStatus,
        options.targetLineData,
        options.includeGammaPlot,
        options.emailPreviewImage,
        options.includeSurveyAnalytics,
        options.includeFullSurveyData,
      );

    // Prepare recipients
    const recipientList = options.recipients?.join(";") || "";
    const ccList = options.ccRecipients?.join(";") || "";

    // Check if we're running in Electron and can use native APIs
    if (isElectron() && getElectronBridge()?.openEmailClient) {
      const electronBridge = getElectronBridge();
      let screenshotPath = null;

      // If we have a screenshot and want to use it, save it to a temp file
      if (
        options.emailPreviewImage &&
        options.embedScreenshot &&
        electronBridge?.saveScreenshotToTemp
      ) {
        try {
          // Convert blob to base64
          const reader = new FileReader();
          const imageDataPromise = new Promise<string>((resolve) => {
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(options.emailPreviewImage!);
          });
          const imageData = await imageDataPromise;

          // Save screenshot to temp file using Electron
          screenshotPath = await electronBridge.saveScreenshotToTemp(imageData);
          console.log("Screenshot saved to temp file:", screenshotPath);
        } catch (err) {
          console.error("Failed to save screenshot:", err);
        }
      }

      // Prepare attachment paths for Electron
      const attachmentPaths: string[] = [];

      // Add screenshot if available
      if (screenshotPath) {
        attachmentPaths.push(screenshotPath);
      }

      // Add file attachments if available
      if (options.fileAttachments && options.fileAttachments.length > 0) {
        options.fileAttachments.forEach((attachment) => {
          if (attachment.path) {
            attachmentPaths.push(attachment.path);
          }
        });
      }

      // Open email client using Electron
      const success = await electronBridge.openEmailClient!({
        to: recipientList,
        cc: ccList,
        subject: subject,
        body:
          options.replaceBodyWithScreenshot && screenshotPath ? "" : htmlBody,
        attachmentPaths: attachmentPaths,
      });

      if (success) {
        console.log("Successfully opened email client via Electron");
        return;
      } else {
        console.warn(
          "Failed to open email client via Electron, falling back to browser method",
        );
      }
    }

    // If we have a screenshot and want to use it, we'll need to handle it differently
    if (options.emailPreviewImage && options.embedScreenshot) {
      // For screenshot emails, we'll open a new window with the image
      // and instructions to copy/paste it into an email
      const imageUrl = URL.createObjectURL(options.emailPreviewImage);
      const win = window.open("", "_blank");
      if (win) {
        win.document.write(`
          <html>
            <head>
              <title>Email Screenshot</title>
              <style>
                body { font-family: Arial, sans-serif; background-color: #f0f0f0; margin: 0; padding: 20px; text-align: center; }
                .container { max-width: 800px; margin: 0 auto; background-color: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                h2 { color: #333; }
                .instructions { margin: 20px 0; padding: 15px; background-color: #f8f9fa; border-left: 4px solid #007bff; }
                .email-image { max-width: 100%; height: auto; border: 1px solid #ddd; margin: 20px 0; }
                .button { display: inline-block; background-color: #007bff; color: white; padding: 10px 20px; border-radius: 4px; text-decoration: none; margin: 10px; }
                .button:hover { background-color: #0069d9; }
              </style>
            </head>
            <body>
              <div class="container">
                <h2>Email Screenshot Ready</h2>
                <div class="instructions">
                  <p>1. Right-click on the image below and select "Copy Image"</p>
                  <p>2. Open your email client and paste the image into a new email</p>
                  <p>3. Add recipients and send your email</p>
                </div>
                <img src="${imageUrl}" alt="Email Preview" class="email-image" />
                <div>
                  <a href="ms-outlook:compose?subject=${encodeURIComponent(subject)}" class="button">Open Outlook</a>
                  <button onclick="window.close()" class="button">Close Window</button>
                </div>
              </div>
            </body>
          </html>
        `);
      }
      return;
    }

    // Use desktop Outlook application protocol
    let outlookUrl = `ms-outlook:compose?subject=${encodeURIComponent(subject)}`;

    // Add recipients if available
    if (recipientList) {
      outlookUrl += `&to=${encodeURIComponent(recipientList)}`;
    }

    // Add CC recipients if available
    if (ccList) {
      outlookUrl += `&cc=${encodeURIComponent(ccList)}`;
    }

    // Add HTML body
    outlookUrl += `&body=${encodeURIComponent(htmlBody)}`;

    // Open Outlook with the composed email
    window.location.href = outlookUrl;

    // If there are attachments, show instructions to the user
    if (options.fileAttachments && options.fileAttachments.length > 0) {
      setTimeout(() => {
        alert(
          `Please manually attach the ${options.fileAttachments?.length} file(s) to your email.\n\nThe email draft has been opened in Outlook.`,
        );
      }, 1000);
    }

    // Create a backup method using the clipboard for HTML content
    setTimeout(() => {
      try {
        // Copy the HTML to clipboard for pasting
        const tempElement = document.createElement("div");
        tempElement.innerHTML = htmlBody;
        document.body.appendChild(tempElement);

        const selection = window.getSelection();
        if (selection) {
          const range = document.createRange();
          range.selectNodeContents(tempElement);
          selection.removeAllRanges();
          selection.addRange(range);
          document.execCommand("copy");
          selection.removeAllRanges();
        }
        document.body.removeChild(tempElement);

        console.log("HTML content copied to clipboard as backup");
      } catch (clipboardError) {
        console.error("Failed to copy HTML to clipboard:", clipboardError);
      }
    }, 1500);
  } catch (error) {
    console.error("Error creating Outlook email:", error);
    // Fallback to basic mailto
    const plainTextContent = generateEmailContent(
      selectedSurveyIds,
      surveysToUse,
      wellInfoData,
      witsData,
      options.includeCurveData,
      options.includeTargetLineStatus,
      options.targetLineData,
      options.includeGammaPlot,
      options.includeSurveyAnalytics,
      options.includeFullSurveyData,
    );
    const subject = `MWD Survey Report - ${wellInfoData.wellName || "Unknown"} - ${new Date().toLocaleDateString()}`;
    const mailtoUrl = createMailtoUrl(
      plainTextContent,
      subject,
      options.recipients?.join(";") || "",
    );
    window.location.href = mailtoUrl;
  }
};
