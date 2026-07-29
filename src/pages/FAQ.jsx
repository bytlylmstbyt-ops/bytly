import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, HelpCircle } from "lucide-react";
import { useLanguage } from "@/components/i18n/LanguageContext";

const FAQ = () => {
  const { t } = useLanguage();
  const [openIndex, setOpenIndex] = useState(0);

  const items = [
    "pricing",
    "trial",
    "escrow",
    "timeline",
    "verfication",
    "support",
  ];

  return (
    <section className="py-16 md:py-20 bg-gradient-to-b from-white to-amber-50/40">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10"
        >
          <div className="w-12 h-12 mx-auto rounded-xl bg-gradient-to-br from-[#6B5D4F] to-[#C9A66B] flex items-center justify-center mb-4">
            <HelpCircle className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-[#2D2A42] mb-2">
            {t("home.faq.title")}
          </h2>
          <p className="text-[#707070]">
            {t("home.faq.subtitle")}
          </p>
        </motion.div>

        <div className="space-y-3">
          {items.map((key, i) => {
            const isOpen = openIndex === i;
            return (
              <div
                key={key}
                className="rounded-xl border border-[#F0F0F0] bg-white overflow-hidden shadow-sm"
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? -1 : i)}
                  className="w-full flex items-center justify-between gap-3 p-4 text-right hover:bg-[#F9F9F9] transition-colors"
                  style={{ minHeight: 56 }}
                >
                  <span className="font-medium text-[#2D2A42] text-sm md:text-base">
                    {t(`home.faq.items.${key}.q`)}
                  </span>
                  <ChevronDown
                    className={`w-5 h-5 text-[#C8AA82] shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`}
                  />
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <p className="px-4 pb-4 text-sm text-[#707070] leading-relaxed">
                        {t(`home.faq.items.${key}.a`)}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FAQ;