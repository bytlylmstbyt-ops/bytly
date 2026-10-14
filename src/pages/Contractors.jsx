import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { createPageUrl } from "@/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, MapPin, Building2 } from "lucide-react";

export default function Contractors() {
  const [items, setItems] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      setError("");
      const { data, error: loadError } = await supabase
        .from("contractors")
        .select("id, company_name, city, country, bio, profile_image, specialization, status, years_experience, website")
        .in("status", ["approved", "active", "verified"])
        .order("created_at", { ascending: false })
        .limit(100);
      if (!active) return;
      if (loadError) {
        console.error("Load contractors directory failed:", loadError);
        setError("تعذر تحميل القائمة الآن. حاول تحديث الصفحة.");
        setItems([]);
      } else {
        setItems(data || []);
      }
      setLoading(false);
    })();
    return () => { active = false; };
  }, []);

  const filtered = items.filter(item => {
    const text = [item.company_name, item.city, item.bio, item.specialization]
      .flat().filter(Boolean).join(" ").toLowerCase();
    return text.includes(query.trim().toLowerCase());
  });

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10" dir="rtl">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 rounded-3xl bg-gradient-to-l from-[#342a22] to-[#b9955b] p-8 text-white">
          <p className="mb-2 text-sm text-white/80">منظومة بيتلي الهندسية المتكاملة</p>
          <h1 className="mb-3 text-3xl font-bold">المقاولون</h1>
          <p className="max-w-3xl leading-8 text-white/90">اكتشف المقاولين المسجلين في بيتلي وتعرّف على تخصصاتهم وخبراتهم قبل التواصل.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild className="bg-white text-[#342a22] hover:bg-white/90">
              <Link to={createPageUrl("RegisterContractor")}>التسجيل كمقدم خدمة</Link>
            </Button>
          </div>
        </div>
        <div className="mb-6 flex gap-2">
          <div className="relative w-full max-w-xl">
            <Search className="absolute right-3 top-3 h-4 w-4 text-slate-400" />
            <Input value={query} onChange={e => setQuery(e.target.value)} placeholder="ابحث بالاسم أو المدينة أو التخصص..." className="pr-10" />
          </div>
        </div>
        {loading ? <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-amber-600" /></div> :
         error ? <Card><CardContent className="p-8 text-center text-red-700">{error}<Button variant="outline" className="mr-3" onClick={() => window.location.reload()}>إعادة المحاولة</Button></CardContent></Card> :
         filtered.length === 0 ? <Card><CardContent className="p-10 text-center text-slate-600">{items.length ? "لا توجد نتائج مطابقة لبحثك." : "لا توجد ملفات معتمدة منشورة حاليًا. يمكنك التسجيل لإكمال ملفك المهني."}</CardContent></Card> :
         <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map(item => <Card key={item.id} className="overflow-hidden rounded-2xl border-slate-200 transition-shadow hover:shadow-md">
            {item.profile_image ? <img src={item.profile_image} alt={item.company_name || "المقاولون"} className="h-40 w-full object-cover" loading="lazy" /> : <div className="flex h-40 items-center justify-center bg-slate-100"><Building2 className="h-12 w-12 text-slate-400" /></div>}
            <CardContent className="space-y-3 p-5">
              <div className="flex items-start justify-between gap-2"><h2 className="font-bold text-slate-900">{item.company_name || "RegisterContractor"}</h2><Badge variant="secondary">{item.status === "approved" ? "معتمد" : "نشط"}</Badge></div>
              <p className="flex items-center gap-2 text-sm text-slate-600"><MapPin className="h-4 w-4" />{[item.city, item.country].filter(Boolean).join("، ") || "الموقع غير محدد"}</p>
              {item.specialization && <p className="text-sm text-slate-600">{Array.isArray(item.specialization) ? item.specialization.join("، ") : item.specialization}</p>}
              {item.bio && <p className="line-clamp-3 text-sm leading-6 text-slate-600">{item.bio}</p>}
              <div className="flex items-center justify-between pt-2 text-sm text-slate-500"><span>{item.years_experience ? item.years_experience + " سنة خبرة" : "ملف مهني"}</span>{item.website && <a href={item.website} target="_blank" rel="noreferrer" className="text-amber-700 underline">الموقع الإلكتروني</a>}</div>
            </CardContent>
          </Card>)}
         </div>}
      </div>
    </div>
  );
}
