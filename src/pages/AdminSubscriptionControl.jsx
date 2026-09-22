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
          <CardHeader className="bg-gradient-to-l from-slate-900 via-slate-800 to-slate-900 text-white">
            <CardTitle className="text-xl">خطط الاشتراك المعتمدة</CardTitle>
            <p className="text-sm text-slate-300">تصميم واضح يميز الاشتراك الشهري عن السنوي ويهيئ المستخدم لاختيار الخطة ثم إتمام الدفع.</p>
          </CardHeader>
          <CardContent className="p-5">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
              {plans.map(plan => {
                const yearly = plan.billing_cycle === "yearly";
                const professional = plan.account_type === "professional";
                return (
                  <div
                    key={plan.code}
                    className={`group relative overflow-hidden rounded-2xl border-2 p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl cursor-pointer ${
                      yearly
                        ? "border-amber-300 bg-gradient-to-br from-amber-50 via-white to-yellow-50"
                        : "border-blue-200 bg-gradient-to-br from-blue-50 via-white to-sky-50"
                    }`}
                  >
                    {yearly && (
                      <div className="absolute left-0 top-0 rounded-br-2xl bg-gradient-to-r from-amber-500 to-yellow-400 px-3 py-1 text-xs font-bold text-white shadow-sm">
                        ⭐ الأكثر توفيرًا
                      </div>
                    )}
                    <div className={`mb-4 mt-2 inline-flex rounded-xl p-3 ${yearly ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"}`}>
                      <CreditCard className="h-6 w-6" />
                    </div>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-bold text-slate-900">{plan.name}</p>
                        <p className="mt-1 text-xs text-slate-500">{professional ? "للمهندسين والمحترفين" : plan.account_type === "company" ? "للشركات الهندسية" : plan.account_type === "contractor" ? "للمقاولين" : "للموردين"}</p>
                      </div>
                      <Badge className={yearly ? "bg-amber-100 text-amber-800 border-amber-200" : "bg-blue-100 text-blue-800 border-blue-200"}>
                        {yearly ? "سنوي" : "شهري"}
                      </Badge>
                    </div>
                    <div className="mt-5">
                      <span className="text-3xl font-extrabold text-slate-900">{Number(plan.price).toLocaleString("ar-SA")}</span>
                      <span className="mr-2 text-sm text-slate-500">ريال / {yearly ? "سنة" : "شهر"}</span>
                    </div>
                    <div className={`mt-4 rounded-xl px-3 py-2 text-xs font-medium ${yearly ? "bg-amber-100/70 text-amber-800" : "bg-blue-100/70 text-blue-800"}`}>
                      تجربة مجانية 3 أشهر للمستخدم المهني الجديد
                    </div>
                    <Button
                      type="button"
                      className={`mt-5 w-full rounded-xl font-bold shadow-sm ${yearly ? "bg-amber-500 hover:bg-amber-600 text-white" : "bg-blue-600 hover:bg-blue-700 text-white"}`}
                      onClick={() => toast.info("اختيار الخطة والدفع سيتم ربطه ببوابة الدفع عند تفعيلها.")}
                    >
                      اختيار {yearly ? "الخطة السنوية" : "الخطة الشهرية"}
                    </Button>
                  </div>
                );
              })}
            </div>
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
