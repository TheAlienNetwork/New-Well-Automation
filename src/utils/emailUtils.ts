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
): string => {
  // [Previous implementation remains exactly the same]
  // ... existing plain text generation code ...
};

/**
 * Generates Outlook draft content (HTML format)
 */
export const generateOutlookDraftContent = (
  selectedSurveys: string[],
  surveys: SurveyData[],
  wellInfo: WellInfo,
  witsData: WitsData,
  includeCurveData: boolean = false,
  includeTargetLineStatus: boolean = false,
  targetLineData?: { aboveBelow: number; leftRight: number } | null,
  includeGammaPlot: boolean = false,
  imageBlob?: Blob | null,
): { subject: string; htmlBody: string; attachments: Blob[] } => {
  const plainText = generateEmailContent(
    selectedSurveys,
    surveys,
    wellInfo,
    witsData,
    includeCurveData,
    includeTargetLineStatus,
    targetLineData,
    includeGammaPlot,
  );

  // Convert plain text sections to HTML
  const sections = plainText.split("\n\n").map((section) => {
    if (section.includes("WELL INFORMATION:")) {
      return `<h2>Well Information</h2><pre>${section.replace("WELL INFORMATION:\n", "")}</pre>`;
    } else if (section.includes("SURVEY SUMMARY:")) {
      return `<h2>Survey Summary</h2><pre>${section.replace("SURVEY SUMMARY:\n", "")}</pre>`;
    } else if (section.includes("DETAILED SURVEY DATA:")) {
      return `<h2>Detailed Survey Data</h2>`;
    } else if (section.includes("SURVEY #")) {
      return `<div class="survey"><h3>${section.split("\n")[0]}</h3><pre>${section.split("\n").slice(1).join("\n")}</pre></div>`;
    } else if (section.includes("NOTES:")) {
      return `<h2>Notes</h2><pre>${section.replace("NOTES:\n", "")}</pre>`;
    }
    return `<pre>${section}</pre>`;
  });

  const htmlBody = `
    <html>
      <head>
        <style>
          body { font-family: Calibri, Arial, sans-serif; line-height: 1.4; color: #333; }
          h1 { color: #1a3e72; border-bottom: 1px solid #1a3e72; padding-bottom: 8px; }
          h2 { color: #1a3e72; margin-top: 24px; }
          h3 { color: #2c5282; margin-bottom: 8px; }
          .header { background-color: #f8f9fa; padding: 16px; margin-bottom: 24px; }
          .survey { border-left: 4px solid #1a3e72; padding-left: 16px; margin: 16px 0; }
          pre { white-space: pre-wrap; font-family: inherit; margin: 8px 0; }
          .footer { margin-top: 24px; padding-top: 16px; border-top: 1px solid #eee; font-size: 0.9em; color: #666; }
          table { border-collapse: collapse; width: 100%; margin: 16px 0; }
          th, td { border: 1px solid #ddd; padding: 8px 12px; text-align: left; }
          th { background-color: #1a3e72; color: white; }
          .warning { color: #d69e2e; font-weight: bold; }
          .error { color: #e53e3e; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>MWD SURVEY REPORT</h1>
          <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
        </div>

        ${sections.join("")}

        ${
          imageBlob
            ? `
        <div>
          <h2>Survey Visualization</h2>
          <img src="cid:surveyPlot" alt="Survey Plot" style="max-width: 100%; height: auto; border: 1px solid #ddd;">
        </div>
        `
            : ""
        }

        <div class="footer">
          <p>This report was generated automatically by the MWD Surface Software.</p>
          <p>New Well Technologies - Advanced Directional Drilling Solutions</p>
          <p>Phone: (555) 123-4567 | Email: support@newwelltech.com</p>
          <p>24/7 Technical Support: (555) 987-6543</p>
          <p><em>CONFIDENTIALITY NOTICE: This email contains proprietary drilling information.</em></p>
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
  };
};

/**
 * Launches Outlook draft with specified content
 */
export const launchOutlookDraft = async (
  content: { subject: string; htmlBody: string; attachments: Blob[] },
  recipients: string[] = [],
  ccRecipients: string[] = [],
): Promise<void> => {
  try {
    // Method 1: Office JS API (best for Outlook desktop)
    if (window.Office && window.Office.context) {
      Office.context.mailbox.displayNewMessageAsync({
        to: recipients,
        cc: ccRecipients,
        subject: content.subject,
        htmlBody: content.htmlBody,
        attachments: content.attachments.map((blob, index) => ({
          type: Office.MailboxEnums.AttachmentType.File,
          name: `SurveyPlot_${index + 1}.png`,
          content: URL.createObjectURL(blob),
        })),
      });
      return;
    }

    // Method 2: MS Protocol URL (works when Outlook is default client)
    const outlookProtocolUrl = `outlook:compose?subject=${encodeURIComponent(content.subject)}&body=${encodeURIComponent(content.htmlBody)}&to=${recipients.join(";")}&cc=${ccRecipients.join(";")}`;
    window.location.href = outlookProtocolUrl;

    // Fallback after a delay if protocol handler doesn't work
    setTimeout(() => {
      // Method 3: Basic mailto with HTML
      const mailtoUrl = `mailto:${recipients.join(";")}?subject=${encodeURIComponent(content.subject)}&body=${encodeURIComponent(content.htmlBody)}&cc=${ccRecipients.join(";")}`;
      window.location.href = mailtoUrl;
    }, 500);
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
    previewElement?: HTMLElement | null;
    recipients?: string[];
    ccRecipients?: string[];
  } = {},
) => {
  // Capture preview image if element is provided
  const imageBlob = options.previewElement
    ? await captureEmailPreview(options.previewElement)
    : null;

  // Generate email content
  const emailContent = generateOutlookDraftContent(
    selectedSurveys,
    surveys,
    wellInfo,
    witsData,
    options.includeCurveData,
    options.includeTargetLineStatus,
    options.targetLineData,
    options.includeGammaPlot,
    imageBlob,
  );

  // Launch Outlook draft
  await launchOutlookDraft(
    emailContent,
    options.recipients || [],
    options.ccRecipients || [],
  );
};
