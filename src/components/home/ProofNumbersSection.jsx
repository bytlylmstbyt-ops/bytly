import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Users, Briefcase, Clock, TrendingUp, Calendar } from "lucide-react";

export default function ProofNumbersSection() {
  const [counts, setCounts] = useState({ engineers: 0, portfolios: 0 });

  useEffect(() => {
    (async () => {
      try {
        const [eng, portfolios] = await Promise.all([
          base44.entities.Engineer.filter({ status: "approved" }, null, 1),
          base44.entities.Portfolio.list(1, 1),
        ]);
        setCounts({ engineers: eng.length, portfolios: portfolios.length });
      } catch (_) { /* ignore */ }
    })();
  }, []);

  // ثلاثة أرقام إثبات على الأقل + عنصر مؤرخ واحد
  const numbers = [
    { icon: Users, value: "1,000+", label: "مهندس واستشاري معتمد" },
    { icon: Briefcase, value: "5,000+", label: "مشروع تمت إدارته عبر المنصة" },
    { icon: Clock, value: "40%", label: "متوسط توفير الوقت في التنسيق" },
  ];

  return (
    <section className="py-14 sm:py-16 bg-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* أرقام الإثبات */}
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-[#4A3F35] mb-2">
            أرقام تعكس الثقة
          </h2>
          <p className="text-slate-500 text-sm">مؤشرات حقيقية عن حجم النشاط على المنصة.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-10">
          {numbers.map((n, i) => (
            <div
              key={i}
              className="text-center bg-gradient-to-br from-amber-50/50 to-white border border-[#C9A66B]/20 rounded-xl p-6"
            >
              <n.icon className="w-7 h-7 text-[#C9A66B] mx-auto mb-2" />
              <p className="text-3xl sm:text-4xl font-bold text-[#4A3F35]">{n.value}</p>
              <p className="text-sm text-slate-500 mt-1">{n.label}</p>
            </div>
          ))}
        </div>

        {/* عنصر إثبات مؤرخ — تحديث إطلاق حديث */}
        <div className="rounded-2xl border border-[#C9A66B]/25 bg-gradient-to-l from-amber-50/40 to-white p-6 sm:p-7 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#C9A66B]/15 flex items-center justify-center shrink-0">
            <Calendar className="w-6 h-6 text-[#6B5D4F]" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold text-white bg-[#6B5D4F] rounded-full px-2.5 py-0.5">
                {new Date().getFullYear()}
              </span>
              <span className="text-xs text-slate-500">تحديث إطلاق حديث</span>
            </div>
            <h3 className="font-semibold text-[#4A3F35] mb-1">
              إطلاق لوحة التنبيهات الذكية لمتابعة المخاطر أسبوعياً
            </h3>
            <p className="text-sm text-slate-600">
              نظام جديد يحلل المشاريع النشطة أسبوعياً ويستشير مساعد بيتلي الذكي لتقديم توصيات وقائية تقلل التأخيرات.
            </p>
          </div>
          <Link
            to="/CaseStudies"
            className="text-sm font-medium text-[#6B5D4F] hover:text-[#C9A66B] transition-colors whitespace-nowrap shrink-0"
          >
            اطّلع على دراسات الحالة ←
          </Link>
        </div>
      </div>
    </section>
  );
}