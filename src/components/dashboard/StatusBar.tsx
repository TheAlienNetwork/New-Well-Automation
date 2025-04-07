import React, { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Wifi, Database, Activity, Drill, Layers, ArrowUp } from "lucide-react";
import { useWits } from "@/context/WitsContext";

interface StatusBarProps {
  wellName?: string;
}

const StatusBar = ({ wellName = "Well Alpha-123" }: StatusBarProps) => {
  const { isConnected, isReceiving, witsData, lastUpdateTime } = useWits();

  const [currentTime, setCurrentTime] = useState(new Date());
  const [pulseIndicator, setPulseIndicator] = useState(false);

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

  // Update time when WITS data updates
  useEffect(() => {
    if (lastUpdateTime) {
      setCurrentTime(lastUpdateTime);
    }
  }, [lastUpdateTime]);

  return (
    <div className="w-full bg-gray-950 border-b border-gray-800 px-4 py-1 flex items-center justify-between text-xs">
      <div className="flex items-center space-x-4">
        <div className="flex items-center">
          <Badge
            variant="outline"
            className={`${isConnected ? "bg-green-900/30 text-green-400 border-green-800" : "bg-red-900/30 text-red-400 border-red-800"} mr-2`}
          >
            {isConnected ? "CONNECTED" : "DISCONNECTED"}
          </Badge>
          <div className="flex items-center gap-1">
            <Wifi
              className={`h-3 w-3 ${isConnected ? "text-green-400" : "text-red-400"} ${pulseIndicator ? "animate-pulse" : ""}`}
            />
            <span className="text-gray-400">WITS</span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <Database className="h-3 w-3 text-blue-400" />
          <span className="text-gray-300">{wellName}</span>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <div className="flex items-center gap-1">
          <Layers className="h-3 w-3 text-cyan-400" />
          <span className="text-gray-500">MD:</span>
          <span className="text-cyan-400 font-medium">
            {witsData.bitDepth?.toFixed(2) || "0.00"}ft
          </span>
        </div>

        <div className="flex items-center gap-1">
          <ArrowUp className="h-3 w-3 text-green-400" />
          <span className="text-gray-500">Inc:</span>
          <span className="text-green-400 font-medium">
            {witsData.inclination?.toFixed(2) || "0.00"}°
          </span>
        </div>

        <div className="flex items-center gap-1">
          <Activity className="h-3 w-3 text-blue-400" />
          <span className="text-gray-500">Az:</span>
          <span className="text-blue-400 font-medium">
            {witsData.azimuth?.toFixed(2) || "0.00"}°
          </span>
        </div>

        <div className="flex items-center gap-1">
          <Drill className="h-3 w-3 text-yellow-400" />
          <span className="text-gray-500">Bit:</span>
          <span className="text-yellow-400 font-medium">
            {witsData.bitDepth?.toFixed(2) || "0.00"}ft
          </span>
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
      </div>
    </div>
  );
};

export default StatusBar;
