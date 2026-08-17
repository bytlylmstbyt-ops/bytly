import React from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wallet, Receipt, ArrowDownToLine, RotateCcw, BarChart3, ArrowUpRight } from "lucide-react";
import { createPageUrl } from "@/utils";

const cards = [
  { title: "المحفظة والإيرادات", desc: "متابعة الأرصدة والإيرادات والعمولات", icon: Wallet, page: "AdminWallet" },
  { title: "الفواتير", desc: "إدارة الفواتير وحالات التحصيل", icon: Receipt, page: "InvoiceManager" },
  { title: "طلبات السحب", desc: "مراجعة ومعالجة طلبات السحب المالية", icon: ArrowDownToLine, page: "AllWithdrawalRequests" },
  { title: "المبالغ المستردة", desc: "إدارة عمليات الاسترداد والمراجعات المالية", icon: RotateCcw, page: "AdminRefundControl" },
  { title: "التقارير المالية", desc: "تقارير الإيرادات والأداء المالي", icon: BarChart3, page: "AdminRevenueReport" },
];

export default function AdminFinanceDashboard() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" dir="rtl">
      <div className="mb-7"><p className="text-xs font-medium text-[#C9A66B]">مجلس الإدارة / الإدارة التنفيذية / الإدارة المالية</p><h1 className="text-2xl font-bold text-[#4A3F35] mt-1">لوحة المدير المالي</h1><p className="text-sm text-slate-500 mt-1">مساحة مالية مركزة لإدارة التدفقات، الفواتير، السحوبات والتقارير دون الوصول للأدوات التقنية.</p></div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map(({ title, desc, icon: Icon, page }) => <Link key={page} to={createPageUrl(page)}><Card className="h-full hover:shadow-md transition-shadow"><CardHeader className="pb-2"><CardTitle className="flex items-center justify-between text-base text-[#4A3F35]"><span className="flex items-center gap-2"><Icon className="w-5 h-5 text-[#C9A66B]" />{title}</span><ArrowUpRight className="w-4 h-4 text-slate-400" /></CardTitle></CardHeader><CardContent><p className="text-sm text-slate-500">{desc}</p></CardContent></Card></Link>)}
      </div>
    </div>
  );
}
