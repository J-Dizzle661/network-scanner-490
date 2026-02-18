// This file contains the individual components that make up the HomePage component 
// is seen in the Renderer.jsx file. The Components in this use the style.css file as 
// its stylesheet.

import fakeTraffic from "./images/fakeTraffic.svg"
//This function allows us to interact with the fe in real time and modify what is being displayed
import { useState, useEffect } from "react";
import { startScan, stopScan, initWebSocket } from '../../utils/api.js';
import {currentActiveModel, models, modelsMap} from "../../main/models.js";
import React from "react";
import { socket } from '../utils/api.js';


let networkStatus = 'IDLE';
let detectedThreats = '0';
let currentThroughput = '0';
const defaultModel = 'Random Forest';
//List of models for the dropdown menu. Can be easily modified to add more models.
const modelsJSX = models.map((model) => <option key={model}>{model}</option>);

//Main component that holds all other components for the HomePage
//This gets exported directly to Renderer.jsx
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
            <ControlButtons onStart={handleStartScan} onStop={handleStopScan} interfaceValue={interfaceValue} />
            <LiveTrafficGraph />
        </div>
    );
}

    export const QuickTrafficInfo = () => {
        return (
            <div id="quickTrafficInfo">
                <div className="quickTrafficBox">
                    <h6>Network Status</h6>
                    <h3>{networkStatus}</h3>
                </div>
                <div className="quickTrafficBox">
                    <h6>Threats Detected</h6>
                    <h3>{detectedThreats}</h3>
                </div>
                <div className="quickTrafficBox">
                    <h6>Current Throughput</h6>
                    <h3>{currentThroughput} Kbps</h3>
                </div>
            </div>
        );
    } 

    export const AlertTable = ({ logs })=> {
        return (
            <>
                <table id="alertTable">
                    <thead>
                        <tr id = "firstRow">
                            <th>Timestamp</th>
                            <th>Source IP</th>
                            <th>Prediction</th>
                            <th>Confidence</th>
                        </tr>
                    </thead>
                    <tbody>
                        {logs.map((log) => (
                            <tr key={log.id}>
                                <td>{log.timestamp}</td>
                                <td>{log.message}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </>
        );
    }

    // export const LogsTable = ({ logs }) => {   AI code im probably getting rid of.
    //     return (
    //         <>
    //             <table id="logsTable">
    //                 <thead>
    //                     <tr id = "firstRow">
    //                         <th>Processed network flows</th>
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

    //ai code I assume, I did not write this.
export const ControlButtons = ({ onStart, onStop, selectedInterface }) => {
    const [isRunning, setIsRunning] = React.useState(false);
    const [appSettings, setAppSettings] = useState({ captureInterface: 'Loading...', guid: '' });

      // --- STATE ---
      const [currentView, setCurrentView] = useState('dashboard');
      const [logs, setLogs] = useState([]);
      // New state to store the loaded settings
      
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
  const handleStart = () => {
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
  
  const handleStop = () => {
    console.log("Stop button clicked");
    stopScan();
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

    

    