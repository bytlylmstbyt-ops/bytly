import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";
import { Star, Briefcase, TrendingUp, Award } from "lucide-react";

export default function EngineerAnalytics({ projects, engineers }) {
  // Engineer performance data
  const engineerStats = engineers.map(engineer => {
    const engineerProjects = projects.filter(p => p.assigned_engineer_id === engineer.id);
    const completedProjects = engineerProjects.filter(p => p.status === "completed");
    
    return {
      id: engineer.id,
      name: engineer.full_name,
      totalProjects: engineerProjects.length,
      completedProjects: completedProjects.length,
      rating: engineer.rating || 0,
      totalReviews: engineer.total_reviews || 0,
      completionRate: engineerProjects.length > 0 
        ? (completedProjects.length / engineerProjects.length * 100) 
        : 0
    };
  }).sort((a, b) => b.totalProjects - a.totalProjects).slice(0, 10);

  // Chart data - top engineers by projects
  const topEngineersChartData = engineerStats.slice(0, 8).map(eng => ({
    name: eng.name.split(' ')[0], // First name only for chart
    "مشاريع مكتملة": eng.completedProjects,
    "إجمالي المشاريع": eng.totalProjects
  }));

  // Top rated engineers
  const topRatedEngineers = [...engineerStats]
    .filter(e => e.totalReviews >= 3)
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 5);

  // Most active engineers
  const mostActiveEngineers = [...engineerStats]
    .sort((a, b) => b.totalProjects - a.totalProjects)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Performance Chart */}
      <Card>
        <CardHeader>
          <CardTitle>أداء المهندسين (أعلى 8 مهندسين)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={topEngineersChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="مشاريع مكتملة" fill="#10B981" />
              <Bar dataKey="إجمالي المشاريع" fill="#6B5D4F" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Top Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Rated */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="w-5 h-5 text-amber-500" />
              أعلى تقييم
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topRatedEngineers.length === 0 ? (
              <p className="text-center text-slate-500 py-8">لا توجد بيانات كافية</p>
            ) : (
              <div className="space-y-3">
                {topRatedEngineers.map((engineer, index) => (
                  <div key={engineer.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium">{engineer.name}</p>
                        <p className="text-sm text-slate-600">
                          {engineer.totalProjects} مشروع
                        </p>
                      </div>
                    </div>
                    <div className="text-left">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                        <span className="font-bold">{engineer.rating.toFixed(1)}</span>
                      </div>
                      <p className="text-xs text-slate-500">
                        {engineer.totalReviews} تقييم
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Most Active */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-500" />
              الأكثر نشاطاً
            </CardTitle>
          </CardHeader>
          <CardContent>
            {mostActiveEngineers.length === 0 ? (
              <p className="text-center text-slate-500 py-8">لا توجد بيانات</p>
            ) : (
              <div className="space-y-3">
                {mostActiveEngineers.map((engineer, index) => (
                  <div key={engineer.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center text-white font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium">{engineer.name}</p>
                        <p className="text-sm text-slate-600">
                          معدل الإنجاز: {Math.round(engineer.completionRate)}%
                        </p>
                      </div>
                    </div>
                    <div className="text-left">
                      <div className="flex items-center gap-1">
                        <Briefcase className="w-4 h-4 text-blue-500" />
                        <span className="font-bold">{engineer.totalProjects}</span>
                      </div>
                      <p className="text-xs text-slate-500">
                        {engineer.completedProjects} مكتمل
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Detailed Table */}
      <Card>
        <CardHeader>
          <CardTitle>تفاصيل أداء المهندسين</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-right py-3 px-4">المهندس</th>
                  <th className="text-right py-3 px-4">إجمالي المشاريع</th>
                  <th className="text-right py-3 px-4">المشاريع المكتملة</th>
                  <th className="text-right py-3 px-4">معدل الإنجاز</th>
                  <th className="text-right py-3 px-4">التقييم</th>
                </tr>
              </thead>
              <tbody>
                {engineerStats.map((engineer) => (
                  <tr key={engineer.id} className="border-b hover:bg-slate-50">
                    <td className="py-3 px-4 font-medium">{engineer.name}</td>
                    <td className="py-3 px-4">{engineer.totalProjects}</td>
                    <td className="py-3 px-4">
                      <Badge className="bg-green-100 text-green-700">
                        {engineer.completedProjects}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-slate-200 rounded-full h-2 max-w-[100px]">
                          <div
                            className="bg-green-500 h-2 rounded-full"
                            style={{ width: `${engineer.completionRate}%` }}
                          />
                        </div>
                        <span className="text-sm">{Math.round(engineer.completionRate)}%</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                        <span>{engineer.rating.toFixed(1)}</span>
                        <span className="text-sm text-slate-500">({engineer.totalReviews})</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}