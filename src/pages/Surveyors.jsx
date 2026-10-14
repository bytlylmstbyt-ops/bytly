import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { createPageUrl } from "@/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, MapPin, UserRound, FileSearch } from "lucide-react";

const isSurveyor = (person) => Boolean(person?.license_number);

export default function Surveyors() {
  const [people, setPeople] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    (async () => {
      const { data, error: loadError } = await supabase
        .from("surveyor_profiles")
        .select("id, full_name, city, bio, license_number, years_experience, rating, status, is_available")
        .eq("status", "approved")
        .order("rating", { ascending: false })
        .limit(200);
      if (!active) return;
      if (loadError) {
        console.error("Load surveyor directory failed:", loadError);
        setError("تعذر تحميل قائمة المساحين الآن. حاول تحديث الصفحة.");
      } else {
        setPeople((data || []).filter(isSurveyor));
      }
      setLoading(false);
    })();
    return () => { active = false; };
  }, []);

  const filtered = people.filter(p => [p.full_name, p.city, p.specialization, p.bio].filter(Boolean).join(" ").toLowerCase().includes(query.trim().toLowerCase()));

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10" dir="rtl">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 rounded-3xl bg-gradient-to-l from-[#342a22] to-[#b9955b] p-8 text-white">
          <p className="mb-2 text-sm text-white/80">منظومة بيتلي الهندسية المتكاملة</p>
          <h1 className="mb-3 text-3xl font-bold">المساحون والرفع المساحي</h1>
          <p className="max-w-3xl leading-8 text-white/90">استعرض المساحين المعتمدين المسجلين مباشرة في منظومة الرفع المساحي ببيتلي.</p>
          <div className="mt-6"><Button asChild className="bg-white text-[#342a22] hover:bg-white/90"><Link to={createPageUrl("RegisterEngineer")}>التسجيل كمهندس</Link></Button></div>
        </div>
        <div className="mb-6 flex gap-2">
          <div className="relative w-full max-w-xl"><Search className="absolute right-3 top-3 h-4 w-4 text-slate-400" /><Input value={query} onChange={e => setQuery(e.target.value)} placeholder="ابحث بالاسم أو المدينة أو التخصص..." className="pr-10" /></div>
        </div>
        {loading ? <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-amber-600" /></div> :
         error ? <Card><CardContent className="p-8 text-center text-red-700">{error}<Button variant="outline" className="mr-3" onClick={() => window.location.reload()}>إعادة المحاولة</Button></CardContent></Card> :
         filtered.length === 0 ? <Card><CardContent className="p-10 text-center"><FileSearch className="mx-auto mb-3 h-10 w-10 text-slate-400" /><p className="font-semibold text-slate-800">لا توجد ملفات مساحين معتمدين منشورة حاليًا.</p><p className="mt-2 text-sm text-slate-600">ستظهر الملفات هنا بعد اعتمادها من إدارة بيتلي.</p></CardContent></Card> :
         <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{filtered.map(p => <Card key={p.id} className="overflow-hidden rounded-2xl border-slate-200 hover:shadow-md">
          <div className="flex h-40 items-center justify-center bg-slate-100"><UserRound className="h-12 w-12 text-slate-400" /></div>
          <CardContent className="space-y-3 p-5"><div className="flex items-start justify-between gap-2"><h2 className="font-bold">{p.full_name || "مهندس مسجل"}</h2><Badge variant="secondary">مساح معتمد</Badge></div>
          <p className="flex items-center gap-2 text-sm text-slate-600"><MapPin className="h-4 w-4" />{p.city || "الموقع غير محدد"}</p>
          <p className="text-sm text-slate-700">رخصة مهنية: {p.license_number}</p>{p.bio && <p className="line-clamp-3 text-sm leading-6 text-slate-600">{p.bio}</p>}
          <p className="text-sm text-slate-500">{p.years_experience ? p.years_experience + " سنة خبرة" : "الخبرة غير محددة"} · التقييم {Number(p.rating || 0).toFixed(1)}/5</p></CardContent></Card>)}</div>}
      </div>
    </div>
  );
}
