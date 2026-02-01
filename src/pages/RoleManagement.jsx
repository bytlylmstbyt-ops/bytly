import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Shield, Plus, Edit2, Trash2, Users, Lock,
  Loader2, Save, X, CheckCircle, AlertCircle
} from "lucide-react";
import { toast } from "sonner";

export default function RoleManagement() {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState(null);
  const [showDialog, setShowDialog] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    display_name: "",
    description: "",
    permissions: getDefaultPermissions()
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const userData = await base44.auth.me();
      if (userData.role !== "admin") {
        toast.error("ليس لديك صلاحية الوصول لهذه الصفحة");
        return;
      }
      setUser(userData);
      await loadRoles();
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("حدث خطأ في تحميل البيانات");
    } finally {
      setLoading(false);
    }
  };

  const loadRoles = async () => {
    const rolesData = await base44.entities.Role.list();
    setRoles(rolesData);
  };

  function getDefaultPermissions() {
    return {
      projects: { view: false, create: false, edit: false, delete: false },
      engineers: { view: false, create: false, edit: false, delete: false, approve: false },
      clients: { view: false, create: false, edit: false, delete: false },
      contracts: { view: false, create: false, edit: false, delete: false },
      invoices: { view: false, create: false, edit: false, delete: false },
      payments: { view: false, process: false, refund: false },
      disputes: { view: false, manage: false, resolve: false },
      analytics: { view: false, export: false },
      settings: { view: false, edit: false, roles: false }
    };
  }

  const handleOpenDialog = (role = null) => {
    if (role) {
      setEditingRole(role);
      setFormData({
        name: role.name,
        display_name: role.display_name,
        description: role.description || "",
        permissions: role.permissions || getDefaultPermissions()
      });
    } else {
      setEditingRole(null);
      setFormData({
        name: "",
        display_name: "",
        description: "",
        permissions: getDefaultPermissions()
      });
    }
    setShowDialog(true);
  };

  const handleSaveRole = async () => {
    if (!formData.name || !formData.display_name) {
      toast.error("الرجاء إدخال اسم الدور والاسم المعروض");
      return;
    }

    setSaving(true);
    try {
      if (editingRole) {
        if (editingRole.is_system_role) {
          toast.error("لا يمكن تعديل دور النظام");
          return;
        }
        await base44.entities.Role.update(editingRole.id, formData);
        toast.success("تم تحديث الدور بنجاح");
      } else {
        await base44.entities.Role.create({
          ...formData,
          is_system_role: false,
          is_active: true,
          assigned_users_count: 0
        });
        toast.success("تم إنشاء الدور بنجاح");
      }
      await loadRoles();
      setShowDialog(false);
    } catch (error) {
      console.error("Error saving role:", error);
      toast.error("حدث خطأ في حفظ الدور");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRole = async (role) => {
    if (role.is_system_role) {
      toast.error("لا يمكن حذف دور النظام");
      return;
    }
    if (role.assigned_users_count > 0) {
      toast.error("لا يمكن حذف دور مُعين لمستخدمين");
      return;
    }
    if (!confirm(`هل أنت متأكد من حذف الدور "${role.display_name}"؟`)) return;

    try {
      await base44.entities.Role.delete(role.id);
      toast.success("تم حذف الدور بنجاح");
      await loadRoles();
    } catch (error) {
      console.error("Error deleting role:", error);
      toast.error("حدث خطأ في حذف الدور");
    }
  };

  const handlePermissionChange = (category, action, value) => {
    setFormData({
      ...formData,
      permissions: {
        ...formData.permissions,
        [category]: {
          ...formData.permissions[category],
          [action]: value
        }
      }
    });
  };

  const permissionCategories = [
    { id: "projects", label: "المشاريع", actions: ["view", "create", "edit", "delete"] },
    { id: "engineers", label: "المهندسين", actions: ["view", "create", "edit", "delete", "approve"] },
    { id: "clients", label: "العملاء", actions: ["view", "create", "edit", "delete"] },
    { id: "contracts", label: "العقود", actions: ["view", "create", "edit", "delete"] },
    { id: "invoices", label: "الفواتير", actions: ["view", "create", "edit", "delete"] },
    { id: "payments", label: "المدفوعات", actions: ["view", "process", "refund"] },
    { id: "disputes", label: "النزاعات", actions: ["view", "manage", "resolve"] },
    { id: "analytics", label: "التحليلات", actions: ["view", "export"] },
    { id: "settings", label: "الإعدادات", actions: ["view", "edit", "roles"] }
  ];

  const actionLabels = {
    view: "عرض",
    create: "إنشاء",
    edit: "تعديل",
    delete: "حذف",
    approve: "اعتماد",
    process: "معالجة",
    refund: "استرداد",
    manage: "إدارة",
    resolve: "حل",
    export: "تصدير",
    roles: "إدارة الأدوار"
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-[#6B5D4F]" />
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <Lock className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">غير مصرح</h3>
            <p className="text-slate-600">ليس لديك صلاحية الوصول لهذه الصفحة</p>
          </CardContent>
        </Card>
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
                <Shield className="w-8 h-8" />
                إدارة الأدوار والصلاحيات
              </h1>
              <p className="text-slate-600">تخصيص الأدوار وصلاحيات الوصول للمستخدمين</p>
            </div>
            <Dialog open={showDialog} onOpenChange={setShowDialog}>
              <DialogTrigger asChild>
                <Button onClick={() => handleOpenDialog()}>
                  <Plus className="w-4 h-4 ml-2" />
                  إضافة دور جديد
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingRole ? "تعديل الدور" : "إضافة دور جديد"}
                  </DialogTitle>
                </DialogHeader>
                
                <div className="space-y-6 py-4">
                  {/* Basic Info */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>اسم الدور (بالإنجليزية)</Label>
                      <Input
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="admin, manager, engineer"
                        disabled={editingRole?.is_system_role}
                      />
                    </div>
                    <div>
                      <Label>الاسم المعروض</Label>
                      <Input
                        value={formData.display_name}
                        onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                        placeholder="مدير، مشرف، مهندس"
                      />
                    </div>
                  </div>

                  <div>
                    <Label>الوصف</Label>
                    <Textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="وصف الدور ومسؤولياته"
                      rows={3}
                    />
                  </div>

                  {/* Permissions */}
                  <div>
                    <h3 className="font-semibold text-lg mb-4">الصلاحيات</h3>
                    <div className="space-y-4">
                      {permissionCategories.map((category) => (
                        <Card key={category.id}>
                          <CardContent className="pt-6">
                            <h4 className="font-medium mb-3">{category.label}</h4>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                              {category.actions.map((action) => (
                                <div key={action} className="flex items-center justify-between p-2 bg-slate-50 rounded">
                                  <span className="text-sm">{actionLabels[action]}</span>
                                  <Switch
                                    checked={formData.permissions[category.id]?.[action] || false}
                                    onCheckedChange={(checked) => handlePermissionChange(category.id, action, checked)}
                                  />
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 justify-end pt-4 border-t">
                    <Button variant="outline" onClick={() => setShowDialog(false)}>
                      <X className="w-4 h-4 ml-2" />
                      إلغاء
                    </Button>
                    <Button onClick={handleSaveRole} disabled={saving}>
                      {saving ? (
                        <Loader2 className="w-4 h-4 animate-spin ml-2" />
                      ) : (
                        <Save className="w-4 h-4 ml-2" />
                      )}
                      حفظ
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Roles List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {roles.map((role) => (
            <Card key={role.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2">
                      {role.display_name}
                      {role.is_system_role && (
                        <Badge variant="outline" className="text-xs">
                          نظام
                        </Badge>
                      )}
                    </CardTitle>
                    <p className="text-sm text-slate-500 mt-1">{role.name}</p>
                  </div>
                  {!role.is_system_role && (
                    <div className="flex gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleOpenDialog(role)}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleDeleteRole(role)}
                        disabled={role.assigned_users_count > 0}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {role.description && (
                  <p className="text-sm text-slate-600 mb-4">{role.description}</p>
                )}
                
                <div className="flex items-center gap-2 text-sm text-slate-600 mb-4">
                  <Users className="w-4 h-4" />
                  <span>{role.assigned_users_count || 0} مستخدم</span>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium">الصلاحيات الممنوحة:</p>
                  <div className="flex flex-wrap gap-1">
                    {Object.entries(role.permissions || {}).map(([category, perms]) => {
                      const enabledPerms = Object.entries(perms).filter(([_, enabled]) => enabled);
                      if (enabledPerms.length === 0) return null;
                      return (
                        <Badge key={category} variant="outline" className="text-xs">
                          {permissionCategories.find(c => c.id === category)?.label || category}
                        </Badge>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {roles.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <Shield className="w-12 h-12 mx-auto mb-4 text-slate-400" />
              <p className="text-slate-600 mb-4">لا توجد أدوار محددة بعد</p>
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="w-4 h-4 ml-2" />
                إضافة دور جديد
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}