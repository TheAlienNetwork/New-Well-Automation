import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

interface WitsConnectionConfig {
  ipAddress: string;
  port: number;
  protocol: "TCP" | "UDP" | "Serial";
  witsLevel: "0" | "1" | "2";
  autoConnect: boolean;
  autoReconnect: boolean;
  enableLogging: boolean;
  logData: boolean;
  timeout: number;
  retryInterval: number;
}

interface WitsData {
  // Drilling parameters
  bitDepth: number;
  hookLoad: number;
  wob: number;
  rop: number;
  rpm: number;
  torque: number;
  spp: number;
  flowRate: number;
  mudTempIn: number;
  mudTempOut: number;
  blockHeight: number;

  // Directional data
  inclination: number;
  azimuth: number;
  toolFace: number;
  gamma: number;
  magneticField: number;
  gravity: number;
  dip: number;
  toolTemp: number;

  // Calculated values
  tvd: number;
  northing: number;
  easting: number;
  dls: number;
  motorYield: number;
  doglegNeeded: number;
  slideSeen: number;
  slideAhead: number;
  projectedInc: number;
  projectedAz: number;

  // Status
  timestamp: string;
  signalQuality: number;
  batteryLevel: number;
  vibration: {
    lateral: number;
    axial: number;
    torsional: number;
  };
}

interface WitsContextType {
  isConnected: boolean;
  isReceiving: boolean;
  connectionConfig: WitsConnectionConfig;
  witsData: WitsData;
  connectionLogs: string[];
  connect: () => void;
  disconnect: () => void;
  updateConfig: (config: Partial<WitsConnectionConfig>) => void;
  testConnection: () => Promise<boolean>;
  lastUpdateTime: Date;
}

const defaultWitsConfig: WitsConnectionConfig = {
  ipAddress: "192.168.1.100",
  port: 8080,
  protocol: "TCP",
  witsLevel: "1",
  autoConnect: true,
  autoReconnect: true,
  enableLogging: true,
  logData: true,
  timeout: 30,
  retryInterval: 5,
};

const defaultWitsData: WitsData = {
  // Drilling parameters
  bitDepth: 8475.3,
  hookLoad: 285.4,
  wob: 18.5,
  rop: 45.2,
  rpm: 120,
  torque: 16.8,
  spp: 3250,
  flowRate: 650,
  mudTempIn: 85.3,
  mudTempOut: 92.7,
  blockHeight: 42.8,

  // Directional data
  inclination: 32.5,
  azimuth: 275.8,
  toolFace: 45.2,
  gamma: 67.5,
  magneticField: 48.2,
  gravity: 0.98,
  dip: 62.4,
  toolTemp: 165.3,

  // Calculated values
  tvd: 7150.2,
  northing: 1250.5,
  easting: 850.3,
  dls: 2.3,
  motorYield: 2.8,
  doglegNeeded: 3.2,
  slideSeen: 1.5,
  slideAhead: 1.7,
  projectedInc: 47.3,
  projectedAz: 182.5,

  // Status
  timestamp: new Date().toISOString(),
  signalQuality: 85,
  batteryLevel: 72,
  vibration: {
    lateral: 42,
    axial: 18,
    torsional: 12,
  },
};

const WitsContext = createContext<WitsContextType | undefined>(undefined);

export const WitsProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isReceiving, setIsReceiving] = useState(false);
  const [connectionConfig, setConnectionConfig] =
    useState<WitsConnectionConfig>(defaultWitsConfig);
  const [witsData, setWitsData] = useState<WitsData>(defaultWitsData);
  const [connectionLogs, setConnectionLogs] = useState<string[]>([]);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date>(new Date());
  const [simulationInterval, setSimulationInterval] = useState<number | null>(
    null,
  );

  // Connect to WITS server
  const connect = () => {
    if (isConnected) return;

    addLog(
      `Attempting to connect to ${connectionConfig.ipAddress}:${connectionConfig.port}`,
    );

    // In a real implementation, this would establish a socket connection
    // For this demo, we'll simulate a connection after a short delay
    setTimeout(() => {
      setIsConnected(true);
      addLog(
        `Connection established to ${connectionConfig.ipAddress}:${connectionConfig.port}`,
      );
      addLog(`WITS Level ${connectionConfig.witsLevel} protocol initialized`);

      // Start receiving data after connection
      setTimeout(() => {
        setIsReceiving(true);
        addLog("Started receiving data");
        startDataSimulation();
      }, 1000);
    }, 2000);
  };

  // Disconnect from WITS server
  const disconnect = () => {
    if (!isConnected) return;

    addLog("Disconnecting from WITS server");

    // Stop data simulation
    if (simulationInterval) {
      clearInterval(simulationInterval);
      setSimulationInterval(null);
    }

    setIsReceiving(false);
    setIsConnected(false);
    addLog("Disconnected from WITS server");
  };

  // Update connection configuration
  const updateConfig = (config: Partial<WitsConnectionConfig>) => {
    setConnectionConfig((prev) => ({ ...prev, ...config }));
    addLog("Connection configuration updated");
  };

  // Test connection to WITS server
  const testConnection = async (): Promise<boolean> => {
    addLog(
      `Testing connection to ${connectionConfig.ipAddress}:${connectionConfig.port}`,
    );

    // In a real implementation, this would attempt to establish a temporary connection
    // For this demo, we'll simulate a successful connection after a short delay
    return new Promise((resolve) => {
      setTimeout(() => {
        const success = Math.random() > 0.2; // 80% chance of success
        if (success) {
          addLog("Connection test successful");
        } else {
          addLog("Connection test failed");
        }
        resolve(success);
      }, 2000);
    });
  };

  // Add log entry
  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleString();
    setConnectionLogs((prev) => [
      `[${timestamp}] ${message}`,
      ...prev.slice(0, 99),
    ]);
  };

  // Simulate WITS data updates
  const startDataSimulation = () => {
    if (simulationInterval) {
      clearInterval(simulationInterval);
    }

    const interval = window.setInterval(() => {
      if (!isConnected || !isReceiving) return;

      // Simulate data packet reception
      const packetSize = Math.floor(Math.random() * 200) + 100;
      addLog(`Received ${packetSize} bytes`);

      // Update WITS data with realistic variations
      updateWitsData();

      // Update last update time
      setLastUpdateTime(new Date());

      // Occasionally simulate connection issues
      if (Math.random() < 0.02) {
        // 2% chance of connection issue
        simulateConnectionIssue();
      }
    }, 2000);

    setSimulationInterval(interval);
  };

  // Update WITS data with realistic variations
  const updateWitsData = () => {
    setWitsData((prev) => {
      // Create small variations in the data
      const variation = (base: number, percent: number) => {
        const change = base * (percent / 100) * (Math.random() * 2 - 1);
        return base + change;
      };

      // Calculate new TVD based on bit depth and inclination
      const newInclination = variation(prev.inclination, 1);
      const newBitDepth = variation(prev.bitDepth, 0.5);
      const newTvd = newBitDepth * Math.cos((newInclination * Math.PI) / 180);

      // Calculate new northing and easting based on azimuth
      const newAzimuth = variation(prev.azimuth, 1);
      const horizontalDistance =
        newBitDepth * Math.sin((newInclination * Math.PI) / 180);
      const newNorthing =
        prev.northing +
        horizontalDistance * Math.cos((newAzimuth * Math.PI) / 180) * 0.01;
      const newEasting =
        prev.easting +
        horizontalDistance * Math.sin((newAzimuth * Math.PI) / 180) * 0.01;

      return {
        ...prev,
        // Drilling parameters
        bitDepth: newBitDepth,
        hookLoad: variation(prev.hookLoad, 2),
        wob: variation(prev.wob, 5),
        rop: variation(prev.rop, 10),
        rpm: variation(prev.rpm, 3),
        torque: variation(prev.torque, 7),
        spp: variation(prev.spp, 3),
        flowRate: variation(prev.flowRate, 2),
        mudTempIn: variation(prev.mudTempIn, 1),
        mudTempOut: variation(prev.mudTempOut, 1),
        blockHeight: variation(prev.blockHeight, 5),

        // Directional data
        inclination: newInclination,
        azimuth: newAzimuth,
        toolFace: variation(prev.toolFace, 8),
        gamma: variation(prev.gamma, 15),
        magneticField: variation(prev.magneticField, 2),
        gravity: variation(prev.gravity, 1),
        dip: variation(prev.dip, 2),
        toolTemp: variation(prev.toolTemp, 3),

        // Calculated values
        tvd: newTvd,
        northing: newNorthing,
        easting: newEasting,
        dls: variation(prev.dls, 10),
        motorYield: variation(prev.motorYield, 5),
        doglegNeeded: variation(prev.doglegNeeded, 8),
        slideSeen: variation(prev.slideSeen, 10),
        slideAhead: variation(prev.slideAhead, 12),
        projectedInc: variation(prev.projectedInc, 3),
        projectedAz: variation(prev.projectedAz, 2),

        // Status
        timestamp: new Date().toISOString(),
        signalQuality: Math.min(
          100,
          Math.max(50, variation(prev.signalQuality, 10)),
        ),
        batteryLevel: Math.min(100, Math.max(0, prev.batteryLevel - 0.1)),
        vibration: {
          lateral: Math.min(
            100,
            Math.max(0, variation(prev.vibration.lateral, 20)),
          ),
          axial: Math.min(
            100,
            Math.max(0, variation(prev.vibration.axial, 15)),
          ),
          torsional: Math.min(
            100,
            Math.max(0, variation(prev.vibration.torsional, 15)),
          ),
        },
      };
    });
  };

  // Simulate connection issues
  const simulateConnectionIssue = () => {
    const issueType = Math.random();

    if (issueType < 0.3) {
      // Packet checksum mismatch
      addLog("Warning: Packet checksum mismatch, retrying");
    } else if (issueType < 0.6) {
      // Timeout
      addLog("Error: Connection timeout");
      setIsReceiving(false);

      // Auto-reconnect if enabled
      if (connectionConfig.autoReconnect) {
        let retryCount = 1;
        const maxRetries = 5;

        const attemptReconnect = () => {
          addLog(`Attempting to reconnect (${retryCount}/${maxRetries})`);

          setTimeout(() => {
            if (Math.random() > 0.3 || retryCount === maxRetries) {
              // Reconnection successful
              setIsReceiving(true);
              addLog("Connection re-established");
              addLog(
                `WITS Level ${connectionConfig.witsLevel} protocol initialized`,
              );
              addLog("Started receiving data");
            } else {
              // Reconnection failed, try again
              retryCount++;
              attemptReconnect();
            }
          }, connectionConfig.retryInterval * 1000);
        };

        attemptReconnect();
      }
    } else {
      // Data corruption
      addLog("Warning: Data corruption detected, packet discarded");
    }
  };

  // Auto-connect on startup if enabled
  useEffect(() => {
    if (connectionConfig.autoConnect) {
      connect();
    }

    return () => {
      if (simulationInterval) {
        clearInterval(simulationInterval);
      }
    };
  }, []);

  return (
    <WitsContext.Provider
      value={{
        isConnected,
        isReceiving,
        connectionConfig,
        witsData,
        connectionLogs,
        connect,
        disconnect,
        updateConfig,
        testConnection,
        lastUpdateTime,
      }}
    >
      {children}
    </WitsContext.Provider>
  );
};

export const useWits = () => {
  const context = useContext(WitsContext);
  if (context === undefined) {
    throw new Error("useWits must be used within a WitsProvider");
  }
  return context;
};
