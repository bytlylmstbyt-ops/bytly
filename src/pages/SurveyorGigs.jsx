import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  MapPin, Loader2, CheckCircle2, Clock, Navigation, Ruler,
  DollarSign, Upload, FileDown, FileText, Image, Map, RefreshCw,
  UserCheck, AlertTriangle, Calendar, ShieldCheck, Star, MessageSquare
} from 'lucide-react';
import { AppointmentList } from '@/components/survey/AppointmentBooking';

/* ─── Helpers ─── */
const statusConfig = {
  broadcasted: { label: 'متاح', color: 'bg-blue-100 text-blue-700', icon: MapPin },
  accepted: { label: 'تم القبول', color: 'bg-green-100 text-green-700', icon: CheckCircle2 },
  in_progress: { label: 'قيد التنفيذ', color: 'bg-indigo-100 text-indigo-700', icon: Ruler },
  submitted: { label: 'تم التسليم', color: 'bg-purple-100 text-purple-700', icon: FileText },
  disbursed: { label: 'تم الصرف', color: 'bg-teal-100 text-teal-700', icon: DollarSign }
};

function formatSAR(n) { return (n || 0).toLocaleString('ar-SA') + ' ريال'; }

/* ─── Register Surveyor Form ─── */
function RegisterSurveyorForm({ onRegistered }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    full_name: '', phone: '', license_number: '', city: '',
    latitude: '', longitude: '', geofencing_radius_km: '50',
    bio: '', years_experience: '0'
  });
  const [locating, setLocating] = useState(false);

  const detectLocation = () => {
    if (!navigator.geolocation) { setError('المتصفح لا يدعم تحديد الموقع'); return; }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      pos => setForm(f => ({ ...f, latitude: pos.coords.latitude.toString(), longitude: pos.coords.longitude.toString() })),
      () => setError('تعذر تحديد الموقع'),
      { timeout: 10000 }
    );
    setLocating(false);
  };

  const submit = async () => {
    if (!form.license_number || !form.city) { setError('الرجاء إدخال رقم الرخصة والمدينة'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await base44.functions.invoke('surveyEngine', { action: 'register', ...form, years_experience: parseInt(form.years_experience) || 0, geofencing_radius_km: parseInt(form.geofencing_radius_km) || 50, latitude: form.latitude ? parseFloat(form.latitude) : null, longitude: form.longitude ? parseFloat(form.longitude) : null });
      if (res.data?.error) { setError(res.data.error); return; }
      onRegistered();
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  return (
    <Card className="border-[#C9A66B]/30">
      <CardContent className="p-5 space-y-3">
        <h3 className="text-lg font-bold text-[#4A3F35] flex items-center gap-2">
          <UserCheck className="w-5 h-5 text-[#C9A66B]" /> تسجيل كمساح معتمد
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <Input placeholder="الاسم الكامل" value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} />
          <Input placeholder="رقم الهاتف" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
        </div>
        <Input placeholder="رقم الرخصة المهنية *" value={form.license_number} onChange={e => setForm({ ...form, license_number: e.target.value })} required />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <Input placeholder="المدينة *" value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} required />
          <div>
            <label className="text-xs text-gray-500 mb-1 block">نطاق التغطية (كم)</label>
            <Input type="number" value={form.geofencing_radius_km} onChange={e => setForm({ ...form, geofencing_radius_km: e.target.value })} />
          </div>
        </div>
        <div>
          <Button size="sm" variant="outline" onClick={detectLocation} disabled={locating} className="gap-1.5 text-xs mb-2">
            <Navigation className="w-3.5 h-3.5" /> {locating ? 'جارٍ التحديد...' : 'تحديد موقعي الحالي'}
          </Button>
          <div className="grid grid-cols-2 gap-2">
            <Input placeholder="خط العرض" value={form.latitude} onChange={e => setForm({ ...form, latitude: e.target.value })} />
            <Input placeholder="خط الطول" value={form.longitude} onChange={e => setForm({ ...form, longitude: e.target.value })} />
          </div>
        </div>
        <Input placeholder="سنوات الخبرة" type="number" value={form.years_experience} onChange={e => setForm({ ...form, years_experience: e.target.value })} />
        <Input placeholder="نبذة تعريفية" value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })} />

        {error && <p className="text-red-500 text-sm bg-red-50 p-2 rounded flex items-center gap-1"><AlertTriangle className="w-4 h-4 shrink-0" />{error}</p>}

        <Button onClick={submit} disabled={loading} className="w-full bg-[#4A3F35] hover:bg-[#3A2F25] text-white gap-2">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserCheck className="w-4 h-4" />}
          تسجيل
        </Button>
      </CardContent>
    </Card>
  );
}

/* ─── Submit Deliverables Form ─── */
function SubmitDeliverablesForm({ request, onDone }) {
  const [cadFiles, setCadFiles] = useState([]);
  const [visualFiles, setVisualFiles] = useState([]);
  const [metadata, setMetadata] = useState({
    street_widths: '', setbacks: '', parcel_angles: '', coordinates_system: '', additional_notes: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const uploadFile = async (e, type) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const validCad = ['.dwg', '.dxf'];
    const validVisual = ['.pdf', '.png', '.jpg', '.jpeg'];
    const ext = '.' + file.name.split('.').pop().toLowerCase();

    if (type === 'cad' && !validCad.includes(ext)) { setError('ملفات CAD يجب أن تكون بصيغة dwg أو dxf'); return; }
    if (type === 'visual' && !validVisual.includes(ext)) { setError('الملفات المرئية يجب أن تكون pdf, png, أو jpg'); return; }

    setError('');
    try {
      const res = await base44.integrations.Core.UploadFile({ file });
      const url = res.file_url;
      if (type === 'cad') setCadFiles(prev => [...prev, url]);
      else setVisualFiles(prev => [...prev, url]);
    } catch (e) { setError('فشل رفع الملف'); }
  };

  const submit = async () => {
    if (cadFiles.length === 0 && visualFiles.length === 0) { setError('يجب رفع ملف واحد على الأقل'); return; }
    setSubmitting(true);
    setError('');
    try {
      const res = await base44.functions.invoke('surveyEngine', {
        action: 'submit', request_id: request.id,
        cad_files: cadFiles, visual_files: visualFiles,
        survey_metadata: metadata
      });
      if (res.data?.error) { setError(res.data.error); return; }
      onDone();
    } catch (e) { setError(e.message); }
    finally { setSubmitting(false); }
  };

  return (
    <div className="bg-white border border-[#C9A66B]/30 rounded-lg p-4 space-y-4">
      <h4 className="font-bold text-[#4A3F35]">📐 تسليم مخرجات المسح</h4>

      {/* CAD Files */}
      <div>
        <p className="text-sm font-medium text-gray-600 mb-1">ملفات CAD (dwg, dxf):</p>
        <label className="flex items-center gap-2 border-2 border-dashed border-gray-300 rounded-lg p-4 cursor-pointer hover:border-[#C9A66B] transition-colors">
          <Upload className="w-5 h-5 text-gray-400" />
          <span className="text-sm text-gray-500">اسحب وأفلت أو اضغط للرفع</span>
          <input type="file" accept=".dwg,.dxf" className="hidden" onChange={e => uploadFile(e, 'cad')} />
        </label>
        {cadFiles.map((url, i) => (
          <div key={i} className="flex items-center gap-1 mt-1 text-xs text-blue-600"><FileDown className="w-3 h-3" /> {url.split('/').pop()}</div>
        ))}
      </div>

      {/* Visual Files */}
      <div>
        <p className="text-sm font-medium text-gray-600 mb-1">ملفات مرئية (pdf, png, jpg):</p>
        <label className="flex items-center gap-2 border-2 border-dashed border-gray-300 rounded-lg p-4 cursor-pointer hover:border-[#C9A66B] transition-colors">
          <Image className="w-5 h-5 text-gray-400" />
          <span className="text-sm text-gray-500">اسحب وأفلت أو اضغط للرفع</span>
          <input type="file" accept=".pdf,.png,.jpg,.jpeg" className="hidden" onChange={e => uploadFile(e, 'visual')} />
        </label>
        {visualFiles.map((url, i) => (
          <div key={i} className="flex items-center gap-1 mt-1 text-xs text-blue-600"><Image className="w-3 h-3" /> {url.split('/').pop()}</div>
        ))}
      </div>

      {/* Technical Metadata */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-gray-600">البيانات الفنية للمسح:</p>
        <Input placeholder="عرض الشوارع المحيطة" value={metadata.street_widths} onChange={e => setMetadata({ ...metadata, street_widths: e.target.value })} />
        <Input placeholder="الارتدادات" value={metadata.setbacks} onChange={e => setMetadata({ ...metadata, setbacks: e.target.value })} />
        <Input placeholder="زوايا القطعة" value={metadata.parcel_angles} onChange={e => setMetadata({ ...metadata, parcel_angles: e.target.value })} />
        <Input placeholder="نظام الإحداثيات المستخدم" value={metadata.coordinates_system} onChange={e => setMetadata({ ...metadata, coordinates_system: e.target.value })} />
        <Input placeholder="ملاحظات فنية إضافية" value={metadata.additional_notes} onChange={e => setMetadata({ ...metadata, additional_notes: e.target.value })} />
      </div>

      {error && <p className="text-red-500 text-sm bg-red-50 p-2 rounded flex items-center gap-1"><AlertTriangle className="w-4 h-4 shrink-0" />{error}</p>}

      <Button onClick={submit} disabled={submitting} className="w-full bg-[#C9A66B] hover:bg-[#B8944F] text-white gap-2">
        {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
        تسليم المخرجات
      </Button>
    </div>
  );
}

/* ─── Available Gig Card ─── */
function GigCard({ request, onAccept, onRefresh }) {
  const [submitting, setSubmitting] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const statusCfg = statusConfig[request.status] || { label: request.status, color: 'bg-gray-100', icon: Clock };

  const accept = async () => {
    setSubmitting(true);
    try {
      await base44.functions.invoke('surveyEngine', { action: 'accept', request_id: request.id });
      onRefresh();
    } catch (e) { console.error(e); }
    finally { setSubmitting(false); }
  };

  return (
    <Card className={`border-gray-200 ${request.status === 'broadcasted' ? 'border-l-4 border-l-blue-500' : ''}`}>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge className={statusCfg.color + ' gap-1'}>
                <statusCfg.icon className="w-3 h-3" /> {statusCfg.label}
              </Badge>
              {request.distance_km != null && (
                <Badge variant="outline" className="gap-1">
                  <Navigation className="w-3 h-3" /> {request.distance_km} كم
                </Badge>
              )}
            </div>
            <p className="text-sm font-medium mt-1.5">{request.address || 'موقع بدون عنوان'}</p>
            <div className="text-xs text-gray-500 space-y-0.5 mt-1">
              <p>📐 المساحة: {request.property_area_sqm} م² | حالة: {request.property_status === 'existing_building' ? 'مبنى قائم' : 'أرض فضاء'}</p>
              <p>💰 المبلغ: <span className="font-bold text-[#C9A66B]">{formatSAR(request.payout_amount)}</span></p>
              <p>📅 {new Date(request.created_date).toLocaleDateString('ar-SA')}</p>
            </div>
          </div>
          {request.status === 'broadcasted' && (
            <Button size="sm" onClick={accept} disabled={submitting} className="bg-blue-600 hover:bg-blue-700 text-white shrink-0 gap-1">
              {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserCheck className="w-3.5 h-3.5" />}
              قبول
            </Button>
          )}
        </div>

        {/* Map */}
        {request.latitude && request.longitude && (
          <div className="h-32 rounded-lg overflow-hidden border border-gray-200">
            <iframe
              src={`https://www.openstreetmap.org/export/embed.html?bbox=${request.longitude - 0.005},${request.latitude - 0.005},${request.longitude + 0.005},${request.latitude + 0.005}&layer=mapnik&marker=${request.latitude},${request.longitude}`}
              className="w-full h-full border-0" title="موقع العقار" />
          </div>
        )}

        {/* Upload for accepted/in-progress */}
        {['accepted', 'in_progress'].includes(request.status) && (
          <div>
            {!showUpload ? (
              <Button size="sm" variant="outline" onClick={() => setShowUpload(true)} className="gap-1 w-full">
                <Upload className="w-3.5 h-3.5" /> تسليم المخرجات
              </Button>
            ) : (
              <SubmitDeliverablesForm request={request} onDone={onRefresh} />
            )}
          </div>
        )}

        {request.status === 'submitted' && (
          <Badge className="bg-purple-100 text-purple-700 gap-1 w-fit">
            <Clock className="w-3 h-3" /> بانتظار اعتماد العميل
          </Badge>
        )}
        {request.status === 'disbursed' && (
          <div className="bg-teal-50 border border-teal-200 rounded p-2 text-sm text-teal-700 flex items-center gap-2">
            <DollarSign className="w-4 h-4" /> تم صرف {formatSAR(request.payout_amount)} لرصيدك
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ─── Main Page ─── */
export default function SurveyorGigs() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [availableGigs, setAvailableGigs] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('available');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [profileRes, availRes, myRes] = await Promise.all([
        base44.entities.SurveyorProfile.filter({ email: user?.email }).catch(() => []),
        base44.functions.invoke('surveyEngine', { action: 'list', role_type: 'available' }).catch(() => ({ data: { requests: [] } })),
        base44.functions.invoke('surveyEngine', { action: 'list', role_type: 'surveyor' }).catch(() => ({ data: { requests: [] } }))
      ]);
      const p = profileRes?.[0] || null;
      setProfile(p);
      // Redirect to terms page if registered but terms not accepted yet
      if (p && !p.terms_accepted) { navigate('/SurveyorTerms'); return; }
      setAvailableGigs(availRes.data?.requests || []);
      setMyRequests(myRes.data?.requests || []);

      // Load reviews for the surveyor
      if (p) {
        try {
          const reviewData = await base44.entities.Review.filter({ engineer_id: p.id }, '-created_date', 20);
          setReviews(reviewData || []);
        } catch (_) { setReviews([]); }
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [user]);

  useEffect(() => {
    base44.auth.me().then(u => { setUser(u); }).catch(() => {});
  }, []);

  useEffect(() => {
    if (user) loadData();
  }, [user, loadData]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!user) return;
    const unsub = base44.entities.SurveyRequest.subscribe(() => { loadData(); });
    return () => unsub();
  }, [user, loadData]);

  if (loading && !user) {
    return <div className="flex items-center justify-center min-h-screen" dir="rtl"><Loader2 className="w-8 h-8 animate-spin text-[#C9A66B]" /></div>;
  }

  // Not registered
  if (!loading && !profile) {
    return (
      <div className="min-h-screen bg-gray-50" dir="rtl">
        <div className="bg-gradient-to-l from-[#4A3F35] to-[#6B5D4F] text-white px-6 py-8">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center gap-3 mb-2">
              <Map className="w-8 h-8" />
              <h1 className="text-2xl font-bold">لوحة المساح</h1>
            </div>
            <p className="text-white/70 text-sm">سجّل كمساح معتمد لاستقبال طلبات الرفع المساحي</p>
          </div>
        </div>
        <div className="max-w-xl mx-auto px-4 py-6">
          <RegisterSurveyorForm onRegistered={loadData} />
        </div>
      </div>
    );
  }

  // Registered but terms not accepted — show terms prompt inline
  if (profile && !profile.terms_accepted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center" dir="rtl">
        <div className="max-w-md w-full mx-auto px-4 py-16 text-center">
          <ShieldCheck className="w-16 h-16 mx-auto mb-4 text-[#C9A66B]" />
          <h2 className="text-xl font-bold text-[#4A3F35] mb-3">تفعيل الحساب مطلوب</h2>
          <p className="text-gray-600 text-sm mb-6">
            للمتابعة واستقبال طلبات الرفع المساحي، يجب الموافقة على الشروط والأحكام الفنية أولاً.
          </p>
          <Button onClick={() => navigate('/SurveyorTerms')} className="bg-[#4A3F35] hover:bg-[#3A2F25] text-white gap-2">
            <FileText className="w-4 h-4" /> الاطلاع على الشروط والموافقة
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <div className="bg-gradient-to-l from-[#4A3F35] to-[#6B5D4F] text-white px-6 py-8">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Map className="w-8 h-8" />
              <div>
                <h1 className="text-2xl font-bold">لوحة المساح</h1>
                <p className="text-white/70 text-sm">مرحباً {profile?.full_name || user?.full_name}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-white/70">الرصيد المتاح</p>
              <p className="text-xl font-bold text-[#C9A66B]">{formatSAR(profile?.available_balance)}</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mt-4">
            <div className="bg-white/10 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold">{availableGigs.length}</p>
              <p className="text-xs text-white/70">طلبات متاحة</p>
            </div>
            <div className="bg-white/10 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold">{myRequests.filter(r => ['accepted', 'in_progress'].includes(r.status)).length}</p>
              <p className="text-xs text-white/70">قيد التنفيذ</p>
            </div>
            <div className="bg-white/10 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold">{profile?.total_jobs || 0}</p>
              <p className="text-xs text-white/70">مكتملة</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="flex items-center justify-between mb-4">
            <TabsList>
              <TabsTrigger value="available" className="gap-1.5"><MapPin className="w-4 h-4" /> الطلبات المتاحة ({availableGigs.length})</TabsTrigger>
              <TabsTrigger value="my" className="gap-1.5"><Ruler className="w-4 h-4" /> طلباتي ({myRequests.length})</TabsTrigger>
              <TabsTrigger value="appointments" className="gap-1.5"><Calendar className="w-4 h-4" /> مواعيدي</TabsTrigger>
              <TabsTrigger value="reviews" className="gap-1.5"><Star className="w-4 h-4" /> تقييماتي ({reviews.length})</TabsTrigger>
            </TabsList>
            <Button size="sm" variant="outline" onClick={loadData} className="gap-1">
              <RefreshCw className="w-3.5 h-3.5" /> تحديث
            </Button>
          </div>

          <TabsContent value="available" className="space-y-4">
            {availableGigs.length === 0 ? (
              <div className="text-center py-20 text-gray-500">
                <MapPin className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>لا توجد طلبات متاحة حالياً في نطاق تغطيتك</p>
                <p className="text-xs mt-1">سيتم إشعارك فور وصول طلبات جديدة</p>
              </div>
            ) : (
              availableGigs.map(r => <GigCard key={r.id} request={r} onRefresh={loadData} />)
            )}
          </TabsContent>

          <TabsContent value="my" className="space-y-4">
            {myRequests.length === 0 ? (
              <div className="text-center py-20 text-gray-500">
                <Ruler className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>لم تقبل أي طلب بعد</p>
              </div>
            ) : (
              myRequests.map(r => <GigCard key={r.id} request={r} onRefresh={loadData} />)
            )}
          </TabsContent>

          <TabsContent value="appointments" className="mt-4">
            <AppointmentList role="surveyor" onRefresh={loadData} />
          </TabsContent>

          <TabsContent value="reviews" className="mt-4 space-y-4">
            {reviews.length === 0 ? (
              <div className="text-center py-20 text-gray-500">
                <Star className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>لا توجد تقييمات حتى الآن</p>
                <p className="text-xs mt-1">ستظهر هنا تقييمات العملاء بعد اكتمال الطلبات</p>
              </div>
            ) : (
              reviews.map(review => (
                <Card key={review.id} className="border-gray-200">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map(s => (
                              <Star key={s} className={`w-4 h-4 ${s <= review.rating ? 'fill-[#C9A66B] text-[#C9A66B]' : 'text-gray-300'}`} />
                            ))}
                            <span className="text-sm font-bold text-[#C9A66B] mr-1">{review.rating}/5</span>
                          </div>
                          <span className="text-xs text-gray-400">
                            {new Date(review.created_date).toLocaleDateString('ar-SA', { year: 'numeric', month: 'short', day: 'numeric' })}
                          </span>
                        </div>

                        {review.milestone_title && (
                          <Badge variant="outline" className="mb-2 text-xs gap-1">
                            <MapPin className="w-3 h-3" /> {review.milestone_title}
                          </Badge>
                        )}

                        {review.comment && (
                          <p className="text-sm text-gray-600 leading-relaxed mb-2 flex items-start gap-1.5">
                            <MessageSquare className="w-3.5 h-3.5 text-gray-400 mt-0.5 shrink-0" />
                            {review.comment}
                          </p>
                        )}

                        {(review.quality_rating > 0 || review.delivery_rating > 0 || review.communication_rating > 0) && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {review.quality_rating > 0 && (
                              <span className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full">
                                🏆 دقة الرفع {review.quality_rating}/5
                              </span>
                            )}
                            {review.delivery_rating > 0 && (
                              <span className="inline-flex items-center gap-1 text-xs bg-purple-50 text-purple-700 px-2 py-1 rounded-full">
                                📐 جودة الملفات {review.delivery_rating}/5
                              </span>
                            )}
                            {review.communication_rating > 0 && (
                              <span className="inline-flex items-center gap-1 text-xs bg-green-50 text-green-700 px-2 py-1 rounded-full">
                                ⏱️ الالتزام بالوقت {review.communication_rating}/5
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}