# WITS WebSocket-to-TCP Proxy

This proxy enables browser clients to connect to WITS TCP servers by translating WebSocket messages to TCP and vice versa.

## Features

- Translates WebSocket connections from browsers to TCP connections for desktop applications
- Handles reconnections, heartbeats, and error recovery
- Supports Noralis MWD mode and standard WITS protocols
- Provides status endpoint for monitoring

## Requirements

- Node.js 14.x or higher
- npm packages: ws, net, express, cors

## Installation

```bash
npm install ws net express cors
```

## Usage

### Starting the Proxy Server

```bash
node witsProxy.js
```

The server will start on port 8080 by default.

### Connecting from a Browser Client

Connect to the proxy using a WebSocket connection with the following URL format:

```
ws://localhost:8080/wits?host=192.168.1.100&port=5000&noralis=true&version=0
```

Parameters:
- `host`: TCP server hostname/IP (default: localhost)
- `port`: TCP server port (default: 5000)
- `noralis`: Set to 'true' for Noralis MWD mode (default: false)
- `version`: WITS version (0 or 1, default: 0)

### Monitoring

Check the proxy status by accessing:

```
http://localhost:8080/status
```

## Configuration

You can modify the following settings in the `config` object at the top of the file:

- `webSocketPort`: Port for the WebSocket server (default: 8080)
- `defaultTcpHost`: Default TCP server host (default: localhost)
- `defaultTcpPort`: Default TCP server port (default: 5000)
- `heartbeatInterval`: Interval between ping messages in ms (default: 15000)
- `pongTimeout`: Timeout for pong responses in ms (default: 10000)
- `maxMissedPongs`: Maximum number of missed pongs before disconnecting (default: 3)

## Protocol

### WebSocket Messages

#### From Client to Proxy

- Ping: `{"type": "ping", "timestamp": 1625097600000}`
- Pong: `{"type": "pong", "timestamp": 1625097600000}`
- Command: `{"command": "disconnect"}` or `{"command": "reconnect"}`
- Raw data: Any string that will be forwarded to the TCP server

#### From Proxy to Client

- Ping: `{"type": "ping", "timestamp": 1625097600000}`
- Pong: `{"type": "pong", "timestamp": 1625097600000}`
- Connection status: `{"type": "connection", "status": "connected", "host": "localhost", "port": 5000}`
- Error: `{"type": "error", "message": "Error message"}`
- Data: Raw data received from the TCP server

## Error Handling

The proxy implements several error handling mechanisms:

1. TCP connection errors trigger automatic reconnection attempts
2. WebSocket heartbeat mechanism detects dead connections
3. Buffer overflow protection prevents memory issues
4. Graceful shutdown on process termination

## Security Considerations

This proxy now supports TLS/SSL for secure WebSocket connections (wss://). For production environments, we recommend:

1. Enabling TLS/SSL using proper certificates (see README-SSL.md)
2. Adding authentication
3. Adding IP filtering
4. Validating messages before forwarding

See the detailed instructions in README-SSL.md for setting up secure connections.
