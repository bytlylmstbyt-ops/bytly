import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, FileText, ExternalLink, Scale } from "lucide-react";

const CONTRACT_STATUS = {
  draft: "مسودة", pending_signature: "بانتظار التوقيع", signed: "موقّع",
  active: "ساري", completed: "مكتمل", terminated: "منهي", archived: "مؤرشف",
};

const CONTRACT_COLORS = {
  draft: "bg-slate-100 text-slate-600", pending_signature: "bg-amber-100 text-amber-700",
  signed: "bg-blue-100 text-blue-700", active: "bg-green-100 text-green-700",
  completed: "bg-[#C9A66B]/15 text-[#4A3F35]", terminated: "bg-red-100 text-red-700",
  archived: "bg-slate-100 text-slate-400",
};

export default function ContractViewDialog({ project, open, onOpenChange }) {
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!open || !project?.id) return;
    setLoading(true);
    base44.entities.Contract.filter({ project_id: project.id }, "-created_date", 20)
      .then(setContracts)
      .catch(() => setContracts([]))
      .finally(() => setLoading(false));
  }, [open, project?.id]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-[#C9A66B]" />
            عقود المشروع
          </DialogTitle>
        </DialogHeader>
        <div className="py-2 max-h-[60vh] overflow-y-auto">
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-[#C9A66B]" /></div>
          ) : contracts.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-400">لا توجد عقود لهذا المشروع بعد</p>
            </div>
          ) : (
            <div className="space-y-3">
              {contracts.map((c) => (
                <div key={c.id} className="p-4 rounded-lg border border-slate-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-slate-400 font-mono">#{c.contract_number || c.id.slice(-6)}</span>
                    <Badge className={`${CONTRACT_COLORS[c.status] || ""} border`} variant="outline">
                      {CONTRACT_STATUS[c.status] || c.status}
                    </Badge>
                  </div>
                  <p className="text-sm font-medium text-[#4A3F35] mb-1">{c.contract_type === "project_start" ? "عقد بدء مشروع" : "عقد تقديم خدمات"}</p>
                  <div className="text-xs text-slate-500 space-y-1">
                    <p>المبلغ الإجمالي: {(c.total_amount || 0).toLocaleString()} ر.س</p>
                    <p>شروط الدفع: {c.payment_terms || "—"}</p>
                    {c.start_date && <p>تاريخ البدء: {new Date(c.start_date).toLocaleDateString("ar-SA")}</p>}
                    <p>توقيع العميل: {c.client_signature ? "✓" : "—"} | توقيع المهندس: {c.engineer_signature ? "✓" : "—"}</p>
                  </div>
                  {c.contract_pdf_url && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2 text-xs"
                      onClick={() => window.open(c.contract_pdf_url, "_blank")}
                    >
                      <ExternalLink className="w-3 h-3 ml-1" /> عرض ملف العقد
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}