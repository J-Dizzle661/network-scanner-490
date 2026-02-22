import { io } from 'socket.io-client';

// Renderer-local socket client to avoid importing from outside the renderer root
export const socket = io("http://127.0.0.1:5000");

export function initWebSocket(onAlert, onServiceStatus, onScanStatus, onNetworkData) {
    if (!socket) return;

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
}

export function startScan(payload) {
    if (socket) socket.emit("start_scan", payload);
}

export function stopScan() {
    if (socket) socket.emit("stop_scan");
}