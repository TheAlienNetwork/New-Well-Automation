import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
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
  Wrench,
  RefreshCw,
  Vibrate,
  CheckCircle,
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
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import { useWits } from "@/context/WitsContext";
import DecodeQualityAssessment from "./ai/DecodeQualityAssessment";
import ShockVibeAssessment from "./ai/ShockVibeAssessment";
import { useHistoricalData } from "@/hooks/useHistoricalData";
import { usePieChartData } from "@/hooks/usePieChartData";

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
  isLoading = false,
  onRefresh = () => {},
  onConfigureAI = () => {},
}: AIAnalyticsProps) => {
  const { witsData, isConnected, isReceiving } = useWits();
  const [activeTab, setActiveTab] = useState("tool-failure");
  const [filterStrength, setFilterStrength] = useState(50);
  const [showFullReport, setShowFullReport] = useState(false);
  const [confidenceLevel, setConfidenceLevel] = useState(92);
  const [predictions, setPredictions] = useState({
    toolFailure: {
      risk: 0,
      timeToFailure: "N/A",
      components: [
        { name: "MWD Battery", risk: 0 },
        { name: "Pulser Assembly", risk: 0 },
        { name: "Directional Module", risk: 0 },
      ],
    },
    stuckPipe: {
      risk: 0,
      indicators: [
        { name: "Torque Variation", value: 0 },
        { name: "Drag", value: 0 },
        { name: "ROP Decrease", value: 0 },
      ],
    },
    decodeQuality: {
      quality: 0,
      noiseLevel: 0,
      recommendations: [],
    },
    shockAndVibe: {
      severity: 0,
      axial: 0,
      lateral: 0,
      torsional: 0,
      recommendations: [],
    },
  });

  // Update predictions based on real WITS data
  useEffect(() => {
    if (isConnected && isReceiving && witsData) {
      // Calculate tool failure risk based on temperature and vibration
      const tempFactor = Math.min(
        100,
        Math.max(0, ((witsData.temperature - 120) / 80) * 100),
      );
      const vibeFactor = Math.min(
        100,
        Math.max(
          0,
          (witsData.vibration.lateral + witsData.vibration.axial) / 2,
        ),
      );
      const toolFailureRisk = Math.round(tempFactor * 0.4 + vibeFactor * 0.6);

      // Calculate stuck pipe risk based on torque and drag indicators
      const torqueVariation = Math.min(
        100,
        Math.max(0, Math.abs(witsData.rotaryTorque - 8500) / 85),
      );
      const dragFactor = Math.min(
        100,
        Math.max(0, Math.abs(witsData.hookload - 120) / 1.2),
      );
      const ropDecrease = Math.min(100, Math.max(0, (50 - witsData.rop) / 0.5));
      const stuckPipeRisk = Math.round(
        torqueVariation * 0.4 + dragFactor * 0.3 + ropDecrease * 0.3,
      );

      // Calculate decode quality based on signal strength
      const signalQuality = Math.min(
        100,
        Math.max(0, 100 - witsData.vibration.lateral / 2),
      );
      const noiseLevel = 100 - signalQuality;

      // Calculate shock and vibe severity
      const axial = Math.min(100, Math.max(0, witsData.vibration.axial));
      const lateral = Math.min(100, Math.max(0, witsData.vibration.lateral));
      const torsional = Math.min(
        100,
        Math.max(0, witsData.vibration.torsional),
      );
      const vibeSeverity = Math.round(
        axial * 0.3 + lateral * 0.5 + torsional * 0.2,
      );

      // Update predictions
      setPredictions({
        toolFailure: {
          risk: toolFailureRisk,
          timeToFailure:
            toolFailureRisk > 70
              ? "~24 hours"
              : toolFailureRisk > 40
                ? "~48 hours"
                : "No immediate risk",
          components: [
            { name: "MWD Battery", risk: Math.round(tempFactor * 0.8) },
            { name: "Pulser Assembly", risk: Math.round(vibeFactor * 0.6) },
            {
              name: "Directional Module",
              risk: Math.round(tempFactor * 0.3 + vibeFactor * 0.2),
            },
          ],
        },
        stuckPipe: {
          risk: stuckPipeRisk,
          indicators: [
            { name: "Torque Variation", value: Math.round(torqueVariation) },
            { name: "Drag", value: Math.round(dragFactor) },
            { name: "ROP Decrease", value: Math.round(ropDecrease) },
          ],
        },
        decodeQuality: {
          quality: Math.round(signalQuality),
          noiseLevel: Math.round(noiseLevel),
          recommendations: [
            signalQuality < 70
              ? "Increase signal amplitude"
              : "Signal amplitude is good",
            noiseLevel > 30
              ? "Apply band-pass filter (15-30Hz)"
              : "Noise levels acceptable",
            noiseLevel > 50
              ? "Check surface connections"
              : "Surface connections good",
          ],
        },
        shockAndVibe: {
          severity: vibeSeverity,
          axial: Math.round(axial),
          lateral: Math.round(lateral),
          torsional: Math.round(torsional),
          recommendations: [
            lateral > 40
              ? "Reduce WOB by 5-10%"
              : "WOB is within acceptable range",
            lateral > 30
              ? "Adjust drilling parameters to minimize lateral vibration"
              : "Lateral vibration is acceptable",
            vibeSeverity > 50
              ? "Monitor BHA components for potential damage"
              : "BHA components are safe",
          ],
        },
      });

      // Update confidence level based on data quality
      setConfidenceLevel(Math.round(85 + signalQuality / 10));
    }
  }, [witsData, isConnected, isReceiving]);

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

  // Import the custom hooks for generating data
  const { generateHistoricalData } = useHistoricalData();
  const pieData = usePieChartData(predictions);

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
                    disabled={isLoading || !isConnected}
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
        {!isConnected && (
          <div className="flex-grow flex items-center justify-center bg-gray-950">
            <div className="text-center p-6 bg-gray-900/50 rounded-lg border border-gray-800 max-w-md">
              <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-gray-200 mb-2">
                No WITS Connection
              </h3>
              <p className="text-gray-400 mb-4">
                Connect to a WITS data source to enable AI analytics and
                real-time monitoring.
              </p>
              <Button
                className="bg-blue-600 hover:bg-blue-700 text-white"
                onClick={() => (window.location.href = "/witsconfig")}
              >
                <Settings className="h-4 w-4 mr-2" />
                Configure WITS Connection
              </Button>
            </div>
          </div>
        )}

        {isConnected && !isReceiving && (
          <div className="flex-grow flex items-center justify-center bg-gray-950">
            <div className="text-center p-6 bg-gray-900/50 rounded-lg border border-gray-800 max-w-md">
              <RefreshCw className="h-12 w-12 text-blue-500 mx-auto mb-4 animate-spin" />
              <h3 className="text-xl font-medium text-gray-200 mb-2">
                Waiting for Data
              </h3>
              <p className="text-gray-400 mb-4">
                Connected to WITS server but no data is being received yet.
                Please wait...
              </p>
            </div>
          </div>
        )}

        {isConnected && isReceiving && !showFullReport ? (
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
                      {predictions.toolFailure.risk > 40
                        ? "Schedule battery replacement within next 24 hours"
                        : "Monitor battery voltage for any significant drops"}
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Zap className="h-4 w-4 text-cyan-400 mt-0.5" />
                    <span className="text-sm text-gray-300">
                      {predictions.toolFailure.components[1].risk > 30
                        ? "Inspect pulser assembly during next connection"
                        : "Pulser assembly operating within normal parameters"}
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
                    {predictions.stuckPipe.risk < 20 ? (
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5" />
                    )}
                    <span className="text-sm text-gray-300">
                      {predictions.stuckPipe.risk < 20
                        ? "Maintain current drilling parameters"
                        : "Consider adjusting drilling parameters to reduce risk"}
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Zap className="h-4 w-4 text-cyan-400 mt-0.5" />
                    <span className="text-sm text-gray-300">
                      {predictions.stuckPipe.indicators[0].value > 30
                        ? "Monitor torque variations during next 30 minutes"
                        : "Torque variations within normal range"}
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
                        {
                          time: "00:00",
                          value: Math.max(
                            5,
                            predictions.stuckPipe.indicators[0].value * 0.8,
                          ),
                        },
                        {
                          time: "01:00",
                          value: Math.max(
                            5,
                            predictions.stuckPipe.indicators[0].value * 0.9,
                          ),
                        },
                        {
                          time: "02:00",
                          value: Math.max(
                            5,
                            predictions.stuckPipe.indicators[0].value * 0.7,
                          ),
                        },
                        {
                          time: "03:00",
                          value: Math.max(
                            5,
                            predictions.stuckPipe.indicators[0].value * 1.1,
                          ),
                        },
                        {
                          time: "04:00",
                          value: Math.max(
                            5,
                            predictions.stuckPipe.indicators[0].value * 0.9,
                          ),
                        },
                        {
                          time: "05:00",
                          value: Math.max(
                            5,
                            predictions.stuckPipe.indicators[0].value * 0.8,
                          ),
                        },
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
            <TabsContent value="decode-quality">
              <DecodeQualityAssessment
                quality={predictions.decodeQuality.quality}
                noiseLevel={predictions.decodeQuality.noiseLevel}
                recommendations={predictions.decodeQuality.recommendations}
                filterStrength={filterStrength}
                setFilterStrength={setFilterStrength}
                getQualityColor={getQualityColor}
              />
            </TabsContent>

            {/* Shock & Vibe Tab */}
            <TabsContent value="shock-vibe">
              <ShockVibeAssessment
                severity={predictions.shockAndVibe.severity}
                axial={predictions.shockAndVibe.axial}
                lateral={predictions.shockAndVibe.lateral}
                torsional={predictions.shockAndVibe.torsional}
                recommendations={predictions.shockAndVibe.recommendations}
                getRiskColor={getRiskColor}
                getRiskBgColor={getRiskBgColor}
                historicalData={generateHistoricalData("vibration")}
              />
            </TabsContent>
          </Tabs>
        ) : isConnected && isReceiving && showFullReport ? (
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
                          {predictions.toolFailure.risk > 40
                            ? "Schedule battery replacement within next 24 hours to prevent tool failure"
                            : "Monitor battery voltage for any significant drops"}
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <AlertTriangle className="h-4 w-4 text-yellow-400 mt-0.5" />
                        <span className="text-sm text-gray-300">
                          {predictions.shockAndVibe.lateral > 40
                            ? `Reduce WOB by 5-10% to mitigate lateral vibration (currently at ${predictions.shockAndVibe.lateral}%)`
                            : "Lateral vibration is within acceptable limits"}
                        </span>
                      </li>
                    </ul>
                  </div>

                  <div className="p-3 bg-gray-800/50 border border-gray-700 rounded-md">
                    <h4 className="text-sm font-medium text-gray-300 mb-1">
                      Formation Analysis
                    </h4>
                    <p className="text-sm text-gray-400">
                      Current formation appears to be{" "}
                      {witsData.gamma > 80 ? "shale" : "sandstone"} based on
                      gamma readings ({Math.round(witsData.gamma)}-
                      {Math.round(witsData.gamma + 20)} API).
                      {witsData.gamma > 80
                        ? "Expect increased vibration and potential for stuck pipe."
                        : "Formation is relatively stable."}
                      Consider adjusting drilling parameters to optimize ROP
                      while minimizing vibration.
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
                          {Math.round(witsData.wob * 0.9)}-
                          {Math.round(witsData.wob * 1.1)} klbs
                        </div>
                      </div>
                      <div className="bg-gray-900/50 p-2 rounded-md text-center">
                        <div className="text-xs text-gray-400">RPM</div>
                        <div className="text-sm font-medium text-cyan-400">
                          {Math.round(witsData.rotaryRpm * 0.9)}-
                          {Math.round(witsData.rotaryRpm * 1.1)}
                        </div>
                      </div>
                      <div className="bg-gray-900/50 p-2 rounded-md text-center">
                        <div className="text-xs text-gray-400">Flow</div>
                        <div className="text-sm font-medium text-cyan-400">
                          {Math.round(witsData.flowRate * 0.95)}-
                          {Math.round(witsData.flowRate * 1.05)} gpm
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
        ) : null}
      </CardContent>
    </Card>
  );
};

export default AIAnalytics;
