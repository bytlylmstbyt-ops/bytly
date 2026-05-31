import React, { useState } from "react";
import { Star, Send, CheckCircle, ThumbsUp, X, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";

const HIGHLIGHTS = [
  "التزم بالمواعيد تماماً",
  "تواصل ممتاز",
  "جودة عالية",
  "أسعار معقولة",
  "أعمال إبداعية",
  "سريع في الاستجابة",
  "أنصح بالتعامل معه",
  "محترف ودقيق",
  "مواصفات دقيقة",
  "إبداع في التصميم"
];

function StarInput({ label, icon, value, onChange }) {
  const [hovered, setHovered] = useState(0);
  const labels = ["", "ضعيف", "مقبول", "جيد", "جيد جداً", "ممتاز"];
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-2xl">{icon}</span>
      <p className="text-xs font-medium text-slate-600 text-center">{label}</p>
      <div className="flex gap-0.5">
        {[1,2,3,4,5].map(star => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
          >
            <Star
              className={`w-6 h-6 transition-all ${
                star <= (hovered || value)
                  ? "fill-amber-400 text-amber-400 scale-110"
                  : "text-slate-300 hover:text-amber-200"
              }`}
            />
          </button>
        ))}
      </div>
      {(hovered || value) > 0 && (
        <span className="text-xs text-amber-600 font-medium">{labels[hovered || value]}</span>
      )}
    </div>
  );
}

export default function MilestoneReviewModal({
  open,
  onClose,
  milestone,
  engineer,
  client,
  projectId,
  onSubmitted
}) {
  const [step, setStep] = useState(1);
  const [rating, setRating] = useState(0);
  const [qualityRating, setQualityRating] = useState(0);
  const [communicationRating, setCommunicationRating] = useState(0);
  const [deliveryRating, setDeliveryRating] = useState(0);
  const [selectedHighlights, setSelectedHighlights] = useState([]);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const toggleHighlight = (h) =>
    setSelectedHighlights(prev =>
      prev.includes(h) ? prev.filter(x => x !== h) : [...prev, h]
    );

  const handleSubmit = async () => {
    if (rating === 0) return;
    setLoading(true);

    try {
      const fullComment = [
        selectedHighlights.length > 0 ? `✨ ${selectedHighlights.join(" • ")}` : "",
        comment
      ].filter(Boolean).join("\n\n");

      // Create the review, linked to this milestone
      await base44.entities.Review.create({
        engineer_id: engineer.id,
        client_id: client.id,
        project_id: projectId,
        milestone_id: milestone.id,
        milestone_title: milestone.title,
        rating,
        quality_rating: qualityRating || rating,
        communication_rating: communicationRating || rating,
        delivery_rating: deliveryRating || rating,
        comment: fullComment,
        status: "completed"
      });

      // Recalculate engineer averages
      const allReviews = await base44.entities.Review.filter({ engineer_id: engineer.id });
      const avg = allReviews.reduce((s, r) => s + r.rating, 0) / allReviews.length;
      const avgQuality = allReviews.reduce((s, r) => s + (r.quality_rating || r.rating), 0) / allReviews.length;
      const avgComm = allReviews.reduce((s, r) => s + (r.communication_rating || r.rating), 0) / allReviews.length;
      const avgDelivery = allReviews.reduce((s, r) => s + (r.delivery_rating || r.rating), 0) / allReviews.length;

      await base44.entities.Engineer.update(engineer.id, {
        rating: parseFloat(avg.toFixed(2)),
        total_reviews: allReviews.length,
        quality_avg: parseFloat(avgQuality.toFixed(2)),
        communication_avg: parseFloat(avgComm.toFixed(2)),
        delivery_avg: parseFloat(avgDelivery.toFixed(2)),
        completed_projects: (engineer.completed_projects || 0) + 1
      });

      setSubmitted(true);
      setTimeout(() => {
        onSubmitted && onSubmitted();
        onClose();
      }, 2500);
    } catch (err) {
      console.error("Review error:", err);
    } finally {
      setLoading(false);
    }
  };

  const ratingLabel = ["", "ضعيف جداً", "ضعيف", "جيد", "جيد جداً", "ممتاز"][rating] || "";
  const ratingColors = ["", "text-red-600", "text-orange-500", "text-yellow-500", "text-amber-500", "text-green-600"];

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="max-w-lg p-0 overflow-hidden" dir="rtl" onInteractOutside={e => e.preventDefault()}>
        {/* Header gradient */}
        <div className="h-1.5 bg-gradient-to-r from-[#6B5D4F] via-[#C9A66B] to-[#6B5D4F]" />

        <AnimatePresence mode="wait">
          {submitted ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center py-14 px-6 gap-4 text-center"
            >
              <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="w-12 h-12 text-green-500" />
              </div>
              <h2 className="text-xl font-bold text-green-700">شكراً على تقييمك!</h2>
              <p className="text-slate-500 text-sm">
                تقييمك تم نشره في ملف المهندس <span className="font-semibold text-slate-700">{engineer?.full_name}</span> ومعرض أعماله.
              </p>
              <div className="flex items-center gap-1 mt-2">
                {[1,2,3,4,5].map(s => (
                  <Star key={s} className={`w-6 h-6 ${s <= rating ? "fill-amber-400 text-amber-400" : "text-slate-200"}`} />
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-5 space-y-4">
              {/* Engineer info */}
              <div className="flex items-center gap-3 pb-3 border-b">
                <Avatar className="w-12 h-12 border-2 border-amber-200">
                  <AvatarImage src={engineer?.profile_image} />
                  <AvatarFallback className="bg-gradient-to-br from-[#6B5D4F] to-[#C9A66B] text-white font-bold">
                    {engineer?.full_name?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <h3 className="font-bold text-slate-800">قيّم تجربتك</h3>
                  </div>
                  <p className="text-sm text-slate-500">
                    المهندس <span className="font-semibold text-[#6B5D4F]">{engineer?.full_name}</span>
                  </p>
                  <Badge variant="outline" className="text-xs mt-0.5 border-amber-300 text-amber-700">
                    🏗️ {milestone?.title}
                  </Badge>
                </div>
                <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Step progress */}
              <div className="flex gap-1">
                {[1, 2].map(s => (
                  <div key={s} className={`flex-1 h-1 rounded-full transition-all duration-300 ${step >= s ? "bg-amber-400" : "bg-slate-200"}`} />
                ))}
              </div>

              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-5"
                >
                  {/* Overall rating */}
                  <div className="text-center space-y-3">
                    <p className="font-semibold text-slate-700">ما هو تقييمك العام للمرحلة؟</p>
                    <div className="flex justify-center gap-2">
                      {[1,2,3,4,5].map(star => (
                        <button key={star} type="button" onClick={() => setRating(star)}>
                          <Star className={`w-11 h-11 transition-all duration-150 ${
                            star <= rating
                              ? "fill-amber-400 text-amber-400 scale-110"
                              : "text-slate-300 hover:text-amber-200 hover:scale-105"
                          }`} />
                        </button>
                      ))}
                    </div>
                    {ratingLabel && (
                      <Badge className={`text-sm px-4 bg-amber-50 border border-amber-200 ${ratingColors[rating]}`}>
                        {ratingLabel}
                      </Badge>
                    )}
                  </div>

                  {/* Sub-ratings */}
                  <div className="grid grid-cols-3 gap-3 p-4 bg-slate-50 rounded-xl">
                    <StarInput label="جودة العمل" icon="🏆" value={qualityRating} onChange={setQualityRating} />
                    <StarInput label="التواصل" icon="💬" value={communicationRating} onChange={setCommunicationRating} />
                    <StarInput label="الالتزام بالمواعيد" icon="⏱️" value={deliveryRating} onChange={setDeliveryRating} />
                  </div>

                  <Button
                    className="w-full bg-gradient-to-r from-[#6B5D4F] to-[#C9A66B] text-white"
                    onClick={() => setStep(2)}
                    disabled={rating === 0}
                  >
                    التالي →
                  </Button>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-4"
                >
                  {/* Highlights */}
                  <div>
                    <p className="text-sm font-medium text-slate-700 mb-2 flex items-center gap-1">
                      <ThumbsUp className="w-4 h-4 text-amber-500" />
                      ما الذي أعجبك؟ (اختياري)
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {HIGHLIGHTS.map(h => (
                        <button
                          key={h}
                          type="button"
                          onClick={() => toggleHighlight(h)}
                          className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                            selectedHighlights.includes(h)
                              ? "bg-amber-100 border-amber-400 text-amber-700 font-medium"
                              : "border-slate-200 text-slate-600 hover:border-amber-300"
                          }`}
                        >
                          {selectedHighlights.includes(h) ? "✓ " : ""}{h}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Comment */}
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-1 block">تعليقك (اختياري)</label>
                    <Textarea
                      placeholder="شارك تفاصيل تجربتك مع هذه المرحلة..."
                      value={comment}
                      onChange={e => setComment(e.target.value.slice(0, 500))}
                      rows={3}
                      className="resize-none"
                    />
                    <p className="text-xs text-slate-400 mt-1 text-left">{comment.length}/500</p>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>
                      ← رجوع
                    </Button>
                    <Button
                      className="flex-1 bg-gradient-to-r from-[#6B5D4F] to-[#C9A66B] text-white"
                      onClick={handleSubmit}
                      disabled={loading}
                    >
                      <Send className="w-4 h-4 ml-2" />
                      {loading ? "جاري الإرسال..." : "نشر التقييم"}
                    </Button>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}