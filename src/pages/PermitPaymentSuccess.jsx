/**
 * صفحة نجاح دفع رخصة البناء — تُفعِّل توزيع الأموال آلياً
 */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { CheckCircle2, Loader2, Award, ArrowLeft, Building2, Shield, Wallet, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

export default function PermitPaymentSuccess() {
  const [status, setStatus] = useState('loading'); // loading | distributing | done | error
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const permitId = params.get('permit_id');
    const sessionId = params.get('session_id');

    if (!permitId || !sessionId) {
      setStatus('error');
      setError('معلومات الدفع غير مكتملة');
      return;
    }

    (async () => {
      try {
        setStatus('distributing');
        const res = await base44.functions.invoke('permitPayment', {
          action: 'distribute',
          permit_id: permitId,
          session_id: sessionId,
        });

        if (res.data?.error) {
          // Already distributed = still success
          if (res.data?.already_distributed) {
            setData({ already_distributed: true });
            setStatus('done');
            return;
          }
          setError(res.data.error);
          setStatus('error');
          return;
        }

        setData(res.data);
        setStatus('done');
      } catch (e) {
        setError(e.message);
        setStatus('error');
      }
    })();
  }, []);

  const fmt = (n) => (n || 0).toLocaleString('ar-SA');

  if (status === 'loading' || status === 'distributing') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-amber-50/30" dir="rtl">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-[#C9A66B] mx-auto" />
          <p className="font-semibold text-slate-700">جارٍ تأكيد الدفع وتوزيع الأموال...</p>
          <p className="text-sm text-slate-400">رجاءً لا تغلق هذه الصفحة</p>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-rose-50/30" dir="rtl">
        <div className="text-center space-y-4 max-w-sm">
          <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto">
            <Building2 className="w-8 h-8 text-rose-500" />
          </div>
          <h2 className="text-xl font-bold text-slate-800">حدث خطأ</h2>
          <p className="text-slate-500 text-sm">{error}</p>
          <Link to="/PermitApplication">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              العودة للطلبات
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-green-50/30 flex items-center justify-center py-10 px-4" dir="rtl">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-lg w-full space-y-6"
      >
        {/* Success Header */}
        <div className="text-center space-y-3">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', delay: 0.1 }}
            className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto"
          >
            <CheckCircle2 className="w-10 h-10 text-green-500" />
          </motion.div>
          <h1 className="text-2xl font-bold text-slate-800">تم الدفع بنجاح! 🎉</h1>
          <p className="text-slate-500">طلب رخصتك قيد المراجعة وسيُرسَل لنظام بلدي تلقائياً</p>
        </div>

        {/* Distribution breakdown */}
        {data?.distributed && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl border border-slate-100 shadow-lg overflow-hidden"
          >
            <div className="bg-gradient-to-r from-[#6B5D4F] to-[#C9A66B] p-4 text-white text-center">
              <p className="font-bold text-lg">توزيع الأموال — تم آلياً ✓</p>
            </div>
            <div className="p-4 space-y-3">
              <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
                  <Building2 className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-slate-700 text-sm">رسوم أمانة المنطقة</p>
                  <p className="text-xs text-slate-400">محجوز للتحويل عبر سداد الحكومي</p>
                </div>
                <span className="font-bold text-blue-700">{fmt(data.distributed.balady_fee)} ر.س</span>
              </div>

              <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-xl">
                <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center shrink-0">
                  <Shield className="w-5 h-5 text-amber-600" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-slate-700 text-sm">أتعاب المهندس</p>
                  <p className="text-xs text-slate-400">محجوز في ضمان بيتلي حتى إصدار الرخصة</p>
                </div>
                <span className="font-bold text-amber-700">{fmt(data.distributed.engineer_fee)} ر.س</span>
              </div>

              <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-xl">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center shrink-0">
                  <Wallet className="w-5 h-5 text-purple-600" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-slate-700 text-sm">خدمات منصة بيتلي</p>
                  <p className="text-xs text-slate-400">تقديم الطلب + الربط + المتابعة</p>
                </div>
                <span className="font-bold text-purple-700">{fmt(data.distributed.bytly_commission)} ر.س</span>
              </div>
            </div>
          </motion.div>
        )}

        {/* Next Steps */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4"
        >
          <h3 className="font-bold text-slate-700 mb-3 text-sm">الخطوات التالية</h3>
          <div className="space-y-2.5">
            {[
              { icon: '🔍', t: 'مراجعة فنية', d: 'بيتلي يراجع ملفاتك خلال 24 ساعة' },
              { icon: '🏛️', t: 'الإرسال لبلدي', d: 'يُرسَل طلبك تلقائياً لنظام بلدي' },
              { icon: '💳', t: 'دفع رسوم البلدية', d: 'يتم تحويلها عبر نظام سداد الحكومي' },
              { icon: '📄', t: 'الرخصة الرقمية', d: 'تظهر في حسابك فور الإصدار' },
            ].map((s, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <span className="text-lg">{s.icon}</span>
                <div>
                  <p className="font-medium text-slate-700 text-sm">{s.t}</p>
                  <p className="text-xs text-slate-400">{s.d}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Email notice */}
        <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-center text-sm text-green-700">
          <FileText className="w-4 h-4 inline ml-1" />
          تم إرسال تأكيد الدفع والفاتورة التفصيلية إلى بريدك الإلكتروني
        </div>

        <div className="flex gap-3">
          <Link to="/PermitApplication" className="flex-1">
            <Button variant="outline" className="w-full gap-2">
              <ArrowLeft className="w-4 h-4" />
              متابعة طلباتي
            </Button>
          </Link>
          <Link to="/" className="flex-1">
            <Button className="w-full bg-gradient-to-r from-[#6B5D4F] to-[#C9A66B] text-white">
              الصفحة الرئيسية
            </Button>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}