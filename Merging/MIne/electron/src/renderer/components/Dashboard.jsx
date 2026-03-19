// This file contains the individual components that make up the HomePage component 
// is seen in the Renderer.jsx file. The Components in this use the style.css file as 
// its stylesheet.

import fakeTraffic from "./images/fakeTraffic.svg"
//This function allows us to interact with the fe in real time and modify what is being displayed
import { useState, useEffect } from "react";
import { startScan, stopScan, initWebSocket } from '../../utils/api.js';
import { models, modelsMap, currentActiveModel, socket } from "../../main/preload.js";


let networkStatus = 'IDLE';
let detectedThreats = '0';
let currentThroughput = '0';
const defaultModel = 'Random Forest';
//List of models for the dropdown menu. Can be easily modified to add more models.
const modelsJSX = models.map((model) => <option key={model}>{model}</option>);

//Main component that holds all other components for the HomePage
//This gets exported directly to app.jsx
export function Dashboard() {

// State variables
  const [interfaceValue, setInterfaceValue] = useState('');
  const [logs, setLogs] = useState([]);
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
  useEffect(() => {
    initWebSocket(onAlert, onServiceStatus, onScanStatus, onNetworkData);
  }, []);

  // Event wiring; maps html doc IO -> websocket communication functions
  // from api.js.
  const handleStartScan = (interfaceValue) => {
    console.log("Start button clicked with interface:", interfaceValue);
    startScan({
      interface: interfaceValue,
      mode: "deep"
    });
  };

  const handleStopScan = () => {
    console.log("Stop button clicked");
    stopScan();
  };

    return (
        <div id="homePage">
            <h1 id="liveTrafficText">Live Traffic</h1>
            <QuickTrafficInfo/>
            <h5 id="alertsText">Alerts</h5>
            <AlertTable logs = {logs} />
            <CurrentModelInfo />
            <Interface value={interfaceValue} onChange={setInterfaceValue} />
            <ControlButtons onStart={handleStartScan} onStop={handleStopScan} interfaceValue={interfaceValue} />
            <LiveTrafficGraph />
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

    export const LiveTrafficGraph = ()=>{
        return(
            <div id="liveTrafficGraph">
                <img src={fakeTraffic} alt="fake internet traffic" />
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

    export const Interface = ({ value, onChange })=> {
        return (
            <div id = "interface">
                <input 
                    type="text" 
                    id="interfaceInput"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder="Enter interface"
                />
            </div>
        );
    }