import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Building2, UserCircle, Search, Calendar, Gift, Crown, Loader2, RefreshCw, CreditCard } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { differenceInDays } from "date-fns";

const CATEGORY = {
  engineer: { label: "المهندسين", accountType: "professional", icon: Users },
  company: { label: "الشركات الهندسية", accountType: "company", icon: Building2 },
  contractor: { label: "المقاولين", accountType: "contractor", icon: Building2 },
  supplier: { label: "الموردين", accountType: "supplier", icon: Building2 },
};

const ROLE_TO_CATEGORY = {
  engineer: "engineer",
  firm: "company",
  company: "company",
  engineering_company: "company",
  contractor: "contractor",
  supplier: "supplier",
};

const PLAN_TIERS = {
  professional: [
    {
      id: "basic",
      name: "الأساسية",
      icon: "🥉",
      accent: "slate",
      description: "للبداية وبناء حضور مهني داخل بيتلي.",
      features: ["ملف مهني وظهور في البحث", "معرض أعمال", "تقديم العروض الأساسية", "دعم أساسي"],
    },
    {
      id: "professional",
      name: "الاحترافية",
      icon: "⭐",
      accent: "gold",
      popular: true,
      description: "للمهندس الذي يريد ظهورًا أقوى وفرصًا أكثر.",
      features: ["أولوية في نتائج البحث", "عروض موسعة", "شارة محترف", "إحصائيات الأداء", "دعم متقدم"],
    },
    {
      id: "business",
      name: "الأعمال",
      icon: "👑",
      accent: "dark",
      description: "للشركات والفرق التي تحتاج إدارة ونموًا أكبر.",
      features: ["كل مزايا الاحترافية", "إدارة فريق", "تحليلات متقدمة", "أولوية أعلى للظهور", "دعم مخصص"],
    },
  ],
  company: [
    { id: "basic", name: "الأساسية", icon: "🥉", accent: "slate", description: "لشركة هندسية جديدة تريد بناء حضورها وتجربة بيتلي.", features: ["ملف شركة", "ظهور في البحث", "معرض الأعمال", "دعم أساسي"] },
    { id: "professional", name: "الاحترافية", icon: "⭐", accent: "gold", popular: true, description: "للشركات التي تريد ظهورًا أقوى وإدارة أفضل.", features: ["أولوية الظهور", "إدارة الفريق", "تحليلات الأداء", "شارة شركة احترافية", "دعم متقدم"] },
    { id: "business", name: "الأعمال", icon: "👑", accent: "dark", description: "للشركات والمكاتب ذات العمليات والفرق الأكبر.", features: ["كل مزايا الاحترافية", "فرق متعددة", "تقارير متقدمة", "تكاملات مخصصة", "دعم مخصص"] },
  ],
  contractor: [
    {
      id: "basic",
      name: "الأساسية",
      icon: "🥉",
      accent: "slate",
      description: "للمقاول الذي يبدأ استخدام بيتلي.",
      features: ["ملف مقدم خدمة", "ظهور في البحث", "إدارة العروض", "دعم أساسي"],
    },
    {
      id: "professional",
      name: "الاحترافية",
      icon: "⭐",
      accent: "gold",
      popular: true,
      description: "للمقاول الذي يريد فرصًا ومشاريع أكثر.",
      features: ["أولوية في البحث", "مشاريع وعروض موسعة", "تحليلات الأداء", "إدارة الفريق", "دعم متقدم"],
    },
    {
      id: "business",
      name: "الأعمال",
      icon: "👑",
      accent: "dark",
      description: "للشركات والمقاولين ذوي العمليات الأكبر.",
      features: ["كل مزايا الاحترافية", "فرق متعددة", "تقارير متقدمة", "تكاملات مخصصة", "دعم مخصص"],
    },
  ],
  supplier: [
    {
      id: "basic",
      name: "الأساسية",
      icon: "🥉",
      accent: "slate",
      description: "لبناء حضور المورد وإدارة المنتجات الأساسية.",
      features: ["ملف مورد", "عرض المنتجات", "استقبال الطلبات", "تقارير أساسية"],
    },
    {
      id: "professional",
      name: "الاحترافية",
      icon: "⭐",
      accent: "gold",
      popular: true,
      description: "للمورد الذي يريد انتشارًا وتحليلات أكبر.",
      features: ["منتجات موسعة", "أولوية في البحث", "تحليلات المبيعات", "عروض وخصومات", "دعم متقدم"],
    },
    {
      id: "business",
      name: "الأعمال",
      icon: "👑",
      accent: "dark",
      description: "للموردين والشركات متعددة الفرق والفروع.",
      features: ["كل مزايا الاحترافية", "فرق وفروع متعددة", "تقارير سوق متقدمة", "تكاملات مخصصة", "دعم مخصص"],
    },
  ],
};

export default function AdminSubscriptionControl() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [records, setRecords] = useState([]);
  const [clients, setClients] = useState([]);
  const [plans, setPlans] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      setRefreshing(true);
      const [subsRes, profilesRes, plansRes, clientsRes] = await Promise.all([
        supabase.from("subscriptions").select("*").order("created_at", { ascending: false }),
        supabase.from("profiles").select("user_id,full_name,email,role"),
        supabase.from("subscription_plans").select("*").eq("is_active", true).order("price"),
        supabase.from("clients").select("user_id,full_name,email,status"),
      ]);
      if (subsRes.error) throw subsRes.error;
      if (profilesRes.error) throw profilesRes.error;
      if (plansRes.error) throw plansRes.error;
      if (clientsRes.error) console.warn("Clients query:", clientsRes.error);

      const profileMap = new Map((profilesRes.data || []).map(p => [p.user_id, p]));
      setPlans(plansRes.data || []);
      setClients(clientsRes.data || []);
      setRecords((subsRes.data || []).map(s => ({
        ...s,
        profile: profileMap.get(s.user_id) || null,
      })));
    } catch (error) {
      console.error("Error loading subscriptions:", error);
      toast.error("تعذر تحميل بيانات الاشتراكات");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const providerRecords = useMemo(() => records.filter(r => ROLE_TO_CATEGORY[r.profile?.role]), [records]);

  const stats = useMemo(() => ({
    trial: providerRecords.filter(r => r.status === "trial" && r.trial_end_at && new Date(r.trial_end_at) > new Date()).length,
    paid: providerRecords.filter(r => r.status === "active").length,
    expired: providerRecords.filter(r => r.status === "expired" || (r.status === "trial" && r.trial_end_at && new Date(r.trial_end_at) <= new Date())).length,
    revenue: providerRecords.filter(r => r.status === "active").reduce((sum, r) => sum + Number(r.price || 0), 0),
  }), [providerRecords]);

  const getCategoryRecords = (category) => providerRecords.filter(r => ROLE_TO_CATEGORY[r.profile?.role] === category);

  const matchesSearch = (r) => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return true;
    return [r.profile?.full_name, r.profile?.email].some(v => v?.toLowerCase().includes(q));
  };

  const updateSubscription = async (id, patch, successMessage) => {
    try {
      const { error } = await supabase.from("subscriptions").update({ ...patch, updated_at: new Date().toISOString() }).eq("id", id);
      if (error) throw error;
      toast.success(successMessage);
      await loadData();
    } catch (error) {
      console.error(error);
      toast.error("حدث خطأ أثناء تحديث الاشتراك");
    }
  };

  const extendTrial = async (record, days = 30) => {
    const base = record.trial_end_at && new Date(record.trial_end_at) > new Date() ? new Date(record.trial_end_at) : new Date();
    base.setDate(base.getDate() + days);
    await updateSubscription(record.id, {
      status: "trial",
      price: 0,
      trial_end_at: base.toISOString(),
      current_period_start: new Date().toISOString(),
      current_period_end: base.toISOString(),
    }, `تم تمديد التجربة ${days} يوم`);
  };

  const convertToPaid = async (record, cycle) => {
    const plan = plans.find(p => p.account_type === record.account_type && p.billing_cycle === cycle);
    if (!plan) {
      toast.error("لا توجد خطة مفعلة لهذا النوع");
      return;
    }
    const start = new Date();
    const end = new Date(start);
    if (cycle === "monthly") end.setMonth(end.getMonth() + 1);
    else end.setFullYear(end.getFullYear() + 1);
    await updateSubscription(record.id, {
      status: "active",
      plan_code: plan.code,
      billing_cycle: cycle,
      price: plan.price,
      started_at: start.toISOString(),
      current_period_start: start.toISOString(),
      current_period_end: end.toISOString(),
      trial_end_at: null,
      payment_status: "completed",
      auto_renew: true,
    }, `تم تحويل الاشتراك إلى ${cycle === "monthly" ? "شهري" : "سنوي"}`);
  };

  const toggleActive = async (record) => {
    const nextStatus = record.status === "active" ? "cancelled" : "active";
    await updateSubscription(record.id, { status: nextStatus }, nextStatus === "active" ? "تم تفعيل الاشتراك" : "تم إيقاف الاشتراك");
  };

  const renderUserRow = (record) => {
    const isTrial = record.status === "trial";
    const isActive = record.status === "active";
    const daysLeft = record.trial_end_at ? differenceInDays(new Date(record.trial_end_at), new Date()) : null;
    const name = record.profile?.full_name || "مستخدم بدون اسم";
    const email = record.profile?.email || "";
    const cycleLabel = record.billing_cycle === "yearly" ? "سنوي" : record.billing_cycle === "monthly" ? "شهري" : "تجريبي مجاني";

    return (
      <div key={record.id} className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 bg-white rounded-lg border hover:shadow-md transition-shadow">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <p className="font-medium text-slate-900">{name}</p>
            <Badge className={isTrial ? "bg-green-100 text-green-700" : isActive ? "bg-blue-100 text-blue-700" : "bg-red-100 text-red-700"}>
              {isTrial && <Gift className="w-3 h-3 ml-1" />}
              {record.status === "expired" ? "منتهي" : record.status === "cancelled" ? "ملغى" : cycleLabel}
            </Badge>
            {isActive && <Badge variant="outline" className="text-emerald-700 border-emerald-300">نشط</Badge>}
          </div>
          <p className="text-sm text-slate-600">{email}</p>
          {isTrial && record.trial_end_at && (
            <p className="text-xs text-slate-500 mt-1">
              <Calendar className="w-3 h-3 inline ml-1" />
              {daysLeft > 0 ? `${daysLeft} يوم متبقي من التجربة` : "انتهت الفترة التجريبية"}
            </p>
          )}
          {isActive && <p className="text-xs text-slate-500 mt-1">القيمة: {Number(record.price || 0).toLocaleString("ar-SA")} ريال</p>}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Switch checked={isActive || isTrial} onCheckedChange={() => toggleActive(record)} />
          {isTrial && (
            <>
              <Button size="sm" variant="outline" onClick={() => extendTrial(record, 30)} className="text-xs">+30 يوم</Button>
              <Button size="sm" variant="outline" onClick={() => convertToPaid(record, "monthly")} className="text-xs">→ شهري</Button>
              <Button size="sm" variant="outline" onClick={() => convertToPaid(record, "yearly")} className="text-xs">→ سنوي</Button>
            </>
          )}
        </div>
      </div>
    );
  };

  const renderCategory = (category) => {
    const config = CATEGORY[category];
    const rows = getCategoryRecords(category).filter(matchesSearch);
    return (
      <TabsContent value={category} className="mt-6">
        <Card>
          <CardHeader><CardTitle>{config.label} — إدارة الاشتراكات</CardTitle></CardHeader>
          <CardContent>
            {rows.length ? <div className="space-y-3">{rows.map(renderUserRow)}</div> : <p className="text-center text-slate-500 py-10">لا توجد اشتراكات مسجلة حاليًا</p>}
          </CardContent>
        </Card>
      </TabsContent>
    );
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-12 h-12 animate-spin text-purple-600" /></div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50/30 py-8" dir="rtl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold gradient-text mb-2">إدارة الاشتراكات</h1>
              <p className="text-slate-600 mb-8">التحكم في الاشتراكات والفترات التجريبية والخطط المهنية</p>
            </div>
            <Button variant="outline" onClick={loadData} disabled={refreshing}><RefreshCw className={`w-4 h-4 ml-2 ${refreshing ? "animate-spin" : ""}`} /> تحديث</Button>
          </div>
        </motion.div>

        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-0"><CardContent className="pt-6"><Gift className="w-8 h-8 text-green-600 mb-2" /><p className="text-sm text-slate-600 mb-1">في الفترة المجانية</p><p className="text-3xl font-bold text-green-900">{stats.trial}</p><p className="text-xs text-slate-500">3 أشهر لكل محترف جديد</p></CardContent></Card>
          <Card className="bg-gradient-to-br from-purple-50 to-indigo-50 border-0"><CardContent className="pt-6"><Crown className="w-8 h-8 text-purple-600 mb-2" /><p className="text-sm text-slate-600 mb-1">مشتركين مدفوعين</p><p className="text-3xl font-bold text-purple-900">{stats.paid}</p></CardContent></Card>
          <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-0"><CardContent className="pt-6"><Users className="w-8 h-8 text-blue-600 mb-2" /><p className="text-sm text-slate-600 mb-1">منتهية / ملغاة</p><p className="text-3xl font-bold text-blue-900">{stats.expired}</p></CardContent></Card>
          <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-0"><CardContent className="pt-6"><CreditCard className="w-8 h-8 text-amber-600 mb-2" /><p className="text-sm text-slate-600 mb-1">قيمة الاشتراكات النشطة</p><p className="text-3xl font-bold text-amber-900">{stats.revenue.toLocaleString("ar-SA")} <span className="text-sm">ريال</span></p></CardContent></Card>
        </div>

        <Card className="mb-6 overflow-hidden border-0 shadow-lg">
          <CardHeader className="bg-gradient-to-l from-slate-950 via-slate-900 to-slate-800 text-white">
            <CardTitle className="text-xl">خطط الاشتراك المعتمدة</CardTitle>
            <p className="text-sm text-slate-300 mt-1">
              نفس فلسفة باقات بيتلي القديمة: مستويات واضحة، مزايا مختلفة، واختيار شهري أو سنوي داخل الخطة.
            </p>
          </CardHeader>
          <CardContent className="p-5 space-y-6">
            <div className="rounded-2xl border-2 border-emerald-200 bg-gradient-to-l from-emerald-50 via-white to-green-50 p-5">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2"><span className="text-2xl">🆓</span><h3 className="font-extrabold text-xl text-emerald-900">الخطة المجانية — تجربة بيتلي</h3><Badge className="bg-emerald-100 text-emerald-800">3 أشهر</Badge></div>
                  <p className="text-sm text-slate-600">كل مستخدم مهني جديد يبدأ مجانًا لمدة 90 يومًا. يجرب المنصة ويستفيد من الفرص، ثم يختار خطة مدفوعة عند انتهاء التجربة.</p>
                </div>
                <div className="text-left"><div className="text-3xl font-black text-emerald-700">0 ريال</div><div className="text-xs text-slate-500">لمدة 3 أشهر</div></div>
              </div>
            </div>
            {["professional", "company", "contractor", "supplier"].map(accountType => {
              const accountPlans = plans.filter(p => p.account_type === accountType);
              const tiers = PLAN_TIERS[accountType] || [];
              if (!tiers.length) return null;
              const label = accountType === "professional" ? "المهندسون والمحترفون" :
                accountType === "company" ? "الشركات الهندسية" :
                accountType === "contractor" ? "المقاولون" : "الموردون";

              return (
                <div key={accountType} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <div>
                      <h3 className="font-bold text-lg text-slate-900">{label}</h3>
                      <p className="text-xs text-slate-500">اختر المستوى المناسب، ثم حدد دورة الدفع.</p>
                    </div>
                    <Badge variant="outline" className="bg-white">تجربة مجانية 3 أشهر للمستخدم الجديد</Badge>
                  </div>

                  <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
                    {tiers.map(tier => {
                      const monthly = accountPlans.find(p => p.tier === tier.id && p.billing_cycle === "monthly");
                      const yearly = accountPlans.find(p => p.tier === tier.id && p.billing_cycle === "yearly");
                      const monthlyPrice = monthly ? Number(monthly.price) : null;
                      const yearlyPrice = yearly ? Number(yearly.price) : null;
                      const yearlySavings = monthlyPrice && yearlyPrice ? Math.max(0, monthlyPrice * 12 - yearlyPrice) : 0;
                      const colors = tier.accent === "gold"
                        ? { card: "border-amber-300 bg-gradient-to-br from-amber-50 via-white to-yellow-50", icon: "bg-amber-100 text-amber-700", button: "bg-amber-500 hover:bg-amber-600", badge: "bg-amber-100 text-amber-800" }
                        : tier.accent === "dark"
                        ? { card: "border-slate-700 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 text-white", icon: "bg-amber-400/15 text-amber-300", button: "bg-amber-500 hover:bg-amber-400 text-slate-950", badge: "bg-white/10 text-amber-200" }
                        : { card: "border-slate-200 bg-white", icon: "bg-slate-100 text-slate-700", button: "bg-slate-800 hover:bg-slate-900", badge: "bg-slate-100 text-slate-700" };

                      return (
                        <div key={tier.id} className={`relative overflow-hidden rounded-2xl border-2 p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${colors.card}`}>
                          {tier.popular && (
                            <div className="absolute top-0 left-0 rounded-br-2xl bg-gradient-to-r from-amber-500 to-yellow-400 px-3 py-1 text-xs font-bold text-white">
                              ⭐ الأكثر شيوعًا
                            </div>
                          )}
                          <div className="flex items-start justify-between gap-3 mb-4">
                            <div className={`rounded-xl p-3 ${colors.icon}`}>
                              <span className="text-2xl">{tier.icon}</span>
                            </div>
                            <Badge className={colors.badge}>{tier.name}</Badge>
                          </div>

                          <h4 className={`text-xl font-extrabold ${tier.accent === "dark" ? "text-white" : "text-slate-900"}`}>{tier.name}</h4>
                          <p className={`text-sm mt-1 min-h-10 ${tier.accent === "dark" ? "text-slate-300" : "text-slate-500"}`}>{tier.description}</p>

                          <div className="mt-4 space-y-2">
                            {tier.features.map(feature => (
                              <div key={feature} className={`flex items-start gap-2 text-sm ${tier.accent === "dark" ? "text-slate-200" : "text-slate-700"}`}>
                                <span className="text-emerald-500 font-bold">✓</span>
                                <span>{feature}</span>
                              </div>
                            ))}
                          </div>

                          <div className={`mt-5 rounded-xl p-3 ${tier.accent === "dark" ? "bg-white/5" : "bg-slate-50"}`}>
                            <div className="grid grid-cols-2 gap-2">
                              <button
                                type="button"
                                disabled={!monthly}
                                onClick={() => monthly && toast.info(`تم اختيار ${tier.name} — شهري. الدفع سيتم ربطه ببوابة الدفع عند تفعيلها.`)}
                                className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-3 text-right hover:bg-blue-100 disabled:opacity-50"
                              >
                                <span className="block text-xs text-blue-700">شهري</span>
                                <strong className="block text-lg text-slate-900">{monthlyPrice !== null ? `${monthlyPrice.toLocaleString("ar-SA")} ريال` : "غير متاح"}</strong>
                              </button>
                              <button
                                type="button"
                                disabled={!yearly}
                                onClick={() => yearly && toast.info(`تم اختيار ${tier.name} — سنوي. الدفع سيتم ربطه ببوابة الدفع عند تفعيلها.`)}
                                className="relative rounded-xl border-2 border-amber-300 bg-amber-50 px-3 py-3 text-right hover:bg-amber-100 disabled:opacity-50"
                              >
                                {yearlySavings > 0 && <span className="absolute -top-2 left-2 rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold text-white">وفر {yearlySavings.toLocaleString("ar-SA")} ريال</span>}
                                <span className="block text-xs text-amber-700">سنوي</span>
                                <strong className="block text-lg text-slate-900">{yearlyPrice !== null ? `${yearlyPrice.toLocaleString("ar-SA")} ريال` : "غير متاح"}</strong>
                              </button>
                            </div>
                          </div>

                          <div className={`mt-3 text-xs ${tier.accent === "dark" ? "text-slate-400" : "text-slate-500"}`}>
                            ملاحظة: المستويات الإضافية تعرض مزاياها الآن، وسيتم ربط سعر مستقل لكل مستوى عند اعتماد الباقات التجارية النهائية.
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Tabs defaultValue="engineer">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="engineer"><Users className="w-4 h-4 ml-2" />المهندسين ({getCategoryRecords("engineer").length})</TabsTrigger>
            <TabsTrigger value="company"><Building2 className="w-4 h-4 ml-2" />الشركات الهندسية ({getCategoryRecords("company").length})</TabsTrigger>
            <TabsTrigger value="contractor"><Building2 className="w-4 h-4 ml-2" />المقاولين ({getCategoryRecords("contractor").length})</TabsTrigger>
            <TabsTrigger value="supplier"><Building2 className="w-4 h-4 ml-2" />الموردين ({getCategoryRecords("supplier").length})</TabsTrigger>
          </TabsList>
          {renderCategory("engineer")}
          {renderCategory("company")}
          {renderCategory("contractor")}
          {renderCategory("supplier")}
        </Tabs>

        <Card className="mt-6">
          <CardHeader><CardTitle><UserCircle className="w-5 h-5 inline ml-2" /> العملاء</CardTitle></CardHeader>
          <CardContent><p className="text-sm text-slate-600">العميل/مالك المشروع لا يحتاج اشتراكًا مهنيًا. عدد العملاء المسجلين حاليًا: <strong>{clients.length}</strong>.</p></CardContent>
        </Card>
      </div>
    </div>
  );
}
