import React, { Component } from 'react'
import ReactDOM from 'react-dom/client'
import '@/index.css'

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
            <p style={{ color: '#666', marginBottom: 16 }}>حدث خطأ في تحميل التطبيق. حاول تحديث الصفحة مرة أخرى.</p>
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

const AUTH_PATHS = new Set(['/login', '/register', '/forgot-password', '/reset-password']);
const isPublicAuthPath = AUTH_PATHS.has(window.location.pathname);

function LoadingScreen() {
  return (
    <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui, sans-serif' }} dir="rtl">
      جاري تحميل بيتلي...
    </div>
  );
}

async function mountApp() {
  const rootElement = document.getElementById('root');
  if (!rootElement) throw new Error('Bytly root element was not found');

  if (isPublicAuthPath) {
    // Critical isolation: do NOT import App/pages.config on auth pages.
    // pages.config eagerly imports the entire application and can trigger
    // unrelated DOM side effects before Login is rendered.
    const [authModule, loginModule, registerModule, forgotModule, resetModule, routerModule] = await Promise.all([
      import('@/lib/AuthContext'),
      import('@/pages/Login'),
      import('@/pages/Register'),
      import('@/pages/ForgotPassword'),
      import('@/pages/ResetPassword'),
      import('react-router-dom'),
    ]);

    const { AuthProvider } = authModule;
    const { default: Login } = loginModule;
    const { default: Register } = registerModule;
    const { default: ForgotPassword } = forgotModule;
    const { default: ResetPassword } = resetModule;
    const { BrowserRouter, Routes, Route } = routerModule;

    ReactDOM.createRoot(rootElement).render(
      <StartupErrorBoundary>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </StartupErrorBoundary>
    );
    return;
  }

  // Full application is loaded only for non-auth routes.
  const { default: App } = await import('@/App.jsx');
  ReactDOM.createRoot(rootElement).render(
    <StartupErrorBoundary>
      <App />
    </StartupErrorBoundary>
  );
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

mountApp().catch((error) => {
  console.error('[Bytly] Startup failed:', error);
  const root = document.getElementById('root');
  if (root) {
    ReactDOM.createRoot(root).render(
      <StartupErrorBoundary>
        <div dir="rtl" style={{ padding: 24, fontFamily: 'system-ui, sans-serif' }}>
          تعذر تحميل بيتلي. <button onClick={() => window.location.reload()}>إعادة المحاولة</button>
          <pre style={{ direction: 'ltr', whiteSpace: 'pre-wrap', marginTop: 16 }}>{error?.message || String(error)}</pre>
        </div>
      </StartupErrorBoundary>
    );
  }
});
