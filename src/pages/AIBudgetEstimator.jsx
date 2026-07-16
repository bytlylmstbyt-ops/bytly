import React, { useState } from "react";
import { Calculator, ArrowRight, Sparkles, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import AIChat from "@/components/ai/AIChat";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import MobileSelect from "@/components/mobile/MobileSelect";

const cities = ["الرياض", "جدة", "الدمام", "مكة المكرمة", "المدينة المنورة", "الخبر", "تبوك", "أبها", "أخرى"];
const finishTypes = [
  { id: "economy", label: "اقتصادي", emoji: "💚", desc: "مواد جيدة بأسعار معقولة" },
  { id: "mid", label: "متوسط", emoji: "💙", desc: "مواد متميزة وتشطيب جيد" },
  { id: "luxury", label: "فاخر", emoji: "💛", desc: "أعلى جودة وتشطيب استثنائي" },
];

const SYSTEM_PROMPT = `أنت خبير تقدير تكاليف البناء والتشطيب في السوق السعودي من فريق Bytly AI Engineers.

عند طلب تقدير التكلفة، قدم:

## تحليل التكلفة التفصيلي
قدم جدولاً واضحاً لكل بند:

### 1. أعمال البنية التحتية والهيكل (ريال سعودي/م²)
### 2. أعمال التشطيبات الداخلية
### 3. الكهرباء والسباكة والتكييف
### 4. المطبخ والحمامات
### 5. الأعمال الخارجية والتشجير

## الميزانيات الثلاث
| البند | اقتصادي | متوسط | فاخر |
|-------|---------|-------|------|

## ملخص الإجماليات (ريال سعودي)
- **الحد الأدنى (اقتصادي):** X ريال
- **الميزانية المتوسطة:** X ريال  
- **الميزانية الفاخرة:** X ريال

## توصيات للتوفير
نصائح عملية لتوفير التكاليف دون التأثير على الجودة.

استخدم أسعار السوق السعودي الحالية كمرجع. العملة دائماً ريال سعودي (SAR).
⚠️ أكد أن الأسعار تقديرية وقد تتغير حسب ظروف السوق. يُنصح بأخذ عروض أسعار من مقاولين معتمدين.`;

export default function AIBudgetEstimator() {
  const [form, setForm] = useState({ area: "", city: "", floors: "", finish: "", projectType: "فيلا سكنية" });
  const [estimating, setEstimating] = useState(false);
  const [quickEstimate, setQuickEstimate] = useState(null);
  const [chatStarted, setChatStarted] = useState(false);

  const generateQuickEstimate = async () => {
    setEstimating(true);
    const area = parseFloat(form.area) || 300;
    const rates = { economy: 1200, mid: 1800, luxury: 2800 };
    const cityMultipliers = { "الرياض": 1.0, "جدة": 1.05, "مكة المكرمة": 1.1, "الدمام": 0.95, "الخبر": 0.95 };
    const mult = cityMultipliers[form.city] || 1.0;
    const floors = parseInt(form.floors) || 1;
    const buildArea = area * floors * 0.7;

    setQuickEstimate({
      economy: Math.round(buildArea * rates.economy * mult),
      mid: Math.round(buildArea * rates.mid * mult),
      luxury: Math.round(buildArea * rates.luxury * mult),
      buildArea: Math.round(buildArea),
    });
    setEstimating(false);
  };

  const formatSAR = (n) => new Intl.NumberFormat("ar-SA").format(n) + " ريال";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800" dir="rtl">
      <div className="bg-slate-900/80 border-b border-white/10 px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center gap-3">
          <Link to="/AIEngineers">
            <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white gap-1">
              <ArrowRight className="w-4 h-4" />رجوع
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
              <Calculator className="w-4 h-4 text-white" />
            </div>
            <span className="text-white font-bold">مقدّر التكلفة الذكي</span>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 flex flex-col lg:flex-row gap-6" style={{ height: "calc(100vh - 65px)" }}>
        {/* Left */}
        <div className="lg:w-80 flex-shrink-0 space-y-4 overflow-y-auto">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-400" />
              <span className="text-white font-medium text-sm">تقدير سريع</span>
            </div>

            <div>
              <label className="text-xs text-slate-400 mb-1 block">نوع المشروع</label>
              <MobileSelect
                value={form.projectType}
                onValueChange={(v) => setForm(p => ({ ...p, projectType: v }))}
                placeholder="اختر نوع المشروع"
                label="نوع المشروع"
                options={[
                  { value: "فيلا سكنية", label: "فيلا سكنية" },
                  { value: "شقة سكنية", label: "شقة سكنية" },
                  { value: "مبنى استثماري", label: "مبنى استثماري" },
                  { value: "استراحة", label: "استراحة" },
                  { value: "مكاتب تجارية", label: "مكاتب تجارية" },
                  { value: "محلات تجارية", label: "محلات تجارية" },
                ]}
                triggerClassName="!bg-white/5 !border-white/10 rounded-xl !text-white"
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 mb-1 block">مساحة الأرض (م²)</label>
              <input
                type="number"
                value={form.area}
                onChange={e => setForm(p => ({ ...p, area: e.target.value }))}
                placeholder="مثال: 375"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 outline-none focus:border-green-500/50"
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 mb-1 block">عدد الطوابق</label>
              <input
                type="number"
                value={form.floors}
                onChange={e => setForm(p => ({ ...p, floors: e.target.value }))}
                placeholder="مثال: 2"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 outline-none focus:border-green-500/50"
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 mb-1 block">المدينة</label>
              <MobileSelect
                value={form.city}
                onValueChange={(v) => setForm(p => ({ ...p, city: v }))}
                placeholder="اختر المدينة"
                label="المدينة"
                options={cities.map(c => ({ value: c, label: c }))}
                triggerClassName="!bg-white/5 !border-white/10 rounded-xl !text-white"
              />
            </div>

            <Button
              onClick={generateQuickEstimate}
              disabled={!form.area || estimating}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0"
            >
              {estimating ? "جاري الحساب..." : "احسب الآن"}
            </Button>
          </div>

          {/* Quick estimate result */}
          {quickEstimate && (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3">
              <p className="text-xs text-slate-400">مساحة البناء التقديرية: <span className="text-white">{quickEstimate.buildArea} م²</span></p>
              {finishTypes.map(f => (
                <div key={f.id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                  <span className="text-sm text-slate-300">{f.emoji} {f.label}</span>
                  <span className={`font-bold text-sm ${f.id === "luxury" ? "text-amber-400" : f.id === "mid" ? "text-blue-400" : "text-green-400"}`}>
                    {formatSAR(quickEstimate[f.id === "economy" ? "economy" : f.id === "mid" ? "mid" : "luxury"])}
                  </span>
                </div>
              ))}
              <Button
                onClick={() => setChatStarted(true)}
                size="sm"
                className="w-full bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30"
              >
                <Sparkles className="w-3 h-3 ml-1" />
                تحليل مفصل بالذكاء الاصطناعي
              </Button>
            </div>
          )}
        </div>

        {/* Chat */}
        <div className="flex-1 min-h-0">
          <AIChat
            agentId="budget"
            agentName="مقدّر التكلفة الذكي"
            agentIcon={<Calculator className="w-5 h-5" />}
            agentColor="from-green-500 to-emerald-500"
            systemPrompt={SYSTEM_PROMPT}
            placeholder="أخبرني عن مشروعك: المساحة، المدينة، التشطيبات المطلوبة..."
            initialMessage={chatStarted && form.area
              ? `أريد تقدير تكلفة مشروع بالمواصفات التالية:\n- نوع المشروع: ${form.projectType}\n- مساحة الأرض: ${form.area} م²\n- عدد الطوابق: ${form.floors || 1}\n- المدينة: ${form.city || "الرياض"}\n\nأعطني تقديراً تفصيلياً بالأنواع الثلاث.`
              : undefined}
          />
        </div>
      </div>
    </div>
  );
}