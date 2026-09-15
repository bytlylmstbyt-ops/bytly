import React, { useState } from 'react';
import { Brain, CheckCircle2, ClipboardCheck, Loader2, MessageCircle, Linkedin, Users, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { approveChannelPlans, approveRecommendations, buildChannelPlans, buildMarketingInsights, CHANNELS, createTasksFromRecommendations, getMarketingAgentSnapshot, saveMarketingSuggestions } from '@/lib/marketingAgentService';

const priorityRank = { 'عالية جدًا': 4, 'عالية': 3, 'متوسطة': 2, 'منخفضة': 1 };

const channelIcon = (id) => id === 'linkedin' ? <Linkedin className="h-4 w-4" /> : id === 'direct_outreach' ? <MessageCircle className="h-4 w-4" /> : <Users className="h-4 w-4" />;

export default function MarketingAgentPanel() {
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [snapshot, setSnapshot] = useState(null);
  const [insights, setInsights] = useState([]);
  const [channelPlans, setChannelPlans] = useState([]);
  const [savedPlans, setSavedPlans] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [message, setMessage] = useState('');

  const analyze = async () => {
    setLoading(true); setMessage(''); setRecommendations([]); setSavedPlans([]);
    try {
      const s = await getMarketingAgentSnapshot();
      const nextInsights = buildMarketingInsights(s).sort((a, b) => (priorityRank[b.priority] || 0) - (priorityRank[a.priority] || 0));
      setSnapshot(s); setInsights(nextInsights); setChannelPlans(buildChannelPlans(s, nextInsights));
    } catch (error) { setMessage(error?.message || 'تعذر تحليل بيانات المنصة.'); }
    finally { setLoading(false); }
  };

  const saveDrafts = async () => {
    if (!snapshot || !insights.length) return;
    setActionLoading(true); setMessage('');
    try {
      const result = await saveMarketingSuggestions(insights, snapshot, channelPlans);
      setRecommendations(result.recommendations || []);
      setSavedPlans(result.channelPlans || []);
      setMessage('تم حفظ المهام وخطط القنوات بحالة «مقترح من الوكيل». لم يتم إرسال رسائل أو نشر محتوى أو إنفاق ميزانية.');
    } catch (error) { setMessage(error?.message || 'تعذر حفظ مقترحات الوكيل.'); }
    finally { setActionLoading(false); }
  };

  const approveAll = async () => {
    const ids = recommendations.filter(r => r.status === 'proposed').map(r => r.id);
    if (!ids.length) return;
    setActionLoading(true); setMessage('');
    try {
      const updated = await approveRecommendations(ids);
      setRecommendations(prev => prev.map(r => updated.find(u => u.id === r.id) || r));
      setMessage('تم اعتماد الاقتراحات. لم يتم نشر محتوى أو إرسال رسائل أو إنفاق ميزانية.');
    } catch (error) { setMessage(error?.message || 'تعذر اعتماد الاقتراحات.'); }
    finally { setActionLoading(false); }
  };

  const approvePlans = async () => {
    const ids = savedPlans.filter(p => p.status === 'proposed').map(p => p.id);
    if (!ids.length) return;
    setActionLoading(true); setMessage('');
    try {
      const updated = await approveChannelPlans(ids);
      setSavedPlans(prev => prev.map(p => updated.find(u => u.id === p.id) || p));
      setMessage('تم اعتماد خطط القنوات. التنفيذ الفعلي ما زال يدويًا وبموافقة منفصلة.');
    } catch (error) { setMessage(error?.message || 'تعذر اعتماد خطط القنوات.'); }
    finally { setActionLoading(false); }
  };

  const createTasks = async () => {
    const ids = recommendations.filter(r => r.status === 'approved').map(r => r.id);
    if (!ids.length) return;
    setActionLoading(true); setMessage('');
    try {
      await createTasksFromRecommendations(ids);
      setRecommendations(prev => prev.map(r => ids.includes(r.id) ? { ...r, status: 'converted_to_task' } : r));
      setMessage('تم تحويل الاقتراحات المعتمدة إلى مهام تنفيذية بحالة «بانتظار الموافقة».');
    } catch (error) { setMessage(error?.message || 'تعذر إنشاء المهام.'); }
    finally { setActionLoading(false); }
  };

  return <div className="space-y-6" dir="rtl">
    <Card>
      <CardHeader><CardTitle className="flex items-center gap-2"><Brain className="h-5 w-5" /> وكيل تسويق بيتلي</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">يحلل بيانات بيتلي الفعلية ثم يبني مهامًا وخطط علاقات وتسويق. لا يوجد إرسال أو نشر أو إنفاق تلقائي.</p>
        <div className="flex flex-wrap gap-2">
          <Button onClick={analyze} disabled={loading || actionLoading}>{loading ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : <Sparkles className="h-4 w-4 ml-2" />}حلّل المنصة واقترح مهام جديدة</Button>
          {insights.length > 0 && !recommendations.length && <Button variant="outline" onClick={saveDrafts} disabled={actionLoading}><ClipboardCheck className="h-4 w-4 ml-2" />حفظ كمقترحات</Button>}
          {recommendations.some(r => r.status === 'proposed') && <Button variant="outline" onClick={approveAll} disabled={actionLoading}><CheckCircle2 className="h-4 w-4 ml-2" />اعتماد الاقتراحات</Button>}
          {savedPlans.some(p => p.status === 'proposed') && <Button variant="outline" onClick={approvePlans} disabled={actionLoading}><CheckCircle2 className="h-4 w-4 ml-2" />اعتماد خطط القنوات</Button>}
          {recommendations.some(r => r.status === 'approved') && <Button variant="outline" onClick={createTasks} disabled={actionLoading}><ClipboardCheck className="h-4 w-4 ml-2" />تحويل إلى مهام</Button>}
        </div>
        {message && <div className="rounded-lg border p-3 text-sm">{message}</div>}
      </CardContent>
    </Card>

    {snapshot && <Card><CardHeader><CardTitle>قراءة بيانات المنصة</CardTitle></CardHeader><CardContent><div className="grid grid-cols-2 md:grid-cols-6 gap-3">{Object.entries(snapshot.counts).map(([k,v]) => <div key={k} className="rounded-lg border p-3"><div className="text-xs text-muted-foreground">{k}</div><div className="text-xl font-semibold">{v ?? '—'}</div></div>)}</div><p className="text-xs text-muted-foreground mt-3">وقت التحليل: {new Date(snapshot.generated_at).toLocaleString('ar-SA')}</p></CardContent></Card>}

    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
      {CHANNELS.map(c => <Card key={c.id}><CardHeader><CardTitle className="text-base">{c.name}</CardTitle></CardHeader><CardContent><p className="text-sm font-medium mb-2">الجمهور</p><p className="text-sm text-muted-foreground mb-3">{c.audience}</p><p className="text-sm font-medium mb-2">كيف يعمل؟</p><p className="text-sm text-muted-foreground">{c.how}</p></CardContent></Card>)}
    </div>

    {channelPlans.length > 0 && <Card>
      <CardHeader><CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" /> خطط القنوات</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        {channelPlans.map(p => <div key={p.channel} className="rounded-xl border p-4 space-y-3">
          <div className="flex items-center justify-between gap-3"><h3 className="font-semibold flex items-center gap-2">{channelIcon(p.channel)}{CHANNELS.find(c => c.id === p.channel)?.name || p.channel}</h3><Badge>{p.priority}</Badge></div>
          <p className="text-sm"><b>الجمهور:</b> {p.audience}</p>
          <p className="text-sm"><b>الهدف:</b> {p.objective}</p>
          <p className="text-sm"><b>الزاوية:</b> {p.message_angle}</p>
          <p className="text-sm"><b>CTA:</b> {p.offer_cta}</p>
          <p className="text-sm"><b>KPI:</b> {p.kpi}</p>
          <p className="text-sm"><b>وتيرة التنفيذ:</b> {p.cadence}</p>
          <p className="text-sm"><b>الميزانية:</b> {p.budget_suggestion}</p>
          <p className="text-sm"><b>النتيجة المتوقعة:</b> {p.expected_outcome}</p>
          <p className="text-xs text-muted-foreground"><b>الدليل:</b> {p.evidence}</p>
          <p className="text-xs text-muted-foreground">الحالة: {savedPlans.find(x => x.channel === p.channel)?.status === 'approved' ? 'معتمد' : 'مقترح من الوكيل'}</p>
        </div>)}
      </CardContent>
    </Card>}

    {insights.length > 0 && <Card><CardHeader><CardTitle>المهام المقترحة</CardTitle></CardHeader><CardContent className="space-y-3">{insights.map((x,i)=><div key={i} className="border rounded-lg p-4"><div className="flex items-center justify-between gap-3"><h3 className="font-semibold">{x.title}</h3><Badge>{x.priority}</Badge></div><p className="text-sm mt-2"><b>القناة:</b> {CHANNELS.find(c => c.id === x.channel)?.name || x.channel}</p><p className="text-sm mt-2"><b>الجمهور:</b> {x.audience}</p><p className="text-sm mt-2"><b>الهدف:</b> {x.objective}</p><p className="text-sm mt-2"><b>الدليل:</b> {x.evidence}</p><p className="text-sm mt-2"><b>التوصية:</b> {x.recommendation}</p><p className="text-xs text-muted-foreground mt-3">الحالة: مقترح من الوكيل</p></div>)}</CardContent></Card>}

    {recommendations.length > 0 && <Card><CardHeader><CardTitle>دورة اعتماد التسويق</CardTitle></CardHeader><CardContent className="space-y-2">{recommendations.map(r => <div key={r.id} className="flex items-center justify-between gap-3 rounded-lg border p-3"><span className="text-sm">{r.title}</span><Badge variant="outline">{r.status === 'proposed' ? 'مقترح من الوكيل' : r.status === 'approved' ? 'معتمد' : 'تحول إلى مهمة'}</Badge></div>)}</CardContent></Card>}
  </div>;
}
