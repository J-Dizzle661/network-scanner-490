// This file contains the individual components that make up the HomePage component 
// is seen in the Renderer.jsx file. The Components in this use the style.css file as 
// its stylesheet.

import fakeTraffic from "./images/fakeTraffic.svg"
//This function allows us to interact with the fe in real time and modify what is being displayed
import { useState, useEffect } from "react";
import { startScan, stopScan, initWebSocket } from '../../utils/api.js';
import { GlobalElems } from "./Global.jsx";



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
            <GlobalElems/>
            <h1 id="liveTrafficText">Live Traffic</h1>
            <QuickTrafficInfo/>
            <h5 id="alertsText">Alerts</h5>
            <LogsTable logs={logs} />
            <CurrentModelInfo />
            <Interface value={interfaceValue} onChange={setInterfaceValue} />
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

    export const AlertTable = ()=> {
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
                        <tr>
                            <td>test</td>
                            <td>test</td>
                            <td>test</td>
                        </tr>
                        <tr>
                            <td></td>
                            <td></td>
                            <td></td>
                        </tr>
                        <tr>
                            <td></td>
                            <td></td>
                            <td></td>
                        </tr>
                    </tbody>
                </table>
            </>
        );
    }

    export const LogsTable = ({ logs = [] }) => {
        return (
            <>
                <table id="logsTable">
                    <thead>
                        <tr id = "firstRow">
                            <th>Processed network flows</th>
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

    export const CurrentModelInfo = ()=> {
        const [currentModel, setCurrentModel] = useState(defaultModel);
        return (
            <div id = "currentModelInfo">
                <h5>Current Model: [{currentModel}]</h5>
                <label id="modelChangeLabel">
                    <h5>Change Model: </h5>
                </label>
                <select name="model" id="modelSelector" onChange={(model)=> setCurrentModel(model.target.value)}>
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

    export const ControlButtons = ({ onStart, onStop, interfaceValue })=> {
        const [isRunning, setIsRunning] = useState(false);

        const handleStart = () => {
            setIsRunning(true);
            onStart && onStart(interfaceValue);
        };

        const handleStop = () => {
            setIsRunning(false);
            onStop && onStop();
        };

        return (
            <div id = "controlButtons">
                <button 
                    id="startButton" 
                    className={isRunning ? 'control-button disabled' : 'control-button'}
                    onClick={handleStart}
                    disabled={isRunning}
                >
                    Start
                </button>
                <button 
                    id="stopButton" 
                    className={!isRunning ? 'control-button disabled' : 'control-button'}
                    onClick={handleStop}
                    disabled={!isRunning}
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