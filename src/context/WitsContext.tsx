import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useRef,
} from "react";
import { witsConnection } from "@/lib/witsConnection";
import { witsmlConnection } from "@/lib/witsmlConnection";
import { getWell } from "@/lib/database";
import { useUser } from "@/context/UserContext";

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
  wellId?: string;
  wellName?: string;
  rigName?: string;
  sensorOffset?: number;
  source?: string;
  [key: number]: number | string | object; // Allow for dynamic WITS channel access
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
  witsmlVersion?: string; // Optional WITSML version (1.3.1.1 or 1.4.1.1)
  requestTimeout?: number; // Optional timeout for WITSML requests in ms
}

interface ConnectionConfigType {
  ipAddress: string;
  port: number;
  protocol: string;
  autoConnect: boolean;
  witsmlConfig: WitsmlConfig;
  connectionType: "wits" | "witsml";
  wellId?: string;
  wellName?: string;
  rigName?: string;
  sensorOffset?: number;
  // WebSocket specific options
  heartbeatInterval?: number;
  maxMissedPongs?: number;
  connectionTimeout?: number;
  binaryType?: "blob" | "arraybuffer";
  // WebSocket-to-TCP proxy options
  proxyMode?: boolean;
  tcpHost?: string;
  tcpPort?: number;
}

export interface WitsMappingItem {
  name: string;
  channel: number;
  witsId: number;
  unit: string;
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
  clearWitsData: () => boolean;
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
  port: typeof window !== "undefined" ? 80 : 5000, // Default to port 80 for browser WebSocket
  protocol: typeof window !== "undefined" ? "WS" : "TCP", // Default to WebSocket for browser
  autoConnect: false,
  witsmlConfig: {
    url: "",
    username: "",
    password: "",
    wellUid: "",
    wellboreUid: "",
    logUid: "",
    pollingInterval: 10000,
    witsmlVersion: "1.4.1.1", // Default to WITSML 1.4.1
    requestTimeout: 30000, // 30 second timeout for requests
  },
  connectionType: "wits",
  // WebSocket specific defaults
  heartbeatInterval: 15000,
  maxMissedPongs: 3,
  connectionTimeout: 20000,
};

const WitsContext = createContext<WitsContextType | undefined>(undefined);

// Define the provider component
const WitsProvider = ({ children }: { children: ReactNode }) => {
  const { userProfile } = useUser();
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
  const wellDataFetchedRef = useRef<boolean>(false);

  // Set up connection handlers for both WITS and WITSML
  useEffect(() => {
    // Handle connection status changes
    const handleConnectionChange = (connected: boolean) => {
      setIsConnected(connected);
      if (!connected) {
        setIsReceiving(false);
        dataReceivedRef.current = false;
      }
    };

    // Handle incoming data
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

    // Register event handlers for WITS
    witsConnection.onConnectionChange(handleConnectionChange);
    witsConnection.onData(handleWitsData);
    witsConnection.onError(handleError);
    witsConnection.updateWitsMappings(witsMappings);

    // Register event handlers for WITSML
    witsmlConnection.onConnectionChange(handleConnectionChange);
    witsmlConnection.onData(handleWitsData);
    witsmlConnection.onError(handleError);
    witsmlConnection.updateWitsMappings(witsMappings);

    // Clean up event handlers on unmount
    return () => {
      // Clean up WITS handlers
      witsConnection.removeConnectionCallback(handleConnectionChange);
      witsConnection.removeDataCallback(handleWitsData);
      witsConnection.removeErrorCallback(handleError);

      // Clean up WITSML handlers
      witsmlConnection.removeConnectionCallback(handleConnectionChange);
      witsmlConnection.removeDataCallback(handleWitsData);
      witsmlConnection.removeErrorCallback(handleError);
    };
  }, []);

  // Fetch well data from database when currentWellId changes
  useEffect(() => {
    const fetchWellData = async () => {
      if (userProfile.currentWellId && !wellDataFetchedRef.current) {
        try {
          const wellData = await getWell(userProfile.currentWellId);
          if (wellData) {
            // Update connection config with well data
            setConnectionConfig((prev) => ({
              ...prev,
              wellId: wellData.id,
              wellName: wellData.name,
              rigName: wellData.rig_name || "",
              sensorOffset: wellData.sensor_offset || 0,
            }));

            console.log("Fetched well data for WITS connection:", wellData);
            wellDataFetchedRef.current = true;
          }
        } catch (error) {
          console.error("Error fetching well data for WITS connection:", error);
        }
      }
    };

    fetchWellData();
  }, [userProfile.currentWellId]);

  const updateConfig = (config: Partial<ConnectionConfigType>) => {
    setConnectionConfig((prev) => ({ ...prev, ...config }));

    // If we're already connected, update the connection with new well data
    if (
      witsConnection.isConnected() &&
      (config.wellId !== undefined ||
        config.wellName !== undefined ||
        config.rigName !== undefined ||
        config.sensorOffset !== undefined)
    ) {
      const wellOptions: any = {};

      // Only include properties that are defined in the config update
      if (config.wellId !== undefined) wellOptions.wellId = config.wellId;
      if (config.wellName !== undefined) wellOptions.wellName = config.wellName;
      if (config.rigName !== undefined) wellOptions.rigName = config.rigName;
      if (config.sensorOffset !== undefined)
        wellOptions.sensorOffset = config.sensorOffset;

      // Update the connection with new well data
      witsConnection.updateOptions(wellOptions);
      console.log("Updated WITS connection with new well data:", wellOptions);
    }
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

      // Validate custom mappings if present
      if (mappings.custom) {
        mappings.custom.forEach((item, index) =>
          validateMappingItem(item, "custom", index),
        );
      }

      // Update state with validated mappings
      setWitsMappings(mappings);
      console.log("WITS mappings updated:", mappings);

      // Update mappings in both connection managers
      witsConnection.updateWitsMappings(mappings);
      witsmlConnection.updateWitsMappings(mappings);

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

  /**
   * Connect to WITS or WITSML server with enhanced error handling and connection options
   * @param host - Server hostname or IP address
   * @param port - Server port number
   * @param protocol - Connection protocol (tcp, udp, serial, ws)
   * @param additionalOptions - Protocol-specific options
   */
  const connect = (
    host?: string,
    port?: number,
    protocol?: string,
    additionalOptions?: any,
  ) => {
    // Clear any previous errors before attempting to connect
    setLastError(null);

    // Check if we're using WITSML connection
    if (connectionConfig.connectionType === "witsml") {
      console.log(
        `Connecting to WITSML server at ${connectionConfig.witsmlConfig.url}`,
      );

      try {
        // Update WITSML connection options
        witsmlConnection.updateOptions({
          url: connectionConfig.witsmlConfig.url,
          username: connectionConfig.witsmlConfig.username,
          password: connectionConfig.witsmlConfig.password,
          wellUid: connectionConfig.witsmlConfig.wellUid,
          wellboreUid: connectionConfig.witsmlConfig.wellboreUid,
          logUid: connectionConfig.witsmlConfig.logUid,
          pollingInterval: connectionConfig.witsmlConfig.pollingInterval,
          witsmlVersion: connectionConfig.witsmlConfig.witsmlVersion,
          requestTimeout: connectionConfig.witsmlConfig.requestTimeout,
          wellId: connectionConfig.wellId,
          wellName: connectionConfig.wellName,
          rigName: connectionConfig.rigName,
          sensorOffset: connectionConfig.sensorOffset,
        });

        // Connect to WITSML server
        witsmlConnection.connect();

        // Set a timeout to check if we've successfully connected
        setTimeout(() => {
          if (!witsmlConnection.isConnected()) {
            setLastError(
              "WITSML connection attempt timed out. Please check server availability and credentials.",
            );
          }
        }, 15000); // 15 second timeout for initial WITSML connection
      } catch (error) {
        setLastError(
          `WITSML connection error: ${error instanceof Error ? error.message : String(error)}`,
        );
      }

      return;
    }

    // Standard WITS connection
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

    // Validate connection parameters
    if (!connectHost || connectHost.trim() === "") {
      setLastError("Host cannot be empty");
      return;
    }

    if (!connectPort || connectPort <= 0 || connectPort > 65535) {
      setLastError("Port must be between 1 and 65535");
      return;
    }

    // Check if running in Electron environment
    const isElectronEnv =
      typeof window !== "undefined" && window.electron !== undefined;

    // Prepare connection options with optimized settings for production use
    const options: any = {
      host: connectHost,
      port: connectPort,
      protocol: connectProtocol,
      reconnectInterval: connectionConfig.reconnectInterval || 10000, // 10 seconds between reconnect attempts
      maxReconnectAttempts: connectionConfig.maxReconnectAttempts || 100, // Allow up to 100 reconnect attempts
      delimiter: connectProtocol === "tcp" ? "\r\n" : "\n", // Use CRLF for TCP
      // Add protocol-specific optimizations
      keepAlive: true, // Enable TCP keepalive
      keepAliveInterval: 30000, // 30 second keepalive interval
      noDelay: true, // Disable Nagle's algorithm
      socketTimeout: 300000, // 5 minute socket timeout
      // Flag to indicate if running in Electron
      isElectron: isElectronEnv,
    };

    // Add WebSocket specific options if using WebSocket protocol
    if (connectProtocol === "ws") {
      options.heartbeatInterval = connectionConfig.heartbeatInterval || 15000;
      options.maxMissedPongs = connectionConfig.maxMissedPongs || 3;
      options.connectionTimeout = connectionConfig.connectionTimeout || 20000;
      options.binaryType = connectionConfig.binaryType || "arraybuffer";
      options.retryOnError = true; // Always retry on WebSocket errors
      options.autoReconnect = true; // Enable automatic reconnection

      // Add WebSocket-to-TCP proxy options if enabled
      if (connectionConfig.proxyMode) {
        options.proxyMode = true;
        options.tcpHost = connectionConfig.tcpHost || "localhost";
        options.tcpPort = connectionConfig.tcpPort || 5000;

        // Ensure tcpHost and tcpPort are properly set
        if (!options.tcpHost || !options.tcpPort) {
          console.warn("Missing TCP target host or port for proxy mode");
          options.tcpHost = "localhost";
          options.tcpPort = 5000;
        }

        // If running in Electron, add a flag to indicate we're using the built-in proxy
        if (isElectronEnv) {
          options.usingElectronProxy = true;
          console.log("Using Electron's built-in WebSocket-to-TCP proxy");
        }

        console.log(
          `Using WebSocket-to-TCP proxy mode to connect to ${options.tcpHost}:${options.tcpPort}`,
        );
      }

      console.log(
        "Using WebSocket protocol with heartbeat interval:",
        options.heartbeatInterval,
      );
    }

    // Add well information to connection options if available
    if (connectionConfig.wellId) {
      options.wellId = connectionConfig.wellId;
    }
    if (connectionConfig.wellName) {
      options.wellName = connectionConfig.wellName;
    }
    if (connectionConfig.rigName) {
      options.rigName = connectionConfig.rigName;
    }
    if (connectionConfig.sensorOffset !== undefined) {
      options.sensorOffset = connectionConfig.sensorOffset;
    }

    // Add additional options for serial connections
    if (connectProtocol === "serial" && additionalOptions) {
      options.serialPort = additionalOptions.serialPort;
      options.baudRate = additionalOptions.baudRate;
      options.dataBits = additionalOptions.dataBits || 8;
      options.parity = additionalOptions.parity || "none";
      options.stopBits = additionalOptions.stopBits || 1;
      options.flowControl = additionalOptions.flowControl || false;
    }

    // Add TCP-specific options
    if (connectProtocol === "tcp" && additionalOptions) {
      if (additionalOptions.keepAlive !== undefined)
        options.keepAlive = additionalOptions.keepAlive;
      if (additionalOptions.noDelay !== undefined)
        options.noDelay = additionalOptions.noDelay;
      if (additionalOptions.delimiter !== undefined)
        options.delimiter = additionalOptions.delimiter;
    }

    // Add UDP-specific options
    if (connectProtocol === "udp" && additionalOptions) {
      if (additionalOptions.broadcast !== undefined)
        options.broadcast = additionalOptions.broadcast;
      if (additionalOptions.reuseAddr !== undefined)
        options.reuseAddr = additionalOptions.reuseAddr;
      if (additionalOptions.delimiter !== undefined)
        options.delimiter = additionalOptions.delimiter;
    }

    // Update connection options and connect
    try {
      witsConnection.updateOptions(options);
      witsConnection.connect();

      // Set a timeout to check if we've successfully connected
      setTimeout(() => {
        if (!witsConnection.isConnected()) {
          setLastError(
            "Connection attempt timed out. Please check server availability and network settings.",
          );
        }
      }, 10000); // 10 second timeout for initial connection
    } catch (error) {
      setLastError(
        `Connection error: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  };

  const disconnect = () => {
    if (connectionConfig.connectionType === "witsml") {
      console.log("Disconnecting from WITSML server");
      witsmlConnection.disconnect();
    } else {
      console.log("Disconnecting from WITS server");
      witsConnection.disconnect();
    }
  };

  const clearError = () => {
    setLastError(null);
  };

  const clearWitsData = () => {
    console.log("Clearing all WITS data");
    setWitsData(defaultWitsData);
    setLastUpdateTime(new Date());
    return true;
  };

  // Helper function to validate and sanitize WITS data for database insertion
  const prepareWitsDataForSave = (
    data: WitsDataType,
    userId?: string,
  ): Record<string, any> => {
    // Get current database ID from localStorage
    const currentDatabaseId = localStorage.getItem("currentDatabaseId");

    // Get well information from localStorage or data
    const wellName =
      data.wellName || localStorage.getItem("wellName") || "Unknown Well";
    const rigName =
      data.rigName || localStorage.getItem("rigName") || "Unknown Rig";

    // Prepare WITS data for database insertion with proper field names
    return {
      timestamp: data.timestamp || new Date().toISOString(),
      bit_depth: isNaN(data.bitDepth) ? 0 : data.bitDepth,
      hole_depth: isNaN(data.holeDepth) ? 0 : data.holeDepth,
      rop: isNaN(data.rop) ? 0 : data.rop,
      wob: isNaN(data.wob) ? 0 : data.wob,
      hookload: isNaN(data.hookload) ? 0 : data.hookload,
      pump_pressure: isNaN(data.pumpPressure) ? 0 : data.pumpPressure,
      flow_rate: isNaN(data.flowRate) ? 0 : data.flowRate,
      rotary_torque: isNaN(data.rotaryTorque) ? 0 : data.rotaryTorque,
      rotary_rpm: isNaN(data.rotaryRpm) ? 0 : data.rotaryRpm,
      gamma: isNaN(data.gamma) ? 0 : data.gamma,
      inclination: isNaN(data.inclination) ? 0 : data.inclination,
      azimuth: isNaN(data.azimuth) ? 0 : data.azimuth,
      tool_face: isNaN(data.toolFace) ? 0 : data.toolFace,
      temperature: isNaN(data.temperature) ? 0 : data.temperature,
      vibration: data.vibration || { lateral: 0, axial: 0, torsional: 0 },
      motor_yield: isNaN(data.motorYield) ? 0 : data.motorYield,
      dogleg_needed: isNaN(data.doglegNeeded) ? 0 : data.doglegNeeded,
      dls: isNaN(data.dls) ? 0 : data.dls,
      magnetic_field: isNaN(data.magneticField) ? 0 : data.magneticField,
      gravity: isNaN(data.gravity) ? 0 : data.gravity,
      signal_quality: isNaN(data.signalQuality) ? 85 : data.signalQuality,
      battery_level: isNaN(data.batteryLevel) ? 75 : data.batteryLevel,
      tool_temp: isNaN(data.toolTemp) ? 165 : data.toolTemp,
      well_id: data.wellId || userId || null,
      well_name: wellName,
      rig_name: rigName,
      sensor_offset: isNaN(data.sensorOffset) ? 0 : data.sensorOffset,
      source: data.source || "WITS",
      database_id: currentDatabaseId || null,
      created_at: new Date().toISOString(),
    };
  };

  // Auto-save WITS data to database if connected
  useEffect(() => {
    // Skip initial render and only save meaningful data
    const isDefaultData =
      JSON.stringify(witsData) === JSON.stringify(defaultWitsData);
    if (isDefaultData || !isReceiving) return;

    const autoSaveWitsData = async () => {
      try {
        // Check if we have a database selected
        const currentDatabaseId = localStorage.getItem("currentDatabaseId");
        if (!currentDatabaseId) {
          console.warn("No database selected for auto-saving WITS data");
          return;
        }

        console.log("Auto-saving WITS data to database...");
        // Import dynamically to avoid circular dependencies
        const { supabase } = await import("@/lib/supabase");

        // Prepare WITS data for database insertion using helper function
        const witsDataToSave = prepareWitsDataForSave(
          witsData,
          userProfile.currentWellId,
        );

        // Insert WITS data record
        const { data, error } = await supabase
          .from("wits_data")
          .insert([witsDataToSave])
          .select();

        if (error) {
          throw error;
        }

        console.log("Successfully auto-saved WITS data to database", data);

        // Update last save timestamp in localStorage
        localStorage.setItem("lastWitsDataSaveTime", Date.now().toString());

        // Optionally update database stats
        try {
          await supabase
            .from("wits_databases")
            .update({
              last_modified: new Date().toISOString(),
            })
            .eq("id", currentDatabaseId);
        } catch (statsError) {
          console.warn("Failed to update database stats:", statsError);
          // Non-critical error, don't throw
        }
      } catch (error) {
        console.error("Error auto-saving WITS data to database:", error);
        // Store failed save attempt for retry
        const failedSaves = JSON.parse(
          localStorage.getItem("failedWitsSaves") || "[]",
        );
        failedSaves.push({
          timestamp: new Date().toISOString(),
          data: witsData,
          error: error instanceof Error ? error.message : String(error),
        });
        // Keep only the last 10 failed saves to prevent localStorage overflow
        if (failedSaves.length > 10) failedSaves.shift();
        localStorage.setItem("failedWitsSaves", JSON.stringify(failedSaves));
      }
    };

    // Only save data every 30 seconds to avoid database overload
    const autoSaveInterval = 30000; // 30 seconds
    const lastSaveTime = parseInt(
      localStorage.getItem("lastWitsDataSaveTime") || "0",
    );
    const currentTime = Date.now();

    if (currentTime - lastSaveTime > autoSaveInterval) {
      autoSaveWitsData();
    }
  }, [witsData, isReceiving, userProfile.currentWellId]);

  // Retry failed WITS data saves when connection is restored
  useEffect(() => {
    // Only attempt retries when we have a connection and are receiving data
    if (!isConnected || !isReceiving) return;

    const retryFailedSaves = async () => {
      try {
        const failedSaves = JSON.parse(
          localStorage.getItem("failedWitsSaves") || "[]",
        );
        if (failedSaves.length === 0) return;

        console.log(
          `Attempting to retry ${failedSaves.length} failed WITS data saves...`,
        );

        const { supabase } = await import("@/lib/supabase");
        const currentDatabaseId = localStorage.getItem("currentDatabaseId");

        if (!currentDatabaseId) {
          console.warn("No database selected for retrying failed WITS saves");
          return;
        }

        // Process each failed save
        const successfulRetries = [];

        for (let i = 0; i < failedSaves.length; i++) {
          const failedSave = failedSaves[i];
          try {
            const witsDataToSave = prepareWitsDataForSave(
              failedSave.data,
              userProfile.currentWellId,
            );

            const { error } = await supabase
              .from("wits_data")
              .insert([witsDataToSave]);

            if (error) throw error;

            // Mark this save as successful
            successfulRetries.push(i);
            console.log(
              `Successfully retried WITS data save from ${failedSave.timestamp}`,
            );
          } catch (error) {
            console.error(
              `Failed to retry WITS data save from ${failedSave.timestamp}:`,
              error,
            );
          }
        }

        // Remove successful retries from the failed saves list
        const updatedFailedSaves = failedSaves.filter(
          (_, index) => !successfulRetries.includes(index),
        );
        localStorage.setItem(
          "failedWitsSaves",
          JSON.stringify(updatedFailedSaves),
        );

        if (successfulRetries.length > 0) {
          console.log(
            `Successfully retried ${successfulRetries.length} of ${failedSaves.length} failed WITS data saves`,
          );
        }
      } catch (error) {
        console.error("Error retrying failed WITS data saves:", error);
      }
    };

    // Retry failed saves every 5 minutes
    const retryInterval = setInterval(retryFailedSaves, 5 * 60 * 1000);

    // Run once on connection establishment
    retryFailedSaves();

    return () => clearInterval(retryInterval);
  }, [isConnected, isReceiving, userProfile.currentWellId]);

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
        clearWitsData,
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
};

// Define the hook outside of the provider component for Fast Refresh compatibility
const useWits = () => {
  const context = useContext(WitsContext);
  if (context === undefined) {
    throw new Error("useWits must be used within a WitsProvider");
  }
  return context;
};

// Export the hook and provider
export { useWits, WitsProvider };
