import React from 'react';
import { createRoot } from 'react-dom/client';
import 'bootstrap/dist/css/bootstrap.css';
import '../styles/global.css';
import {Dashboard} from './components/Dashboard.jsx';

// Render the App component into the root div.
const root = createRoot(document.getElementById('root'));
root.render(<Dashboard />);