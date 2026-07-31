import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  FileText, ClipboardCheck, ShieldCheck, Lightbulb,
  MessageSquare, CheckCircle2, AlertTriangle, XCircle
} from "lucide-react";

const STATUS_CONFIG = {
  compliant: { label: "مطابق", icon: CheckCircle2, color: "bg-green-100 text-green-700", dot: "bg-green-500" },
  compliant_with_notes: { label: "مطابق مع ملاحظات", icon: AlertTriangle, color: "bg-amber-100 text-amber-700", dot: "bg-amber-500" },
  non_compliant: { label: "غير مطابق", icon: XCircle, color: "bg-red-100 text-red-700", dot: "bg-red-500" }
};

function NoteBlock({ icon: Icon, label, value, accent }) {
  if (!value?.trim()) return null;
  return (
    <div className="flex gap-3 p-4 rounded-xl bg-slate-50/70 border border-slate-100">
      <div className={`shrink-0 w-9 h-9 rounded-lg flex items-center justify-center ${accent}`}>
        <Icon className="w-4.5 h-4.5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-slate-500 mb-1.5">{label}</p>
        <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap break-words">{value}</p>
      </div>
    </div>
  );
}

export default function ConsultantNotesPanel({ review }) {
  if (!review) return null;
  const status = STATUS_CONFIG[review.compliance_status] || STATUS_CONFIG.compliant;
  const StatusIcon = status.icon;

  return (
    <Card className="border-t-4 border-t-[#C9A66B]">
      <CardHeader>
        <CardTitle className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5 text-[#C9A66B]" />
            ملاحظات الاستشاري الفني
          </span>
          <Badge className={status.color}>
            <StatusIcon className="w-3.5 h-3.5 ml-1" />
            {status.label}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <NoteBlock
          icon={ShieldCheck}
          label="مطابقة الكود السعودي"
          value={review.saudi_code_compliance}
          accent="bg-green-50 text-green-600"
        />
        <NoteBlock
          icon={Lightbulb}
          label="توصيات التنفيذ"
          value={review.implementation_recommendations}
          accent="bg-amber-50 text-amber-600"
        />
        <NoteBlock
          icon={FileText}
          label="تقييم الجودة"
          value={review.quality_assessment}
          accent="bg-blue-50 text-blue-600"
        />
        <NoteBlock
          icon={MessageSquare}
          label="ملاحظات فنية إضافية"
          value={review.technical_notes}
          accent="bg-slate-100 text-slate-600"
        />
      </CardContent>
    </Card>
  );
}