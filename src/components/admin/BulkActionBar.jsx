import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { CheckCircle2, XCircle, Pause, Trash2, X, Loader2 } from "lucide-react";

const ACTIONS = [
  { key: "activate", label: "تفعيل", icon: CheckCircle2, cls: "bg-green-600 hover:bg-green-700 text-white" },
  { key: "suspend", label: "إيقاف", icon: XCircle, cls: "bg-red-600 hover:bg-red-700 text-white" },
  { key: "pause", label: "تعليق", icon: Pause, cls: "bg-amber-600 hover:bg-amber-700 text-white" },
  { key: "delete", label: "حذف", icon: Trash2, cls: "bg-red-700 hover:bg-red-800 text-white", danger: true },
];

export default function BulkActionBar({
  selectedCount, entityLabel = "عنصر", onAction, onClear, isAdmin, busy,
}) {
  const [pending, setPending] = useState(null);
  if (!isAdmin || selectedCount === 0) return null;

  const pendingLabel = ACTIONS.find((a) => a.key === pending)?.label || "";

  return (
    <>
      <div className="sticky top-2 z-30 mb-3 rounded-xl border border-[#C9A66B]/30 bg-[#4A3F35] text-white shadow-lg px-4 py-2.5 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="bg-[#C9A66B] text-[#4A3F35] rounded-full w-7 h-7 flex items-center justify-center font-bold text-sm">
            {selectedCount}
          </span>
          <span className="text-sm">تم تحديد {selectedCount} {entityLabel}</span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {ACTIONS.map((a) => {
            const Icon = a.icon;
            return (
              <Button key={a.key} size="sm" className={a.cls} disabled={busy} onClick={() => setPending(a.key)}>
                <Icon className="w-4 h-4 ml-1" /> {a.label}
              </Button>
            );
          })}
          <Button size="sm" variant="ghost" className="text-white hover:bg-white/10" onClick={onClear}>
            <X className="w-4 h-4 ml-1" /> إلغاء التحديد
          </Button>
        </div>
      </div>

      <AlertDialog open={!!pending} onOpenChange={(o) => !o && setPending(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الإجراء الجماعي</AlertDialogTitle>
            <AlertDialogDescription>
              سيتم تطبيق «{pendingLabel}» على {selectedCount} {entityLabel}. لا يمكن التراجع عن الحذف. هل أنت متأكد؟
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => { onAction(pending); setPending(null); }}
              disabled={busy}
              className={pending === "delete" ? "bg-red-600 hover:bg-red-700" : "bg-[#4A3F35] hover:bg-[#3a322a]"}
            >
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : "تأكيد التنفيذ"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}