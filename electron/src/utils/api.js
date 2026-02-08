/**
 * Defines cient websocket connection; defines initialization,
 * incoming and outgoing socket events.
 * 
 * Used by renderer process to communicate with backend server.
 * 
 * Client is initialized in renderer entry point src/renderer/index.jsx.
 */

import { io } from 'socket.io-client';

let socket = null;

//
// SERVER --> CLIENT
// Function to initialize websocket client and listens for socket events
// emitted from the server.
//
export function initWebSocket(onAlert, onServiceStatus, onScanStatus, onNetworkData, onScanSummary) {
  socket = io("http://127.0.0.1:5000");

  socket.on("connect", () => {
    console.log("Connected to backend WebSocket");
  });

  socket.on("disconnect", () => {
    console.warn("WebSocket disconnected");
  });

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
    onScanSummary(summary);
  });
}

//
// CLIENT --> SERVER
// Function definitions for client requests. Uses emit to send
// requests to socket events defined in websocket_server.py.
// Triggered from UI.
//
export function startScan(payload) {
  if (!socket) {
    console.error("WebSocket not initialized");
    return;
  }

  socket.emit("start_scan", payload);
}

export function stopScan() {
  if (!socket) {
    console.error("WebSocket not initialized");
    return;
  }

  socket.emit("stop_scan");
}
