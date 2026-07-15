import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, X, Zap, Building2, Star, Loader2, AlertCircle, Crown, ShieldCheck, HardHat, Package } from "lucide-react";

const CONTRACTOR_PLANS = [
  {
    name: "الباقة الأساسية",
    subtitle: "Basic",
    price: 99,
    price_id: "price_1TtaFNB6BI8uC0AuD9yKVwfh",
    Icon: Star,
    headerClass: "from-slate-600 to-slate-800",
    popular: false,
    features: [
      "إدارة حتى 5 مشاريع نشطة",
      "عقود رقمية أساسية",
      "تتبع مراحل التنفيذ",
      "تقارير شهرية للأداء",
      "دعم بالبريد الإلكتروني",
    ],
    missing: ["تحليلات متقدمة", "إدارة الفرق", "أولوية في البحث"],
  },
  {
    name: "الباقة الاحترافية",
    subtitle: "Pro",
    price: 249,
    price_id: "price_1TtaFNB6BI8uC0AuHlGTlvid",
    Icon: Zap,
    headerClass: "from-[#C9A66B] to-[#8B6914]",
    popular: true,
    features: [
      "مشاريع نشطة غير محدودة",
      "إدارة فرق العمل والتحاليل",
      "تتبع تقدم الموقع بالصور",
      "أولوية في نتائج البحث",
      "تحليلات الأداء المتقدمة",
      "إدارة المناقصات والعطاءات",
      "دعم أولوي عبر الواتساب",
    ],
    missing: [],
  },
  {
    name: "باقة الشركات",
    subtitle: "Enterprise",
    price: 599,
    price_id: "price_1TtaFNB6BI8uC0AuW1e0uVSd",
    Icon: Building2,
    headerClass: "from-[#4a3c31] to-[#2a1e14]",
    popular: false,
    features: [
      "كل مميزات الباقة الاحترافية",
      "أعضاء فريق غير محدودون",
      "لوحة تحكم إدارية متكاملة",
      "تكاملات API مخصصة",
      "مدير حساب مخصص",
      "تقارير مخصصة للإدارة",
      "أولوية قصوى في الترتيب",
    ],
    missing: [],
  },
];

const SUPPLIER_PLANS = [
  {
    name: "الباقة الأساسية",
    subtitle: "Basic",
    price: 99,
    price_id: "price_1TtaFNB6BI8uC0AuWLlqYmrM",
    Icon: Star,
    headerClass: "from-slate-600 to-slate-800",
    popular: false,
    features: [
      "إدارة حتى 50 منتج",
      "استقبال الطلبات الأساسي",
      "تتبع المخزون",
      "تقارير شهرية",
      "دعم بالبريد الإلكتروني",
    ],
    missing: ["تحليلات الطلب", "أولوية في البحث", "إدارة الفروع"],
  },
  {
    name: "الباقة الاحترافية",
    subtitle: "Pro",
    price: 249,
    price_id: "price_1TtaFNB6BI8uC0AuUeUgEkLw",
    Icon: Zap,
    headerClass: "from-[#C9A66B] to-[#8B6914]",
    popular: true,
    features: [
      "منتجات غير محدودة",
      "إدارة فروع متعددة",
      "أولوية في نتائج البحث",
      "تحليلات الطلب والمبيعات",
      "إدارة العروض والخصومات",
      "ربط مع المقاولين والمشاريع",
      "دعم أولوي عبر الواتساب",
    ],
    missing: [],
  },
  {
    name: "باقة الشركات",
    subtitle: "Enterprise",
    price: 599,
    price_id: "price_1TtaFNB6BI8uC0AuGqIWvrER",
    Icon: Building2,
    headerClass: "from-[#4a3c31] to-[#2a1e14]",
    popular: false,
    features: [
      "كل مميزات الباقة الاحترافية",
      "أعضاء فريق غير محدودون",
      "لوحة تحكم إدارية متكاملة",
      "تكاملات API مخصصة",
      "مدير حساب مخصص",
      "تحليلات سوق متقدمة",
      "أولوية قصوى في الترتيب",
    ],
    missing: [],
  },
];

const TRUST = [
  { Icon: ShieldCheck, text: "دفع آمن عبر Stripe" },
  { Icon: CheckCircle2, text: "إلغاء في أي وقت" },
  { Icon: Zap, text: "تفعيل فوري" },
];

export default function ProviderSubscription() {
  const [loadingId, setLoadingId] = useState(null);
  const [user, setUser] = useState(null);
  const [banner, setBanner] = useState(null);
  const [providerType, setProviderType] = useState("contractor");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const type = params.get("type");
    if (type === "supplier" || type === "contractor") {
      setProviderType(type);
    }
    base44.auth.me().then(setUser).catch(() => {});
    if (params.get("success")) setBanner("success");
    else if (params.get("canceled")) setBanner("canceled");
  }, []);

  const PLANS = providerType === "supplier" ? SUPPLIER_PLANS : CONTRACTOR_PLANS;
  const config = providerType === "supplier"
    ? { label: "الموردين", Icon: Package, desc: "أدوات احترافية لإدارة المخزون والطلبات والمنتجات بكفاءة عالية" }
    : { label: "المقاولين", Icon: HardHat, desc: "أدوات احترافية لإدارة مشاريع البناء والتنفيذ بكفاءة عالية — من العقد حتى التسليم" };

  const handleSubscribe = async (plan) => {
    if (window.self !== window.top) {
      alert("الدفع يعمل فقط من التطبيق المنشور. يرجى فتح التطبيق في تبويب مستقل.");
      return;
    }
    if (!user) {
      base44.auth.redirectToLogin(window.location.pathname + window.location.search);
      return;
    }
    setLoadingId(plan.price_id);
    const res = await base44.functions.invoke("createSubscriptionCheckout", {
      price_id: plan.price_id,
      plan_name: plan.name,
      provider_type: providerType,
    });
    setLoadingId(null);
    if (res.data?.url) window.location.href = res.data.url;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-amber-50/10 to-slate-100 py-16 px-4" dir="rtl">
      <div className="max-w-5xl mx-auto">

        {/* Banners */}
        {banner === "success" && (
          <div className="mb-8 bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3 text-green-800">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <div>
              <p className="font-semibold">تم الاشتراك بنجاح! 🎉</p>
              <p className="text-sm">مرحباً بك في بيتلي بريميوم. تم تفعيل ميزاتك المتقدمة.</p>
            </div>
          </div>
        )}
        {banner === "canceled" && (
          <div className="mb-8 bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3 text-amber-800">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p className="text-sm">تم إلغاء عملية الدفع. يمكنك المحاولة مرة أخرى في أي وقت.</p>
          </div>
        )}

        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-[#C9A66B]/10 text-[#8B6914] px-4 py-2 rounded-full text-sm font-medium mb-4">
            <Crown className="w-4 h-4" /> بيتلي بريميوم — {config.label}
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-[#4a3c31] mb-3">
            باقات اشتراك {config.label}
          </h1>
          <p className="text-slate-500 max-w-xl mx-auto">{config.desc}</p>
        </div>

        {/* Plans */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {PLANS.map((plan) => (
            <div
              key={plan.price_id}
              className={`relative rounded-2xl bg-white overflow-hidden transition-all hover:shadow-xl
                ${plan.popular ? "ring-2 ring-[#C9A66B] shadow-xl md:scale-[1.03]" : "shadow-md"}`}
            >
              {plan.popular && (
                <div className="bg-gradient-to-r from-[#C9A66B] to-[#8B6914] text-white text-xs font-semibold text-center py-1.5">
                  ⭐ الأكثر شيوعاً
                </div>
              )}

              <div className={`bg-gradient-to-br ${plan.headerClass} p-6 text-white`}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                    <plan.Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="font-bold text-lg leading-tight">{plan.name}</h2>
                    <p className="text-white/70 text-xs">{plan.subtitle}</p>
                  </div>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold">{plan.price}</span>
                  <span className="text-white/80 text-sm">ريال / شهر</span>
                </div>
              </div>

              <CardContent className="p-5">
                <ul className="space-y-2 mb-5">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-start gap-2 text-sm text-slate-700">
                      <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                  {plan.missing.map(f => (
                    <li key={f} className="flex items-start gap-2 text-sm text-slate-400">
                      <X className="w-4 h-4 shrink-0 mt-0.5" />
                      <span className="line-through">{f}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  className={`w-full font-semibold ${plan.popular
                    ? "bg-gradient-to-r from-[#C9A66B] to-[#8B6914] hover:opacity-90 text-white"
                    : "bg-[#4a3c31] hover:bg-[#3a2e24] text-white"}`}
                  onClick={() => handleSubscribe(plan)}
                  disabled={!!loadingId}
                >
                  {loadingId === plan.price_id
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> جارٍ التحميل...</>
                    : `اشترك الآن — ${plan.price} ريال/شهر`}
                </Button>
              </CardContent>
            </div>
          ))}
        </div>

        {/* Trust badges */}
        <div className="mt-12 flex flex-wrap justify-center gap-6 text-sm text-slate-500">
          {TRUST.map(({ Icon, text }) => (
            <div key={text} className="flex items-center gap-2">
              <Icon className="w-4 h-4 text-[#C9A66B]" />
              {text}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}