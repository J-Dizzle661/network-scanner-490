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

export const GlobalElems = () => {
    const [TopSettingsOpen, setTopSettingsOpen] = useState(false);
    const [selectedTab, setSelectedTab] = useState();
        return (
        <>
            <TopBar TopSettingsOpen={TopSettingsOpen} setTopSettingsOpen = {setTopSettingsOpen}/>
            <LeftContainer TopSettingsOpen={TopSettingsOpen}/>
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