import React from 'react';
import { startScan, stopScan } from '../utils/api.js';
import line from "../components/images/Line.svg";
import magGlass from "../components/images/MagGlass.svg";
import notifBell from "../components/images/notifBell.svg";
import defaultIcon from "../components/images/UserIcon.svg";
import dashboardIcon from "../components/images/dashboardIcon.svg";
import liveTrafficIcon from "../components/images/liveTrafficIcon.svg";
import logHistoryIcon from "../components/images/logHistoryIcon.svg";
import modelIcon from "../components/images/modelIcon.svg";
import settingsCog from "../components/images/settingsCog.svg"
import fakeTraffic from "../components/images/fakeTraffic.svg"

let currentModel = 'Random Forest';

export const TopBar = ()=>{
    return (
        <>
            <div className="TopBar">
                <SettingsIcon />
                <div className="mainText"><h3>IDS Monitor</h3></div>
                <SearchBar/>
                <button className="logOut">Log Out</button>
                <button className="notifBell" type="button"><img src={notifBell} alt="Notification Bell" /></button>
                <button className="userIcon" type="button"><img src={defaultIcon} alt="Default User Icon" /></button>
            </div>
            <hr />
        </>

    );
}

const SettingsIcon = () => {
    return (
        <button className="settingsButton">
            <img className = "line" src={line} alt="line" />
            <img className = "line" src={line} alt="line" />
            <img className = "line" src={line} alt="line" />
        </button>
    );
}

const SearchBar = () => {
    return (
        <div id = "searchWrapper">
            <div className="searchBarWrapper">
                <object className="magGlass" data={magGlass} type="image/svg+xml"></object>
                <input type="search" placeholder="Search" id="searchBar"/>
            </div>
        </div>
    );
}

// inside src/components/HomePage.jsx

// 1. Add 'onViewChange' to the props here
// inside src/components/HomePage.jsx

export const LeftContainer = ({ onViewChange }) => {
    return (
        <div className="leftContainer">
            <ul id="dashList">
                {/* 1. Dashboard Button */}
                <li>
                    <button 
                        id="dashboardButton" 
                        className="dashButtons"
                        onClick={() => onViewChange('dashboard')}
                    >
                        <div className="imgWrapper">
                            <img src={dashboardIcon} alt="dashboard icon" className="smallDashSVG"/>
                        </div>
                        <h5 className="dashText">Dashboard</h5>
                    </button>
                </li>

                {/* 2. Live Traffic Button (Points to dashboard for now) */}
                <li>
                    <button 
                        id="liveTrafficButton" 
                        className="dashButtons"
                        onClick={() => onViewChange('dashboard')}
                    >
                        <div className="imgWrapper">
                            <img src={liveTrafficIcon} alt="live traffic icon" className="dashSVG"/>
                        </div>
                        <h5 className="dashText">Live Traffic</h5>
                    </button>
                </li>

                {/* 3. Log History Button */}
                <li>
                    <button 
                        id="logHistoryButton" 
                        className="dashButtons"
                        onClick={() => onViewChange('dashboard')}
                    >
                        <div className="imgWrapper">
                            <img src={logHistoryIcon} alt="log history icon" className="dashSVG"/>
                        </div>
                        <h5 className="dashText">Log History</h5>
                    </button>
                </li>

                {/* 4. Models Button */}
                <li>
                    <button 
                        id="modelButton" 
                        className="dashButtons"
                        onClick={() => onViewChange('dashboard')}
                    >
                        <div className="imgWrapper">
                            <img src={modelIcon} alt="model icon" className="smallDashSVG"/>
                        </div>
                        <h5 className="dashText">Models</h5>
                    </button>
                </li>
            </ul>

            {/* 5. Settings Button (Switches to Settings View) */}
            <button 
                id="lowerSettings" 
                onClick={() => onViewChange('settings')}
            >
                <img src={settingsCog} alt="settings cog" />
                <h5 id="settingsText">Settings</h5>
            </button>

        </div>
    );
}

    export const MetricsSection = ({ metrics = {}, summary = null }) => {
        const [activeTab, setActiveTab] = React.useState('live');

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

    const QuickTrafficInfo = ({ metrics = {} }) => {
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

    export const CurrentModelInfo = ({ value = 'randomForest', onChange })=> {
        const modelNames = {
            randomForest: 'Random Forest',
            logisticRegression: 'Logistic Regression',
            supportVectorMachine: 'Support Vector Machine',
            multilayerPerceptron: 'Multilayer Perceptron',
            isolationForest: 'Isolation Forest'
        };

        return (
            <div id = "currentModelInfo">
                <h5>Current Model: [{modelNames[value] || 'Random Forest'}]</h5>
                <label id="modelChangeLabel">
                    <h5>Change Model: </h5>
                </label>
                <select 
                    name="model" 
                    id="modelSelector"
                    value={value}
                    onChange={(e) => onChange && onChange(e.target.value)}
                >
                    <option value="randomForest">Random Forest</option>
                    <option value="logisticRegression">Logistic Regression</option>
                    <option value="supportVectorMachine">Support Vector Machine</option>
                    <option value="multilayerPerceptron">Multilayer Perceptron</option>
                    <option value="isolationForest">Isolation Forest</option>
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

<<<<<<< HEAD
    export const ControlButtons = ({ onStart, onStop, interfaceValue, selectedModel })=> {
        const [isRunning, setIsRunning] = React.useState(false);

        const handleStart = () => {
            setIsRunning(true);
            onStart && onStart(interfaceValue, selectedModel);
        };
=======
    export const ControlButtons = ({ onStart, onStop, selectedInterface }) => {
    const [isRunning, setIsRunning] = React.useState(false);

    const handleStart = () => {
        setIsRunning(true);
        // We pass the interface value back up to the parent
        if (onStart) onStart();
        else startScan({ interface: selectedInterface, guid: '' });
    };
>>>>>>> origin/master

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

    