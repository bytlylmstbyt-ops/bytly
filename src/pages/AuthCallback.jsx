import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase, isSupabaseConfigured } from "@/lib/supabaseClient";

const ROLE_ROUTES = {
  investor: "/RegisterClient?type=investor",
  client: "/RegisterClient?type=individual",
  engineer: "/RegisterEngineer?type=engineer",
  surveyor: "/RegisterEngineer?type=surveyor",
  firm: "/RegisterFirm",
  legal: "/RegisterLegalConsultant",
  consultant: "/RegisterConsultant",
  contractor: "/RegisterContractor",
  supplier: "/RegisterSupplier",
};

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
        const user = data?.session?.user;
        if (!user) throw new Error("لم يتم إنشاء جلسة تسجيل الدخول.");

        // The registration draft contains no password. It only tells us which
        // onboarding screen the user selected before email confirmation.
        // Check localStorage first (persists across tabs), then sessionStorage.
        let draft = null;
        try {
          const rawPending = localStorage.getItem("bytly_registration_pending");
          if (rawPending) draft = JSON.parse(rawPending);
          if (!draft) {
            const raw = sessionStorage.getItem("bytly_registration_draft");
            draft = raw ? JSON.parse(raw) : null;
          }
        } catch {}

        const role = draft?.role || user.user_metadata?.role || user.user_metadata?.account_type || null;
        const fullName = draft?.full_name || user.user_metadata?.full_name || user.user_metadata?.name || "";
        const email = user.email || draft?.email || "";

        // Create the base profile immediately after authentication. This is safe
        // because RLS limits the write to auth.uid(). Existing profiles are updated,
        // not duplicated.
        const { error: profileError } = await supabase.from("profiles").upsert({
          user_id: user.id,
          full_name: fullName,
          email,
          phone: "",
          role: role || "client"
        }, { onConflict: "user_id" });
        if (profileError) throw profileError;

        try { await supabase.rpc("claim_migrated_account"); } catch {}

        if (active) {
          const nextPath = role && ROLE_ROUTES[role] ? ROLE_ROUTES[role] : "/Home";
          if (role && ROLE_ROUTES[role]) {
            navigate(nextPath, { replace: true });
          } else {
            sessionStorage.removeItem("bytly_registration_draft");
            navigate("/Home", { replace: true });
          }
        }
      } catch (err) {
        console.error("Supabase auth callback error:", err);
        if (active) setError("تعذر إكمال التسجيل. يرجى المحاولة مرة أخرى.");
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
      <div style={{ color: "#6b7280" }}>جاري إكمال التسجيل...</div>
    </main>
  );
}