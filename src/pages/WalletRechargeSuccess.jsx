import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import { CheckCircle, Wallet, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import confetti from 'canvas-confetti';

export default function WalletRechargeSuccess() {
  useEffect(() => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50/30 py-12 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center max-w-lg px-4"
      >
        <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center mb-6 shadow-2xl">
          <CheckCircle className="w-12 h-12 text-white" />
        </div>

        <h1 className="text-3xl md:text-4xl font-bold text-[#1a1a2e] mb-4">
          تم الشحن بنجاح! 🎉
        </h1>
        <p className="text-lg text-slate-600 mb-8">
          تم إضافة الرصيد إلى محفظتك
        </p>

        <div className="space-y-3">
          <Link to={createPageUrl("Wallet")}>
            <Button className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white text-lg py-6">
              <Wallet className="w-5 h-5 ml-2" />
              عرض المحفظة
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
  );
}