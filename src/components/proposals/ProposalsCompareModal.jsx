import React from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, Clock, DollarSign, CheckCircle, Award, Loader2 } from "lucide-react";

const STATUS_LABELS = { pending: "معلق", accepted: "مقبول", rejected: "مرفوض" };

export default function ProposalsCompareModal({ open, onOpenChange, proposals, engineers, onAccept, acceptingId }) {
  if (!proposals || proposals.length < 2) return null;

  const minPrice = Math.min(...proposals.map((p) => p.price || 0));
  const minDays = Math.min(...proposals.map((p) => p.delivery_days || Infinity));
  const ratings = proposals.map((p) => engineers[p.engineer_id]?.rating || 0);
  const maxRating = Math.max(...ratings);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-right flex items-center gap-2">
            <Award className="w-5 h-5 text-[#C9A66B]" />
            مقارنة العروض جنباً إلى جنب
          </DialogTitle>
          <DialogDescription className="text-right">
            قارن بين {proposals.length} عروض حسب السعر ومدة التنفيذ والتقييم لاختيار الأنسب للمشروع.
          </DialogDescription>
        </DialogHeader>

        <div className="overflow-x-auto pb-2">
          <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${proposals.length}, minmax(220px, 1fr))` }}>
            {proposals.map((p) => {
              const eng = engineers[p.engineer_id];
              const bestPrice = (p.price || 0) === minPrice;
              const bestDays = (p.delivery_days || 0) === minDays;
              const bestRating = (eng?.rating || 0) === maxRating && maxRating > 0;
              const isBest = bestPrice || bestDays || bestRating;
              return (
                <div key={p.id} className={`rounded-xl border p-4 space-y-3 ${isBest ? "border-[#C9A66B] bg-[#FEF9EE]" : "border-slate-200"}`}>
                  <div className="flex items-center gap-2">
                    <Avatar className="w-10 h-10 shrink-0">
                      <AvatarImage src={eng?.profile_image} />
                      <AvatarFallback className="bg-gradient-to-br from-[#6B5D4F] to-[#C9A66B] text-white">
                        {eng?.full_name?.charAt(0) || "م"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="font-bold text-[#1a1a2e] truncate text-sm">{eng?.full_name || "مهندس"}</p>
                      <div className="flex items-center gap-1">
                        <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                        <span className="text-xs text-slate-600">{eng?.rating?.toFixed(1) || "—"}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500 flex items-center gap-1"><DollarSign className="w-3.5 h-3.5" /> السعر</span>
                    <span className="font-bold text-[#1a1a2e] text-sm flex items-center gap-1">
                      {(p.price || 0).toLocaleString()} ر.س
                      {bestPrice && <Badge className="bg-green-100 text-green-700 text-[10px]">أقل سعر</Badge>}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500 flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> مدة التنفيذ</span>
                    <span className="font-bold text-[#1a1a2e] text-sm flex items-center gap-1">
                      {p.delivery_days || "—"} يوم
                      {bestDays && <Badge className="bg-blue-100 text-blue-700 text-[10px]">أسرع تسليم</Badge>}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500 flex items-center gap-1"><Star className="w-3.5 h-3.5" /> التقييم</span>
                    <span className="font-bold text-[#1a1a2e] text-sm flex items-center gap-1">
                      {eng?.rating?.toFixed(1) || "—"}
                      {bestRating && <Badge className="bg-amber-100 text-amber-700 text-[10px]">أعلى تقييم</Badge>}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">الحالة</span>
                    <Badge variant="outline">{STATUS_LABELS[p.status] || p.status}</Badge>
                  </div>

                  {p.cover_letter && (
                    <div>
                      <p className="text-xs text-slate-500 mb-1">رسالة العرض</p>
                      <p className="text-xs text-slate-600 bg-slate-50 rounded-lg p-2 leading-relaxed line-clamp-4">{p.cover_letter}</p>
                    </div>
                  )}

                  {p.status !== "accepted" && onAccept && (
                    <Button size="sm" className="w-full bg-gradient-to-r from-[#6B5D4F] to-[#C9A66B] text-white" disabled={acceptingId === p.id} onClick={() => { onAccept(p.id); onOpenChange?.(false); }}>
                      {acceptingId === p.id ? <Loader2 className="w-4 h-4 animate-spin ml-1" /> : <CheckCircle className="w-4 h-4 ml-1" />}
                      اختيار هذا العرض
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}