import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useRef } from 'react';
import { useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';

// Paths that must NEVER trigger a login redirect — prevents redirect loops
const AUTH_PATHS = ['/login', '/register', '/forgot-password', '/reset-password'];

const DefaultFallback = () => (
  <div className="fixed inset-0 flex items-center justify-center">
    <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
  </div>
);

export default function ProtectedRoute({ fallback = <DefaultFallback />, unauthenticatedElement }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();
  const hasRedirectedRef = useRef(false);

  // Redirect loop protection — skip redirect if already on an auth page
  const isAuthPath = AUTH_PATHS.some(p => location.pathname === p || location.pathname.startsWith(p + '/'));

  const needsLogin = !isLoadingAuth && !isLoadingPublicSettings && !isAuthPath && (
    (!isAuthenticated && !authError) ||
    authError?.type === 'auth_required'
  );

  useEffect(() => {
    // Only redirect once per mount/session to prevent loops
    if (needsLogin && !isAuthPath && !hasRedirectedRef.current) {
      hasRedirectedRef.current = true;
      const redirect = () => {
        try {
          navigateToLogin();
        } catch (err) {
          console.error('Redirect to login failed:', err);
          window.location.href = '/login';
        }
      };
      
      // Use setTimeout to avoid React state update during render
      setTimeout(redirect, 0);
    }
     
  }, [needsLogin, isAuthPath]);

  if (isLoadingPublicSettings || isLoadingAuth) {
    return fallback;
  }

  // Don't render fallback for needsLogin - let the user stay on auth pages
  if (isAuthPath) {
    return <Outlet />;
  }

  if (authError?.type === 'user_not_registered') {
    return <UserNotRegisteredError />;
  }

  if (authError || !isAuthenticated) {
    return unauthenticatedElement;
  }

  return <Outlet />;
}