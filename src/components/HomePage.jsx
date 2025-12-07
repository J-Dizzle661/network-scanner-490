const TopBar = ()=>{
    return (
        <header className="top-bar">
            <button className="menu-btn" aria-label="Menu">Menu</button>
            <div className="top-title">IDS Monitor</div>

            <div className="top-search">
                <span className="search-icon">🔍</span>
                <input
                    id="search-input"
                    type="text"
                    placeholder="Search"
                    autocomplete="off"
                />
            </div>

            <div className="top-actions">
                <button className="top-btn">Log Out</button>
                <button className="icon-btn" title="Notifications">🔔</button>
                <button className="icon-btn" title="Profile">⚫</button>
            </div>
         </header>
    );
}