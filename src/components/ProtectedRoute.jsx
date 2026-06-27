import { Outlet } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';

const DefaultFallback = () => (
  <div className="fixed inset-0 flex items-center justify-center">
    <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
  </div>
);

export default function ProtectedRoute({ fallback = <DefaultFallback />, unauthenticatedElement }) {
  const { isAuthenticated, isLoadingAuth, authError, navigateToLogin } = useAuth();

  const needsLogin = !isLoadingAuth && (
    (!isAuthenticated && !authError) ||
    authError?.type === 'auth_required'
  );

  useEffect(() => {
    if (needsLogin) {
      navigateToLogin();
    }
  }, [needsLogin, navigateToLogin]);

  if (isLoadingAuth || needsLogin) {
    return fallback;
  }

  if (authError?.type === 'user_not_registered') {
    return <UserNotRegisteredError />;
  }

  if (authError) {
    return unauthenticatedElement;
  }

  return <Outlet />;
}