import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";

const ROLE_LABELS = {
  investor: "مستثمر",
  client: "مالك مشروع / عميل",
  engineer: "مهندس",
  surveyor: "مسّاح",
  firm: "شركة هندسية",
  legal: "مستشار قانوني",
  consultant: "مستشار فني",
  contractor: "مقاول",
  supplier: "مورد"
};

const NEXT_PAGES = {
  investor: "/RegisterClient?type=investor",
  client: "/RegisterClient?type=individual",
  engineer: "/RegisterEngineer?type=engineer",
  surveyor: "/RegisterEngineer?type=surveyor",
  firm: "/RegisterFirm",
  legal: "/RegisterLegalConsultant",
  consultant: "/RegisterConsultant",
  contractor: "/RegisterContractor",
  supplier: "/RegisterSupplier"
};

export default function RegistrationAuth() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const role = searchParams.get("type") || "client";
  const roleLabel = useMemo(() => ROLE_LABELS[role] || ROLE_LABELS.client, [role]);
  const nextPage = NEXT_PAGES[role] || NEXT_PAGES.client;
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    supabase?.auth.getSession().then(({ data }) => {
      if (active && data?.session?.user) navigate(nextPage, { replace: true });
    }).catch(() => {});
    return () => { active = false; };
  }, [navigate, nextPage]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    const cleanEmail = email.trim().toLowerCase();
    if (!supabase) return setError("خدمة التسجيل غير مهيأة حالياً.");
    if (password.length < 8) return setError("كلمة المرور يجب أن تكون 8 أحرف على الأقل.");
    if (password !== confirmPassword) return setError("كلمتا المرور غير متطابقتين.");

    setLoading(true);
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: {
            full_name: fullName.trim(),
            name: fullName.trim(),
            role,
            account_type: role
          }
        }
      });
      if (signUpError) {
        const msg = String(signUpError.message || "").toLowerCase();
        if (msg.includes("already registered") || msg.includes("already exists") || msg.includes("user already registered")) {
          setError("هذا البريد مسجل بالفعل. يمكنك تسجيل الدخول.");
        } else {
          console.error("Supabase registration error:", signUpError);
          setError("تعذر إنشاء الحساب حالياً. يرجى المحاولة مرة أخرى.");
        }
        return;
      }

      if (data?.session) {
        try { await supabase.rpc('claim_migrated_account'); } catch {}
        navigate(nextPage, { replace: true });
        return;
      }

      setMessage("تم إنشاء الحساب. أرسلنا رسالة تفعيل إلى بريدك الإلكتروني. بعد التفعيل سجّل الدخول، ثم أكمل بيانات حسابك.");
    } catch (err) {
      console.error("Registration auth error:", err);
      setError("تعذر إنشاء الحساب حالياً. يرجى المحاولة مرة أخرى.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main dir="rtl" className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-10">
      <section className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-slate-100 p-6 md:p-8">
        <div className="text-center mb-7">
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900">إنشاء حساب {roleLabel}</h1>
          <p className="text-slate-500 mt-2">أنشئ حسابك في بيتلي أولاً، ثم أكمل بيانات التسجيل المهنية.</p>
        </div>
        {error && <div role="alert" className="mb-4 rounded-lg bg-red-50 border border-red-200 text-red-700 p-3 text-sm">{error}</div>}
        {message && <div role="status" className="mb-4 rounded-lg bg-green-50 border border-green-200 text-green-700 p-3 text-sm">{message}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-1.5 text-sm font-medium">الاسم الكامل</label>
            <input className="w-full h-12 rounded-lg border px-3" value={fullName} onChange={(e) => setFullName(e.target.value)} required disabled={loading} autoComplete="name" />
          </div>
          <div>
            <label className="block mb-1.5 text-sm font-medium">البريد الإلكتروني</label>
            <input className="w-full h-12 rounded-lg border px-3" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={loading} autoComplete="email" />
          </div>
          <div>
            <label className="block mb-1.5 text-sm font-medium">كلمة المرور</label>
            <input className="w-full h-12 rounded-lg border px-3" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required disabled={loading} autoComplete="new-password" />
          </div>
          <div>
            <label className="block mb-1.5 text-sm font-medium">تأكيد كلمة المرور</label>
            <input className="w-full h-12 rounded-lg border px-3" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required disabled={loading} autoComplete="new-password" />
          </div>
          <button className="w-full h-12 rounded-lg bg-slate-900 text-white font-semibold disabled:opacity-50" disabled={loading}>
            {loading ? "جاري إنشاء الحساب..." : "إنشاء الحساب والمتابعة"}
          </button>
        </form>
        <div className="text-center mt-5 text-sm text-slate-500">
          لديك حساب بالفعل؟ <button type="button" className="text-blue-600 font-semibold" onClick={() => navigate("/login")}>تسجيل الدخول</button>
        </div>
      </section>
    </main>
  );
}
