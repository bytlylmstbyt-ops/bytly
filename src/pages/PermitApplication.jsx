/**
 * صفحة طلب رخصة البناء — One-Stop Shop
 * العميل يقدم الطلب → المهندس يرفع المخططات → بيتلي يرسل لبلدي → الرخصة تظهر في الحساب
 * تصميم مستوحى من المرجع المرفق — مركز، نظيف، RTL، ذهبي داكن
 */
import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import PermitFeeBreakdown, { calculatePermitFees } from '@/components/permits/PermitFeeCalculator';
import PermitStatusTracker from '@/components/permits/PermitStatusTracker';
import PermitStepsTracker from '@/components/permits/PermitStepsTracker';
import PermitTypeCard from '@/components/permits/PermitTypeCard';
import PermitWizardHeader from '@/components/permits/PermitWizardHeader';
import {
  Building2, FileText, Upload, CheckCircle2, ArrowLeft, ArrowRight,
  Loader2, Award, AlertCircle, RefreshCw, Plus, CreditCard, FileCheck
} from 'lucide-react';

const PERMIT_TYPES = [
  { value: 'new_building', label: 'بناء جديد', icon: '🏗️' },
  { value: 'extension', label: 'إضافة ملحق', icon: '🔧' },
  { value: 'renovation', label: 'ترميم', icon: '🏠' },
  { value: 'demolition', label: 'هدم', icon: '⚒️' },
  { value: 'fence', label: 'سور', icon: '🧱' },
  { value: 'pool', label: 'مسبح', icon: '🏊' },
];

const BUILDING_TYPES = [
  { value: 'villa', label: 'فيلا سكنية', icon: '🏡' },
  { value: 'apartment', label: 'عمارة سكنية', icon: '🏢' },
  { value: 'commercial', label: 'محلات تجارية', icon: '🏬' },
  { value: 'industrial', label: 'مصنع / مستودع', icon: '🏭' },
  { value: 'mixed', label: 'متعدد الاستخدام', icon: '🏙️' },
];

const CITIES = ['الرياض','جدة','مكة المكرمة','المدينة المنورة','الدمام','الخبر','أبها','تبوك','القصيم','الطائف','حائل','جازان','نجران','الجوف','الباحة'];

const statusLabels = {
  draft: { label: 'مسودة', color: 'bg-slate-100 text-slate-600' },
  submitted: { label: 'مُقدَّم', color: 'bg-blue-100 text-blue-700' },
  under_review: { label: 'تحت المراجعة', color: 'bg-amber-100 text-amber-700' },
  balady_submitted: { label: 'أُرسِل لبلدي', color: 'bg-purple-100 text-purple-700' },
  approved: { label: 'معتمد', color: 'bg-green-100 text-green-700' },
  rejected: { label: 'مرفوض', color: 'bg-rose-100 text-rose-700' },
  issued: { label: 'رخصة صادرة ✓', color: 'bg-green-600 text-white' },
};

export default function PermitApplication() {
  const [user, setUser] = useState(null);
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [myApplications, setMyApplications] = useState([]);
  const [showNew, setShowNew] = useState(false);
  const [selectedApp, setSelectedApp] = useState(null);
  const [uploadingFiles, setUploadingFiles] = useState({});
  const [payLoading, setPayLoading] = useState(false);

  const [form, setForm] = useState({
    permit_type: '',
    building_type: '',
    city: '',
    district: '',
    land_number: '',
    plan_number: '',
    land_area: '',
    building_area: '',
    floors_count: 1,
    drawings_files: [],
    soil_report_file: '',
    ownership_deed_file: '',
    client_phone: '',
    notes: '',
  });

  const fees = form.land_area
    ? calculatePermitFees({
        landArea: Number(form.land_area),
        buildingArea: Number(form.building_area) || Number(form.land_area),
        floorsCount: Number(form.floors_count),
        permitType: form.permit_type,
        buildingType: form.building_type,
      })
    : null;

  useEffect(() => {
    (async () => {
      setLoading(true);
      const authenticated = await base44.auth.isAuthenticated();
      if (authenticated) {
        const u = await base44.auth.me();
        setUser(u);
        const apps = await base44.entities.PermitApplication.filter({ client_email: u.email }, '-created_date');
        setMyApplications(apps);
        setShowNew(apps.length === 0);
      }
      setLoading(false);
    })();
  }, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const resetForm = () => {
    setForm({ permit_type:'',building_type:'',city:'',district:'',land_number:'',plan_number:'',land_area:'',building_area:'',floors_count:1,drawings_files:[],soil_report_file:'',ownership_deed_file:'',client_phone:'',notes:'' });
    setStep(0);
  };

  const handlePay = async (app) => {
    setPayLoading(true);
    try {
      const res = await base44.functions.invoke('permitPayment', {
        action: 'create_checkout',
        permit_id: app.id,
      });
      if (res.data?.checkout_url) {
        window.location.href = res.data.checkout_url;
      } else {
        alert(res.data?.error || 'حدث خطأ في إنشاء جلسة الدفع');
      }
    } catch {
      alert('حدث خطأ في إنشاء جلسة الدفع');
    }
    setPayLoading(false);
  };

  const uploadFile = async (e, key) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingFiles(p => ({ ...p, [key]: true }));
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    if (key === 'drawings_files') {
      setForm(f => ({ ...f, drawings_files: [...f.drawings_files, file_url] }));
    } else {
      set(key, file_url);
    }
    setUploadingFiles(p => ({ ...p, [key]: false }));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    const payload = {
      ...form,
      client_name: user?.full_name,
      client_email: user?.email,
      land_area: Number(form.land_area),
      building_area: Number(form.building_area) || Number(form.land_area),
      floors_count: Number(form.floors_count),
      balady_fee: fees?.baladyFee,
      engineer_fee: fees?.engineerFee,
      bytly_commission: fees?.bytlyCommission,
      total_amount: fees?.totalAmount,
      status: 'submitted',
      payment_status: 'pending',
    };
    const newApp = await base44.entities.PermitApplication.create(payload);
    setMyApplications(prev => [newApp, ...prev]);
    setSelectedApp(newApp);
    setShowNew(false);
    setSubmitting(false);
  };

  const canNext = () => {
    if (step === 0) return form.permit_type && form.building_type;
    if (step === 1) return form.land_area && form.city && form.land_number;
    if (step === 2) return form.drawings_files.length > 0 && form.ownership_deed_file;
    return true;
  };

  if (loading) return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-[#C6A775]" />
    </div>
  );

  if (!user) return (
    <div className="min-h-[60vh] flex items-center justify-center" dir="rtl">
      <div className="text-center space-y-4">
        <Building2 className="w-12 h-12 text-slate-300 mx-auto" />
        <p className="text-slate-600">يرجى تسجيل الدخول لتقديم طلب رخصة</p>
        <Button onClick={() => { sessionStorage.setItem('loginReturnUrl', window.location.pathname); window.location.href = '/login'; }} className="bg-[#C6A775] hover:bg-[#B8936D] text-white">
          تسجيل الدخول
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f9fafb] py-6 sm:py-10 px-4" dir="rtl">
      <div className="max-w-3xl mx-auto">

        {/* ── Header ─────────────────────────────────────────────── */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-[#FDF6ED] text-[#C6A775] rounded-full px-4 py-1.5 text-sm font-medium mb-4 border border-[#C6A775]/20">
            <Building2 className="w-4 h-4" />
            مدعوم بربط Balady API
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#1A1D2B]">طلب رخصة البناء</h1>
          <p className="text-[#6B7280] mt-2 text-sm sm:text-base">من الطلب إلى الرخصة الرقمية — كل شيء في بيتلي</p>
        </div>

        {/* ── High-Level Progress Tracker ─────────────────────────── */}
        <PermitStepsTracker currentStep={selectedApp && !showNew ? 2 : 0} />

        {/* ── Top Bar: طلب جديد + طلباتي ─────────────────────────── */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-[#1A1D2B] text-sm sm:text-base">
            طلباتي ({myApplications.length})
          </h3>
          <Button
            size="sm"
            className="bg-[#1A1D2B] hover:bg-[#2d3142] text-white gap-1.5 rounded-xl"
            onClick={() => { setShowNew(true); setSelectedApp(null); resetForm(); }}
          >
            <Plus className="w-4 h-4" /> طلب جديد
          </Button>
        </div>

        {/* ── Applications List (horizontal) ──────────────────────── */}
        {myApplications.length > 0 && (
          <div className="flex gap-3 overflow-x-auto pb-3 mb-4">
            {myApplications.map(app => {
              const sc = statusLabels[app.status] || statusLabels.draft;
              const isSelected = selectedApp?.id === app.id && !showNew;
              return (
                <button
                  key={app.id}
                  onClick={() => { setSelectedApp(app); setShowNew(false); }}
                  className={`shrink-0 w-64 text-right p-3.5 rounded-2xl border transition-all ${
                    isSelected
                      ? 'border-[#C6A775] bg-[#FDF6ED] shadow-md'
                      : 'border-[#E5E7EB] bg-white hover:border-[#C6A775]/40'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-semibold text-[#1A1D2B]">
                      {PERMIT_TYPES.find(t => t.value === app.permit_type)?.icon} {PERMIT_TYPES.find(t => t.value === app.permit_type)?.label}
                    </span>
                    <Badge className={`text-[10px] ${sc.color}`}>{sc.label}</Badge>
                  </div>
                  <p className="text-xs text-[#6B7280]">{app.city} — {app.land_area} م²</p>
                  <p className="text-xs text-[#9CA3AF] mt-1">{new Date(app.created_date).toLocaleDateString('ar-SA')}</p>
                </button>
              );
            })}
          </div>
        )}

        {myApplications.length === 0 && !showNew && (
          <div className="text-center py-8 text-[#9CA3AF] bg-white rounded-2xl border border-[#E5E7EB] mb-4">
            <Building2 className="w-10 h-10 mx-auto mb-2 text-slate-200" />
            <p className="text-sm">لا توجد طلبات بعد — اضغط "طلب جديد" للبدء</p>
          </div>
        )}

        {/* ── Application Detail View ────────────────────────────── */}
        <AnimatePresence mode="wait">
          {selectedApp && !showNew && (
            <motion.div
              key="detail"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <Card className="border-[#E5E7EB] shadow-lg overflow-hidden">
                <div className="bg-[#1A1D2B] px-5 py-3.5 flex items-center justify-between">
                  <h3 className="text-white font-bold text-sm flex items-center gap-2">
                    <FileCheck className="w-4 h-4 text-[#C6A775]" />
                    تفاصيل الطلب
                  </h3>
                  <Button variant="ghost" size="sm" className="text-white/70 hover:text-white hover:bg-white/10" onClick={async () => {
                    setLoading(true);
                    const updated = await base44.entities.PermitApplication.filter({ client_email: user.email }, '-created_date');
                    setMyApplications(updated);
                    setSelectedApp(updated.find(a => a.id === selectedApp.id) || selectedApp);
                    setLoading(false);
                  }}>
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                </div>
                <CardContent className="p-5 space-y-4">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="bg-[#f9fafb] rounded-xl p-3">
                      <p className="text-[#9CA3AF] text-xs mb-0.5">نوع الرخصة</p>
                      <p className="font-semibold text-[#1A1D2B]">{PERMIT_TYPES.find(t => t.value === selectedApp.permit_type)?.label}</p>
                    </div>
                    <div className="bg-[#f9fafb] rounded-xl p-3">
                      <p className="text-[#9CA3AF] text-xs mb-0.5">نوع المبنى</p>
                      <p className="font-semibold text-[#1A1D2B]">{BUILDING_TYPES.find(t => t.value === selectedApp.building_type)?.label}</p>
                    </div>
                    <div className="bg-[#f9fafb] rounded-xl p-3">
                      <p className="text-[#9CA3AF] text-xs mb-0.5">الموقع</p>
                      <p className="font-semibold text-[#1A1D2B]">{selectedApp.city} - {selectedApp.district}</p>
                    </div>
                    <div className="bg-[#f9fafb] rounded-xl p-3">
                      <p className="text-[#9CA3AF] text-xs mb-0.5">مساحة الأرض</p>
                      <p className="font-semibold text-[#1A1D2B]">{selectedApp.land_area} م²</p>
                    </div>
                  </div>

                  {selectedApp.payment_status !== 'paid' && selectedApp.total_amount > 0 && (
                    <Button
                      className="w-full bg-gradient-to-r from-[#6B5D4F] to-[#C6A775] text-white gap-2 py-5 text-base font-bold rounded-xl"
                      onClick={() => handlePay(selectedApp)}
                      disabled={payLoading}
                    >
                      {payLoading
                        ? <Loader2 className="w-5 h-5 animate-spin" />
                        : <><CreditCard className="w-5 h-5" /> ادفع الآن — {(selectedApp.total_amount || 0).toLocaleString('ar-SA')} ر.س</>
                      }
                    </Button>
                  )}
                  {selectedApp.payment_status === 'paid' && (
                    <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-center text-sm text-green-700 font-semibold">
                      ✅ تم الدفع — طلبك قيد المراجعة
                    </div>
                  )}

                  {selectedApp.balady_reference_number && (
                    <div className="bg-purple-50 border border-purple-200 rounded-xl p-3 text-sm">
                      <p className="text-purple-600 text-xs">رقم مرجع بلدي</p>
                      <p className="font-bold text-purple-800 text-base">{selectedApp.balady_reference_number}</p>
                    </div>
                  )}

                  {selectedApp.total_amount > 0 && (
                    <div className="bg-[#FDF6ED] rounded-xl p-4 text-sm space-y-1.5 border border-[#C6A775]/20">
                      <p className="font-bold text-[#C6A775] text-xs mb-2">الفاتورة الموحدة</p>
                      <div className="flex justify-between"><span className="text-[#6B7280]">🏛️ رسوم بلدي</span><span className="font-medium">{(selectedApp.balady_fee||0).toLocaleString('ar-SA')} ر.س</span></div>
                      <div className="flex justify-between"><span className="text-[#6B7280]">👷 أتعاب مهندس</span><span className="font-medium">{(selectedApp.engineer_fee||0).toLocaleString('ar-SA')} ر.س</span></div>
                      <div className="flex justify-between"><span className="text-[#6B7280]">⚡ خدمات بيتلي</span><span className="font-medium">{(selectedApp.bytly_commission||0).toLocaleString('ar-SA')} ر.س</span></div>
                      <div className="flex justify-between border-t border-[#C6A775]/20 pt-2 font-bold"><span className="text-[#1A1D2B]">الإجمالي</span><span className="text-[#C6A775]">{(selectedApp.total_amount||0).toLocaleString('ar-SA')} ر.س</span></div>
                    </div>
                  )}
                </CardContent>
              </Card>
              <PermitStatusTracker
                status={selectedApp.status}
                permitNumber={selectedApp.permit_number}
                permitFileUrl={selectedApp.permit_file_url}
                rejectionReason={selectedApp.rejection_reason}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── New Application Wizard ─────────────────────────────── */}
        <AnimatePresence mode="wait">
          {showNew && (
            <motion.div
              key="wizard"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <Card className="border-[#E5E7EB] shadow-lg overflow-hidden">
                <PermitWizardHeader currentStep={step} />

                <CardContent className="p-5 sm:p-6 space-y-5">

                  {/* Step 0: Permit & Building Type */}
                  {step === 0 && (
                    <div className="space-y-5">
                      <div>
                        <label className="block text-sm font-bold text-[#1A1D2B] mb-3">نوع الرخصة</label>
                        <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
                          {PERMIT_TYPES.map(t => (
                            <PermitTypeCard
                              key={t.value}
                              icon={t.icon}
                              label={t.label}
                              selected={form.permit_type === t.value}
                              onClick={() => set('permit_type', t.value)}
                            />
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-[#1A1D2B] mb-3">نوع المبنى</label>
                        <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
                          {BUILDING_TYPES.map(t => (
                            <PermitTypeCard
                              key={t.value}
                              icon={t.icon}
                              label={t.label}
                              selected={form.building_type === t.value}
                              onClick={() => set('building_type', t.value)}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Step 1: Land Info */}
                  {step === 1 && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-[#6B7280] mb-1.5">المدينة *</label>
                          <select className="w-full border border-[#E5E7EB] rounded-xl px-3 py-2.5 text-sm bg-white focus:border-[#C6A775] focus:ring-1 focus:ring-[#C6A775]/20 outline-none" value={form.city} onChange={e => set('city', e.target.value)}>
                            <option value="">اختر المدينة</option>
                            {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-[#6B7280] mb-1.5">الحي</label>
                          <input className="w-full border border-[#E5E7EB] rounded-xl px-3 py-2.5 text-sm focus:border-[#C6A775] focus:ring-1 focus:ring-[#C6A775]/20 outline-none" placeholder="اسم الحي" value={form.district} onChange={e => set('district', e.target.value)} />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-[#6B7280] mb-1.5">رقم القطعة *</label>
                          <input className="w-full border border-[#E5E7EB] rounded-xl px-3 py-2.5 text-sm focus:border-[#C6A775] focus:ring-1 focus:ring-[#C6A775]/20 outline-none" placeholder="مثال: 123" value={form.land_number} onChange={e => set('land_number', e.target.value)} />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-[#6B7280] mb-1.5">رقم المخطط</label>
                          <input className="w-full border border-[#E5E7EB] rounded-xl px-3 py-2.5 text-sm focus:border-[#C6A775] focus:ring-1 focus:ring-[#C6A775]/20 outline-none" placeholder="مثال: 456" value={form.plan_number} onChange={e => set('plan_number', e.target.value)} />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-[#6B7280] mb-1.5">مساحة الأرض (م²) *</label>
                          <input type="number" className="w-full border border-[#E5E7EB] rounded-xl px-3 py-2.5 text-sm focus:border-[#C6A775] focus:ring-1 focus:ring-[#C6A775]/20 outline-none" placeholder="مثال: 500" value={form.land_area} onChange={e => set('land_area', e.target.value)} />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-[#6B7280] mb-1.5">مساحة البناء (م²)</label>
                          <input type="number" className="w-full border border-[#E5E7EB] rounded-xl px-3 py-2.5 text-sm focus:border-[#C6A775] focus:ring-1 focus:ring-[#C6A775]/20 outline-none" placeholder="اتركه فارغاً = نفس الأرض" value={form.building_area} onChange={e => set('building_area', e.target.value)} />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-[#6B7280] mb-1.5">عدد الطوابق</label>
                          <select className="w-full border border-[#E5E7EB] rounded-xl px-3 py-2.5 text-sm bg-white focus:border-[#C6A775] focus:ring-1 focus:ring-[#C6A775]/20 outline-none" value={form.floors_count} onChange={e => set('floors_count', e.target.value)}>
                            {[1,2,3,4,5,6].map(n => <option key={n} value={n}>{n} {n === 1 ? 'طابق' : 'طوابق'}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-[#6B7280] mb-1.5">رقم الجوال</label>
                          <input className="w-full border border-[#E5E7EB] rounded-xl px-3 py-2.5 text-sm focus:border-[#C6A775] focus:ring-1 focus:ring-[#C6A775]/20 outline-none" placeholder="05xxxxxxxx" value={form.client_phone} onChange={e => set('client_phone', e.target.value)} />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Step 2: Documents */}
                  {step === 2 && (
                    <div className="space-y-4">
                      <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-700 flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                        <span>ستُرسَل هذه المستندات تلقائياً إلى نظام بلدي بعد الدفع.</span>
                      </div>

                      <div>
                        <label className="block text-sm font-bold text-[#1A1D2B] mb-1.5">
                          المخططات الهندسية المعتمدة * <span className="text-xs font-normal text-[#9CA3AF]">(PDF أو DWG)</span>
                        </label>
                        <label className="flex flex-col items-center gap-2 border-2 border-dashed border-[#E5E7EB] rounded-xl p-5 cursor-pointer hover:border-[#C6A775] hover:bg-[#FDF6ED]/30 transition-all">
                          {uploadingFiles.drawings_files ? <Loader2 className="w-6 h-6 animate-spin text-[#C6A775]" /> : <Upload className="w-6 h-6 text-[#9CA3AF]" />}
                          <span className="text-sm text-[#64748b]">اضغط لرفع مخطط</span>
                          <input type="file" className="hidden" accept=".pdf,.dwg,.dxf" onChange={e => uploadFile(e, 'drawings_files')} />
                        </label>
                        {form.drawings_files.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {form.drawings_files.map((f, i) => (
                              <div key={i} className="flex items-center gap-2 bg-green-50 rounded-lg px-3 py-2 text-xs border border-green-200">
                                <CheckCircle2 className="w-4 h-4 text-green-500" />
                                <span className="text-green-700">مخطط {i + 1} — تم الرفع ✓</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-bold text-[#1A1D2B] mb-1.5">وثيقة ملكية الأرض *</label>
                        <label className="flex items-center gap-2 border border-[#E5E7EB] rounded-xl p-3.5 cursor-pointer hover:border-[#C6A775] hover:bg-[#FDF6ED]/30 transition-all">
                          {uploadingFiles.ownership_deed_file ? <Loader2 className="w-4 h-4 animate-spin text-[#C6A775]" /> : form.ownership_deed_file ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <FileText className="w-4 h-4 text-[#9CA3AF]" />}
                          <span className="text-sm text-[#6B7280]">{form.ownership_deed_file ? 'تم الرفع ✓' : 'رفع وثيقة الملكية PDF'}</span>
                          <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png" onChange={e => uploadFile(e, 'ownership_deed_file')} />
                        </label>
                      </div>

                      <div>
                        <label className="block text-sm font-bold text-[#1A1D2B] mb-1.5">
                          تقرير التربة <span className="text-xs font-normal text-[#9CA3AF]">(اختياري)</span>
                        </label>
                        <label className="flex items-center gap-2 border border-[#E5E7EB] rounded-xl p-3.5 cursor-pointer hover:border-[#C6A775] hover:bg-[#FDF6ED]/30 transition-all">
                          {uploadingFiles.soil_report_file ? <Loader2 className="w-4 h-4 animate-spin text-[#C6A775]" /> : form.soil_report_file ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <FileText className="w-4 h-4 text-[#9CA3AF]" />}
                          <span className="text-sm text-[#6B7280]">{form.soil_report_file ? 'تم الرفع ✓' : 'رفع تقرير التربة'}</span>
                          <input type="file" className="hidden" accept=".pdf" onChange={e => uploadFile(e, 'soil_report_file')} />
                        </label>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-[#6B7280] mb-1.5">ملاحظات إضافية</label>
                        <textarea className="w-full border border-[#E5E7EB] rounded-xl px-3 py-2.5 text-sm focus:border-[#C6A775] focus:ring-1 focus:ring-[#C6A775]/20 outline-none resize-none" rows={3} placeholder="أي متطلبات خاصة..." value={form.notes} onChange={e => set('notes', e.target.value)} />
                      </div>
                    </div>
                  )}

                  {/* Step 3: Invoice & Submit */}
                  {step === 3 && (
                    <div className="space-y-4">
                      {fees && <PermitFeeBreakdown fees={fees} />}

                      <div className="bg-[#f9fafb] rounded-xl p-4 space-y-2 text-sm border border-[#E5E7EB]">
                        <p className="font-bold text-[#1A1D2B] mb-2">ملخص الطلب</p>
                        <div className="grid grid-cols-2 gap-y-1.5 text-xs">
                          <span className="text-[#6B7280]">النوع:</span><span className="font-medium text-[#1A1D2B]">{PERMIT_TYPES.find(t=>t.value===form.permit_type)?.label}</span>
                          <span className="text-[#6B7280]">المبنى:</span><span className="font-medium text-[#1A1D2B]">{BUILDING_TYPES.find(t=>t.value===form.building_type)?.label}</span>
                          <span className="text-[#6B7280]">الموقع:</span><span className="font-medium text-[#1A1D2B]">{form.city} - {form.district}</span>
                          <span className="text-[#6B7280]">المساحة:</span><span className="font-medium text-[#1A1D2B]">{form.land_area} م²</span>
                          <span className="text-[#6B7280]">الطوابق:</span><span className="font-medium text-[#1A1D2B]">{form.floors_count}</span>
                          <span className="text-[#6B7280]">المخططات:</span><span className="font-medium text-green-600">{form.drawings_files.length} ملف ✓</span>
                        </div>
                      </div>

                      <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-700 space-y-1">
                        <p className="font-semibold">⚡ ما سيحدث بعد التقديم:</p>
                        <ul className="space-y-0.5 list-disc list-inside text-blue-600">
                          <li>بيتلي سيراجع ملفاتك خلال 24 ساعة</li>
                          <li>يُرسَل الطلب تلقائياً لنظام بلدي</li>
                          <li>تصلك الفاتورة الموحدة للدفع</li>
                          <li>الرخصة تظهر في حسابك فور الإصدار</li>
                        </ul>
                      </div>

                      <Button
                        className="w-full bg-gradient-to-r from-[#6B5D4F] to-[#C6A775] text-white py-4 text-base font-bold gap-2 rounded-xl"
                        onClick={handleSubmit}
                        disabled={submitting}
                      >
                        {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Award className="w-5 h-5" />تقديم طلب الرخصة</>}
                      </Button>
                    </div>
                  )}

                  {/* Navigation */}
                  {step < 3 && (
                    <div className="flex justify-between pt-1">
                      {step > 0 ? (
                        <Button variant="outline" onClick={() => setStep(s => s - 1)} className="gap-1 rounded-xl border-[#E5E7EB]">
                          <ArrowRight className="w-4 h-4" /> السابق
                        </Button>
                      ) : <div />}
                      <Button
                        onClick={() => setStep(s => s + 1)}
                        disabled={!canNext()}
                        className="bg-[#C6A775] hover:bg-[#B8936D] text-white gap-1 rounded-xl"
                      >
                        التالي <ArrowLeft className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}