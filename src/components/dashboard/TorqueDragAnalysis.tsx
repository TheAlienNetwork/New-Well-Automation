import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
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
  Layers,
  ArrowUpDown,
  RotateCw,
  Gauge,
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
} from "recharts";

interface TorqueDragAnalysisProps {
  isLoading?: boolean;
  onRefresh?: () => void;
  onConfigureAI?: () => void;
}

const TorqueDragAnalysis = ({
  isLoading = false,
  onRefresh = () => {},
  onConfigureAI = () => {},
}: TorqueDragAnalysisProps) => {
  const [activeTab, setActiveTab] = useState("torque");

  // Generate dummy data for visualization
  const generateTorqueData = () => {
    const data = [];
    for (let depth = 0; depth <= 8500; depth += 100) {
      // Create different zones with different characteristics
      let baseTorque = 0;
      let baseWOB = 0;
      let baseDrag = 0;

      if (depth < 2000) {
        // Surface casing zone
        baseTorque = 2 + Math.random() * 1;
        baseWOB = 5 + Math.random() * 2;
        baseDrag = 3 + Math.random() * 1;
      } else if (depth < 5000) {
        // Intermediate zone
        baseTorque = 5 + Math.random() * 2;
        baseWOB = 10 + Math.random() * 3;
        baseDrag = 8 + Math.random() * 2;
      } else {
        // Production zone
        baseTorque = 12 + Math.random() * 4;
        baseWOB = 18 + Math.random() * 5;
        baseDrag = 15 + Math.random() * 4;
      }

      // Add some random variations
      const torque = baseTorque + Math.sin(depth / 500) * 2;
      const wob = baseWOB + Math.cos(depth / 400) * 3;
      const drag = baseDrag + Math.sin(depth / 600) * 2.5;

      data.push({
        depth,
        torque,
        wob,
        drag,
        friction:
          depth > 5000
            ? 0.25 + Math.random() * 0.1
            : 0.15 + Math.random() * 0.1,
      });
    }
    return data;
  };

  const torqueData = generateTorqueData();

  // Zone modeling data
  const zoneData = [
    {
      name: "Surface Casing",
      start: 0,
      end: 2000,
      risk: "low",
      friction: 0.18,
    },
    {
      name: "Intermediate",
      start: 2000,
      end: 5000,
      risk: "medium",
      friction: 0.22,
    },
    {
      name: "Production Zone",
      start: 5000,
      end: 8500,
      risk: "high",
      friction: 0.28,
    },
  ];

  // AI predictions
  const predictions = {
    stickSlip: {
      risk: 35,
      timeToOccurrence: "~2 hours",
      recommendations: [
        "Reduce WOB by 10%",
        "Increase RPM to 120",
        "Monitor torque fluctuations",
      ],
    },
    highTorque: {
      risk: 42,
      criticalDepth: 7200,
      recommendations: [
        "Use lubricant in drilling fluid",
        "Reduce friction in production zone",
        "Monitor torque trend closely",
      ],
    },
    dragIssues: {
      risk: 28,
      affectedZones: [{ name: "Production Zone", severity: "Medium" }],
      recommendations: [
        "Rotate pipe more frequently",
        "Check for ledges or doglegs",
        "Consider reaming operation",
      ],
    },
  };

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

  return (
    <Card className="w-full h-full bg-gray-900 border-gray-800 shadow-lg overflow-hidden flex flex-col">
      <CardHeader className="p-4 pb-2 border-b border-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-cyan-400" />
            <CardTitle className="text-lg font-medium text-gray-200">
              Torque & Drag Analysis
            </CardTitle>
            <Badge
              variant="outline"
              className="ml-2 bg-cyan-950/30 text-cyan-400 border-cyan-800"
            >
              AI POWERED
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
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0 flex-grow flex flex-col">
        <Tabs
          defaultValue="torque"
          value={activeTab}
          onValueChange={setActiveTab}
          className="flex-grow flex flex-col"
        >
          <TabsList className="grid grid-cols-3 bg-gray-800/50 rounded-none border-b border-gray-800">
            <TabsTrigger
              value="torque"
              className="data-[state=active]:bg-gray-900 data-[state=active]:text-cyan-400 py-2"
            >
              <RotateCw className="h-4 w-4 mr-2" />
              Torque Analysis
            </TabsTrigger>
            <TabsTrigger
              value="drag"
              className="data-[state=active]:bg-gray-900 data-[state=active]:text-cyan-400 py-2"
            >
              <ArrowUpDown className="h-4 w-4 mr-2" />
              Drag Analysis
            </TabsTrigger>
            <TabsTrigger
              value="zones"
              className="data-[state=active]:bg-gray-900 data-[state=active]:text-cyan-400 py-2"
            >
              <Layers className="h-4 w-4 mr-2" />
              Zone Modeling
            </TabsTrigger>
          </TabsList>

          {/* Torque Analysis Tab */}
          <TabsContent
            value="torque"
            className="flex-grow p-4 space-y-4 overflow-auto"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-300">
                  Torque vs Depth
                </h3>
                <p className="text-sm text-gray-500">
                  Real-time torque measurements with AI predictions
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`text-2xl font-bold ${getRiskColor(predictions.stickSlip.risk)}`}
                >
                  {predictions.stickSlip.risk}%
                </span>
                <div className="w-16 h-16 relative flex items-center justify-center">
                  <svg className="w-full h-full" viewBox="0 0 36 36">
                    <path
                      d="M18 2.0845
                        a 15.9155 15.9155 0 0 1 0 31.831
                        a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="#2a3a4a"
                      strokeWidth="3"
                    />
                    <path
                      d="M18 2.0845
                        a 15.9155 15.9155 0 0 1 0 31.831
                        a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke={
                        predictions.stickSlip.risk < 20
                          ? "#10b981"
                          : predictions.stickSlip.risk < 50
                            ? "#eab308"
                            : "#ef4444"
                      }
                      strokeWidth="3"
                      strokeDasharray={`${predictions.stickSlip.risk}, 100`}
                      style={{
                        filter: `drop-shadow(0 0 4px ${predictions.stickSlip.risk < 20 ? "#10b98180" : predictions.stickSlip.risk < 50 ? "#eab30880" : "#ef444480"})`,
                      }}
                    />
                  </svg>
                </div>
              </div>
            </div>

            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={torqueData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis
                    dataKey="depth"
                    label={{
                      value: "Depth (ft)",
                      position: "insideBottomRight",
                      offset: -5,
                      fill: "#9ca3af",
                    }}
                    stroke="#6b7280"
                  />
                  <YAxis
                    label={{
                      value: "Torque (kft-lbs)",
                      angle: -90,
                      position: "insideLeft",
                      fill: "#9ca3af",
                    }}
                    stroke="#6b7280"
                  />
                  <RechartsTooltip
                    contentStyle={{
                      backgroundColor: "#1f2937",
                      borderColor: "#374151",
                      color: "#e5e7eb",
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="torque"
                    stroke="#00ffaa"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 6, fill: "#00ffaa" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-gray-400">
                  Stick-Slip Risk Analysis
                </h4>
                <div className="p-3 bg-gray-800/50 rounded-md border border-gray-800">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-300">
                      Stick-Slip Risk
                    </span>
                    <span
                      className={`text-sm font-medium ${getRiskColor(predictions.stickSlip.risk)}`}
                    >
                      {predictions.stickSlip.risk}%
                    </span>
                  </div>
                  <Progress
                    value={predictions.stickSlip.risk}
                    max={100}
                    className="h-2 bg-gray-800"
                    indicatorClassName={`${getRiskBgColor(predictions.stickSlip.risk)}`}
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Predicted time to occurrence:{" "}
                    {predictions.stickSlip.timeToOccurrence}
                  </p>
                </div>

                <div className="pt-2">
                  <h4 className="text-sm font-medium text-gray-400 mb-2">
                    Recommendations
                  </h4>
                  <ul className="space-y-2">
                    {predictions.stickSlip.recommendations.map((rec, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <Zap className="h-4 w-4 text-cyan-400 mt-0.5" />
                        <span className="text-sm text-gray-300">{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-sm font-medium text-gray-400">
                  High Torque Risk Analysis
                </h4>
                <div className="p-3 bg-gray-800/50 rounded-md border border-gray-800">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-300">
                      High Torque Risk
                    </span>
                    <span
                      className={`text-sm font-medium ${getRiskColor(predictions.highTorque.risk)}`}
                    >
                      {predictions.highTorque.risk}%
                    </span>
                  </div>
                  <Progress
                    value={predictions.highTorque.risk}
                    max={100}
                    className="h-2 bg-gray-800"
                    indicatorClassName={`${getRiskBgColor(predictions.highTorque.risk)}`}
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Critical depth: {predictions.highTorque.criticalDepth} ft
                  </p>
                </div>

                <div className="pt-2">
                  <h4 className="text-sm font-medium text-gray-400 mb-2">
                    Recommendations
                  </h4>
                  <ul className="space-y-2">
                    {predictions.highTorque.recommendations.map(
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
          </TabsContent>

          {/* Drag Analysis Tab */}
          <TabsContent
            value="drag"
            className="flex-grow p-4 space-y-4 overflow-auto"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-300">
                  Drag vs Depth
                </h3>
                <p className="text-sm text-gray-500">
                  Real-time drag measurements with AI predictions
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`text-2xl font-bold ${getRiskColor(predictions.dragIssues.risk)}`}
                >
                  {predictions.dragIssues.risk}%
                </span>
                <div className="w-16 h-16 relative flex items-center justify-center">
                  <svg className="w-full h-full" viewBox="0 0 36 36">
                    <path
                      d="M18 2.0845
                        a 15.9155 15.9155 0 0 1 0 31.831
                        a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="#2a3a4a"
                      strokeWidth="3"
                    />
                    <path
                      d="M18 2.0845
                        a 15.9155 15.9155 0 0 1 0 31.831
                        a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke={
                        predictions.dragIssues.risk < 20
                          ? "#10b981"
                          : predictions.dragIssues.risk < 50
                            ? "#eab308"
                            : "#ef4444"
                      }
                      strokeWidth="3"
                      strokeDasharray={`${predictions.dragIssues.risk}, 100`}
                      style={{
                        filter: `drop-shadow(0 0 4px ${predictions.dragIssues.risk < 20 ? "#10b98180" : predictions.dragIssues.risk < 50 ? "#eab30880" : "#ef444480"})`,
                      }}
                    />
                  </svg>
                </div>
              </div>
            </div>

            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={torqueData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis
                    dataKey="depth"
                    label={{
                      value: "Depth (ft)",
                      position: "insideBottomRight",
                      offset: -5,
                      fill: "#9ca3af",
                    }}
                    stroke="#6b7280"
                  />
                  <YAxis
                    label={{
                      value: "Drag (klbs)",
                      angle: -90,
                      position: "insideLeft",
                      fill: "#9ca3af",
                    }}
                    stroke="#6b7280"
                  />
                  <RechartsTooltip
                    contentStyle={{
                      backgroundColor: "#1f2937",
                      borderColor: "#374151",
                      color: "#e5e7eb",
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="drag"
                    stroke="#ff00aa"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 6, fill: "#ff00aa" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-gray-400">
                  Drag Issues Analysis
                </h4>
                <div className="p-3 bg-gray-800/50 rounded-md border border-gray-800">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-300">
                      Drag Issues Risk
                    </span>
                    <span
                      className={`text-sm font-medium ${getRiskColor(predictions.dragIssues.risk)}`}
                    >
                      {predictions.dragIssues.risk}%
                    </span>
                  </div>
                  <Progress
                    value={predictions.dragIssues.risk}
                    max={100}
                    className="h-2 bg-gray-800"
                    indicatorClassName={`${getRiskBgColor(predictions.dragIssues.risk)}`}
                  />
                </div>

                <div className="pt-2">
                  <h4 className="text-sm font-medium text-gray-400 mb-2">
                    Affected Zones
                  </h4>
                  {predictions.dragIssues.affectedZones.map((zone, index) => (
                    <div
                      key={index}
                      className="p-2 bg-gray-800/30 rounded-md mb-2 flex justify-between items-center"
                    >
                      <span className="text-sm text-gray-300">{zone.name}</span>
                      <Badge
                        variant="outline"
                        className={
                          zone.severity === "High"
                            ? "bg-red-900/30 text-red-400 border-red-800"
                            : zone.severity === "Medium"
                              ? "bg-yellow-900/30 text-yellow-400 border-yellow-800"
                              : "bg-green-900/30 text-green-400 border-green-800"
                        }
                      >
                        {zone.severity} Risk
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-sm font-medium text-gray-400">
                  Weight on Bit Analysis
                </h4>
                <div className="p-3 bg-gray-800/50 rounded-md border border-gray-800">
                  <div className="flex items-center gap-2 mb-2">
                    <Gauge className="h-4 w-4 text-blue-400" />
                    <span className="text-sm text-gray-300">
                      Current WOB: 18.5 klbs
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Gauge className="h-4 w-4 text-green-400" />
                    <span className="text-sm text-gray-300">
                      Recommended WOB: 16-20 klbs
                    </span>
                  </div>
                </div>

                <div className="pt-2">
                  <h4 className="text-sm font-medium text-gray-400 mb-2">
                    Recommendations
                  </h4>
                  <ul className="space-y-2">
                    {predictions.dragIssues.recommendations.map(
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
          </TabsContent>

          {/* Zone Modeling Tab */}
          <TabsContent
            value="zones"
            className="flex-grow p-4 space-y-4 overflow-auto"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-300">
                  Formation Zone Modeling
                </h3>
                <p className="text-sm text-gray-500">
                  AI-powered zone analysis for torque & drag
                </p>
              </div>
            </div>

            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={torqueData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis
                    dataKey="depth"
                    label={{
                      value: "Depth (ft)",
                      position: "insideBottomRight",
                      offset: -5,
                      fill: "#9ca3af",
                    }}
                    stroke="#6b7280"
                  />
                  <YAxis
                    label={{
                      value: "Friction Coefficient",
                      angle: -90,
                      position: "insideLeft",
                      fill: "#9ca3af",
                    }}
                    stroke="#6b7280"
                  />
                  <RechartsTooltip
                    contentStyle={{
                      backgroundColor: "#1f2937",
                      borderColor: "#374151",
                      color: "#e5e7eb",
                    }}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="friction"
                    stroke="#00aaff"
                    fill="#00aaff20"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-400">
                Formation Zones
              </h4>
              {zoneData.map((zone, index) => (
                <div
                  key={index}
                  className="p-3 bg-gray-800/50 rounded-md border border-gray-800"
                >
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2">
                      <Layers className="h-4 w-4 text-cyan-400" />
                      <span className="text-sm font-medium text-gray-300">
                        {zone.name}
                      </span>
                    </div>
                    <Badge
                      variant="outline"
                      className={
                        zone.risk === "high"
                          ? "bg-red-900/30 text-red-400 border-red-800"
                          : zone.risk === "medium"
                            ? "bg-yellow-900/30 text-yellow-400 border-yellow-800"
                            : "bg-green-900/30 text-green-400 border-green-800"
                      }
                    >
                      {zone.risk.toUpperCase()} RISK
                    </Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <p className="text-gray-500">Depth Range</p>
                      <p className="text-gray-300">
                        {zone.start} - {zone.end} ft
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Friction Coefficient</p>
                      <p className="text-cyan-400 font-medium">
                        {zone.friction.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Recommended Action</p>
                      <p className="text-green-400 font-medium">
                        {zone.risk === "high"
                          ? "Reduce WOB"
                          : zone.risk === "medium"
                            ? "Monitor Closely"
                            : "Standard Operation"}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 bg-gray-800/30 rounded-md border border-gray-800">
              <h3 className="text-sm font-medium text-gray-300 mb-3">
                AI Zone Analysis Insights
              </h3>
              <ul className="space-y-2">
                <li className="flex items-start gap-2 text-sm">
                  <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5" />
                  <span className="text-gray-300">
                    Production zone shows 28% higher friction than expected
                    based on offset well data
                  </span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <Zap className="h-4 w-4 text-cyan-400 mt-0.5" />
                  <span className="text-gray-300">
                    Consider adding lubricant to drilling fluid when entering
                    production zone
                  </span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <Info className="h-4 w-4 text-blue-400 mt-0.5" />
                  <span className="text-gray-300">
                    Intermediate zone shows normal friction patterns consistent
                    with formation type
                  </span>
                </li>
              </ul>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>

      <div className="p-3 border-t border-gray-800 bg-gray-900/50 flex items-center justify-between">
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <Info className="h-3 w-3" />
          <span>AI model: DrillForce v1.8</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs text-gray-400 hover:text-gray-300"
        >
          View Full Report
          <ChevronDown className="h-3 w-3 ml-1" />
        </Button>
      </div>
    </Card>
  );
};

export default TorqueDragAnalysis;
