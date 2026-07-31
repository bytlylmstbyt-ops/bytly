import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Sparkles, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * AudienceLandingTemplate — shared marketing landing for a buyer segment.
 * Heading hierarchy: a single H1 in the hero, H2 for each section,
 * H3 for list items — satisfying clear on-page SEO structure.
 */
export default function AudienceLandingTemplate({ segment }) {
  const {
    badge,
    h1,
    subtitle,
    mission,
    outcome,
    offer: { title: offerTitle, points: offerPoints },
    process: { title: processTitle, steps: processSteps },
    benefits: { title: benefitsTitle, items: benefitsItems },
    proof: { title: proofTitle, stats: proofStats },
    cta: { title: ctaTitle, subtitle: ctaSubtitle, primary, secondary },
  } = segment;

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-amber-50/30"
      dir="rtl"
    >
      {/* Hero */}
      <section className="bg-gradient-to-br from-[#1a1a2e] via-[#2d2d4e] to-[#1a1a2e] py-16 md:py-24 relative overflow-hidden">
        <div className="absolute top-0 left-1/4 w-64 h-64 bg-[#C9A66B]/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-[#6B5D4F]/10 rounded-full blur-3xl" />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 mb-6">
            <Sparkles className="w-4 h-4 text-[#C9A66B]" />
            <span className="text-amber-200 text-sm font-medium">{badge}</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-bold text-white mb-5 leading-tight">
            {h1}
          </h1>
          <p className="text-slate-300 mb-8 max-w-2xl mx-auto text-lg leading-relaxed">
            {subtitle}
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {primary && (
              <Link to={primary.to}>
                <Button
                  className="bg-gradient-to-r from-[#6B5D4F] to-[#C9A66B] text-white hover:opacity-90"
                  style={{ minHeight: 48 }}
                >
                  {primary.label}
                  <ArrowLeft className="w-4 h-4" />
                </Button>
              </Link>
            )}
            {secondary && (
              <Link to={secondary.to}>
                <Button
                  variant="outline"
                  className="bg-white/10 text-white border-white/30 hover:bg-white/20"
                  style={{ minHeight: 48 }}
                >
                  {secondary.label}
                </Button>
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Mission + Outcome — مهمة واحدة ونتيجة واحدة تطابق نية الزائر */}
      {(mission || outcome) && (
        <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 relative z-10">
          <div className="bg-white rounded-2xl shadow-lg border border-[#C9A66B]/20 p-5 grid sm:grid-cols-2 gap-5 text-center">
            {mission && (
              <div>
                <span className="inline-block px-3 py-1 rounded-full bg-[#6B5D4F] text-white text-xs font-medium mb-2">مهمتك</span>
                <p className="text-[#1a1a2e] font-medium leading-relaxed text-sm">{mission}</p>
              </div>
            )}
            {outcome && (
              <div>
                <span className="inline-block px-3 py-1 rounded-full bg-[#C9A66B] text-white text-xs font-medium mb-2">النتيجة</span>
                <p className="text-[#1a1a2e] font-medium leading-relaxed text-sm">{outcome}</p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Offer */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <h2 className="text-2xl md:text-3xl font-bold text-[#1a1a2e] mb-2 text-center">
          {offerTitle}
        </h2>
        <div className="w-16 h-1 bg-[#C9A66B] rounded-full mx-auto mb-8" />
        <div className="grid md:grid-cols-2 gap-4">
          {offerPoints.map((p, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="flex items-start gap-3 bg-white rounded-2xl p-5 shadow-sm border border-slate-100"
            >
              <CheckCircle2 className="w-5 h-5 text-[#C9A66B] shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-[#1a1a2e] mb-1">{p.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{p.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Process */}
      <section className="bg-white/60 border-y border-slate-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <h2 className="text-2xl md:text-3xl font-bold text-[#1a1a2e] mb-2 text-center">
            {processTitle}
          </h2>
          <div className="w-16 h-1 bg-[#C9A66B] rounded-full mx-auto mb-10" />
          <div className="grid md:grid-cols-4 gap-6">
            {processSteps.map((s, i) => (
              <div key={i} className="relative">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#6B5D4F] to-[#C9A66B] text-white flex items-center justify-center font-bold mb-3">
                  {i + 1}
                </div>
                <h3 className="font-semibold text-[#1a1a2e] mb-1">{s.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <h2 className="text-2xl md:text-3xl font-bold text-[#1a1a2e] mb-2 text-center">
          {benefitsTitle}
        </h2>
        <div className="w-16 h-1 bg-[#C9A66B] rounded-full mx-auto mb-8" />
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {benefitsItems.map((b, i) => {
            const Icon = b.icon || TrendingUp;
            return (
              <div
                key={i}
                className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100"
              >
                <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center mb-3">
                  <Icon className="w-5 h-5 text-[#C9A66B]" />
                </div>
                <h3 className="font-semibold text-[#1a1a2e] mb-1">{b.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{b.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Proof */}
      <section className="bg-gradient-to-br from-[#1a1a2e] to-[#2d2d4e] py-14">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-2 text-center">
            {proofTitle}
          </h2>
          <div className="w-16 h-1 bg-[#C9A66B] rounded-full mx-auto mb-10" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {proofStats.map((s, i) => (
              <div key={i}>
                <div className="text-3xl md:text-4xl font-bold text-[#C9A66B]">
                  {s.value}
                </div>
                <div className="text-slate-300 text-sm mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <h2 className="text-2xl md:text-3xl font-bold text-[#1a1a2e] mb-3">
          {ctaTitle}
        </h2>
        <p className="text-slate-500 mb-8 max-w-xl mx-auto">{ctaSubtitle}</p>
        <div className="flex flex-wrap justify-center gap-3">
          {primary && (
            <Link to={primary.to}>
              <Button
                className="bg-gradient-to-r from-[#6B5D4F] to-[#C9A66B] text-white hover:opacity-90"
                style={{ minHeight: 48 }}
              >
                {primary.label}
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
          )}
          {secondary && (
            <Link to={secondary.to}>
              <Button
                variant="outline"
                className="border-[#C9A66B] text-[#6B5D4F] hover:bg-amber-50"
                style={{ minHeight: 48 }}
              >
                {secondary.label}
              </Button>
            </Link>
          )}
        </div>
      </section>
    </div>
  );
}