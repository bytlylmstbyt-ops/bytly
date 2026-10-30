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
  const [activeSection, setActiveSection] = useState("الرئيسية");
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
  const sections = ["الرئيسية", ...role.modules.map(item => item[0])];
  const section = sections.includes(activeSection) ? activeSection : "الرئيسية";
  const previewMetrics = selected === "client" || selected === "investor"
    ? [["إجمالي المشاريع","12"],["مشاريع نشطة","4"],["عروض مستلمة","8"],["مبالغ تحت المتابعة","—"]]
    : selected === "firm"
    ? [["المشاريع","18"],["فريق العمل","7"],["عروض قيد المراجعة","5"],["تقييم المكتب","4.8 / 5"]]
    : selected === "legal_consultant"
    ? [["الطلبات","9"],["قيد المراجعة","3"],["مكتملة","6"],["التقييم","4.9 / 5"]]
    : [["المشاريع المسندة","6"],["فرص متاحة","14"],["عروض مقدمة","5"],["التقييم","4.7 / 5"]];
  return <main className="min-h-screen bg-[#F7F5F1] px-4 py-7 md:px-8" dir="rtl">
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div><div className="inline-flex items-center gap-2 rounded-full bg-amber-100 text-amber-900 px-3 py-1 text-xs font-semibold mb-2"><Eye className="w-4 h-4" /> وضع معاينة إداري</div><h1 className="text-2xl md:text-3xl font-bold text-[#30251B]">معاينة لوحات تحكم المستخدمين</h1><p className="text-sm text-slate-600 mt-2">اختاري نوع الحساب لمراجعة المساحة والوظائف المتاحة له.</p></div>
        <Link to="/AdminControlCenter"><Button variant="outline"><ArrowRight className="w-4 h-4 ml-2" /> العودة إلى مركز الإدارة</Button></Link>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {roles.map(item => { const Icon = item.icon; return <button key={item.id} onClick={() => setSelected(item.id)} className={`text-right rounded-xl border p-4 transition-all ${selected === item.id ? "border-[#B58B52] bg-[#FFF9EF] shadow-md ring-1 ring-[#B58B52]" : "border-slate-200 bg-white hover:border-slate-400"}`}><Icon className="w-5 h-5 text-[#8A6A3D] mb-2" /><span className="block text-sm font-bold text-slate-800">{item.label}</span></button>; })}
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden mb-5">
        <div className="bg-[#171A2D] text-white p-5 md:p-7 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div><div className="text-xs text-amber-300 mb-2">معاينة شكل لوحة الحساب • بيانات توضيحية</div><h2 className="text-2xl font-bold">{role.label}</h2><p className="text-sm text-slate-300 mt-2 max-w-2xl">{role.intro}</p></div>
          <div className="rounded-xl bg-white/10 border border-white/10 px-4 py-3 text-sm"><div className="text-slate-300 text-xs">الحساب المعروض</div><div className="font-semibold mt-1">مستخدم تجريبي – {role.label}</div></div>
        </div>
        <div className="grid md:grid-cols-[220px_1fr] min-h-[520px]">
          <aside className="bg-[#F8F7F4] border-l border-slate-200 p-3">
            <div className="flex items-center gap-3 p-3 mb-3 rounded-xl bg-white border border-slate-200"><div className="w-10 h-10 rounded-full bg-[#E8D9C2] flex items-center justify-center text-[#76552D] font-bold">{role.label.slice(0,1)}</div><div className="min-w-0"><div className="text-sm font-bold text-slate-800">مستخدم تجريبي</div><div className="text-xs text-slate-500 truncate">{role.label}</div></div></div>
            <div className="text-[11px] text-slate-400 px-3 py-2">القائمة الرئيسية</div>
            {sections.map(item => <button key={item} onClick={() => setActiveSection(item)} className={`w-full text-right rounded-lg px-3 py-2.5 text-sm mb-1 transition-colors ${section === item ? "bg-[#EDE5D8] text-[#654A28] font-bold" : "text-slate-600 hover:bg-white"}`}>{item}</button>)}
          </aside>
          <div className="p-4 md:p-6 bg-[#FCFCFB]">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-5"><div><div className="text-xs text-slate-400">مساحة العمل / {role.label}</div><h3 className="text-xl font-bold text-slate-800 mt-1">{section === "الرئيسية" ? "نظرة عامة" : section}</h3></div><span className="text-xs rounded-full bg-amber-50 text-amber-800 border border-amber-200 px-3 py-1.5 w-fit">وضع العرض فقط</span></div>
            {section === "الرئيسية" ? <>
              <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 mb-5">
                {previewMetrics.map(([label,value]) => <div key={label} className="rounded-xl bg-white border border-slate-200 p-4"><div className="text-xs text-slate-500">{label}</div><div className="text-2xl font-bold text-[#30251B] mt-2">{value}</div><div className="text-[10px] text-slate-400 mt-1">مثال توضيحي فقط</div></div>)}
              </div>
              <div className="grid xl:grid-cols-[1.4fr_1fr] gap-4">
                <div className="rounded-xl bg-white border border-slate-200 p-4">
                  <div className="flex items-center justify-between mb-3"><h4 className="font-bold text-slate-800">آخر التحديثات</h4><span className="text-xs text-slate-400">بيانات تجريبية</span></div>
                  {["طلب مشروع جديد قيد المراجعة","تم استلام عرض سعر جديد","تم تحديث حالة أحد المشاريع"].map((item,i) => <div key={item} className="flex items-start gap-3 py-3 border-b last:border-0 border-slate-100"><span className="w-2 h-2 rounded-full bg-[#B58B52] mt-1.5" /><div className="text-sm text-slate-700">{item}<div className="text-xs text-slate-400 mt-1">{i+1} يوم</div></div></div>)}
                </div>
                <div className="rounded-xl bg-white border border-slate-200 p-4"><h4 className="font-bold text-slate-800 mb-3">إجراءات سريعة</h4>{role.modules.slice(0,3).map(([title,desc],i) => <div key={title} className="rounded-lg bg-[#F8F7F4] p-3 mb-2"><div className="text-sm font-semibold text-slate-800">{title}</div><div className="text-xs text-slate-500 mt-1">{desc}</div></div>)}</div>
              </div>
            </> : <div className="rounded-xl bg-white border border-slate-200 p-5">
              <div className="text-sm text-slate-500 mb-4">{role.modules.find(item => item[0] === section)?.[1] || "تفاصيل هذا القسم"}</div>
              <div className="grid sm:grid-cols-2 gap-3 mb-5">{previewMetrics.slice(0,2).map(([label,value]) => <div key={label} className="rounded-lg bg-[#F8F7F4] p-4"><div className="text-xs text-slate-500">{label}</div><div className="text-xl font-bold text-slate-800 mt-1">{value}</div></div>)}</div>
              <div className="rounded-lg border border-dashed border-slate-300 p-8 text-center"><div className="font-semibold text-slate-700">معاينة قسم {section}</div><p className="text-sm text-slate-500 mt-2">هذا نموذج بصري يوضح مكان ووظيفة القسم. البيانات والإجراءات الحقيقية تظهر عند دخول المستخدم صاحب الصلاحية.</p></div>
            </div>}
          </div>
        </div>
      </div>
      <p className="text-xs text-slate-500 mt-6 rounded-xl bg-white border border-slate-200 p-4">تنبيه: هذه معاينة بصرية إدارية ببيانات توضيحية وليست حساب مستخدم فعليًا. لا يتم تعديل بيانات المستخدمين أو تنفيذ عمليات أو مدفوعات من هذه الصفحة. معاينة بيانات المستخدمين الحقيقية تتطلب صلاحيات وواجهات قراءة إدارية منفصلة.</p>
    </div>
  </main>;
}
