import { useState, useMemo } from "react";
import { Calculator, TrendingUp, TrendingDown, DollarSign, Users, Briefcase, Target, ChevronDown, ChevronUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";

const formatSAR = (num) => new Intl.NumberFormat("ar-SA", { style: "currency", currency: "SAR", maximumFractionDigits: 0 }).format(num);

function InputRow({ label, value, onChange, min, max, step, suffix }) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium text-[#6B5D4F]">{label}</span>
        <span className="text-sm font-bold text-[#C9A66B]">{value.toLocaleString("ar-SA")} {suffix}</span>
      </div>
      <Slider
        value={[value]}
        onValueChange={([v]) => onChange(v)}
        min={min}
        max={max}
        step={step}
        className="w-full"
      />
      <div className="flex justify-between text-xs text-slate-400">
        <span>{min.toLocaleString("ar-SA")}</span>
        <span>{max.toLocaleString("ar-SA")}</span>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color, sub }) {
  return (
    <Card className={`border-l-4 ${color}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 mb-1">{title}</p>
            <p className="text-xl font-bold text-slate-800">{value}</p>
            {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
          </div>
          <Icon className="w-8 h-8 text-slate-300" />
        </div>
      </CardContent>
    </Card>
  );
}

export default function BudgetCalculator() {
  // المدخلات
  const [projectsPerMonth, setProjectsPerMonth] = useState(20);
  const [avgContractValue, setAvgContractValue] = useState(15000);
  const [platformCommission, setPlatformCommission] = useState(8);
  const [marketingBudget, setMarketingBudget] = useState(10000);
  const [activeEngineers, setActiveEngineers] = useState(50);
  const [subscriptionRevenue, setSubscriptionRevenue] = useState(30);
  const [commissionFromBoth, setCommissionFromBoth] = useState(true);
  const [showDetails, setShowDetails] = useState(false);
  const [chatInteractionsPerProject, setChatInteractionsPerProject] = useState(10);
  const [creditCostSAR, setCreditCostSAR] = useState(0.05); // تكلفة النقطة الواحدة بالريال

  // التكاليف الثابتة التقريبية
  const BASE44_COST = 1500;
  const SUPPORT_COST = 3000;
  const LEGAL_COST = 2000;

  // نقاط Base44 لكل مشروع
  const CREDITS_PER_CHAT_MSG = 3;       // InvokeLLM Automatic
  const CREDITS_PER_SUMMARY = 3;        // generateProjectSummary
  const CREDITS_PER_MILESTONE_EMAIL = 2; // automation + sendEmail
  const AVG_MILESTONES = 5;
  const AVG_SUMMARIES = 2;

  const calc = useMemo(() => {
    const commissionMultiplier = commissionFromBoth ? 2 : 1;
    const commissionRate = (platformCommission / 100) * commissionMultiplier;

    const projectRevenue = projectsPerMonth * avgContractValue * commissionRate;
    const subscriptionMonthly = activeEngineers * (subscriptionRevenue / 100) * 249;
    const totalRevenue = projectRevenue + subscriptionMonthly;

    // حساب نقاط الذكاء الاصطناعي لكل مشروع
    const creditsPerProject =
      (chatInteractionsPerProject * CREDITS_PER_CHAT_MSG) +
      (AVG_SUMMARIES * CREDITS_PER_SUMMARY) +
      (AVG_MILESTONES * CREDITS_PER_MILESTONE_EMAIL);
    const aiCostPerProject = creditsPerProject * creditCostSAR;
    const aiCosts = projectsPerMonth * aiCostPerProject;

    const totalCosts = BASE44_COST + aiCosts + marketingBudget + SUPPORT_COST + LEGAL_COST;

    const netProfit = totalRevenue - totalCosts;
    const breakEvenProjects = Math.ceil(totalCosts / (avgContractValue * commissionRate));
    const roi = totalCosts > 0 ? ((netProfit / totalCosts) * 100) : 0;
    const cac = activeEngineers > 0 ? marketingBudget / activeEngineers : 0;

    return { projectRevenue, subscriptionMonthly, totalRevenue, aiCosts, totalCosts, netProfit, breakEvenProjects, roi, cac, creditsPerProject, aiCostPerProject };
  }, [projectsPerMonth, avgContractValue, platformCommission, marketingBudget, activeEngineers, subscriptionRevenue, commissionFromBoth]);

  const isProfit = calc.netProfit >= 0;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6" dir="rtl">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Calculator className="w-8 h-8 text-[#C9A66B]" />
          <h1 className="text-2xl font-bold text-[#4A3F35]">حاسبة ميزانية الانطلاق</h1>
        </div>
        <p className="text-slate-500 text-sm">حدّد توقعاتك لتعرف متى تصل لنقطة التعادل</p>
      </div>

      {/* النتائج الرئيسية */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard title="الإيرادات الشهرية" value={formatSAR(calc.totalRevenue)} icon={TrendingUp} color="border-green-400" />
        <StatCard title="التكاليف الشهرية" value={formatSAR(calc.totalCosts)} icon={TrendingDown} color="border-red-400" />
        <StatCard
          title="صافي الربح"
          value={formatSAR(calc.netProfit)}
          icon={DollarSign}
          color={isProfit ? "border-[#C9A66B]" : "border-orange-400"}
          sub={isProfit ? "✅ ربحي" : "⚠️ خسارة"}
        />
        <StatCard title="نقطة التعادل" value={`${calc.breakEvenProjects} مشروع`} icon={Target} color="border-blue-400" sub="شهرياً" />
      </div>

      {/* مؤشر الصحة المالية */}
      <Card>
        <CardContent className="p-5">
          <div className="flex justify-between items-center mb-2">
            <span className="font-semibold text-[#4A3F35]">الصحة المالية للمنصة</span>
            <Badge className={isProfit ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"}>
              {isProfit ? `عائد على الاستثمار: ${calc.roi.toFixed(0)}%` : "تحتاج مراجعة"}
            </Badge>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-4">
            <div
              className={`h-4 rounded-full transition-all duration-500 ${isProfit ? "bg-gradient-to-r from-[#C9A66B] to-green-500" : "bg-gradient-to-r from-orange-400 to-red-400"}`}
              style={{ width: `${Math.min(100, Math.max(5, (calc.totalRevenue / Math.max(calc.totalCosts, 1)) * 50))}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-slate-400 mt-1">
            <span>خسارة</span>
            <span>نقطة التعادل</span>
            <span>ربح مرتفع</span>
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-5">
        {/* المدخلات */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-[#4A3F35] flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-[#C9A66B]" /> مدخلات المشاريع
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <InputRow label="عدد المشاريع شهرياً" value={projectsPerMonth} onChange={setProjectsPerMonth} min={1} max={200} step={1} suffix="مشروع" />
            <InputRow label="متوسط قيمة العقد" value={avgContractValue} onChange={setAvgContractValue} min={1000} max={500000} step={1000} suffix="ريال" />
            <InputRow label="عمولة المنصة %" value={platformCommission} onChange={setPlatformCommission} min={1} max={20} step={0.5} suffix="%" />

            <div className="flex items-center justify-between pt-2 border-t">
              <span className="text-sm text-[#6B5D4F]">عمولة من الطرفين؟</span>
              <button
                onClick={() => setCommissionFromBoth(!commissionFromBoth)}
                className={`w-12 h-6 rounded-full transition-colors ${commissionFromBoth ? "bg-[#C9A66B]" : "bg-slate-200"}`}
              >
                <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform mx-0.5 ${commissionFromBoth ? "translate-x-6" : "translate-x-0"}`} />
              </button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-[#4A3F35] flex items-center gap-2">
              <Users className="w-4 h-4 text-[#C9A66B]" /> مدخلات المهندسين والتسويق
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <InputRow label="عدد المهندسين النشطين" value={activeEngineers} onChange={setActiveEngineers} min={0} max={500} step={5} suffix="مهندس" />
            <InputRow label="نسبة المشتركين بباقة مدفوعة %" value={subscriptionRevenue} onChange={setSubscriptionRevenue} min={0} max={100} step={1} suffix="%" />
            <InputRow label="ميزانية التسويق الشهرية" value={marketingBudget} onChange={setMarketingBudget} min={0} max={100000} step={500} suffix="ريال" />

            <div className="p-3 bg-amber-50 rounded-lg border border-amber-100">
              <p className="text-xs text-amber-700">💡 تكلفة اكتساب مهندس واحد: <span className="font-bold">{formatSAR(calc.cac)}</span></p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* قسم تكلفة الذكاء الاصطناعي */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base text-[#4A3F35] flex items-center gap-2">
            🤖 تكلفة نقاط الذكاء الاصطناعي (Base44 Credits)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid md:grid-cols-2 gap-5">
            <InputRow label="متوسط تفاعلات الشات لكل مشروع" value={chatInteractionsPerProject} onChange={setChatInteractionsPerProject} min={1} max={100} step={1} suffix="رسالة" />
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-[#6B5D4F]">تكلفة النقطة الواحدة (ريال)</span>
                <span className="text-sm font-bold text-[#C9A66B]">{creditCostSAR.toFixed(3)} ريال</span>
              </div>
              <input
                type="range"
                min={0.01} max={0.5} step={0.005}
                value={creditCostSAR}
                onChange={(e) => setCreditCostSAR(parseFloat(e.target.value))}
                className="w-full accent-[#C9A66B]"
              />
              <div className="flex justify-between text-xs text-slate-400">
                <span>0.010 ريال</span>
                <span>0.500 ريال</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 pt-2 border-t">
            <div className="bg-slate-50 rounded-lg p-3 text-center">
              <p className="text-xs text-slate-500 mb-1">نقاط الشات</p>
              <p className="font-bold text-[#4A3F35]">{chatInteractionsPerProject * 3}</p>
              <p className="text-xs text-slate-400">{chatInteractionsPerProject} رسالة × 3</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-3 text-center">
              <p className="text-xs text-slate-500 mb-1">تقارير + أتمتة</p>
              <p className="font-bold text-[#4A3F35]">16</p>
              <p className="text-xs text-slate-400">ثابتة لكل مشروع</p>
            </div>
            <div className="bg-[#FEF9EE] rounded-lg p-3 text-center border border-[#C9A66B]/30">
              <p className="text-xs text-slate-500 mb-1">إجمالي نقاط/مشروع</p>
              <p className="font-bold text-[#C9A66B] text-lg">{calc.creditsPerProject}</p>
              <p className="text-xs text-slate-400">≈ {formatSAR(calc.aiCostPerProject)}/مشروع</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* تفاصيل التكاليف والإيرادات */}
      <Card>
        <CardContent className="p-4">
          <button onClick={() => setShowDetails(!showDetails)} className="w-full flex items-center justify-between text-[#4A3F35] font-semibold">
            <span>تفاصيل التكاليف والإيرادات</span>
            {showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showDetails && (
            <div className="mt-4 grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <p className="text-xs font-bold text-green-600 mb-2">📈 مصادر الإيرادات</p>
                {[
                  { label: "عمولات المشاريع", value: calc.projectRevenue },
                  { label: "اشتراكات المهندسين", value: calc.subscriptionMonthly },
                ].map((r) => (
                  <div key={r.label} className="flex justify-between text-sm border-b pb-1">
                    <span className="text-slate-600">{r.label}</span>
                    <span className="font-medium text-green-700">{formatSAR(r.value)}</span>
                  </div>
                ))}
                <div className="flex justify-between text-sm font-bold pt-1">
                  <span>الإجمالي</span>
                  <span className="text-green-700">{formatSAR(calc.totalRevenue)}</span>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-bold text-red-500 mb-2">📉 بنود التكاليف</p>
                {[
                  { label: "منصة Base44", value: BASE44_COST },
                  { label: "استهلاك الذكاء الاصطناعي", value: calc.aiCosts },
                  { label: "الدعم الفني", value: SUPPORT_COST },
                  { label: "الاستشارات القانونية", value: LEGAL_COST },
                  { label: "التسويق", value: marketingBudget },
                ].map((c) => (
                  <div key={c.label} className="flex justify-between text-sm border-b pb-1">
                    <span className="text-slate-600">{c.label}</span>
                    <span className="font-medium text-red-600">{formatSAR(c.value)}</span>
                  </div>
                ))}
                <div className="flex justify-between text-sm font-bold pt-1">
                  <span>الإجمالي</span>
                  <span className="text-red-600">{formatSAR(calc.totalCosts)}</span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* توصية ذكية */}
      <Card className={`border ${isProfit ? "border-green-200 bg-green-50" : "border-orange-200 bg-orange-50"}`}>
        <CardContent className="p-4">
          <p className="text-sm font-semibold mb-1 text-[#4A3F35]">
            {isProfit ? "✅ التوصية:" : "⚠️ التوصية:"}
          </p>
          <p className="text-sm text-slate-700">
            {isProfit
              ? `النموذج مربح بهامش ${formatSAR(calc.netProfit)} شهرياً. يمكنك البدء بثقة مع التركيز على زيادة عدد المهندسين النشطين لتعظيم إيرادات الاشتراكات.`
              : `تحتاج ${calc.breakEvenProjects} مشروعاً على الأقل شهرياً لتغطية التكاليف. جرّب رفع نسبة العمولة أو تخفيض ميزانية التسويق حتى تثبت المنصة نفسها.`
            }
          </p>
        </CardContent>
      </Card>
    </div>
  );
}