/**
 * حاسبة رسوم الترخيص — تحسب رسوم البلدية + أتعاب المهندس + عمولة بيتلي
 */
export function calculatePermitFees({ landArea, buildingArea, floorsCount, permitType, buildingType }) {
  // رسوم البلدية - معادلة تقريبية مبنية على لوائح أمانة المنطقة
  let baladyFeePerMeter = 15; // ر.س / م²
  if (buildingType === 'commercial') baladyFeePerMeter = 25;
  if (buildingType === 'industrial') baladyFeePerMeter = 20;
  if (permitType === 'renovation') baladyFeePerMeter = 8;
  if (permitType === 'extension') baladyFeePerMeter = 10;
  if (permitType === 'demolition') baladyFeePerMeter = 5;

  const effectiveArea = buildingArea || landArea;
  let baladyFee = Math.round(effectiveArea * baladyFeePerMeter * (floorsCount || 1));
  baladyFee = Math.max(baladyFee, 500); // حد أدنى 500 ر.س

  // أتعاب المهندس - تقديرية
  let engineerFeePerMeter = 80;
  if (buildingType === 'commercial') engineerFeePerMeter = 120;
  if (permitType === 'renovation') engineerFeePerMeter = 50;
  const engineerFee = Math.round(effectiveArea * engineerFeePerMeter * (floorsCount || 1));

  // عمولة بيتلي 12% من أتعاب المهندس فقط
  const bytlyCommission = Math.round(engineerFee * 0.12);

  const totalAmount = baladyFee + engineerFee + bytlyCommission;

  return { baladyFee, engineerFee, bytlyCommission, totalAmount };
}

export default function PermitFeeBreakdown({ fees, loading }) {
  const { baladyFee, engineerFee, bytlyCommission, totalAmount } = fees || {};
  const fmt = (n) => (n || 0).toLocaleString('ar-SA');

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-3">
      <h4 className="font-bold text-amber-800 text-sm flex items-center gap-2">
        🧾 تفاصيل الفاتورة الموحدة
      </h4>
      {loading ? (
        <div className="space-y-2">
          {[1,2,3,4].map(i => <div key={i} className="h-4 bg-amber-200/60 rounded animate-pulse" />)}
        </div>
      ) : (
        <>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between items-center py-1.5 border-b border-amber-200">
              <span className="text-slate-600 flex items-center gap-1.5">
                🏛️ رسوم أمانة المنطقة (بلدي)
              </span>
              <span className="font-semibold text-slate-800">{fmt(baladyFee)} ر.س</span>
            </div>
            <div className="flex justify-between items-center py-1.5 border-b border-amber-200">
              <span className="text-slate-600 flex items-center gap-1.5">
                👷 أتعاب المهندس المعتمد
              </span>
              <span className="font-semibold text-slate-800">{fmt(engineerFee)} ر.س</span>
            </div>
            <div className="flex justify-between items-center py-1.5 border-b border-amber-200">
              <span className="text-slate-600 flex items-center gap-1.5">
                ⚡ خدمات بيتلي (12%)
              </span>
              <span className="font-semibold text-slate-800">{fmt(bytlyCommission)} ر.س</span>
            </div>
            <div className="flex justify-between items-center py-2 bg-amber-100 rounded-lg px-2 mt-1">
              <span className="font-bold text-amber-900">الإجمالي</span>
              <span className="font-bold text-lg text-amber-800">{fmt(totalAmount)} ر.س</span>
            </div>
          </div>
          <p className="text-xs text-slate-500">
            * رسوم البلدية تُحوَّل مباشرة عبر نظام سداد الحكومي. الأتعاب تُحجز في ضمان بيتلي حتى إصدار الرخصة.
          </p>
        </>
      )}
    </div>
  );
}