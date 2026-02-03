import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Info, Percent, Calculator } from "lucide-react";
import { motion } from "framer-motion";

export default function CommissionExplainer({ totalProjectValue, milestones }) {
  const FIXED_COMMISSION_RATE = 0.15; // 15% fixed
  const totalCommission = totalProjectValue * FIXED_COMMISSION_RATE;
  const netToEngineer = totalProjectValue * (1 - FIXED_COMMISSION_RATE);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-900">
            <Calculator className="w-5 h-5" />
            كيف تعمل العمولة الثابتة؟
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Fixed Rate Explanation */}
          <div className="p-4 bg-white rounded-lg border border-blue-200">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                <Percent className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-blue-900 mb-2">نسبة ثابتة 15%</h4>
                <p className="text-sm text-slate-700 leading-relaxed">
                  العمولة نسبة ثابتة من قيمة المشروع الكلية (<strong>{FIXED_COMMISSION_RATE * 100}%</strong>)، 
                  وليست رسوم متغيرة على كل مرحلة.
                </p>
              </div>
            </div>
          </div>

          {/* Pro-rata Distribution */}
          <div className="p-4 bg-white rounded-lg border border-blue-200">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center flex-shrink-0">
                <Calculator className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-indigo-900 mb-2">توزيع متناسب</h4>
                <p className="text-sm text-slate-700 leading-relaxed mb-3">
                  العمولة تُجمع بشكل متناسب مع كل مرحلة. إذا كانت المرحلة تمثل 25% من العمل، 
                  نجمع 25% من العمولة الكلية.
                </p>
                {milestones && milestones.length > 0 && (
                  <div className="text-xs bg-indigo-50 p-3 rounded space-y-1">
                    <p className="font-semibold text-indigo-900 mb-2">مثال من مشروعك:</p>
                    {milestones.slice(0, 2).map((m, idx) => (
                      <div key={idx} className="flex justify-between text-indigo-800">
                        <span>المرحلة {m.order} ({m.percentage}%):</span>
                        <span>عمولة {(m.amount * 0.15).toLocaleString('ar-SA')} ر.س</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Total Calculation */}
          <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border-2 border-green-300">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-slate-700">
                <span>قيمة العمل الكلية:</span>
                <span className="font-semibold">{totalProjectValue.toLocaleString('ar-SA')} ر.س</span>
              </div>
              <div className="flex justify-between text-orange-700">
                <span>العمولة الثابتة (15%):</span>
                <span className="font-bold">- {totalCommission.toLocaleString('ar-SA')} ر.س</span>
              </div>
              <div className="flex justify-between pt-2 border-t-2 border-green-400 text-green-800 font-bold text-base">
                <span>صافي المهندس الكلي:</span>
                <span>{netToEngineer.toLocaleString('ar-SA')} ر.س</span>
              </div>
            </div>
          </div>

          {/* Transparency Note */}
          <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <Info className="w-4 h-4 text-amber-700 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-amber-800 leading-relaxed">
              <strong>الشفافية:</strong> جميع التكاليف واضحة من البداية. لا توجد رسوم مفاجئة أو إضافية.
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}