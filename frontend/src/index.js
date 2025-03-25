import React from 'react';
import { createRoot } from 'react-dom/client';
import './styles/index.css';
import App from './App';
import { AudioProvider } from './contexts/AudioContext';

// Find the root element
const rootElement = document.getElementById('root');

// Create a root
const root = createRoot(rootElement);

// Render the application
root.render(
  <React.StrictMode>
    <AudioProvider>
      <App />
    </AudioProvider>
  </React.StrictMode>
);
