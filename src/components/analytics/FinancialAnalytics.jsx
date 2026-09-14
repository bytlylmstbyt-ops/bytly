import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";
import { DollarSign, TrendingUp, Wallet, Receipt } from "lucide-react";

export default function FinancialAnalytics({ projects }) {
  // Calculate financial metrics
  const totalRevenue = projects.reduce((sum, p) => {
    if (p.status === "completed" && p.budget_max) {
      return sum + (p.budget_max * 0.15); // 15% platform commission
    }
    return sum;
  }, 0);

  const potentialRevenue = projects.reduce((sum, p) => {
    if ((p.status === "open" || p.status === "in_progress") && p.budget_max) {
      return sum + (p.budget_max * 0.15);
    }
    return sum;
  }, 0);

  const avgProjectValue = projects.reduce((sum, p) => sum + (p.budget_max || 0), 0) / (projects.length || 1);

  // Monthly revenue trend
  const monthlyRevenue = {};
  projects.forEach(project => {
    if (project.status === "completed" && project.created_date && project.budget_max) {
      const date = new Date(project.created_date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const revenue = project.budget_max * 0.15;
      monthlyRevenue[monthKey] = (monthlyRevenue[monthKey] || 0) + revenue;
    }
  });

  const monthlyRevenueData = Object.entries(monthlyRevenue)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6)
    .map(([month, revenue]) => ({
      month: formatMonth(month),
      "الإيرادات": Math.round(revenue)
    }));

  // Revenue by category
  const categoryRevenue = {};
  projects.forEach(project => {
    if (project.status === "completed" && project.budget_max) {
      const cat = project.category || "أخرى";
      const revenue = project.budget_max * 0.15;
      categoryRevenue[cat] = (categoryRevenue[cat] || 0) + revenue;
    }
  });

  const categoryRevenueData = Object.entries(categoryRevenue)
    .map(([category, revenue]) => ({
      category: getCategoryLabel(category),
      "الإيرادات": Math.round(revenue)
    }))
    .sort((a, b) => b["الإيرادات"] - a["الإيرادات"])
    .slice(0, 6);

  // Cumulative revenue
  const sortedProjects = [...projects]
    .filter(p => p.status === "completed" && p.created_date && p.budget_max)
    .sort((a, b) => new Date(a.created_date) - new Date(b.created_date));

  let cumulative = 0;
  const cumulativeData = sortedProjects.slice(-12).map(project => {
    cumulative += project.budget_max * 0.15;
    return {
      date: new Date(project.created_date).toLocaleDateString('ar-SA', { month: 'short', day: 'numeric' }),
      "الإيرادات التراكمية": Math.round(cumulative)
    };
  });

  function getCategoryLabel(category) {
    const labels = {
      interior: "تصميم داخلي",
      architecture: "معماري",
      painting: "رسم",
      landscape: "تنسيق حدائق",
      furniture: "أثاث",
      lighting: "إضاءة",
      civil_engineering: "هندسة مدنية",
      structural_design: "تصميم إنشائي",
      executive_drawing: "رسم تنفيذي"
    };
    return labels[category] || category;
  }

  function formatMonth(monthKey) {
    const [year, month] = monthKey.split('-');
    const months = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", 
                    "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
    return `${months[parseInt(month) - 1]} ${year}`;
  }

  return (
    <div className="space-y-6">
      {/* Financial Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[#1a1a2e]">
                  {Math.round(totalRevenue).toLocaleString('ar-SA')}
                </p>
                <p className="text-sm text-slate-600">إجمالي الإيرادات (ريال)</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                <Wallet className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[#1a1a2e]">
                  {Math.round(potentialRevenue).toLocaleString('ar-SA')}
                </p>
                <p className="text-sm text-slate-600">الإيرادات المحتملة (ريال)</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[#1a1a2e]">
                  {Math.round(avgProjectValue).toLocaleString('ar-SA')}
                </p>
                <p className="text-sm text-slate-600">متوسط قيمة المشروع (ريال)</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Revenue Trend */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            اتجاه الإيرادات الشهرية (ريال)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={monthlyRevenueData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => value.toLocaleString('ar-SA') + ' ريال'} />
              <Legend />
              <Area 
                type="monotone" 
                dataKey="الإيرادات" 
                stroke="#10B981" 
                fill="#10B981"
                fillOpacity={0.3}
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Revenue by Category */}
      <Card>
        <CardHeader>
          <CardTitle>الإيرادات حسب التصنيف (ريال)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={categoryRevenueData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="category" angle={-15} textAnchor="end" height={80} />
              <YAxis />
              <Tooltip formatter={(value) => value.toLocaleString('ar-SA') + ' ريال'} />
              <Bar dataKey="الإيرادات" fill="#6B5D4F" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Cumulative Revenue */}
      {cumulativeData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="w-5 h-5" />
              الإيرادات التراكمية (آخر 12 مشروع مكتمل)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={cumulativeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={(value) => value.toLocaleString('ar-SA') + ' ريال'} />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="الإيرادات التراكمية" 
                  stroke="#C9A66B" 
                  strokeWidth={3}
                  dot={{ fill: '#C9A66B', r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Financial Insights */}
      <Card>
        <CardHeader>
          <CardTitle>رؤى مالية</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-green-800 font-medium mb-1">معدل نمو الإيرادات</p>
              <p className="text-2xl font-bold text-green-600">
                {monthlyRevenueData.length >= 2 
                  ? Math.round((monthlyRevenueData[monthlyRevenueData.length - 1]["الإيرادات"] - 
                      monthlyRevenueData[monthlyRevenueData.length - 2]["الإيرادات"]) / 
                      monthlyRevenueData[monthlyRevenueData.length - 2]["الإيرادات"] * 100)
                  : 0}%
              </p>
              <p className="text-xs text-green-700 mt-1">مقارنة بالشهر السابق</p>
            </div>

            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800 font-medium mb-1">متوسط العمولة لكل مشروع</p>
              <p className="text-2xl font-bold text-blue-600">
                {Math.round(avgProjectValue * 0.15).toLocaleString('ar-SA')} ريال
              </p>
              <p className="text-xs text-blue-700 mt-1">15% من قيمة المشروع</p>
            </div>

            <div className="p-4 bg-amber-50 rounded-lg">
              <p className="text-sm text-amber-800 font-medium mb-1">أعلى فئة ربحية</p>
              <p className="text-2xl font-bold text-amber-600">
                {categoryRevenueData[0]?.category || "لا يوجد"}
              </p>
              <p className="text-xs text-amber-700 mt-1">
                {categoryRevenueData[0] 
                  ? `${Math.round(categoryRevenueData[0]["الإيرادات"]).toLocaleString('ar-SA')} ريال`
                  : ""}
              </p>
            </div>

            <div className="p-4 bg-purple-50 rounded-lg">
              <p className="text-sm text-purple-800 font-medium mb-1">معدل التحويل إلى إيرادات</p>
              <p className="text-2xl font-bold text-purple-600">
                {projects.length > 0 
                  ? Math.round((projects.filter(p => p.status === "completed").length / projects.length) * 100)
                  : 0}%
              </p>
              <p className="text-xs text-purple-700 mt-1">من إجمالي المشاريع</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}