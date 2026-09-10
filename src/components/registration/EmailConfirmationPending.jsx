import React from "react";
import { motion } from "framer-motion";
import { MailCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

/**
 * Shown immediately after a passwordless registration submit succeeds
 * (i.e. the activation email was sent). Mirrors the visual language of
 * RegistrationSuccess.jsx so the whole registration journey feels like
 * one polished, celebratory flow instead of switching to a plain error
 * or toast at the one step that actually matters most.
 */
export default function EmailConfirmationPending({ email }) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center py-8 px-2">
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }} className="w-full">
        <Card className="max-w-md w-full mx-auto border-0 shadow-2xl">
          <CardContent className="p-8 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center"
            >
              <MailCheck className="w-12 h-12 text-white" />
            </motion.div>
            <h1 className="text-2xl font-bold text-[#1a1a2e] mb-3">تم إنشاء حسابك بنجاح! 🎉</h1>
            <p className="text-slate-600 mb-2">
              أرسلنا رسالة تفعيل إلى بريدك الإلكتروني{email ? <> على <span className="font-semibold text-[#1a1a2e]">{email}</span></> : ""}.
            </p>
            <p className="text-slate-600 mb-6">افتحي الرسالة واضغطي على رابط التفعيل لإكمال تسجيلك تلقائياً والدخول إلى بيتلي.</p>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <p className="text-amber-800 text-sm">💡 لم تصلك الرسالة؟ تحققي من مجلد الرسائل غير المرغوب فيها (Spam)، وقد تستغرق وصولها دقيقة أو دقيقتين.</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
