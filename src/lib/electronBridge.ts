// Type definitions for Electron preload bridge

interface ProxyControl {
  restart: () => Promise<{ success: boolean }>;
  status: () => Promise<{ running: boolean }>;
  getConfig: () => Promise<{ host: string; port: number }>;
}

interface ElectronBridge {
  proxyControl: ProxyControl;
  onProxyLog: (callback: (data: string) => void) => void;
  onProxyError: (callback: (data: string) => void) => void;
  openEmailClient?: (options: {
    to?: string;
    cc?: string;
    bcc?: string;
    subject?: string;
    body?: string;
    attachmentPaths?: string[];
  }) => Promise<boolean>;
  saveScreenshotToTemp?: (imageData: string) => Promise<string | null>;
}

declare global {
  interface Window {
    electron?: ElectronBridge;
  }
}

// Helper function to check if running in Electron
export const isElectron = (): boolean => {
  return window?.electron !== undefined;
};

// Safe access to Electron APIs
export const getElectronBridge = (): ElectronBridge | undefined => {
  return window.electron;
};

// Proxy control helpers
export const restartProxy = async (): Promise<
  { success: boolean } | undefined
> => {
  return await window.electron?.proxyControl.restart();
};

export const getProxyStatus = async (): Promise<
  { running: boolean } | undefined
> => {
  return await window.electron?.proxyControl.status();
};

// Get proxy configuration (host and port)
export const getProxyConfig = async (): Promise<
  { host: string; port: number } | undefined
> => {
  return await window.electron?.proxyControl.getConfig();
};

// Get recommended WebSocket connection settings for Electron environment
export const getRecommendedWitsSettings = async () => {
  if (!isElectron()) {
    return {
      ipAddress: "localhost",
      port: 8080,
      protocol: "WS",
      proxyMode: true,
      tcpHost: "localhost",
      tcpPort: 5000,
    };
  }

  try {
    const proxyConfig = await getProxyConfig();
    const proxyStatus = await getProxyStatus();

    if (proxyConfig && proxyStatus?.running) {
      return {
        ipAddress: proxyConfig.host || "localhost",
        port: proxyConfig.port || 8080,
        protocol: "WS",
        proxyMode: true,
        tcpHost: "localhost",
        tcpPort: 5000,
        usingElectronProxy: true,
      };
    }
  } catch (error) {
    console.error("Error getting Electron proxy settings:", error);
  }

  return {
    ipAddress: "localhost",
    port: 8080,
    protocol: "WS",
    proxyMode: true,
    tcpHost: "localhost",
    tcpPort: 5000,
  };
};
