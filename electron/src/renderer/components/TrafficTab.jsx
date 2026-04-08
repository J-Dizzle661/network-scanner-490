//import { LiveTrafficGraph } from "./Dashboard";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useState } from "react";

//need to work on getting the traffic history here
//also need to work on dividing up the traffic graphs up so that all four appear on traffic tab

    export const LiveTrafficGraph = ({ history = []}) => {
        const [selectedMetric, setSelectedMetric] = useState('inferenceLatency');
        const metricOptions = [
            { value: 'inferenceLatency', label: 'Inference Latency (ms)' },
            { value: 'throughput',       label: 'Throughput (pkts/s)'    },
            { value: 'cpuUsage',         label: 'CPU Usage (%)'          },
            { value: 'memoryUsage',      label: 'Memory Usage (%)'       },
        ];

        const selectedLabel = metricOptions.find(m => m.value === selectedMetric)?.label || selectedMetric;

        return (
            <div >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                    <h5 style={{ margin: 0 }}>Live Traffic</h5>
                    <select
                        value={selectedMetric}
                        onChange={e => setSelectedMetric && setSelectedMetric(e.target.value)}
                        style={{ padding: '4px 8px', borderRadius: '5px', border: '1px solid #ccc', fontSize: '13px' }}
                    >
                        {metricOptions.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                </div>
                <Graph history={history} selectedMetric={selectedMetric} selectedLabel = {selectedLabel}/>
            </div>

        );
    }

const Graph = ({selectedMetric, history, selectedLabel}) => {
    return (
        <>
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
        </>
    );

}


    export const LiveTrafficTab = ({history}) => {

        return (<ul id="allGraphs">
            <li>
                <h2 className='graphText'>Inference Latency</h2>
                <Graph selectedMetric={'inferenceLatency'} history={history} selectedLabel={'Inference Latency (ms)'}/>
            </li>
            <li>
                <h2 className='graphText'>Throughput</h2>
                <Graph selectedMetric={'throughput'} history={history} selectedLabel={'Throughput (pkts/s)'}/>
            </li>
            <li>
                <h2 className='graphText'>CPU Usage</h2>
                <Graph selectedMetric={'cpuUsage'} history={history} selectedLabel={'CPU Usage (%)'}/>
            </li>
            <li>
                <h2 className='graphText'>Memory Usage</h2>
                <Graph selectedMetric={'memoryUsage'} history={history} selectedLabel={'Memory Usage (%)'}/>
            </li>
        </ul>);
    }
