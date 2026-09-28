import React, { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert } from "@/components/ui/alert";
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react";

export default function ProviderWithdrawalForm({ provider, providerType, onSuccess }) {
  const [formData, setFormData] = useState({
    amount: "",
    iban: provider?.iban || "",
    bank_name: provider?.bank_name || "",
    account_holder_name: provider?.account_holder_name || provider?.company_name || provider?.full_name || ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const availableBalance = Number(
    provider?.available_balance ??
    provider?.wallet_balance ??
    provider?.wallet?.available_balance ??
    0
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    const amount = Number(formData.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      setError("يرجى إدخال مبلغ صحيح");
      return;
    }
    if (amount > availableBalance) {
      setError(`المبلغ المتاح للسحب: ${availableBalance.toLocaleString("ar-SA")} ريال فقط`);
      return;
    }
    if (!/^SA\\d{22}$/i.test(formData.iban.replace(/\\s+/g, ""))) {
      setError("يرجى إدخال آيبان سعودي صحيح يبدأ بـ SA ويتكون من 24 خانة");
      return;
    }
    if (!formData.bank_name || !formData.account_holder_name) {
      setError("يرجى إكمال جميع البيانات البنكية");
      return;
    }

    setLoading(true);
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error("يجب تسجيل الدخول أولاً");

      const { data, error: rpcError } = await supabase.rpc("request_withdrawal", {
        p_amount: amount,
        p_iban: formData.iban.replace(/\\s+/g, "").toUpperCase(),
        p_bank_name: formData.bank_name.trim(),
        p_account_holder_name: formData.account_holder_name.trim(),
        p_project_id: null
      });

      if (rpcError) throw rpcError;

      setSuccess(true);
      setFormData((prev) => ({ ...prev, amount: "" }));
      if (onSuccess) onSuccess(data);
      setTimeout(() => setSuccess(false), 5000);
    } catch (err) {
      console.error("Error creating withdrawal request:", err);
      setError(err?.message || "حدث خطأ أثناء إنشاء طلب السحب. يرجى المحاولة مرة أخرى.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>طلب سحب رصيد</CardTitle>
        <CardDescription>
          يتم نقل المبلغ إلى الرصيد المعلّق لحين استكمال المراجعة والموافقة.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {error && (
            <Alert className="bg-red-50 text-red-800 border-red-200">
              <AlertCircle className="h-4 w-4" />
              <div className="mr-2">{error}</div>
            </Alert>
          )}
          {success && (
            <Alert className="bg-green-50 text-green-800 border-green-200">
              <CheckCircle2 className="h-4 w-4" />
              <div className="mr-2">تم إرسال طلب السحب بنجاح.</div>
            </Alert>
          )}

          <div>
            <Label htmlFor="amount">المبلغ المطلوب سحبه (ريال)</Label>
            <Input id="amount" type="number" min="0.01" step="0.01" value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              placeholder="0.00" className="mt-1" />
            <p className="text-xs text-slate-500 mt-1">
              الحد الأقصى المتاح: {availableBalance.toLocaleString("ar-SA")} ريال
            </p>
          </div>

          <div>
            <Label htmlFor="iban">رقم الآيبان (IBAN)</Label>
            <Input id="iban" value={formData.iban}
              onChange={(e) => setFormData({ ...formData, iban: e.target.value })}
              placeholder="SA0000000000000000000000" className="mt-1 font-mono" />
          </div>

          <div>
            <Label htmlFor="bank_name">اسم البنك</Label>
            <Input id="bank_name" value={formData.bank_name}
              onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
              placeholder="اسم البنك" className="mt-1" />
          </div>

          <div>
            <Label htmlFor="account_holder_name">اسم صاحب الحساب</Label>
            <Input id="account_holder_name" value={formData.account_holder_name}
              onChange={(e) => setFormData({ ...formData, account_holder_name: e.target.value })}
              placeholder="الاسم كما هو في الحساب البنكي" className="mt-1" />
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={loading}
            className="w-full bg-gradient-to-r from-[#6B5D4F] to-[#C9A66B]">
            {loading ? <><Loader2 className="w-4 h-4 ml-2 animate-spin" />جاري المعالجة...</> : "تقديم طلب السحب"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}