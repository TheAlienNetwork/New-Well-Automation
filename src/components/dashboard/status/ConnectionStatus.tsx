import React from "react";
import { Badge } from "@/components/ui/badge";
import { Wifi } from "lucide-react";

interface ConnectionStatusProps {
  isConnected: boolean;
  isReceiving: boolean;
  pulseIndicator: boolean;
}

const ConnectionStatus = ({
  isConnected,
  isReceiving,
  pulseIndicator,
}: ConnectionStatusProps) => {
  return (
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
  );
};

export default ConnectionStatus;
