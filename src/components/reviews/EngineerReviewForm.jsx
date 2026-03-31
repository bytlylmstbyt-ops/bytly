import React, { useState } from "react";
import { Star, MessageSquare, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger
} from "@/components/ui/dialog";
import { base44 } from "@/api/base44Client";

function StarInput({ label, value, onChange }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div>
      <p className="text-sm text-slate-600 mb-1">{label}</p>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map(star => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
          >
            <Star
              className={`w-7 h-7 transition-colors ${
                star <= (hovered || value)
                  ? "fill-amber-400 text-amber-400"
                  : "text-slate-300"
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  );
}

export default function EngineerReviewForm({ engineerId, engineerName, clientId, clientName, onSubmitted, trigger }) {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [qualityRating, setQualityRating] = useState(0);
  const [communicationRating, setCommunicationRating] = useState(0);
  const [deliveryRating, setDeliveryRating] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      alert("يرجى اختيار التقييم العام");
      return;
    }
    setLoading(true);

    // Create review
    await base44.entities.Review.create({
      engineer_id: engineerId,
      client_id: clientId,
      rating,
      quality_rating: qualityRating || rating,
      communication_rating: communicationRating || rating,
      delivery_rating: deliveryRating || rating,
      comment
    });

    // Recalculate engineer average rating
    const allReviews = await base44.entities.Review.filter({ engineer_id: engineerId });
    const avg = allReviews.reduce((s, r) => s + r.rating, 0) / allReviews.length;
    await base44.entities.Engineer.update(engineerId, {
      rating: parseFloat(avg.toFixed(2)),
      total_reviews: allReviews.length
    });

    setLoading(false);
    setOpen(false);
    onSubmitted && onSubmitted();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-amber-500" />
            تقييم {engineerName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-2">
          <StarInput label="التقييم العام *" value={rating} onChange={setRating} />
          <div className="grid grid-cols-3 gap-4 p-4 bg-slate-50 rounded-xl">
            <StarInput label="جودة العمل" value={qualityRating} onChange={setQualityRating} />
            <StarInput label="التواصل" value={communicationRating} onChange={setCommunicationRating} />
            <StarInput label="الالتزام بالمواعيد" value={deliveryRating} onChange={setDeliveryRating} />
          </div>

          <div>
            <label className="text-sm text-slate-600 mb-1 block">تعليقك (اختياري)</label>
            <Textarea
              placeholder="شارك تجربتك مع هذا المهندس..."
              value={comment}
              onChange={e => setComment(e.target.value)}
              rows={4}
            />
          </div>

          <Button
            className="w-full bg-gradient-to-r from-[#6B5D4F] to-[#C9A66B] text-white"
            onClick={handleSubmit}
            disabled={loading || rating === 0}
          >
            <Send className="w-4 h-4 ml-2" />
            {loading ? "جاري الإرسال..." : "إرسال التقييم"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}