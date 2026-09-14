import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, RefreshCw, Users, Trophy, ArrowRight } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import MatchForm from "@/components/matching/MatchForm";
import MatchResultCard from "@/components/matching/MatchResultCard";

export default function EngineerMatcher() {
  const [results, setResults] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (formData) => {
    setIsLoading(true);
    setHasSearched(true);
    const response = await base44.functions.invoke("matchEngineers", formData);
    setResults(response.data?.results || []);
    setIsLoading(false);
  };

  const handleReset = () => {
    setResults(null);
    setHasSearched(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-amber-50/20" dir="rtl">
      {/* Hero */}
      <div className="bg-gradient-to-br from-[#1a1a2e] via-[#2d2d4e] to-[#1a1a2e] py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#C9A66B]/20 border border-[#C9A66B]/30 text-[#C9A66B] text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4" />
              محرك المطابقة الذكي — Bytly Match
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-white mb-4 leading-tight">
              اعثر على المهندس <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#C9A66B] to-[#E5D4B8]">
                الأنسب لمشروعك
              </span>
            </h1>
            <p className="text-slate-300 text-lg max-w-2xl mx-auto">
              أدخل تفاصيل مشروعك وسيقوم محركنا الذكي بمطابقتك مع أفضل المهندسين مع إظهار نسبة التوافق لكل منهم
            </p>

            {/* Stats bar */}
            <div className="flex justify-center gap-8 mt-8">
              {[
                { icon: Users, label: "مهندس معتمد", value: "200+" },
                { icon: Trophy, label: "نسبة رضا", value: "98%" },
                { icon: Sparkles, label: "معيار مطابقة", value: "5" },
              ].map((stat, i) => (
                <div key={i} className="text-center">
                  <div className="text-2xl font-black text-[#C9A66B]">{stat.value}</div>
                  <div className="text-slate-400 text-xs mt-0.5">{stat.label}</div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-10">
        <AnimatePresence mode="wait">
          {!hasSearched ? (
            /* Form View */
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-3xl mx-auto"
            >
              <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8">
                <h2 className="text-xl font-bold text-[#1a1a2e] mb-6 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-[#C9A66B]" />
                  أخبرنا عن مشروعك
                </h2>
                <MatchForm onSearch={handleSearch} isLoading={isLoading} />
              </div>

              {/* How it works */}
              <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { step: "١", title: "حدد نوع مشروعك", desc: "سكني، تجاري، صناعي أو غير ذلك", color: "from-blue-500 to-blue-600" },
                  { step: "٢", title: "أدخل ميزانيتك وموقعك", desc: "لنعثر على المهندسين في منطقتك ضمن ميزانيتك", color: "from-[#6B5D4F] to-[#C9A66B]" },
                  { step: "٣", title: "استلم قائمة التوافق", desc: "نسب توافق دقيقة لكل مهندس مع تفاصيل كاملة", color: "from-green-500 to-emerald-600" },
                ].map((item, i) => (
                  <div key={i} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 text-center">
                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${item.color} text-white text-xl font-black flex items-center justify-center mx-auto mb-3`}>
                      {item.step}
                    </div>
                    <h3 className="font-bold text-slate-800 mb-1">{item.title}</h3>
                    <p className="text-slate-500 text-sm">{item.desc}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          ) : (
            /* Results View */
            <motion.div
              key="results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {/* Results header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-black text-[#1a1a2e]">
                    {isLoading ? "جاري البحث..." : `وجدنا ${results?.length || 0} مهندس متوافق`}
                  </h2>
                  {!isLoading && results?.length > 0 && (
                    <p className="text-slate-500 text-sm mt-1">
                      مرتبون حسب نسبة التوافق مع متطلباتك
                    </p>
                  )}
                </div>
                <Button
                  variant="outline"
                  onClick={handleReset}
                  className="border-[#C9A66B] text-[#6B5D4F] hover:bg-amber-50"
                >
                  <RefreshCw className="w-4 h-4 ml-2" />
                  بحث جديد
                </Button>
              </div>

              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="bg-white rounded-2xl p-5 animate-pulse shadow">
                      <div className="flex gap-4 mb-4">
                        <div className="w-16 h-16 rounded-full bg-slate-200 shrink-0" />
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-slate-200 rounded w-3/4" />
                          <div className="h-3 bg-slate-200 rounded w-1/2" />
                        </div>
                      </div>
                      <div className="h-2.5 bg-slate-200 rounded-full" />
                      <div className="h-8 bg-slate-200 rounded-xl mt-4" />
                    </div>
                  ))}
                </div>
              ) : results?.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {results.map((engineer, index) => (
                    <MatchResultCard key={engineer.id} engineer={engineer} index={index} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-20 bg-white rounded-3xl shadow-sm border border-slate-100">
                  <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                    <Users className="w-10 h-10 text-slate-300" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-700 mb-2">لم نجد مهندسين متوافقين</h3>
                  <p className="text-slate-400 mb-6">جرّب تعديل معايير البحث أو توسيع نطاق الميزانية</p>
                  <Button onClick={handleReset} className="bg-gradient-to-r from-[#6B5D4F] to-[#C9A66B] text-white">
                    <ArrowRight className="w-4 h-4 ml-2" />
                    تعديل البحث
                  </Button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}