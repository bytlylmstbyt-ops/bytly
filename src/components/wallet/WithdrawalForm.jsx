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
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  React.useEffect(() => {
    let active = true;
    (async () => {
      try {
        if (!engineer?.id) return;
        const { data, error } = await supabase.from("projects").select("id,title,status,client_final_approval").eq("assigned_engineer_id", engineer.id).order("created_at", { ascending: false });
        if (error) throw error;
        if (active) setProjects((data || []).filter(p => p.client_final_approval !== false));
      } catch (e) {
        console.error("Error loading withdrawal projects:", e);
      } finally {
        if (active) setProjectsLoading(false);
      }
    })();
    return () => { active = false; };
  }, [engineer?.id]);

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

    if (!selectedProjectId) {
      setError("يجب ربط طلب السحب بمشروع معتمد قبل تقديم الطلب");
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
      const { data, error } = await supabase.rpc("request_withdrawal", {
        p_amount: amount,
        p_iban: formData.iban.replace(/\s+/g, "").toUpperCase(),
        p_bank_name: formData.bank_name.trim(),
        p_account_holder_name: formData.account_holder_name.trim(),
        p_project_id: selectedProjectId
      });
      if (error) throw error;
      setSuccess(true);
      setFormData(prev => ({ ...prev, amount: "", iban: "", bank_name: "", account_holder_name: "" }));
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
          لا يتم صرف السحب إلا بعد اعتماد المستشار الفني ومالك المشروع ثم تنفيذ الإدارة.
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