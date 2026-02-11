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
  const [alerts, setAlerts] = React.useState([]);
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

  // Initialize WebSocket client and register handlers. Use React.useEffect()
  // so websocket client is initialized only once on mount.
  React.useEffect(() => {
    const cleanup = initWebSocket(onAlert, onServiceStatus, onScanStatus, onNetworkData, onScanSummary);
    return cleanup; // Cleanup listeners on unmount
  }, []);

  // Event wiring; maps html doc IO -> websocket communication functions
  // from api.js.
  const handleStartScan = (interfaceValue, modelValue) => {
    console.log("Start button clicked with:", interfaceValue, modelValue);
    // Clear logs, alerts, and summary when starting a new scan
    setLogs([]);
    setAlerts([]);
    setScanSummary(null);
    startScan({
      interface: interfaceValue,
      mode: "live",
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
      <AlertTable alerts={alerts} />
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
