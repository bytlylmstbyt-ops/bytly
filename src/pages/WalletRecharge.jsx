import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
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
  const [quickAmounts] = useState([100, 500, 1000, 2000, 5000]);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    const currentUser = await base44.auth.me();
    setUser(currentUser);

    // Get user profile (client, engineer, or firm)
    const [clientData] = await base44.entities.Client.filter({ email: currentUser.email });
    if (clientData) {
      setProfile({ ...clientData, type: "client" });
      return;
    }

    const [engineerData] = await base44.entities.Engineer.filter({ email: currentUser.email });
    if (engineerData) {
      setProfile({ ...engineerData, type: "engineer" });
      return;
    }

    const [firmData] = await base44.entities.EngineeringFirm.filter({ email: currentUser.email });
    if (firmData) {
      setProfile({ ...firmData, type: "firm" });
    }
  };

  const handleRecharge = async () => {
    if (!amount || parseFloat(amount) < 50) {
      alert("الحد الأدنى للشحن 50 ريال");
      return;
    }

    setIsProcessing(true);
    
    try {
      const response = await base44.functions.invoke('createWalletRecharge', {
        amount: parseFloat(amount),
        user_email: user.email
      });

      if (response.data?.url) {
        window.location.href = response.data.url;
      }
    } catch (error) {
      alert("حدث خطأ في إنشاء عملية الشحن");
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
                  دفع آمن عبر Stripe
                </div>
              </div>

              <Button
                onClick={handleRecharge}
                disabled={!amount || parseFloat(amount) < 50 || isProcessing}
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