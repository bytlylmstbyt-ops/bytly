import React, { useEffect } from "react";
import { base44 } from "@/api/base44Client";
import LegacyAdminAIAssistant from "./AdminAIAssistant";
import { useAuth } from "@/lib/AuthContext";
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
  const { user, isAuthenticated, isLoadingAuth } = useAuth();

  const email = (user?.email || "").trim().toLowerCase();
  const isAdmin = isAuthenticated && (
    email === PLATFORM_OWNER_EMAIL ||
    user?.role === "admin" ||
    user?.profile?.role === "admin"
  );

  // The legacy assistant still owns its existing history/agent UI. We only
  // provide it with the already-resolved Supabase identity after AuthProvider
  // finishes loading, avoiding the previous race where it saw no session.
  useEffect(() => {
    if (!isAdmin || !user) return;
    const normalizedUser = {
      ...user,
      id: user.id,
      user_id: user.id,
      email: user.email,
      role: "admin",
      _authProvider: "supabase",
    };
    base44.auth.me = async () => normalizedUser;
  }, [isAdmin, user]);

  if (isLoadingAuth) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-7 h-7 animate-spin text-[#C9A66B]" />
      </div>
    );
  }

  if (!isAdmin) return <AccessDenied />;

  return <LegacyAdminAIAssistant />;
}
