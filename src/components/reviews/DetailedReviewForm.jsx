import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star, Award, Clock, MessageSquare, Shield, CheckCircle, Loader2 } from "lucide-react";

const CRITERIA = [
  { key: "quality_rating",        label: "جودة العمل",          icon: Award,        color: "#10b981", desc: "مدى احترافية ودقة التصميم والتنفيذ" },
  { key: "delivery_rating",       label: "الالتزام بالوقت",      icon: Clock,        color: "#3b82f6", desc: "مدى الالتزام بالمواعيد النهائية" },
  { key: "communication_rating",  label: "التواصل",              icon: MessageSquare, color: "#8b5cf6", desc: "وضوح التواصل والاستجابة السريعة" },
  { key: "professionalism_rating",label: "الاحترافية",           icon: Shield,       color: "#f59e0b", desc: "الأخلاق المهنية والسلوك العام" },
];

const StarRating = ({ value, onChange, color }) => (
  <div className="flex gap-1">
    {[1, 2, 3, 4, 5].map((s) => (
      <button key={s} type="button" onClick={() => onChange(s)} className="focus:outline-none transition-transform hover:scale-110">
        <Star className={`w-7 h-7 transition-colors ${s <= value ? "fill-current" : "fill-none"}`}
          style={{ color: s <= value ? color : "#d1d5db" }} />
      </button>
    ))}
  </div>
);

const LABELS = ["", "ضعيف", "مقبول", "جيد", "جيد جداً", "ممتاز"];

export default function DetailedReviewForm({ engineerId, projectId, engineerName, onSuccess, onCancel }) {
  const [ratings, setRatings] = useState({ quality_rating: 0, delivery_rating: 0, communication_rating: 0, professionalism_rating: 0 });
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const avg = Object.values(ratings).reduce((s, v) => s + v, 0) / 4;

  const handleSubmit = async () => {
    if (Object.values(ratings).some(v => v === 0)) return;
    setSubmitting(true);
    const user = await base44.auth.me();
    await base44.entities.Review.create({
      engineer_id: engineerId,
      client_id: user.id,
      project_id: projectId,
      rating: Math.round(avg * 10) / 10,
      quality_rating: ratings.quality_rating,
      delivery_rating: ratings.delivery_rating,
      communication_rating: ratings.communication_rating,
      professionalism_rating: ratings.professionalism_rating,
      comment,
    });
    setSubmitting(false);
    setDone(true);
    setTimeout(() => onSuccess?.(), 1500);
  };

  if (done) return (
    <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
      className="text-center py-12">
      <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-3" />
      <p className="text-xl font-bold text-slate-800">شكراً على تقييمك!</p>
      <p className="text-slate-500 mt-1">تم حفظ تقييمك بنجاح</p>
    </motion.div>
  );

  return (
    <div className="space-y-6" dir="rtl">
      <div className="text-center">
        <h2 className="text-xl font-bold text-[#1a1a2e]">تقييم {engineerName}</h2>
        <p className="text-slate-500 text-sm mt-1">قيّم أداء المهندس في هذا المشروع</p>
      </div>

      {/* Overall Preview */}
      <div className="bg-gradient-to-r from-[#1a1a2e] to-[#2d2d4e] rounded-xl p-4 text-center">
        <p className="text-white/70 text-sm mb-1">التقييم الإجمالي</p>
        <p className="text-5xl font-bold text-[#C9A66B]">{avg > 0 ? avg.toFixed(1) : "—"}</p>
        <div className="flex justify-center gap-1 mt-2">
          {[1,2,3,4,5].map(s => (
            <Star key={s} className={`w-5 h-5 ${s <= Math.round(avg) ? "text-[#C9A66B] fill-[#C9A66B]" : "text-white/30"}`} />
          ))}
        </div>
      </div>

      {/* Criteria */}
      {CRITERIA.map((c) => (
        <motion.div key={c.key} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
          <Card className="border-slate-200">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: c.color + "20" }}>
                    <c.icon className="w-4 h-4" style={{ color: c.color }} />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800">{c.label}</p>
                    <p className="text-xs text-slate-400">{c.desc}</p>
                  </div>
                </div>
                <span className="text-sm font-medium" style={{ color: c.color }}>
                  {ratings[c.key] > 0 ? LABELS[ratings[c.key]] : "اختر تقييم"}
                </span>
              </div>
              <StarRating value={ratings[c.key]} onChange={(v) => setRatings(r => ({ ...r, [c.key]: v }))} color={c.color} />
            </CardContent>
          </Card>
        </motion.div>
      ))}

      {/* Comment */}
      <div>
        <label className="text-sm font-medium text-slate-700 mb-2 block">تعليق إضافي (اختياري)</label>
        <Textarea placeholder="شارك تجربتك مع هذا المهندس..." value={comment} onChange={e => setComment(e.target.value)} className="min-h-24" />
      </div>

      <div className="flex gap-3">
        {onCancel && <Button variant="outline" onClick={onCancel} className="flex-1">إلغاء</Button>}
        <Button onClick={handleSubmit} disabled={submitting || Object.values(ratings).some(v => v === 0)}
          className="flex-1 bg-gradient-to-r from-[#1a1a2e] to-[#C9A66B] text-white">
          {submitting ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : null}
          إرسال التقييم
        </Button>
      </div>
      {Object.values(ratings).some(v => v === 0) && (
        <p className="text-xs text-center text-amber-500">يرجى تقييم جميع المعايير</p>
      )}
    </div>
  );
}