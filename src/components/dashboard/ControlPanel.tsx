import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Settings,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Filter,
  Save,
  Download,
  Upload,
  AlertTriangle,
  Zap,
  Wifi,
  Signal,
  BatteryMedium,
} from "lucide-react";

interface ControlPanelProps {
  isRecording?: boolean;
  signalStrength?: number;
  batteryLevel?: number;
  wifiStrength?: number;
  noiseLevel?: number;
  filterLevel?: number;
  onToggleRecording?: () => void;
  onAdjustFilter?: (value: number) => void;
  onAdjustNoise?: (value: number) => void;
}

const ControlPanel = ({
  isRecording = false,
  signalStrength = 85,
  batteryLevel = 72,
  wifiStrength = 90,
  noiseLevel = 30,
  filterLevel = 65,
  onToggleRecording = () => {},
  onAdjustFilter = () => {},
  onAdjustNoise = () => {},
}: ControlPanelProps) => {
  const [activeTab, setActiveTab] = useState("controls");
  const [aiAssistEnabled, setAiAssistEnabled] = useState(true);
  const [autoFilterEnabled, setAutoFilterEnabled] = useState(true);
  const [alertsEnabled, setAlertsEnabled] = useState(true);

  return (
    <Card className="w-full h-full bg-gray-900 border-gray-800 shadow-lg overflow-hidden flex flex-col resizable">
      <CardContent className="p-4 flex-grow">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-200">Control Panel</h3>
          <div className="flex items-center space-x-2">
            <StatusIndicator type="signal" value={signalStrength} />
            <StatusIndicator type="wifi" value={wifiStrength} />
            <StatusIndicator type="battery" value={batteryLevel} />
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-4 mb-4 bg-gray-800">
            <TabsTrigger value="controls" className="text-sm">
              Controls
            </TabsTrigger>
            <TabsTrigger value="filters" className="text-sm">
              Filters
            </TabsTrigger>
            <TabsTrigger value="settings" className="text-sm">
              Settings
            </TabsTrigger>
            <TabsTrigger value="surveys" className="text-sm">
              Surveys
            </TabsTrigger>
          </TabsList>

          <TabsContent value="controls" className="space-y-4">
            <div className="flex flex-col space-y-4">
              <div className="flex justify-center space-x-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 bg-gray-800 border-gray-700"
                      >
                        <SkipBack className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Previous Record</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        className={`h-10 w-10 ${isRecording ? "bg-red-900 border-red-700" : "bg-green-900 border-green-700"}`}
                        onClick={onToggleRecording}
                      >
                        {isRecording ? (
                          <Pause className="h-5 w-5" />
                        ) : (
                          <Play className="h-5 w-5" />
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>
                        {isRecording ? "Stop Recording" : "Start Recording"}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 bg-gray-800 border-gray-700"
                      >
                        <SkipForward className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Next Record</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  className="bg-gray-800 border-gray-700 text-sm h-9"
                >
                  <Save className="mr-2 h-4 w-4" />
                  Save Session
                </Button>
                <Button
                  variant="outline"
                  className="bg-gray-800 border-gray-700 text-sm h-9"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Export Data
                </Button>
              </div>

              <div className="pt-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-400">AI Assist</span>
                  <Switch
                    checked={aiAssistEnabled}
                    onCheckedChange={setAiAssistEnabled}
                    className="data-[state=checked]:bg-blue-600"
                  />
                </div>

                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-400">Auto Filtering</span>
                  <Switch
                    checked={autoFilterEnabled}
                    onCheckedChange={setAutoFilterEnabled}
                    className="data-[state=checked]:bg-blue-600"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Alerts</span>
                  <Switch
                    checked={alertsEnabled}
                    onCheckedChange={setAlertsEnabled}
                    className="data-[state=checked]:bg-blue-600"
                  />
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="filters" className="space-y-4">
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-400">Noise Reduction</span>
                  <span className="text-xs text-gray-500">{noiseLevel}%</span>
                </div>
                <Slider
                  value={[noiseLevel]}
                  max={100}
                  step={1}
                  className="cursor-pointer"
                  onValueChange={(value) => onAdjustNoise(value[0])}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-400">Signal Filter</span>
                  <span className="text-xs text-gray-500">{filterLevel}%</span>
                </div>
                <Slider
                  value={[filterLevel]}
                  max={100}
                  step={1}
                  className="cursor-pointer"
                  onValueChange={(value) => onAdjustFilter(value[0])}
                />
              </div>

              <Separator className="my-2 bg-gray-800" />

              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  className="bg-gray-800 border-gray-700 text-sm h-9"
                >
                  <Filter className="mr-2 h-4 w-4" />
                  Custom Filters
                </Button>
                <Button
                  variant="outline"
                  className="bg-gray-800 border-gray-700 text-sm h-9"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Load Preset
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <div className="space-y-3">
              <Button
                variant="outline"
                className="w-full justify-start bg-gray-800 border-gray-700 text-sm h-9"
              >
                <Settings className="mr-2 h-4 w-4" />
                System Configuration
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start bg-gray-800 border-gray-700 text-sm h-9"
              >
                <Zap className="mr-2 h-4 w-4" />
                Power Management
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start bg-gray-800 border-gray-700 text-sm h-9"
              >
                <AlertTriangle className="mr-2 h-4 w-4" />
                Alert Thresholds
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="surveys" className="space-y-4">
            <div className="h-[300px] overflow-auto border border-gray-800 rounded-md">
              <table className="w-full text-sm">
                <thead className="bg-gray-800/50 sticky top-0">
                  <tr>
                    <th className="text-left p-2 text-gray-400">MD (ft)</th>
                    <th className="text-left p-2 text-gray-400">Inc (°)</th>
                    <th className="text-left p-2 text-gray-400">Az (°)</th>
                    <th className="text-left p-2 text-gray-400">TF (°)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t border-gray-800 hover:bg-gray-800/30">
                    <td className="p-2 text-gray-300">8452.60</td>
                    <td className="p-2 text-gray-300">32.50</td>
                    <td className="p-2 text-gray-300">275.80</td>
                    <td className="p-2 text-gray-300">45.20</td>
                  </tr>
                  <tr className="border-t border-gray-800 hover:bg-gray-800/30">
                    <td className="p-2 text-gray-300">8422.40</td>
                    <td className="p-2 text-gray-300">31.80</td>
                    <td className="p-2 text-gray-300">274.50</td>
                    <td className="p-2 text-gray-300">44.80</td>
                  </tr>
                  <tr className="border-t border-gray-800 hover:bg-gray-800/30">
                    <td className="p-2 text-gray-300">8392.20</td>
                    <td className="p-2 text-gray-300">31.20</td>
                    <td className="p-2 text-gray-300">273.90</td>
                    <td className="p-2 text-gray-300">44.30</td>
                  </tr>
                  <tr className="border-t border-gray-800 hover:bg-gray-800/30">
                    <td className="p-2 text-gray-300">8362.00</td>
                    <td className="p-2 text-gray-300">30.70</td>
                    <td className="p-2 text-gray-300">273.20</td>
                    <td className="p-2 text-gray-300">43.90</td>
                  </tr>
                  <tr className="border-t border-gray-800 hover:bg-gray-800/30">
                    <td className="p-2 text-gray-300">8331.80</td>
                    <td className="p-2 text-gray-300">30.10</td>
                    <td className="p-2 text-gray-300">272.60</td>
                    <td className="p-2 text-gray-300">43.50</td>
                  </tr>
                  <tr className="border-t border-gray-800 hover:bg-gray-800/30">
                    <td className="p-2 text-gray-300">8301.60</td>
                    <td className="p-2 text-gray-300">29.50</td>
                    <td className="p-2 text-gray-300">272.10</td>
                    <td className="p-2 text-gray-300">43.10</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <Button
              variant="outline"
              className="w-full bg-gray-800 border-gray-700 hover:bg-gray-700 text-gray-300"
            >
              <Download className="mr-2 h-4 w-4" />
              Export Survey Data
            </Button>
          </TabsContent>
        </Tabs>
      </CardContent>

      {alertsEnabled && (
        <div className="bg-yellow-900/30 border-t border-yellow-800 p-2 text-xs text-yellow-300 flex items-center">
          <AlertTriangle className="h-4 w-4 mr-2" />
          Signal interference detected. Consider adjusting filters.
        </div>
      )}
    </Card>
  );
};

interface StatusIndicatorProps {
  type: "signal" | "wifi" | "battery";
  value: number;
}

const StatusIndicator = ({ type, value }: StatusIndicatorProps) => {
  let icon;
  let color;

  if (value > 70) {
    color = "text-green-500";
  } else if (value > 30) {
    color = "text-yellow-500";
  } else {
    color = "text-red-500";
  }

  switch (type) {
    case "signal":
      icon = <Signal className={`h-4 w-4 ${color}`} />;
      break;
    case "wifi":
      icon = <Wifi className={`h-4 w-4 ${color}`} />;
      break;
    case "battery":
      icon = <BatteryMedium className={`h-4 w-4 ${color}`} />;
      break;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="cursor-help">{icon}</div>
        </TooltipTrigger>
        <TooltipContent>
          <p>
            {type.charAt(0).toUpperCase() + type.slice(1)}: {value}%
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default ControlPanel;
