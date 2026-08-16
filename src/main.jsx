import React, { useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'

// Guard against uncaught JSON.parse errors from the SDK's WebSocket handlers
// (e.g. agents.js update_model handler calls JSON.parse without try/catch).
// When the server pushes a malformed event, the SyntaxError becomes an
// unhandled promise rejection that crashes the app — suppress it gracefully.
window.addEventListener('unhandledrejection', (event) => {
  if (event?.reason instanceof SyntaxError && event.reason.message?.includes('Unexpected token')) {
    event.preventDefault();
    console.warn('Suppressed SDK WebSocket JSON parse error:', event.reason.message);
  }
});

// Sync dark mode with system color scheme preference
const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
const applyDark = (e) => {
  document.documentElement.classList.toggle('dark', e.matches);
};
applyDark(mediaQuery);
mediaQuery.addEventListener('change', applyDark);

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)