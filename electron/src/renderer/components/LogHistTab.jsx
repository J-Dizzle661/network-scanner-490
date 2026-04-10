export const LogHistoryTab = ({alerts, logs})=>{
    return(
        <ul id="logHistoryTab">
                <li>
                    <h3>Alerts</h3>
                    <div id="alertTableWrapper"><AlertTable alerts={alerts}/></div>
                </li>
            <li>
                <h3>Logs</h3>
                <LogsTable logs={logs}/>
            </li>
        </ul>
    );
}

export const AlertTable = ({ alerts = [] }) => {
    return (
            <table id="alertTable">
                <thead>
                    <tr id = "firstRow">
                        <th>Time</th>
                        <th>Flow #</th>
                        <th>Predicted Label</th>
                        <th>Confidence</th>
                        <th>Inference Latency</th>
                        <th>Throughput</th>
                        <th>CPU</th>
                        <th>Memory</th>
                    </tr>
                </thead>
                <tbody>
                    {alerts.length === 0 ? (
                        <tr>
                            <td colSpan="8" style={{textAlign: 'center', color: '#888'}}>No alerts detected</td>
                        </tr>
                    ) : (
                        alerts.map((alert) => (
                            <tr key={alert.flowNumber}>
                                <td>{alert.timestamp}</td>
                                <td>{alert.flowNumber}</td>
                                <td style={{color: '#dc3545', fontWeight: 'bold'}}>{alert.label}</td>
                                <td>{alert.confidence}</td>
                                <td>{alert.latency}</td>
                                <td>{alert.throughput}</td>
                                <td>{alert.cpu}</td>
                                <td>{alert.memory}</td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
    );
}

export const LogsTable = ({ logs = [] }) => {
    return (
        <div id="logsTableWrapper">
            <table id="logsTable">
                <thead>
                    <tr id = "firstRow">
                        <th>Time</th>
                        <th>Flow #</th>
                        <th>Predicted Label</th>
                        <th>Confidence</th>
                        <th>Inference Latency</th>
                        <th>Throughput</th>
                        <th>CPU</th>
                        <th>Memory</th>
                    </tr>
                </thead>
                <tbody>
                    {logs.length === 0 ? (
                        <tr>
                            <td colSpan="8" style={{textAlign: 'center', color: '#888'}}>No flows captured yet</td>
                        </tr>
                    ) : (
                        logs.map((log) => (
                            <tr key={log.flowNumber}>
                                <td>{log.timestamp}</td>
                                <td>{log.flowNumber}</td>
                                <td>{log.label}</td>
                                <td>{log.confidence}</td>
                                <td>{log.latency}</td>
                                <td>{log.throughput}</td>
                                <td>{log.cpu}</td>
                                <td>{log.memory}</td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
}
