import notifBell from "./images/notifBell.svg";
import defaultIcon from "./images/UserIcon.svg";
import dashboardIcon from "./images/dashboardIcon.svg";
import liveTrafficIcon from "./images/liveTrafficIcon.svg";
import logHistoryIcon from "./images/logHistoryIcon.svg";
import modelIcon from "./images/modelIcon.svg";
import settingsCog from "./images/settingsCog.svg"
import line from "./images/Line.svg";
import magGlass from "./images/MagGlass.svg";
import { useState } from "react";
import { Dashboard } from "./Dashboard.jsx";
import { ModelsTab } from "./ModelsTab.jsx";
import { LiveTrafficTab } from "./TrafficTab.jsx";
import { LogHistoryTab } from "./LogHistTab.jsx";
import { SettingsMenu } from "./SettingsMenu.jsx";
import { currentActiveModel } from "../../main/modelObjects.js";
import { initWebSocket, socket, startScan, stopScan } from "../utils/api.js";
import { useEffect } from "react";  


export const App = () => {
    const [TopSettingsOpen, setTopSettingsOpen] = useState(false);  
    const [trafficHistory, setTrafficHistory] = useState([]);

//new code

// State variables
// const [interfaceValue, setInterfaceValue] = useState('');
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
//const [trafficHistory, setTrafficHistory] = useState([]);

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
                if (prev.guid){ 
                    console.log(`prev: ${prev}`);
                    return prev;} // Keep existing if already set
                // setAppSettings({captureInterface: data[0].name, guid: data[0].guid});
                console.log(`current interface: ${data[0].name}  ${data[0].guid}`);
                return {
                    captureInterface: data[0].name,
                    guid: data[0].guid,
                    // logPath: prev.logPath || '',
                    // startOnBoot: prev.startOnBoot || 'off'
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


//new code 

    const [selectedTab, setSelectedTab] = useState(<Dashboard 
                                                    trafficHistory={trafficHistory} setTrafficHistory={setTrafficHistory}
                                                    interfaceValue={appSettings.captureInterface}
                                                    logs={logs} setLogs={setLogs}
                                                    alerts={alerts} setAlerts={setAlerts}
                                                    networkMetrics={networkMetrics} setNetworkMetrics={setNetworkMetrics}
                                                    scanSummary={scanSummary} setScanSummary={setScanSummary}
                                                    appSettings={appSettings} setAppSettings={setAppSettings}
                                                    handleStartScan={handleStartScan}
                                                    handleStopScan={handleStopScan}/>);

        return (
        <>
                <div className="anchoredElement">
                    <TopBar TopSettingsOpen={TopSettingsOpen} setTopSettingsOpen = {setTopSettingsOpen}/>
                </div>
                <LeftContainer 
                TopSettingsOpen={TopSettingsOpen} selectedTab = {selectedTab} setSelectedTab = {setSelectedTab}
                trafficHistory={trafficHistory} setTrafficHistory={setTrafficHistory}
                />
            <div >{selectedTab}</div>
        </>
    );
} 

const SettingsIcon = ({TopSettingsOpen, setTopSettingsOpen}) => {
    return (
        <button id="settingsButton" onClick={() => setTopSettingsOpen(!TopSettingsOpen)}>
            <img className = "line" src={line} alt="line" />
            <img className = "line" src={line} alt="line" />
            <img className = "line" src={line} alt="line" />
        </button>
    );
}

export const SearchBar = () => {
    return (
        <div id = "searchWrapper">
            <div className="searchBarWrapper">
                <object className="magGlass" data={magGlass} type="image/svg+xml"></object>
                <input type="search" placeholder="Search" id="searchBar"/>
            </div>
        </div>
    );
}

export const TopBar = ({TopSettingsOpen, setTopSettingsOpen})=>{
    return (
        <>
            <div className="TopBar">
                <SettingsIcon TopSettingsOpen={TopSettingsOpen} setTopSettingsOpen={setTopSettingsOpen} />
                <div className="mainText"><h3>IDS Monitor</h3></div>
                <SearchBar/>
                <div id="topBarRightPortion">
                    <button id="logOut" onClick={null}>Log Out</button>
                    <button id="notifBell" type="button"><img src={notifBell} alt="Notification Bell" /></button>
                    <button id="userIcon" type="button"><img src={defaultIcon} alt="Default User Icon" /></button>
                </div>
            </div>
            <hr />
        </>

    );
}

export const LeftContainer = ({TopSettingsOpen, selectedTab, setSelectedTab, trafficHistory, setTrafficHistory})=> {
    if (TopSettingsOpen === false){
    return (
        <div id="leftContainerOpen">
            <ul id="dashListOpen">
                <li>
                    <button id="dashboardButton" className="dashButtonsOpen" onClick={() => setSelectedTab(<Dashboard trafficHistory={trafficHistory} setTrafficHistory={setTrafficHistory} />)}>
                        <div className="imgWrapper"><img src={dashboardIcon} alt="dashoard icon" className="smallDashSVG"/></div>
                        <h5 className="dashText">Dashboard</h5>
                    </button>
                </li>
                <li>
                    <button id="liveTrafficButton" className="dashButtonsOpen" onClick={()=> setSelectedTab(<LiveTrafficTab history={trafficHistory} setTrafficHistory={setTrafficHistory} />)}>
                        <div className="imgWrapper"><img src={liveTrafficIcon} alt="live traffic icon" className="dashSVG"/></div>
                        <h5 className="dashText">Live Traffic</h5>
                    </button>
                </li>
                <li>
                    <button id="logHistoryButton" className="dashButtonsOpen" onClick={()=> setSelectedTab(<LogHistoryTab />)}>
                        <div className="imgWrapper"><img src={logHistoryIcon} alt="log history icon" className="dashSVG"/></div>
                        <h5 className="dashText">Log History</h5>
                    </button>
                </li>
                <li>
                    <button id="modelButton" className="dashButtonsOpen" onClick={() => setSelectedTab(<ModelsTab setSelectedTab={setSelectedTab}/>)}>
                        <div className="imgWrapper"><img src={modelIcon} alt="model icon" className="smallDashSVG"/></div>
                        <h5 className="dashText">Models</h5>
                    </button>
                </li>
            </ul>
            <button id="lowerSettings" onClick={()=> setSelectedTab(<SettingsMenu/>)}>
                <img src={settingsCog} alt="settings cog" />
                <h5 id="settingsText">Settings</h5>
            </button>

        </div>
    );
}else {
    return (
            <div id="leftContainerClosed">
                <ul id="dashListClosed">
                    <button id="dashBoardButton" className="dashButtons">
                        <img src={dashboardIcon} alt="dashoard icon" className="smallDashSVG"/>
                    </button>
                    <button id="liveTrafficButton" className="dashButtons">
                        <img src={liveTrafficIcon} alt="live traffic icon" className="dashSVG"/>
                    </button>
                    <button id="logHistoryButton" className="dashButtons">
                        <img src={logHistoryIcon} alt="log history icon" className="dashSVG"/>
                    </button>
                    <button id="modelButton" className="dashButtons">
                        <img src={modelIcon} alt="model icon" className="dashSVG"/>
                    </button>
                    <button id="lowerSettings" className="dashButtons">
                        <img src={settingsCog} alt="settings cog" />
                    </button>
                </ul>
            </div>
        );
    }
}

