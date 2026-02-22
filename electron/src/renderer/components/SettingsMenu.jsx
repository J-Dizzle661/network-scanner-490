import { useState, useEffect } from 'react';

// Try going up two levels to find utils.
// If this still fails, check where your "utils" folder actually is.
import { socket } from "../utils/api.js"; 

export const SettingsMenu = () => {
  const [formData, setFormData] = useState({
    captureInterface: '',
    guid: '', 
    logPath: '',
    startOnBoot: 'off'
  });

  const [availableInterfaces, setAvailableInterfaces] = useState([]);

  useEffect(() => {
    // 1. Load saved settings (Electron)
    if (window.electronAPI) {
      window.electronAPI.loadSettings().then((saved) => {
        if (saved) setFormData(saved);
      });
    }

    // 2. Ask Python for the real network adapters
    if (socket) {
        socket.emit("request_interfaces");

        socket.on("interface_list", (data) => {
            console.log("Received interfaces:", data);
            setAvailableInterfaces(data);
            
            // Optional: Auto-select the first one if nothing is saved
            if (data.length > 0 && !formData.guid) {
                setFormData(prev => ({
                    ...prev,
                    captureInterface: data[0].name,
                    guid: data[0].guid
                }));
            }
        });
    }

    return () => {
        if (socket) socket.off("interface_list");
    };
  }, []);

  // Handle Dropdown Change
  const handleInterfaceChange = (e) => {
    const selectedName = e.target.value;
    const selectedAdapter = availableInterfaces.find(adapter => adapter.name === selectedName);
    
    if (selectedAdapter) {
        setFormData(prev => ({
            ...prev,
            captureInterface: selectedAdapter.name,
            guid: selectedAdapter.guid 
        }));
    }
  };

  const handleSave = async () => {
    if (window.electronAPI) {
      const result = await window.electronAPI.saveSettings(formData);
      alert(result.success ? 'Settings saved!' : 'Save failed');
    }
  };

  return (
  
    <div className="settings-container">
      {console.log("i am here")}
      <h1 className="settings-header">Application Settings</h1>

      <div className="settings-section">
        <div className="section-header">Network Configuration</div>
        <div className="section-body">
          
          <div className="form-group">
            <label className="form-label">Capture Interface:</label>
            <select 
              className="form-control" 
              name="captureInterface" 
              value={formData.captureInterface} 
              onChange={handleInterfaceChange}
            >
              <option value="" disabled>Select an interface...</option>
              {availableInterfaces.map((adapter, index) => (
                <option key={index} value={adapter.name}>
                  {adapter.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Target GUID:</label>
            <input 
              type="text" 
              className="form-control" 
              name="guid"
              value={formData.guid} 
              readOnly 
              style={{ backgroundColor: '#e9ecef', color: '#666' }}
            />
          </div>

        </div>
      </div>
      
      <div className="settings-footer">
        <button className="btn-footer" onClick={handleSave}>Save Changes</button>
      </div>
    </div>
  );
};

