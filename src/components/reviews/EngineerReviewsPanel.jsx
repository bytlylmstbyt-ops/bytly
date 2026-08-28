import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, MessageSquare, Filter, ShieldCheck, ThumbsUp, Quote, ChevronDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

/**
 * لوحة عرض تقييمات المهندسين — تعتمد على النجوم والتعليقات النصية
 * لتعزيز ثقة أصحاب المشاريع في اختيار المهندس المناسب.
 *
 * Props:
 *  - engineer: كيان المهندس (يحتوي rating, total_reviews, full_name)
 *  - reviews: مصفوفة كيانات Review مرتبة تنازلياً حسب التاريخ
 *  - currentClient: كيان العميل الحالي (اختياري)
 *  - hasReviewed: هل قيّم العميل الحالي هذا المهندس مسبقاً
 *  - reviewFormTrigger: عنصر زر فتح نموذج التقييم (EngineerReviewForm)
 */
export default function EngineerReviewsPanel({ engineer, reviews = [], currentClient, hasReviewed, reviewFormTrigger }) {
  const [activeFilter, setActiveFilter] = useState(0); // 0 = الكل، 5/4/3/2/1 = تصفية بنجمة محددة
  const [visibleCount, setVisibleCount] = useState(6);

  const rating = engineer?.rating || 0;
  const totalReviews = engineer?.total_reviews || reviews.length || 0;

  // توزيع التقييمات (5★ → 1★)
  const distribution = useMemo(() => {
    return [5, 4, 3, 2, 1].map(stars => {
      const count = reviews.filter(r => Math.round(r.rating) === stars).length;
      const pct = reviews.length ? (count / reviews.length) * 100 : 0;
      return { stars, count, pct };
    });
  }, [reviews]);

  // المرشحات النشطة
  const filteredReviews = useMemo(() => {
    if (activeFilter === 0) return reviews;
    return reviews.filter(r => Math.round(r.rating) === activeFilter);
  }, [reviews, activeFilter]);

  const visibleReviews = filteredReviews.slice(0, visibleCount);
  const hasMore = filteredReviews.length > visibleCount;

  // نسبة التقييمات الإيجابية (4★ فأعلى) — مؤشر ثقة
  const positivePct = reviews.length
    ? Math.round((reviews.filter(r => r.rating >= 4).length / reviews.length) * 100)
    : 0;

  // هل المهندس موصى به (تقييم ≥ 4.5 وعدد تقييمات ≥ 5)
  const isHighlyRated = rating >= 4.5 && totalReviews >= 5;

  // لون النجمة حسب التقييم
  const starColor = (value) => {
    if (value >= 4.5) return "fill-emerald-400 text-emerald-400";
    if (value >= 3.5) return "fill-amber-400 text-amber-400";
    if (value >= 2.5) return "fill-orange-400 text-orange-400";
    return "fill-rose-400 text-rose-400";
  };

  // الأحرف الأولى لاسم العميل
  const getInitials = (name, index) => {
    if (name) {
      const parts = name.trim().split(" ");
      if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
      return name.substring(0, 2).toUpperCase();
    }
    return String.fromCharCode(65 + (index % 26));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <Card className="border-0 shadow-lg overflow-hidden">
        {/* شريط علوي ذهبي */}
        <div className="h-1.5 bg-gradient-to-r from-amber-400 via-amber-500 to-[#C9A66B]" />

        <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-3">
          <CardTitle className="flex items-center gap-2 text-xl">
            <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center">
              <Star className="w-5 h-5 text-amber-500 fill-amber-400" />
            </div>
            تقييمات العملاء والمراجعات
          </CardTitle>

          {/* زر إضافة تقييم */}
          {currentClient && !hasReviewed && reviewFormTrigger}
          {currentClient && hasReviewed && (
            <div className="flex items-center gap-1.5 text-sm text-amber-700 bg-amber-50 rounded-lg px-3 py-2 border border-amber-200">
              <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
              شكراً لتقييمك — تقييمك مسجّ لدى هذا المهندس
            </div>
          )}
        </CardHeader>

        <CardContent className="space-y-6">
          {/* ── ملخص التقييمات: رقم كبير + توزيع النجوم + شارات الثقة ── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-5 bg-gradient-to-br from-amber-50/60 via-white to-orange-50/40 rounded-2xl border border-amber-100/60">
            {/* الرقم الإجمالي */}
            <div className="flex flex-col items-center justify-center text-center md:border-l md:border-amber-100 md:pl-4">
              <p className="text-5xl font-extrabold text-amber-600 leading-none">{rating.toFixed(1)}</p>
              <div className="flex justify-center my-2 gap-0.5">
                {[1, 2, 3, 4, 5].map(s => (
                  <Star
                    key={s}
                    className={`w-5 h-5 ${s <= Math.round(rating) ? starColor(rating) : "text-slate-200"}`}
                  />
                ))}
              </div>
              <p className="text-sm text-slate-500">
                من 5 — {totalReviews} تقييم
              </p>
            </div>

            {/* توزيع النجوم (قابل للنقر للتصفية) */}
            <div className="space-y-1.5 md:col-span-2">
              {distribution.map(({ stars, count, pct }) => (
                <button
                  key={stars}
                  onClick={() => setActiveFilter(activeFilter === stars ? 0 : stars)}
                  className={`flex items-center gap-2 w-full text-xs rounded-lg px-2 py-1 transition-colors ${
                    activeFilter === stars ? "bg-amber-100" : "hover:bg-amber-50"
                  }`}
                >
                  <span className="w-6 text-right font-medium text-slate-600">{stars}</span>
                  <Star className={`w-3.5 h-3.5 ${count > 0 ? "fill-amber-400 text-amber-400" : "text-slate-200"} flex-shrink-0`} />
                  <div className="flex-1 bg-slate-200 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-8 text-left text-slate-500">{count}</span>
                </button>
              ))}
              <p className="text-[11px] text-slate-400 pt-1 flex items-center gap-1">
                <Filter className="w-3 h-3" />
                اضغط على أي صف لتصفية التقييمات حسب عدد النجوم
              </p>
            </div>
          </div>

          {/* ── شارات الثقة السريعة ── */}
          {(totalReviews > 0) && (
            <div className="flex flex-wrap gap-2">
              {isHighlyRated && (
                <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 gap-1 px-3 py-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  مهندس موصى به — تقييم استثنائي
                </Badge>
              )}
              <Badge className="bg-amber-50 text-amber-700 border border-amber-200 gap-1 px-3 py-1.5">
                <ThumbsUp className="w-3.5 h-3.5" />
                {positivePct}% من العملاء راضون (4★ فأعلى)
              </Badge>
              {reviews.filter(r => r.highlights?.length > 0).length > 0 && (
                <Badge className="bg-blue-50 text-blue-700 border border-blue-200 gap-1 px-3 py-1.5">
                  <Quote className="w-3.5 h-3.5" />
                  {reviews.filter(r => r.highlights?.length > 0).length} مراجعة بملاحظات مميزة
                </Badge>
              )}
            </div>
          )}

          {/* ── شريط التصفية النشط ── */}
          {activeFilter !== 0 && (
            <div className="flex items-center justify-between bg-slate-50 rounded-lg px-4 py-2.5">
              <span className="text-sm text-slate-600">
                عرض التقييمات بـ {activeFilter} نجوم
                <span className="text-slate-400"> ({filteredReviews.length} نتيجة)</span>
              </span>
              <Button
                size="sm"
                variant="ghost"
                className="text-amber-600 hover:text-amber-700 h-8"
                onClick={() => setActiveFilter(0)}
              >
                إلغاء التصفية
              </Button>
            </div>
          )}

          {/* ── قائمة التقييمات ── */}
          {visibleReviews.length > 0 ? (
            <div className="space-y-4">
              <AnimatePresence mode="popLayout">
                {visibleReviews.map((review, index) => (
                  <motion.div
                    key={review.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ delay: index * 0.03 }}
                    className="group p-4 rounded-2xl border border-slate-100 bg-white hover:bg-amber-50/20 hover:border-amber-200 hover:shadow-md transition-all"
                  >
                    <div className="flex items-start gap-3">
                      {/* صورة العميل */}
                      <Avatar className="w-11 h-11 flex-shrink-0 ring-2 ring-amber-100">
                        <AvatarFallback className="bg-gradient-to-br from-[#6B5D4F] to-[#C9A66B] text-white font-bold text-sm">
                          {getInitials(review.client_name, index)}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        {/* رأس التقييم: الاسم + النجوم + التاريخ */}
                        <div className="flex items-center justify-between mb-1.5 flex-wrap gap-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-slate-800 text-sm">
                              {review.client_name || `عميل ${index + 1}`}
                            </span>
                            <div className="flex items-center gap-0.5">
                              {[1, 2, 3, 4, 5].map(s => (
                                <Star
                                  key={s}
                                  className={`w-3.5 h-3.5 ${s <= review.rating ? starColor(review.rating) : "text-slate-200"}`}
                                />
                              ))}
                            </div>
                            <span className="text-xs font-bold text-amber-600">{review.rating.toFixed(1)}</span>
                          </div>
                          <span className="text-xs text-slate-400">
                            {new Date(review.created_date).toLocaleDateString("ar-SA", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                        </div>

                        {/* وسم المرحلة إن وجد */}
                        {review.milestone_title && (
                          <div className="inline-flex items-center gap-1 text-xs bg-amber-50 border border-amber-200 text-amber-700 px-2 py-0.5 rounded-full mb-2">
                            🏗️ {review.milestone_title}
                          </div>
                        )}

                        {/* النقاط المميزة */}
                        {review.highlights?.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mb-2.5">
                            {review.highlights.map((h, idx) => (
                              <span
                                key={idx}
                                className="text-xs bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full border border-emerald-200 font-medium"
                              >
                                ✓ {h}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* التعليق النصي */}
                        {review.comment && (
                          <div className="relative pr-4">
                            <Quote className="absolute top-0 right-0 w-3.5 h-3.5 text-amber-200" />
                            <p className="text-slate-700 text-sm leading-relaxed">
                              {review.comment}
                            </p>
                          </div>
                        )}

                        {/* التقييمات الفرعية */}
                        {(review.quality_rating > 0 || review.communication_rating > 0 || review.delivery_rating > 0) && (
                          <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-slate-100">
                            {review.quality_rating > 0 && (
                              <span className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-lg border border-blue-100">
                                🏆 الجودة {review.quality_rating}/5
                              </span>
                            )}
                            {review.communication_rating > 0 && (
                              <span className="inline-flex items-center gap-1 text-xs bg-green-50 text-green-700 px-2.5 py-1 rounded-lg border border-green-100">
                                💬 التواصل {review.communication_rating}/5
                              </span>
                            )}
                            {review.delivery_rating > 0 && (
                              <span className="inline-flex items-center gap-1 text-xs bg-purple-50 text-purple-700 px-2.5 py-1 rounded-lg border border-purple-100">
                                ⏱️ المواعيد {review.delivery_rating}/5
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* زر عرض المزيد */}
              {hasMore && (
                <div className="text-center pt-2">
                  <Button
                    variant="outline"
                    className="border-amber-200 text-amber-700 hover:bg-amber-50 gap-2"
                    onClick={() => setVisibleCount(c => c + 6)}
                  >
                    عرض المزيد من التقييمات
                    <span className="text-xs text-slate-400">({filteredReviews.length - visibleCount} متبقٍ)</span>
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
          ) : (
            /* ── حالة فارغة ── */
            <div className="text-center py-14 px-4">
              <div className="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="w-8 h-8 text-amber-300" />
              </div>
              <p className="text-slate-600 font-medium mb-1">
                {activeFilter !== 0
                  ? `لا توجد تقييمات بـ ${activeFilter} نجوم`
                  : "لا توجد تقييمات حتى الآن"}
              </p>
              <p className="text-sm text-slate-400 max-w-sm mx-auto">
                {activeFilter !== 0
                  ? "جرّب تصفية أخرى أو اعرض كل التقييمات"
                  : "كن أول من يقيّم هذا المهندس وشارك تجربتك لمساعدة أصحاب المشاريع الآخرين"}
              </p>
              {activeFilter !== 0 && (
                <Button
                  variant="ghost"
                  className="mt-3 text-amber-600"
                  onClick={() => setActiveFilter(0)}
                >
                  عرض كل التقييمات
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}