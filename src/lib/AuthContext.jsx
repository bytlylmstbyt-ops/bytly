import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';

const AuthContext = createContext();

const normalizeSupabaseUser = (authUser, profile = null) => ({
  id: authUser.id,
  email: authUser.email || profile?.email || '',
  ...((authUser.user_metadata || {})),
  ...(profile || {}),
  _authProvider: 'supabase',
  _supabaseUserId: authUser.id,
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [appPublicSettings, setAppPublicSettings] = useState(null);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    let unsubscribe = null;

    const initialize = async () => {
      if (!isMounted.current) return;

      if (isSupabaseConfigured && supabase) {
        try {
          const { data } = await supabase.auth.getSession();
          if (data?.session?.user && isMounted.current) {
            await setSupabaseUser(data.session.user);
          }

          const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
            if (!isMounted.current) return;
            if (session?.user) {
              await setSupabaseUser(session.user);
            } else if (_event === 'SIGNED_OUT') {
              setUser(null);
              setIsAuthenticated(false);
              setIsLoadingAuth(false);
            }
          });
          unsubscribe = listener?.subscription;
        } catch (error) {
          console.warn('Supabase auth initialization skipped:', error?.message || error);
        }
      }

      setIsLoadingAuth(false);
      setIsLoadingPublicSettings(false);
    };

    initialize();
    return () => {
      isMounted.current = false;
      unsubscribe?.unsubscribe?.();
    };
  }, []);

  const setSupabaseUser = async (authUser) => {
    if (!authUser || !isMounted.current) return;

    let profile = null;
    if (supabase) {
      try {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authUser.id)
          .maybeSingle();
        profile = data || null;
      } catch (error) {
        console.warn('Supabase profile lookup skipped:', error?.message || error);
      }
    }

    if (isMounted.current) {
      setUser(normalizeSupabaseUser(authUser, profile));
      setIsAuthenticated(true);
      setIsLoadingAuth(false);
      setAuthError(null);
    }
  };

  const checkAppState = async () => {
    if (!isMounted.current) return;
    if (isSupabaseConfigured && supabase) {
      try {
        const { data } = await supabase.auth.getSession();
        if (data?.session?.user) await setSupabaseUser(data.session.user);
      } catch (error) {
        console.warn('Supabase session check skipped:', error?.message || error);
      }
    }
    setIsLoadingPublicSettings(false);
    setIsLoadingAuth(false);
  };

  const logout = async (shouldRedirect = true) => {
    if (isSupabaseConfigured && supabase) {
      try { await supabase.auth.signOut(); } catch (error) {
        console.warn('Supabase logout skipped:', error?.message || error);
      }
    }
    setUser(null);
    setIsAuthenticated(false);
    if (shouldRedirect) window.location.href = '/login';
  };

  const navigateToLogin = () => {
    const currentPath = window.location.pathname + window.location.search;
    sessionStorage.setItem('loginReturnUrl', currentPath);
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isLoadingAuth,
      isLoadingPublicSettings,
      authError,
      appPublicSettings,
      logout,
      navigateToLogin,
      checkAppState
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};