import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { 
  Award, Download, Star, CheckCircle, FileText, 
  Home, User, Loader2, Shield, Stamp
} from "lucide-react";
import { motion } from "framer-motion";
import { sendNotification } from "@/components/notifications/NotificationHelper";
import { jsPDF } from "jspdf";

export default function CertificationPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get("id");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [project, setProject] = useState(null);
  const [engineer, setEngineer] = useState(null);
  const [client, setClient] = useState(null);
  const [consultant, setConsultant] = useState(null);
  const [technicalReview, setTechnicalReview] = useState(null);
  
  const [ratings, setRatings] = useState({
    engineerRating: 0,
    consultantRating: 0,
    comment: ""
  });

  useEffect(() => {
    loadData();
  }, [projectId]);

  const loadData = async () => {
    try {
      const user = await base44.auth.me();
      
      // Admin has unrestricted access to view all projects
      const isAdmin = user.role === "admin";
      
      const [projectData] = await base44.entities.Project.filter({ id: projectId });
      if (!projectData) {
        alert("المشروع غير موجود");
        navigate(-1);
        return;
      }

      // Only check project status for non-admin users
      if (!isAdmin) {
        if (projectData.status !== "technical_approved" && projectData.status !== "pending_client_approval") {
          alert("المشروع لم يتم اعتماده بعد");
          navigate(-1);
          return;
        }
      }

      setProject(projectData);

      // Load engineer
      const [engineerData] = await base44.entities.Engineer.filter({ 
        id: projectData.assigned_engineer_id 
      });
      setEngineer(engineerData);

      // Load client
      const [clientData] = await base44.entities.Client.filter({ 
        id: projectData.client_id 
      });
      setClient(clientData);

      // Load consultant
      if (projectData.technical_consultant_id) {
        const [consultantData] = await base44.entities.Consultant.filter({ 
          id: projectData.technical_consultant_id 
        });
        setConsultant(consultantData);
      }

      // Load technical review
      const reviews = await base44.entities.TechnicalReview.filter({ 
        project_id: projectId 
      });
      if (reviews.length > 0) {
        setTechnicalReview(reviews[0]);
      }

    } catch (error) {
      console.error("Error loading data:", error);
      alert("حدث خطأ في تحميل البيانات");
    } finally {
      setLoading(false);
    }
  };

  const handleStarClick = (type, value) => {
    setRatings({ ...ratings, [type]: value });
  };

  const generateCertificatePDF = () => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // Set RTL for Arabic
    doc.setR2L(true);

    // Header - Gold Border
    doc.setDrawColor(201, 166, 107);
    doc.setLineWidth(3);
    doc.rect(10, 10, 190, 277);
    
    doc.setLineWidth(1);
    doc.rect(15, 15, 180, 267);

    // Logo placeholder circle
    doc.setFillColor(201, 166, 107);
    doc.circle(105, 40, 15, 'F');
    doc.setFillColor(255, 255, 255);
    doc.circle(105, 40, 12, 'F');

    // Title
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('شهادة مطابقة واعتماد جودة', 105, 70, { align: 'center' });

    doc.setFontSize(16);
    doc.setTextColor(107, 93, 79);
    doc.text('منصة بيتلي للاستشارات والتصاميم الهندسية', 105, 80, { align: 'center' });

    // Divider
    doc.setDrawColor(201, 166, 107);
    doc.setLineWidth(0.5);
    doc.line(30, 90, 180, 90);

    // Certificate Body
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');

    const bodyText = `تشهد منصة (بيتلي) وبناءً على المراجعة الفنية الدقيقة والمستقلة التي قام بها المستشار الفني المختص،`;
    const bodyText2 = `بأن المشروع رقم (${projectId}) والمقدم من المصمم (${engineer?.full_name || 'غير محدد'})`;
    const bodyText3 = `لصالح العميل (${client?.full_name || 'غير محدد'})، قد اجتاز كافة معايير الجودة المعتمدة في المنصة.`;

    doc.text(bodyText, 105, 105, { align: 'center', maxWidth: 160 });
    doc.text(bodyText2, 105, 115, { align: 'center', maxWidth: 160 });
    doc.text(bodyText3, 105, 125, { align: 'center', maxWidth: 160 });

    // Technical Section
    doc.setFillColor(245, 245, 245);
    doc.rect(25, 140, 160, 80, 'F');

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(107, 93, 79);
    doc.text('البنود الفنية والقانونية', 105, 150, { align: 'center' });

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    
    doc.text('• المطابقة الفنية:', 175, 160, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.text('تم التأكد من سلامة المخططات وموافقتها للمعايير الهندسية المطلوبة.', 170, 167, { align: 'right', maxWidth: 135 });

    doc.setFont('helvetica', 'bold');
    doc.text('• حقوق الملكية:', 175, 180, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.text('تنتقل ملكية كافة التصاميم والمخططات المرفقة للعميل فور صدور هذه الشهادة.', 170, 187, { align: 'right', maxWidth: 135 });

    doc.setFont('helvetica', 'bold');
    doc.text('• التوثيق:', 175, 200, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.text('تعتبر هذه الشهادة وثيقة رسمية صادرة عن النظام الإلكتروني لبيتلي ومسجلة في قاعدة البيانات.', 170, 207, { align: 'right', maxWidth: 135 });

    // Footer Section
    doc.setDrawColor(201, 166, 107);
    doc.line(30, 235, 180, 235);

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(107, 93, 79);
    doc.text(`يُعتمد من قبل: ${consultant?.full_name || 'المستشار الفني'}`, 105, 245, { align: 'center' });
    doc.text('تحت إشراف: إدارة منصة بيتلي', 105, 252, { align: 'center' });

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`التاريخ: ${new Date().toLocaleDateString('ar-SA', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })}`, 105, 260, { align: 'center' });

    // Electronic Stamp
    doc.setDrawColor(201, 166, 107);
    doc.setLineWidth(2);
    doc.circle(105, 275, 8);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('ختم إلكتروني', 105, 275, { align: 'center' });
    doc.text('بيتلي', 105, 280, { align: 'center' });

    // Save PDF
    doc.save(`شهادة_جودة_${projectId}.pdf`);
  };

  const handleSubmitRating = async () => {
    if (ratings.engineerRating === 0) {
      alert("يرجى تقييم المصمم");
      return;
    }
    if (ratings.consultantRating === 0) {
      alert("يرجى تقييم المستشار الفني");
      return;
    }

    setSubmitting(true);

    try {
      // 1. Create review for engineer
      await base44.entities.Review.create({
        engineer_id: project.assigned_engineer_id,
        client_id: project.client_id,
        project_id: projectId,
        rating: ratings.engineerRating,
        comment: ratings.comment,
        quality_rating: ratings.engineerRating,
        communication_rating: ratings.engineerRating,
        delivery_rating: ratings.engineerRating
      });

      // 2. Update engineer stats
      const allReviews = await base44.entities.Review.filter({ 
        engineer_id: project.assigned_engineer_id 
      });
      const totalRating = allReviews.reduce((sum, r) => sum + r.rating, 0) + ratings.engineerRating;
      const avgRating = totalRating / (allReviews.length + 1);

      await base44.entities.Engineer.update(project.assigned_engineer_id, {
        rating: avgRating,
        total_reviews: allReviews.length + 1,
        completed_projects: (engineer.completed_projects || 0) + 1
      });

      // 3. Release payment to engineer
      await base44.entities.Engineer.update(project.assigned_engineer_id, {
        available_balance: (engineer.available_balance || 0) + project.engineer_payment,
        wallet_balance: (engineer.wallet_balance || 0) + project.engineer_payment
      });

      // 4. Pay technical consultant
      if (project.technical_consultant_id && consultant) {
        await base44.entities.Consultant.update(project.technical_consultant_id, {
          wallet_balance: (consultant.wallet_balance || 0) + project.technical_consultant_fee
        });
        
        await sendNotification({
          recipientEmail: consultant.email,
          title: "تم إضافة أتعابك",
          message: `تم إضافة ${project.technical_consultant_fee.toLocaleString('ar-SA')} ريال لمحفظتك من مشروع: ${project.title}`,
          type: "payment",
          projectId: projectId,
          priority: "high"
        });
      }

      // 5. Pay legal consultant
      if (project.legal_consultant_id) {
        const legalConsultants = await base44.entities.LegalConsultant.filter({ 
          id: project.legal_consultant_id 
        });
        if (legalConsultants.length > 0) {
          await base44.entities.LegalConsultant.update(project.legal_consultant_id, {
            wallet_balance: (legalConsultants[0].wallet_balance || 0) + project.legal_consultant_fee
          });
          
          await sendNotification({
            recipientEmail: legalConsultants[0].email,
            title: "تم إضافة أتعابك",
            message: `تم إضافة ${project.legal_consultant_fee.toLocaleString('ar-SA')} ريال لمحفظتك من مشروع: ${project.title}`,
            type: "payment",
            projectId: projectId,
            priority: "high"
          });
        }
      }

      // 6. Update project status
      await base44.entities.Project.update(projectId, {
        status: "completed",
        payment_status: "completed",
        escrow_status: "released",
        client_final_approval: true,
        client_approval_date: new Date().toISOString()
      });

      // 7. Create transactions
      await base44.entities.Transaction.create({
        user_id: engineer.email,
        type: "escrow_release",
        amount: project.engineer_payment,
        status: "completed",
        description: `استلام دفعة مشروع: ${project.title}`,
        project_id: projectId
      });

      // 8. Notify all parties
      await sendNotification({
        recipientEmail: engineer.email,
        title: "تم إتمام المشروع!",
        message: `تم تحرير ${project.engineer_payment.toLocaleString('ar-SA')} ريال لمحفظتك. تقييم العميل: ${ratings.engineerRating} نجوم`,
        type: "payment",
        projectId: projectId,
        priority: "high"
      });

      await sendNotification({
        recipientEmail: "bytlylmstbyt@gmail.com",
        title: "مشروع مكتمل بنجاح",
        message: `تم إتمام مشروع: ${project.title}. تقييم ${ratings.engineerRating} نجوم`,
        type: "project_update",
        projectId: projectId,
        priority: "medium"
      });

      alert("شكراً لك! تم إتمام المشروع بنجاح وتحرير المبالغ للجميع.");
      navigate("/");

    } catch (error) {
      console.error("Error submitting rating:", error);
      alert("حدث خطأ أثناء إتمام التقييم");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-[#C9A66B]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-green-50/30 py-8 px-4" dir="rtl">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Certificate Header */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] rounded-2xl p-8 text-white shadow-2xl border-4 border-[#C9A66B]"
        >
          <div className="text-center space-y-4">
            {/* Logo */}
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-white/20 to-[#C9A66B] flex items-center justify-center border-4 border-white/30">
                <Home className="w-10 h-10 text-white" />
              </div>
            </div>

            <h1 className="text-4xl font-bold">شهادة اعتماد فني</h1>
            <p className="text-xl text-[#C9A66B]">منصة بيتلي - لمسة بيت</p>
            
            <div className="h-px bg-gradient-to-r from-transparent via-[#C9A66B] to-transparent my-6"></div>

            <div className="grid md:grid-cols-3 gap-6 text-center">
              <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
                <User className="w-8 h-8 mx-auto mb-2 text-[#C9A66B]" />
                <p className="text-sm text-slate-300">العميل</p>
                <p className="font-bold">{client?.full_name}</p>
              </div>
              <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
                <Award className="w-8 h-8 mx-auto mb-2 text-[#C9A66B]" />
                <p className="text-sm text-slate-300">المصمم المعتمد</p>
                <p className="font-bold">{engineer?.full_name}</p>
              </div>
              <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
                <Shield className="w-8 h-8 mx-auto mb-2 text-[#C9A66B]" />
                <p className="text-sm text-slate-300">المستشار الفني</p>
                <p className="font-bold">{consultant?.full_name || "معتمد"}</p>
              </div>
            </div>

            <div className="mt-6 bg-green-500/20 border-2 border-green-400 rounded-lg p-4 inline-block">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-8 h-8 text-green-400" />
                <div className="text-right">
                  <p className="font-bold text-lg">مشروع: {project?.title}</p>
                  <p className="text-sm text-green-300">تم اعتماده بنجاح في {new Date().toLocaleDateString('ar-SA')}</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Technical Compliance Report */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-2 border-[#C9A66B]/30">
            <CardHeader className="bg-gradient-to-r from-amber-50 to-green-50">
              <CardTitle className="flex items-center gap-2 text-2xl">
                <Stamp className="w-6 h-6 text-[#C9A66B]" />
                تقرير المطابقة الهندسية
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              {technicalReview ? (
                <>
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Badge className={
                        technicalReview.compliance_status === "compliant" 
                          ? "bg-green-100 text-green-800"
                          : "bg-amber-100 text-amber-800"
                      }>
                        {technicalReview.compliance_status === "compliant" 
                          ? "✓ مطابق للمواصفات"
                          : "✓ مطابق مع ملاحظات"}
                      </Badge>
                    </div>
                    
                    <div className="space-y-4 bg-slate-50 rounded-lg p-4">
                      <div>
                        <h4 className="font-semibold text-[#1a1a2e] mb-2">📋 الكود السعودي والمعايير الوطنية:</h4>
                        <p className="text-slate-700 leading-relaxed">{technicalReview.saudi_code_compliance}</p>
                      </div>
                      
                      <div className="border-t pt-4">
                        <h4 className="font-semibold text-[#1a1a2e] mb-2">🔧 توصيات التنفيذ:</h4>
                        <p className="text-slate-700 leading-relaxed">{technicalReview.implementation_recommendations}</p>
                      </div>

                      {technicalReview.quality_assessment && (
                        <div className="border-t pt-4">
                          <h4 className="font-semibold text-[#1a1a2e] mb-2">⭐ تقييم الجودة:</h4>
                          <p className="text-slate-700 leading-relaxed">{technicalReview.quality_assessment}</p>
                        </div>
                      )}

                      {technicalReview.technical_notes && (
                        <div className="border-t pt-4">
                          <h4 className="font-semibold text-[#1a1a2e] mb-2">📝 ملاحظات فنية إضافية:</h4>
                          <p className="text-slate-700 leading-relaxed">{technicalReview.technical_notes}</p>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 flex items-center gap-2 text-sm text-slate-600">
                      <Stamp className="w-5 h-5 text-[#C9A66B]" />
                      <span>تم الاعتماد بواسطة: {consultant?.full_name}</span>
                      <span className="mr-auto">{new Date(technicalReview.review_date).toLocaleDateString('ar-SA')}</span>
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-center text-slate-500">لا يوجد تقرير مطابقة متاح</p>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Download Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid md:grid-cols-2 gap-4"
        >
          <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 border-blue-200 hover:border-blue-400">
            <CardContent className="pt-6">
              <a 
                href={project?.final_deliverable_url || technicalReview?.report_file} 
                download 
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 mx-auto bg-blue-100 rounded-full flex items-center justify-center">
                    <FileText className="w-8 h-8 text-blue-600" />
                  </div>
                  <h3 className="font-bold text-lg">تحميل المخططات النهائية</h3>
                  <p className="text-sm text-slate-600">ملفات التصميم الأصلية المعتمدة</p>
                  <Button className="bg-blue-600 hover:bg-blue-700 w-full">
                    <Download className="w-5 h-5 ml-2" />
                    تحميل الآن
                  </Button>
                </div>
              </a>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 border-green-200 hover:border-green-400">
            <CardContent className="pt-6">
              <div onClick={generateCertificatePDF} className="block cursor-pointer">
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center">
                    <Award className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="font-bold text-lg">تحميل شهادة الجودة</h3>
                  <p className="text-sm text-slate-600">وثيقة رسمية من منصة بيتلي</p>
                  <Button className="bg-green-600 hover:bg-green-700 w-full">
                    <Download className="w-5 h-5 ml-2" />
                    تحميل الآن
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Rating Form */}
        {!project?.client_final_approval && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="border-2 border-purple-200">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
                <CardTitle className="flex items-center gap-2">
                  <Star className="w-6 h-6 text-yellow-500" />
                  تقييم المشروع
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                {/* Engineer Rating */}
                <div>
                  <label className="font-semibold text-[#1a1a2e] mb-3 block">
                    تقييم المصمم: {engineer?.full_name}
                  </label>
                  <div className="flex gap-2 justify-center">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => handleStarClick("engineerRating", star)}
                        className="transition-transform hover:scale-110"
                      >
                        <Star
                          className={`w-12 h-12 ${
                            star <= ratings.engineerRating
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-slate-300"
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Consultant Rating */}
                <div className="pt-4 border-t">
                  <label className="font-semibold text-[#1a1a2e] mb-3 block">
                    تقييم المستشار الفني: {consultant?.full_name}
                  </label>
                  <div className="flex gap-2 justify-center">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => handleStarClick("consultantRating", star)}
                        className="transition-transform hover:scale-110"
                      >
                        <Star
                          className={`w-12 h-12 ${
                            star <= ratings.consultantRating
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-slate-300"
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Comment */}
                <div className="pt-4 border-t">
                  <label className="font-semibold text-[#1a1a2e] mb-2 block">
                    تعليق (اختياري)
                  </label>
                  <Textarea
                    value={ratings.comment}
                    onChange={(e) => setRatings({ ...ratings, comment: e.target.value })}
                    placeholder="شاركنا تجربتك مع المشروع..."
                    rows={4}
                  />
                </div>

                {/* Submit Button */}
                <Button
                  onClick={handleSubmitRating}
                  disabled={submitting}
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-6 text-lg"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-6 h-6 animate-spin ml-2" />
                      جاري الإرسال...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-6 h-6 ml-2" />
                      إرسال التقييم وإتمام المشروع
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}