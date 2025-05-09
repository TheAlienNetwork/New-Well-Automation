import React from "react";
import { Database, Building2, Ruler } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface WellInfoProps {
  wellName: string;
  rigName?: string;
  sensorOffset?: number;
  bitDepth?: number;
  measuredDepth?: number;
  compact?: boolean;
}

const WellInfo = ({
  wellName,
  rigName,
  sensorOffset = 0,
  bitDepth,
  measuredDepth,
  compact = false,
}: WellInfoProps) => {
  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-1 cursor-help">
              <Database className="h-3 w-3 text-blue-400" />
              <span className="text-gray-300 text-xs">{wellName}</span>
            </div>
          </TooltipTrigger>
          <TooltipContent
            side="bottom"
            className="bg-gray-800 border-gray-700 text-gray-200"
          >
            <div className="space-y-1 p-1">
              <div className="flex items-center gap-2">
                <Building2 className="h-3 w-3 text-purple-400" />
                <span className="text-xs">{rigName || "No rig specified"}</span>
              </div>
              {(sensorOffset !== undefined ||
                bitDepth !== undefined ||
                measuredDepth !== undefined) && (
                <div className="flex items-center gap-2">
                  <Ruler className="h-3 w-3 text-yellow-400" />
                  <span className="text-xs">
                    {sensorOffset !== undefined &&
                      `Offset: ${sensorOffset.toFixed(2)}ft`}
                    {bitDepth !== undefined &&
                      ` | Bit: ${bitDepth.toFixed(2)}ft`}
                    {measuredDepth !== undefined &&
                      ` | MD: ${measuredDepth.toFixed(2)}ft`}
                  </span>
                </div>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1">
        <Database className="h-3 w-3 text-blue-400" />
        <span className="text-gray-300">{wellName}</span>
      </div>

      {rigName && (
        <div className="flex items-center gap-1">
          <Building2 className="h-3 w-3 text-purple-400" />
          <span className="text-gray-300">{rigName}</span>
        </div>
      )}

      {sensorOffset !== undefined && (
        <div className="flex items-center gap-1">
          <Ruler className="h-3 w-3 text-yellow-400" />
          <span className="text-gray-300">
            Offset: {sensorOffset.toFixed(2)}ft
          </span>
        </div>
      )}

      {bitDepth !== undefined && (
        <div className="flex items-center gap-1">
          <Ruler className="h-3 w-3 text-green-400" />
          <span className="text-gray-300">Bit: {bitDepth.toFixed(2)}ft</span>
        </div>
      )}

      {measuredDepth !== undefined && (
        <div className="flex items-center gap-1">
          <Ruler className="h-3 w-3 text-cyan-400" />
          <span className="text-gray-300">
            MD: {measuredDepth.toFixed(2)}ft
          </span>
        </div>
      )}
    </div>
  );
};

export default WellInfo;
