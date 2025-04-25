import React, { useState, useEffect } from "react";
import { useSurveys } from "@/context/SurveyContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Search,
  Download,
  Filter,
  MoreVertical,
  CheckCircle,
  AlertCircle,
  FileText,
  Trash2,
  Edit,
} from "lucide-react";
import { SurveyData } from "./SurveyPopup";
import {
  getLastDetectedHeaders,
  DetectedFileHeaders,
} from "@/utils/surveyUtils";

interface SurveyTableProps {
  surveys: SurveyData[];
  onEditSurvey: (survey: SurveyData) => void;
  onDeleteSurvey: (id: string) => void;
  onExportSurveys: () => void;
  onSelectSurveys?: (ids: string[]) => void;
  selectedSurveys?: string[];
  onEmailSurveys?: () => void;
}

const SurveyTable = ({
  surveys = [],
  onEditSurvey,
  onDeleteSurvey,
  onExportSurveys,
  onSelectSurveys = () => {},
  selectedSurveys = [],
  onEmailSurveys = () => {},
}: SurveyTableProps) => {
  // Auto-select all surveys when the component mounts or surveys change
  React.useEffect(() => {
    if (surveys.length > 0 && selectedSurveys.length !== surveys.length) {
      onSelectSurveys(surveys.map((s) => s.id));
    }
  }, [surveys, selectedSurveys.length, onSelectSurveys]);
  // We can access the global surveys here if needed
  const { surveys: globalSurveys } = useSurveys();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [dynamicHeaders, setDynamicHeaders] =
    useState<DetectedFileHeaders | null>(null);

  // Check for dynamic headers when surveys change
  useEffect(() => {
    const lastHeaders = getLastDetectedHeaders();
    if (lastHeaders && lastHeaders.headers.length > 0) {
      console.log("SurveyTable: Using detected headers:", lastHeaders);
      setDynamicHeaders(lastHeaders);
    }
  }, [surveys]);

  const filteredSurveys = surveys.filter((survey) => {
    // Filter by search term
    const matchesSearch =
      searchTerm === "" ||
      survey.bitDepth.toString().includes(searchTerm) ||
      survey.inclination.toString().includes(searchTerm) ||
      survey.azimuth.toString().includes(searchTerm);

    // Filter by tab
    const matchesTab =
      activeTab === "all" ||
      (activeTab === "pass" && survey.qualityCheck.status === "pass") ||
      (activeTab === "warning" && survey.qualityCheck.status === "warning") ||
      (activeTab === "fail" && survey.qualityCheck.status === "fail");

    return matchesSearch && matchesTab;
  });

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
      case "fail":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  // Helper function to render dynamic cell content based on header
  const renderDynamicCell = (
    survey: SurveyData,
    headerLower: string,
    originalHeader: string,
  ) => {
    // Check for bit depth related headers
    if (
      headerLower.includes("bit") ||
      headerLower.includes("depth") ||
      headerLower === "sd" ||
      headerLower === "survey" ||
      headerLower.includes("hole")
    ) {
      return survey.bitDepth.toFixed(2);
    }

    // Check for measured depth related headers
    if (
      headerLower.includes("md") ||
      headerLower.includes("measured") ||
      (headerLower.includes("depth") && headerLower.includes("measured"))
    ) {
      return (
        survey.measuredDepth || survey.bitDepth - (survey.sensorOffset || 0)
      ).toFixed(2);
    }

    // Check for sensor offset related headers
    if (headerLower.includes("offset") || headerLower.includes("sensor")) {
      return (survey.sensorOffset || 0).toFixed(2);
    }

    // Check for inclination related headers
    if (
      headerLower.includes("inc") ||
      headerLower.includes("inclination") ||
      headerLower.includes("angle") ||
      headerLower.includes("incl") ||
      headerLower === "i"
    ) {
      return survey.inclination.toFixed(2);
    }

    // Check for azimuth related headers
    if (
      headerLower.includes("az") ||
      headerLower.includes("azimuth") ||
      headerLower.includes("heading") ||
      headerLower.includes("azi") ||
      headerLower === "a"
    ) {
      return survey.azimuth.toFixed(2);
    }

    // Check for tool face related headers
    if (
      headerLower.includes("tf") ||
      headerLower.includes("toolface") ||
      headerLower.includes("tool face")
    ) {
      return survey.toolFace.toFixed(2);
    }

    // Check for TVD related headers
    if (headerLower.includes("tvd") || headerLower.includes("true vertical")) {
      const md =
        survey.measuredDepth || survey.bitDepth - (survey.sensorOffset || 0);
      const tvd = md * Math.cos((survey.inclination * Math.PI) / 180);
      return tvd.toFixed(2);
    }

    // Check for NS related headers
    if (
      headerLower.includes("ns") ||
      headerLower.includes("north") ||
      headerLower.includes("south")
    ) {
      const md =
        survey.measuredDepth || survey.bitDepth - (survey.sensorOffset || 0);
      const horizontalDistance =
        md * Math.sin((survey.inclination * Math.PI) / 180);
      const ns =
        horizontalDistance * Math.cos((survey.azimuth * Math.PI) / 180);
      return ns.toFixed(2);
    }

    // Check for EW related headers
    if (
      headerLower.includes("ew") ||
      headerLower.includes("east") ||
      headerLower.includes("west")
    ) {
      const md =
        survey.measuredDepth || survey.bitDepth - (survey.sensorOffset || 0);
      const horizontalDistance =
        md * Math.sin((survey.inclination * Math.PI) / 180);
      const ew =
        horizontalDistance * Math.sin((survey.azimuth * Math.PI) / 180);
      return ew.toFixed(2);
    }

    // Check for magnetic field related headers
    if (
      headerLower.includes("b") ||
      headerLower.includes("magnetic") ||
      headerLower.includes("field")
    ) {
      return survey.bTotal.toFixed(2);
    }

    // Check for gravity related headers
    if (
      headerLower.includes("a") ||
      headerLower.includes("gravity") ||
      headerLower.includes("g total")
    ) {
      return survey.aTotal.toFixed(3);
    }

    // Check for dip related headers
    if (headerLower.includes("dip")) {
      return survey.dip.toFixed(2);
    }

    // Check for temperature related headers
    if (headerLower.includes("temp") || headerLower.includes("temperature")) {
      return survey.toolTemp.toFixed(1);
    }

    // Check for above/below related headers
    if (
      headerLower.includes("above") ||
      headerLower.includes("below") ||
      headerLower.includes("vertical")
    ) {
      const md =
        survey.measuredDepth || survey.bitDepth - (survey.sensorOffset || 0);
      const tvd = md * Math.cos((survey.inclination * Math.PI) / 180);
      const horizontalDistance =
        md * Math.sin((survey.inclination * Math.PI) / 180);
      const ns =
        horizontalDistance * Math.cos((survey.azimuth * Math.PI) / 180);
      const aboveBelow = (ns * 0.8 - tvd * 0.2).toFixed(2);
      const prefix = parseFloat(aboveBelow) >= 0 ? "+" : "";
      return `${prefix}${aboveBelow}`;
    }

    // Check for left/right related headers
    if (
      headerLower.includes("left") ||
      headerLower.includes("right") ||
      headerLower.includes("lateral")
    ) {
      const md =
        survey.measuredDepth || survey.bitDepth - (survey.sensorOffset || 0);
      const tvd = md * Math.cos((survey.inclination * Math.PI) / 180);
      const horizontalDistance =
        md * Math.sin((survey.inclination * Math.PI) / 180);
      const ew =
        horizontalDistance * Math.sin((survey.azimuth * Math.PI) / 180);
      const leftRight = (ew * 0.8 - tvd * 0.1).toFixed(2);
      const prefix = parseFloat(leftRight) >= 0 ? "+" : "";
      return `${prefix}${leftRight}`;
    }

    // For any other headers, try to find a matching property in the survey object
    // or return a placeholder
    return "--";
  };

  return (
    <Card className="w-full h-full bg-gray-900 border-gray-800 shadow-lg overflow-hidden flex flex-col">
      <CardHeader className="p-4 pb-0">
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl font-bold text-gray-200">
            MWD Surveys
          </CardTitle>
          <div className="flex items-center gap-2">
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="bg-gray-800 border-gray-700 hover:bg-gray-700 text-gray-300"
                onClick={onExportSurveys}
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              {selectedSurveys.length > 0 && (
                <Button
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={onEmailSurveys}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Email ({selectedSurveys.length})
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center mt-4">
          <Tabs
            defaultValue="all"
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="bg-gray-800">
              <TabsTrigger value="all">All Surveys</TabsTrigger>
              <TabsTrigger value="pass">Passed</TabsTrigger>
              <TabsTrigger value="warning">Warnings</TabsTrigger>
              <TabsTrigger value="fail">Failed</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex items-center gap-2 ml-4">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search surveys..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 h-9 bg-gray-800 border-gray-700 text-gray-300 w-[200px]"
              />
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-gray-400 hover:text-gray-300 hover:bg-gray-800"
            >
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 pt-4 flex-grow overflow-hidden">
        <ScrollArea
          className="h-full"
          style={{ maxHeight: surveys.length > 10 ? "500px" : "auto" }}
        >
          <Table>
            <TableHeader className="bg-gray-800/50">
              <TableRow>
                <TableHead className="text-gray-400 w-10">
                  <input
                    type="checkbox"
                    className="rounded bg-gray-700 border-gray-600 text-blue-600"
                    checked={
                      selectedSurveys.length > 0 &&
                      selectedSurveys.length === surveys.length
                    }
                    onChange={(e) => {
                      if (e.target.checked) {
                        onSelectSurveys(surveys.map((s) => s.id));
                      } else {
                        onSelectSurveys([]);
                      }
                    }}
                  />
                </TableHead>
                <TableHead className="text-gray-400">Time</TableHead>
                {dynamicHeaders && dynamicHeaders.originalHeaders.length > 0 ? (
                  // Use dynamic headers if available
                  dynamicHeaders.originalHeaders.map((header, index) => (
                    <TableHead key={index} className="text-gray-400">
                      {header}
                    </TableHead>
                  ))
                ) : (
                  // Use default headers if no dynamic headers are available
                  <>
                    <TableHead className="text-gray-400">
                      Bit Depth (ft)
                    </TableHead>
                    <TableHead className="text-gray-400">MD (ft)</TableHead>
                    <TableHead className="text-gray-400">
                      Sensor Offset (ft)
                    </TableHead>
                    <TableHead className="text-gray-400">Inc (°)</TableHead>
                    <TableHead className="text-gray-400">Azi (°)</TableHead>
                    <TableHead className="text-gray-400">TF (°)</TableHead>
                    <TableHead className="text-gray-400">TVD (ft)</TableHead>
                    <TableHead className="text-gray-400">NS (ft)</TableHead>
                    <TableHead className="text-gray-400">EW (ft)</TableHead>
                    <TableHead className="text-gray-400">B Total</TableHead>
                    <TableHead className="text-gray-400">A Total</TableHead>
                    <TableHead className="text-gray-400">Dip (°)</TableHead>
                    <TableHead className="text-gray-400">Temp (°F)</TableHead>
                    <TableHead className="text-gray-400">Above/Below</TableHead>
                    <TableHead className="text-gray-400">Left/Right</TableHead>
                  </>
                )}
                <TableHead className="text-gray-400">Quality</TableHead>
                <TableHead className="text-gray-400 text-right">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSurveys.length > 0 ? (
                filteredSurveys.map((survey) => (
                  <TableRow
                    key={survey.id}
                    className={`border-gray-800 hover:bg-gray-800/50 ${selectedSurveys.includes(survey.id) ? "bg-gray-800/30" : ""}`}
                  >
                    <TableCell>
                      <input
                        type="checkbox"
                        className="rounded bg-gray-700 border-gray-600 text-blue-600"
                        checked={selectedSurveys.includes(survey.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            onSelectSurveys([...selectedSurveys, survey.id]);
                          } else {
                            onSelectSurveys(
                              selectedSurveys.filter((id) => id !== survey.id),
                            );
                          }
                        }}
                      />
                    </TableCell>
                    <TableCell className="text-gray-300">
                      {formatTimestamp(survey.timestamp)}
                    </TableCell>
                    {dynamicHeaders &&
                    dynamicHeaders.originalHeaders.length > 0 ? (
                      // Render cells based on dynamic headers
                      dynamicHeaders.originalHeaders.map((header, index) => {
                        const lowerHeader = header.toLowerCase();
                        return (
                          <TableCell key={index} className="text-gray-300">
                            {renderDynamicCell(
                              survey,
                              lowerHeader,
                              dynamicHeaders.headers[index],
                            )}
                          </TableCell>
                        );
                      })
                    ) : (
                      // Render default cells
                      <>
                        <TableCell className="text-gray-300 font-medium">
                          {survey.bitDepth.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-gray-300">
                          {(
                            survey.measuredDepth ||
                            survey.bitDepth - (survey.sensorOffset || 0)
                          ).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-gray-300">
                          {(survey.sensorOffset || 0).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-gray-300">
                          {survey.inclination.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-gray-300">
                          {survey.azimuth.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-gray-300">
                          {survey.toolFace.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-gray-300">
                          {(() => {
                            // Calculate TVD - Measured Depth * cos(inclination)
                            const md =
                              survey.measuredDepth ||
                              survey.bitDepth - (survey.sensorOffset || 0);
                            const tvd =
                              md *
                              Math.cos((survey.inclination * Math.PI) / 180);
                            return tvd.toFixed(2);
                          })()}
                        </TableCell>
                        <TableCell className="text-gray-300">
                          {(() => {
                            // Calculate MD (if not provided)
                            const md =
                              survey.measuredDepth ||
                              survey.bitDepth - (survey.sensorOffset || 0);
                            // Calculate horizontal distance
                            const horizontalDistance =
                              md *
                              Math.sin((survey.inclination * Math.PI) / 180);
                            // Calculate NS component (North is positive)
                            const ns =
                              horizontalDistance *
                              Math.cos((survey.azimuth * Math.PI) / 180);
                            return ns.toFixed(2);
                          })()}
                        </TableCell>
                        <TableCell className="text-gray-300">
                          {(() => {
                            // Calculate MD (if not provided)
                            const md =
                              survey.measuredDepth ||
                              survey.bitDepth - (survey.sensorOffset || 0);
                            // Calculate horizontal distance
                            const horizontalDistance =
                              md *
                              Math.sin((survey.inclination * Math.PI) / 180);
                            // Calculate EW component (East is positive)
                            const ew =
                              horizontalDistance *
                              Math.sin((survey.azimuth * Math.PI) / 180);
                            return ew.toFixed(2);
                          })()}
                        </TableCell>
                        <TableCell className="text-gray-300">
                          {survey.bTotal.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-gray-300">
                          {survey.aTotal.toFixed(3)}
                        </TableCell>
                        <TableCell className="text-gray-300">
                          {survey.dip.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-gray-300">
                          {survey.toolTemp.toFixed(1)}
                        </TableCell>
                        <TableCell className="text-gray-300">
                          {(() => {
                            // Calculate MD (if not provided)
                            const md =
                              survey.measuredDepth ||
                              survey.bitDepth - (survey.sensorOffset || 0);
                            // Calculate TVD
                            const tvd =
                              md *
                              Math.cos((survey.inclination * Math.PI) / 180);
                            // Calculate horizontal distance
                            const horizontalDistance =
                              md *
                              Math.sin((survey.inclination * Math.PI) / 180);
                            // Calculate NS/EW components
                            const ns =
                              horizontalDistance *
                              Math.cos((survey.azimuth * Math.PI) / 180);
                            const ew =
                              horizontalDistance *
                              Math.sin((survey.azimuth * Math.PI) / 180);

                            // Calculate above/below based on target line (simplified)
                            // Positive means above target, negative means below
                            const aboveBelow = (ns * 0.8 - tvd * 0.2).toFixed(
                              2,
                            );
                            const prefix =
                              parseFloat(aboveBelow) >= 0 ? "+" : "";
                            return `${prefix}${aboveBelow}`;
                          })()}
                        </TableCell>
                        <TableCell className="text-gray-300">
                          {(() => {
                            // Calculate MD (if not provided)
                            const md =
                              survey.measuredDepth ||
                              survey.bitDepth - (survey.sensorOffset || 0);
                            // Calculate TVD
                            const tvd =
                              md *
                              Math.cos((survey.inclination * Math.PI) / 180);
                            // Calculate horizontal distance
                            const horizontalDistance =
                              md *
                              Math.sin((survey.inclination * Math.PI) / 180);
                            // Calculate NS/EW components
                            const ns =
                              horizontalDistance *
                              Math.cos((survey.azimuth * Math.PI) / 180);
                            const ew =
                              horizontalDistance *
                              Math.sin((survey.azimuth * Math.PI) / 180);

                            // Calculate left/right based on target line (simplified)
                            // Positive means right of target, negative means left
                            const leftRight = (ew * 0.8 - tvd * 0.1).toFixed(2);
                            const prefix =
                              parseFloat(leftRight) >= 0 ? "+" : "";
                            return `${prefix}${leftRight}`;
                          })()}
                        </TableCell>
                      </>
                    )}
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`flex items-center gap-1 ${getQualityStatusColor(survey.qualityCheck.status)}`}
                      >
                        {getQualityStatusIcon(survey.qualityCheck.status)}
                        <span>
                          {survey.qualityCheck.status.charAt(0).toUpperCase() +
                            survey.qualityCheck.status.slice(1)}
                        </span>
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-gray-400 hover:text-gray-300 hover:bg-gray-800"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="bg-gray-900 border-gray-800"
                        >
                          <DropdownMenuItem
                            className="text-gray-300 hover:bg-gray-800 focus:bg-gray-800 cursor-pointer"
                            onClick={() => onEditSurvey(survey)}
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Survey
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-gray-300 hover:bg-gray-800 focus:bg-gray-800 cursor-pointer">
                            <FileText className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-red-400 hover:bg-gray-800 focus:bg-gray-800 cursor-pointer"
                            onClick={() => onDeleteSurvey(survey.id)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={11}
                    className="h-24 text-center text-gray-500"
                  >
                    No surveys found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default SurveyTable;
