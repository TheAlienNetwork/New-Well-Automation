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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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
  Database,
  Cpu,
  Globe,
  Key,
  Clock,
  Info,
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
    connectionConfig,
    updateConfig,
    connectionType,
  } = useWits();

  const [activeTab, setActiveTab] = useState<string>("connection");
  const [connectionMode, setConnectionMode] = useState<"wits" | "witsml">(
    connectionConfig.connectionType,
  );

  // Form state for WITS connection
  const [witsHost, setWitsHost] = useState(connectionConfig.ipAddress);
  const [witsPort, setWitsPort] = useState(connectionConfig.port);
  const [witsProtocol, setWitsProtocol] = useState<"tcp" | "udp" | "serial">(
    connectionConfig.protocol.toLowerCase() as any,
  );
  const [autoConnect, setAutoConnect] = useState(connectionConfig.autoConnect);
  const [serialPort, setSerialPort] = useState("/dev/ttyUSB0");
  const [baudRate, setBaudRate] = useState(9600);

  // Form state for WITSML connection
  const [witsmlUrl, setWitsmlUrl] = useState(connectionConfig.witsmlConfig.url);
  const [witsmlUsername, setWitsmlUsername] = useState(
    connectionConfig.witsmlConfig.username,
  );
  const [witsmlPassword, setWitsmlPassword] = useState(
    connectionConfig.witsmlConfig.password,
  );
  const [witsmlWellUid, setWitsmlWellUid] = useState(
    connectionConfig.witsmlConfig.wellUid,
  );
  const [witsmlWellboreUid, setWitsmlWellboreUid] = useState(
    connectionConfig.witsmlConfig.wellboreUid,
  );
  const [witsmlLogUid, setWitsmlLogUid] = useState(
    connectionConfig.witsmlConfig.logUid,
  );
  const [witsmlPollingInterval, setWitsmlPollingInterval] = useState(
    connectionConfig.witsmlConfig.pollingInterval,
  );

  // Auto-connect on component mount if enabled
  useEffect(() => {
    if (autoConnect && !isConnected) {
      const timer = setTimeout(() => {
        handleConnect();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [autoConnect, isConnected]);

  // Update connection status indicators with appropriate timeout
  useEffect(() => {
    let dataTimeoutTimer: NodeJS.Timeout | null = null;

    if (isConnected && !isReceiving) {
      dataTimeoutTimer = setTimeout(() => {
        if (isConnected && !isReceiving) {
          clearError();
          // Only show a warning if we're still connected but not receiving data
          if (lastError === null) {
            clearError();
          }
        }
      }, 30000); // 30 second timeout - more responsive feedback
    }

    return () => {
      if (dataTimeoutTimer) {
        clearTimeout(dataTimeoutTimer);
      }
    };
  }, [isConnected, isReceiving, clearError, lastError]);

  const handleConnect = () => {
    clearError();

    if (connectionMode === "wits") {
      // Validate WITS connection settings
      if (!witsHost || witsHost.trim() === "") {
        clearError();
        return;
      }

      if (!witsPort || witsPort <= 0 || witsPort > 65535) {
        clearError();
        return;
      }

      if (
        witsProtocol === "serial" &&
        (!serialPort || serialPort.trim() === "")
      ) {
        clearError();
        return;
      }

      // Update connection config with all necessary parameters
      updateConfig({
        connectionType: "wits",
        ipAddress: witsHost,
        port: witsPort,
        protocol: witsProtocol.toUpperCase(),
        autoConnect,
        // Add WebSocket specific options for better reliability
        heartbeatInterval: 15000, // 15 seconds between heartbeats
        maxMissedPongs: 3, // Reconnect after 3 missed responses
        connectionTimeout: 20000, // 20 second connection timeout
        // Add reconnection settings
        reconnectInterval: 10000, // 10 seconds between reconnect attempts
        maxReconnectAttempts: 100, // Allow up to 100 reconnect attempts
      });

      // Connect with appropriate options
      try {
        if (witsProtocol === "serial") {
          connect(witsHost, witsPort, witsProtocol, {
            serialPort,
            baudRate,
            // Add serial-specific options
            dataBits: 8,
            parity: "none",
            stopBits: 1,
          });
        } else if (witsProtocol === "tcp") {
          connect(witsHost, witsPort, witsProtocol, {
            // Add TCP-specific options
            delimiter: "\r\n", // Use CRLF for TCP
            keepAlive: true, // Enable TCP keepalive
            noDelay: true, // Disable Nagle's algorithm
          });
        } else if (witsProtocol === "udp") {
          connect(witsHost, witsPort, witsProtocol, {
            // Add UDP-specific options
            delimiter: "\n", // Use LF for UDP
          });
        } else {
          connect(witsHost, witsPort, witsProtocol);
        }
      } catch (error) {
        clearError();
      }
    } else {
      // Validate WITSML connection settings
      if (!witsmlUrl || witsmlUrl.trim() === "") {
        clearError();
        return;
      }

      if (!witsmlUsername || witsmlUsername.trim() === "") {
        clearError();
        return;
      }

      // Update connection config
      updateConfig({
        connectionType: "witsml",
        witsmlConfig: {
          url: witsmlUrl,
          username: witsmlUsername,
          password: witsmlPassword,
          wellUid: witsmlWellUid,
          wellboreUid: witsmlWellboreUid,
          logUid: witsmlLogUid || "REALTIME",
          pollingInterval: witsmlPollingInterval,
        },
        autoConnect,
      });

      // Connect to WITSML server
      connect();
    }
  };

  const handleDisconnect = () => {
    disconnect();
  };

  const handleAutoConnectChange = (checked: boolean) => {
    setAutoConnect(checked);
    updateConfig({ autoConnect: checked });
  };

  const handleConnectionModeChange = (mode: "wits" | "witsml") => {
    setConnectionMode(mode);
    updateConfig({ connectionType: mode });
    clearError();

    // Redirect to WitsConfigPage for WITSML configuration
    if (mode === "witsml") {
      window.location.href = "/witsconfig";
    }
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
              {connectionMode === "wits" ? "WITS" : "WITSML"} Connection
            </CardTitle>
            {isConnected && (
              <Badge
                variant="outline"
                className={`${
                  isReceiving
                    ? "bg-green-900/30 text-green-400 border-green-800"
                    : "bg-yellow-900/30 text-yellow-400 border-yellow-800"
                }`}
              >
                {isReceiving ? "RECEIVING DATA" : "CONNECTED"}
              </Badge>
            )}
          </div>
          <RadioGroup
            value={connectionMode}
            onValueChange={(value) =>
              handleConnectionModeChange(value as "wits" | "witsml")
            }
            className="flex space-x-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="wits" id="wits-option" />
              <Label
                htmlFor="wits-option"
                className="flex items-center cursor-pointer"
              >
                <Cpu className="h-4 w-4 mr-2" />
                WITS
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="witsml" id="witsml-option" />
              <Label
                htmlFor="witsml-option"
                className="flex items-center cursor-pointer"
              >
                <Database className="h-4 w-4 mr-2" />
                WITSML
              </Label>
            </div>
          </RadioGroup>
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
            {connectionMode === "wits" ? (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="host" className="text-sm text-gray-400">
                      Host
                    </Label>
                    <Input
                      id="host"
                      value={witsHost}
                      onChange={(e) => setWitsHost(e.target.value)}
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
                      value={witsPort}
                      onChange={(e) => setWitsPort(parseInt(e.target.value))}
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
                    value={witsProtocol}
                    onValueChange={(value) =>
                      setWitsProtocol(value as "tcp" | "udp" | "serial")
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

                {witsProtocol === "serial" && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label
                        htmlFor="serialPort"
                        className="text-sm text-gray-400"
                      >
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
                      <Label
                        htmlFor="baudRate"
                        className="text-sm text-gray-400"
                      >
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
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label
                      htmlFor="witsmlUrl"
                      className="text-sm text-gray-400"
                    >
                      WITSML Server URL
                    </Label>
                    <div className="flex items-center text-blue-400 text-xs cursor-pointer">
                      <Info className="h-3 w-3 mr-1" />
                      <span>What is WITSML?</span>
                    </div>
                  </div>
                  <Input
                    id="witsmlUrl"
                    value={witsmlUrl}
                    onChange={(e) => setWitsmlUrl(e.target.value)}
                    disabled={isConnected}
                    className="bg-gray-800 border-gray-700 text-gray-200"
                    placeholder="https://witsml.server/store"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Example: https://witsml.example.com/witsml/store
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor="witsmlVersion"
                      className="text-sm text-gray-400"
                    >
                      WITSML Version
                    </Label>
                    <Select
                      value={
                        connectionConfig.witsmlConfig.witsmlVersion || "1.4.1.1"
                      }
                      onValueChange={(value) => {
                        const updatedConfig = {
                          witsmlConfig: {
                            ...connectionConfig.witsmlConfig,
                            witsmlVersion: value,
                          },
                        };
                        updateConfig(updatedConfig);
                      }}
                      disabled={isConnected}
                    >
                      <SelectTrigger className="bg-gray-800 border-gray-700 text-gray-200">
                        <SelectValue placeholder="Select WITSML version" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-700">
                        <SelectItem value="1.3.1.1" className="text-gray-200">
                          WITSML 1.3.1
                        </SelectItem>
                        <SelectItem value="1.4.1.1" className="text-gray-200">
                          WITSML 1.4.1
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="requestTimeout"
                      className="text-xs text-gray-400"
                    >
                      Request Timeout (ms)
                    </Label>
                    <Input
                      id="requestTimeout"
                      type="number"
                      value={
                        connectionConfig.witsmlConfig.requestTimeout || 30000
                      }
                      onChange={(e) => {
                        const updatedConfig = {
                          witsmlConfig: {
                            ...connectionConfig.witsmlConfig,
                            requestTimeout: parseInt(e.target.value),
                          },
                        };
                        updateConfig(updatedConfig);
                      }}
                      disabled={isConnected}
                      className="bg-gray-800 border-gray-700 text-gray-200 h-8 text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor="witsmlUsername"
                      className="text-sm text-gray-400"
                    >
                      Username
                    </Label>
                    <Input
                      id="witsmlUsername"
                      value={witsmlUsername}
                      onChange={(e) => setWitsmlUsername(e.target.value)}
                      disabled={isConnected}
                      className="bg-gray-800 border-gray-700 text-gray-200"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="witsmlPassword"
                      className="text-sm text-gray-400"
                    >
                      Password
                    </Label>
                    <Input
                      id="witsmlPassword"
                      type="password"
                      value={witsmlPassword}
                      onChange={(e) => setWitsmlPassword(e.target.value)}
                      disabled={isConnected}
                      className="bg-gray-800 border-gray-700 text-gray-200"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor="witsmlWellUid"
                      className="text-sm text-gray-400"
                    >
                      Well UID
                    </Label>
                    <Input
                      id="witsmlWellUid"
                      value={witsmlWellUid}
                      onChange={(e) => setWitsmlWellUid(e.target.value)}
                      disabled={isConnected}
                      className="bg-gray-800 border-gray-700 text-gray-200"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="witsmlWellboreUid"
                      className="text-sm text-gray-400"
                    >
                      Wellbore UID
                    </Label>
                    <Input
                      id="witsmlWellboreUid"
                      value={witsmlWellboreUid}
                      onChange={(e) => setWitsmlWellboreUid(e.target.value)}
                      disabled={isConnected}
                      className="bg-gray-800 border-gray-700 text-gray-200"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="witsmlLogUid"
                      className="text-sm text-gray-400"
                    >
                      Log UID
                    </Label>
                    <Input
                      id="witsmlLogUid"
                      value={witsmlLogUid}
                      onChange={(e) => setWitsmlLogUid(e.target.value)}
                      disabled={isConnected}
                      className="bg-gray-800 border-gray-700 text-gray-200"
                      placeholder="REALTIME"
                    />
                  </div>
                </div>
              </>
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
                        Tip: Verify the server is running and accessible
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
            {connectionMode === "witsml" && (
              <div className="p-3 bg-gray-800/50 rounded-md border border-gray-700">
                <h3 className="text-sm font-medium text-gray-300 mb-2">
                  WITSML Polling
                </h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor="pollingInterval"
                      className="text-xs text-gray-400"
                    >
                      Polling Interval (ms)
                    </Label>
                    <Input
                      id="pollingInterval"
                      type="number"
                      value={witsmlPollingInterval}
                      onChange={(e) =>
                        setWitsmlPollingInterval(parseInt(e.target.value))
                      }
                      disabled={isConnected}
                      className="bg-gray-800 border-gray-700 text-gray-200 h-8 text-sm"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="requestTimeout"
                      className="text-xs text-gray-400"
                    >
                      Request Timeout (ms)
                    </Label>
                    <Input
                      id="requestTimeout"
                      type="number"
                      value={
                        connectionConfig.witsmlConfig.requestTimeout || 30000
                      }
                      onChange={(e) => {
                        const updatedConfig = {
                          witsmlConfig: {
                            ...connectionConfig.witsmlConfig,
                            requestTimeout: parseInt(e.target.value),
                          },
                        };
                        updateConfig(updatedConfig);
                      }}
                      disabled={isConnected}
                      className="bg-gray-800 border-gray-700 text-gray-200 h-8 text-sm"
                    />
                  </div>
                </div>
              </div>
            )}

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
                <div className="text-gray-400">Connection Type:</div>
                <div className="text-gray-300">
                  {connectionMode.toUpperCase()}
                </div>
                <div className="text-gray-400">Data Receiving:</div>
                <div
                  className={isReceiving ? "text-green-400" : "text-gray-400"}
                >
                  {isReceiving ? "Yes" : "No"}
                </div>

                {connectionMode === "wits" ? (
                  <>
                    <div className="text-gray-400">Protocol:</div>
                    <div className="text-gray-300">
                      {witsProtocol.toUpperCase()}
                    </div>
                    <div className="text-gray-400">Host:</div>
                    <div className="text-gray-300">{witsHost}</div>
                    <div className="text-gray-400">Port:</div>
                    <div className="text-gray-300">{witsPort}</div>
                    {witsProtocol === "serial" && (
                      <>
                        <div className="text-gray-400">Serial Port:</div>
                        <div className="text-gray-300">{serialPort}</div>
                        <div className="text-gray-400">Baud Rate:</div>
                        <div className="text-gray-300">{baudRate}</div>
                      </>
                    )}
                  </>
                ) : (
                  <>
                    <div className="text-gray-400">Server URL:</div>
                    <div className="text-gray-300">{witsmlUrl}</div>
                    <div className="text-gray-400">Username:</div>
                    <div className="text-gray-300">{witsmlUsername}</div>
                    <div className="text-gray-400">Well UID:</div>
                    <div className="text-gray-300">{witsmlWellUid}</div>
                    <div className="text-gray-400">Wellbore UID:</div>
                    <div className="text-gray-300">{witsmlWellboreUid}</div>
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
                  <div className="text-gray-400">Last Update:</div>
                  <div className="text-gray-300">
                    {new Date().toLocaleTimeString()}
                  </div>
                  {connectionMode === "wits" ? (
                    <>
                      <div className="text-gray-400">Packets Received:</div>
                      <div className="text-gray-300">1,245</div>
                      <div className="text-gray-400">Packets/Second:</div>
                      <div className="text-gray-300">4.2</div>
                    </>
                  ) : (
                    <>
                      <div className="text-gray-400">Queries Sent:</div>
                      <div className="text-gray-300">42</div>
                      <div className="text-gray-400">Data Points:</div>
                      <div className="text-gray-300">1,856</div>
                    </>
                  )}
                  <div className="text-gray-400">Data Quality:</div>
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

export { WitsConnectionPanel };
export default WitsConnectionPanel;
