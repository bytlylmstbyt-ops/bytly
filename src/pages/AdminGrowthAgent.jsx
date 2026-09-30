import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

const categories = [
  ['engineer','مهندسين'],
  ['contractor','مقاولين'],
  ['engineering_firm','شركات ومكاتب هندسية'],
  ['supplier','موردين'],
  ['technical_consultant','مستشارين فنيين'],
  ['legal_consultant','مستشارين قانونيين'],
  ['investor','مستثمرين ومطورين'],
  ['client','أصحاب مشاريع'],
];

export default function AdminGrowthAgent() {
  const [funnel, setFunnel] = useState({});
  const [prospects, setProspects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('engineer');
  const [city, setCity] = useState('');
  const [dailyLimit, setDailyLimit] = useState(20);
  const [message, setMessage] = useState('');
  const [campaignName, setCampaignName] = useState('استقطاب بيتلي');
  const [autoSend, setAutoSend] = useState(false);\n  const [searchCount, setSearchCount] = useState(10);\n  const [searching, setSearching] = useState(false);

  const load = async () => {
    if (!supabase) return;
    setLoading(true);
    const [{ data: f }, { data: p }] = await Promise.all([
      supabase.from('growth_funnel').select('*').maybeSingle(),
      supabase.from('growth_prospects').select('*').order('fit_score', { ascending: false }).limit(25),
    ]);
    setFunnel(f || {});
    setProspects(p || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const discoverProspects = async () => {\n    setMessage('جاري البحث والتأهيل…'); setSearching(true);\n    try {\n      const { data: sessionData } = await supabase.auth.getSession();\n      const token = sessionData?.session?.access_token;\n      if (!token) throw new Error('انتهت جلسة الإدارة، سجلي الدخول من جديد.');\n      const { data, error } = await supabase.functions.invoke('marketing-agent', {\n        body: { mode: 'discover', category, city: city || 'السعودية', count: searchCount, prompt: `ابحث عن ${searchCount} جهات ${category} مناسبة لبيتلي في ${city || 'السعودية'}. أعطني معلومات مهنية عامة ومصادرها.` }\n      });\n      if (error) throw error;\n      if (!data?.success) throw new Error(data?.error || 'تعذر تنفيذ البحث.');\n      setMessage(`تم اكتشاف ${data.count || 0} فرصة وحفظها. راجعيها قبل التواصل.`);\n      await load();\n    } catch (e) { setMessage(e?.message || 'تعذر تنفيذ البحث.'); } finally { setSearching(false); }\n  };\n\n  const createCampaign = async () => {
    setMessage('');
    const { error } = await supabase.from('growth_campaigns').insert({
      name: campaignName,
      category,
      city: city || null,
      daily_limit: dailyLimit,
      objective: 'registration',
      status: 'review',
      auto_send: false,
      message_template: 'مرحبًا، ندعوك للتسجيل في بيتلي | Bytly، المنظومة الهندسية المتكاملة التي تجمع أصحاب المشاريع والمهندسين والمقاولين والشركات والموردين في منصة واحدة.',
      rules: { require_admin_approval: true, max_followups: 2, stop_on_opt_out: true },
    });
    if (error) setMessage(error.message);
    else setMessage('تم إنشاء الحملة للمراجعة. الإرسال التلقائي غير مفعّل.');
  };

  const qualified = useMemo(() => prospects.filter(p => p.status === 'qualified' || p.status === 'approved').length, [prospects]);

  return (
    <div dir="rtl" className="min-h-screen p-6 md:p-10 bg-[#f7f4ef] text-[#2d241d]">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className="text-sm font-medium opacity-60">Bytly Growth</p>
            <h1 className="text-3xl font-bold">🤖 وكيل استقطاب المستخدمين</h1>
            <p className="mt-2 opacity-70">يبحث ويؤهل ويقيس — مع اعتماد بشري قبل التواصل الخارجي.</p>
          </div>
          <button onClick={load} className="px-4 py-2 rounded-xl bg-[#2d241d] text-white">تحديث</button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          {[
            ['المحتملون', funnel.prospects || 0],
            ['المؤهلون', funnel.qualified || qualified],
            ['تم التواصل', funnel.contacted || 0],
            ['ردوا', funnel.replied || 0],
            ['مهتمون', funnel.interested || 0],
            ['سجلوا', funnel.registered || 0],
          ].map(([label, value]) => (
            <div key={label} className="bg-white rounded-2xl p-4 border border-black/5">
              <div className="text-sm opacity-60">{label}</div>
              <div className="text-2xl font-bold mt-1">{value}</div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl p-6 border border-black/5">
          <h2 className="text-xl font-bold mb-4">إنشاء حملة استقطاب</h2>
          <div className="grid md:grid-cols-4 gap-4">
            <input value={campaignName} onChange={e=>setCampaignName(e.target.value)} placeholder="اسم الحملة" className="border rounded-xl p-3" />
            <select value={category} onChange={e=>setCategory(e.target.value)} className="border rounded-xl p-3">
              {categories.map(([v,l]) => <option key={v} value={v}>{l}</option>)}
            </select>
            <input value={city} onChange={e=>setCity(e.target.value)} placeholder="المدينة (اختياري)" className="border rounded-xl p-3" />
            <input type="number" min="1" max="200" value={dailyLimit} onChange={e=>setDailyLimit(Number(e.target.value))} className="border rounded-xl p-3" />\n            <input type="number" min="1" max="30" value={searchCount} onChange={e=>setSearchCount(Number(e.target.value))} placeholder="عدد نتائج البحث" className="border rounded-xl p-3" />
          </div>
          <div className="mt-4 flex items-center gap-3">
            <input type="checkbox" checked={autoSend} onChange={e=>setAutoSend(e.target.checked)} disabled />
            <span className="text-sm opacity-70">الإرسال التلقائي (مقفول حاليًا حتى تتم مراجعة القنوات والموافقات).</span>
          </div>
          <div className="mt-4 flex flex-wrap gap-3">\n            <button onClick={discoverProspects} disabled={searching} className="px-5 py-3 rounded-xl bg-[#2d241d] text-white">{searching ? "جاري البحث…" : "🔎 ابدأ البحث والتأهيل"}</button>\n            <button onClick={createCampaign} className="px-5 py-3 rounded-xl bg-[#9b7a3c] text-white">إنشاء الحملة للمراجعة</button>\n          </div>
          {message && <p className="mt-3 text-sm">{message}</p>}
        </div>

        <div className="bg-white rounded-2xl p-6 border border-black/5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">الفرص المحتملة</h2>
            <span className="text-sm opacity-60">{loading ? 'جارٍ التحميل…' : `${prospects.length} معروض`}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead><tr className="border-b"><th className="p-3">الاسم</th><th>الفئة</th><th>المدينة</th><th>المصدر</th><th>الملاءمة</th><th>الحالة</th></tr></thead>
              <tbody>
                {prospects.map(p => <tr key={p.id} className="border-b last:border-0">
                  <td className="p-3 font-medium">{p.name || '—'}{p.company_name ? <div className="text-xs opacity-50">{p.company_name}</div> : null}</td>
                  <td>{p.category}</td><td>{p.city || '—'}</td><td>{p.source || '—'}</td>
                  <td>{p.fit_score}%</td><td>{p.status}</td>
                </tr>)}
                {!prospects.length && <tr><td colSpan="6" className="p-8 text-center opacity-60">لا توجد فرص بعد. هذه الصفحة جاهزة لاستقبال نتائج البحث.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-[#2d241d] text-white rounded-2xl p-6">
          <h2 className="text-xl font-bold">قواعد التشغيل</h2>
          <ul className="mt-3 space-y-2 text-sm opacity-90">
            <li>• البحث والتأهيل أولًا، ثم المراجعة.</li>
            <li>• لا توجد رسائل جماعية تلقائية في هذه المرحلة.</li>
            <li>• إيقاف التواصل فور طلب عدم التواصل.</li>
            <li>• كل تواصل مرتبط بحملة ونتيجة حتى نستطيع قياس التسجيلات.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
