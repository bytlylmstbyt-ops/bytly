import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useRef } from 'react';
import { useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';

const AUTH_PATHS = ['/login', '/register', '/register-auth', '/forgot-password', '/reset-password'];
const ROLE_REGISTRATION_PATHS = {
  '/RegisterClient': 'client',
  '/RegisterEngineer': 'engineer',
  '/RegisterFirm': 'firm',
  '/RegisterLegalConsultant': 'legal',
  '/RegisterConsultant': 'consultant',
  '/RegisterContractor': 'contractor',
  '/RegisterSupplier': 'supplier'
};
const DefaultFallback = () => <div className="fixed inset-0 flex items-center justify-center"><div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" /></div>;

export default function ProtectedRoute({ fallback = <DefaultFallback />, unauthenticatedElement }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();
  const hasRedirectedRef = useRef(false);
  const isAuthPath = AUTH_PATHS.some(p => location.pathname === p || location.pathname.startsWith(p + '/'));
  const registrationRole = ROLE_REGISTRATION_PATHS[location.pathname];

  useEffect(() => {
    if (isLoadingAuth || isLoadingPublicSettings || isAuthenticated || isAuthPath || hasRedirectedRef.current) return;
    if (registrationRole) {
      hasRedirectedRef.current = true;
      const query = location.search || '';
      navigate(`/register-auth?type=${encodeURIComponent(registrationRole)}${query.replace(/^\?/, '&')}`, { replace: true });
      return;
    }
    const needsLogin = (!isAuthenticated && !authError) || authError?.type === 'auth_required';
    if (needsLogin) {
      hasRedirectedRef.current = true;
      setTimeout(() => {
        try { navigateToLogin(); } catch { window.location.href = '/login'; }
      }, 0);
    }
  }, [isLoadingAuth, isLoadingPublicSettings, isAuthenticated, isAuthPath, registrationRole, location.search, navigate, navigateToLogin, authError]);

  if (isLoadingPublicSettings || isLoadingAuth) return fallback;
  if (isAuthPath) return <Outlet />;
  if (authError?.type === 'user_not_registered') return <UserNotRegisteredError />;
  if (authError || !isAuthenticated) return unauthenticatedElement;
  return <Outlet />;
}