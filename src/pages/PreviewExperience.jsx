import React from "react";
import { Link, useLocation } from "react-router-dom";
import { BriefcaseBusiness, ClipboardList, Wallet, Bell, UserRound, FileText, CalendarDays, Settings, Search, Plus, ArrowUpLeft, Eye, ShieldCheck } from "lucide-react";

const ROLE_INFO = {
  client: { label: "صاحب مشروع", dashboard: "ClientDashboard", nav: [["لوحة التحكم","ClientDashboard",BriefcaseBusiness],["مشاريعي","MyProjects",ClipboardList],["طلب خدمة","RequestQuote",Plus],["العروض المقدمة","ProjectProposals",FileText],["الاجتماعات","Meetings",CalendarDays],["الإشعارات","NotificationCenter",Bell],["الملف الشخصي","Settings",UserRound]] },
  engineer: { label: "مهندس مستقل", dashboard: "EngineerDashboard", nav: [["لوحة التحكم","EngineerDashboard",BriefcaseBusiness],["المشاريع المتاحة","AvailableProjects",Search],["عروضي","MyProposals",FileText],["معرض الأعمال","Portfolio",Eye],["المحفظة","ProviderWallet",Wallet],["التقويم","EngineerCalendar",CalendarDays],["الإشعارات","NotificationCenter",Bell],["الملف الشخصي","Settings",UserRound]] },
  firm: { label: "مكتب هندسي", dashboard: "FirmDashboard", nav: [["لوحة التحكم","FirmDashboard",BriefcaseBusiness],["المشاريع","MyProjects",ClipboardList],["الفريق الهندسي","FirmTeam",UserRound],["العروض","ProjectProposals",FileText],["المحفظة","ProviderWallet",Wallet],["الإشعارات","NotificationCenter",Bell],["الإعدادات","Settings",Settings]] },
  contractor: { label: "مقاول", dashboard: "ContractorDashboard", nav: [["لوحة التحكم","ContractorDashboard",BriefcaseBusiness],["فرص المشاريع","AvailableProjects",Search],["عروضي","ProjectProposals",FileText],["العقود","MyContracts",ClipboardList],["المحفظة","ProviderWallet",Wallet],["الإشعارات","NotificationCenter",Bell],["الملف الشخصي","Settings",UserRound]] },
  supplier: { label: "مورد", dashboard: "SupplierDashboard", nav: [["لوحة التحكم","SupplierDashboard",BriefcaseBusiness],["المنتجات والخدمات","SupplierProducts",ClipboardList],["طلبات الأسعار","SupplierRequests",FileText],["المحفظة","ProviderWallet",Wallet],["الإشعارات","NotificationCenter",Bell],["الملف الشخصي","Settings",UserRound]] },
  consultant: { label: "استشاري", dashboard: "ConsultantDashboard", nav: [["لوحة التحكم","ConsultantDashboard",BriefcaseBusiness],["الاستشارات","Consultations",ClipboardList],["المواعيد","EngineerCalendar",CalendarDays],["العقود","MyContracts",FileText],["الإشعارات","NotificationCenter",Bell],["الملف الشخصي","Settings",UserRound]] },
  legal_consultant: { label: "استشاري قانوني", dashboard: "LegalConsultantProfile", nav: [["الملف المهني","LegalConsultantProfile",UserRound],["الاستشارات","Consultations",ClipboardList],["العقود","MyContracts",FileText],["الإشعارات","NotificationCenter",Bell],["الإعدادات","Settings",Settings]] }
};
const SAMPLE = [
  {title:"تصميم فيلا سكنية",subtitle:"الرياض • تصميم معماري",status:"بانتظار العروض",amount:"180,000 ر.س"},
  {title:"تصميم داخلي لشقة",subtitle:"جدة • تصميم داخلي",status:"قيد المراجعة",amount:"35,000 ر.س"},
  {title:"إشراف على تنفيذ",subtitle:"مكة المكرمة • إشراف هندسي",status:"نشط",amount:"72,000 ر.س"}
];
export default function PreviewExperience({ pageName = "" }) {
  const location = useLocation();
  let stored = {};
  try { stored = JSON.parse(sessionStorage.getItem("bytly_admin_preview") || "{}"); } catch {}
  const role = ROLE_INFO[stored.role] ? stored.role : "client";
  const info = ROLE_INFO[role];
  const isHome = pageName === info.dashboard || !pageName;
  const current = info.nav.find(item => item[1] === pageName);
  const heading = isHome ? "لوحة التحكم" : (current?.[0] || pageName.replace(/([A-Z])/g, " $1").trim());
  return <div dir="rtl" className="min-h-screen bg-[#F7F6F2] text-slate-800">
    <div className="mx-auto flex max-w-[1440px] min-h-screen">
      <aside className="hidden w-64 shrink-0 border-l border-[#E7E0D5] bg-white p-5 md:block">
        <div className="mb-8 flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#3D3329] font-black text-[#D8B879]">ب</div><div><div className="text-xl font-black text-[#3D3329]">بيتلي</div><div className="text-xs text-slate-500">المنظومة الهندسية المتكاملة</div></div></div>
        <div className="mb-4 rounded-xl bg-amber-50 p-3 text-sm"><div className="font-bold">{info.label}</div><div className="mt-1 text-xs text-amber-800">حساب تجريبي للمعاينة</div></div>
        <nav className="space-y-1">{info.nav.map(([label,path,Icon])=><Link key={path} to={"/"+path} className={"flex items-center gap-3 rounded-xl px-3 py-3 text-sm transition "+(pageName===path?"bg-[#3D3329] font-bold text-white":"text-slate-600 hover:bg-amber-50 hover:text-[#3D3329]")}><Icon size={17}/>{label}</Link>)}</nav>
        <div className="mt-8 rounded-xl border border-dashed border-[#D8C29B] p-3 text-xs leading-6 text-slate-500">هذه بيانات توضيحية لمراجعة التصميم والتنقل فقط، وليست بيانات عملاء حقيقية.</div>
      </aside>
      <main className="min-w-0 flex-1 p-4 sm:p-7">
        <div className="mb-7 flex flex-wrap items-center justify-between gap-3">
          <div><div className="text-sm text-slate-500">بيتلي / {info.label}</div><h1 className="mt-1 text-2xl font-black text-[#3D3329]">{heading}</h1><p className="mt-1 text-sm text-slate-500">{isHome?"مرحبًا بك، هذه معاينة لتجربة المستخدم داخل المنصة.":"تصفحي شكل هذه الصفحة ومساراتها في وضع المعاينة."}</p></div>
          <div className="flex items-center gap-2"><button className="relative rounded-xl border border-slate-200 bg-white p-3" aria-label="الإشعارات"><Bell size={18}/><span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-amber-500"/></button><div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2"><div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 text-sm font-bold text-[#6B5D4F]">ت</div><div><div className="text-sm font-bold">مستخدم تجريبي</div><div className="text-xs text-slate-500">{info.label}</div></div></div></div>
        </div>
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950"><Eye className="mt-1 shrink-0" size={19}/><div><strong>وضع معاينة — بيانات تجريبية</strong><p>لا تحتاجين إلى إنشاء حساب. يمكنك استعراض القوائم والصفحات؛ الأزرار والإجراءات التي تحتاج حسابًا أو بيانات فعلية معروضة للتجربة فقط ولا تنفذ عمليات حقيقية.</p></div></div>
        {isHome ? <>
          <div className="mb-6 rounded-2xl bg-gradient-to-l from-[#3D3329] to-[#74604A] p-6 text-white shadow-sm"><div className="text-sm text-white/75">أهلًا بك في بيتلي</div><h2 className="mt-2 text-2xl font-bold">كل مشروعك الهندسي في مكان واحد</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-white/80">تابعي المشاريع والطلبات والعروض والمواعيد من لوحة واحدة.</p><div className="mt-5 flex flex-wrap gap-3"><Link to="/RequestQuote" className="rounded-xl bg-[#D8B879] px-4 py-2.5 text-sm font-bold text-[#30271E]">طلب خدمة جديد</Link><Link to="/MyProjects" className="rounded-xl border border-white/40 px-4 py-2.5 text-sm font-bold text-white">استعراض المشاريع</Link></div></div>
          <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[["المشاريع النشطة","3","↑ 2 هذا الشهر"],["الطلبات قيد المتابعة","2","تحتاج مراجعة"],["العروض المستلمة","8","من مزودي الخدمة"],["الرصيد التجريبي","12,500 ر.س","عرض توضيحي فقط"]].map(([label,value,note])=><div key={label} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"><div className="text-sm text-slate-500">{label}</div><div className="mt-3 text-2xl font-black text-[#3D3329]">{value}</div><div className="mt-2 text-xs text-slate-400">{note}</div></div>)}</div>
        </> : <div className="mb-6 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"><h2 className="font-bold text-[#3D3329]">{heading}</h2><p className="mt-2 text-sm leading-6 text-slate-500">هذه شاشة معاينة توضيحية لصفحة «{heading}». راجعي شكل المحتوى والقوائم والتنقل، ثم استخدمي القائمة الجانبية للانتقال بين بقية الصفحات.</p><div className="mt-4 flex flex-wrap gap-3"><button className="rounded-xl bg-[#3D3329] px-4 py-2 text-sm font-bold text-white" onClick={()=>window.alert("هذا إجراء تجريبي فقط في وضع المعاينة.")}>تجربة الإجراء</button><Link className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold" to={"/"+info.dashboard}>العودة إلى لوحة الحساب</Link></div></div>}
        <div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-bold text-[#3D3329]">{isHome?"أحدث المشاريع":"نماذج توضيحية للمحتوى"}</h2><Link to="/MyProjects" className="text-sm font-bold text-[#8A6A35]">عرض الكل</Link></div>
        <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm"><div className="grid grid-cols-12 gap-3 border-b bg-slate-50 px-5 py-3 text-xs font-bold text-slate-500"><div className="col-span-6 sm:col-span-5">المشروع</div><div className="col-span-3 hidden sm:block">الحالة</div><div className="col-span-6 sm:col-span-4">الميزانية</div></div>{SAMPLE.map((item,i)=><div key={item.title} className="grid grid-cols-12 items-center gap-3 border-b last:border-0 px-5 py-4"><div className="col-span-6 sm:col-span-5"><div className="font-bold text-slate-800">{item.title}</div><div className="mt-1 text-xs text-slate-500">{item.subtitle}</div></div><div className="col-span-3 hidden sm:block"><span className={"rounded-full px-2.5 py-1 text-xs font-bold "+(i===2?"bg-emerald-50 text-emerald-700":"bg-amber-50 text-amber-800")}>{item.status}</span></div><div className="col-span-6 sm:col-span-4 text-sm font-bold">{item.amount}</div></div>)}</div>
        <div className="mt-6 grid gap-4 md:grid-cols-2"><div className="rounded-2xl border border-slate-100 bg-white p-5"><div className="flex items-center gap-2 font-bold"><ShieldCheck size={18} className="text-emerald-600"/>حساب تجريبي آمن</div><p className="mt-2 text-sm leading-6 text-slate-500">لا تُستخدم بيانات حساب حقيقي ولا تُنفذ مدفوعات في شاشة المعاينة.</p></div><div className="rounded-2xl border border-slate-100 bg-white p-5"><div className="flex items-center gap-2 font-bold"><ArrowUpLeft size={18} className="text-[#8A6A35]"/>استكملي اختبار الواجهة</div><p className="mt-2 text-sm leading-6 text-slate-500">استخدمي القائمة الجانبية للتنقل بين صفحات هذا النوع من الحساب.</p></div></div>
        <div className="mt-8 text-center text-xs text-slate-400">بيتلي • معاينة تجريبية للواجهة فقط</div>
      </main>
    </div>
  </div>;
}
