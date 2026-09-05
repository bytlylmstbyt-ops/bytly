import React, { useState } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabaseClient";

const AUTH_PATHS = ["/login", "/register", "/forgot-password", "/reset-password"];
const getReturnUrl = () => {
  const params = new URLSearchParams(window.location.search);
  const raw = params.get("from_url") || "/";
  try {
    const url = new URL(raw, window.location.origin);
    return AUTH_PATHS.includes(url.pathname) ? "/" : url.pathname + url.search;
  } catch { return "/"; }
};

const fieldStyle = { width: "100%", height: 48, boxSizing: "border-box", border: "1px solid #d1d5db", borderRadius: 10, padding: "0 14px", fontSize: 16, background: "white", color: "#111827" };
const buttonStyle = { width: "100%", height: 48, border: 0, borderRadius: 10, padding: "0 14px", fontSize: 16, fontWeight: 600, cursor: "pointer" };

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!isSupabaseConfigured || !supabase) { setError("خدمة تسجيل الدخول غير مهيأة حالياً."); return; }
    setError(""); setLoading(true);
    try {
      const { error: authError } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
      if (authError) {
        const msg = String(authError.message || "").toLowerCase();
        if (msg.includes("email not confirmed")) setError("يرجى التحقق من بريدك الإلكتروني لتفعيل الحساب.");
        else if (msg.includes("invalid login credentials")) setError("البريد الإلكتروني أو كلمة المرور غير صحيحة.");
        else setError("تعذر تسجيل الدخول حالياً. يرجى المحاولة مرة أخرى.");
        return;
      }
      window.location.replace(getReturnUrl());
    } catch (err) {
      console.error("Supabase login error:", err);
      setError("تعذر تسجيل الدخول حالياً. يرجى المحاولة مرة أخرى.");
    } finally { setLoading(false); }
  };

  const handleSocialLogin = async (provider) => {
    if (!isSupabaseConfigured || !supabase) { setError("تسجيل الدخول غير مهيأ حالياً."); return; }
    setError(""); setLoading(true);
    try {
      const { error: oauthError } = await supabase.auth.signInWithOAuth({ provider, options: { redirectTo: `${window.location.origin}/login` } });
      if (oauthError) { console.error(`Supabase ${provider} login error:`, oauthError); setError("تعذر بدء تسجيل الدخول. يرجى المحاولة مرة أخرى."); setLoading(false); }
    } catch (err) { console.error("OAuth login error:", err); setError("تعذر بدء تسجيل الدخول. يرجى المحاولة مرة أخرى."); setLoading(false); }
  };

  return <main dir="rtl" style={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, boxSizing: "border-box", background: "#f8fafc" }}>
    <section style={{ width: "100%", maxWidth: 430, background: "white", border: "1px solid #e5e7eb", borderRadius: 18, padding: 28, boxSizing: "border-box", boxShadow: "0 8px 30px rgba(0,0,0,.06)" }}>
      <header style={{ textAlign: "center", marginBottom: 24 }}><div style={{ fontSize: 34, marginBottom: 8 }}>🏠</div><h1 style={{ margin: 0, fontSize: 28, color: "#111827" }}>تسجيل الدخول</h1><p style={{ margin: "8px 0 0", color: "#6b7280" }}>مرحباً بعودتك إلى بيتلي</p></header>
      {error && <div role="alert" style={{ marginBottom: 16, padding: 12, borderRadius: 10, background: "#fef2f2", border: "1px solid #fecaca", color: "#b91c1c", fontSize: 14 }}>{error}</div>}
      <form onSubmit={handleSubmit}>
        <label htmlFor="login-email" style={{ display: "block", marginBottom: 7, fontWeight: 600, color: "#374151" }}>البريد الإلكتروني</label>
        <input id="login-email" name="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={loading} style={fieldStyle} />
        <label htmlFor="login-password" style={{ display: "block", margin: "16px 0 7px", fontWeight: 600, color: "#374151" }}>كلمة المرور</label>
        <input id="login-password" name="password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required disabled={loading} style={fieldStyle} />
        <button type="submit" disabled={loading} style={{ ...buttonStyle, marginTop: 18, background: loading ? "#9ca3af" : "#111827", color: "white" }}>{loading ? "جاري تسجيل الدخول..." : "تسجيل الدخول"}</button>
      </form>
      <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "22px 0", color: "#9ca3af", fontSize: 12 }}><span style={{ flex: 1, height: 1, background: "#e5e7eb" }} /><span>أو تابع باستخدام</span><span style={{ flex: 1, height: 1, background: "#e5e7eb" }} /></div>
      <div style={{ display: "grid", gap: 10 }}><button type="button" disabled={loading} onClick={() => handleSocialLogin("google")} style={{ ...buttonStyle, background: "white", color: "#374151", border: "1px solid #d1d5db" }}>تسجيل الدخول عبر Google</button></div>
      <footer style={{ textAlign: "center", marginTop: 20, fontSize: 14 }}><p style={{ margin: "0 0 8px", color: "#6b7280" }}>ليس لديك حساب؟ <a href="/register" style={{ color: "#2563eb", fontWeight: 600 }}>سجّل الآن</a></p><a href="/forgot-password" style={{ color: "#2563eb", fontSize: 13 }}>نسيت كلمة المرور؟</a></footer>
    </section>
  </main>;
}
