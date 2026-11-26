import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Users, Plus, Trash2, Search, Loader2, 
  Shield, Mail, Calendar
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

export default function UserRoleAssignment() {
  const [assignments, setAssignments] = useState([]);
  const [roles, setRoles] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState(null);
  const [showDialog, setShowDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [formData, setFormData] = useState({
    user_email: "",
    role_id: "",
    notes: ""
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      if (authError || !authUser) throw authError || new Error("انتهت جلسة الدخول");
      const { data: userData, error: profileError } = await supabase.from("profiles").select("*").eq("user_id", authUser.id).single();
      if (profileError) throw profileError;
      if (userData.role !== "admin") {
        toast.error("ليس لديك صلاحية الوصول لهذه الصفحة");
        return;
      }
      setUser(userData);

      const [{ data: assignmentsData, error: assignmentsError }, { data: rolesData, error: rolesError }, { data: usersData, error: usersError }] = await Promise.all([
        supabase.from("user_role_assignments").select("*").order("assigned_date", { ascending: false }),
        supabase.from("admin_roles").select("*").eq("is_active", true).order("display_name"),
        supabase.from("profiles").select("*").order("full_name")
      ]);
      if (assignmentsError) throw assignmentsError;
      if (rolesError) throw rolesError;
      if (usersError) throw usersError;

      setAssignments(assignmentsData);
      setRoles(rolesData.filter(r => r.is_active));
      setAllUsers(usersData);
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("حدث خطأ في تحميل البيانات");
    } finally {
      setLoading(false);
    }
  };

  const handleAssignRole = async () => {
    if (!formData.user_email || !formData.role_id) {
      toast.error("الرجاء اختيار المستخدم والدور");
      return;
    }

    // Check if already assigned
    const existing = assignments.find(
      a => a.user_email === formData.user_email && a.role_id === formData.role_id
    );
    if (existing) {
      toast.error("هذا الدور مُعين بالفعل للمستخدم");
      return;
    }

    setSaving(true);
    try {
      const role = roles.find(r => r.id === formData.role_id);
      const { error: assignmentError } = await supabase.from("user_role_assignments").insert({
        user_email: formData.user_email,
        role_id: formData.role_id,
        role_name: role.name,
        assigned_by: user.email,
        assigned_date: new Date().toISOString(),
        notes: formData.notes
      });
      if (assignmentError) throw assignmentError;

      // Update role's assigned users count
      await supabase.from("admin_roles").update({
        assigned_users_count: (role.assigned_users_count || 0) + 1,
        updated_at: new Date().toISOString()
      }).eq("id", formData.role_id);

      toast.success("تم تعيين الدور بنجاح");
      await loadData();
      setShowDialog(false);
      setFormData({ user_email: "", role_id: "", notes: "" });
    } catch (error) {
      console.error("Error assigning role:", error);
      toast.error("حدث خطأ في تعيين الدور");
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveAssignment = async (assignment) => {
    if (!confirm("هل أنت متأكد من إلغاء تعيين هذا الدور؟")) return;

    try {
      const { error: deleteError } = await supabase.from("user_role_assignments").delete().eq("id", assignment.id);
      if (deleteError) throw deleteError;
      
      // Update role's assigned users count
      const { data: role } = await supabase.from("admin_roles").select("assigned_users_count").eq("id", assignment.role_id).maybeSingle();
      if (role) {
        await supabase.from("admin_roles").update({
          assigned_users_count: Math.max((role.assigned_users_count || 1) - 1, 0),
          updated_at: new Date().toISOString()
        }).eq("id", assignment.role_id);
      }

      toast.success("تم إلغاء تعيين الدور بنجاح");
      await loadData();
    } catch (error) {
      console.error("Error removing assignment:", error);
      toast.error("حدث خطأ في إلغاء التعيين");
    }
  };

  const filteredAssignments = assignments.filter(a => 
    a.user_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.role_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group assignments by user
  const groupedAssignments = {};
  filteredAssignments.forEach(assignment => {
    if (!groupedAssignments[assignment.user_email]) {
      groupedAssignments[assignment.user_email] = [];
    }
    groupedAssignments[assignment.user_email].push(assignment);
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-[#6B5D4F]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-amber-50/30 py-8" dir="rtl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-[#1a1a2e] mb-2 flex items-center gap-2">
                <Users className="w-8 h-8" />
                تعيين الأدوار للمستخدمين
              </h1>
              <p className="text-slate-600">إدارة أدوار وصلاحيات المستخدمين</p>
            </div>
            <Dialog open={showDialog} onOpenChange={setShowDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 ml-2" />
                  تعيين دور
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>تعيين دور جديد</DialogTitle>
                </DialogHeader>
                
                <div className="space-y-4 py-4">
                  <div>
                    <Label>المستخدم</Label>
                    <Select value={formData.user_email} onValueChange={(value) => setFormData({ ...formData, user_email: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر المستخدم" />
                      </SelectTrigger>
                      <SelectContent>
                        {allUsers.map(user => (
                          <SelectItem key={user.id} value={user.email}>
                            {user.full_name} ({user.email})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>الدور</Label>
                    <Select value={formData.role_id} onValueChange={(value) => setFormData({ ...formData, role_id: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر الدور" />
                      </SelectTrigger>
                      <SelectContent>
                        {roles.map(role => (
                          <SelectItem key={role.id} value={role.id}>
                            {role.display_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>ملاحظات (اختياري)</Label>
                    <Input
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="أي ملاحظات حول هذا التعيين"
                    />
                  </div>

                  <div className="flex gap-2 justify-end pt-4">
                    <Button variant="outline" onClick={() => setShowDialog(false)}>
                      إلغاء
                    </Button>
                    <Button onClick={handleAssignRole} disabled={saving}>
                      {saving ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : null}
                      تعيين
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Search */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="بحث بالبريد الإلكتروني أو الدور..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Assignments List */}
        <div className="space-y-4">
          {Object.entries(groupedAssignments).map(([email, userAssignments]) => {
            const userData = allUsers.find(u => u.email === email);
            return (
              <Card key={email}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-[#6B5D4F] to-[#C9A66B] rounded-full flex items-center justify-center text-white font-bold">
                        {userData?.full_name?.charAt(0) || email.charAt(0)}
                      </div>
                      <div>
                        <CardTitle>{userData?.full_name || email}</CardTitle>
                        <p className="text-sm text-slate-500 flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {email}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {userAssignments.map(assignment => {
                      const role = roles.find(r => r.id === assignment.role_id);
                      return (
                        <div key={assignment.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                          <div className="flex items-center gap-3 flex-1">
                            <Shield className="w-5 h-5 text-[#6B5D4F]" />
                            <div>
                              <p className="font-medium">{role?.display_name || assignment.role_name}</p>
                              <div className="flex items-center gap-3 text-xs text-slate-500">
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {format(new Date(assignment.assigned_date || assignment.created_date), "d MMM yyyy", { locale: ar })}
                                </span>
                                <span>بواسطة: {assignment.assigned_by}</span>
                              </div>
                              {assignment.notes && (
                                <p className="text-xs text-slate-600 mt-1">{assignment.notes}</p>
                              )}
                            </div>
                          </div>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleRemoveAssignment(assignment)}
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {Object.keys(groupedAssignments).length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <Users className="w-12 h-12 mx-auto mb-4 text-slate-400" />
              <p className="text-slate-600 mb-4">لا توجد تعيينات أدوار بعد</p>
              <Button onClick={() => setShowDialog(true)}>
                <Plus className="w-4 h-4 ml-2" />
                تعيين دور جديد
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}