import React, { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Upload,
  FileSpreadsheet,
  CheckCircle,
  AlertCircle,
  Info,
  Download,
  Save,
  Trash2,
  FileText,
  Table,
} from "lucide-react";
import { SurveyData } from "./SurveyPopup";

interface SurveyImportProps {
  onImportSurveys: (surveys: SurveyData[]) => void;
}

const SurveyImport = ({ onImportSurveys }: SurveyImportProps) => {
  const [activeTab, setActiveTab] = useState("upload");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importStatus, setImportStatus] = useState<
    "idle" | "processing" | "success" | "error"
  >("idle");
  const [importedSurveys, setImportedSurveys] = useState<SurveyData[]>([]);
  const [selectedSurveys, setSelectedSurveys] = useState<string[]>([]);
  const [importMessage, setImportMessage] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setImportStatus("idle");
      setImportMessage("");
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      setSelectedFile(file);
      setImportStatus("idle");
      setImportMessage("");
    }
  };

  const handleImport = () => {
    if (!selectedFile) return;

    setImportStatus("processing");
    setImportMessage("Processing file...");

    // Simulate file processing
    setTimeout(() => {
      // Check file extension
      const fileExt = selectedFile.name.split(".").pop()?.toLowerCase();
      if (fileExt !== "xlsx" && fileExt !== "xls" && fileExt !== "csv") {
        setImportStatus("error");
        setImportMessage(
          "Invalid file format. Please upload an Excel or CSV file.",
        );
        return;
      }

      // Generate dummy survey data for demonstration
      const dummySurveys: SurveyData[] = [];
      const baseDepth = 5000 + Math.random() * 1000;
      const baseInc = 30 + Math.random() * 10;
      const baseAz = 170 + Math.random() * 20;

      for (let i = 0; i < 10; i++) {
        const depth = baseDepth + i * 30;
        const inc = baseInc + (Math.random() - 0.5) * 2;
        const az = baseAz + (Math.random() - 0.5) * 3;

        dummySurveys.push({
          id: `import-${Date.now()}-${i}`,
          timestamp: new Date(Date.now() - i * 3600000).toISOString(),
          bitDepth: depth,
          inclination: inc,
          azimuth: az,
          toolFace: 45 + (Math.random() - 0.5) * 10,
          bTotal: 48 + (Math.random() - 0.5) * 0.5,
          aTotal: 0.98 + (Math.random() - 0.5) * 0.02,
          dip: 62 + (Math.random() - 0.5) * 1,
          toolTemp: 165 + Math.random() * 10,
          qualityCheck: {
            status: Math.random() > 0.8 ? "warning" : "pass",
            message:
              Math.random() > 0.8
                ? "Magnetic interference detected"
                : "All parameters within acceptable ranges",
          },
        });
      }

      setImportedSurveys(dummySurveys);
      setSelectedSurveys(dummySurveys.map((s) => s.id));
      setImportStatus("success");
      setImportMessage(
        `Successfully processed ${dummySurveys.length} surveys from ${selectedFile.name}`,
      );
      setActiveTab("preview");
    }, 1500);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedSurveys(importedSurveys.map((s) => s.id));
    } else {
      setSelectedSurveys([]);
    }
  };

  const handleSelectSurvey = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedSurveys((prev) => [...prev, id]);
    } else {
      setSelectedSurveys((prev) => prev.filter((surveyId) => surveyId !== id));
    }
  };

  const handleSaveImport = () => {
    const surveysToImport = importedSurveys.filter((survey) =>
      selectedSurveys.includes(survey.id),
    );
    onImportSurveys(surveysToImport);
  };

  const handleClearFile = () => {
    setSelectedFile(null);
    setImportStatus("idle");
    setImportMessage("");
    setImportedSurveys([]);
    setSelectedSurveys([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const getStatusBadge = () => {
    switch (importStatus) {
      case "processing":
        return (
          <Badge
            variant="outline"
            className="bg-yellow-900/30 text-yellow-400 border-yellow-800"
          >
            PROCESSING
          </Badge>
        );
      case "success":
        return (
          <Badge
            variant="outline"
            className="bg-green-900/30 text-green-400 border-green-800"
          >
            SUCCESS
          </Badge>
        );
      case "error":
        return (
          <Badge
            variant="outline"
            className="bg-red-900/30 text-red-400 border-red-800"
          >
            ERROR
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <Card className="w-full h-full bg-gray-900 border-gray-800 shadow-lg overflow-hidden">
      <CardHeader className="p-4 pb-2 border-b border-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-blue-400" />
            <CardTitle className="text-lg font-medium text-gray-200">
              Import Surveys
            </CardTitle>
            {getStatusBadge()}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4">
        <Tabs
          defaultValue="upload"
          value={activeTab}
          onValueChange={setActiveTab}
        >
          <TabsList className="bg-gray-800 mb-4">
            <TabsTrigger value="upload">
              <Upload className="h-4 w-4 mr-2" />
              Upload File
            </TabsTrigger>
            <TabsTrigger
              value="preview"
              disabled={importedSurveys.length === 0}
            >
              <Table className="h-4 w-4 mr-2" />
              Preview Data
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-4">
            <div
              className="border-2 border-dashed border-gray-700 rounded-md p-6 text-center cursor-pointer hover:border-gray-500 transition-colors"
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                onChange={handleFileChange}
                accept=".xlsx,.xls,.csv"
              />
              <Upload className="h-12 w-12 text-gray-500 mx-auto mb-4" />
              <h3 className="text-gray-300 font-medium mb-2">
                Drag & Drop or Click to Upload
              </h3>
              <p className="text-gray-500 text-sm mb-2">
                Supported formats: XLSX, XLS, CSV
              </p>
              {selectedFile && (
                <div className="mt-4 p-2 bg-gray-800 rounded-md inline-flex items-center gap-2">
                  <FileSpreadsheet className="h-4 w-4 text-blue-400" />
                  <span className="text-sm text-gray-300">
                    {selectedFile.name}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-gray-400 hover:text-red-400"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleClearFile();
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>

            {importMessage && (
              <div
                className={`p-3 rounded-md flex items-start gap-2 ${importStatus === "error" ? "bg-red-900/20 text-red-400" : importStatus === "success" ? "bg-green-900/20 text-green-400" : "bg-blue-900/20 text-blue-400"}`}
              >
                {importStatus === "error" ? (
                  <AlertCircle className="h-5 w-5 mt-0.5" />
                ) : importStatus === "success" ? (
                  <CheckCircle className="h-5 w-5 mt-0.5" />
                ) : (
                  <Info className="h-5 w-5 mt-0.5" />
                )}
                <span>{importMessage}</span>
              </div>
            )}

            <div className="pt-4 flex justify-end">
              <Button
                className="bg-blue-600 hover:bg-blue-700 text-white"
                onClick={handleImport}
                disabled={!selectedFile || importStatus === "processing"}
              >
                {importStatus === "processing" ? (
                  <>
                    <span className="animate-spin mr-2">⟳</span>
                    Processing...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Import File
                  </>
                )}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="preview" className="space-y-4">
            {importedSurveys.length > 0 && (
              <>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="select-all"
                      checked={
                        selectedSurveys.length === importedSurveys.length
                      }
                      onCheckedChange={handleSelectAll}
                    />
                    <Label
                      htmlFor="select-all"
                      className="text-sm text-gray-300"
                    >
                      Select All ({importedSurveys.length} surveys)
                    </Label>
                  </div>
                  <div className="text-sm text-gray-500">
                    {selectedSurveys.length} of {importedSurveys.length}{" "}
                    selected
                  </div>
                </div>

                <div className="border border-gray-800 rounded-md">
                  <div className="grid grid-cols-12 gap-2 p-2 bg-gray-800 text-xs font-medium text-gray-400 border-b border-gray-700">
                    <div className="col-span-1"></div>
                    <div className="col-span-2">Timestamp</div>
                    <div className="col-span-1">Depth</div>
                    <div className="col-span-1">Inc</div>
                    <div className="col-span-1">Az</div>
                    <div className="col-span-1">TF</div>
                    <div className="col-span-1">B Total</div>
                    <div className="col-span-1">A Total</div>
                    <div className="col-span-1">Dip</div>
                    <div className="col-span-1">Temp</div>
                    <div className="col-span-1">Quality</div>
                  </div>
                  <ScrollArea className="h-[300px]">
                    <div className="p-2 space-y-1">
                      {importedSurveys.map((survey) => (
                        <div
                          key={survey.id}
                          className="grid grid-cols-12 gap-2 p-2 bg-gray-800/30 rounded-md items-center text-xs"
                        >
                          <div className="col-span-1">
                            <Checkbox
                              checked={selectedSurveys.includes(survey.id)}
                              onCheckedChange={(checked) =>
                                handleSelectSurvey(
                                  survey.id,
                                  checked as boolean,
                                )
                              }
                            />
                          </div>
                          <div className="col-span-2 text-gray-300">
                            {new Date(survey.timestamp).toLocaleString()}
                          </div>
                          <div className="col-span-1 text-gray-300">
                            {survey.bitDepth.toFixed(2)}
                          </div>
                          <div className="col-span-1 text-gray-300">
                            {survey.inclination.toFixed(2)}
                          </div>
                          <div className="col-span-1 text-gray-300">
                            {survey.azimuth.toFixed(2)}
                          </div>
                          <div className="col-span-1 text-gray-300">
                            {survey.toolFace.toFixed(2)}
                          </div>
                          <div className="col-span-1 text-gray-300">
                            {survey.bTotal.toFixed(2)}
                          </div>
                          <div className="col-span-1 text-gray-300">
                            {survey.aTotal.toFixed(2)}
                          </div>
                          <div className="col-span-1 text-gray-300">
                            {survey.dip.toFixed(2)}
                          </div>
                          <div className="col-span-1 text-gray-300">
                            {survey.toolTemp.toFixed(2)}
                          </div>
                          <div className="col-span-1">
                            <Badge
                              variant="outline"
                              className={
                                survey.qualityCheck.status === "pass"
                                  ? "bg-green-900/30 text-green-400 border-green-800"
                                  : "bg-yellow-900/30 text-yellow-400 border-yellow-800"
                              }
                            >
                              {survey.qualityCheck.status.toUpperCase()}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>

                <div className="pt-4 flex justify-between">
                  <Button
                    variant="outline"
                    className="bg-gray-800 border-gray-700 hover:bg-gray-700 text-gray-300"
                    onClick={() => setActiveTab("upload")}
                  >
                    Back to Upload
                  </Button>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="bg-gray-800 border-gray-700 hover:bg-gray-700 text-gray-300"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export Template
                    </Button>
                    <Button
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                      onClick={handleSaveImport}
                      disabled={selectedSurveys.length === 0}
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Import Selected ({selectedSurveys.length})
                    </Button>
                  </div>
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default SurveyImport;
