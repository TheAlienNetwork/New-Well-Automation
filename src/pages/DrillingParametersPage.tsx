import React, { useState } from "react";
import Navbar from "@/components/layout/Navbar";
import StatusBar from "@/components/dashboard/StatusBar";
import WidgetGrid from "@/components/dashboard/WidgetGrid";
import WidgetManager, {
  WidgetType,
} from "@/components/dashboard/WidgetManager";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  BarChart3,
  Download,
  Settings,
  Plus,
  Gauge,
  RotateCw,
  ArrowUpDown,
  Drill,
  Layers,
} from "lucide-react";

const DrillingParametersPage = () => {
  const [dashboardWidgets, setDashboardWidgets] = useState<WidgetType[]>([
    {
      id: "widget-1",
      type: "ropAnalysis",
      title: "ROP Analysis",
      size: "medium",
      position: { x: 0, y: 0 },
    },
    {
      id: "widget-2",
      type: "wob",
      title: "Weight on Bit",
      size: "small",
      position: { x: 0, y: 1 },
    },
    {
      id: "widget-3",
      type: "rpm",
      title: "RPM Monitor",
      size: "small",
      position: { x: 1, y: 1 },
    },
  ]);

  const handleAddWidget = (widget: Omit<WidgetType, "id">) => {
    const newWidget = {
      ...widget,
      id: `widget-${Date.now()}`,
    };
    setDashboardWidgets([...dashboardWidgets, newWidget]);
  };

  const handleRemoveWidget = (id: string) => {
    setDashboardWidgets(dashboardWidgets.filter((widget) => widget.id !== id));
  };

  const handleUpdateWidget = (id: string, updates: Partial<WidgetType>) => {
    setDashboardWidgets(
      dashboardWidgets.map((widget) =>
        widget.id === id ? { ...widget, ...updates } : widget,
      ),
    );
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-200">
      <Navbar />
      <StatusBar />

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 gap-6">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-200">
              Drilling Parameters
            </h1>
            <WidgetManager
              widgets={dashboardWidgets}
              onAddWidget={handleAddWidget}
              onRemoveWidget={handleRemoveWidget}
              onUpdateWidget={handleUpdateWidget}
            />
          </div>

          {/* Real-time Parameters */}
          <Card className="bg-gray-900 border-gray-800 shadow-lg overflow-hidden">
            <CardHeader className="p-4 pb-2 border-b border-gray-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Gauge className="h-5 w-5 text-yellow-400" />
                  <CardTitle className="text-lg font-medium text-gray-200">
                    Real-time Drilling Parameters
                  </CardTitle>
                  <Badge
                    variant="outline"
                    className="bg-green-900/30 text-green-400 border-green-800 animate-pulse"
                  >
                    LIVE
                  </Badge>
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
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <ParameterCard
                  title="ROP"
                  value={45.2}
                  unit="ft/hr"
                  icon={<Drill className="h-5 w-5 text-blue-400" />}
                  trend="up"
                  color="blue"
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
                  title="Torque"
                  value={16.8}
                  unit="kft-lbs"
                  icon={<RotateCw className="h-5 w-5 text-cyan-400" />}
                  trend="up"
                  color="cyan"
                />
                <ParameterCard
                  title="SPP"
                  value={3250}
                  unit="psi"
                  icon={<Gauge className="h-5 w-5 text-red-400" />}
                  trend="stable"
                  color="red"
                />
                <ParameterCard
                  title="Flow"
                  value={650}
                  unit="gpm"
                  icon={<ArrowUpDown className="h-5 w-5 text-purple-400" />}
                  trend="stable"
                  color="purple"
                />
              </div>
            </CardContent>
          </Card>

          {/* Widget Grid */}
          <div className="h-[600px]">
            <WidgetGrid />
          </div>

          {/* Historical Data */}
          <Card className="bg-gray-900 border-gray-800 shadow-lg overflow-hidden">
            <CardHeader className="p-4 pb-2 border-b border-gray-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-blue-400" />
                  <CardTitle className="text-lg font-medium text-gray-200">
                    Historical Parameter Data
                  </CardTitle>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-gray-800 border-gray-700 hover:bg-gray-700 text-gray-300"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Configure
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <Tabs defaultValue="rop">
                <TabsList className="bg-gray-800 mb-4">
                  <TabsTrigger value="rop">ROP</TabsTrigger>
                  <TabsTrigger value="wob">WOB</TabsTrigger>
                  <TabsTrigger value="rpm">RPM</TabsTrigger>
                  <TabsTrigger value="torque">Torque</TabsTrigger>
                  <TabsTrigger value="pressure">Pressure</TabsTrigger>
                  <TabsTrigger value="flow">Flow</TabsTrigger>
                </TabsList>

                <TabsContent
                  value="rop"
                  className="h-[300px] flex items-center justify-center"
                >
                  <div className="text-gray-500">
                    ROP historical data chart would display here
                  </div>
                </TabsContent>
                <TabsContent
                  value="wob"
                  className="h-[300px] flex items-center justify-center"
                >
                  <div className="text-gray-500">
                    WOB historical data chart would display here
                  </div>
                </TabsContent>
                <TabsContent
                  value="rpm"
                  className="h-[300px] flex items-center justify-center"
                >
                  <div className="text-gray-500">
                    RPM historical data chart would display here
                  </div>
                </TabsContent>
                <TabsContent
                  value="torque"
                  className="h-[300px] flex items-center justify-center"
                >
                  <div className="text-gray-500">
                    Torque historical data chart would display here
                  </div>
                </TabsContent>
                <TabsContent
                  value="pressure"
                  className="h-[300px] flex items-center justify-center"
                >
                  <div className="text-gray-500">
                    Pressure historical data chart would display here
                  </div>
                </TabsContent>
                <TabsContent
                  value="flow"
                  className="h-[300px] flex items-center justify-center"
                >
                  <div className="text-gray-500">
                    Flow historical data chart would display here
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
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
        return <BarChart3 className="h-4 w-4 text-green-500" />;
      case "down":
        return (
          <BarChart3 className="h-4 w-4 text-red-500 transform rotate-180" />
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
      case "red":
        return "text-red-400";
      case "purple":
        return "text-purple-400";
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
          {value.toFixed(1)}
        </span>
        <span className="text-xs text-gray-500">{unit}</span>
      </div>
    </div>
  );
};

export default DrillingParametersPage;
