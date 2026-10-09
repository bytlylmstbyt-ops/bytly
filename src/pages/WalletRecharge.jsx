import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { motion } from "framer-motion";
import { Wallet, DollarSign, CreditCard, Loader2, CheckCircle, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function WalletRecharge() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [amount, setAmount] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentOrder, setPaymentOrder] = useState(null);
  const [paymentFormError, setPaymentFormError] = useState("");
  const [quickAmounts] = useState([100, 500, 1000, 2000, 5000]);

  useEffect(() => {
    loadUserData();
  }, []);

  useEffect(() => {
    if (!paymentOrder?.payment_order_id) return;
    const publishableKey = import.meta.env.VITE_MOYASAR_PUBLISHABLE_KEY;
    if (!publishableKey || !publishableKey.startsWith("pk_test_")) {
      setPaymentFormError("تم إيقاف الدفع: يجب ضبط مفتاح Moyasar التجريبي الذي يبدأ بـ pk_test_. لم يتم خصم أي مبلغ.");
      return;
    }

    let cancelled = false;
    const initializeForm = () => {
      if (cancelled || !window.Moyasar) return;
      const element = document.querySelector("#bytly-moyasar-form");
      if (!element) return;
      element.innerHTML = "";
      const callbackUrl = `${window.location.origin}/WalletRechargeSuccess?payment_order_id=${encodeURIComponent(paymentOrder.payment_order_id)}`;
      window.Moyasar.init({
        element: "#bytly-moyasar-form",
        amount: Math.round(Number(paymentOrder.amount) * 100),
        currency: "SAR",
        description: `Bytly wallet recharge ${paymentOrder.payment_order_id}`,
        publishable_api_key: publishableKey,
        callback_url: callbackUrl,
        supported_networks: ["mada", "visa", "mastercard", "amex"],
        methods: ["creditcard"],
      });
    };

    const cssId = "bytly-moyasar-css";
    if (!document.getElementById(cssId)) {
      const link = document.createElement("link");
      link.id = cssId;
      link.rel = "stylesheet";
      link.href = "https://cdn.jsdelivr.net/npm/moyasar-payment-form@2.3.0/dist/moyasar.css";
      document.head.appendChild(link);
    }
    if (window.Moyasar) {
      initializeForm();
    } else {
      let script = document.getElementById("bytly-moyasar-js");
      if (!script) {
        script = document.createElement("script");
        script.id = "bytly-moyasar-js";
        script.src = "https://cdn.jsdelivr.net/npm/moyasar-payment-form@2.3.0/dist/moyasar.umd.min.js";
        script.async = true;
        document.head.appendChild(script);
      }
      script.addEventListener("load", initializeForm, { once: true });
      script.addEventListener("error", () => {
        if (!cancelled) setPaymentFormError("تعذر تحميل نموذج الدفع التجريبي. حاول مرة أخرى لاحقاً.");
      }, { once: true });
    }
    return () => { cancelled = true; };
  }, [paymentOrder]);

  const loadUserData = async () => {
    try {
      const currentUser = await Promise.race([
        supabase.auth.getUser().then(({ data }) => { const u = data?.user; return u ? { id:u.id,user_id:u.id,email:u.email,full_name:u.user_metadata?.full_name||u.user_metadata?.name||'',role:u.user_metadata?.role||'user' } : null; }),
        new Promise((_, reject) => setTimeout(() => reject(new Error("انتهت مهلة تحميل المستخدم")), 10000))
      ]);
      setUser(currentUser);
      if (!currentUser?.email) return;

      const clientData = await Promise.race([
        supabase.from('clients').select('*').eq('email', currentUser.email).then(({data}) => data || []),
        new Promise(resolve => setTimeout(() => resolve([]), 7000))
      ]).catch(() => []);
      if (clientData?.[0]) {
        setProfile({ ...clientData[0], type: "client" });
        return;
      }

      const engineerData = await Promise.race([
        supabase.from('engineers').select('*').eq('email', currentUser.email).then(({data}) => data || []),
        new Promise(resolve => setTimeout(() => resolve([]), 7000))
      ]).catch(() => []);
      if (engineerData?.[0]) {
        setProfile({ ...engineerData[0], type: "engineer" });
        return;
      }

      // A homeowner can charge an authenticated wallet without completing
      // an engineer/provider profile.
      setProfile({
        id: currentUser.id,
        user_id: currentUser.id,
        full_name: currentUser.full_name || currentUser.user_metadata?.full_name || '',
        email: currentUser.email,
        wallet_balance: 0,
        type: "client"
      });
    } catch (error) {
      console.error("Error loading wallet recharge profile:", error);
      setProfile(null);
    }
  };

  const handleRecharge = async () => {
    const requestedAmount = Number(amount);
    if (!Number.isFinite(requestedAmount) || requestedAmount < 50 || requestedAmount > 100000) {
      alert("أدخل مبلغاً بين 50 و100000 ريال");
      return;
    }
    if (!user?.id) {
      alert("يجب تسجيل الدخول أولاً");
      return;
    }

    setIsProcessing(true);
    setPaymentFormError("");
    setPaymentOrder(null);
    try {
      const { data, error } = await supabase.functions.invoke("create-moyasar-wallet-recharge", {
        body: { amount: requestedAmount }
      });
      if (error) throw error;
      if (!data?.payment_order_id || !data?.requires_source) {
        throw new Error(data?.error || "لم نتمكن من تجهيز طلب الشحن التجريبي");
      }
      setPaymentOrder(data);
    } catch (error) {
      console.error("Wallet recharge setup error:", error);
      alert(error?.message || "حدث خطأ في تجهيز الدفع التجريبي");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-amber-50/30 py-12">
      <div className="max-w-2xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-green-600 to-emerald-600 flex items-center justify-center mb-4">
              <Wallet className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-[#1a1a2e] mb-2">شحن المحفظة</h1>
            <p className="text-slate-600">أضف رصيد لمحفظتك لإجراء المعاملات بسرعة</p>
          </div>

          {/* Current Balance */}
          {profile && (
            <Card className="border-2 border-green-200 bg-green-50 mb-6">
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-green-700 mb-2">رصيدك الحالي</p>
                  <p className="text-4xl font-bold text-green-600">
                    {(profile.wallet_balance || 0).toLocaleString('ar-SA')} ر.س
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="border-0 shadow-xl">
            <CardHeader>
              <CardTitle>اختر المبلغ</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Quick Amounts */}
              <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
                {quickAmounts.map(amt => (
                  <button
                    key={amt}
                    onClick={() => setAmount(amt.toString())}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      amount === amt.toString()
                        ? "border-green-600 bg-green-50"
                        : "border-slate-200 hover:border-green-400"
                    }`}
                  >
                    <p className="font-bold text-lg">{amt}</p>
                    <p className="text-xs text-slate-500">ريال</p>
                  </button>
                ))}
              </div>

              {/* Custom Amount */}
              <div className="space-y-2">
                <div className="relative">
                  <DollarSign className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <Input
                    type="number"
                    placeholder="أو أدخل مبلغاً مخصصاً"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="pr-10 h-14 text-lg"
                    min="50"
                  />
                </div>
                <p className="text-xs text-slate-500">الحد الأدنى: 50 ريال</p>
              </div>

              {/* Payment Methods Info */}
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800 mb-3 font-medium">طرق الدفع المتاحة:</p>
                <div className="flex flex-wrap gap-2">
                  <Badge className="bg-white text-blue-700">💳 فيزا</Badge>
                  <Badge className="bg-white text-blue-700">💳 ماستركارد</Badge>
                  <Badge className="bg-white text-blue-700">💳 مدى</Badge>
                  <Badge className="bg-white text-blue-700"> Apple Pay</Badge>
                  <Badge className="bg-white text-blue-700">🅖 Google Pay</Badge>
                </div>
              </div>

              {/* Benefits */}
              <div className="space-y-2 text-sm text-slate-600">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-500" />
                  دفع فوري بدون انتظار
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  رصيد آمن ومحمي
                </div>
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-blue-500" />
                  الدفع عبر Moyasar — وضع الاختبار فقط
                </div>
              </div>

              {paymentFormError && (
                <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {paymentFormError}
                </div>
              )}
              {paymentOrder?.payment_order_id && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 space-y-3">
                  <p className="font-semibold text-amber-900">الدفع التجريبي — لم يتم تأكيد الشحن بعد</p>
                  <p className="text-sm text-amber-800">المبلغ: {Number(paymentOrder.amount).toLocaleString("ar-SA")} ريال. استخدم بيانات الاختبار من Moyasar فقط.</p>
                  <div id="bytly-moyasar-form" className="mysr-form" />
                </div>
              )}
              <Button
                onClick={handleRecharge}
                disabled={!amount || parseFloat(amount) < 50 || isProcessing || Boolean(paymentOrder?.payment_order_id)}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-6 text-lg"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin ml-2" />
                    جاري التحويل...
                  </>
                ) : (
                  <>
                    <Wallet className="w-5 h-5 ml-2" />
                    شحن {amount ? parseFloat(amount).toLocaleString('ar-SA') : ""} ريال
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}