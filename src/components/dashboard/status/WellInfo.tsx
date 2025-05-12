import React, { useEffect, useState } from "react";
import { Database, Building2, Ruler } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { supabase } from "@/lib/supabase";
import { useWits } from "@/context/WitsContext";

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
  sensorOffset: propSensorOffset,
  bitDepth,
  measuredDepth,
  compact = false,
}: WellInfoProps) => {
  const { connectionConfig } = useWits();
  const [dbSensorOffset, setDbSensorOffset] = useState<number | undefined>(
    undefined,
  );

  // Fetch the sensor offset from the database when wellName changes
  useEffect(() => {
    const fetchWellData = async () => {
      try {
        // Get the current well ID from localStorage or connectionConfig
        const wellId =
          connectionConfig.wellId || localStorage.getItem("currentWellId");

        if (wellId) {
          const { data, error } = await supabase
            .from("wells")
            .select("sensor_offset")
            .eq("id", wellId)
            .single();

          if (error) {
            console.error("Error fetching well sensor offset:", error);
            return;
          }

          if (
            data &&
            data.sensor_offset !== null &&
            data.sensor_offset !== undefined
          ) {
            setDbSensorOffset(data.sensor_offset);
            console.log(
              "Fetched sensor offset from database:",
              data.sensor_offset,
            );
          }
        }
      } catch (error) {
        console.error("Error in fetchWellData:", error);
      }
    };

    fetchWellData();
  }, [wellName, connectionConfig.wellId]);

  // Use the sensor offset from the database if available, otherwise use the prop value
  const sensorOffset =
    dbSensorOffset !== undefined
      ? dbSensorOffset
      : connectionConfig.sensorOffset !== undefined
        ? connectionConfig.sensorOffset
        : propSensorOffset;

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
