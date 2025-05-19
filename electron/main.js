const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const { spawn } = require("child_process");
const isDev = process.env.NODE_ENV === "development";

let mainWindow;
let proxyProcess;

// Default proxy configuration
const proxyConfig = {
  host: "localhost",
  port: 8080,
  tcpHost: "localhost",
  tcpPort: 5000,
  useTLS: false,
  enableMultiplexing: true,
};

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js"),
    },
  });

  // Load the app
  const startUrl = isDev
    ? "http://localhost:5173" // Dev server URL
    : `file://${path.join(__dirname, "../dist/index.html")}`; // Production build

  mainWindow.loadURL(startUrl);

  // Open DevTools in development mode
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
    stopProxyServer();
  });
}

function startProxyServer() {
  const proxyPath = isDev
    ? path.join(__dirname, "../app/proxy.js")
    : path.join(process.resourcesPath, "app/proxy.js");

  console.log(`Starting proxy server from: ${proxyPath}`);

  // Set environment variables for proxy configuration
  const env = {
    ...process.env,
    WITS_PROXY_PORT: proxyConfig.port.toString(),
    WITS_DEFAULT_HOST: proxyConfig.tcpHost,
    WITS_DEFAULT_PORT: proxyConfig.tcpPort.toString(),
    USE_TLS: proxyConfig.useTLS ? "true" : "false",
    ENABLE_MULTIPLEXING: proxyConfig.enableMultiplexing ? "true" : "false",
  };

  proxyProcess = spawn("node", [proxyPath], {
    stdio: "pipe",
    env: env,
  });

  proxyProcess.stdout.on("data", (data) => {
    console.log(`Proxy stdout: ${data}`);
    if (mainWindow) {
      mainWindow.webContents.send("proxy-log", data.toString());
    }
  });

  proxyProcess.stderr.on("data", (data) => {
    console.error(`Proxy stderr: ${data}`);
    if (mainWindow) {
      mainWindow.webContents.send("proxy-error", data.toString());
    }
  });

  proxyProcess.on("close", (code) => {
    console.log(`Proxy server process exited with code ${code}`);
    if (mainWindow) {
      mainWindow.webContents.send("proxy-status-change", {
        running: false,
        exitCode: code,
      });
    }
    proxyProcess = null;
  });

  // Notify the renderer that the proxy has started
  if (mainWindow) {
    mainWindow.webContents.send("proxy-status-change", { running: true });
  }
}

function stopProxyServer() {
  if (proxyProcess) {
    console.log("Stopping proxy server...");
    proxyProcess.kill();
    proxyProcess = null;
  }
}

app.on("ready", () => {
  startProxyServer();
  createWindow();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (mainWindow === null) {
    createWindow();
  }
});

app.on("will-quit", () => {
  stopProxyServer();
});

// IPC handlers for proxy control
ipcMain.handle("restart-proxy", async () => {
  stopProxyServer();
  startProxyServer();
  return { success: true };
});

ipcMain.handle("proxy-status", async () => {
  return { running: proxyProcess !== null };
});

ipcMain.handle("proxy-config", async () => {
  return {
    host: proxyConfig.host,
    port: proxyConfig.port,
    tcpHost: proxyConfig.tcpHost,
    tcpPort: proxyConfig.tcpPort,
  };
});

// Update proxy configuration
ipcMain.handle("update-proxy-config", async (event, newConfig) => {
  // Update only the provided configuration values
  if (newConfig) {
    if (newConfig.port !== undefined) proxyConfig.port = newConfig.port;
    if (newConfig.tcpHost !== undefined)
      proxyConfig.tcpHost = newConfig.tcpHost;
    if (newConfig.tcpPort !== undefined)
      proxyConfig.tcpPort = newConfig.tcpPort;
    if (newConfig.useTLS !== undefined) proxyConfig.useTLS = newConfig.useTLS;
    if (newConfig.enableMultiplexing !== undefined)
      proxyConfig.enableMultiplexing = newConfig.enableMultiplexing;
  }

  // Restart the proxy with the new configuration if it's running
  if (proxyProcess) {
    stopProxyServer();
    startProxyServer();
  }

  return { success: true, config: proxyConfig };
});
