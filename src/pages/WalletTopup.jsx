import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { motion } from "framer-motion";
import { 
  Wallet, CreditCard, Loader2, CheckCircle, 
  DollarSign, Shield, Zap, Plus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function WalletTopup() {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [amount, setAmount] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentOrder, setPaymentOrder] = useState(null);
  const [paymentFormError, setPaymentFormError] = useState("");

  useEffect(() => {
    loadUserData();
  }, []);

  useEffect(() => {
    if (!paymentOrder?.payment_order_id) return;
    const publishableKey = import.meta.env.VITE_MOYASAR_PUBLISHABLE_KEY;
    if (!publishableKey) {
      setPaymentFormError("مفتاح الدفع التجريبي غير مضبوط في إعدادات الموقع. لم يتم خصم أي مبلغ.");
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
    setIsLoading(true);
    try {
      const currentUser = await supabase.auth.getUser().then(({ data }) => { const u = data?.user; return u ? { id:u.id,user_id:u.id,email:u.email,full_name:u.user_metadata?.full_name||u.user_metadata?.name||'',role:u.user_metadata?.role||'user' } : null; });
      setUser(currentUser);
      if (!currentUser?.email) return;

      const role = String(currentUser.role || currentUser.profile?.role || '').toLowerCase();
      let profile = null;

      if (role === 'client' || role === 'investor') {
        const data = await Promise.race([
          supabase.from('clients').select('*').eq('email', currentUser.email).then(({data}) => data || []),
          new Promise(resolve => setTimeout(() => resolve([]), 7000))
        ]).catch(() => []);
        if (data?.[0]) profile = { ...data[0], type: 'client' };
      } else if (role === 'engineer' || role === 'surveyor') {
        const data = await Promise.race([
          supabase.from('engineers').select('*').eq('email', currentUser.email).then(({data}) => data || []),
          new Promise(resolve => setTimeout(() => resolve([]), 7000))
        ]).catch(() => []);
        if (data?.[0]) profile = { ...data[0], type: 'engineer' };
      }

      if (!profile) {
        const clients = await Promise.race([
          supabase.from('clients').select('*').eq('email', currentUser.email).then(({data}) => data || []),
          new Promise(resolve => setTimeout(() => resolve([]), 7000))
        ]).catch(() => []);
        if (clients?.[0]) profile = { ...clients[0], type: 'client' };
      }
      if (!profile) {
        const engineers = await Promise.race([
          supabase.from('engineers').select('*').eq('email', currentUser.email).then(({data}) => data || []),
          new Promise(resolve => setTimeout(() => resolve([]), 7000))
        ]).catch(() => []);
        if (engineers?.[0]) profile = { ...engineers[0], type: 'engineer' };
      }

      setUserProfile(profile);
    } catch (error) {
      console.error("Error loading wallet topup profile:", error);
      setUserProfile(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTopup = async () => {
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

  const quickAmounts = [100, 500, 1000, 5000];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-[#C9A66B]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-amber-50/30 py-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center mb-4">
              <Wallet className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-[#1a1a2e] mb-2">شحن المحفظة</h1>
            <p className="text-slate-600">أضف رصيد لمحفظتك للدفع السريع</p>
          </div>

          {/* Current Balance */}
          <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 mb-6">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-slate-600 mb-2">رصيدك الحالي</p>
                <p className="text-4xl font-bold text-blue-600">
                  {(userProfile?.wallet_balance || 0).toLocaleString('ar-SA')} ر.س
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Topup Form */}
          <Card className="border-0 shadow-xl">
            <CardHeader>
              <CardTitle>المبلغ المراد شحنه</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Quick Amounts */}
              <div>
                <Label className="mb-3 block">اختر مبلغاً سريعاً</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {quickAmounts.map(amt => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setAmount(amt.toString())}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        amount === amt.toString()
                          ? "border-blue-600 bg-blue-50"
                          : "border-slate-200 hover:border-blue-300"
                      }`}
                    >
                      <p className="text-lg font-bold text-[#1a1a2e]">
                        {amt.toLocaleString('ar-SA')}
                      </p>
                      <p className="text-xs text-slate-500">ريال</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Amount */}
              <div className="space-y-2">
                <Label htmlFor="custom_amount">أو أدخل مبلغاً مخصصاً</Label>
                <div className="relative">
                  <DollarSign className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <Input
                    id="custom_amount"
                    type="number"
                    min="50"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="أدخل المبلغ (الحد الأدنى 50 ريال)"
                    className="pr-10"
                  />
                </div>
              </div>

              {/* Payment Methods Info */}
              <div className="p-4 bg-slate-50 rounded-xl space-y-3">
                <p className="text-sm font-semibold text-slate-700">طرق الدفع المتاحة:</p>
                <div className="flex flex-wrap gap-2">
                  <Badge className="bg-white text-slate-700 border">
                    <CreditCard className="w-3 h-3 ml-1" />
                    بطاقات مدى وفيزا
                  </Badge>
                  <Badge className="bg-white text-slate-700 border">
                    Apple Pay
                  </Badge>
                  <Badge className="bg-white text-slate-700 border">
                    Google Pay
                  </Badge>
                  <Badge className="bg-white text-slate-700 border">
                    Moyasar — اختبار فقط
                  </Badge>
                </div>
              </div>

              {/* Benefits */}
              <div className="space-y-2 text-sm text-slate-600">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-blue-600" />
                  دفع فوري للمشاريع والتصاميم
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-green-600" />
                  حماية أموالك بنظام الضمان
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-purple-600" />
                  معاملات سريعة بدون إدخال بيانات الدفع
                </div>
              </div>

              {/* Submit Button */}
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
                onClick={handleTopup}
                disabled={!amount || parseFloat(amount) < 50 || isProcessing || Boolean(paymentOrder?.payment_order_id)}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-lg py-6"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin ml-2" />
                    جاري التحويل...
                  </>
                ) : (
                  <>
                    <Plus className="w-6 h-6 ml-2" />
                    شحن المحفظة
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