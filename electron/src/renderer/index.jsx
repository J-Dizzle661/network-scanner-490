import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import 'bootstrap/dist/css/bootstrap.css';
import '../styles/global.css';

// Import your components
import { 
  TopBar, LeftContainer, QuickTrafficInfo, AlertTable, 
  CurrentModelInfo, ControlButtons, Interface, 
  LiveTrafficGraph, LogsTable 
} from './components/HomePage.jsx';

import SettingsPage from './components/SettingsPage.jsx'; // Import the new page
import { startScan, stopScan, initWebSocket } from '../utils/api.js';

const App = () => {
  // --- STATE ---
  const [currentView, setCurrentView] = useState('dashboard'); // Tracks which page to show
  const [interfaceValue, setInterfaceValue] = useState('');
  const [logs, setLogs] = useState([]);
  const MAX_LOG_ENTRIES = 10;

  // --- WEBSOCKET HANDLERS ---
  function onAlert(alert) {
    console.log("Alert received:", alert);
  }

  function onServiceStatus(status) {
    console.log("Service status:", status);
  }

  function onScanStatus(status) {
    console.log("Scan status:", status);
  }

  function onNetworkData(data) {
    console.log("Network data received:", data);
    const newLogEntry = {
      id: Date.now(),
      timestamp: new Date().toLocaleTimeString(),
      message: JSON.stringify(data)
    };
    setLogs(prevLogs => [newLogEntry, ...prevLogs].slice(0, MAX_LOG_ENTRIES));
  }

  // --- EFFECTS ---
  useEffect(() => {
    initWebSocket(onAlert, onServiceStatus, onScanStatus, onNetworkData);
  }, []);

  // --- EVENT HANDLERS ---
  const handleStartScan = (val) => {
    console.log("Start button clicked with interface:", val);
    startScan({ interface: val, mode: "deep" });
  };

  const handleStopScan = () => {
    console.log("Stop button clicked");
    stopScan();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      
      {/* 1. TopBar stays at the top */}
      <TopBar />

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        
        {/* 2. Sidebar controls the view */}
        <LeftContainer onViewChange={setCurrentView} />

        {/* 3. Main Content Area */}
        <main style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
          
          {/* CONDITION: If view is 'dashboard', show your original dashboard */}
          {currentView === 'dashboard' && (
            <>
              <h1 id="liveTrafficText">Live Traffic</h1>
              <QuickTrafficInfo />
              
              <h5 id="alertsText">Alerts</h5>
              <AlertTable />
              
              <h5 id="logsText">Logs</h5>
              <LogsTable logs={logs} />
              
              <CurrentModelInfo />
              
              <Interface value={interfaceValue} onChange={setInterfaceValue} />
              <ControlButtons 
                onStart={handleStartScan} 
                onStop={handleStopScan} 
                interfaceValue={interfaceValue} 
              />
              
              <LiveTrafficGraph />
            </>
          )}

          {/* CONDITION: If view is 'settings', show the new SettingsPage */}
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