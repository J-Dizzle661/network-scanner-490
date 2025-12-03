import {createRoot} from 'react-dom/client';
//import React from 'react';

const MyComponent = () => {
  return <h1> This is fron react!</h1>;
}

const root = createRoot(document.getElementById('root'));
root.render(<MyComponent />);