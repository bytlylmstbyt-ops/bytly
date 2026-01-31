import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, Upload, FileText, Loader2, ShieldAlert } from "lucide-react";
import { toast } from "sonner";

export default function FileDispute() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  
  const [formData, setFormData] = useState({
    project_id: "",
    dispute_type: "",
    title: "",
    description: "",
    priority: "medium",
    evidence_files: []
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const currentUser = await base44.auth.me();
    setUser(currentUser);

    // Load user's projects
    const allProjects = await base44.entities.Project.list();
    const userProjects = allProjects.filter(
      p => p.client_email === currentUser.email || p.assigned_engineer_email === currentUser.email
    );
    setProjects(userProjects);
    setIsLoading(false);
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    setUploadingFile(true);
    
    const uploadedUrls = [];
    for (const file of files) {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      uploadedUrls.push(file_url);
    }
    
    setFormData(prev => ({
      ...prev,
      evidence_files: [...prev.evidence_files, ...uploadedUrls]
    }));
    setUploadingFile(false);
    toast.success(`تم رفع ${files.length} ملف`);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.project_id || !formData.dispute_type || !formData.title || !formData.description) {
      toast.error("يرجى ملء جميع الحقول المطلوبة");
      return;
    }

    setIsSubmitting(true);

    // Get project details to find the other party
    const project = projects.find(p => p.id === formData.project_id);
    const raised_against = project.client_email === user.email 
      ? project.assigned_engineer_email 
      : project.client_email;

    await base44.entities.Dispute.create({
      ...formData,
      raised_by: user.email,
      raised_against,
      status: "submitted"
    });

    toast.success("تم تقديم النزاع بنجاح، سيتم مراجعته من قبل الإدارة");
    navigate(createPageUrl("MyDisputes"));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#C9A66B]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-amber-50/30 py-8">
      <div className="max-w-3xl mx-auto px-4">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <ShieldAlert className="w-8 h-8 text-red-600" />
            <h1 className="text-3xl font-bold text-slate-900">تقديم نزاع</h1>
          </div>
          <p className="text-slate-600">نحن هنا لمساعدتك في حل أي مشاكل قد تواجهها</p>
        </div>

        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle>معلومات النزاع</CardTitle>
            <CardDescription>يرجى تقديم تفاصيل دقيقة لمساعدتنا في حل المشكلة</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="project_id">المشروع *</Label>
                <Select
                  value={formData.project_id}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, project_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر المشروع المرتبط" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dispute_type">نوع النزاع *</Label>
                <Select
                  value={formData.dispute_type}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, dispute_type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر نوع النزاع" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="payment_issue">مشكلة دفع</SelectItem>
                    <SelectItem value="quality_issue">مشكلة جودة</SelectItem>
                    <SelectItem value="deadline_issue">مشكلة مواعيد</SelectItem>
                    <SelectItem value="contract_breach">خرق عقد</SelectItem>
                    <SelectItem value="communication_issue">مشكلة تواصل</SelectItem>
                    <SelectItem value="scope_change">تغيير في النطاق</SelectItem>
                    <SelectItem value="other">أخرى</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">الأولوية *</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">منخفضة</SelectItem>
                    <SelectItem value="medium">متوسطة</SelectItem>
                    <SelectItem value="high">عالية</SelectItem>
                    <SelectItem value="urgent">عاجلة</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">عنوان النزاع *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="مثال: تأخر في التسليم بدون مبرر"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">الوصف التفصيلي *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="اشرح المشكلة بالتفصيل..."
                  rows={6}
                />
              </div>

              <div className="space-y-2">
                <Label>الأدلة والمستندات</Label>
                <div className="border-2 border-dashed rounded-lg p-6 text-center">
                  <Upload className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                  <p className="text-sm text-slate-600 mb-2">ارفع الصور أو المستندات الداعمة</p>
                  <input
                    type="file"
                    multiple
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                    disabled={uploadingFile}
                  />
                  <label htmlFor="file-upload">
                    <Button type="button" variant="outline" asChild disabled={uploadingFile}>
                      <span>
                        {uploadingFile ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : null}
                        اختر الملفات
                      </span>
                    </Button>
                  </label>
                </div>
                {formData.evidence_files.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {formData.evidence_files.map((url, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-sm text-slate-600">
                        <FileText className="w-4 h-4" />
                        <span>ملف {idx + 1}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                  <div className="text-sm text-amber-800">
                    <p className="font-medium mb-1">ملاحظة هامة</p>
                    <p>سيتم مراجعة النزاع من قبل فريق الإدارة خلال 24-48 ساعة، وسيتم التواصل معك للوصول إلى حل عادل.</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-gradient-to-r from-[#6B5D4F] to-[#C9A66B] text-white"
                >
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin ml-2" /> : null}
                  تقديم النزاع
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(-1)}
                >
                  إلغاء
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}