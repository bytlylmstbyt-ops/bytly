import React from "react";
import { Star } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function RatingStats({ engineer, reviews }) {
  if (!engineer) return null;

  // Calculate distribution
  const distribution = [5, 4, 3, 2, 1].map(star => ({
    star,
    count: reviews.filter(r => Math.round(r.rating) === star).length,
    pct: reviews.length ? (reviews.filter(r => Math.round(r.rating) === star).length / reviews.length) * 100 : 0
  }));

  const avgQuality = reviews.length
    ? reviews.reduce((s, r) => s + (r.quality_rating || r.rating), 0) / reviews.length
    : engineer.quality_avg || engineer.rating || 0;

  const avgComm = reviews.length
    ? reviews.reduce((s, r) => s + (r.communication_rating || r.rating), 0) / reviews.length
    : engineer.communication_avg || engineer.rating || 0;

  const avgDelivery = reviews.length
    ? reviews.reduce((s, r) => s + (r.delivery_rating || r.rating), 0) / reviews.length
    : engineer.delivery_avg || engineer.rating || 0;

  const categories = [
    { label: "جودة العمل", icon: "🏆", value: avgQuality },
    { label: "التواصل", icon: "💬", value: avgComm },
    { label: "الالتزام بالمواعيد", icon: "⏱️", value: avgDelivery },
  ];

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Star className="w-5 h-5 text-amber-500 fill-amber-400" />
          إحصائيات التقييم
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Overall Score */}
        <div className="flex items-center gap-4 p-4 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border border-amber-100">
          <div className="text-center">
            <p className="text-4xl font-bold text-amber-600">{engineer.rating?.toFixed(1) || "0.0"}</p>
            <div className="flex justify-center my-1">
              {[1,2,3,4,5].map(s => (
                <Star key={s} className={`w-3.5 h-3.5 ${s <= Math.round(engineer.rating || 0) ? "fill-amber-400 text-amber-400" : "text-slate-300"}`} />
              ))}
            </div>
            <p className="text-xs text-slate-500">{engineer.total_reviews || 0} تقييم</p>
          </div>
          {/* Star Distribution */}
          <div className="flex-1 space-y-1.5">
            {distribution.map(({ star, count, pct }) => (
              <div key={star} className="flex items-center gap-2 text-xs">
                <span className="w-3 text-slate-500 text-right">{star}</span>
                <Star className="w-3 h-3 fill-amber-400 text-amber-400 flex-shrink-0" />
                <div className="flex-1 bg-slate-200 rounded-full h-1.5 overflow-hidden">
                  <div className="h-full bg-amber-400 rounded-full transition-all" style={{ width: `${pct}%` }} />
                </div>
                <span className="w-4 text-slate-400">{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="space-y-3">
          {categories.map(({ label, icon, value }) => (
            <div key={label}>
              <div className="flex justify-between items-center text-sm mb-1">
                <span className="text-slate-600 flex items-center gap-1">
                  <span>{icon}</span> {label}
                </span>
                <span className="font-semibold text-slate-800">{value.toFixed(1)}</span>
              </div>
              <Progress value={value * 20} className="h-2" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}