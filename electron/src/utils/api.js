import { io } from 'socket.io-client';

// Create and Export the socket immediately
export const socket = io("http://127.0.0.1:5000");

// SERVER --> CLIENT
// Function to initialize websocket client and listens for socket events
// emitted from the server.
export function initWebSocket(onAlert, onServiceStatus, onScanStatus, onNetworkData, onScanSummary) {
  if (!socket) return;

  // Connection handlers
  socket.on("connect", () => {
    console.log("Connected to backend WebSocket");
  });

  socket.on("disconnect", () => {
    console.warn("WebSocket disconnected");
  });

  // Event listeners
  socket.on("alert", (alert) => {
    onAlert(alert);
  });

  socket.on("service_status", (status) => {
    onServiceStatus(status);
  });

  socket.on("scan_status", (status) => {
    onScanStatus(status);
  });

  socket.on("network_data", (data) => {
    onNetworkData(data);
  });

  socket.on("scan_summary", (summary) => {
    if (onScanSummary) {
      onScanSummary(summary);
    }
  });

  // Return cleanup function
  return () => {
    socket.off("alert");
    socket.off("service_status");
    socket.off("scan_status");
    socket.off("network_data");
    socket.off("scan_summary");
  };
}

// CLIENT --> SERVER
export function startScan(payload) {
  if (socket) {
    socket.emit("start_scan", payload);
  }
}

export function stopScan() {
  if (socket) {
    socket.emit("stop_scan");
  }
}