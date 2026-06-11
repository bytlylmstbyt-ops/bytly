import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { TrendingUp, TrendingDown, Cpu, ShieldCheck, Wrench, Scale, ChevronDown, ChevronUp } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";

const formatSAR = (n) => new Intl.NumberFormat("ar-SA", { style: "currency", currency: "SAR", maximumFractionDigits: 0 }).format(n || 0);

// ── التكاليف الثابتة المشتركة شهرياً (من BudgetCalculator) ──
const FIXED_MONTHLY = {
  base44: 1500,
  support: 3000,
  legal: 2000,
};

// ── نقاط AI لكل مشروع (من BudgetCalculator) ──
const CREDITS_PER_MSG = 3;
const AVG_SUMMARIES = 2;
const CREDITS_PER_SUMMARY = 3;
const AVG_MILESTONES = 5;
const CREDITS_PER_MILESTONE = 2;
const RETRY_MARGIN = 0.20;

function CostRow({ icon: Icon, label, value, color = "text-red-500" }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b last:border-0">
      <span className="flex items-center gap-1.5 text-sm text-slate-600">
        <Icon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        {label}
      </span>
      <span className={`text-sm font-semibold ${color}`}>{value}</span>
    </div>
  );
}

export default function ProjectProfitPanel({ projects, loading }) {
  // ── معاملات قابلة للتعديل ──
  const [commissionPct, setCommissionPct] = useState(8);
  const [commissionBoth, setCommissionBoth] = useState(true);
  const [chatMsgs, setChatMsgs] = useState(10);
  const [creditCost, setCreditCost] = useState(0.05);
  const [marketingBudget, setMarketingBudget] = useState(10000);
  const [showBreakdown, setShowBreakdown] = useState(false);

  const calc = useMemo(() => {
    const completedProjects = projects.filter(p => p.status === "completed");
    const totalProjects = Math.max(completedProjects.length, 1);

    // متوسط قيمة العقد من بيانات المشاريع المكتملة
    const validBudgets = completedProjects.filter(p => p.escrow_amount > 0 || p.budget_max > 0);
    const avgContractValue = validBudgets.length > 0
      ? validBudgets.reduce((s, p) => s + (p.escrow_amount || p.budget_max || 0), 0) / validBudgets.length
      : 15000; // قيمة افتراضية

    // إيراد الاتحاد لكل مشروع
    const multiplier = commissionBoth ? 2 : 1;
    const commissionRate = (commissionPct / 100) * multiplier;
    const revenuePerProject = avgContractValue * commissionRate;

    // تكلفة AI لكل مشروع + هامش أمان
    const creditsPerProject = (chatMsgs * CREDITS_PER_MSG) + (AVG_SUMMARIES * CREDITS_PER_SUMMARY) + (AVG_MILESTONES * CREDITS_PER_MILESTONE);
    const aiBase = creditsPerProject * creditCost;
    const aiWithBuffer = aiBase * (1 + RETRY_MARGIN);

    // توزيع التكاليف الثابتة على كل مشروع (بناءً على الأشهر النشطة)
    // نفترض أن المشاريع موزعة على شهر واحد كمرجع
    const projectsPerMonth = Math.max(totalProjects, 1);
    const fixedPerProject = (FIXED_MONTHLY.base44 + FIXED_MONTHLY.support + FIXED_MONTHLY.legal) / projectsPerMonth;
    const marketingPerProject = marketingBudget / projectsPerMonth;

    const totalCostPerProject = aiWithBuffer + fixedPerProject + marketingPerProject;
    const netProfitPerProject = revenuePerProject - totalCostPerProject;
    const marginPct = revenuePerProject > 0 ? ((netProfitPerProject / revenuePerProject) * 100) : 0;

    // مخطط: الربح بحسب فئة قيمة العقد
    const brackets = [
      { label: "5–10k", min: 5000, max: 10000 },
      { label: "10–25k", min: 10000, max: 25000 },
      { label: "25–50k", min: 25000, max: 50000 },
      { label: "50–100k", min: 50000, max: 100000 },
      { label: "+100k", min: 100000, max: 500000 },
    ].map(b => {
      const mid = (b.min + b.max) / 2;
      const rev = mid * commissionRate;
      const net = rev - totalCostPerProject;
      return { name: b.label, "إيراد العمولة": Math.round(rev), "ربح صافٍ": Math.round(net) };
    });

    return {
      avgContractValue,
      revenuePerProject,
      aiWithBuffer,
      aiBase,
      fixedPerProject,
      marketingPerProject,
      totalCostPerProject,
      netProfitPerProject,
      marginPct,
      creditsPerProject,
      brackets,
      completedCount: completedProjects.length,
    };
  }, [projects, commissionPct, commissionBoth, chatMsgs, creditCost, marketingBudget]);

  const isProfit = calc.netProfitPerProject >= 0;

  return (
    <div>
      <div className="flex items-center gap-2 mt-2 mb-3">
        <div className="w-1 h-5 bg-[#C9A66B] rounded-full" />
        <h2 className="text-base font-bold text-[#4A3F35]">الربح الصافي المتوقع لكل مشروع</h2>
        <Badge className={isProfit ? "bg-green-100 text-green-700 mr-auto" : "bg-red-100 text-red-700 mr-auto"}>
          {isProfit ? "✅ مربح" : "⚠️ خسارة"}
        </Badge>
      </div>

      <div className="grid md:grid-cols-3 gap-5">
        {/* ── الإعدادات ── */}
        <Card className="md:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-[#4A3F35]">⚙️ معاملات الحساب</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            {/* عمولة */}
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-600">عمولة المنصة</span>
                <span className="font-bold text-[#C9A66B]">{commissionPct}%</span>
              </div>
              <Slider value={[commissionPct]} onValueChange={([v]) => setCommissionPct(v)} min={1} max={20} step={0.5} />
            </div>

            {/* من الطرفين */}
            <div className="flex items-center justify-between">
              <span className="text-slate-600">عمولة من الطرفين؟</span>
              <button
                onClick={() => setCommissionBoth(!commissionBoth)}
                className={`w-11 h-6 rounded-full transition-colors shrink-0 ${commissionBoth ? "bg-[#C9A66B]" : "bg-slate-200"}`}
              >
                <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform mx-1 ${commissionBoth ? "translate-x-5" : "translate-x-0"}`} />
              </button>
            </div>

            {/* تفاعلات الشات */}
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-600">رسائل شات / مشروع</span>
                <span className="font-bold text-[#C9A66B]">{chatMsgs}</span>
              </div>
              <Slider value={[chatMsgs]} onValueChange={([v]) => setChatMsgs(v)} min={1} max={100} step={1} />
            </div>

            {/* تكلفة النقطة */}
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-600">تكلفة النقطة</span>
                <span className="font-bold text-[#C9A66B]">{creditCost.toFixed(3)} ﷼</span>
              </div>
              <Slider value={[creditCost]} onValueChange={([v]) => setCreditCost(v)} min={0.01} max={0.5} step={0.005} />
            </div>

            {/* ميزانية التسويق */}
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-600">تسويق شهري</span>
                <span className="font-bold text-[#C9A66B]">{marketingBudget.toLocaleString("ar-SA")} ﷼</span>
              </div>
              <Slider value={[marketingBudget]} onValueChange={([v]) => setMarketingBudget(v)} min={0} max={50000} step={500} />
            </div>

            <div className="text-xs text-slate-400 pt-1 border-t">
              متوسط قيمة العقد (من بيانات المنصة): <span className="font-semibold text-slate-600">{formatSAR(calc.avgContractValue)}</span>
            </div>
          </CardContent>
        </Card>

        {/* ── النتائج ── */}
        <Card className="md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-[#4A3F35]">📊 نتائج الربح لكل مشروع</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* بطاقات النتيجة */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-center">
                <p className="text-xs text-slate-500 mb-1">إيراد العمولة</p>
                <p className="text-lg font-bold text-green-700">{formatSAR(calc.revenuePerProject)}</p>
                <p className="text-xs text-slate-400">/ مشروع</p>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-center">
                <p className="text-xs text-slate-500 mb-1">إجمالي التكاليف</p>
                <p className="text-lg font-bold text-red-600">{formatSAR(calc.totalCostPerProject)}</p>
                <p className="text-xs text-slate-400">/ مشروع</p>
              </div>
              <div className={`${isProfit ? "bg-[#FEF9EE] border-[#C9A66B]/40" : "bg-orange-50 border-orange-300"} border rounded-xl p-3 text-center`}>
                <p className="text-xs text-slate-500 mb-1">صافي الربح</p>
                <p className={`text-lg font-bold ${isProfit ? "text-[#C9A66B]" : "text-orange-600"}`}>{formatSAR(calc.netProfitPerProject)}</p>
                <p className="text-xs text-slate-400">هامش {calc.marginPct.toFixed(1)}%</p>
              </div>
            </div>

            {/* تفاصيل التكاليف قابلة للطي */}
            <div className="border rounded-lg overflow-hidden">
              <button
                onClick={() => setShowBreakdown(!showBreakdown)}
                className="w-full flex items-center justify-between px-4 py-2.5 bg-slate-50 hover:bg-slate-100 text-sm font-semibold text-[#4A3F35] transition-colors"
              >
                <span>تفصيل التكاليف لكل مشروع</span>
                {showBreakdown ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              {showBreakdown && (
                <div className="px-4 py-3 space-y-0">
                  <CostRow icon={Cpu} label={`ذكاء اصطناعي (${calc.creditsPerProject} نقطة)`} value={formatSAR(calc.aiBase)} />
                  <CostRow icon={ShieldCheck} label="هامش أمان Retry (20%)" value={`+ ${formatSAR(calc.aiWithBuffer - calc.aiBase)}`} color="text-orange-500" />
                  <CostRow icon={Wrench} label="تكاليف ثابتة موزعة (Base44 + دعم + قانون)" value={formatSAR(calc.fixedPerProject)} />
                  <CostRow icon={Scale} label="حصة التسويق" value={formatSAR(calc.marketingPerProject)} />
                  <div className="flex justify-between pt-2 mt-1 border-t font-bold text-sm">
                    <span className="text-slate-700">الإجمالي</span>
                    <span className="text-red-600">{formatSAR(calc.totalCostPerProject)}</span>
                  </div>
                </div>
              )}
            </div>

            {/* مخطط الربح حسب قيمة العقد */}
            <div>
              <p className="text-xs font-semibold text-slate-500 mb-2">الربح الصافي بحسب قيمة العقد</p>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={calc.brackets} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v) => formatSAR(v)} />
                  <ReferenceLine y={0} stroke="#EF4444" strokeDasharray="4 2" />
                  <Bar dataKey="إيراد العمولة" fill="#C9A66B" radius={[3,3,0,0]} opacity={0.7} />
                  <Bar dataKey="ربح صافٍ" fill={isProfit ? "#22C55E" : "#EF4444"} radius={[3,3,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}