import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import confetti from "canvas-confetti";

export default function PaymentSuccess() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const urlParams = new URLSearchParams(window.location.search);
  const projectId = urlParams.get("project_id");
  const sessionId = urlParams.get("session_id");

  useEffect(() => {
    // Trigger confetti
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });

    // Wait a bit to show success
    setTimeout(() => setLoading(false), 1500);
  }, []);

  const handleContinue = () => {
    if (projectId) {
      navigate(createPageUrl("ProjectMilestones") + `?id=${projectId}`);
    } else {
      navigate(createPageUrl("Dashboard"));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50/30 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="max-w-md shadow-2xl border-0">
          <CardContent className="pt-12 pb-8 text-center">
            {loading ? (
              <div className="space-y-4">
                <Loader2 className="w-16 h-16 animate-spin text-green-600 mx-auto" />
                <p className="text-slate-600">جاري معالجة الدفع...</p>
              </div>
            ) : (
              <div className="space-y-6">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                >
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-12 h-12 text-green-600" />
                  </div>
                </motion.div>

                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">
                    تم الدفع بنجاح! 🎉
                  </h1>
                  <p className="text-slate-600">
                    تم حجز المبلغ في الضمان وسيتم تحريره للمهندس بعد اعتماد العمل
                  </p>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-sm text-green-800">
                    <strong>ملاحظة:</strong> المبلغ محفوظ في نظام الضمان الخاص بنا وسيتم تحريره للمهندس فقط بعد اعتماد العمل من قبل الشركة الاستشارية (للمشاريع الكاملة) أو الموافقة المباشرة (للخدمات السريعة).
                  </p>
                </div>

                <Button
                  onClick={handleContinue}
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                  size="lg"
                >
                  متابعة إلى المشروع
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}