import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  FastForward,
  Rewind,
  Filter,
  Download,
  ZoomIn,
  ZoomOut,
  Clock,
  Wand2,
} from "lucide-react";

interface ReplayStandProps {
  data?: {
    pulses: number[];
    timestamps: string[];
    noiseLevel: number;
    signalStrength: number;
  };
  onFilterChange?: (settings: any) => void;
  onExport?: () => void;
}

const ReplayStand = ({
  data = {
    pulses: Array.from({ length: 100 }, () => Math.random() * 2 - 1),
    timestamps: Array.from({ length: 100 }, (_, i) => {
      const date = new Date();
      date.setSeconds(date.getSeconds() - (100 - i));
      return date.toISOString();
    }),
    noiseLevel: 0.3,
    signalStrength: 0.8,
  },
  onFilterChange = () => {},
  onExport = () => {},
}: ReplayStandProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [currentPosition, setCurrentPosition] = useState(50);
  const [filterSettings, setFilterSettings] = useState({
    noiseReduction: true,
    signalBoost: false,
    aiFiltering: true,
    filterStrength: 60,
  });

  // Generate waveform data points
  const waveformPoints = data.pulses
    .map((val, index) => {
      const x = (index / (data.pulses.length - 1)) * 100;
      const y = 50 - val * 40; // Scale to fit in the SVG
      return `${x},${y}`;
    })
    .join(" ");

  const handleFilterChange = (key: string, value: any) => {
    const newSettings = { ...filterSettings, [key]: value };
    setFilterSettings(newSettings);
    onFilterChange(newSettings);
  };

  const togglePlayback = () => {
    setIsPlaying(!isPlaying);
  };

  const handleZoom = (direction: "in" | "out") => {
    if (direction === "in" && zoomLevel < 5) {
      setZoomLevel(zoomLevel + 0.5);
    } else if (direction === "out" && zoomLevel > 0.5) {
      setZoomLevel(zoomLevel - 0.5);
    }
  };

  return (
    <Card className="w-full h-full bg-gray-900 border-gray-800 shadow-lg overflow-hidden flex flex-col">
      <CardHeader className="p-4 pb-2 border-b border-gray-800">
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl font-bold text-gray-200">
            Replay Stand
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="bg-gray-800 border-gray-700 hover:bg-gray-700 text-gray-300"
              onClick={onExport}
            >
              <Download className="h-4 w-4 mr-2" />
              Export Data
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 flex-grow flex flex-col">
        <div className="flex-grow relative">
          {/* Waveform visualization */}
          <div
            className="h-full w-full relative border border-gray-800 rounded-md bg-gray-950 overflow-hidden"
            style={{ minHeight: "200px" }}
          >
            <svg
              width="100%"
              height="100%"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              className="transform scale-x-100"
              style={{
                transform: `scaleX(${zoomLevel})`,
                transformOrigin: "center",
              }}
            >
              {/* Center line */}
              <line
                x1="0"
                y1="50"
                x2="100"
                y2="50"
                stroke="#333"
                strokeWidth="0.5"
                strokeDasharray="1,1"
              />

              {/* Waveform */}
              <polyline
                points={waveformPoints}
                fill="none"
                stroke="#00ffaa"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ filter: "drop-shadow(0 0 3px #00ffaa80)" }}
              />

              {/* Current position indicator */}
              <line
                x1={currentPosition}
                y1="0"
                x2={currentPosition}
                y2="100"
                stroke="#ff3366"
                strokeWidth="1"
                style={{ filter: "drop-shadow(0 0 5px #ff336680)" }}
              />
            </svg>

            {/* Time markers */}
            <div className="absolute bottom-0 left-0 right-0 flex justify-between px-2 text-xs text-gray-500 bg-gray-900 bg-opacity-50">
              <span>-60s</span>
              <span>-45s</span>
              <span>-30s</span>
              <span>-15s</span>
              <span>Now</span>
            </div>
          </div>
        </div>

        {/* Playback controls */}
        <div className="mt-4 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-gray-400 hover:text-white hover:bg-gray-800"
                onClick={() => setCurrentPosition(0)}
              >
                <SkipBack className="h-4 w-4" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-gray-400 hover:text-white hover:bg-gray-800"
                onClick={() =>
                  setCurrentPosition(Math.max(0, currentPosition - 10))
                }
              >
                <Rewind className="h-4 w-4" />
              </Button>

              <Button
                variant="outline"
                size="icon"
                className={`h-10 w-10 rounded-full ${isPlaying ? "bg-red-900 hover:bg-red-800" : "bg-green-900 hover:bg-green-800"} border-none`}
                onClick={togglePlayback}
              >
                {isPlaying ? (
                  <Pause className="h-5 w-5 text-white" />
                ) : (
                  <Play className="h-5 w-5 text-white" />
                )}
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-gray-400 hover:text-white hover:bg-gray-800"
                onClick={() =>
                  setCurrentPosition(Math.min(100, currentPosition + 10))
                }
              >
                <FastForward className="h-4 w-4" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-gray-400 hover:text-white hover:bg-gray-800"
                onClick={() => setCurrentPosition(100)}
              >
                <SkipForward className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-500" />
                <Select
                  value={playbackSpeed.toString()}
                  onValueChange={(value) => setPlaybackSpeed(parseFloat(value))}
                >
                  <SelectTrigger className="w-[100px] h-8 bg-gray-800 border-gray-700 text-gray-300">
                    <SelectValue placeholder="Speed" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-900 border-gray-800">
                    <SelectItem value="0.25">0.25x</SelectItem>
                    <SelectItem value="0.5">0.5x</SelectItem>
                    <SelectItem value="1">1x</SelectItem>
                    <SelectItem value="1.5">1.5x</SelectItem>
                    <SelectItem value="2">2x</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-gray-400 hover:text-white hover:bg-gray-800"
                  onClick={() => handleZoom("out")}
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <span className="text-xs text-gray-400">{zoomLevel}x</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-gray-400 hover:text-white hover:bg-gray-800"
                  onClick={() => handleZoom("in")}
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <Slider
            value={[currentPosition]}
            min={0}
            max={100}
            step={0.1}
            onValueChange={(value) => setCurrentPosition(value[0])}
            className="mt-2"
          />
        </div>

        {/* Filter controls */}
        <div className="mt-4">
          <Tabs defaultValue="filters" className="w-full">
            <TabsList className="bg-gray-800 border-gray-700">
              <TabsTrigger
                value="filters"
                className="data-[state=active]:bg-gray-700"
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </TabsTrigger>
              <TabsTrigger
                value="ai"
                className="data-[state=active]:bg-gray-700"
              >
                <Wand2 className="h-4 w-4 mr-2" />
                AI Processing
              </TabsTrigger>
            </TabsList>

            <TabsContent value="filters" className="mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col space-y-1">
                      <Label
                        htmlFor="noise-reduction"
                        className="text-sm text-gray-300"
                      >
                        Noise Reduction
                      </Label>
                      <span className="text-xs text-gray-500">
                        Reduces background noise in signal
                      </span>
                    </div>
                    <Switch
                      id="noise-reduction"
                      checked={filterSettings.noiseReduction}
                      onCheckedChange={(checked) =>
                        handleFilterChange("noiseReduction", checked)
                      }
                      className="data-[state=checked]:bg-green-600"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex flex-col space-y-1">
                      <Label
                        htmlFor="signal-boost"
                        className="text-sm text-gray-300"
                      >
                        Signal Boost
                      </Label>
                      <span className="text-xs text-gray-500">
                        Amplifies weak signals
                      </span>
                    </div>
                    <Switch
                      id="signal-boost"
                      checked={filterSettings.signalBoost}
                      onCheckedChange={(checked) =>
                        handleFilterChange("signalBoost", checked)
                      }
                      className="data-[state=checked]:bg-green-600"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label
                      htmlFor="filter-strength"
                      className="text-sm text-gray-300"
                    >
                      Filter Strength
                    </Label>
                    <div className="flex items-center gap-4 mt-2">
                      <Slider
                        id="filter-strength"
                        value={[filterSettings.filterStrength]}
                        min={0}
                        max={100}
                        step={1}
                        onValueChange={(value) =>
                          handleFilterChange("filterStrength", value[0])
                        }
                      />
                      <span className="text-sm text-gray-300 w-8">
                        {filterSettings.filterStrength}%
                      </span>
                    </div>
                  </div>

                  <div>
                    <Label
                      htmlFor="filter-preset"
                      className="text-sm text-gray-300"
                    >
                      Filter Preset
                    </Label>
                    <Select defaultValue="custom">
                      <SelectTrigger
                        id="filter-preset"
                        className="mt-2 bg-gray-800 border-gray-700 text-gray-300"
                      >
                        <SelectValue placeholder="Select preset" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-900 border-gray-800">
                        <SelectItem value="low">
                          Low Noise Environment
                        </SelectItem>
                        <SelectItem value="medium">
                          Medium Noise Environment
                        </SelectItem>
                        <SelectItem value="high">
                          High Noise Environment
                        </SelectItem>
                        <SelectItem value="custom">Custom</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="ai" className="mt-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col space-y-1">
                    <Label
                      htmlFor="ai-filtering"
                      className="text-sm text-gray-300"
                    >
                      AI Signal Processing
                    </Label>
                    <span className="text-xs text-gray-500">
                      Uses machine learning to enhance signal quality
                    </span>
                  </div>
                  <Switch
                    id="ai-filtering"
                    checked={filterSettings.aiFiltering}
                    onCheckedChange={(checked) =>
                      handleFilterChange("aiFiltering", checked)
                    }
                    className="data-[state=checked]:bg-blue-600"
                  />
                </div>

                <Separator className="bg-gray-800" />

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 border border-gray-800 rounded-md bg-gray-900 bg-opacity-50">
                    <h4 className="text-sm font-medium text-gray-300 mb-2">
                      Signal Quality Assessment
                    </h4>
                    <div className="flex items-center gap-2">
                      <div className="h-2 flex-grow bg-gray-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500"
                          style={{ width: `${data.signalStrength * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-400">
                        {Math.round(data.signalStrength * 100)}%
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      AI assessment: Good signal quality with minimal
                      interference
                    </p>
                  </div>

                  <div className="p-3 border border-gray-800 rounded-md bg-gray-900 bg-opacity-50">
                    <h4 className="text-sm font-medium text-gray-300 mb-2">
                      Noise Level
                    </h4>
                    <div className="flex items-center gap-2">
                      <div className="h-2 flex-grow bg-gray-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-green-500 via-yellow-500 to-red-500"
                          style={{ width: `${data.noiseLevel * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-400">
                        {Math.round(data.noiseLevel * 100)}%
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      AI assessment: Low background noise detected
                    </p>
                  </div>
                </div>

                <div className="p-3 border border-gray-800 rounded-md bg-gray-900 bg-opacity-50">
                  <h4 className="text-sm font-medium text-gray-300 mb-2">
                    AI Recommendations
                  </h4>
                  <ul className="text-xs text-gray-400 space-y-1 list-disc pl-4">
                    <li>
                      Increase filter strength to 75% for optimal signal clarity
                    </li>
                    <li>
                      Enable signal boost to improve detection of weak pulses
                    </li>
                    <li>
                      Current settings are adequate for present noise conditions
                    </li>
                  </ul>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </CardContent>
    </Card>
  );
};

export default ReplayStand;
