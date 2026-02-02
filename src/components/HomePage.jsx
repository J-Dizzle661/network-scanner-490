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
//This function allows us to interact with the fe in real time and modify what is being displayed
import { useState } from "react";

let networkStatus = 'IDLE';
let detectedThreats = '0';
let currentThroughput = '0';
const defaultModel = 'Random Forest';
//List of models for the dropdown menu. Can be easily modified to add more models.
const models = ['Random Forest', 'Isolation Forest', 'SVM', 'MLP','Logistic Regression'];
const modelsJSX = models.map((model) => <option key={model}>{model}</option>);

//Main component that holds all other components for the HomePage
//This gets exported directly to Renderer.jsx
export function HomePage() {
   const [TopSettingsOpen, setTopSettingsOpen] = useState(false);
    return (
        <div id="homePage">
            <TopBar TopSettingsOpen={TopSettingsOpen} setTopSettingsOpen={setTopSettingsOpen} />
            <LeftContainer TopSettingsOpen={TopSettingsOpen} />
            <h1 id="liveTrafficText">Live Traffic</h1>
            <QuickTrafficInfo/>
            <h5 id="alertsText">Alerts</h5>
            <AlertTable/>
            <CurrentModelInfo/>
            <LiveTrafficGraph/>
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

const SettingsIcon = ({TopSettingsOpen, setTopSettingsOpen}) => {
    return (
        <button id="settingsButton" onClick={() => setTopSettingsOpen(!TopSettingsOpen)}>
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

export const LeftContainer = ({TopSettingsOpen})=> {
    if (TopSettingsOpen === false){
    return (
        <div id="leftContainerOpen">
            <ul id="dashListOpen">
                <li>
                    <button id="dashboardButton" className="dashButtonsOpen">
                        <div className="imgWrapper"><img src={dashboardIcon} alt="dashoard icon" className="smallDashSVG"/></div>
                        <h5 className="dashText">Dashboard</h5>
                    </button>
                </li>
                <li>
                    <button id="liveTrafficButton" className="dashButtonsOpen">
                        <div className="imgWrapper"><img src={liveTrafficIcon} alt="live traffic icon" className="dashSVG"/></div>
                        <h5 className="dashText">Live Traffic</h5>
                    </button>
                </li>
                <li>
                    <button id="logHistoryButton" className="dashButtonsOpen">
                        <div className="imgWrapper"><img src={logHistoryIcon} alt="log history icon" className="dashSVG"/></div>
                        <h5 className="dashText">Log History</h5>
                    </button>
                </li>
                <li>
                    <button id="modelButton" className="dashButtonsOpen">
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
