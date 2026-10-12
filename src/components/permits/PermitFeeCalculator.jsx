/**
 * حاسبة رسوم الترخيص — تحسب رسوم البلدية + أتعاب المهندس + عمولة بيتلي
 */
export function calculatePermitFees({ landArea, buildingArea, floorsCount, permitType, buildingType }) {
  // This is only a rough internal estimate, not the official Balady fee calculator.
  // Do not invent a fixed engineer quote from area alone.
  let baladyFeePerMeter = 15;
  if (buildingType === 'commercial') baladyFeePerMeter = 25;
  if (buildingType === 'industrial') baladyFeePerMeter = 20;
  if (permitType === 'renovation') baladyFeePerMeter = 8;
  if (permitType === 'extension') baladyFeePerMeter = 10;
  if (permitType === 'demolition') baladyFeePerMeter = 5;

  const effectiveArea = Number(buildingArea) || Number(landArea) || 0;
  const floors = Math.max(1, Number(floorsCount) || 1);
  const baladyFee = Math.max(500, Math.round(effectiveArea * baladyFeePerMeter * floors));

  // Engineer fees must be quoted by a qualified engineering office after reviewing scope.
  // Platform commission can only be calculated after the actual engineer quote is accepted.
  return {
    baladyFee,
    engineerFee: null,
    bytlyCommission: null,
    totalAmount: null,
    isIndicative: true,
  };
}

export default function PermitFeeBreakdown({ fees, loading }) {
  const { baladyFee, engineerFee, bytlyCommission, totalAmount } = fees || {};
  const fmt = (n) => (n || 0).toLocaleString('ar-SA');

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-3">
      <h4 className="font-bold text-amber-800 text-sm flex items-center gap-2">
        🧾 تقدير مبدئي للتكلفة
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
                🏛️ تقدير مبدئي لرسوم بلدي
              </span>
              <span className="font-semibold text-slate-800">{fmt(baladyFee)} ر.س</span>
            </div>
            <div className="flex justify-between items-center py-1.5 border-b border-amber-200">
              <span className="text-slate-600 flex items-center gap-1.5">
                👷 أتعاب المكتب الهندسي
              </span>
              <span className="font-semibold text-slate-800">تُحدد بعد مراجعة الطلب</span>
            </div>
            <div className="flex justify-between items-center py-1.5 border-b border-amber-200">
              <span className="text-slate-600 flex items-center gap-1.5">
                ⚡ عمولة خدمات بيتلي
              </span>
              <span className="font-semibold text-slate-800">تُحسب بعد اعتماد الأتعاب</span>
            </div>
            <div className="flex justify-between items-center py-2 bg-amber-100 rounded-lg px-2 mt-1">
              <span className="font-bold text-amber-900">الإجمالي</span>
              <span className="font-bold text-base text-amber-800">يُحدد بعد اعتماد الرسوم والأتعاب</span>
            </div>
          </div>
          <p className="text-xs text-slate-500">
            * هذا تقدير داخلي غير رسمي لرسوم بلدي، وليس فاتورة حكومية. تحققي من المبلغ النهائي في حاسبة بلدي الرسمية. أتعاب المكتب والعمولة لا تُحدد إلا بعد عرض سعر واضح وموافقة العميل.
          </p>
        </>
      )}
    </div>
  );
}