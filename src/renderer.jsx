import {createRoot} from 'react-dom/client';
import 'bootstrap/dist/css/bootstrap.css';
import {TopBar} from './components/HomePage.jsx';
import ListGroup from './components/ListGroup.jsx';

const MyComponent = () => {
  return <h1> This is from react!</h1>;
}

const root = createRoot(document.getElementById('root'));
root.render(
  <>
    <TopBar/>
  </>
);
