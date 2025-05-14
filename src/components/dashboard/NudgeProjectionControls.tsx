import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { calculateNudgeProjection } from "@/utils/directionalCalculations";
import {
  Activity,
  RotateCw,
  Settings,
  Lock,
  Unlock,
  Compass,
  Magnet,
  Database,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSurveys } from "@/context/SurveyContext";

interface NudgeProjectionControlsProps {
  currentInclination: number;
  currentAzimuth: number;
  onNudgeProjectionChange?: (projectedInc: number, projectedAz: number) => void;
  className?: string;
  witsData?: {
    toolFace?: number;
    motorYield?: number;
    slideDistance?: number;
    projectedInc?: number;
    projectedAz?: number;
  };
  isWitsConnected?: boolean;
  useSurveyData?: boolean;
}

export const NudgeProjectionControls = ({
  currentInclination = 0,
  currentAzimuth = 0,
  onNudgeProjectionChange,
  className = "",
  witsData = {},
  isWitsConnected = false,
}) => {
  // State for mode toggle
  const [isAutoMode, setIsAutoMode] = useState<boolean>(true);

  // State for toolface type (magnetic vs gravity)
  const [isGravityToolface, setIsGravityToolface] = useState<boolean>(false);

  // State for input values
  const [toolFace, setToolFace] = useState<number>(0);
  const [motorYield, setMotorYield] = useState<number>(2.5);
  const [slideDistance, setSlideDistance] = useState<number>(30);

  // State for projected values
  const [projectedInc, setProjectedInc] = useState<number>(currentInclination);
  const [projectedAz, setProjectedAz] = useState<number>(currentAzimuth);

  // Update from WITS data when in auto mode
  useEffect(() => {
    if (isAutoMode && isWitsConnected && witsData) {
      // Use WITS data if available, otherwise keep current values
      if (witsData.toolFace !== undefined) setToolFace(witsData.toolFace);
      if (witsData.motorYield !== undefined) setMotorYield(witsData.motorYield);
      if (witsData.slideDistance !== undefined)
        setSlideDistance(witsData.slideDistance);

      // Use projected values from WITS if available
      if (
        witsData.projectedInc !== undefined &&
        witsData.projectedAz !== undefined
      ) {
        setProjectedInc(witsData.projectedInc);
        setProjectedAz(witsData.projectedAz);

        // Notify parent component if callback provided
        if (onNudgeProjectionChange) {
          onNudgeProjectionChange(witsData.projectedInc, witsData.projectedAz);
        }
      }
    }
  }, [isAutoMode, isWitsConnected, witsData, onNudgeProjectionChange]);

  // Calculate projection when inputs change in manual mode
  useEffect(() => {
    if (!isAutoMode) {
      try {
        // Ensure we're passing the correct parameters
        const result = calculateNudgeProjection(
          currentInclination,
          currentAzimuth,
          toolFace,
          motorYield,
          slideDistance,
          isGravityToolface,
        );

        // Log for debugging
        console.log("Nudge Projection Calculation:", {
          inputs: {
            currentInclination,
            currentAzimuth,
            toolFace,
            motorYield,
            slideDistance,
            isGravityToolface,
          },
          result,
        });

        setProjectedInc(result.projectedInc);
        setProjectedAz(result.projectedAz);

        // Notify parent component if callback provided
        if (onNudgeProjectionChange) {
          onNudgeProjectionChange(result.projectedInc, result.projectedAz);
        }
      } catch (error) {
        console.error("Error calculating nudge projection:", error);
      }
    }
  }, [
    isAutoMode,
    currentInclination,
    currentAzimuth,
    toolFace,
    motorYield,
    slideDistance,
    isGravityToolface,
    onNudgeProjectionChange,
  ]);

  return (
    <Card
      className={`bg-gray-900 border-gray-800 shadow-lg overflow-hidden ${className}`}
    >
      <CardHeader className="p-3 pb-0 flex flex-col gap-2">
        <div className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-purple-400" />
            <CardTitle className="text-sm font-medium text-gray-300">
              Nudge Projection
            </CardTitle>
            <Badge
              variant="outline"
              className={`ml-2 ${isAutoMode ? "bg-blue-900/30 text-blue-400 border-blue-800" : "bg-purple-900/30 text-purple-400 border-purple-800"}`}
            >
              {isAutoMode ? "Auto" : "Manual"}
            </Badge>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={isAutoMode}
                    onCheckedChange={setIsAutoMode}
                    className="data-[state=checked]:bg-blue-600"
                  />
                  {isAutoMode ? (
                    <Lock className="h-3.5 w-3.5 text-blue-400" />
                  ) : (
                    <Unlock className="h-3.5 w-3.5 text-purple-400" />
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>
                  {isAutoMode ? "Switch to manual mode" : "Switch to auto mode"}
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {!isAutoMode && (
          <div className="flex justify-center mt-1">
            <Tabs
              defaultValue={isGravityToolface ? "gravity" : "magnetic"}
              className="w-full"
              onValueChange={(value) =>
                setIsGravityToolface(value === "gravity")
              }
            >
              <TabsList className="grid w-full grid-cols-2 h-7 bg-gray-800">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <TabsTrigger
                        value="magnetic"
                        className="text-xs flex items-center gap-1 data-[state=active]:bg-gray-700"
                      >
                        <Magnet className="h-3 w-3" /> Magnetic
                      </TabsTrigger>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      <p>Magnetic Toolface</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <TabsTrigger
                        value="gravity"
                        className="text-xs flex items-center gap-1 data-[state=active]:bg-gray-700"
                      >
                        <Compass className="h-3 w-3" /> Gravity
                      </TabsTrigger>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      <p>Gravity Toolface</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </TabsList>
            </Tabs>
          </div>
        )}
      </CardHeader>

      <CardContent className="p-3">
        <div className="space-y-4">
          {!isWitsConnected && isAutoMode && (
            <div className="p-2 bg-red-900/30 border border-red-800 rounded-md text-xs text-red-400 mb-2 flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                <line x1="12" y1="9" x2="12" y2="13"></line>
                <line x1="12" y1="17" x2="12.01" y2="17"></line>
              </svg>
              WITS not connected. Switch to manual mode.
            </div>
          )}
          {/* Tool Face Control */}
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label className="text-xs text-gray-400">Tool Face (°)</Label>
              <span className="text-xs font-medium text-purple-400">
                {toolFace.toFixed(1)}°
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Slider
                value={[toolFace]}
                min={0}
                max={360}
                step={1}
                onValueChange={(values) => setToolFace(values[0])}
                className="flex-1"
                disabled={isAutoMode}
              />
              <div className="w-16">
                <Input
                  type="number"
                  value={toolFace}
                  onChange={(e) => setToolFace(Number(e.target.value))}
                  className="h-8 bg-gray-800 border-gray-700 text-gray-200"
                  disabled={isAutoMode}
                />
              </div>
            </div>
          </div>

          {/* Motor Yield Control */}
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label className="text-xs text-gray-400">
                Motor Yield (°/100ft)
              </Label>
              <span className="text-xs font-medium text-cyan-400">
                {motorYield.toFixed(2)}°/100ft
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Slider
                value={[motorYield]}
                min={0.5}
                max={5}
                step={0.1}
                onValueChange={(values) => setMotorYield(values[0])}
                className="flex-1"
                disabled={isAutoMode}
              />
              <div className="w-16">
                <Input
                  type="number"
                  value={motorYield}
                  onChange={(e) => setMotorYield(Number(e.target.value))}
                  className="h-8 bg-gray-800 border-gray-700 text-gray-200"
                  disabled={isAutoMode}
                />
              </div>
            </div>
          </div>

          {/* Slide Distance Control */}
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label className="text-xs text-gray-400">
                Slide Distance (ft)
              </Label>
              <span className="text-xs font-medium text-blue-400">
                {slideDistance.toFixed(1)} ft
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Slider
                value={[slideDistance]}
                min={5}
                max={100}
                step={1}
                onValueChange={(values) => setSlideDistance(values[0])}
                className="flex-1"
                disabled={isAutoMode}
              />
              <div className="w-16">
                <Input
                  type="number"
                  value={slideDistance}
                  onChange={(e) => setSlideDistance(Number(e.target.value))}
                  className="h-8 bg-gray-800 border-gray-700 text-gray-200"
                  disabled={isAutoMode}
                />
              </div>
            </div>
          </div>

          {/* Projected Values - Enhanced UI */}
          <div className="mt-4 p-3 bg-gradient-to-br from-gray-800/70 to-gray-800/40 rounded-md border border-gray-700 shadow-inner">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full bg-purple-500"></div>
                  <p className="text-xs font-medium text-gray-400">
                    Projected Inc
                  </p>
                </div>
                <p className="text-lg font-semibold text-purple-400 tracking-tight">
                  {projectedInc.toFixed(2)}°
                </p>
                <div className="flex items-center gap-1">
                  <div
                    className={`h-1.5 w-1.5 rounded-full ${projectedInc - currentInclination >= 0 ? "bg-green-500" : "bg-red-500"}`}
                  ></div>
                  <p className="text-xs text-gray-500">
                    Δ {(projectedInc - currentInclination).toFixed(2)}°
                  </p>
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full bg-orange-500"></div>
                  <p className="text-xs font-medium text-gray-400">
                    Projected Az
                  </p>
                </div>
                <p className="text-lg font-semibold text-orange-400 tracking-tight">
                  {projectedAz.toFixed(2)}°
                </p>
                <div className="flex items-center gap-1">
                  <div
                    className={`h-1.5 w-1.5 rounded-full ${projectedAz - currentAzimuth >= 0 ? "bg-green-500" : "bg-red-500"}`}
                  ></div>
                  <p className="text-xs text-gray-500">
                    Δ {(projectedAz - currentAzimuth).toFixed(2)}°
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Visual Indicator */}
          <div className="flex justify-center mt-4">
            <div className="relative h-24 w-24 rounded-full bg-gray-800/80 border border-gray-700 flex items-center justify-center overflow-hidden shadow-inner">
              {/* Compass markings - more detailed */}
              <div className="absolute inset-0">
                {/* Main cardinal directions */}
                <div className="absolute top-0 left-1/2 h-1.5 w-0.5 bg-gray-500 -translate-x-1/2"></div>
                <div className="absolute right-0 top-1/2 h-0.5 w-1.5 bg-gray-500 -translate-y-1/2"></div>
                <div className="absolute bottom-0 left-1/2 h-1.5 w-0.5 bg-gray-500 -translate-x-1/2"></div>
                <div className="absolute left-0 top-1/2 h-0.5 w-1.5 bg-gray-500 -translate-y-1/2"></div>

                {/* Secondary markings */}
                <div className="absolute top-[15%] right-[15%] h-1 w-0.5 bg-gray-600 rotate-45"></div>
                <div className="absolute bottom-[15%] right-[15%] h-1 w-0.5 bg-gray-600 rotate-[135deg]"></div>
                <div className="absolute bottom-[15%] left-[15%] h-1 w-0.5 bg-gray-600 rotate-45"></div>
                <div className="absolute top-[15%] left-[15%] h-1 w-0.5 bg-gray-600 rotate-[135deg]"></div>
              </div>

              {/* Subtle circular guides */}
              <div className="absolute inset-2 rounded-full border border-gray-700/30"></div>
              <div className="absolute inset-4 rounded-full border border-gray-700/20"></div>
              <div className="absolute inset-6 rounded-full border border-gray-700/10"></div>

              {/* Glow effect */}
              <div className="absolute inset-0 bg-purple-500/5 rounded-full"></div>

              {/* Center point */}
              <div className="absolute inset-[46%] rounded-full bg-gray-600"></div>

              {/* Tool face indicator - static line with rotating dot */}
              <div className="absolute top-1/2 left-1/2 w-full h-0.5 -translate-x-1/2 -translate-y-1/2">
                {/* Static line from center to edge */}
                <div className="absolute top-0 left-0 w-1/2 h-0.5 bg-gray-600"></div>

                {/* Rotating dot at the edge */}
                <div
                  className="absolute top-1/2 left-1/2 h-0 w-0"
                  style={{
                    transform: `rotate(${toolFace}deg)`,
                    transformOrigin: "center",
                  }}
                >
                  <div
                    className="absolute h-3 w-3 rounded-full bg-purple-400 shadow-[0_0_8px_rgba(168,85,247,0.8)]"
                    style={{ right: "-1.5px", top: "-6px" }}
                  ></div>
                </div>
              </div>

              <div className="h-5 w-5 rounded-full bg-gray-800/80 border border-gray-700/50 flex items-center justify-center z-10">
                <RotateCw className="h-3 w-3 text-gray-500 opacity-50" />
              </div>

              {/* Cardinal directions with better positioning */}
              <div className="absolute top-1 left-1/2 -translate-x-1/2 text-[9px] font-medium text-gray-400">
                0°
              </div>
              <div className="absolute right-1 top-1/2 -translate-y-1/2 text-[9px] font-medium text-gray-400">
                90°
              </div>
              <div className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[9px] font-medium text-gray-400">
                180°
              </div>
              <div className="absolute left-1 top-1/2 -translate-y-1/2 text-[9px] font-medium text-gray-400">
                270°
              </div>

              {/* Mode indicator */}
              <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] font-medium text-gray-500">
                {isGravityToolface ? "Gravity" : "Magnetic"} Toolface
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default NudgeProjectionControls;
