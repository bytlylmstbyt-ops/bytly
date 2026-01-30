import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import confetti from "canvas-confetti";

export default function PaymentSuccess() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const sessionId = urlParams.get("session_id");
  const projectId = urlParams.get("project");
  const [processing, setProcessing] = useState(true);

  useEffect(() => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });

    setTimeout(() => {
      setProcessing(false);
    }, 2000);
  }, []);

  if (processing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-50">
        <div className="text-center">
          <Loader2 className="w-16 h-16 animate-spin text-green-600 mx-auto mb-4" />
          <p className="text-slate-600">جاري تأكيد الدفع...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-lg w-full"
      >
        <Card className="border-2 border-green-200 shadow-2xl">
          <CardContent className="pt-12 pb-8 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", delay: 0.2 }}
            >
              <CheckCircle className="w-24 h-24 text-green-600 mx-auto mb-6" />
            </motion.div>

            <h1 className="text-3xl font-bold text-green-900 mb-3">
              تم الدفع بنجاح!
            </h1>
            <p className="text-lg text-slate-600 mb-2">
              تم حجز المبلغ في حساب الضمان
            </p>
            <p className="text-sm text-slate-500 mb-8">
              سيتم تحرير المبلغ للمهندس بعد موافقتك على العمل النهائي
            </p>

            <div className="space-y-3">
              <Button
                onClick={() => navigate(createPageUrl("ProjectDetails") + `?id=${projectId}`)}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-6 text-lg"
              >
                عرض تفاصيل المشروع
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate(createPageUrl("Dashboard"))}
                className="w-full py-6"
              >
                العودة للوحة التحكم
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}