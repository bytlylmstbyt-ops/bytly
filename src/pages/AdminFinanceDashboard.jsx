import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Wallet, Receipt, ArrowDownToLine, RotateCcw, BarChart3, ArrowUpRight, ArrowDownLeft, Clock3, RefreshCw, CreditCard, ShieldCheck, Loader2 } from "lucide-react";
import { createPageUrl } from "@/utils";
import { toast } from "sonner";

const money = (v) => Number(v || 0).toLocaleString("ar-SA", { maximumFractionDigits: 2 });
const dateTime = (v) => v ? new Date(v).toLocaleString("ar-SA", { dateStyle: "short", timeStyle: "short" }) : "—";
const statusLabels = { completed: "مكتمل", paid: "مدفوع", succeeded: "ناجح", pending: "معلق", initiated: "بدأت العملية", processing: "قيد المعالجة", failed: "فشل", refunded: "مسترد", cancelled: "ملغى" };
const statusClass = { completed: "bg-emerald-100 text-emerald-700", paid: "bg-emerald-100 text-emerald-700", succeeded: "bg-emerald-100 text-emerald-700", pending: "bg-amber-100 text-amber-700", initiated: "bg-blue-100 text-blue-700", processing: "bg-blue-100 text-blue-700", failed: "bg-red-100 text-red-700", refunded: "bg-slate-100 text-slate-700", cancelled: "bg-slate-100 text-slate-700" };
const quickLinks = [
  { title: "المحافظ والمعاملات", desc: "الأرصدة وحركة المحافظ", icon: Wallet, page: "AdminWallet" },
  { title: "الفواتير", desc: "الفواتير وحالات التحصيل", icon: Receipt, page: "InvoiceManager" },
  { title: "طلبات السحب", desc: "المبالغ المطلوب صرفها", icon: ArrowDownToLine, page: "AllWithdrawalRequests" },
  { title: "المبالغ المستردة", desc: "الاستردادات والضمان", icon: RotateCcw, page: "AdminRefundControl" },
  { title: "التقارير المالية", desc: "الإيرادات والعمولات", icon: BarChart3, page: "AdminRevenueReport" },
  { title: "الاشتراكات", desc: "الباقات والمدفوعات المهنية", icon: CreditCard, page: "AdminSubscriptionControl" },
];

export default function AdminFinanceDashboard() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState({ wallet: [], revenue: [], payments: [], subscriptionPayments: [], withdrawals: [], profiles: [] });

  const loadData = useCallback(async () => {
    try {
      setRefreshing(true);
      const results = await Promise.all([
        supabase.from("wallet_transactions").select("id,created_at,user_id,type,amount,currency,status,reference,description,direction").order("created_at", { ascending: false }).limit(100),
        supabase.from("revenue_ledger").select("id,source_type,status,platform_revenue_amount,currency,reference,description,recognized_at,created_at").order("created_at", { ascending: false }).limit(100),
        supabase.from("payment_transactions").select("id,user_id,provider,provider_charge_id,amount,currency,status,created_at,updated_at").order("created_at", { ascending: false }).limit(100),
        supabase.from("subscription_payments").select("id,user_id,provider,provider_payment_id,amount,currency,status,billing_cycle,tier,paid_at,created_at,updated_at").order("created_at", { ascending: false }).limit(100),
        supabase.from("withdrawal_requests").select("id,created_at,amount,status,provider_type,request_date,completion_date,transaction_reference,description").order("created_at", { ascending: false }).limit(100),
        supabase.from("profiles").select("user_id,full_name,email,role"),
      ]);
      const warnings = results.filter(r => r.error).map(r => r.error.message);
      if (warnings.length) console.warn("Financial query warnings:", warnings);
      setData({
        wallet: results[0].data || [], revenue: results[1].data || [], payments: results[2].data || [],
        subscriptionPayments: results[3].data || [], withdrawals: results[4].data || [], profiles: results[5].data || []
      });
    } catch (error) {
      console.error("Finance dashboard load error:", error);
      toast.error("تعذر تحميل البيانات المالية");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const profileMap = useMemo(() => new Map(data.profiles.map(p => [p.user_id, p])), [data.profiles]);

  const stats = useMemo(() => {
    const ok = ["completed", "paid", "succeeded"];
    const walletIn = data.wallet.filter(t => ok.includes(t.status) && t.direction === "in").reduce((s,t) => s + Number(t.amount || 0), 0);
    const walletOut = data.wallet.filter(t => ok.includes(t.status) && t.direction === "out").reduce((s,t) => s + Number(t.amount || 0), 0);
    const platformRevenue = data.revenue.filter(r => ["recognized", "completed", "paid"].includes(r.status)).reduce((s,r) => s + Number(r.platform_revenue_amount || 0), 0);
    const paidSubscriptions = data.subscriptionPayments.filter(p => ok.includes(p.status)).reduce((s,p) => s + Number(p.amount || 0), 0);
    const projectPayments = data.payments.filter(p => ok.includes(p.status)).reduce((s,p) => s + Number(p.amount || 0), 0);
    const pendingWithdrawals = data.withdrawals.filter(w => ["pending", "processing"].includes(w.status)).reduce((s,w) => s + Number(w.amount || 0), 0);
    const pendingPayments = [...data.payments, ...data.subscriptionPayments].filter(p => ["pending", "initiated", "processing"].includes(p.status)).reduce((s,p) => s + Number(p.amount || 0), 0);
    const refunded = [...data.payments, ...data.subscriptionPayments].filter(p => p.status === "refunded").reduce((s,p) => s + Number(p.amount || 0), 0);
    return { walletIn, walletOut, platformRevenue, paidSubscriptions, projectPayments, pendingWithdrawals, pendingPayments, refunded };
  }, [data]);

  const transactions = useMemo(() => {
    const wallet = data.wallet.map(t => ({
      id: "w-" + t.id, date: t.created_at, direction: t.direction, amount: Number(t.amount || 0), status: t.status,
      source: "المحفظة", user: profileMap.get(t.user_id)?.full_name || profileMap.get(t.user_id)?.email || "مستخدم",
      description: t.description || t.type || "حركة محفظة", reference: t.reference
    }));
    const subs = data.subscriptionPayments.map(t => ({
      id: "s-" + t.id, date: t.paid_at || t.created_at, direction: "in", amount: Number(t.amount || 0), status: t.status,
      source: t.provider || "بوابة الدفع", user: profileMap.get(t.user_id)?.full_name || profileMap.get(t.user_id)?.email || "مستخدم",
      description: "اشتراك " + (t.tier || "") + " — " + (t.billing_cycle === "yearly" ? "سنوي" : "شهري"), reference: t.provider_payment_id
    }));
    const project = data.payments.map(t => ({
      id: "p-" + t.id, date: t.updated_at || t.created_at, direction: "in", amount: Number(t.amount || 0), status: t.status,
      source: t.provider || "دفعة مشروع", user: profileMap.get(t.user_id)?.full_name || profileMap.get(t.user_id)?.email || "مستخدم",
      description: "دفعة مشروع", reference: t.provider_charge_id
    }));
    return [...wallet, ...subs, ...project].sort((a,b) => new Date(b.date) - new Date(a.date)).slice(0, 25);
  }, [data, profileMap]);

  if (loading) return <div className="min-h-[60vh] flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-[#C9A66B]" /></div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6" dir="rtl">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div><p className="text-xs font-medium text-[#C9A66B]">مجلس الإدارة / الإدارة التنفيذية / الإدارة المالية</p><h1 className="text-3xl font-bold text-[#4A3F35] mt-1">الإدارة المالية</h1><p className="text-sm text-slate-500 mt-1">مركز واحد لمتابعة الداخل والخارج والمعلق والمسترد وإيرادات بيتلي.</p></div>
        <Button variant="outline" onClick={loadData} disabled={refreshing}><RefreshCw className={"w-4 h-4 ml-2 " + (refreshing ? "animate-spin" : "")} /> تحديث البيانات</Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          ["إجمالي الداخل", stats.walletIn + stats.paidSubscriptions + stats.projectPayments, ArrowDownLeft, "text-emerald-600", "bg-emerald-50"],
          ["إجمالي الخارج", stats.walletOut + stats.pendingWithdrawals, ArrowUpRight, "text-red-600", "bg-red-50"],
          ["إيراد بيتلي", stats.platformRevenue, ShieldCheck, "text-[#C9A66B]", "bg-amber-50"],
          ["مبالغ معلقة", stats.pendingPayments + stats.pendingWithdrawals, Clock3, "text-amber-600", "bg-amber-50"],
        ].map(([title, value, Icon, iconColor, iconBg]) => <Card key={title} className="border-slate-200"><CardContent className="p-5"><div className={"w-10 h-10 rounded-xl " + iconBg + " flex items-center justify-center mb-3"}><Icon className={"w-5 h-5 " + iconColor} /></div><p className="text-sm text-slate-500">{title}</p><p className="text-2xl font-bold text-slate-900 mt-1">{money(value)} <span className="text-sm font-medium text-slate-500">ريال</span></p></CardContent></Card>)}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          ["اشتراكات مدفوعة", stats.paidSubscriptions], ["دفعات المشاريع", stats.projectPayments],
          ["طلبات سحب معلقة", stats.pendingWithdrawals], ["مبالغ مستردة", stats.refunded]
        ].map(([label,value]) => <Card key={label}><CardContent className="p-5"><p className="text-xs text-slate-500">{label}</p><p className="text-xl font-bold mt-1">{money(value)} ر.س</p></CardContent></Card>)}
      </div>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader><CardTitle>الحركة المالية الأخيرة</CardTitle></CardHeader>
        <CardContent className="p-0"><div className="overflow-x-auto"><table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500"><tr><th className="p-3 text-right">التاريخ</th><th className="p-3 text-right">المستخدم</th><th className="p-3 text-right">العملية</th><th className="p-3 text-right">المصدر</th><th className="p-3 text-right">المبلغ</th><th className="p-3 text-right">الحالة</th><th className="p-3 text-right">المرجع</th></tr></thead>
          <tbody>{transactions.length ? transactions.map(t => <tr key={t.id} className="border-t hover:bg-slate-50"><td className="p-3 whitespace-nowrap">{dateTime(t.date)}</td><td className="p-3">{t.user}</td><td className="p-3">{t.description}</td><td className="p-3">{t.source}</td><td className={"p-3 font-bold whitespace-nowrap " + (t.direction === "in" ? "text-emerald-700" : "text-red-700")}>{t.direction === "in" ? "+" : "-"}{money(t.amount)} ر.س</td><td className="p-3"><Badge className={statusClass[t.status] || "bg-slate-100 text-slate-700"}>{statusLabels[t.status] || t.status || "غير معروف"}</Badge></td><td className="p-3 font-mono text-xs">{t.reference || "—"}</td></tr>) : <tr><td colSpan="7" className="p-10 text-center text-slate-500">لا توجد حركات مالية مسجلة حتى الآن.</td></tr>}</tbody>
        </table></div></CardContent>
      </Card>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader><CardTitle>الإيرادات المسجلة</CardTitle></CardHeader>
        <CardContent>{data.revenue.length ? <div className="space-y-2">{data.revenue.slice(0,10).map(r => <div key={r.id} className="flex flex-col md:flex-row md:items-center justify-between gap-3 rounded-xl border p-3"><div><p className="font-semibold">{r.description || r.source_type || "إيراد"}</p><p className="text-xs text-slate-500">{dateTime(r.recognized_at || r.created_at)} • {r.reference || "بدون مرجع"}</p></div><p className="font-bold text-emerald-700">+{money(r.platform_revenue_amount)} ر.س</p></div>)}</div> : <p className="text-center text-slate-500 py-8">لا توجد إيرادات مسجلة حتى الآن.</p>}</CardContent>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {quickLinks.map(({ title, desc, icon: Icon, page }) => <Link key={page} to={createPageUrl(page)}><Card className="h-full hover:shadow-md hover:-translate-y-0.5 transition-all border-slate-200"><CardHeader className="pb-2"><CardTitle className="flex items-center justify-between text-base text-[#4A3F35]"><span className="flex items-center gap-2"><Icon className="w-5 h-5 text-[#C9A66B]" />{title}</span><ArrowUpRight className="w-4 h-4 text-slate-400" /></CardTitle></CardHeader><CardContent><p className="text-sm text-slate-500">{desc}</p></CardContent></Card></Link>)}
      </div>

      <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800"><strong>مهم:</strong> اختيار الباقة لا يُعتبر دفعة مالية. لا يظهر مبلغ كإيراد إلا بعد وجود معاملة ناجحة ومسجلة في النظام.</div>
    </div>
  );
}
