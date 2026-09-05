import React, { Component, useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'
import { base44 } from '@/api/base44Client';
import { patchAgentSubscription } from '@/lib/patchAgents';

class StartupErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('[Bytly] Client render error:', error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div dir="rtl" style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: 'system-ui, sans-serif', background: '#fff' }}>
          <div style={{ width: '100%', maxWidth: 520, textAlign: 'center' }}>
            <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 12 }}>تعذر تحميل بيتلي</h1>
            <p style={{ color: '#666', marginBottom: 20 }}>حدث خطأ مؤقت في تحميل الصفحة. حاول تحديث الصفحة مرة أخرى.</p>
            <button onClick={() => window.location.reload()} style={{ padding: '12px 20px', borderRadius: 10, border: 0, cursor: 'pointer', background: '#111', color: '#fff' }}>إعادة تحميل الصفحة</button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// Expose base44 on window so the patch utility can access it, then apply
// the patch BEFORE the app renders. Never allow an optional legacy SDK patch
// to prevent the public authentication pages from rendering.
window.base44 = base44;
try {
  patchAgentSubscription();
} catch (error) {
  console.warn('[Bytly] Legacy agent patch skipped:', error?.message || error);
}

// Guard against uncaught JSON.parse errors from the SDK's WebSocket handlers.
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
  <StartupErrorBoundary>
    <App />
  </StartupErrorBoundary>
)
