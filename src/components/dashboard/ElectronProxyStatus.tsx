import { useEffect, useState } from "react";
import {
  isElectron,
  getProxyStatus,
  restartProxy,
  getProxyConfig,
} from "@/lib/electronBridge";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle, RefreshCw, Server } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function ElectronProxyStatus() {
  const [proxyRunning, setProxyRunning] = useState<boolean | null>(null);
  const [isRestarting, setIsRestarting] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [proxyConfig, setProxyConfig] = useState<{
    host: string;
    port: number;
  } | null>(null);
  const [showLogs, setShowLogs] = useState(false);

  useEffect(() => {
    if (!isElectron()) return;

    // Check proxy status initially
    checkProxyStatus();
    fetchProxyConfig();

    // Set up log listeners
    const electronBridge = window.electron;
    if (electronBridge) {
      electronBridge.onProxyLog((data) => {
        setLogs((prev) => [...prev, `[INFO] ${data}`].slice(-100));
      });

      electronBridge.onProxyError((data) => {
        setLogs((prev) => [...prev, `[ERROR] ${data}`].slice(-100));
      });
    }

    // Check status periodically
    const interval = setInterval(() => {
      checkProxyStatus();
      fetchProxyConfig();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const fetchProxyConfig = async () => {
    if (!isElectron()) return;

    try {
      const config = await getProxyConfig();
      if (config) {
        setProxyConfig(config);
      }
    } catch (error) {
      console.error("Error fetching proxy config:", error);
    }
  };

  const checkProxyStatus = async () => {
    if (!isElectron()) return;

    try {
      const status = await getProxyStatus();
      setProxyRunning(status?.running ?? false);
    } catch (error) {
      console.error("Error checking proxy status:", error);
      setProxyRunning(false);
    }
  };

  const handleRestartProxy = async () => {
    if (!isElectron()) return;

    setIsRestarting(true);
    try {
      await restartProxy();
      await checkProxyStatus();
      await fetchProxyConfig();
    } catch (error) {
      console.error("Error restarting proxy:", error);
    } finally {
      setIsRestarting(false);
    }
  };

  if (!isElectron()) {
    return null;
  }

  return (
    <div className="bg-gray-900 text-white p-4 rounded-lg">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {proxyRunning ? (
            <CheckCircle className="text-green-500" size={18} />
          ) : (
            <AlertCircle className="text-red-500" size={18} />
          )}
          <h3 className="font-medium">
            WITS Proxy: {proxyRunning ? "Running" : "Stopped"}
          </h3>
          {proxyRunning && proxyConfig && (
            <Badge
              variant="outline"
              className="ml-2 bg-blue-900/30 text-blue-400 border-blue-800"
            >
              {proxyConfig.host}:{proxyConfig.port}
            </Badge>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRestartProxy}
          disabled={isRestarting}
        >
          {isRestarting ? (
            <RefreshCw className="mr-1 h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="mr-1 h-4 w-4" />
          )}
          Restart Proxy
        </Button>
      </div>

      {proxyRunning && proxyConfig && (
        <div className="mt-2 mb-3 text-xs text-gray-400">
          <div className="flex items-center gap-2">
            <Server className="h-3 w-3" />
            <span>WebSocket-to-TCP Proxy ready for connections</span>
          </div>
          <div className="mt-1 grid grid-cols-2 gap-x-4 gap-y-1">
            <div>
              <span className="text-gray-500">WebSocket URL:</span>{" "}
              <span className="text-gray-300 font-mono">
                ws://{proxyConfig.host}:{proxyConfig.port}/wits
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="mt-2">
        <Button
          variant="ghost"
          size="sm"
          className="text-xs text-gray-400 hover:text-gray-300"
          onClick={() => setShowLogs(!showLogs)}
        >
          {showLogs ? "Hide Logs" : "Show Logs"}
        </Button>
      </div>

      {showLogs && logs.length > 0 && (
        <div className="mt-2">
          <div className="text-xs font-mono bg-black/50 p-2 rounded h-24 overflow-y-auto">
            {logs.map((log, i) => (
              <div
                key={i}
                className={
                  log.includes("[ERROR]") ? "text-red-400" : "text-gray-300"
                }
              >
                {log}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
