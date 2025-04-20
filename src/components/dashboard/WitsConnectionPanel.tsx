import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useWits } from "@/context/WitsContext";
import {
  AlertCircle,
  Activity,
  Settings,
  Wifi,
  WifiOff,
  Server,
  Plug,
  PlugZap,
} from "lucide-react";

interface WitsConnectionPanelProps {
  className?: string;
}

const WitsConnectionPanel: React.FC<WitsConnectionPanelProps> = ({
  className,
}) => {
  const {
    isConnected,
    isReceiving,
    connect,
    disconnect,
    lastError,
    clearError,
  } = useWits();

  const [host, setHost] = useState<string>(
    localStorage.getItem("witsHost") || "localhost",
  );
  const [port, setPort] = useState<number>(
    parseInt(localStorage.getItem("witsPort") || "4000"),
  );
  const [protocol, setProtocol] = useState<"tcp" | "udp" | "serial">(
    (localStorage.getItem("witsProtocol") as any) || "tcp",
  );
  const [autoConnect, setAutoConnect] = useState<boolean>(
    localStorage.getItem("witsAutoConnect") === "true",
  );
  const [serialPort, setSerialPort] = useState<string>(
    localStorage.getItem("witsSerialPort") || "/dev/ttyUSB0",
  );
  const [baudRate, setBaudRate] = useState<number>(
    parseInt(localStorage.getItem("witsBaudRate") || "9600"),
  );
  const [activeTab, setActiveTab] = useState<string>("connection");

  // Auto-connect on component mount if enabled
  useEffect(() => {
    if (autoConnect && !isConnected) {
      // Add a small delay to ensure the component is fully mounted
      const timer = setTimeout(() => {
        handleConnect();
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, []);

  // Update connection status indicators
  useEffect(() => {
    // If we're connected but not receiving data for more than 10 seconds, show a warning
    let dataTimeoutTimer: NodeJS.Timeout | null = null;

    if (isConnected && !isReceiving) {
      dataTimeoutTimer = setTimeout(() => {
        if (isConnected && !isReceiving) {
          setLastError(
            "Connected but not receiving data. Check WITS data source.",
          );
        }
      }, 10000);
    }

    return () => {
      if (dataTimeoutTimer) {
        clearTimeout(dataTimeoutTimer);
      }
    };
  }, [isConnected, isReceiving]);

  const handleConnect = () => {
    // Validate connection settings
    if (!host || host.trim() === "") {
      setLastError("Host cannot be empty");
      return;
    }

    if (!port || port <= 0 || port > 65535) {
      setLastError("Port must be between 1 and 65535");
      return;
    }

    if (protocol === "serial" && (!serialPort || serialPort.trim() === "")) {
      setLastError("Serial port cannot be empty");
      return;
    }

    // Save connection settings to localStorage
    localStorage.setItem("witsHost", host);
    localStorage.setItem("witsPort", port.toString());
    localStorage.setItem("witsProtocol", protocol);
    localStorage.setItem("witsAutoConnect", autoConnect.toString());
    localStorage.setItem("witsSerialPort", serialPort);
    localStorage.setItem("witsBaudRate", baudRate.toString());

    // Clear any previous error
    clearError();

    // Connect with appropriate options based on protocol
    try {
      if (protocol === "serial") {
        connect(host, port, protocol, { serialPort, baudRate });
      } else {
        connect(host, port, protocol);
      }
    } catch (error) {
      setLastError(
        `Connection error: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  };

  const handleDisconnect = () => {
    disconnect();
  };

  const handleAutoConnectChange = (checked: boolean) => {
    setAutoConnect(checked);
    localStorage.setItem("witsAutoConnect", checked.toString());
  };

  return (
    <Card
      className={`bg-gray-900 border-gray-800 shadow-lg overflow-hidden ${className}`}
    >
      <CardHeader className="p-4 pb-2 border-b border-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isConnected ? (
              <Wifi className="h-5 w-5 text-green-400" />
            ) : (
              <WifiOff className="h-5 w-5 text-red-400" />
            )}
            <CardTitle className="text-lg font-medium text-gray-200">
              WITS Connection
            </CardTitle>
            {isConnected && (
              <Badge
                variant="outline"
                className={`${isReceiving ? "bg-green-900/30 text-green-400 border-green-800" : "bg-yellow-900/30 text-yellow-400 border-yellow-800"}`}
              >
                {isReceiving ? "RECEIVING DATA" : "CONNECTED"}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4">
        <Tabs
          defaultValue="connection"
          value={activeTab}
          onValueChange={setActiveTab}
        >
          <TabsList className="bg-gray-800 mb-4">
            <TabsTrigger value="connection">
              <Server className="h-4 w-4 mr-2" />
              Connection
            </TabsTrigger>
            <TabsTrigger value="advanced">
              <Settings className="h-4 w-4 mr-2" />
              Advanced
            </TabsTrigger>
            <TabsTrigger value="status">
              <Activity className="h-4 w-4 mr-2" />
              Status
            </TabsTrigger>
          </TabsList>

          <TabsContent value="connection" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="host" className="text-sm text-gray-400">
                  Host
                </Label>
                <Input
                  id="host"
                  value={host}
                  onChange={(e) => setHost(e.target.value)}
                  disabled={isConnected}
                  className="bg-gray-800 border-gray-700 text-gray-200"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="port" className="text-sm text-gray-400">
                  Port
                </Label>
                <Input
                  id="port"
                  type="number"
                  value={port}
                  onChange={(e) => setPort(parseInt(e.target.value))}
                  disabled={isConnected}
                  className="bg-gray-800 border-gray-700 text-gray-200"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="protocol" className="text-sm text-gray-400">
                Protocol
              </Label>
              <Select
                value={protocol}
                onValueChange={(value) =>
                  setProtocol(value as "tcp" | "udp" | "serial")
                }
                disabled={isConnected}
              >
                <SelectTrigger className="bg-gray-800 border-gray-700 text-gray-200">
                  <SelectValue placeholder="Select protocol" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  <SelectItem value="tcp" className="text-gray-200">
                    TCP
                  </SelectItem>
                  <SelectItem value="udp" className="text-gray-200">
                    UDP
                  </SelectItem>
                  <SelectItem value="serial" className="text-gray-200">
                    Serial
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {protocol === "serial" && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="serialPort" className="text-sm text-gray-400">
                    Serial Port
                  </Label>
                  <Input
                    id="serialPort"
                    value={serialPort}
                    onChange={(e) => setSerialPort(e.target.value)}
                    disabled={isConnected}
                    className="bg-gray-800 border-gray-700 text-gray-200"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="baudRate" className="text-sm text-gray-400">
                    Baud Rate
                  </Label>
                  <Select
                    value={baudRate.toString()}
                    onValueChange={(value) => setBaudRate(parseInt(value))}
                    disabled={isConnected}
                  >
                    <SelectTrigger className="bg-gray-800 border-gray-700 text-gray-200">
                      <SelectValue placeholder="Select baud rate" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700">
                      <SelectItem value="9600" className="text-gray-200">
                        9600
                      </SelectItem>
                      <SelectItem value="19200" className="text-gray-200">
                        19200
                      </SelectItem>
                      <SelectItem value="38400" className="text-gray-200">
                        38400
                      </SelectItem>
                      <SelectItem value="57600" className="text-gray-200">
                        57600
                      </SelectItem>
                      <SelectItem value="115200" className="text-gray-200">
                        115200
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center space-x-2">
                <Switch
                  id="auto-connect"
                  checked={autoConnect}
                  onCheckedChange={handleAutoConnectChange}
                  disabled={isConnected}
                  className="data-[state=checked]:bg-blue-600"
                />
                <Label
                  htmlFor="auto-connect"
                  className="text-sm text-gray-400 cursor-pointer"
                >
                  Auto-connect on startup
                </Label>
              </div>

              {isConnected ? (
                <Button
                  variant="destructive"
                  onClick={handleDisconnect}
                  className="bg-red-600 hover:bg-red-700"
                >
                  <PlugZap className="h-4 w-4 mr-2" />
                  Disconnect
                </Button>
              ) : (
                <Button
                  onClick={handleConnect}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Plug className="h-4 w-4 mr-2" />
                  Connect
                </Button>
              )}
            </div>

            {lastError && (
              <div className="mt-4 p-3 bg-red-900/20 border border-red-800 rounded-md">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-red-400 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-red-400">{lastError}</p>
                    {lastError.includes("Reconnecting") && (
                      <div className="mt-1 flex items-center">
                        <div className="h-1.5 w-1.5 rounded-full bg-yellow-500 animate-pulse mr-1"></div>
                        <p className="text-xs text-yellow-400">
                          Auto-reconnect in progress...
                        </p>
                      </div>
                    )}
                    {lastError.includes("timeout") && (
                      <p className="text-xs text-gray-400 mt-1">
                        Tip: Verify the server is running and accessible at{" "}
                        {host}:{port}
                      </p>
                    )}
                    {lastError.includes("Maximum reconnect attempts") && (
                      <p className="text-xs text-gray-400 mt-1">
                        Tip: Check your network connection or try a different
                        host/port
                      </p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearError}
                    className="h-6 px-2 text-gray-400 hover:text-gray-300 hover:bg-gray-800"
                  >
                    Dismiss
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="advanced" className="space-y-4">
            <div className="p-3 bg-gray-800/50 rounded-md border border-gray-700">
              <h3 className="text-sm font-medium text-gray-300 mb-2">
                Connection Settings
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="reconnectInterval"
                    className="text-xs text-gray-400"
                  >
                    Reconnect Interval (ms)
                  </Label>
                  <Input
                    id="reconnectInterval"
                    type="number"
                    defaultValue="5000"
                    disabled={isConnected}
                    className="bg-gray-800 border-gray-700 text-gray-200 h-8 text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="maxReconnectAttempts"
                    className="text-xs text-gray-400"
                  >
                    Max Reconnect Attempts
                  </Label>
                  <Input
                    id="maxReconnectAttempts"
                    type="number"
                    defaultValue="10"
                    disabled={isConnected}
                    className="bg-gray-800 border-gray-700 text-gray-200 h-8 text-sm"
                  />
                </div>
              </div>
            </div>

            <div className="p-3 bg-gray-800/50 rounded-md border border-gray-700">
              <h3 className="text-sm font-medium text-gray-300 mb-2">
                Data Processing
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label
                    htmlFor="filter-noise"
                    className="text-xs text-gray-400"
                  >
                    Filter Signal Noise
                  </Label>
                  <Switch
                    id="filter-noise"
                    defaultChecked={true}
                    className="data-[state=checked]:bg-blue-600"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label
                    htmlFor="auto-decode"
                    className="text-xs text-gray-400"
                  >
                    Auto-Decode Pulses
                  </Label>
                  <Switch
                    id="auto-decode"
                    defaultChecked={true}
                    className="data-[state=checked]:bg-blue-600"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label
                    htmlFor="log-raw-data"
                    className="text-xs text-gray-400"
                  >
                    Log Raw Data
                  </Label>
                  <Switch
                    id="log-raw-data"
                    defaultChecked={false}
                    className="data-[state=checked]:bg-blue-600"
                  />
                </div>
              </div>
            </div>

            <Button
              variant="outline"
              className="w-full bg-gray-800 border-gray-700 hover:bg-gray-700 text-gray-300"
            >
              <Settings className="h-4 w-4 mr-2" />
              Save Advanced Settings
            </Button>
          </TabsContent>

          <TabsContent value="status" className="space-y-4">
            <div className="p-3 bg-gray-800/50 rounded-md border border-gray-700">
              <h3 className="text-sm font-medium text-gray-300 mb-2">
                Connection Status
              </h3>
              <div className="grid grid-cols-2 gap-y-2 text-sm">
                <div className="text-gray-400">Status:</div>
                <div
                  className={isConnected ? "text-green-400" : "text-red-400"}
                >
                  {isConnected ? "Connected" : "Disconnected"}
                </div>
                <div className="text-gray-400">Data Receiving:</div>
                <div
                  className={isReceiving ? "text-green-400" : "text-gray-400"}
                >
                  {isReceiving ? "Yes" : "No"}
                </div>
                <div className="text-gray-400">Connection Type:</div>
                <div className="text-gray-300">{protocol.toUpperCase()}</div>
                <div className="text-gray-400">Host:</div>
                <div className="text-gray-300">{host}</div>
                <div className="text-gray-400">Port:</div>
                <div className="text-gray-300">{port}</div>
                {protocol === "serial" && (
                  <>
                    <div className="text-gray-400">Serial Port:</div>
                    <div className="text-gray-300">{serialPort}</div>
                    <div className="text-gray-400">Baud Rate:</div>
                    <div className="text-gray-300">{baudRate}</div>
                  </>
                )}
              </div>
            </div>

            {isConnected && (
              <div className="p-3 bg-gray-800/50 rounded-md border border-gray-700">
                <h3 className="text-sm font-medium text-gray-300 mb-2">
                  Data Statistics
                </h3>
                <div className="grid grid-cols-2 gap-y-2 text-sm">
                  <div className="text-gray-400">Packets Received:</div>
                  <div className="text-gray-300">1,245</div>
                  <div className="text-gray-400">Packets/Second:</div>
                  <div className="text-gray-300">4.2</div>
                  <div className="text-gray-400">Last Packet:</div>
                  <div className="text-gray-300">
                    {new Date().toLocaleTimeString()}
                  </div>
                  <div className="text-gray-400">Decode Quality:</div>
                  <div className="text-green-400">98%</div>
                </div>
              </div>
            )}

            <div className="flex justify-end">
              <Button
                variant="outline"
                className="bg-gray-800 border-gray-700 hover:bg-gray-700 text-gray-300"
                onClick={() => setActiveTab("connection")}
              >
                Back to Connection
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default WitsConnectionPanel;
