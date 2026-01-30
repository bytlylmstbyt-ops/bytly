import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, AlertCircle } from "lucide-react";

export default function SentimentAnalyzer({ interactions }) {
  const sentimentBreakdown = {
    positive: interactions.filter(i => i.sentiment === "positive").length,
    neutral: interactions.filter(i => i.sentiment === "neutral").length,
    negative: interactions.filter(i => i.sentiment === "negative").length
  };

  const total = interactions.length || 1;
  const averageSentiment = (
    (sentimentBreakdown.positive * 1 + sentimentBreakdown.neutral * 0 + sentimentBreakdown.negative * -1) / total
  ).toFixed(2);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          تحليل المشاعر العام
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <p className="text-2xl font-bold text-green-600">{sentimentBreakdown.positive}</p>
            <p className="text-sm text-slate-600">إيجابي</p>
            <p className="text-xs text-slate-500 mt-1">{Math.round((sentimentBreakdown.positive / total) * 100)}%</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-gray-600">{sentimentBreakdown.neutral}</p>
            <p className="text-sm text-slate-600">محايد</p>
            <p className="text-xs text-slate-500 mt-1">{Math.round((sentimentBreakdown.neutral / total) * 100)}%</p>
          </div>
          <div className="text-center p-4 bg-red-50 rounded-lg">
            <p className="text-2xl font-bold text-red-600">{sentimentBreakdown.negative}</p>
            <p className="text-sm text-slate-600">سلبي</p>
            <p className="text-xs text-slate-500 mt-1">{Math.round((sentimentBreakdown.negative / total) * 100)}%</p>
          </div>
        </div>

        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm font-medium text-slate-700 mb-2">متوسط المشاعر</p>
          <div className="flex items-center gap-2">
            {averageSentiment > 0 ? (
              <TrendingUp className="w-5 h-5 text-green-600" />
            ) : (
              <TrendingDown className="w-5 h-5 text-red-600" />
            )}
            <p className={`text-lg font-bold ${averageSentiment > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {averageSentiment}
            </p>
          </div>
        </div>

        <div>
          <p className="text-sm font-medium mb-2">التوزيع</p>
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden flex">
            <div
              className="bg-green-600"
              style={{ width: `${(sentimentBreakdown.positive / total) * 100}%` }}
            ></div>
            <div
              className="bg-gray-600"
              style={{ width: `${(sentimentBreakdown.neutral / total) * 100}%` }}
            ></div>
            <div
              className="bg-red-600"
              style={{ width: `${(sentimentBreakdown.negative / total) * 100}%` }}
            ></div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}