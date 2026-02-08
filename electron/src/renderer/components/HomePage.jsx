import React from 'react';
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

let networkStatus = 'IDLE';
let detectedThreats = '0';
let currentThroughput = '0';
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
        return (
            <div id = "currentModelInfo">
                <h5>Current Model: [{currentModel}]</h5>
                <label id="modelChangeLabel">
                    <h5>Change Model: </h5>
                </label>
                <select name="model" id="modelSelector">
                    <option value="randomForest">Random Forest</option>
                    <option value="decisionTree">Decision Tree</option>
                    <option value="KNN">K-Nearest Neighbor</option>
                    <option value="transformer">Transformer</option>
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
    const [isRunning, setIsRunning] = React.useState(false);

    const handleStart = () => {
        setIsRunning(true);
        // We pass the interface value back up to the parent
        onStart && onStart(); 
    };

    const handleStop = () => {
        setIsRunning(false);
        onStop && onStop();
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

    