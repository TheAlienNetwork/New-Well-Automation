import React, { useState } from "react";
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
import { CheckCircle, AlertCircle, XCircle, Info } from "lucide-react";

export interface SurveyData {
  id: string;
  timestamp: string;
  bitDepth: number;
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
}

interface SurveyPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (survey: SurveyData) => void;
  surveyData: SurveyData;
}

const SurveyPopup = ({
  isOpen,
  onClose,
  onSave,
  surveyData,
}: SurveyPopupProps) => {
  const [editedSurvey, setEditedSurvey] = useState<SurveyData>(surveyData);
  const [activeTab, setActiveTab] = useState("data");

  const handleInputChange = (field: keyof SurveyData, value: any) => {
    setEditedSurvey((prev) => ({
      ...prev,
      [field]: field === "bitDepth" ? parseFloat(value) : value,
    }));
  };

  const handleSave = () => {
    onSave(editedSurvey);
    onClose();
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
          </TabsList>

          <TabsContent value="data" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="bitDepth">Bit Depth (ft)</Label>
                  <Input
                    id="bitDepth"
                    type="number"
                    step="0.1"
                    value={editedSurvey.bitDepth.toFixed(2)}
                    onChange={(e) =>
                      handleInputChange("bitDepth", parseFloat(e.target.value))
                    }
                    className="bg-gray-800 border-gray-700 text-gray-200"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="inclination">Inclination (°)</Label>
                    <Input
                      id="inclination"
                      type="number"
                      step="0.1"
                      value={editedSurvey.inclination.toFixed(2)}
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
                      value={editedSurvey.azimuth.toFixed(2)}
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
                      value={editedSurvey.toolFace.toFixed(2)}
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
                      value={editedSurvey.toolTemp.toFixed(2)}
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
                      value={editedSurvey.bTotal.toFixed(2)}
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
                      value={editedSurvey.aTotal.toFixed(2)}
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
                    value={editedSurvey.dip.toFixed(2)}
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
      </DialogContent>
    </Dialog>
  );
};

export default SurveyPopup;
