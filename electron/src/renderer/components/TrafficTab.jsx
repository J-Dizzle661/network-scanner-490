import { LiveTrafficGraph } from "./Dashboard";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useState } from "react";

export const LiveTrafficTab = () =>{

    const [trafficHistory, setTrafficHistory] = useState([]);
    const [selectedMetric, setSelectedMetric] = useState('inferenceLatency');
    return (
        <div>
            {history.length === 0 ? (
                <div style={{
                    width: 660, height: 300,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'white', borderRadius: '10px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    color: '#888', fontSize: '14px'
                }}>
                    Start a scan to see live traffic data
                </div>
            ) : (
                <div style={{
                    width: 660, height: 300,
                    background: 'white', borderRadius: '10px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    padding: '10px'
                }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={history} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis
                                dataKey="time"
                                tick={{ fontSize: 10 }}
                                interval="preserveStartEnd"
                            />
                            <YAxis tick={{ fontSize: 10 }} width={45} />
                            <Tooltip
                                formatter={(value) => [`${value}`, selectedLabel]}
                                labelFormatter={(label) => `Time: ${label}`}
                            />
                            <Line
                                type="monotone"
                                dataKey={selectedMetric}
                                stroke="#007bff"
                                strokeWidth={2}
                                dot={false}
                                isAnimationActive={false}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            )}
        </div>
    );
}

