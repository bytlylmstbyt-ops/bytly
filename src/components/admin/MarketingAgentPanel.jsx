import React, { useState } from 'react';
import { Brain, CheckCircle2, ClipboardCheck, Loader2, MessageCircle, Linkedin, Users, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { approveRecommendations, buildMarketingInsights, CHANNELS, createTasksFromRecommendations, getMarketingAgentSnapshot, saveMarketingSuggestions } from '@/lib/marketingAgentService';
import { buildEngagementPlaybooks, saveEngagementPlaybooks } from '@/lib/marketingEngagementService';

const priorityRank = { 'عالية جدًا': 4, 'عالية': 3, 'متوسطة': 2, 'منخفضة': 1 };

export default function MarketingAgentPanel() {
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [snapshot, setSnapshot] = useState(null);
  const [insights, setInsights] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [playbooks, setPlaybooks] = useState([]);
  const [message, setMessage] = useState('');

  const analyze = async () => {
    setLoading(true); setMessage(''); setRecommendations([]); setPlaybooks([]);
    try {
      const s = await getMarketingAgentSnapshot();
      const nextInsights = buildMarketingInsights(s).sort((a, b) => (priorityRank[b.priority] || 0) - (priorityRank[a.priority] || 0));
      setSnapshot(s); setInsights(nextInsights); setPlaybooks(buildEngagementPlaybooks(s));
    } catch (error) { setMessage(error?.message || 'تعذر تحليل بيانات المنصة.'); }
    finally { setLoading(false); }
  };

  const saveDrafts = async () => {
    if (!snapshot || !insights.length) return;
    setActionLoading(true); setMessage('');
    try {
      const result = await saveMarketingSuggestions(insights, snapshot);
      if (playbooks.length) await saveEngagementPlaybooks(playbooks);
      setRecommendations(result.recommendations || []);
      setMessage('تم حفظ المهام والخطط بحالة «مقترح من الوكيل». لم يتم إرسال رسائل أو نشر محتوى أو إنفاق ميزانية.');
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
          {recommendations.some(r => r.status === 'approved') && <Button variant="outline" onClick={createTasks} disabled={actionLoading}><ClipboardCheck className="h-4 w-4 ml-2" />تحويل إلى مهام</Button>}
        </div>
        {message && <div className="rounded-lg border p-3 text-sm">{message}</div>}
      </CardContent>
    </Card>

    {snapshot && <Card><CardHeader><CardTitle>قراءة بيانات المنصة</CardTitle></CardHeader><CardContent><div className="grid grid-cols-2 md:grid-cols-6 gap-3">{Object.entries(snapshot.counts).map(([k,v]) => <div key={k} className="rounded-lg border p-3"><div className="text-xs text-muted-foreground">{k}</div><div className="text-xl font-semibold">{v ?? '—'}</div></div>)}</div><p className="text-xs text-muted-foreground mt-3">وقت التحليل: {new Date(snapshot.generated_at).toLocaleString('ar-SA')}</p></CardContent></Card>}

    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
      {CHANNELS.map(c => <Card key={c.id}><CardHeader><CardTitle className="text-base">{c.name}</CardTitle></CardHeader><CardContent><p className="text-sm font-medium mb-2">الجمهور</p><p className="text-sm text-muted-foreground mb-3">{c.audience}</p><p className="text-sm font-medium mb-2">كيف يعمل؟</p><p className="text-sm text-muted-foreground">{c.how}</p></CardContent></Card>)}
    </div>

    {playbooks.length > 0 && <Card>
      <CardHeader><CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" /> خطط العلاقات والتواصل</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        {playbooks.map(p => <div key={p.channel} className="rounded-xl border p-4 space-y-3">
          <div className="flex items-center justify-between gap-3"><h3 className="font-semibold flex items-center gap-2">{p.channel === 'linkedin' ? <Linkedin className="h-4 w-4" /> : p.channel === 'direct_outreach' ? <MessageCircle className="h-4 w-4" /> : <Users className="h-4 w-4" />}{p.title}</h3><Badge>{p.priority}</Badge></div>
          <p className="text-sm"><b>الجمهور:</b> {p.audience}</p>
          <p className="text-sm"><b>الهدف:</b> {p.objective}</p>
          <div><p className="text-sm font-medium mb-1">خطة التنفيذ المقترحة</p><ol className="list-decimal pr-5 text-sm text-muted-foreground space-y-1">{p.steps.map((s,i)=><li key={i}>{s}</li>)}</ol></div>
          <p className="text-sm"><b>CTA:</b> {p.cta}</p>
          <p className="text-sm"><b>KPI:</b> {p.channel === 'direct_outreach' ? 'جهات اتصال → ردود → اجتماعات → تسجيلات → مشاريع' : p.channel === 'linkedin' ? 'وصول مهني → زيارات → محادثات → تسجيلات/اجتماعات' : 'لقاءات → اجتماعات متابعة → شراكات → فرص/صفقات'}</p>
          <p className="text-xs text-muted-foreground"><b>ضابط:</b> {p.guardrail}</p>
          <p className="text-xs text-muted-foreground"><b>الدليل:</b> {p.evidence}</p>
        </div>)}
      </CardContent>
    </Card>}

    {insights.length > 0 && <Card><CardHeader><CardTitle>اقتراحات الوكيل</CardTitle></CardHeader><CardContent className="space-y-3">{insights.map((x,i)=><div key={i} className="border rounded-lg p-4"><div className="flex items-center justify-between gap-3"><h3 className="font-semibold">{x.title}</h3><Badge>{x.priority}</Badge></div><p className="text-sm mt-2"><b>القناة:</b> {CHANNELS.find(c => c.id === x.channel)?.name || x.channel}</p><p className="text-sm mt-2"><b>الجمهور:</b> {x.audience}</p><p className="text-sm mt-2"><b>الهدف:</b> {x.objective}</p><p className="text-sm mt-2"><b>الدليل:</b> {x.evidence}</p><p className="text-sm mt-2"><b>التوصية:</b> {x.recommendation}</p><p className="text-xs text-muted-foreground mt-3">الحالة: مقترح من الوكيل</p></div>)}</CardContent></Card>}

    {recommendations.length > 0 && <Card><CardHeader><CardTitle>دورة اعتماد التسويق</CardTitle></CardHeader><CardContent className="space-y-2">{recommendations.map(r => <div key={r.id} className="flex items-center justify-between gap-3 rounded-lg border p-3"><span className="text-sm">{r.title}</span><Badge variant="outline">{r.status === 'proposed' ? 'مقترح من الوكيل' : r.status === 'approved' ? 'معتمد' : 'تحول إلى مهمة'}</Badge></div>)}</CardContent></Card>}
  </div>;
}
