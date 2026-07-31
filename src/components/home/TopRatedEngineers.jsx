import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { Star, CheckCircle, Trophy, TrendingUp, ChevronLeft, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useLanguage } from "@/components/i18n/LanguageContext";

/**
 * Performance score = weighted blend of rating, review count, and completed projects.
 * Rating (0-5) is the dominant factor; reviews and completed projects act as confidence multipliers.
 */
function calcScore(engineer) {
  const rating = engineer.rating || 0;
  const reviews = engineer.total_reviews || 0;
  const projects = engineer.completed_projects || 0;
  // Normalize: rating * (1 + log-scaled activity) to reward both quality and volume
  const activity = Math.log10(1 + reviews) * 0.4 + Math.log10(1 + projects) * 0.3;
  return Math.round(rating * 20 * (1 + activity));
}

const medalColors = [
  "from-amber-400 to-yellow-500",   // #1 gold
  "from-slate-300 to-slate-400",     // #2 silver
  "from-orange-400 to-amber-600",    // #3 bronze
];

export default function TopRatedEngineers() {
  const { t } = useLanguage();
  const [topEngineers, setTopEngineers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadTopEngineers();
  }, []);

  const loadTopEngineers = async () => {
    try {
      // Fetch approved engineers sorted by rating, then pick the best by composite score
      const engineers = await base44.entities.Engineer.filter(
        { status: "approved" },
        "-rating",
        20
      );
      // Filter to those with at least one review or completed project, then rank by score
      const ranked = engineers
        .filter((e) => (e.total_reviews || 0) > 0 || (e.completed_projects || 0) > 0)
        .map((e) => ({ ...e, _score: calcScore(e) }))
        .sort((a, b) => b._score - a._score)
        .slice(0, 5);
      setTopEngineers(ranked);
    } catch (error) {
      console.error("TopRatedEngineers load error:", error.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isLoading && topEngineers.length === 0) return null;

  return (
    <section className="py-20 bg-gradient-to-br from-[#1a1a2e] via-[#1a1a2e] to-[#2a2a3e] relative overflow-hidden">
      {/* Decorative glow */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#C9A66B]/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#C9A66B]/10 rounded-full blur-3xl" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-col md:flex-row md:justify-between md:items-end mb-12 gap-4"
        >
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#C9A66B] to-[#C9A66B] flex items-center justify-center shadow-lg">
                <Trophy className="w-6 h-6 text-white" />
              </div>
              <Badge className="bg-[#C9A66B]/20 text-[#C9A66B] border-[#C9A66B]/40">
                <TrendingUp className="w-3 h-3 ml-1" />
                {t('home.topRated.subtitle')}
              </Badge>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">
              {t('home.topRated.title')}
            </h2>
            <p className="text-slate-400 max-w-xl">
              {t('home.topRated.subtitle')}
            </p>
          </div>
          <Link to={createPageUrl("Engineers")}>
            <Button variant="outline" className="hidden md:flex items-center gap-2 border-[#C9A66B]/50 text-[#C9A66B] hover:bg-[#C9A66B] hover:text-white">
              {t('home.topRated.viewAll')}
              <ChevronLeft className="w-4 h-4" />
            </Button>
          </Link>
        </motion.div>

        {/* Leaderboard */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="animate-pulse flex items-center gap-4 bg-white/5 rounded-2xl p-4">
                <div className="w-10 h-10 rounded-full bg-white/10" />
                <div className="w-14 h-14 rounded-full bg-white/10" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-40 bg-white/10 rounded" />
                  <div className="h-3 w-28 bg-white/10 rounded" />
                </div>
                <div className="h-8 w-20 bg-white/10 rounded-lg" />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {topEngineers.map((engineer, index) => {
              const isTop3 = index < 3;
              return (
                <motion.div
                  key={engineer.id}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.08 }}
                >
                  <Link to={createPageUrl("EngineerProfile") + `?id=${engineer.id}`}>
                    <Card className={`group hover-lift cursor-pointer border-0 bg-white/5 hover:bg-white/10 backdrop-blur-sm transition-all ${
                      isTop3 ? "ring-1 ring-[#C9A66B]/30" : ""
                    }`}>
                      <CardContent className="p-4 md:p-5">
                        <div className="flex items-center gap-3 md:gap-5">
                          {/* Rank */}
                          <div className="flex flex-col items-center justify-center shrink-0 w-10 md:w-12">
                            {isTop3 ? (
                              <div className={`w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-br ${medalColors[index]} flex items-center justify-center shadow-lg`}>
                                <span className="text-white font-bold text-base md:text-lg">{index + 1}</span>
                              </div>
                            ) : (
                              <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/10 flex items-center justify-center">
                                <span className="text-slate-300 font-bold text-base md:text-lg">{index + 1}</span>
                              </div>
                            )}
                          </div>

                          {/* Avatar */}
                          <Avatar className="w-12 h-12 md:w-14 md:h-14 border-2 border-white/20 shrink-0">
                            <AvatarImage src={engineer.profile_image} />
                            <AvatarFallback className="bg-gradient-to-br from-[#6B5D4F] to-[#C9A66B] text-white">
                              {engineer.full_name?.charAt(0)}
                            </AvatarFallback>
                          </Avatar>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <h3 className="font-bold text-white text-sm md:text-base truncate">
                                {engineer.full_name}
                              </h3>
                              {engineer.is_verified && (
                                <CheckCircle className="w-4 h-4 text-[#C9A66B] shrink-0" />
                              )}
                            </div>
                            <p className="text-slate-400 text-xs md:text-sm truncate">
                              {engineer.specialization || engineer.user_type}
                            </p>
                          </div>

                          {/* Stats — hidden on small screens */}
                          <div className="hidden sm:flex items-center gap-4 md:gap-6 shrink-0">
                            <div className="flex items-center gap-1">
                              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                              <span className="text-white font-semibold text-sm">
                                {engineer.rating?.toFixed(1) || "0.0"}
                              </span>
                              <span className="text-slate-500 text-xs">
                                ({engineer.total_reviews || 0})
                              </span>
                            </div>
                            <div className="text-center">
                              <div className="text-white font-semibold text-sm">
                                {engineer.completed_projects || 0}
                              </div>
                              <div className="text-slate-500 text-xs">
                                {t('home.topRated.projects')}
                              </div>
                            </div>
                          </div>

                          {/* Score badge */}
                          <div className="shrink-0 text-center">
                            <div className="bg-gradient-to-br from-[#C9A66B] to-[#C9A66B] text-white font-bold text-sm md:text-base px-3 py-1.5 rounded-lg shadow-md">
                              {engineer._score}
                            </div>
                            <div className="text-slate-500 text-[10px] md:text-xs mt-0.5 hidden md:block">
                              {t('home.topRated.score')}
                            </div>
                          </div>
                        </div>

                        {/* Mobile-only stats row */}
                        <div className="flex sm:hidden items-center gap-4 mt-3 pt-3 border-t border-white/10">
                          <div className="flex items-center gap-1">
                            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                            <span className="text-white font-semibold text-xs">
                              {engineer.rating?.toFixed(1) || "0.0"}
                            </span>
                            <span className="text-slate-500 text-xs">
                              ({engineer.total_reviews || 0} {t('home.topRated.reviews')})
                            </span>
                          </div>
                          <div className="text-white text-xs">
                            {engineer.completed_projects || 0} {t('home.topRated.projects')}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Mobile view-all button */}
        <div className="md:hidden text-center mt-8">
          <Link to={createPageUrl("Engineers")}>
            <Button variant="outline" className="items-center gap-2 border-[#C9A66B]/50 text-[#C9A66B] hover:bg-[#C9A66B] hover:text-white">
              {t('home.topRated.viewAll')}
              <ChevronLeft className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}