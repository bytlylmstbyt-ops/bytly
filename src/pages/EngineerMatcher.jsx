import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, RefreshCw, Users, Trophy, ArrowRight } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import MatchForm from "@/components/matching/MatchForm";
import MatchResultCard from "@/components/matching/MatchResultCard";

export default function EngineerMatcher() {
  const [results, setResults] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchError, setSearchError] = useState("");

  const handleSearch = async (formData) => {
    setIsLoading(true);
    setHasSearched(true);
    setSearchError("");
    setResults([]);
    try {
      const { data, error } = await supabase
        .from("engineers")
        .select("id,full_name,specialization,city,rating,total_reviews,years_experience,profile_image,is_verified,is_real,status")
        .eq("status", "approved")
        .eq("is_verified", true)
        .eq("is_real", true)
        .limit(500);
      if (error) throw error;

      const termsByType = {
        residential: ["architecture", "architectural", "معماري", "عمارة", "مدني", "civil", "إنشائي", "structural"],
        commercial: ["commercial", "تجاري", "معماري", "architecture", "مدني", "civil", "إدارة مشاريع"],
        industrial: ["industrial", "صناعي", "مدني", "civil", "كهرب", "ميكاني", "ميكانيك"],
        renovation: ["renovation", "ترميم", "داخلي", "interior", "مدني", "civil", "معماري"],
        interior: ["interior", "تصميم داخلي", "ديكور", "أثاث"],
        landscape: ["landscape", "مناظر طبيعية", "حدائق", "تنسيق"],
        other: [],
      };
      const terms = termsByType[formData.project_type] || [];
      const requestedLocation = String(formData.location || "").trim().toLowerCase();
      const minimumExperience = Number(formData.years_experience_min) || 0;
      const ranked = (data || []).map((engineer) => {
        const specialization = String(engineer.specialization || "").toLowerCase();
        const city = String(engineer.city || "").toLowerCase();
        const experience = Number(engineer.years_experience) || 0;
        const rating = Math.min(5, Math.max(0, Number(engineer.rating) || 0));
        const specializationMatch = terms.length === 0 || terms.some(term => specialization.includes(term.toLowerCase()));
        const locationMatch = !requestedLocation || city.includes(requestedLocation) || requestedLocation.includes(city);
        const experienceMatch = experience >= minimumExperience;
        const specializationScore = specializationMatch ? 45 : 0;
        const locationScore = !requestedLocation ? 25 : locationMatch ? 25 : 0;
        const experienceScore = experienceMatch ? 20 : 0;
        const ratingScore = Math.round((rating / 5) * 10);
        const percentage = specializationScore + locationScore + experienceScore + ratingScore;
        return {
          ...engineer,
          match_percentage: percentage,
          match_breakdown: [
            { label: "التخصص", score: specializationScore, max: 45 },
            { label: "الموقع", score: locationScore, max: 25 },
            { label: "الخبرة", score: experienceScore, max: 20 },
            { label: "التقييم", score: ratingScore, max: 10 },
          ],
          _specializationMatch: specializationMatch,
        };
      }).filter(engineer => engineer._specializationMatch && (minimumExperience === 0 || (Number(engineer.years_experience) || 0) >= minimumExperience))
        .sort((a, b) => b.match_percentage - a.match_percentage)
        .map(({ _specializationMatch, ...engineer }) => engineer);
      setResults(ranked);
    } catch (error) {
      console.error("Engineer matching failed:", error);
      setSearchError(error?.message || "تعذر البحث عن المهندسين حاليًا.");
      setResults([]);
    } finally {
      setIsLoading(false);
    }
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
              أدخل تفاصيل مشروعك لنرتّب المهندسين المعتمدين وفق التخصص والموقع والخبرة والتقييم. النسبة تقديرية وليست ضمانًا لجودة الخدمة
            </p>

            {/* Stats bar */}
            <div className="flex justify-center gap-8 mt-8">
              {[
                { icon: Users, label: "مصدر البيانات", value: "محدّث" },
                { icon: Trophy, label: "عوامل المطابقة", value: "4" },
                { icon: Sparkles, label: "الترتيب", value: "تقديري" },
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

              {searchError && <div role="alert" className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{searchError}</div>}\n\n              {isLoading ? (
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