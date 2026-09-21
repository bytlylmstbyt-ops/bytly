import React, { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert } from "@/components/ui/alert";
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react";

export default function ProviderWithdrawalForm({ provider, providerType, onSuccess }) {
  const providerLabel = providerType === "contractor" ? "المقاول" : providerType === "supplier" ? "المورد" : "الشركة الهندسية";

  const [formData, setFormData] = useState({
    amount: "",
    iban: provider?.iban || "",
    bank_name: provider?.bank_name || "",
    account_holder_name: provider?.account_holder_name || provider?.company_name || ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [projects, setProjects] = useState([]);
  const [projectId, setProjectId] = useState("");

  const availableBalance = provider?.available_balance || provider?.wallet_balance || 0;
  const loadProjects = async () => {
    const { data, error } = await supabase.from("projects").select("id,title,client_final_approval,company_id,assigned_contractor_id,assigned_supplier_id").order("created_at", { ascending: false });
    if (error) throw error;
    const eligible = (data || []).filter(p => p.client_final_approval !== false && ((providerType === "contractor" && p.assigned_contractor_id === provider?.id) || (providerType === "supplier" && p.assigned_supplier_id === provider?.id) || (providerType === "engineering_firm" && p.company_id === provider?.id)));
    setProjects(eligible);
    if (!projectId && eligible[0]) setProjectId(eligible[0].id);
  };
  React.useEffect(() => { if (provider?.id && providerType) loadProjects().catch(() => {}); }, [provider?.id, providerType]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    const amount = parseFloat(formData.amount);

    if (!amount || amount <= 0) {
      setError("يرجى إدخال مبلغ صحيح");
      return;
    }

    if (amount > availableBalance) {
      setError(`المبلغ المتاح للسحب: ${availableBalance.toLocaleString('ar-SA')} ريال فقط`);
      return;
    }

    if (!formData.iban || !formData.bank_name || !formData.account_holder_name) {
      setError("يرجى إكمال جميع البيانات البنكية");
      return;
    }

    setLoading(true);

    try {
      if (!projectId) throw new Error("يرجى اختيار المشروع");
      const { error: rpcError } = await supabase.rpc("request_withdrawal", {
        p_amount: amount,
        p_iban: formData.iban,
        p_bank_name: formData.bank_name,
        p_account_holder_name: formData.account_holder_name,
        p_project_id: projectId
      });
      if (rpcError) throw rpcError;

      setSuccess(true);
      setFormData({ ...formData, amount: "" });

      if (onSuccess) onSuccess();

      setTimeout(() => setSuccess(false), 5000);
    } catch (err) {
      console.error("Error creating withdrawal request:", err);
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
            <Label htmlFor="project_id">المشروع المرتبط بالسحب</Label>
            <select id="project_id" value={projectId} onChange={(e) => setProjectId(e.target.value)} className="mt-1 w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
              <option value="">اختر المشروع</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
            </select>
          </div>

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
              الحد الأقصى المتاح: {availableBalance.toLocaleString('ar-SA')} ريال
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
            className="w-full bg-gradient-to-r from-[#6B5D4F] to-[#C9A66B]"
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