import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, MapPinned, Globe2, Users, MousePointer2, RefreshCw, Loader2, CheckCircle2, AlertTriangle, BarChart3, ExternalLink } from "lucide-react";

const SEO_CHECKS = [
  { label: "عناوين الصفحات الديناميكية", detail: "مفعّلة عبر مدير عناوين الصفحات", ok: true },
  { label: "بيانات Schema المنظمة", detail: "موجودة في الصفحات التسويقية الرئيسية", ok: true },
  { label: "Google Search Console", detail: "لا يوجد تكامل مباشر ظاهر حاليًا", ok: false },
  { label: "بيانات كلمات البحث العضوية", detail: "تحتاج تكامل Search Console لعرضها فعليًا", ok: false },
];

function Stat({ icon: Icon, label, value, note }) {
  return <Card className="border-slate-200"><CardContent className="p-4 flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-[#FEF9EE] flex items-center justify-center"><Icon className="w-5 h-5 text-[#C9A66B]" /></div><div><p className="text-2xl font-bold text-[#4A3F35]">{value ?? "—"}</p><p className="text-xs text-slate-500">{label}</p>{note && <p className="text-[11px] text-slate-400 mt-0.5">{note}</p>}</div></CardContent></Card>;
}

export default function AdminSearchGeoAnalytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);

  const load = async () => {
    setLoading(true); setError("");
    try {
      const res = await base44.functions.invoke("fetchRealtimeVisitors", {});
      if (res.data?.error) throw new Error(res.data.error);
      setData(res.data); setLastUpdated(new Date());
    } catch (e) { setError(e.message || "تعذر تحميل بيانات التحليل الجغرافي"); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);
  const ga = data?.ga || { active_users: 0, cities: [], sources: [], pages: [] };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-[#FEF9EE]/40 py-8 px-4" dir="rtl">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2"><div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#6B5D4F] to-[#C9A66B] text-white flex items-center justify-center"><Search className="w-5 h-5" /></div><div><h1 className="text-2xl font-bold text-[#4A3F35]">محركات البحث والتحليل الجغرافي</h1><p className="text-sm text-slate-500 mt-1">متابعة ظهور بيتلي في محركات البحث وفهم توزيع الزوار حسب الموقع ومصدر الزيارة.</p></div></div>
          </div>
          <Button variant="outline" onClick={load} disabled={loading} className="gap-2"><RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />تحديث البيانات</Button>
        </div>

        <Tabs defaultValue="search" dir="rtl">
          <TabsList className="bg-white border border-slate-200 p-1"><TabsTrigger value="search"><Search className="w-4 h-4 ml-1.5" />محركات البحث</TabsTrigger><TabsTrigger value="geo"><MapPinned className="w-4 h-4 ml-1.5" />التحليل الجغرافي</TabsTrigger></TabsList>

          <TabsContent value="search" className="space-y-5 mt-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Stat icon={Search} label="حالة تكامل Search Console" value="غير مربوط" note="يمكن ربطه لاحقًا لبيانات البحث العضوي" />
              <Stat icon={BarChart3} label="تحسينات SEO المؤكدة" value={SEO_CHECKS.filter(x => x.ok).length} note={`من ${SEO_CHECKS.length} فحوصات أساسية`} />
              <Stat icon={Globe2} label="Google Analytics" value={data?.property_name || "متصل"} note="مصدر التحليل الحالي" />
            </div>
            <Card className="border-slate-200"><CardHeader><CardTitle className="text-base">فحص جاهزية الظهور في محركات البحث</CardTitle></CardHeader><CardContent className="space-y-3">{SEO_CHECKS.map((item) => <div key={item.label} className="flex items-center justify-between gap-3 rounded-xl border p-4"><div><p className="font-semibold text-sm text-[#4A3F35]">{item.label}</p><p className="text-xs text-slate-500 mt-1">{item.detail}</p></div>{item.ok ? <Badge className="bg-emerald-100 text-emerald-700"><CheckCircle2 className="w-3 h-3 ml-1" />مكتمل</Badge> : <Badge className="bg-amber-100 text-amber-700"><AlertTriangle className="w-3 h-3 ml-1" />يحتاج ربط</Badge>}</div>)}</CardContent></Card>
            <Card className="border-amber-200 bg-amber-50"><CardContent className="p-4 flex gap-3"><AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" /><div><p className="font-semibold text-amber-900">بيانات محركات البحث العضوية</p><p className="text-sm text-amber-800 mt-1">هذه الصفحة لا تعرض أرقامًا مفترضة. بيانات النقرات ومرات الظهور والكلمات المفتاحية تحتاج ربط Google Search Console فعليًا.</p></div></CardContent></Card>
          </TabsContent>

          <TabsContent value="geo" className="space-y-5 mt-5">
            {error && <Card className="border-red-200 bg-red-50"><CardContent className="p-4 text-red-700 text-sm">{error}</CardContent></Card>}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Stat icon={Users} label="الزوار النشطون الآن" value={loading && !data ? "…" : ga.active_users} note="Google Analytics Realtime" />
              <Stat icon={MapPinned} label="المدن المرصودة" value={ga.cities?.length || 0} note="ضمن بيانات الوقت الحقيقي" />
              <Stat icon={MousePointer2} label="مصادر الزيارة" value={ga.sources?.length || 0} note="مصادر نشطة الآن" />
              <Stat icon={Globe2} label="الخاصية" value={data?.property_name || "—"} note="Google Analytics" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <Card className="border-slate-200"><CardHeader><CardTitle className="text-base flex items-center gap-2"><MapPinned className="w-4 h-4 text-[#C9A66B]" />أكثر المدن نشاطًا الآن</CardTitle></CardHeader><CardContent>{loading && !data ? <div className="py-10 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-[#C9A66B]" /></div> : ga.cities?.length ? <div className="space-y-2">{ga.cities.map((x, i) => <div key={`${x.city}-${i}`} className="flex items-center justify-between rounded-lg bg-slate-50 p-3"><span className="font-medium text-sm">{x.city}</span><Badge variant="outline">{x.users} زائر</Badge></div>)}</div> : <p className="py-10 text-center text-sm text-slate-400">لا توجد بيانات مدن متاحة حاليًا.</p>}</CardContent></Card>
              <Card className="border-slate-200"><CardHeader><CardTitle className="text-base flex items-center gap-2"><MousePointer2 className="w-4 h-4 text-[#C9A66B]" />مصادر الزيارات الحالية</CardTitle></CardHeader><CardContent>{ga.sources?.length ? <div className="space-y-2">{ga.sources.map((x, i) => <div key={`${x.source}-${i}`} className="flex items-center justify-between rounded-lg bg-slate-50 p-3"><span className="font-medium text-sm">{x.source}</span><Badge variant="outline">{x.users} زائر</Badge></div>)}</div> : <p className="py-10 text-center text-sm text-slate-400">لا توجد مصادر متاحة حاليًا.</p>}</CardContent></Card>
            </div>

            <Card className="border-slate-200"><CardHeader><CardTitle className="text-base">الصفحات الأكثر زيارة الآن</CardTitle></CardHeader><CardContent>{ga.pages?.length ? <div className="space-y-2">{ga.pages.map((x, i) => <div key={`${x.page}-${i}`} className="flex items-center justify-between rounded-lg border p-3"><span className="text-sm truncate max-w-[75%]">{x.page}</span><Badge>{x.users}</Badge></div>)}</div> : <p className="py-8 text-center text-sm text-slate-400">لا توجد بيانات صفحات متاحة حاليًا.</p>}</CardContent></Card>
            {lastUpdated && <p className="text-center text-xs text-slate-400">آخر تحديث: {lastUpdated.toLocaleString("ar-SA")}</p>}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}