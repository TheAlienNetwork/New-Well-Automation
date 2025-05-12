import React, { useState, useEffect } from "react";
import { Drill, PlugZap } from "lucide-react";
import { useWits } from "@/context/WitsContext";
import { useSurveys } from "@/context/SurveyContext";
import ConnectionStatus from "./status/ConnectionStatus";
import WellInfo from "./status/WellInfo";
import SurveyData from "./status/SurveyData";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";

interface StatusBarProps {
  wellName?: string;
  sensorOffset?: number;
}

const StatusBar = ({
  wellName: propWellName,
  sensorOffset: propSensorOffset,
}: StatusBarProps) => {
  const {
    isConnected,
    isReceiving,
    witsData,
    lastUpdateTime,
    connectionConfig,
    disconnect,
  } = useWits();
  const { surveys, currentWellId } = useSurveys();

  const [currentTime, setCurrentTime] = useState(new Date());
  const [pulseIndicator, setPulseIndicator] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  // Get the latest survey data (sorted by timestamp)
  const latestSurvey =
    surveys.length > 0
      ? [...surveys].sort((a, b) => {
          // Ensure we have valid timestamps
          const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
          const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
          return timeB - timeA;
        })[0]
      : null;

  // State for well data from database
  const [wellData, setWellData] = useState({
    wellName:
      localStorage.getItem("wellName") || propWellName || "No Well Selected",
    sensorOffset:
      Number(localStorage.getItem("sensorOffset")) || propSensorOffset || 0,
  });

  // Always prioritize the current well data from localStorage for consistency
  const wellName = wellData.wellName;

  // Always use the sensor offset from localStorage for consistency
  const sensorOffset = wellData.sensorOffset;

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Pulse indicator based on WITS data reception
  useEffect(() => {
    if (isConnected && isReceiving) {
      const pulseTimer = setInterval(() => {
        setPulseIndicator((prev) => !prev);
      }, 2000);

      return () => clearInterval(pulseTimer);
    } else {
      setPulseIndicator(false);
    }
  }, [isConnected, isReceiving]);

  // Update time when WITS data updates or when surveys change
  useEffect(() => {
    if (lastUpdateTime) {
      setCurrentTime(lastUpdateTime);
    }
  }, [lastUpdateTime]);

  // Fetch well data when currentWellId changes
  useEffect(() => {
    const fetchWellData = async () => {
      try {
        const wellId = currentWellId || localStorage.getItem("currentWellId");

        if (wellId) {
          const { data, error } = await supabase
            .from("wells")
            .select("name, sensor_offset")
            .eq("id", wellId)
            .single();

          if (error) {
            console.error("Error fetching well data:", error);
            return;
          }

          if (data) {
            // Update local state with fetched data
            setWellData({
              wellName:
                data.name ||
                localStorage.getItem("wellName") ||
                propWellName ||
                "No Well Selected",
              sensorOffset:
                data.sensor_offset !== null
                  ? data.sensor_offset
                  : Number(localStorage.getItem("sensorOffset")) ||
                    propSensorOffset ||
                    0,
            });

            // Also update localStorage for consistency
            if (data.name) localStorage.setItem("wellName", data.name);
            if (data.sensor_offset !== null)
              localStorage.setItem(
                "sensorOffset",
                data.sensor_offset.toString(),
              );
          }
        }
      } catch (error) {
        console.error("Error in fetchWellData:", error);
      }
    };

    fetchWellData();
  }, [currentWellId, propWellName, propSensorOffset]);

  // Update display when surveys change or well info is updated
  useEffect(() => {
    if (surveys.length > 0) {
      // Force a re-render when surveys change
      setCurrentTime(new Date());
    }

    // Listen for well info updates
    const handleWellInfoUpdated = (event: CustomEvent) => {
      console.log("StatusBar received wellInfoUpdated event:", event.detail);
      // Force a re-render
      setCurrentTime(new Date());

      // Update well data if provided in the event
      if (event.detail) {
        const newData = {};
        if (event.detail.wellName) newData["wellName"] = event.detail.wellName;
        if (event.detail.sensorOffset !== undefined)
          newData["sensorOffset"] = event.detail.sensorOffset;

        if (Object.keys(newData).length > 0) {
          setWellData((prev) => ({ ...prev, ...newData }));
        }
      }
    };

    // Listen for well changed events
    const handleWellChanged = (event: CustomEvent) => {
      console.log("StatusBar received wellChanged event:", event.detail);
      // Force a re-render
      setCurrentTime(new Date());
    };

    window.addEventListener(
      "wellInfoUpdated",
      handleWellInfoUpdated as EventListener,
    );

    window.addEventListener("wellChanged", handleWellChanged as EventListener);

    return () => {
      window.removeEventListener(
        "wellInfoUpdated",
        handleWellInfoUpdated as EventListener,
      );
      window.removeEventListener(
        "wellChanged",
        handleWellChanged as EventListener,
      );
    };
  }, [surveys, currentWellId]);

  // Get values with priority to survey data, falling back to WITS data
  const measuredDepth = latestSurvey?.measuredDepth ?? witsData.measuredDepth;
  const inclination = latestSurvey?.inclination ?? witsData.inclination;
  const azimuth = latestSurvey?.azimuth ?? witsData.azimuth;

  // Determine data source for visual indication
  // Check if the values are actually defined and not just present in the object
  const mdSource =
    latestSurvey &&
    latestSurvey.measuredDepth !== undefined &&
    latestSurvey.measuredDepth !== null
      ? "survey"
      : "wits";
  const incSource =
    latestSurvey &&
    latestSurvey.inclination !== undefined &&
    latestSurvey.inclination !== null
      ? "survey"
      : "wits";
  const azSource =
    latestSurvey &&
    latestSurvey.azimuth !== undefined &&
    latestSurvey.azimuth !== null
      ? "survey"
      : "wits";

  const handleDisconnect = () => {
    setDisconnecting(true);
    disconnect();
    setTimeout(() => setDisconnecting(false), 1000);
  };

  return (
    <div className="w-full bg-gray-950 border-b border-gray-800 px-4 py-1 flex items-center justify-between text-xs">
      <div className="flex items-center space-x-4">
        <ConnectionStatus
          isConnected={isConnected}
          isReceiving={isReceiving}
          pulseIndicator={pulseIndicator}
        />

        <WellInfo wellName={wellName} />
      </div>

      <div className="flex items-center space-x-4">
        <SurveyData
          measuredDepth={measuredDepth}
          inclination={inclination}
          azimuth={azimuth}
          mdSource={mdSource}
          incSource={incSource}
          azSource={azSource}
        />

        <div className="flex items-center gap-1">
          <Drill className="h-3 w-3 text-yellow-400" />
          <span className="text-gray-500">Bit:</span>
          <span className="text-yellow-400 font-medium">
            {(latestSurvey &&
            latestSurvey.bitDepth !== undefined &&
            latestSurvey.bitDepth !== null
              ? latestSurvey.bitDepth
              : witsData.bitDepth
            )?.toFixed(2) || "0.00"}
            ft
          </span>
          {latestSurvey &&
            latestSurvey.bitDepth !== undefined &&
            latestSurvey.bitDepth !== null && (
              <span className="text-xs text-yellow-600 ml-1">(S)</span>
            )}
        </div>

        <div className="flex items-center gap-1">
          <span className="text-gray-500">Gamma:</span>
          <span className="text-purple-400 font-medium">
            {witsData.gamma?.toFixed(2) || "0.00"}API
          </span>
        </div>

        <div className="flex items-center gap-1">
          <span className="text-gray-500">Block:</span>
          <span className="text-orange-400 font-medium">
            {witsData.blockHeight?.toFixed(2) || "0.00"}ft
          </span>
        </div>

        <div className="text-gray-500">{currentTime.toLocaleTimeString()}</div>

        {isConnected && (
          <Button
            variant="destructive"
            size="sm"
            className="h-6 px-2 bg-red-600 hover:bg-red-700 text-white"
            onClick={handleDisconnect}
            disabled={disconnecting}
          >
            <PlugZap className="h-3 w-3 mr-1" />
            {disconnecting ? "Disconnecting..." : "Disconnect"}
          </Button>
        )}
      </div>
    </div>
  );
};

export default StatusBar;
