import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase, isSupabaseConfigured } from "@/lib/supabaseClient";

export default function AuthCallback() {
  const navigate = useNavigate();
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    const finishAuth = async () => {
      if (!isSupabaseConfigured || !supabase) {
        if (active) setError("خدمة تسجيل الدخول غير مهيأة حالياً.");
        return;
      }

      try {
        const params = new URLSearchParams(window.location.search);
        const code = params.get("code");

        if (code) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) throw exchangeError;
        }

        const { data, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;
        if (!data?.session?.user) throw new Error("لم يتم إنشاء جلسة تسجيل الدخول.");

        if (active) {
          const returnUrl = sessionStorage.getItem("loginReturnUrl");
          sessionStorage.removeItem("loginReturnUrl");
          navigate(returnUrl && !returnUrl.startsWith("/login") ? returnUrl : "/Home", { replace: true });
        }
      } catch (err) {
        console.error("Supabase auth callback error:", err);
        if (active) setError("تعذر إكمال تسجيل الدخول. يرجى المحاولة مرة أخرى.");
      }
    };

    finishAuth();
    return () => { active = false; };
  }, [navigate]);

  if (error) {
    return (
      <main dir="rtl" style={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, background: "#f8fafc" }}>
        <section style={{ width: "100%", maxWidth: 430, background: "white", border: "1px solid #e5e7eb", borderRadius: 18, padding: 28, textAlign: "center" }}>
          <p style={{ color: "#b91c1c", marginBottom: 18 }}>{error}</p>
          <button onClick={() => navigate("/login", { replace: true })} style={{ width: "100%", height: 48, border: 0, borderRadius: 10, background: "#111827", color: "white", fontWeight: 600 }}>
            العودة لتسجيل الدخول
          </button>
        </section>
      </main>
    );
  }

  return (
    <main dir="rtl" style={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f8fafc" }}>
      <div style={{ color: "#6b7280" }}>جاري إكمال تسجيل الدخول...</div>
    </main>
  );
}
