import React, { useEffect, useMemo, useState } from "react";
import { Search, Building2, Phone, Mail, MapPin, TrendingUp, CheckCircle2, Globe2 } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import MobileSelect from "@/components/mobile/MobileSelect";

const OWNER_EMAIL = "bytlylmstbyt@gmail.com";

export default function AdminMarketEntitiesPage() {
  const [entities, setEntities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { if (active) setError("يجب تسجيل الدخول بحساب الإدارة."); setLoading(false); return; }
      const { data: profile } = await supabase.from("profiles").select("role,email").eq("id", user.id).maybeSingle();
      if (profile?.role !== "admin" && user.email !== OWNER_EMAIL) { if (active) setError("غير مصرح لك بالوصول إلى هذا القسم."); setLoading(false); return; }
      const { data, error: dbError } = await supabase.from("developer_investor_management").select("*").order("name", { ascending: true });
      if (dbError) { if (active) setError(dbError.message); }
      else if (active) setEntities(data || []);
      if (active) setLoading(false);
    })();
    return () => { active = false; };
  }, []);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return entities.filter(e => {
      if (typeFilter !== "all" && e.entity_type !== typeFilter) return false;
      if (!q) return true;
      return [e.name, e.company_name, e.contact_person, e.region, e.phone, e.email].filter(Boolean).some(v => String(v).toLowerCase().includes(q));
    });
  }, [entities, searchQuery, typeFilter]);

  const stats = {
    total: entities.length,
    developers: entities.filter(e => e.entity_type === "developer").length,
    investors: entities.filter(e => e.entity_type === "investor").length,
    verified: entities.filter(e => e.is_verified).length,
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center" dir="rtl"><div className="text-slate-500">جاري تحميل قائمة المطورين والمستثمرين...</div></div>;
  if (error) return <div className="min-h-screen p-8" dir="rtl"><Card><CardContent className="p-6 text-red-600">{error}</CardContent></Card></div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-amber-50/30 p-6" dir="rtl">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="border-b-2 border-[#4a3c31] pb-4">
          <div className="flex items-center gap-3"><Building2 className="w-7 h-7 text-[#c9a66b]" /><h1 className="text-2xl font-bold text-[#4a3c31]">إدارة المطورين والمستثمرين</h1></div>
          <p className="text-sm text-slate-500 mt-1">سجل مستقل منقول من بيانات Base44 إلى Supabase — لا يعتمد على إدارة العملاء.</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[['الإجمالي', stats.total], ['المطورون', stats.developers], ['المستثمرون', stats.investors], ['الموثقون', stats.verified]].map(([label,value]) => <Card key={label}><CardContent className="p-4 text-center"><p className="text-3xl font-bold text-[#4a3c31]">{value}</p><p className="text-sm text-slate-500 mt-1">{label}</p></CardContent></Card>)}
        </div>

        <Card><CardContent className="p-4 flex flex-col md:flex-row gap-3"><div className="relative flex-1"><Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /><Input placeholder="ابحث بالاسم أو الشركة أو المنطقة أو الجوال أو البريد" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pr-9" /></div><MobileSelect value={typeFilter} onValueChange={setTypeFilter} placeholder="نوع الجهة" options={[{value:'all',label:'الكل'},{value:'developer',label:'المطورون'},{value:'investor',label:'المستثمرون'}]} /></CardContent></Card>

        <Card className="overflow-hidden"><CardContent className="p-0"><div className="overflow-x-auto"><table className="w-full text-sm text-right border-collapse"><thead className="bg-[#4a3c31] text-white"><tr>{['الاسم / الشركة','النوع','جهة الاتصال','المنطقة','الجوال','البريد','الموقع','حجم الاستثمار'].map(h=><th key={h} className="px-4 py-3 whitespace-nowrap">{h}</th>)}</tr></thead><tbody>{filtered.map(e => <tr key={e.id} className="border-b hover:bg-slate-50"><td className="px-4 py-3 font-semibold text-[#4a3c31]"><div>{e.name}</div><div className="text-xs text-slate-400 font-normal">{e.company_name}</div>{e.is_verified && <Badge className="mt-1 bg-amber-100 text-amber-700 text-xs"><CheckCircle2 className="w-3 h-3 ml-1" />موثق</Badge>}</td><td className="px-4 py-3"><Badge className={e.entity_type==='developer'?'bg-blue-100 text-blue-700':'bg-green-100 text-green-700'}>{e.entity_type==='developer'?'مطور':'مستثمر'}</Badge></td><td className="px-4 py-3">{e.contact_person || '—'}</td><td className="px-4 py-3"><span className="inline-flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{e.region || '—'}</span></td><td className="px-4 py-3" dir="ltr">{e.phone?<a href={`tel:${e.phone}`} className="text-blue-700 hover:underline inline-flex items-center gap-1"><Phone className="w-3.5 h-3.5" />{e.phone}</a>:'—'}</td><td className="px-4 py-3">{e.email?<a href={`mailto:${e.email}`} className="text-blue-700 hover:underline inline-flex items-center gap-1"><Mail className="w-3.5 h-3.5" />{e.email}</a>:'—'}</td><td className="px-4 py-3">{e.website?<a href={e.website} target="_blank" rel="noreferrer" className="text-blue-700 hover:underline inline-flex items-center gap-1"><Globe2 className="w-3.5 h-3.5" />فتح</a>:'—'}</td><td className="px-4 py-3"><span className="inline-flex items-center gap-1"><TrendingUp className="w-3.5 h-3.5" />{e.investment_range || '—'}</span></td></tr>)}{filtered.length===0&&<tr><td colSpan="8" className="text-center py-10 text-slate-400">لا توجد بيانات مطابقة</td></tr>}</tbody></table></div></CardContent></Card>
      </div>
    </div>
  );
}
