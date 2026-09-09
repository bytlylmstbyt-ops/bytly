import React from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ShieldCheck } from "lucide-react";

export default function Register() {
  const navigate = useNavigate();
  const go = () => navigate(createPageUrl("RegisterChoice"));
  return <main dir="rtl" className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
    <section className="w-full max-w-lg bg-white rounded-2xl shadow-xl p-8 text-center">
      <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-[#1a1a2e] to-[#C9A66B] flex items-center justify-center"><ShieldCheck className="w-8 h-8 text-white"/></div>
      <h1 className="text-3xl font-bold text-[#1a1a2e]">انضم إلى بيتلي</h1>
      <p className="text-slate-600 mt-3 mb-7">ابدأ باختيار نوع حسابك، ثم أنشئ حسابك مرة واحدة وأكمل بياناتك.</p>
      <Button onClick={go} className="w-full h-12 bg-gradient-to-r from-[#1a1a2e] to-[#C9A66B] text-white">اختيار نوع الحساب <ArrowLeft className="w-4 h-4 mr-2"/></Button>
      <p className="mt-5 text-sm text-slate-500">لديك حساب بالفعل؟ <button onClick={()=>navigate("/login")} className="font-semibold text-blue-600">تسجيل الدخول</button></p>
    </section>
  </main>;
}