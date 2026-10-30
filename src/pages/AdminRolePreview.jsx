import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, ShieldAlert, Eye, ArrowRight, FolderKanban, Wallet, MessageSquare, Bell, FileText, Users, BriefcaseBusiness, HardHat, Building2, Package, Scale, Compass, UserRound } from "lucide-react";

const roles = [
  { id: "client", label: "صاحب مشروع / منزل", icon: UserRound, intro: "مساحة العميل لمتابعة طلباته ومشاريعه والتواصل مع مقدمي الخدمات.", modules: [["مشاريعي", "إنشاء مشروع ومتابعة حالته ومراحله", "Projects", FolderKanban], ["العروض", "مراجعة عروض الأسعار ومقارنتها", "ProjectProposals", FileText], ["المحادثات", "التواصل مع فريق المشروع", "Messages", MessageSquare], ["المحفظة والمدفوعات", "متابعة الفواتير ومراحل الدفع", "Wallet", Wallet]] },
  { id: "investor", label: "مستثمر / مطور عقاري", icon: BriefcaseBusiness, intro: "مساحة إدارة الاستثمارات والمشاريع المتعددة ومتابعة تقدمها.", modules: [["محفظة المشاريع", "عرض المشاريع الاستثمارية ومتابعتها", "InvestorHub", FolderKanban], ["المشاريع", "متابعة تفاصيل المشاريع ومراحلها", "Projects", FileText], ["المحادثات", "التواصل مع الجهات المنفذة", "Messages", MessageSquare], ["المحفظة", "متابعة العمليات المالية", "Wallet", Wallet]] },
  { id: "engineer", label: "مهندس / مقدم خدمة", icon: HardHat, intro: "مساحة مهنية لإدارة الفرص والعروض والمشاريع والملف المهني.", modules: [["لوحة المهندس", "إدارة الأعمال والملف المهني", "EngineerDashboard", UserRound], ["فرص المشاريع", "استعراض المشاريع والتقديم عليها", "EngineerProjects", FolderKanban], ["التقويم", "تنظيم المواعيد والمهام", "EngineerCalendar", Bell], ["المحفظة", "متابعة المستحقات", "ProviderWallet", Wallet]] },
  { id: "firm", label: "مكتب هندسي", icon: Building2, intro: "مساحة المكتب لإدارة المشاريع والفريق والإعدادات المهنية.", modules: [["لوحة المكتب", "متابعة أداء المكتب ومشاريعه", "FirmDashboard", Building2], ["المشاريع", "متابعة المشاريع المسندة", "Projects", FolderKanban], ["إعدادات المكتب", "إدارة بيانات المكتب واعتماداته", "FirmSettings", FileText], ["المحادثات", "التواصل مع العملاء والفرق", "Messages", MessageSquare]] },
  { id: "contractor", label: "مقاول", icon: HardHat, intro: "مساحة المقاول لاستقبال الأعمال ومتابعة التنفيذ والتواصل.", modules: [["لوحة المقاول", "ملخص الأعمال والطلبات", "ContractorDashboard", FolderKanban], ["المشاريع", "متابعة المشاريع المسندة", "Projects", FileText], ["مراحل التنفيذ", "متابعة تقدم الأعمال", "BuildingProgress", Bell], ["المحفظة", "متابعة المستحقات", "ProviderWallet", Wallet]] },
  { id: "supplier", label: "مورد", icon: Package, intro: "مساحة المورد لإدارة المنتجات والطلبات والمشاريع المرتبطة.", modules: [["لوحة المورد", "ملخص الطلبات والنشاط", "SupplierDashboard", Package], ["السوق", "استعراض المنتجات والخدمات", "Suppliers", BriefcaseBusiness], ["المشاريع", "متابعة طلبات التوريد", "Projects", FolderKanban], ["المحفظة", "متابعة المستحقات", "ProviderWallet", Wallet]] },
  { id: "consultant", label: "استشاري فني", icon: Compass, intro: "مساحة الاستشاري لمراجعة الأعمال والمهام الفنية.", modules: [["لوحة الاستشاري", "متابعة المهام والمشاريع", "ConsultantDashboard", Compass], ["المشاريع", "متابعة المشاريع المرتبطة", "Projects", FolderKanban], ["المراجعة الفنية", "الوصول إلى المراجعات الفنية", "TechnicalReviewPage", FileText], ["المحادثات", "التواصل مع أطراف المشروع", "Messages", MessageSquare]] },
  { id: "legal_consultant", label: "مستشار قانوني", icon: Scale, intro: "مساحة المستشار القانوني لمتابعة الطلبات والقضايا والمراسلات.", modules: [["الملف القانوني", "عرض مساحة المستشار القانوني", "LegalConsultantProfile", Scale], ["العقود", "مراجعة وإدارة العقود", "MyContracts", FileText], ["النزاعات", "متابعة النزاعات ذات الصلة", "MyDisputes", BriefcaseBusiness], ["المحادثات", "التواصل مع أصحاب الطلبات", "Messages", MessageSquare]] },
];

export default function AdminRolePreview() {
  const [access, setAccess] = useState("loading");
  const [selected, setSelected] = useState("client");
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error || !user) throw new Error("unauthorized");
        const email = String(user.email || "").trim().toLowerCase();
        const { data: profile } = await supabase.from("profiles").select("role,email").eq("user_id", user.id).maybeSingle();
        const isOwner = email === "bytlylmstbyt@gmail.com";
        if (!isOwner && profile?.role !== "admin") throw new Error("unauthorized");
        if (active) setAccess("allowed");
      } catch {
        if (active) setAccess("denied");
      }
    })();
    return () => { active = false; };
  }, []);

  if (access === "loading") return <div className="min-h-[60vh] flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-[#C9A66B]" /></div>;
  if (access === "denied") return <div className="min-h-[60vh] flex items-center justify-center p-5" dir="rtl"><Card className="max-w-md"><CardContent className="p-8 text-center"><ShieldAlert className="mx-auto mb-3 text-red-500" /><h1 className="font-bold text-lg">هذه الصفحة مخصصة للإدارة</h1><p className="text-sm text-slate-500 mt-2">يلزم تسجيل الدخول بحساب إداري للوصول إلى معاينة لوحات المستخدمين.</p><Link to="/Dashboard"><Button className="mt-5">العودة إلى لوحة التحكم</Button></Link></CardContent></Card></div>;

  const role = roles.find(item => item.id === selected) || roles[0];
  return <main className="min-h-screen bg-[#F7F5F1] px-4 py-7 md:px-8" dir="rtl">
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div><div className="inline-flex items-center gap-2 rounded-full bg-amber-100 text-amber-900 px-3 py-1 text-xs font-semibold mb-2"><Eye className="w-4 h-4" /> وضع معاينة إداري</div><h1 className="text-2xl md:text-3xl font-bold text-[#30251B]">معاينة لوحات تحكم المستخدمين</h1><p className="text-sm text-slate-600 mt-2">اختاري نوع الحساب لمراجعة المساحة والوظائف المتاحة له.</p></div>
        <Link to="/AdminControlCenter"><Button variant="outline"><ArrowRight className="w-4 h-4 ml-2" /> العودة إلى مركز الإدارة</Button></Link>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {roles.map(item => { const Icon = item.icon; return <button key={item.id} onClick={() => setSelected(item.id)} className={`text-right rounded-xl border p-4 transition-all ${selected === item.id ? "border-[#B58B52] bg-[#FFF9EF] shadow-md ring-1 ring-[#B58B52]" : "border-slate-200 bg-white hover:border-slate-400"}`}><Icon className="w-5 h-5 text-[#8A6A3D] mb-2" /><span className="block text-sm font-bold text-slate-800">{item.label}</span></button>; })}
      </div>
      <section className="rounded-2xl bg-[#171A2D] text-white p-6 md:p-8 mb-5">
        <div className="text-xs text-amber-300 mb-2">معاينة مساحة الحساب</div><h2 className="text-2xl font-bold">{role.label}</h2><p className="text-sm text-slate-300 mt-2 max-w-2xl">{role.intro}</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
          {[["المشاريع","—"],["المهام","—"],["الرسائل","—"],["الإشعارات","—"]].map(([label,value]) => <div key={label} className="rounded-xl bg-white/10 p-4"><div className="text-xs text-slate-300">{label}</div><div className="text-xl font-bold mt-1">{value}</div></div>)}
        </div>
      </section>
      <div className="flex items-center justify-between mb-3"><h3 className="font-bold text-lg text-[#30251B]">الأقسام والإجراءات المتاحة لهذه الفئة</h3><span className="text-xs text-slate-500">روابط فعلية داخل المنصة</span></div>
      <div className="grid md:grid-cols-2 gap-4">
        {role.modules.map(([title,desc,page,Icon]) => <Card key={title} className="border-slate-200"><CardContent className="p-5 flex items-center gap-4"><div className="rounded-xl bg-[#F4EBDD] p-3"><Icon className="w-5 h-5 text-[#80613A]" /></div><div className="flex-1 min-w-0"><h4 className="font-bold text-slate-800">{title}</h4><p className="text-sm text-slate-500 mt-1">{desc}</p></div><Link to={`/${page}`}><Button size="sm" variant="outline">فتح <ArrowRight className="w-3.5 h-3.5 mr-1" /></Button></Link></CardContent></Card>)}
      </div>
      <p className="text-xs text-slate-500 mt-6 rounded-xl bg-white border border-slate-200 p-4">تنبيه: هذه معاينة إدارية للتنقل والأقسام وليست انتحالًا لحساب مستخدم. الأرقام المعروضة رموز توضيحية، ولا يتم تعديل بيانات المستخدمين أو تنفيذ عمليات مالية من هذه الصفحة. فتح الأقسام ينقلك إلى صفحات المنصة الفعلية بصلاحيات حسابك الإداري.</p>
    </div>
  </main>;
}
