import React from 'react';
import { createRoot } from 'react-dom/client';
import 'bootstrap/dist/css/bootstrap.css';
import '../styles/global.css';
import { TopBar } from './components/HomePage.jsx';
import { LeftContainer } from './components/HomePage.jsx';
import { QuickTrafficInfo } from './components/HomePage.jsx';
import { AlertTable } from './components/HomePage.jsx';
import { CurrentModelInfo } from './components/HomePage.jsx';
import { ControlButtons } from './components/HomePage.jsx';
import { Interface } from './components/HomePage.jsx';
import { LiveTrafficGraph } from './components/HomePage.jsx';
import { LogsTable } from './components/HomePage.jsx';
import ListGroup from './components/ListGroup.jsx';
import { startScan, stopScan, initWebSocket } from '../utils/api.js';

/**
 * Main App wrapper to manage shared state, event wiring, and WebSocket
 * initialization.
 * 
 * Returns the full application UI to be rendered
 */
const App = () => {

  // State variables
  const [interfaceValue, setInterfaceValue] = React.useState('');
  const [selectedModel, setSelectedModel] = React.useState('randomForest');
  const [logs, setLogs] = React.useState([]);
  const MAX_LOG_ENTRIES = 10;

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
  }

  function onNetworkData(data) {
    console.log("Network data received:", data);
    
    // Create a new log entry with timestamp and data
    const newLogEntry = {
      id: Date.now(),
      timestamp: new Date().toLocaleTimeString(),
      message: JSON.stringify(data)
    };

    // Add new entry and keep only the latest MAX_LOG_ENTRIES
    setLogs(prevLogs => [newLogEntry, ...prevLogs].slice(0, MAX_LOG_ENTRIES));
  }

  // Initialize WebSocket client and register handlers. Use React.userEffect()
  // so websocket client is initialized only once on mount.
  React.useEffect(() => {
    initWebSocket(onAlert, onServiceStatus, onScanStatus, onNetworkData);
  }, []);

  // Event wiring; maps html doc IO -> websocket communication functions
  // from api.js.
  const handleStartScan = (interfaceValue, modelValue) => {
    console.log("Start button clicked with:", interfaceValue, modelValue);
    startScan({
      interface: interfaceValue,
      model: modelValue
    });
  };

  const handleStopScan = () => {
    console.log("Stop button clicked");
    stopScan();
  };

  return (
    <>
      <TopBar />
      <LeftContainer />
      <h1 id="liveTrafficText">Live Traffic</h1>
      <QuickTrafficInfo />
      <h5 id="alertsText">Alerts</h5>
      <AlertTable />
      <h5 id="logsText">Logs</h5>
      <LogsTable logs={logs} />
      <CurrentModelInfo value={selectedModel} onChange={setSelectedModel} />
      <Interface value={interfaceValue} onChange={setInterfaceValue} />
      <ControlButtons onStart={handleStartScan} onStop={handleStopScan} interfaceValue={interfaceValue} selectedModel={selectedModel} />
      <LiveTrafficGraph />
    </>
  );
};

// Render the App component into the root div.
const root = createRoot(document.getElementById('root'));
root.render(<App />);
