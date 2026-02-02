import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Wallet, CreditCard, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function PaymentMethodChoice({ 
  amount, 
  onWalletPay, 
  onStripePay, 
  onInvoiceRequest,
  walletBalance = 0,
  showInvoiceOption = false 
}) {
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePay = async () => {
    setIsProcessing(true);
    
    if (selectedMethod === "wallet") {
      await onWalletPay();
    } else if (selectedMethod === "stripe") {
      await onStripePay();
    } else if (selectedMethod === "invoice") {
      await onInvoiceRequest();
    }
    
    setIsProcessing(false);
  };

  const hasEnoughBalance = walletBalance >= amount;

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600 mb-4">اختر طريقة الدفع:</p>

      {/* Wallet Payment */}
      <button
        onClick={() => setSelectedMethod("wallet")}
        className={`w-full p-4 rounded-xl border-2 transition-all text-right ${
          selectedMethod === "wallet"
            ? "border-green-600 bg-green-50"
            : "border-slate-200 hover:border-green-400"
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
              <Wallet className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="font-semibold text-[#1a1a2e]">المحفظة الداخلية</p>
              <p className="text-sm text-slate-500">
                الرصيد: {walletBalance.toLocaleString('ar-SA')} ر.س
              </p>
            </div>
          </div>
          {hasEnoughBalance ? (
            <Badge className="bg-green-600 text-white">متاح</Badge>
          ) : (
            <Badge variant="outline" className="text-red-600 border-red-200">
              رصيد غير كافٍ
            </Badge>
          )}
        </div>
      </button>

      {/* Stripe Payment (Cards + Apple/Google Pay) */}
      <button
        onClick={() => setSelectedMethod("stripe")}
        className={`w-full p-4 rounded-xl border-2 transition-all text-right ${
          selectedMethod === "stripe"
            ? "border-blue-600 bg-blue-50"
            : "border-slate-200 hover:border-blue-400"
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="font-semibold text-[#1a1a2e]">بطاقة ائتمان / Apple Pay</p>
              <p className="text-sm text-slate-500">
                فيزا، ماستركارد، مدى، Apple Pay، Google Pay
              </p>
            </div>
          </div>
        </div>
      </button>

      {/* Invoice Payment (for companies) */}
      {showInvoiceOption && (
        <button
          onClick={() => setSelectedMethod("invoice")}
          className={`w-full p-4 rounded-xl border-2 transition-all text-right ${
            selectedMethod === "invoice"
              ? "border-purple-600 bg-purple-50"
              : "border-slate-200 hover:border-purple-400"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
                <FileText className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="font-semibold text-[#1a1a2e]">طلب فاتورة</p>
                <p className="text-sm text-slate-500">للشركات (تحويل بنكي)</p>
              </div>
            </div>
          </div>
        </button>
      )}

      <Button
        onClick={handlePay}
        disabled={!selectedMethod || (selectedMethod === "wallet" && !hasEnoughBalance) || isProcessing}
        className="w-full bg-gradient-to-r from-[#1a1a2e] to-[#d4a574] text-white py-4"
      >
        {isProcessing ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin ml-2" />
            جاري المعالجة...
          </>
        ) : (
          `تأكيد الدفع - ${amount.toLocaleString('ar-SA')} ر.س`
        )}
      </Button>
    </div>
  );
}