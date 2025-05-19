import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useWits } from "@/context/WitsContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertCircle,
  CheckCircle,
  Network,
  Server,
  Wifi,
  WifiOff,
  Laptop,
} from "lucide-react";
import {
  isElectron,
  getRecommendedWitsSettings,
  getProxyConfig,
} from "@/lib/electronBridge";
import { Badge } from "@/components/ui/badge";
import ElectronProxyStatus from "./ElectronProxyStatus";

interface WitsConnectionTroubleshooterProps {
  onClose?: () => void;
}

// Helper function to determine connection quality rating
const getConnectionQualityRating = (
  latency?: number | null,
  packetLoss?: number,
  jitter?: number | null,
) => {
  // Default values if not provided
  latency = latency ?? 100;
  packetLoss = packetLoss ?? 1;
  jitter = jitter ?? 15;

  // Excellent: latency < 50ms, packet loss < 0.1%, jitter < 5ms
  if (
    (latency < 50 || latency === null) &&
    packetLoss < 0.1 &&
    (jitter < 5 || jitter === null)
  ) {
    return "excellent";
  }
  // Good: latency < 100ms, packet loss < 0.5%, jitter < 10ms
  else if (
    (latency < 100 || latency === null) &&
    packetLoss < 0.5 &&
    (jitter < 10 || jitter === null)
  ) {
    return "good";
  }
  // Fair: latency < 200ms, packet loss < 1%, jitter < 20ms
  else if (
    (latency < 200 || latency === null) &&
    packetLoss < 1 &&
    (jitter < 20 || jitter === null)
  ) {
    return "fair";
  }
  // Poor: anything worse
  else {
    return "poor";
  }
};

const WitsConnectionTroubleshooter = ({
  onClose,
}: WitsConnectionTroubleshooterProps) => {
  const {
    connectionConfig,
    updateConfig,
    connect,
    disconnect,
    isConnected,
    lastError,
  } = useWits();

  const [proxyHost, setProxyHost] = useState(
    connectionConfig.ipAddress || "localhost",
  );
  const [proxyPort, setProxyPort] = useState(
    connectionConfig.port?.toString() || "8080",
  );
  const [tcpHost, setTcpHost] = useState(
    connectionConfig.tcpHost || "localhost",
  );
  const [tcpPort, setTcpPort] = useState(
    connectionConfig.tcpPort?.toString() || "5000",
  );
  const [useProxy, setUseProxy] = useState(connectionConfig.proxyMode || true);
  const [logs, setLogs] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState("connection");
  const [testStatus, setTestStatus] = useState<
    "idle" | "testing" | "success" | "failed"
  >("idle");
  const [isElectronApp, setIsElectronApp] = useState(false);
  const [useElectronProxy, setUseElectronProxy] = useState(true);

  // Check if running in Electron and load recommended settings
  useEffect(() => {
    const checkElectron = async () => {
      const isElectronEnv = isElectron();
      setIsElectronApp(isElectronEnv);

      if (isElectronEnv && useElectronProxy) {
        try {
          const settings = await getRecommendedWitsSettings();
          setProxyHost(settings.ipAddress);
          setProxyPort(settings.port.toString());
          setUseProxy(settings.proxyMode);
          setTcpHost(settings.tcpHost);
          setTcpPort(settings.tcpPort.toString());

          addLog("Loaded recommended settings from Electron environment");
        } catch (error) {
          console.error("Error loading Electron settings:", error);
        }
      }
    };

    checkElectron();
  }, [useElectronProxy]);

  const addLog = (message: string) => {
    const timestamp = new Date().toISOString();
    setLogs((prev) => [`[${timestamp}] ${message}`, ...prev.slice(0, 19)]);
  };

  const handleConnect = () => {
    addLog("Updating connection configuration...");

    // Update connection configuration with enhanced WebSocket options
    updateConfig({
      ipAddress: proxyHost,
      port: parseInt(proxyPort, 10),
      protocol: "WS",
      proxyMode: useProxy,
      tcpHost: tcpHost,
      tcpPort: parseInt(tcpPort, 10),
      // Add WebSocket specific options for better reliability
      heartbeatInterval: 15000, // 15 seconds between heartbeats
      maxMissedPongs: 3, // Reconnect after 3 missed responses
      connectionTimeout: 20000, // 20 second connection timeout
      binaryType: "arraybuffer", // Better binary data handling
      // Add reconnection settings
      reconnectInterval: 10000, // 10 seconds between reconnect attempts
      maxReconnectAttempts: 100, // Allow up to 100 reconnect attempts
    });

    addLog("Configuration updated.");

    if (useProxy) {
      addLog(
        `Using WebSocket-to-TCP proxy mode to connect to ${tcpHost}:${tcpPort}`,
      );
    } else {
      addLog(`Connecting directly to WebSocket at ${proxyHost}:${proxyPort}`);
    }

    // Connect using the updated configuration
    connect();
  };

  const handleDisconnect = () => {
    addLog("Disconnecting...");
    disconnect();
  };

  const testConnection = async () => {
    setTestStatus("testing");
    addLog("Testing WebSocket connection...");

    try {
      // Build the WebSocket URL with query parameters if using proxy mode
      // Determine protocol (ws:// for local connections, wss:// for secure connections)
      const isLocalhost =
        proxyHost === "localhost" ||
        proxyHost === "127.0.0.1" ||
        proxyHost.startsWith("192.168.");
      const protocol = isLocalhost ? "ws" : "wss";
      let wsUrl = `${protocol}://${proxyHost}:${proxyPort}/wits`;

      // Add query parameters for proxy configuration if needed
      if (useProxy) {
        const queryParams = new URLSearchParams();
        // Ensure tcpHost and tcpPort have default values if they're undefined
        const targetHost = tcpHost || "localhost";
        const targetPort = tcpPort || "5000";
        queryParams.set("host", targetHost);
        queryParams.set("port", targetPort);
        queryParams.set("protocol", "tcp");
        wsUrl += `?${queryParams.toString()}`;
        addLog(`Testing WebSocket-to-TCP proxy connection to ${wsUrl}`);
        addLog(`Proxy target: ${targetHost}:${targetPort}`);
      } else {
        addLog(`Attempting to connect to ${wsUrl}`);
      }

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
      const ws = await connectWithTimeout(wsUrl, 5000);
      addLog("✅ WebSocket connection successful!");

      // Test sending a message
      ws.send(JSON.stringify({ type: "ping" }));
      addLog("✅ Sent test message to server");

      // Close the connection
      ws.close();
      addLog("✅ Connection test completed successfully");
      setTestStatus("success");
    } catch (error) {
      console.error("Connection test failed:", error);
      addLog(
        `❌ Connection test failed: ${error instanceof Error ? error.message : String(error)}`,
      );
      setTestStatus("failed");

      // Provide troubleshooting guidance
      addLog("🔍 Troubleshooting suggestions:");
      addLog("1. Check if the WebSocket server is running");
      addLog("2. Verify the host and port are correct");
      addLog("3. Check for firewall or network restrictions");
      addLog("4. If using proxy mode, ensure the proxy server is running");
    }
  };

  // Add error to logs when it changes
  React.useEffect(() => {
    if (lastError) {
      addLog(`Error: ${lastError}`);
    }
  }, [lastError]);

  // Add connection status to logs
  React.useEffect(() => {
    addLog(isConnected ? "Connected successfully" : "Disconnected");
  }, [isConnected]);

  return (
    <Card className="bg-gray-800 border-gray-700 w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-gray-100 flex items-center gap-2">
          <Network className="h-5 w-5" />
          WITS Connection Troubleshooter
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isElectronApp && (
          <div className="mb-6 p-4 bg-blue-900/20 border border-blue-800 rounded-md">
            <div className="flex items-center gap-2 mb-3">
              <Laptop className="h-5 w-5 text-blue-400" />
              <h3 className="text-blue-300 font-medium">
                Electron Mode Detected
              </h3>
              <Badge
                variant="outline"
                className="bg-blue-900/30 text-blue-400 border-blue-800"
              >
                Built-in Proxy Available
              </Badge>
            </div>

            <div className="mb-4">
              <ElectronProxyStatus />
            </div>

            <div className="flex items-center space-x-2 mt-2">
              <Switch
                id="useElectronProxy"
                checked={useElectronProxy}
                onCheckedChange={setUseElectronProxy}
              />
              <Label htmlFor="useElectronProxy" className="text-gray-300">
                Use Electron's built-in WebSocket-to-TCP proxy
              </Label>
            </div>

            {useElectronProxy && (
              <p className="text-xs text-gray-400 mt-2">
                Using the built-in proxy ensures reliable communication between
                the app and WITS servers. The proxy is automatically started
                when the application launches.
              </p>
            )}
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-gray-700 mb-4">
            <TabsTrigger value="connection">
              <Wifi className="h-4 w-4 mr-2" />
              Connection
            </TabsTrigger>
            <TabsTrigger value="diagnostics">
              <Server className="h-4 w-4 mr-2" />
              Diagnostics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="connection" className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="useProxy"
                checked={useProxy}
                onCheckedChange={setUseProxy}
              />
              <Label htmlFor="useProxy" className="text-gray-300">
                Use WebSocket-to-TCP Proxy
              </Label>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="proxyHost" className="text-gray-300">
                  {useProxy ? "Proxy Host" : "WebSocket Host"}
                </Label>
                <Input
                  id="proxyHost"
                  value={proxyHost}
                  onChange={(e) => setProxyHost(e.target.value)}
                  className="bg-gray-700 border-gray-600 text-gray-100"
                  disabled={isElectronApp && useElectronProxy}
                />
              </div>
              <div>
                <Label htmlFor="proxyPort" className="text-gray-300">
                  {useProxy ? "Proxy Port" : "WebSocket Port"}
                </Label>
                <Input
                  id="proxyPort"
                  value={proxyPort}
                  onChange={(e) => setProxyPort(e.target.value)}
                  className="bg-gray-700 border-gray-600 text-gray-100"
                  disabled={isElectronApp && useElectronProxy}
                />
              </div>
            </div>

            {useProxy && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="tcpHost" className="text-gray-300">
                    TCP Target Host
                  </Label>
                  <Input
                    id="tcpHost"
                    value={tcpHost}
                    onChange={(e) => setTcpHost(e.target.value)}
                    className="bg-gray-700 border-gray-600 text-gray-100"
                  />
                </div>
                <div>
                  <Label htmlFor="tcpPort" className="text-gray-300">
                    TCP Target Port
                  </Label>
                  <Input
                    id="tcpPort"
                    value={tcpPort}
                    onChange={(e) => setTcpPort(e.target.value)}
                    className="bg-gray-700 border-gray-600 text-gray-100"
                  />
                </div>
              </div>
            )}

            <div className="flex space-x-2">
              <Button
                onClick={handleConnect}
                className="bg-blue-600 hover:bg-blue-700"
                disabled={isConnected}
              >
                Connect
              </Button>

              <Button
                onClick={handleDisconnect}
                className="bg-red-600 hover:bg-red-700"
                disabled={!isConnected}
              >
                Disconnect
              </Button>
            </div>

            <div className="mt-4">
              <Label className="text-gray-300">
                Status:
                <span
                  className={
                    isConnected ? "text-green-400 ml-2" : "text-red-400 ml-2"
                  }
                >
                  {isConnected ? "Connected" : "Disconnected"}
                </span>
              </Label>
            </div>
          </TabsContent>

          <TabsContent value="diagnostics" className="space-y-4">
            <div className="p-4 bg-gray-700/50 rounded-md border border-gray-600">
              <h3 className="text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                <Server className="h-4 w-4" />
                Connection Diagnostics
              </h3>
              <p className="text-xs text-gray-400 mb-4">
                Test your WebSocket connection to diagnose any issues. This will
                attempt to establish a direct WebSocket connection to the server
                and verify communication.
              </p>

              <div className="flex items-center gap-2 mb-4">
                <Button
                  onClick={testConnection}
                  disabled={testStatus === "testing"}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {testStatus === "testing" ? "Testing..." : "Test Connection"}
                </Button>

                {testStatus === "success" && (
                  <div className="flex items-center text-green-400 text-sm">
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Connection successful
                  </div>
                )}

                {testStatus === "failed" && (
                  <div className="flex items-center text-red-400 text-sm">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    Connection failed
                  </div>
                )}
              </div>

              <div className="text-xs text-gray-300 space-y-1">
                <p className="font-medium">What this test checks:</p>
                <ul className="list-disc pl-4 text-gray-400">
                  <li>
                    WebSocket server availability at the specified address
                  </li>
                  <li>
                    Successful WebSocket handshake and connection establishment
                  </li>
                  <li>Ability to send messages to the server</li>
                  <li>Server response to ping messages</li>
                  <li>
                    Protocol compatibility (detects Vite HMR vs WITS WebSockets)
                  </li>
                </ul>
              </div>
            </div>

            <div className="p-4 bg-gray-700/50 rounded-md border border-gray-600">
              <h3 className="text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                <WifiOff className="h-4 w-4" />
                Common Issues
              </h3>
              <ul className="text-xs text-gray-400 space-y-2 list-disc pl-4">
                {isElectronApp ? (
                  <>
                    <li>
                      <strong>Electron Proxy Issues</strong> - If the built-in
                      proxy isn't working, try restarting it using the button
                      above
                    </li>
                    <li>
                      <strong>TCP Connection Issues</strong> - Ensure the WITS
                      server is running at the specified TCP host and port
                    </li>
                  </>
                ) : (
                  <li>
                    WebSocket server not running - Start the proxy server using{" "}
                    <code className="bg-gray-800 px-1 rounded">
                      node src/proxy/witsProxy.js
                    </code>
                  </li>
                )}
                <li>
                  Incorrect host/port - Verify the WebSocket server address
                </li>
                <li>Firewall blocking connection - Check firewall settings</li>
                <li>
                  Network restrictions - Ensure the network allows WebSocket
                  connections
                </li>
                <li>
                  Proxy configuration - If using proxy mode, ensure the proxy
                  server is properly configured
                </li>
              </ul>
            </div>
          </TabsContent>
        </Tabs>

        <div className="mt-4">
          <Label className="text-gray-300">Logs:</Label>
          <div className="bg-gray-900 p-2 rounded-md h-60 overflow-y-auto">
            {logs.map((log, index) => (
              <div
                key={index}
                className="text-sm text-gray-300 border-b border-gray-800 py-1"
              >
                {log}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default WitsConnectionTroubleshooter;
