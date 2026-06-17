import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Calendar, Clock, MapPin, Video, Phone, User, Loader2,
  CheckCircle2, XCircle, ExternalLink, RefreshCw, AlertTriangle
} from 'lucide-react';

const typeIcons = {
  site_visit: MapPin,
  video_call: Video,
  phone_call: Phone,
  in_person: User
};

const typeLabels = {
  site_visit: 'معاينة موقع',
  video_call: 'مكالمة فيديو',
  phone_call: 'مكالمة هاتفية',
  in_person: 'شخصي'
};

function formatDate(d) {
  return new Date(d).toLocaleDateString('ar-SA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

/* ─── Booking Form ─── */
export function BookingForm({ requestId, surveyorName, surveyorEmail, surveyorId, location: siteLocation, onBooked }) {
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    consultation_type: 'site_visit', topic: 'موعد رفع مساحي', notes: '', duration_minutes: '60'
  });

  // Load available slots when date changes
  useEffect(() => {
    if (!date || !surveyorEmail) return;
    setLoadingSlots(true);
    setTime('');
    base44.functions.invoke('bookSurveyAppointment', {
      action: 'available', surveyor_email: surveyorEmail, date
    }).then(res => {
      setAvailableSlots(res.data?.available_slots || []);
    }).catch(() => setAvailableSlots([]))
    .finally(() => setLoadingSlots(false));
  }, [date, surveyorEmail]);

  const book = async () => {
    if (!date || !time) { setError('اختر التاريخ والوقت'); return; }
    setSubmitting(true);
    setError('');
    try {
      const res = await base44.functions.invoke('bookSurveyAppointment', {
        action: 'book',
        request_id: requestId || '',
        target_type: 'surveyor',
        target_id: surveyorId,
        target_name: surveyorName,
        target_email: surveyorEmail,
        appointment_date: date,
        appointment_time: time,
        duration_minutes: parseInt(form.duration_minutes) || 60,
        consultation_type: form.consultation_type,
        topic: form.topic || 'موعد رفع مساحي',
        notes: form.notes,
        location: siteLocation || ''
      });
      if (res.data?.error) { setError(res.data.error); return; }
      setDate(''); setTime(''); setForm({ consultation_type: 'site_visit', topic: 'موعد رفع مساحي', notes: '', duration_minutes: '60' });
      onBooked?.(res.data);
    } catch (e) { setError(e.message); }
    finally { setSubmitting(false); }
  };

  return (
    <Card className="border-[#C9A66B]/30">
      <CardContent className="p-5 space-y-3">
        <h4 className="font-bold text-[#4A3F35] flex items-center gap-2">
          <Calendar className="w-5 h-5 text-[#C9A66B]" /> حجز موعد مع المساح
        </h4>
        {surveyorName && <p className="text-sm text-gray-500">المساح: <span className="font-medium text-[#4A3F35]">{surveyorName}</span></p>}

        {/* Date */}
        <div>
          <label className="text-xs text-gray-500 mb-1 block">التاريخ</label>
          <Input type="date" value={date} onChange={e => setDate(e.target.value)}
            min={new Date().toISOString().split('T')[0]}
            className="text-sm" />
        </div>

        {/* Time Slots */}
        {date && (
          <div>
            <label className="text-xs text-gray-500 mb-1 block flex items-center gap-1">
              <Clock className="w-3 h-3" /> الوقت المتاح
            </label>
            {loadingSlots ? (
              <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
            ) : availableSlots.length === 0 ? (
              <p className="text-xs text-gray-400">لا توجد أوقات متاحة في هذا التاريخ</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {availableSlots.map(slot => (
                  <button key={slot}
                    onClick={() => setTime(slot)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                      time === slot
                        ? 'bg-[#C9A66B] text-white border-[#C9A66B]'
                        : 'bg-white border-gray-200 hover:border-[#C9A66B] text-gray-700'
                    }`}>
                    {slot}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Type */}
        <div>
          <label className="text-xs text-gray-500 mb-1 block">نوع الموعد</label>
          <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white"
            value={form.consultation_type} onChange={e => setForm({ ...form, consultation_type: e.target.value })}>
            <option value="site_visit">📍 معاينة موقع</option>
            <option value="phone_call">📞 مكالمة هاتفية</option>
            <option value="video_call">📹 مكالمة فيديو</option>
            <option value="in_person">👤 مقابلة شخصية</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">المدة (دقيقة)</label>
            <Input type="number" value={form.duration_minutes} onChange={e => setForm({ ...form, duration_minutes: e.target.value })} />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">الموضوع</label>
            <Input value={form.topic} onChange={e => setForm({ ...form, topic: e.target.value })} />
          </div>
        </div>

        <Input placeholder="ملاحظات إضافية" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />

        {error && <p className="text-red-500 text-sm bg-red-50 p-2 rounded flex items-center gap-1"><AlertTriangle className="w-4 h-4 shrink-0" />{error}</p>}

        <Button onClick={book} disabled={submitting || !date || !time} className="w-full bg-[#4A3F35] hover:bg-[#3A2F25] text-white gap-2">
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calendar className="w-4 h-4" />}
          تأكيد الحجز والمزامنة مع Google Calendar
        </Button>
      </CardContent>
    </Card>
  );
}

/* ─── Appointment List ─── */
export function AppointmentList({ role, onRefresh }) {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await base44.functions.invoke('bookSurveyAppointment', { action: 'list', role });
      setAppointments(res.data?.appointments || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [role]);

  const cancel = async (id) => {
    if (!confirm('هل أنت متأكد من إلغاء الموعد؟')) return;
    try {
      await base44.functions.invoke('bookSurveyAppointment', { action: 'cancel', appointment_id: id });
      load();
      onRefresh?.();
    } catch (e) { console.error(e); }
  };

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>;
  if (appointments.length === 0) {
    return <div className="text-center py-8 text-gray-400"><Calendar className="w-10 h-10 mx-auto mb-2 opacity-30" /><p>لا توجد مواعيد</p></div>;
  }

  const active = appointments.filter(a => ['confirmed', 'pending'].includes(a.status));
  const past = appointments.filter(a => ['completed', 'cancelled'].includes(a.status));

  return (
    <div className="space-y-4">
      {active.length > 0 && (
        <div>
          <h4 className="text-sm font-bold text-[#4A3F35] mb-2">📅 المواعيد القادمة</h4>
          <div className="space-y-2">
            {active.map(a => {
              const Icon = typeIcons[a.consultation_type] || User;
              return (
                <Card key={a.id} className="border-l-4 border-l-[#C9A66B]">
                  <CardContent className="p-3 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4 text-[#C9A66B]" />
                        <span className="text-sm font-medium">{a.topic || 'موعد'}</span>
                        <Badge className={a.status === 'confirmed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}>
                          {a.status === 'confirmed' ? 'مؤكد' : 'معلق'}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 space-y-0.5">
                      <p>📅 {formatDate(a.appointment_date)} — {a.appointment_time}</p>
                      <p>⏱ {a.duration_minutes || 60} دقيقة — {typeLabels[a.consultation_type] || a.consultation_type}</p>
                      {a.location ? <p>📍 {a.location}</p> : null}
                      <p>{role === 'client' ? `👷‍♂️ ${a.target_name}` : `👤 ${a.client_name}`}</p>
                    </div>
                    <div className="flex gap-2 mt-1">
                      {a.google_calendar_link && (
                        <a href={a.google_calendar_link} target="_blank" rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                          <ExternalLink className="w-3 h-3" /> فتح في التقويم
                        </a>
                      )}
                      {a.meet_link && (
                        <a href={a.meet_link} target="_blank" rel="noopener noreferrer"
                          className="text-xs text-green-600 hover:underline flex items-center gap-1">
                          <Video className="w-3 h-3" /> رابط Google Meet
                        </a>
                      )}
                      <button onClick={() => cancel(a.id)} className="text-xs text-red-500 hover:underline ml-auto">
                        إلغاء
                      </button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {past.length > 0 && (
        <div>
          <h4 className="text-sm font-bold text-gray-400 mb-2 mt-4">📋 السابقة</h4>
          <div className="space-y-1">
            {past.slice(0, 5).map(a => (
              <div key={a.id} className="flex items-center gap-2 text-xs text-gray-400">
                <Badge variant="outline" className={a.status === 'cancelled' ? 'text-red-400' : 'text-green-400'}>
                  {a.status === 'cancelled' ? 'ملغي' : 'مكتمل'}
                </Badge>
                <span>{formatDate(a.appointment_date)} — {a.appointment_time}</span>
                <span>مع {role === 'client' ? a.target_name : a.client_name}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}