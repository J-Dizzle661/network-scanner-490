import React from 'react';
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
  const [networkMetrics, setNetworkMetrics] = React.useState({
    flowNumber: 0,
    predictedLabel: 'N/A',
    inferenceLatency: 0,
    throughput: 0,
    cpuUsage: 0,
    memoryUsage: 0,
    isScanning: false
  });
  const [scanSummary, setScanSummary] = React.useState(null);
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
      id: Date.now(),
      timestamp: new Date().toLocaleTimeString(),
      flowNumber: data.flow_number,
      label: data.predicted_label,
      latency: data.inference_latency ? `${(data.inference_latency * 1000).toFixed(2)}ms` : 'N/A',
      throughput: data.throughput ? `${data.throughput.toFixed(2)}` : '0',
      cpu: data.cpu_usage_percent ? `${data.cpu_usage_percent}%` : 'N/A',
      memory: data.memory_usage_percent ? `${data.memory_usage_percent}%` : 'N/A'
    };

    // Add new entry and keep only the latest MAX_LOG_ENTRIES
    setLogs(prevLogs => [newLogEntry, ...prevLogs].slice(0, MAX_LOG_ENTRIES));
  }

  // Initialize WebSocket client and register handlers. Use React.userEffect()
  // so websocket client is initialized only once on mount.
  React.useEffect(() => {
    initWebSocket(onAlert, onServiceStatus, onScanStatus, onNetworkData, onScanSummary);
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
      <h1 id="metricsText">Metrics</h1>
      <MetricsSection metrics={networkMetrics} summary={scanSummary} />
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
