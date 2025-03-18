import React from "react";
import Navbar from "@/components/layout/Navbar";
import StatusBar from "@/components/dashboard/StatusBar";
import TorqueDragAnalysis from "@/components/dashboard/TorqueDragAnalysis";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Brain,
  Download,
  BarChart3,
  TrendingUp,
  Layers,
  Drill,
  Zap,
  RotateCw,
  ArrowUpDown,
  Gauge,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";

const TorqueDragPage = () => {
  // Generate dummy data for visualization
  const generateHistoricalData = () => {
    const data = [];
    for (let i = 0; i < 24; i++) {
      data.push({
        time: `${i}:00`,
        torque: 10 + Math.random() * 10 + (i > 12 ? 5 : 0),
        drag: 15 + Math.random() * 8 + (i > 16 ? 4 : 0),
        wob: 18 + Math.random() * 5 - (i > 18 ? 3 : 0),
      });
    }
    return data;
  };

  const historicalData = generateHistoricalData();

  return (
    <div className="min-h-screen bg-gray-950 text-gray-200">
      <Navbar />
      <StatusBar />

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 gap-6">
          {/* Main Analysis */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Torque & Drag Analysis */}
            <div className="lg:col-span-2">
              <TorqueDragAnalysis />
            </div>

            {/* Historical Trends */}
            <div className="lg:col-span-1">
              <Card className="bg-gray-900 border-gray-800 shadow-lg overflow-hidden h-full">
                <CardHeader className="p-4 pb-2 border-b border-gray-800">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-blue-400" />
                      <CardTitle className="text-lg font-medium text-gray-200">
                        Historical Trends
                      </CardTitle>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-gray-800 border-gray-700 hover:bg-gray-700 text-gray-300"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-4">
                  <Tabs defaultValue="24h">
                    <TabsList className="bg-gray-800 mb-4">
                      <TabsTrigger value="24h">24 Hours</TabsTrigger>
                      <TabsTrigger value="7d">7 Days</TabsTrigger>
                      <TabsTrigger value="30d">30 Days</TabsTrigger>
                    </TabsList>

                    <TabsContent value="24h" className="space-y-4">
                      <div className="h-[250px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart
                            data={historicalData}
                            margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
                          >
                            <CartesianGrid
                              strokeDasharray="3 3"
                              stroke="#374151"
                            />
                            <XAxis dataKey="time" stroke="#6b7280" />
                            <YAxis stroke="#6b7280" />
                            <Tooltip
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
                              activeDot={{ r: 6 }}
                            />
                            <Line
                              type="monotone"
                              dataKey="drag"
                              stroke="#ff00aa"
                              strokeWidth={2}
                              dot={false}
                              activeDot={{ r: 6 }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 bg-gray-800/50 rounded-md border border-gray-800">
                          <div className="flex items-center gap-2 mb-1">
                            <RotateCw className="h-4 w-4 text-cyan-400" />
                            <h4 className="text-sm font-medium text-gray-300">
                              Torque Trend
                            </h4>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-500">
                              Average
                            </span>
                            <span className="text-sm text-cyan-400 font-medium">
                              15.8 kft-lbs
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-500">Peak</span>
                            <span className="text-sm text-cyan-400 font-medium">
                              24.3 kft-lbs
                            </span>
                          </div>
                        </div>

                        <div className="p-3 bg-gray-800/50 rounded-md border border-gray-800">
                          <div className="flex items-center gap-2 mb-1">
                            <ArrowUpDown className="h-4 w-4 text-pink-400" />
                            <h4 className="text-sm font-medium text-gray-300">
                              Drag Trend
                            </h4>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-500">
                              Average
                            </span>
                            <span className="text-sm text-pink-400 font-medium">
                              18.2 klbs
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-500">Peak</span>
                            <span className="text-sm text-pink-400 font-medium">
                              26.7 klbs
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="p-3 bg-gray-800/30 rounded-md border border-gray-800">
                        <h4 className="text-sm font-medium text-gray-300 mb-2">
                          AI Insights
                        </h4>
                        <ul className="space-y-2 text-xs">
                          <li className="flex items-start gap-2">
                            <Zap className="h-3 w-3 text-cyan-400 mt-0.5" />
                            <span className="text-gray-300">
                              Torque increased by 18% in the last 6 hours,
                              correlating with formation change
                            </span>
                          </li>
                          <li className="flex items-start gap-2">
                            <Zap className="h-3 w-3 text-cyan-400 mt-0.5" />
                            <span className="text-gray-300">
                              Drag patterns show normal variation within
                              expected ranges
                            </span>
                          </li>
                          <li className="flex items-start gap-2">
                            <Zap className="h-3 w-3 text-cyan-400 mt-0.5" />
                            <span className="text-gray-300">
                              No significant stick-slip events detected in the
                              last 24 hours
                            </span>
                          </li>
                        </ul>
                      </div>
                    </TabsContent>

                    <TabsContent value="7d">
                      <div className="flex items-center justify-center h-[400px]">
                        <p className="text-gray-500">
                          7-day data would display here
                        </p>
                      </div>
                    </TabsContent>

                    <TabsContent value="30d">
                      <div className="flex items-center justify-center h-[400px]">
                        <p className="text-gray-500">
                          30-day data would display here
                        </p>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Real-time Parameters */}
          <div>
            <Card className="bg-gray-900 border-gray-800 shadow-lg overflow-hidden">
              <CardHeader className="p-4 pb-2 border-b border-gray-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Gauge className="h-5 w-5 text-yellow-400" />
                    <CardTitle className="text-lg font-medium text-gray-200">
                      Real-time Drilling Parameters
                    </CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  <ParameterCard
                    title="Torque"
                    value={16.8}
                    unit="kft-lbs"
                    icon={<RotateCw className="h-5 w-5 text-cyan-400" />}
                    trend="up"
                    color="cyan"
                  />
                  <ParameterCard
                    title="Drag"
                    value={19.2}
                    unit="klbs"
                    icon={<ArrowUpDown className="h-5 w-5 text-pink-400" />}
                    trend="stable"
                    color="pink"
                  />
                  <ParameterCard
                    title="WOB"
                    value={18.5}
                    unit="klbs"
                    icon={<Gauge className="h-5 w-5 text-yellow-400" />}
                    trend="down"
                    color="yellow"
                  />
                  <ParameterCard
                    title="RPM"
                    value={120}
                    unit="rpm"
                    icon={<RotateCw className="h-5 w-5 text-green-400" />}
                    trend="stable"
                    color="green"
                  />
                  <ParameterCard
                    title="ROP"
                    value={45.2}
                    unit="ft/hr"
                    icon={<Drill className="h-5 w-5 text-blue-400" />}
                    trend="up"
                    color="blue"
                  />
                  <ParameterCard
                    title="Friction"
                    value={0.28}
                    unit="coef"
                    icon={<Layers className="h-5 w-5 text-orange-400" />}
                    trend="stable"
                    color="orange"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

interface ParameterCardProps {
  title: string;
  value: number;
  unit: string;
  icon: React.ReactNode;
  trend: "up" | "down" | "stable";
  color: string;
}

const ParameterCard = ({
  title,
  value,
  unit,
  icon,
  trend,
  color,
}: ParameterCardProps) => {
  const getTrendIcon = () => {
    switch (trend) {
      case "up":
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case "down":
        return (
          <TrendingUp className="h-4 w-4 text-red-500 transform rotate-180" />
        );
      default:
        return null;
    }
  };

  const getColorClass = () => {
    switch (color) {
      case "cyan":
        return "text-cyan-400";
      case "pink":
        return "text-pink-400";
      case "yellow":
        return "text-yellow-400";
      case "green":
        return "text-green-400";
      case "blue":
        return "text-blue-400";
      case "orange":
        return "text-orange-400";
      default:
        return "text-gray-400";
    }
  };

  return (
    <div className="p-3 bg-gray-800/50 rounded-md border border-gray-800">
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-2">
          {icon}
          <h3 className="text-sm font-medium text-gray-300">{title}</h3>
        </div>
        {getTrendIcon()}
      </div>
      <div className="flex items-baseline gap-2">
        <span className={`text-2xl font-bold ${getColorClass()}`}>
          {value.toFixed(2)}
        </span>
        <span className="text-xs text-gray-500">{unit}</span>
      </div>
    </div>
  );
};

export default TorqueDragPage;
