import React, { useEffect, useState } from "react";

const fieldStyle = { width: "100%", height: 48, boxSizing: "border-box", border: "1px solid #d1d5db", borderRadius: 10, padding: "0 14px", fontSize: 16, background: "white", color: "#111827" };
const buttonStyle = { width: "100%", height: 48, border: 0, borderRadius: 10, padding: "0 14px", fontSize: 16, fontWeight: 600, cursor: "pointer" };
const logoUrl = "https://base44.com/logo_v2.svg";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    import("@/lib/supabaseClient").then(({ supabase }) => supabase?.auth.getSession()).then(({ data }) => {
      if (active && data?.session?.user) window.location.replace("/Home");
    }).catch(() => {});
    return () => { active = false; };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setMessage("");
    if (password.length < 6) { setError("كلمة المرور يجب أن تكون 6 أحرف على الأقل."); return; }
    if (password !== confirmPassword) { setError("كلمتا المرور غير متطابقتين."); return; }
    setLoading(true);
    try {
      const { supabase, isSupabaseConfigured } = await import("@/lib/supabaseClient");
      if (!isSupabaseConfigured || !supabase) { setError("خدمة التسجيل غير مهيأة حالياً. يرجى المحاولة لاحقاً."); return; }
      const cleanEmail = email.trim().toLowerCase();
      const { data, error: sbError } = await supabase.auth.signUp({ email: cleanEmail, password, options: { data: { email: cleanEmail } } });
      if (sbError) {
        const msg = String(sbError.message || "").toLowerCase();
        if (msg.includes("already registered") || msg.includes("already exists") || msg.includes("user already registered")) setError("هذا البريد مسجل بالفعل. يمكنك تسجيل الدخول.");
        else { console.error("Supabase registration error:", sbError); setError("تعذر إنشاء الحساب حالياً. يرجى المحاولة مرة أخرى."); }
        return;
      }
      if (data?.session) window.location.replace("/Home");
      else setMessage("تم إنشاء الحساب بنجاح. راجعي بريدك الإلكتروني لتفعيل الحساب ثم سجّلي الدخول.");
    } catch (err) {
      console.error("Registration error:", err);
      setError("تعذر إنشاء الحساب حالياً. يرجى المحاولة مرة أخرى.");
    } finally { setLoading(false); }
  };

  const handleGoogleRegister = async () => {
    setError(""); setLoading(true);
    try {
      const { supabase, isSupabaseConfigured } = await import("@/lib/supabaseClient");
      if (!isSupabaseConfigured || !supabase) { setError("التسجيل عبر Google غير متاح حالياً."); return; }
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/auth/callback` }
      });
      if (oauthError) { console.error("Supabase Google registration error:", oauthError); setError("تعذر بدء التسجيل عبر Google. يرجى المحاولة مرة أخرى."); }
    } catch (err) { console.error("Google registration error:", err); setError("تعذر بدء التسجيل عبر Google. يرجى المحاولة مرة أخرى."); }
    finally { setLoading(false); }
  };

  return <main dir="rtl" style={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, boxSizing: "border-box", background: "#f8fafc" }}>
    <section style={{ width: "100%", maxWidth: 430, background: "white", border: "1px solid #e5e7eb", borderRadius: 18, padding: 28, boxSizing: "border-box", boxShadow: "0 8px 30px rgba(0,0,0,.06)" }}>
      <header style={{ textAlign: "center", marginBottom: 24 }}><img src={logoUrl} alt="بيتلي | Bytly" style={{ display: "block", width: 110, height: 62, objectFit: "contain", margin: "0 auto 8px" }} onError={(e) => { e.currentTarget.style.display = "none"; }} /><h1 style={{ margin: 0, fontSize: 28, color: "#111827" }}>إنشاء حساب</h1><p style={{ margin: "8px 0 0", color: "#6b7280" }}>أنشئي حسابك في بيتلي</p></header>
      {error && <div role="alert" style={{ marginBottom: 16, padding: 12, borderRadius: 10, background: "#fef2f2", border: "1px solid #fecaca", color: "#b91c1c", fontSize: 14 }}>{error}</div>}
      {message && <div role="status" style={{ marginBottom: 16, padding: 12, borderRadius: 10, background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#166534", fontSize: 14 }}>{message}</div>}
      <form onSubmit={handleSubmit}>
        <label htmlFor="register-email" style={{ display: "block", marginBottom: 7, fontWeight: 600, color: "#374151" }}>البريد الإلكتروني</label><input id="register-email" name="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={loading} style={fieldStyle} />
        <label htmlFor="register-password" style={{ display: "block", margin: "16px 0 7px", fontWeight: 600, color: "#374151" }}>كلمة المرور</label><input id="register-password" name="password" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} required disabled={loading} style={fieldStyle} />
        <label htmlFor="register-confirm" style={{ display: "block", margin: "16px 0 7px", fontWeight: 600, color: "#374151" }}>تأكيد كلمة المرور</label><input id="register-confirm" name="confirmPassword" type="password" autoComplete="new-password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required disabled={loading} style={fieldStyle} />
        <button type="submit" disabled={loading} style={{ ...buttonStyle, marginTop: 18, background: loading ? "#9ca3af" : "#111827", color: "white" }}>{loading ? "جاري إنشاء الحساب..." : "إنشاء الحساب"}</button>
      </form>
      <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "22px 0", color: "#9ca3af", fontSize: 12 }}><span style={{ flex: 1, height: 1, background: "#e5e7eb" }} /><span>أو</span><span style={{ flex: 1, height: 1, background: "#e5e7eb" }} /></div>
      <button type="button" disabled={loading} onClick={handleGoogleRegister} style={{ ...buttonStyle, background: "white", color: "#374151", border: "1px solid #d1d5db" }}>التسجيل عبر Google</button>
      <footer style={{ textAlign: "center", marginTop: 20, fontSize: 14, color: "#6b7280" }}>لديك حساب بالفعل؟ <a href="/login" style={{ color: "#2563eb", fontWeight: 600 }}>تسجيل الدخول</a></footer>
    </section>
  </main>;
}
