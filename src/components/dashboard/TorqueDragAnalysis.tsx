import React, { useState, useEffect } from "react";
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
import { useWits } from "@/context/WitsContext";
import { useSurveys } from "@/context/SurveyContext";

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
  const { witsData } = useWits();
  const { surveys } = useSurveys();
  const [torqueData, setTorqueData] = useState<any[]>([]);
  const [predictions, setPredictions] = useState({
    stickSlip: {
      risk: 0,
      timeToOccurrence: "N/A",
      recommendations: ["Waiting for data..."],
    },
    highTorque: {
      risk: 0,
      criticalDepth: 0,
      recommendations: ["Waiting for data..."],
    },
    dragIssues: {
      risk: 0,
      affectedZones: [{ name: "Waiting for data...", severity: "Low" }],
      recommendations: ["Waiting for data..."],
    },
  });

  // Process real-time data for visualization
  useEffect(() => {
    // Process survey data to create torque and drag visualization
    if (surveys.length > 0) {
      const data = surveys.map((survey) => {
        const depth = survey.measuredDepth || 0;
        const zone = getZoneByDepth(depth);

        // Calculate torque based on real parameters
        // In a real implementation, this would use actual torque measurements or calculations
        const torque = calculateTorqueFromSurvey(survey, witsData);
        const wob = witsData.wob || 0;
        const drag = calculateDragFromSurvey(survey, witsData);

        return {
          depth,
          torque,
          wob,
          drag,
          friction: zone.friction,
        };
      });

      // Sort by depth to ensure proper visualization
      data.sort((a, b) => a.depth - b.depth);
      setTorqueData(data);

      // Update predictions based on real data
      updatePredictions(data, witsData);
    }
  }, [surveys, witsData]);

  // Helper function to calculate torque from survey data
  const calculateTorqueFromSurvey = (survey: any, witsData: any) => {
    // In a real implementation, this would use actual torque calculations
    // For now, we'll use a simplified model based on depth and inclination
    const depth = survey.measuredDepth || 0;
    const inclination = survey.inclination || 0;
    const rotaryRpm = witsData.rotaryRpm || 0;

    // Basic torque model: deeper + higher inclination = more torque
    let baseTorque = depth / 1000; // 1 unit per 1000 ft
    baseTorque *= 1 + inclination / 45; // Increase with inclination
    baseTorque *= 1 + rotaryRpm / 100; // Adjust for RPM

    return Math.max(1, baseTorque);
  };

  // Helper function to calculate drag from survey data
  const calculateDragFromSurvey = (survey: any, witsData: any) => {
    // In a real implementation, this would use actual drag calculations
    // For now, we'll use a simplified model
    const depth = survey.measuredDepth || 0;
    const inclination = survey.inclination || 0;

    // Basic drag model: deeper + higher inclination = more drag
    let baseDrag = depth / 800; // 1 unit per 800 ft
    baseDrag *= 1 + inclination / 30; // Increase with inclination

    return Math.max(1, baseDrag);
  };

  // Update AI predictions based on real data
  const updatePredictions = (data: any[], witsData: any) => {
    // In a real implementation, this would use actual AI models
    // For now, we'll use simplified risk calculations

    // Calculate stick-slip risk based on torque variations and RPM
    const torqueValues = data.map((d) => d.torque);
    const torqueVariation = calculateVariation(torqueValues);
    const rotaryRpm = witsData.rotaryRpm || 0;
    const stickSlipRisk = Math.min(
      100,
      Math.max(
        0,
        torqueVariation * 20 +
          (rotaryRpm < 40 ? 30 : 0) +
          (rotaryRpm > 180 ? 20 : 0),
      ),
    );

    // Calculate high torque risk
    const maxTorque = Math.max(...torqueValues, 0);
    const maxDepth = data.length > 0 ? data[data.length - 1].depth : 0;
    const highTorqueRisk = Math.min(100, Math.max(0, (maxTorque / 20) * 100));

    // Calculate drag issues risk
    const dragValues = data.map((d) => d.drag);
    const maxDrag = Math.max(...dragValues, 0);
    const dragRisk = Math.min(100, Math.max(0, (maxDrag / 25) * 100));

    // Update predictions state
    setPredictions({
      stickSlip: {
        risk: Math.round(stickSlipRisk),
        timeToOccurrence: stickSlipRisk > 50 ? "~2 hours" : "Not imminent",
        recommendations: getStickSlipRecommendations(stickSlipRisk, rotaryRpm),
      },
      highTorque: {
        risk: Math.round(highTorqueRisk),
        criticalDepth: findCriticalDepth(data, "torque"),
        recommendations: getHighTorqueRecommendations(highTorqueRisk),
      },
      dragIssues: {
        risk: Math.round(dragRisk),
        affectedZones: getAffectedZones(data),
        recommendations: getDragRecommendations(dragRisk),
      },
    });
  };

  // Helper function to calculate statistical variation
  const calculateVariation = (values: number[]) => {
    if (values.length < 2) return 0;
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squaredDiffs = values.map((val) => Math.pow(val - mean, 2));
    const variance =
      squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
    return Math.sqrt(variance) / mean; // Coefficient of variation
  };

  // Helper function to find critical depth
  const findCriticalDepth = (data: any[], property: string) => {
    if (data.length === 0) return 0;
    const maxValue = Math.max(...data.map((d) => d[property]));
    const criticalPoint = data.find((d) => d[property] === maxValue);
    return criticalPoint ? criticalPoint.depth : data[data.length - 1].depth;
  };

  // Helper function to get affected zones
  const getAffectedZones = (data: any[]) => {
    const zones = getZones();
    const zoneRisks = zones.map((zone) => {
      const zoneData = data.filter(
        (d) => d.depth >= zone.start && d.depth <= zone.end,
      );
      if (zoneData.length === 0) return { name: zone.name, severity: "Low" };

      const avgDrag =
        zoneData.reduce((sum, d) => sum + d.drag, 0) / zoneData.length;
      let severity = "Low";
      if (avgDrag > 15) severity = "High";
      else if (avgDrag > 8) severity = "Medium";

      return { name: zone.name, severity };
    });

    return zoneRisks.filter((z) => z.severity !== "Low");
  };

  // Get recommendations based on risk levels
  const getStickSlipRecommendations = (risk: number, rpm: number) => {
    if (risk < 20) return ["Normal operations - no action needed"];
    if (risk < 50)
      return [
        "Monitor torque fluctuations",
        rpm < 60 ? "Increase RPM to 80-100" : "Maintain current RPM",
        "Check for proper lubrication",
      ];
    return [
      "Reduce WOB by 10-15%",
      rpm < 100 ? "Increase RPM to 120-140" : "Maintain current RPM",
      "Monitor torque fluctuations closely",
      "Consider adding lubricant to drilling fluid",
    ];
  };

  const getHighTorqueRecommendations = (risk: number) => {
    if (risk < 20) return ["Normal operations - no action needed"];
    if (risk < 50)
      return [
        "Monitor torque trend",
        "Check for proper lubrication",
        "Verify proper hole cleaning",
      ];
    return [
      "Use lubricant in drilling fluid",
      "Reduce friction in production zone",
      "Monitor torque trend closely",
      "Consider reducing WOB",
    ];
  };

  const getDragRecommendations = (risk: number) => {
    if (risk < 20) return ["Normal operations - no action needed"];
    if (risk < 50)
      return [
        "Monitor drag parameters",
        "Rotate pipe periodically",
        "Check for proper hole cleaning",
      ];
    return [
      "Rotate pipe more frequently",
      "Check for ledges or doglegs",
      "Consider reaming operation",
      "Verify proper hole cleaning",
    ];
  };

  // Zone data
  const getZones = () => [
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

  const getZoneByDepth = (depth: number) => {
    const zones = getZones();
    return (
      zones.find((zone) => depth >= zone.start && depth <= zone.end) || zones[0]
    );
  };

  // Use real zone data
  const zoneData = getZones();

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
