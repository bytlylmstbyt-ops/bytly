import { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  MapPin, Loader2, CheckCircle2, Clock, XCircle, DollarSign,
  FileDown, FileText, Image, Ruler, Eye, AlertTriangle, Navigation, Plus, RefreshCw, Calendar, Star
} from 'lucide-react';
import { BookingForm, AppointmentList } from '@/components/survey/AppointmentBooking';
import SurveyReviewForm from '@/components/survey/SurveyReviewForm';

/* ─── Helpers ─── */
const statusConfig = {
  pending: { label: 'قيد الانتظار', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
  broadcasted: { label: 'تم الإرسال للمساحين', color: 'bg-blue-100 text-blue-700', icon: Navigation },
  accepted: { label: 'تم القبول', color: 'bg-green-100 text-green-700', icon: CheckCircle2 },
  in_progress: { label: 'قيد التنفيذ', color: 'bg-indigo-100 text-indigo-700', icon: Ruler },
  submitted: { label: 'تم التسليم', color: 'bg-purple-100 text-purple-700', icon: FileText },
  approved: { label: 'تم الاعتماد', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 },
  disbursed: { label: 'تم الصرف', color: 'bg-teal-100 text-teal-700', icon: DollarSign },
  cancelled: { label: 'ملغي', color: 'bg-red-100 text-red-700', icon: XCircle }
};

const steps = ['pending', 'broadcasted', 'accepted', 'in_progress', 'submitted', 'approved', 'disbursed'];

function formatSAR(n) { return (n || 0).toLocaleString('ar-SA') + ' ريال'; }

/* ─── Request Map Component ─── */
function RequestMap({ lat, lng, address }) {
  const mapSrc = lat && lng
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.005},${lat - 0.005},${lng + 0.005},${lat + 0.005}&layer=mapnik&marker=${lat},${lng}`
    : null;

  return (
    <div className="bg-gray-100 rounded-xl overflow-hidden border border-gray-200 h-48 md:h-64 relative">
      {mapSrc ? (
        <iframe src={mapSrc} className="w-full h-full border-0" title="موقع العقار" />
      ) : (
        <div className="flex items-center justify-center h-full text-gray-400 gap-2">
          <MapPin className="w-5 h-5" />
          <span>الموقع غير متاح</span>
        </div>
      )}
      {address && (
        <div className="absolute bottom-2 right-2 bg-white/90 px-3 py-1.5 rounded-lg text-xs font-medium shadow">
          📍 {address}
        </div>
      )}
    </div>
  );
}

/* ─── Progress Tracker ─── */
function ProgressTracker({ currentStatus }) {
  const currentIdx = steps.indexOf(currentStatus);

  return (
    <div className="flex items-center gap-1 overflow-x-auto py-2">
      {steps.filter(s => s !== 'cancelled').map((step, i) => {
        const isDone = i <= currentIdx && currentIdx >= 0;
        const isCurrent = i === currentIdx;
        const config = statusConfig[step] || { label: step, color: 'bg-gray-100 text-gray-500' };

        return (
          <div key={step} className="flex items-center gap-1 shrink-0">
            <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-all ${isDone || isCurrent ? config.color : 'bg-gray-100 text-gray-400'}`}>
              <config.icon className={`w-3 h-3 ${isCurrent ? 'animate-pulse' : ''}`} />
              <span className="hidden sm:inline">{config.label}</span>
            </div>
            {i < steps.filter(s => s !== 'cancelled').length - 1 && (
              <div className={`w-6 h-0.5 ${i < currentIdx ? 'bg-[#C9A66B]' : 'bg-gray-200'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ─── Create Request Form ─── */
function CreateRequestForm({ onCreated }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    latitude: '', longitude: '', address: '',
    property_area_sqm: '', property_status: 'vacant_land', notes: ''
  });
  const [pricing, setPricing] = useState(null);
  const [locating, setLocating] = useState(false);

  // Auto-detect location
  const detectLocation = () => {
    if (!navigator.geolocation) { setError('المتصفح لا يدعم تحديد الموقع'); return; }
    setLocating(true);
    setError('');
    navigator.geolocation.getCurrentPosition(
      pos => {
        setForm(f => ({
          ...f,
          latitude: pos.coords.latitude.toString(),
          longitude: pos.coords.longitude.toString()
        }));
        setLocating(false);
      },
      () => { setError('تعذر تحديد الموقع - أدخله يدوياً'); setLocating(false); }
    );
  };

  // Calculate price preview
  useEffect(() => {
    const area = parseFloat(form.property_area_sqm);
    if (!area || area <= 0) { setPricing(null); return; }
    const baseRate = form.property_status === 'existing_building' ? 5 : 3;
    const raw = area * baseRate;
    const total = Math.max(300, Math.min(5000, Math.round(raw)));
    const fee = Math.round(total * 0.15);
    setPricing({ total, fee, net: total - fee });
  }, [form.property_area_sqm, form.property_status]);

  const submit = async () => {
    if (!form.latitude || !form.longitude || !form.property_area_sqm) {
      setError('الرجاء إدخال الموقع والمساحة'); return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await base44.functions.invoke('surveyEngine', { action: 'create', ...form, property_area_sqm: parseFloat(form.property_area_sqm) });
      if (res.data?.error) { setError(res.data.error); return; }
      setForm({ latitude: '', longitude: '', address: '', property_area_sqm: '', property_status: 'vacant_land', notes: '' });
      setPricing(null);
      onCreated();
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  return (
    <Card className="border-[#C9A66B]/30">
      <CardContent className="p-5 space-y-4">
        <h3 className="text-lg font-bold text-[#4A3F35] flex items-center gap-2">
          <MapPin className="w-5 h-5 text-[#C9A66B]" /> طلب رفع مساحي جديد
        </h3>

        {/* Location */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Button size="sm" variant="outline" onClick={detectLocation} disabled={locating} className="gap-1.5 text-xs">
              <Navigation className="w-3.5 h-3.5" />
              {locating ? 'جارٍ التحديد...' : 'تحديد موقعي الحالي'}
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Input placeholder="خط العرض (Latitude)" value={form.latitude} onChange={e => setForm({ ...form, latitude: e.target.value })} />
            <Input placeholder="خط الطول (Longitude)" value={form.longitude} onChange={e => setForm({ ...form, longitude: e.target.value })} />
          </div>
          <Input className="mt-2" placeholder="العنوان النصي (اختياري)" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
        </div>

        {/* Property Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">مساحة العقار (م²)</label>
            <Input type="number" placeholder="مثال: 400" value={form.property_area_sqm} onChange={e => setForm({ ...form, property_area_sqm: e.target.value })} />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">حالة العقار</label>
            <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white" value={form.property_status} onChange={e => setForm({ ...form, property_status: e.target.value })}>
              <option value="vacant_land">أرض فضاء</option>
              <option value="existing_building">مبنى قائم</option>
            </select>
          </div>
        </div>

        <Input placeholder="ملاحظات إضافية (اختياري)" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />

        {/* Pricing Preview */}
        {pricing && (
          <div className="bg-[#F5F0E8] border border-[#C9A66B]/20 rounded-lg p-3 space-y-1 text-sm">
            <div className="flex justify-between"><span>رسوم المسح:</span> <span className="font-bold">{formatSAR(pricing.total)}</span></div>
            <div className="flex justify-between text-gray-500"><span>عمولة المنصة (15%):</span> <span>{formatSAR(pricing.fee)}</span></div>
            <div className="flex justify-between text-[#C9A66B] font-semibold border-t border-[#C9A66B]/20 pt-1"><span>صافي المساح:</span> <span>{formatSAR(pricing.net)}</span></div>
          </div>
        )}

        {error && <p className="text-red-500 text-sm bg-red-50 p-2 rounded flex items-center gap-1"><AlertTriangle className="w-4 h-4 shrink-0" />{error}</p>}

        <Button onClick={submit} disabled={loading} className="w-full bg-[#4A3F35] hover:bg-[#3A2F25] text-white gap-2">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          تقديم الطلب والدفع
        </Button>
      </CardContent>
    </Card>
  );
}

/* ─── Request Card ─── */
function RequestCard({ request, onRefresh }) {
  const [details, setDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [approving, setApproving] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [alreadyReviewed, setAlreadyReviewed] = useState(false);
  const [checkingReview, setCheckingReview] = useState(false);
  const statusCfg = statusConfig[request.status] || statusConfig.pending;

  const loadDetails = async () => {
    if (details) { setDetails(null); return; }
    setLoadingDetails(true);
    try {
      const res = await base44.functions.invoke('surveyEngine', { action: 'status', request_id: request.id });
      setDetails(res.data);
    } catch (e) { console.error(e); }
    finally { setLoadingDetails(false); }
  };

  const approve = async () => {
    setApproving(true);
    try {
      await base44.functions.invoke('surveyEngine', { action: 'approve', request_id: request.id });
      onRefresh();
    } catch (e) { console.error(e); }
    finally { setApproving(false); }
  };

  const cancelRequest = async () => {
    if (!confirm('هل أنت متأكد من إلغاء الطلب؟')) return;
    setCancelling(true);
    try {
      await base44.functions.invoke('surveyEngine', { action: 'cancel', request_id: request.id });
      onRefresh();
    } catch (e) { console.error(e); }
    finally { setCancelling(false); }
  };

  // Check if already reviewed
  const checkReview = async () => {
    if (!request.surveyor_id || alreadyReviewed) return;
    setCheckingReview(true);
    try {
      const existing = await base44.entities.Review.filter({
        engineer_id: request.surveyor_id,
        project_id: request.id
      });
      setAlreadyReviewed(existing.length > 0);
    } catch (e) { console.error(e); }
    finally { setCheckingReview(false); }
  };

  return (
    <Card className="border-gray-200 hover:shadow-md transition-shadow">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge className={statusCfg.color + ' gap-1'}>
                <statusCfg.icon className="w-3 h-3" /> {statusCfg.label}
              </Badge>
              <span className="text-xs text-gray-400">{new Date(request.created_date).toLocaleDateString('ar-SA')}</span>
            </div>
            <p className="text-sm font-medium mt-1.5">{request.address || 'موقع بدون عنوان'}</p>
            <p className="text-xs text-gray-500">المساحة: {request.property_area_sqm} م² | المبلغ: {formatSAR(request.total_charged)}</p>
          </div>
        </div>

        <ProgressTracker currentStatus={request.status} />

        {/* Actions */}
        <div className="flex flex-wrap gap-2">
          {request.status === 'submitted' && (
            <Button size="sm" onClick={approve} disabled={approving} className="bg-green-600 hover:bg-green-700 text-white gap-1">
              {approving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
              اعتماد المخرجات
            </Button>
          )}
          {['pending', 'broadcasted'].includes(request.status) && (
            <Button size="sm" variant="outline" onClick={cancelRequest} disabled={cancelling} className="text-red-500 gap-1">
              {cancelling ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
              إلغاء
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={loadDetails} className="gap-1">
            <Eye className="w-3.5 h-3.5" />
            {details ? 'إخفاء التفاصيل' : 'التفاصيل'}
          </Button>
        </div>

        {/* Detail Panel */}
        {details && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 space-y-3 mt-2">
            {request.surveyor_name && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-500">المساح:</span>
                <span className="font-medium">{request.surveyor_name}</span>
                {details.surveyor?.license_number && (
                  <Badge variant="outline" className="text-xs">رخصة: {details.surveyor.license_number}</Badge>
                )}
              </div>
            )}

            {details.deliverables?.length > 0 && details.deliverables.map((d, i) => (
              <div key={i} className="space-y-2">
                <p className="text-sm font-medium text-[#4A3F35]">📐 المخرجات المسلمة:</p>

                {d.cad_files?.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-xs text-gray-500 flex items-center gap-1"><FileDown className="w-3 h-3" /> ملفات CAD:</p>
                    {d.cad_files.map((url, j) => (
                      <a key={j} href={url} target="_blank" rel="noopener noreferrer" className="block text-xs text-blue-600 hover:underline truncate">{url.split('/').pop()}</a>
                    ))}
                  </div>
                )}

                {d.visual_files?.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-xs text-gray-500 flex items-center gap-1"><Image className="w-3 h-3" /> ملفات مرئية:</p>
                    {d.visual_files.map((url, j) => (
                      <a key={j} href={url} target="_blank" rel="noopener noreferrer" className="block text-xs text-blue-600 hover:underline truncate">{url.split('/').pop()}</a>
                    ))}
                  </div>
                )}

                {d.survey_metadata && Object.values(d.survey_metadata).some(v => v) && (
                  <div className="bg-white border rounded p-2 text-xs space-y-1">
                    <p className="font-medium text-gray-600">بيانات فنية:</p>
                    {d.survey_metadata.street_widths && <p>📏 عرض الشوارع: {d.survey_metadata.street_widths}</p>}
                    {d.survey_metadata.setbacks && <p>📐 الارتدادات: {d.survey_metadata.setbacks}</p>}
                    {d.survey_metadata.parcel_angles && <p>📐 زوايا القطعة: {d.survey_metadata.parcel_angles}</p>}
                  </div>
                )}
              </div>
            ))}

            {request.status === 'submitted' && (
              <div className="bg-green-50 border border-green-200 rounded p-2 text-sm text-green-700 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                تم تسليم المخرجات — يرجى مراجعتها واعتمادها للصرف
              </div>
              )}

              {/* Review section — show when approved/disbursed */}
              {['approved', 'disbursed'].includes(request.status) && request.surveyor_id && (
              <div className="mt-3">
                {!checkingReview && !alreadyReviewed && !showReview && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-amber-800 flex items-center gap-1.5">
                        <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                        قيّم تجربتك
                      </p>
                      <p className="text-xs text-amber-600 mt-0.5">شاركنا رأيك عن أداء المساح {request.surveyor_name}</p>
                    </div>
                    <Button size="sm" onClick={() => { checkReview(); setShowReview(true); }} className="bg-amber-500 hover:bg-amber-600 text-white gap-1 shrink-0">
                      <Star className="w-3.5 h-3.5" /> تقييم
                    </Button>
                  </div>
                )}
                {alreadyReviewed && !showReview && (
                  <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 rounded-lg px-3 py-2">
                    <Star className="w-4 h-4 fill-green-500 text-green-500" />
                    تم تقييم المساح — شكراً لمشاركتك!
                  </div>
                )}
                {showReview && !alreadyReviewed && (
                  <SurveyReviewForm
                    requestId={request.id}
                    surveyorId={request.surveyor_id}
                    surveyorName={request.surveyor_name}
                    clientId={request.client_id}
                    onSubmitted={() => { setAlreadyReviewed(true); setShowReview(false); onRefresh(); }}
                    onClose={() => setShowReview(false)}
                  />
                )}
              </div>
              )}

              {/* Booking section — show when surveyor assigned */}
            {request.surveyor_email && ['accepted', 'in_progress', 'submitted'].includes(request.status) && (
              <BookingForm
                requestId={request.id}
                surveyorName={request.surveyor_name}
                surveyorEmail={request.surveyor_email}
                surveyorId={request.surveyor_id}
                location={request.address}
                onBooked={() => {}}
              />
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ─── Main Page ─── */
export default function SurveyClientDashboard() {
  const [user, setUser] = useState(null);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('my-requests');

  const loadRequests = useCallback(async () => {
    try {
      const res = await base44.functions.invoke('surveyEngine', { action: 'list', role_type: 'client' });
      setRequests(res.data?.requests || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
    loadRequests();
  }, [loadRequests]);

  const activeRequests = requests.filter(r => !['disbursed', 'cancelled'].includes(r.status));
  const completedRequests = requests.filter(r => r.status === 'disbursed');

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen" dir="rtl"><Loader2 className="w-8 h-8 animate-spin text-[#C9A66B]" /></div>;
  }

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <div className="bg-gradient-to-l from-[#4A3F35] to-[#6B5D4F] text-white px-6 py-8">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <MapPin className="w-8 h-8" />
            <h1 className="text-2xl font-bold">الرفع المساحي والكروكي</h1>
          </div>
          <p className="text-white/70 text-sm">اطلب مساحاً معتمداً لرفع مساحي دقيق لعقارك — ادفع بأمان عبر الضمان المالي</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="new" className="gap-1.5"><Plus className="w-4 h-4" /> طلب جديد</TabsTrigger>
            <TabsTrigger value="my-requests" className="gap-1.5"><Clock className="w-4 h-4" /> طلباتي ({activeRequests.length})</TabsTrigger>
            <TabsTrigger value="completed" className="gap-1.5"><CheckCircle2 className="w-4 h-4" /> المكتملة ({completedRequests.length})</TabsTrigger>
            <TabsTrigger value="appointments" className="gap-1.5"><Calendar className="w-4 h-4" /> المواعيد</TabsTrigger>
          </TabsList>

          <TabsContent value="new" className="mt-4">
            <CreateRequestForm onCreated={loadRequests} />
          </TabsContent>

          <TabsContent value="my-requests" className="mt-4 space-y-4">
            {activeRequests.length === 0 ? (
              <div className="text-center py-20 text-gray-500">
                <MapPin className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>لا توجد طلبات نشطة</p>
                <Button variant="outline" className="mt-3" onClick={() => setActiveTab('new')}>إنشاء طلب جديد</Button>
              </div>
            ) : (
              activeRequests.map(r => <RequestCard key={r.id} request={r} onRefresh={loadRequests} />)
            )}
          </TabsContent>

          <TabsContent value="completed" className="mt-4 space-y-4">
            {completedRequests.length === 0 ? (
              <div className="text-center py-20 text-gray-500">
                <CheckCircle2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>لا توجد طلبات مكتملة بعد</p>
              </div>
            ) : (
              completedRequests.map(r => <RequestCard key={r.id} request={r} onRefresh={loadRequests} />)
            )}
          </TabsContent>

          <TabsContent value="appointments" className="mt-4">
            <AppointmentList role="client" />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}