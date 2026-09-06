import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import { CheckCircle, Home, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function RegistrationSuccess() {
  useEffect(() => {
    // Reaching this page means the role-specific registration form has succeeded.
    localStorage.removeItem("bytly_registration_pending");
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-amber-50/30 flex items-center justify-center py-12 px-4">
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}>
        <Card className="max-w-md w-full border-0 shadow-2xl">
          <CardContent className="p-8 text-center">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: "spring", stiffness: 200 }} className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center">
              <CheckCircle className="w-12 h-12 text-white" />
            </motion.div>
            <h1 className="text-2xl font-bold text-[#1a1a2e] mb-3">تم التسجيل بنجاح!</h1>
            <p className="text-slate-600 mb-6">شكراً لانضمامك إلى منصة بيتلي. تم حفظ بيانات التسجيل ويمكنك الآن الدخول إلى المنصة بحسابك.</p>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
              <p className="text-amber-800 text-sm">💡 حسابات المهندسين والمكاتب ومقدمي الخدمات قد تبقى بحالة "قيد المراجعة" حتى تعتمدها الإدارة، لكن تسجيل الحساب نفسه مكتمل.</p>
            </div>
            <div className="space-y-3">
              <Link to={createPageUrl("Home")}>
                <Button className="w-full bg-gradient-to-r from-[#1a1a2e] to-[#C9A66B] text-white gap-2"><Home className="w-5 h-5" />الدخول إلى المنصة</Button>
              </Link>
              <Link to={createPageUrl("Engineers")}>
                <Button variant="outline" className="w-full gap-2">استكشف المهندسين<ArrowLeft className="w-4 h-4" /></Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
