import {createRoot} from 'react-dom/client';
import 'bootstrap/dist/css/bootstrap.css';
import {TopBar} from './components/HomePage.jsx';
import { LeftContainer } from './components/HomePage.jsx';
import { QuickTrafficInfo } from './components/HomePage.jsx';
import { AlertTable } from './components/HomePage.jsx';
import { CurrentModelInfo } from './components/HomePage.jsx';
import { LiveTrafficGraph } from './components/HomePage.jsx';
import ListGroup from './components/ListGroup.jsx';

const MyComponent = () => {
  return <h1> This is from react!</h1>;
}

const root = createRoot(document.getElementById('root'));
root.render(
  <>
    <TopBar/>
    <LeftContainer/>
    <h1 id="liveTrafficText">Live Traffic</h1>
    <QuickTrafficInfo/>
    <h5 id="alertsText">Alerts</h5>
    <AlertTable/>
    <CurrentModelInfo/>
    <LiveTrafficGraph/>
  </>
);
