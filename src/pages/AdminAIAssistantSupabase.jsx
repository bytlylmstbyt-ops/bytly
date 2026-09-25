import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import LegacyAdminAIAssistant from "./AdminAIAssistant";
import { useAuth } from "@/lib/AuthContext";
import { supabase } from "@/lib/supabaseClient";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, ShieldAlert } from "lucide-react";

const PLATFORM_OWNER_EMAIL = "bytlylmstbyt@gmail.com";

function AccessDenied() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <Card className="max-w-md w-full border-r-4 border-red-400">
        <CardContent className="p-8 text-center">
          <ShieldAlert className="w-10 h-10 text-red-500 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-[#4A3F35] mb-2">هذه الصفحة مخصصة للمشرفين فقط</h2>
          <p className="text-sm text-slate-500">غير مصرح لك بالوصول إلى مساعد المنصة.</p>
        </CardContent>
      </Card>
    </div>
  );
}

const normalizeAdminUser = (authUser, profile = null) => ({
  ...(authUser || {}),
  id: authUser?.id,
  user_id: authUser?.id,
  email: authUser?.email || profile?.email || "",
  full_name: profile?.full_name || authUser?.user_metadata?.full_name || authUser?.user_metadata?.name || "",
  role: "admin",
  profile: profile || { role: "admin" },
  _authProvider: "supabase",
});

export default function AdminAIAssistantSupabase() {
  const { user, isAuthenticated, isLoadingAuth } = useAuth();
  const [verifiedUser, setVerifiedUser] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let mounted = true;

    const verifyAdmin = async () => {
      if (isLoadingAuth) return;

      // First use the already-resolved application auth state.
      const contextEmail = (user?.email || "").trim().toLowerCase();
      const contextAdmin = isAuthenticated && (
        contextEmail === PLATFORM_OWNER_EMAIL ||
        user?.role === "admin" ||
        user?.profile?.role === "admin"
      );

      if (contextAdmin && user) {
        const normalized = normalizeAdminUser(user, user.profile);
        if (mounted) {
          setVerifiedUser(normalized);
          setChecking(false);
        }
        return;
      }

      // Fallback: verify the live Supabase session directly. This prevents a
      // stale/early AuthContext state from incorrectly denying the platform owner.
      try {
        let authUser = null;
        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (!userError) authUser = userData?.user || null;
        // Fallback to the active session when getUser is temporarily unable to refresh/read the token.
        if (!authUser) {
          const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
          if (sessionError) throw sessionError;
          authUser = sessionData?.session?.user || null;
        }
        if (!authUser) throw new Error("No authenticated Supabase user");

        const email = (authUser.email || "").trim().toLowerCase();
        let profile = null;
        try {
          let result = await supabase
            .from("profiles")
            .select("role,email,full_name")
            .eq("user_id", authUser.id)
            .maybeSingle();
          if (!result.data && result.error) {
            result = await supabase
              .from("profiles")
              .select("role,email,full_name")
              .eq("id", authUser.id)
              .maybeSingle();
          }
          profile = result.data || null;
        } catch {}

        const admin = email === PLATFORM_OWNER_EMAIL || profile?.role === "admin";
        if (mounted) {
          setVerifiedUser(admin ? normalizeAdminUser(authUser, profile) : null);
          setChecking(false);
        }
      } catch {
        if (mounted) {
          setVerifiedUser(null);
          setChecking(false);
        }
      }
    };

    verifyAdmin();
    return () => { mounted = false; };
  }, [isLoadingAuth, isAuthenticated, user]);

  useEffect(() => {
    if (!verifiedUser) return;
    base44.auth.me = async () => verifiedUser;
  }, [verifiedUser]);

  if (isLoadingAuth || checking) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-7 h-7 animate-spin text-[#C9A66B]" />
      </div>
    );
  }

  if (!verifiedUser) return <AccessDenied />;

  return <LegacyAdminAIAssistant />;
}
