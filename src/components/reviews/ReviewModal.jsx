import { useState } from "react";
import { Star, Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger
} from "@/components/ui/dialog";

function StarPicker({ value, onChange, size = "w-8 h-8" }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          type="button"
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(star)}
          className="transition-transform hover:scale-110"
        >
          <Star className={`${size} ${star <= (hovered || value) ? "fill-amber-400 text-amber-400" : "text-slate-300"}`} />
        </button>
      ))}
    </div>
  );
}

export default function ReviewModal({ trigger, onSubmit, targetName }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    rating: 5,
    quality_rating: 5,
    communication_rating: 5,
    service_rating: 5,
    comment: ""
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit(form);
      setOpen(false);
      setForm({ rating: 5, quality_rating: 5, communication_rating: 5, service_rating: 5, comment: "" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-right">تقييم {targetName}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5 mt-2">
          <div className="text-center">
            <p className="text-sm text-slate-500 mb-2">التقييم العام</p>
            <div className="flex justify-center">
              <StarPicker value={form.rating} onChange={v => setForm(f => ({ ...f, rating: v }))} size="w-10 h-10" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="text-xs text-slate-500 mb-1">الجودة</p>
              <StarPicker value={form.quality_rating} onChange={v => setForm(f => ({ ...f, quality_rating: v }))} size="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">التواصل</p>
              <StarPicker value={form.communication_rating} onChange={v => setForm(f => ({ ...f, communication_rating: v }))} size="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">الخدمة</p>
              <StarPicker value={form.service_rating} onChange={v => setForm(f => ({ ...f, service_rating: v }))} size="w-5 h-5" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">تعليقك</label>
            <textarea
              value={form.comment}
              onChange={e => setForm(f => ({ ...f, comment: e.target.value }))}
              placeholder="شاركنا تجربتك..."
              rows={4}
              className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
            />
          </div>

          <Button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-[#1a1a2e] to-[#C9A66B] text-white gap-2">
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> جارٍ الإرسال...</> : <><Send className="w-4 h-4" /> إرسال التقييم</>}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}