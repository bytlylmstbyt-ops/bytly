import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Trash2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

/**
 * DeleteAccountDialog — confirmation flow for permanent account deletion.
 * On confirm: calls the deleteAccount backend API, clears the auth token,
 * and redirects to the signup screen.
 */
export default function DeleteAccountDialog({ open, onOpenChange }) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirm = async () => {
    setIsDeleting(true);
    try {
      const user = await base44.auth.me().catch(() => null);
      // API delete request (existing backend function resolves the authenticated user)
      await base44.functions.invoke("deleteAccount", {
        reason: "user_requested_from_menu",
        user_email: user?.email,
      });
      // Clear the token and redirect to the signup screen
      base44.auth.logout();
      window.location.href = "/RegisterChoice";
    } catch (e) {
      console.error("deleteAccount error:", e);
      toast.error("حدث خطأ أثناء حذف الحساب. يرجى المحاولة مرة أخرى.");
      setIsDeleting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!isDeleting) onOpenChange(v);
      }}
    >
      <DialogContent className="max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="w-5 h-5" />
            حذف الحساب نهائياً
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <p className="text-sm text-slate-600">
            سيتم حذف جميع بياناتك الشخصية، عقودك، وسجل محفظتك الإلكترونية بشكل{" "}
            <strong className="text-red-600">نهائي وغير قابل للاسترداد</strong>.
          </p>

          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            <p className="font-medium mb-1.5">⚠️ تحذير — سيتم حذف:</p>
            <ul className="space-y-1">
              <li>• ملفك الشخصي وجميع بياناتك الشخصية</li>
              <li>• جميع العقود والاتفاقيات المرتبطة بحسابك</li>
              <li>• رصيد محفظتك الإلكترونية وسجل المعاملات المالية</li>
            </ul>
          </div>

          <p className="text-xs text-slate-400 text-center">
            لا يمكن التراجع عن هذه العملية.
          </p>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            style={{ minHeight: 44 }}
            disabled={isDeleting}
            onClick={() => onOpenChange(false)}
          >
            إلغاء
          </Button>
          <Button
            disabled={isDeleting}
            style={{ minHeight: 44 }}
            className="bg-red-600 hover:bg-red-700 text-white"
            onClick={handleConfirm}
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                جاري الحذف...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4 ml-2" />
                حذف الحساب نهائياً
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}