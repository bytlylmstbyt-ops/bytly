import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Calendar, Plus, RefreshCw, Loader2, Trash2, Edit2,
  Clock, MapPin, Users, ChevronLeft, ChevronRight
} from "lucide-react";
import { toast } from "sonner";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, addMonths, subMonths, parseISO } from "date-fns";
import { ar } from "date-fns/locale";

const COLORS = {
  '#4285F4': 'أزرق', '#0F9D58': 'أخضر', '#DB4437': 'أحمر',
  '#F4B400': 'أصفر', '#AB47BC': 'بنفسجي', '#00ACC1': 'سماوي',
};

function EventForm({ initial, onSave, onClose, loading }) {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const localNow = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
  const localEnd = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}T${pad(now.getHours()+1)}:${pad(now.getMinutes())}`;

  const [form, setForm] = useState({
    title: initial?.summary || '',
    description: initial?.description || '',
    location: initial?.location || '',
    startDateTime: initial?.start?.dateTime?.slice(0,16) || localNow,
    endDateTime: initial?.end?.dateTime?.slice(0,16) || localEnd,
    attendees: initial?.attendees?.map(a => a.email).join(', ') || '',
  });

  return (
    <div className="space-y-3" dir="rtl">
      <Input placeholder="عنوان الحدث *" value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-slate-500 mb-1 block">البداية</label>
          <Input type="datetime-local" value={form.startDateTime} onChange={e => setForm({...form, startDateTime: e.target.value})} />
        </div>
        <div>
          <label className="text-xs text-slate-500 mb-1 block">النهاية</label>
          <Input type="datetime-local" value={form.endDateTime} onChange={e => setForm({...form, endDateTime: e.target.value})} />
        </div>
      </div>
      <Input placeholder="الموقع (اختياري)" value={form.location} onChange={e => setForm({...form, location: e.target.value})} />
      <Input placeholder="المدعوون (بريد إلكتروني مفصول بفواصل)" value={form.attendees} onChange={e => setForm({...form, attendees: e.target.value})} />
      <Textarea placeholder="الوصف (اختياري)" rows={3} value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
      <div className="flex gap-2 justify-end">
        <Button variant="outline" onClick={onClose}>إلغاء</Button>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => onSave({
          ...form,
          attendees: form.attendees ? form.attendees.split(',').map(e => e.trim()).filter(Boolean) : []
        })} disabled={loading || !form.title}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin ml-1" /> : null}
          {initial ? 'تحديث' : 'إنشاء'}
        </Button>
      </div>
    </div>
  );
}

export default function CalendarManager() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(new Date());
  const [createOpen, setCreateOpen] = useState(false);
  const [editEvent, setEditEvent] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const invoke = async (action, data) => {
    const res = await base44.functions.invoke('calendarService', { action, data });
    return res.data;
  };

  const loadEvents = async () => {
    setLoading(true);
    try {
      const timeMin = startOfMonth(currentMonth).toISOString();
      const timeMax = endOfMonth(currentMonth).toISOString();
      const result = await invoke('listEvents', { maxResults: 100, timeMin, timeMax });
      setEvents(result.events || []);
    } catch (e) {
      toast.error('فشل تحميل الأحداث: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadEvents(); }, [currentMonth]);

  const daysInMonth = eachDayOfInterval({ start: startOfMonth(currentMonth), end: endOfMonth(currentMonth) });
  const firstDayOffset = (startOfMonth(currentMonth).getDay() + 1) % 7; // RTL: adjust

  const eventsOnDay = (day) => events.filter(ev => {
    const start = ev.start?.dateTime || ev.start?.date;
    if (!start) return false;
    return isSameDay(parseISO(start), day);
  });

  const selectedDayEvents = eventsOnDay(selectedDay);

  const handleCreate = async (form) => {
    setActionLoading(true);
    try {
      await invoke('createEvent', form);
      toast.success('تم إنشاء الحدث ✓');
      setCreateOpen(false);
      loadEvents();
    } catch (e) { toast.error('فشل الإنشاء: ' + e.message); } finally { setActionLoading(false); }
  };

  const handleUpdate = async (form) => {
    setActionLoading(true);
    try {
      await invoke('updateEvent', { ...form, eventId: editEvent.id });
      toast.success('تم التحديث ✓');
      setEditEvent(null);
      loadEvents();
    } catch (e) { toast.error('فشل التحديث: ' + e.message); } finally { setActionLoading(false); }
  };

  const handleDelete = async (eventId) => {
    if (!confirm('هل أنت متأكد من حذف هذا الحدث؟')) return;
    try {
      await invoke('deleteEvent', { eventId });
      toast.success('تم حذف الحدث');
      setEvents(prev => prev.filter(e => e.id !== eventId));
    } catch (e) { toast.error('فشل الحذف: ' + e.message); }
  };

  const formatTime = (dateTime) => {
    if (!dateTime) return '';
    try { return format(parseISO(dateTime), 'hh:mm a'); } catch { return ''; }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white p-6" dir="rtl">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">تقويم Google</h1>
              <p className="text-sm text-slate-500">إدارة المواعيد والأحداث</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={loadEvents} disabled={loading}>
              <RefreshCw className={`w-4 h-4 ml-1 ${loading ? 'animate-spin' : ''}`} />
              تحديث
            </Button>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => setCreateOpen(true)}>
              <Plus className="w-4 h-4 ml-1" />
              حدث جديد
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Calendar Grid */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="border-b pb-3">
                <div className="flex items-center justify-between">
                  <Button variant="ghost" size="sm" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                  <h2 className="text-lg font-semibold text-slate-800">
                    {format(currentMonth, 'MMMM yyyy', { locale: ar })}
                  </h2>
                  <Button variant="ghost" size="sm" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                </div>
                {/* Day headers */}
                <div className="grid grid-cols-7 mt-2">
                  {['أح', 'إث', 'ثل', 'أر', 'خم', 'جم', 'سب'].map(d => (
                    <div key={d} className="text-center text-xs font-medium text-slate-500 py-1">{d}</div>
                  ))}
                </div>
              </CardHeader>
              <CardContent className="p-3">
                {loading ? (
                  <div className="flex items-center justify-center py-16">
                    <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                  </div>
                ) : (
                  <div className="grid grid-cols-7 gap-1">
                    {/* Offset */}
                    {Array.from({ length: firstDayOffset }).map((_, i) => <div key={`off-${i}`} />)}
                    {daysInMonth.map(day => {
                      const dayEvents = eventsOnDay(day);
                      const isSelected = isSameDay(day, selectedDay);
                      const todayDay = isToday(day);
                      return (
                        <button
                          key={day.toISOString()}
                          onClick={() => setSelectedDay(day)}
                          className={`relative p-1 rounded-lg min-h-[56px] text-right transition-all border ${
                            isSelected ? 'bg-blue-100 border-blue-400' :
                            todayDay ? 'bg-amber-50 border-amber-300' :
                            'border-transparent hover:bg-slate-50 hover:border-slate-200'
                          }`}
                        >
                          <span className={`text-xs font-medium block ${todayDay ? 'text-amber-600' : 'text-slate-700'}`}>
                            {format(day, 'd')}
                          </span>
                          <div className="space-y-0.5 mt-0.5">
                            {dayEvents.slice(0, 2).map(ev => (
                              <div key={ev.id} className="text-[10px] bg-blue-500 text-white rounded px-1 truncate leading-tight">
                                {ev.summary}
                              </div>
                            ))}
                            {dayEvents.length > 2 && (
                              <div className="text-[10px] text-slate-500">+{dayEvents.length - 2} أخرى</div>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Selected Day Events */}
          <div>
            <Card className="h-full">
              <CardHeader className="border-b pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-500" />
                  {format(selectedDay, 'EEEE، d MMMM', { locale: ar })}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 space-y-3 max-h-[500px] overflow-y-auto">
                {selectedDayEvents.length === 0 ? (
                  <div className="text-center py-10 text-slate-400">
                    <Calendar className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">لا توجد أحداث</p>
                    <Button variant="outline" size="sm" className="mt-3" onClick={() => setCreateOpen(true)}>
                      <Plus className="w-3 h-3 ml-1" /> إضافة حدث
                    </Button>
                  </div>
                ) : (
                  selectedDayEvents.map(ev => (
                    <div key={ev.id} className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-medium text-slate-800 text-sm">{ev.summary}</h3>
                        <div className="flex gap-1 shrink-0">
                          <button onClick={() => setEditEvent(ev)} className="p-1 hover:bg-slate-200 rounded">
                            <Edit2 className="w-3 h-3 text-slate-500" />
                          </button>
                          <button onClick={() => handleDelete(ev.id)} className="p-1 hover:bg-red-100 rounded">
                            <Trash2 className="w-3 h-3 text-red-400" />
                          </button>
                        </div>
                      </div>
                      {(ev.start?.dateTime || ev.start?.date) && (
                        <div className="flex items-center gap-1 mt-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span className="text-xs text-slate-500">
                            {ev.start?.dateTime ? `${formatTime(ev.start.dateTime)} - ${formatTime(ev.end?.dateTime)}` : 'يوم كامل'}
                          </span>
                        </div>
                      )}
                      {ev.location && (
                        <div className="flex items-center gap-1 mt-1">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          <span className="text-xs text-slate-500 truncate">{ev.location}</span>
                        </div>
                      )}
                      {ev.attendees?.length > 0 && (
                        <div className="flex items-center gap-1 mt-1">
                          <Users className="w-3 h-3 text-slate-400" />
                          <span className="text-xs text-slate-500">{ev.attendees.length} مدعو</span>
                        </div>
                      )}
                      {ev.description && (
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2">{ev.description}</p>
                      )}
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5 text-blue-500" />
              إنشاء حدث جديد
            </DialogTitle>
          </DialogHeader>
          <EventForm onSave={handleCreate} onClose={() => setCreateOpen(false)} loading={actionLoading} />
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editEvent} onOpenChange={() => setEditEvent(null)}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit2 className="w-5 h-5 text-blue-500" />
              تعديل الحدث
            </DialogTitle>
          </DialogHeader>
          {editEvent && <EventForm initial={editEvent} onSave={handleUpdate} onClose={() => setEditEvent(null)} loading={actionLoading} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}