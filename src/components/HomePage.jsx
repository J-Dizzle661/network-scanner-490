import line from "./images/Line.svg";
import magGlass from "./images/MagGlass.svg";
import notifBell from "./images/notifBell.svg";
import defaultIcon from "./images/UserIcon.svg";
import dashboardIcon from "./images/dashboardIcon.svg";
import liveTrafficIcon from "./images/liveTrafficIcon.svg";
import logHistoryIcon from "./images/logHistoryIcon.svg";
import modelIcon from "./images/modelIcon.svg";

export const TopBar = ()=>{
    return (
        <>
            <div className="TopBar">
                <SettingsIcon />
                <div className="mainText"><h1>IDS Monitor</h1></div>
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
        <div className="searchBar">
            <object className="magGlass" data={magGlass} type="image/svg+xml"></object>
            <input type="search" placeholder="Search"/>
        </div>
    );
}

export const LeftContainer = ()=> {
    return (
        <div className="leftContainer">
            <ul id="dashList">
                <li>
                    <button id="dashboardButton" className="dashButtons">
                        <img src={dashboardIcon} alt="dashoard icon" />
                        <h5>Dashboard</h5>
                    </button>
                </li>
                <li>
                    <button id="liveTrafficButton" className="dashButtons">
                        <img src={liveTrafficIcon} alt="live traffic icon" />
                        <h5>Live Traffic</h5>
                    </button>
                </li>
                <li>
                    <button id="logHistoryButton" className="dashButtons">
                        <img src={logHistoryIcon} alt="log history icon" />
                        <h5>Log History</h5>
                    </button>
                </li>
                <li>
                    <button id="modelButton" className="dashButtons">
                        <img src={modelIcon} alt="model icon" />
                        <h5>Models</h5>
                    </button>
                </li>
            </ul>
        </div>
    );
}
