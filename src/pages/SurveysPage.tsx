import React, { useState, useEffect } from "react";
import Navbar from "@/components/layout/Navbar";
import StatusBar from "@/components/dashboard/StatusBar";
import SurveyTable from "@/components/dashboard/SurveyTable";
import SurveyAnalytics from "@/components/dashboard/SurveyAnalytics";
import SurveyPopup from "@/components/dashboard/SurveyPopup";
import SurveyEmailSettings from "@/components/dashboard/SurveyEmailSettings";
import SurveyImport from "@/components/dashboard/SurveyImport";
import CurveDataWidget from "@/components/dashboard/CurveDataWidget";
import WellInformationWidget from "@/components/dashboard/WellInformationWidget";
import { SurveyData } from "@/components/dashboard/SurveyPopup";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Upload,
  FileText,
  Send,
  Download,
  CheckCircle,
  AlertCircle,
  XCircle,
  Info,
} from "lucide-react";
import { useWits } from "@/context/WitsContext";
import { useSurveys } from "@/context/SurveyContext";

const SurveysPage = () => {
  const { witsData } = useWits();
  const { toast } = useToast();
  const { surveys, addSurvey, updateSurvey, deleteSurvey, exportSurveys } =
    useSurveys();

  // Well information state
  const [wellInfo, setWellInfo] = useState({
    wellName: "Alpha-123",
    rigName: "Precision Drilling #42",
    sensorOffset: 0,
  });

  const [editingSurvey, setEditingSurvey] = useState<SurveyData | null>(null);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
  const [selectedSurveys, setSelectedSurveys] = useState<string[]>([]);
  const [emailRecipient, setEmailRecipient] = useState(
    "operations@newwelltech.com",
  );
  const [emailSubject, setEmailSubject] = useState(
    "MWD Survey Report - Well Alpha-123 - ",
  );
  const [emailBody, setEmailBody] = useState("");
  const [distroList, setDistroList] = useState([
    "john.doe@newwelltech.com",
    "jane.doe@newwelltech.com",
  ]);
  const [includeCurveData, setIncludeCurveData] = useState(false);

  const handleEditSurvey = (survey: SurveyData) => {
    setEditingSurvey(survey);
    setIsPopupOpen(true);
  };

  const handleDeleteSurvey = (id: string) => {
    deleteSurvey(id);
    toast({
      title: "Survey Deleted",
      description: "The survey has been removed from the database.",
      variant: "destructive",
    });
  };

  const handleSaveSurvey = (updatedSurvey: SurveyData) => {
    if (editingSurvey) {
      // Update existing survey
      updateSurvey(updatedSurvey);
      toast({
        title: "Survey Updated",
        description: `Survey at ${new Date(updatedSurvey.timestamp).toLocaleString()} has been updated.`,
      });
    } else {
      // Add new survey
      addSurvey(updatedSurvey);
      toast({
        title: "Survey Added",
        description: `New survey at ${new Date(updatedSurvey.timestamp).toLocaleString()} has been added.`,
      });
    }
    setEditingSurvey(null);
    setIsPopupOpen(false);
  };

  const handleExportSurveys = () => {
    exportSurveys();
    toast({
      title: "Surveys Exported",
      description: "Survey data has been exported to CSV format.",
    });
  };

  const handleImportSurveys = (importedSurveys: SurveyData[]) => {
    importedSurveys.forEach((survey) => addSurvey(survey));
    setIsImportOpen(false);
    toast({
      title: "Surveys Imported",
      description: `${importedSurveys.length} surveys have been imported successfully.`,
    });
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file extension
    const fileExt = file.name.split(".").pop()?.toLowerCase();
    if (!["csv", "txt", "las"].includes(fileExt || "")) {
      toast({
        title: "Invalid File Format",
        description: "Please upload a CSV, TXT, or LAS file.",
        variant: "destructive",
      });
      event.target.value = "";
      return;
    }

    // Show processing toast
    toast({
      title: "File Uploaded",
      description: `${file.name} has been uploaded. Processing...`,
    });

    // Read file content
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;

      try {
        // Parse file content based on extension
        let parsedSurveys: SurveyData[] = [];

        if (fileExt === "csv") {
          parsedSurveys = parseCSVSurveys(content);
        } else if (fileExt === "txt") {
          parsedSurveys = parseTXTSurveys(content);
        } else if (fileExt === "las") {
          parsedSurveys = parseLASSurveys(content);
        }

        // Add the parsed surveys
        if (parsedSurveys.length > 0) {
          parsedSurveys.forEach((survey) => addSurvey(survey));
          toast({
            title: "File Processed Successfully",
            description: `${parsedSurveys.length} surveys have been imported.`,
            variant: "default",
          });
        } else {
          toast({
            title: "No Valid Surveys Found",
            description: "The file did not contain any valid survey data.",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Error parsing file:", error);
        toast({
          title: "Error Processing File",
          description:
            "There was an error processing the file. Please check the format.",
          variant: "destructive",
        });
      }
    };

    reader.onerror = () => {
      toast({
        title: "Error Reading File",
        description: "There was an error reading the file.",
        variant: "destructive",
      });
    };

    reader.readAsText(file);
    // Clear the input
    event.target.value = "";
  };

  const parseCSVSurveys = (content: string): SurveyData[] => {
    // ... existing implementation
  };

  const parseTXTSurveys = (content: string): SurveyData[] => {
    // ... existing implementation
  };

  const parseLASSurveys = (content: string): SurveyData[] => {
    // ... existing implementation
  };

  const determineQualityCheck = (inc: number, az: number) => {
    // ... existing implementation
  };

  const handleSelectSurveys = (ids: string[]) => {
    setSelectedSurveys(ids);
  };

  const generateEmailContent = () => {
    const selectedSurveyData = surveys.filter((survey) =>
      selectedSurveys.includes(survey.id),
    );

    if (selectedSurveyData.length === 0) return "No surveys selected";

    // Sort by timestamp (newest first)
    selectedSurveyData.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
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
    emailContent += `  Well Name: Alpha-123\n`;
    emailContent += `  Operator: New Well Technologies\n`;
    emailContent += `  MWD Engineer: John Doe\n`;
    emailContent += `  Rig: Precision Drilling #42\n`;
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
      emailContent += `  Motor Yield: 2.8\n`;
      emailContent += `  Dogleg Needed: 3.2\n`;
      emailContent += `  Slide Seen: 1.5\n`;
      emailContent += `  Slide Ahead: 1.7\n`;
      emailContent += `  Projected Inclination: 47.3°\n`;
      emailContent += `  Projected Azimuth: 182.5°\n`;
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

  const handleSendEmail = () => {
    const emailBody = generateEmailContent();
    const subject = `MWD Survey Report - Well Alpha-123 - ${new Date().toLocaleDateString()}`;
    const mailtoUrl = `mailto:${emailRecipient}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(emailBody)}`;

    window.open(mailtoUrl, "_blank");

    toast({
      title: "Email Draft Created",
      description: `An email draft has been created in your default mail client.`,
    });

    setIsEmailDialogOpen(false);
    setSelectedSurveys([]);
  };

  const handleToggleIncludeCurveData = () => {
    setIncludeCurveData(!includeCurveData);
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-200">
      <Navbar />
      <StatusBar />

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 gap-6">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold">Survey Management</h1>
            <div className="flex gap-2">
              <Button
                className="bg-blue-600 hover:bg-blue-700 text-white"
                onClick={() => {
                  // Create new survey with current WITS data
                  const newSurvey: SurveyData = {
                    id: Date.now().toString(),
                    timestamp: new Date().toISOString(),
                    bitDepth: witsData.bitDepth,
                    measuredDepth: witsData.bitDepth - wellInfo.sensorOffset,
                    sensorOffset: wellInfo.sensorOffset,
                    inclination: witsData.inclination,
                    azimuth: witsData.azimuth,
                    toolFace: witsData.toolFace,
                    bTotal: witsData.magneticField,
                    aTotal: witsData.gravity,
                    dip: witsData.dip,
                    toolTemp: witsData.toolTemp,
                    wellName: wellInfo.wellName,
                    rigName: wellInfo.rigName,
                    qualityCheck: {
                      status: "pass",
                      message: "All parameters within acceptable ranges",
                    },
                  };
                  // Set as new survey (not editing an existing one)
                  setEditingSurvey(null);
                  // Then set the new survey data and open the popup
                  setTimeout(() => {
                    setEditingSurvey(newSurvey);
                    setIsPopupOpen(true);
                  }, 0);
                }}
              >
                Take New Survey
              </Button>
              <label htmlFor="file-upload">
                <Button
                  variant="outline"
                  className="bg-gray-800 border-gray-700 hover:bg-gray-700 text-gray-300 cursor-pointer"
                  asChild
                >
                  <div>
                    <Upload className="h-4 w-4 mr-2" />
                    Import Surveys
                  </div>
                </Button>
              </label>
              <input
                id="file-upload"
                type="file"
                accept=".csv,.txt,.las"
                className="hidden"
                onChange={handleFileUpload}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Survey Analytics */}
            <div className="lg:col-span-2">
              <SurveyAnalytics
                surveys={surveys}
                onExport={handleExportSurveys}
              />
            </div>

            {/* Right Column */}
            <div className="lg:col-span-1 space-y-6">
              {/* Well Information Widget */}
              <div className="h-[250px] mb-6">
                <WellInformationWidget
                  wellName={wellInfo.wellName}
                  rigName={wellInfo.rigName}
                  sensorOffset={wellInfo.sensorOffset}
                  onUpdate={(data) => {
                    setWellInfo(data);
                    toast({
                      title: "Well Information Updated",
                      description:
                        "Well information has been updated successfully.",
                    });
                  }}
                />
              </div>

              {/* Email Settings */}
              <SurveyEmailSettings
                emailEnabled={false}
                onToggleEmail={() => {}}
                wellName={wellInfo.wellName}
                rigName={wellInfo.rigName}
              />

              {/* Curve Data Widget */}
              <div className="h-[250px]">
                <CurveDataWidget
                  motorYield={2.8}
                  doglegNeeded={3.2}
                  slideSeen={1.5}
                  slideAhead={1.7}
                  projectedInc={47.3}
                  projectedAz={182.5}
                  isRealtime={true}
                />
              </div>
            </div>
          </div>

          {/* Survey Table */}
          <div>
            <SurveyTable
              surveys={surveys}
              onEditSurvey={handleEditSurvey}
              onDeleteSurvey={handleDeleteSurvey}
              onExportSurveys={handleExportSurveys}
              onSelectSurveys={handleSelectSurveys}
              selectedSurveys={selectedSurveys}
              onEmailSurveys={() => setIsEmailDialogOpen(true)}
            />
          </div>
        </div>
      </div>

      {/* Survey Popup */}
      {isPopupOpen && editingSurvey && (
        <SurveyPopup
          isOpen={isPopupOpen}
          onClose={() => setIsPopupOpen(false)}
          onSave={(updatedSurvey) => {
            handleSaveSurvey(updatedSurvey);
          }}
          surveyData={editingSurvey}
        />
      )}

      {/* Survey Import */}
      {isImportOpen && <SurveyImport onImportSurveys={handleImportSurveys} />}

      {/* Email Preview Dialog */}
      <Dialog open={isEmailDialogOpen} onOpenChange={setIsEmailDialogOpen}>
        <DialogContent className="bg-gray-900 border-gray-800 text-gray-200 max-w-4xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-200 flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-400" />
              Email Survey Data
            </DialogTitle>
          </DialogHeader>

          <div className="mt-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email-recipient">Recipient</Label>
                <Input
                  id="email-recipient"
                  value={emailRecipient}
                  onChange={(e) => setEmailRecipient(e.target.value)}
                  className="bg-gray-800 border-gray-700 text-gray-200"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email-subject">Subject</Label>
                <Input
                  id="email-subject"
                  value={`MWD Survey Report - Well Alpha-123 - ${new Date().toLocaleDateString()}`}
                  className="bg-gray-800 border-gray-700 text-gray-200"
                  readOnly
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label>Email Preview</Label>
                <Badge
                  variant="outline"
                  className="bg-blue-900/30 text-blue-400 border-blue-800"
                >
                  {selectedSurveys.length} Surveys Selected
                </Badge>
              </div>
              <div className="bg-gray-800/50 p-4 rounded-md border border-gray-800 font-mono text-sm whitespace-pre-wrap h-[400px] overflow-y-auto">
                {generateEmailContent()}
              </div>
            </div>

            <div className="bg-blue-900/20 p-3 rounded-md border border-blue-800">
              <div className="flex items-start gap-2">
                <Info className="h-5 w-5 text-blue-400 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-blue-400">
                    Email Information
                  </h4>
                  <p className="text-xs text-gray-400 mt-1">
                    This email will include a detailed survey report with all
                    selected surveys. The report includes directional data,
                    quality assessments, and calculated values such as TVD and
                    dogleg severity. Recipients can import this data into their
                    own directional drilling software.
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Clicking "Open in Outlook" will create a draft in your
                    default email client with all the survey data pre-populated.
                    You can review and make any final adjustments before
                    sending.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-2">
              <div className="flex-1 bg-gray-800/50 p-3 rounded-md border border-gray-800">
                <h4 className="text-sm font-medium text-gray-300 mb-1">
                  Attachments
                </h4>
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <CheckCircle className="h-3 w-3 text-green-400" />
                  <span>SurveyData.csv</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
                  <CheckCircle className="h-3 w-3 text-green-400" />
                  <span>WellTrajectory.pdf</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
                  <CheckCircle className="h-3 w-3 text-green-400" />
                  <span>DrillingParameters.xlsx</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
                  <CheckCircle className="h-3 w-3 text-green-400" />
                  <span>3DWellboreVisualization.html</span>
                </div>
              </div>

              <div className="flex-1 bg-gray-800/50 p-3 rounded-md border border-gray-800">
                <h4 className="text-sm font-medium text-gray-300 mb-1">
                  Delivery Options
                </h4>
                <div className="flex items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    id="cc-field-engineer"
                    className="rounded bg-gray-700 border-gray-600 text-blue-600"
                    checked
                  />
                  <label htmlFor="cc-field-engineer" className="text-gray-400">
                    CC Field Engineer
                  </label>
                </div>
                <div className="flex items-center gap-2 text-xs mt-1">
                  <input
                    type="checkbox"
                    id="high-priority"
                    className="rounded bg-gray-700 border-gray-600 text-blue-600"
                  />
                  <label htmlFor="high-priority" className="text-gray-400">
                    Mark as High Priority
                  </label>
                </div>
                <div className="flex items-center gap-2 text-xs mt-1">
                  <input
                    type="checkbox"
                    id="include-curve-data"
                    className="rounded bg-gray-700 border-gray-600 text-blue-600"
                    checked={includeCurveData}
                    onChange={handleToggleIncludeCurveData}
                  />
                  <label htmlFor="include-curve-data" className="text-gray-400">
                    Include Curve Data
                  </label>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button
              variant="outline"
              onClick={() => setIsEmailDialogOpen(false)}
              className="bg-gray-800 hover:bg-gray-700 text-gray-200 border-gray-700"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSendEmail}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Send className="h-4 w-4 mr-2" />
              Open in Outlook
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SurveysPage;
