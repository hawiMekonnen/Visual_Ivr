import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import client from './api/client'

// Global console override to forward phone logs to terminal for real-time debugging
if (typeof window !== "undefined") {
  const originalLog = console.log;
  const originalWarn = console.warn;
  const originalError = console.error;

  const sendRemoteLog = async (level, args) => {
    try {
      const msg = args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(' ');
      await client.post('/api/logs', { level, message: msg });
    } catch (_) {}
  };

  console.log = (...args) => {
    originalLog(...args);
    sendRemoteLog('info', args);
  };
  console.info = console.log;
  
  console.warn = (...args) => {
    originalWarn(...args);
    sendRemoteLog('warn', args);
  };
  
  console.error = (...args) => {
    originalError(...args);
    sendRemoteLog('error', args);
  };

  window.addEventListener('unhandledrejection', (event) => {
    sendRemoteLog('error', ['Unhandled Promise Rejection:', event.reason]);
  });
  
  window.addEventListener('error', (event) => {
    sendRemoteLog('error', ['Global error:', event.message, 'at', event.filename, ':', event.lineno]);
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
