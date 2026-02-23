import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import 'bootstrap/dist/css/bootstrap.css';
import '../styles/global.css';
import { TopBar } from './components/HomePage.jsx';
import { LeftContainer } from './components/HomePage.jsx';
import { MetricsSection } from './components/HomePage.jsx';
import { AlertTable } from './components/HomePage.jsx';
import { CurrentModelInfo } from './components/HomePage.jsx';
import { ControlButtons } from './components/HomePage.jsx';
import { Interface } from './components/HomePage.jsx';
import { LiveTrafficGraph } from './components/HomePage.jsx';
import { LogsTable } from './components/HomePage.jsx';
import ListGroup from './components/ListGroup.jsx';
import { startScan, stopScan, initWebSocket } from '../utils/api.js';

// Import your components
import { 
  TopBar, LeftContainer, QuickTrafficInfo, AlertTable, 
  CurrentModelInfo, ControlButtons, 
  LiveTrafficGraph, LogsTable 
} from './components/HomePage.jsx';

import SettingsPage from './components/SettingsPage.jsx'; // Import the new page
import { startScan, stopScan, initWebSocket } from './utils/api.js';
import { socket } from './utils/api.js';

// In src/index.jsx

const App = () => {

  // State variables
  const [currentView, setCurrentView] = useState('dashboard');
  const [selectedModel, setSelectedModel] = useState('randomForest');
  const [logs, setLogs] = useState([]);
  const [alerts, setAlerts] = useState([]);


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
  
  const [appSettings, setAppSettings] = userState({
    captureInterface: 'Loading...',
    guid: ''
  });

  const MAX_LOG_ENTRIES = 50;
  const MAX_ALERT_ENTRIES = 50;

  // Socket event handler functions; passed in initWebSocket() to
  // register callbacks for incoming events from the backend server.
  // These functions update the UI based on incoming data.
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
      id: data.flow_number, // Use flow_number as unique ID
      timestamp: new Date().toLocaleTimeString(),
      flowNumber: data.flow_number,
      label: data.predicted_label,
      confidence: data.confidence !== null && data.confidence !== undefined ? `${(data.confidence * 100).toFixed(1)}%` : 'N/A',
      latency: data.inference_latency ? `${(data.inference_latency * 1000).toFixed(2)}ms` : 'N/A',
      throughput: data.throughput ? `${data.throughput.toFixed(2)}` : '0',
      cpu: data.cpu_usage_percent ? `${data.cpu_usage_percent}%` : 'N/A',
      memory: data.memory_usage_percent ? `${data.memory_usage_percent}%` : 'N/A'
    };

    // Add new entry with deduplication - only add if flow_number doesn't already exist
    setLogs(prevLogs => {
      // Check if this flow_number already exists in the logs
      const exists = prevLogs.some(log => log.flowNumber === data.flow_number);
      if (exists) {
        console.warn(`Duplicate flow #${data.flow_number} ignored`);
        return prevLogs; // Don't add duplicate
      }
      return [newLogEntry, ...prevLogs].slice(0, MAX_LOG_ENTRIES);
    });
    
    // If the flow is non-benign, also add it to alerts
    if (data.predicted_label && data.predicted_label.toLowerCase() !== 'benign') {
      setAlerts(prevAlerts => {
        // Check if this flow_number already exists in alerts
        const exists = prevAlerts.some(alert => alert.flowNumber === data.flow_number);
        if (exists) {
          return prevAlerts; // Don't add duplicate
        }
        return [newLogEntry, ...prevAlerts].slice(0, MAX_ALERT_ENTRIES);
      });
    }
  }

  // --- EFFECTS ---
  useEffect(() => {
    // 1. Initialize WebSocket
    const cleanup =initWebSocket(onAlert, onServiceStatus, onScanStatus, onNetworkData, onScanSummary);

    // 2. Load Settings from Electron Backend on Startup
    if (window.electronAPI) {
        window.electronAPI.loadSettings().then((savedSettings) => {
            if (savedSettings && savedSettings.guid) {
                console.log("Settings loaded:", savedSettings);
                setAppSettings(savedSettings);
            } else {
                // Settings not found or incomplete, request interfaces to auto-populate
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
                // Auto-set the first interface if not already set
                setAppSettings(prev => {
                    if (prev.guid) return prev; // Keep existing if already set
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
        if (cleanup) cleanup(); // Clean up WebSocket Listeners
    };
  }, []);

  // --- EVENT HANDLERS ---
  const handleStartScan = () => {
    console.log("Start button clicked");

    // Clear logs, alerts, and summary when starting a new scan
    setLogs([]);
    setAlerts([]);
    setScanSummary(null);

    // Always send the GUID (which is the properly formatted interface for NFStreamer)
    // If guid is empty or invalid, send nothing and let backend auto-detect
    let targetInterface = appSettings.guid || null;
    
    if (!targetInterface) {
        console.log("No interface selected, backend will auto-detect...");
    } else {
        console.log("Starting scan on:", targetInterface);
    }
    
    startScan({
      interface: targetInterface, // Send the GUID or null for auto-detection
      captureInterface: appSettings.captureInterface,
      mode: "live"
      model: selectedModel
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
              <QuickTrafficInfo />
              
              <h5 id="alertsText">Alerts</h5>
              <AlertTable />
              
              <h5 id="logsText">Logs</h5>
              <LogsTable logs={logs} />
              
              <CurrentModelInfo value={selectedModel} onChange={setSelectedModel} />
              
              {/* UPDATED: No more Interface input, just the new buttons */}
              <ControlButtons 
                onStart={handleStartScan} 
                onStop={handleStopScan} 
                selectedInterface={appSettings.captureInterface} // Shows the name (e.g. "Default (Wi-Fi)")
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