import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Wallet, CreditCard, FileText, Apple, Shield, Zap, Building2
} from "lucide-react";

export default function PaymentMethodSelector({ 
  amount, 
  walletBalance = 0,
  onPayWithWallet, 
  onPayWithStripe,
  onPayWithInvoice,
  isProcessing = false,
  showInvoiceOption = false
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
              onClick={onPayWithWallet}
              disabled={!hasEnoughBalance || isProcessing}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {hasEnoughBalance ? "ادفع الآن" : "رصيد غير كافٍ"}
            </Button>
          </div>
          {!hasEnoughBalance && (
            <p className="text-xs text-amber-600 mt-3">
              💡 يمكنك شحن محفظتك من صفحة المحفظة
            </p>
          )}
        </CardContent>
      </Card>

      {/* Card Payment (Stripe) */}
      <Card className="cursor-pointer border-2 border-slate-200 hover:border-purple-600 hover:shadow-lg transition-all">
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-purple-600 flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="font-semibold text-[#1a1a2e]">بطاقة الدفع</p>
                <div className="flex gap-2 mt-1">
                  <Badge variant="outline" className="text-xs">مدى</Badge>
                  <Badge variant="outline" className="text-xs">Visa</Badge>
                  <Badge variant="outline" className="text-xs">Mastercard</Badge>
                </div>
              </div>
            </div>
            <Button
              onClick={onPayWithStripe}
              disabled={isProcessing}
              variant="outline"
            >
              متابعة
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Apple Pay & Google Pay */}
      <Card className="cursor-pointer border-2 border-slate-200 hover:border-green-600 hover:shadow-lg transition-all">
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center">
                <Apple className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="font-semibold text-[#1a1a2e]">المحافظ الرقمية</p>
                <div className="flex gap-2 mt-1">
                  <Badge variant="outline" className="text-xs">Apple Pay</Badge>
                  <Badge variant="outline" className="text-xs">Google Pay</Badge>
                  <Badge variant="outline" className="text-xs">STC Pay</Badge>
                </div>
              </div>
            </div>
            <Button
              onClick={onPayWithStripe}
              disabled={isProcessing}
              variant="outline"
            >
              متابعة
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Invoice Payment (For Companies) */}
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
                  <p className="text-sm text-slate-500">للشركات (دفع آجل)</p>
                  <Badge variant="outline" className="mt-1 text-xs">
                    <Building2 className="w-3 h-3 ml-1" />
                    30 يوم
                  </Badge>
                </div>
              </div>
              <Button
                onClick={onPayWithInvoice}
                disabled={isProcessing}
                variant="outline"
              >
                إصدار
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Security Badge */}
      <div className="flex items-center justify-center gap-2 text-sm text-slate-500 pt-2">
        <Shield className="w-4 h-4 text-green-600" />
        <span>جميع المعاملات مؤمنة ومشفرة</span>
      </div>
    </div>
  );
}