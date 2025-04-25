import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Brain,
  AlertTriangle,
  Settings,
  BarChart3,
  Zap,
  Filter,
  Wrench,
  ChevronDown,
  Info,
  RefreshCw,
  FileText,
  Download,
  Lightbulb,
  Gauge,
  Thermometer,
  Layers,
  ArrowUpDown,
  RotateCw,
  Vibrate,
  CheckCircle,
  XCircle,
  Clock,
  Calendar,
  Maximize2,
  X,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface AIAnalyticsProps {
  predictions?: {
    toolFailure: {
      risk: number;
      timeToFailure?: string;
      components: { name: string; risk: number }[];
    };
    stuckPipe: {
      risk: number;
      indicators: { name: string; value: number }[];
    };
    decodeQuality: {
      quality: number;
      noiseLevel: number;
      recommendations: string[];
    };
    shockAndVibe: {
      severity: number;
      axial: number;
      lateral: number;
      torsional: number;
      recommendations: string[];
    };
  };
  isLoading?: boolean;
  onRefresh?: () => void;
  onConfigureAI?: () => void;
}

const AIAnalytics = ({
  predictions = {
    toolFailure: {
      risk: 23,
      timeToFailure: "~48 hours",
      components: [
        { name: "MWD Battery", risk: 42 },
        { name: "Pulser Assembly", risk: 18 },
        { name: "Directional Module", risk: 12 },
      ],
    },
    stuckPipe: {
      risk: 8,
      indicators: [
        { name: "Torque Variation", value: 12 },
        { name: "Drag", value: 5 },
        { name: "ROP Decrease", value: 7 },
      ],
    },
    decodeQuality: {
      quality: 87,
      noiseLevel: 32,
      recommendations: [
        "Increase signal amplitude",
        "Apply band-pass filter (15-30Hz)",
        "Check surface connections",
      ],
    },
    shockAndVibe: {
      severity: 35,
      axial: 28,
      lateral: 42,
      torsional: 15,
      recommendations: [
        "Reduce WOB by 5-10%",
        "Adjust drilling parameters to minimize lateral vibration",
        "Monitor BHA components for potential damage",
      ],
    },
  },
  isLoading = false,
  onRefresh = () => {},
  onConfigureAI = () => {},
}: AIAnalyticsProps) => {
  const [activeTab, setActiveTab] = useState("tool-failure");
  const [filterStrength, setFilterStrength] = useState(50);
  const [showFullReport, setShowFullReport] = useState(false);
  const [confidenceLevel, setConfidenceLevel] = useState(92);

  // Helper function to determine risk color
  const getRiskColor = (risk: number) => {
    if (risk < 20) return "text-green-500";
    if (risk < 50) return "text-yellow-500";
    return "text-red-500";
  };

  // Helper function to determine risk background
  const getRiskBgColor = (risk: number) => {
    if (risk < 20) return "bg-green-500";
    if (risk < 50) return "bg-yellow-500";
    return "bg-red-500";
  };

  // Helper function to determine quality color
  const getQualityColor = (quality: number) => {
    if (quality > 80) return "text-green-500";
    if (quality > 50) return "text-yellow-500";
    return "text-red-500";
  };

  // Generate historical data for visualization
  const generateHistoricalData = (dataType: string) => {
    const data = [];
    let baseValue = 0;

    switch (dataType) {
      case "vibration":
        baseValue = 30;
        break;
      case "temperature":
        baseValue = 165;
        break;
      case "battery":
        baseValue = 90;
        break;
      default:
        baseValue = 50;
    }

    for (let i = 0; i < 24; i++) {
      const timePoint = new Date();
      timePoint.setHours(timePoint.getHours() - 24 + i);

      // Create some patterns in the data
      let value = baseValue;
      if (dataType === "vibration") {
        // Vibration increases during certain hours
        if (i > 15 && i < 20) {
          value += 20 + Math.random() * 10;
        } else {
          value += Math.random() * 15;
        }
      } else if (dataType === "temperature") {
        // Temperature gradually increases
        value += (i / 24) * 5 + Math.random() * 2;
      } else if (dataType === "battery") {
        // Battery gradually decreases
        value -= (i / 24) * 15 + Math.random() * 3;
      }

      data.push({
        time: timePoint.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        value: value,
        date: timePoint.toLocaleDateString([], {
          month: "short",
          day: "numeric",
        }),
      });
    }

    return data;
  };

  // Generate data for pie charts
  const generatePieData = (dataType: string) => {
    if (dataType === "failures") {
      return [
        { name: "Battery", value: 42, color: "#ef4444" },
        { name: "Pulser", value: 18, color: "#f59e0b" },
        { name: "Directional", value: 12, color: "#10b981" },
        { name: "Sensors", value: 8, color: "#0ea5e9" },
        { name: "Other", value: 20, color: "#8b5cf6" },
      ];
    } else if (dataType === "vibration") {
      return [
        { name: "Lateral", value: 42, color: "#ef4444" },
        { name: "Axial", value: 28, color: "#f59e0b" },
        { name: "Torsional", value: 15, color: "#10b981" },
        { name: "Other", value: 15, color: "#8b5cf6" },
      ];
    }
    return [];
  };

  return (
    <Card className="w-full h-full bg-gray-950 border-gray-800 shadow-lg overflow-hidden flex flex-col">
      <CardHeader className="p-4 pb-2 border-b border-gray-800 bg-gradient-to-r from-gray-900 to-gray-950">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-cyan-900/50 p-1.5 rounded-md">
              <Brain className="h-5 w-5 text-cyan-400" />
            </div>
            <CardTitle className="text-lg font-medium text-gray-200">
              AI Analytics
            </CardTitle>
            <Badge
              variant="outline"
              className="ml-2 bg-cyan-950/30 text-cyan-400 border-cyan-800"
            >
              BETA
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-gray-400 hover:text-gray-300 hover:bg-gray-800"
                    onClick={onRefresh}
                    disabled={isLoading}
                  >
                    <RefreshCw
                      className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
                    />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Refresh Analysis</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-gray-400 hover:text-gray-300 hover:bg-gray-800"
                    onClick={onConfigureAI}
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Configure AI Settings</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-gray-400 hover:text-gray-300 hover:bg-gray-800"
                    onClick={() => setShowFullReport(!showFullReport)}
                  >
                    <Maximize2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Full Report</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0 flex-grow flex flex-col h-[800px]">
        {!showFullReport ? (
          <Tabs
            defaultValue="tool-failure"
            value={activeTab}
            onValueChange={setActiveTab}
            className="flex-grow flex flex-col"
          >
            <TabsList className="grid grid-cols-4 bg-gray-900 rounded-none border-b border-gray-800">
              <TabsTrigger
                value="tool-failure"
                className="data-[state=active]:bg-gray-950 data-[state=active]:text-cyan-400 py-2 text-xs"
              >
                <Wrench className="h-3.5 w-3.5 mr-1" />
                Tool Failure
              </TabsTrigger>
              <TabsTrigger
                value="stuck-pipe"
                className="data-[state=active]:bg-gray-950 data-[state=active]:text-cyan-400 py-2 text-xs"
              >
                <AlertTriangle className="h-3.5 w-3.5 mr-1" />
                Stuck Pipe
              </TabsTrigger>
              <TabsTrigger
                value="decode-quality"
                className="data-[state=active]:bg-gray-950 data-[state=active]:text-cyan-400 py-2 text-xs"
              >
                <BarChart3 className="h-3.5 w-3.5 mr-1" />
                Decode Quality
              </TabsTrigger>
              <TabsTrigger
                value="shock-vibe"
                className="data-[state=active]:bg-gray-950 data-[state=active]:text-cyan-400 py-2 text-xs"
              >
                <Zap className="h-3.5 w-3.5 mr-1" />
                Shock & Vibe
              </TabsTrigger>
            </TabsList>

            {/* Tool Failure Tab */}
            <TabsContent
              value="tool-failure"
              className="flex-grow p-4 space-y-4 overflow-auto bg-gradient-to-b from-gray-950 to-gray-900"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-gray-300">
                    Failure Risk Assessment
                  </h3>
                  <p className="text-sm text-gray-500">
                    Predicted time to failure:{" "}
                    {predictions.toolFailure.timeToFailure}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-2xl font-bold ${getRiskColor(predictions.toolFailure.risk)}`}
                  >
                    {predictions.toolFailure.risk}%
                  </span>
                  <div className="w-16 h-16 relative flex items-center justify-center">
                    <svg className="w-full h-full" viewBox="0 0 36 36">
                      <path
                        d="M18 2.0845
                          a 15.9155 15.9155 0 0 1 0 31.831
                          a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="#1e293b"
                        strokeWidth="3"
                      />
                      <path
                        d="M18 2.0845
                          a 15.9155 15.9155 0 0 1 0 31.831
                          a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke={
                          predictions.toolFailure.risk < 20
                            ? "#10b981"
                            : predictions.toolFailure.risk < 50
                              ? "#f59e0b"
                              : "#ef4444"
                        }
                        strokeWidth="3"
                        strokeDasharray={`${predictions.toolFailure.risk}, 100`}
                        style={{
                          filter: `drop-shadow(0 0 4px ${predictions.toolFailure.risk < 20 ? "#10b98180" : predictions.toolFailure.risk < 50 ? "#f59e0b80" : "#ef444480"})`,
                        }}
                      />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-sm font-medium text-gray-400">
                  Component Risk Analysis
                </h4>
                {predictions.toolFailure.components.map((component, index) => (
                  <div key={index} className="space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-300">
                        {component.name}
                      </span>
                      <span
                        className={`text-sm font-medium ${getRiskColor(component.risk)}`}
                      >
                        {component.risk}%
                      </span>
                    </div>
                    <Progress
                      value={component.risk}
                      max={100}
                      className="h-2 bg-gray-800"
                      indicatorClassName={`${getRiskBgColor(component.risk)}`}
                    />
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-gray-800">
                <h4 className="text-sm font-medium text-gray-400 mb-2">
                  Preventive Actions
                </h4>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <Zap className="h-4 w-4 text-cyan-400 mt-0.5" />
                    <span className="text-sm text-gray-300">
                      Schedule battery replacement within next 24 hours
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Zap className="h-4 w-4 text-cyan-400 mt-0.5" />
                    <span className="text-sm text-gray-300">
                      Inspect pulser assembly during next connection
                    </span>
                  </li>
                </ul>
              </div>

              <div className="pt-2 border-t border-gray-800">
                <h4 className="text-sm font-medium text-gray-400 mb-2">
                  Battery Voltage Trend
                </h4>
                <div className="h-[120px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={generateHistoricalData("battery")}
                      margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="time" stroke="#64748b" />
                      <YAxis stroke="#64748b" domain={[60, 100]} />
                      <RechartsTooltip
                        contentStyle={{
                          backgroundColor: "#0f172a",
                          borderColor: "#1e293b",
                          color: "#e2e8f0",
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke="#f59e0b"
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </TabsContent>

            {/* Stuck Pipe Tab */}
            <TabsContent
              value="stuck-pipe"
              className="flex-grow p-4 space-y-4 overflow-auto bg-gradient-to-b from-gray-950 to-gray-900"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-gray-300">
                    Stuck Pipe Risk
                  </h3>
                  <p className="text-sm text-gray-500">
                    Current conditions assessment
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-2xl font-bold ${getRiskColor(predictions.stuckPipe.risk)}`}
                  >
                    {predictions.stuckPipe.risk}%
                  </span>
                  <div className="w-16 h-16 relative flex items-center justify-center">
                    <svg className="w-full h-full" viewBox="0 0 36 36">
                      <path
                        d="M18 2.0845
                          a 15.9155 15.9155 0 0 1 0 31.831
                          a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="#1e293b"
                        strokeWidth="3"
                      />
                      <path
                        d="M18 2.0845
                          a 15.9155 15.9155 0 0 1 0 31.831
                          a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke={
                          predictions.stuckPipe.risk < 20
                            ? "#10b981"
                            : predictions.stuckPipe.risk < 50
                              ? "#f59e0b"
                              : "#ef4444"
                        }
                        strokeWidth="3"
                        strokeDasharray={`${predictions.stuckPipe.risk}, 100`}
                        style={{
                          filter: `drop-shadow(0 0 4px ${predictions.stuckPipe.risk < 20 ? "#10b98180" : predictions.stuckPipe.risk < 50 ? "#f59e0b80" : "#ef444480"})`,
                        }}
                      />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-sm font-medium text-gray-400">
                  Risk Indicators
                </h4>
                {predictions.stuckPipe.indicators.map((indicator, index) => (
                  <div key={index} className="space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-300">
                        {indicator.name}
                      </span>
                      <span
                        className={`text-sm font-medium ${getRiskColor(indicator.value)}`}
                      >
                        {indicator.value}%
                      </span>
                    </div>
                    <Progress
                      value={indicator.value}
                      max={100}
                      className="h-2 bg-gray-800"
                      indicatorClassName={`${getRiskBgColor(indicator.value)}`}
                    />
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-gray-800">
                <h4 className="text-sm font-medium text-gray-400 mb-2">
                  Recommended Actions
                </h4>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                    <span className="text-sm text-gray-300">
                      Maintain current drilling parameters
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Zap className="h-4 w-4 text-cyan-400 mt-0.5" />
                    <span className="text-sm text-gray-300">
                      Monitor torque variations during next 30 minutes
                    </span>
                  </li>
                </ul>
              </div>

              <div className="pt-2 border-t border-gray-800">
                <h4 className="text-sm font-medium text-gray-400 mb-2">
                  Torque Variation Trend
                </h4>
                <div className="h-[120px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={[
                        { time: "00:00", value: 10 },
                        { time: "01:00", value: 12 },
                        { time: "02:00", value: 8 },
                        { time: "03:00", value: 15 },
                        { time: "04:00", value: 12 },
                        { time: "05:00", value: 10 },
                      ]}
                      margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="time" stroke="#64748b" />
                      <YAxis stroke="#64748b" />
                      <RechartsTooltip
                        contentStyle={{
                          backgroundColor: "#0f172a",
                          borderColor: "#1e293b",
                          color: "#e2e8f0",
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="value"
                        stroke="#0ea5e9"
                        fill="#0ea5e950"
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </TabsContent>

            {/* Decode Quality Tab */}
            <TabsContent
              value="decode-quality"
              className="flex-grow p-4 space-y-4 overflow-auto bg-gradient-to-b from-gray-950 to-gray-900"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-gray-300">
                    Signal Quality
                  </h3>
                  <p className="text-sm text-gray-500">
                    Current decode performance
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-2xl font-bold ${getQualityColor(predictions.decodeQuality.quality)}`}
                  >
                    {predictions.decodeQuality.quality}%
                  </span>
                  <div className="w-16 h-16 relative flex items-center justify-center">
                    <svg className="w-full h-full" viewBox="0 0 36 36">
                      <path
                        d="M18 2.0845
                          a 15.9155 15.9155 0 0 1 0 31.831
                          a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="#1e293b"
                        strokeWidth="3"
                      />
                      <path
                        d="M18 2.0845
                          a 15.9155 15.9155 0 0 1 0 31.831
                          a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke={
                          predictions.decodeQuality.quality > 80
                            ? "#10b981"
                            : predictions.decodeQuality.quality > 50
                              ? "#f59e0b"
                              : "#ef4444"
                        }
                        strokeWidth="3"
                        strokeDasharray={`${predictions.decodeQuality.quality}, 100`}
                        style={{
                          filter: `drop-shadow(0 0 4px ${predictions.decodeQuality.quality > 80 ? "#10b98180" : predictions.decodeQuality.quality > 50 ? "#f59e0b80" : "#ef444480"})`,
                        }}
                      />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="text-sm font-medium text-gray-400">
                    Noise Level
                  </h4>
                  <span className="text-sm text-gray-300">
                    {predictions.decodeQuality.noiseLevel}%
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">
                      Filter Strength
                    </span>
                    <span className="text-xs text-gray-500">
                      {filterStrength}%
                    </span>
                  </div>
                  <Slider
                    value={[filterStrength]}
                    onValueChange={(values) => setFilterStrength(values[0])}
                    max={100}
                    step={1}
                    className="cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Minimal</span>
                    <span>Aggressive</span>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-gray-800">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium text-gray-400">
                    Recommendations
                  </h4>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 px-2 text-xs border-gray-700 bg-gray-800 hover:bg-gray-700 text-gray-300"
                  >
                    <Filter className="h-3 w-3 mr-1" />
                    Apply Filters
                  </Button>
                </div>
                <ul className="space-y-2">
                  {predictions.decodeQuality.recommendations.map(
                    (recommendation, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <Zap className="h-4 w-4 text-cyan-400 mt-0.5" />
                        <span className="text-sm text-gray-300">
                          {recommendation}
                        </span>
                      </li>
                    ),
                  )}
                </ul>
              </div>

              <div className="pt-2 border-t border-gray-800">
                <h4 className="text-sm font-medium text-gray-400 mb-2">
                  Signal Quality Trend
                </h4>
                <div className="h-[120px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={[
                        { time: "00:00", quality: 82 },
                        { time: "01:00", quality: 85 },
                        { time: "02:00", quality: 80 },
                        { time: "03:00", quality: 75 },
                        { time: "04:00", quality: 87 },
                      ]}
                      margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="time" stroke="#64748b" />
                      <YAxis stroke="#64748b" domain={[50, 100]} />
                      <RechartsTooltip
                        contentStyle={{
                          backgroundColor: "#0f172a",
                          borderColor: "#1e293b",
                          color: "#e2e8f0",
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="quality"
                        stroke="#10b981"
                        strokeWidth={2}
                        dot={{ r: 3 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </TabsContent>

            {/* Shock & Vibe Tab */}
            <TabsContent
              value="shock-vibe"
              className="flex-grow p-4 space-y-4 overflow-auto bg-gradient-to-b from-gray-950 to-gray-900"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-gray-300">
                    Shock & Vibration Analysis
                  </h3>
                  <p className="text-sm text-gray-500">
                    Real-time vibration monitoring and analysis
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-2xl font-bold ${getRiskColor(predictions.shockAndVibe.severity)}`}
                  >
                    {predictions.shockAndVibe.severity}%
                  </span>
                  <div className="w-16 h-16 relative flex items-center justify-center">
                    <svg className="w-full h-full" viewBox="0 0 36 36">
                      <path
                        d="M18 2.0845
                          a 15.9155 15.9155 0 0 1 0 31.831
                          a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="#1e293b"
                        strokeWidth="3"
                      />
                      <path
                        d="M18 2.0845
                          a 15.9155 15.9155 0 0 1 0 31.831
                          a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke={
                          predictions.shockAndVibe.severity < 20
                            ? "#10b981"
                            : predictions.shockAndVibe.severity < 50
                              ? "#f59e0b"
                              : "#ef4444"
                        }
                        strokeWidth="3"
                        strokeDasharray={`${predictions.shockAndVibe.severity}, 100`}
                        style={{
                          filter: `drop-shadow(0 0 4px ${predictions.shockAndVibe.severity < 20 ? "#10b98180" : predictions.shockAndVibe.severity < 50 ? "#f59e0b80" : "#ef444480"})`,
                        }}
                      />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-sm font-medium text-gray-400">
                  Vibration Components
                </h4>
                <div className="space-y-2">
                  <div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-300">Axial</span>
                      <span
                        className={`text-sm font-medium ${getRiskColor(predictions.shockAndVibe.axial)}`}
                      >
                        {predictions.shockAndVibe.axial}%
                      </span>
                    </div>
                    <Progress
                      value={predictions.shockAndVibe.axial}
                      max={100}
                      className="h-2 bg-gray-800"
                      indicatorClassName={`${getRiskBgColor(predictions.shockAndVibe.axial)}`}
                    />
                  </div>
                  <div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-300">Lateral</span>
                      <span
                        className={`text-sm font-medium ${getRiskColor(predictions.shockAndVibe.lateral)}`}
                      >
                        {predictions.shockAndVibe.lateral}%
                      </span>
                    </div>
                    <Progress
                      value={predictions.shockAndVibe.lateral}
                      max={100}
                      className="h-2 bg-gray-800"
                      indicatorClassName={`${getRiskBgColor(predictions.shockAndVibe.lateral)}`}
                    />
                  </div>
                  <div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-300">Torsional</span>
                      <span
                        className={`text-sm font-medium ${getRiskColor(predictions.shockAndVibe.torsional)}`}
                      >
                        {predictions.shockAndVibe.torsional}%
                      </span>
                    </div>
                    <Progress
                      value={predictions.shockAndVibe.torsional}
                      max={100}
                      className="h-2 bg-gray-800"
                      indicatorClassName={`${getRiskBgColor(predictions.shockAndVibe.torsional)}`}
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-gray-800">
                <h4 className="text-sm font-medium text-gray-400 mb-2">
                  Recommended Actions
                </h4>
                <ul className="space-y-2">
                  {predictions.shockAndVibe.recommendations.map(
                    (recommendation, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <Zap className="h-4 w-4 text-cyan-400 mt-0.5" />
                        <span className="text-sm text-gray-300">
                          {recommendation}
                        </span>
                      </li>
                    ),
                  )}
                </ul>
              </div>

              <div className="pt-2 border-t border-gray-800">
                <h4 className="text-sm font-medium text-gray-400 mb-2">
                  Vibration Trend
                </h4>
                <div className="h-[120px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={generateHistoricalData("vibration")}
                      margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="time" stroke="#64748b" />
                      <YAxis stroke="#64748b" />
                      <RechartsTooltip
                        contentStyle={{
                          backgroundColor: "#0f172a",
                          borderColor: "#1e293b",
                          color: "#e2e8f0",
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke="#ef4444"
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        ) : (
          <ScrollArea className="flex-grow p-4 bg-gradient-to-b from-gray-950 to-gray-900">
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-200">
                  Full AI Analysis Report
                </h2>
                <Badge
                  variant="outline"
                  className="bg-cyan-900/30 text-cyan-400 border-cyan-800"
                >
                  Confidence: {confidenceLevel}%
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-800 space-y-3">
                  <h3 className="text-lg font-medium text-gray-300 flex items-center gap-2">
                    <Wrench className="h-5 w-5 text-cyan-400" />
                    Tool Failure Risk: {predictions.toolFailure.risk}%
                  </h3>
                  <p className="text-sm text-gray-400">
                    Estimated time to failure:{" "}
                    {predictions.toolFailure.timeToFailure}
                  </p>
                  <div className="space-y-2">
                    {predictions.toolFailure.components.map(
                      (component, index) => (
                        <div key={index} className="space-y-1">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-300">
                              {component.name}
                            </span>
                            <span
                              className={`text-sm font-medium ${getRiskColor(component.risk)}`}
                            >
                              {component.risk}%
                            </span>
                          </div>
                          <Progress
                            value={component.risk}
                            max={100}
                            className="h-2 bg-gray-800"
                            indicatorClassName={`${getRiskBgColor(component.risk)}`}
                          />
                        </div>
                      ),
                    )}
                  </div>
                </div>

                <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-800 space-y-3">
                  <h3 className="text-lg font-medium text-gray-300 flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-yellow-400" />
                    Stuck Pipe Risk: {predictions.stuckPipe.risk}%
                  </h3>
                  <p className="text-sm text-gray-400">
                    Current drilling conditions indicate{" "}
                    {predictions.stuckPipe.risk < 20
                      ? "low"
                      : predictions.stuckPipe.risk < 50
                        ? "moderate"
                        : "high"}{" "}
                    risk of stuck pipe.
                  </p>
                  <div className="space-y-2">
                    {predictions.stuckPipe.indicators.map(
                      (indicator, index) => (
                        <div key={index} className="space-y-1">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-300">
                              {indicator.name}
                            </span>
                            <span
                              className={`text-sm font-medium ${getRiskColor(indicator.value)}`}
                            >
                              {indicator.value}%
                            </span>
                          </div>
                          <Progress
                            value={indicator.value}
                            max={100}
                            className="h-2 bg-gray-800"
                            indicatorClassName={`${getRiskBgColor(indicator.value)}`}
                          />
                        </div>
                      ),
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-800 space-y-3">
                  <h3 className="text-lg font-medium text-gray-300 flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-green-400" />
                    Signal Quality: {predictions.decodeQuality.quality}%
                  </h3>
                  <p className="text-sm text-gray-400">
                    Current noise level: {predictions.decodeQuality.noiseLevel}%
                  </p>
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-400">
                      Recommendations:
                    </h4>
                    <ul className="space-y-1">
                      {predictions.decodeQuality.recommendations.map(
                        (rec, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <Zap className="h-4 w-4 text-cyan-400 mt-0.5" />
                            <span className="text-sm text-gray-300">{rec}</span>
                          </li>
                        ),
                      )}
                    </ul>
                  </div>
                </div>

                <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-800 space-y-3">
                  <h3 className="text-lg font-medium text-gray-300 flex items-center gap-2">
                    <Vibrate className="h-5 w-5 text-pink-400" />
                    Vibration Severity: {predictions.shockAndVibe.severity}%
                  </h3>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-gray-800/50 p-2 rounded-md text-center">
                      <div className="text-xs text-gray-400">Axial</div>
                      <div
                        className={`text-sm font-medium ${getRiskColor(predictions.shockAndVibe.axial)}`}
                      >
                        {predictions.shockAndVibe.axial}%
                      </div>
                    </div>
                    <div className="bg-gray-800/50 p-2 rounded-md text-center">
                      <div className="text-xs text-gray-400">Lateral</div>
                      <div
                        className={`text-sm font-medium ${getRiskColor(predictions.shockAndVibe.lateral)}`}
                      >
                        {predictions.shockAndVibe.lateral}%
                      </div>
                    </div>
                    <div className="bg-gray-800/50 p-2 rounded-md text-center">
                      <div className="text-xs text-gray-400">Torsional</div>
                      <div
                        className={`text-sm font-medium ${getRiskColor(predictions.shockAndVibe.torsional)}`}
                      >
                        {predictions.shockAndVibe.torsional}%
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-400">
                      Actions:
                    </h4>
                    <ul className="space-y-1">
                      {predictions.shockAndVibe.recommendations.map(
                        (rec, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <Zap className="h-4 w-4 text-cyan-400 mt-0.5" />
                            <span className="text-sm text-gray-300">{rec}</span>
                          </li>
                        ),
                      )}
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-800 space-y-3">
                <h3 className="text-lg font-medium text-gray-300 flex items-center gap-2">
                  <Brain className="h-5 w-5 text-purple-400" />
                  AI Insights & Recommendations
                </h3>
                <div className="space-y-3">
                  <div className="p-3 bg-cyan-900/20 border border-cyan-800 rounded-md">
                    <h4 className="text-sm font-medium text-cyan-400 mb-1">
                      Critical Actions
                    </h4>
                    <ul className="space-y-2">
                      <li className="flex items-start gap-2">
                        <AlertTriangle className="h-4 w-4 text-yellow-400 mt-0.5" />
                        <span className="text-sm text-gray-300">
                          Schedule battery replacement within next 24 hours to
                          prevent tool failure
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <AlertTriangle className="h-4 w-4 text-yellow-400 mt-0.5" />
                        <span className="text-sm text-gray-300">
                          Reduce WOB by 5-10% to mitigate lateral vibration
                          (currently at {predictions.shockAndVibe.lateral}%)
                        </span>
                      </li>
                    </ul>
                  </div>

                  <div className="p-3 bg-gray-800/50 border border-gray-700 rounded-md">
                    <h4 className="text-sm font-medium text-gray-300 mb-1">
                      Formation Analysis
                    </h4>
                    <p className="text-sm text-gray-400">
                      Current formation appears to be shale based on gamma
                      readings (80-120 API). Expect increased vibration and
                      potential for stuck pipe. Consider adjusting drilling
                      parameters to optimize ROP while minimizing vibration.
                    </p>
                  </div>

                  <div className="p-3 bg-gray-800/50 border border-gray-700 rounded-md">
                    <h4 className="text-sm font-medium text-gray-300 mb-1">
                      Performance Optimization
                    </h4>
                    <p className="text-sm text-gray-400">
                      Based on current conditions, optimal drilling parameters
                      are:
                    </p>
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      <div className="bg-gray-900/50 p-2 rounded-md text-center">
                        <div className="text-xs text-gray-400">WOB</div>
                        <div className="text-sm font-medium text-cyan-400">
                          16-18 klbs
                        </div>
                      </div>
                      <div className="bg-gray-900/50 p-2 rounded-md text-center">
                        <div className="text-xs text-gray-400">RPM</div>
                        <div className="text-sm font-medium text-cyan-400">
                          110-130
                        </div>
                      </div>
                      <div className="bg-gray-900/50 p-2 rounded-md text-center">
                        <div className="text-xs text-gray-400">Flow</div>
                        <div className="text-sm font-medium text-cyan-400">
                          650-700 gpm
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  variant="outline"
                  className="bg-gray-800 border-gray-700 hover:bg-gray-700 text-gray-300"
                  onClick={() => setShowFullReport(false)}
                >
                  <X className="h-4 w-4 mr-2" />
                  Close Full Report
                </Button>
              </div>
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};

export default AIAnalytics;
