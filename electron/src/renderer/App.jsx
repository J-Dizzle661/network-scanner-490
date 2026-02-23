import React, { useState } from 'react';
import SettingsPage from './components/SettingsPage';
// Import the components from your HomePage file
import { LeftContainer, TopBar, QuickTrafficInfo, AlertTable, LogsTable, CurrentModelInfo, LiveTrafficGraph, ControlButtons, Interface } from './components/HomePage';

function App() {
  // 'dashboard' is the default view
  const [currentView, setCurrentView] = useState('dashboard');

  return (
    <div className="app-container" style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      
      {/* Sidebar: We pass the 'setCurrentView' function down so buttons can work */}
      <LeftContainer onViewChange={setCurrentView} />

      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        
        {/* TopBar stays visible on both pages, or you can hide it for settings if you prefer */}
        <TopBar />

        {/* Conditional Rendering: Show Dashboard OR Settings */}
        <div style={{ flex: 1, overflow: 'auto', padding: '20px' }}>
            
            {currentView === 'dashboard' && (
                // This is your existing Dashboard Layout
                <div className="dashboard-content">
                    <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
                         <QuickTrafficInfo />
                         <CurrentModelInfo />
                    </div>
                    
                    <div style={{ display: 'flex', gap: '20px' }}>
                         <div style={{ flex: 1 }}>
                            <LiveTrafficGraph />
                            <ControlButtons />
                         </div>
                         <div style={{ flex: 1 }}>
                             <AlertTable />
                             <LogsTable />
                         </div>
                    </div>
                </div>
            )}

            {currentView === 'settings' && (
                <SettingsPage />
            )}

        </div>
      </div>
    </div>
  );
}

export default App;