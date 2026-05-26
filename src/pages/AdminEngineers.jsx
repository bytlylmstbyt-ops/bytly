import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Users, Search, Edit, Ban, CheckCircle, Loader2,
  Mail, Phone, MapPin, Award, Star, DollarSign, Briefcase
} from "lucide-react";
import { motion } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

export default function AdminEngineersPage() {
  const [loading, setLoading] = useState(true);
  const [engineers, setEngineers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [editingEngineer, setEditingEngineer] = useState(null);
  const [editFormData, setEditFormData] = useState({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const user = await base44.auth.me();
      if (user.role !== "admin") {
        alert("غير مصرح لك بالوصول لهذه الصفحة");
        return;
      }

      const engineersData = await base44.entities.Engineer.list("-created_date");
      setEngineers(engineersData);
    } catch (error) {
      console.error("Error loading data:", error);
      alert("حدث خطأ في تحميل البيانات");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (engineer) => {
    setEditingEngineer(engineer);
    setEditFormData({
      full_name: engineer.full_name,
      phone: engineer.phone,
      city: engineer.city,
      country: engineer.country,
      specialization: engineer.specialization,
      years_experience: engineer.years_experience
    });
  };

  const saveEdit = async () => {
    try {
      await base44.entities.Engineer.update(editingEngineer.id, editFormData);
      await loadData();
      setEditingEngineer(null);
      alert("تم تحديث البيانات بنجاح");
    } catch (error) {
      alert("حدث خطأ في التحديث");
    }
  };

  const updateStatus = async (engineer, newStatus) => {
    try {
      await base44.entities.Engineer.update(engineer.id, { status: newStatus });
      await loadData();
      alert(`تم ${newStatus === 'approved' ? 'قبول' : newStatus === 'rejected' ? 'رفض' : 'تحديث'} المهندس`);
    } catch (error) {
      alert("حدث خطأ في تحديث الحالة");
    }
  };

  const toggleVerification = async (engineer) => {
    try {
      await base44.entities.Engineer.update(engineer.id, { 
        is_verified: !engineer.is_verified 
      });
      await loadData();
    } catch (error) {
      alert("حدث خطأ في تحديث التوثيق");
    }
  };

  const filteredEngineers = engineers.filter(engineer => {
    const matchesSearch = 
      engineer.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      engineer.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      engineer.specialization?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || engineer.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-[#d4a574]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-amber-50/30 py-8 px-4" dir="rtl">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-3 mb-2">
            <Users className="w-8 h-8 text-[#d4a574]" />
            <h1 className="text-3xl font-bold text-[#1a1a2e]">إدارة المهندسين</h1>
          </div>
          <p className="text-slate-600">عرض وتعديل وإدارة حسابات المهندسين</p>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-3xl font-bold text-[#1a1a2e]">{engineers.length}</p>
                <p className="text-sm text-slate-500">إجمالي المهندسين</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-3xl font-bold text-green-600">
                  {engineers.filter(e => e.status === "approved").length}
                </p>
                <p className="text-sm text-slate-500">معتمد</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-3xl font-bold text-amber-600">
                  {engineers.filter(e => e.status === "pending").length}
                </p>
                <p className="text-sm text-slate-500">قيد المراجعة</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-3xl font-bold text-red-600">
                  {engineers.filter(e => e.status === "rejected").length}
                </p>
                <p className="text-sm text-slate-500">مرفوض</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-3xl font-bold text-blue-600">
                  {engineers.filter(e => e.is_verified).length}
                </p>
                <p className="text-sm text-slate-500">موثق</p>
              </CardContent>
            </Card>
          </div>
        </motion.div>

        {/* Search & Filter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <Input
                    placeholder="ابحث بالاسم أو البريد الإلكتروني أو التخصص..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pr-10"
                  />
                </div>
                <div className="flex gap-2">
                  {[
                    { value: "all", label: "الكل" },
                    { value: "pending", label: "قيد المراجعة" },
                    { value: "approved", label: "معتمد" },
                    { value: "rejected", label: "مرفوض" }
                  ].map(status => (
                    <Button
                      key={status.value}
                      variant={statusFilter === status.value ? "default" : "outline"}
                      onClick={() => setStatusFilter(status.value)}
                      className={statusFilter === status.value ? "bg-[#1a1a2e]" : ""}
                    >
                      {status.label}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Engineers List */}
        <div className="grid gap-4">
          {filteredEngineers.map((engineer, index) => (
            <motion.div
              key={engineer.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-bold text-[#1a1a2e]">{engineer.full_name}</h3>
                        {engineer.status === "approved" && (
                          <Badge className="bg-green-100 text-green-800">معتمد</Badge>
                        )}
                        {engineer.status === "pending" && (
                          <Badge className="bg-amber-100 text-amber-800">قيد المراجعة</Badge>
                        )}
                        {engineer.status === "rejected" && (
                          <Badge variant="destructive">مرفوض</Badge>
                        )}
                        {engineer.is_verified && (
                          <Badge className="bg-blue-100 text-blue-800">
                            <CheckCircle className="w-3 h-3 ml-1" />
                            موثق
                          </Badge>
                        )}
                      </div>
                      
                      <div className="grid md:grid-cols-3 gap-3 text-sm text-slate-600 mb-3">
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4" />
                          {engineer.email}
                        </div>
                        {engineer.phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4" />
                            {engineer.phone}
                          </div>
                        )}
                        {engineer.city && (
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4" />
                            {engineer.city}
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <Award className="w-4 h-4" />
                          {engineer.specialization}
                        </div>
                        <div className="flex items-center gap-2">
                          <Briefcase className="w-4 h-4" />
                          {engineer.completed_projects || 0} مشروع
                        </div>
                        <div className="flex items-center gap-2">
                          <Star className="w-4 h-4 text-amber-500" />
                          {engineer.rating?.toFixed(1) || "0.0"} ({engineer.total_reviews || 0})
                        </div>
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4" />
                          {(engineer.wallet_balance || 0).toLocaleString('ar-SA')} ريال
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(engineer)}
                          >
                            <Edit className="w-4 h-4 ml-2" />
                            تعديل
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>تعديل بيانات المهندس</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <div className="space-y-2">
                              <Label>الاسم الكامل</Label>
                              <Input
                                value={editFormData.full_name || ""}
                                onChange={(e) => setEditFormData({...editFormData, full_name: e.target.value})}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>التخصص</Label>
                              <Input
                                value={editFormData.specialization || ""}
                                onChange={(e) => setEditFormData({...editFormData, specialization: e.target.value})}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>رقم الهاتف</Label>
                              <Input
                                value={editFormData.phone || ""}
                                onChange={(e) => setEditFormData({...editFormData, phone: e.target.value})}
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label>المدينة</Label>
                                <Input
                                  value={editFormData.city || ""}
                                  onChange={(e) => setEditFormData({...editFormData, city: e.target.value})}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>سنوات الخبرة</Label>
                                <Input
                                  type="number"
                                  value={editFormData.years_experience || ""}
                                  onChange={(e) => setEditFormData({...editFormData, years_experience: e.target.value})}
                                />
                              </div>
                            </div>
                            <Button onClick={saveEdit} className="w-full">
                              حفظ التغييرات
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>

                      {engineer.status === "pending" && (
                        <>
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => updateStatus(engineer, "approved")}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="w-4 h-4 ml-2" />
                            قبول
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => updateStatus(engineer, "rejected")}
                          >
                            <Ban className="w-4 h-4 ml-2" />
                            رفض
                          </Button>
                        </>
                      )}

                      <Button
                        variant={engineer.is_verified ? "outline" : "default"}
                        size="sm"
                        onClick={() => toggleVerification(engineer)}
                      >
                        {engineer.is_verified ? "إلغاء التوثيق" : "توثيق"}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}