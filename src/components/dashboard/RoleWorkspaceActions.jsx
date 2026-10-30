import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Briefcase, PlusCircle, FolderKanban, MessageSquare, Wallet, Bell, Settings, CalendarDays, Wrench, Building2, FileText, UserRound } from "lucide-react";

const WORKSPACES = {
  client: { title: "إدارة مشاريعك", intro: "أنشئ مشروعاً، راجع العروض، وتابع التنفيذ والمدفوعات.", actions: [
    ["إنشاء مشروع", "أنشئ طلبك وحدد احتياجك وميزانيتك", "CreateProject", PlusCircle],
    ["مشاريعي", "تابع حالة مشاريعك والعروض الواردة", "Projects", FolderKanban],
    ["المحادثات", "تواصل مع مقدمي الخدمات", "Messages", MessageSquare],
    ["المحفظة", "راجع رصيدك وحركاتك المالية", "Wallet", Wallet],
    ["النزاعات", "تابع طلبات النزاع", "MyDisputes", FileText],
    ["الإشعارات", "اعرف آخر التحديثات", "Notifications", Bell]
  ]},
  investor: { title: "إدارة استثماراتك ومشاريعك", intro: "تابع المشاريع والمراحل والمستندات والالتزامات المالية.", actions: [
    ["مركز المستثمر", "تابع محفظة المشاريع ومراحلها", "InvestorHub", Building2],
    ["إضافة مشروع", "ابدأ مشروعاً استثمارياً جديداً", "CreateProject", PlusCircle],
    ["جميع المشاريع", "راجع مشاريعك وحالاتها", "Projects", FolderKanban],
    ["المحفظة", "راجع الحركات المالية", "Wallet", Wallet],
    ["المحادثات", "تواصل مع فرق العمل", "Messages", MessageSquare],
    ["الإشعارات", "تابع المستجدات", "Notifications", Bell]
  ]},
  engineer: { title: "إدارة أعمالك الهندسية", intro: "استعرض الفرص، وتابع المشاريع المسندة، وأدر تسليماتك.", actions: [
    ["المشاريع المتاحة", "استعرض المشاريع والفرص", "EngineerProjects", FolderKanban],
    ["تقويم العمل", "راجع المواعيد", "EngineerCalendar", CalendarDays],
    ["أدوات المشروع", "افتح الأدوات المرتبطة بعملك", "ProjectTools", Wrench],
    ["المحفظة", "راجع مستحقاتك", "ProviderWallet", Wallet],
    ["المحادثات", "تابع محادثات المشاريع", "Messages", MessageSquare],
    ["ملفي وإعداداتي", "حدّث بياناتك المهنية", "Settings", UserRound]
  ]},
  contractor: { title: "إدارة أعمال المقاولات", intro: "تابع المشاريع المسندة والفرص والتواصل والمستحقات.", actions: [
    ["المشاريع", "استعرض المشاريع والطلبات", "Projects", FolderKanban],
    ["أدوات المشروع", "تابع أدوات التنفيذ", "ProjectTools", Wrench],
    ["المحفظة", "راجع مستحقاتك", "ProviderWallet", Wallet],
    ["المحادثات", "تواصل مع أصحاب المشاريع", "Messages", MessageSquare],
    ["الإشعارات", "تابع المهام الجديدة", "Notifications", Bell],
    ["إعدادات الحساب", "حدّث بيانات منشأتك", "Settings", Settings]
  ]},
  supplier: { title: "إدارة التوريد والطلبات", intro: "تابع الطلبات والمشاريع والتواصل والمستحقات.", actions: [
    ["الطلبات والمشاريع", "استعرض الطلبات المتاحة", "Projects", FolderKanban],
    ["أدوات المشروع", "تابع تفاصيل الطلبات", "ProjectTools", Wrench],
    ["المحفظة", "راجع مستحقاتك", "ProviderWallet", Wallet],
    ["المحادثات", "تواصل مع العملاء", "Messages", MessageSquare],
    ["الإشعارات", "تابع المستجدات", "Notifications", Bell],
    ["إعدادات الحساب", "حدّث بيانات المورد", "Settings", Settings]
  ]},
  firm: { title: "إدارة المكتب الهندسي", intro: "تابع مشاريع المكتب والفريق وبيانات المنشأة.", actions: [
    ["مشاريع المكتب", "تابع المشاريع المسجلة للمكتب", "Projects", FolderKanban],
    ["إعدادات المكتب", "أدر بيانات المكتب", "FirmSettings", Building2],
    ["المحفظة", "راجع الحركات المالية", "ProviderWallet", Wallet],
    ["المحادثات", "تابع التواصل المرتبط بالمشاريع", "Messages", MessageSquare],
    ["الإشعارات", "تابع المستجدات", "Notifications", Bell],
    ["إعدادات الحساب", "أدر بيانات الدخول", "Settings", Settings]
  ]},
  consultant: { title: "إدارة أعمالك الاستشارية", intro: "تابع المشاريع والمراجعات الفنية والتواصل.", actions: [
    ["مشاريعي", "تابع المشاريع المسندة إليك", "Projects", FolderKanban],
    ["المراجعات الفنية", "افتح لوحة المراجعات", "ConsultantDashboard", FileText],
    ["المحفظة", "راجع مستحقاتك", "ProviderWallet", Wallet],
    ["المحادثات", "تواصل مع أطراف المشروع", "Messages", MessageSquare],
    ["الإشعارات", "تابع المهام الجديدة", "Notifications", Bell],
    ["إعدادات الحساب", "حدّث بياناتك", "Settings", Settings]
  ]},
  legal_consultant: { title: "إدارة الاستشارات القانونية", intro: "تابع ملفك المهني والعقود والمحادثات.", actions: [
    ["ملفي المهني", "راجع بياناتك المهنية", "LegalConsultantProfile", UserRound],
    ["العقود", "راجع العقود المرتبطة بحسابك", "MyContracts", FileText],
    ["المحادثات", "تواصل مع أصحاب المشاريع", "Messages", MessageSquare],
    ["الإشعارات", "تابع المستجدات", "Notifications", Bell],
    ["إعدادات الحساب", "حدّث بياناتك", "Settings", Settings]
  ]}
};

export default function RoleWorkspaceActions({ role }) {
  const workspace = WORKSPACES[role] || WORKSPACES.client;
  return (
    <section dir="rtl" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-6 pb-2">
      <div className="rounded-2xl border border-[#C9A66B]/30 bg-gradient-to-l from-[#211D19] to-[#3A3026] p-5 text-white shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold tracking-wide text-[#E4C891]">مساحة العمل الخاصة بك</p>
            <h2 className="mt-1 text-xl font-bold">{workspace.title}</h2>
            <p className="mt-1 text-sm text-white/75">{workspace.intro}</p>
          </div>
          <Link to={createPageUrl("Home")} className="text-sm text-[#E4C891] underline underline-offset-4">العودة للصفحة الرئيسية</Link>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
          {workspace.actions.map(([label, description, page, Icon]) => (
            <Link key={page} to={createPageUrl(page)} className="group rounded-xl border border-white/15 bg-white/5 p-3 transition hover:border-[#E4C891]/70 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-[#E4C891]">
              <Icon className="mb-3 h-5 w-5 text-[#E4C891]" />
              <span className="block text-sm font-semibold">{label}</span>
              <span className="mt-1 block text-xs leading-5 text-white/65">{description}</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
