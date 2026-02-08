import React, { useState, useEffect } from 'react';
import './SettingsPage.css';

const SettingsPage = () => {
  // State for form fields
  const [formData, setFormData] = useState({
    captureInterface: 'Default (Wi-Fi)',
    guid: '{9AACDFEB-1D67-4EE2-0GAC-7713001E15F7}', // Default placeholder
    logPath: '',
    startOnBoot: 'on'
  });

  // Load saved settings on mount
  useEffect(() => {
    if (window.electronAPI) {
      window.electronAPI.loadSettings().then((savedSettings) => {
        if (savedSettings) {
          setFormData(savedSettings);
        }
      });
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleBrowse = async () => {
    if (window.electronAPI) {
      const path = await window.electronAPI.selectFolder();
      if (path) {
        setFormData(prev => ({ ...prev, logPath: path }));
      }
    } else {
      console.warn("Electron API not available");
    }
  };

  const handleSave = async () => {
    if (window.electronAPI) {
      const result = await window.electronAPI.saveSettings(formData);
      if (result.success) {
        alert('Settings saved successfully!');
      } else {
        alert('Failed to save settings: ' + result.error);
      }
    }
  };

  return (
    <div className="settings-container">
      <h1 className="settings-header">Application Settings</h1>

      {/* --- Section 1: Network --- */}
      <div className="settings-section">
        <div className="section-header">Network and Backend Configuration</div>
        <div className="section-body">
          
          <div className="form-group">
            <label className="form-label">Capture Interface:</label>
            <select 
              className="form-control" 
              name="captureInterface" 
              value={formData.captureInterface} 
              onChange={handleChange}
            >
              <option value="Default (Wi-Fi)">Default (Wi-Fi)</option>
              <option value="Ethernet">Ethernet</option>
              <option value="Loopback">Loopback</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">GUID:</label>
            <input 
              type="text" 
              className="form-control" 
              name="guid"
              value={formData.guid} 
              onChange={handleChange} 
            />
          </div>

        </div>
      </div>

      {/* --- Section 2: Data Management --- */}
      <div className="settings-section">
        <div className="section-header">Data Management</div>
        <div className="section-body">
          
          <div className="form-group">
            <label className="form-label">Local Log Storage Path:</label>
            <div className="input-group">
              <input 
                type="text" 
                className="form-control" 
                name="logPath"
                value={formData.logPath} 
                readOnly 
                placeholder="Select a folder..."
              />
              <button className="btn-browse" onClick={handleBrowse}>Browse...</button>
            </div>
          </div>

          <div style={{ marginLeft: '200px' }}>
             <button className="btn-danger">Clear Logs (local)</button>
          </div>

        </div>
      </div>

      {/* --- Section 3: Other --- */}
      <div className="settings-section">
        <div className="section-header">Other</div>
        <div className="section-body">
          
          <div className="form-group">
            <label className="form-label">Start on System Boot:</label>
            <div className="radio-group">
              <label className="radio-option">
                <input 
                  type="radio" 
                  name="startOnBoot" 
                  value="on" 
                  checked={formData.startOnBoot === 'on'}
                  onChange={handleChange}
                /> 
                On
              </label>
              <label className="radio-option">
                <input 
                  type="radio" 
                  name="startOnBoot" 
                  value="off" 
                  checked={formData.startOnBoot === 'off'}
                  onChange={handleChange}
                /> 
                Off
              </label>
            </div>
          </div>

        </div>
      </div>

      {/* --- Footer Buttons --- */}
      <div className="settings-footer">
        <button className="btn-footer" onClick={handleSave}>Save Changes</button>
        <button className="btn-footer">Discard Changes</button>
      </div>

    </div>
  );
};

export default SettingsPage;