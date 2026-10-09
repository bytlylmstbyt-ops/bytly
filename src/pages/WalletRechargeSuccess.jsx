import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import { CheckCircle, Wallet, ArrowLeft, Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabaseClient";

export default function WalletRechargeSuccess() {
  const [searchParams] = useSearchParams();
  const [state, setState] = useState({ loading: true, paid: false, message: "جارٍ التحقق من عملية الدفع من Moyasar..." });

  useEffect(() => {
    let cancelled = false;
    const verify = async () => {
      const paymentId = searchParams.get("id") || searchParams.get("payment_id");
      const paymentOrderId = searchParams.get("payment_order_id");
      if (!paymentId || !paymentOrderId) {
        setState({ loading: false, paid: false, message: "لم تصل بيانات الدفع كاملة. لم يتم تأكيد الشحن أو إضافة رصيد." });
        return;
      }

      try {
        const { data: sessionData } = await supabase.auth.getSession();
        if (!sessionData?.session) {
          setState({ loading: false, paid: false, message: "انتهت جلسة الدخول. سجّل الدخول ثم افتح رابط نتيجة الدفع مجدداً للتحقق من العملية." });
          return;
        }
        const { data, error } = await supabase.functions.invoke("verify-moyasar-payment", {
          body: { payment_id: paymentId, payment_order_id: paymentOrderId }
        });
        if (error) throw error;
        if (cancelled) return;
        if (data?.paid === true) {
          setState({ loading: false, paid: true, message: "تحققت Moyasar من الدفع وتم تأكيد شحن المحفظة." });
        } else {
          setState({ loading: false, paid: false, message: data?.status === "failed"
            ? "عملية الدفع لم تنجح. لم تتم إضافة رصيد إلى المحفظة."
            : "لم تؤكد Moyasar اكتمال الدفع حتى الآن. لم تتم إضافة الرصيد." });
        }
      } catch (error) {
        if (cancelled) return;
        console.error("Moyasar payment verification error:", error);
        setState({ loading: false, paid: false, message: "تعذر التحقق من الدفع حالياً. لم نعرض العملية على أنها ناجحة ولم نؤكد إضافة الرصيد." });
      }
    };
    verify();
    return () => { cancelled = true; };
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-amber-50/30 py-12 flex items-center justify-center">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-lg px-4">
        <div className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center mb-6 shadow-xl ${state.paid ? "bg-green-600" : state.loading ? "bg-amber-500" : "bg-slate-600"}`}>
          {state.loading ? <Loader2 className="w-12 h-12 text-white animate-spin" /> : state.paid ? <CheckCircle className="w-12 h-12 text-white" /> : <AlertTriangle className="w-12 h-12 text-white" />}
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-[#1a1a2e] mb-4">
          {state.loading ? "جارٍ التحقق من الدفع" : state.paid ? "تم التحقق من الشحن" : "لم يتم تأكيد الشحن"}
        </h1>
        <p role="status" className="text-lg text-slate-600 mb-8">{state.message}</p>
        <div className="space-y-3">
          <Link to={createPageUrl("Wallet")}>
            <Button className="w-full bg-gradient-to-r from-amber-600 to-yellow-600 text-white text-lg py-6">
              <Wallet className="w-5 h-5 ml-2" /> عرض المحفظة
            </Button>
          </Link>
          <Link to={createPageUrl("Dashboard")}>
            <Button variant="outline" className="w-full">
              <ArrowLeft className="w-5 h-5 ml-2" /> العودة للوحة التحكم
            </Button>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}