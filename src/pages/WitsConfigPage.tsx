import React, { useState, useEffect } from "react";
import Navbar from "@/components/layout/Navbar";
import StatusBar from "@/components/dashboard/StatusBar";
// Database management has been moved to its own dedicated tab
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Wifi,
  Server,
  Settings,
  Save,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Download,
  Upload,
  ArrowRightLeft,
  Database,
  Link,
  Unlink,
  Plus,
  Trash2,
  Edit,
  Info,
  Globe,
  Key,
} from "lucide-react";

// Types for WITS data and configuration
type WitsChannel = {
  id: number;
  name: string;
  witsId: number;
  channel: number;
  unit: string;
  active: boolean;
  lastValue: number;
  lastUpdate?: Date;
};

type WitsConfig = {
  connectionType: "wits" | "witsml";
  protocol: "TCP" | "UDP" | "Serial" | "WS";
  ipAddress: string;
  port: number;
  witsLevel: "0" | "1" | "2";
  autoConnect: boolean;
  autoReconnect: boolean;
  enableLogging: boolean;
  logData: boolean;
  timeout: number;
  retryInterval: number;
  serialPort?: string;
  baudRate?: number;
  // WebSocket specific options
  heartbeatInterval?: number;
  maxMissedPongs?: number;
  binaryType?: "blob" | "arraybuffer";
  // WebSocket-to-TCP proxy options
  proxyMode?: boolean;
  tcpHost?: string;
  tcpPort?: number;
  // WITSML specific options
  witsmlConfig?: {
    url: string;
    username: string;
    password: string;
    wellUid: string;
    wellboreUid: string;
    logUid: string;
    pollingInterval: number;
    witsmlVersion?: string;
    requestTimeout?: number;
  };
};

type WitsRecord = {
  [key: number]: number | string;
  timestamp: Date;
};

// Custom hook for WITS connection
const useWitsConnection = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isReceiving, setIsReceiving] = useState(false);
  const [connectionLogs, setConnectionLogs] = useState<string[]>([]);
  const [witsData, setWitsData] = useState<WitsRecord[]>([]);
  const [rawWitsMessages, setRawWitsMessages] = useState<string[]>([]);
  const [lastUpdateTime, setLastUpdateTime] = useState(new Date());
  const [connectionStats, setConnectionStats] = useState({
    uptime: "00:00:00",
    packetsReceived: 0,
    dataRate: "0 KB/s",
    errors: 0,
  });

  const [connectionConfig, setConnectionConfig] = useState<WitsConfig>({
    protocol: "TCP",
    ipAddress: "192.168.1.100",
    port: 8080,
    witsLevel: "0",
    autoConnect: false,
    autoReconnect: true,
    enableLogging: true,
    logData: true,
    timeout: 30,
    retryInterval: 5,
  });

  // WebSocket or TCP connection reference
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [reconnectTimer, setReconnectTimer] = useState<NodeJS.Timeout | null>(
    null,
  );
  const [startTime, setStartTime] = useState<Date | null>(null);

  // Add a log message
  const addLog = (message: string) => {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}`;
    setConnectionLogs((prev) => [logMessage, ...prev].slice(0, 1000)); // Keep last 1000 logs
  };

  // Parse WITS record (simplified for example)
  const parseWitsRecord = (data: string): WitsRecord | null => {
    try {
      // Simple WITS parsing - adjust based on your actual WITS format
      const record: WitsRecord = { timestamp: new Date() };

      // Example for WITS Level 0 - adjust as needed
      if (connectionConfig.witsLevel === "0") {
        const items = data.split("\t");
        for (const item of items) {
          const [id, value] = item.split("=");
          if (id && value) {
            record[parseInt(id)] = parseFloat(value) || value;
          }
        }
        return record;
      }

      // Add parsing for other WITS levels or WITSML as needed

      return null;
    } catch (error) {
      addLog(`Error parsing WITS data: ${error}`);
      return null;
    }
  };

  // Connect to WITS server
  const connect = () => {
    if (isConnected) return;

    addLog(
      `Attempting to connect to ${connectionConfig.protocol}://${connectionConfig.ipAddress}:${connectionConfig.port}`,
    );

    try {
      // Determine WebSocket protocol based on current environment
      const isLocalhost =
        window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1";
      const wsProtocol =
        window.location.protocol === "https:" && !isLocalhost
          ? "wss://"
          : "ws://";

      // Add endpoint for WebSocket connections
      const wsEndpoint = connectionConfig.protocol === "WS" ? "/wits" : "";
      let wsUrl = `${wsProtocol}${connectionConfig.ipAddress}:${connectionConfig.port}${wsEndpoint}`;

      // Add proxy parameters if proxy mode is enabled
      if (connectionConfig.protocol === "WS" && connectionConfig.proxyMode) {
        const queryParams = new URLSearchParams();
        queryParams.set("host", connectionConfig.tcpHost || "localhost");
        queryParams.set("port", String(connectionConfig.tcpPort || 5000));
        queryParams.set("protocol", "tcp");
        wsUrl += `?${queryParams.toString()}`;
        addLog(`Connecting via WebSocket-to-TCP proxy to ${wsUrl}`);
        addLog(
          `Proxy target: ${connectionConfig.tcpHost}:${connectionConfig.tcpPort}`,
        );
      } else {
        addLog(`Connecting directly to ${wsUrl}`);
      }

      const ws = new WebSocket(wsUrl);

      // Set binary type for WebSocket if specified
      if (connectionConfig.protocol === "WS" && connectionConfig.binaryType) {
        ws.binaryType = connectionConfig.binaryType;
        addLog(`Set WebSocket binary type to ${connectionConfig.binaryType}`);
      }

      // Setup ping/pong for WebSocket connections
      let pingInterval: NodeJS.Timeout | null = null;
      let pongTimeout: NodeJS.Timeout | null = null;
      let missedPongs = 0;

      const startHeartbeat = () => {
        if (connectionConfig.protocol !== "WS") return;

        const heartbeatInterval = connectionConfig.heartbeatInterval || 15000;
        const maxMissedPongs = connectionConfig.maxMissedPongs || 3;

        addLog(
          `Starting WebSocket heartbeat with ${heartbeatInterval}ms interval`,
        );

        pingInterval = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            try {
              ws.send(JSON.stringify({ type: "ping", timestamp: Date.now() }));
              addLog("Sent heartbeat ping");

              if (pongTimeout) clearTimeout(pongTimeout);

              pongTimeout = setTimeout(() => {
                missedPongs++;
                addLog(
                  `Missed pong response (${missedPongs}/${maxMissedPongs})`,
                );

                if (missedPongs >= maxMissedPongs) {
                  addLog(
                    `Maximum missed pongs (${maxMissedPongs}) reached, reconnecting...`,
                  );
                  ws.close();
                }
              }, 10000); // 10 seconds to wait for pong
            } catch (error) {
              addLog(`Error sending ping: ${error}`);
            }
          }
        }, heartbeatInterval);
      };

      const stopHeartbeat = () => {
        if (pingInterval) {
          clearInterval(pingInterval);
          pingInterval = null;
        }

        if (pongTimeout) {
          clearTimeout(pongTimeout);
          pongTimeout = null;
        }
      };

      ws.onopen = () => {
        setIsConnected(true);
        setStartTime(new Date());
        addLog("Connection established");
        updateUptime();

        // Start heartbeat for WebSocket connections
        if (connectionConfig.protocol === "WS") {
          startHeartbeat();
        }
      };

      ws.onmessage = (event) => {
        setIsReceiving(true);
        setLastUpdateTime(new Date());

        // Check for pong messages in WebSocket mode
        if (
          connectionConfig.protocol === "WS" &&
          typeof event.data === "string"
        ) {
          try {
            const data = JSON.parse(event.data);
            if (data.type === "pong") {
              addLog("Received pong response");
              missedPongs = 0;
              if (pongTimeout) {
                clearTimeout(pongTimeout);
                pongTimeout = null;
              }
              return;
            }
          } catch (e) {
            // Not JSON or not a pong message, process as normal data
          }
        }

        // Log raw message
        setRawWitsMessages((prev) =>
          [
            typeof event.data === "string" ? event.data : "[Binary Data]",
            ...prev,
          ].slice(0, 1000),
        );

        if (typeof event.data === "string") {
          addLog(`Received data: ${event.data.substring(0, 100)}...`);
        } else {
          addLog(
            `Received binary data of size: ${event.data.byteLength || event.data.size || "unknown"} bytes`,
          );
        }

        // Parse WITS data
        const record = parseWitsRecord(
          typeof event.data === "string" ? event.data : "[Binary Data]",
        );
        if (record) {
          setWitsData((prev) => [record, ...prev].slice(0, 1000));
        }

        // Update stats
        setConnectionStats((prev) => ({
          ...prev,
          packetsReceived: prev.packetsReceived + 1,
          dataRate: `${((prev.packetsReceived * 100) / 1024).toFixed(1)} KB/s`,
        }));
      };

      ws.onerror = (error) => {
        addLog(`Connection error: ${error}`);
        setConnectionStats((prev) => ({ ...prev, errors: prev.errors + 1 }));
        setIsConnected(false);
        setIsReceiving(false);
        stopHeartbeat();
      };

      ws.onclose = (event) => {
        setIsConnected(false);
        setIsReceiving(false);
        stopHeartbeat();

        // Log detailed close information
        addLog(
          `Connection closed with code ${event.code}: ${event.reason || "No reason provided"}`,
        );

        if (connectionConfig.autoReconnect) {
          addLog(
            `Attempting to reconnect in ${connectionConfig.retryInterval} seconds...`,
          );
          const timer = setTimeout(
            () => connect(),
            connectionConfig.retryInterval * 1000,
          );
          setReconnectTimer(timer);
        }
      };

      setSocket(ws);
    } catch (error) {
      addLog(`Connection failed: ${error}`);
      setIsConnected(false);
      setIsReceiving(false);
    }
  };

  // Disconnect from WITS server
  const disconnect = () => {
    if (!isConnected || !socket) return;

    addLog("Disconnecting...");

    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      setReconnectTimer(null);
    }

    // For WebSocket connections, send a clean close message if possible
    if (
      connectionConfig.protocol === "WS" &&
      socket.readyState === WebSocket.OPEN
    ) {
      try {
        socket.send(
          JSON.stringify({ type: "disconnect", command: "disconnect" }),
        );
        addLog("Sent clean disconnect message to WebSocket server");
      } catch (e) {
        addLog(`Error sending WebSocket disconnect message: ${e}`);
      }
    }

    socket.close(1000, "Client initiated disconnect");
    setIsConnected(false);
    setIsReceiving(false);
  };

  // Test connection
  const testConnection = async (): Promise<boolean> => {
    addLog("Testing connection...");
    try {
      if (connectionConfig.protocol === "WS") {
        // Test WebSocket connection
        const isLocalhost =
          window.location.hostname === "localhost" ||
          window.location.hostname === "127.0.0.1";
        const wsProtocol =
          window.location.protocol === "https:" && !isLocalhost
            ? "wss://"
            : "ws://";
        const wsEndpoint = "/wits";
        let wsUrl = `${wsProtocol}${connectionConfig.ipAddress}:${connectionConfig.port}${wsEndpoint}`;

        // Add proxy parameters if proxy mode is enabled
        if (connectionConfig.proxyMode) {
          const queryParams = new URLSearchParams();
          queryParams.set("host", connectionConfig.tcpHost || "localhost");
          queryParams.set("port", String(connectionConfig.tcpPort || 5000));
          queryParams.set("protocol", "tcp");
          wsUrl += `?${queryParams.toString()}`;
          addLog(`Testing WebSocket-to-TCP proxy connection to ${wsUrl}`);
          addLog(
            `Proxy target: ${connectionConfig.tcpHost}:${connectionConfig.tcpPort}`,
          );
        } else {
          addLog(`Testing direct WebSocket connection to ${wsUrl}`);
        }

        const testSocket = new WebSocket(wsUrl);

        return new Promise((resolve) => {
          // Set a timeout for the connection attempt
          const timeout = setTimeout(() => {
            testSocket.close();
            addLog("WebSocket connection test failed: timeout");
            resolve(false);
          }, 5000);

          testSocket.onopen = () => {
            clearTimeout(timeout);
            // Send a test ping message
            try {
              testSocket.send(
                JSON.stringify({ type: "ping", timestamp: Date.now() }),
              );
              addLog("Sent test ping message");
            } catch (e) {
              addLog(`Error sending test ping: ${e}`);
            }
            setTimeout(() => {
              testSocket.close();
              addLog("WebSocket connection test successful");
              resolve(true);
            }, 500);
          };

          testSocket.onmessage = (event) => {
            addLog(`Received test response: ${event.data}`);
          };

          testSocket.onerror = (event) => {
            clearTimeout(timeout);
            testSocket.close();
            addLog(`WebSocket connection test failed: ${event.type}`);
            resolve(false);
          };
        });
      } else {
        // For non-WebSocket protocols, use the existing test method
        // Determine WebSocket protocol based on current environment
        const isLocalhost =
          window.location.hostname === "localhost" ||
          window.location.hostname === "127.0.0.1";
        const wsProtocol =
          window.location.protocol === "https:" && !isLocalhost
            ? "wss://"
            : "ws://";
        const wsUrl = `${wsProtocol}${connectionConfig.ipAddress}:${connectionConfig.port}`;

        const testSocket = new WebSocket(wsUrl);

        return new Promise((resolve) => {
          // Set a timeout for the connection attempt
          const timeout = setTimeout(() => {
            testSocket.close();
            addLog("Connection test failed: timeout");
            resolve(false);
          }, 5000);

          testSocket.onopen = () => {
            clearTimeout(timeout);
            testSocket.close();
            addLog("Connection test successful");
            resolve(true);
          };

          testSocket.onerror = () => {
            clearTimeout(timeout);
            testSocket.close();
            addLog("Connection test failed");
            resolve(false);
          };
        });
      }
    } catch (error) {
      addLog(`Connection test failed: ${error}`);
      return false;
    }
  };

  // Update configuration
  const updateConfig = (newConfig: WitsConfig) => {
    setConnectionConfig(newConfig);
    addLog("Configuration updated");
  };

  // Update uptime counter
  const updateUptime = () => {
    if (!startTime) return;

    const now = new Date();
    const diff = now.getTime() - startTime.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    setConnectionStats((prev) => ({
      ...prev,
      uptime: `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`,
    }));
  };

  // Auto-connect on mount if configured
  useEffect(() => {
    if (connectionConfig.autoConnect) {
      connect();
    }

    // Update uptime every second when connected
    const interval = setInterval(() => {
      if (isConnected) {
        updateUptime();
      }
    }, 1000);

    return () => {
      if (socket) {
        socket.close();
      }
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
      }
      clearInterval(interval);
    };
  }, []);

  return {
    isConnected,
    isReceiving,
    connectionConfig,
    witsData,
    rawWitsMessages,
    connectionLogs,
    connectionStats,
    lastUpdateTime,
    connect,
    disconnect,
    updateConfig,
    testConnection,
  };
};

// Define types for WITS mappings
type WitsMappingItem = {
  name: string;
  channel: number;
  witsId: number;
  unit: string;
};

type CalculatedMappingItem = {
  name: string;
  source: string;
};

type WitsMappings = {
  drilling: WitsMappingItem[];
  directional: WitsMappingItem[];
  calculated: CalculatedMappingItem[];
};

// Default WITS mappings
const defaultWitsMappings: WitsMappings = {
  drilling: [
    { name: "Bit Depth", channel: 8, witsId: 1, unit: "ft" },
    { name: "Hook Load", channel: 12, witsId: 2, unit: "klbs" },
    { name: "WOB", channel: 16, witsId: 3, unit: "klbs" },
    { name: "ROP", channel: 20, witsId: 4, unit: "ft/hr" },
  ],
  directional: [
    { name: "Inclination", channel: 32, witsId: 5, unit: "deg" },
    { name: "Azimuth", channel: 36, witsId: 6, unit: "deg" },
    { name: "Tool Face", channel: 40, witsId: 7, unit: "deg" },
    { name: "Gamma", channel: 44, witsId: 8, unit: "API" },
  ],
  calculated: [
    { name: "TVD", source: "Calculated" },
    { name: "Northing", source: "Calculated" },
    { name: "Easting", source: "Calculated" },
    { name: "DLS", source: "Calculated" },
  ],
};

const WitsConfigPage = () => {
  const { toast } = useToast();
  const {
    isConnected,
    isReceiving,
    connectionConfig,
    witsData,
    rawWitsMessages,
    connectionLogs,
    connectionStats,
    lastUpdateTime,
    connect,
    disconnect,
    updateConfig,
    testConnection,
  } = useWitsConnection();

  const [activeTab, setActiveTab] = useState("connection");
  const [configForm, setConfigForm] = useState<WitsConfig>({
    ...connectionConfig,
    connectionType: "wits",
    heartbeatInterval: 15000,
    maxMissedPongs: 3,
    binaryType: "arraybuffer",
    proxyMode: false,
    tcpHost: "localhost",
    tcpPort: 5000,
    witsmlConfig: {
      url: "https://witsml.example.com/witsml/store",
      username: "",
      password: "",
      wellUid: "",
      wellboreUid: "",
      logUid: "REALTIME",
      pollingInterval: 10000,
      witsmlVersion: "1.4.1.1",
      requestTimeout: 30000,
    },
  });
  const [isTesting, setIsTesting] = useState(false);

  // State for WITS mappings
  const [witsMappings, setWitsMappings] =
    useState<WitsMappings>(defaultWitsMappings);

  // State for edit dialog
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [currentMappingType, setCurrentMappingType] = useState<
    "drilling" | "directional" | null
  >(null);
  const [currentMappingIndex, setCurrentMappingIndex] = useState<number | null>(
    null,
  );
  const [editChannelValue, setEditChannelValue] = useState(0);
  const [currentMapping, setCurrentMapping] = useState<WitsMappingItem | null>(
    null,
  );
  const [witsChannels, setWitsChannels] = useState<WitsChannel[]>([
    {
      id: 1,
      name: "Bit Depth",
      witsId: 1,
      channel: 8,
      unit: "ft",
      active: true,
      lastValue: 8452.6,
    },
    {
      id: 2,
      name: "Hook Load",
      witsId: 2,
      channel: 12,
      unit: "klbs",
      active: true,
      lastValue: 285.4,
    },
    {
      id: 3,
      name: "WOB",
      witsId: 3,
      channel: 16,
      unit: "klbs",
      active: true,
      lastValue: 18.5,
    },
    {
      id: 4,
      name: "ROP",
      witsId: 4,
      channel: 20,
      unit: "ft/hr",
      active: true,
      lastValue: 45.2,
    },
    {
      id: 5,
      name: "RPM",
      witsId: 5,
      channel: 24,
      unit: "rpm",
      active: true,
      lastValue: 120,
    },
    {
      id: 6,
      name: "Torque",
      witsId: 6,
      channel: 28,
      unit: "kft-lbs",
      active: true,
      lastValue: 16.8,
    },
    {
      id: 7,
      name: "SPP",
      witsId: 7,
      channel: 32,
      unit: "psi",
      active: true,
      lastValue: 3250,
    },
    {
      id: 8,
      name: "Flow Rate",
      witsId: 8,
      channel: 36,
      unit: "gpm",
      active: true,
      lastValue: 650,
    },
    {
      id: 9,
      name: "Mud Temp In",
      witsId: 9,
      channel: 40,
      unit: "°F",
      active: true,
      lastValue: 85.3,
    },
    {
      id: 10,
      name: "Mud Temp Out",
      witsId: 10,
      channel: 44,
      unit: "°F",
      active: true,
      lastValue: 92.7,
    },
  ]);

  // Update channel values when new WITS data arrives
  useEffect(() => {
    if (witsData.length > 0) {
      const latestRecord = witsData[0];

      setWitsChannels((prevChannels) =>
        prevChannels.map((channel) => {
          const value = latestRecord[channel.witsId];
          if (value !== undefined && typeof value === "number") {
            return {
              ...channel,
              lastValue: value,
              lastUpdate: latestRecord.timestamp,
            };
          }
          return channel;
        }),
      );
    }
  }, [witsData]);

  const toggleConnection = () => {
    if (isConnected) {
      disconnect();
    } else {
      connect();
    }
  };

  const handleConfigChange = (field: string, value: any) => {
    setConfigForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSaveConfig = () => {
    // Update the connection configuration with all form values including WebSocket specific options
    const updatedConfig = {
      ...configForm,
      // Ensure WebSocket specific options are included
      heartbeatInterval: configForm.heartbeatInterval,
      maxMissedPongs: configForm.maxMissedPongs,
      binaryType: configForm.binaryType,
      // Include proxy options
      proxyMode: configForm.proxyMode,
      tcpHost: configForm.tcpHost,
      tcpPort: configForm.tcpPort,
    };

    updateConfig(updatedConfig);

    // Log the configuration being saved
    console.log("Saving WITS configuration:", updatedConfig);
    if (updatedConfig.proxyMode) {
      const targetHost = updatedConfig.tcpHost || "localhost";
      const targetPort = updatedConfig.tcpPort || 5000;
      console.log(
        `WebSocket-to-TCP proxy enabled: ${targetHost}:${targetPort}`,
      );
    }

    toast({
      title: "Configuration Saved",
      description: "WITS connection settings have been updated.",
    });
  };

  // Handle opening the edit dialog
  const handleEditMapping = (
    type: "drilling" | "directional",
    index: number,
  ) => {
    setCurrentMappingType(type);
    setCurrentMappingIndex(index);
    const mapping = witsMappings[type][index];
    setCurrentMapping(mapping);
    setEditChannelValue(mapping.channel);
    setEditDialogOpen(true);
  };

  // Handle saving the channel edit
  const handleSaveChannelEdit = () => {
    if (currentMappingType === null || currentMappingIndex === null) return;

    // Create a deep copy of the mappings
    const newMappings = JSON.parse(
      JSON.stringify(witsMappings),
    ) as WitsMappings;

    // Update the channel value
    newMappings[currentMappingType][currentMappingIndex].channel =
      editChannelValue;

    // Update the state
    setWitsMappings(newMappings);
    setEditDialogOpen(false);

    toast({
      title: "Mapping Updated",
      description: `${currentMapping?.name} is now mapped to Channel ${editChannelValue}`,
    });
  };

  // Handle saving all mappings
  const handleSaveMappings = () => {
    // Here you would typically save the mappings to a backend or local storage
    // For now, we'll just show a toast
    toast({
      title: "Mappings Saved",
      description: "WITS parameter mappings have been updated.",
      variant: "default",
    });
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    const success = await testConnection();
    setIsTesting(false);

    if (success) {
      toast({
        title: "Connection Test Successful",
        description: `Successfully connected to ${configForm.ipAddress}:${configForm.port}`,
        variant: "default",
      });
    } else {
      toast({
        title: "Connection Test Failed",
        description: `Could not connect to ${configForm.ipAddress}:${configForm.port}`,
        variant: "destructive",
      });
    }
  };

  // Update form when connection config changes
  useEffect(() => {
    setConfigForm(connectionConfig);
  }, [connectionConfig]);

  const toggleChannelActive = (id: number) => {
    setWitsChannels((channels) =>
      channels.map((channel) =>
        channel.id === id ? { ...channel, active: !channel.active } : channel,
      ),
    );
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-200">
      <Navbar />
      <StatusBar />
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 gap-6">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-200">
              WITS Configuration
            </h1>
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className={`${isConnected ? "bg-green-900/30 text-green-400 border-green-800" : "bg-red-900/30 text-red-400 border-red-800"}`}
              >
                {isConnected ? "CONNECTED" : "DISCONNECTED"}
              </Badge>
              {isConnected && (
                <Badge
                  variant="outline"
                  className={`${isReceiving ? "bg-cyan-900/30 text-cyan-400 border-cyan-800 animate-pulse" : "bg-yellow-900/30 text-yellow-400 border-yellow-800"}`}
                >
                  {isReceiving ? "RECEIVING DATA" : "IDLE"}
                </Badge>
              )}
              <Button
                variant="outline"
                size="sm"
                className={`${isConnected ? "bg-red-900/30 text-red-400 border-red-800 hover:bg-red-800/30" : "bg-green-900/30 text-green-400 border-green-800 hover:bg-green-800/30"}`}
                onClick={toggleConnection}
              >
                {isConnected ? (
                  <>
                    <Unlink className="mr-2 h-4 w-4" />
                    Disconnect
                  </>
                ) : (
                  <>
                    <Link className="mr-2 h-4 w-4" />
                    Connect
                  </>
                )}
              </Button>
            </div>
          </div>

          <Tabs
            defaultValue="connection"
            value={activeTab}
            onValueChange={setActiveTab}
          >
            <TabsList className="bg-gray-800 mb-4">
              <TabsTrigger value="connection">Connection</TabsTrigger>
              <TabsTrigger value="database">Database</TabsTrigger>
              <TabsTrigger value="channels">WITS Channels</TabsTrigger>
              <TabsTrigger value="mapping">Parameter Mapping</TabsTrigger>
              <TabsTrigger value="logs">Connection Logs</TabsTrigger>
              <TabsTrigger value="raw">Raw WITS Messages</TabsTrigger>
            </TabsList>

            <TabsContent value="connection" className="space-y-4">
              {/* DatabaseManagement component moved to its own tab */}
              <Card className="bg-gray-900 border-gray-800 shadow-lg overflow-hidden">
                <CardHeader className="p-4 pb-2 border-b border-gray-800">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Server className="h-5 w-5 text-blue-400" />
                      <CardTitle className="text-lg font-medium text-gray-200">
                        WITS Server Configuration
                      </CardTitle>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-gray-800 border-gray-700 hover:bg-gray-700 text-gray-300"
                      onClick={handleSaveConfig}
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Save Configuration
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <Label
                          htmlFor="protocol"
                          className="text-sm text-gray-400"
                        >
                          Protocol
                        </Label>
                        <div className="flex gap-4 mt-1">
                          <div className="flex items-center space-x-2">
                            <input
                              type="radio"
                              id="wits"
                              name="connectionType"
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-700 bg-gray-800"
                              checked={configForm.connectionType !== "witsml"}
                              onChange={() =>
                                handleConfigChange("connectionType", "wits")
                              }
                            />
                            <Label
                              htmlFor="wits"
                              className="text-sm text-gray-300"
                            >
                              WITS
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input
                              type="radio"
                              id="witsml"
                              name="connectionType"
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-700 bg-gray-800"
                              checked={configForm.connectionType === "witsml"}
                              onChange={() =>
                                handleConfigChange("connectionType", "witsml")
                              }
                            />
                            <Label
                              htmlFor="witsml"
                              className="text-sm text-gray-300"
                            >
                              WITSML
                            </Label>
                          </div>
                        </div>

                        {configForm.connectionType !== "witsml" && (
                          <div className="flex gap-4 mt-3">
                            <div className="flex items-center space-x-2">
                              <input
                                type="radio"
                                id="tcp"
                                name="protocol"
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-700 bg-gray-800"
                                checked={configForm.protocol === "TCP"}
                                onChange={() =>
                                  handleConfigChange("protocol", "TCP")
                                }
                              />
                              <Label
                                htmlFor="tcp"
                                className="text-sm text-gray-300"
                              >
                                TCP/IP
                              </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <input
                                type="radio"
                                id="ws"
                                name="protocol"
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-700 bg-gray-800"
                                checked={configForm.protocol === "WS"}
                                onChange={() =>
                                  handleConfigChange("protocol", "WS")
                                }
                              />
                              <Label
                                htmlFor="ws"
                                className="text-sm text-gray-300"
                              >
                                WebSocket
                              </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <input
                                type="radio"
                                id="serial"
                                name="protocol"
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-700 bg-gray-800"
                                checked={configForm.protocol === "Serial"}
                                onChange={() =>
                                  handleConfigChange("protocol", "Serial")
                                }
                              />
                              <Label
                                htmlFor="serial"
                                className="text-sm text-gray-300"
                              >
                                Serial
                              </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <input
                                type="radio"
                                id="udp"
                                name="protocol"
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-700 bg-gray-800"
                                checked={configForm.protocol === "UDP"}
                                onChange={() =>
                                  handleConfigChange("protocol", "UDP")
                                }
                              />
                              <Label
                                htmlFor="udp"
                                className="text-sm text-gray-300"
                              >
                                UDP
                              </Label>
                            </div>
                          </div>
                        )}
                      </div>

                      {configForm.connectionType !== "witsml" ? (
                        <>
                          <div>
                            <Label
                              htmlFor="ipAddress"
                              className="text-sm text-gray-400"
                            >
                              IP Address
                            </Label>
                            <Input
                              id="ipAddress"
                              placeholder="192.168.1.100"
                              value={configForm.ipAddress}
                              onChange={(e) =>
                                handleConfigChange("ipAddress", e.target.value)
                              }
                              className="bg-gray-800 border-gray-700 text-gray-200 mt-1"
                            />
                          </div>

                          <div>
                            <Label
                              htmlFor="port"
                              className="text-sm text-gray-400"
                            >
                              Port
                            </Label>
                            <Input
                              id="port"
                              placeholder="8080"
                              type="number"
                              value={configForm.port}
                              onChange={(e) =>
                                handleConfigChange(
                                  "port",
                                  parseInt(e.target.value),
                                )
                              }
                              className="bg-gray-800 border-gray-700 text-gray-200 mt-1"
                            />
                          </div>

                          <div>
                            <Label
                              htmlFor="witsLevel"
                              className="text-sm text-gray-400"
                            >
                              WITS Level
                            </Label>
                            <div className="flex gap-4 mt-1">
                              <div className="flex items-center space-x-2">
                                <input
                                  type="radio"
                                  id="level0"
                                  name="witsLevel"
                                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-700 bg-gray-800"
                                  checked={configForm.witsLevel === "0"}
                                  onChange={() =>
                                    handleConfigChange("witsLevel", "0")
                                  }
                                />
                                <Label
                                  htmlFor="level0"
                                  className="text-sm text-gray-300"
                                >
                                  Level 0
                                </Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <input
                                  type="radio"
                                  id="level1"
                                  name="witsLevel"
                                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-700 bg-gray-800"
                                  checked={configForm.witsLevel === "1"}
                                  onChange={() =>
                                    handleConfigChange("witsLevel", "1")
                                  }
                                />
                                <Label
                                  htmlFor="level1"
                                  className="text-sm text-gray-300"
                                >
                                  Level 1
                                </Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <input
                                  type="radio"
                                  id="level2"
                                  name="witsLevel"
                                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-700 bg-gray-800"
                                  checked={configForm.witsLevel === "2"}
                                  onChange={() =>
                                    handleConfigChange("witsLevel", "2")
                                  }
                                />
                                <Label
                                  htmlFor="level2"
                                  className="text-sm text-gray-300"
                                >
                                  Level 2
                                </Label>
                              </div>
                            </div>
                          </div>
                        </>
                      ) : (
                        <>
                          <div>
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
                              value={configForm.witsmlConfig?.url || ""}
                              onChange={(e) =>
                                handleConfigChange("witsmlConfig", {
                                  ...configForm.witsmlConfig,
                                  url: e.target.value,
                                })
                              }
                              className="bg-gray-800 border-gray-700 text-gray-200 mt-1"
                              placeholder="https://witsml.server/store"
                            />
                            <p className="text-xs text-gray-400 mt-1">
                              Example: https://witsml.example.com/witsml/store
                            </p>
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
                                value={configForm.witsmlConfig?.username || ""}
                                onChange={(e) =>
                                  handleConfigChange("witsmlConfig", {
                                    ...configForm.witsmlConfig,
                                    username: e.target.value,
                                  })
                                }
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
                                value={configForm.witsmlConfig?.password || ""}
                                onChange={(e) =>
                                  handleConfigChange("witsmlConfig", {
                                    ...configForm.witsmlConfig,
                                    password: e.target.value,
                                  })
                                }
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
                                value={configForm.witsmlConfig?.wellUid || ""}
                                onChange={(e) =>
                                  handleConfigChange("witsmlConfig", {
                                    ...configForm.witsmlConfig,
                                    wellUid: e.target.value,
                                  })
                                }
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
                                value={
                                  configForm.witsmlConfig?.wellboreUid || ""
                                }
                                onChange={(e) =>
                                  handleConfigChange("witsmlConfig", {
                                    ...configForm.witsmlConfig,
                                    wellboreUid: e.target.value,
                                  })
                                }
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
                                value={
                                  configForm.witsmlConfig?.logUid || "REALTIME"
                                }
                                onChange={(e) =>
                                  handleConfigChange("witsmlConfig", {
                                    ...configForm.witsmlConfig,
                                    logUid: e.target.value,
                                  })
                                }
                                className="bg-gray-800 border-gray-700 text-gray-200"
                                placeholder="REALTIME"
                              />
                            </div>
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
                                  configForm.witsmlConfig?.witsmlVersion ||
                                  "1.4.1.1"
                                }
                                onValueChange={(value) =>
                                  handleConfigChange("witsmlConfig", {
                                    ...configForm.witsmlConfig,
                                    witsmlVersion: value,
                                  })
                                }
                              >
                                <SelectTrigger className="bg-gray-800 border-gray-700 text-gray-200">
                                  <SelectValue placeholder="Select WITSML version" />
                                </SelectTrigger>
                                <SelectContent className="bg-gray-800 border-gray-700">
                                  <SelectItem
                                    value="1.3.1.1"
                                    className="text-gray-200"
                                  >
                                    WITSML 1.3.1
                                  </SelectItem>
                                  <SelectItem
                                    value="1.4.1.1"
                                    className="text-gray-200"
                                  >
                                    WITSML 1.4.1
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label
                                  htmlFor="pollingInterval"
                                  className="text-sm text-gray-400"
                                >
                                  Polling Interval (ms)
                                </Label>
                                <Input
                                  id="pollingInterval"
                                  type="number"
                                  value={
                                    configForm.witsmlConfig?.pollingInterval ||
                                    10000
                                  }
                                  onChange={(e) =>
                                    handleConfigChange("witsmlConfig", {
                                      ...configForm.witsmlConfig,
                                      pollingInterval: parseInt(e.target.value),
                                    })
                                  }
                                  className="bg-gray-800 border-gray-700 text-gray-200"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label
                                  htmlFor="requestTimeout"
                                  className="text-sm text-gray-400"
                                >
                                  Request Timeout (ms)
                                </Label>
                                <Input
                                  id="requestTimeout"
                                  type="number"
                                  value={
                                    configForm.witsmlConfig?.requestTimeout ||
                                    30000
                                  }
                                  onChange={(e) =>
                                    handleConfigChange("witsmlConfig", {
                                      ...configForm.witsmlConfig,
                                      requestTimeout: parseInt(e.target.value),
                                    })
                                  }
                                  className="bg-gray-800 border-gray-700 text-gray-200"
                                />
                              </div>
                            </div>
                          </div>
                        </>
                      )}
                    </div>

                    <div className="space-y-4">
                      <div>
                        <Label className="text-sm text-gray-400">
                          Connection Options
                        </Label>
                        <div className="space-y-2 mt-1">
                          <div className="flex items-center space-x-2">
                            <Switch
                              id="autoConnect"
                              checked={configForm.autoConnect}
                              onCheckedChange={(checked) =>
                                handleConfigChange("autoConnect", checked)
                              }
                            />
                            <Label
                              htmlFor="autoConnect"
                              className="text-sm text-gray-300"
                            >
                              Auto-connect on startup
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Switch
                              id="reconnect"
                              checked={configForm.autoReconnect}
                              onCheckedChange={(checked) =>
                                handleConfigChange("autoReconnect", checked)
                              }
                            />
                            <Label
                              htmlFor="reconnect"
                              className="text-sm text-gray-300"
                            >
                              Auto-reconnect if connection lost
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Switch
                              id="logging"
                              checked={configForm.enableLogging}
                              onCheckedChange={(checked) =>
                                handleConfigChange("enableLogging", checked)
                              }
                            />
                            <Label
                              htmlFor="logging"
                              className="text-sm text-gray-300"
                            >
                              Enable connection logging
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Switch
                              id="dataLogging"
                              checked={configForm.logData}
                              onCheckedChange={(checked) =>
                                handleConfigChange("logData", checked)
                              }
                            />
                            <Label
                              htmlFor="dataLogging"
                              className="text-sm text-gray-300"
                            >
                              Log received data
                            </Label>
                          </div>
                        </div>
                      </div>

                      <div>
                        <Label
                          htmlFor="timeout"
                          className="text-sm text-gray-400"
                        >
                          Connection Timeout (seconds)
                        </Label>
                        <Input
                          id="timeout"
                          type="number"
                          placeholder="30"
                          value={configForm.timeout}
                          onChange={(e) =>
                            handleConfigChange(
                              "timeout",
                              parseInt(e.target.value),
                            )
                          }
                          className="bg-gray-800 border-gray-700 text-gray-200 mt-1"
                        />
                      </div>

                      <div>
                        <Label
                          htmlFor="retryInterval"
                          className="text-sm text-gray-400"
                        >
                          Retry Interval (seconds)
                        </Label>
                        <Input
                          id="retryInterval"
                          type="number"
                          placeholder="5"
                          value={configForm.retryInterval}
                          onChange={(e) =>
                            handleConfigChange(
                              "retryInterval",
                              parseInt(e.target.value),
                            )
                          }
                          className="bg-gray-800 border-gray-700 text-gray-200 mt-1"
                        />
                      </div>

                      {configForm.protocol === "WS" && (
                        <div className="border-t border-gray-800 pt-4 mt-4">
                          <Label className="text-sm text-gray-400 mb-2 block">
                            WebSocket Specific Options
                          </Label>

                          <div className="space-y-3">
                            <div>
                              <Label
                                htmlFor="heartbeatInterval"
                                className="text-sm text-gray-400"
                              >
                                Heartbeat Interval (ms)
                              </Label>
                              <Input
                                id="heartbeatInterval"
                                type="number"
                                placeholder="15000"
                                value={configForm.heartbeatInterval || 15000}
                                onChange={(e) =>
                                  handleConfigChange(
                                    "heartbeatInterval",
                                    parseInt(e.target.value),
                                  )
                                }
                                className="bg-gray-800 border-gray-700 text-gray-200 mt-1"
                              />
                              <p className="text-xs text-gray-500 mt-1">
                                Time between ping messages (default: 15000ms)
                              </p>
                            </div>

                            <div>
                              <Label
                                htmlFor="maxMissedPongs"
                                className="text-sm text-gray-400"
                              >
                                Max Missed Pongs
                              </Label>
                              <Input
                                id="maxMissedPongs"
                                type="number"
                                placeholder="3"
                                value={configForm.maxMissedPongs || 3}
                                onChange={(e) =>
                                  handleConfigChange(
                                    "maxMissedPongs",
                                    parseInt(e.target.value),
                                  )
                                }
                                className="bg-gray-800 border-gray-700 text-gray-200 mt-1"
                              />
                              <p className="text-xs text-gray-500 mt-1">
                                Number of missed pongs before reconnect
                                (default: 3)
                              </p>
                            </div>

                            <div>
                              <Label
                                htmlFor="binaryType"
                                className="text-sm text-gray-400"
                              >
                                Binary Type
                              </Label>
                              <div className="flex gap-4 mt-1">
                                <div className="flex items-center space-x-2">
                                  <input
                                    type="radio"
                                    id="arraybuffer"
                                    name="binaryType"
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-700 bg-gray-800"
                                    checked={
                                      (configForm.binaryType ||
                                        "arraybuffer") === "arraybuffer"
                                    }
                                    onChange={() =>
                                      handleConfigChange(
                                        "binaryType",
                                        "arraybuffer",
                                      )
                                    }
                                  />
                                  <Label
                                    htmlFor="arraybuffer"
                                    className="text-sm text-gray-300"
                                  >
                                    ArrayBuffer
                                  </Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <input
                                    type="radio"
                                    id="blob"
                                    name="binaryType"
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-700 bg-gray-800"
                                    checked={
                                      (configForm.binaryType ||
                                        "arraybuffer") === "blob"
                                    }
                                    onChange={() =>
                                      handleConfigChange("binaryType", "blob")
                                    }
                                  />
                                  <Label
                                    htmlFor="blob"
                                    className="text-sm text-gray-300"
                                  >
                                    Blob
                                  </Label>
                                </div>
                              </div>
                              <p className="text-xs text-gray-500 mt-1">
                                Binary data format (default: arraybuffer)
                              </p>
                            </div>

                            <div className="border-t border-gray-800 pt-4 mt-4">
                              <Label className="text-sm text-gray-400 mb-2 block">
                                WebSocket-to-TCP Proxy Options
                              </Label>

                              <div className="flex items-center space-x-2 mb-3">
                                <Switch
                                  id="proxyMode"
                                  checked={configForm.proxyMode || false}
                                  onCheckedChange={(checked) =>
                                    handleConfigChange("proxyMode", checked)
                                  }
                                />
                                <Label
                                  htmlFor="proxyMode"
                                  className="text-sm text-gray-300"
                                >
                                  Use WebSocket-to-TCP Proxy
                                </Label>
                              </div>

                              {configForm.proxyMode && (
                                <div className="space-y-3 pl-4 border-l-2 border-blue-800/30">
                                  <div>
                                    <Label
                                      htmlFor="tcpHost"
                                      className="text-sm text-gray-400"
                                    >
                                      TCP Host
                                    </Label>
                                    <Input
                                      id="tcpHost"
                                      placeholder="localhost"
                                      value={configForm.tcpHost || "localhost"}
                                      onChange={(e) =>
                                        handleConfigChange(
                                          "tcpHost",
                                          e.target.value,
                                        )
                                      }
                                      className="bg-gray-800 border-gray-700 text-gray-200 mt-1"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                      TCP server hostname/IP to connect to via
                                      proxy
                                    </p>
                                  </div>

                                  <div>
                                    <Label
                                      htmlFor="tcpPort"
                                      className="text-sm text-gray-400"
                                    >
                                      TCP Port
                                    </Label>
                                    <Input
                                      id="tcpPort"
                                      type="number"
                                      placeholder="5000"
                                      value={configForm.tcpPort || 5000}
                                      onChange={(e) =>
                                        handleConfigChange(
                                          "tcpPort",
                                          parseInt(e.target.value),
                                        )
                                      }
                                      className="bg-gray-800 border-gray-700 text-gray-200 mt-1"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                      TCP server port to connect to via proxy
                                    </p>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-gray-800 flex justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className={`h-3 w-3 rounded-full ${isConnected ? "bg-green-500" : "bg-red-500"}`}
                      ></div>
                      <span className="text-sm text-gray-400">
                        Status: {isConnected ? "Connected" : "Disconnected"}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        className="bg-gray-800 border-gray-700 hover:bg-gray-700 text-gray-300"
                        onClick={handleTestConnection}
                        disabled={isTesting}
                      >
                        {isTesting ? (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            Testing...
                          </>
                        ) : (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Test Connection
                          </>
                        )}
                      </Button>
                      <Button
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                        onClick={handleSaveConfig}
                      >
                        <Save className="h-4 w-4 mr-2" />
                        Apply Changes
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-900 border-gray-800 shadow-lg overflow-hidden">
                <CardHeader className="p-4 pb-2 border-b border-gray-800">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Database className="h-5 w-5 text-green-400" />
                      <CardTitle className="text-lg font-medium text-gray-200">
                        Connection Status
                      </CardTitle>
                    </div>
                    <div className="flex gap-2">
                      {!isConnected ? (
                        <Button
                          className="bg-green-600 hover:bg-green-700 text-white"
                          onClick={connect}
                        >
                          <Link className="h-4 w-4 mr-2" />
                          Connect
                        </Button>
                      ) : (
                        <Button
                          className="bg-red-600 hover:bg-red-700 text-white"
                          onClick={disconnect}
                        >
                          <Unlink className="h-4 w-4 mr-2" />
                          Disconnect
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-3 bg-gray-800/50 rounded-md border border-gray-800">
                      <div className="text-sm text-gray-400 mb-1">
                        Connection Status
                      </div>
                      <div className="flex items-center gap-2">
                        {isConnected ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-500" />
                        )}
                        <span className="text-lg font-medium">
                          {isConnected ? "Connected" : "Disconnected"}
                        </span>
                      </div>
                    </div>

                    <div className="p-3 bg-gray-800/50 rounded-md border border-gray-800">
                      <div className="text-sm text-gray-400 mb-1">
                        Data Reception
                      </div>
                      <div className="flex items-center gap-2">
                        {isReceiving ? (
                          <CheckCircle className="h-5 w-5 text-cyan-500" />
                        ) : (
                          <AlertTriangle className="h-5 w-5 text-yellow-500" />
                        )}
                        <span className="text-lg font-medium">
                          {isReceiving ? "Receiving Data" : "No Data"}
                        </span>
                      </div>
                    </div>

                    <div className="p-3 bg-gray-800/50 rounded-md border border-gray-800">
                      <div className="text-sm text-gray-400 mb-1">
                        Last Update
                      </div>
                      <div className="flex items-center gap-2">
                        <RefreshCw className="h-5 w-5 text-blue-500" />
                        <span className="text-lg font-medium">
                          {lastUpdateTime.toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 p-3 bg-gray-800/50 rounded-md border border-gray-800">
                    <div className="text-sm text-gray-400 mb-2">
                      Connection Statistics
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <div className="text-xs text-gray-500">Uptime</div>
                        <div className="text-sm font-medium text-green-400">
                          {connectionStats.uptime}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">
                          Packets Received
                        </div>
                        <div className="text-sm font-medium text-blue-400">
                          {connectionStats.packetsReceived}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">Data Rate</div>
                        <div className="text-sm font-medium text-cyan-400">
                          {connectionStats.dataRate}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">Errors</div>
                        <div className="text-sm font-medium text-red-400">
                          {connectionStats.errors}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="channels" className="space-y-4">
              <Card className="bg-gray-900 border-gray-800 shadow-lg overflow-hidden">
                <CardHeader className="p-4 pb-2 border-b border-gray-800">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Wifi className="h-5 w-5 text-yellow-400" />
                      <CardTitle className="text-lg font-medium text-gray-200">
                        WITS Channel Configuration
                      </CardTitle>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-gray-800 border-gray-700 hover:bg-gray-700 text-gray-300"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Export
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-gray-800 border-gray-700 hover:bg-gray-700 text-gray-300"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Import
                      </Button>
                      <Button
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Channel
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gray-800/50 border-b border-gray-800">
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                            ID
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                            Name
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                            WITS ID
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                            Channel
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                            Unit
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                            Active
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                            Last Value
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                            Last Update
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-800">
                        {witsChannels.map((channel) => (
                          <tr key={channel.id} className="hover:bg-gray-800/30">
                            <td className="px-4 py-2 text-sm">{channel.id}</td>
                            <td className="px-4 py-2 text-sm font-medium">
                              {channel.name}
                            </td>
                            <td className="px-4 py-2 text-sm">
                              {channel.witsId}
                            </td>
                            <td className="px-4 py-2 text-sm">
                              {channel.channel}
                            </td>
                            <td className="px-4 py-2 text-sm">
                              {channel.unit}
                            </td>
                            <td className="px-4 py-2 text-sm">
                              <Switch
                                checked={channel.active}
                                onCheckedChange={() =>
                                  toggleChannelActive(channel.id)
                                }
                              />
                            </td>
                            <td className="px-4 py-2 text-sm">
                              <span
                                className={`font-mono ${channel.active ? "text-cyan-400" : "text-gray-500"}`}
                              >
                                {channel.active
                                  ? channel.lastValue.toFixed(1)
                                  : "--"}
                              </span>
                            </td>
                            <td className="px-4 py-2 text-sm">
                              <span className="text-xs text-gray-500">
                                {channel.lastUpdate?.toLocaleTimeString() ||
                                  "--"}
                              </span>
                            </td>
                            <td className="px-4 py-2 text-sm">
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-gray-400 hover:text-gray-300 hover:bg-gray-800"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-gray-400 hover:text-red-400 hover:bg-gray-800"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="mapping" className="space-y-4">
              <Card className="bg-gray-900 border-gray-800 shadow-lg overflow-hidden">
                <CardHeader className="p-4 pb-2 border-b border-gray-800">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Settings className="h-5 w-5 text-purple-400" />
                      <CardTitle className="text-lg font-medium text-gray-200">
                        Parameter Mapping Configuration
                      </CardTitle>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-gray-800 border-gray-700 hover:bg-gray-700 text-gray-300"
                        onClick={() => {
                          // Reset to default mappings
                          setWitsMappings(defaultWitsMappings);
                          toast({
                            title: "Mappings Reset",
                            description:
                              "WITS mappings have been reset to defaults.",
                          });
                        }}
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Reset to Defaults
                      </Button>
                      <Button
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                        onClick={() => {
                          // Save mappings
                          handleSaveMappings();
                        }}
                      >
                        <Save className="h-4 w-4 mr-2" />
                        Save Mappings
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="space-y-4">
                    <div className="bg-gray-800/50 p-4 rounded-md border border-gray-800">
                      <h3 className="text-sm font-medium text-gray-300 mb-3">
                        WITS to Application Mapping
                      </h3>
                      <p className="text-xs text-gray-500 mb-4">
                        Configure how WITS channels map to application
                        parameters. Click on a channel value to edit it.
                      </p>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-3 bg-gray-800/80 rounded-md">
                          <h4 className="text-xs font-medium text-gray-400 mb-2">
                            Drilling Parameters
                          </h4>
                          <div className="space-y-2">
                            {witsMappings.drilling.map((item, index) => (
                              <div
                                key={`drilling-${index}`}
                                className="flex justify-between text-xs items-center"
                              >
                                <span className="text-gray-500">
                                  {item.name}:
                                </span>
                                <div
                                  className="flex items-center cursor-pointer bg-gray-700/50 px-2 py-1 rounded hover:bg-gray-700"
                                  onClick={() =>
                                    handleEditMapping("drilling", index)
                                  }
                                >
                                  <span className="text-blue-400">
                                    Channel {item.channel}
                                  </span>
                                  <Edit className="h-3 w-3 ml-1 text-gray-400" />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="p-3 bg-gray-800/80 rounded-md">
                          <h4 className="text-xs font-medium text-gray-400 mb-2">
                            Directional Data
                          </h4>
                          <div className="space-y-2">
                            {witsMappings.directional.map((item, index) => (
                              <div
                                key={`directional-${index}`}
                                className="flex justify-between text-xs items-center"
                              >
                                <span className="text-gray-500">
                                  {item.name}:
                                </span>
                                <div
                                  className="flex items-center cursor-pointer bg-gray-700/50 px-2 py-1 rounded hover:bg-gray-700"
                                  onClick={() =>
                                    handleEditMapping("directional", index)
                                  }
                                >
                                  <span className="text-green-400">
                                    Channel {item.channel}
                                  </span>
                                  <Edit className="h-3 w-3 ml-1 text-gray-400" />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="p-3 bg-gray-800/80 rounded-md">
                          <h4 className="text-xs font-medium text-gray-400 mb-2">
                            Calculated Values
                          </h4>
                          <div className="space-y-2">
                            {witsMappings.calculated.map((item, index) => (
                              <div
                                key={`calculated-${index}`}
                                className="flex justify-between text-xs items-center"
                              >
                                <span className="text-gray-500">
                                  {item.name}:
                                </span>
                                <span className="text-purple-400">
                                  {item.source}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 p-3 bg-blue-900/20 border border-blue-800 rounded-md">
                        <div className="flex items-center gap-2 text-xs text-blue-400 font-medium mb-1">
                          <CheckCircle className="h-3 w-3" />
                          Auto-Mapping Active
                        </div>
                        <p className="text-xs text-gray-400">
                          The system is automatically mapping WITS channels to
                          application parameters based on standard industry
                          configurations. You can override these mappings by
                          editing them above.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Edit Mapping Dialog */}
              <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                <DialogContent className="bg-gray-900 border border-gray-800 text-gray-200 sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle className="text-gray-200">
                      Edit WITS Mapping
                    </DialogTitle>
                    <DialogDescription className="text-gray-400">
                      Update the WITS channel for {currentMapping?.name}
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="channel" className="text-gray-400">
                        WITS Channel
                      </Label>
                      <Input
                        id="channel"
                        type="number"
                        value={editChannelValue}
                        onChange={(e) =>
                          setEditChannelValue(parseInt(e.target.value) || 0)
                        }
                        className="bg-gray-800 border-gray-700 text-gray-200"
                      />
                    </div>
                  </div>

                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setEditDialogOpen(false)}
                      className="bg-gray-800 border-gray-700 hover:bg-gray-700 text-gray-300"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSaveChannelEdit}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      Save Changes
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </TabsContent>

            <TabsContent value="logs" className="space-y-4">
              <Card className="bg-gray-900 border-gray-800 shadow-lg overflow-hidden">
                <CardHeader className="p-4 pb-2 border-b border-gray-800">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Server className="h-5 w-5 text-orange-400" />
                      <CardTitle className="text-lg font-medium text-gray-200">
                        Connection Logs
                      </CardTitle>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-gray-800 border-gray-700 hover:bg-gray-700 text-gray-300"
                        onClick={() => window.location.reload()}
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Refresh
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-gray-800 border-gray-700 hover:bg-gray-700 text-gray-300"
                        onClick={() => {
                          const logs = connectionLogs.join("\n");
                          const blob = new Blob([logs], { type: "text/plain" });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement("a");
                          a.href = url;
                          a.download = "wits-connection-logs.txt";
                          a.click();
                        }}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Export Logs
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <ScrollArea className="h-[400px]">
                    <div className="p-4 font-mono text-xs space-y-1">
                      {connectionLogs.map((log, index) => {
                        // Determine log color based on content
                        let logClass = "text-gray-400";
                        if (log.includes("Error")) {
                          logClass = "text-red-400";
                        } else if (log.includes("Warning")) {
                          logClass = "text-yellow-400";
                        } else if (
                          log.includes("Connection established") ||
                          log.includes("re-established")
                        ) {
                          logClass = "text-green-400";
                        } else if (
                          log.includes("protocol initialized") ||
                          log.includes("Started receiving")
                        ) {
                          logClass = "text-cyan-400";
                        } else if (log.includes("Attempting to reconnect")) {
                          logClass = "text-yellow-400";
                        }

                        return (
                          <div key={index} className={logClass}>
                            {log}
                          </div>
                        );
                      })}

                      {connectionLogs.length === 0 && (
                        <div className="text-gray-500 italic">
                          No connection logs available. Connect to WITS to see
                          logs.
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="database" className="space-y-4">
              <Card className="bg-gray-900 border-gray-800 shadow-lg overflow-hidden">
                <CardHeader className="p-4 pb-2 border-b border-gray-800">
                  <div className="flex items-center gap-2">
                    <Database className="h-5 w-5 text-blue-400" />
                    <CardTitle className="text-lg font-medium text-gray-200">
                      Database Management
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-4">
                  <p className="text-gray-400">
                    Database management has been moved to its own dedicated tab.
                    Please use the Database tab in the main navigation to manage
                    your databases.
                  </p>
                  <div className="mt-4">
                    <Button
                      onClick={() =>
                        (window.location.href = "/witsconfig?tab=database")
                      }
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <Database className="h-4 w-4 mr-2" />
                      Go to Database Management
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="raw" className="space-y-4">
              <Card className="bg-gray-900 border-gray-800 shadow-lg overflow-hidden">
                <CardHeader className="p-4 pb-2 border-b border-gray-800">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Database className="h-5 w-5 text-orange-400" />
                      <CardTitle className="text-lg font-medium text-gray-200">
                        Raw WITS Messages
                      </CardTitle>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-gray-800 border-gray-700 hover:bg-gray-700 text-gray-300"
                        onClick={() => window.location.reload()}
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Refresh
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-gray-800 border-gray-700 hover:bg-gray-700 text-gray-300"
                        onClick={() => {
                          const logs = rawWitsMessages.join("\n");
                          const blob = new Blob([logs], { type: "text/plain" });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement("a");
                          a.href = url;
                          a.download = "wits-raw-messages.txt";
                          a.click();
                        }}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Export Messages
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <ScrollArea className="h-[400px]">
                    <div className="p-4 font-mono text-xs space-y-1">
                      {rawWitsMessages.map((message, index) => (
                        <div key={index} className="text-gray-400">
                          {message.substring(0, 500)}
                          {message.length > 500 ? "..." : ""}
                        </div>
                      ))}

                      {rawWitsMessages.length === 0 && (
                        <div className="text-gray-500 italic">
                          No raw WITS messages received yet. Connect to WITS to
                          see data.
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default WitsConfigPage;
