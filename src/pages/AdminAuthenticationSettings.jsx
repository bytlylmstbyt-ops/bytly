import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  ShieldCheck, LogIn, KeyRound, RotateCcw, Wrench, Chrome,
  Apple, Mail, ExternalLink, CheckCircle2, LockKeyhole, Info
} from "lucide-react";

const AUTH_PAGES = [
  { title: "تسجيل الدخول", path: "/login", icon: LogIn, description: "صفحة الدخول الرئيسية بالبريد وكلمة المرور ومزودي الدخول الخارجيين." },
  { title: "نسيت كلمة المرور", path: "/forgot-password", icon: KeyRound, description: "إرسال رابط آمن لإعادة تعيين كلمة المرور." },
  { title: "إعادة تعيين كلمة المرور", path: "/reset-password", icon: RotateCcw, description: "تعيين كلمة مرور جديدة باستخدام رمز إعادة التعيين." },
];

export default function AdminAuthenticationSettings() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [maintenance, setMaintenance] = useState(false);
  const [googleEnabled, setGoogleEnabled] = useState(true);
  const [appleEnabled, setAppleEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(true);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10" dir="rtl">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-7">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#5142A4] to-[#6D5CE7] text-white flex items-center justify-center shadow-sm">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-[#25213A]">المصادقة والأمان</h1>
            <p className="text-sm text-slate-500 mt-1">إدارة صفحات الدخول واستعادة الحساب ونقاط ربط نظام المصادقة.</p>
          </div>
        </div>
        <Badge className="w-fit bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-50">
          <CheckCircle2 className="w-3.5 h-3.5 ml-1" /> جاهز للربط مع Authentication
        </Badge>
      </div>

      <Card className="border-[#C9A66B]/30 mb-6 bg-gradient-to-l from-[#FFFCF5] to-white">
        <CardContent className="p-5 flex gap-3 items-start">
          <Info className="w-5 h-5 text-[#C9A66B] shrink-0 mt-0.5" />
          <div className="text-sm text-slate-600 leading-6">
            <p className="font-semibold text-[#4A3F35] mb-1">هذه الصفحة هي مركز التحكم للمصادقة</p>
            <p>الواجهات الموجودة فعليًا في المنصة مرتبطة هنا كمرجع إداري. عند نقل المصادقة إلى Supabase Auth أو إضافة Google وApple، تكون هذه النقطة هي مكان إدارة مزودي المصادقة وحالة الدخول والصيانة.</p>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-7">
        {AUTH_PAGES.map((page) => {
          const Icon = page.icon;
          return (
            <Card key={page.path} className="border-slate-200 hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-lg bg-[#F1EEFF] text-[#5142A4] flex items-center justify-center"><Icon className="w-5 h-5" /></div>
                    <CardTitle className="text-base text-[#2F2945]">{page.title}</CardTitle>
                  </div>
                  <Badge variant="outline" className="text-emerald-700 border-emerald-200 bg-emerald-50">مفعلة</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-slate-500 leading-5 mb-4">{page.description}</p>
                <Link to={page.path} target="_blank" rel="noreferrer">
                  <Button variant="outline" size="sm" className="w-full">فتح الصفحة <ExternalLink className="w-3.5 h-3.5 mr-2" /></Button>
                </Link>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card className="border-slate-200">
          <CardHeader><CardTitle className="text-lg text-[#2F2945] flex items-center gap-2"><LockKeyhole className="w-5 h-5 text-[#5142A4]" /> طرق تسجيل الدخول</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <SettingRow icon={Mail} title="البريد الإلكتروني وكلمة المرور" description="تسجيل الدخول التقليدي" checked={emailEnabled} onCheckedChange={setEmailEnabled} />
            <SettingRow icon={Chrome} title="Google" description="OAuth — جاهز للربط مع مزود المصادقة" checked={googleEnabled} onCheckedChange={setGoogleEnabled} />
            <SettingRow icon={Apple} title="Apple" description="OAuth — جاهز للربط مع مزود المصادقة" checked={appleEnabled} onCheckedChange={setAppleEnabled} />
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardHeader><CardTitle className="text-lg text-[#2F2945] flex items-center gap-2"><Wrench className="w-5 h-5 text-[#C9A66B]" /> وضع الصيانة والدخول</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <SettingRow icon={Wrench} title="وضع صيانة المصادقة" description="إيقاف محاولات الدخول مؤقتًا عند الحاجة" checked={maintenance} onCheckedChange={setMaintenance} danger />
            <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 text-xs text-slate-500 leading-5">
              <strong className="text-slate-700">ملاحظة:</strong> الإعدادات الحالية في هذه المرحلة واجهة تحكم وتجهيز للربط. لا يتم تغيير مزود المصادقة الفعلي أو تعطيل المستخدمين من هذه المفاتيح قبل ربط Authentication المركزي.
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-5 border-slate-200">
        <CardHeader><CardTitle className="text-lg text-[#2F2945]">حالة جلسة المدير</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap gap-3 text-sm">
          <Badge variant="outline">{loading ? "جاري التحقق..." : user ? `مسجل كـ ${user.email || "مدير"}` : "غير متاح"}</Badge>
          <Badge variant="outline">المصادقة الحالية: Base44 Auth</Badge>
          <Badge variant="outline">الهدف التالي: Supabase Auth</Badge>
        </CardContent>
      </Card>
    </div>
  );
}

function SettingRow({ icon: Icon, title, description, checked, onCheckedChange, danger }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 p-3.5">
      <div className="flex items-center gap-3 min-w-0">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${danger ? "bg-amber-50 text-amber-600" : "bg-slate-100 text-slate-600"}`}><Icon className="w-4 h-4" /></div>
        <div className="min-w-0"><p className="font-medium text-sm text-[#3A334D]">{title}</p><p className="text-xs text-slate-500 mt-0.5">{description}</p></div>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}
