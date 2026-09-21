import React, { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert } from "@/components/ui/alert";
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react";

export default function WithdrawalForm({ engineer, onSuccess }) {
  const [formData, setFormData] = useState({
    amount: "",
    iban: engineer?.iban || "",
    bank_name: engineer?.bank_name || "",
    account_holder_name: engineer?.account_holder_name || engineer?.full_name || ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    const amount = parseFloat(formData.amount);

    // Validation
    if (!amount || amount <= 0) {
      setError("يرجى إدخال مبلغ صحيح");
      return;
    }

    if (amount > engineer.available_balance) {
      setError(`المبلغ المتاح للسحب: ${engineer.available_balance} ريال فقط`);
      return;
    }

    if (!formData.iban || !formData.bank_name || !formData.account_holder_name) {
      setError("يرجى إكمال جميع البيانات البنكية");
      return;
    }

    setLoading(true);

    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) throw authError || new Error("انتهت جلسة الدخول");
      const { data: wallet, error: walletError } = await supabase.from("wallet_accounts").select("*").eq("user_id", user.id).maybeSingle();
      if (walletError) throw walletError;
      const availableBalance = Number(wallet?.available_balance || engineer?.available_balance || 0);
      if (amount > availableBalance) throw new Error(`المبلغ المتاح للسحب: ${availableBalance} ريال فقط`);

      // Store banking details only with the withdrawal request; do not expose them in logs or URLs.
      const { data: request, error: requestError } = await supabase.from("withdrawal_requests").insert({
        user_id: user.id,
        engineer_user_id: user.id,
        amount,
        iban: formData.iban.replace(/\s+/g, "").toUpperCase(),
        bank_name: formData.bank_name.trim(),
        account_holder_name: formData.account_holder_name.trim(),
        status: "pending",
        request_date: new Date().toISOString()
      }).select("id,amount,status,request_date").single();
      if (requestError) throw requestError;

      const { error: walletError2 } = await supabase.from("wallet_accounts").update({
        available_balance: availableBalance - amount,
        held_balance: Number(wallet?.held_balance || 0) + amount,
        updated_at: new Date().toISOString()
      }).eq("user_id", user.id).gte("available_balance", amount);
      if (walletError2) throw walletError2;

      const { error: txError } = await supabase.from("wallet_transactions").insert({
        user_id: user.id,
        type: "withdrawal_request",
        amount,
        status: "pending",
        description: "طلب سحب رصيد",
        withdrawal_request_id: request.id,
        balance_before: availableBalance,
        balance_after: availableBalance - amount
      });
      if (txError) throw txError;
    } catch (error) {
      console.error("Error creating withdrawal request:", error);
      setError("حدث خطأ أثناء إنشاء طلب السحب. يرجى المحاولة مرة أخرى.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>طلب سحب رصيد</CardTitle>
        <CardDescription>
          سيتم معالجة طلبك خلال 3 أيام عمل. يرجى التأكد من صحة البيانات البنكية.
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
              <div className="mr-2">
                ✅ تم إرسال طلب السحب بنجاح! سيتم معالجته خلال 3 أيام عمل.
              </div>
            </Alert>
          )}

          <div>
            <Label htmlFor="amount">المبلغ المطلوب سحبه (ريال)</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              placeholder="0.00"
              className="mt-1"
            />
            <p className="text-xs text-slate-500 mt-1">
              الحد الأقصى المتاح: {engineer?.available_balance?.toLocaleString('ar-SA') || 0} ريال
            </p>
          </div>

          <div>
            <Label htmlFor="iban">رقم الآيبان (IBAN)</Label>
            <Input
              id="iban"
              value={formData.iban}
              onChange={(e) => setFormData({ ...formData, iban: e.target.value })}
              placeholder="SA0000000000000000000000"
              className="mt-1 font-mono"
            />
          </div>

          <div>
            <Label htmlFor="bank_name">اسم البنك</Label>
            <Input
              id="bank_name"
              value={formData.bank_name}
              onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
              placeholder="مثال: البنك الأهلي السعودي"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="account_holder_name">اسم صاحب الحساب</Label>
            <Input
              id="account_holder_name"
              value={formData.account_holder_name}
              onChange={(e) => setFormData({ ...formData, account_holder_name: e.target.value })}
              placeholder="الاسم كما هو في الحساب البنكي"
              className="mt-1"
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-[#1a1a2e] to-[#C9A66B]"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                جاري المعالجة...
              </>
            ) : (
              "تقديم طلب السحب"
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}