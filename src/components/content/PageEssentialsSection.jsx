import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Wrench, Users, BarChart3, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * PageEssentialsSection — short, plain-language blocks covering
 * features / audience / proof / next steps for a core informational page.
 */
export default function PageEssentialsSection({
  feature,
  audience,
  proof,
  nextStep,
  nextTo = "/RegisterChoice",
  nextLabel = "سجّل الآن",
}) {
  const items = [
    { icon: Wrench, title: "الميزات", text: feature },
    { icon: Users, title: "الجمهور", text: audience },
    { icon: BarChart3, title: "الإثبات", text: proof },
    { icon: ArrowLeft, title: "الخطوة التالية", text: nextStep },
  ].filter((x) => x.text);

  return (
    <section className="py-14 bg-white border-y border-slate-100">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {items.map((it, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-[#F5F0E8]/40 rounded-2xl p-5 border border-[#C9A66B]/20"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#6B5D4F] to-[#C9A66B] flex items-center justify-center mb-3">
                <it.icon className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-bold text-[#4A3F35] mb-1 text-sm">{it.title}</h3>
              <p className="text-slate-600 text-sm leading-relaxed">{it.text}</p>
            </motion.div>
          ))}
        </div>
        <div className="text-center mt-8">
          <Link to={nextTo}>
            <Button className="bg-gradient-to-r from-[#6B5D4F] to-[#C9A66B] text-white">
              {nextLabel} <ArrowLeft className="w-4 h-4 mr-1" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}