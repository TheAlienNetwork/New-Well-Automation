/**
 * WITS WebSocket-to-TCP Proxy Server
 *
 * This proxy enables browser clients to connect to WITS TCP servers
 * by translating WebSocket messages to TCP and vice versa.
 */

import { WebSocketServer } from "ws";
import * as net from "net";
import express from "express";
import cors from "cors";
import * as http from "http";
import * as https from "https";
import * as fs from "fs";

// Configuration
const config = {
  // WebSocket server settings
  webSocketPort: process.env.WITS_PROXY_PORT
    ? parseInt(process.env.WITS_PROXY_PORT, 10)
    : 8080,
  // Default TCP server settings (can be overridden by client)
  defaultTcpHost: process.env.WITS_DEFAULT_HOST || "localhost",
  defaultTcpPort: process.env.WITS_DEFAULT_PORT
    ? parseInt(process.env.WITS_DEFAULT_PORT, 10)
    : 5000,
  // Heartbeat settings
  heartbeatInterval: process.env.WITS_HEARTBEAT_INTERVAL
    ? parseInt(process.env.WITS_HEARTBEAT_INTERVAL, 10)
    : 15000,
  pongTimeout: process.env.WITS_PONG_TIMEOUT
    ? parseInt(process.env.WITS_PONG_TIMEOUT, 10)
    : 10000,
  maxMissedPongs: process.env.WITS_MAX_MISSED_PONGS
    ? parseInt(process.env.WITS_MAX_MISSED_PONGS, 10)
    : 3,
  // SSL/TLS settings
  useTLS: process.env.USE_TLS === "true",
  certPath: process.env.CERT_PATH || "./certs/cert.pem",
  keyPath: process.env.KEY_PATH || "./certs/key.pem",
  // Client connection multiplexing
  enableMultiplexing: process.env.ENABLE_MULTIPLEXING === "true",
  // Connection reliability settings
  maxReconnectAttempts: process.env.WITS_MAX_RECONNECT_ATTEMPTS
    ? parseInt(process.env.WITS_MAX_RECONNECT_ATTEMPTS, 10)
    : 10,
  bufferSize: process.env.WITS_BUFFER_SIZE
    ? parseInt(process.env.WITS_BUFFER_SIZE, 10)
    : 10000,
  tcpKeepAliveInterval: process.env.WITS_TCP_KEEPALIVE_INTERVAL
    ? parseInt(process.env.WITS_TCP_KEEPALIVE_INTERVAL, 10)
    : 30000,
  socketTimeout: process.env.WITS_SOCKET_TIMEOUT
    ? parseInt(process.env.WITS_SOCKET_TIMEOUT, 10)
    : 300000,
};

// Create Express app for handling HTTP requests
const app = express();
app.use(cors());
app.use(express.json());

// Create HTTP/HTTPS server based on configuration
let server;

if (config.useTLS) {
  try {
    // Check if certificate files exist
    if (!fs.existsSync(config.certPath) || !fs.existsSync(config.keyPath)) {
      console.error(
        `SSL certificate files not found at ${config.certPath} and ${config.keyPath}`,
      );
      console.error(
        "Falling back to HTTP mode. Please provide valid certificate files for TLS/SSL support.",
      );
      server = http.createServer(app);
    } else {
      // Create HTTPS server with SSL certificates
      const sslOptions = {
        cert: fs.readFileSync(config.certPath),
        key: fs.readFileSync(config.keyPath),
      };
      server = https.createServer(sslOptions, app);
      console.log("HTTPS server created with SSL/TLS support");
    }
  } catch (error) {
    console.error(`Error setting up HTTPS server: ${error.message}`);
    console.error("Falling back to HTTP mode.");
    server = http.createServer(app);
  }
} else {
  // Create standard HTTP server
  server = http.createServer(app);
}

// Create WebSocket server
const wss = new WebSocketServer({ server });

// Store active connections
const activeConnections = new Map();

// Store TCP connections for multiplexing (multiple WebSocket clients can share a TCP connection)
const tcpConnections = new Map(); // key: "host:port", value: { socket, clients: Set, buffer: string }

// Status endpoint
app.get("/status", (req, res) => {
  res.json({
    status: "running",
    activeConnections: activeConnections.size,
    uptime: process.uptime(),
  });
});

// WebSocket server
wss.on("connection", (ws, req) => {
  console.log("New WebSocket connection established");

  // Parse connection parameters from URL query
  const protocol = req.headers.host.startsWith("localhost")
    ? "http:"
    : req.socket.encrypted
      ? "https:"
      : "http:";
  const url = new URL(req.url, `${protocol}//${req.headers.host}`);
  const tcpHost = url.searchParams.get("host") || config.defaultTcpHost;
  const tcpPort = parseInt(
    url.searchParams.get("port") || config.defaultTcpPort,
    10,
  );
  const noralisMode = url.searchParams.get("noralis") === "true";
  const witsVersion = url.searchParams.get("version") || "0";

  console.log(
    `Connection parameters: TCP ${tcpHost}:${tcpPort}, Noralis mode: ${noralisMode}, WITS version: ${witsVersion}`,
  );

  // Create unique connection ID
  const connectionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Connection state
  let tcpSocket = null;
  let isAlive = true;
  let missedPongs = 0;
  let pingInterval = null;
  let pongTimeout = null;
  let reconnectAttempts = 0;
  let buffer = "";
  const delimiter = noralisMode ? "\r\n" : "\n";

  // Store connection in active connections map
  activeConnections.set(connectionId, {
    ws,
    tcpSocket: null,
    tcpHost,
    tcpPort,
    connected: false,
    noralisMode,
    witsVersion,
    connectionTime: new Date(),
  });

  // Helper function to connect to TCP server
  const connectToTcpServer = () => {
    // Check if we should use multiplexing
    const tcpKey = `${tcpHost}:${tcpPort}`;
    let sharedConnection = null;

    if (config.enableMultiplexing) {
      sharedConnection = tcpConnections.get(tcpKey);

      // If there's already a connection to this TCP server, use it
      if (sharedConnection && sharedConnection.socket.writable) {
        console.log(
          `Using existing TCP connection to ${tcpHost}:${tcpPort} (multiplexed)`,
        );
        tcpSocket = sharedConnection.socket;
        activeConnections.get(connectionId).tcpSocket = tcpSocket;
        sharedConnection.clients.add(connectionId);

        // Process any data already in the buffer
        if (sharedConnection.buffer) {
          buffer += sharedConnection.buffer;
          processBuffer();
        }

        // Send connection success message to client
        ws.send(
          JSON.stringify({
            type: "connection",
            status: "connected",
            host: tcpHost,
            port: tcpPort,
            multiplexed: true,
          }),
        );

        // Send initial handshake if in Noralis mode
        if (noralisMode && tcpSocket.writable) {
          tcpSocket.write(delimiter);
        }

        return;
      }
    }

    // If we get here, we need to create a new TCP connection
    if (tcpSocket) {
      try {
        tcpSocket.destroy();
      } catch (err) {
        console.error("Error destroying previous TCP socket:", err);
      }
    }

    console.log(`Connecting to TCP server at ${tcpHost}:${tcpPort}`);

    tcpSocket = new net.Socket();
    activeConnections.get(connectionId).tcpSocket = tcpSocket;

    // If multiplexing is enabled, store this connection for reuse
    if (config.enableMultiplexing) {
      tcpConnections.set(tcpKey, {
        socket: tcpSocket,
        clients: new Set([connectionId]),
        buffer: "",
      });
    }

    tcpSocket.connect(tcpPort, tcpHost, () => {
      console.log(`TCP connection established to ${tcpHost}:${tcpPort}`);
      activeConnections.get(connectionId).connected = true;
      reconnectAttempts = 0;

      // Send connection success message to client
      ws.send(
        JSON.stringify({
          type: "connection",
          status: "connected",
          host: tcpHost,
          port: tcpPort,
          multiplexed: config.enableMultiplexing,
        }),
      );

      // Send initial handshake if in Noralis mode
      if (noralisMode) {
        tcpSocket.write(delimiter);
      }
    });

    tcpSocket.on("data", (data) => {
      // Process incoming TCP data
      const dataStr = data.toString("ascii");
      buffer += dataStr;

      // If multiplexing is enabled, store the data in the shared buffer
      if (config.enableMultiplexing) {
        const tcpKey = `${tcpHost}:${tcpPort}`;
        const sharedConnection = tcpConnections.get(tcpKey);
        if (sharedConnection) {
          sharedConnection.buffer += dataStr;
        }
      }

      processBuffer();
    });

    tcpSocket.on("error", (err) => {
      console.error(`TCP socket error: ${err.message}`);
      ws.send(
        JSON.stringify({
          type: "error",
          message: `TCP connection error: ${err.message}`,
        }),
      );

      // Mark connection as disconnected
      if (activeConnections.has(connectionId)) {
        activeConnections.get(connectionId).connected = false;
      }

      // Attempt to reconnect
      attemptReconnect();
    });

    tcpSocket.on("close", () => {
      console.log("TCP connection closed");
      ws.send(
        JSON.stringify({
          type: "connection",
          status: "disconnected",
        }),
      );

      // Mark connection as disconnected
      if (activeConnections.has(connectionId)) {
        activeConnections.get(connectionId).connected = false;
      }

      // Attempt to reconnect
      attemptReconnect();
    });

    // TCP socket optimizations for production reliability
    tcpSocket.setKeepAlive(true, config.tcpKeepAliveInterval);
    tcpSocket.setNoDelay(true); // Disable Nagle's algorithm
    tcpSocket.setTimeout(config.socketTimeout); // Set socket timeout

    // Set additional socket options for better reliability
    if (typeof tcpSocket.setKeepAlive === "function") {
      tcpSocket.setKeepAlive(true, config.tcpKeepAliveInterval);
    }

    // Increase socket buffer sizes for better performance
    if (typeof tcpSocket.setNoDelay === "function") {
      tcpSocket.setNoDelay(true);
    }
  };

  // Process the buffer for complete WITS records
  const processBuffer = () => {
    const records = buffer.split(delimiter);

    // Keep the last incomplete record in the buffer
    buffer = records.pop() || "";

    // Prevent buffer from growing too large
    if (buffer.length > config.bufferSize) {
      console.warn(
        `Buffer exceeds ${config.bufferSize / 1000}KB without finding delimiter, truncating`,
      );
      buffer = buffer.substring(buffer.length - config.bufferSize / 2);

      // Also truncate the shared buffer if multiplexing is enabled
      if (config.enableMultiplexing) {
        const tcpKey = `${tcpHost}:${tcpPort}`;
        const sharedConnection = tcpConnections.get(tcpKey);
        if (
          sharedConnection &&
          sharedConnection.buffer.length > config.bufferSize
        ) {
          sharedConnection.buffer = sharedConnection.buffer.substring(
            sharedConnection.buffer.length - config.bufferSize / 2,
          );
        }
      }
    }

    // Process each complete record
    records.forEach((record) => {
      if (record.trim().length > 0) {
        // Forward the record to the WebSocket client
        try {
          ws.send(record);
        } catch (err) {
          console.error(
            `Error sending data to WebSocket client: ${err.message}`,
          );
        }
      }
    });
  };

  // Attempt to reconnect to TCP server with exponential backoff
  const attemptReconnect = () => {
    const maxReconnectAttempts = config.maxReconnectAttempts;
    if (reconnectAttempts >= maxReconnectAttempts) {
      console.log(
        `Maximum reconnect attempts (${maxReconnectAttempts}) reached`,
      );
      ws.send(
        JSON.stringify({
          type: "error",
          message: `Maximum reconnect attempts (${maxReconnectAttempts}) reached. Please check your connection settings.`,
        }),
      );
      return;
    }

    reconnectAttempts++;
    // Improved exponential backoff algorithm with jitter for better distribution
    const baseDelay = 1000; // Start with 1 second
    const maxDelay = 60000; // Cap at 60 seconds
    const exponentialPart = Math.min(Math.pow(1.5, reconnectAttempts), 60); // Exponential factor
    const jitter = Math.random() * 0.3 + 0.85; // Random between 0.85 and 1.15 (±15% jitter)
    const delay = Math.min(baseDelay * exponentialPart * jitter, maxDelay);

    console.log(
      `Attempting to reconnect in ${delay / 1000} seconds (attempt ${reconnectAttempts}/${maxReconnectAttempts})`,
    );

    ws.send(
      JSON.stringify({
        type: "connection",
        status: "reconnecting",
        attempt: reconnectAttempts,
        maxAttempts: maxReconnectAttempts,
        delay: delay,
      }),
    );

    setTimeout(connectToTcpServer, delay);
  };

  // Set up heartbeat mechanism
  const heartbeat = () => {
    isAlive = true;
    missedPongs = 0;

    if (pongTimeout) {
      clearTimeout(pongTimeout);
      pongTimeout = null;
    }
  };

  // Start ping interval
  pingInterval = setInterval(() => {
    if (!isAlive) {
      missedPongs++;
      console.warn(
        `Missed pong response (${missedPongs}/${config.maxMissedPongs})`,
      );

      if (missedPongs >= config.maxMissedPongs) {
        console.error(
          `Maximum missed pongs (${config.maxMissedPongs}) reached, terminating connection`,
        );
        terminateConnection();
        return;
      }
    }

    isAlive = false;
    ws.send(JSON.stringify({ type: "ping", timestamp: Date.now() }));

    pongTimeout = setTimeout(() => {
      if (!isAlive) {
        console.warn("Pong timeout reached");
      }
    }, config.pongTimeout);
  }, config.heartbeatInterval);

  // Handle WebSocket messages
  ws.on("message", (message) => {
    try {
      // Try to parse as JSON first
      const data = JSON.parse(message);

      // Handle ping/pong messages
      if (data.type === "ping") {
        ws.send(JSON.stringify({ type: "pong", timestamp: Date.now() }));
        return;
      }

      if (data.type === "pong") {
        heartbeat();
        return;
      }

      // Handle command messages
      if (data.command) {
        if (data.command === "disconnect") {
          console.log("Received disconnect command");
          cleanupConnection();
          return;
        }

        if (data.command === "reconnect") {
          console.log("Received reconnect command");
          connectToTcpServer();
          return;
        }

        // Forward other commands to TCP server if connected
        if (tcpSocket && tcpSocket.writable) {
          tcpSocket.write(JSON.stringify(data) + delimiter);
        } else {
          ws.send(
            JSON.stringify({
              type: "error",
              message: "Cannot send command: TCP connection not established",
            }),
          );
        }
      }
    } catch (err) {
      // Not JSON, treat as raw data to forward to TCP server
      if (tcpSocket && tcpSocket.writable) {
        tcpSocket.write(message + delimiter);
      } else {
        ws.send(
          JSON.stringify({
            type: "error",
            message: "Cannot send data: TCP connection not established",
          }),
        );
      }
    }
  });

  // Handle WebSocket close
  ws.on("close", () => {
    console.log("WebSocket connection closed");
    cleanupConnection();
  });

  // Handle WebSocket errors
  ws.on("error", (err) => {
    console.error(`WebSocket error: ${err.message}`);
    cleanupConnection();
  });

  // Handle pong messages
  ws.on("pong", () => {
    heartbeat();
  });

  // Clean up connection resources
  const cleanupConnection = () => {
    if (pingInterval) {
      clearInterval(pingInterval);
      pingInterval = null;
    }

    if (pongTimeout) {
      clearTimeout(pongTimeout);
      pongTimeout = null;
    }

    // Handle multiplexed connections differently
    if (config.enableMultiplexing && tcpSocket) {
      const tcpKey = `${tcpHost}:${tcpPort}`;
      const sharedConnection = tcpConnections.get(tcpKey);

      if (sharedConnection) {
        // Remove this client from the shared connection
        sharedConnection.clients.delete(connectionId);

        // If no more clients are using this connection, close it
        if (sharedConnection.clients.size === 0) {
          try {
            tcpSocket.end();
            tcpSocket.destroy();
            tcpConnections.delete(tcpKey);
            console.log(
              `Closed multiplexed TCP connection to ${tcpHost}:${tcpPort} - no more clients`,
            );
          } catch (err) {
            console.error("Error closing TCP socket:", err);
          }
        } else {
          console.log(
            `Keeping multiplexed TCP connection to ${tcpHost}:${tcpPort} - ${sharedConnection.clients.size} clients remaining`,
          );
        }
      }
    } else if (tcpSocket) {
      // Standard non-multiplexed connection cleanup
      try {
        tcpSocket.end();
        tcpSocket.destroy();
      } catch (err) {
        console.error("Error closing TCP socket:", err);
      }
    }

    tcpSocket = null;
    activeConnections.delete(connectionId);
  };

  // Forcefully terminate connection
  const terminateConnection = () => {
    cleanupConnection();
    try {
      ws.terminate();
    } catch (err) {
      console.error("Error terminating WebSocket:", err);
    }
  };

  // Initialize connection
  connectToTcpServer();
});

// Start the server
server.listen(config.webSocketPort, () => {
  const protocol = config.useTLS ? "HTTPS" : "HTTP";
  const wsProtocol = config.useTLS ? "WSS" : "WS";
  console.log(
    `WITS ${wsProtocol} Proxy Server running on ${protocol} port ${config.webSocketPort}`,
  );
  console.log(
    `Default TCP target: ${config.defaultTcpHost}:${config.defaultTcpPort}`,
  );
  console.log(
    `Multiplexing: ${config.enableMultiplexing ? "Enabled" : "Disabled"}`,
  );
});

// Handle server errors
server.on("error", (err) => {
  console.error(`Server error: ${err.message}`);
});

// Handle process termination
process.on("SIGINT", () => {
  console.log("Shutting down WITS proxy server...");

  // Close all active connections
  activeConnections.forEach((conn, id) => {
    try {
      if (conn.tcpSocket) {
        conn.tcpSocket.end();
        conn.tcpSocket.destroy();
      }
      if (conn.ws) {
        conn.ws.terminate();
      }
    } catch (err) {
      console.error(`Error closing connection ${id}:`, err);
    }
  });

  // Close the server
  server.close(() => {
    console.log("Server closed");
    process.exit(0);
  });
});
