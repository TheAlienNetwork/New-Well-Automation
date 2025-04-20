/**
 * WITS Connection Handler
 * Manages real-time connection to WITS data sources
 */

import { WitsDataType, WitsMappings } from "@/context/WitsContext";

type ConnectionCallback = (connected: boolean) => void;
type DataCallback = (data: WitsDataType) => void;
type ErrorCallback = (error: string) => void;

interface WitsConnectionOptions {
  port?: number;
  host?: string;
  protocol?: "tcp" | "udp" | "serial";
  baudRate?: number;
  serialPort?: string;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

class WitsConnection {
  private connected: boolean = false;
  private connecting: boolean = false;
  private socket: WebSocket | null = null;
  private reconnectTimer: number | null = null;
  private reconnectAttempts: number = 0;
  private connectionCallbacks: ConnectionCallback[] = [];
  private dataCallbacks: DataCallback[] = [];
  private errorCallbacks: ErrorCallback[] = [];
  private witsMappings: WitsMappings | null = null;
  private options: WitsConnectionOptions = {
    port: 4000,
    host: "localhost",
    protocol: "tcp",
    reconnectInterval: 5000,
    maxReconnectAttempts: 10,
  };

  constructor(options?: WitsConnectionOptions) {
    if (options) {
      this.options = { ...this.options, ...options };
    }
  }

  /**
   * Connect to WITS data source
   */
  public connect(): void {
    if (this.connected || this.connecting) return;

    this.connecting = true;
    this.notifyErrorCallbacks("Connecting to WITS server...");

    try {
      // Determine the appropriate WebSocket protocol based on the connection type
      let wsUrl = "";
      const isSecure = window.location.protocol === "https:";
      const wsProtocol = isSecure ? "wss://" : "ws://";

      // Handle different protocol types
      switch (this.options.protocol) {
        case "tcp":
          // For TCP connections, we use a WebSocket that bridges to TCP
          wsUrl = `${wsProtocol}${this.options.host}:${this.options.port}/wits`;
          break;
        case "udp":
          // For UDP connections, specify UDP in the path
          wsUrl = `${wsProtocol}${this.options.host}:${this.options.port}/wits/udp`;
          break;
        case "serial":
          // For serial connections, include serial port info in the path
          const serialPort = encodeURIComponent(
            this.options.serialPort || "/dev/ttyUSB0",
          );
          const baudRate = this.options.baudRate || 9600;
          wsUrl = `${wsProtocol}${this.options.host}:${this.options.port}/wits/serial?port=${serialPort}&baud=${baudRate}`;
          break;
        default:
          wsUrl = `${wsProtocol}${this.options.host}:${this.options.port}/wits`;
      }

      console.log(`Connecting to WITS data source at ${wsUrl}`);

      // Create a connection timeout
      const connectionTimeout = setTimeout(() => {
        if (this.socket && this.socket.readyState !== WebSocket.OPEN) {
          console.error("WITS connection timeout");
          this.socket.close();
          this.socket = null;
          this.connecting = false;
          this.notifyErrorCallbacks(
            "Connection timeout. Please check server address and port.",
          );
          this.attemptReconnect();
        }
      }, 10000); // 10 second timeout

      this.socket = new WebSocket(wsUrl);

      this.socket.onopen = () => {
        clearTimeout(connectionTimeout);
        console.log("WITS connection established");
        this.connected = true;
        this.connecting = false;
        this.reconnectAttempts = 0;
        this.notifyConnectionCallbacks(true);
        this.notifyErrorCallbacks(null); // Clear any previous error messages

        // Send an initial handshake message
        this.sendCommand("handshake", { protocol: this.options.protocol });
      };

      this.socket.onmessage = (event) => {
        try {
          // Check if the message is a string or binary data
          let rawData: WitsDataType;

          if (typeof event.data === "string") {
            rawData = JSON.parse(event.data) as WitsDataType;
          } else {
            // Handle binary data if needed
            const reader = new FileReader();
            reader.onload = (e) => {
              try {
                const result = e.target?.result as string;
                rawData = JSON.parse(result) as WitsDataType;
                const mappedData = this.applyWitsMappings(rawData);
                this.notifyDataCallbacks(mappedData);
              } catch (parseError) {
                console.error("Error parsing binary WITS data:", parseError);
                this.notifyErrorCallbacks("Error parsing binary WITS data");
              }
            };
            reader.readAsText(event.data);
            return; // Early return as we're handling the data asynchronously
          }

          // Apply user-defined mappings to the raw data
          const mappedData = this.applyWitsMappings(rawData);
          this.notifyDataCallbacks(mappedData);
        } catch (error) {
          console.error("Error parsing WITS data:", error);
          this.notifyErrorCallbacks(
            "Error parsing WITS data: " +
              (error instanceof Error ? error.message : String(error)),
          );
        }
      };

      this.socket.onclose = (event) => {
        clearTimeout(connectionTimeout);
        console.log(`WITS connection closed: ${event.code} - ${event.reason}`);
        this.connected = false;
        this.connecting = false;
        this.notifyConnectionCallbacks(false);

        // Provide more detailed error messages based on close code
        if (event.code === 1006) {
          this.notifyErrorCallbacks(
            "Connection closed abnormally. Server may be unavailable.",
          );
        } else if (event.code === 1000) {
          this.notifyErrorCallbacks("Connection closed normally.");
        } else {
          this.notifyErrorCallbacks(
            `Connection closed: ${event.code} - ${event.reason || "Unknown reason"}`,
          );
        }

        this.attemptReconnect();
      };

      this.socket.onerror = (error) => {
        clearTimeout(connectionTimeout);
        console.error("WITS connection error:", error);
        this.notifyErrorCallbacks(
          "WITS connection error. Please check network and server status.",
        );
      };
    } catch (error) {
      console.error("Failed to connect to WITS:", error);
      this.connecting = false;
      this.notifyErrorCallbacks(
        "Failed to connect to WITS: " +
          (error instanceof Error ? error.message : String(error)),
      );
      this.attemptReconnect();
    }
  }

  /**
   * Disconnect from WITS data source
   */
  public disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }

    this.connected = false;
    this.connecting = false;
    this.notifyConnectionCallbacks(false);
  }

  /**
   * Check if connected to WITS data source
   */
  public isConnected(): boolean {
    return this.connected;
  }

  /**
   * Register connection status callback
   */
  public onConnectionChange(callback: ConnectionCallback): void {
    this.connectionCallbacks.push(callback);
  }

  /**
   * Register data callback
   */
  public onData(callback: DataCallback): void {
    this.dataCallbacks.push(callback);
  }

  /**
   * Register error callback
   */
  public onError(callback: ErrorCallback): void {
    this.errorCallbacks.push(callback);
  }

  /**
   * Remove connection status callback
   */
  public removeConnectionCallback(callback: ConnectionCallback): void {
    this.connectionCallbacks = this.connectionCallbacks.filter(
      (cb) => cb !== callback,
    );
  }

  /**
   * Remove data callback
   */
  public removeDataCallback(callback: DataCallback): void {
    this.dataCallbacks = this.dataCallbacks.filter((cb) => cb !== callback);
  }

  /**
   * Remove error callback
   */
  public removeErrorCallback(callback: ErrorCallback): void {
    this.errorCallbacks = this.errorCallbacks.filter((cb) => cb !== callback);
  }

  /**
   * Update connection options
   */
  public updateOptions(options: WitsConnectionOptions): void {
    const wasConnected = this.connected;

    if (wasConnected) {
      this.disconnect();
    }

    this.options = { ...this.options, ...options };

    if (wasConnected) {
      this.connect();
    }
  }

  /**
   * Update WITS mappings
   */
  public updateWitsMappings(mappings: WitsMappings): void {
    this.witsMappings = mappings;
    console.log("WITS connection mappings updated:", mappings);
  }

  /**
   * Apply WITS mappings to raw data
   */
  private applyWitsMappings(rawData: WitsDataType): WitsDataType {
    // If no mappings are defined, return raw data as is
    if (!this.witsMappings) {
      return rawData;
    }

    try {
      // Create a copy of the raw data
      const mappedData = { ...rawData };

      // Helper function to convert parameter name to camelCase
      const toCamelCase = (name: string): string => {
        return (
          name.charAt(0).toLowerCase() +
          name.slice(1).replace(/\s+(.)/g, (_, char) => char.toUpperCase())
        );
      };

      // Apply drilling parameter mappings
      if (this.witsMappings.drilling) {
        this.witsMappings.drilling.forEach((mapping) => {
          // Check if mapping has both channel and witsId defined
          if (mapping.witsId && rawData[mapping.witsId] !== undefined) {
            const paramName = toCamelCase(mapping.name);
            const rawValue = rawData[mapping.witsId];

            // Apply the mapping - store both in the specific property and keep the channel mapping
            mappedData[paramName] = rawValue;

            // Also store in the channel property if channel is defined
            if (mapping.channel) {
              mappedData[mapping.channel] = rawValue;
            }
          } else if (
            mapping.channel &&
            rawData[mapping.channel] !== undefined
          ) {
            // If witsId is not available but channel is, use channel directly
            const paramName = toCamelCase(mapping.name);
            mappedData[paramName] = rawData[mapping.channel];
          }
        });
      }

      // Apply directional parameter mappings
      if (this.witsMappings.directional) {
        this.witsMappings.directional.forEach((mapping) => {
          if (mapping.witsId && rawData[mapping.witsId] !== undefined) {
            const paramName = toCamelCase(mapping.name);
            const rawValue = rawData[mapping.witsId];

            // Apply the mapping - store both in the specific property and keep the channel mapping
            mappedData[paramName] = rawValue;

            // Also store in the channel property if channel is defined
            if (mapping.channel) {
              mappedData[mapping.channel] = rawValue;
            }
          } else if (
            mapping.channel &&
            rawData[mapping.channel] !== undefined
          ) {
            // If witsId is not available but channel is, use channel directly
            const paramName = toCamelCase(mapping.name);
            mappedData[paramName] = rawData[mapping.channel];
          }
        });
      }

      // Apply calculated parameters if needed
      if (this.witsMappings.calculated) {
        // For now, we're just acknowledging these exist
        // Actual calculations would be implemented based on specific requirements
        // This is a placeholder for future implementation
      }

      return mappedData;
    } catch (error) {
      console.error("Error applying WITS mappings:", error);
      // Return original data if there's an error
      return rawData;
    }
  }

  /**
   * Send command to WITS data source
   */
  public sendCommand(command: string, params?: any): void {
    if (!this.connected || !this.socket) {
      this.notifyErrorCallbacks("Cannot send command: Not connected to WITS");
      return;
    }

    try {
      const message = JSON.stringify({ command, params });
      this.socket.send(message);
    } catch (error) {
      console.error("Error sending command to WITS:", error);
      this.notifyErrorCallbacks("Error sending command to WITS");
    }
  }

  /**
   * Attempt to reconnect to WITS data source
   */
  private attemptReconnect(): void {
    if (this.reconnectTimer || this.connecting || this.connected) return;

    const maxAttempts = this.options.maxReconnectAttempts || 10;
    if (this.reconnectAttempts >= maxAttempts) {
      console.log("Maximum reconnect attempts reached");
      this.notifyErrorCallbacks(
        `Maximum reconnect attempts (${maxAttempts}) reached. Please check connection settings and try again manually.`,
      );
      return;
    }

    this.reconnectAttempts++;
    const reconnectInterval = this.options.reconnectInterval || 5000;
    const backoffFactor = Math.min(this.reconnectAttempts, 5); // Cap at 5x for reasonable times
    const adjustedInterval = reconnectInterval * (1 + backoffFactor * 0.5); // Exponential backoff

    console.log(
      `Attempting to reconnect (${this.reconnectAttempts}/${maxAttempts}) in ${adjustedInterval / 1000} seconds...`,
    );

    this.notifyErrorCallbacks(
      `Reconnecting (attempt ${this.reconnectAttempts}/${maxAttempts}) in ${Math.round(adjustedInterval / 1000)} seconds...`,
    );

    this.reconnectTimer = window.setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, adjustedInterval);
  }

  /**
   * Notify all connection callbacks
   */
  private notifyConnectionCallbacks(connected: boolean): void {
    this.connectionCallbacks.forEach((callback) => {
      try {
        callback(connected);
      } catch (error) {
        console.error("Error in connection callback:", error);
      }
    });
  }

  /**
   * Notify all data callbacks
   */
  private notifyDataCallbacks(data: WitsDataType): void {
    this.dataCallbacks.forEach((callback) => {
      try {
        callback(data);
      } catch (error) {
        console.error("Error in data callback:", error);
      }
    });
  }

  /**
   * Notify all error callbacks
   */
  private notifyErrorCallbacks(error: string | null): void {
    this.errorCallbacks.forEach((callback) => {
      try {
        callback(error as string); // Cast to string to maintain backward compatibility
      } catch (err) {
        console.error("Error in error callback:", err);
      }
    });
  }
}

// Export singleton instance
export const witsConnection = new WitsConnection();

export default WitsConnection;
