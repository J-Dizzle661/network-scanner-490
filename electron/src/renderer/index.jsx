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
            if (savedSettings) {
                console.log("Settings loaded:", savedSettings);
                setAppSettings(savedSettings);
            } else {
                setAppSettings({ captureInterface: 'Default (Wi-Fi)', guid: '' });
            }
        });
    }
  }, []);

  // --- EVENT HANDLERS ---
  const handleStartScan = () => {
    // 1. Get the friendly name (e.g., "Default (Wi-Fi)")
    let targetInterface = appSettings.captureInterface;
    
    // 2. LOGIC CHECK: If the user picked "Default (Wi-Fi)", we MUST send the GUID.
    // The backend scanner (NFStreamer) cannot read "Default (Wi-Fi)", it needs the ID.
    if (targetInterface === 'Default (Wi-Fi)') {
        console.log("Swapping friendly name for GUID...");
        targetInterface = appSettings.guid; 
    }
    
    console.log("Starting scan on:", targetInterface);
    
    startScan({
      interface: targetInterface, // Now sending the GUID (e.g. "{9AAC...}")
      guid: appSettings.guid,
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