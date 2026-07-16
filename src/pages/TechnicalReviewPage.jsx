import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import MobileSelect from "@/components/mobile/MobileSelect";
import { 
  FileCheck, Loader2, CheckCircle, AlertCircle, 
  Upload, Download, FileText, Award 
} from "lucide-react";
import QualityCertificate from "@/components/certificates/QualityCertificate";

export default function TechnicalReviewPage() {
  const urlParams = new URLSearchParams(window.location.search);
  const projectId = urlParams.get("projectId");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [project, setProject] = useState(null);
  const [consultant, setConsultant] = useState(null);
  const [existingReview, setExistingReview] = useState(null);
  const [reviewData, setReviewData] = useState({
    compliance_status: "compliant",
    saudi_code_compliance: "",
    implementation_recommendations: "",
    quality_assessment: "",
    technical_notes: "",
    approval_status: "pending"
  });
  const [reportFile, setReportFile] = useState(null);
  const [uploadingFile, setUploadingFile] = useState(false);

  useEffect(() => {
    loadData();
  }, [projectId]);

  const loadData = async () => {
    try {
      const user = await base44.auth.me();
      
      // Load Engineering Consulting Firm
      const firms = await base44.entities.EngineeringFirm.filter({ 
        email: user.email 
      });
      
      // Fallback to old Consultant entity for backward compatibility
      const consultants = await base44.entities.Consultant.filter({ 
        email: user.email 
      });
      
      const consultantData = firms[0] || consultants[0];
      
      if (!consultantData) {
        alert("غير مصرح لك بالوصول. يجب أن تكون شركة هندسية استشارية معتمدة.");
        return;
      }
      
      setConsultant(consultantData);

      // Load project
      const [projectData] = await base44.entities.Project.filter({ id: projectId });
      setProject(projectData);

      // Check for existing review
      const reviews = await base44.entities.TechnicalReview.filter({ 
        project_id: projectId 
      });
      
      if (reviews.length > 0) {
        const review = reviews[0];
        setExistingReview(review);
        setReviewData({
          compliance_status: review.compliance_status || "compliant",
          saudi_code_compliance: review.saudi_code_compliance || "",
          implementation_recommendations: review.implementation_recommendations || "",
          quality_assessment: review.quality_assessment || "",
          technical_notes: review.technical_notes || "",
          approval_status: review.approval_status || "pending"
        });
      }

    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingFile(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setReportFile(file_url);
    } catch (error) {
      console.error("Error uploading file:", error);
      alert("فشل رفع الملف");
    } finally {
      setUploadingFile(false);
    }
  };

  const handleSubmitReview = async () => {
    if (!reviewData.saudi_code_compliance || !reviewData.quality_assessment) {
      alert("يرجى ملء جميع الحقول المطلوبة");
      return;
    }

    setSubmitting(true);

    try {
      const reviewPayload = {
        project_id: project.id,
        consultant_id: consultant.id,
        ...reviewData,
        report_file: reportFile,
        review_date: new Date().toISOString(),
        consultant_fee: 500 // Fixed fee or calculate based on project
      };

      if (existingReview) {
        await base44.entities.TechnicalReview.update(existingReview.id, reviewPayload);
      } else {
        await base44.entities.TechnicalReview.create(reviewPayload);
      }

      // Update project status
      await base44.entities.Project.update(project.id, {
        status: "awaiting_technical_review",
        technical_consultant_id: consultant.id,
        technical_consultant_type: consultant.company_name ? "engineering_firm" : "consultant"
      });

      alert("تم حفظ المراجعة الفنية بنجاح");
      loadData();

    } catch (error) {
      console.error("Error submitting review:", error);
      alert("حدث خطأ أثناء حفظ المراجعة");
    } finally {
      setSubmitting(false);
    }
  };

  const handleApproveProject = async () => {
    if (!reportFile) {
      alert("يرجى رفع التقرير الفني المعتمد أولاً");
      return;
    }

    setSubmitting(true);

    try {
      const reviewPayload = {
        ...reviewData,
        approval_status: "approved",
        report_file: reportFile
      };

      if (existingReview) {
        await base44.entities.TechnicalReview.update(existingReview.id, reviewPayload);
      } else {
        const review = await base44.entities.TechnicalReview.create({
          project_id: project.id,
          consultant_id: consultant.id,
          ...reviewPayload,
          review_date: new Date().toISOString(),
          consultant_fee: 500
        });
        setExistingReview(review);
      }

      // Update project
      await base44.entities.Project.update(project.id, {
        status: "technical_approved",
        technical_review_status: "approved",
        technical_review_date: new Date().toISOString(),
        technical_report_file: reportFile
      });

      alert("تم اعتماد المشروع فنياً بنجاح");
      loadData();

    } catch (error) {
      console.error("Error approving project:", error);
      alert("حدث خطأ أثناء الاعتماد");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-[#d4a574]" />
      </div>
    );
  }

  if (!project || !consultant) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">خطأ</h3>
            <p className="text-slate-600">لم يتم العثور على المشروع</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-green-50/30 py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <Card className="border-t-4 border-t-green-600">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-2xl mb-2 flex items-center gap-2">
                  <FileCheck className="w-6 h-6 text-green-600" />
                  المراجعة الفنية للمشروع
                </CardTitle>
                <p className="text-slate-600">{project.title}</p>
                <p className="text-sm text-slate-500 mt-1">
                  معتمدة من: {consultant?.company_name || consultant?.full_name}
                </p>
              </div>
              <Badge className={
                existingReview?.approval_status === "approved" 
                  ? "bg-green-100 text-green-800" 
                  : "bg-amber-100 text-amber-800"
              }>
                {existingReview?.approval_status === "approved" ? "معتمد" : "قيد المراجعة"}
              </Badge>
            </div>
          </CardHeader>
        </Card>

        {/* Quality Certificate Component - Shows only after approval */}
        {existingReview?.approval_status === "approved" && (
          <QualityCertificate 
            project={project} 
            technicalReview={existingReview}
            consultant={consultant}
          />
        )}

        {/* Review Form */}
        <Card>
          <CardHeader>
            <CardTitle>تفاصيل المراجعة الفنية</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Compliance Status */}
            <div className="space-y-2">
              <Label>حالة المطابقة *</Label>
              <MobileSelect
                value={reviewData.compliance_status}
                onValueChange={(value) => setReviewData({ ...reviewData, compliance_status: value })}
                placeholder="حالة المطابقة"
                label="حالة المطابقة"
                disabled={existingReview?.approval_status === "approved"}
                options={[
                  { value: "compliant", label: "مطابق" },
                  { value: "compliant_with_notes", label: "مطابق مع ملاحظات" },
                  { value: "non_compliant", label: "غير مطابق" },
                ]}
              />
            </div>

            {/* Saudi Code Compliance */}
            <div className="space-y-2">
              <Label>مطابقة الكود السعودي *</Label>
              <Textarea
                value={reviewData.saudi_code_compliance}
                onChange={(e) => setReviewData({ ...reviewData, saudi_code_compliance: e.target.value })}
                placeholder="تفاصيل مطابقة المخططات للكود السعودي والمعايير الوطنية..."
                rows={4}
                disabled={existingReview?.approval_status === "approved"}
              />
            </div>

            {/* Implementation Recommendations */}
            <div className="space-y-2">
              <Label>توصيات التنفيذ</Label>
              <Textarea
                value={reviewData.implementation_recommendations}
                onChange={(e) => setReviewData({ ...reviewData, implementation_recommendations: e.target.value })}
                placeholder="توصيات للتنفيذ على أرض الواقع..."
                rows={3}
                disabled={existingReview?.approval_status === "approved"}
              />
            </div>

            {/* Quality Assessment */}
            <div className="space-y-2">
              <Label>تقييم الجودة *</Label>
              <Textarea
                value={reviewData.quality_assessment}
                onChange={(e) => setReviewData({ ...reviewData, quality_assessment: e.target.value })}
                placeholder="تقييم شامل لجودة المخططات والتصاميم..."
                rows={4}
                disabled={existingReview?.approval_status === "approved"}
              />
            </div>

            {/* Technical Notes */}
            <div className="space-y-2">
              <Label>ملاحظات فنية إضافية</Label>
              <Textarea
                value={reviewData.technical_notes}
                onChange={(e) => setReviewData({ ...reviewData, technical_notes: e.target.value })}
                placeholder="أي ملاحظات فنية أخرى..."
                rows={3}
                disabled={existingReview?.approval_status === "approved"}
              />
            </div>

            {/* Report Upload */}
            <div className="space-y-2">
              <Label>التقرير الفني المعتمد (PDF)</Label>
              <div className="flex gap-2">
                <Input
                  type="file"
                  accept=".pdf"
                  onChange={handleFileUpload}
                  disabled={uploadingFile || existingReview?.approval_status === "approved"}
                />
                {uploadingFile && <Loader2 className="w-5 h-5 animate-spin" />}
              </div>
              {reportFile && (
                <a 
                  href={reportFile} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                >
                  <Download className="w-4 h-4" />
                  عرض التقرير المرفوع
                </a>
              )}
            </div>

            {/* Action Buttons */}
            {existingReview?.approval_status !== "approved" && (
              <div className="flex gap-3 pt-4">
                <Button
                  onClick={handleSubmitReview}
                  disabled={submitting}
                  variant="outline"
                  className="flex-1"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin ml-2" />
                      جاري الحفظ...
                    </>
                  ) : (
                    <>
                      <FileText className="w-4 h-4 ml-2" />
                      حفظ المراجعة
                    </>
                  )}
                </Button>

                <Button
                  onClick={handleApproveProject}
                  disabled={submitting || !reportFile}
                  className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin ml-2" />
                      جاري الاعتماد...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 ml-2" />
                      اعتماد المشروع فنياً
                    </>
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}