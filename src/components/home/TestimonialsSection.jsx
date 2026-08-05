import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Star, Quote } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useLanguage } from "@/components/i18n/LanguageContext";

export default function TestimonialsSection() {
  const { t } = useLanguage();
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const data = await base44.entities.Review.filter(
          { status: "completed", sentiment: "positive" },
          "-created_date",
          3
        );
        setReviews(data.filter(r => r.comment && r.rating >= 4));
      } catch (_) { /* ignore — fallback to defaults */ }
    })();
  }, []);

  const defaults = t('testimonials.defaults') || [];
  const items = reviews.length >= 3
    ? reviews.map(r => ({
        name: r.target_name || t('testimonials.fallbackClient'),
        role: t('testimonials.fallbackRole'),
        rating: r.rating,
        text: r.comment,
        metric: r.highlights?.[0] || t('testimonials.fallbackMetric'),
      }))
    : defaults;

  return (
    <section className="py-16 sm:py-20 bg-gradient-to-b from-white to-amber-50/30">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-[#4A3F35] mb-3">
            {t('testimonials.title')}
          </h2>
          <p className="text-slate-500 max-w-xl mx-auto">
            {t('testimonials.subtitle')}
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {items.slice(0, 3).map((item, i) => (
            <Card key={i} className="border-[#C9A66B]/20 hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <Quote className="w-8 h-8 text-[#C9A66B]/30 mb-3" />
                <div className="flex gap-1 mb-3">
                  {Array.from({ length: 5 }).map((_, s) => (
                    <Star
                      key={s}
                      className={`w-4 h-4 ${s < (item.rating || 5) ? "text-[#C9A66B] fill-[#C9A66B]" : "text-slate-200"}`}
                    />
                  ))}
                </div>
                <p className="text-slate-700 leading-relaxed mb-4 text-sm sm:text-base">
                  {item.text}
                </p>
                <div className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-4">
                  ✓ {item.metric}
                </div>
                <div className="border-t border-slate-100 pt-3">
                  <p className="font-semibold text-[#4A3F35] text-sm">{item.name}</p>
                  <p className="text-xs text-slate-500">{item.role}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}