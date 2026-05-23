/**
 * متتبع حالة طلب الرخصة — خط زمني تفاعلي
 */
import { CheckCircle2, Clock, Loader2, XCircle, FileText, Building2, Award } from 'lucide-react';

const STEPS = [
  { key: 'draft',           label: 'تقديم الطلب',        icon: FileText,   desc: 'تعبئة النموذج ورفع المستندات' },
  { key: 'submitted',       label: 'مراجعة بيتلي',       icon: Loader2,    desc: 'التحقق من اكتمال الملفات' },
  { key: 'under_review',    label: 'مراجعة فنية',         icon: Loader2,    desc: 'المهندس المعتمد يراجع المخططات' },
  { key: 'balady_submitted',label: 'إرسال لبلدي',         icon: Building2,  desc: 'الطلب مُرسَل تلقائياً لنظام بلدي' },
  { key: 'approved',        label: 'اعتماد بلدي',         icon: CheckCircle2, desc: 'تمت الموافقة وجاري إصدار الرخصة' },
  { key: 'issued',          label: 'رخصة البناء صادرة ✓', icon: Award,      desc: 'الرخصة الرقمية متاحة في حسابك' },
];

const ORDER = ['draft','submitted','under_review','balady_submitted','approved','issued'];

export default function PermitStatusTracker({ status, permitNumber, permitFileUrl, rejectionReason }) {
  const currentIndex = ORDER.indexOf(status);
  const isRejected = status === 'rejected';

  return (
    <div className="bg-white rounded-xl border border-slate-100 p-4 space-y-4">
      <h4 className="font-bold text-slate-800 text-sm">📍 مسار طلب الرخصة</h4>

      {isRejected && (
        <div className="bg-rose-50 border border-rose-200 rounded-lg p-3 flex gap-2">
          <XCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-rose-700 text-sm">تم رفض الطلب</p>
            {rejectionReason && <p className="text-xs text-rose-600 mt-0.5">{rejectionReason}</p>}
          </div>
        </div>
      )}

      <div className="relative">
        {/* Line */}
        <div className="absolute right-3 top-3 bottom-3 w-0.5 bg-slate-100" />

        <div className="space-y-4">
          {STEPS.map((step, i) => {
            const done = currentIndex > i || (currentIndex === i && status === 'issued');
            const active = currentIndex === i && !isRejected;
            const Icon = step.icon;

            return (
              <div key={step.key} className="flex items-start gap-3 relative">
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 z-10 ${
                  done ? 'bg-green-500 border-green-500' :
                  active ? 'bg-blue-500 border-blue-500' :
                  'bg-white border-slate-200'
                }`}>
                  {done
                    ? <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                    : active
                    ? <Clock className="w-3.5 h-3.5 text-white animate-pulse" />
                    : <div className="w-2 h-2 rounded-full bg-slate-200" />
                  }
                </div>
                <div className="pt-0.5">
                  <p className={`text-sm font-medium ${done ? 'text-green-700' : active ? 'text-blue-700' : 'text-slate-400'}`}>
                    {step.label}
                  </p>
                  <p className="text-xs text-slate-400">{step.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Issued - show permit */}
      {status === 'issued' && permitNumber && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-center space-y-2">
          <Award className="w-8 h-8 text-green-500 mx-auto" />
          <p className="font-bold text-green-700">رخصة البناء رقم: {permitNumber}</p>
          {permitFileUrl && (
            <a
              href={permitFileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700"
            >
              <FileText className="w-3.5 h-3.5" />
              تحميل الرخصة الرقمية
            </a>
          )}
        </div>
      )}
    </div>
  );
}