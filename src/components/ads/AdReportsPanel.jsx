import React, { useState } from "react";
import { Eye, MousePointerClick, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const SORT_OPTIONS = [
  { key: "impressions", label: "المشاهدات" },
  { key: "clicks", label: "النقرات" },
  { key: "ctr", label: "نسبة النقر" },
];

export default function AdReportsPanel({ ads }) {
  const [sortBy, setSortBy] = useState("impressions");

  const sorted = [...ads].sort((a, b) => {
    if (sortBy === "impressions") return (b.impressions || 0) - (a.impressions || 0);
    if (sortBy === "clicks") return (b.clicks || 0) - (a.clicks || 0);
    const ctrA = a.impressions > 0 ? (a.clicks || 0) / a.impressions : 0;
    const ctrB = b.impressions > 0 ? (b.clicks || 0) / b.impressions : 0;
    return ctrB - ctrA;
  });

  const maxImpressions = Math.max(...ads.map(a => a.impressions || 0), 1);
  const maxClicks = Math.max(...ads.map(a => a.clicks || 0), 1);

  return (
    <Card className="border-0 shadow-md mb-8">
      <CardContent className="p-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <h2 className="font-bold text-[#6B5D4F]">تقارير الأداء</h2>
              <p className="text-xs text-slate-400">تحليل فاعلية حملاتك الإعلانية</p>
            </div>
          </div>
          <div className="flex gap-1">
            {SORT_OPTIONS.map(s => (
              <button
                key={s.key}
                onClick={() => setSortBy(s.key)}
                className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                  sortBy === s.key ? "bg-[#C9A66B] text-white" : "bg-slate-50 text-slate-500 hover:bg-slate-100"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-slate-400 border-b border-slate-100">
                <th className="text-right py-2 px-2 font-medium">الإعلان</th>
                <th className="text-center py-2 px-2 font-medium">الحالة</th>
                <th className="text-center py-2 px-2 font-medium">
                  <span className="flex items-center justify-center gap-1">
                    <Eye className="w-3 h-3" /> المشاهدات
                  </span>
                </th>
                <th className="text-center py-2 px-2 font-medium">
                  <span className="flex items-center justify-center gap-1">
                    <MousePointerClick className="w-3 h-3" /> النقرات
                  </span>
                </th>
                <th className="text-center py-2 px-2 font-medium">نسبة النقر</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map(ad => {
                const impressions = ad.impressions || 0;
                const clicks = ad.clicks || 0;
                const ctr = impressions > 0 ? ((clicks / impressions) * 100).toFixed(1) : "0.0";
                const ctrVal = parseFloat(ctr);
                const impBar = (impressions / maxImpressions) * 100;
                const clickBar = maxClicks > 0 ? (clicks / maxClicks) * 100 : 0;

                return (
                  <tr key={ad.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg overflow-hidden bg-slate-100 shrink-0">
                          {ad.image_url && <img src={ad.image_url} alt="" className="w-full h-full object-cover" />}
                        </div>
                        <span className="font-medium text-slate-700 text-xs truncate max-w-[120px]">{ad.title}</span>
                      </div>
                    </td>
                    <td className="py-3 px-2 text-center">
                      {ad.is_active ? (
                        <Badge className="bg-green-50 text-green-600 text-[9px]">نشط</Badge>
                      ) : (
                        <Badge className="bg-slate-100 text-slate-400 text-[9px]">متوقف</Badge>
                      )}
                    </td>
                    <td className="py-3 px-2 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <span className="font-semibold text-slate-700">{impressions.toLocaleString('ar-SA')}</span>
                        <div className="w-16 h-1 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-purple-400 rounded-full" style={{ width: `${impBar}%` }} />
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-2 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <span className="font-semibold text-slate-700">{clicks.toLocaleString('ar-SA')}</span>
                        <div className="w-16 h-1 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-400 rounded-full" style={{ width: `${clickBar}%` }} />
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-2 text-center">
                      <span className={`text-xs font-bold ${
                        ctrVal >= 2 ? "text-green-600" : ctrVal >= 1 ? "text-amber-600" : "text-slate-400"
                      }`}>
                        {ctr}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {ads.length === 0 && (
          <div className="text-center py-8 text-slate-400 text-sm">لا توجد بيانات</div>
        )}
      </CardContent>
    </Card>
  );
}