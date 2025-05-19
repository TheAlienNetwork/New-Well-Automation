import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Server,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Terminal,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface WitsServerStatusProps {
  serverUrl?: string;
  onRefresh?: () => void;
}

const WitsServerStatus: React.FC<WitsServerStatusProps> = ({
  serverUrl = "ws://localhost:8080/wits",
  onRefresh,
}) => {
  const [status, setStatus] = useState<"checking" | "online" | "offline">(
    "checking",
  );
  const [lastChecked, setLastChecked] = useState<Date>(new Date());
  const [responseTime, setResponseTime] = useState<number | null>(null);
  const [showStartGuide, setShowStartGuide] = useState<boolean>(false);
  const [connectionMetrics, setConnectionMetrics] = useState({
    latency: null,
    packetLoss: null,
    jitter: null,
  });

  const checkServerStatus = async () => {
    setStatus("checking");
    setResponseTime(null);

    try {
      const startTime = performance.now();

      // Create a WebSocket connection with a timeout
      const connectWithTimeout = (url: string, timeout: number) => {
        return new Promise<WebSocket>((resolve, reject) => {
          const ws = new WebSocket(url);
          const timer = setTimeout(() => {
            ws.close();
            reject(new Error("Connection timeout"));
          }, timeout);

          ws.onopen = () => {
            clearTimeout(timer);
            resolve(ws);
          };

          ws.onerror = (err) => {
            clearTimeout(timer);
            reject(err);
          };
        });
      };

      // Try to connect with a 5 second timeout
      const ws = await connectWithTimeout(serverUrl, 5000);

      // Calculate response time
      const endTime = performance.now();
      setResponseTime(Math.round(endTime - startTime));

      // Close the connection
      ws.close();

      setStatus("online");
    } catch (error) {
      console.error("Server status check failed:", error);
      setStatus("offline");
    }

    setLastChecked(new Date());
  };

  useEffect(() => {
    checkServerStatus();

    // Check server status every 30 seconds
    const interval = setInterval(checkServerStatus, 30000);

    return () => clearInterval(interval);
  }, [serverUrl]);

  const handleRefresh = () => {
    checkServerStatus();
    if (onRefresh) onRefresh();
  };

  const toggleStartGuide = () => {
    setShowStartGuide(!showStartGuide);
  };

  return (
    <Card className="w-full bg-gray-900 border-gray-800 shadow-lg overflow-hidden">
      <CardHeader className="p-3 pb-0 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Server className="h-4 w-4 text-blue-400" />
          <CardTitle className="text-sm font-medium text-gray-300">
            WITS Server Status
          </CardTitle>
        </div>
        <Badge
          variant="outline"
          className={
            status === "checking"
              ? "bg-yellow-900/30 text-yellow-400 border-yellow-800 animate-pulse"
              : status === "online"
                ? "bg-green-900/30 text-green-400 border-green-800"
                : "bg-red-900/30 text-red-400 border-red-800"
          }
        >
          {status === "checking"
            ? "CHECKING"
            : status === "online"
              ? "ONLINE"
              : "OFFLINE"}
        </Badge>
      </CardHeader>

      <CardContent className="p-3">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">Server URL:</span>
            <span className="text-xs font-medium text-gray-300">
              {serverUrl}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">Last Checked:</span>
            <span className="text-xs font-medium text-gray-300">
              {lastChecked.toLocaleTimeString()}
            </span>
          </div>

          {responseTime !== null && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">Response Time:</span>
              <span className="text-xs font-medium text-gray-300">
                {responseTime}ms
              </span>
            </div>
          )}

          {/* Connection quality metrics */}
          {status === "online" && connectionMetrics.latency !== null && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">Avg. Latency:</span>
              <span className="text-xs font-medium text-gray-300">
                {connectionMetrics.latency}ms
              </span>
            </div>
          )}

          {status === "online" && connectionMetrics.packetLoss !== null && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">Packet Loss:</span>
              <span className="text-xs font-medium text-gray-300">
                {connectionMetrics.packetLoss}%
              </span>
            </div>
          )}

          {status === "online" && connectionMetrics.jitter !== null && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">Jitter:</span>
              <span className="text-xs font-medium text-gray-300">
                {connectionMetrics.jitter}ms
              </span>
            </div>
          )}

          <div className="pt-2">
            {status === "offline" ? (
              <div className="p-2 bg-red-900/30 border border-red-800 rounded-md text-xs text-red-400 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                <div>
                  <p className="font-medium">Server Offline</p>
                  <p className="mt-1">
                    The WITS server is not responding. Please check if it's
                    running.
                  </p>
                  <Button
                    variant="link"
                    className="text-xs p-0 h-auto text-blue-400 mt-1"
                    onClick={toggleStartGuide}
                  >
                    {showStartGuide
                      ? "Hide start guide"
                      : "Show how to start server"}
                  </Button>
                </div>
              </div>
            ) : status === "online" ? (
              <div className="p-2 bg-green-900/30 border border-green-800 rounded-md text-xs text-green-400 flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                <div>
                  <p className="font-medium">Server Online</p>
                  <p className="mt-1">
                    The WITS server is running and accepting connections.
                  </p>
                </div>
              </div>
            ) : null}

            {showStartGuide && (
              <div className="mt-2 p-2 bg-gray-800 border border-gray-700 rounded-md text-xs">
                <div className="flex items-center gap-2 mb-1">
                  <Terminal className="h-3 w-3 text-blue-400" />
                  <span className="text-gray-300 font-medium">
                    Start WebSocket Proxy Server
                  </span>
                </div>
                <ol className="list-decimal pl-4 text-gray-400 space-y-1">
                  <li>Open a terminal in your project directory</li>
                  <li>
                    Run the following command:
                    <div className="bg-gray-900 p-1 rounded mt-1 font-mono text-blue-300">
                      node src/proxy/witsProxy.js
                    </div>
                  </li>
                  <li>
                    You should see "WITS WS Proxy Server running on HTTP port
                    8080"
                  </li>
                  <li>
                    Keep the terminal window open while using the application
                  </li>
                </ol>
                <p className="mt-2 text-gray-500">
                  The proxy server allows browser clients to connect to WITS TCP
                  servers.
                </p>
              </div>
            )}
          </div>

          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              className="w-full bg-gray-800 border-gray-700 hover:bg-gray-700 text-gray-300 mt-2"
              onClick={handleRefresh}
              disabled={status === "checking"}
            >
              <RefreshCw
                className={`h-3 w-3 mr-2 ${status === "checking" ? "animate-spin" : ""}`}
              />
              {status === "checking" ? "Checking..." : "Refresh Status"}
            </Button>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-blue-900/30 border-blue-800 hover:bg-blue-800/30 text-blue-400 mt-2"
                    onClick={toggleStartGuide}
                  >
                    <Terminal className="h-3 w-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Server start guide</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default WitsServerStatus;
