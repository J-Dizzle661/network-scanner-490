// This file contains the individual components that make up the HomePage component 
// is seen in the Renderer.jsx file. The Components in this use the style.css file as 
// its stylesheet.

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
//This function allows us to interact with the fe in real time and modify what is being displayed
import { useState, useEffect } from "react";
import { startScan, stopScan, initWebSocket, socket } from '../../utils/api.js';
import { models, modelsMap, currentActiveModel } from "../../main/modelObjects.js";

let networkStatus = 'IDLE';
let detectedThreats = '0';
let currentThroughput = '0';
const defaultModel = 'Random Forest';
//List of models for the dropdown menu. Can be easily modified to add more models.
const modelsJSX = models.map((model) => <option key={Object.keys(model)[0]}>{Object.keys(model)[0]}</option>);

//Main component that holds all other components for the HomePage
//This gets exported directly to app.jsx
export function Dashboard() {

// State variables
const [interfaceValue, setInterfaceValue] = useState('');
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
const [trafficHistory, setTrafficHistory] = useState([]);
const [selectedMetric, setSelectedMetric] = useState('inferenceLatency');

const [appSettings, setAppSettings] = useState({
    captureInterface: 'Loading...',
    guid: ''
});

const MAX_LOG_ENTRIES = 50;
const MAX_ALERT_ENTRIES = 50;
const MAX_GRAPH_POINTS = 30;

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

// Append a data point to the sliding window for the live graph
const newGraphPoint = {
    time: new Date().toLocaleTimeString(),
    inferenceLatency: data.inference_latency ? parseFloat((data.inference_latency * 1000).toFixed(3)) : 0,
    throughput: data.throughput ? parseFloat(data.throughput.toFixed(2)) : 0,
    cpuUsage: data.cpu_usage_percent || 0,
    memoryUsage: data.memory_usage_percent || 0,
    flowNumber: data.flow_number || 0,
};
setTrafficHistory(prev => [...prev, newGraphPoint].slice(-MAX_GRAPH_POINTS));

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

// Initialize WebSocket client and register handlers. Use React.userEffect()
// so websocket client is initialized only once on mount.
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

    // Clear logs, alerts, summary, and graph history when starting a new scan
    setLogs([]);
    setAlerts([]);
    setScanSummary(null);
    setTrafficHistory([]);

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
      mode: "live",
      model: currentActiveModel
    });
  };
  
  const handleStopScan = () => {
    console.log("Stop button clicked");
    stopScan();
  };

    return (
        <div id="homePage">
            <h5 id="metricsText">Metrics</h5>
            <MetricsSection metrics={networkMetrics} summary={scanSummary} />
            <h5 id="alertsText">Alerts</h5>
            <AlertTable alerts={alerts} />
            <LogsTable logs={logs} />
            <CurrentModelInfo />
            <ControlButtons 
            onStart={handleStartScan} 
            onStop={handleStopScan} 
            selectedInterface={appSettings.captureInterface}
            selectedModel={currentActiveModel}
            />
            <LiveTrafficGraph history={trafficHistory} selectedMetric={selectedMetric} onMetricChange={setSelectedMetric} />
        </div>
    );
}

    // export const QuickTrafficInfo = () => {  Replacing my code for now, may be reverted back later
    //     return (
    //         <div id="quickTrafficInfo">
    //             <div className="quickTrafficBox">
    //                 <h6>Network Status</h6>
    //                 <h3>{networkStatus}</h3>
    //             </div>
    //             <div className="quickTrafficBox">
    //                 <h6>Threats Detected</h6>
    //                 <h3>{detectedThreats}</h3>
    //             </div>
    //             <div className="quickTrafficBox">
    //                 <h6>Current Throughput</h6>
    //                 <h3>{currentThroughput} Kbps</h3>
    //             </div>
    //         </div>
    //     );
    // } 

    // export const AlertTable = ({ logs })=> {
    //     return (
    //         <>
    //             <table id="alertTable">
    //                 <thead>
    //                     <tr id = "firstRow">
    //                         <th>Timestamp</th>
    //                         <th>Source IP</th>
    //                         <th>Prediction</th>
    //                         <th>Confidence</th>
    //                     </tr>
    //                 </thead>
    //                 <tbody>
    //                     {logs.map((log) => (
    //                         <tr key={log.id}>
    //                             <td>{log.timestamp}</td>
    //                             <td>{log.message}</td>
    //                         </tr>
    //                     ))}
    //                 </tbody>
    //             </table>
    //         </>
    //     );
    // }


    //merge code
    export const MetricsSection = ({ metrics = {}, summary = null }) => {
    const [activeTab, setActiveTab] = useState('live');

    return (
        <div id="metricsSection">
            <div className="metricsTabs">
                <button 
                    className={`metricsTab ${activeTab === 'live' ? 'active' : ''}`}
                    onClick={() => setActiveTab('live')}
                >
                    Live
                </button>
                <button 
                    className={`metricsTab ${activeTab === 'summary' ? 'active' : ''}`}
                    onClick={() => setActiveTab('summary')}
                >
                    Summary
                </button>
            </div>
            <div className="metricsContent">
                {activeTab === 'live' && <QuickTrafficInfo metrics={metrics} />}
                {activeTab === 'summary' && <SummaryInfo summary={summary} />}
            </div>
        </div>
    );
}

export const QuickTrafficInfo = ({ metrics = {} }) => {
    const networkStatus = metrics.isScanning ? 'SCANNING' : 'IDLE';
    const statusColor = metrics.isScanning ? '#28a745' : '#6c757d';
    
    return (
        <div id="quickTrafficInfo">
            <div className="quickTrafficBox">
                <span>Network Status: <strong style={{ color: statusColor }}>{networkStatus}</strong></span>
            </div>
            <div className="quickTrafficBox">
                <span>Flows Processed: <strong>{metrics.flowNumber || 0}</strong></span>
            </div>
            <div className="quickTrafficBox">
                <span>Throughput: <strong>{(metrics.throughput || 0).toFixed(2)} packets/s</strong></span>
            </div>
            <div className="quickTrafficBox">
                <span>CPU Usage: <strong>{(metrics.cpuUsage || 0).toFixed(1)}%</strong></span>
            </div>
            <div className="quickTrafficBox">
                <span>Memory Usage: <strong>{(metrics.memoryUsage || 0).toFixed(1)}%</strong></span>
            </div>
        </div>
    );
} 

const SummaryInfo = ({ summary = null }) => {
    if (!summary) {
        return (
            <div id="summaryInfo">
                <div className="summaryBox">
                    <h5>Scan Summary</h5>
                    <p style={{color: '#888'}}>No scan completed yet. Summary will appear after a scan finishes.</p>
                </div>
            </div>
        );
    }

    return (
        <div id="summaryInfo">
            <div className="summaryBox">
                <h5>Scan Summary</h5>
                <div style={{marginTop: '10px'}}>
                    <p><strong>Duration:</strong> {summary.duration_seconds}s</p>
                    <p><strong>Total Flows:</strong> {summary.total_flows}</p>
                    <p><strong>Total Packets:</strong> {summary.total_packets}</p>
                    <p><strong>Throughput:</strong> {summary.throughput_packets_per_second} packets/sec</p>
                    <p><strong>Avg Inference Latency:</strong> {summary.average_inference_latency_seconds ? `${(summary.average_inference_latency_seconds * 1000).toFixed(2)}ms` : 'N/A'}</p>
                    <p><strong>Model:</strong> {summary.model_type}</p>
                    <p><strong>Interface:</strong> {summary.interface}</p>
                </div>
            </div>
            <div className="summaryBox" style={{marginTop: '10px'}}>
                <h5>Hardware Usage</h5>
                <div style={{marginTop: '10px'}}>
                    <p><strong>CPU Avg:</strong> {summary.hardware_usage?.cpu_average_percent}%</p>
                    <p><strong>CPU Max:</strong> {summary.hardware_usage?.cpu_max_percent}%</p>
                    <p><strong>Memory Avg:</strong> {summary.hardware_usage?.memory_average_percent}%</p>
                    <p><strong>Memory Max:</strong> {summary.hardware_usage?.memory_max_percent}%</p>
                </div>
            </div>
        </div>
    );
}

export const AlertTable = ({ alerts = [] }) => {
    return (
        <div id="alertTableWrapper">
            <table id="alertTable">
                <thead>
                    <tr id = "firstRow">
                        <th>Time</th>
                        <th>Flow #</th>
                        <th>Predicted Label</th>
                        <th>Confidence</th>
                        <th>Inference Latency</th>
                        <th>Throughput</th>
                        <th>CPU</th>
                        <th>Memory</th>
                    </tr>
                </thead>
                <tbody>
                    {alerts.length === 0 ? (
                        <tr>
                            <td colSpan="8" style={{textAlign: 'center', color: '#888'}}>No alerts detected</td>
                        </tr>
                    ) : (
                        alerts.map((alert) => (
                            <tr key={alert.flowNumber}>
                                <td>{alert.timestamp}</td>
                                <td>{alert.flowNumber}</td>
                                <td style={{color: '#dc3545', fontWeight: 'bold'}}>{alert.label}</td>
                                <td>{alert.confidence}</td>
                                <td>{alert.latency}</td>
                                <td>{alert.throughput}</td>
                                <td>{alert.cpu}</td>
                                <td>{alert.memory}</td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
}

export const LogsTable = ({ logs = [] }) => {
    return (
        <div id="logsTableWrapper">
            <table id="logsTable">
                <thead>
                    <tr id = "firstRow">
                        <th>Time</th>
                        <th>Flow #</th>
                        <th>Predicted Label</th>
                        <th>Confidence</th>
                        <th>Inference Latency</th>
                        <th>Throughput</th>
                        <th>CPU</th>
                        <th>Memory</th>
                    </tr>
                </thead>
                <tbody>
                    {logs.length === 0 ? (
                        <tr>
                            <td colSpan="8" style={{textAlign: 'center', color: '#888'}}>No flows captured yet</td>
                        </tr>
                    ) : (
                        logs.map((log) => (
                            <tr key={log.flowNumber}>
                                <td>{log.timestamp}</td>
                                <td>{log.flowNumber}</td>
                                <td>{log.label}</td>
                                <td>{log.confidence}</td>
                                <td>{log.latency}</td>
                                <td>{log.throughput}</td>
                                <td>{log.cpu}</td>
                                <td>{log.memory}</td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
}
    //merge code

    export const CurrentModelInfo = ()=> {
        const [currentModel, setCurrentModel] = useState(currentActiveModel);
        return (
            <div id = "currentModelInfo">
                <h5>Current Model: [{currentModel}]</h5>
                <label id="modelChangeLabel">
                    <h5>Change Model: </h5>
                </label>
                <select name="model" id="modelSelector" onChange={(model)=> {
                    setCurrentModel(model.target.value);
                    console.log(model.target.value)
                    modelsMap.get(model.target.value).activate();
                }}>
                    {modelsJSX}
                </select>
            </div>
        );
    }

    export const LiveTrafficGraph = ({ history = [], selectedMetric = 'inferenceLatency', onMetricChange }) => {
        const metricOptions = [
            { value: 'inferenceLatency', label: 'Inference Latency (ms)' },
            { value: 'throughput',       label: 'Throughput (pkts/s)'    },
            { value: 'cpuUsage',         label: 'CPU Usage (%)'          },
            { value: 'memoryUsage',      label: 'Memory Usage (%)'       },
        ];

        const selectedLabel = metricOptions.find(m => m.value === selectedMetric)?.label || selectedMetric;

        return (
            <div id="liveTrafficGraph">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                    <h5 style={{ margin: 0 }}>Live Traffic</h5>
                    <select
                        value={selectedMetric}
                        onChange={e => onMetricChange && onMetricChange(e.target.value)}
                        style={{ padding: '4px 8px', borderRadius: '5px', border: '1px solid #ccc', fontSize: '13px' }}
                    >
                        {metricOptions.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                </div>

                {history.length === 0 ? (
                    <div style={{
                        width: 660, height: 300,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: 'white', borderRadius: '10px',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                        color: '#888', fontSize: '14px'
                    }}>
                        Start a scan to see live traffic data
                    </div>
                ) : (
                    <div style={{
                        width: 660, height: 300,
                        background: 'white', borderRadius: '10px',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                        padding: '10px'
                    }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={history} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <XAxis
                                    dataKey="time"
                                    tick={{ fontSize: 10 }}
                                    interval="preserveStartEnd"
                                />
                                <YAxis tick={{ fontSize: 10 }} width={45} />
                                <Tooltip
                                    formatter={(value) => [`${value}`, selectedLabel]}
                                    labelFormatter={(label) => `Time: ${label}`}
                                />
                                <Line
                                    type="monotone"
                                    dataKey={selectedMetric}
                                    stroke="#007bff"
                                    strokeWidth={2}
                                    dot={false}
                                    isAnimationActive={false}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </div>
        );
    }

    export const ControlButtons = ({ onStart, onStop, selectedInterface }) => {
        const [isRunning, setIsRunning] = useState(false);
    
        const handleStart = () => {
            setIsRunning(true);
            // We pass the interface value back up to the parent
            if (onStart) onStart();
            else startScan({ interface: selectedInterface, guid: '' });
        };
    
        const handleStop = () => {
            setIsRunning(false);
            if (onStop) onStop();
            else stopScan();
        };
    
        return (
            <div id="controlButtons" style={{ display: 'flex', alignItems: 'center', gap: '15px', marginTop: '20px' }}>
                
                {/* New Text Label */}
                <h5 style={{ margin: 0, color: '#555' }}>
                    Start Interface: <span style={{ color: '#000', fontWeight: 'bold' }}>{selectedInterface || "None Selected"}</span>
                </h5>
    
                {/* Buttons */}
                <button 
                    id="startButton" 
                    className={isRunning ? 'control-button disabled' : 'control-button'}
                    onClick={handleStart}
                    disabled={isRunning || !selectedInterface} // Disable if no interface is found
                    style={{ backgroundColor: '#28a745', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '5px', cursor: 'pointer', opacity: isRunning ? 0.6 : 1 }}
                >
                    Start
                </button>
    
                <button 
                    id="stopButton" 
                    className={!isRunning ? 'control-button disabled' : 'control-button'}
                    onClick={handleStop}
                    disabled={!isRunning}
                    style={{ backgroundColor: '#dc3545', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '5px', cursor: 'pointer', opacity: !isRunning ? 0.6 : 1 }}
                >
                    Stop
                </button>
            </div>
        );
    }

    // export const Interface = ({ value, onChange })=> {
    //     return (
    //         <div id = "interface">
    //             <input 
    //                 type="text" 
    //                 id="interfaceInput"
    //                 value={value}
    //                 onChange={(e) => onChange(e.target.value)}
    //                 placeholder="Enter interface"
    //             />
    //         </div>
    //     );
    // }
    // The old interface textbox, will probably be deleted after initial merge to master
