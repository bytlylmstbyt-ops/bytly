import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";
import { TrendingUp } from "lucide-react";

export default function ProjectPerformanceChart({ projects }) {
  // Status distribution
  const statusData = [
    { name: "مفتوح", value: projects.filter(p => p.status === "open").length, color: "#3B82F6" },
    { name: "قيد التنفيذ", value: projects.filter(p => p.status === "in_progress").length, color: "#F59E0B" },
    { name: "مكتمل", value: projects.filter(p => p.status === "completed").length, color: "#10B981" },
    { name: "ملغي", value: projects.filter(p => p.status === "cancelled").length, color: "#EF4444" }
  ];

  // Category distribution
  const categoryData = {};
  projects.forEach(project => {
    const cat = project.category || "أخرى";
    categoryData[cat] = (categoryData[cat] || 0) + 1;
  });

  const categoryChartData = Object.entries(categoryData).map(([name, value]) => ({
    name: getCategoryLabel(name),
    value
  }));

  // Monthly projects trend
  const monthlyData = {};
  projects.forEach(project => {
    if (project.created_date) {
      const date = new Date(project.created_date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthlyData[monthKey] = (monthlyData[monthKey] || 0) + 1;
    }
  });

  const monthlyChartData = Object.entries(monthlyData)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6)
    .map(([month, count]) => ({
      month: formatMonth(month),
      مشاريع: count
    }));

  // Budget ranges
  const budgetRanges = {
    "أقل من 5,000": projects.filter(p => (p.budget_max || 0) < 5000).length,
    "5,000 - 10,000": projects.filter(p => (p.budget_max || 0) >= 5000 && (p.budget_max || 0) < 10000).length,
    "10,000 - 20,000": projects.filter(p => (p.budget_max || 0) >= 10000 && (p.budget_max || 0) < 20000).length,
    "20,000 - 50,000": projects.filter(p => (p.budget_max || 0) >= 20000 && (p.budget_max || 0) < 50000).length,
    "أكثر من 50,000": projects.filter(p => (p.budget_max || 0) >= 50000).length
  };

  const budgetChartData = Object.entries(budgetRanges).map(([range, count]) => ({
    range,
    عدد: count
  }));

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

  const COLORS = ['#6B5D4F', '#C9A66B', '#8B7355', '#A8916D', '#9B8369'];

  return (
    <div className="space-y-6">
      {/* Status Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>توزيع المشاريع حسب الحالة</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>توزيع المشاريع حسب التصنيف</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={categoryChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#6B5D4F" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Trend */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            اتجاه المشاريع (آخر 6 أشهر)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="مشاريع" 
                stroke="#6B5D4F" 
                strokeWidth={2}
                dot={{ fill: '#6B5D4F', r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Budget Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>توزيع المشاريع حسب الميزانية (ريال)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={budgetChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="range" angle={-15} textAnchor="end" height={80} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="عدد" fill="#C9A66B" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}