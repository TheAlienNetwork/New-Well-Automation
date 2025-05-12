import React, { useState, useEffect } from "react";
import { useSurveys } from "@/context/SurveyContext";
import { useWits } from "@/context/WitsContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle, AlertCircle, XCircle, Info, Mail } from "lucide-react";
import SurveyEmailSettings from "./SurveyEmailSettings";

export interface SurveyData {
  id: string;
  timestamp: string;
  bitDepth: number;
  measuredDepth?: number; // Added for calculated MD (Bit Depth - Offset)
  sensorOffset?: number; // Added for sensor offset
  inclination: number;
  azimuth: number;
  toolFace: number;
  bTotal: number;
  aTotal: number;
  dip: number;
  toolTemp: number;
  qualityCheck: {
    status: "pass" | "warning" | "fail";
    message: string;
    details?: string;
  };
  wellName?: string; // Added for well information
  rigName?: string; // Added for rig information
  wellId?: string; // Added to track which well this survey belongs to
  doglegSeverity?: number; // Added for dogleg severity calculation
  buildRate?: number; // Added for build rate calculation
}

interface SurveyPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (survey: SurveyData) => void;
  surveyData: SurveyData;
  wellInfo?: {
    wellName: string;
    rigName: string;
    sensorOffset: number;
  };
}

const SurveyPopup = ({
  isOpen,
  onClose,
  onSave,
  surveyData,
  wellInfo,
}: SurveyPopupProps) => {
  const { addSurvey, updateSurvey, surveys } = useSurveys();
  const { witsData } = useWits();
  const [editedSurvey, setEditedSurvey] = useState<SurveyData>(surveyData);
  const [activeTab, setActiveTab] = useState("data");
  const [showEmailSettings, setShowEmailSettings] = useState(false);
  const [emailEnabled, setEmailEnabled] = useState(false);
  const [emailRecipients, setEmailRecipients] = useState([
    "john.operator@oiltech.com",
    "directional.team@oiltech.com",
    "rig.supervisor@oiltech.com",
  ]);

  const handleInputChange = (field: keyof SurveyData, value: any) => {
    setEditedSurvey((prev) => {
      const updatedSurvey = {
        ...prev,
        [field]:
          field === "bitDepth" || field === "sensorOffset"
            ? parseFloat(value)
            : value,
      };

      // Auto-calculate measured depth when bit depth or sensor offset changes
      if (field === "bitDepth" || field === "sensorOffset") {
        const bitDepth =
          field === "bitDepth" ? parseFloat(value) : prev.bitDepth;
        const sensorOffset =
          field === "sensorOffset" ? parseFloat(value) : prev.sensorOffset || 0;
        updatedSurvey.measuredDepth = bitDepth - sensorOffset;
      }

      return updatedSurvey;
    });
  };

  // Initialize survey with latest well information if available
  useEffect(() => {
    // Always update with wellInfo if provided, regardless of whether it's a new or existing survey
    if (wellInfo) {
      console.log("Applying wellInfo to survey:", wellInfo);
      setEditedSurvey((prev) => ({
        ...prev,
        wellName: wellInfo.wellName || "",
        rigName: wellInfo.rigName || "",
        sensorOffset: wellInfo.sensorOffset,
        // Recalculate measured depth with the new sensor offset
        measuredDepth:
          prev.bitDepth -
          (wellInfo.sensorOffset !== undefined ? wellInfo.sensorOffset : 0),
      }));
      return;
    }

    // If no wellInfo prop and it's a new survey, get the latest survey to check for well information
    if (surveyData.id === "new") {
      const latestSurveys = [...surveys].sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      );

      // Try to get well information from the latest survey
      let surveyWellInfo = {
        wellName: undefined,
        rigName: undefined,
        sensorOffset: undefined,
      };

      if (latestSurveys.length > 0) {
        const latestSurvey = latestSurveys[0];
        surveyWellInfo = {
          wellName: latestSurvey.wellName,
          rigName: latestSurvey.rigName,
          sensorOffset: latestSurvey.sensorOffset,
        };
      }

      // Update the survey with the well information
      setEditedSurvey((prev) => ({
        ...prev,
        wellName: surveyWellInfo.wellName || "",
        rigName: surveyWellInfo.rigName || "",
        sensorOffset: surveyWellInfo.sensorOffset,
        // Recalculate measured depth with the new sensor offset
        measuredDepth:
          prev.bitDepth -
          (surveyWellInfo.sensorOffset !== undefined
            ? surveyWellInfo.sensorOffset
            : 0),
      }));
    }
  }, [surveyData.id, surveys, wellInfo]);

  const handleSave = () => {
    // Validate survey data before saving
    const validatedSurvey = {
      ...editedSurvey,
      // Ensure numeric fields have valid values (default to 0 if invalid)
      bitDepth: isNaN(editedSurvey.bitDepth) ? 0 : editedSurvey.bitDepth,
      inclination: isNaN(editedSurvey.inclination)
        ? 0
        : editedSurvey.inclination,
      azimuth: isNaN(editedSurvey.azimuth) ? 0 : editedSurvey.azimuth,
      toolFace: isNaN(editedSurvey.toolFace) ? 0 : editedSurvey.toolFace,
      bTotal: isNaN(editedSurvey.bTotal) ? 0 : editedSurvey.bTotal,
      aTotal: isNaN(editedSurvey.aTotal) ? 0 : editedSurvey.aTotal,
      dip: isNaN(editedSurvey.dip) ? 0 : editedSurvey.dip,
      toolTemp: isNaN(editedSurvey.toolTemp) ? 0 : editedSurvey.toolTemp,
      // Ensure string fields are not undefined
      wellName: editedSurvey.wellName || "",
      rigName: editedSurvey.rigName || "",
      // Ensure sensorOffset is valid
      sensorOffset: isNaN(editedSurvey.sensorOffset)
        ? 0
        : editedSurvey.sensorOffset,
      // Ensure measuredDepth is valid
      measuredDepth: isNaN(editedSurvey.measuredDepth)
        ? editedSurvey.bitDepth
        : editedSurvey.measuredDepth,
    };

    // Update the survey in the global context
    if (validatedSurvey.id === surveyData.id) {
      updateSurvey(validatedSurvey);
    } else {
      addSurvey(validatedSurvey);
    }

    // Call the local onSave handler for component-specific logic
    onSave(validatedSurvey);
    onClose();

    // Log confirmation that the survey was saved to the global context
    console.log("Survey saved to global context:", validatedSurvey);
  };

  const getQualityStatusColor = (status: string) => {
    switch (status) {
      case "pass":
        return "bg-green-900/30 text-green-400 border-green-800";
      case "warning":
        return "bg-yellow-900/30 text-yellow-400 border-yellow-800";
      case "fail":
        return "bg-red-900/30 text-red-400 border-red-800";
      default:
        return "bg-gray-900/30 text-gray-400 border-gray-800";
    }
  };

  const getQualityStatusIcon = (status: string) => {
    switch (status) {
      case "pass":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "warning":
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case "fail":
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  // Sample messages for the quality tab
  const qualityMessages = [
    {
      id: 1,
      type: editedSurvey.qualityCheck.status,
      message: editedSurvey.qualityCheck.message,
      details: editedSurvey.qualityCheck.details,
    },
    {
      id: 2,
      type: "info",
      message:
        "Survey recorded at " +
        new Date(editedSurvey.timestamp).toLocaleString(),
    },
    {
      id: 3,
      type: "info",
      message: "Shock & Vibration Analysis",
      details:
        "Axial: 28%, Lateral: 42%, Torsional: 15% - Moderate lateral vibration detected",
    },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gray-900 border-gray-800 text-gray-200 max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-gray-200 flex items-center gap-2">
            New MWD Survey
            <Badge
              variant="outline"
              className={getQualityStatusColor(
                editedSurvey.qualityCheck.status,
              )}
            >
              {editedSurvey.qualityCheck.status.toUpperCase()}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="bg-gray-800">
            <TabsTrigger value="data">Survey Data</TabsTrigger>
            <TabsTrigger value="quality">Quality Check</TabsTrigger>
            <TabsTrigger value="well">Well Info</TabsTrigger>
            <TabsTrigger value="email">Email</TabsTrigger>
          </TabsList>

          <TabsContent value="data" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="bitDepth">Bit Depth (ft)</Label>
                    <Input
                      id="bitDepth"
                      type="number"
                      step="0.1"
                      value={editedSurvey.bitDepth}
                      onChange={(e) => {
                        handleInputChange(
                          "bitDepth",
                          parseFloat(e.target.value),
                        );
                      }}
                      className="bg-gray-800 border-gray-700 text-gray-200"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sensorOffset">Sensor Offset (ft)</Label>
                    <Input
                      id="sensorOffset"
                      type="number"
                      step="0.1"
                      value={
                        editedSurvey.sensorOffset !== undefined
                          ? editedSurvey.sensorOffset
                          : wellInfo?.sensorOffset !== undefined
                            ? wellInfo.sensorOffset
                            : ""
                      }
                      onChange={(e) => {
                        handleInputChange(
                          "sensorOffset",
                          e.target.value
                            ? parseFloat(e.target.value)
                            : undefined,
                        );
                      }}
                      className="bg-gray-800 border-gray-700 text-gray-200"
                      placeholder={
                        wellInfo?.sensorOffset !== undefined
                          ? `${wellInfo.sensorOffset}`
                          : "Enter sensor offset"
                      }
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="measuredDepth">Measured Depth (ft)</Label>
                  <Input
                    id="measuredDepth"
                    type="number"
                    step="0.1"
                    value={
                      editedSurvey.measuredDepth ||
                      editedSurvey.bitDepth -
                        (editedSurvey.sensorOffset !== undefined
                          ? editedSurvey.sensorOffset
                          : 0)
                    }
                    readOnly
                    className="bg-gray-800/50 border-gray-700 text-gray-400"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="inclination">Inclination (°)</Label>
                    <Input
                      id="inclination"
                      type="number"
                      step="0.1"
                      value={editedSurvey.inclination}
                      onChange={(e) =>
                        handleInputChange(
                          "inclination",
                          parseFloat(e.target.value),
                        )
                      }
                      className="bg-gray-800 border-gray-700 text-gray-200"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="azimuth">Azimuth (°)</Label>
                    <Input
                      id="azimuth"
                      type="number"
                      step="0.1"
                      value={editedSurvey.azimuth}
                      onChange={(e) =>
                        handleInputChange("azimuth", parseFloat(e.target.value))
                      }
                      className="bg-gray-800 border-gray-700 text-gray-200"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="toolFace">Tool Face (°)</Label>
                    <Input
                      id="toolFace"
                      type="number"
                      step="0.1"
                      value={editedSurvey.toolFace}
                      onChange={(e) =>
                        handleInputChange(
                          "toolFace",
                          parseFloat(e.target.value),
                        )
                      }
                      className="bg-gray-800 border-gray-700 text-gray-200"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="toolTemp">Tool Temp (°F)</Label>
                    <Input
                      id="toolTemp"
                      type="number"
                      step="0.1"
                      value={editedSurvey.toolTemp}
                      onChange={(e) =>
                        handleInputChange(
                          "toolTemp",
                          parseFloat(e.target.value),
                        )
                      }
                      className="bg-gray-800 border-gray-700 text-gray-200"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="bTotal">B Total (μT)</Label>
                    <Input
                      id="bTotal"
                      type="number"
                      step="0.01"
                      value={editedSurvey.bTotal}
                      onChange={(e) =>
                        handleInputChange("bTotal", parseFloat(e.target.value))
                      }
                      className="bg-gray-800 border-gray-700 text-gray-200"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="aTotal">A Total (G)</Label>
                    <Input
                      id="aTotal"
                      type="number"
                      step="0.01"
                      value={editedSurvey.aTotal}
                      onChange={(e) =>
                        handleInputChange("aTotal", parseFloat(e.target.value))
                      }
                      className="bg-gray-800 border-gray-700 text-gray-200"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dip">Dip Angle (°)</Label>
                  <Input
                    id="dip"
                    type="number"
                    step="0.1"
                    value={editedSurvey.dip}
                    onChange={(e) =>
                      handleInputChange("dip", parseFloat(e.target.value))
                    }
                    className="bg-gray-800 border-gray-700 text-gray-200"
                  />
                </div>

                <div className="mt-4 p-3 rounded-md border border-gray-800 bg-gray-800/50">
                  <div className="flex items-center gap-2 mb-2">
                    <div>
                      {getQualityStatusIcon(editedSurvey.qualityCheck.status)}
                    </div>
                    <h3 className="text-sm font-medium">
                      AI Quality Assessment
                    </h3>
                  </div>
                  <p className="text-sm text-gray-400">
                    {editedSurvey.qualityCheck.message}
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="well" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="wellName">Well Name</Label>
                  <Input
                    id="wellName"
                    value={editedSurvey.wellName || ""}
                    onChange={(e) =>
                      handleInputChange("wellName", e.target.value)
                    }
                    className="bg-gray-800 border-gray-700 text-gray-200"
                    placeholder="Enter well name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rigName">Rig Name</Label>
                  <Input
                    id="rigName"
                    value={editedSurvey.rigName || ""}
                    onChange={(e) =>
                      handleInputChange("rigName", e.target.value)
                    }
                    className="bg-gray-800 border-gray-700 text-gray-200"
                    placeholder="Enter rig name"
                  />
                </div>
              </div>

              <div className="p-4 bg-gray-800/30 rounded-md border border-gray-800">
                <h3 className="text-sm font-medium text-gray-300 mb-3">
                  Well Information
                </h3>
                <p className="text-xs text-gray-500 mb-2">
                  Enter the well and rig information to be included in reports
                  and emails. This information will be saved with the survey
                  data.
                </p>
                <p className="text-xs text-gray-500">
                  The sensor offset is used to calculate the measured depth (Bit
                  Depth - Offset = MD).
                </p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="quality" className="space-y-4 mt-4">
            <div className="flex items-center gap-3 mb-4">
              {getQualityStatusIcon(editedSurvey.qualityCheck.status)}
              <div>
                <h3 className="text-lg font-medium text-gray-300">
                  {editedSurvey.qualityCheck.status === "pass"
                    ? "Survey Passed Quality Check"
                    : editedSurvey.qualityCheck.status === "warning"
                      ? "Survey Has Quality Warnings"
                      : "Survey Failed Quality Check"}
                </h3>
                <p className="text-sm text-gray-500">
                  {editedSurvey.qualityCheck.message}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-400">
                Quality Messages
              </h4>
              {qualityMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`p-3 rounded-md flex items-start gap-2 ${msg.type === "pass" ? "bg-green-900/20 text-green-400" : msg.type === "warning" ? "bg-yellow-900/20 text-yellow-400" : msg.type === "fail" ? "bg-red-900/20 text-red-400" : "bg-blue-900/20 text-blue-400"}`}
                >
                  {msg.type === "pass" ? (
                    <CheckCircle className="h-5 w-5 mt-0.5" />
                  ) : msg.type === "warning" ? (
                    <AlertCircle className="h-5 w-5 mt-0.5" />
                  ) : msg.type === "fail" ? (
                    <XCircle className="h-5 w-5 mt-0.5" />
                  ) : (
                    <Info className="h-5 w-5 mt-0.5" />
                  )}
                  <div className="flex flex-col">
                    <span className="text-sm text-gray-300 mb-1">
                      {msg.message}
                    </span>
                    {msg.details && (
                      <span className="text-xs text-gray-500">
                        {msg.details}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="email" className="space-y-4 mt-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-blue-400" />
                <h3 className="text-lg font-medium text-gray-300">
                  Email Survey Report
                </h3>
              </div>
              <Button
                variant="outline"
                className="bg-blue-600 hover:bg-blue-700 text-white border-blue-700"
                onClick={() => setShowEmailSettings(true)}
              >
                <Mail className="h-4 w-4 mr-2" />
                Configure Email
              </Button>
            </div>

            <div className="p-4 bg-gray-800/30 rounded-md border border-gray-800">
              <p className="text-sm text-gray-300 mb-3">
                Send this survey report via email to the drilling team, company
                representatives, or other stakeholders.
              </p>
              <p className="text-xs text-gray-500 mb-2">
                Configure email settings to customize the content and recipients
                of the survey report.
              </p>
              <p className="text-xs text-gray-500">
                Email reports include survey data, quality assessment, and
                optional curve data and visualizations.
              </p>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="mt-6">
          <Button
            variant="outline"
            onClick={onClose}
            className="bg-gray-800 hover:bg-gray-700 text-gray-200 border-gray-700"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Save Survey
          </Button>
        </DialogFooter>

        {showEmailSettings && (
          <SurveyEmailSettings
            isOpen={showEmailSettings}
            onClose={() => setShowEmailSettings(false)}
            emailEnabled={emailEnabled}
            onToggleEmail={setEmailEnabled}
            recipients={emailRecipients}
            onUpdateRecipients={setEmailRecipients}
            surveys={surveys}
            wellName={editedSurvey.wellName || wellInfo?.wellName || ""}
            rigName={editedSurvey.rigName || wellInfo?.rigName || ""}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};

export default SurveyPopup;
