import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Wallet, DollarSign, Loader2, CreditCard,
  CheckCircle, Zap, Shield, ArrowLeft
} from "lucide-react";
import { toast } from "sonner";

const QUICK_AMOUNTS = [100, 250, 500, 1000, 2500, 5000];

/**
 * DepositPanel — لوحة الإيداع الموحدة للعملاء والمهندسين
 * تستخدم createWalletRecharge لإنشاء جلسة Stripe
 */
export default function DepositPanel({ profile, userEmail, onSuccess }) {
  const [amount, setAmount] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const handleDeposit = async () => {
    const parsed = parseFloat(amount);
    if (!parsed || parsed < 50) {
      toast.error("الحد الأدنى للإيداع 50 ريال");
      return;
    }

    setIsProcessing(true);
    try {
      const res = await base44.functions.invoke("createWalletRecharge", {
        amount: parsed,
        user_email: userEmail
      });
      if (res.data?.url) {
        window.location.href = res.data.url;
      } else {
        toast.error("حدث خطأ في إنشاء الدفع");
        setIsProcessing(false);
      }
    } catch {
      toast.error("حدث خطأ في الاتصال بنظام الدفع");
      setIsProcessing(false);
    }
  };

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="w-5 h-5 text-green-600" />
          إيداع رصيد في المحفظة
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* الرصيد الحالي */}
        <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200">
          <p className="text-xs text-green-700 mb-1">رصيدك الحالي</p>
          <p className="text-3xl font-bold text-green-700">
            {(profile?.wallet_balance || 0).toLocaleString("ar-SA")}
            <span className="text-base font-normal text-green-600 mr-1">ر.س</span>
          </p>
        </div>

        {/* مبالغ سريعة */}
        <div>
          <p className="text-sm font-medium text-slate-600 mb-3">اختر مبلغاً سريعاً</p>
          <div className="grid grid-cols-3 gap-2">
            {QUICK_AMOUNTS.map((amt) => (
              <button
                key={amt}
                onClick={() => setAmount(amt.toString())}
                className={`p-3 rounded-xl border-2 transition-all text-center ${
                  amount === amt.toString()
                    ? "border-green-500 bg-green-50 shadow-sm"
                    : "border-slate-200 hover:border-green-300 hover:bg-green-50/50"
                }`}
              >
                <p className="font-bold text-slate-800">{amt.toLocaleString("ar-SA")}</p>
                <p className="text-xs text-slate-500">ريال</p>
              </button>
            ))}
          </div>
        </div>

        {/* مبلغ مخصص */}
        <div className="space-y-1">
          <p className="text-sm font-medium text-slate-600">أو أدخل مبلغاً مخصصاً</p>
          <div className="relative">
            <DollarSign className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <Input
              type="number"
              min="50"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="مثال: 750"
              className="pr-10 h-12 text-lg"
            />
          </div>
          <p className="text-xs text-slate-400">الحد الأدنى: 50 ريال</p>
        </div>

        {/* طرق الدفع */}
        <div className="p-3 bg-slate-50 rounded-lg">
          <p className="text-xs font-medium text-slate-600 mb-2">طرق الدفع المتاحة</p>
          <div className="flex flex-wrap gap-1.5">
            {["💳 مدى", "💳 فيزا", "💳 ماستركارد", " Apple Pay", "🅖 Google Pay"].map((m) => (
              <Badge key={m} variant="outline" className="text-xs bg-white">
                {m}
              </Badge>
            ))}
          </div>
        </div>

        {/* مميزات */}
        <div className="space-y-1.5 text-sm text-slate-600">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-500 shrink-0" />
            إيداع فوري وآمن عبر Stripe
          </div>
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-green-500 shrink-0" />
            أموالك محمية بنظام الضمان
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-blue-500 shrink-0" />
            الرصيد يُضاف فور الدفع
          </div>
        </div>

        {/* زر الإيداع */}
        <Button
          onClick={handleDeposit}
          disabled={!amount || parseFloat(amount) < 50 || isProcessing}
          className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-6 text-base"
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin ml-2" />
              جاري التحويل إلى بوابة الدفع...
            </>
          ) : (
            <>
              <Wallet className="w-5 h-5 ml-2" />
              إيداع {amount ? parseFloat(amount).toLocaleString("ar-SA") : ""} ريال
              <ArrowLeft className="w-4 h-4 mr-2" />
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}