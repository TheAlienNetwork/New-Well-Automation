import React, { useState, useEffect, useMemo, useCallback } from "react";
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
import { format } from "date-fns";

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
  const { surveys: globalSurveys } = useSurveys();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [dynamicHeaders, setDynamicHeaders] =
    useState<DetectedFileHeaders | null>(null);

  // Auto-select all surveys when the component mounts or surveys change
  useEffect(() => {
    if (surveys.length > 0 && selectedSurveys.length !== surveys.length) {
      onSelectSurveys(surveys.map((s) => s.id));
    }
  }, [surveys, selectedSurveys.length, onSelectSurveys]);

  // Check for dynamic headers when surveys change
  useEffect(() => {
    const lastHeaders = getLastDetectedHeaders();
    if (lastHeaders && lastHeaders.headers.length > 0) {
      setDynamicHeaders(lastHeaders);
    }
  }, [surveys]);

  // Memoized filtered surveys for better performance
  const filteredSurveys = useMemo(() => {
    return surveys.filter((survey) => {
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
  }, [surveys, searchTerm, activeTab]);

  // Calculate derived survey data once
  const surveysWithCalculations = useMemo(() => {
    return filteredSurveys.map((survey) => {
      const md =
        survey.measuredDepth || survey.bitDepth - (survey.sensorOffset || 0);
      const inclinationRad = (survey.inclination * Math.PI) / 180;
      const azimuthRad = (survey.azimuth * Math.PI) / 180;

      const tvd = md * Math.cos(inclinationRad);
      const horizontalDistance = md * Math.sin(inclinationRad);
      const ns = horizontalDistance * Math.cos(azimuthRad);
      const ew = horizontalDistance * Math.sin(azimuthRad);
      const aboveBelow = ns * 0.8 - tvd * 0.2;
      const leftRight = ew * 0.8 - tvd * 0.1;

      return {
        ...survey,
        md,
        tvd,
        ns,
        ew,
        aboveBelow,
        leftRight,
      };
    });
  }, [filteredSurveys]);

  // Memoized quality status styles
  const getQualityStatusColor = useCallback((status: string) => {
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
  }, []);

  const getQualityStatusIcon = useCallback((status: string) => {
    switch (status) {
      case "pass":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "warning":
      case "fail":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  }, []);

  // Format timestamp with date-fns for better localization
  const formatTimestamp = useCallback((timestamp: string) => {
    try {
      return format(new Date(timestamp), "MMM dd, yyyy HH:mm:ss");
    } catch {
      return "Invalid date";
    }
  }, []);

  // Helper function to render dynamic cell content based on header
  const renderDynamicCell = useCallback((survey: any, headerLower: string) => {
    const mappings: Record<string, () => string> = {
      // Bit depth related headers
      bit: () => survey.bitDepth.toFixed(2),
      depth: () => survey.bitDepth.toFixed(2),
      sd: () => survey.bitDepth.toFixed(2),
      survey: () => survey.bitDepth.toFixed(2),
      hole: () => survey.bitDepth.toFixed(2),

      // Measured depth
      md: () => survey.md.toFixed(2),
      measured: () => survey.md.toFixed(2),

      // Sensor offset
      offset: () => (survey.sensorOffset || 0).toFixed(2),
      sensor: () => (survey.sensorOffset || 0).toFixed(2),

      // Inclination
      inc: () => survey.inclination.toFixed(2),
      inclination: () => survey.inclination.toFixed(2),
      angle: () => survey.inclination.toFixed(2),
      incl: () => survey.inclination.toFixed(2),
      i: () => survey.inclination.toFixed(2),

      // Azimuth
      az: () => survey.azimuth.toFixed(2),
      azimuth: () => survey.azimuth.toFixed(2),
      heading: () => survey.azimuth.toFixed(2),
      azi: () => survey.azimuth.toFixed(2),
      a: () => survey.azimuth.toFixed(2),

      // Tool face
      tf: () => survey.toolFace.toFixed(2),
      toolface: () => survey.toolFace.toFixed(2),
      "tool face": () => survey.toolFace.toFixed(2),

      // TVD
      tvd: () => survey.tvd.toFixed(2),
      "true vertical": () => survey.tvd.toFixed(2),

      // NS
      ns: () => survey.ns.toFixed(2),
      north: () => survey.ns.toFixed(2),
      south: () => survey.ns.toFixed(2),

      // EW
      ew: () => survey.ew.toFixed(2),
      east: () => survey.ew.toFixed(2),
      west: () => survey.ew.toFixed(2),

      // Magnetic field
      b: () => survey.bTotal.toFixed(2),
      magnetic: () => survey.bTotal.toFixed(2),
      field: () => survey.bTotal.toFixed(2),

      // Gravity
      a: () => survey.aTotal.toFixed(3),
      gravity: () => survey.aTotal.toFixed(3),
      "g total": () => survey.aTotal.toFixed(3),

      // Dip
      dip: () => survey.dip.toFixed(2),

      // Temperature
      temp: () => survey.toolTemp.toFixed(1),
      temperature: () => survey.toolTemp.toFixed(1),

      // Above/below
      above: () =>
        `${survey.aboveBelow >= 0 ? "+" : ""}${survey.aboveBelow.toFixed(2)}`,
      below: () =>
        `${survey.aboveBelow >= 0 ? "+" : ""}${survey.aboveBelow.toFixed(2)}`,
      vertical: () =>
        `${survey.aboveBelow >= 0 ? "+" : ""}${survey.aboveBelow.toFixed(2)}`,

      // Left/right
      left: () =>
        `${survey.leftRight >= 0 ? "+" : ""}${survey.leftRight.toFixed(2)}`,
      right: () =>
        `${survey.leftRight >= 0 ? "+" : ""}${survey.leftRight.toFixed(2)}`,
      lateral: () =>
        `${survey.leftRight >= 0 ? "+" : ""}${survey.leftRight.toFixed(2)}`,
    };

    for (const [key, fn] of Object.entries(mappings)) {
      if (headerLower.includes(key)) {
        return fn();
      }
    }

    return "--";
  }, []);

  // Default headers configuration
  const defaultHeaders = useMemo(
    () => [
      { key: "bitDepth", label: "Bit Depth (ft)" },
      { key: "md", label: "MD (ft)" },
      { key: "sensorOffset", label: "Sensor Offset (ft)" },
      { key: "inclination", label: "Inc (°)" },
      { key: "azimuth", label: "Azi (°)" },
      { key: "toolFace", label: "TF (°)" },
      { key: "tvd", label: "TVD (ft)" },
      { key: "ns", label: "NS (ft)" },
      { key: "ew", label: "EW (ft)" },
      { key: "bTotal", label: "B Total" },
      { key: "aTotal", label: "A Total" },
      { key: "dip", label: "Dip (°)" },
      { key: "toolTemp", label: "Temp (°F)" },
      { key: "aboveBelow", label: "Above/Below" },
      { key: "leftRight", label: "Left/Right" },
    ],
    [],
  );

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
          style={{ maxHeight: "calc(100vh - 250px)" }}
        >
          <Table>
            <TableHeader className="bg-gray-800/50 sticky top-0 z-10">
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
                {dynamicHeaders?.originalHeaders.length > 0
                  ? dynamicHeaders.originalHeaders.map((header, index) => (
                      <TableHead key={index} className="text-gray-400">
                        {header}
                      </TableHead>
                    ))
                  : defaultHeaders.map((header) => (
                      <TableHead key={header.key} className="text-gray-400">
                        {header.label}
                      </TableHead>
                    ))}
                <TableHead className="text-gray-400">Quality</TableHead>
                <TableHead className="text-gray-400 text-right">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {surveysWithCalculations.length > 0 ? (
                surveysWithCalculations.map((survey) => (
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
                    {dynamicHeaders?.originalHeaders.length > 0
                      ? dynamicHeaders.originalHeaders.map((header, index) => {
                          const lowerHeader = header.toLowerCase();
                          return (
                            <TableCell key={index} className="text-gray-300">
                              {renderDynamicCell(survey, lowerHeader)}
                            </TableCell>
                          );
                        })
                      : defaultHeaders.map((header) => (
                          <TableCell key={header.key} className="text-gray-300">
                            {survey[header.key] !== undefined
                              ? typeof survey[header.key] === "number"
                                ? survey[header.key].toFixed(
                                    header.key.includes("Total") ? 3 : 2,
                                  )
                                : survey[header.key]
                              : "--"}
                          </TableCell>
                        ))}
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
                    colSpan={
                      dynamicHeaders?.originalHeaders.length
                        ? dynamicHeaders.originalHeaders.length + 3
                        : 18
                    }
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
