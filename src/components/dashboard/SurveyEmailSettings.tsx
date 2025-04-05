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
} from "lucide-react";

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
  const [newRecipient, setNewRecipient] = useState("");
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
  const [searchQuery, setSearchQuery] = useState("");
  const [includeCurveData, setIncludeCurveData] = useState(true);
  const [includeGammaPlot, setIncludeGammaPlot] = useState(false);
  const [includeFullSurveyData, setIncludeFullSurveyData] = useState(false);
  const [latestSurvey, setLatestSurvey] = useState({});
  const [attachmentFolder, setAttachmentFolder] = useState("");
  const [attachments, setAttachments] = useState<AttachmentFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Use global surveys from context if available, otherwise use props
    const surveysToUse = globalSurveys.length > 0 ? globalSurveys : surveys;
    if (surveysToUse.length > 0) {
      setLatestSurvey(surveysToUse[0]);
    }
  }, [globalSurveys, surveys]);

  const handleAddRecipient = () => {
    if (
      newRecipient &&
      !recipients.includes(newRecipient) &&
      validateEmail(newRecipient)
    ) {
      const updatedRecipients = [...recipients, newRecipient];
      onUpdateRecipients(updatedRecipients);
      setNewRecipient("");
    } else {
      alert("Invalid email address");
    }
  };

  const validateEmail = (email) => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
  };

  const handleRemoveRecipient = (email) => {
    if (
      window.confirm(`Are you sure you want to remove ${email} as a recipient?`)
    ) {
      const updatedRecipients = recipients.filter((r) => r !== email);
      onUpdateRecipients(updatedRecipients);
    }
  };

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
    // In a real application, this would open a folder picker dialog
    // For this simulation, we'll just set a sample folder path and add some mock files
    const mockFolderPath = "/Users/operator/Documents/SurveyReports";
    setAttachmentFolder(mockFolderPath);

    // Simulate finding files in the selected folder
    const mockFiles: AttachmentFile[] = [
      {
        name: "Survey_Report_20240601.pdf",
        size: "1.2 MB",
        type: "PDF",
        path: `${mockFolderPath}/Survey_Report_20240601.pdf`,
      },
      {
        name: "Trajectory_Plot.png",
        size: "850 KB",
        type: "Image",
        path: `${mockFolderPath}/Trajectory_Plot.png`,
      },
      {
        name: "Drilling_Parameters.xlsx",
        size: "2.4 MB",
        type: "Excel",
        path: `${mockFolderPath}/Drilling_Parameters.xlsx`,
      },
      {
        name: "Formation_Analysis.pdf",
        size: "3.1 MB",
        type: "PDF",
        path: `${mockFolderPath}/Formation_Analysis.pdf`,
      },
    ];

    setAttachments(mockFiles);
  };

  const handleRemoveAttachment = (path: string) => {
    setAttachments(attachments.filter((file) => file.path !== path));
  };

  const handleTestEmail = () => {
    const emailBody = getHtmlEmailBody();
    const emailSubject = `Survey Report - Well ${wellName} - ${rigName}`;
    const emailTo = recipients.join(",");
    const emailCC = "";
    const emailBCC = "";

    // In a real application, we would send the email with attachments via an API
    // For this simulation, we'll open a new email in the default email client
    // Note: This doesn't support attachments in the browser, but in a real app we'd use a server-side API

    // Create a form to submit the email data
    const form = document.createElement("form");
    form.method = "post";
    form.action = "mailto:" + emailTo;
    form.enctype = "text/plain";

    // Add hidden fields for email data
    const subjectField = document.createElement("input");
    subjectField.type = "hidden";
    subjectField.name = "subject";
    subjectField.value = emailSubject;
    form.appendChild(subjectField);

    const bodyField = document.createElement("input");
    bodyField.type = "hidden";
    bodyField.name = "body";
    bodyField.value = emailBody;
    form.appendChild(bodyField);

    // Append form to body, submit it, and remove it
    document.body.appendChild(form);
    form.submit();
    document.body.removeChild(form);

    // Alternative approach using mailto URL
    const outlookUrl = `https://outlook.office.com/mail/deeplink/compose?to=${emailTo}&cc=${emailCC}&bcc=${emailBCC}&subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
    window.open(outlookUrl, "_blank");
  };

  const getHtmlEmailBody = () => {
    let html = `
      <div>
        <h3>Survey Report - Well ${wellName}</h3>
        <p>This is an automated survey report for ${rigName}</p>
      </div>
      <div>
        <h4>Latest Survey Details</h4>
        <div>
          <p>Measured Depth: ${(latestSurvey.bitDepth || latestSurvey.measuredDepth)?.toFixed(2)} ft</p>
          <p>Inclination: ${latestSurvey.inclination?.toFixed(2)}°</p>
          <p>Azimuth: ${latestSurvey.azimuth?.toFixed(2)}°</p>
          <p>Tool Face: ${latestSurvey.toolFace?.toFixed(2)}°</p>
          <p>Tool Temp: ${latestSurvey.toolTemp?.toFixed(2)}°F</p>
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

    if (includeGammaPlot) {
      html += `
        <div>
          <h4>Gamma Ray Plot</h4>
          <div style="background-color: #111827; padding: 10px; border-radius: 4px; margin-top: 10px;">
            <p style="color: #9ca3af; font-size: 12px; margin-bottom: 5px;">Gamma Ray Log Visualization</p>
            <p style="color: #9ca3af; font-size: 12px;">
              This email includes a reference to the gamma ray log. Please see the attached image or view in the dashboard for the full visualization.
            </p>
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

  const predefinedGroups = [
    { id: "directional", name: "Directional Team", count: 5 },
    { id: "company", name: "Company Representatives", count: 3 },
    { id: "rig", name: "Rig Crew", count: 8 },
    { id: "engineers", name: "Engineers", count: 4 },
  ];

  const filteredRecipients = recipients.filter((recipient) =>
    recipient.toLowerCase().includes(searchQuery.toLowerCase()),
  );

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
                <span>Current Recipients</span>
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
                        className="flex items-center justify-between p-2 bg-gray-800/50 rounded-md"
                      >
                        <span className="text-sm text-gray-300">{email}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-gray-400 hover:text-red-400 hover:bg-gray-800"
                          onClick={() => handleRemoveRecipient(email)}
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
              <div className="p-2 bg-gray-800 text-sm font-medium text-gray-300 border-b border-gray-800">
                Predefined Groups
              </div>
              <div className="p-2">
                <div className="grid grid-cols-2 gap-2">
                  {predefinedGroups.map((group) => (
                    <div
                      key={group.id}
                      className="flex items-center p-2 bg-gray-800/50 rounded-md"
                    >
                      <Checkbox id={`group-${group.id}`} className="mr-2" />
                      <div>
                        <Label
                          htmlFor={`group-${group.id}`}
                          className="text-sm text-gray-300 cursor-pointer"
                        >
                          {group.name}
                        </Label>
                        <p className="text-xs text-gray-500">
                          {group.count} recipients
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
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

            <div className="pt-4 border-t border-gray-800">
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

              {/* Hidden file input for real implementation */}
              <input
                type="file"
                ref={fileInputRef}
                style={{ display: "none" }}
                multiple
              />
            </div>
          </TabsContent>

          <TabsContent value="preview" className="space-y-4">
            <div className="border border-gray-800 rounded-md p-4 bg-gray-800/30">
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
                          latestSurvey.bitDepth || latestSurvey.measuredDepth
                        )?.toFixed(2)}{" "}
                        ft
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Inclination</p>
                      <p className="text-gray-300">
                        {latestSurvey.inclination?.toFixed(2)}°
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Azimuth</p>
                      <p className="text-gray-300">
                        {latestSurvey.azimuth?.toFixed(2)}°
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
                            {witsData.motorYield.toFixed(2)}°/100ft
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
                            {witsData.doglegNeeded.toFixed(2)}°/100ft
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
                            {witsData.slideSeen.toFixed(2)}°
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
                            {witsData.slideAhead.toFixed(2)}°
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
                          LIVE
                        </span>
                      </div>
                      <div className="h-[150px] bg-gray-950 rounded-md relative overflow-hidden">
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-full h-full flex items-center justify-center">
                            <div className="w-3/4 h-3/4 relative">
                              <div className="absolute left-0 top-0 bottom-0 border-l border-gray-700 flex flex-col justify-between text-[8px] text-gray-500 px-1">
                                <span>5000</span>
                                <span>6500</span>
                                <span>8000</span>
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
              </div>
              <Button
                variant="outline"
                className="bg-gray-800 border-gray-700 hover:bg-gray-700 text-gray-300"
                onClick={handleTestEmail}
              >
                <Mail className="h-4 w-4 mr-2" />
                Send Test Email
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default SurveyEmailSettings;
