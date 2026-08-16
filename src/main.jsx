import React, { useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'
import { base44 } from '@/api/base44Client';
import { patchAgentSubscription } from '@/lib/patchAgents';

// Expose base44 on window so the patch utility can access it, then apply
// the patch BEFORE the app renders. This replaces the SDK's WebSocket-based
// subscribeToConversation (which has an unguarded JSON.parse that crashes the
// app on malformed events) with a safe polling-based implementation.
window.base44 = base44;
patchAgentSubscription();

// Guard against uncaught JSON.parse errors from the SDK's WebSocket handlers.
// The patch above prevents the known agents.js issue, but this catches any
// other unguarded JSON.parse in the SDK as a safety net.
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