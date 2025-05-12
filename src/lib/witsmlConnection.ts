/**
 * WITSML Connection Handler
 * Supports connection to WITSML servers for real-time drilling data
 */

import { WitsDataType, WitsMappings } from "@/context/WitsContext";

type ConnectionCallback = (connected: boolean) => void;
type DataCallback = (data: WitsDataType) => void;
type ErrorCallback = (error: string | null) => void;

interface WitsmlConnectionOptions {
  url: string;
  username: string;
  password: string;
  wellUid: string;
  wellboreUid: string;
  logUid: string;
  pollingInterval: number;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  wellId?: string;
  wellName?: string;
  rigName?: string;
  sensorOffset?: number;
  witsmlVersion?: string; // WITSML version (1.3.1.1 or 1.4.1.1)
  requestTimeout?: number; // Timeout for WITSML requests in ms
}

class WitsmlConnection {
  private connected: boolean = false;
  private connecting: boolean = false;
  private pollingInterval: NodeJS.Timeout | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private reconnectAttempts: number = 0;
  private connectionCallbacks: ConnectionCallback[] = [];
  private dataCallbacks: DataCallback[] = [];
  private errorCallbacks: ErrorCallback[] = [];
  private witsMappings: WitsMappings | null = null;
  private options: WitsmlConnectionOptions;
  private lastDataTime: number = 0;
  private abortController: AbortController | null = null;

  constructor(options?: WitsmlConnectionOptions) {
    this.options = {
      url: "",
      username: "",
      password: "",
      wellUid: "",
      wellboreUid: "",
      logUid: "REALTIME",
      pollingInterval: 10000,
      reconnectInterval: 30000,
      maxReconnectAttempts: 100,
      ...options,
    };
  }

  /* Public Methods */
  public connect(): void {
    if (this.connected || this.connecting) return;

    this.connecting = true;
    this.notifyErrorCallbacks(
      `Connecting to WITSML server at ${this.options.url}...`,
    );

    // Reset connection state
    this.lastDataTime = Date.now();

    try {
      this.startPolling();
      console.log(`Connection attempt initiated to ${this.options.url}`);
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

    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }

    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }

    this.connected = false;
    this.connecting = false;
    this.reconnectAttempts = 0;
    this.notifyConnectionCallbacks(false);
    this.notifyErrorCallbacks(null); // Clear any error messages

    console.log("WITSML connection disconnected and resources cleaned up");
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

  public updateOptions(options: Partial<WitsmlConnectionOptions>): void {
    const wasConnected = this.connected;
    if (wasConnected) this.disconnect();
    this.options = { ...this.options, ...options };
    if (wasConnected) this.connect();
  }

  public updateWitsMappings(mappings: WitsMappings): void {
    this.witsMappings = mappings;
  }

  public sendCommand(command: string, params?: any): void {
    if (!this.connected) {
      this.notifyErrorCallbacks("Cannot send command: Not connected");
      return;
    }

    // For WITSML, most commands would be handled through the polling mechanism
    // This is primarily a placeholder for future command functionality
    console.log(`WITSML command sent: ${command}`, params);
  }

  /* Private Methods */
  private startPolling(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }

    // Validate connection parameters
    if (!this.options.url || this.options.url.trim() === "") {
      throw new Error("WITSML server URL cannot be empty");
    }

    if (!this.options.username || this.options.username.trim() === "") {
      throw new Error("WITSML username cannot be empty");
    }

    // Initial fetch to verify connection
    this.fetchWitsmlData()
      .then(() => {
        this.handleConnectionSuccess();

        // Start regular polling after successful connection
        this.pollingInterval = setInterval(() => {
          this.fetchWitsmlData().catch((error) => {
            console.error("Error during WITSML polling:", error);
            this.notifyErrorCallbacks(
              `WITSML polling error: ${error.message || String(error)}`,
            );
          });
        }, this.options.pollingInterval);
      })
      .catch((error) => {
        this.handleConnectionError(error);
      });
  }

  private async fetchWitsmlData(): Promise<void> {
    if (this.abortController) {
      this.abortController.abort();
    }
    this.abortController = new AbortController();

    try {
      // Prepare WITSML query
      const witsmlQuery = this.buildWitsmlQuery();

      // Set timeout for the request
      const timeout = this.options.requestTimeout || 30000; // Default 30 seconds
      const timeoutId = setTimeout(() => {
        if (this.abortController) {
          this.abortController.abort();
        }
      }, timeout);

      // Send request to WITSML server
      const response = await fetch(this.options.url, {
        method: "POST",
        headers: {
          "Content-Type": "text/xml;charset=UTF-8",
          Authorization:
            "Basic " +
            btoa(`${this.options.username}:${this.options.password}`),
        },
        body: witsmlQuery,
        signal: this.abortController.signal,
      });

      // Clear the timeout since the request completed
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(
          `WITSML server returned ${response.status}: ${response.statusText}`,
        );
      }

      // Check for SOAP fault in the response
      const contentType = response.headers.get("Content-Type") || "";
      if (contentType.includes("xml")) {
        const xmlText = await response.text();
        if (xmlText.includes("<soap:Fault>") || xmlText.includes("<Fault>")) {
          // Parse the SOAP fault message
          const parser = new DOMParser();
          const xmlDoc = parser.parseFromString(xmlText, "text/xml");
          const faultString =
            xmlDoc.querySelector("faultstring")?.textContent ||
            xmlDoc.querySelector("soap\\:Fault")?.textContent ||
            "Unknown SOAP fault";
          throw new Error(`WITSML SOAP fault: ${faultString}`);
        }

        // Process the valid XML response
        const witsData = this.parseWitsmlResponse(xmlText);
        this.lastDataTime = Date.now();
        this.notifyDataCallbacks(witsData);
        return;
      }

      // If we didn't handle the response as XML above, process it as text
      const xmlText = await response.text();
      const witsData = this.parseWitsmlResponse(xmlText);

      this.lastDataTime = Date.now();
      this.notifyDataCallbacks(witsData);
    } catch (error) {
      if (error.name === "AbortError") {
        console.log("WITSML fetch aborted");
        return;
      }

      // Enhanced error handling with retry logic for network errors
      if (error instanceof TypeError && error.message.includes("network")) {
        console.warn(
          "WITSML network error, will retry on next polling interval",
          error,
        );
        this.notifyErrorCallbacks(
          `WITSML network error: ${error.message}. Will retry automatically.`,
        );
        return;
      }

      throw error;
    }
  }

  private buildWitsmlQuery(): string {
    // Determine which WITSML version to use
    const witsmlVersion = this.options.witsmlVersion || "1.4.1.1";
    const isVersion131 = witsmlVersion.startsWith("1.3");

    // Build appropriate query based on WITSML version
    if (isVersion131) {
      // WITSML 1.3.1 query format
      return `<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:witsml="http://www.witsml.org/schemas/131">
  <soap:Header/>
  <soap:Body>
    <witsml:WMLS_GetFromStore>
      <witsml:WMLtypeIn>log</witsml:WMLtypeIn>
      <witsml:QueryIn>
        <?xml version="1.0" encoding="UTF-8"?>
        <logs xmlns="http://www.witsml.org/schemas/131" version="1.3.1.1">
          <log uidWell="${this.options.wellUid}" uidWellbore="${this.options.wellboreUid}" uid="${this.options.logUid}">
            <nameWell></nameWell>
            <nameWellbore></nameWellbore>
            <name></name>
            <startDateTimeIndex></startDateTimeIndex>
            <endDateTimeIndex></endDateTimeIndex>
            <logData>
              <mnemonicList></mnemonicList>
              <unitList></unitList>
              <data></data>
            </logData>
          </log>
        </logs>
      </witsml:QueryIn>
      <witsml:OptionsIn>returnElements=latest</witsml:OptionsIn>
    </witsml:WMLS_GetFromStore>
  </soap:Body>
</soap:Envelope>`;
    } else {
      // WITSML 1.4.1 query format (default)
      return `<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:witsml="http://www.witsml.org/schemas/1series">
  <soap:Header/>
  <soap:Body>
    <witsml:WMLS_GetFromStore xmlns:witsml="http://www.witsml.org/schemas/1series">
      <witsml:WMLtypeIn>log</witsml:WMLtypeIn>
      <witsml:QueryIn>
        <logs xmlns="http://www.witsml.org/schemas/1series" version="1.4.1.1">
          <log uidWell="${this.options.wellUid}" uidWellbore="${this.options.wellboreUid}" uid="${this.options.logUid}">
            <nameWell></nameWell>
            <nameWellbore></nameWellbore>
            <name></name>
            <startDateTimeIndex></startDateTimeIndex>
            <endDateTimeIndex></endDateTimeIndex>
            <logData>
              <mnemonicList></mnemonicList>
              <unitList></unitList>
              <data></data>
            </logData>
          </log>
        </logs>
      </witsml:QueryIn>
      <witsml:OptionsIn>returnElements=latest</witsml:OptionsIn>
    </witsml:WMLS_GetFromStore>
  </soap:Body>
</soap:Envelope>`;
    }
  }

  private parseWitsmlResponse(xmlText: string): WitsDataType {
    // Create a default data object
    const witsData: WitsDataType = {
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
      source: "witsml",
      wellId: this.options.wellId,
      wellName: this.options.wellName,
      rigName: this.options.rigName,
      sensorOffset: this.options.sensorOffset,
    };

    try {
      // Parse XML response
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlText, "text/xml");

      // Extract mnemonics, units, and data
      const mnemonicListElement = xmlDoc.querySelector("mnemonicList");
      const unitListElement = xmlDoc.querySelector("unitList");
      const dataElements = xmlDoc.querySelectorAll("data");

      if (mnemonicListElement && unitListElement && dataElements.length > 0) {
        const mnemonics = mnemonicListElement.textContent?.split(",") || [];
        const units = unitListElement.textContent?.split(",") || [];
        const latestData =
          dataElements[dataElements.length - 1].textContent?.split(",") || [];

        // Map the data to our witsData object
        mnemonics.forEach((mnemonic, index) => {
          const value = parseFloat(latestData[index] || "0");
          if (!isNaN(value)) {
            this.mapWitsmlMnemonicToWitsData(witsData, mnemonic.trim(), value);
          }
        });
      }

      // Apply WITS mappings if available
      return this.applyWitsMappings(witsData);
    } catch (error) {
      console.error("Error parsing WITSML response:", error);
      return witsData;
    }
  }

  private mapWitsmlMnemonicToWitsData(
    witsData: WitsDataType,
    mnemonic: string,
    value: number,
  ): void {
    // Map common WITSML mnemonics to our WitsDataType properties
    // This is a simplified mapping and should be expanded based on actual WITSML server data
    switch (mnemonic.toUpperCase()) {
      case "DEPTH":
      case "BDEP":
      case "BIT_DEPTH":
        witsData.bitDepth = value;
        break;
      case "HDEP":
      case "HOLE_DEPTH":
        witsData.holeDepth = value;
        break;
      case "ROP":
      case "ROPA":
        witsData.rop = value;
        break;
      case "WOB":
      case "WOBA":
        witsData.wob = value;
        break;
      case "HKLD":
      case "HOOK_LOAD":
        witsData.hookload = value;
        break;
      case "SPP":
      case "PUMP_PRESSURE":
        witsData.pumpPressure = value;
        break;
      case "FLOW":
      case "FLOW_RATE":
        witsData.flowRate = value;
        break;
      case "TRQ":
      case "TORQUE":
        witsData.rotaryTorque = value;
        break;
      case "RPM":
      case "ROTARY_RPM":
        witsData.rotaryRpm = value;
        break;
      case "GR":
      case "GAMMA":
        witsData.gamma = value;
        break;
      case "INC":
      case "INCLINATION":
        witsData.inclination = value;
        break;
      case "AZI":
      case "AZIMUTH":
        witsData.azimuth = value;
        break;
      case "TF":
      case "TOOL_FACE":
        witsData.toolFace = value;
        break;
      case "TEMP":
      case "TEMPERATURE":
        witsData.temperature = value;
        break;
      case "DLS":
        witsData.dls = value;
        break;
      // Add more mappings as needed
      default:
        // Store unknown mnemonics with their channel number for custom mappings
        const channelMatch = mnemonic.match(/^CH(\d+)$/);
        if (channelMatch) {
          const channel = parseInt(channelMatch[1], 10);
          if (!isNaN(channel)) {
            witsData[channel] = value;
          }
        }
        break;
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
    console.log("WITSML connection established");
    this.connected = true;
    this.connecting = false;
    this.reconnectAttempts = 0;
    this.notifyConnectionCallbacks(true);
    this.notifyErrorCallbacks(null);
    this.lastDataTime = Date.now();
  }

  private handleConnectionError(error: Error): void {
    console.error("WITSML connection error:", error);
    this.connected = false;
    this.connecting = false;
    this.notifyConnectionCallbacks(false);
    this.notifyErrorCallbacks(`WITSML connection error: ${error.message}`);
    this.attemptReconnect();
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
    const reconnectInterval = this.options.reconnectInterval || 30000;

    // Use exponential backoff with a cap
    const baseInterval = reconnectInterval;
    const maxInterval = 120000; // Cap at 2 minutes
    const exponentialFactor = Math.min(
      Math.pow(1.5, Math.min(this.reconnectAttempts, 10) - 1),
      6,
    );
    const adjustedInterval = Math.min(
      baseInterval * exponentialFactor,
      maxInterval,
    );

    console.log(
      `Scheduling WITSML reconnect attempt ${this.reconnectAttempts}/${maxAttempts} in ${adjustedInterval / 1000} seconds`,
    );

    this.notifyErrorCallbacks(
      `Reconnecting to WITSML server (attempt ${this.reconnectAttempts}/${maxAttempts}) in ${Math.round(adjustedInterval / 1000)} seconds...`,
    );

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      console.log(
        `Executing WITSML reconnect attempt ${this.reconnectAttempts}/${maxAttempts}`,
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

export const witsmlConnection = new WitsmlConnection();
export default WitsmlConnection;
