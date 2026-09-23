import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { CardContent } from "@/components/ui/card";
import { CheckCircle2, X, Zap, Building2, Star, Loader2, AlertCircle, Crown, ShieldCheck, HardHat, Package } from "lucide-react";

const CONTRACTOR_PLANS = [
  {
    name: "الباقة الأساسية",
    subtitle: "Basic",
    monthly_price: 99,
    yearly_price: 690,
    monthly_price_id: "price_1TtaI3B6BI8uC0AupOhXOnac",
    yearly_price_id: "price_1TtaOgB6BI8uC0AuoLaGDBhe",
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
    monthly_price: 199,
    yearly_price: 1990,
    monthly_price_id: "price_1TtaI4B6BI8uC0AuEky91mYl",
    yearly_price_id: "price_1TtaOgB6BI8uC0AuPYrWJL0T",
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
    monthly_price: 399,
    yearly_price: 3990,
    monthly_price_id: "price_1TtaI4B6BI8uC0Au3YdkJTlY",
    yearly_price_id: "price_1TtaOgB6BI8uC0AuwtKVNleN",
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
    monthly_price: 99,
    yearly_price: 690,
    monthly_price_id: "price_1TtaI4B6BI8uC0Au133PiiYo",
    yearly_price_id: "price_1TtaOgB6BI8uC0AuDavX2zNB",
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
    monthly_price: 249,
    yearly_price: 1790,
    monthly_price_id: "price_1TtaI4B6BI8uC0AuyidDyMj9",
    yearly_price_id: "price_1TtaOgB6BI8uC0AuGLUcpcFS",
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
    monthly_price: 599,
    yearly_price: 4290,
    monthly_price_id: "price_1TtaI4B6BI8uC0Auf8LmiGct",
    yearly_price_id: "price_1TtaOgB6BI8uC0AuWLVMkAve",
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
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [user, setUser] = useState(null);
  const [banner, setBanner] = useState(null);
  const [providerType, setProviderType] = useState("contractor");
  const [billingCycle, setBillingCycle] = useState("monthly");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const type = params.get("type");
    if (type === "supplier" || type === "contractor") {
      setProviderType(type);
    }
    supabase.auth.getUser().then(({ data }) => setUser(data.user || null)).catch(() => {});
    if (params.get("success")) setBanner("success");
    else if (params.get("canceled")) setBanner("canceled");
  }, []);

  const PLANS = providerType === "supplier" ? SUPPLIER_PLANS : CONTRACTOR_PLANS;
  const config = providerType === "supplier"
    ? { label: "الموردين", Icon: Package, desc: "أدوات احترافية لإدارة المخزون والطلبات والمنتجات بكفاءة عالية" }
    : { label: "المقاولين", Icon: HardHat, desc: "أدوات احترافية لإدارة مشاريع البناء والتنفيذ بكفاءة عالية — من العقد حتى التسليم" };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paymentId = params.get('id');
    if (!paymentId) return;
    const orderId = localStorage.getItem('bytly_moyasar_order_id');
    if (!orderId) return;
    supabase.functions.invoke('verify-moyasar-payment', {
      body: { payment_id: paymentId, payment_order_id: orderId }
    }).then(({ data, error }) => {
      localStorage.removeItem('bytly_moyasar_order_id');
      window.history.replaceState({}, '', window.location.pathname + window.location.search.replace(/([?&])id=[^&]*/, '').replace(/[?&]$/, ''));
      if (!error && data?.paid) setBanner('success');
      else setBanner('canceled');
    });
  }, []);
  useEffect(() => {
    if (!selectedPayment || !window.Moyasar) return;
    const el = document.querySelector(".bytly-moyasar-form");
    if (!el) return;
    el.innerHTML = "";
    window.Moyasar.init({ element: ".bytly-moyasar-form", amount: Number(selectedPayment.amount) * 100, currency: "SAR", description: `Bytly ${providerType} ${selectedPayment.subtitle}`, publishable_api_key: "pk_test_YHSpbq6pYYX7XdkBfWeJcpnqTYHn5ZWDN16bhTiW", callback_url: `${window.location.origin}${window.location.pathname}${window.location.search ? window.location.search.split("&")[0] : ""}`, supported_networks: ["visa","mastercard","mada","unionpay"], methods: ["creditcard"] });
  }, [selectedPayment, providerType]);

  const handleSubscribe = async (plan) => {
    if (window.self !== window.top) {
      alert("الدفع يعمل فقط من التطبيق المنشور. يرجى فتح التطبيق في تبويب مستقل.");
      return;
    }
    if (!user) {
      sessionStorage.setItem('loginReturnUrl', window.location.pathname + window.location.search);
      window.location.href = '/login';
      return;
    }
    const tier = plan.name.includes("الأساسية") ? "basic" : plan.name.includes("الاحترافية") ? "professional" : "business";
    const accountType = providerType === "supplier" ? "supplier" : "contractor";
    const code = `${accountType}_${tier}_${billingCycle}`;
    setLoadingId(code);
    const { data: fn, error } = await supabase.functions.invoke('create-moyasar-payment-order', {
      body: { plan_code: code, account_type: accountType, billing_cycle: billingCycle, tier }
    });
    setLoadingId(null);
    if (error || !fn?.payment_order_id) {
      alert(error?.message || 'تعذر إنشاء طلب الدفع.');
      return;
    }
    localStorage.setItem('bytly_moyasar_order_id', fn.payment_order_id);
    setSelectedPayment({ ...plan, tier, orderId: fn.payment_order_id, amount: billingCycle === "yearly" ? plan.yearly_price : plan.monthly_price });
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

          {/* Billing cycle toggle */}
          <div className="inline-flex items-center gap-1 bg-white rounded-full shadow-md p-1 mt-6">
            <button
              onClick={() => setBillingCycle("monthly")}
              className={`px-5 py-2 rounded-full text-sm font-semibold transition-all ${billingCycle === "monthly"
                ? "bg-gradient-to-r from-[#6B5D4F] to-[#C9A66B] text-white"
                : "text-slate-500 hover:text-[#4a3c31]"}`}
            >
              شهري
            </button>
            <button
              onClick={() => setBillingCycle("yearly")}
              className={`px-5 py-2 rounded-full text-sm font-semibold transition-all flex items-center gap-2 ${billingCycle === "yearly"
                ? "bg-gradient-to-r from-[#6B5D4F] to-[#C9A66B] text-white"
                : "text-slate-500 hover:text-[#4a3c31]"}`}
            >
              سنوي
              <span className={`text-[10px] px-2 py-0.5 rounded-full ${billingCycle === "yearly" ? "bg-white/25" : "bg-green-100 text-green-700"}`}>
                وفّر 42%
              </span>
            </button>
          </div>
        </div>

        {/* Plans */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {PLANS.map((plan) => (
            <div
              key={plan.subtitle}
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
                  <span className="text-4xl font-extrabold">
                    {billingCycle === "yearly" ? plan.yearly_price : plan.monthly_price}
                  </span>
                  <span className="text-white/80 text-sm">
                    ريال / {billingCycle === "yearly" ? "سنة" : "شهر"}
                  </span>
                </div>
                {billingCycle === "yearly" && (
                  <p className="text-white/70 text-xs mt-1">
                    ≈ {Math.round(plan.yearly_price / 12)} ريال / شهر
                  </p>
                )}
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
                  {loadingId === `${providerType}_${plan.name.includes("الأساسية") ? "basic" : plan.name.includes("الاحترافية") ? "professional" : "business"}_${billingCycle}`
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> جارٍ التحميل...</>
                    : `اشترك الآن — ${billingCycle === "yearly" ? plan.yearly_price + " ريال/سنة" : plan.monthly_price + " ريال/شهر"}`}
                </Button>
              </CardContent>
            </div>
          ))}
        </div>

        {selectedPayment && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" dir="rtl">
            <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <div><h3 className="font-bold text-lg">إتمام الدفع</h3><p className="text-sm text-slate-500">{selectedPayment.name} — {selectedPayment.amount} ريال</p></div>
                <button onClick={() => setSelectedPayment(null)} className="text-slate-500">✕</button>
              </div>
              <div className="bytly-moyasar-form"></div>
              <p className="text-xs text-slate-400 mt-3 text-center">بيئة اختبار Moyasar — لن يتم خصم مبلغ حقيقي.</p>
            </div>
          </div>
        )}
        {/* Trust badges */
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