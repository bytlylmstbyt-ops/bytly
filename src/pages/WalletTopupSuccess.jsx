import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import { CheckCircle, Wallet, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import confetti from 'canvas-confetti';

export default function WalletTopupSuccess() {
  useEffect(() => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50/30 py-12 flex items-center justify-center">
      <div className="max-w-lg mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center mb-6 shadow-2xl">
            <CheckCircle className="w-12 h-12 text-white" />
          </div>

          <h1 className="text-3xl md:text-4xl font-bold text-[#1a1a2e] mb-4">
            تم شحن المحفظة بنجاح! 🎉
          </h1>
          <p className="text-lg text-slate-600 mb-8">
            رصيدك متاح الآن للاستخدام الفوري
          </p>

          <Card className="border-2 border-green-200 shadow-xl mb-6">
            <CardContent className="pt-6">
              <div className="flex items-center justify-center gap-3 mb-4">
                <Wallet className="w-8 h-8 text-green-600" />
                <p className="text-xl font-semibold text-slate-700">يمكنك الآن:</p>
              </div>
              <div className="space-y-2 text-sm text-slate-600 text-right">
                <p>✓ دفع مراحل المشاريع بضغطة واحدة</p>
                <p>✓ شراء التصاميم الجاهزة فوراً</p>
                <p>✓ معاملات سريعة بدون إدخال بيانات الدفع</p>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-3">
            <Link to={createPageUrl("Wallet")}>
              <Button className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-lg py-6">
                <Wallet className="w-6 h-6 ml-2" />
                عرض محفظتي
              </Button>
            </Link>

            <Link to={createPageUrl("Dashboard")}>
              <Button variant="outline" className="w-full">
                <ArrowLeft className="w-5 h-5 ml-2" />
                العودة للوحة التحكم
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}