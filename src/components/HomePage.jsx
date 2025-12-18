import line from "./images/Line.svg";
import magGlass from "./images/MagGlass.svg"
import notifBell from "./images/notifBell.svg"
import defaultIcon from "./images/UserIcon.svg"

export const TopBar = ()=>{
    return (
        <div className="TopBar">
            <SettingsIcon />
            <div className="mainText"><h1>IDS Monitor</h1></div>
            <SearchBar/>
            <button className="logOut">Log Out</button>
            <object data={notifBell} type="image/svg+xml"></object>
            <object data={defaultIcon} type="image/svg+xml"></object>
        </div>
    );
}

const SettingsIcon = () => {
    return (
        <button className="settingsButton">
            <object className="line" data={line} type="image/svg+xml"></object>
            <object className="line" data={line} type="image/svg+xml"></object>
            <object className="line" data={line} type="image/svg+xml"></object>
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
