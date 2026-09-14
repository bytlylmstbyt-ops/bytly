import React, { useState, useMemo, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Calculator, Landmark, UserCheck, Wallet, FileText,
  Search, RefreshCw, TrendingUp, Percent, ShieldCheck
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import moment from "moment";

const COMMISSION_RATE = 0.15;
const CONSULTANT_FEE_RATE = 0.05;

const formatSAR = (n) => new Intl.NumberFormat("ar-SA", { maximumFractionDigits: 0 }).format(n || 0) + " ر.س";

const statusLabel = {
  open: "مفتوح", in_progress: "جارٍ", completed: "مكتمل", cancelled: "ملغي",
  disputed: "نزاع", pending_client_approval: "موافقة العميل",
  awaiting_technical_review: "مراجعة فنية", technical_approved: "اعتماد فني"
};
const statusColor = {
  open: "bg-amber-100 text-amber-700", in_progress: "bg-blue-100 text-blue-700",
  completed: "bg-green-100 text-green-700", cancelled: "bg-red-100 text-red-700",
  disputed: "bg-orange-100 text-orange-700", pending_client_approval: "bg-purple-100 text-purple-700",
  awaiting_technical_review: "bg-slate-100 text-slate-600", technical_approved: "bg-teal-100 text-teal-700"
};

export default function PlatformFeeCalculator() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [calcAmount, setCalcAmount] = useState(10000);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await base44.entities.Project.list("-created_date", 500);
      setProjects(data || []);
    } catch (e) {
      console.error("load error", e);
    }
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  // الحاسبة التفاعلية
  const calc = useMemo(() => {
    const amount = parseFloat(calcAmount) || 0;
    const commission = Math.round(amount * COMMISSION_RATE);
    const consultantFee = Math.round(amount * CONSULTANT_FEE_RATE);
    const netToEngineer = amount - commission - consultantFee;
    return { amount, commission, consultantFee, netToEngineer };
  }, [calcAmount]);

  // التقرير المالي لكل مشروع
  const projectReports = useMemo(() => {
    return projects.map(p => {
      const baseAmount = p.escrow_amount || p.budget_max || p.engineer_payment || 0;
      const commission = Math.round(baseAmount * COMMISSION_RATE);
      const consultantFee = Math.round(baseAmount * CONSULTANT_FEE_RATE);
      const netToEngineer = baseAmount - commission - consultantFee;
      return {
        id: p.id,
        title: p.title || "مشروع بدون عنوان",
        status: p.status,
        baseAmount,
        commission,
        consultantFee,
        netToEngineer,
        created_date: p.created_date,
        engineer_payment: p.engineer_payment,
        platform_commission: p.platform_commission,
        technical_consultant_fee: p.technical_consultant_fee,
      };
    }).filter(r => r.baseAmount > 0);
  }, [projects]);

  const filteredReports = useMemo(() => {
    if (!searchTerm.trim()) return projectReports;
    return projectReports.filter(r => r.title.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [projectReports, searchTerm]);

  // الإجماليات
  const totals = useMemo(() => {
    return projectReports.reduce((acc, r) => ({
      base: acc.base + r.baseAmount,
      commission: acc.commission + r.commission,
      consultant: acc.consultant + r.consultantFee,
      net: acc.net + r.netToEngineer,
    }), { base: 0, commission: 0, consultant: 0, net: 0 });
  }, [projectReports]);

  // بيانات الرسم البياني لأعلى 7 مشاريع
  const chartData = useMemo(() => {
    return [...projectReports]
      .sort((a, b) => b.baseAmount - a.baseAmount)
      .slice(0, 7)
      .map(r => ({
        name: (r.title || "").substring(0, 12) + "…",
        "عمولة بيتلي": r.commission,
        "أتعاب الاستشاري": r.consultantFee,
        "صافي المهندس": r.netToEngineer,
      }));
  }, [projectReports]);

  return (
    <div className="space-y-5" dir="rtl">
      {/* العنوان */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-1 h-6 bg-[#C9A66B] rounded-full" />
          <h2 className="text-base font-bold text-[#4A3F35]">حاسبة أتعاب بيتلي والاستشاري</h2>
        </div>
        <button
          onClick={loadData}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#C9A66B] text-white text-xs rounded-lg hover:bg-[#b8955a] disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          تحديث
        </button>
      </div>

      {/* الحاسبة التفاعلية */}
      <Card className="border-r-4 border-[#C9A66B]">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-[#4A3F35] flex items-center gap-2">
            <Calculator className="w-4 h-4 text-[#C9A66B]" />
            حاسبة افتراضية لعملية اعتماد وتدقيق
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-5 gap-4 items-end">
            <div className="md:col-span-2">
              <label className="text-xs text-slate-500 mb-1 block">مبلغ المرحلة / الدفعة (ر.س)</label>
              <Input
                type="number"
                value={calcAmount}
                onChange={(e) => setCalcAmount(e.target.value)}
                className="text-lg font-bold"
                placeholder="10000"
              />
            </div>
            <div className="bg-[#4A3F35]/5 rounded-xl p-3 text-center border border-[#4A3F35]/10">
              <Percent className="w-4 h-4 text-[#4A3F35] mx-auto mb-1" />
              <p className="text-[10px] text-slate-400">عمولة بيتلي (15%)</p>
              <p className="text-sm font-bold text-[#4A3F35]">{formatSAR(calc.commission)}</p>
            </div>
            <div className="bg-blue-50 rounded-xl p-3 text-center border border-blue-100">
              <UserCheck className="w-4 h-4 text-blue-600 mx-auto mb-1" />
              <p className="text-[10px] text-slate-400">أتعاب الاستشاري (5%)</p>
              <p className="text-sm font-bold text-blue-600">{formatSAR(calc.consultantFee)}</p>
            </div>
            <div className="bg-green-50 rounded-xl p-3 text-center border border-green-100">
              <Wallet className="w-4 h-4 text-green-600 mx-auto mb-1" />
              <p className="text-[10px] text-slate-400">صافي المهندس</p>
              <p className="text-sm font-bold text-green-600">{formatSAR(calc.netToEngineer)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-3 bg-slate-50 rounded-lg p-2">
            <ShieldCheck className="w-4 h-4 text-[#C9A66B] shrink-0" />
            <p className="text-xs text-slate-500">
              عند اعتماد التدقيق الاستشاري للمخرجات تُخصم عمولة المنصة ({Math.round(COMMISSION_RATE*100)}%) وأتعاب الاستشاري ({Math.round(CONSULTANT_FEE_RATE*100)}%) من مبلغ المرحلة، ويُحرر الصافي للمهندس.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* الإجماليات */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="border-r-4 border-[#C9A66B]">
          <CardContent className="p-4">
            <Landmark className="w-5 h-5 text-[#C9A66B] mb-1" />
            <p className="text-xs text-slate-400">إجمالي مبالغ المشاريع</p>
            <p className="text-lg font-bold text-[#4A3F35]">{formatSAR(totals.base)}</p>
          </CardContent>
        </Card>
        <Card className="border-r-4 border-[#4A3F35]">
          <CardContent className="p-4">
            <Percent className="w-5 h-5 text-[#4A3F35] mb-1" />
            <p className="text-xs text-slate-400">إجمالي عمولات بيتلي</p>
            <p className="text-lg font-bold text-[#4A3F35]">{formatSAR(totals.commission)}</p>
          </CardContent>
        </Card>
        <Card className="border-r-4 border-blue-400">
          <CardContent className="p-4">
            <UserCheck className="w-5 h-5 text-blue-600 mb-1" />
            <p className="text-xs text-slate-400">إجمالي أتعاب الاستشاري</p>
            <p className="text-lg font-bold text-blue-600">{formatSAR(totals.consultant)}</p>
          </CardContent>
        </Card>
        <Card className="border-r-4 border-green-400">
          <CardContent className="p-4">
            <Wallet className="w-5 h-5 text-green-600 mb-1" />
            <p className="text-xs text-slate-400">إجمالي صافي المهندسين</p>
            <p className="text-lg font-bold text-green-600">{formatSAR(totals.net)}</p>
          </CardContent>
        </Card>
      </div>

      {/* الرسم البياني */}
      {chartData.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-[#4A3F35] flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#C9A66B]" />
              توزيع الأتعاب لأعلى المشاريع
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={chartData} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip formatter={(v) => formatSAR(v)} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="عمولة بيتلي" stackId="a" fill="#4A3F35" />
                <Bar dataKey="أتعاب الاستشاري" stackId="a" fill="#3B82F6" />
                <Bar dataKey="صافي المهندس" stackId="a" fill="#22C55E" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* التقرير المالي لكل مشروع */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="text-sm font-semibold text-[#4A3F35] flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#C9A66B]" />
              التقرير المالي لكل مشروع ({filteredReports.length})
            </CardTitle>
            <div className="relative">
              <Search className="absolute right-2 top-2.5 w-3.5 h-3.5 text-slate-400" />
              <Input
                placeholder="بحث..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-8 h-8 text-xs w-40"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="h-40 bg-slate-100 rounded animate-pulse mx-4 mb-4" />
          ) : filteredReports.length === 0 ? (
            <div className="text-center py-10 text-slate-400">
              <FileText className="w-12 h-12 mx-auto mb-2 opacity-20" />
              <p className="text-sm">لا توجد مشاريع بمبالغ مسجلة</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="text-right py-2.5 px-4 font-semibold text-slate-600 text-xs">المشروع</th>
                    <th className="text-right py-2.5 px-4 font-semibold text-slate-600 text-xs">الحالة</th>
                    <th className="text-right py-2.5 px-4 font-semibold text-slate-600 text-xs">مبلغ المشروع</th>
                    <th className="text-right py-2.5 px-4 font-semibold text-slate-600 text-xs">عمولة بيتلي</th>
                    <th className="text-right py-2.5 px-4 font-semibold text-slate-600 text-xs">أتعاب الاستشاري</th>
                    <th className="text-right py-2.5 px-4 font-semibold text-slate-600 text-xs">صافي المهندس</th>
                    <th className="text-right py-2.5 px-4 font-semibold text-slate-600 text-xs">التاريخ</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReports.map((r) => (
                    <tr key={r.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-2.5 px-4">
                        <p className="font-medium text-[#4A3F35] text-xs truncate max-w-[180px]">{r.title}</p>
                      </td>
                      <td className="py-2.5 px-4">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${statusColor[r.status] || "bg-slate-100 text-slate-600"}`}>
                          {statusLabel[r.status] || r.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 font-semibold text-[#C9A66B] text-xs">{formatSAR(r.baseAmount)}</td>
                      <td className="py-2.5 px-4 font-semibold text-[#4A3F35] text-xs">{formatSAR(r.commission)}</td>
                      <td className="py-2.5 px-4 font-semibold text-blue-600 text-xs">{formatSAR(r.consultantFee)}</td>
                      <td className="py-2.5 px-4 font-semibold text-green-600 text-xs">{formatSAR(r.netToEngineer)}</td>
                      <td className="py-2.5 px-4 text-[10px] text-slate-400">{moment(r.created_date).format("DD/MM/YYYY")}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-[#4A3F35]/5 border-t-2 border-[#C9A66B]">
                    <td colSpan="2" className="py-2.5 px-4 font-bold text-[#4A3F35] text-xs">الإجمالي</td>
                    <td className="py-2.5 px-4 font-bold text-[#C9A66B] text-xs">{formatSAR(totals.base)}</td>
                    <td className="py-2.5 px-4 font-bold text-[#4A3F35] text-xs">{formatSAR(totals.commission)}</td>
                    <td className="py-2.5 px-4 font-bold text-blue-600 text-xs">{formatSAR(totals.consultant)}</td>
                    <td className="py-2.5 px-4 font-bold text-green-600 text-xs">{formatSAR(totals.net)}</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}