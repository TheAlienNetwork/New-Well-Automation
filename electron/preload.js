const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electron", {
  proxyControl: {
    restart: () => ipcRenderer.invoke("restart-proxy"),
    status: () => ipcRenderer.invoke("proxy-status"),
    getConfig: () => ipcRenderer.invoke("proxy-config"),
  },
  onProxyLog: (callback) => {
    ipcRenderer.on("proxy-log", (_, data) => callback(data));
  },
  onProxyError: (callback) => {
    ipcRenderer.on("proxy-error", (_, data) => callback(data));
  },
});
