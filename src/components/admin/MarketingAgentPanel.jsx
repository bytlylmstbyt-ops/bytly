import React, { useState } from 'react';
import { Brain, CheckCircle2, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getMarketingAgentSnapshot, buildMarketingInsights, saveMarketingSuggestions, CHANNELS } from '@/lib/marketingAgentService';

export default function MarketingAgentPanel() {
  const [loading, setLoading] = useState(false);
  const [snapshot, setSnapshot] = useState(null);
  const [insights, setInsights] = useState([]);
  const [saved, setSaved] = useState(false);
  const analyze = async () => {
    setLoading(true); setSaved(false);
    try {
      const s = await getMarketingAgentSnapshot();
      setSnapshot(s); setInsights(buildMarketingInsights(s));
    } finally { setLoading(false); }
  };
  const approve = async () => {
    if (!snapshot || !insights.length) return;
    await saveMarketingSuggestions(insights, snapshot);
    setSaved(true);
  };
  return <div className="space-y-6" dir="rtl">
    <Card>
      <CardHeader><CardTitle className="flex items-center gap-2"><Brain className="h-5 w-5" /> Marketing Agent — وكيل تسويق بيتلي</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">يحلل بيانات بيتلي الفعلية ويقترح قنوات ومبادرات تسويقية. لا ينشر ولا ينفق ولا ينشئ مهمة تنفيذية دون موافقة.</p>
        <div className="flex gap-2"><Button onClick={analyze} disabled={loading}>{loading ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : <Sparkles className="h-4 w-4 ml-2" />}حلّل المنصة واقترح مهام جديدة</Button>{insights.length > 0 && <Button variant="outline" onClick={approve}><CheckCircle2 className="h-4 w-4 ml-2" />اعتماد الاقتراحات</Button>}</div>
      </CardContent>
    </Card>
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">{CHANNELS.map(c => <Card key={c.id}><CardHeader><CardTitle className="text-base">{c.name}</CardTitle><Badge variant="outline">{c.priority}</Badge></CardHeader><CardContent><p className="text-sm font-medium mb-2">الجمهور</p><p className="text-sm text-muted-foreground mb-3">{c.audience}</p><p className="text-sm font-medium mb-2">كيف يعمل؟</p><p className="text-sm text-muted-foreground">{c.how}</p></CardContent></Card>)}</div>
    {snapshot && <Card><CardHeader><CardTitle>قراءة بيانات المنصة</CardTitle></CardHeader><CardContent><div className="grid grid-cols-2 md:grid-cols-6 gap-3">{Object.entries(snapshot.counts).map(([k,v]) => <div key={k} className="rounded-lg border p-3"><div className="text-xs text-muted-foreground">{k}</div><div className="text-xl font-semibold">{v}</div></div>)}</div></CardContent></Card>}
    {insights.length > 0 && <Card><CardHeader><CardTitle>اقتراحات الوكيل</CardTitle></CardHeader><CardContent className="space-y-3">{insights.map((x,i)=><div key={i} className="border rounded-lg p-4"><div className="flex items-center justify-between gap-3"><h3 className="font-semibold">{x.title}</h3><Badge>{x.priority}</Badge></div><p className="text-sm mt-2"><b>الدليل:</b> {x.evidence}</p><p className="text-sm mt-2"><b>التوصية:</b> {x.recommendation}</p></div>)}{saved && <div className="text-sm text-green-600">تم حفظ الاقتراحات كمسودات، ولن يبدأ أي تنفيذ تلقائي.</div>}</CardContent></Card>}
  </div>;
}
