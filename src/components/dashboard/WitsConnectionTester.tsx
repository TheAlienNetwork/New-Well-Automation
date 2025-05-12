import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useWits } from "@/context/WitsContext";

interface WitsConnectionTesterProps {
  onClose?: () => void;
}

const WitsConnectionTester = ({ onClose }: WitsConnectionTesterProps) => {
  const {
    connectionConfig,
    updateConfig,
    connect,
    disconnect,
    isConnected,
    lastError,
  } = useWits();

  const [proxyHost, setProxyHost] = useState(
    connectionConfig.ipAddress || "192.168.1.100",
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
  const [useProxy, setUseProxy] = useState(connectionConfig.proxyMode || false);
  const [logs, setLogs] = useState<string[]>([]);

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
        <CardTitle className="text-gray-100">WITS Connection Tester</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
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
        </div>
      </CardContent>
    </Card>
  );
};

export default WitsConnectionTester;
