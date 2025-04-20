import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Compass, Ruler, ArrowUp, Target, MapPin } from "lucide-react";

interface TargetLineStatusWidgetProps {
  aboveBelow?: number;
  leftRight?: number;
  distanceToTarget?: number;
  doglegNeeded?: number;
  targetAzimuth?: number;
  targetInclination?: number;
  isRealtime?: boolean;
  wellInfo?: {
    wellName: string;
    rigName: string;
  };
}

const TargetLineStatusWidget = ({
  aboveBelow = 8000.0,
  leftRight = 6694.7,
  distanceToTarget = 10431.6,
  doglegNeeded = 3.2,
  targetAzimuth = 275,
  targetInclination = 35,
  isRealtime = false,
  wellInfo,
}: TargetLineStatusWidgetProps) => {
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

  return (
    <Card className="w-full h-full bg-gray-900 border-gray-800 shadow-lg overflow-hidden">
      <CardHeader className="p-3 pb-0 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
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
      </CardHeader>

      <CardContent className="p-3 pt-2">
        <div className="grid grid-cols-2 gap-3">
          <div className="p-2 bg-gray-800/50 rounded-md flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-blue-900/30 flex items-center justify-center">
              <ArrowUp className="h-4 w-4 text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Above/Below</p>
              <p className="text-sm font-medium text-blue-400">
                {aboveBelowText} {aboveBelowValue.toFixed(1)} ft
              </p>
            </div>
          </div>

          <div className="p-2 bg-gray-800/50 rounded-md flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-purple-900/30 flex items-center justify-center">
              <ArrowUp
                className="h-4 w-4 text-purple-400"
                style={{ transform: "rotate(90deg)" }}
              />
            </div>
            <div>
              <p className="text-xs text-gray-500">Left/Right</p>
              <p className="text-sm font-medium text-purple-400">
                {leftRight.toFixed(1)} ft
              </p>
            </div>
          </div>

          <div className="p-2 bg-gray-800/50 rounded-md flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-cyan-900/30 flex items-center justify-center">
              <Target className="h-4 w-4 text-cyan-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Distance to Target</p>
              <p className="text-sm font-medium text-cyan-400">
                {distanceToTarget.toFixed(1)} ft
              </p>
            </div>
          </div>

          <div className="p-2 bg-gray-800/50 rounded-md flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-yellow-900/30 flex items-center justify-center">
              <Ruler className="h-4 w-4 text-yellow-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Dogleg Needed</p>
              <p className="text-sm font-medium text-yellow-400">
                {doglegNeeded.toFixed(2)}°/100ft
              </p>
            </div>
          </div>

          <div className="p-2 bg-gray-800/50 rounded-md flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-orange-900/30 flex items-center justify-center">
              <Compass className="h-4 w-4 text-orange-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Target Azimuth</p>
              <p className="text-sm font-medium text-orange-400">
                {targetAzimuth.toFixed(1)}°
              </p>
            </div>
          </div>

          <div className="p-2 bg-gray-800/50 rounded-md flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-green-900/30 flex items-center justify-center">
              <MapPin className="h-4 w-4 text-green-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Target Status</p>
              <p className={`text-sm font-medium ${targetStatus.color}`}>
                {targetStatus.status}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TargetLineStatusWidget;
