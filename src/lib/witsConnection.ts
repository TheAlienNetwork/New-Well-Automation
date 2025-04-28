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
  witsVersion?: "0" | "1"; // WITS Level 0 or 1
  delimiter?: string; // Custom record delimiter
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
      witsVersion: "0",
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
        : "Connecting to WITS server...",
    );

    try {
      if (this.isBrowser) {
        this.connectWebSocket();
      } else {
        this.connectDirect();
      }
    } catch (error) {
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

    if (this.socket) {
      try {
        if (this.isBrowser) {
          this.socket.close();
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
    this.notifyConnectionCallbacks(false);
    this.notifyErrorCallbacks(null); // Clear any error messages
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
  private connectWebSocket(): void {
    if (this.options.noralisMode && !this.options.wsEndpoint) {
      this.options.wsEndpoint = "/noralis";
    }

    const isSecure = window.location.protocol === "https:";
    const wsProtocol = isSecure ? "wss://" : "ws://";
    const host = this.options.host || "localhost";
    const port = this.options.port || 80;
    const endpoint = this.options.wsEndpoint || "/wits";
    let wsUrl = `${wsProtocol}${host}:${port}${endpoint}`;

    if (this.options.noralisMode) {
      wsUrl += `?protocol=tcp&noralis=true&version=${this.options.witsVersion}`;
    }

    const connectionTimeout = setTimeout(() => {
      if (!this.connected) {
        this.handleConnectionError(new Error("WebSocket connection timeout"));
      }
    }, 20000); // Increased timeout to 20 seconds

    this.socket = new WebSocket(wsUrl);

    this.socket.onopen = () => {
      clearTimeout(connectionTimeout);
      this.handleConnectionSuccess();
    };

    this.socket.onmessage = (event: MessageEvent) => {
      this.lastDataTime = Date.now();
      this.handleIncomingData(event.data);
    };

    this.socket.onclose = (event: CloseEvent) => {
      clearTimeout(connectionTimeout);
      this.handleConnectionClose(event.code, event.reason);
    };

    this.socket.onerror = (error: Event) => {
      clearTimeout(connectionTimeout);
      this.handleConnectionError(new Error("WebSocket error"));
    };
  }

  private connectDirect(): void {
    if (!this.net && !this.isBrowser) {
      throw new Error("Net module not available");
    }

    const connectionTimeout = setTimeout(() => {
      if (!this.connected) {
        this.socket?.destroy();
        this.handleConnectionError(new Error("Connection timeout"));
      }
    }, 60000); // Further increased timeout to 60 seconds

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
        this.socket.setKeepAlive(true, 120000); // Significantly increased keepalive interval
        this.socket.setNoDelay(true); // Disable Nagle's algorithm for immediate data transmission
        this.socket.setTimeout(300000); // Significantly increased socket timeout
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

    records.forEach((record) => {
      if (record.trim().length > 0) {
        if (this.options.noralisMode) {
          this.parseNoralisRecord(record);
        } else {
          this.parseStandardWitsRecord(record);
        }
      }
    });
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
    if (this.options.witsVersion === "0") {
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
    else if (this.options.witsVersion === "1") {
      try {
        const data = JSON.parse(record) as WitsDataType;
        data.timestamp = data.timestamp || new Date().toISOString();
        data.source = data.source || "wits";
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
          this.isBrowser &&
          this.socket?.readyState === WebSocket.OPEN
        ) {
          this.socket.send(JSON.stringify({ command: "ping" }));
        }
      } catch (error) {
        console.warn("Error sending keepalive:", error);
      }
    }, 120000); // Significantly increased interval to 120 seconds
  }

  private attemptReconnect(): void {
    if (this.reconnectTimer || this.connecting || this.connected) return;

    const maxAttempts = this.options.maxReconnectAttempts || 100;
    if (this.reconnectAttempts >= maxAttempts) {
      this.notifyErrorCallbacks(
        `Maximum reconnect attempts (${maxAttempts}) reached`,
      );
      return;
    }

    this.reconnectAttempts++;
    const reconnectInterval = this.options.reconnectInterval || 10000;
    // Use a fixed interval without backoff to maintain consistent reconnection attempts
    const adjustedInterval = reconnectInterval;

    this.notifyErrorCallbacks(
      `Reconnecting (attempt ${this.reconnectAttempts}/${maxAttempts})...`,
    );

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
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
