import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import AdminAIAssistant from "./AdminAIAssistant";

const PLATFORM_OWNER_EMAIL = "bytlylmstbyt@gmail.com";

export default function AdminAIAssistantSupabase() {
  const [checking, setChecking] = useState(true);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data, error } = await supabase.auth.getUser();
        if (error || !data?.user) throw error || new Error("No authenticated user");
        const email = (data.user.email || "").trim().toLowerCase();
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("user_id", data.user.id)
          .maybeSingle();
        if (mounted) setAllowed(email === PLATFORM_OWNER_EMAIL || profile?.role === "admin");
      } catch {
        if (mounted) setAllowed(false);
      } finally {
        if (mounted) setChecking(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  if (checking) {
    return <div className="min-h-[60vh] flex items-center justify-center"><div className="w-8 h-8 rounded-full border-2 border-[#C9A66B] border-t-transparent animate-spin" /></div>;
  }

  if (!allowed) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4" dir="rtl">
        <div className="max-w-md w-full rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
          <h2 className="text-lg font-bold text-[#4A3F35] mb-2">هذه الصفحة مخصصة للمشرفين فقط</h2>
          <p className="text-sm text-slate-500">غير مصرح لك بالوصول إلى مساعد الإدارة المركزي.</p>
        </div>
      </div>
    );
  }

  return <AdminAIAssistant />;
}
