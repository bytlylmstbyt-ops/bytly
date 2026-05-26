import React, { useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'

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