import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Users, Search, Edit, Ban, CheckCircle, Loader2,
  Mail, Phone, MapPin, Award, Star, DollarSign, Briefcase,
  FileText, ShieldCheck, XCircle, ExternalLink
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
  const [reviewEngineer, setReviewEngineer] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

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
      const user = await base44.auth.me();
      if (engineer.is_verified) {
        await base44.entities.Engineer.update(engineer.id, { 
          is_verified: false,
          certified_at: null,
          certified_by: null
        });
      } else {
        await base44.entities.Engineer.update(engineer.id, { 
          is_verified: true,
          certified_at: new Date().toISOString(),
          certified_by: user.email,
          status: "approved"
        });
      }
      await loadData();
    } catch (error) {
      alert("حدث خطأ في تحديث التوثيق");
    }
  };

  const handleCertificationReview = async (engineer, approved) => {
    setSubmittingReview(true);
    try {
      const user = await base44.auth.me();
      if (approved) {
        await base44.entities.Engineer.update(engineer.id, {
          is_verified: true,
          certified_at: new Date().toISOString(),
          certified_by: user.email,
          status: "approved"
        });
      } else {
        await base44.entities.Engineer.update(engineer.id, {
          is_verified: false,
          status: "rejected",
          certified_at: null,
          certified_by: user.email
        });
      }

      // Send notification to the engineer (in-app + email)
      try {
        await base44.functions.invoke("reviewEngineerCertificate", {
          engineer_id: engineer.id,
          approved,
          rejection_reason: approved ? "" : rejectionReason
        });
      } catch (notifError) {
        console.error("Notification error:", notifError);
      }

      alert(approved ? "تم اعتماد المهندس وإرسال تنبيه له بنجاح" : "تم رفض الاعتماد وإرسال تنبيه للمهندس");
      setReviewEngineer(null);
      setRejectionReason("");
      await loadData();
    } catch (error) {
      alert("حدث خطأ في تحديث الاعتماد");
    } finally {
      setSubmittingReview(false);
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
        <Loader2 className="w-12 h-12 animate-spin text-[#C9A66B]" />
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
            <Users className="w-8 h-8 text-[#C9A66B]" />
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
                    <div className="flex-1" style={{minWidth: 0}}>
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
                        {engineer.registration_number && (
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4" />
                            رقم القيد: {engineer.registration_number}
                          </div>
                        )}
                      </div>

                      {(engineer.graduation_certificate_url || engineer.saudi_engineers_council_certificate_url) && (
                        <div className="mt-3 flex flex-wrap items-center gap-3">
                          {engineer.graduation_certificate_url && (
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-slate-500">شهادة التخرج:</span>
                              <a
                                href={engineer.graduation_certificate_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
                              >
                                <ExternalLink className="w-3 h-3" />
                                عرض المستند
                              </a>
                            </div>
                          )}
                          {engineer.saudi_engineers_council_certificate_url && (
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-slate-500">شهادة القيد (الهيئة السعودية للمهندسين):</span>
                              <a
                                href={engineer.saudi_engineers_council_certificate_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
                              >
                                <ExternalLink className="w-3 h-3" />
                                عرض المستند
                              </a>
                            </div>
                          )}
                        </div>
                      )}

                      {engineer.is_verified && engineer.certified_at && (
                        <div className="mt-2 flex items-center gap-2 text-xs text-green-600">
                          <ShieldCheck className="w-4 h-4" />
                          <span>اعتمد بواسطة: {engineer.certified_by || "—"}</span>
                          <span className="text-slate-400">•</span>
                          <span>{new Date(engineer.certified_at).toLocaleDateString('ar-SA')}</span>
                        </div>
                      )}
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

                      {(engineer.status === "pending" || !engineer.is_verified) && (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => setReviewEngineer(engineer)}
                          className="bg-[#1a1a2e] hover:bg-[#2a2a3e]"
                        >
                          <ShieldCheck className="w-4 h-4 ml-2" />
                          مراجعة الاعتماد
                        </Button>
                      )}

                      {engineer.is_verified && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleVerification(engineer)}
                          className="text-red-600 hover:bg-red-50"
                        >
                          <XCircle className="w-4 h-4 ml-2" />
                          إلغاء الاعتماد
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Certification Review Dialog */}
        {reviewEngineer && (
          <Dialog open={!!reviewEngineer} onOpenChange={(open) => !open && setReviewEngineer(null)}>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-[#C9A66B]" />
                  مراجعة اعتماد المهندس
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-5 py-2">
                <div className="bg-slate-50 rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#1a1a2e] to-[#C9A66B] flex items-center justify-center text-white font-bold text-lg shrink-0">
                      {reviewEngineer.full_name?.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-[#1a1a2e]">{reviewEngineer.full_name}</p>
                      <p className="text-sm text-slate-500">{reviewEngineer.specialization}</p>
                    </div>
                  </div>
                  <div className="border-t pt-3 space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-slate-400" />
                      {reviewEngineer.email}
                    </div>
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-slate-400" />
                      <span className="text-slate-500">رقم القيد:</span>
                      <span className="font-medium">{reviewEngineer.registration_number || "غير متوفر"}</span>
                    </div>
                  </div>
                </div>

                {reviewEngineer.graduation_certificate_url ? (
                  <div className="space-y-2">
                    <Label>شهادة التخرج</Label>
                    <div className="border rounded-xl p-4 bg-slate-50">
                      {reviewEngineer.graduation_certificate_url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                        <img
                          src={reviewEngineer.graduation_certificate_url}
                          alt="شهادة التخرج"
                          className="w-full max-h-72 object-contain rounded-lg"
                        />
                      ) : (
                        <div className="flex items-center justify-center py-8">
                          <a
                            href={reviewEngineer.graduation_certificate_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-blue-600 hover:underline"
                          >
                            <FileText className="w-6 h-6" />
                            عرض ملف الشهادة (PDF)
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700 flex items-center gap-2">
                    <XCircle className="w-5 h-5 shrink-0" />
                    لم يقم المهندس برفع شهادة التخرج
                  </div>
                )}

                {reviewEngineer.saudi_engineers_council_certificate_url ? (
                  <div className="space-y-2">
                    <Label>شهادة القيد في الهيئة السعودية للمهندسين</Label>
                    <div className="border rounded-xl p-4 bg-slate-50">
                      {reviewEngineer.saudi_engineers_council_certificate_url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                        <img
                          src={reviewEngineer.saudi_engineers_council_certificate_url}
                          alt="شهادة القيد في الهيئة السعودية للمهندسين"
                          className="w-full max-h-72 object-contain rounded-lg"
                        />
                      ) : (
                        <div className="flex items-center justify-center py-8">
                          <a
                            href={reviewEngineer.saudi_engineers_council_certificate_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-blue-600 hover:underline"
                          >
                            <FileText className="w-6 h-6" />
                            عرض ملف الشهادة (PDF)
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700 flex items-center gap-2">
                    <XCircle className="w-5 h-5 shrink-0" />
                    لم يقم المهندس برفع شهادة القيد في الهيئة السعودية للمهندسين
                  </div>
                )}

                <div className="space-y-2">
                  <Label>سبب الرفض (اختياري عند الرفض)</Label>
                  <textarea
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    rows={3}
                    placeholder="اذكر سبب الرفض ليتم إرساله للمهندس..."
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    variant="default"
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    disabled={(!reviewEngineer.graduation_certificate_url || !reviewEngineer.saudi_engineers_council_certificate_url || !reviewEngineer.registration_number) || submittingReview}
                    onClick={() => handleCertificationReview(reviewEngineer, true)}
                  >
                    {submittingReview ? <Loader2 className="w-4 h-4 ml-2 animate-spin" /> : <CheckCircle className="w-4 h-4 ml-2" />}
                    اعتماد المهندس
                  </Button>
                  <Button
                    variant="destructive"
                    className="flex-1"
                    disabled={submittingReview}
                    onClick={() => handleCertificationReview(reviewEngineer, false)}
                  >
                    {submittingReview ? <Loader2 className="w-4 h-4 ml-2 animate-spin" /> : <XCircle className="w-4 h-4 ml-2" />}
                    رفض الاعتماد
                  </Button>
                </div>
                {(!reviewEngineer.graduation_certificate_url || !reviewEngineer.saudi_engineers_council_certificate_url || !reviewEngineer.registration_number) && (
                  <p className="text-xs text-amber-600 text-center">
                    لا يمكن الاعتماد دون استكمال رقم القيد ورفع شهادة التخرج وشهادة القيد في الهيئة السعودية للمهندسين
                  </p>
                )}
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
}