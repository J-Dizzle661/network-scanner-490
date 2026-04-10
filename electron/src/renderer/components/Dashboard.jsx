// This file contains the individual components that make up the HomePage component 
// is seen in the Renderer.jsx file. The Components in this use the style.css file as 
// its stylesheet.

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
//This function allows us to interact with the fe in real time and modify what is being displayed
import { useState, useEffect } from "react";
import { startScan, stopScan, initWebSocket, socket } from '../../utils/api.js';
import { models, modelsMap, currentActiveModel } from "../../main/modelObjects.js";
import { LiveTrafficGraph } from "./TrafficTab.jsx";
import { AlertTable, LogsTable } from './LogHistTab.jsx';

let networkStatus = 'IDLE';
let detectedThreats = '0';
let currentThroughput = '0';
const defaultModel = 'Random Forest';
//List of models for the dropdown menu. Can be easily modified to add more models.
const modelsJSX = models.map((model) => <option key={Object.keys(model)[0]}>{Object.keys(model)[0]}</option>);

//Main component that holds all other components for the HomePage
//This gets exported directly to app.jsx
export function Dashboard({trafficHistory, interfaceValue, logs, alerts, networkMetrics, scanSummary,  handleStartScan, handleStopScan}) {


    return (
        <div id="homePage">
            <h5 id="metricsText">Metrics</h5>
            <MetricsSection metrics={networkMetrics} summary={scanSummary} />
            <h5 id="alertsText">Alerts</h5>
            <div id="dashAlertTable"><AlertTable alerts={alerts} /></div>
            <CurrentModelInfo />
            <ControlButtons 
            onStart={handleStartScan} 
            onStop={handleStopScan} 
            selectedInterface={interfaceValue} 
            selectedModel={currentActiveModel}
            />
            <div id= "liveTrafficGraph"><LiveTrafficGraph history={trafficHistory} /></div>
        </div>
    );
}

    export const MetricsSection = ({ metrics = {}, summary = null }) => {
    const [activeTab, setActiveTab] = useState('live');

    return (
        <div id="metricsSection">
            <div className="metricsTabs">
                <button 
                    className={`metricsTab ${activeTab === 'live' ? 'active' : ''}`}
                    onClick={() => setActiveTab('live')}
                >
                    Live
                </button>
                <button 
                    className={`metricsTab ${activeTab === 'summary' ? 'active' : ''}`}
                    onClick={() => setActiveTab('summary')}
                >
                    Summary
                </button>
            </div>
            <div className="metricsContent">
                {activeTab === 'live' && <QuickTrafficInfo metrics={metrics} />}
                {activeTab === 'summary' && <SummaryInfo summary={summary} />}
            </div>
        </div>
    );
}

export const QuickTrafficInfo = ({ metrics = {} }) => {
    const networkStatus = metrics.isScanning ? 'SCANNING' : 'IDLE';
    const statusColor = metrics.isScanning ? '#28a745' : '#6c757d';
    
    return (
        <div id="quickTrafficInfo">
            <div className="quickTrafficBox">
                <span>Network Status: <strong style={{ color: statusColor }}>{networkStatus}</strong></span>
            </div>
            <div className="quickTrafficBox">
                <span>Flows Processed: <strong>{metrics.flowNumber || 0}</strong></span>
            </div>
            <div className="quickTrafficBox">
                <span>Throughput: <strong>{(metrics.throughput || 0).toFixed(2)} packets/s</strong></span>
            </div>
            <div className="quickTrafficBox">
                <span>CPU Usage: <strong>{(metrics.cpuUsage || 0).toFixed(1)}%</strong></span>
            </div>
            <div className="quickTrafficBox">
                <span>Memory Usage: <strong>{(metrics.memoryUsage || 0).toFixed(1)}%</strong></span>
            </div>
        </div>
    );
} 

const SummaryInfo = ({ summary = null }) => {
    if (!summary) {
        return (
            <div id="summaryInfo">
                <div className="summaryBox">
                    <h5>Scan Summary</h5>
                    <p style={{color: '#888'}}>No scan completed yet. Summary will appear after a scan finishes.</p>
                </div>
            </div>
        );
    }

    return (
        <div id="summaryInfo">
            <div className="summaryBox">
                <h5>Scan Summary</h5>
                <div style={{marginTop: '10px'}}>
                    <p><strong>Duration:</strong> {summary.duration_seconds}s</p>
                    <p><strong>Total Flows:</strong> {summary.total_flows}</p>
                    <p><strong>Total Packets:</strong> {summary.total_packets}</p>
                    <p><strong>Throughput:</strong> {summary.throughput_packets_per_second} packets/sec</p>
                    <p><strong>Avg Inference Latency:</strong> {summary.average_inference_latency_seconds ? `${(summary.average_inference_latency_seconds * 1000).toFixed(2)}ms` : 'N/A'}</p>
                    <p><strong>Model:</strong> {summary.model_type}</p>
                    <p><strong>Interface:</strong> {summary.interface}</p>
                </div>
            </div>
            <div className="summaryBox" style={{marginTop: '10px'}}>
                <h5>Hardware Usage</h5>
                <div style={{marginTop: '10px'}}>
                    <p><strong>CPU Avg:</strong> {summary.hardware_usage?.cpu_average_percent}%</p>
                    <p><strong>CPU Max:</strong> {summary.hardware_usage?.cpu_max_percent}%</p>
                    <p><strong>Memory Avg:</strong> {summary.hardware_usage?.memory_average_percent}%</p>
                    <p><strong>Memory Max:</strong> {summary.hardware_usage?.memory_max_percent}%</p>
                </div>
            </div>
        </div>
    );
}

    export const CurrentModelInfo = ()=> {
        const [currentModel, setCurrentModel] = useState(currentActiveModel);
        return (
            <div id = "currentModelInfo">
                <h5>Current Model: [{currentModel}]</h5>
                <label id="modelChangeLabel">
                    <h5>Change Model: </h5>
                </label>
                <select name="model" id="modelSelector" onChange={(model)=> {
                    setCurrentModel(model.target.value);
                    console.log(model.target.value)
                    modelsMap.get(model.target.value).activate();
                }}>
                    {modelsJSX}
                </select>
            </div>
        );
    }


    export const ControlButtons = ({ onStart, onStop, selectedInterface = [] }) => {
        const [isRunning, setIsRunning] = useState(false);
    
        const handleStart = () => {
            setIsRunning(true);
            // We pass the interface value back up to the parent
            if (onStart) onStart();
            else startScan({ interface: selectedInterface, guid: '' });
        };
    
        const handleStop = () => {
            setIsRunning(false);
            if (onStop) onStop();
            else stopScan();
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

