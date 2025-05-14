import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useCurveData } from "@/hooks/useCurveData";
import {
  Target,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";

interface TargetLineStatusWidgetProps {
  aboveBelow: number;
  leftRight: number;
  distanceToTarget: number;
  doglegNeeded?: number;
  targetInclination?: number;
  targetAzimuth?: number;
  isRealtime?: boolean;
  wellInfo?: {
    wellName?: string;
    rigName?: string;
  };
}

const TargetLineStatusWidget: React.FC<TargetLineStatusWidgetProps> = ({
  aboveBelow,
  leftRight,
  distanceToTarget,
  doglegNeeded,
  targetInclination,
  targetAzimuth,
  isRealtime = false,
  wellInfo,
}) => {
  // Use the shared curve data context
  const { curveData: contextCurveData } = useCurveData();

  // Calculate status based on distance to target
  const getTargetStatus = () => {
    if (distanceToTarget < 5)
      return { status: "On Target", color: "text-green-400" };
    if (distanceToTarget < 15)
      return { status: "Near Target", color: "text-yellow-400" };
    return { status: "Off Target", color: "text-red-400" };
  };

  const targetStatus = getTargetStatus();
  const aboveBelowText = aboveBelow > 0 ? "Below" : "Above";
  const aboveBelowValue = Math.abs(aboveBelow);

  // Use props if provided, otherwise use context values
  const displayDoglegNeeded = doglegNeeded ?? contextCurveData.doglegNeeded;
  const displayTargetInc = targetInclination ?? contextCurveData.targetInc;
  const displayTargetAz = targetAzimuth ?? contextCurveData.targetAz;

  // Determine direction indicators
  const getDirectionIcon = () => {
    if (aboveBelow > 10) return <ArrowDown className="h-5 w-5 text-red-400" />;
    if (aboveBelow < -10) return <ArrowUp className="h-5 w-5 text-green-400" />;
    if (leftRight > 10)
      return <ArrowRight className="h-5 w-5 text-yellow-400" />;
    if (leftRight < -10)
      return <ArrowLeft className="h-5 w-5 text-yellow-400" />;
    return <Target className="h-5 w-5 text-green-400" />;
  };

  return (
    <Card className="w-full h-full bg-gray-900 border-gray-800 shadow-lg overflow-hidden">
      <CardHeader className="p-3 pb-0 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Target className="h-4 w-4 text-blue-400" />
          <CardTitle className="text-sm font-medium text-gray-300">
            Target Line Status
          </CardTitle>
          {isRealtime && (
            <Badge
              variant="outline"
              className="bg-green-900/30 text-green-400 border-green-800 animate-pulse"
            >
              LIVE
            </Badge>
          )}
        </div>
        <Badge
          variant="outline"
          className={`${targetStatus.color} border-${targetStatus.color.replace(
            "text",
            "border",
          )}`}
        >
          {targetStatus.status}
        </Badge>
      </CardHeader>

      <CardContent className="p-3">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {/* Above/Below */}
          <div className="p-2 bg-gray-800/50 rounded-md flex items-center gap-2">
            <div
              className={`h-8 w-8 rounded-full ${aboveBelow > 0 ? "bg-red-900/30" : "bg-green-900/30"} flex items-center justify-center`}
            >
              {aboveBelow > 0 ? (
                <ArrowDown className="h-4 w-4 text-red-400" />
              ) : (
                <ArrowUp className="h-4 w-4 text-green-400" />
              )}
            </div>
            <div>
              <p className="text-xs text-gray-500">Above/Below</p>
              <p
                className={`text-sm font-medium ${aboveBelow > 0 ? "text-red-400" : "text-green-400"}`}
              >
                {aboveBelowText} {aboveBelowValue.toFixed(1)} ft
              </p>
            </div>
          </div>

          {/* Left/Right */}
          <div className="p-2 bg-gray-800/50 rounded-md flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-yellow-900/30 flex items-center justify-center">
              {leftRight > 0 ? (
                <ArrowRight className="h-4 w-4 text-yellow-400" />
              ) : (
                <ArrowLeft className="h-4 w-4 text-yellow-400" />
              )}
            </div>
            <div>
              <p className="text-xs text-gray-500">Left/Right</p>
              <p className="text-sm font-medium text-yellow-400">
                {leftRight > 0 ? "Right" : "Left"}{" "}
                {Math.abs(leftRight).toFixed(1)} ft
              </p>
            </div>
          </div>

          {/* Distance to Target */}
          <div className="p-2 bg-gray-800/50 rounded-md flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-blue-900/30 flex items-center justify-center">
              <Target className="h-4 w-4 text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Distance</p>
              <p className="text-sm font-medium text-blue-400">
                {distanceToTarget.toFixed(1)} ft
              </p>
            </div>
          </div>

          {/* Dogleg Needed */}
          <div className="p-2 bg-gray-800/50 rounded-md flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-purple-900/30 flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-purple-400"
              >
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
              </svg>
            </div>
            <div>
              <p className="text-xs text-gray-500">Dogleg Needed</p>
              <p className="text-sm font-medium text-purple-400">
                {displayDoglegNeeded.toFixed(2)}°/100ft
              </p>
            </div>
          </div>
        </div>

        {wellInfo && (
          <div className="mt-3 p-2 bg-gray-800/20 rounded-md border border-gray-800">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">Well:</span>
                <span className="text-xs font-medium text-gray-300">
                  {wellInfo.wellName || "Unknown"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">Target:</span>
                <span className="text-xs font-medium text-gray-300">
                  {displayTargetInc.toFixed(1)}° @ {displayTargetAz.toFixed(1)}°
                </span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TargetLineStatusWidget;
