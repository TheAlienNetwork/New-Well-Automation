import React, { useState } from "react";
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

interface SurveyTableProps {
  surveys: SurveyData[];
  onEditSurvey: (survey: SurveyData) => void;
  onDeleteSurvey: (id: string) => void;
  onExportSurveys: () => void;
}

const SurveyTable = ({
  surveys = [],
  onEditSurvey,
  onDeleteSurvey,
  onExportSurveys,
}: SurveyTableProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");

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

  return (
    <Card className="w-full h-full bg-gray-900 border-gray-800 shadow-lg overflow-hidden flex flex-col">
      <CardHeader className="p-4 pb-0">
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl font-bold text-gray-200">
            MWD Surveys
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="bg-gray-800 border-gray-700 hover:bg-gray-700 text-gray-300"
              onClick={onExportSurveys}
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
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
        <ScrollArea className="h-full">
          <Table>
            <TableHeader className="bg-gray-800/50">
              <TableRow>
                <TableHead className="text-gray-400">Time</TableHead>
                <TableHead className="text-gray-400">Depth (ft)</TableHead>
                <TableHead className="text-gray-400">Inc (°)</TableHead>
                <TableHead className="text-gray-400">Azi (°)</TableHead>
                <TableHead className="text-gray-400">TF (°)</TableHead>
                <TableHead className="text-gray-400">B Total</TableHead>
                <TableHead className="text-gray-400">A Total</TableHead>
                <TableHead className="text-gray-400">Dip (°)</TableHead>
                <TableHead className="text-gray-400">Temp (°F)</TableHead>
                <TableHead className="text-gray-400">Above/Below</TableHead>
                <TableHead className="text-gray-400">Left/Right</TableHead>
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
                    className="border-gray-800 hover:bg-gray-800/50"
                  >
                    <TableCell className="text-gray-300">
                      {formatTimestamp(survey.timestamp)}
                    </TableCell>
                    <TableCell className="text-gray-300 font-medium">
                      {survey.bitDepth.toFixed(2)}
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
                      {survey.bTotal.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-gray-300">
                      {survey.aTotal.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-gray-300">
                      {survey.dip.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-gray-300">
                      {survey.toolTemp.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-gray-300">
                      {(
                        Math.sin((survey.azimuth * Math.PI) / 180) *
                        survey.inclination *
                        0.5
                      ).toFixed(2)}
                      °
                    </TableCell>
                    <TableCell className="text-gray-300">
                      {(
                        Math.cos((survey.azimuth * Math.PI) / 180) *
                        survey.inclination *
                        0.5
                      ).toFixed(2)}
                      °
                    </TableCell>
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
