import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Wallet, CreditCard, FileText, 
  Shield, Zap, Building
} from "lucide-react";

export default function PaymentMethodChoice({ 
  amount, 
  walletBalance = 0,
  showInvoiceOption = false,
  onWalletPay, 
  onStripePay,
  onInvoiceRequest
}) {
  const hasEnoughBalance = walletBalance >= amount;

  return (
    <div className="space-y-4">
      {/* Wallet Payment */}
      <Card className={`cursor-pointer border-2 transition-all ${
        hasEnoughBalance 
          ? "border-blue-600 bg-blue-50 hover:shadow-lg" 
          : "border-slate-200 opacity-50"
      }`}>
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center">
                <Wallet className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="font-semibold text-[#1a1a2e]">الدفع من المحفظة</p>
                <p className="text-sm text-slate-500">
                  رصيدك: {walletBalance.toLocaleString('ar-SA')} ر.س
                </p>
                {hasEnoughBalance && (
                  <Badge className="bg-green-100 text-green-700 mt-1">
                    <Zap className="w-3 h-3 ml-1" />
                    فوري
                  </Badge>
                )}
              </div>
            </div>
            <Button
              onClick={onWalletPay}
              disabled={!hasEnoughBalance}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {hasEnoughBalance ? "ادفع الآن" : "رصيد غير كافٍ"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Saudi payment integration — future PIS/bank connector */}
      <Card className="border-2 border-amber-200 bg-amber-50/40">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-600 flex items-center justify-center shrink-0">
              <Building className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-semibold text-[#1a1a2e]">الدفع البنكي السعودي</p>
              <p className="text-sm text-slate-600 mt-1">
                سيتم ربط الدفع البنكي عبر مزود سعودي متوافق مع متطلبات البنك المركزي السعودي بعد اكتمال الترخيص والحساب البنكي التجاري.
              </p>
              <Badge variant="outline" className="mt-2 text-xs">قيد الربط — بدون Stripe</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Invoice Payment (For Corporate Clients) */}
      {showInvoiceOption && (
        <Card className="cursor-pointer border-2 border-slate-200 hover:border-amber-600 hover:shadow-lg transition-all">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-amber-600 flex items-center justify-center">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-[#1a1a2e]">إصدار فاتورة</p>
                  <p className="text-sm text-slate-500">للشركات (دفع آجل 30 يوم)</p>
                  <Badge variant="outline" className="mt-1 text-xs">
                    <Building className="w-3 h-3 ml-1" />
                    شركات فقط
                  </Badge>
                </div>
              </div>
              <Button
                onClick={onInvoiceRequest}
                variant="outline"
              >
                إصدار
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Security Info */}
      <div className="flex items-center justify-center gap-2 text-sm text-slate-500 pt-2">
        <Shield className="w-4 h-4 text-green-600" />
        <span>جميع المعاملات مؤمنة ومشفرة</span>
      </div>
    </div>
  );
}