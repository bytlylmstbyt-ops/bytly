import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { supabase } from "@/lib/supabaseClient";
import LegacyAdminAIAssistant from "./AdminAIAssistant";
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

export default function AdminAIAssistantSupabase() {
  const [state, setState] = useState({ loading: true, admin: false, user: null });

  useEffect(() => {
    let mounted = true;

    const resolveAdmin = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        const user = data?.session?.user;

        if (!user) {
          if (mounted) setState({ loading: false, admin: false, user: null });
          return;
        }

        const email = (user.email || "").trim().toLowerCase();
        let profile = null;
        try {
          const result = await supabase
            .from("profiles")
            .select("role,email,full_name")
            .eq("user_id", user.id)
            .maybeSingle();
          profile = result.data || null;
        } catch {}

        const isAdmin = email === PLATFORM_OWNER_EMAIL || profile?.role === "admin";
        const normalizedUser = {
          id: user.id,
          user_id: user.id,
          email: user.email,
          full_name: profile?.full_name || user.user_metadata?.full_name || user.user_metadata?.name || "",
          role: isAdmin ? "admin" : (profile?.role || "user"),
          profile,
          _authProvider: "supabase",
        };

        // Install the compatibility response only after Supabase has positively
        // resolved the current user. The legacy assistant is rendered afterwards,
        // so its existing history/agent behavior remains unchanged.
        if (isAdmin) {
          base44.auth.me = async () => normalizedUser;
        }

        if (mounted) setState({ loading: false, admin: isAdmin, user: normalizedUser });
      } catch (error) {
        console.warn("Admin assistant Supabase access check failed:", error?.message || error);
        if (mounted) setState({ loading: false, admin: false, user: null });
      }
    };

    resolveAdmin();
    return () => { mounted = false; };
  }, []);

  if (state.loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-7 h-7 animate-spin text-[#C9A66B]" />
      </div>
    );
  }

  if (!state.admin) return <AccessDenied />;

  return <LegacyAdminAIAssistant />;
}
