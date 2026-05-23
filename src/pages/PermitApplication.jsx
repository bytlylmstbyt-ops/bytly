/**
 * صفحة طلب رخصة البناء — One-Stop Shop
 * العميل يقدم الطلب → المهندس يرفع المخططات → بيتلي يرسل لبلدي → الرخصة تظهر في الحساب
 */
import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import PermitFeeBreakdown, { calculatePermitFees } from '@/components/permits/PermitFeeCalculator';
import PermitStatusTracker from '@/components/permits/PermitStatusTracker';
import {
  Building2, FileText, Upload, CheckCircle2, ArrowLeft, ArrowRight,
  Loader2, Award, Phone, MapPin, Layers, AlertCircle, RefreshCw, Plus, CreditCard
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

const STEPS = ['نوع الرخصة', 'بيانات الأرض', 'المستندات', 'الفاتورة والدفع'];

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

  const handlePay = async (app) => {
    setPayLoading(true);
    const res = await base44.functions.invoke('permitPayment', {
      action: 'create_checkout',
      permit_id: app.id,
    });
    if (res.data?.checkout_url) {
      window.location.href = res.data.checkout_url;
    } else {
      alert(res.data?.error || 'حدث خطأ في إنشاء جلسة الدفع');
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

  const statusLabels = {
    draft: { label: 'مسودة', color: 'bg-slate-100 text-slate-600' },
    submitted: { label: 'مُقدَّم', color: 'bg-blue-100 text-blue-700' },
    under_review: { label: 'تحت المراجعة', color: 'bg-amber-100 text-amber-700' },
    balady_submitted: { label: 'أُرسِل لبلدي', color: 'bg-purple-100 text-purple-700' },
    approved: { label: 'معتمد', color: 'bg-green-100 text-green-700' },
    rejected: { label: 'مرفوض', color: 'bg-rose-100 text-rose-700' },
    issued: { label: 'رخصة صادرة ✓', color: 'bg-green-600 text-white' },
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-[#C9A66B]" />
    </div>
  );

  if (!user) return (
    <div className="min-h-screen flex items-center justify-center" dir="rtl">
      <div className="text-center space-y-4">
        <Building2 className="w-12 h-12 text-slate-300 mx-auto" />
        <p className="text-slate-600">يرجى تسجيل الدخول لتقديم طلب رخصة</p>
        <Button onClick={() => base44.auth.redirectToLogin()} className="bg-[#C9A66B] hover:bg-[#B8936D] text-white">
          تسجيل الدخول
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-amber-50/30 py-8 px-4" dir="rtl">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-800 rounded-full px-4 py-1.5 text-sm font-medium mb-3">
            🏛️ مدعوم بربط Balady API
          </div>
          <h1 className="text-3xl font-bold text-slate-800">طلب رخصة البناء</h1>
          <p className="text-slate-500 mt-2">من الطلب إلى الرخصة الرقمية — كل شيء في بيتلي</p>
        </div>

        {/* How it works */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
          {[
            { n: '1', t: 'تقدم بطلبك', e: 'املأ النموذج' },
            { n: '2', t: 'رفع المخططات', e: 'من مهندسك المعتمد' },
            { n: '3', t: 'إرسال لبلدي', e: 'تلقائي عبر API' },
            { n: '4', t: 'الدفع الموحد', e: 'رسوم + أتعاب + بيتلي' },
            { n: '5', t: 'رخصتك الرقمية', e: 'في حسابك مباشرة' },
          ].map((s, i) => (
            <div key={i} className="bg-white rounded-xl p-3 text-center shadow-sm border border-slate-100">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#6B5D4F] to-[#C9A66B] text-white text-xs font-bold flex items-center justify-center mx-auto mb-2">{s.n}</div>
              <p className="font-semibold text-slate-700 text-xs">{s.t}</p>
              <p className="text-slate-400 text-[10px]">{s.e}</p>
            </div>
          ))}
        </div>

        <div className="grid md:grid-cols-3 gap-6">

          {/* Left: My Applications */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-700 text-sm">طلباتي ({myApplications.length})</h3>
              <Button size="sm" variant="outline" className="text-xs gap-1" onClick={() => { setShowNew(true); setSelectedApp(null); setStep(0); setForm({ permit_type:'',building_type:'',city:'',district:'',land_number:'',plan_number:'',land_area:'',building_area:'',floors_count:1,drawings_files:[],soil_report_file:'',ownership_deed_file:'',client_phone:'',notes:'' }); }}>
                <Plus className="w-3.5 h-3.5" /> طلب جديد
              </Button>
            </div>
            {myApplications.length === 0 && !showNew && (
              <div className="text-center py-6 text-slate-400 text-sm bg-white rounded-xl border border-slate-100">
                <Building2 className="w-8 h-8 mx-auto mb-2 text-slate-200" />
                لا توجد طلبات بعد
              </div>
            )}
            {myApplications.map(app => {
              const sc = statusLabels[app.status] || statusLabels.draft;
              return (
                <button
                  key={app.id}
                  onClick={() => { setSelectedApp(app); setShowNew(false); }}
                  className={`w-full text-right p-3 rounded-xl border transition-all ${selectedApp?.id === app.id ? 'border-[#C9A66B] bg-amber-50' : 'border-slate-100 bg-white hover:border-slate-200'}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-slate-700">
                      {PERMIT_TYPES.find(t => t.value === app.permit_type)?.icon} {PERMIT_TYPES.find(t => t.value === app.permit_type)?.label}
                    </span>
                    <Badge className={`text-[10px] ${sc.color}`}>{sc.label}</Badge>
                  </div>
                  <p className="text-xs text-slate-500">{app.city} — {app.land_area} م²</p>
                  <p className="text-xs text-slate-400 mt-0.5">{new Date(app.created_date).toLocaleDateString('ar-SA')}</p>
                </button>
              );
            })}
          </div>

          {/* Right: Form or Detail */}
          <div className="md:col-span-2">

            {/* Application Detail View */}
            {selectedApp && !showNew && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                <Card className="border-0 shadow-lg">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center justify-between">
                      <span>تفاصيل الطلب</span>
                      <Button variant="ghost" size="sm" onClick={async () => {
                        setLoading(true);
                        const updated = await base44.entities.PermitApplication.filter({ client_email: user.email }, '-created_date');
                        setMyApplications(updated);
                        setSelectedApp(updated.find(a => a.id === selectedApp.id) || selectedApp);
                        setLoading(false);
                      }}>
                        <RefreshCw className="w-4 h-4" />
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="bg-slate-50 rounded-lg p-2.5">
                        <p className="text-slate-400 text-xs">نوع الرخصة</p>
                        <p className="font-semibold text-slate-700">{PERMIT_TYPES.find(t => t.value === selectedApp.permit_type)?.label}</p>
                      </div>
                      <div className="bg-slate-50 rounded-lg p-2.5">
                        <p className="text-slate-400 text-xs">نوع المبنى</p>
                        <p className="font-semibold text-slate-700">{BUILDING_TYPES.find(t => t.value === selectedApp.building_type)?.label}</p>
                      </div>
                      <div className="bg-slate-50 rounded-lg p-2.5">
                        <p className="text-slate-400 text-xs">الموقع</p>
                        <p className="font-semibold text-slate-700">{selectedApp.city} - {selectedApp.district}</p>
                      </div>
                      <div className="bg-slate-50 rounded-lg p-2.5">
                        <p className="text-slate-400 text-xs">مساحة الأرض</p>
                        <p className="font-semibold text-slate-700">{selectedApp.land_area} م²</p>
                      </div>
                    </div>
                    {/* Pay Button */}
                    {selectedApp.payment_status !== 'paid' && selectedApp.total_amount > 0 && (
                      <Button
                        className="w-full bg-gradient-to-r from-[#6B5D4F] to-[#C9A66B] text-white gap-2 py-5 text-base font-bold"
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
                      <div className="bg-green-50 border border-green-200 rounded-lg p-2 text-center text-sm text-green-700 font-semibold">
                        ✅ تم الدفع — طلبك قيد المراجعة
                      </div>
                    )}

                    {selectedApp.balady_reference_number && (
                      <div className="bg-purple-50 border border-purple-200 rounded-lg p-2.5 text-sm">
                        <p className="text-purple-600 text-xs">رقم مرجع بلدي</p>
                        <p className="font-bold text-purple-800">{selectedApp.balady_reference_number}</p>
                      </div>
                    )}
                    {/* Fee summary */}
                    {selectedApp.total_amount > 0 && (
                      <div className="bg-amber-50 rounded-xl p-3 text-sm space-y-1.5">
                        <p className="font-bold text-amber-800 text-xs mb-2">الفاتورة الموحدة</p>
                        <div className="flex justify-between"><span className="text-slate-500">🏛️ رسوم بلدي</span><span>{(selectedApp.balady_fee||0).toLocaleString('ar-SA')} ر.س</span></div>
                        <div className="flex justify-between"><span className="text-slate-500">👷 أتعاب مهندس</span><span>{(selectedApp.engineer_fee||0).toLocaleString('ar-SA')} ر.س</span></div>
                        <div className="flex justify-between"><span className="text-slate-500">⚡ خدمات بيتلي</span><span>{(selectedApp.bytly_commission||0).toLocaleString('ar-SA')} ر.س</span></div>
                        <div className="flex justify-between border-t pt-1.5 font-bold"><span>الإجمالي</span><span className="text-amber-700">{(selectedApp.total_amount||0).toLocaleString('ar-SA')} ر.س</span></div>
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

            {/* New Application Form */}
            {showNew && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <Card className="border-0 shadow-lg overflow-hidden">
                  {/* Step indicator */}
                  <div className="bg-gradient-to-r from-[#6B5D4F] to-[#C9A66B] p-4">
                    <div className="flex items-center justify-between">
                      {STEPS.map((s, i) => (
                        <div key={i} className="flex items-center gap-1">
                          <div className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center ${i <= step ? 'bg-white text-[#6B5D4F]' : 'bg-white/30 text-white'}`}>
                            {i < step ? '✓' : i + 1}
                          </div>
                          <span className={`text-xs hidden md:block ${i <= step ? 'text-white' : 'text-white/60'}`}>{s}</span>
                          {i < STEPS.length - 1 && <div className={`w-6 h-0.5 mx-1 ${i < step ? 'bg-white' : 'bg-white/30'}`} />}
                        </div>
                      ))}
                    </div>
                  </div>

                  <CardContent className="p-5 space-y-5">

                    {/* Step 0: Permit & Building Type */}
                    {step === 0 && (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-2">نوع الرخصة</label>
                          <div className="grid grid-cols-3 gap-2">
                            {PERMIT_TYPES.map(t => (
                              <button key={t.value}
                                onClick={() => set('permit_type', t.value)}
                                className={`p-2.5 rounded-xl border-2 text-center transition-all ${form.permit_type === t.value ? 'border-[#C9A66B] bg-amber-50' : 'border-slate-100 hover:border-slate-200'}`}
                              >
                                <div className="text-xl mb-1">{t.icon}</div>
                                <p className="text-xs font-medium text-slate-700">{t.label}</p>
                              </button>
                            ))}
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-2">نوع المبنى</label>
                          <div className="grid grid-cols-3 gap-2">
                            {BUILDING_TYPES.map(t => (
                              <button key={t.value}
                                onClick={() => set('building_type', t.value)}
                                className={`p-2.5 rounded-xl border-2 text-center transition-all ${form.building_type === t.value ? 'border-[#C9A66B] bg-amber-50' : 'border-slate-100 hover:border-slate-200'}`}
                              >
                                <div className="text-xl mb-1">{t.icon}</div>
                                <p className="text-xs font-medium text-slate-700">{t.label}</p>
                              </button>
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
                            <label className="block text-xs font-medium text-slate-600 mb-1">المدينة *</label>
                            <select className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" value={form.city} onChange={e => set('city', e.target.value)}>
                              <option value="">اختر المدينة</option>
                              {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">الحي</label>
                            <input className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" placeholder="اسم الحي" value={form.district} onChange={e => set('district', e.target.value)} />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">رقم القطعة *</label>
                            <input className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" placeholder="مثال: 123" value={form.land_number} onChange={e => set('land_number', e.target.value)} />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">رقم المخطط</label>
                            <input className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" placeholder="مثال: 456" value={form.plan_number} onChange={e => set('plan_number', e.target.value)} />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">مساحة الأرض (م²) *</label>
                            <input type="number" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" placeholder="مثال: 500" value={form.land_area} onChange={e => set('land_area', e.target.value)} />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">مساحة البناء (م²)</label>
                            <input type="number" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" placeholder="اتركه فارغاً = نفس الأرض" value={form.building_area} onChange={e => set('building_area', e.target.value)} />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">عدد الطوابق</label>
                            <select className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" value={form.floors_count} onChange={e => set('floors_count', e.target.value)}>
                              {[1,2,3,4,5,6].map(n => <option key={n} value={n}>{n} {n === 1 ? 'طابق' : 'طوابق'}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">رقم الجوال</label>
                            <input className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" placeholder="05xxxxxxxx" value={form.client_phone} onChange={e => set('client_phone', e.target.value)} />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Step 2: Documents */}
                    {step === 2 && (
                      <div className="space-y-4">
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-700">
                          <AlertCircle className="w-4 h-4 inline ml-1" />
                          ستُرسَل هذه المستندات تلقائياً إلى نظام بلدي بعد الدفع.
                        </div>

                        {/* Drawings */}
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-1">
                            المخططات الهندسية المعتمدة * <span className="text-xs font-normal text-slate-400">(PDF أو DWG)</span>
                          </label>
                          <label className="flex flex-col items-center gap-2 border-2 border-dashed border-slate-200 rounded-xl p-4 cursor-pointer hover:border-[#C9A66B] transition-colors">
                            {uploadingFiles.drawings ? <Loader2 className="w-6 h-6 animate-spin text-slate-400" /> : <Upload className="w-6 h-6 text-slate-400" />}
                            <span className="text-sm text-slate-500">اضغط لرفع مخطط</span>
                            <input type="file" className="hidden" accept=".pdf,.dwg,.dxf" onChange={e => uploadFile(e, 'drawings_files')} />
                          </label>
                          {form.drawings_files.length > 0 && (
                            <div className="mt-2 space-y-1">
                              {form.drawings_files.map((f, i) => (
                                <div key={i} className="flex items-center gap-2 bg-green-50 rounded-lg px-3 py-1.5 text-xs">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                                  <span className="text-green-700 truncate">مخطط {i + 1} — تم الرفع ✓</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Ownership deed */}
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-1">وثيقة ملكية الأرض *</label>
                          <label className="flex items-center gap-2 border border-slate-200 rounded-xl p-3 cursor-pointer hover:border-[#C9A66B] transition-colors">
                            {uploadingFiles.ownership_deed_file ? <Loader2 className="w-4 h-4 animate-spin" /> : form.ownership_deed_file ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <FileText className="w-4 h-4 text-slate-400" />}
                            <span className="text-sm text-slate-500">{form.ownership_deed_file ? 'تم الرفع ✓' : 'رفع وثيقة الملكية PDF'}</span>
                            <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png" onChange={e => uploadFile(e, 'ownership_deed_file')} />
                          </label>
                        </div>

                        {/* Soil report */}
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-1">
                            تقرير التربة <span className="text-xs font-normal text-slate-400">(اختياري)</span>
                          </label>
                          <label className="flex items-center gap-2 border border-slate-200 rounded-xl p-3 cursor-pointer hover:border-[#C9A66B] transition-colors">
                            {uploadingFiles.soil_report_file ? <Loader2 className="w-4 h-4 animate-spin" /> : form.soil_report_file ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <FileText className="w-4 h-4 text-slate-400" />}
                            <span className="text-sm text-slate-500">{form.soil_report_file ? 'تم الرفع ✓' : 'رفع تقرير التربة'}</span>
                            <input type="file" className="hidden" accept=".pdf" onChange={e => uploadFile(e, 'soil_report_file')} />
                          </label>
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-slate-600 mb-1">ملاحظات إضافية</label>
                          <textarea className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" rows={3} placeholder="أي متطلبات خاصة..." value={form.notes} onChange={e => set('notes', e.target.value)} />
                        </div>
                      </div>
                    )}

                    {/* Step 3: Invoice & Submit */}
                    {step === 3 && (
                      <div className="space-y-4">
                        {fees && <PermitFeeBreakdown fees={fees} />}

                        <div className="bg-slate-50 rounded-xl p-4 space-y-2 text-sm">
                          <p className="font-bold text-slate-700 mb-2">ملخص الطلب</p>
                          <div className="grid grid-cols-2 gap-y-1.5 text-xs">
                            <span className="text-slate-500">النوع:</span><span className="font-medium">{PERMIT_TYPES.find(t=>t.value===form.permit_type)?.label}</span>
                            <span className="text-slate-500">المبنى:</span><span className="font-medium">{BUILDING_TYPES.find(t=>t.value===form.building_type)?.label}</span>
                            <span className="text-slate-500">الموقع:</span><span className="font-medium">{form.city} - {form.district}</span>
                            <span className="text-slate-500">المساحة:</span><span className="font-medium">{form.land_area} م²</span>
                            <span className="text-slate-500">الطوابق:</span><span className="font-medium">{form.floors_count}</span>
                            <span className="text-slate-500">المخططات:</span><span className="font-medium text-green-600">{form.drawings_files.length} ملف ✓</span>
                          </div>
                        </div>

                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-700 space-y-1">
                          <p className="font-semibold">⚡ ما سيحدث بعد التقديم:</p>
                          <ul className="space-y-0.5 list-disc list-inside text-blue-600">
                            <li>بيتلي سيراجع ملفاتك خلال 24 ساعة</li>
                            <li>يُرسَل الطلب تلقائياً لنظام بلدي</li>
                            <li>تصلك الفاتورة الموحدة للدفع</li>
                            <li>الرخصة تظهر في حسابك فور الإصدار</li>
                          </ul>
                        </div>

                        <Button
                          className="w-full bg-gradient-to-r from-[#6B5D4F] to-[#C9A66B] text-white py-3 text-base font-bold gap-2"
                          onClick={handleSubmit}
                          disabled={submitting}
                        >
                          {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Award className="w-5 h-5" />تقديم طلب الرخصة</>}
                        </Button>
                      </div>
                    )}

                    {/* Navigation */}
                    {step < 3 && (
                      <div className="flex justify-between pt-2">
                        {step > 0 ? (
                          <Button variant="outline" onClick={() => setStep(s => s - 1)} className="gap-1">
                            <ArrowRight className="w-4 h-4" /> السابق
                          </Button>
                        ) : <div />}
                        <Button
                          onClick={() => setStep(s => s + 1)}
                          disabled={!canNext()}
                          className="bg-[#C9A66B] hover:bg-[#B8936D] text-white gap-1"
                        >
                          التالي <ArrowLeft className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}