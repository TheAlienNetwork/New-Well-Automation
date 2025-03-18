import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Plus,
  X,
  Move,
  Settings,
  Layers,
  BarChart3,
  Gauge,
  Activity,
  Compass,
  Drill,
  Zap,
  Thermometer,
  Droplet,
  ArrowUpDown,
  RotateCw,
  Wrench,
  Maximize2,
  Minimize2,
  Save,
} from "lucide-react";

export type WidgetType = {
  id: string;
  type: string;
  title: string;
  size: "small" | "medium" | "large";
  position: { x: number; y: number };
  config?: any;
};

interface WidgetManagerProps {
  widgets: WidgetType[];
  onAddWidget: (widget: Omit<WidgetType, "id">) => void;
  onRemoveWidget: (id: string) => void;
  onUpdateWidget: (id: string, updates: Partial<WidgetType>) => void;
}

const WidgetManager: React.FC<WidgetManagerProps> = ({
  widgets,
  onAddWidget,
  onRemoveWidget,
  onUpdateWidget,
}) => {
  const [isAddWidgetOpen, setIsAddWidgetOpen] = useState(false);
  const [selectedWidgetType, setSelectedWidgetType] = useState<string | null>(
    null,
  );
  const [widgetTitle, setWidgetTitle] = useState("");
  const [widgetSize, setWidgetSize] = useState<"small" | "medium" | "large">(
    "medium",
  );

  const widgetTypes = [
    {
      type: "trajectory3d",
      title: "3D Trajectory",
      icon: <Layers className="h-5 w-5 text-cyan-400" />,
    },
    {
      type: "torqueDrag",
      title: "Torque & Drag",
      icon: <BarChart3 className="h-5 w-5 text-blue-400" />,
    },
    {
      type: "ropAnalysis",
      title: "ROP Analysis",
      icon: <Activity className="h-5 w-5 text-green-400" />,
    },
    {
      type: "vibration",
      title: "Vibration Analysis",
      icon: <Activity className="h-5 w-5 text-red-400" />,
    },
    {
      type: "compass",
      title: "Directional Compass",
      icon: <Compass className="h-5 w-5 text-yellow-400" />,
    },
    {
      type: "pulseDecoder",
      title: "Pulse Decoder",
      icon: <Zap className="h-5 w-5 text-purple-400" />,
    },
    {
      type: "temperature",
      title: "Temperature Profile",
      icon: <Thermometer className="h-5 w-5 text-orange-400" />,
    },
    {
      type: "hydraulics",
      title: "Hydraulics",
      icon: <Droplet className="h-5 w-5 text-blue-400" />,
    },
    {
      type: "wob",
      title: "Weight on Bit",
      icon: <ArrowUpDown className="h-5 w-5 text-yellow-400" />,
    },
    {
      type: "rpm",
      title: "RPM Monitor",
      icon: <RotateCw className="h-5 w-5 text-green-400" />,
    },
    {
      type: "bitWear",
      title: "Bit Wear Analysis",
      icon: <Wrench className="h-5 w-5 text-gray-400" />,
    },
    {
      type: "gamma",
      title: "Gamma Ray Log",
      icon: <Activity className="h-5 w-5 text-pink-400" />,
    },
  ];

  const handleAddWidget = () => {
    if (!selectedWidgetType) return;

    const widgetType = widgetTypes.find((w) => w.type === selectedWidgetType);

    onAddWidget({
      type: selectedWidgetType,
      title: widgetTitle || widgetType?.title || "New Widget",
      size: widgetSize,
      position: { x: 0, y: 0 },
    });

    setIsAddWidgetOpen(false);
    setSelectedWidgetType(null);
    setWidgetTitle("");
    setWidgetSize("medium");
  };

  return (
    <>
      <Button
        className="bg-blue-600 hover:bg-blue-700 text-white"
        onClick={() => setIsAddWidgetOpen(true)}
      >
        <Plus className="h-4 w-4 mr-2" />
        Add Widget
      </Button>

      <Dialog open={isAddWidgetOpen} onOpenChange={setIsAddWidgetOpen}>
        <DialogContent className="bg-gray-900 border-gray-800 text-gray-200 max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-200">
              Add Dashboard Widget
            </DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="drilling" className="mt-4">
            <TabsList className="bg-gray-800 mb-4">
              <TabsTrigger value="drilling">Drilling</TabsTrigger>
              <TabsTrigger value="directional">Directional</TabsTrigger>
              <TabsTrigger value="mwd">MWD</TabsTrigger>
              <TabsTrigger value="analysis">Analysis</TabsTrigger>
            </TabsList>

            <TabsContent value="drilling" className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                {widgetTypes
                  .filter((w) =>
                    [
                      "ropAnalysis",
                      "wob",
                      "rpm",
                      "hydraulics",
                      "bitWear",
                    ].includes(w.type),
                  )
                  .map((widget) => (
                    <WidgetTypeCard
                      key={widget.type}
                      title={widget.title}
                      icon={widget.icon}
                      isSelected={selectedWidgetType === widget.type}
                      onClick={() => setSelectedWidgetType(widget.type)}
                    />
                  ))}
              </div>
            </TabsContent>

            <TabsContent value="directional" className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                {widgetTypes
                  .filter((w) =>
                    ["trajectory3d", "compass", "torqueDrag"].includes(w.type),
                  )
                  .map((widget) => (
                    <WidgetTypeCard
                      key={widget.type}
                      title={widget.title}
                      icon={widget.icon}
                      isSelected={selectedWidgetType === widget.type}
                      onClick={() => setSelectedWidgetType(widget.type)}
                    />
                  ))}
              </div>
            </TabsContent>

            <TabsContent value="mwd" className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                {widgetTypes
                  .filter((w) =>
                    ["pulseDecoder", "gamma", "temperature"].includes(w.type),
                  )
                  .map((widget) => (
                    <WidgetTypeCard
                      key={widget.type}
                      title={widget.title}
                      icon={widget.icon}
                      isSelected={selectedWidgetType === widget.type}
                      onClick={() => setSelectedWidgetType(widget.type)}
                    />
                  ))}
              </div>
            </TabsContent>

            <TabsContent value="analysis" className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                {widgetTypes
                  .filter((w) => ["vibration"].includes(w.type))
                  .map((widget) => (
                    <WidgetTypeCard
                      key={widget.type}
                      title={widget.title}
                      icon={widget.icon}
                      isSelected={selectedWidgetType === widget.type}
                      onClick={() => setSelectedWidgetType(widget.type)}
                    />
                  ))}
              </div>
            </TabsContent>
          </Tabs>

          {selectedWidgetType && (
            <div className="mt-6 space-y-4 border-t border-gray-800 pt-4">
              <h3 className="text-lg font-medium text-gray-300">
                Widget Configuration
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="widget-title">Widget Title</Label>
                  <Input
                    id="widget-title"
                    value={widgetTitle}
                    onChange={(e) => setWidgetTitle(e.target.value)}
                    placeholder={
                      widgetTypes.find((w) => w.type === selectedWidgetType)
                        ?.title
                    }
                    className="bg-gray-800 border-gray-700 text-gray-200"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Widget Size</Label>
                  <div className="flex gap-2">
                    <Button
                      variant={widgetSize === "small" ? "default" : "outline"}
                      className={
                        widgetSize === "small"
                          ? "bg-blue-600"
                          : "bg-gray-800 border-gray-700"
                      }
                      onClick={() => setWidgetSize("small")}
                    >
                      <Minimize2 className="h-4 w-4 mr-2" />
                      Small
                    </Button>
                    <Button
                      variant={widgetSize === "medium" ? "default" : "outline"}
                      className={
                        widgetSize === "medium"
                          ? "bg-blue-600"
                          : "bg-gray-800 border-gray-700"
                      }
                      onClick={() => setWidgetSize("medium")}
                    >
                      <Maximize2 className="h-4 w-4 mr-2" />
                      Medium
                    </Button>
                    <Button
                      variant={widgetSize === "large" ? "default" : "outline"}
                      className={
                        widgetSize === "large"
                          ? "bg-blue-600"
                          : "bg-gray-800 border-gray-700"
                      }
                      onClick={() => setWidgetSize("large")}
                    >
                      <Maximize2 className="h-4 w-4 mr-2" />
                      Large
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="mt-6">
            <Button
              variant="outline"
              onClick={() => setIsAddWidgetOpen(false)}
              className="bg-gray-800 hover:bg-gray-700 text-gray-200 border-gray-700"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddWidget}
              className="bg-blue-600 hover:bg-blue-700 text-white"
              disabled={!selectedWidgetType}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Widget
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Current Widgets List */}
      <div className="mt-4">
        <Card className="bg-gray-900 border-gray-800 shadow-lg overflow-hidden">
          <CardHeader className="p-4 pb-2 border-b border-gray-800">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-medium text-gray-200">
                Current Dashboard Widgets
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                className="bg-gray-800 border-gray-700 hover:bg-gray-700 text-gray-300"
              >
                <Save className="h-4 w-4 mr-2" />
                Save Layout
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-4">
            <ScrollArea className="h-[200px]">
              <div className="space-y-2">
                {widgets.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    No widgets added yet. Click "Add Widget" to customize your
                    dashboard.
                  </div>
                ) : (
                  widgets.map((widget) => (
                    <div
                      key={widget.id}
                      className="flex items-center justify-between p-3 bg-gray-800/50 rounded-md border border-gray-800"
                    >
                      <div className="flex items-center gap-3">
                        <div className="cursor-move p-1 rounded hover:bg-gray-700">
                          <Move className="h-4 w-4 text-gray-400" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-300">
                            {widget.title}
                          </div>
                          <div className="text-xs text-gray-500">
                            {widget.type} • {widget.size}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-gray-400 hover:text-gray-300 hover:bg-gray-700"
                          onClick={() => {}}
                        >
                          <Settings className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-gray-400 hover:text-red-400 hover:bg-gray-700"
                          onClick={() => onRemoveWidget(widget.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

interface WidgetTypeCardProps {
  title: string;
  icon: React.ReactNode;
  isSelected: boolean;
  onClick: () => void;
}

const WidgetTypeCard: React.FC<WidgetTypeCardProps> = ({
  title,
  icon,
  isSelected,
  onClick,
}) => {
  return (
    <div
      className={`p-4 rounded-md border cursor-pointer transition-all ${isSelected ? "border-blue-500 bg-blue-900/20" : "border-gray-800 bg-gray-800/50 hover:bg-gray-800"}`}
      onClick={onClick}
    >
      <div className="flex flex-col items-center text-center gap-2">
        <div
          className={`p-3 rounded-full ${isSelected ? "bg-blue-900/30" : "bg-gray-800"}`}
        >
          {icon}
        </div>
        <div className="font-medium text-sm">{title}</div>
      </div>
    </div>
  );
};

export default WidgetManager;
