import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase, isSupabaseConfigured } from "@/lib/supabaseClient";
import { resumePendingRegistration } from "@/lib/registrationService";

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
        const integrationType = params.get("integration");
        if (code) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) throw exchangeError;
        }

        const { data, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;
        const user = data?.session?.user;
        if (!user) throw new Error("لم يتم إنشاء جلسة تسجيل الدخول.");

        // Integration OAuth callback: the Google/GitHub identity has just been linked.
        // Return to the admin integrations center instead of treating this as a registration callback.
        if (integrationType) {
          try {
            sessionStorage.removeItem("bytly_pending_integration");

            if (integrationType === "gmail") {
              const providerToken = data?.session?.provider_token;
              const providerRefreshToken = data?.session?.provider_refresh_token;

              if (!providerToken || !providerRefreshToken) {
                throw new Error("لم تُرجع Google رمز تحديث Gmail. أعيدي ربط Gmail مع السماح بالوصول بلا اتصال.");
              }

              const { data: storeResult, error: storeError } = await supabase.functions.invoke("gmail-service", {
                body: { action: "storeProviderTokens", providerToken, providerRefreshToken },
              });

              if (storeError) throw storeError;
              if (!storeResult?.ok) throw new Error(storeResult?.error || "تعذر حفظ اتصال Gmail.");

              try { localStorage.removeItem("bytly_gmail_provider_token"); } catch (_) {}
              try { localStorage.removeItem("bytly_gmail_provider_refresh_token"); } catch (_) {}
              try { localStorage.removeItem("bytly_google_provider_token"); } catch (_) {}
              try { localStorage.removeItem("bytly_connected_integration"); } catch (_) {}

              const existing = data?.session?.user?.user_metadata?.bytly_integrations || {};
              const { error: metadataError } = await supabase.auth.updateUser({
                data: { bytly_integrations: { ...existing, gmail: true } },
              });
              if (metadataError) console.warn("Could not persist Gmail connection flag:", metadataError);
            } else {
              try { localStorage.setItem("bytly_connected_integration", integrationType); } catch (_) {}
            }
          } catch (integrationError) {
            console.error("Integration OAuth callback error:", integrationError);
            if (active) {
              setError(integrationError?.message || "تعذر حفظ اتصال التكامل.");
              return;
            }
          }

          if (active) {
            navigate(`/AdminControlCenter?cat=integrations&oauth=${encodeURIComponent(integrationType)}&connected=1`, { replace: true });
            return;
          }
        }
        // A complete non-engineer form is stored locally before the magic link is
        // sent. Once the link creates the session, save that form and finish here.
        let pendingRegistration = false;
        try { pendingRegistration = Boolean(localStorage.getItem("bytly_pending_registration")); } catch {}
        if (pendingRegistration) {
          await resumePendingRegistration();
          if (active) {
            navigate("/RegistrationSuccess", { replace: true });
            return;
          }
        }

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
          if (role && ROLE_ROUTES[role]) navigate(ROLE_ROUTES[role], { replace: true });
          else {
            try { sessionStorage.removeItem("bytly_registration_draft"); } catch {}
            navigate("/Home", { replace: true });
          }
        }
      } catch (err) {
        console.error("Supabase auth callback error:", err);
        if (active) setError(err?.message === "EMAIL_CONFIRMATION_REQUIRED" ? "تم إنشاء الحساب. افتحي رسالة التفعيل في بريدك الإلكتروني لإكمال التسجيل." : "تعذر إكمال التسجيل. يرجى المحاولة مرة أخرى.");
      }
    };
    finishAuth();
    return () => { active = false; };
  }, [navigate]);

  if (error) return (
    <main dir="rtl" style={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, background: "#f8fafc" }}>
      <section style={{ width: "100%", maxWidth: 430, background: "white", border: "1px solid #e5e7eb", borderRadius: 18, padding: 28, textAlign: "center" }}>
        <p style={{ color: "#b91c1c", marginBottom: 18 }}>{error}</p>
        <button onClick={() => navigate("/login", { replace: true })} style={{ width: "100%", height: 48, border: 0, borderRadius: 10, background: "#111827", color: "white", fontWeight: 600 }}>العودة لتسجيل الدخول</button>
      </section>
    </main>
  );

  return <main dir="rtl" style={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f8fafc" }}><div style={{ color: "#6b7280" }}>جاري إكمال التسجيل...</div></main>;
}
