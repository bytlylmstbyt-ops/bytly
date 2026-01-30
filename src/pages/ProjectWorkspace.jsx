import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  Loader2, Upload, CheckCircle, Send, Clock, 
  FileText, AlertCircle, Download 
} from "lucide-react";
import { motion } from "framer-motion";
import { sendNotification } from "@/components/notifications/NotificationHelper";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function ProjectWorkspace() {
  const urlParams = new URLSearchParams(window.location.search);
  const projectId = urlParams.get("id");

  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [project, setProject] = useState(null);
  const [client, setClient] = useState(null);
  const [deliverableUrl, setDeliverableUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [newStatus, setNewStatus] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [projectData] = await base44.entities.Project.filter({ id: projectId });
      if (!projectData) {
        console.error("Project not found");
        setLoading(false);
        return;
      }
      
      setProject(projectData);
      setNewStatus(projectData.status);

      const [clientData] = await base44.entities.Client.filter({ id: projectData.client_id });
      setClient(clientData);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setDeliverableUrl(file_url);
    } catch (error) {
      console.error("Error uploading file:", error);
      alert("حدث خطأ في رفع الملف");
    } finally {
      setUploading(false);
    }
  };

  const updateStatus = async () => {
    try {
      await base44.entities.Project.update(projectId, { 
        status: newStatus 
      });

      await sendNotification({
        recipientEmail: client.email,
        title: "تحديث حالة المشروع",
        message: `تم تحديث حالة المشروع: ${project.title}`,
        type: "project_update",
        projectId: projectId,
        priority: "medium"
      });

      alert("تم تحديث حالة المشروع");
      await loadData();
    } catch (error) {
      console.error("Error updating status:", error);
      alert("حدث خطأ في التحديث");
    }
  };

  const submitForReview = async () => {
    if (!deliverableUrl) {
      alert("الرجاء رفع الملف أولاً");
      return;
    }

    try {
      await base44.entities.Project.update(projectId, {
        status: "awaiting_technical_review",
        final_deliverable_url: deliverableUrl
      });

      await sendNotification({
        recipientEmail: client.email,
        title: "تم رفع التصميم النهائي",
        message: `تم رفع التصميم النهائي لمشروع: ${project.title}`,
        type: "project_update",
        projectId: projectId,
        priority: "high"
      });

      // Notify technical consultant
      if (project.technical_consultant_id) {
        const [consultant] = await base44.entities.Consultant.filter({ 
          id: project.technical_consultant_id 
        });
        if (consultant) {
          await sendNotification({
            recipientEmail: consultant.email,
            title: "مشروع جاهز للمراجعة الفنية",
            message: `مشروع ${project.title} جاهز للمراجعة`,
            type: "review",
            projectId: projectId,
            priority: "high"
          });
        }
      }

      alert("تم إرسال المشروع للمراجعة الفنية");
      await loadData();
    } catch (error) {
      console.error("Error submitting:", error);
      alert("حدث خطأ في الإرسال");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-[#d4a574]" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardContent className="pt-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">المشروع غير موجود</h3>
            <p className="text-slate-600">لم يتم العثور على المشروع المطلوب</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-amber-50/30 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-[#1a1a2e] mb-2">
              مساحة عمل المشروع
            </h1>
            <p className="text-slate-600">{project.title}</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Main Workspace */}
            <div className="md:col-span-2 space-y-6">
              {/* Update Status */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    تحديث حالة المشروع
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>الحالة الحالية</Label>
                    <Select value={newStatus} onValueChange={setNewStatus}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="in_progress">قيد التنفيذ</SelectItem>
                        <SelectItem value="awaiting_technical_review">بانتظار المراجعة الفنية</SelectItem>
                        <SelectItem value="technical_approved">معتمد فنياً</SelectItem>
                        <SelectItem value="pending_client_approval">بانتظار موافقة العميل</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button 
                    onClick={updateStatus}
                    disabled={newStatus === project.status}
                    className="w-full"
                  >
                    <CheckCircle className="w-4 h-4 ml-2" />
                    تحديث الحالة
                  </Button>
                </CardContent>
              </Card>

              {/* Upload Deliverable */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Upload className="w-5 h-5" />
                    رفع التصميم النهائي
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>الملف النهائي</Label>
                    <Input
                      type="file"
                      onChange={handleFileUpload}
                      disabled={uploading}
                      accept=".pdf,.dwg,.zip,.rar"
                    />
                    {uploading && (
                      <p className="text-sm text-slate-500 mt-2">جاري الرفع...</p>
                    )}
                    {deliverableUrl && (
                      <a
                        href={deliverableUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-green-600 hover:underline mt-2 inline-block"
                      >
                        عرض الملف المرفوع
                      </a>
                    )}
                  </div>

                  <div>
                    <Label>ملاحظات إضافية</Label>
                    <Textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="أضف أي ملاحظات للعميل..."
                      rows={4}
                    />
                  </div>

                  <Button
                    onClick={submitForReview}
                    disabled={!deliverableUrl || uploading}
                    className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white"
                  >
                    <Send className="w-4 h-4 ml-2" />
                    إرسال للمراجعة الفنية
                  </Button>
                </CardContent>
              </Card>

              {/* Current Deliverable */}
              {project.final_deliverable_url && (
                <Card className="border-green-300 bg-green-50/30">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-green-600" />
                      الملف الحالي
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <a
                      href={project.final_deliverable_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-green-600 hover:underline"
                    >
                      <Download className="w-4 h-4" />
                      تحميل الملف النهائي
                    </a>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Project Info */}
              <Card>
                <CardHeader>
                  <CardTitle>معلومات المشروع</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-xs text-slate-500">الحالة</p>
                    <Badge className="mt-1">
                      {project.status === "in_progress" && "قيد التنفيذ"}
                      {project.status === "awaiting_technical_review" && "بانتظار المراجعة"}
                      {project.status === "technical_approved" && "معتمد فنياً"}
                      {project.status === "pending_client_approval" && "بانتظار موافقة العميل"}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">المبلغ المحجوز</p>
                    <p className="font-semibold text-green-600">
                      {project.escrow_amount?.toLocaleString('ar-SA')} ريال
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">التعديلات المتبقية</p>
                    <p className="font-semibold">
                      {(project.max_revisions || 3) - (project.revisions_count || 0)} تعديلات
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">تاريخ التسليم</p>
                    <p className="font-semibold">
                      {project.deadline || "غير محدد"}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Tips */}
              <Card className="border-blue-200 bg-blue-50/30">
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-blue-600" />
                    نصائح
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="text-xs text-blue-800 space-y-2">
                    <li>• تأكد من جودة التصميم قبل الرفع</li>
                    <li>• ارفع الملفات بصيغة PDF أو DWG</li>
                    <li>• أضف ملاحظات واضحة للعميل</li>
                    <li>• تابع حالة المشروع بانتظام</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}