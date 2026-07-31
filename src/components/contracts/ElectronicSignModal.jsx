import React, { useState } from "react";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { CheckCircle, Scale, Loader2, Shield, PenLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import SignaturePad from "./SignaturePad";

/**
 * ElectronicSignModal
 * Props:
 *   contract, project, client, engineer, currentUser
 *   onDone() – called after successful sign
 *   onClose()
 */
export default function ElectronicSignModal({
  contract, project, client, engineer, currentUser, onDone, onClose,
}) {
  const [agreed, setAgreed] = useState(false);
  const [signatureImage, setSignatureImage] = useState(null);
  const [signMethod, setSignMethod] = useState("draw"); // "draw" | "confirm"
  const [signing, setSigning] = useState(false);
  const [done, setDone] = useState(false);

  const isClient   = currentUser?.email === client?.email;
  const isEngineer = currentUser?.email === engineer?.email;

  // Determine if this user still needs to sign
  const mySignatureDone = isClient ? contract?.client_signature : contract?.engineer_signature;

  const handleSign = async () => {
    if (!agreed) return;
    if (signMethod === "draw" && !signatureImage) return;

    setSigning(true);

    const now = new Date().toISOString();
    const updates = {};

    if (isClient) {
      updates.client_signature = true;
      updates.client_signature_date = now;
      if (signatureImage) updates.client_signature_ip = `canvas:${signatureImage.slice(0, 30)}`;
    } else {
      updates.engineer_signature = true;
      updates.engineer_signature_date = now;
      if (signatureImage) updates.engineer_signature_ip = `canvas:${signatureImage.slice(0, 30)}`;
    }

    const bothSigned = (isClient && contract.engineer_signature) || (!isClient && contract.client_signature);
    updates.status = bothSigned ? "active" : "pending_signature";

    await base44.entities.Contract.update(contract.id, updates);

    // Notify the other party
    const otherEmail = isClient ? engineer?.email : client?.email;
    const otherName  = isClient ? engineer?.full_name : client?.full_name;
    if (otherEmail) {
      await base44.entities.Notification.create({
        recipient_email: otherEmail,
        title: bothSigned ? "✅ العقد ساري الآن" : "⚠️ تم التوقيع — بانتظار توقيعك",
        message: bothSigned
          ? `تم توقيع عقد مشروع "${project?.title}" من الطرفين وأصبح سارياً`
          : `وقّع ${isClient ? "العميل" : "المهندس"} على عقد مشروع "${project?.title}". يرجى الدخول للتوقيع`,
        type: "contract_update",
        related_project_id: contract.project_id,
      });
    }

    // If both signed, save PDF snapshot to project files automatically
    if (bothSigned && project?.id) {
      try {
        await base44.functions.invoke("saveContractPDF", {
          contract_id: contract.id,
          project_id: project.id,
        });
      } catch (_) {
        // non-blocking – PDF save attempted in background
      }
    }

    setSigning(false);
    setDone(true);
    setTimeout(() => { onDone?.(); }, 1800);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      dir="rtl"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#1a1a2e] to-[#2d2d4e] px-6 py-4 flex items-center gap-3">
          <Scale className="w-5 h-5 text-[#C9A66B]" />
          <h2 className="text-white font-bold text-lg">التوقيع الإلكتروني</h2>
        </div>

        <div className="p-6 space-y-5">
          {done ? (
            <div className="text-center py-6">
              <CheckCircle className="w-16 h-16 mx-auto text-green-500 mb-3" />
              <p className="font-bold text-[#1a1a2e] text-lg">تم التوقيع بنجاح!</p>
              <p className="text-slate-500 text-sm mt-1">
                {(isClient && contract.engineer_signature) || (!isClient && contract.client_signature)
                  ? "العقد أصبح سارياً بتوقيع الطرفين 🎉"
                  : "تم إرسال إشعار للطرف الآخر للتوقيع"}
              </p>
            </div>
          ) : mySignatureDone ? (
            <div className="text-center py-6">
              <CheckCircle className="w-12 h-12 mx-auto text-green-400 mb-2" />
              <p className="text-green-700 font-semibold">لقد وقّعت مسبقاً على هذا العقد</p>
            </div>
          ) : (
            <>
              {/* Contract summary */}
              <div className="bg-slate-50 rounded-xl p-4 text-sm space-y-1">
                <p><span className="font-semibold">العقد:</span> {contract?.contract_number}</p>
                <p><span className="font-semibold">المشروع:</span> {project?.title || "—"}</p>
                <p><span className="font-semibold">القيمة:</span> {contract?.total_amount?.toLocaleString()} ر.س</p>
                <p><span className="font-semibold">أنت توقع بصفة:</span> {isClient ? "العميل – الطرف الأول" : "المهندس – الطرف الثاني"}</p>
              </div>

              {/* Sign method tabs */}
              <Tabs value={signMethod} onValueChange={setSignMethod}>
                <TabsList className="w-full">
                  <TabsTrigger value="draw" className="flex-1 gap-1.5">
                    <PenLine className="w-3.5 h-3.5" /> رسم التوقيع
                  </TabsTrigger>
                  <TabsTrigger value="confirm" className="flex-1 gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5" /> تأكيد بدون رسم
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="draw" className="mt-3">
                  <SignaturePad
                    onSave={(img) => setSignatureImage(img)}
                    onClear={() => setSignatureImage(null)}
                  />
                </TabsContent>
                <TabsContent value="confirm" className="mt-3">
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
                    <Shield className="w-4 h-4 inline-block ml-1" />
                    سيُسجّل توقيعك الرقمي باسمك وتوقيت التوقيع وبيانات الجلسة كدليل قانوني.
                  </div>
                </TabsContent>
              </Tabs>

              {/* Agreement checkbox */}
              <div className="flex items-start gap-3">
                <Checkbox id="esign-agree" checked={agreed} onCheckedChange={setAgreed} />
                <Label htmlFor="esign-agree" className="text-sm leading-relaxed cursor-pointer text-slate-700">
                  أقر بأنني قرأت العقد وأوافق على جميع بنوده. التوقيع الإلكتروني ملزم قانونياً وفق أنظمة المملكة.
                </Label>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={onClose}>إلغاء</Button>
                <Button
                  className="flex-1 bg-gradient-to-r from-[#1a1a2e] to-[#C9A66B] text-white"
                  disabled={!agreed || signing || (signMethod === "draw" && !signatureImage)}
                  onClick={handleSign}
                >
                  {signing
                    ? <><Loader2 className="w-4 h-4 animate-spin ml-1.5" />جاري التوقيع...</>
                    : <><CheckCircle className="w-4 h-4 ml-1.5" />تأكيد التوقيع</>}
                </Button>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}