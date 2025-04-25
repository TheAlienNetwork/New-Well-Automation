import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Settings,
  ZoomIn,
  ZoomOut,
  Play,
  Pause,
  Filter,
  Save,
  Download,
  Wand2,
  RefreshCw,
  Maximize2,
  Zap,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";

// Generate dummy pulse data for visualization
function generateDummyData(length: number): number[] {
  const result = [];
  let value = 0;

  for (let i = 0; i < length; i++) {
    // Create pulse-like patterns with single spikes
    if (i % 50 === 0) {
      value = 0.9 + Math.random() * 0.1; // High pulse
    } else if (i % 50 === 1 || i % 50 === 2) {
      value = 0.1 + Math.random() * 0.1; // Slightly longer return to baseline
    } else {
      // Flat line with minimal noise
      value = Math.random() * 0.03; // Less noise for cleaner look
    }
    result.push(value);
  }

  return result;
}

interface HorizontalDecoderProps {
  data?: number[];
  isLive?: boolean;
  sampleRate?: number;
  noiseLevel?: number;
  aiFilterEnabled?: boolean;
  onFilterChange?: (value: boolean) => void;
  onNoiseFilterChange?: (value: number) => void;
}

const HorizontalDecoder = ({
  data = generateDummyData(1000),
  isLive = true,
  sampleRate = 10,
  noiseLevel = 30,
  aiFilterEnabled = false,
  onFilterChange = () => {},
  onNoiseFilterChange = () => {},
}: HorizontalDecoderProps) => {
  const [zoom, setZoom] = useState(1);
  const [isPaused, setIsPaused] = useState(false);
  const [currentNoiseFilter, setCurrentNoiseFilter] = useState(noiseLevel);
  const [isAiEnabled, setIsAiEnabled] = useState(aiFilterEnabled);
  const [activeTab, setActiveTab] = useState("live");
  const [signalQuality, setSignalQuality] = useState(85);
  const [decodedBits, setDecodedBits] = useState<string>("10110010");
  const [showStats, setShowStats] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const [offset, setOffset] = useState(0);

  // Draw the waveform on the canvas - Modern spike visualization
  const drawWaveform = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas with dark background
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw baseline
    const baseY = canvas.height / 2; // Center line
    ctx.strokeStyle = "#334155";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, baseY);
    ctx.lineTo(canvas.width, baseY);
    ctx.stroke();

    // Draw time markers (seconds)
    drawTimeMarkers(ctx, canvas, baseY);

    // Draw waveform - Modern single spike visualization
    drawModernSpikes(ctx, canvas, baseY);

    // Draw signal quality indicator
    if (showStats) {
      drawSignalQualityIndicator(ctx, canvas);
      drawDecodedBits(ctx, canvas);
    }
  };

  const drawTimeMarkers = (
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    baseY: number,
  ) => {
    ctx.fillStyle = "#64748b";
    ctx.font = "10px monospace";
    ctx.textAlign = "center";

    // Draw second markers at the bottom of the canvas
    const secondWidth = 100 * zoom; // Pixels per second
    const totalSeconds = Math.ceil(canvas.width / secondWidth);
    const bottomY = canvas.height - 15; // Position at bottom

    for (let i = 0; i <= totalSeconds; i++) {
      const x = i * secondWidth - (offset % secondWidth);
      if (x < 0 || x > canvas.width) continue;

      // Draw second label at bottom
      ctx.fillText(`${i}s`, x, bottomY + 10);

      // Draw tick mark at bottom
      ctx.strokeStyle = "#334155";
      ctx.beginPath();
      ctx.moveTo(x, bottomY - 5);
      ctx.lineTo(x, bottomY + 5);
      ctx.stroke();
    }
  };

  const drawModernSpikes = (
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    baseY: number,
  ) => {
    const pointsPerPixel = Math.max(
      1,
      Math.floor(data.length / (canvas.width * zoom)),
    );
    const visibleDataStart = Math.floor(offset / zoom);
    const spikeWidth = 6; // Wider spike base

    // Draw the flat line first
    ctx.strokeStyle = "rgba(56, 189, 248, 0.3)"; // Transparent blue
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, baseY);
    ctx.lineTo(canvas.width, baseY);
    ctx.stroke();

    // Draw each spike - moving from right to left
    for (let i = 0; i < data.length; i += pointsPerPixel) {
      // Calculate x position - moving from right to left
      const x = canvas.width - (i - visibleDataStart) / pointsPerPixel;
      if (x < -10 || x > canvas.width + 10) continue;

      // Get pulse value with noise filtering
      let value = data[i];
      if (Math.abs(value) < currentNoiseFilter / 100) {
        value *= currentNoiseFilter / 100;
      }

      // Apply AI enhancement if enabled
      if (isAiEnabled && value > 0.3) {
        value = Math.min(1, value * 1.2);
      }

      // Only draw significant spikes
      if (value > 0.3) {
        const spikeHeight = value * (canvas.height * 0.4);
        const y = baseY - spikeHeight;

        // Create gradient for spike with more premium look
        const gradient = ctx.createLinearGradient(x, baseY, x, y);
        gradient.addColorStop(0, "rgba(56, 189, 248, 0)"); // Transparent at base
        gradient.addColorStop(0.2, "rgba(56, 189, 248, 0.4)"); // More visible in middle
        gradient.addColorStop(0.7, "rgba(56, 189, 248, 0.6)"); // More visible near top
        gradient.addColorStop(1, "rgba(59, 130, 246, 0.9)"); // More saturated blue at tip

        // Draw spike with rounded tip - wider and more premium looking
        ctx.beginPath();

        // Draw the spike as a path
        ctx.moveTo(x - spikeWidth, baseY); // Start at baseline, left of center

        // Left side of spike
        ctx.quadraticCurveTo(
          x - spikeWidth / 2,
          y + spikeHeight * 0.3, // Control point - smoother curve
          x,
          y, // End point (tip of spike)
        );

        // Right side of spike
        ctx.quadraticCurveTo(
          x + spikeWidth / 2,
          y + spikeHeight * 0.3, // Control point - smoother curve
          x + spikeWidth,
          baseY, // End point (back to baseline)
        );

        ctx.closePath();

        // Fill with gradient
        ctx.fillStyle = gradient;
        ctx.fill();

        // Add premium glow effect
        ctx.shadowColor = "rgba(59, 130, 246, 0.7)";
        ctx.shadowBlur = 12;
        ctx.fill();

        // Add inner glow
        ctx.shadowColor = "rgba(147, 197, 253, 0.8)";
        ctx.shadowBlur = 4;
        ctx.fill();
        ctx.shadowBlur = 0;

        // Add bit indicator for significant pulses
        if (value > 0.7) {
          const bit = i % 100 < 50 ? "1" : "0";
          ctx.fillStyle = "#ffffff";
          ctx.font = "bold 10px monospace";
          ctx.textAlign = "center";
          ctx.fillText(bit, x, y - 12);
        }
      }
    }
  };

  const drawSignalQualityIndicator = (
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
  ) => {
    const margin = 10;
    const width = 120;
    const height = 30;
    const x = canvas.width - width - margin;
    const y = margin;

    // Draw background
    ctx.fillStyle = "rgba(15, 23, 42, 0.7)";
    ctx.strokeStyle = "#334155";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(x, y, width, height, 5);
    ctx.fill();
    ctx.stroke();

    // Draw signal quality text
    ctx.fillStyle = "#94a3b8";
    ctx.font = "10px monospace";
    ctx.textAlign = "left";
    ctx.fillText("Signal Quality", x + 10, y + 12);

    // Draw signal quality bar
    const barWidth = 100;
    const barHeight = 6;
    const barX = x + 10;
    const barY = y + 18;

    // Background
    ctx.fillStyle = "#1e293b";
    ctx.beginPath();
    ctx.roundRect(barX, barY, barWidth, barHeight, 3);
    ctx.fill();

    // Determine color based on signal quality
    let qualityColor;
    if (signalQuality > 80) {
      qualityColor = "#10b981"; // Green for good
    } else if (signalQuality > 50) {
      qualityColor = "#f59e0b"; // Yellow for medium
    } else {
      qualityColor = "#ef4444"; // Red for poor
    }

    // Fill bar based on signal quality
    const fillWidth = (signalQuality / 100) * barWidth;
    ctx.fillStyle = qualityColor;
    ctx.beginPath();
    ctx.roundRect(barX, barY, fillWidth, barHeight, 3);
    ctx.fill();

    // Add glow effect
    ctx.shadowColor = qualityColor;
    ctx.shadowBlur = 5;
    ctx.fill();
    ctx.shadowBlur = 0;

    // Add percentage
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 10px monospace";
    ctx.textAlign = "right";
    ctx.fillText(`${signalQuality}%`, x + width - 10, y + 20);
  };

  const drawDecodedBits = (
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
  ) => {
    const margin = 10;
    const width = 200;
    const height = 60;
    const x = margin;
    const y = margin;

    // Draw background
    ctx.fillStyle = "rgba(15, 23, 42, 0.7)";
    ctx.strokeStyle = "#334155";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(x, y, width, height, 5);
    ctx.fill();
    ctx.stroke();

    // Draw title
    ctx.fillStyle = "#94a3b8";
    ctx.font = "10px monospace";
    ctx.textAlign = "left";
    ctx.fillText("Decoded Data", x + 10, y + 15);

    // Draw bits
    ctx.font = "bold 14px monospace";
    ctx.textAlign = "center";

    const bitWidth = width / 10;
    for (let i = 0; i < decodedBits.length; i++) {
      const bitX = x + 10 + i * bitWidth + bitWidth / 2;
      const bitY = y + 40;

      const bit = decodedBits[i];
      const bitColor = bit === "1" ? "#38bdf8" : "#818cf8";

      // Draw bit background
      ctx.fillStyle =
        bit === "1" ? "rgba(56, 189, 248, 0.2)" : "rgba(129, 140, 248, 0.2)";
      ctx.beginPath();
      ctx.roundRect(bitX - bitWidth / 2 + 2, bitY - 15, bitWidth - 4, 20, 3);
      ctx.fill();

      // Draw bit text with glow
      ctx.fillStyle = bitColor;
      ctx.shadowColor = bitColor;
      ctx.shadowBlur = 5;
      ctx.fillText(bit, bitX, bitY);
      ctx.shadowBlur = 0;
    }
  };

  // Animation loop for live data
  const animate = () => {
    if (!isPaused && isLive && activeTab === "live") {
      // Update offset to move pulses from right to left
      setOffset((prev) => prev + 2); // Faster movement for more dynamic feel

      // Randomly update signal quality for demo
      if (Math.random() < 0.05) {
        setSignalQuality((prev) => {
          const change = Math.random() < 0.5 ? -1 : 1;
          return Math.max(40, Math.min(98, prev + change));
        });
      }

      // Occasionally update decoded bits for demo
      if (Math.random() < 0.02) {
        const newBit = Math.random() > 0.5 ? "1" : "0";
        setDecodedBits((prev) => (prev + newBit).slice(-8));
      }

      // Occasionally generate new pulse data
      if (Math.random() < 0.01) {
        // Add a new pulse at the beginning of the data array
        const newData = [...data];
        newData.unshift(0.9 + Math.random() * 0.1); // Add high pulse
        newData.unshift(0.1 + Math.random() * 0.1); // Add return to baseline
        // Keep array size constant
        while (newData.length > data.length) {
          newData.pop();
        }
      }
    }

    drawWaveform();
    animationRef.current = requestAnimationFrame(animate);
  };

  // Initialize and clean up animation
  useEffect(() => {
    // Set canvas dimensions
    if (canvasRef.current) {
      canvasRef.current.width = canvasRef.current.offsetWidth;
      canvasRef.current.height = canvasRef.current.offsetHeight;
    }

    // Start animation
    animationRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [zoom, isPaused, currentNoiseFilter, isAiEnabled, activeTab]);

  // Handle noise filter change
  const handleNoiseFilterChange = (value: number[]) => {
    setCurrentNoiseFilter(value[0]);
    onNoiseFilterChange(value[0]);
  };

  // Handle AI filter toggle
  const handleAiToggle = (checked: boolean) => {
    setIsAiEnabled(checked);
    onFilterChange(checked);
  };

  return (
    <Card className="w-full h-full bg-gray-950 border-gray-800 shadow-lg overflow-hidden">
      <CardContent className="p-0">
        <div className="flex flex-col h-full">
          {/* Tabs for switching between live and replay modes */}
          <Tabs
            defaultValue="live"
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <div className="flex justify-between items-center px-4 py-2 border-b border-gray-800 bg-gray-900">
              <TabsList className="bg-gray-800">
                <TabsTrigger
                  value="live"
                  className="data-[state=active]:bg-gray-700 data-[state=active]:text-blue-400"
                >
                  Live Data
                </TabsTrigger>
                <TabsTrigger
                  value="replay"
                  className="data-[state=active]:bg-gray-700 data-[state=active]:text-blue-400"
                >
                  Analysis
                </TabsTrigger>
              </TabsList>
              <div className="absolute top-2 left-1/2 transform -translate-x-1/2 z-10">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 bg-gray-800/90 border-blue-900/50 hover:bg-blue-900/30 hover:border-blue-800 text-blue-400 rounded-md shadow-lg transition-all duration-200"
                      >
                        <Maximize2 className="h-4 w-4 mr-2" />
                        Open Replay Stand
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Open Replay Stand</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div className="flex items-center gap-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 bg-gray-800 border-gray-700 hover:bg-gray-700"
                        onClick={() => setShowStats(!showStats)}
                      >
                        <Zap className="h-4 w-4 text-blue-400" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Toggle Stats</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 bg-gray-800 border-gray-700 hover:bg-gray-700"
                        onClick={() =>
                          setZoom((prev) => Math.min(prev + 0.5, 5))
                        }
                      >
                        <ZoomIn className="h-4 w-4 text-gray-400" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Zoom In</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 bg-gray-800 border-gray-700 hover:bg-gray-700"
                        onClick={() =>
                          setZoom((prev) => Math.max(prev - 0.5, 0.5))
                        }
                      >
                        <ZoomOut className="h-4 w-4 text-gray-400" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Zoom Out</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 bg-gray-800 border-gray-700 hover:bg-gray-700"
                        onClick={() => setIsPaused((prev) => !prev)}
                      >
                        {isPaused ? (
                          <Play className="h-4 w-4 text-green-400" />
                        ) : (
                          <Pause className="h-4 w-4 text-amber-400" />
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{isPaused ? "Resume" : "Pause"}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>

            <TabsContent value="live" className="flex-1 mt-0">
              <div className="relative h-full">
                {/* Replay Stand Button - Centered at top */}

                <canvas ref={canvasRef} className="w-full h-full flex" />
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-blue-500/30 rounded-full cursor-nwse-resize resize-handle resize-handle-se" />
              </div>
            </TabsContent>

            <TabsContent value="replay" className="flex-1 mt-0 p-4 bg-gray-900">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-800/50 p-4 rounded-md border border-gray-800">
                  <h3 className="text-sm font-medium text-gray-300 mb-3 flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    Signal Quality Analysis
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-400">Current Quality:</span>
                      <span
                        className={
                          signalQuality > 80
                            ? "text-green-400"
                            : signalQuality > 50
                              ? "text-yellow-400"
                              : "text-red-400"
                        }
                      >
                        {signalQuality}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-700 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${signalQuality > 80 ? "bg-green-500" : signalQuality > 50 ? "bg-yellow-500" : "bg-red-500"}`}
                        style={{ width: `${signalQuality}%` }}
                      ></div>
                    </div>
                    <div className="text-xs text-gray-500 mt-2">
                      {signalQuality > 80
                        ? "Excellent signal quality. No action required."
                        : signalQuality > 50
                          ? "Moderate signal quality. Consider increasing noise filtering."
                          : "Poor signal quality. Check flow rate and surface equipment."}
                    </div>
                  </div>
                </div>

                <div className="bg-gray-800/50 p-4 rounded-md border border-gray-800">
                  <h3 className="text-sm font-medium text-gray-300 mb-3 flex items-center">
                    <AlertTriangle className="h-4 w-4 text-yellow-500 mr-2" />
                    Noise Analysis
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-400">Noise Level:</span>
                      <span className="text-yellow-400">
                        {100 - signalQuality}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-700 h-2 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-yellow-500"
                        style={{ width: `${100 - signalQuality}%` }}
                      ></div>
                    </div>
                    <div className="text-xs text-gray-500 mt-2">
                      Primary noise sources: Pump harmonics, Drill string
                      vibration
                    </div>
                  </div>
                </div>

                <div className="bg-gray-800/50 p-4 rounded-md border border-gray-800">
                  <h3 className="text-sm font-medium text-gray-300 mb-3 flex items-center">
                    <Zap className="h-4 w-4 text-blue-400 mr-2" />
                    Decoded Data
                  </h3>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {decodedBits.split("").map((bit, index) => (
                      <div
                        key={index}
                        className={`w-8 h-8 flex items-center justify-center rounded-md ${bit === "1" ? "bg-blue-900/30 text-blue-400 border border-blue-800" : "bg-indigo-900/30 text-indigo-400 border border-indigo-800"}`}
                      >
                        {bit}
                      </div>
                    ))}
                  </div>
                  <div className="text-xs text-gray-500">
                    Last decoded byte:{" "}
                    {parseInt(decodedBits, 2)
                      .toString(16)
                      .toUpperCase()
                      .padStart(2, "0")}
                    h
                  </div>
                </div>

                <div className="bg-gray-800/50 p-4 rounded-md border border-gray-800">
                  <h3 className="text-sm font-medium text-gray-300 mb-3 flex items-center">
                    <RefreshCw className="h-4 w-4 text-blue-400 mr-2" />
                    Sync Status
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-400">Sync Quality:</span>
                      <span className="text-blue-400">92%</span>
                    </div>
                    <div className="w-full bg-gray-700 h-2 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500"
                        style={{ width: "92%" }}
                      ></div>
                    </div>
                    <div className="text-xs text-gray-500 mt-2">
                      Frame sync established. Receiving valid telemetry.
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {/* Bottom control panel */}
          <div className="flex justify-between items-center px-4 py-2 border-t border-gray-800 bg-gray-900">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-400" />
                <span className="text-xs text-gray-400">Noise Filter:</span>
                <div className="w-24">
                  <Slider
                    value={[currentNoiseFilter]}
                    min={0}
                    max={100}
                    step={1}
                    onValueChange={handleNoiseFilterChange}
                    className="cursor-pointer"
                  />
                </div>
                <span className="text-xs text-gray-400">
                  {currentNoiseFilter}%
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Wand2 className="h-4 w-4 text-blue-400" />
                <Label htmlFor="ai-filter" className="text-xs text-gray-400">
                  AI Enhancement:
                </Label>
                <Switch
                  id="ai-filter"
                  checked={isAiEnabled}
                  onCheckedChange={handleAiToggle}
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-7 bg-gray-800 border-gray-700 hover:bg-gray-700 text-xs"
              >
                <Save className="h-3 w-3 mr-1" />
                Save
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-7 bg-gray-800 border-gray-700 hover:bg-gray-700 text-xs"
              >
                <Download className="h-3 w-3 mr-1" />
                Export
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default HorizontalDecoder;
