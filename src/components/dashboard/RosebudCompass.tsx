import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Compass, Navigation, RotateCw, Settings } from "lucide-react";
import { useWits } from "@/context/WitsContext";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

interface RosebudCompassProps {
  toolFace?: number;
  inclination?: number;
  azimuth?: number;
  magneticField?: number;
  gravity?: number;
  depth?: number;
  isActive?: boolean;
}

const RosebudCompass = ({
  toolFace: propToolFace,
  inclination: propInclination,
  azimuth: propAzimuth,
  magneticField: propMagneticField,
  gravity: propGravity,
  depth: propDepth,
  isActive: propIsActive,
}: RosebudCompassProps) => {
  const { isReceiving, witsData } = useWits();

  // Use WITS data if available, otherwise use props
  const toolFace =
    propToolFace !== undefined ? propToolFace : witsData.toolFace || 0;
  const inclination =
    propInclination !== undefined ? propInclination : witsData.inclination || 0;
  const azimuth =
    propAzimuth !== undefined ? propAzimuth : witsData.azimuth || 0;
  const magneticField =
    propMagneticField !== undefined
      ? propMagneticField
      : witsData.magneticField || 0;
  const gravity =
    propGravity !== undefined ? propGravity : witsData.gravity || 0;
  const depth = propDepth !== undefined ? propDepth : witsData.bitDepth || 0;
  const isActive = propIsActive !== undefined ? propIsActive : isReceiving;
  const [rotation, setRotation] = useState(0);

  // Simulate compass movement
  useEffect(() => {
    if (isActive) {
      const interval = setInterval(() => {
        setRotation((prev) => prev + (Math.random() * 0.4 - 0.2));
      }, 500);
      return () => clearInterval(interval);
    }
  }, [isActive]);

  // Calculate colors based on values
  const getInclinationColor = () => {
    if (inclination < 10) return "#00ff88";
    if (inclination < 45) return "#88ff00";
    if (inclination < 70) return "#ffaa00";
    return "#ff3300";
  };

  const getAzimuthPosition = (angle: number) => {
    const radians = (angle - 90) * (Math.PI / 180);
    const radius = 100;
    return {
      x: radius * Math.cos(radians) + 120,
      y: radius * Math.sin(radians) + 120,
    };
  };

  const inclinationColor = getInclinationColor();
  const azimuthPos = getAzimuthPosition(azimuth);

  // Cardinal directions
  const cardinalDirections = [
    { label: "N", angle: 0 },
    { label: "NE", angle: 45 },
    { label: "E", angle: 90 },
    { label: "SE", angle: 135 },
    { label: "S", angle: 180 },
    { label: "SW", angle: 225 },
    { label: "W", angle: 270 },
    { label: "NW", angle: 315 },
  ];

  return (
    <Card className="w-full h-full bg-gray-900 border-gray-800 shadow-lg overflow-hidden">
      <CardContent className="p-4 flex flex-col h-full">
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-2">
            <Compass className="h-5 w-5 text-blue-400" />
            <h3 className="text-sm font-medium text-gray-300">
              Directional Tracking
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className={`${isActive ? "bg-green-900/30 text-green-400" : "bg-red-900/30 text-red-400"} border-0`}
            >
              {isActive ? "ACTIVE" : "INACTIVE"}
            </Badge>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="p-1 rounded-full hover:bg-gray-800">
                  <Settings className="h-4 w-4 text-gray-400" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="bg-gray-900 border-gray-800"
              >
                <DropdownMenuItem className="text-gray-300 hover:bg-gray-800 focus:bg-gray-800 cursor-pointer">
                  Calibrate Compass
                </DropdownMenuItem>
                <DropdownMenuItem className="text-gray-300 hover:bg-gray-800 focus:bg-gray-800 cursor-pointer">
                  Change Display Mode
                </DropdownMenuItem>
                <DropdownMenuItem className="text-gray-300 hover:bg-gray-800 focus:bg-gray-800 cursor-pointer">
                  Set Reference Point
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Compass visualization */}
        <div className="relative flex-1 flex items-center justify-center">
          <div className="relative w-[240px] h-[240px]">
            {/* Outer circle */}
            <div className="absolute inset-0 rounded-full border-2 border-gray-700 flex items-center justify-center">
              {/* Cardinal direction markers */}
              {cardinalDirections.map(({ label, angle }) => {
                const radians = (angle - 90) * (Math.PI / 180);
                const radius = 110;
                const x = radius * Math.cos(radians) + 120;
                const y = radius * Math.sin(radians) + 120;

                return (
                  <div
                    key={label}
                    className="absolute text-xs font-bold"
                    style={{
                      left: `${x}px`,
                      top: `${y}px`,
                      transform: "translate(-50%, -50%)",
                      color:
                        label === "N"
                          ? "#ff4444"
                          : ["S", "E", "W"].includes(label)
                            ? "#aaaaff"
                            : "#777777",
                    }}
                  >
                    {label}
                  </div>
                );
              })}

              {/* Degree markers */}
              {Array.from({ length: 36 }).map((_, i) => {
                const angle = i * 10;
                const radians = (angle - 90) * (Math.PI / 180);
                const outerRadius = 115;
                const innerRadius = i % 3 === 0 ? 105 : 110;
                const x1 = outerRadius * Math.cos(radians) + 120;
                const y1 = outerRadius * Math.sin(radians) + 120;
                const x2 = innerRadius * Math.cos(radians) + 120;
                const y2 = innerRadius * Math.sin(radians) + 120;

                return (
                  <line
                    key={i}
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke={i % 9 === 0 ? "#aaaaff" : "#555555"}
                    strokeWidth={i % 9 === 0 ? 2 : 1}
                    className="absolute"
                    style={{ transform: `rotate(${rotation}deg)` }}
                  />
                );
              })}
            </div>

            {/* Middle circle - inclination indicator */}
            <div
              className="absolute rounded-full border border-gray-600"
              style={{
                width: `${180 - inclination}px`,
                height: `${180 - inclination}px`,
                left: "50%",
                top: "50%",
                transform: "translate(-50%, -50%)",
                background: `radial-gradient(circle, ${inclinationColor}20 0%, ${inclinationColor}05 70%, transparent 100%)`,
                boxShadow: `0 0 15px ${inclinationColor}30`,
              }}
            />

            {/* Azimuth indicator */}
            <div className="absolute w-full h-full">
              <svg width="240" height="240" viewBox="0 0 240 240">
                {/* Azimuth line */}
                <line
                  x1="120"
                  y1="120"
                  x2={azimuthPos.x}
                  y2={azimuthPos.y}
                  stroke="#00aaff"
                  strokeWidth="2"
                  strokeLinecap="round"
                  style={{
                    filter: "drop-shadow(0 0 3px #00aaff80)",
                    transform: `rotate(${rotation}deg)`,
                    transformOrigin: "center",
                  }}
                />

                {/* Azimuth arrow */}
                <circle
                  cx={azimuthPos.x}
                  cy={azimuthPos.y}
                  r="4"
                  fill="#00aaff"
                  style={{
                    filter: "drop-shadow(0 0 5px #00aaff)",
                    transform: `rotate(${rotation}deg)`,
                    transformOrigin: "center",
                  }}
                />
              </svg>
            </div>

            {/* Tool face indicator */}
            <div
              className="absolute w-16 h-16 rounded-full bg-gray-900 border border-gray-700 flex items-center justify-center"
              style={{
                left: "50%",
                top: "50%",
                transform: "translate(-50%, -50%)",
              }}
            >
              <div className="absolute text-yellow-400 font-bold text-sm">
                {toolFace.toFixed(1)}°
              </div>
            </div>
          </div>
        </div>

        {/* Data readouts */}
        <div className="grid grid-cols-3 gap-2 mt-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex flex-col items-center p-1 rounded bg-gray-800/50">
                  <span className="text-xs text-gray-400">Inclination</span>
                  <span
                    className="text-lg font-bold"
                    style={{
                      color: inclinationColor,
                      textShadow: `0 0 10px ${inclinationColor}40`,
                    }}
                  >
                    {inclination.toFixed(1)}°
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent
                side="bottom"
                className="bg-gray-900 border-gray-800"
              >
                <p>Current inclination angle</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex flex-col items-center p-1 rounded bg-gray-800/50">
                  <span className="text-xs text-gray-400">Azimuth</span>
                  <span
                    className="text-lg font-bold text-blue-400"
                    style={{ textShadow: "0 0 10px rgba(59, 130, 246, 0.4)" }}
                  >
                    {azimuth.toFixed(1)}°
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent
                side="bottom"
                className="bg-gray-900 border-gray-800"
              >
                <p>Current azimuth angle</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex flex-col items-center p-1 rounded bg-gray-800/50">
                  <span className="text-xs text-gray-400">Tool Face</span>
                  <span
                    className="text-lg font-bold text-yellow-400"
                    style={{ textShadow: "0 0 10px rgba(250, 204, 21, 0.4)" }}
                  >
                    {toolFace.toFixed(1)}°
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent
                side="bottom"
                className="bg-gray-900 border-gray-800"
              >
                <p>Current tool face orientation</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Additional data */}
        <div className="grid grid-cols-3 gap-2 mt-2 text-xs">
          <div className="flex justify-between items-center p-1 rounded bg-gray-800/30">
            <span className="text-gray-500">Mag:</span>
            <span className="text-gray-300">{magneticField.toFixed(1)} μT</span>
          </div>
          <div className="flex justify-between items-center p-1 rounded bg-gray-800/30">
            <span className="text-gray-500">Grav:</span>
            <span className="text-gray-300">{gravity.toFixed(1)} G</span>
          </div>
          <div className="flex justify-between items-center p-1 rounded bg-gray-800/30">
            <span className="text-gray-500">Depth:</span>
            <span className="text-gray-300">{depth.toFixed(1)} ft</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default RosebudCompass;
