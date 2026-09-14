import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Search, RefreshCw, ChevronLeft, CheckCircle2, AlertTriangle, XCircle, Tags, SlidersHorizontal, Bot } from "lucide-react";

const auditRows = [
  ["يحتوي التطبيق على محتوى كافي للذكاء الاصطناعي", "good"],
  ["يتم تحميل الصفحة الرئيسية", "good"],
  ["اسم التطبيق", "good"],
  ["اسم التطبيق ذو طول مناسب", "good"],
  ["يحتوي التطبيق على وصف", "good"],
  ["يحتوي التطبيق على شعار", "good"],
  ["تبدو رائعة عند مشاركتها على X", "good"],
  ["تم تحديد عنوان URL المفضل", "good"],
  ["كل صفحة لها عنوانها الخاص", "good"],
  ["تحتوي كل صفحة على وصفها الخاص", "good"],
  ["تحتوي كل صفحة على نص مخصص لتحسين محركات البحث", "good"],
  ["يسمح لمحركات البحث بالزحف", "good"],
  ["خريطة الموقع تعرض جميع صفحاتك", "good"],
  ["تم تكوين تصنيفات البحث المخصصة", "good"],
  ["تم تعيين تسمية الموقع الإلكتروني", "good"],
  ["تم إعداد مسارات التصفح", "good"],
  ["تم إعداد معلومات العلامة التجارية", "good"],
  ["محتوى الأسئلة الشائعة مصنف", "good"],
  ["تتضمن الصفحات علامات محركات البحث", "good"],
  ["استخدام أنواع متعددة من علامات البحث", "good"],
  ["تم تفعيل دليل الموقع القابل للقراءة بواسطة الذكاء الاصطناعي", "good"],
  ["يمكن لأدوات الذكاء الاصطناعي قراءة تطبيقك", "good"],
  ["يُسمح بالوصول إلى أدوات الذكاء الاصطناعي", "good"],
  ["يحتوي التطبيق على صفحات ثقة", "good"],
  ["يظهر اسم التطبيق في الوصف", "good"],
  ["يسهل على أدوات الذكاء الاصطناعي الاستشهاد بالتطبيق", "good"],
  ["الوصف مفصل بما فيه الكفاية", "good"],
  ["أسماء الصفحات واضحة", "good"],
  ["يستخدم عنوان الصفحة اسم التطبيق", "good"],
  ["عنوان URL للتطبيق هو نطاقك المخصص", "good"],
  ["يحتوي التطبيق على صفحات كافية للبحث", "good"],
];

const warnings = [
  "أنواع البيانات التي لم يتم تصنيفها بعد للبحث",
  "تفتقر بعض أنواع البيانات إلى حقول نصية",
];

function StatusIcon({ status }) {
  if (status === "warning") return <AlertTriangle className="w-4 h-4 text-amber-500" />;
  if (status === "critical") return <XCircle className="w-4 h-4 text-red-500" />;
  return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
}

function CountPill({ type, count }) {
  const cfg = type === "all" ? "bg-slate-100 text-slate-700" : type === "good" ? "bg-emerald-50 text-emerald-700" : type === "warning" ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-700";
  const label = type === "all" ? "الجميع" : type === "good" ? "مكتمل" : type === "warning" ? "تحذير" : "عاجل";
  return <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${cfg}`}>{label} <b>{count}</b></span>;
}

export default function AdminSearchGeoAnalytics() {
  const [activeTab, setActiveTab] = useState("summary");
  const [loading, setLoading] = useState(false);
  const [geo, setGeo] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [aiEnabled, setAiEnabled] = useState(true);
  const [aiFixing, setAiFixing] = useState(false);
  const [aiFixResult, setAiFixResult] = useState(null);

  const loadGeo = async () => {
    setLoading(true);
    try {
      const res = await base44.functions.invoke("fetchRealtimeVisitors", {});
      setGeo(res.data || {});
      setLastUpdated(new Date());
    } catch (_) {
      setGeo(null);
    } finally { setLoading(false); }
  };
  useEffect(() => { loadGeo(); }, []);

  const handleAiFix = async () => {
    setAiFixing(true);
    setAiFixResult(null);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `أنت خبير في تحسين محركات البحث (SEO) وتحسين ظهور التطبيقات للذكاء الاصطناعي. حلل التطبيق الهندسي "بيتلي - المنظومة الهندسية المتكاملة" بناءً على التحذيرات التالية وقدّم خطة إصلاح عملية ومحددة لكل تحذير:
1. أنواع البيانات التي لم يتم تصنيفها بعد للبحث
2. تفتقر بعض أنواع البيانات إلى حقول نصية
لكل تحذير: اشرح السبب، واقترح إجراءات تصحيحية محددة قابلة للتنفيذ، والحقول/الكيانات المتأثرة. أجب بالعربية بصيغة مختصرة وواضحة.`,
        response_json_schema: {
          type: "object",
          properties: {
            fixes: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  warning: { type: "string" },
                  cause: { type: "string" },
                  actions: { type: "array", items: { type: "string" } },
                },
              },
            },
            summary: { type: "string" },
          },
        },
      });
      setAiFixResult(res);
    } catch (_) {
      setAiFixResult({ error: "تعذر تشغيل الإصلاح بالذكاء الاصطناعي حالياً. حاول مرة أخرى." });
    } finally {
      setAiFixing(false);
    }
  };

  const goodCount = 37;
  const warningCount = 2;
  const total = 39;
  const activeUsers = geo?.ga?.active_users ?? 0;
  const cities = geo?.ga?.cities || [];
  const sources = geo?.ga?.sources || [];
  const pages = geo?.ga?.pages || [];

  const tabs = [
    ["summary", "ملخص", Search],
    ["meta", "العلامات الوصفية", Tags],
    ["advanced", "الإعدادات المتقدمة", SlidersHorizontal],
  ];

  return (
    <div dir="rtl" className="min-h-screen bg-white text-slate-800">
      <div className="border-b border-slate-200 bg-white px-8 py-5">
        <div className="flex items-center justify-between gap-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center"><Search className="w-5 h-5 text-slate-700" /></div>
            <div>
              <div className="flex items-center gap-2"><h1 className="text-xl font-semibold">تحسين محركات البحث والتحليل الجغرافي</h1><span className="px-2 py-1 rounded-md text-[11px] bg-emerald-50 text-emerald-700">قابل للبحث</span></div>
              <p className="text-xs text-slate-500 mt-1">حسّن طريقة ظهور تطبيقك في نتائج البحث وإجابات الذكاء الاصطناعي، وتابع الوصول الجغرافي.</p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-500"><span>تفعيل تحسين محركات البحث لهذا التطبيق</span><button onClick={() => setAiEnabled(v => !v)} className={`w-10 h-6 rounded-full relative transition ${aiEnabled ? "bg-slate-800" : "bg-slate-300"}`}><span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${aiEnabled ? "right-1" : "right-5"}`} /></button></div>
        </div>
        <div className="mt-5 flex items-center gap-6 border-b border-slate-200 -mb-5">
          {tabs.map(([id, label, Icon]) => <button key={id} onClick={() => setActiveTab(id)} className={`pb-3 pt-1 text-sm flex items-center gap-2 border-b-2 ${activeTab === id ? "border-slate-900 text-slate-900 font-medium" : "border-transparent text-slate-500"}`}><Icon className="w-4 h-4" />{label}</button>)}
        </div>
      </div>

      {activeTab === "summary" && <main className="px-8 py-7 max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-5"><div><h2 className="text-lg font-semibold">تقييمك في محركات البحث</h2><p className="text-xs text-slate-500 mt-1">يسهل العثور على تطبيقك في نتائج البحث. استمر في التحسين لنيل الصدارة.</p></div><div className="flex gap-2"><button onClick={loadGeo} className="h-9 px-4 rounded-lg border border-slate-200 text-xs bg-white hover:bg-slate-50 flex items-center gap-2"><RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />إعادة المسح</button><button onClick={handleAiFix} disabled={aiFixing} className="h-9 px-4 rounded-lg bg-slate-900 text-white text-xs flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"><Bot className={`w-3.5 h-3.5 ${aiFixing ? "animate-pulse" : ""}`} />{aiFixing ? "جارٍ الإصلاح..." : "إصلاح باستخدام الذكاء الاصطناعي"}</button></div></div>
        <div className="flex gap-2 mb-5"><CountPill type="all" count={total} /><CountPill type="critical" count={0} /><CountPill type="warning" count={warningCount} /><CountPill type="good" count={goodCount} /></div>
        <div className="rounded-xl border border-slate-200 overflow-hidden bg-white">
          {warnings.map((text, i) => <div key={i} className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 hover:bg-slate-50 cursor-pointer"><div className="flex items-center gap-3"><AlertTriangle className="w-4 h-4 text-amber-500" /><span className="text-sm">{text}</span></div><ChevronLeft className="w-4 h-4 text-slate-400" /></div>)}
          {auditRows.map(([text, status], i) => <div key={i} className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 last:border-0 hover:bg-slate-50 cursor-pointer"><div className="flex items-center gap-3"><StatusIcon status={status} /><span className="text-sm">{text}</span></div><ChevronLeft className="w-4 h-4 text-slate-400" /></div>)}
        </div>

        {aiFixing && <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-5 flex items-center gap-3 text-sm text-slate-600"><RefreshCw className="w-4 h-4 animate-spin text-slate-500" />جارٍ تحليل التطبيق وتوليد خطة الإصلاح بالذكاء الاصطناعي...</div>}
        {aiFixResult && !aiFixing && (
          <div className="mt-5 rounded-xl border border-slate-200 bg-white overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50 flex items-center gap-2"><Bot className="w-4 h-4 text-slate-700" /><h3 className="text-sm font-semibold">خطة الإصلاح المقترحة</h3></div>
            {aiFixResult.error ? (
              <div className="px-5 py-4 text-sm text-red-600">{aiFixResult.error}</div>
            ) : (
              <div className="px-5 py-4 space-y-4">
                {aiFixResult.summary && <p className="text-xs text-slate-500 leading-6">{aiFixResult.summary}</p>}
                {(aiFixResult.fixes || []).map((fix, i) => (
                  <div key={i} className="rounded-lg border border-slate-100 p-4 bg-slate-50/50">
                    <div className="flex items-center gap-2 mb-2"><AlertTriangle className="w-4 h-4 text-amber-500" /><span className="text-sm font-medium">{fix.warning}</span></div>
                    {fix.cause && <p className="text-xs text-slate-600 mb-2 leading-6"><b>السبب:</b> {fix.cause}</p>}
                    {fix.actions && fix.actions.length > 0 && (
                      <ul className="text-xs text-slate-700 space-y-1.5 list-disc pr-4">
                        {fix.actions.map((a, j) => <li key={j} className="leading-6">{a}</li>)}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>}

      {activeTab === "meta" && <main className="px-8 py-7 max-w-6xl mx-auto space-y-5"><div><h2 className="text-lg font-semibold">العلامات الوصفية</h2><p className="text-xs text-slate-500 mt-1">إدارة ومراجعة البيانات التي تساعد محركات البحث على فهم صفحات التطبيق.</p></div><div className="grid grid-cols-1 md:grid-cols-3 gap-4"><div className="border rounded-xl p-5"><p className="text-xs text-slate-500">عناوين الصفحات</p><p className="text-2xl font-semibold mt-2">مكتملة</p></div><div className="border rounded-xl p-5"><p className="text-xs text-slate-500">الأوصاف</p><p className="text-2xl font-semibold mt-2">مكتملة</p></div><div className="border rounded-xl p-5"><p className="text-xs text-slate-500">Schema</p><p className="text-2xl font-semibold mt-2">مفعلة</p></div></div><div className="border rounded-xl overflow-hidden">{["عنوان الصفحة المفضل", "الوصف التعريفي", "البيانات المنظمة Schema", "الصور ووسوم ALT", "Canonical URL", "Open Graph / X Cards"].map((x,i)=><div key={i} className="px-5 py-4 border-b last:border-0 flex items-center justify-between"><span className="text-sm">{x}</span><span className="text-xs text-emerald-700 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" />مكتمل</span></div>)}</div></main>}

      {activeTab === "advanced" && <main className="px-8 py-7 max-w-6xl mx-auto space-y-5"><div><h2 className="text-lg font-semibold">الإعدادات المتقدمة</h2><p className="text-xs text-slate-500 mt-1">إعدادات الزحف والفهرسة والذكاء الاصطناعي والوصول إلى البيانات.</p></div>{["السماح لمحركات البحث بالزحف", "خريطة الموقع مفعلة", "Robots.txt مهيأ", "دليل الموقع القابل للقراءة بواسطة الذكاء الاصطناعي", "السماح لأدوات الذكاء الاصطناعي بقراءة التطبيق", "السماح بالوصول إلى أدوات الذكاء الاصطناعي", "النطاق المخصص مضبوط", "HTTPS مفعل"].map((x,i)=><div key={i} className="border rounded-xl px-5 py-4 flex items-center justify-between"><span className="text-sm">{x}</span><span className="text-xs text-emerald-700 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" />مفعل</span></div>)}</main>}

      {lastUpdated && <div className="text-center text-[10px] text-slate-400 pb-4">آخر تحديث للتحليل الجغرافي: {lastUpdated.toLocaleString("ar-SA")}</div>}
    </div>
  );
}