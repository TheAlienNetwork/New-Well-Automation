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
import * as surveyUtils from "@/utils/surveyUtils";
import * as XLSX from "xlsx";
import {
  parseDelimitedFile,
  parseSurveyExcel,
} from "@/utils/surveyImportUtils";

interface SurveyImportProps {
  onImportSurveys: (surveys: SurveyData[]) => void;
}

interface DetectedHeader {
  original: string;
  mapped: string;
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
  const [detectedHeaders, setDetectedHeaders] = useState<DetectedHeader[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setImportStatus("idle");
      setImportMessage("");
      setDetectedHeaders([]);
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
      setDetectedHeaders([]);
    }
  };

  const handleImport = () => {
    if (!selectedFile) return;

    setImportStatus("processing");
    setImportMessage("Processing file...");

    // Process the file based on its extension
    const fileExt = selectedFile.name.split(".").pop()?.toLowerCase();
    if (
      fileExt !== "xlsx" &&
      fileExt !== "xls" &&
      fileExt !== "csv" &&
      fileExt !== "txt"
    ) {
      setImportStatus("error");
      setImportMessage(
        "Invalid file format. Please upload an Excel, CSV, or TXT file.",
      );
      return;
    }

    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        let parsedSurveys: any[] = [];
        let headers: DetectedHeader[] = [];

        if (fileExt === "csv" || fileExt === "txt") {
          // Parse CSV or TXT file
          const content = e.target?.result as string;

          // Check for specific file format with headers at row 68 and data at row 70
          const specificFormat = detectSpecificFileFormat(content);

          if (specificFormat) {
            console.log(
              `Detected specific file format: header at row ${specificFormat.headerRowIndex + 1}, data starts at row ${specificFormat.dataStartRow + 1}`,
            );
            // Use surveyUtils directly for the specific format
            const wellInfoDefault = {
              wellName: "Unknown Well",
              rigName: "Unknown Rig",
              sensorOffset: 0,
            };
            parsedSurveys = surveyUtils.parseCSVSurveys(
              content,
              wellInfoDefault,
              undefined,
              specificFormat.headerRowIndex,
              specificFormat.dataStartRow,
            );
          } else {
            // Use the standard parser for other formats
            parsedSurveys = parseDelimitedFile(content);
          }

          // Extract detected headers
          if (parsedSurveys.length > 0) {
            const firstSurvey = parsedSurveys[0];
            headers = [
              { original: "Bit Depth", mapped: "bitDepth" },
              { original: "Inclination", mapped: "inclination" },
              { original: "Azimuth", mapped: "azimuth" },
            ];

            if (firstSurvey.tvd !== null)
              headers.push({ original: "TVD", mapped: "tvd" });
            if (firstSurvey.northSouth !== null)
              headers.push({ original: "NS", mapped: "northSouth" });
            if (firstSurvey.eastWest !== null)
              headers.push({ original: "EW", mapped: "eastWest" });
            if (firstSurvey.gamma !== null)
              headers.push({ original: "Gamma", mapped: "gamma" });
          }
        } else if (fileExt === "xlsx" || fileExt === "xls") {
          // Parse Excel file
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: "array" });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const excelData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

          parsedSurveys = parseSurveyExcel(excelData as any[][]);

          // Extract detected headers
          if (parsedSurveys.length > 0) {
            const firstSurvey = parsedSurveys[0];
            headers = [
              { original: "Bit Depth", mapped: "bitDepth" },
              { original: "Inclination", mapped: "inclination" },
              { original: "Azimuth", mapped: "azimuth" },
            ];

            if (firstSurvey.tvd !== null)
              headers.push({ original: "TVD", mapped: "tvd" });
            if (firstSurvey.northSouth !== null)
              headers.push({ original: "NS", mapped: "northSouth" });
            if (firstSurvey.eastWest !== null)
              headers.push({ original: "EW", mapped: "eastWest" });
            if (firstSurvey.gamma !== null)
              headers.push({ original: "Gamma", mapped: "gamma" });
          }
        }

        // Convert to SurveyData format
        const surveyData: SurveyData[] = parsedSurveys.map((survey, index) => ({
          id: `imported-${Date.now()}-${index}`,
          timestamp: survey.timestamp || new Date().toISOString(),
          bitDepth: survey.bitDepth || 0,
          inclination: survey.inclination || 0,
          azimuth: survey.azimuth || 0,
          toolFace: 0, // Default value
          bTotal: 0, // Default value
          aTotal: 0, // Default value
          dip: 0, // Default value
          toolTemp: 0, // Default value
          qualityCheck: surveyUtils.determineQualityCheck(
            survey.inclination || 0,
            survey.azimuth || 0,
          ),
        }));

        if (surveyData.length === 0) {
          setImportStatus("error");
          setImportMessage(
            "No valid survey data found in the file. Please check the file format.",
          );
          return;
        }

        setDetectedHeaders(headers);
        setImportedSurveys(surveyData);
        setSelectedSurveys(surveyData.map((s) => s.id));
        setImportStatus("success");
        setImportMessage(
          `Successfully processed ${surveyData.length} surveys from ${selectedFile.name}`,
        );
        setActiveTab("preview");
      } catch (error) {
        console.error("Error parsing file:", error);
        setImportStatus("error");
        setImportMessage(
          `Error parsing file: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    };

    reader.onerror = () => {
      setImportStatus("error");
      setImportMessage("Error reading file. Please try again.");
    };

    if (fileExt === "csv" || fileExt === "txt") {
      reader.readAsText(selectedFile);
    } else {
      reader.readAsArrayBuffer(selectedFile);
    }
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
    setDetectedHeaders([]);
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
                accept=".xlsx,.xls,.csv,.txt"
              />
              <Upload className="h-12 w-12 text-gray-500 mx-auto mb-4" />
              <h3 className="text-gray-300 font-medium mb-2">
                Drag & Drop or Click to Upload
              </h3>
              <p className="text-gray-500 text-sm mb-2">
                Supported formats: XLSX, XLS, CSV, TXT
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

            <div className="bg-blue-900/20 border border-blue-800 rounded-md p-3 flex items-start gap-2">
              <Info className="h-5 w-5 mt-0.5 text-blue-400" />
              <div>
                <p className="text-blue-300 font-medium">
                  Dynamic Header Detection
                </p>
                <p className="text-blue-200 text-sm">
                  The system will automatically detect headers like MD, SD, INC,
                  AZI, TVD, etc. Headers are detected regardless of case or
                  spacing.
                </p>
              </div>
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
                {detectedHeaders.length > 0 && (
                  <div className="mb-4 p-3 bg-gray-800/50 border border-gray-700 rounded-md">
                    <h4 className="text-sm font-medium text-gray-300 mb-2">
                      Detected Headers:
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {detectedHeaders.map((header) => (
                        <Badge
                          key={header.mapped}
                          variant="outline"
                          className="bg-cyan-900/30 text-cyan-400 border-cyan-800"
                        >
                          {header.original} → {header.mapped}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

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
