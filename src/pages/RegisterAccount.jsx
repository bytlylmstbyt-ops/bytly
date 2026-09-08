import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { supabase } from "@/lib/supabaseClient";
import { motion } from "framer-motion";
import { Eye, EyeOff, LockKeyhole, Mail, User, ArrowLeft, Loader2 } from "lucide-react";
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
      // Do not create the account or show success yet. The account is created only
      // after the user completes the role-specific registration and presses the final submit.
      sessionStorage.setItem("bytly_registration_draft", JSON.stringify({
        role,
        full_name: cleanName,
        email: cleanEmail,
        password,
        created_at: Date.now()
      }));
      navigate(destination, { replace: true });
    } catch (error) {
      toast.error("تعذر متابعة التسجيل. حاول مرة أخرى.");
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-amber-50/30 py-12">
      <div className="max-w-lg mx-auto px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-[#1a1a2e] to-[#C9A66B] flex items-center justify-center mb-4">
            <User className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#1a1a2e] mb-2">إنشاء حساب {roleLabel}</h1>
          <p className="text-slate-600">أدخل بيانات حسابك مرة واحدة، ثم أكمل بقية بيانات التسجيل. لن يتم إنشاء الحساب نهائيًا إلا بعد الضغط على زر إتمام التسجيل في آخر خطوة.</p>
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
                {loading ? <><Loader2 className="w-4 h-4 ml-2 animate-spin" />جاري المتابعة...</> : <>متابعة التسجيل<ArrowLeft className="w-4 h-4 mr-2" /></>}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
