import React, { useEffect, useMemo, useState } from "react";
import { Building2, Loader2, Search, ShieldCheck, Mail, Phone, ExternalLink } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { Card, CardContent } from "@/components/ui/card";

const OWNER_EMAIL = "bytlylmstbyt@gmail.com";

export default function AdminDeveloperInvestorManagement() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [type, setType] = useState("all");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true); setError("");
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("غير مصرح بالوصول");
        const email = (user.email || "").trim().toLowerCase();
        const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
        if (email !== OWNER_EMAIL && profile?.role !== "admin") throw new Error("غير مصرح بالوصول");
        const { data, error: queryError } = await supabase.from("developer_investor_management").select("*").order("created_at", { ascending: true });
        if (queryError) throw queryError;
        if (!cancelled) setRows(data || []);
      } catch (e) {
        if (!cancelled) setError(e?.message || "تعذر تحميل البيانات");
      } finally { if (!cancelled) setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      const matchesType = type === "all" || r.entity_type === type;
      const haystack = [r.name, r.company_name, r.contact_person, r.region, r.phone, r.email].filter(Boolean).join(" ").toLowerCase();
      return matchesType && (!q || haystack.includes(q));
    });
  }, [rows, search, type]);

  return (
    <div className="space-y-6" dir="rtl">
      <div>
        <h3 className="text-2xl font-bold text-[#25213A]">إدارة المطورين والمستثمرين</h3>
        <p className="text-sm text-slate-500 mt-1">سجل مستقل للمطورين والمستثمرين، مصدره بيانات MarketEntity التي تم نقلها من Base44 إلى Supabase.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card><CardContent className="p-4"><p className="text-xs text-slate-500">الإجمالي</p><p className="text-2xl font-bold mt-1">{rows.length}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-slate-500">المطورون</p><p className="text-2xl font-bold mt-1">{rows.filter(r => r.entity_type === "developer").length}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-slate-500">المستثمرون</p><p className="text-2xl font-bold mt-1">{rows.filter(r => r.entity_type === "investor").length}</p></CardContent></Card>
      </div>
      <Card>
        <CardContent className="p-4 flex flex-col md:flex-row gap-3">
          <div className="relative flex-1"><Search className="absolute right-3 top-3.5 w-4 h-4 text-slate-400" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="ابحث بالاسم أو الشركة أو المنطقة أو الجوال أو البريد" className="w-full rounded-lg border border-slate-200 py-3 pr-10 pl-3 text-sm outline-none focus:ring-2 focus:ring-[#C9A66B]" /></div>
          <select value={type} onChange={e => setType(e.target.value)} className="rounded-lg border border-slate-200 px-3 py-3 text-sm bg-white"><option value="all">الكل</option><option value="developer">مطور</option><option value="investor">مستثمر</option></select>
        </CardContent>
      </Card>
      {loading ? <div className="py-16 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-[#C9A66B]" /></div> : error ? <Card><CardContent className="p-8 text-center text-red-600">{error}</CardContent></Card> : (
        <Card className="overflow-hidden">
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-sm min-w-[950px]">
              <thead className="bg-slate-50 border-b"><tr><th className="text-right p-4">الاسم</th><th className="text-right p-4">الشركة</th><th className="text-right p-4">النوع</th><th className="text-right p-4">المنطقة</th><th className="text-right p-4">الجوال</th><th className="text-right p-4">البريد</th><th className="text-right p-4">الحالة</th></tr></thead>
              <tbody>{filtered.map(r => <tr key={r.id} className="border-b last:border-0 hover:bg-slate-50/70"><td className="p-4 font-semibold">{r.contact_person || r.name}</td><td className="p-4">{r.company_name || r.name}</td><td className="p-4"><span className="inline-flex items-center gap-1"><Building2 className="w-4 h-4 text-slate-400" />{r.entity_type === "developer" ? "مطور" : "مستثمر"}</span></td><td className="p-4">{r.region || "—"}</td><td className="p-4"><a href={`tel:${r.phone}`} className="inline-flex items-center gap-1 text-slate-700 hover:underline"><Phone className="w-3.5 h-3.5" />{r.phone || "—"}</a></td><td className="p-4"><a href={`mailto:${r.email}`} className="inline-flex items-center gap-1 text-slate-700 hover:underline"><Mail className="w-3.5 h-3.5" />{r.email || "—"}</a></td><td className="p-4"><span className="inline-flex items-center gap-1">{r.is_verified && <ShieldCheck className="w-4 h-4 text-emerald-600" />}{r.status === "active" ? "نشط" : r.status || "—"}</span></td></tr>)}</tbody>
            </table>
            {!filtered.length && <div className="p-10 text-center text-slate-500">لا توجد نتائج مطابقة.</div>}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
