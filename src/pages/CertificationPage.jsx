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
import html2canvas from "html2canvas";

export default function CertificationPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get("id");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [downloading, setDownloading] = useState(false);
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

  const generateCertificatePDF = async () => {
    setDownloading(true);
    try {
      const arMonths = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
      const d = new Date();
      const dateStr = `${d.getDate()} ${arMonths[d.getMonth()]} ${d.getFullYear()}`;
      const safeId = (projectId || project?.id || 'BYTLY').toString();
      const certNumber = `CERT-${safeId.slice(0, 8).toUpperCase()}`;

      // نبني الشهادة كعنصر HTML (المتصفح يشكّل العربية بشكل صحيح) ثم نلتقطها صورة
      const cert = document.createElement('div');
      cert.dir = 'rtl';
      cert.lang = 'ar';
      cert.style.cssText = 'width:800px;background:#ffffff;padding:0;font-family:Tahoma,"Segoe UI",Arial,sans-serif;box-sizing:border-box;position:fixed;left:-10000px;top:0;';
      cert.innerHTML = `
        <div style="border:4px solid #C9A66B;padding:14px;border-radius:10px;background:#fff;">
          <div style="border:1px solid #C9A66B;padding:40px 44px;border-radius:6px;position:relative;background:#FBF8F3;">
            <!-- زخارف الزوايا الذهبية -->
            <div style="position:absolute;top:14px;right:14px;width:34px;height:34px;border-top:2px solid #C9A66B;border-right:2px solid #C9A66B;border-top-right-radius:8px;"></div>
            <div style="position:absolute;top:14px;left:14px;width:34px;height:34px;border-top:2px solid #C9A66B;border-left:2px solid #C9A66B;border-top-left-radius:8px;"></div>
            <div style="position:absolute;bottom:14px;right:14px;width:34px;height:34px;border-bottom:2px solid #C9A66B;border-right:2px solid #C9A66B;border-bottom-right-radius:8px;"></div>
            <div style="position:absolute;bottom:14px;left:14px;width:34px;height:34px;border-bottom:2px solid #C9A66B;border-left:2px solid #C9A66B;border-bottom-left-radius:8px;"></div>

            <!-- شعار المنصة -->
            <div style="display:flex;flex-direction:column;align-items:center;gap:6px;margin-bottom:16px;">
              <div style="width:68px;height:68px;border-radius:16px;background:linear-gradient(to top,#A89178,#6B5D4F);display:flex;align-items:center;justify-content:center;box-shadow:0 5px 14px rgba(107,93,79,0.28);">
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9.5L12 3l9 6.5"/><path d="M5 10v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V10"/><path d="M9 21V12h6v9"/></svg>
              </div>
              <span style="font-weight:600;font-size:13px;color:#4A3F35;letter-spacing:2px;font-family:system-ui,sans-serif;">BYTLY</span>
            </div>

            <!-- العنوان -->
            <h1 style="text-align:center;font-size:31px;color:#4A3F35;margin:0 0 4px;font-weight:bold;">شهادة اعتماد ومطابقة الجودة</h1>
            <p style="text-align:center;font-size:15px;color:#8C7256;margin:0 0 14px;font-weight:500;word-spacing:1px;">منصة بيتلي للخدمات والاستشارات الهندسية</p>

            <!-- فاصل ذهبي بماسة -->
            <div style="display:flex;align-items:center;justify-content:center;gap:8px;margin:0 0 16px;">
              <div style="height:1px;width:120px;background:#C9A66B;"></div>
              <div style="width:8px;height:8px;background:#C9A66B;transform:rotate(45deg);"></div>
              <div style="height:1px;width:120px;background:#C9A66B;"></div>
            </div>

            <!-- شارة رقم الشهادة -->
            <div style="text-align:center;margin:0 0 18px;">
              <span style="display:inline-block;border:1px solid #C9A66B;border-radius:20px;padding:5px 16px;font-size:12px;color:#6B5D4F;background:#fff;">رقم الشهادة: ${certNumber}</span>
            </div>

            <!-- نص الإشهاد -->
            <p style="font-size:15px;line-height:2;text-align:justify;margin:0 0 18px;color:#1a1a2e;">
              تشهد منصة بيتلي، وبناءً على الصلاحيات الممنوحة لها كمكتب استشاري معتمد، بأن المخططات النهائية والرسومات التنفيذية للمشروع الموضّح أدناه قد تمت مراجعتها وفحصها فنياً، وثبت مطابقتها للمعايير الهندسية والإنشائية المعتمدة.
            </p>

            <!-- لوغة تفاصيل المشروع -->
            <div style="background:#fff;border:1px solid #C9A66B;border-radius:8px;overflow:hidden;margin:0 0 18px;">
              <div style="background:linear-gradient(to left,#6B5D4F,#4A3F35);color:#fff;padding:8px 18px;font-size:13px;font-weight:bold;letter-spacing:0.5px;">تفاصيل المشروع</div>
              <div style="padding:6px 18px;">
                <div style="display:flex;justify-content:space-between;align-items:center;padding:9px 0;font-size:14px;border-bottom:1px solid #E8DDC9;"><span style="color:#6B5D4F;font-weight:bold;">اسم المشروع</span><span style="color:#1a1a2e;">${project?.title || '—'}</span></div>
                <div style="display:flex;justify-content:space-between;align-items:center;padding:9px 0;font-size:14px;border-bottom:1px solid #E8DDC9;"><span style="color:#6B5D4F;font-weight:bold;">العميل</span><span style="color:#1a1a2e;">${client?.full_name || '—'}</span></div>
                <div style="display:flex;justify-content:space-between;align-items:center;padding:9px 0;font-size:14px;border-bottom:1px solid #E8DDC9;"><span style="color:#6B5D4F;font-weight:bold;">المصمم / المهندس</span><span style="color:#1a1a2e;">${engineer?.full_name || '—'}</span></div>
                <div style="display:flex;justify-content:space-between;align-items:center;padding:9px 0;font-size:14px;"><span style="color:#6B5D4F;font-weight:bold;">المستشار الفني</span><span style="color:#1a1a2e;">${consultant?.full_name || '—'}</span></div>
              </div>
            </div>

            <!-- بنود التأكيد -->
            <p style="font-size:15px;font-weight:bold;color:#4A3F35;margin:0 0 10px;">ونؤكد بموجب هذه الشهادة ما يلي:</p>
            <div style="font-size:14px;line-height:1.9;margin:0 0 22px;color:#1a1a2e;">
              <div style="display:flex;gap:8px;padding:5px 0;"><span style="color:#C9A66B;font-weight:bold;flex-shrink:0;">◆</span><span><span style="font-weight:bold;color:#6B5D4F;">المطابقة الفنية: </span>المخططات مطابقة بالكامل للمعايير الهندسية والإنشائية المعتمدة.</span></div>
              <div style="display:flex;gap:8px;padding:5px 0;"><span style="color:#C9A66B;font-weight:bold;flex-shrink:0;">◆</span><span><span style="font-weight:bold;color:#6B5D4F;">دقة التنفيذ: </span>تم فحص جميع الرسومات التنفيذية والتأكد من خلوها من الأخطاء الفنية.</span></div>
              <div style="display:flex;gap:8px;padding:5px 0;"><span style="color:#C9A66B;font-weight:bold;flex-shrink:0;">◆</span><span><span style="font-weight:bold;color:#6B5D4F;">الجاهزية للتسليم: </span>المشروع جاهز للتسليم النهائي ويحقق متطلبات العميل المسجلة على المنصة.</span></div>
            </div>

            <!-- التوقيعات والختم -->
            <div style="display:flex;justify-content:space-between;align-items:flex-end;gap:20px;margin-top:20px;">
              <div style="flex:1;text-align:center;">
                <div style="border-top:1px solid #6B5D4F;margin:0 10px 6px;"></div>
                <p style="font-size:12px;font-weight:bold;color:#4A3F35;margin:0;">${consultant?.full_name || 'المستشار الفني'}</p>
                <p style="font-size:11px;color:#999;margin:2px 0 0;">المستشار المعتمد — رقم التسجيل: ${consultant?.engineers_society_membership_number || '—'}</p>
              </div>
              <div style="width:96px;text-align:center;flex-shrink:0;">
                <div style="width:90px;height:90px;border:2px solid #C9A66B;border-radius:50%;margin:0 auto;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#4A3F35;position:relative;">
                  <div style="position:absolute;inset:6px;border:1px solid #C9A66B;border-radius:50%;"></div>
                  <span style="font-weight:bold;font-size:14px;">بيتلي</span>
                  <span style="font-size:8px;margin-top:1px;">ختم إلكتروني</span>
                </div>
              </div>
              <div style="flex:1;text-align:center;">
                <div style="border-top:1px solid #6B5D4F;margin:0 10px 6px;"></div>
                <p style="font-size:12px;font-weight:bold;color:#4A3F35;margin:0;">${dateStr}</p>
                <p style="font-size:11px;color:#999;margin:2px 0 0;">تاريخ الاعتماد</p>
              </div>
            </div>

            <!-- إشعار قانوني -->
            <div style="border-top:1px solid #C9A66B;margin-top:20px;padding-top:10px;">
              <p style="font-size:10px;color:#777;line-height:1.6;text-align:justify;margin:0;">
                تصدر هذه الشهادة إلكترونياً عبر منصة بيتلي وتتمتع بكامل الصفة القانونية. تعمل المنصة كوسيط لضمان حقوق الطرفين ولا تتحمل مسؤولية تنفيذ بنود العقد. للاستفسار: bytlylmstbyt@gmail.com
              </p>
            </div>
          </div>
        </div>
      `;
      document.body.appendChild(cert);
      const canvas = await html2canvas(cert, { scale: 2, backgroundColor: '#ffffff', useCORS: true, logging: false });
      document.body.removeChild(cert);

      // ندرج الصورة في PDF بحجم A4 مع الحفاظ على نسبة الأبعاد
      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const imgRatio = canvas.width / canvas.height;
      const a4Ratio = 210 / 297;
      let renderW, renderH;
      if (imgRatio > a4Ratio) {
        renderW = 210; renderH = 210 / imgRatio;
      } else {
        renderH = 297; renderW = 297 * imgRatio;
      }
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      doc.addImage(imgData, 'JPEG', (210 - renderW) / 2, (297 - renderH) / 2, renderW, renderH);
      doc.save(`شهادة_جودة_${safeId.slice(0, 8)}.pdf`);
    } catch (error) {
      console.error("Error generating certificate:", error);
      alert("حدث خطأ أثناء إنشاء الشهادة");
    } finally {
      setDownloading(false);
    }
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
              <div onClick={downloading ? undefined : generateCertificatePDF} className={`block ${downloading ? 'cursor-wait' : 'cursor-pointer'}`}>
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center">
                    {downloading ? <Loader2 className="w-8 h-8 text-green-600 animate-spin" /> : <Award className="w-8 h-8 text-green-600" />}
                  </div>
                  <h3 className="font-bold text-lg">تحميل شهادة الجودة</h3>
                  <p className="text-sm text-slate-600">وثيقة رسمية من منصة بيتلي</p>
                  <Button className="bg-green-600 hover:bg-green-700 w-full" disabled={downloading}>
                    {downloading ? (
                      <>
                        <Loader2 className="w-5 h-5 ml-2 animate-spin" />
                        جاري تجهيز الشهادة...
                      </>
                    ) : (
                      <>
                        <Download className="w-5 h-5 ml-2" />
                        تحميل الآن
                      </>
                    )}
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