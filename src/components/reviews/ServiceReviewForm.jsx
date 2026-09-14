import React, { useState } from "react";
import { Star, MessageSquare, Send, CheckCircle, ThumbsUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle
} from "@/components/ui/dialog";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";

const TARGET_LABELS = {
  engineer: "المهندس",
  contractor: "المقاول",
  supplier: "المورد",
};

const HIGHLIGHTS = [
  "التزم بالمواعيد تماماً",
  "تواصل ممتاز",
  "جودة عالية",
  "أسعار معقولة",
  "أعمال إبداعية",
  "سريع في الاستجابة",
  "أنصح بالتعامل معه",
  "محترف ودقيق"
];

function StarInput({ label, value, onChange, icon }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex flex-col items-center gap-1">
      {icon && <span className="text-xl">{icon}</span>}
      <p className="text-xs font-medium text-slate-600 text-center">{label}</p>
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map(star => (
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
        <span className="text-xs text-amber-600 font-medium">
          {["", "ضعيف", "مقبول", "جيد", "جيد جداً", "ممتاز"][hovered || value]}
        </span>
      )}
    </div>
  );
}

export default function ServiceReviewForm({
  targetType = "engineer",
  targetId,
  targetName,
  milestoneId,
  milestoneTitle,
  projectId,
  open,
  onOpenChange,
  onSubmitted
}) {
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [rating, setRating] = useState(0);
  const [qualityRating, setQualityRating] = useState(0);
  const [communicationRating, setCommunicationRating] = useState(0);
  const [deliveryRating, setDeliveryRating] = useState(0);
  const [comment, setComment] = useState("");
  const [selectedHighlights, setSelectedHighlights] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const label = TARGET_LABELS[targetType] || "مقدم الخدمة";

  const toggleHighlight = (h) => {
    setSelectedHighlights(prev =>
      prev.includes(h) ? prev.filter(x => x !== h) : [...prev, h]
    );
  };

  const handleSubmit = async () => {
    if (rating === 0) return;
    setLoading(true);

    const fullComment = [
      selectedHighlights.length > 0 ? `✨ ${selectedHighlights.join(" • ")}` : "",
      comment
    ].filter(Boolean).join("\n\n");

    try {
      await base44.functions.invoke('submitServiceReview', {
        targetType,
        targetId,
        targetName,
        rating,
        qualityRating,
        communicationRating,
        deliveryRating,
        comment: fullComment,
        highlights: selectedHighlights,
        milestoneId,
        milestoneTitle,
        projectId,
      });
      setLoading(false);
      setSubmitted(true);
      setTimeout(() => {
        onSubmitted && onSubmitted();
      }, 2000);
    } catch (error) {
      setLoading(false);
      toast({
        title: "حدث خطأ أثناء إرسال التقييم",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const ratingLabel = ["", "ضعيف جداً", "ضعيف", "جيد", "جيد جداً", "ممتاز"][rating] || "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
            تقييم {label} {targetName}
          </DialogTitle>
        </DialogHeader>

        {submitted ? (
          <div className="flex flex-col items-center justify-center py-10 gap-4">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-green-500" />
            </div>
            <p className="text-lg font-bold text-green-700">شكراً على تقييمك!</p>
            <p className="text-slate-500 text-sm text-center">تقييمك يساعد المجتمع على اختيار {label} المناسب</p>
          </div>
        ) : (
          <div className="space-y-5 py-2">
            <div className="flex gap-1">
              {[1, 2].map(s => (
                <div key={s} className={`flex-1 h-1 rounded-full transition-colors ${step >= s ? 'bg-amber-400' : 'bg-slate-200'}`} />
              ))}
            </div>

            {step === 1 && (
              <div className="space-y-5">
                <div className="text-center space-y-3">
                  <p className="font-semibold text-slate-700">ما هو تقييمك العام؟</p>
                  <div className="flex justify-center gap-2">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button key={star} type="button" onClick={() => setRating(star)}>
                        <Star className={`w-10 h-10 transition-all ${star <= rating ? "fill-amber-400 text-amber-400 scale-110" : "text-slate-300 hover:text-amber-200"}`} />
                      </button>
                    ))}
                  </div>
                  {ratingLabel && (
                    <Badge className="bg-amber-100 text-amber-700 text-sm px-3">{ratingLabel}</Badge>
                  )}
                </div>

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
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
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

                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1 block flex items-center gap-1">
                    <MessageSquare className="w-4 h-4" />
                    تعليقك التفصيلي (اختياري)
                  </label>
                  <Textarea
                    placeholder={`شارك تجربتك مع هذا ${label} بالتفصيل...`}
                    value={comment}
                    onChange={e => setComment(e.target.value)}
                    rows={4}
                    className="resize-none"
                    maxLength={500}
                  />
                  <p className="text-xs text-slate-400 mt-1">{comment.length}/500 حرف</p>
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
                    {loading ? "جاري الإرسال..." : "إرسال التقييم"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}