import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import {
  Sparkles, CheckCircle, ArrowLeft, TrendingUp, Clock,
  Wallet, Users, MapPin, Building2, Quote
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import LiveActiveBadge from "@/components/trust/LiveActiveBadge";
import PageEssentialsSection from "@/components/content/PageEssentialsSection";
import JsonLd from "@/components/seo/JsonLd";
import { webPageSchema } from "@/components/seo/buildSchema";

const categoryLabels = {
  interior: "تصميم داخلي",
  architecture: "عمارة",
  landscape: "تنسيق خارجي",
  furniture: "أثاث",
  lighting: "إضاءة",
  painting: "دهانات",
  structural_design: "تصميم إنشائي",
  executive_drawing: "مخططات تنفيذية",
  civil_engineering: "هندسة مدنية",
};

export default function CaseStudies() {
  const [studies, setStudies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    (async () => {
      try {
        const portfolios = await base44.entities.Portfolio.list("-created_date", 30);
        const featured = portfolios.filter(p => (p.images?.length || 0) > 0 && p.description);
        setStudies(featured);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, []);

  const categories = ["all", ...Array.from(new Set(studies.map(s => s.category).filter(Boolean)))];
  const filtered = filter === "all" ? studies : studies.filter(s => s.category === filter);

  const stats = [
    { icon: Users,      v: `${studies.length}+`, l: "مشروع منجز وموثق" },
    { icon: Clock,       v: "24h", l: "متوسط زمن الاستجابة" },
    { icon: Wallet,      v: "100%", l: "أموال محمية بالضمان" },
    { icon: TrendingUp,  v: "98%", l: "رضا أصحاب المشاريع" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-white to-amber-50/40">
      <JsonLd data={webPageSchema({ name: "دراسات الحالة — بيتلي", description: "أمثلة عملية لمشاريع هندسية نُفذت عبر بيتلي قبل وبعد التنفيذ لتقييم قيمة العرض.", path: "/CaseStudies" })} />
      {/* Hero / H1 */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 pt-12 pb-8 text-center">
        <Badge variant="outline" className="mb-4 border-[#C9A66B] text-[#C9A66B] bg-[#C9A66B]/5">
          <Sparkles className="w-3 h-3 ml-1" /> دراسات الحالة
        </Badge>
        <h1 className="text-3xl sm:text-5xl font-bold text-[#4A3F35] mb-4 leading-tight">
          نتائج حقيقية من مشاريع بيتلي
        </h1>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto">
          أمثلة عملية لمشاريع هندسية نُفذت عبر المنصة — قبل وبعد التنفيذ — لتقييم قيمة العرض قبل اتخاذ قرارك.
        </p>
        <div className="mt-6 flex justify-center">
          <LiveActiveBadge />
        </div>
      </section>

      {/* Proof stats / H2 */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {stats.map((s, i) => (
            <div key={i} className="bg-white rounded-xl border border-[#C9A66B]/20 p-4 text-center">
              <s.icon className="w-5 h-5 text-[#C9A66B] mx-auto mb-1" />
              <p className="text-xl font-bold text-[#4A3F35]">{s.v}</p>
              <p className="text-[11px] text-slate-500">{s.l}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Problem → Solution framing / H2 */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
        <h2 className="text-2xl font-bold text-[#4A3F35] mb-4">كيف تتغير النتيجة مع بيتلي</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <Card className="border-red-100 bg-red-50/30">
            <CardContent className="pt-4">
              <p className="font-semibold text-red-700 mb-2">قبل بيتلي</p>
              <ul className="text-sm text-slate-600 space-y-1">
                <li>• تكاليف غير متوقعة في منتصف التنفيذ</li>
                <li>• تأخر التسليم بلا إنذار مسبق</li>
                <li>• دفع مباشر بدون حماية أو مراجعة</li>
              </ul>
            </CardContent>
          </Card>
          <Card className="border-emerald-100 bg-emerald-50/40">
            <CardContent className="pt-4">
              <p className="font-semibold text-emerald-700 mb-2">بعد بيتلي</p>
              <ul className="text-sm text-slate-700 space-y-1">
                <li>• تقدير تكلفة دقيق قبل البدء</li>
                <li>• تنبيهات ذكية تكشف التأخر مبكراً</li>
                <li>• ضمان مالي + مراجعة فنية لكل تسليم</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Case studies grid / H2 */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <h2 className="text-2xl font-bold text-[#4A3F35]">مشاريع منشورة</h2>
          <div className="flex flex-wrap gap-2">
            {categories.map(c => (
              <button key={c} onClick={() => setFilter(c)}
                className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                  filter === c
                    ? "bg-[#6B5D4F] text-white border-[#6B5D4F]"
                    : "bg-white text-[#6B5D4F] border-[#C9A66B]/30 hover:border-[#C9A66B]"
                }`}>
                {c === "all" ? "الكل" : (categoryLabels[c] || c)}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-slate-400">جاري تحميل دراسات الحالة...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-slate-400">لا توجد مشاريع منشورة في هذه الفئة بعد.</div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.slice(0, 12).map((s, i) => (
              <Card key={i} className="overflow-hidden border-[#C9A66B]/20 hover:shadow-lg transition-all group">
                <div className="aspect-[4/3] overflow-hidden bg-slate-100">
                  <img src={s.images[0]} alt={s.title} loading="lazy" decoding="async"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                </div>
                <CardContent className="pt-4">
                  <Badge variant="outline" className="mb-2 text-[10px] text-[#C9A66B] border-[#C9A66B]/30">
                    {categoryLabels[s.category] || s.category}
                  </Badge>
                  <h3 className="font-semibold text-[#4A3F35] mb-1 line-clamp-1">{s.title}</h3>
                  <p className="text-sm text-slate-600 line-clamp-2 mb-3">{s.description}</p>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100 pt-2">
                    {s.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{s.location}</span>}
                    {s.completion_date && <span>{new Date(s.completion_date).getFullYear()}</span>}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Testimonial / H2 */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <div className="rounded-2xl bg-gradient-to-br from-amber-50/60 to-white border border-[#C9A66B]/30 p-8 text-center">
          <Quote className="w-8 h-8 text-[#C9A66B] mx-auto mb-3" />
          <p className="text-lg text-[#4A3F35] leading-relaxed mb-4">
            "أنجزت مشروعي بالكامل عبر بيتلي — من التصميم حتى التسليم — وأموالي كانت محمية طوال الوقت. التنبيهات الذكية أنقذتني من تأخر كان سيكلفني أسابيع."
          </p>
          <p className="text-sm text-slate-500">— أحد أصحاب المشاريع على المنصة</p>
        </div>
      </section>

      {/* Page essentials — features/audience/proof/next steps */}
      <PageEssentialsSection
        feature="مشاريع منشورة بنتائج قابلة للقياس قبل وبعد التنفيذ عبر المنصة."
        audience="لمن يقيّم قيمة العرض قبل اتخاذ قرار بدء مشروعه."
        proof="مئات المشاريع المكتملة بمعدل رضا 98% وأموال محمية بالضمان."
        nextStep="اجعل مشروعك القصة القادمة — ابدأ عبر بيتلي."
        nextTo="/CreateProject"
        nextLabel="ابدأ مشروعك الآن"
      />

      {/* CTA / H2 */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        <div className="rounded-2xl bg-gradient-to-br from-[#4A3F35] to-[#6B5D4F] p-8 sm:p-10 text-center text-white">
          <Building2 className="w-10 h-10 mx-auto mb-3 text-[#C9A66B]" />
          <h2 className="text-2xl font-bold mb-3">اجعل مشروعك القصة القادمة</h2>
          <p className="text-slate-200 mb-6 max-w-xl mx-auto">ابدأ مشروعك عبر بيتلي وانضم لقائمة أصحاب المشاريع الذين أنجزوا بثقة وحماية.</p>
          <Link to="/CreateProject"><Button className="bg-[#C9A66B] text-[#4A3F35] hover:bg-[#E5D4B8]">ابدأ مشروعك الآن <ArrowLeft className="w-4 h-4 mr-1" /></Button></Link>
        </div>
      </section>
    </div>
  );
}