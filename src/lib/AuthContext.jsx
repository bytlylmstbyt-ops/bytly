import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { appParams } from '@/lib/app-params';
import { createAxiosClient } from '@base44/sdk/dist/utils/axios-client';
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
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [appPublicSettings, setAppPublicSettings] = useState(null);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    let unsubscribe = null;

    const initialize = async () => {
      if (!isMounted.current) return;

      // Supabase is the new authentication path. If a Supabase session exists,
      // use it immediately and never make the user depend on Base44.
      if (isSupabaseConfigured && supabase) {
        const { data } = await supabase.auth.getSession();
        if (data?.session?.user && isMounted.current) {
          await setSupabaseUser(data.session.user);
          setIsLoadingPublicSettings(false);
          return;
        }

        const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
          if (!isMounted.current) return;
          if (session?.user) {
            await setSupabaseUser(session.user);
          } else if (_event === 'SIGNED_OUT') {
            // Do not clear a valid Base44 session here. Base44 remains the
            // compatibility fallback until migration is complete.
            if (!isAuthenticated) {
              setUser(null);
              setIsAuthenticated(false);
            }
          }
        });
        unsubscribe = listener?.subscription;
      }

      await checkAppState();
    };

    initialize();
    return () => {
      isMounted.current = false;
      unsubscribe?.unsubscribe?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setSupabaseUser = async (authUser) => {
    if (!authUser || !isMounted.current) return;

    // Profiles are linked opportunistically when a matching profile already
    // exists. We deliberately do not insert/update arbitrary columns here:
    // the production schema may contain required fields and RLS policies.
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
        // Authentication must continue even if the profile table is not yet
        // readable for this session. The migration can repair the profile link.
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

    try {
      setIsLoadingPublicSettings(true);
      setAuthError(null);

      // If Supabase already has a session, it is authoritative for this
      // browser session. Base44 is not queried in that case.
      if (isSupabaseConfigured && supabase) {
        const { data } = await supabase.auth.getSession();
        if (data?.session?.user) {
          await setSupabaseUser(data.session.user);
          setIsLoadingPublicSettings(false);
          return;
        }
      }

      const appClient = createAxiosClient({
        baseURL: `/api/apps/public`,
        headers: {
          'X-App-Id': appParams.appId
        },
        token: appParams.token,
        interceptResponses: true
      });

      try {
        const publicSettings = await appClient.get(`/prod/public-settings/by-id/${appParams.appId}`);
        if (isMounted.current) {
          setAppPublicSettings(publicSettings);
          if (appParams.token) {
            await checkUserAuth();
          } else {
            setIsLoadingAuth(false);
            setIsAuthenticated(false);
          }
          setIsLoadingPublicSettings(false);
        }
      } catch (appError) {
        if (appError.status === 403 && appError.data?.extra_data?.reason) {
          const reason = appError.data.extra_data.reason;
          if (reason === 'auth_required') {
            setAuthError({ type: 'auth_required', message: 'Authentication required' });
          } else if (reason === 'user_not_registered') {
            setAuthError({ type: 'user_not_registered', message: 'User not registered for this app' });
          } else {
            setAuthError({ type: reason, message: appError.message });
          }
        } else {
          console.error('App state check failed:', appError);
          setAuthError({ type: 'unknown', message: appError.message || 'Failed to load app' });
        }
        setIsLoadingPublicSettings(false);
        setIsLoadingAuth(false);
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      setAuthError({ type: 'unknown', message: error.message || 'An unexpected error occurred' });
      setIsLoadingPublicSettings(false);
      setIsLoadingAuth(false);
    }
  };

  const checkUserAuth = async () => {
    try {
      setIsLoadingAuth(true);
      const currentUser = await base44.auth.me();
      if (isMounted.current) {
        setUser({ ...currentUser, _authProvider: 'base44' });
        setIsAuthenticated(true);
        setIsLoadingAuth(false);
      }
    } catch (error) {
      if (isMounted.current) {
        setIsLoadingAuth(false);
        setIsAuthenticated(false);
        if (error.status === 401 || error.status === 403) {
          try {
            localStorage.removeItem('base44_access_token');
            localStorage.removeItem('token');
          } catch (_) {}
          setAuthError({ type: 'auth_required', message: 'Authentication required' });
        } else {
          console.error('User auth check failed:', error);
        }
      }
    }
  };

  const logout = async (shouldRedirect = true) => {
    // Sign out of whichever provider is active. If both exist, clear both so
    // a migrated user cannot unexpectedly fall back to an old session.
    if (isSupabaseConfigured && supabase) {
      try { await supabase.auth.signOut(); } catch (error) {
        console.warn('Supabase logout skipped:', error?.message || error);
      }
    }
    try { await base44.auth.logout(); } catch (_) {}
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