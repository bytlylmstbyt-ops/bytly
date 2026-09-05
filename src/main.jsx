import React, { Component } from 'react'
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
    try {
      window.localStorage.setItem('bytly_last_startup_error', JSON.stringify({
        name: error?.name || 'Error',
        message: error?.message || String(error),
        stack: error?.stack || '',
        componentStack: info?.componentStack || '',
        href: window.location.href,
        at: new Date().toISOString(),
      }));
    } catch (_) {}
  }

  render() {
    if (this.state.error) {
      const errorMessage = this.state.error?.message || 'Unknown client error';
      return (
        <div dir="rtl" style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: 'system-ui, sans-serif', background: '#fff' }}>
          <div style={{ width: '100%', maxWidth: 620, textAlign: 'center' }}>
            <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 12 }}>تعذر تحميل بيتلي</h1>
            <p style={{ color: '#666', marginBottom: 16 }}>حدث خطأ مؤقت في تحميل الصفحة. حاول تحديث الصفحة مرة أخرى.</p>
            <details style={{ textAlign: 'right', margin: '0 auto 20px', padding: 12, border: '1px solid #ddd', borderRadius: 10, color: '#555' }}>
              <summary style={{ cursor: 'pointer', fontWeight: 600 }}>تفاصيل الخطأ</summary>
              <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontSize: 12, marginTop: 10, direction: 'ltr' }}>{errorMessage}</pre>
            </details>
            <button onClick={() => window.location.reload()} style={{ padding: '12px 20px', borderRadius: 10, border: 0, cursor: 'pointer', background: '#111', color: '#fff' }}>إعادة تحميل الصفحة</button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

window.base44 = base44;
try {
  patchAgentSubscription();
} catch (error) {
  console.warn('[Bytly] Legacy agent patch skipped:', error?.message || error);
}

window.addEventListener('unhandledrejection', (event) => {
  if (event?.reason instanceof SyntaxError && event.reason.message?.includes('Unexpected token')) {
    event.preventDefault();
    console.warn('Suppressed SDK WebSocket JSON parse error:', event.reason.message);
  }
});

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
