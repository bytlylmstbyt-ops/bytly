import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import {
  Megaphone, Target, TrendingUp, Shield, Eye,
  Check, ArrowLeft, Sparkles, BarChart3, Users
} from "lucide-react";
import { Button } from "@/components/ui/button";

const FEATURES = [
  { icon: Target, title: "استهداف دقيق", desc: "إعلانات سياقية تظهر للجمهور المناسب حسب القطاع والتخصص" },
  { icon: Eye, title: "ظهور واسع", desc: "وصول آلاف المهندسين والمقاولين وأصحاب المشاريع" },
  { icon: BarChart3, title: "تتبع الأداء", desc: "لوحة تحكم تفصيلية لمتابعة الظهور والنقرات والتحويلات" },
  { icon: Shield, title: "شارة الاعتماد", desc: "ميزة المعلن المعتمد لبناء الثقة مع الجمهور" },
];

const PLACEMENTS = [
  { icon: Megaphone, title: "سوق المشاريع", desc: "إعلانك يظهر ضمن نتائج مشاريع المنصة", badge: "الأكثر طلباً" },
  { icon: Target, title: "تفاصيل المشروع", desc: "إعلان مستهدف داخل صفحة كل مشروع" },
  { icon: Users, title: "لوحة المهندس", desc: "ظهور مباشر في لوحة تحكم المهندسين" },
];

const PACKAGES = [
  {
    name: "الباقة الأساسية", price: "99", period: "/ شهرياً",
    features: ["إعلان واحد نشط", "ظهور في سوق المشاريع", "تتبع الظهور والنقرات", "صورة + رابط"],
    highlight: false, color: "from-slate-500 to-slate-600",
  },
  {
    name: "الباقة الاحترافية", price: "249", period: "/ شهرياً",
    features: ["حتى 3 إعلانات نشطة", "ظهور في كل المواضع", "استهداف سياقي بالوسوم", "صورة + فيديو + GIF", "شارة معلن معتمد", "تقارير أداء تفصيلية"],
    highlight: true, color: "from-[#6B5D4F] to-[#C9A66B]",
  },
  {
    name: "باقة الشركات", price: "599", period: "/ شهرياً",
    features: ["إعلانات غير محدودة", "ظهور في كل المواضع", "استهداف متقدم + أولوية الظهور", "فيديو تلقائي + شعار", "مدير حساب مخصص", "تقارير شهرية مخصصة"],
    highlight: false, color: "from-amber-600 to-amber-700",
  },
];

export default function AdvertiseWithUs({ onStart, hasAds }) {
  const navigate = useNavigate();

  const handleStart = async () => {
    if (onStart) { onStart(); return; }
    try {
      const authed = await base44.auth.isAuthenticated();
      if (authed) {
        navigate("/AdvertiserPortal");
      } else {
        sessionStorage.setItem('loginReturnUrl', '/AdvertiserPortal');
        window.location.href = '/login';
      }
    } catch {
      sessionStorage.setItem('loginReturnUrl', '/AdvertiserPortal');
      window.location.href = '/login';
    }
  };

  return (
    <div dir="rtl" className="min-h-screen bg-gradient-to-b from-white via-amber-50/20 to-white">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#4A3F35] via-[#6B5D4F] to-[#4A3F35] text-white">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 20% 50%, #C9A66B 0%, transparent 50%), radial-gradient(circle at 80% 80%, #C9A66B 0%, transparent 40%)" }} />
        <div className="relative max-w-5xl mx-auto px-4 py-16 md:py-24 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-full mb-6">
              <Sparkles className="w-4 h-4 text-[#C9A66B]" />
              <span className="text-sm text-[#E5D4B8]">فرصة إعلانية حصرية على بيتلي</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-bold mb-4 leading-tight">
              أوصل منتجاتك وخدماتك
              <br />
              <span className="bg-gradient-to-r from-[#C9A66B] to-[#E5D4B8] bg-clip-text text-transparent">لمجتمع بيتلي</span>
            </h1>
            <p className="text-lg text-slate-300 max-w-2xl mx-auto mb-8">
              منصة متخصصة تجمع المهندسين والمقاولين والموردين وأصحاب المشاريع.
              أعلن عن منتجاتك في المكان والوقت المناسب.
            </p>
            <Button
              onClick={handleStart}
              size="lg"
              className="bg-gradient-to-r from-[#C9A66B] to-[#E5D4B8] text-[#4A3F35] hover:opacity-90 gap-2"
            >
              {hasAds ? "إدارة إعلاناتك" : "ابدأ الإعلان الآن"}
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="border-b bg-white">
        <div className="max-w-5xl mx-auto px-4 py-6 grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { icon: Users, value: "+1000", label: "مستخدم نشط" },
            { icon: Megaphone, value: "+50", label: "قطاع متخصص" },
            { icon: Eye, value: "+50K", label: "ظهور شهرياً" },
            { icon: Target, value: "95%", label: "دقة الاستهداف" },
          ].map((s, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
                <s.icon className="w-5 h-5 text-[#C9A66B]" />
              </div>
              <div>
                <p className="text-lg font-bold text-[#6B5D4F]">{s.value}</p>
                <p className="text-xs text-slate-500">{s.label}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-[#6B5D4F] mb-3">لماذا الإعلان على بيتلي؟</h2>
          <p className="text-slate-500">مميزات حصرية تضمن وصول رسالتك للجمهور المناسب</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {FEATURES.map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="bg-white rounded-2xl border border-slate-100 p-6 hover-lift"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-50 to-amber-100 flex items-center justify-center mb-4">
                <f.icon className="w-6 h-6 text-[#C9A66B]" />
              </div>
              <h3 className="font-semibold text-[#6B5D4F] mb-1">{f.title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Placements */}
      <section className="bg-slate-50 py-16">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-[#6B5D4F] mb-3">أين يظهر إعلانك؟</h2>
            <p className="text-slate-500">مواضع استراتيجية تضمن أقصى تفاعل</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PLACEMENTS.map((p, i) => (
              <div key={i} className="bg-white rounded-2xl border border-slate-100 p-6 relative overflow-hidden">
                {p.badge && (
                  <span className="absolute top-4 left-4 bg-gradient-to-r from-[#6B5D4F] to-[#C9A66B] text-white text-[10px] font-bold px-2.5 py-1 rounded-full">
                    {p.badge}
                  </span>
                )}
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#6B5D4F] to-[#C9A66B] flex items-center justify-center mb-4">
                  <p.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-[#6B5D4F] mb-2">{p.title}</h3>
                <p className="text-sm text-slate-500">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Packages */}
      <section className="max-w-5xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-[#6B5D4F] mb-3">باقات الإعلان</h2>
          <p className="text-slate-500">اختر الباقة المناسبة لحجم نشاطك</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PACKAGES.map((pkg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className={`relative rounded-2xl p-6 ${
                pkg.highlight
                  ? "bg-gradient-to-b from-[#6B5D4F] to-[#4A3F35] text-white shadow-2xl scale-[1.03] border-2 border-[#C9A66B]"
                  : "bg-white border border-slate-100 shadow-sm"
              }`}
            >
              {pkg.highlight && (
                <span className="absolute -top-3 right-1/2 translate-x-1/2 bg-gradient-to-r from-[#C9A66B] to-[#E5D4B8] text-[#4A3F35] text-xs font-bold px-4 py-1 rounded-full">
                  الأكثر شيوعاً
                </span>
              )}
              <h3 className={`font-semibold mb-1 ${pkg.highlight ? "text-white" : "text-[#6B5D4F]"}`}>{pkg.name}</h3>
              <div className="flex items-baseline gap-1 mb-6">
                <span className={`text-3xl font-bold ${pkg.highlight ? "text-[#C9A66B]" : "text-[#6B5D4F]"}`}>{pkg.price}</span>
                <span className="text-2xl font-bold text-slate-400">$</span>
                <span className={`text-sm ${pkg.highlight ? "text-slate-300" : "text-slate-400"}`}>{pkg.period}</span>
              </div>
              <ul className="space-y-3 mb-6">
                {pkg.features.map((feat, j) => (
                  <li key={j} className={`flex items-center gap-2 text-sm ${pkg.highlight ? "text-slate-200" : "text-slate-600"}`}>
                    <Check className={`w-4 h-4 flex-shrink-0 ${pkg.highlight ? "text-[#C9A66B]" : "text-green-500"}`} />
                    {feat}
                  </li>
                ))}
              </ul>
              <Button
                onClick={handleStart}
                className={`w-full gap-2 ${
                  pkg.highlight
                    ? "bg-gradient-to-r from-[#C9A66B] to-[#E5D4B8] text-[#4A3F35] hover:opacity-90"
                    : "border-2 border-[#6B5D4F] text-[#6B5D4F] hover:bg-[#6B5D4F] hover:text-white bg-transparent"
                }`}
                variant={pkg.highlight ? "default" : "outline"}
              >
                ابدأ الآن
              </Button>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-r from-[#4A3F35] to-[#6B5D4F] py-16">
        <div className="max-w-3xl mx-auto px-4 text-center text-white">
          <TrendingUp className="w-12 h-12 text-[#C9A66B] mx-auto mb-4" />
          <h2 className="text-2xl md:text-3xl font-bold mb-3">جاهز للبدء؟</h2>
          <p className="text-slate-300 mb-8">أنشئ إعلانك الأول خلال دقائق وابدأ بالوصول لجمهورك المستهدف</p>
          <Button
            onClick={handleStart}
            size="lg"
            className="bg-gradient-to-r from-[#C9A66B] to-[#E5D4B8] text-[#4A3F35] hover:opacity-90 gap-2"
          >
            <Megaphone className="w-4 h-4" />
            {hasAds ? "إدارة إعلاناتي" : "أنشئ إعلانك الآن"}
          </Button>
        </div>
      </section>
    </div>
  );
}