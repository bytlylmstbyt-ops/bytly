import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { supabase } from "@/lib/supabaseClient";
import { motion } from "framer-motion";
import { Eye, EyeOff, LockKeyhole, Mail, User, ArrowLeft, Loader2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "react-hot-toast";

const ROLE_ROUTES = {
  investor: `${createPageUrl("RegisterClient")}?type=investor`,
  client: `${createPageUrl("RegisterClient")}?type=individual`,
  engineer: `${createPageUrl("RegisterEngineer")}?type=engineer`,
  surveyor: `${createPageUrl("RegisterEngineer")}?type=surveyor`,
  firm: createPageUrl("RegisterFirm"),
  legal: createPageUrl("RegisterLegalConsultant"),
  consultant: createPageUrl("RegisterConsultant"),
  contractor: createPageUrl("RegisterContractor"),
  supplier: createPageUrl("RegisterSupplier"),
};

const ROLE_LABELS = {
  investor: "مستثمر / مطور",
  client: "صاحب منزل / مشروع",
  engineer: "مهندس",
  surveyor: "مهندس مساحة",
  firm: "مكتب هندسي",
  legal: "مستشار قانوني",
  consultant: "مستشار",
  contractor: "مقاول",
  supplier: "مورد",
};

export default function RegisterAccount() {
  const navigate = useNavigate();
  const params = useMemo(() => new URLSearchParams(window.location.search), []);
  const role = params.get("role") || "client";
  const destination = ROLE_ROUTES[role] || ROLE_ROUTES.client;
  const roleLabel = ROLE_LABELS[role] || ROLE_LABELS.client;

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [created, setCreated] = useState(false);

  useEffect(() => {
    let active = true;
    const continueToRole = async () => {
      const { data } = await supabase.auth.getSession();
      if (!active || !data?.session?.user) return;
      const user = data.session.user;
      setFullName(user.user_metadata?.full_name || user.user_metadata?.name || "");
      setEmail(user.email || "");
      setCreated(true);
      setTimeout(() => {
        if (active) navigate(destination, { replace: true });
      }, 500);
    };
    continueToRole().catch(() => {});
    return () => { active = false; };
  }, [destination, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = fullName.trim();

    if (!cleanName || !cleanEmail || !password || !confirmPassword) {
      toast.error("يرجى تعبئة جميع بيانات الحساب");
      return;
    }
    if (password.length < 6) {
      toast.error("كلمة المرور يجب أن تكون 6 أحرف على الأقل");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("كلمتا المرور غير متطابقتين");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: {
            full_name: cleanName,
            name: cleanName,
            role,
            registration_role: role,
          },
          emailRedirectTo: `${window.location.origin}${createPageUrl("RegisterAccount")}?role=${encodeURIComponent(role)}&continue=1`,
        },
      });

      if (error) {
        const message = error.message || "تعذر إنشاء الحساب";
        if (/already registered|already exists|user already/i.test(message)) {
          throw new Error("هذا البريد الإلكتروني مسجل بالفعل. لم يتم تغيير كلمة المرور أو الحساب الموجود.");
        }
        throw new Error(message);
      }

      if (!data?.user) throw new Error("تعذر إنشاء حساب المستخدم");

      if (data.session) {
        setCreated(true);
        toast.success("تم إنشاء حسابك بنجاح");
        navigate(destination, { replace: true });
        return;
      }

      // Hosted Supabase commonly requires email confirmation. The Auth user is created,
      // while the confirmation link brings the user back here and continues to the role form.
      setCreated(true);
      toast.success("تم إنشاء الحساب. راجعي بريدك الإلكتروني لتفعيل الحساب ثم إكمال البيانات.", { duration: 7000 });
    } catch (error) {
      console.error("RegisterAccount error:", error);
      toast.error(error?.message || "تعذر إنشاء الحساب. حاول مرة أخرى.");
    } finally {
      setLoading(false);
    }
  };

  if (created && !loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-amber-50/30 flex items-center justify-center p-6">
        <Card className="w-full max-w-lg border-0 shadow-xl">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 flex items-center justify-center mb-5">
              <CheckCircle className="w-9 h-9 text-emerald-600" />
            </div>
            <h1 className="text-2xl font-bold text-[#1a1a2e]">تم إنشاء حسابك بنجاح</h1>
            <p className="text-slate-600 mt-3">{roleLabel}</p>
            <p className="text-sm text-slate-500 mt-3">{email ? `تم إنشاء الحساب بالبريد ${email}.` : "تم إنشاء حسابك."}</p>
            <p className="text-sm text-slate-500 mt-2">إذا طلب منك تفعيل البريد، افتحي رسالة التفعيل ثم سيتم نقلك تلقائيًا لإكمال بيانات التسجيل.</p>
            <Button className="mt-6 bg-gradient-to-r from-[#1a1a2e] to-[#C9A66B] text-white" onClick={() => navigate(destination, { replace: true })}>
              متابعة تسجيل البيانات
              <ArrowLeft className="w-4 h-4 mr-2" />
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-amber-50/30 py-12">
      <div className="max-w-lg mx-auto px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-[#1a1a2e] to-[#C9A66B] flex items-center justify-center mb-4">
            <User className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#1a1a2e] mb-2">إنشاء حساب {roleLabel}</h1>
          <p className="text-slate-600">أدخل بيانات الدخول أولًا، ثم أكمل بيانات ملفك في الخطوة التالية.</p>
        </motion.div>

        <Card className="border-0 shadow-xl">
          <CardHeader><CardTitle className="text-xl">بيانات الحساب</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="register-full-name">الاسم الكامل *</Label>
                <div className="relative"><User className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" /><Input id="register-full-name" value={fullName} onChange={(e) => setFullName(e.target.value)} className="pr-10" autoComplete="name" required /></div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="register-email">البريد الإلكتروني *</Label>
                <div className="relative"><Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" /><Input id="register-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="pr-10" autoComplete="email" required /></div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="register-password">كلمة المرور *</Label>
                <div className="relative"><LockKeyhole className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" /><Input id="register-password" type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} className="pr-10 pl-10" autoComplete="new-password" minLength={6} required /><button type="button" onClick={() => setShowPassword(v => !v)} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" aria-label="إظهار كلمة المرور">{showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}</button></div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="register-confirm-password">تأكيد كلمة المرور *</Label>
                <div className="relative"><LockKeyhole className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" /><Input id="register-confirm-password" type={showConfirm ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="pr-10 pl-10" autoComplete="new-password" minLength={6} required /><button type="button" onClick={() => setShowConfirm(v => !v)} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" aria-label="إظهار تأكيد كلمة المرور">{showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}</button></div>
              </div>
              <Button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-[#1a1a2e] to-[#C9A66B] text-white h-12">
                {loading ? <><Loader2 className="w-4 h-4 ml-2 animate-spin" />جاري إنشاء الحساب...</> : <>إنشاء الحساب والمتابعة<ArrowLeft className="w-4 h-4 mr-2" /></>}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
