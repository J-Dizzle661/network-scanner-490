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

import SettingsPage from './components/SettingsPage.jsx'; // Import the new page
import { startScan, stopScan, initWebSocket } from './utils/api.js';
import { socket } from './utils/api.js';

// In src/index.jsx

const App = () => {
  // --- STATE ---
  const [currentView, setCurrentView] = useState('dashboard');
  const [logs, setLogs] = useState([]);
  // New state to store the loaded settings
  const [appSettings, setAppSettings] = useState({ captureInterface: 'Loading...', guid: '' }); 
  
  const MAX_LOG_ENTRIES = 10;

  // --- WEBSOCKET HANDLERS (Keep these the same) ---
  function onAlert(alert) { console.log("Alert received:", alert); }
  function onServiceStatus(status) { console.log("Service status:", status); }
  function onScanStatus(status) { console.log("Scan status:", status); }
  function onNetworkData(data) {
    const newLogEntry = {
      id: Date.now(),
      timestamp: new Date().toLocaleTimeString(),
      message: JSON.stringify(data)
    };
    setLogs(prevLogs => [newLogEntry, ...prevLogs].slice(0, MAX_LOG_ENTRIES));
  }

  // --- EFFECTS ---
  useEffect(() => {
    // 1. Initialize WebSocket
    initWebSocket(onAlert, onServiceStatus, onScanStatus, onNetworkData);

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
    };
  }, []);

  // --- EVENT HANDLERS ---
  const handleStartScan = () => {
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
      mode: "deep"
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
              
              <CurrentModelInfo />
              
              {/* UPDATED: No more Interface input, just the new buttons */}
              <ControlButtons 
                onStart={handleStartScan} 
                onStop={handleStopScan} 
                selectedInterface={appSettings.captureInterface} // Shows the name (e.g. "Default (Wi-Fi)")
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