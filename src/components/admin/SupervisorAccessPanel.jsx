import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ShieldCheck, Loader2, UserRoundCog } from "lucide-react";
import { toast } from "sonner";

export default function SupervisorAccessPanel() {
  const [users, setUsers] = useState([]);
  const [selected, setSelected] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadUsers = async () => {
    try {
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      if (authError || !authUser) throw authError || new Error("Authentication required");
      const { data: adminProfile, error: adminError } = await supabase.from("profiles")
        .select("role").eq("user_id", authUser.id).maybeSingle();
      if (adminError || (adminProfile?.role !== "admin" && authUser.email?.toLowerCase() !== "bytlylmstbyt@gmail.com")) {
        throw new Error("Administrator access required");
      }
      const { data, error } = await supabase.from("profiles")
        .select("user_id,email,full_name,role")
        .in("role", ["user", "supervisor"])
        .order("full_name");
      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error("Supervisor list error:", error);
      toast.error("تعذر تحميل الحسابات أو ليس لديك صلاحية");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadUsers(); }, []);

  const selectedUser = users.find(u => u.user_id === selected);
  const changeRole = async (action) => {
    if (!selectedUser) return;
    const confirmation = action === "assign"
      ? "تأكيد تعيين هذا الحساب كمشرفة؟"
      : "تأكيد إلغاء صلاحية المشرفة وإعادته إلى مستخدم عادي؟";
    if (!window.confirm(confirmation)) return;

    setSaving(true);
    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !sessionData.session) throw sessionError || new Error("Session expired");
      const { data, error } = await supabase.functions.invoke("admin-manage-supervisor", {
        body: { target_user_id: selectedUser.user_id, action },
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Role update failed");
      toast.success(action === "assign" ? "تم تعيين المشرفة" : "تم إلغاء دور المشرفة");
      await loadUsers();
    } catch (error) {
      console.error("Supervisor update error:", error);
      toast.error(error?.message || "تعذر تحديث دور المشرفة");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="mb-8 border-amber-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-[#4A3F35]">
          <ShieldCheck className="w-5 h-5 text-[#C9A66B]" />
          إدارة المشرفات
        </CardTitle>
        <p className="text-sm text-slate-600">تعيين الدور لحساب مستخدم عادي أو إلغاؤه. هذا الدور لا يمنح صلاحيات مدير النظام.</p>
      </CardHeader>
      <CardContent className="flex flex-col sm:flex-row gap-3">
        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
          <>
            <Select value={selected} onValueChange={setSelected}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="اختاري حسابًا" />
              </SelectTrigger>
              <SelectContent>
                {users.map(u => <SelectItem key={u.user_id} value={u.user_id}>
                  {(u.full_name || "بدون اسم") + " — " + (u.email || "") + (u.role === "supervisor" ? " (مشرفة حاليًا)" : "")}
                </SelectItem>)}
              </SelectContent>
            </Select>
            <Button disabled={!selectedUser || saving || selectedUser?.role === "supervisor"} onClick={() => changeRole("assign")}>
              {saving ? <Loader2 className="w-4 h-4 ml-2 animate-spin" /> : <UserRoundCog className="w-4 h-4 ml-2" />}
              تعيين مشرفة
            </Button>
            <Button variant="outline" disabled={!selectedUser || saving || selectedUser?.role !== "supervisor"} onClick={() => changeRole("revoke")}>
              إلغاء دور المشرفة
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
