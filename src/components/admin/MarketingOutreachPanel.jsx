import React, { useEffect, useMemo, useState } from 'react';
import { Mail, MessageCircle, CheckCircle2, Copy, Eye, RefreshCw, Users, Clock, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { buildClientMessage, ensureTrackedContact, getContactMessages, getOutreachContacts, markContacted, saveDraftMessage } from '@/lib/marketingOutreachService';

const statusLabels = { new: 'جديد', contacted: 'تم التواصل', replied: 'رد العميل', follow_up: 'متابعة' };

export default function MarketingOutreachPanel() {
  const [contacts, setContacts] = useState([]);
  const [selected, setSelected] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(null);
  const [notice, setNotice] = useState('');

  const load = async () => {
    setLoading(true); setNotice('');
    try { setContacts(await getOutreachContacts()); }
    catch (e) { setNotice(`تعذر تحميل بيانات التواصل: ${e?.message || 'خطأ غير معروف'}`); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const stats = useMemo(() => ({
    total: contacts.length,
    new: contacts.filter(c => (c.status || 'new') === 'new').length,
    contacted: contacts.filter(c => c.status === 'contacted').length,
    replied: contacts.filter(c => c.status === 'replied').length,
  }), [contacts]);

  const openMessages = async (contact) => {
    setSelected(contact); setNotice('');
    try { setMessages(await getContactMessages(contact.id)); }
    catch (e) { setMessages([]); setNotice(`تعذر تحميل الرسائل: ${e?.message || 'خطأ'}`); }
  };

  const prepareMessage = async (contact) => {
    setBusy(contact.id); setNotice('');
    try {
      const existing = await getContactMessages(contact.id);
      if (!existing.some(m => m.status === 'draft')) await saveDraftMessage(contact, buildClientMessage(contact));
      await openMessages(contact);
    } catch (e) { setNotice(`تعذر تجهيز الرسالة: ${e?.message || 'خطأ'}`); }
    finally { setBusy(null); }
  };

  const confirmSent = async (contact) => {
    setBusy(contact.id); setNotice('');
    try {
      const tracked = await ensureTrackedContact(contact);
      const ms = await getContactMessages(tracked.id);
      const draft = ms.find(m => m.status === 'draft');
      await markContacted(contact, draft?.id || null);
      await load();
      if (selected?.id === contact.id) setMessages(await getContactMessages(tracked.id));
      setNotice('تم تسجيل الإرسال. لا يظهر هنا إلا بعد تأكيد أن الرسالة أُرسلت فعليًا.');
    } catch (e) { setNotice(`تعذر تسجيل الإرسال: ${e?.message || 'خطأ'}`); }
    finally { setBusy(null); }
  };

  const draft = selected && messages.find(m => m.status === 'draft');
  const sent = selected ? messages.filter(m => m.status === 'sent') : [];

  return <div dir="rtl" className="space-y-5">
    <Card className="border-[#C9A66B]/30">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2"><Users className="w-5 h-5 text-[#C9A66B]" />بيانات التواصل الفعلية</CardTitle>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}><RefreshCw className="w-4 h-4 ml-2" />تحديث</Button>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-slate-500 mb-4">هذه القائمة مبنية من بيانات الحسابات الحقيقية في Supabase. فتح واتساب أو البريد لا يسجل إرسالًا تلقائيًا.</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
          {[['إجمالي الأهداف', stats.total], ['جديد', stats.new], ['تم التواصل', stats.contacted], ['رد العميل', stats.replied]].map(([label, value]) => <div key={label} className="rounded-xl border p-3 bg-white"><div className="text-xs text-slate-500">{label}</div><div className="text-xl font-bold mt-1">{value}</div></div>)}
        </div>
        {notice && <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">{notice}</div>}
        {loading ? <div className="py-8 text-center text-slate-500">جاري تحميل جهات التواصل...</div> : contacts.length === 0 ? <div className="py-8 text-center text-slate-500">لا توجد حسابات حقيقية موسومة حاليًا للتواصل.</div> : <div className="space-y-3">
          {contacts.map(c => <div key={c.id} className="border rounded-xl p-4 bg-white">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              <div><div className="font-semibold">{c.name}</div><div className="text-xs text-slate-500 mt-1">{c.account_type}{c.company_name ? ` • ${c.company_name}` : ''}{c.city ? ` • ${c.city}` : ''}</div><div className="text-xs text-slate-500 mt-1">{c.email || 'بدون بريد'} {c.phone ? `• ${c.phone}` : ''}</div></div>
              <div className="flex flex-wrap gap-2 items-center"><span className="text-xs rounded-full px-2 py-1 bg-slate-100">{statusLabels[c.status || 'new'] || c.status}</span>
                <Button size="sm" variant="outline" onClick={() => prepareMessage(c)} disabled={busy === c.id}><Eye className="w-4 h-4 ml-1" />عرض الرسالة</Button>
                {c.phone && <Button size="sm" variant="outline" asChild><a target="_blank" rel="noreferrer" href={`https://wa.me/${String(c.phone).replace(/\D/g, '')}?text=${encodeURIComponent(buildClientMessage(c))}`}><MessageCircle className="w-4 h-4 ml-1" />فتح واتساب</a></Button>}
                {c.email && <Button size="sm" variant="outline" asChild><a href={`mailto:${c.email}?subject=${encodeURIComponent('التعريف ببيتلي')}&body=${encodeURIComponent(buildClientMessage(c))}`}><Mail className="w-4 h-4 ml-1" />فتح البريد</a></Button>}
                <Button size="sm" onClick={() => confirmSent(c)} disabled={busy === c.id || c.status === 'contacted'}><CheckCircle2 className="w-4 h-4 ml-1" />تم الإرسال</Button>
              </div>
            </div>
            {c.last_contacted_at && <div className="text-xs text-slate-400 mt-2 flex items-center gap-1"><Clock className="w-3 h-3" />آخر تواصل: {new Date(c.last_contacted_at).toLocaleString('ar-SA')}</div>}
          </div>)}
        </div>}
      </CardContent>
    </Card>

    {selected && <Card className="border-[#C9A66B]/30">
      <CardHeader className="flex flex-row items-center justify-between"><CardTitle>رسائل {selected.name}</CardTitle><Button variant="ghost" onClick={() => setSelected(null)}><X className="w-4 h-4 ml-1" />إغلاق</Button></CardHeader>
      <CardContent className="space-y-4">
        {draft && <div className="rounded-xl border border-amber-200 bg-amber-50 p-4"><div className="font-semibold text-sm mb-2">مسودة مقترحة — لم تُرسل</div><p className="text-sm whitespace-pre-wrap">{draft.body}</p><Button className="mt-3" variant="outline" onClick={() => navigator.clipboard?.writeText(draft.body)}><Copy className="w-4 h-4 ml-2" />نسخ الرسالة</Button></div>}
        {sent.length > 0 ? <div><div className="font-semibold text-sm mb-2">ما قيل للعميل فعليًا</div>{sent.map(m => <div key={m.id} className="border rounded-xl p-4 mb-2"><div className="text-xs text-slate-400 mb-2">{m.channel} • {m.sent_at ? new Date(m.sent_at).toLocaleString('ar-SA') : ''}</div><p className="text-sm whitespace-pre-wrap">{m.body}</p></div>)}</div> : <div className="text-sm text-slate-500">لا توجد رسالة مؤكدة كمرسلة حتى الآن.</div>}
      </CardContent>
    </Card>}
  </div>;
}
