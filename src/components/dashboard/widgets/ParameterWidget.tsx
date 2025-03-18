import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
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
import {
  Settings,
  Maximize2,
  Minimize2,
  MoreVertical,
  TrendingUp,
  TrendingDown,
} from "lucide-react";

interface ParameterWidgetProps {
  title?: string;
  value?: number;
  unit?: string;
  min?: number;
  max?: number;
  trend?: "up" | "down" | "stable";
  color?: string;
  history?: number[];
  isExpanded?: boolean;
  onExpand?: () => void;
  onMinimize?: () => void;
}

const ParameterWidget = ({
  title = "Inclination",
  value = 45.2,
  unit = "°",
  min = 0,
  max = 90,
  trend = "up",
  color = "#00ffaa",
  history = [42.1, 43.5, 44.2, 45.0, 45.2],
  isExpanded = false,
  onExpand = () => {},
  onMinimize = () => {},
}: ParameterWidgetProps) => {
  const [isHovered, setIsHovered] = useState(false);

  // Generate sparkline data points
  const sparklinePoints = history
    .map((val, index) => {
      const x = (index / (history.length - 1)) * 100;
      const y = 100 - ((val - min) / (max - min)) * 100;
      return `${x},${y}`;
    })
    .join(" ");

  // Calculate percentage for the slider
  const percentage = ((value - min) / (max - min)) * 100;

  // Determine trend icon and color
  const getTrendIcon = () => {
    switch (trend) {
      case "up":
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case "down":
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  return (
    <Card
      className="w-full h-full bg-gray-900 border-gray-800 shadow-lg overflow-hidden"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <CardHeader className="p-3 pb-0 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <CardTitle className="text-sm font-medium text-gray-300">
            {title}
          </CardTitle>
          <Badge
            variant="outline"
            className="text-xs bg-gray-800 text-gray-400 border-gray-700"
          >
            {unit}
          </Badge>
        </div>
        <div className="flex items-center gap-1">
          {getTrendIcon()}

          {isHovered && (
            <>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    {isExpanded ? (
                      <button
                        onClick={onMinimize}
                        className="p-1 rounded-full hover:bg-gray-800"
                      >
                        <Minimize2 className="h-4 w-4 text-gray-400" />
                      </button>
                    ) : (
                      <button
                        onClick={onExpand}
                        className="p-1 rounded-full hover:bg-gray-800"
                      >
                        <Maximize2 className="h-4 w-4 text-gray-400" />
                      </button>
                    )}
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{isExpanded ? "Minimize" : "Maximize"}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="p-1 rounded-full hover:bg-gray-800">
                    <MoreVertical className="h-4 w-4 text-gray-400" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="bg-gray-900 border-gray-800"
                >
                  <DropdownMenuItem className="text-gray-300 hover:bg-gray-800 focus:bg-gray-800 cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    Configure
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-gray-300 hover:bg-gray-800 focus:bg-gray-800 cursor-pointer">
                    View History
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-gray-300 hover:bg-gray-800 focus:bg-gray-800 cursor-pointer">
                    Set Alerts
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-3 pt-2">
        <div className="flex flex-col gap-2">
          {/* Value display with glow effect */}
          <div className="flex items-baseline">
            <span
              className="text-3xl font-bold"
              style={{
                color,
                textShadow: `0 0 10px ${color}40, 0 0 15px ${color}20`,
              }}
            >
              {value.toFixed(1)}
            </span>
          </div>

          {/* Slider visualization */}
          <div className="mt-2">
            <Slider
              value={[percentage]}
              max={100}
              step={1}
              disabled
              className="cursor-default"
            />
          </div>

          {/* Sparkline visualization */}
          <div className="h-12 mt-1">
            <svg
              width="100%"
              height="100%"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
            >
              <polyline
                points={sparklinePoints}
                fill="none"
                stroke={color}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ filter: `drop-shadow(0 0 3px ${color})` }}
              />
              {/* Add dots at each data point */}
              {sparklinePoints.split(" ").map((point, index) => {
                const [x, y] = point.split(",").map(Number);
                return (
                  <circle
                    key={index}
                    cx={x}
                    cy={y}
                    r="1.5"
                    fill={color}
                    style={{ filter: `drop-shadow(0 0 2px ${color})` }}
                  />
                );
              })}
            </svg>
          </div>

          {/* Min/Max labels */}
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>
              {min}
              {unit}
            </span>
            <span>
              {max}
              {unit}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ParameterWidget;
