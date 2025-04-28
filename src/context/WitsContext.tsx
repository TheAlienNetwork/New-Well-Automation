import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useRef,
} from "react";
import { witsConnection } from "@/lib/witsConnection";

export interface WitsDataType {
  timestamp: string;
  bitDepth: number;
  holeDepth: number;
  rop: number;
  wob: number;
  hookload: number;
  pumpPressure: number;
  flowRate: number;
  rotaryTorque: number;
  rotaryRpm: number;
  gamma: number;
  inclination: number;
  azimuth: number;
  toolFace: number;
  temperature: number;
  vibration: {
    lateral: number;
    axial: number;
    torsional: number;
  };
  motorYield: number;
  doglegNeeded: number;
  slideSeen: number;
  slideAhead: number;
  projectedInc: number;
  projectedAz: number;
  dls: number;
  magneticField: number;
  gravity: number;
  signalQuality: number;
  batteryLevel: number;
  toolTemp: number;
  [key: number]: number | string | object; // Allow for dynamic WITS channel access
}

interface WitsMappingItem {
  name: string;
  channel: number;
  witsId: number;
  unit: string;
}

interface CalculatedMappingItem {
  name: string;
  source: string;
}

export interface WitsMappings {
  drilling: WitsMappingItem[];
  directional: WitsMappingItem[];
  calculated: CalculatedMappingItem[];
  custom?: WitsMappingItem[];
}

interface WitsmlConfig {
  url: string;
  username: string;
  password: string;
  wellUid: string;
  wellboreUid: string;
  logUid: string;
  pollingInterval: number;
}

interface ConnectionConfigType {
  ipAddress: string;
  port: number;
  protocol: string;
  autoConnect: boolean;
  witsmlConfig: WitsmlConfig;
  connectionType: "wits" | "witsml";
}

interface WitsContextType {
  isConnected: boolean;
  isReceiving: boolean;
  witsData: WitsDataType;
  connect: (
    host?: string,
    port?: number,
    protocol?: string,
    additionalOptions?: any,
  ) => void;
  disconnect: () => void;
  lastError: string | null;
  clearError: () => void;
  sendCommand: (command: string, params?: any) => void;
  connectionConfig: ConnectionConfigType;
  updateConfig: (config: Partial<ConnectionConfigType>) => void;
  witsMappings: WitsMappings;
  updateWitsMappings: (mappings: WitsMappings) => boolean;
  lastUpdateTime: Date;
  connectionType?: "wits" | "witsml";
}

const defaultWitsData: WitsDataType = {
  timestamp: new Date().toISOString(),
  bitDepth: 0,
  holeDepth: 0,
  rop: 0,
  wob: 0,
  hookload: 0,
  pumpPressure: 0,
  flowRate: 0,
  rotaryTorque: 0,
  rotaryRpm: 0,
  gamma: 0,
  inclination: 0,
  azimuth: 0,
  toolFace: 0,
  temperature: 0,
  vibration: {
    lateral: 0,
    axial: 0,
    torsional: 0,
  },
  motorYield: 0,
  doglegNeeded: 0,
  slideSeen: 0,
  slideAhead: 0,
  projectedInc: 0,
  projectedAz: 0,
  dls: 0,
  magneticField: 0,
  gravity: 0,
  signalQuality: 85,
  batteryLevel: 75,
  toolTemp: 165,
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

const defaultConnectionConfig: ConnectionConfigType = {
  ipAddress: "localhost",
  port: 5000,
  protocol: "TCP",
  autoConnect: false,
  witsmlConfig: {
    url: "",
    username: "",
    password: "",
    wellUid: "",
    wellboreUid: "",
    logUid: "",
    pollingInterval: 10000,
  },
  connectionType: "wits",
};

const WitsContext = createContext<WitsContextType | undefined>(undefined);

export function WitsProvider({ children }: { children: ReactNode }) {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isReceiving, setIsReceiving] = useState<boolean>(false);
  const [witsData, setWitsData] = useState<WitsDataType>(defaultWitsData);
  const [lastError, setLastError] = useState<string | null>(null);
  const [connectionConfig, setConnectionConfig] =
    useState<ConnectionConfigType>(defaultConnectionConfig);
  const [witsMappings, setWitsMappings] =
    useState<WitsMappings>(defaultWitsMappings);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date>(new Date());
  const dataReceivedRef = useRef<boolean>(false);

  // Set up WITS connection handlers
  useEffect(() => {
    // Handle connection status changes
    const handleConnectionChange = (connected: boolean) => {
      setIsConnected(connected);
      if (!connected) {
        setIsReceiving(false);
        dataReceivedRef.current = false;
      }
    };

    // Handle incoming WITS data
    const handleWitsData = (data: WitsDataType) => {
      setWitsData(data);
      setLastUpdateTime(new Date());
      if (!dataReceivedRef.current) {
        setIsReceiving(true);
        dataReceivedRef.current = true;
      }
    };

    // Handle connection errors
    const handleError = (error: string | null) => {
      setLastError(error);
    };

    // Register event handlers
    witsConnection.onConnectionChange(handleConnectionChange);
    witsConnection.onData(handleWitsData);
    witsConnection.onError(handleError);

    // Initialize WITS mappings in the connection manager
    witsConnection.updateWitsMappings(witsMappings);

    // Clean up event handlers on unmount
    return () => {
      witsConnection.removeConnectionCallback(handleConnectionChange);
      witsConnection.removeDataCallback(handleWitsData);
      witsConnection.removeErrorCallback(handleError);
    };
  }, []);

  const updateConfig = (config: Partial<ConnectionConfigType>) => {
    setConnectionConfig((prev) => ({ ...prev, ...config }));
  };

  const updateWitsMappings = (mappings: WitsMappings) => {
    try {
      // Validate mappings before updating
      if (!mappings || !mappings.drilling || !mappings.directional) {
        throw new Error("Invalid WITS mappings structure");
      }

      // Ensure all required fields are present in each mapping
      const validateMappingItem = (
        item: WitsMappingItem,
        type: string,
        index: number,
      ) => {
        if (!item.name)
          throw new Error(`Missing name in ${type} mapping at index ${index}`);
        if (item.channel === undefined)
          throw new Error(
            `Missing channel in ${type} mapping for ${item.name}`,
          );
        if (item.witsId === undefined)
          throw new Error(`Missing witsId in ${type} mapping for ${item.name}`);
        if (!item.unit)
          throw new Error(`Missing unit in ${type} mapping for ${item.name}`);
      };

      // Validate drilling mappings
      mappings.drilling.forEach((item, index) =>
        validateMappingItem(item, "drilling", index),
      );

      // Validate directional mappings
      mappings.directional.forEach((item, index) =>
        validateMappingItem(item, "directional", index),
      );

      // Update state with validated mappings
      setWitsMappings(mappings);
      console.log("WITS mappings updated:", mappings);

      // Update mappings in the WITS connection manager
      witsConnection.updateWitsMappings(mappings);

      // Clear any previous errors
      setLastError(null);

      return true;
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Unknown error updating WITS mappings";
      console.error("Error updating WITS mappings:", errorMessage);
      setLastError(errorMessage);
      return false;
    }
  };

  const connect = (
    host?: string,
    port?: number,
    protocol?: string,
    additionalOptions?: any,
  ) => {
    const connectHost = host || connectionConfig.ipAddress;
    const connectPort = port || connectionConfig.port;
    const connectProtocol = (
      protocol || connectionConfig.protocol
    ).toLowerCase() as "tcp" | "udp" | "serial";

    console.log(
      `Connecting to WITS server at ${connectHost}:${connectPort} using ${connectProtocol}`,
    );

    // Update the connection config in state if parameters were provided
    if (host || port || protocol) {
      setConnectionConfig((prev) => ({
        ...prev,
        ipAddress: connectHost,
        port: connectPort,
        protocol: connectProtocol.toUpperCase(),
      }));
    }

    // Prepare connection options
    const options: any = {
      host: connectHost,
      port: connectPort,
      protocol: connectProtocol,
      reconnectInterval: 30000, // Significantly increased reconnect interval
      maxReconnectAttempts: 50, // Significantly increased max reconnect attempts
    };

    // Add additional options for serial connections
    if (connectProtocol === "serial" && additionalOptions) {
      options.serialPort = additionalOptions.serialPort;
      options.baudRate = additionalOptions.baudRate;
    }

    // Update connection options and connect
    witsConnection.updateOptions(options);
    witsConnection.connect();
  };

  const disconnect = () => {
    console.log("Disconnecting from WITS server");
    witsConnection.disconnect();
  };

  const clearError = () => {
    setLastError(null);
  };

  const sendCommand = (command: string, params?: any) => {
    witsConnection.sendCommand(command, params);
  };

  return (
    <WitsContext.Provider
      value={{
        isConnected,
        isReceiving,
        witsData,
        connect,
        disconnect,
        lastError,
        clearError,
        sendCommand,
        connectionConfig,
        updateConfig,
        witsMappings,
        updateWitsMappings,
        lastUpdateTime,
        connectionType: connectionConfig.connectionType,
      }}
    >
      {children}
    </WitsContext.Provider>
  );
}

export function useWits() {
  const context = useContext(WitsContext);
  if (context === undefined) {
    throw new Error("useWits must be used within a WitsProvider");
  }
  return context;
}
