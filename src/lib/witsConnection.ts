/**
 * Universal WITS Connection Handler
 * Supports both browser (WebSocket) and Node.js (direct TCP/UDP/Serial)
 * Optimized for Noralis MWD while maintaining standard WITS compatibility
 */

import { WitsDataType, WitsMappings } from "@/context/WitsContext";

type ConnectionCallback = (connected: boolean) => void;
type DataCallback = (data: WitsDataType) => void;
type ErrorCallback = (error: string | null) => void;

interface WitsConnectionOptions {
  port?: number;
  host?: string;
  protocol?: "tcp" | "udp" | "serial" | "ws";
  baudRate?: number;
  serialPort?: string;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  wsEndpoint?: string;
  noralisMode?: boolean;
  witsLevel?: "0" | "1"; // WITS Level 0 or 1
  delimiter?: string; // Custom record delimiter
  wellId?: string;
  wellName?: string;
  rigName?: string;
  sensorOffset?: number;
  // WebSocket specific options
  heartbeatInterval?: number; // Interval between ping messages in ms
  maxMissedPongs?: number; // Maximum number of missed pongs before reconnect
  connectionTimeout?: number; // Connection timeout in ms
  binaryType?: "blob" | "arraybuffer"; // WebSocket binary type
  // WebSocket-to-TCP proxy options
  proxyMode?: boolean; // Whether to use WebSocket-to-TCP proxy
  tcpHost?: string; // TCP host to connect to via proxy
  tcpPort?: number; // TCP port to connect to via proxy
}

class WitsConnection {
  private connected: boolean = false;
  private connecting: boolean = false;
  private socket: any = null;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private reconnectAttempts: number = 0;
  private connectionCallbacks: ConnectionCallback[] = [];
  private dataCallbacks: DataCallback[] = [];
  private errorCallbacks: ErrorCallback[] = [];
  private witsMappings: WitsMappings | null = null;
  private options: WitsConnectionOptions;
  private isBrowser: boolean;
  private lastDataTime: number = 0;
  private buffer: string = "";
  private net: any;
  private dgram: any;
  private SerialPort: any;

  constructor(options?: WitsConnectionOptions) {
    this.isBrowser = typeof window !== "undefined";
    this.options = {
      port: this.isBrowser ? 80 : 5000,
      host: "localhost",
      protocol: this.isBrowser ? "ws" : "tcp",
      reconnectInterval: 10000,
      maxReconnectAttempts: 100,
      wsEndpoint: "/wits",
      noralisMode: false,
      witsLevel: "0",
      delimiter: this.isBrowser ? "\n" : "\r\n",
      ...options,
    };

    if (!this.isBrowser) {
      try {
        this.net = require("net");
        this.dgram = require("dgram");
        this.SerialPort = require("serialport");
      } catch (err) {
        console.error("Failed to load Node.js dependencies:", err);
      }
    }
  }

  /* Public Methods */
  public connect(): void {
    if (this.connected || this.connecting) return;

    this.connecting = true;
    this.notifyErrorCallbacks(
      this.options.noralisMode
        ? "Connecting to Noralis MWD..."
        : `Connecting to WITS server at ${this.options.host}:${this.options.port} via ${this.options.protocol}...`,
    );

    // Reset connection state
    this.buffer = "";
    this.lastDataTime = Date.now();

    try {
      if (this.isBrowser) {
        this.connectWebSocket();
      } else {
        this.connectDirect();
      }

      console.log(
        `Connection attempt initiated to ${this.options.host}:${this.options.port} via ${this.options.protocol}`,
      );
    } catch (error) {
      console.error("Error initiating connection:", error);
      this.handleConnectionError(
        error instanceof Error ? error : new Error(String(error)),
      );
    }
  }

  public disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    // Clear health check interval
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }

    // Clear WebSocket specific intervals/timeouts
    this.stopWebSocketHeartbeat();

    if (this.socket) {
      try {
        if (this.isBrowser) {
          // For WebSocket connections, send a clean close message if possible
          if (this.socket.readyState === WebSocket.OPEN) {
            try {
              this.socket.send(
                JSON.stringify({ type: "disconnect", command: "disconnect" }),
              );
              console.log("Sent clean disconnect message to WebSocket server");
            } catch (e) {
              console.warn("Error sending WebSocket disconnect message", e);
            }
          }
          this.socket.close(1000, "Client initiated disconnect");
        } else {
          if (this.options.protocol === "udp") {
            this.socket.close();
          } else {
            // Send a clean disconnect message if possible
            try {
              if (this.socket.writable) {
                this.socket.write(
                  JSON.stringify({ command: "disconnect" }) +
                    this.options.delimiter,
                );
              }
            } catch (e) {
              console.warn("Error sending disconnect message", e);
            }
            this.socket.end();
            this.socket.destroy();
          }
        }
      } catch (err) {
        console.warn("Error during socket disconnect:", err);
      }
      this.socket = null;
    }

    this.connected = false;
    this.connecting = false;
    this.buffer = "";
    this.reconnectAttempts = 0; // Reset reconnect attempts on manual disconnect
    this.missedPongs = 0; // Reset missed pongs counter
    this.notifyConnectionCallbacks(false);
    this.notifyErrorCallbacks(null); // Clear any error messages

    console.log("WITS connection disconnected and resources cleaned up");
  }

  public isConnected(): boolean {
    return this.connected;
  }

  public onConnectionChange(callback: ConnectionCallback): void {
    this.connectionCallbacks.push(callback);
  }

  public onData(callback: DataCallback): void {
    this.dataCallbacks.push(callback);
  }

  public onError(callback: ErrorCallback): void {
    this.errorCallbacks.push(callback);
  }

  public removeConnectionCallback(callback: ConnectionCallback): void {
    this.connectionCallbacks = this.connectionCallbacks.filter(
      (cb) => cb !== callback,
    );
  }

  public removeDataCallback(callback: DataCallback): void {
    this.dataCallbacks = this.dataCallbacks.filter((cb) => cb !== callback);
  }

  public removeErrorCallback(callback: ErrorCallback): void {
    this.errorCallbacks = this.errorCallbacks.filter((cb) => cb !== callback);
  }

  public updateOptions(options: WitsConnectionOptions): void {
    const wasConnected = this.connected;
    if (wasConnected) this.disconnect();
    this.options = { ...this.options, ...options };
    if (wasConnected) this.connect();
  }

  public updateWitsMappings(mappings: WitsMappings): void {
    this.witsMappings = mappings;
  }

  public sendCommand(command: string, params?: any): void {
    if (!this.connected || !this.socket) {
      this.notifyErrorCallbacks("Cannot send command: Not connected");
      return;
    }

    try {
      const message = JSON.stringify({ command, params });
      if (this.isBrowser) {
        this.socket.send(message);
      } else {
        this.socket.write(message + this.options.delimiter);
      }
    } catch (error) {
      this.notifyErrorCallbacks(
        "Error sending command: " +
          (error instanceof Error ? error.message : String(error)),
      );
    }
  }

  /* Private Methods */
  // WebSocket specific properties
  private pingInterval: NodeJS.Timeout | null = null;
  private pongTimeout: NodeJS.Timeout | null = null;
  private missedPongs: number = 0;
  private lastPingSent: number = 0;
  private lastPongReceived: number = 0;
  private maxMissedPongs: number = 3;
  private heartbeatInterval: number = 15000; // 15 seconds between pings
  private pongWaitTime: number = 10000; // 10 seconds to wait for pong response

  private connectWebSocket(): void {
    if (this.options.noralisMode && !this.options.wsEndpoint) {
      this.options.wsEndpoint = "/noralis";
    }

    // Determine if we should use secure WebSockets based on current page protocol
    // or if the host is not localhost (production environments should use TLS)
    const isSecure =
      window.location.protocol === "https:" ||
      (this.options.host !== "localhost" &&
        this.options.host !== "127.0.0.1" &&
        !this.options.host?.startsWith("192.168."));
    const wsProtocol = isSecure ? "wss://" : "ws://";
    const host = this.options.host || "localhost";
    const port = this.options.port || (isSecure ? 443 : 80);
    const endpoint = this.options.wsEndpoint || "/wits";
    let wsUrl = `${wsProtocol}${host}:${port}${endpoint}`;

    // Add query parameters for proxy configuration
    const queryParams = new URLSearchParams();

    // If using proxy, these parameters tell the proxy where to connect
    if (this.options.proxyMode) {
      console.log("Using WebSocket-to-TCP proxy mode");
      // Ensure we have valid TCP host and port values
      const tcpHost = this.options.tcpHost || "localhost";
      const tcpPort = this.options.tcpPort || 5000;

      queryParams.set("host", tcpHost);
      queryParams.set("port", String(tcpPort));
      // Add protocol type for proxy to know what kind of connection to make
      queryParams.set("protocol", "tcp");

      // Log proxy configuration
      console.log(`Proxy target: ${tcpHost}:${tcpPort}`);
    }

    if (this.options.noralisMode) {
      queryParams.set("noralis", "true");
      queryParams.set("version", this.options.witsLevel || "0");
    }

    // Append query string if we have parameters
    if (queryParams.toString()) {
      wsUrl += `?${queryParams.toString()}`;
    }

    console.log(
      `Connecting to WebSocket at ${wsUrl} with heartbeat interval ${this.heartbeatInterval}ms`,
    );

    const connectionTimeout = setTimeout(() => {
      if (!this.connected) {
        this.handleConnectionError(
          new Error("WebSocket connection timeout after 20 seconds"),
        );
      }
    }, 20000); // 20 second connection timeout

    try {
      this.socket = new WebSocket(wsUrl);

      // Set binary type to arraybuffer for better binary data handling
      this.socket.binaryType = "arraybuffer";

      this.socket.onopen = () => {
        clearTimeout(connectionTimeout);
        this.handleConnectionSuccess();
        this.startWebSocketHeartbeat();
      };

      this.socket.onmessage = (event: MessageEvent) => {
        this.lastDataTime = Date.now();

        // Check if this is a pong message
        if (typeof event.data === "string") {
          try {
            const data = JSON.parse(event.data);
            if (data.type === "pong") {
              this.handlePong();
              return;
            }
          } catch (e) {
            // Not JSON or not a pong message, process as normal data
          }
        }

        // Process as normal data message
        this.handleIncomingData(event.data);
      };

      this.socket.onclose = (event: CloseEvent) => {
        clearTimeout(connectionTimeout);
        this.stopWebSocketHeartbeat();

        // Log detailed close information
        console.log(
          `WebSocket closed with code ${event.code}: ${event.reason || "No reason provided"}`,
        );

        // Handle different close codes appropriately
        if (event.code === 1000) {
          // Normal closure
          this.handleConnectionClose(event.code, "Connection closed normally");
        } else if (event.code === 1006) {
          // Abnormal closure
          this.handleConnectionClose(
            event.code,
            "Connection closed abnormally - server may be down or network interrupted",
          );
        } else {
          this.handleConnectionClose(
            event.code,
            event.reason || "Connection closed",
          );
        }
      };

      this.socket.onerror = (error: Event) => {
        clearTimeout(connectionTimeout);
        this.stopWebSocketHeartbeat();

        // Extract more detailed error information if possible
        let errorMessage = "WebSocket error";
        if (error && (error as any).message) {
          errorMessage = `WebSocket error: ${(error as any).message}`;
        }

        console.error("WebSocket error event:", error);
        this.handleConnectionError(new Error(errorMessage));
      };
    } catch (error) {
      clearTimeout(connectionTimeout);
      console.error("Error creating WebSocket:", error);
      this.handleConnectionError(
        error instanceof Error ? error : new Error(String(error)),
      );
    }
  }

  private startWebSocketHeartbeat(): void {
    if (
      !this.isBrowser ||
      !this.socket ||
      this.socket.readyState !== WebSocket.OPEN
    ) {
      return;
    }

    this.stopWebSocketHeartbeat(); // Clear any existing intervals
    this.missedPongs = 0;

    console.log(
      `Starting WebSocket heartbeat with ${this.heartbeatInterval}ms interval`,
    );

    // Set up ping interval
    this.pingInterval = setInterval(() => {
      if (this.socket?.readyState === WebSocket.OPEN) {
        try {
          // Send ping message
          this.socket.send(
            JSON.stringify({ type: "ping", timestamp: Date.now() }),
          );
          this.lastPingSent = Date.now();
          console.debug(
            `Sent WebSocket ping at ${new Date(this.lastPingSent).toISOString()}`,
          );

          // Set timeout for pong response
          if (this.pongTimeout) {
            clearTimeout(this.pongTimeout);
          }

          this.pongTimeout = setTimeout(() => {
            this.missedPongs++;
            console.warn(
              `Missed pong response (${this.missedPongs}/${this.maxMissedPongs})`,
            );

            if (this.missedPongs >= this.maxMissedPongs) {
              console.error(
                `Maximum missed pongs (${this.maxMissedPongs}) reached, reconnecting...`,
              );
              this.notifyErrorCallbacks(
                `Connection unstable: Missed ${this.maxMissedPongs} heartbeat responses`,
              );
              this.disconnect();
              this.attemptReconnect();
            }
          }, this.pongWaitTime);
        } catch (error) {
          console.error("Error sending WebSocket ping:", error);
        }
      }
    }, this.heartbeatInterval);
  }

  private stopWebSocketHeartbeat(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }

    if (this.pongTimeout) {
      clearTimeout(this.pongTimeout);
      this.pongTimeout = null;
    }
  }

  private handlePong(): void {
    this.lastPongReceived = Date.now();
    this.missedPongs = 0;

    if (this.pongTimeout) {
      clearTimeout(this.pongTimeout);
      this.pongTimeout = null;
    }

    const latency = this.lastPongReceived - this.lastPingSent;
    console.debug(`Received pong with ${latency}ms latency`);
  }

  private connectDirect(): void {
    if (!this.net && !this.isBrowser) {
      throw new Error("Net module not available");
    }

    // Log connection attempt details
    console.log(
      `Attempting ${this.options.protocol} connection to ${this.options.host}:${this.options.port}`,
    );

    const connectionTimeout = setTimeout(() => {
      if (!this.connected) {
        console.error(
          `Connection attempt to ${this.options.host}:${this.options.port} timed out after 60 seconds`,
        );
        this.socket?.destroy();
        this.handleConnectionError(
          new Error(
            "Connection timeout - verify server is running and accessible",
          ),
        );
      }
    }, 60000); // 60 second timeout

    switch (this.options.protocol) {
      case "tcp":
        this.socket = new this.net.Socket();
        this.socket.connect(this.options.port!, this.options.host!, () => {
          clearTimeout(connectionTimeout);
          this.handleConnectionSuccess();
        });

        this.socket.on("data", (data: Buffer) => {
          this.lastDataTime = Date.now();
          this.buffer += data.toString("ascii");
          this.processDataBuffer();
        });

        this.socket.on("close", (hadError: boolean) => {
          clearTimeout(connectionTimeout);
          this.handleConnectionClose(
            hadError ? 1006 : 1000,
            hadError ? "Connection error" : "Connection closed",
          );
        });

        this.socket.on("error", (err: Error) => {
          clearTimeout(connectionTimeout);
          this.handleConnectionError(err);
        });

        // TCP optimizations with more resilient settings
        this.socket.setKeepAlive(true, 30000); // 30 second keepalive interval
        this.socket.setNoDelay(true); // Disable Nagle's algorithm for immediate data transmission
        this.socket.setTimeout(300000); // 5 minute socket timeout

        // Set TCP socket options for better reliability
        if (typeof this.socket.setKeepAlive === "function") {
          // Enable TCP keepalive with more aggressive settings
          this.socket.setKeepAlive(true, 30000);
        }

        // Log socket configuration
        console.log("TCP socket configured with keepalive and no delay");
        break;

      case "udp":
        this.socket = this.dgram.createSocket("udp4");
        this.socket.bind(this.options.port);

        this.socket.on("message", (msg: Buffer) => {
          this.lastDataTime = Date.now();
          this.buffer += msg.toString("ascii");
          this.processDataBuffer();
        });

        this.socket.on("listening", () => {
          clearTimeout(connectionTimeout);
          this.handleConnectionSuccess();
        });

        this.socket.on("close", () => {
          clearTimeout(connectionTimeout);
          this.handleConnectionClose(1000, "UDP connection closed");
        });

        this.socket.on("error", (err: Error) => {
          clearTimeout(connectionTimeout);
          this.handleConnectionError(err);
        });
        break;

      case "serial":
        if (!this.SerialPort) {
          throw new Error("SerialPort module not available");
        }

        this.socket = new this.SerialPort(
          this.options.serialPort || "/dev/ttyUSB0",
          {
            baudRate: this.options.baudRate || 9600,
            dataBits: 8,
            parity: "none",
            stopBits: 1,
          },
        );

        this.socket.on("open", () => {
          clearTimeout(connectionTimeout);
          this.handleConnectionSuccess();
        });

        this.socket.on("data", (data: Buffer) => {
          this.lastDataTime = Date.now();
          this.buffer += data.toString("ascii");
          this.processDataBuffer();
        });

        this.socket.on("close", () => {
          clearTimeout(connectionTimeout);
          this.handleConnectionClose(1000, "Serial connection closed");
        });

        this.socket.on("error", (err: Error) => {
          clearTimeout(connectionTimeout);
          this.handleConnectionError(err);
        });
        break;

      default:
        throw new Error(`Unsupported protocol: ${this.options.protocol}`);
    }
  }

  private processDataBuffer(): void {
    const delimiter =
      this.options.delimiter || (this.options.noralisMode ? "\r\n" : "\n");
    const records = this.buffer.split(delimiter);

    // Keep incomplete record in buffer
    this.buffer = records.pop() || "";

    // Prevent buffer from growing too large if no complete records are received
    if (this.buffer.length > 10000) {
      console.warn("Buffer exceeds 10KB without finding delimiter, truncating");
      this.buffer = this.buffer.substring(this.buffer.length - 5000);
    }

    // Process each complete record
    let processedRecords = 0;
    records.forEach((record) => {
      if (record.trim().length > 0) {
        try {
          if (this.options.noralisMode) {
            this.parseNoralisRecord(record);
          } else {
            this.parseStandardWitsRecord(record);
          }
          processedRecords++;
        } catch (error) {
          console.error("Error parsing record:", error, "Record:", record);
        }
      }
    });

    if (processedRecords > 0) {
      console.debug(`Processed ${processedRecords} complete records`);
    }
  }

  private parseNoralisRecord(record: string): void {
    // Noralis format: "01 1234.5 02 5678.9 03 91011.12 ..."
    const items = record.trim().split(/\s+/g);

    if (items.length % 2 !== 0) {
      console.warn(
        "Invalid Noralis WITS record - odd number of items:",
        record,
      );
      return;
    }

    const witsData: Partial<WitsDataType> = {
      timestamp: new Date().toISOString(),
      source: "noralis",
    };

    // Add well information to the data if available
    if (this.options.wellId) {
      witsData.wellId = this.options.wellId;
    }
    if (this.options.wellName) {
      witsData.wellName = this.options.wellName;
    }
    if (this.options.rigName) {
      witsData.rigName = this.options.rigName;
    }
    if (this.options.sensorOffset !== undefined) {
      witsData.sensorOffset = this.options.sensorOffset;
    }

    for (let i = 0; i < items.length; i += 2) {
      const channelStr = items[i];
      const valueStr = items[i + 1];

      if (!/^\d{2}$/.test(channelStr)) continue;

      const channel = parseInt(channelStr, 10);
      const value = parseFloat(valueStr);

      if (!isNaN(value)) {
        witsData[channel] = value;
      }
    }

    const mappedData = this.applyWitsMappings(witsData as WitsDataType);
    this.notifyDataCallbacks(mappedData);
  }

  private parseStandardWitsRecord(record: string): void {
    // Standard WITS Level 0 format: fixed-width fields
    if (this.options.witsLevel === "0") {
      const recordLength = 120; // Standard WITS Level 0 record length
      if (record.length < recordLength) return;

      const items = [];
      for (let i = 0; i < record.length; i += 6) {
        items.push(record.substr(i, 6).trim());
      }

      const witsData: Partial<WitsDataType> = {
        timestamp: new Date().toISOString(),
        source: "wits",
      };

      // Add well information to the data if available
      if (this.options.wellId) {
        witsData.wellId = this.options.wellId;
      }
      if (this.options.wellName) {
        witsData.wellName = this.options.wellName;
      }
      if (this.options.rigName) {
        witsData.rigName = this.options.rigName;
      }
      if (this.options.sensorOffset !== undefined) {
        witsData.sensorOffset = this.options.sensorOffset;
      }

      for (let channel = 1; channel < items.length; channel++) {
        const value = parseFloat(items[channel]);
        if (!isNaN(value)) {
          witsData[channel] = value;
        }
      }

      const mappedData = this.applyWitsMappings(witsData as WitsDataType);
      this.notifyDataCallbacks(mappedData);
    }
    // WITS Level 1 format (JSON)
    else if (this.options.witsLevel === "1") {
      try {
        const data = JSON.parse(record) as WitsDataType;
        data.timestamp = data.timestamp || new Date().toISOString();
        data.source = data.source || "wits";

        // Add well information to the data if available
        if (this.options.wellId) {
          data.wellId = this.options.wellId;
        }
        if (this.options.wellName) {
          data.wellName = this.options.wellName;
        }
        if (this.options.rigName) {
          data.rigName = this.options.rigName;
        }
        if (this.options.sensorOffset !== undefined) {
          data.sensorOffset = this.options.sensorOffset;
        }

        const mappedData = this.applyWitsMappings(data);
        this.notifyDataCallbacks(mappedData);
      } catch (error) {
        console.error("Error parsing WITS Level 1 record:", error);
      }
    }
  }

  private handleIncomingData(data: string | Blob | ArrayBuffer): void {
    try {
      let rawData: WitsDataType;

      if (typeof data === "string") {
        if (this.options.noralisMode) {
          this.buffer += data;
          this.processDataBuffer();
          return;
        }
        rawData = JSON.parse(data) as WitsDataType;
      } else if (data instanceof Blob) {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const result = e.target?.result as string;
            this.buffer += result;
            this.processDataBuffer();
          } catch (error) {
            this.notifyErrorCallbacks("Error parsing binary data");
          }
        };
        reader.readAsText(data);
        return;
      } else {
        const decoder = new TextDecoder();
        this.buffer += decoder.decode(data);
        this.processDataBuffer();
        return;
      }

      rawData.timestamp = rawData.timestamp || new Date().toISOString();
      rawData.source = rawData.source || "wits";

      // Add well information to the data if available
      if (this.options.wellId) {
        rawData.wellId = this.options.wellId;
      }
      if (this.options.wellName) {
        rawData.wellName = this.options.wellName;
      }
      if (this.options.rigName) {
        rawData.rigName = this.options.rigName;
      }
      if (this.options.sensorOffset !== undefined) {
        rawData.sensorOffset = this.options.sensorOffset;
      }

      const mappedData = this.applyWitsMappings(rawData);
      this.notifyDataCallbacks(mappedData);
    } catch (error) {
      this.notifyErrorCallbacks(
        "Error parsing data: " +
          (error instanceof Error ? error.message : String(error)),
      );
    }
  }

  private applyWitsMappings(rawData: WitsDataType): WitsDataType {
    if (!this.witsMappings) return rawData;

    try {
      const mappedData = { ...rawData };

      const toCamelCase = (name: string): string => {
        return (
          name.charAt(0).toLowerCase() +
          name.slice(1).replace(/\s+(.)/g, (_, char) => char.toUpperCase())
        );
      };

      // Process all mappings
      const processMappings = (mappings: any[]) => {
        mappings.forEach((mapping) => {
          if (mapping.witsId && rawData[mapping.witsId] !== undefined) {
            const paramName = toCamelCase(mapping.name);
            const rawValue = rawData[mapping.witsId];
            mappedData[paramName] = rawValue;
            if (mapping.channel) {
              mappedData[mapping.channel] = rawValue;
            }
          } else if (
            mapping.channel &&
            rawData[mapping.channel] !== undefined
          ) {
            const paramName = toCamelCase(mapping.name);
            mappedData[paramName] = rawData[mapping.channel];
          }
        });
      };

      if (this.witsMappings.drilling)
        processMappings(this.witsMappings.drilling);
      if (this.witsMappings.directional)
        processMappings(this.witsMappings.directional);
      if (this.witsMappings.custom) processMappings(this.witsMappings.custom);

      return mappedData;
    } catch (error) {
      console.error("Error applying WITS mappings:", error);
      return rawData;
    }
  }

  private handleConnectionSuccess(): void {
    console.log("Connection established");
    this.connected = true;
    this.connecting = false;
    this.reconnectAttempts = 0;
    this.notifyConnectionCallbacks(true);
    this.notifyErrorCallbacks(null);
    this.lastDataTime = Date.now();
    this.monitorConnectionHealth();

    // Send initial handshake if needed
    if (this.options.noralisMode && this.socket && !this.isBrowser) {
      this.socket.write(this.options.delimiter);
    }
  }

  private handleConnectionClose(code: number, reason: string): void {
    console.log(`Connection closed: ${code} - ${reason}`);
    this.connected = false;
    this.connecting = false;
    this.notifyConnectionCallbacks(false);

    if (code === 1006) {
      this.notifyErrorCallbacks("Connection closed abnormally");
    } else if (code !== 1000) {
      this.notifyErrorCallbacks(
        `Connection closed: ${reason || "Unknown reason"}`,
      );
    }

    this.attemptReconnect();
  }

  private handleConnectionError(error: Error): void {
    console.error("Connection error:", error);
    this.connected = false;
    this.connecting = false;
    this.notifyConnectionCallbacks(false);

    // Don't show ECONNREFUSED errors to the user, just show a generic message
    const errorMessage = error.message.includes("ECONNREFUSED")
      ? "Connection refused - WITS server not available"
      : `Connection error: ${error.message}`;

    this.notifyErrorCallbacks(errorMessage);
    this.attemptReconnect();
  }

  private monitorConnectionHealth(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }

    this.healthCheckInterval = setInterval(() => {
      if (!this.connected) {
        if (this.healthCheckInterval) {
          clearInterval(this.healthCheckInterval);
          this.healthCheckInterval = null;
        }
        return;
      }

      const dataTimeout = this.options.noralisMode ? 600000 : 300000; // Significantly increased timeout
      if (Date.now() - this.lastDataTime > dataTimeout) {
        this.notifyErrorCallbacks(
          `No data received for ${dataTimeout / 1000} seconds`,
        );
        this.disconnect();
        this.attemptReconnect();
      }

      // Send keepalive if needed - less frequently to avoid connection resets
      try {
        if (this.options.noralisMode && this.socket && !this.isBrowser) {
          this.socket.write(this.options.delimiter);
        } else if (
          !this.options.noralisMode &&
          this.socket &&
          !this.isBrowser &&
          this.socket.writable
        ) {
          // Send a TCP keepalive packet for standard WITS connections
          this.socket.write(
            JSON.stringify({ command: "ping" }) + this.options.delimiter,
          );
        } else if (
          this.isBrowser &&
          this.socket?.readyState === WebSocket.OPEN
        ) {
          this.socket.send(JSON.stringify({ command: "ping" }));
        }
      } catch (error) {
        console.warn("Error sending keepalive:", error);
        // If we can't send a keepalive, the connection might be dead
        if (this.connected) {
          this.notifyErrorCallbacks(
            "Failed to send keepalive, connection may be broken",
          );
          this.disconnect();
          this.attemptReconnect();
        }
      }
    }, 60000); // Reduced interval to 60 seconds for more frequent health checks
  }

  private attemptReconnect(): void {
    if (this.reconnectTimer || this.connecting || this.connected) return;

    const maxAttempts = this.options.maxReconnectAttempts || 100;
    if (this.reconnectAttempts >= maxAttempts) {
      this.notifyErrorCallbacks(
        `Maximum reconnect attempts (${maxAttempts}) reached. Please check your connection settings and try again manually.`,
      );
      return;
    }

    this.reconnectAttempts++;
    const reconnectInterval = this.options.reconnectInterval || 10000;

    // Use exponential backoff with a cap to avoid hammering the server
    // but still maintain reasonable reconnection times
    const baseInterval = reconnectInterval;
    const maxInterval = 60000; // Cap at 60 seconds
    const exponentialFactor = Math.min(
      Math.pow(1.5, Math.min(this.reconnectAttempts, 10) - 1),
      6,
    );
    const adjustedInterval = Math.min(
      baseInterval * exponentialFactor,
      maxInterval,
    );

    console.log(
      `Scheduling reconnect attempt ${this.reconnectAttempts}/${maxAttempts} in ${adjustedInterval / 1000} seconds`,
    );

    this.notifyErrorCallbacks(
      `Reconnecting (attempt ${this.reconnectAttempts}/${maxAttempts}) in ${Math.round(adjustedInterval / 1000)} seconds...`,
    );

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      console.log(
        `Executing reconnect attempt ${this.reconnectAttempts}/${maxAttempts}`,
      );
      this.connect();
    }, adjustedInterval);
  }

  private notifyConnectionCallbacks(connected: boolean): void {
    this.connectionCallbacks.forEach((callback) => {
      try {
        callback(connected);
      } catch (error) {
        console.error("Error in connection callback:", error);
      }
    });
  }

  private notifyDataCallbacks(data: WitsDataType): void {
    this.dataCallbacks.forEach((callback) => {
      try {
        callback(data);
      } catch (error) {
        console.error("Error in data callback:", error);
      }
    });
  }

  private notifyErrorCallbacks(error: string | null): void {
    this.errorCallbacks.forEach((callback) => {
      try {
        callback(error);
      } catch (err) {
        console.error("Error in error callback:", err);
      }
    });
  }
}

export const witsConnection = new WitsConnection();
export default WitsConnection;
