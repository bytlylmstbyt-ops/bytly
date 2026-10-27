import React from "react";
import { Link, useSearchParams } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import { Building2, Briefcase, ArrowLeft, CheckCircle, Star, Scale, HardHat, Package, Compass } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/components/i18n/LanguageContext";

export default function RegisterChoice() {
  const { t, isRTL } = useLanguage();
  const [searchParams] = useSearchParams();
  const flow = searchParams.get("flow");

  const options = [
    { id: "investor", group: "client", icon: Building2, title: "مستثمر / مطور عقاري", description: "حساب مخصص للمستثمرين والمطورين العقاريين والمشاريع المتعددة.", features: ["إدارة مشاريع واستثمارات متعددة", "متابعة عروض الأسعار والمشاريع"], color: "from-purple-600 to-indigo-600", link: `${createPageUrl("RegisterClient")}?type=investor`, featured: true },
    { id: "client", group: "client", icon: Briefcase, title: "صاحب مشروع / صاحب منزل", description: "حساب لأصحاب المنازل والأفراد الذين يريدون تنفيذ مشروع هندسي.", features: ["البحث عن المتخصصين", "طلب الخدمات ومتابعة المشروع"], color: "from-amber-500 to-orange-500", link: `${createPageUrl("RegisterClient")}?type=individual` },
    { id: "engineer", group: "provider", icon: Building2, title: t('registerChoice.roles.engineer.title'), description: t('registerChoice.roles.engineer.description'), features: t('registerChoice.roles.engineer.features'), color: "from-blue-500 to-cyan-500", link: `${createPageUrl("RegisterEngineer")}?type=engineer` },
    { id: "firm", group: "provider", icon: Building2, title: t('registerChoice.roles.firm.title'), description: t('registerChoice.roles.firm.description'), features: t('registerChoice.roles.firm.features'), color: "from-teal-600 to-cyan-600", link: createPageUrl("RegisterFirm") },
    { id: "legal", group: "provider", icon: Scale, title: t('registerChoice.roles.legal.title'), description: t('registerChoice.roles.legal.description'), features: t('registerChoice.roles.legal.features'), color: "from-slate-600 to-gray-700", link: createPageUrl("RegisterLegalConsultant") },
    { id: "consultant", group: "provider", icon: Compass, title: t('registerChoice.roles.consultant.title'), description: t('registerChoice.roles.consultant.description'), features: t('registerChoice.roles.consultant.features'), color: "from-amber-600 to-yellow-600", link: createPageUrl("RegisterConsultant") },
    { id: "contractor", group: "provider", icon: HardHat, title: t('registerChoice.roles.contractor.title'), description: t('registerChoice.roles.contractor.description'), features: t('registerChoice.roles.contractor.features'), color: "from-orange-600 to-amber-600", link: createPageUrl("RegisterContractor") },
    { id: "supplier", group: "provider", icon: Package, title: t('registerChoice.roles.supplier.title'), description: t('registerChoice.roles.supplier.description'), features: t('registerChoice.roles.supplier.features'), color: "from-indigo-600 to-blue-600", link: createPageUrl("RegisterSupplier") }
  ];

  const visibleOptions = flow === "client"
    ? options.filter(option => option.group === "client")
    : flow === "provider"
      ? options.filter(option => option.group === "provider")
      : options;
  const isClientFlow = flow === "client";
  const isProviderFlow = flow === "provider";
  const title = isClientFlow
    ? (isRTL ? "ابدأ رحلتك في بيتلي كصاحب مشروع" : "Start your Bytly journey as a project owner")
    : isProviderFlow
      ? (isRTL ? "انضم إلى بيتلي كمقدم خدمة" : "Join Bytly as a service provider")
      : t('registerChoice.title');
  const subtitle = isClientFlow
    ? (isRTL ? "اختر نوع حسابك لتبحث عن المتخصصين، وتطلب عروض الأسعار، وتتابع مشروعك من مكان واحد." : "Choose your account type to find professionals, request quotes, and manage your project in one place.")
    : isProviderFlow
      ? (isRTL ? "اختر فئتك المهنية لعرض خدماتك أو منتجاتك واستقبال الطلبات وإدارة أعمالك." : "Choose your professional category to showcase services or products and manage requests.")
      : t('registerChoice.subtitle');

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FDFBF7] via-white to-[#F5EFE5] py-12 md:py-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {(isClientFlow || isProviderFlow) && (
          <Link to={createPageUrl("RegisterChoice")} className="inline-flex items-center gap-2 mb-6 text-sm font-semibold text-[#8A6A3D] hover:text-[#6B5D4F]">
            <ArrowLeft className={`h-4 w-4 ${isRTL ? "" : "rotate-180"}`} />
            {isRTL ? "عرض جميع أنواع الحسابات" : "View all account types"}
          </Link>
        )}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10 md:mb-12">
          <div className="inline-flex items-center rounded-full border border-[#E5D4B8] bg-white px-4 py-2 text-xs font-semibold text-[#9C8567] mb-4">
            {isClientFlow ? (isRTL ? "مساحة صاحب المشروع" : "Project owner space") : isProviderFlow ? (isRTL ? "المساحة المهنية" : "Professional space") : (isRTL ? "اختر مسارك في بيتلي" : "Choose your Bytly journey")}
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-[#30251B] mb-4">{title}</h1>
          <p className="text-slate-600 max-w-2xl mx-auto leading-7">{subtitle}</p>
        </motion.div>
        {isClientFlow && (
          <div className="mb-6 rounded-2xl border border-[#E5D4B8] bg-white/80 p-4 text-sm text-[#6B5D4F] text-center">
            {isRTL ? "من البحث عن المتخصصين إلى متابعة التنفيذ ومراحل الدفع، تبدأ رحلتك من هنا." : "From finding professionals to tracking work and payment milestones, your journey starts here."}
          </div>
        )}
        {isProviderFlow && (
          <div className="mb-6 rounded-2xl border border-[#E5D4B8] bg-white/80 p-4 text-sm text-[#6B5D4F] text-center">
            {isRTL ? "المهندسون والمكاتب والمقاولون والموردون والمستشارون ضمن منظومة واحدة." : "Engineers, firms, contractors, suppliers, and consultants in one ecosystem."}
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
          {visibleOptions.map((option, index) => (
            <motion.div key={option.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.06 }} className={option.featured && !flow ? "md:col-span-2 lg:col-span-1" : ""}>
              <Card className={`h-full hover-lift cursor-pointer shadow-sm hover:shadow-xl transition-all group ${option.featured ? "border-2 border-purple-300 bg-gradient-to-br from-purple-50 to-indigo-50" : "border border-[#E8E0D4] bg-white"}`}>
                <CardContent className="p-6 h-full flex flex-col">
                  {option.featured && !flow && <div className="mb-3"><Star className="w-5 h-5 text-purple-600 fill-purple-600" /></div>}
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${option.color} flex items-center justify-center mb-5 group-hover:scale-105 transition-transform`}><option.icon className="w-7 h-7 text-white" /></div>
                  <h3 className="text-xl font-bold text-[#30251B] mb-2">{option.title}</h3>
                  <p className="text-slate-600 text-sm leading-6 mb-5">{option.description}</p>
                  <ul className="space-y-2 mb-6 flex-1">{option.features.map((feature, i) => <li key={i} className="flex items-start gap-2 text-sm text-slate-600"><CheckCircle className="w-4 h-4 mt-0.5 text-emerald-600 flex-shrink-0" /><span>{feature}</span></li>)}</ul>
                  <Link to={option.link}><Button className={`w-full bg-gradient-to-r ${option.color} text-white hover:opacity-90`}>{t('registerChoice.chooseAccount')}<ArrowLeft className={`w-4 h-4 mr-2 ${isRTL ? "" : "rotate-180"}`} /></Button></Link>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
