// This file contains the individual components that make up the HomePage component 
// is seen in the Renderer.jsx file. The Components in this use the style.css file as 
// its stylesheet.

import line from "./images/Line.svg";
import magGlass from "./images/MagGlass.svg";
import notifBell from "./images/notifBell.svg";
import defaultIcon from "./images/UserIcon.svg";
import dashboardIcon from "./images/dashboardIcon.svg";
import liveTrafficIcon from "./images/liveTrafficIcon.svg";
import logHistoryIcon from "./images/logHistoryIcon.svg";
import modelIcon from "./images/modelIcon.svg";
import settingsCog from "./images/settingsCog.svg"
import fakeTraffic from "./images/fakeTraffic.svg"

let networkStatus = 'IDLE';
let detectedThreats = '0';
let currentThroughput = '0';
let currentModel = 'Random Forest';
//List of models for the dropdown menu. Can be easily modified to add more models.
const models = ['Random Forest', 'Isolation Forest', 'SVM', 'MLP','Logistic Regression'];
const modelsJSX = models.map((model) => <option key={model}>{model}</option>)

//Main component that holds all other components for the HomePage
//This gets exported directly to Renderer.jsx
export function HomePage() {
    return (
        <div id="homePage">
            <TopBar/>
            <LeftContainer/>
            <h1 id="liveTrafficText">Live Traffic</h1>
            <QuickTrafficInfo/>
            <h5 id="alertsText">Alerts</h5>
            <AlertTable/>
            <CurrentModelInfo/>
            <LiveTrafficGraph/>
        </div>
    );
}


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

export const LeftContainer = ()=> {
    return (
        <div className="leftContainer">
            <ul id="dashList">
                <li>
                    <button id="dashboardButton" className="dashButtons">
                        <div className="imgWrapper"><img src={dashboardIcon} alt="dashoard icon" className="smallDashSVG"/></div>
                        <h5 className="dashText">Dashboard</h5>
                    </button>
                </li>
                <li>
                    <button id="liveTrafficButton" className="dashButtons">
                        <div className="imgWrapper"><img src={liveTrafficIcon} alt="live traffic icon" className="dashSVG"/></div>
                        <h5 className="dashText">Live Traffic</h5>
                    </button>
                </li>
                <li>
                    <button id="logHistoryButton" className="dashButtons">
                        <div className="imgWrapper"><img src={logHistoryIcon} alt="log history icon" className="dashSVG"/></div>
                        <h5 className="dashText">Log History</h5>
                    </button>
                </li>
                <li>
                    <button id="modelButton" className="dashButtons">
                        <div className="imgWrapper"><img src={modelIcon} alt="model icon" className="smallDashSVG"/></div>
                        <h5 className="dashText">Models</h5>
                    </button>
                </li>
            </ul>
            <button id="lowerSettings">
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

    export const CurrentModelInfo = ()=> {
        return (
            <div id = "currentModelInfo">
                <h5>Current Model: [{currentModel}]</h5>
                <label id="modelChangeLabel">
                    <h5>Change Model: </h5>
                </label>
                <select name="model" id="modelSelector">
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
