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
    let heartbeatTimer = null;

    const initialize = async () => {
      if (!isMounted.current) return;
      if (isSupabaseConfigured && supabase) {
        try {
          const { data, error } = await supabase.auth.getSession();
          if (error) throw error;
          if (data?.session?.user && isMounted.current) {
            await setSupabaseUser(data.session.user);
          }

          const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
            if (!isMounted.current) return;
            if (session?.user) {
              await setSupabaseUser(session.user, _event === 'SIGNED_IN');
            } else if (_event === 'SIGNED_OUT') {
              setUser(null);
              setIsAuthenticated(false);
              setIsLoadingAuth(false);
            }
          });
          unsubscribe = listener?.subscription;

          // Keep a lightweight, real database presence heartbeat.
          const updatePresence = async () => {
            const { data: { user: currentUser } } = await supabase.auth.getUser();
            if (!currentUser) return;
            await supabase.from('profiles').update({ last_seen_at: new Date().toISOString() }).eq('user_id', currentUser.id);
          };
          await updatePresence();
          heartbeatTimer = window.setInterval(updatePresence, 60000);
        } catch (error) {
          console.warn('Supabase auth initialization skipped:', error?.message || error);
          if (isMounted.current) setAuthError(error);
        }
      }
      if (isMounted.current) {
        setIsLoadingAuth(false);
        setIsLoadingPublicSettings(false);
      }
    };

    initialize();
    return () => {
      isMounted.current = false;
      unsubscribe?.unsubscribe?.();
      if (heartbeatTimer) window.clearInterval(heartbeatTimer);
    };
  }, []);

  const setSupabaseUser = async (authUser, recordLogin = false) => {
    if (!authUser || !isMounted.current) return;
    let profile = null;
    if (supabase) {
      try {
        let result = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', authUser.id)
          .maybeSingle();

        if (result.error && /user_id/i.test(result.error.message || '')) {
          result = await supabase
            .from('profiles')
            .select('*')
            .eq('id', authUser.id)
            .maybeSingle();
        }
        if (result.error) throw result.error;
        profile = result.data || null;

        const patch = { last_seen_at: new Date().toISOString() };
        if (recordLogin) patch.last_login_at = new Date().toISOString();
        await supabase.from('profiles').update(patch).eq('user_id', authUser.id);
        if (profile) profile = { ...profile, ...patch };
      } catch (error) {
        console.warn('Supabase profile lookup/activity update skipped:', error?.message || error);
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
    let logoutError = null;
    if (isSupabaseConfigured && supabase) {
      try {
        // Explicit local scope prevents the old session from surviving in this browser.
        const { error } = await supabase.auth.signOut({ scope: 'local' });
        if (error) logoutError = error;
      } catch (error) {
        logoutError = error;
      }
    }

    // Defensive cleanup for sessions left behind by older auth builds.
    try {
      const legacyKey = 'sb-wbqtgdkubrocnqnykhlt-auth-token';
      window.localStorage.removeItem(legacyKey);
      window.sessionStorage.removeItem(legacyKey);
    } catch {}

    setUser(null);
    setIsAuthenticated(false);
    setAuthError(logoutError);

    if (shouldRedirect) {
      // Replace the history entry so Back cannot reopen a protected page.
      window.location.replace('/login?logged_out=1');
    }

    return !logoutError;
  };

  const navigateToLogin = () => {
    const currentPath = window.location.pathname + window.location.search;
    sessionStorage.setItem('loginReturnUrl', currentPath);
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, isLoadingAuth, isLoadingPublicSettings, authError, appPublicSettings, logout, navigateToLogin, checkAppState }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
