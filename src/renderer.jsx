import {createRoot} from 'react-dom/client';
import 'bootstrap/dist/css/bootstrap.css';
import './components/HomePage.jsx'
import ListGroup from './components/ListGroup.jsx';

const MyComponent = () => {
  return <h1> This is fron react!</h1>;
}

const root = createRoot(document.getElementById('root'));
//root.render(<MyComponent />);
//root.render(<ListGroup />);
root.render(<HomePage />);
