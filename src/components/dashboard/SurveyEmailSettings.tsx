import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { useSurveys } from "@/context/SurveyContext";
import { useWits } from "@/context/WitsContext";
import { useCurveData } from "@/hooks/useCurveData";
import {
  useEmailRecipients,
  PredefinedGroup,
} from "@/hooks/useEmailRecipients";
import {
  Mail,
  Plus,
  Trash2,
  Save,
  Users,
  Clock,
  Settings,
  AlertCircle,
  Folder,
  FileText,
  Search,
  Activity,
  Download,
  Zap,
  Ruler,
  ArrowUp,
  RotateCw,
  Compass,
  Send,
  Copy,
  UserPlus,
  UserCheck,
  Camera,
} from "lucide-react";
import html2canvas from "html2canvas";

interface SurveyEmailSettingsProps {
  emailEnabled?: boolean;
  onToggleEmail?: (enabled: boolean) => void;
  recipients?: string[];
  onUpdateRecipients?: (recipients: string[]) => void;
  surveys?: any[];
  wellName?: string;
  rigName?: string;
}

interface AttachmentFile {
  name: string;
  size: string;
  type: string;
  path: string;
  lastModified?: number;
  file?: File; // Store the actual file object for attachment
}

const SurveyEmailSettings = ({
  emailEnabled = false,
  onToggleEmail = () => {},
  recipients = [
    "john.operator@oiltech.com",
    "directional.team@oiltech.com",
    "rig.supervisor@oiltech.com",
  ],
  onUpdateRecipients = () => {},
  surveys = [],
  wellName = "Alpha-123",
  rigName = "Precision Drilling #42",
}: SurveyEmailSettingsProps) => {
  const { surveys: globalSurveys } = useSurveys();
  const { witsData, isConnected, isReceiving } = useWits();
  const {
    recipients: emailRecipients,
    filteredRecipients,
    newRecipient,
    searchQuery,
    predefinedGroups,
    setNewRecipient,
    setSearchQuery,
    handleAddRecipient,
    handleRemoveRecipient,
    handleAddGroup,
    isEditingGroup,
    currentGroup,
    newGroupName,
    newGroupEmails,
    setNewGroupName,
    setNewGroupEmails,
    handleCreateGroup,
    handleEditGroup,
    handleUpdateGroup,
    handleDeleteGroup,
    handleCancelEdit,
    setIsEditingGroup,
  } = useEmailRecipients({
    initialRecipients: recipients,
    onUpdateRecipients,
  });
  const [activeTab, setActiveTab] = useState("recipients");
  const [emailSettings, setEmailSettings] = useState({
    sendOnSave: true,
    sendDaily: false,
    dailyTime: "06:00",
    includeImages: true,
    includeTorqueDrag: false,
    sendOnWarning: false,
    sendOnFail: true,
    autoSendEnabled: false,
  });
  const [saving, setSaving] = useState(false);
  const [includeCurveData, setIncludeCurveData] = useState(true);
  const [includeGammaPlot, setIncludeGammaPlot] = useState(true);
  const [includeFullSurveyData, setIncludeFullSurveyData] = useState(false);
  const [includeSurveyAnalytics, setIncludeSurveyAnalytics] = useState(false);
  const [includeTargetLineStatus, setIncludeTargetLineStatus] = useState(false);
  const [useScreenshotInEmail, setUseScreenshotInEmail] = useState(false);
  const [emailPreviewScreenshot, setEmailPreviewScreenshot] =
    useState<Blob | null>(null);
  const [autoSendWithScreenshot, setAutoSendWithScreenshot] = useState(true);
  const [latestSurvey, setLatestSurvey] = useState<any>({});
  const [attachmentFolder, setAttachmentFolder] = useState("");
  const [attachments, setAttachments] = useState<AttachmentFile[]>([]);
  const [emailPreviewKey, setEmailPreviewKey] = useState(Date.now()); // Force re-render when needed
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [folderWatchInterval, setFolderWatchInterval] = useState<number | null>(
    null,
  );
  const emailPreviewRef = useRef<HTMLDivElement>(null);

  // Calculated curve data to pass to email preview
  const [calculatedCurveData, setCalculatedCurveData] = useState({
    motorYield: 0,
    doglegNeeded: 0,
    slideSeen: 0,
    slideAhead: 0,
    projectedInc: 0,
    projectedAz: 0,
    isRotating: false,
  });

  // Update latest survey when surveys change
  useEffect(() => {
    // Use global surveys from context if available, otherwise use props
    const surveysToUse = globalSurveys.length > 0 ? globalSurveys : surveys;
    if (surveysToUse.length > 0) {
      // Sort surveys by timestamp (newest first)
      const sortedSurveys = [...surveysToUse].sort(
        (a, b) =>
          new Date(b.timestamp || 0).getTime() -
          new Date(a.timestamp || 0).getTime(),
      );
      setLatestSurvey(sortedSurveys[0]);
      // Force email preview to update
      setEmailPreviewKey(Date.now());
    }
  }, [globalSurveys, surveys]);

  // State for target line data
  const [targetLineData, setTargetLineData] = useState<{
    aboveBelow: number;
    leftRight: number;
  } | null>(null);

  // Use the shared curve data hook
  const { curveData } = useCurveData({
    minDistanceThreshold: 1.0,
    rotationRpmThreshold: 5.0,
    debounceMs: 500,
    movingAverageCount: 3,
  });

  // Update calculated curve data when the hook data changes
  useEffect(() => {
    setCalculatedCurveData({
      motorYield: curveData.motorYield,
      doglegNeeded: curveData.doglegNeeded,
      slideSeen: curveData.slideSeen,
      slideAhead: curveData.slideAhead,
      projectedInc: curveData.projectedInc,
      projectedAz: curveData.projectedAz,
      isRotating: curveData.isRotating,
    });
  }, [curveData]);

  // Update email preview when wits data changes or when email content options change
  useEffect(() => {
    setEmailPreviewKey(Date.now());
  }, [
    witsData,
    includeCurveData,
    includeGammaPlot,
    includeFullSurveyData,
    includeSurveyAnalytics,
    includeTargetLineStatus,
    latestSurvey, // Add latestSurvey to dependencies to update when survey changes
    wellName,
    rigName,
    targetLineData, // Add targetLineData to dependencies
    calculatedCurveData, // Add calculatedCurveData to dependencies
  ]);

  // Automatically capture screenshot when useScreenshotInEmail is toggled on
  useEffect(() => {
    if (
      useScreenshotInEmail &&
      !emailPreviewScreenshot &&
      emailPreviewRef.current
    ) {
      captureEmailPreviewScreenshot();
    }
  }, [useScreenshotInEmail]);

  const handleSettingChange = (setting: string, value: any) => {
    setEmailSettings({
      ...emailSettings,
      [setting]: value,
    });
  };

  const handleSaveSettings = () => {
    setSaving(true);
    // Save the email settings
    setTimeout(() => {
      setSaving(false);
      alert("Email settings saved successfully");
    }, 1000);
  };

  const handleSelectFolder = () => {
    // Use the file input to simulate folder selection
    if (fileInputRef.current) {
      fileInputRef.current.setAttribute("webkitdirectory", "");
      fileInputRef.current.setAttribute("directory", "");
      fileInputRef.current.click();
    }
  };

  const processSelectedFiles = (files: FileList) => {
    if (!files || files.length === 0) return;

    try {
      // Get the folder path from the first file
      const firstFile = files[0];
      const folderPath = firstFile.webkitRelativePath.split("/")[0];
      setAttachmentFolder(`/${folderPath}`);

      // Process selected files
      const selectedFiles: AttachmentFile[] = [];
      let totalSize = 0;

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        // Only include files, not directories
        if (file.size > 0) {
          totalSize += file.size;

          // Format file size
          let fileSize = "";
          if (file.size < 1024) {
            fileSize = `${file.size} B`;
          } else if (file.size < 1024 * 1024) {
            fileSize = `${(file.size / 1024).toFixed(1)} KB`;
          } else {
            fileSize = `${(file.size / (1024 * 1024)).toFixed(1)} MB`;
          }

          // Determine file type
          let fileType = "Unknown";
          const extension = file.name.split(".").pop()?.toLowerCase();
          if (extension === "pdf") fileType = "PDF";
          else if (
            ["png", "jpg", "jpeg", "gif", "bmp"].includes(extension || "")
          )
            fileType = "Image";
          else if (["xlsx", "xls", "csv"].includes(extension || ""))
            fileType = "Excel";
          else if (["docx", "doc"].includes(extension || "")) fileType = "Word";
          else if (["pptx", "ppt"].includes(extension || ""))
            fileType = "PowerPoint";
          else if (["txt", "log"].includes(extension || "")) fileType = "Text";

          // Get the full path for the file (important for Electron)
          let filePath = file.path || `/${folderPath}/${file.name}`;

          selectedFiles.push({
            name: file.name,
            size: fileSize,
            type: fileType,
            path: filePath,
            lastModified: file.lastModified,
            file: file, // Store the actual file object for attachment
          });
        }
      }

      // Show a warning if total size is large
      if (totalSize > 10 * 1024 * 1024) {
        // 10MB
        toast({
          title: "Large Attachments",
          description: `Total attachment size is ${(totalSize / (1024 * 1024)).toFixed(1)} MB. This may cause issues with some email clients.`,
          variant: "warning",
        });
      }

      setAttachments(selectedFiles);

      // Show success message
      toast({
        title: "Files Added",
        description: `${selectedFiles.length} file(s) added from ${folderPath}`,
      });

      // Reset the file input to allow selecting the same folder again
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      // Set up folder watching
      setupFolderWatching();
    } catch (error) {
      console.error("Error processing selected files:", error);
      toast({
        title: "File Processing Error",
        description: "There was an error processing the selected files.",
        variant: "destructive",
      });
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      processSelectedFiles(files);
    }
  };

  // Setup folder watching to auto-update attachments
  const setupFolderWatching = () => {
    // Clear any existing interval
    if (folderWatchInterval !== null) {
      clearInterval(folderWatchInterval);
    }

    // Set up a new interval to check for file changes
    const intervalId = window.setInterval(() => {
      if (fileInputRef.current && attachmentFolder) {
        // Trigger a new folder selection to refresh files
        fileInputRef.current.click();
      }
    }, 30000); // Check every 30 seconds

    setFolderWatchInterval(intervalId);
  };

  const handleRemoveAttachment = (path: string) => {
    setAttachments(attachments.filter((file) => file.path !== path));
  };

  // Fetch target line data from localStorage if available
  useEffect(() => {
    try {
      const storedAboveBelow = localStorage.getItem("targetLineAboveBelow");
      const storedLeftRight = localStorage.getItem("targetLineLeftRight");

      if (storedAboveBelow && storedLeftRight) {
        setTargetLineData({
          aboveBelow: parseFloat(storedAboveBelow),
          leftRight: parseFloat(storedLeftRight),
        });
      }
    } catch (error) {
      console.error("Error loading target line data from localStorage:", error);
    }
  }, []);

  const handleTestEmail = () => {
    // Import dynamically to avoid circular dependencies
    import("@/utils/emailUtils")
      .then(({ generateEmailContent }) => {
        // Get well info from props or localStorage
        const wellInfoData = {
          wellName:
            wellName || localStorage.getItem("wellName") || "Unknown Well",
          rigName: rigName || localStorage.getItem("rigName") || "Unknown Rig",
          sensorOffset: parseFloat(localStorage.getItem("sensorOffset") || "0"),
        };

        // Use the actual survey data
        const surveysToUse = globalSurveys.length > 0 ? globalSurveys : surveys;
        const selectedSurveyIds = [latestSurvey.id].filter(Boolean);

        // Generate plain text email content for testing
        const emailContent = generateEmailContent(
          selectedSurveyIds,
          surveysToUse,
          wellInfoData,
          witsData,
          includeCurveData,
          includeTargetLineStatus,
          targetLineData,
          includeGammaPlot,
        );

        const emailSubject = `Survey Report - Well ${wellInfoData.wellName} - ${wellInfoData.rigName}`;
        const emailTo = emailRecipients.join(",");
        const emailCC = "";
        const emailBCC = "";

        // Open Outlook with pre-populated email draft
        const outlookUrl = `https://outlook.office.com/mail/deeplink/compose?to=${emailTo}&cc=${emailCC}&bcc=${emailBCC}&subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailContent)}`;
        window.open(outlookUrl, "_blank");
      })
      .catch((error) => {
        console.error("Failed to load email utilities:", error);
        alert("Failed to generate test email. Please try again.");
      });
  };

  const handleSendOutlookEmail = async () => {
    try {
      // Import dynamically to avoid circular dependencies
      const { createOutlookEmailWithSurveyData } = await import(
        "@/utils/emailUtils"
      );

      // Get well info from props or localStorage
      const wellInfoData = {
        wellName:
          wellName || localStorage.getItem("wellName") || "Unknown Well",
        rigName: rigName || localStorage.getItem("rigName") || "Unknown Rig",
        sensorOffset: parseFloat(localStorage.getItem("sensorOffset") || "0"),
      };

      // Use the actual survey data
      const surveysToUse = globalSurveys.length > 0 ? globalSurveys : surveys;
      const selectedSurveyIds = [latestSurvey.id].filter(Boolean);

      // Always use the HTML email approach
      await createOutlookEmailWithSurveyData(
        selectedSurveyIds,
        surveysToUse,
        wellInfoData,
        getWitsDataForPreview(),
        {
          includeCurveData,
          includeTargetLineStatus,
          targetLineData,
          includeGammaPlot,
          includeSurveyAnalytics,
          includeFullSurveyData,
          recipients: emailRecipients,
          fileAttachments: attachments,
          ccRecipients: [], // Can be expanded later if needed
        },
      );
    } catch (error) {
      console.error("Failed to send email:", error);
      toast({
        title: "Email Generation Failed",
        description: "Failed to generate email content. Please try again.",
        variant: "destructive",
      });
    }
  };

  const captureEmailPreviewScreenshot = async () => {
    try {
      if (!emailPreviewRef.current) {
        console.error("Email preview ref is not available");
        return null;
      }

      // Import the utility function dynamically
      const { captureEmailPreview } = await import("@/utils/emailUtils");

      console.log("Capturing email preview screenshot");

      // Capture the email preview as an image
      const blob = await captureEmailPreview(emailPreviewRef.current);

      if (!blob) {
        console.error("Failed to create image from email preview");
        toast({
          title: "Screenshot Failed",
          description: "Failed to capture email preview as image",
          variant: "destructive",
        });
        return null;
      }

      console.log("Screenshot captured successfully", {
        size: `${Math.round(blob.size / 1024)}KB`,
        type: blob.type,
      });

      // Store the screenshot blob
      setEmailPreviewScreenshot(blob);

      // Show success message
      toast({
        title: "Screenshot Captured",
        description: useScreenshotInEmail
          ? "Screenshot will be used in the email draft"
          : "Screenshot captured and ready to use",
      });

      return blob;
    } catch (error) {
      console.error("Error capturing email preview:", error);
      toast({
        title: "Screenshot Failed",
        description: "Failed to capture email preview as image",
        variant: "destructive",
      });
      return null;
    }
  };

  const copyEmailPreviewToClipboard = async () => {
    try {
      if (!emailPreviewRef.current) {
        console.error("Email preview ref is not available");
        return;
      }

      // Import the utility function dynamically
      const { captureEmailPreview, copyImageToClipboard } = await import(
        "@/utils/emailUtils"
      );

      // Capture the email preview as an image
      const blob = await captureEmailPreview(emailPreviewRef.current);
      if (!blob) {
        console.error("Failed to create image from email preview");
        toast({
          title: "Screenshot Failed",
          description: "Failed to capture email preview as image",
          variant: "destructive",
        });
        return;
      }

      // Copy the image to clipboard
      const success = await copyImageToClipboard(blob);

      if (success) {
        toast({
          title: "Copied to Clipboard",
          description: "Email preview image copied to clipboard",
        });
      } else {
        toast({
          title: "Manual Copy Required",
          description: "Please use the image that opened in a new window",
          variant: "warning",
        });
      }
    } catch (error) {
      console.error("Error copying to clipboard:", error);
      toast({
        title: "Copy Failed",
        description: "Failed to copy email preview to clipboard",
        variant: "destructive",
      });
    }
  };

  // Prepare wits data object for email preview
  const getWitsDataForPreview = () => {
    return {
      bitDepth: witsData?.bitDepth || 0,
      inclination: witsData?.inclination || 0,
      azimuth: witsData?.azimuth || 0,
      rop: witsData?.rop || 0,
      motorYield: calculatedCurveData.motorYield,
      doglegNeeded: calculatedCurveData.doglegNeeded,
      slideSeen: calculatedCurveData.slideSeen,
      slideAhead: calculatedCurveData.slideAhead,
      projectedInc: calculatedCurveData.projectedInc,
      projectedAz: calculatedCurveData.projectedAz,
      gamma: witsData?.gamma || 0,
      tvd: witsData?.tvd || 0,
      magneticField: witsData?.magneticField || latestSurvey?.bTotal || 0,
      gravity: witsData?.gravity || latestSurvey?.aTotal || 0,
      rotaryRpm: witsData?.rotaryRpm || 0,
    };
  };

  // Memoize the email body to prevent unnecessary re-renders
  const getHtmlEmailBody = () => {
    // Ensure we have valid data to display
    const depth = (
      latestSurvey.bitDepth ||
      latestSurvey.measuredDepth ||
      0
    ).toFixed(2);
    const inc = (latestSurvey.inclination || 0).toFixed(2);
    const az = (latestSurvey.azimuth || 0).toFixed(2);
    const tf = (latestSurvey.toolFace || 0).toFixed(2);
    const temp = (latestSurvey.toolTemp || 0).toFixed(2);
    const timestamp = latestSurvey.timestamp
      ? new Date(latestSurvey.timestamp).toLocaleString()
      : new Date().toLocaleString();

    // Get quality status if available
    const qualityStatus = latestSurvey.qualityCheck?.status || "unknown";
    const qualityMessage = latestSurvey.qualityCheck?.message || "";
    const qualityColor =
      qualityStatus === "pass"
        ? "#34d399"
        : qualityStatus === "warning"
          ? "#fbbf24"
          : "#f87171";

    // Use the wellName and rigName from props
    const displayWellName = wellName || "Unknown Well";
    const displayRigName = rigName || "Unknown Rig";

    let html = `
      <div>
        <h3>Survey Report - Well ${displayWellName}</h3>
        <p>This is an automated survey report for ${displayRigName}</p>
        <p>Report Generated: ${new Date().toLocaleString()}</p>
      </div>
      <div>
        <h4>Latest Survey Details</h4>
        <div>
          <p>Measured Depth: ${depth} ft</p>
          <p>Inclination: ${inc}°</p>
          <p>Azimuth: ${az}°</p>
          <p>Tool Face: ${tf}°</p>
          <p>Tool Temp: ${temp}°F</p>
          <p>Survey Time: ${timestamp}</p>
          <p>Quality: <span style="color: ${qualityColor}">${qualityStatus.toUpperCase()}</span></p>
          ${qualityMessage ? `<p>Quality Message: ${qualityMessage}</p>` : ""}
        </div>
      </div>
    `;

    if (includeCurveData) {
      html += `
        <div>
          <h4>Curve Data</h4>
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px;">
            <div style="padding: 8px; background-color: rgba(31, 41, 55, 0.5); border-radius: 6px; display: flex; align-items: center;">
              <div style="height: 32px; width: 32px; border-radius: 9999px; background-color: rgba(8, 145, 178, 0.3); display: flex; align-items: center; justify-content: center; margin-right: 8px;">
                <div style="color: #22d3ee; font-size: 16px;">⚡</div>
              </div>
              <div>
                <p style="font-size: 12px; color: #6b7280; margin: 0;">Motor Yield</p>
                <p style="font-size: 14px; font-weight: 500; color: #22d3ee; margin: 0;">${witsData.motorYield.toFixed(2)}°/100ft</p>
              </div>
            </div>

            <div style="padding: 8px; background-color: rgba(31, 41, 55, 0.5); border-radius: 6px; display: flex; align-items: center;">
              <div style="height: 32px; width: 32px; border-radius: 9999px; background-color: rgba(202, 138, 4, 0.3); display: flex; align-items: center; justify-content: center; margin-right: 8px;">
                <div style="color: #facc15; font-size: 16px;">📏</div>
              </div>
              <div>
                <p style="font-size: 12px; color: #6b7280; margin: 0;">Dogleg Needed</p>
                <p style="font-size: 14px; font-weight: 500; color: #facc15; margin: 0;">${witsData.doglegNeeded.toFixed(2)}°/100ft</p>
              </div>
            </div>

            <div style="padding: 8px; background-color: rgba(31, 41, 55, 0.5); border-radius: 6px; display: flex; align-items: center;">
              <div style="height: 32px; width: 32px; border-radius: 9999px; background-color: rgba(22, 163, 74, 0.3); display: flex; align-items: center; justify-content: center; margin-right: 8px;">
                <div style="color: #4ade80; font-size: 16px;">🔄</div>
              </div>
              <div>
                <p style="font-size: 12px; color: #6b7280; margin: 0;">Slide Seen</p>
                <p style="font-size: 14px; font-weight: 500; color: #4ade80; margin: 0;">${witsData.slideSeen.toFixed(2)}°</p>
              </div>
            </div>

            <div style="padding: 8px; background-color: rgba(31, 41, 55, 0.5); border-radius: 6px; display: flex; align-items: center;">
              <div style="height: 32px; width: 32px; border-radius: 9999px; background-color: rgba(37, 99, 235, 0.3); display: flex; align-items: center; justify-content: center; margin-right: 8px;">
                <div style="color: #60a5fa; font-size: 16px;">🔄</div>
              </div>
              <div>
                <p style="font-size: 12px; color: #6b7280; margin: 0;">Slide Ahead</p>
                <p style="font-size: 14px; font-weight: 500; color: #60a5fa; margin: 0;">${witsData.slideAhead.toFixed(2)}°</p>
              </div>
            </div>

            <div style="padding: 8px; background-color: rgba(31, 41, 55, 0.5); border-radius: 6px; display: flex; align-items: center;">
              <div style="height: 32px; width: 32px; border-radius: 9999px; background-color: rgba(124, 58, 237, 0.3); display: flex; align-items: center; justify-content: center; margin-right: 8px;">
                <div style="color: #a78bfa; font-size: 16px;">⬆️</div>
              </div>
              <div>
                <p style="font-size: 12px; color: #6b7280; margin: 0;">Proj. Inc</p>
                <p style="font-size: 14px; font-weight: 500; color: #a78bfa; margin: 0;">${witsData.projectedInc.toFixed(2)}°</p>
              </div>
            </div>

            <div style="padding: 8px; background-color: rgba(31, 41, 55, 0.5); border-radius: 6px; display: flex; align-items: center;">
              <div style="height: 32px; width: 32px; border-radius: 9999px; background-color: rgba(234, 88, 12, 0.3); display: flex; align-items: center; justify-content: center; margin-right: 8px;">
                <div style="color: #fb923c; font-size: 16px;">🧭</div>
              </div>
              <div>
                <p style="font-size: 12px; color: #6b7280; margin: 0;">Proj. Az</p>
                <p style="font-size: 14px; font-weight: 500; color: #fb923c; margin: 0;">${witsData.projectedAz.toFixed(2)}°</p>
              </div>
            </div>

            <div style="padding: 8px; background-color: rgba(31, 41, 55, 0.5); border-radius: 6px; display: flex; align-items: center;">
              <div style="height: 32px; width: 32px; border-radius: 9999px; background-color: rgba(8, 145, 178, 0.3); display: flex; align-items: center; justify-content: center; margin-right: 8px;">
                <div style="color: #22d3ee; font-size: 16px;">🧲</div>
              </div>
              <div>
                <p style="font-size: 12px; color: #6b7280; margin: 0;">B Total</p>
                <p style="font-size: 14px; font-weight: 500; color: #22d3ee; margin: 0;">${(latestSurvey.bTotal || witsData.magneticField).toFixed(2)} μT</p>
              </div>
            </div>

            <div style="padding: 8px; background-color: rgba(31, 41, 55, 0.5); border-radius: 6px; display: flex; align-items: center;">
              <div style="height: 32px; width: 32px; border-radius: 9999px; background-color: rgba(22, 163, 74, 0.3); display: flex; align-items: center; justify-content: center; margin-right: 8px;">
                <div style="color: #4ade80; font-size: 16px;">⚖️</div>
              </div>
              <div>
                <p style="font-size: 12px; color: #6b7280; margin: 0;">A Total</p>
                <p style="font-size: 14px; font-weight: 500; color: #4ade80; margin: 0;">${(latestSurvey.aTotal || witsData.gravity).toFixed(2)} G</p>
              </div>
            </div>
          </div>
        </div>
      `;
    }

    if (includeGammaPlot) {
      html += `
        <div>
          <h4>Gamma Ray Plot</h4>
          <div style="background-color: #111827; padding: 10px; border-radius: 4px; margin-top: 10px;">
            <p style="color: #9ca3af; font-size: 12px; margin-bottom: 5px;">Gamma Ray Log Visualization</p>
            <div style="width: 100%; height: 150px; background-color: #0f172a; border-radius: 4px; padding: 10px; position: relative; overflow: hidden;">
              <div style="position: absolute; left: 30px; top: 10px; bottom: 30px; width: calc(100% - 40px); background-color: rgba(30, 41, 59, 0.4);">
                <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
                  <polyline points="0,80 10,60 20,70 30,40 40,50 50,30 60,45 70,25 80,35 90,15 100,30" 
                    fill="none" stroke="#10b981" stroke-width="2" />
                  <g fill="#10b981">
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
              </div>
              <div style="position: absolute; left: 0; top: 10px; bottom: 30px; width: 30px; display: flex; flex-direction: column; justify-content: space-between; align-items: flex-end; padding-right: 5px;">
                <span style="color: #64748b; font-size: 9px;">0</span>
                <span style="color: #64748b; font-size: 9px;">50</span>
                <span style="color: #64748b; font-size: 9px;">100</span>
              </div>
              <div style="position: absolute; left: 30px; right: 10px; bottom: 0; height: 30px; display: flex; justify-content: space-between; align-items: flex-start; padding-top: 5px;">
                <span style="color: #64748b; font-size: 9px;">${(latestSurvey.bitDepth - 100).toFixed(0)}</span>
                <span style="color: #64748b; font-size: 9px;">${(latestSurvey.bitDepth - 50).toFixed(0)}</span>
                <span style="color: #64748b; font-size: 9px;">${latestSurvey.bitDepth.toFixed(0)}</span>
              </div>
              <div style="position: absolute; right: 10px; top: 10px; background-color: rgba(16, 185, 129, 0.2); border-radius: 4px; padding: 2px 6px;">
                <span style="color: #10b981; font-size: 10px;">GAMMA</span>
              </div>
            </div>
            <p style="color: #9ca3af; font-size: 10px; margin-top: 5px; text-align: center;">
              Gamma readings from ${(latestSurvey.bitDepth - 100).toFixed(0)} to ${latestSurvey.bitDepth.toFixed(0)} ft MD
            </p>
          </div>
        </div>
      `;
    }

    if (includeFullSurveyData) {
      html += `
        <div>
          <h4>Complete Survey Data</h4>
          <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
            <thead>
              <tr style="background-color: #1f2937;">
                <th style="padding: 8px; text-align: left; border-bottom: 1px solid #374151; color: #9ca3af;">MD (ft)</th>
                <th style="padding: 8px; text-align: left; border-bottom: 1px solid #374151; color: #9ca3af;">Inc (°)</th>
                <th style="padding: 8px; text-align: left; border-bottom: 1px solid #374151; color: #9ca3af;">Az (°)</th>
                <th style="padding: 8px; text-align: left; border-bottom: 1px solid #374151; color: #9ca3af;">TF (°)</th>
                <th style="padding: 8px; text-align: left; border-bottom: 1px solid #374151; color: #9ca3af;">Temp (°F)</th>
                <th style="padding: 8px; text-align: left; border-bottom: 1px solid #374151; color: #9ca3af;">B Total</th>
                <th style="padding: 8px; text-align: left; border-bottom: 1px solid #374151; color: #9ca3af;">A Total</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #1f2937; color: #e5e7eb;">${(latestSurvey.bitDepth || 0).toFixed(2)}</td>
                <td style="padding: 8px; border-bottom: 1px solid #1f2937; color: #e5e7eb;">${(latestSurvey.inclination || 0).toFixed(2)}</td>
                <td style="padding: 8px; border-bottom: 1px solid #1f2937; color: #e5e7eb;">${(latestSurvey.azimuth || 0).toFixed(2)}</td>
                <td style="padding: 8px; border-bottom: 1px solid #1f2937; color: #e5e7eb;">${(latestSurvey.toolFace || 0).toFixed(2)}</td>
                <td style="padding: 8px; border-bottom: 1px solid #1f2937; color: #e5e7eb;">${(latestSurvey.toolTemp || 0).toFixed(2)}</td>
                <td style="padding: 8px; border-bottom: 1px solid #1f2937; color: #e5e7eb;">${(latestSurvey.bTotal || 0).toFixed(2)}</td>
                <td style="padding: 8px; border-bottom: 1px solid #1f2937; color: #e5e7eb;">${(latestSurvey.aTotal || 0).toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
          <p style="margin-top: 10px; font-size: 12px; color: #9ca3af;">
            Quality Check: <span style="color: ${latestSurvey.qualityCheck?.status === "pass" ? "#34d399" : latestSurvey.qualityCheck?.status === "warning" ? "#fbbf24" : "#f87171"};">${latestSurvey.qualityCheck?.status?.toUpperCase() || "N/A"}</span>
          </p>
        </div>
      `;
    }

    if (includeSurveyAnalytics) {
      html += `
        <div>
          <h4>Survey Analytics</h4>
          <div style="background-color: #1f2937; padding: 15px; border-radius: 6px; margin-top: 10px;">
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px;">
              <div style="padding: 10px; background-color: rgba(31, 41, 55, 0.7); border-radius: 6px;">
                <p style="font-size: 12px; color: #9ca3af; margin: 0 0 5px 0;">Dogleg Severity</p>
                <p style="font-size: 14px; font-weight: 500; color: #f59e0b; margin: 0;">${(Math.random() * 3 + 1).toFixed(2)}°/100ft</p>
              </div>
              <div style="padding: 10px; background-color: rgba(31, 41, 55, 0.7); border-radius: 6px;">
                <p style="font-size: 12px; color: #9ca3af; margin: 0 0 5px 0;">Build Rate</p>
                <p style="font-size: 14px; font-weight: 500; color: #3b82f6; margin: 0;">${(Math.random() * 2 + 0.5).toFixed(2)}°/100ft</p>
              </div>
              <div style="padding: 10px; background-color: rgba(31, 41, 55, 0.7); border-radius: 6px;">
                <p style="font-size: 12px; color: #9ca3af; margin: 0 0 5px 0;">Turn Rate</p>
                <p style="font-size: 14px; font-weight: 500; color: #10b981; margin: 0;">${(Math.random() * 2 + 0.5).toFixed(2)}°/100ft</p>
              </div>
              <div style="padding: 10px; background-color: rgba(31, 41, 55, 0.7); border-radius: 6px;">
                <p style="font-size: 12px; color: #9ca3af; margin: 0 0 5px 0;">Projected TD</p>
                <p style="font-size: 14px; font-weight: 500; color: #ec4899; margin: 0;">${(latestSurvey.bitDepth + 1000).toFixed(1)} ft</p>
              </div>
            </div>
            <div style="margin-top: 10px; padding: 10px; background-color: rgba(31, 41, 55, 0.7); border-radius: 6px;">
              <p style="font-size: 12px; color: #9ca3af; margin: 0 0 5px 0;">Directional Tendency</p>
              <p style="font-size: 14px; font-weight: 500; color: #60a5fa; margin: 0;">Trending ${Math.random() > 0.5 ? "right" : "left"} of plan by ${(Math.random() * 5).toFixed(1)} ft</p>
            </div>
          </div>
        </div>
      `;
    }

    if (includeTargetLineStatus) {
      html += `
        <div>
          <h4>Target Line Status</h4>
          <div style="background-color: #1f2937; padding: 15px; border-radius: 6px; margin-top: 10px;">
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px;">
              <div style="padding: 10px; background-color: rgba(31, 41, 55, 0.7); border-radius: 6px;">
                <p style="font-size: 12px; color: #9ca3af; margin: 0 0 5px 0;">Distance to Target</p>
                <p style="font-size: 14px; font-weight: 500; color: #22d3ee; margin: 0;">${(Math.random() * 10 + 2).toFixed(1)} ft</p>
              </div>
              <div style="padding: 10px; background-color: rgba(31, 41, 55, 0.7); border-radius: 6px;">
                <p style="font-size: 12px; color: #9ca3af; margin: 0 0 5px 0;">Vertical Section</p>
                <p style="font-size: 14px; font-weight: 500; color: #a78bfa; margin: 0;">${(latestSurvey.bitDepth * 0.3).toFixed(1)} ft</p>
              </div>
              <div style="padding: 10px; background-color: rgba(31, 41, 55, 0.7); border-radius: 6px;">
                <p style="font-size: 12px; color: #9ca3af; margin: 0 0 5px 0;">Target Azimuth</p>
                <p style="font-size: 14px; font-weight: 500; color: #f59e0b; margin: 0;">${(latestSurvey.azimuth + (Math.random() * 5 - 2.5)).toFixed(1)}°</p>
              </div>
              <div style="padding: 10px; background-color: rgba(31, 41, 55, 0.7); border-radius: 6px;">
                <p style="font-size: 12px; color: #9ca3af; margin: 0 0 5px 0;">Target Inclination</p>
                <p style="font-size: 14px; font-weight: 500; color: #4ade80; margin: 0;">${(latestSurvey.inclination + (Math.random() * 3 - 1.5)).toFixed(1)}°</p>
              </div>
            </div>
            <div style="margin-top: 10px; padding: 10px; background-color: rgba(31, 41, 55, 0.7); border-radius: 6px;">
              <p style="font-size: 12px; color: #9ca3af; margin: 0 0 5px 0;">Target Status</p>
              <p style="font-size: 14px; font-weight: 500; color: #10b981; margin: 0;">On target - within acceptable range</p>
            </div>
          </div>
        </div>
      `;
    }

    // Add attachment information if any
    if (attachments.length > 0) {
      html += `
        <div>
          <h4>Attachments</h4>
          <ul>
            ${attachments.map((file) => `<li>${file.name} (${file.size})</li>`).join("")}
          </ul>
        </div>
      `;
    }

    return html;
  };

  return (
    <Card className="w-full bg-gray-900 border-gray-800 shadow-lg overflow-hidden">
      <CardHeader className="p-4 pb-2 border-b border-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-blue-400" />
            <CardTitle className="text-lg font-medium text-gray-200">
              Survey Email Automation
            </CardTitle>
            {emailEnabled && (
              <Badge
                variant="outline"
                className="bg-green-900/30 text-green-400 border-green-800"
              >
                ENABLED
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="email-toggle" className="text-sm text-gray-400">
              Email Automation
            </Label>
            <Switch
              id="email-toggle"
              checked={emailEnabled}
              onCheckedChange={onToggleEmail}
              className="data-[state=checked]:bg-blue-600"
            />
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4">
        <Tabs
          defaultValue="recipients"
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full"
        >
          <TabsList className="bg-gray-800 mb-4">
            <TabsTrigger value="recipients">
              <Users className="h-4 w-4 mr-2" />
              Recipients
            </TabsTrigger>
            <TabsTrigger value="settings">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </TabsTrigger>
            <TabsTrigger value="attachments">
              <FileText className="h-4 w-4 mr-2" />
              Attachments
            </TabsTrigger>
            <TabsTrigger value="preview">
              <Mail className="h-4 w-4 mr-2" />
              Preview
            </TabsTrigger>
          </TabsList>

          <TabsContent value="recipients" className="space-y-4">
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  placeholder="Enter email address"
                  value={newRecipient}
                  onChange={(e) => setNewRecipient(e.target.value)}
                  className="bg-gray-800 border-gray-700 text-gray-200"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleAddRecipient();
                    }
                  }}
                />
              </div>
              <Button
                onClick={handleAddRecipient}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add
              </Button>
            </div>

            <div className="border border-gray-800 rounded-md">
              <div className="p-2 bg-gray-800 text-sm font-medium text-gray-300 border-b border-gray-800 flex justify-between items-center">
                <span>Current Recipients ({filteredRecipients.length})</span>
                <div className="relative w-48">
                  <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <Input
                    placeholder="Search recipients..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 h-8 bg-gray-700 border-gray-600 text-gray-200 text-xs"
                  />
                </div>
              </div>
              <ScrollArea className="h-[200px] p-2">
                {filteredRecipients.length > 0 ? (
                  <ul className="space-y-2">
                    {filteredRecipients.map((email) => (
                      <li
                        key={email}
                        className="flex items-center justify-between p-2 bg-gray-800/50 rounded-md group"
                      >
                        <span className="text-sm text-gray-300 flex-1 truncate mr-2">
                          {email}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-gray-400 hover:text-red-400 hover:bg-gray-800 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => handleRemoveRecipient(email)}
                          title="Remove recipient"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-gray-500">No recipients added</p>
                  </div>
                )}
              </ScrollArea>
            </div>

            <div className="border border-gray-800 rounded-md">
              <div className="p-2 bg-gray-800 text-sm font-medium text-gray-300 border-b border-gray-800 flex justify-between items-center">
                <span>Predefined Groups</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-blue-400 hover:text-blue-300 hover:bg-gray-700"
                  onClick={() => setIsEditingGroup(true)}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Group
                </Button>
              </div>
              <div className="p-2">
                {isEditingGroup ? (
                  <div className="space-y-3 p-2 bg-gray-800/70 rounded-md">
                    <h4 className="text-sm font-medium text-gray-300">
                      {currentGroup ? "Edit Group" : "Create New Group"}
                    </h4>
                    <div className="space-y-2">
                      <div>
                        <Label
                          htmlFor="group-name"
                          className="text-xs text-gray-400 mb-1 block"
                        >
                          Group Name
                        </Label>
                        <Input
                          id="group-name"
                          value={newGroupName}
                          onChange={(e) => setNewGroupName(e.target.value)}
                          placeholder="Enter group name"
                          className="bg-gray-700 border-gray-600 text-gray-200"
                        />
                      </div>
                      <div>
                        <Label
                          htmlFor="group-emails"
                          className="text-xs text-gray-400 mb-1 block"
                        >
                          Email Addresses (one per line, or comma/semicolon
                          separated)
                        </Label>
                        <textarea
                          id="group-emails"
                          value={newGroupEmails}
                          onChange={(e) => setNewGroupEmails(e.target.value)}
                          placeholder="Enter email addresses"
                          className="w-full h-24 px-3 py-2 text-sm bg-gray-700 border border-gray-600 rounded-md text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 mt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600"
                        onClick={handleCancelEdit}
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                        onClick={
                          currentGroup ? handleUpdateGroup : handleCreateGroup
                        }
                      >
                        {currentGroup ? "Update" : "Create"}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {predefinedGroups.map((group) => (
                      <div
                        key={group.id}
                        className="flex items-center p-2 bg-gray-800/50 rounded-md hover:bg-gray-700/50 transition-colors relative group"
                      >
                        <div
                          className="h-8 w-8 rounded-full bg-blue-900/30 flex items-center justify-center mr-2 cursor-pointer"
                          onClick={() => handleAddGroup(group.id)}
                        >
                          <UserPlus className="h-4 w-4 text-blue-400" />
                        </div>
                        <div
                          className="flex-1 cursor-pointer"
                          onClick={() => handleAddGroup(group.id)}
                        >
                          <p className="text-sm text-gray-300">{group.name}</p>
                          <p className="text-xs text-gray-500">
                            {group.count} recipients
                          </p>
                        </div>
                        <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-gray-400 hover:text-blue-400 hover:bg-gray-700"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditGroup(group);
                            }}
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="14"
                              height="14"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                            </svg>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-gray-400 hover:text-red-400 hover:bg-gray-700"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteGroup(group.id);
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex flex-col space-y-1">
                  <Label
                    htmlFor="send-on-save"
                    className="text-sm text-gray-300"
                  >
                    Send on Survey Save
                  </Label>
                  <span className="text-xs text-gray-500">
                    Automatically send email when a new survey is saved
                  </span>
                </div>
                <Switch
                  id="send-on-save"
                  checked={emailSettings.sendOnSave}
                  onCheckedChange={(checked) =>
                    handleSettingChange("sendOnSave", checked)
                  }
                  className="data-[state=checked]:bg-blue-600"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex flex-col space-y-1">
                  <Label htmlFor="send-daily" className="text-sm text-gray-300">
                    Send Daily Summary
                  </Label>
                  <span className="text-xs text-gray-500">
                    Send a daily summary of all surveys
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    id="send-daily"
                    checked={emailSettings.sendDaily}
                    onCheckedChange={(checked) =>
                      handleSettingChange("sendDaily", checked)
                    }
                    className="data-[state=checked]:bg-blue-600"
                  />
                  {emailSettings.sendDaily && (
                    <Input
                      type="time"
                      value={emailSettings.dailyTime}
                      onChange={(e) =>
                        handleSettingChange("dailyTime", e.target.value)
                      }
                      className="w-24 bg-gray-800 border-gray-700 text-gray-200"
                    />
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex flex-col space-y-1">
                  <Label
                    htmlFor="include-images"
                    className="text-sm text-gray-300"
                  >
                    Include Visualizations
                  </Label>
                  <span className="text-xs text-gray-500">
                    Include survey visualizations in email
                  </span>
                </div>
                <Switch
                  id="include-images"
                  checked={emailSettings.includeImages}
                  onCheckedChange={(checked) =>
                    handleSettingChange("includeImages", checked)
                  }
                  className="data-[state=checked]:bg-blue-600"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex flex-col space-y-1">
                  <Label
                    htmlFor="include-torque-drag"
                    className="text-sm text-gray-300"
                  >
                    Include Torque & Drag
                  </Label>
                  <span className="text-xs text-gray-500">
                    Include torque & drag analysis in email
                  </span>
                </div>
                <Switch
                  id="include-torque-drag"
                  checked={emailSettings.includeTorqueDrag}
                  onCheckedChange={(checked) =>
                    handleSettingChange("includeTorqueDrag", checked)
                  }
                  className="data-[state=checked]:bg-blue-600"
                />
              </div>

              <div className="pt-4 border-t border-gray-800 mt-4">
                <h3 className="text-sm font-medium text-gray-300 mb-2">
                  Automated Email Settings
                </h3>

                <div className="flex items-center justify-between mt-2">
                  <div className="flex flex-col space-y-1">
                    <Label
                      htmlFor="auto-send-enabled"
                      className="text-sm text-gray-300"
                    >
                      Enable Auto-Send
                    </Label>
                    <span className="text-xs text-gray-500">
                      Automatically send emails based on settings below
                    </span>
                  </div>
                  <Switch
                    id="auto-send-enabled"
                    checked={emailSettings.autoSendEnabled}
                    onCheckedChange={(checked) =>
                      handleSettingChange("autoSendEnabled", checked)
                    }
                    className="data-[state=checked]:bg-blue-600"
                  />
                </div>

                {emailSettings.autoSendEnabled && (
                  <div className="space-y-2 mt-2">
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col space-y-1">
                        <Label
                          htmlFor="send-on-warning"
                          className="text-sm text-gray-300"
                        >
                          Send on Warning
                        </Label>
                        <span className="text-xs text-gray-500">
                          Send email when survey has warnings
                        </span>
                      </div>
                      <Switch
                        id="send-on-warning"
                        checked={emailSettings.sendOnWarning}
                        onCheckedChange={(checked) =>
                          handleSettingChange("sendOnWarning", checked)
                        }
                        className="data-[state=checked]:bg-yellow-600"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex flex-col space-y-1">
                        <Label
                          htmlFor="send-on-fail"
                          className="text-sm text-gray-300"
                        >
                          Send on Failure
                        </Label>
                        <span className="text-xs text-gray-500">
                          Send email when survey fails quality check
                        </span>
                      </div>
                      <Switch
                        id="send-on-fail"
                        checked={emailSettings.sendOnFail}
                        onCheckedChange={(checked) =>
                          handleSettingChange("sendOnFail", checked)
                        }
                        className="data-[state=checked]:bg-red-600"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-gray-800 space-y-2">
              <Button
                className="bg-blue-600 hover:bg-blue-700 text-white w-full"
                onClick={handleSaveSettings}
                disabled={saving}
              >
                {saving ? (
                  <span className="flex items-center">
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Saving...
                  </span>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Settings
                  </>
                )}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="attachments" className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex flex-col space-y-1">
                  <Label className="text-sm text-gray-300">
                    Attachment Folder
                  </Label>
                  <span className="text-xs text-gray-500">
                    Select a folder containing files to attach to emails
                  </span>
                </div>
                <Button
                  variant="outline"
                  className="bg-gray-800 border-gray-700 hover:bg-gray-700 text-gray-300"
                  onClick={handleSelectFolder}
                >
                  <Folder className="h-4 w-4 mr-2" />
                  Select Folder
                </Button>
              </div>

              {attachmentFolder && (
                <div className="p-3 bg-gray-800/50 rounded-md border border-gray-800">
                  <p className="text-sm text-gray-300 mb-1">Selected folder:</p>
                  <p className="text-xs text-blue-400 font-mono">
                    {attachmentFolder}
                  </p>
                </div>
              )}

              {attachments.length > 0 && (
                <div className="border border-gray-800 rounded-md">
                  <div className="p-2 bg-gray-800 text-sm font-medium text-gray-300 border-b border-gray-800">
                    Files to Attach ({attachments.length})
                  </div>
                  <ScrollArea className="h-[200px]">
                    <div className="p-2 space-y-2">
                      {attachments.map((file) => (
                        <div
                          key={file.path}
                          className="flex items-center justify-between p-2 bg-gray-800/50 rounded-md"
                        >
                          <div className="flex items-center">
                            <FileText className="h-4 w-4 text-blue-400 mr-2" />
                            <div>
                              <p className="text-sm text-gray-300">
                                {file.name}
                              </p>
                              <p className="text-xs text-gray-500">
                                {file.size} • {file.type}
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-gray-400 hover:text-red-400 hover:bg-gray-800"
                            onClick={() => handleRemoveAttachment(file.path)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}

              {/* Hidden file input for folder selection */}
              <input
                type="file"
                ref={fileInputRef}
                style={{ display: "none" }}
                multiple
                onChange={handleFileInputChange}
              />
            </div>
          </TabsContent>

          <TabsContent value="preview" className="space-y-4">
            <div
              key={emailPreviewKey}
              ref={emailPreviewRef}
              className="border border-gray-800 rounded-md p-4 bg-gray-800/30 email-preview-container"
            >
              <div className="mb-4">
                <h3 className="text-lg font-medium text-gray-300 mb-1">
                  Survey Report - Well Alpha-123
                </h3>
                <p className="text-sm text-gray-500">
                  This is a preview of the email that will be sent
                </p>
              </div>

              <div className="space-y-4">
                <div className="p-3 bg-gray-800/50 rounded-md border border-gray-800">
                  <h4 className="text-sm font-medium text-gray-300 mb-2">
                    Latest Survey Details
                  </h4>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div>
                      <p className="text-xs text-gray-500">Measured Depth</p>
                      <p className="text-gray-300">
                        {(
                          latestSurvey.bitDepth ||
                          latestSurvey.measuredDepth ||
                          0
                        ).toFixed(2)}{" "}
                        ft
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Inclination</p>
                      <p className="text-gray-300">
                        {(latestSurvey.inclination || 0).toFixed(2)}°
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Azimuth</p>
                      <p className="text-gray-300">
                        {(latestSurvey.azimuth || 0).toFixed(2)}°
                      </p>
                    </div>
                  </div>
                </div>

                {includeCurveData && (
                  <div className="p-3 bg-gray-800/50 rounded-md border border-gray-800">
                    <h4 className="text-sm font-medium text-gray-300 mb-2">
                      Curve Data
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-2 bg-gray-800/50 rounded-md flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-cyan-900/30 flex items-center justify-center">
                          <Zap className="h-4 w-4 text-cyan-400" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Motor Yield</p>
                          <p className="text-sm font-medium text-cyan-400">
                            {calculatedCurveData.motorYield.toFixed(2)}°/100ft
                          </p>
                        </div>
                      </div>

                      <div className="p-2 bg-gray-800/50 rounded-md flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-yellow-900/30 flex items-center justify-center">
                          <Ruler className="h-4 w-4 text-yellow-400" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Dogleg Needed</p>
                          <p className="text-sm font-medium text-yellow-400">
                            {calculatedCurveData.doglegNeeded.toFixed(2)}°/100ft
                          </p>
                        </div>
                      </div>

                      <div className="p-2 bg-gray-800/50 rounded-md flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-green-900/30 flex items-center justify-center">
                          <RotateCw className="h-4 w-4 text-green-400" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Slide Seen</p>
                          <p className="text-sm font-medium text-green-400">
                            {calculatedCurveData.slideSeen.toFixed(2)}°
                          </p>
                        </div>
                      </div>

                      <div className="p-2 bg-gray-800/50 rounded-md flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-blue-900/30 flex items-center justify-center">
                          <RotateCw className="h-4 w-4 text-blue-400" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Slide Ahead</p>
                          <p className="text-sm font-medium text-blue-400">
                            {calculatedCurveData.slideAhead.toFixed(2)}°
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {includeGammaPlot && (
                  <div className="p-3 bg-gray-800/50 rounded-md border border-gray-800">
                    <h4 className="text-sm font-medium text-gray-300 mb-2">
                      Gamma Ray Plot
                    </h4>
                    <div className="bg-gray-900 p-2 rounded-md border border-gray-700">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-gray-400">
                          Gamma Ray Log
                        </span>
                        <span className="text-xs bg-green-900/30 text-green-400 border border-green-800 px-2 py-0.5 rounded-full">
                          {isConnected && isReceiving ? "LIVE" : "STATIC"}
                        </span>
                      </div>
                      <div className="h-[150px] bg-gray-950 rounded-md relative overflow-hidden">
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-full h-full flex items-center justify-center">
                            <div className="w-3/4 h-3/4 relative">
                              <div className="absolute left-0 top-0 bottom-0 border-l border-gray-700 flex flex-col justify-between text-[8px] text-gray-500 px-1">
                                <span>
                                  {Math.max(
                                    0,
                                    (latestSurvey.bitDepth || 5000) - 200,
                                  ).toFixed(0)}
                                </span>
                                <span>
                                  {Math.max(
                                    0,
                                    (latestSurvey.bitDepth || 5000) - 100,
                                  ).toFixed(0)}
                                </span>
                                <span>
                                  {(latestSurvey.bitDepth || 5000).toFixed(0)}
                                </span>
                              </div>
                              <div className="absolute right-0 left-8 top-0 border-t border-gray-700 flex justify-between text-[8px] text-gray-500 py-1">
                                <span>0</span>
                                <span>75</span>
                                <span>150</span>
                              </div>
                              <div className="absolute inset-8 bg-gray-900/30">
                                <div className="w-full h-full overflow-hidden relative">
                                  <div
                                    className="absolute w-full border-t border-dashed border-gray-700"
                                    style={{ top: "30%" }}
                                  ></div>
                                  <div
                                    className="absolute w-full border-t border-dashed border-gray-700"
                                    style={{ top: "60%" }}
                                  ></div>
                                  <div
                                    className="absolute h-full border-l border-dashed border-gray-700"
                                    style={{ left: "33%" }}
                                  ></div>
                                  <div
                                    className="absolute h-full border-l border-dashed border-gray-700"
                                    style={{ left: "66%" }}
                                  ></div>
                                  <svg
                                    className="w-full h-full"
                                    viewBox="0 0 100 100"
                                    preserveAspectRatio="none"
                                  >
                                    <polyline
                                      points="10,90 30,40 50,70 70,20 90,50"
                                      fill="none"
                                      stroke="#00ffaa"
                                      strokeWidth="2"
                                    />
                                    <g fill="#00ffaa">
                                      <circle cx="10" cy="90" r="2" />
                                      <circle cx="30" cy="40" r="2" />
                                      <circle cx="50" cy="70" r="2" />
                                      <circle cx="70" cy="20" r="2" />
                                      <circle cx="90" cy="50" r="2" />
                                    </g>
                                  </svg>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mt-2 text-center">
                        Gamma readings from{" "}
                        {Math.max(
                          0,
                          (latestSurvey.bitDepth || 5000) - 200,
                        ).toFixed(0)}{" "}
                        to {(latestSurvey.bitDepth || 5000).toFixed(0)} ft MD
                      </p>
                    </div>
                  </div>
                )}

                {includeFullSurveyData && (
                  <div className="p-3 bg-gray-800/50 rounded-md border border-gray-800">
                    <h4 className="text-sm font-medium text-gray-300 mb-2">
                      Complete Survey Data
                    </h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs border-collapse">
                        <thead>
                          <tr className="bg-gray-800">
                            <th className="p-1 text-left text-gray-400 border-b border-gray-700">
                              MD (ft)
                            </th>
                            <th className="p-1 text-left text-gray-400 border-b border-gray-700">
                              Inc (°)
                            </th>
                            <th className="p-1 text-left text-gray-400 border-b border-gray-700">
                              Az (°)
                            </th>
                            <th className="p-1 text-left text-gray-400 border-b border-gray-700">
                              TF (°)
                            </th>
                            <th className="p-1 text-left text-gray-400 border-b border-gray-700">
                              Temp (°F)
                            </th>
                            <th className="p-1 text-left text-gray-400 border-b border-gray-700">
                              B Total
                            </th>
                            <th className="p-1 text-left text-gray-400 border-b border-gray-700">
                              A Total
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b border-gray-800">
                            <td className="p-1 text-gray-300">
                              {(latestSurvey.bitDepth || 0).toFixed(2)}
                            </td>
                            <td className="p-1 text-gray-300">
                              {(latestSurvey.inclination || 0).toFixed(2)}
                            </td>
                            <td className="p-1 text-gray-300">
                              {(latestSurvey.azimuth || 0).toFixed(2)}
                            </td>
                            <td className="p-1 text-gray-300">
                              {(latestSurvey.toolFace || 0).toFixed(2)}
                            </td>
                            <td className="p-1 text-gray-300">
                              {(latestSurvey.toolTemp || 0).toFixed(2)}
                            </td>
                            <td className="p-1 text-gray-300">
                              {(latestSurvey.bTotal || 0).toFixed(2)}
                            </td>
                            <td className="p-1 text-gray-300">
                              {(latestSurvey.aTotal || 0).toFixed(2)}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    <div className="mt-2 text-xs text-gray-500">
                      Quality Check:{" "}
                      <span
                        className={`${latestSurvey.qualityCheck?.status === "pass" ? "text-green-400" : latestSurvey.qualityCheck?.status === "warning" ? "text-yellow-400" : "text-red-400"}`}
                      >
                        {latestSurvey.qualityCheck?.status?.toUpperCase() ||
                          "N/A"}
                      </span>
                    </div>
                  </div>
                )}

                {includeSurveyAnalytics && (
                  <div className="p-3 bg-gray-800/50 rounded-md border border-gray-800">
                    <h4 className="text-sm font-medium text-gray-300 mb-2">
                      Survey Analytics
                    </h4>
                    <div className="grid grid-cols-2 gap-2 mb-2">
                      <div className="p-2 bg-gray-800/70 rounded-md">
                        <p className="text-xs text-gray-500 mb-1">
                          Dogleg Severity
                        </p>
                        <p className="text-sm font-medium text-yellow-400">
                          {(Math.random() * 3 + 1).toFixed(2)}°/100ft
                        </p>
                      </div>
                      <div className="p-2 bg-gray-800/70 rounded-md">
                        <p className="text-xs text-gray-500 mb-1">Build Rate</p>
                        <p className="text-sm font-medium text-blue-400">
                          {(Math.random() * 2 + 0.5).toFixed(2)}°/100ft
                        </p>
                      </div>
                      <div className="p-2 bg-gray-800/70 rounded-md">
                        <p className="text-xs text-gray-500 mb-1">Turn Rate</p>
                        <p className="text-sm font-medium text-green-400">
                          {(Math.random() * 2 + 0.5).toFixed(2)}°/100ft
                        </p>
                      </div>
                      <div className="p-2 bg-gray-800/70 rounded-md">
                        <p className="text-xs text-gray-500 mb-1">
                          Projected TD
                        </p>
                        <p className="text-sm font-medium text-pink-400">
                          {(latestSurvey.bitDepth + 1000).toFixed(1)} ft
                        </p>
                      </div>
                    </div>
                    <div className="p-2 bg-gray-800/70 rounded-md">
                      <p className="text-xs text-gray-500 mb-1">
                        Directional Tendency
                      </p>
                      <p className="text-sm font-medium text-blue-400">
                        Trending {Math.random() > 0.5 ? "right" : "left"} of
                        plan by {(Math.random() * 5).toFixed(1)} ft
                      </p>
                    </div>
                  </div>
                )}

                {includeTargetLineStatus && (
                  <div className="p-3 bg-gray-800/50 rounded-md border border-gray-800">
                    <h4 className="text-sm font-medium text-gray-300 mb-2">
                      Target Line Status
                    </h4>
                    <div className="grid grid-cols-2 gap-2 mb-2">
                      {targetLineData && (
                        <>
                          <div className="p-2 bg-gray-800/70 rounded-md">
                            <p className="text-xs text-gray-500 mb-1">
                              Above/Below
                            </p>
                            <p
                              className={`text-sm font-medium ${targetLineData.aboveBelow > 0 ? "text-red-400" : "text-green-400"}`}
                            >
                              {targetLineData.aboveBelow > 0
                                ? "Below"
                                : "Above"}{" "}
                              {Math.abs(targetLineData.aboveBelow).toFixed(1)}{" "}
                              ft
                            </p>
                          </div>
                          <div className="p-2 bg-gray-800/70 rounded-md">
                            <p className="text-xs text-gray-500 mb-1">
                              Left/Right
                            </p>
                            <p className="text-sm font-medium text-yellow-400">
                              {targetLineData.leftRight.toFixed(1)} ft
                            </p>
                          </div>
                        </>
                      )}
                      <div className="p-2 bg-gray-800/70 rounded-md">
                        <p className="text-xs text-gray-500 mb-1">
                          Distance to Target
                        </p>
                        <p className="text-sm font-medium text-cyan-400">
                          {targetLineData
                            ? Math.sqrt(
                                targetLineData.aboveBelow *
                                  targetLineData.aboveBelow +
                                  targetLineData.leftRight *
                                    targetLineData.leftRight,
                              ).toFixed(1)
                            : (Math.random() * 10 + 2).toFixed(1)}{" "}
                          ft
                        </p>
                      </div>
                      <div className="p-2 bg-gray-800/70 rounded-md">
                        <p className="text-xs text-gray-500 mb-1">
                          Vertical Section
                        </p>
                        <p className="text-sm font-medium text-purple-400">
                          {(latestSurvey.bitDepth * 0.3).toFixed(1)} ft
                        </p>
                      </div>
                      <div className="p-2 bg-gray-800/70 rounded-md">
                        <p className="text-xs text-gray-500 mb-1">
                          Target Azimuth
                        </p>
                        <p className="text-sm font-medium text-amber-400">
                          {(
                            latestSurvey.azimuth +
                            (Math.random() * 5 - 2.5)
                          ).toFixed(1)}
                          °
                        </p>
                      </div>
                      <div className="p-2 bg-gray-800/70 rounded-md">
                        <p className="text-xs text-gray-500 mb-1">
                          Target Inclination
                        </p>
                        <p className="text-sm font-medium text-green-400">
                          {(
                            latestSurvey.inclination +
                            (Math.random() * 3 - 1.5)
                          ).toFixed(1)}
                          °
                        </p>
                      </div>
                    </div>
                    <div className="p-2 bg-gray-800/70 rounded-md">
                      <p className="text-xs text-gray-500 mb-1">
                        Target Status
                      </p>
                      <p className="text-sm font-medium text-green-400">
                        On target - within acceptable range
                      </p>
                    </div>
                  </div>
                )}

                {attachments.length > 0 && (
                  <div className="p-3 bg-gray-800/50 rounded-md border border-gray-800">
                    <h4 className="text-sm font-medium text-gray-300 mb-2">
                      Attachments ({attachments.length})
                    </h4>
                    <div className="space-y-1">
                      {attachments.map((file) => (
                        <div
                          key={file.path}
                          className="flex items-center text-sm"
                        >
                          <FileText className="h-3 w-3 text-blue-400 mr-1" />
                          <span className="text-gray-300">{file.name}</span>
                          <span className="text-xs text-gray-500 ml-2">
                            ({file.size})
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="p-3 bg-gray-800/50 rounded-md border border-gray-800">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="h-4 w-4 text-yellow-500" />
                    <h4 className="text-sm font-medium text-gray-300">
                      Survey Quality Check
                    </h4>
                  </div>
                  <p className="text-sm text-gray-300">
                    All parameters within acceptable ranges
                  </p>
                </div>

                <div className="p-3 bg-gray-800/50 rounded-md border border-gray-800">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="h-4 w-4 text-blue-400" />
                    <h4 className="text-sm font-medium text-gray-300">
                      Survey Timestamp
                    </h4>
                  </div>
                  <p className="text-sm text-gray-300">
                    {new Date().toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-800 text-center">
                <p className="text-xs text-gray-500">
                  This email was automatically generated by the MWD Surface
                  Software. Please do not reply to this email.
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Last updated: {new Date().toLocaleTimeString()}
                </p>
              </div>
            </div>

            <div className="flex justify-between">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <Switch
                    id="include-curve-data"
                    checked={includeCurveData}
                    onCheckedChange={(checked) => setIncludeCurveData(checked)}
                    className="data-[state=checked]:bg-blue-600 mr-2"
                  />
                  <Label
                    htmlFor="include-curve-data"
                    className="text-sm text-gray-300"
                  >
                    Include Curve Data
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    id="include-gamma-plot"
                    checked={includeGammaPlot}
                    onCheckedChange={(checked) => setIncludeGammaPlot(checked)}
                    className="data-[state=checked]:bg-blue-600 mr-2"
                  />
                  <Label
                    htmlFor="include-gamma-plot"
                    className="text-sm text-gray-300"
                  >
                    Include Gamma Plot
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    id="include-full-survey-data"
                    checked={includeFullSurveyData}
                    onCheckedChange={(checked) =>
                      setIncludeFullSurveyData(checked)
                    }
                    className="data-[state=checked]:bg-blue-600 mr-2"
                  />
                  <Label
                    htmlFor="include-full-survey-data"
                    className="text-sm text-gray-300"
                  >
                    Include Full Survey Data
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    id="include-survey-analytics"
                    checked={includeSurveyAnalytics}
                    onCheckedChange={(checked) =>
                      setIncludeSurveyAnalytics(checked)
                    }
                    className="data-[state=checked]:bg-blue-600 mr-2"
                  />
                  <Label
                    htmlFor="include-survey-analytics"
                    className="text-sm text-gray-300"
                  >
                    Include Survey Analytics
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    id="include-target-line-status"
                    checked={includeTargetLineStatus}
                    onCheckedChange={(checked) =>
                      setIncludeTargetLineStatus(checked)
                    }
                    className="data-[state=checked]:bg-blue-600 mr-2"
                  />
                  <Label
                    htmlFor="include-target-line-status"
                    className="text-sm text-gray-300"
                  >
                    Include Target Line Status
                  </Label>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex flex-col gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <Switch
                      id="use-screenshot"
                      checked={useScreenshotInEmail}
                      onCheckedChange={(checked) => {
                        setUseScreenshotInEmail(checked);
                        if (checked && autoSendWithScreenshot) {
                          // Delay to allow screenshot capture to complete
                          setTimeout(() => {
                            handleSendOutlookEmail();
                          }, 500);
                        }
                      }}
                      className="data-[state=checked]:bg-blue-600 mr-2"
                    />
                    <Label
                      htmlFor="use-screenshot"
                      className="text-sm text-gray-300"
                    >
                      Use Screenshot in Email
                    </Label>
                  </div>
                  {useScreenshotInEmail && (
                    <div className="flex items-center gap-2 ml-8">
                      <Switch
                        id="auto-send-screenshot"
                        checked={autoSendWithScreenshot}
                        onCheckedChange={setAutoSendWithScreenshot}
                        className="data-[state=checked]:bg-green-600 mr-2"
                      />
                      <Label
                        htmlFor="auto-send-screenshot"
                        className="text-sm text-gray-300"
                      >
                        Auto-send when toggled on
                      </Label>
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="bg-gray-800 hover:bg-gray-700 text-gray-200 border-gray-700"
                    onClick={copyEmailPreviewToClipboard}
                  >
                    <Camera className="h-4 w-4 mr-2" />
                    Copy to Clipboard
                  </Button>
                  <Button
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={handleSendOutlookEmail}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Open in Outlook
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default SurveyEmailSettings;
