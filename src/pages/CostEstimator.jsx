import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calculator, Building2, Layers, Hammer, ChevronRight,
  ChevronDown, Loader2, CheckCircle, Send, Star, MapPin,
  RefreshCw, AlertCircle, ArrowLeft, Home, TrendingUp
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const FINISH_TYPES = [
  { value: "economy", label: "اقتصادي", desc: "بناء خام بمواد معيارية دون تشطيب داخلي متكامل", multiplier: 1.0, color: "bg-slate-100 text-slate-700" },
  { value: "standard", label: "متوسط", desc: "تشطيب جيد بمواد متوسطة الجودة", multiplier: 1.45, color: "bg-blue-100 text-blue-700" },
  { value: "luxury", label: "فاخر", desc: "تشطيب راقٍ بمواد عالية الجودة", multiplier: 2.1, color: "bg-amber-100 text-amber-700" },
  { value: "ultra", label: "فاخر جداً", desc: "مواد استيراد ومعمار خاص وتصميم مخصص", multiplier: 2.9, color: "bg-purple-100 text-purple-700" },
];

// أسعار السوق السعودي - مارس 2024 (ريال/م² للمساحة المبنية - مستوى اقتصادي كقاعدة)
const BUILDING_TYPES = [
  { value: "villa",      label: "فيلا سكنية",    icon: "🏡", base_cost: 1800 },
  { value: "apartment", label: "شقق سكنية",     icon: "🏢", base_cost: 1600 },
  { value: "commercial",label: "مبنى تجاري",    icon: "🏬", base_cost: 2000 },
  { value: "warehouse", label: "مستودع / صناعي",icon: "🏭", base_cost: 900  },
  { value: "duplex",    label: "دوبلكس",        icon: "🏘", base_cost: 1700 },
];

const REGIONS = [
  { value: "riyadh", label: "الرياض", factor: 1.0 },
  { value: "jeddah", label: "جدة", factor: 1.05 },
  { value: "dammam", label: "الدمام / الخبر", factor: 0.98 },
  { value: "makkah", label: "مكة المكرمة", factor: 1.1 },
  { value: "madinah", label: "المدينة المنورة", factor: 1.02 },
  { value: "other", label: "مناطق أخرى", factor: 0.92 },
];

function formatCurrency(value) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)} مليون ريال`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)} ألف ريال`;
  return `${value.toFixed(0)} ريال`;
}

export default function CostEstimator() {
  const [step, setStep] = useState(1); // 1=form, 2=result
  const [isCalculating, setIsCalculating] = useState(false);
  const [result, setResult] = useState(null);
  const [engineers, setEngineers] = useState([]);
  const [firms, setFirms] = useState([]);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestNote, setRequestNote] = useState("");
  const [sentTo, setSentTo] = useState([]);
  const [isSending, setIsSending] = useState(false);
  const [user, setUser] = useState(null);

  const [form, setForm] = useState({
    land_area: "",
    floors: 1,
    building_type: "villa",
    finish_type: "standard",
    region: "riyadh",
    has_basement: false,
    has_pool: false,
    has_elevator: false,
    notes: "",
  });

  useEffect(() => {
    base44.auth.me().then(u => setUser(u)).catch(() => {});
    base44.entities.Engineer.filter({ status: "approved" }, "-rating", 10).then(setEngineers);
    base44.entities.EngineeringFirm.list("-created_date", 10).then(setFirms);
  }, []);

  const f = (key) => (val) => setForm(p => ({ ...p, [key]: val }));

  const handleCalculate = async () => {
    if (!form.land_area || isNaN(form.land_area)) return;
    setIsCalculating(true);

    const buildingType = BUILDING_TYPES.find(b => b.value === form.building_type);
    const finishType = FINISH_TYPES.find(f => f.value === form.finish_type);
    const region = REGIONS.find(r => r.value === form.region);

    const builtArea = parseFloat(form.land_area) * form.floors * 0.65; // 65% coverage
    const baseCost = buildingType.base_cost * finishType.multiplier * region.factor;

    let total = builtArea * baseCost;
    const extras = [];

    if (form.has_basement) { const bCost = parseFloat(form.land_area) * 950; total += bCost; extras.push({ label: "بدروم", cost: bCost }); }
    if (form.has_pool) { total += 180000; extras.push({ label: "مسبح", cost: 180000 }); }
    if (form.has_elevator) { total += 130000; extras.push({ label: "مصعد", cost: 130000 }); }

    const infra = total * 0.12; // بنية تحتية
    const design = total * 0.06; // تصميم

    const grandTotal = total + infra + design;

    // AI enhancement
    let aiInsights = null;
    try {
      const aiRes = await base44.integrations.Core.InvokeLLM({
        prompt: `أنت خبير تقدير تكاليف البناء في السعودية. المشروع: ${buildingType.label}، مساحة الأرض: ${form.land_area} م²، ${form.floors} أدوار، تشطيب ${finishType.label}، منطقة ${region.label}. قدم 3 ملاحظات مهنية مختصرة جداً لترشيد التكلفة أو تنبيهات مهمة. أجب بـ JSON فقط: {"tips": ["نص1","نص2","نص3"], "risk": "low|medium|high"}`,
        response_json_schema: {
          type: "object",
          properties: {
            tips: { type: "array", items: { type: "string" } },
            risk: { type: "string" }
          }
        }
      });
      aiInsights = aiRes;
    } catch (e) {}

    setResult({
      builtArea: Math.round(builtArea),
      baseCostPerMeter: Math.round(baseCost),
      constructionCost: Math.round(total),
      infraCost: Math.round(infra),
      designCost: Math.round(design),
      extras,
      grandTotal: Math.round(grandTotal),
      minTotal: Math.round(grandTotal * 0.85),
      maxTotal: Math.round(grandTotal * 1.2),
      aiInsights,
      buildingType: buildingType.label,
      finishType: finishType.label,
      region: region.label,
    });

    setIsCalculating(false);
    setStep(2);
  };

  const handleSendRequests = async () => {
    if (!user) { base44.auth.redirectToLogin(); return; }
    setIsSending(true);
    const targets = [...engineers.slice(0, 3), ...firms.slice(0, 2)];
    for (const target of targets) {
      try {
        const targetEmail = target.email;
        if (!targetEmail) continue;
        const existing = await base44.entities.Conversation.filter({ participants: user.email });
        const conv = existing.find(c => c.participants?.includes(targetEmail)) ||
          await base44.entities.Conversation.create({
            project_id: "quote_request",
            participants: [user.email, targetEmail],
            type: "direct",
            name: target.full_name || target.company_name,
          });
        await base44.entities.Message.create({
          conversation_id: conv.id,
          project_id: "quote_request",
          sender_email: user.email,
          sender_name: user.full_name,
          content: `📊 طلب عرض سعر - تقدير تكاليف بناء\n\n🏗️ نوع المشروع: ${result.buildingType}\n📐 مساحة الأرض: ${form.land_area} م²\n🏢 عدد الأدوار: ${form.floors}\n✨ مستوى التشطيب: ${result.finishType}\n📍 المنطقة: ${result.region}\n💰 التكلفة التقديرية: ${formatCurrency(result.minTotal)} - ${formatCurrency(result.maxTotal)}\n\n${requestNote ? `ملاحظات: ${requestNote}` : ""}\n\nأرجو تقديم عرض سعرك للمشروع.`,
        });
        setSentTo(p => [...p, target.full_name || target.company_name]);
      } catch (e) {}
    }
    setIsSending(false);
    setShowRequestModal(false);
  };

  const selectedFinish = FINISH_TYPES.find(f => f.value === form.finish_type);
  const selectedBuilding = BUILDING_TYPES.find(b => b.value === form.building_type);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-amber-50/30" dir="rtl">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
          <div className="w-16 h-16 bg-gradient-to-br from-[#6B5D4F] to-[#C9A66B] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Calculator className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-[#4A3F35]">حاسبة تكاليف البناء</h1>
          <p className="text-slate-500 mt-2 max-w-lg mx-auto">احصل على تقدير دقيق لتكاليف مشروعك واطلب عروض أسعار من المكاتب الهندسية المسجلة</p>
        </motion.div>

        {/* Steps */}
        <div className="flex items-center justify-center gap-4 mb-8">
          {[{ n: 1, label: "بيانات المشروع" }, { n: 2, label: "نتيجة التقدير" }].map(s => (
            <div key={s.n} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${step >= s.n ? "bg-[#C9A66B] text-white" : "bg-slate-200 text-slate-500"}`}>
                {step > s.n ? <CheckCircle className="w-4 h-4" /> : s.n}
              </div>
              <span className={`text-sm ${step >= s.n ? "text-[#4A3F35] font-medium" : "text-slate-400"}`}>{s.label}</span>
              {s.n < 2 && <ChevronRight className="w-4 h-4 text-slate-300" />}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="form" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left: Basic Info */}
                <div className="space-y-5">
                  <Card className="border-0 shadow-md">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2 text-[#4A3F35]">
                        <Home className="w-4 h-4 text-[#C9A66B]" /> معلومات المشروع
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Building Type */}
                      <div>
                        <Label className="text-sm mb-2 block">نوع المبنى</Label>
                        <div className="grid grid-cols-2 gap-2">
                          {BUILDING_TYPES.map(b => (
                            <button
                              key={b.value}
                              onClick={() => f("building_type")(b.value)}
                              className={`p-3 rounded-xl border-2 text-right transition-all text-sm ${form.building_type === b.value ? "border-[#C9A66B] bg-amber-50" : "border-slate-200 hover:border-slate-300"}`}
                            >
                              <span className="text-lg">{b.icon}</span>
                              <p className="font-medium text-slate-700 mt-1">{b.label}</p>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Region */}
                      <div>
                        <Label className="text-sm mb-2 flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> المنطقة</Label>
                        <Select value={form.region} onValueChange={f("region")}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {REGIONS.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Land Area */}
                      <div>
                        <Label className="text-sm mb-2 block">مساحة الأرض (م²) *</Label>
                        <Input
                          type="number"
                          placeholder="مثال: 400"
                          value={form.land_area}
                          onChange={e => f("land_area")(e.target.value)}
                          className="text-lg font-semibold"
                        />
                      </div>

                      {/* Floors */}
                      <div>
                        <Label className="text-sm mb-2 block">عدد الأدوار: <span className="font-bold text-[#C9A66B]">{form.floors}</span></Label>
                        <Slider
                          min={1} max={10} step={1}
                          value={[form.floors]}
                          onValueChange={([v]) => f("floors")(v)}
                          className="mt-2"
                        />
                        <div className="flex justify-between text-xs text-slate-400 mt-1">
                          <span>1 دور</span><span>10 أدوار</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Right: Finish & Extras */}
                <div className="space-y-5">
                  <Card className="border-0 shadow-md">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2 text-[#4A3F35]">
                        <Hammer className="w-4 h-4 text-[#C9A66B]" /> مستوى التشطيب
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {FINISH_TYPES.map(f_ => (
                        <button
                          key={f_.value}
                          onClick={() => f("finish_type")(f_.value)}
                          className={`w-full p-3 rounded-xl border-2 text-right transition-all ${form.finish_type === f_.value ? "border-[#C9A66B] bg-amber-50" : "border-slate-200 hover:border-slate-300"}`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${f_.color}`}>{f_.label}</span>
                              <p className="text-xs text-slate-500 mt-1">{f_.desc}</p>
                            </div>
                            <span className="text-xs font-medium text-slate-400">×{f_.multiplier}</span>
                          </div>
                        </button>
                      ))}
                    </CardContent>
                  </Card>

                  <Card className="border-0 shadow-md">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2 text-[#4A3F35]">
                        <Layers className="w-4 h-4 text-[#C9A66B]" /> إضافات
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {[
                        { key: "has_basement", label: "بدروم", cost: "950 ر/م²" },
                        { key: "has_pool", label: "مسبح", cost: "180,000 ر" },
                        { key: "has_elevator", label: "مصعد", cost: "130,000 ر" },
                      ].map(item => (
                        <label key={item.key} className="flex items-center justify-between p-3 rounded-xl border cursor-pointer hover:bg-slate-50">
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={form[item.key]}
                              onChange={e => f(item.key)(e.target.checked)}
                              className="w-4 h-4 accent-[#C9A66B]"
                            />
                            <span className="text-sm font-medium text-slate-700">{item.label}</span>
                          </div>
                          <span className="text-xs text-slate-400">{item.cost}</span>
                        </label>
                      ))}

                      <div className="pt-1">
                        <Label className="text-sm mb-1.5 block">ملاحظات إضافية</Label>
                        <Textarea
                          placeholder="أي تفاصيل أخرى..."
                          value={form.notes}
                          onChange={e => f("notes")(e.target.value)}
                          rows={2}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              <div className="mt-6 text-center">
                <Button
                  onClick={handleCalculate}
                  disabled={!form.land_area || isCalculating}
                  className="bg-gradient-to-r from-[#6B5D4F] to-[#C9A66B] text-white px-10 py-6 text-lg rounded-2xl shadow-lg hover:shadow-xl transition-all gap-3"
                >
                  {isCalculating ? (
                    <><Loader2 className="w-5 h-5 animate-spin" /> جاري الحساب...</>
                  ) : (
                    <><Calculator className="w-5 h-5" /> احسب التكلفة التقديرية</>
                  )}
                </Button>
                <p className="text-xs text-slate-400 mt-2">التقدير تقريبي بناءً على أسعار السوق الحالية</p>
              </div>
            </motion.div>
          )}

          {step === 2 && result && (
            <motion.div key="result" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Card className="border-0 shadow-lg bg-gradient-to-br from-[#4A3F35] to-[#6B5D4F] text-white md:col-span-2">
                  <CardContent className="p-6">
                    <p className="text-white/70 text-sm mb-1">إجمالي التكلفة التقديرية</p>
                    <p className="text-4xl font-bold">{formatCurrency(result.grandTotal)}</p>
                    <p className="text-white/60 text-sm mt-2">
                      النطاق: {formatCurrency(result.minTotal)} — {formatCurrency(result.maxTotal)}
                    </p>
                    <div className="flex flex-wrap gap-2 mt-4">
                      <Badge className="bg-white/20 text-white border-0">{result.buildingType}</Badge>
                      <Badge className="bg-white/20 text-white border-0">{result.finishType}</Badge>
                      <Badge className="bg-white/20 text-white border-0">{result.region}</Badge>
                      <Badge className="bg-white/20 text-white border-0">{form.land_area} م² - {form.floors} أدوار</Badge>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-0 shadow-md">
                  <CardContent className="p-5 space-y-3">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-[#C9A66B]">{result.builtArea.toLocaleString()} م²</p>
                      <p className="text-xs text-slate-500">المساحة المبنية</p>
                    </div>
                    <div className="text-center border-t pt-3">
                      <p className="text-2xl font-bold text-slate-700">{result.baseCostPerMeter.toLocaleString()}</p>
                      <p className="text-xs text-slate-500">ريال / م²</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Cost Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
                <Card className="border-0 shadow-md">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base text-[#4A3F35]">تفاصيل التكلفة</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {[
                      { label: "تكلفة الإنشاء والتشطيب", value: result.constructionCost, color: "text-[#4A3F35]" },
                      { label: "البنية التحتية والخدمات (12%)", value: result.infraCost, color: "text-blue-600" },
                      { label: "التصميم والإشراف (6%)", value: result.designCost, color: "text-purple-600" },
                      ...result.extras.map(e => ({ label: e.label, value: e.cost, color: "text-orange-600" })),
                    ].map((item, i) => (
                      <div key={i} className="flex items-center justify-between py-2 border-b last:border-0">
                        <span className="text-sm text-slate-600">{item.label}</span>
                        <span className={`font-semibold text-sm ${item.color}`}>{formatCurrency(item.value)}</span>
                      </div>
                    ))}
                    <div className="flex items-center justify-between pt-2 border-t-2 border-[#C9A66B]">
                      <span className="font-bold text-[#4A3F35]">الإجمالي</span>
                      <span className="font-bold text-[#C9A66B] text-lg">{formatCurrency(result.grandTotal)}</span>
                    </div>
                  </CardContent>
                </Card>

                {/* AI Insights */}
                {result.aiInsights && (
                  <Card className="border-0 shadow-md border-r-4 border-r-[#C9A66B]">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base text-[#4A3F35] flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-[#C9A66B]" /> توصيات ذكية
                        <Badge className={`mr-auto text-xs ${result.aiInsights.risk === "low" ? "bg-green-100 text-green-700" : result.aiInsights.risk === "high" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"}`}>
                          مخاطرة {result.aiInsights.risk === "low" ? "منخفضة" : result.aiInsights.risk === "high" ? "مرتفعة" : "متوسطة"}
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {result.aiInsights.tips?.map((tip, i) => (
                        <div key={i} className="flex items-start gap-2 p-2 bg-amber-50 rounded-lg">
                          <CheckCircle className="w-4 h-4 text-[#C9A66B] mt-0.5 flex-shrink-0" />
                          <p className="text-sm text-slate-700">{tip}</p>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* CTA */}
              {sentTo.length > 0 ? (
                <Card className="border-0 shadow-md bg-green-50 border border-green-200">
                  <CardContent className="p-5 flex items-center gap-3">
                    <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-green-700">تم إرسال طلب عرض السعر!</p>
                      <p className="text-sm text-green-600">إلى: {sentTo.join("، ")}</p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="border-0 shadow-md">
                  <CardContent className="p-5">
                    <div className="flex flex-col sm:flex-row items-center gap-4">
                      <div className="flex-1">
                        <h3 className="font-semibold text-[#4A3F35]">احصل على عرض سعر حقيقي</h3>
                        <p className="text-sm text-slate-500 mt-1">أرسل هذا التقدير إلى المكاتب الهندسية والمهندسين المسجلين للحصول على عروض أسعار فعلية</p>
                        <p className="text-xs text-slate-400 mt-1">{engineers.length} مهندس و {firms.length} شركة متاحون</p>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <Button
                          onClick={() => setShowRequestModal(true)}
                          className="bg-gradient-to-r from-[#6B5D4F] to-[#C9A66B] text-white gap-2"
                        >
                          <Send className="w-4 h-4" /> طلب عروض أسعار
                        </Button>
                        <Button variant="outline" onClick={() => { setStep(1); setResult(null); }} className="gap-2">
                          <RefreshCw className="w-4 h-4" /> إعادة الحساب
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Nearby Engineers */}
              {engineers.length > 0 && (
                <div className="mt-6">
                  <h3 className="font-semibold text-[#4A3F35] mb-3 flex items-center gap-2">
                    <Star className="w-4 h-4 text-[#C9A66B]" /> مهندسون ومكاتب مقترحة
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {[...engineers.slice(0, 3)].map(eng => (
                      <Card key={eng.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                        <CardContent className="p-4 flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#6B5D4F] to-[#C9A66B] flex items-center justify-center text-white font-bold flex-shrink-0">
                            {eng.full_name?.charAt(0)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm text-slate-800 truncate">{eng.full_name}</p>
                            <p className="text-xs text-slate-500 truncate">{eng.specialization}</p>
                            {eng.rating > 0 && (
                              <div className="flex items-center gap-1 mt-0.5">
                                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                                <span className="text-xs font-medium">{eng.rating?.toFixed(1)}</span>
                              </div>
                            )}
                          </div>
                          <Link to={createPageUrl("EngineerProfile") + `?id=${eng.id}`}>
                            <Button size="sm" variant="ghost" className="text-xs px-2">عرض</Button>
                          </Link>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Request Modal */}
      <Dialog open={showRequestModal} onOpenChange={setShowRequestModal}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-right text-[#4A3F35]">إرسال طلب عرض سعر</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-amber-50 p-3 rounded-lg text-sm text-slate-600">
              سيتم إرسال تفاصيل التقدير التلقائي إلى أفضل المهندسين والمكاتب المسجلة في المنصة
            </div>
            <div>
              <Label className="text-sm mb-1.5 block">ملاحظات إضافية للمكاتب (اختياري)</Label>
              <Textarea
                placeholder="أي تفاصيل إضافية أو متطلبات خاصة..."
                value={requestNote}
                onChange={e => setRequestNote(e.target.value)}
                rows={3}
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleSendRequests}
                disabled={isSending}
                className="flex-1 bg-gradient-to-r from-[#6B5D4F] to-[#C9A66B] text-white gap-2"
              >
                {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                إرسال الطلبات
              </Button>
              <Button variant="outline" onClick={() => setShowRequestModal(false)}>إلغاء</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}