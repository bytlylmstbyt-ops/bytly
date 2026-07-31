import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
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

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    setIsLoading(true);
    const currentUser = await base44.auth.me();
    setUser(currentUser);

    // Check if client or engineer
    const [clientData] = await base44.entities.Client.filter({ email: currentUser.email });
    if (clientData) {
      setUserProfile({ ...clientData, type: 'client' });
      setIsLoading(false);
      return;
    }

    const [engineerData] = await base44.entities.Engineer.filter({ email: currentUser.email });
    if (engineerData) {
      setUserProfile({ ...engineerData, type: 'engineer' });
    }

    setIsLoading(false);
  };

  const handleTopup = async () => {
    if (!amount || parseFloat(amount) < 50) {
      alert("الحد الأدنى للشحن 50 ريال");
      return;
    }

    setIsProcessing(true);

    try {
      const response = await base44.functions.invoke('createWalletTopup', {
        amount: parseFloat(amount),
        user_email: user.email
      });

      if (response.data?.url) {
        window.location.href = response.data.url;
      }
    } catch (error) {
      console.error("Error:", error);
      alert("حدث خطأ في عملية الشحن");
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
                    STC Pay
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
              <Button
                onClick={handleTopup}
                disabled={!amount || parseFloat(amount) < 50 || isProcessing}
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