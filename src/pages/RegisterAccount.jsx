import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase, isSupabaseConfigured } from "@/lib/supabaseClient";
import { Mail, User, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "react-hot-toast";

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

const ROLE_LABELS = {
  investor: "مستثمر / مطور", client: "صاحب منزل / مشروع", engineer: "مهندس", surveyor: "مهندس مساحة",
  firm: "مكتب هندسي", legal: "مستشار قانوني", consultant: "مستشار", contractor: "مقاول", supplier: "مورد",
};

const SIGNUP_TIMEOUT_MS = 20000;
function withTimeout(promise, ms) {
  let timer;
  const timeout = new Promise((_, reject) => { timer = setTimeout(() => reject(new Error("REGISTRATION_TIMEOUT")), ms); });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

export default function RegisterAccount() {
  const navigate = useNavigate();
  const role = new URLSearchParams(window.location.search).get("role") || "client";
  const destination = ROLE_ROUTES[role] || ROLE_ROUTES.client;
  const roleLabel = ROLE_LABELS[role] || ROLE_LABELS.client;
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = fullName.trim();
    if (!cleanName || !cleanEmail) return toast.error("يرجى تعبئة جميع بيانات الحساب");
    if (!isSupabaseConfigured || !supabase) return toast.error("خدمة التسجيل غير مهيأة حالياً");
    setLoading(true);
    try {
      const { data, error } = await withTimeout(supabase.auth.signInWithOtp({
        email: cleanEmail,
        options: {
          shouldCreateUser: true,
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: { full_name: cleanName, name: cleanName, role, account_type: role }
        }
      }), SIGNUP_TIMEOUT_MS);
      if (error) {
        const msg = String(error.message || "").toLowerCase();
        if (msg.includes("already registered") || msg.includes("already exists")) toast.error("هذا البريد مسجل بالفعل. يمكنك تسجيل الدخول.");
        else toast.error(error.message || "تعذر إنشاء الحساب حالياً");
        return;
      }
      sessionStorage.setItem("bytly_registration_draft", JSON.stringify({ full_name: cleanName, email: cleanEmail, role, next_path: destination, created_at: Date.now() }));
      toast.success("تم إرسال رابط التفعيل إلى بريدك الإلكتروني لإكمال التسجيل.");
    } catch (error) {
      console.error("Registration error:", error);
      toast.error(error?.message === "REGISTRATION_TIMEOUT" ? "استغرق إنشاء الحساب وقتاً أطول من المتوقع. حاولي مرة أخرى." : "تعذر إنشاء الحساب حالياً. حاول مرة أخرى.");
    } finally { setLoading(false); }
  };

  return <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-amber-50/30 py-12">
    <div className="max-w-lg mx-auto px-4">
      <div className="text-center mb-8"><h1 className="text-2xl md:text-3xl font-bold text-[#1a1a2e] mb-2">إنشاء حساب {roleLabel}</h1><p className="text-slate-600">أنشئ حسابك أولاً ثم أكمل بيانات التسجيل.</p></div>
      <Card className="border-0 shadow-xl"><CardHeader><CardTitle className="text-xl">بيانات الحساب</CardTitle></CardHeader><CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2"><Label>الاسم الكامل *</Label><div className="relative"><User className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400"/><Input value={fullName} onChange={e=>setFullName(e.target.value)} className="pr-10" autoComplete="name" required/></div></div>
          <div className="space-y-2"><Label>البريد الإلكتروني *</Label><div className="relative"><Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400"/><Input type="email" value={email} onChange={e=>setEmail(e.target.value)} className="pr-10" autoComplete="email" required/></div></div>
          <Button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-[#1a1a2e] to-[#C9A66B] text-white h-12">{loading?<><Loader2 className="w-4 h-4 ml-2 animate-spin"/>جاري إنشاء الحساب...</>:<>متابعة<ArrowLeft className="w-4 h-4 mr-2"/></>}</Button>
        </form>
      </CardContent></Card>
    </div>
  </div>;
}
