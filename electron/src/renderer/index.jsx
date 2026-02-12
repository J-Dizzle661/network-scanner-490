import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import 'bootstrap/dist/css/bootstrap.css';
import '../styles/global.css';

// Import your components
import { 
  TopBar, LeftContainer, QuickTrafficInfo, AlertTable, 
  CurrentModelInfo, ControlButtons, 
  LiveTrafficGraph, LogsTable 
} from './components/HomePage.jsx';

import SettingsPage from './components/SettingsPage.jsx';
import { startScan, stopScan, initWebSocket } from './utils/api.js';
import { socket } from './utils/api.js';

const App = () => {
  // --- STATE ---
  const [currentView, setCurrentView] = useState('dashboard');
  const [logs, setLogs] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [selectedModel, setSelectedModel] = useState('randomForest');
  const [networkMetrics, setNetworkMetrics] = useState({
    flowNumber: 0,
    predictedLabel: 'N/A',
    inferenceLatency: 0,
    throughput: 0,
    cpuUsage: 0,
    memoryUsage: 0,
    isScanning: false
  });
  const [scanSummary, setScanSummary] = useState(null);
  
  // Settings state
  const [appSettings, setAppSettings] = useState({ 
    captureInterface: 'Loading...', 
    guid: '' 
  }); 
  
  const MAX_LOG_ENTRIES = 50;
  const MAX_ALERT_ENTRIES = 50;

  // --- WEBSOCKET HANDLERS ---
  function onAlert(alert) { 
    console.log("Alert received:", alert); 
  }
  
  function onServiceStatus(status) { 
    console.log("Service status:", status); 
  }
  
  function onScanStatus(status) { 
    console.log("Scan status:", status);
    
    // Reset scanning state when scan stops
    if (status.state === 'stopped') {
      setNetworkMetrics(prev => ({ ...prev, isScanning: false }));
    }
  }
  
  function onScanSummary(summary) {
    console.log("Scan summary received:", summary);
    setScanSummary(summary);
  }
  
  function onNetworkData(data) {
    console.log("Network data received:", data);
    
    // Update network metrics state with new data
    setNetworkMetrics({
      flowNumber: data.flow_number || 0,
      predictedLabel: data.predicted_label || 'N/A',
      inferenceLatency: data.inference_latency || 0,
      throughput: data.throughput || 0,
      cpuUsage: data.cpu_usage_percent || 0,
      memoryUsage: data.memory_usage_percent || 0,
      isScanning: true
    });
    
    // Create a new log entry with timestamp and formatted data
    const newLogEntry = {
      id: data.flow_number,
      timestamp: new Date().toLocaleTimeString(),
      flowNumber: data.flow_number,
      label: data.predicted_label,
      confidence: data.confidence !== null && data.confidence !== undefined ? `${(data.confidence * 100).toFixed(1)}%` : 'N/A',
      latency: data.inference_latency ? `${(data.inference_latency * 1000).toFixed(2)}ms` : 'N/A',
      throughput: data.throughput ? `${data.throughput.toFixed(2)}` : '0',
      cpu: data.cpu_usage_percent ? `${data.cpu_usage_percent}%` : 'N/A',
      memory: data.memory_usage_percent ? `${data.memory_usage_percent}%` : 'N/A'
    };

    // Add new entry with deduplication
    setLogs(prevLogs => {
      const exists = prevLogs.some(log => log.flowNumber === data.flow_number);
      if (exists) {
        console.warn(`Duplicate flow #${data.flow_number} ignored`);
        return prevLogs;
      }
      return [newLogEntry, ...prevLogs].slice(0, MAX_LOG_ENTRIES);
    });
    
    // If the flow is non-benign, also add it to alerts
    if (data.predicted_label && data.predicted_label.toLowerCase() !== 'benign') {
      setAlerts(prevAlerts => {
        const exists = prevAlerts.some(alert => alert.flowNumber === data.flow_number);
        if (exists) {
          return prevAlerts;
        }
        return [newLogEntry, ...prevAlerts].slice(0, MAX_ALERT_ENTRIES);
      });
    }
  }

  // --- EFFECTS ---
  useEffect(() => {
    // 1. Initialize WebSocket
    const cleanup = initWebSocket(onAlert, onServiceStatus, onScanStatus, onNetworkData, onScanSummary);

    // 2. Load Settings from Electron Backend on Startup
    if (window.electronAPI) {
        window.electronAPI.loadSettings().then((savedSettings) => {
            if (savedSettings && savedSettings.guid) {
                console.log("Settings loaded:", savedSettings);
                setAppSettings(savedSettings);
            } else {
                console.log("No saved settings or missing GUID. Requesting interfaces...");
                if (socket) {
                    socket.emit("request_interfaces");
                }
            }
        });
    }

    // 3. Listen for interface list updates
    if (socket) {
        socket.on("interface_list", (data) => {
            console.log("App received interfaces:", data);
            if (data.length > 0) {
                setAppSettings(prev => {
                    if (prev.guid) return prev;
                    return {
                        captureInterface: data[0].name,
                        guid: data[0].guid,
                        logPath: prev.logPath || '',
                        startOnBoot: prev.startOnBoot || 'off'
                    };
                });
            }
        });
    }

    return () => {
        if (socket) socket.off("interface_list");
        if (cleanup) cleanup(); // Clean up WebSocket listeners
    };
  }, []);

  // --- EVENT HANDLERS ---
  const handleStartScan = () => {
    console.log("Start button clicked");
    
    // Clear logs, alerts, and summary when starting a new scan
    setLogs([]);
    setAlerts([]);
    setScanSummary(null);
    
    // Use GUID for interface (or null for auto-detect)
    let targetInterface = appSettings.guid || null;
    
    if (!targetInterface) {
        console.log("No interface selected, backend will auto-detect...");
    } else {
        console.log("Starting scan on:", targetInterface);
    }
    
    startScan({
      interface: targetInterface,
      captureInterface: appSettings.captureInterface,
      mode: "live",      // Your replay mode support
      model: selectedModel  // Andrew's model selection
    });
  };
  
  const handleStopScan = () => {
    console.log("Stop button clicked");
    stopScan();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <TopBar />
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <LeftContainer onViewChange={setCurrentView} />
        <main style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
          
          {currentView === 'dashboard' && (
            <>
              <h1 id="liveTrafficText">Live Traffic</h1>
              <QuickTrafficInfo metrics={networkMetrics} summary={scanSummary} />
              
              <h5 id="alertsText">Alerts</h5>
              <AlertTable alerts={alerts} />
              
              <h5 id="logsText">Logs</h5>
              <LogsTable logs={logs} />
              
              <CurrentModelInfo value={selectedModel} onChange={setSelectedModel} />
              
              <ControlButtons 
                onStart={handleStartScan} 
                onStop={handleStopScan} 
                selectedInterface={appSettings.captureInterface}
                selectedModel={selectedModel}
              />
              
              <LiveTrafficGraph />
            </>
          )}

          {currentView === 'settings' && (
            <SettingsPage />
          )}

        </main>
      </div>
    </div>
  );
};

const root = createRoot(document.getElementById('root'));
root.render(<App />);