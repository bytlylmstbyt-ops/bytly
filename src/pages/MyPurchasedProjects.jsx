import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ShoppingBag, Eye, MessageSquare, CheckCircle, 
  Clock, AlertCircle, FileText, Loader2, Star
} from "lucide-react";
import { motion } from "framer-motion";
import { sendNotification } from "@/components/notifications/NotificationHelper";
import EngineerReviewForm from "@/components/reviews/EngineerReviewForm";

export default function MyPurchasedProjectsPage() {
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState([]);
  const [engineers, setEngineers] = useState({});
  const [user, setUser] = useState(null);
  const [clientId, setClientId] = useState(null);
  const [reviewedProjects, setReviewedProjects] = useState({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const userData = await base44.auth.me();
      setUser(userData);

      // Get client profile
      const clients = await base44.entities.Client.filter({ email: userData.email });
      if (clients.length === 0) return;

      const clientId = clients[0].id;
      setClientId(clientId);

      // Get all projects where client is the owner
      const allProjects = await base44.entities.Project.filter({ 
        client_id: clientId 
      }, "-created_date");

      // Filter only paid projects (escrowed or completed)
      const paidProjects = allProjects.filter(p => 
        p.payment_status === "escrowed" || 
        p.payment_status === "released" || 
        p.payment_status === "completed"
      );

      setProjects(paidProjects);

      // Load engineers
      const engineerIds = [...new Set(paidProjects.map(p => p.assigned_engineer_id).filter(Boolean))];
      const engineersData = await base44.entities.Engineer.list();
      const engMap = {};
      engineersData.forEach(eng => {
        engMap[eng.id] = eng;
      });
      setEngineers(engMap);

      // Check which completed projects already have reviews from this client
      const completedIds = paidProjects
        .filter(p => p.status === "completed")
        .map(p => p.id);
      if (completedIds.length > 0) {
        const allReviews = await base44.entities.Review.filter({ client_id: clientId });
        const reviewedMap = {};
        allReviews.forEach(r => {
          if (r.project_id) reviewedMap[r.project_id] = true;
        });
        setReviewedProjects(reviewedMap);
      }

    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestRevision = async (projectId) => {
    const project = projects.find(p => p.id === projectId);
    
    if (project.revisions_count >= project.max_revisions) {
      alert(`لقد وصلت للحد الأقصى من التعديلات (${project.max_revisions})`);
      return;
    }

    const revisionDescription = prompt("اشرح التعديلات المطلوبة:");
    if (!revisionDescription) return;

    try {
      await base44.entities.ProjectRevision.create({
        project_id: projectId,
        revision_number: project.revisions_count + 1,
        requested_by: user.email,
        description: revisionDescription,
        status: "pending"
      });

      await base44.entities.Project.update(projectId, {
        revisions_count: project.revisions_count + 1
      });

      const engineer = engineers[project.assigned_engineer_id];
      await sendNotification({
        recipientEmail: engineer.email,
        title: "طلب تعديل جديد",
        message: `طلب العميل تعديل رقم ${project.revisions_count + 1} على مشروع: ${project.title}`,
        type: "project_update",
        projectId: projectId,
        priority: "high"
      });

      alert("تم إرسال طلب التعديل للمصمم");
      loadData();
    } catch (error) {
      console.error("Error requesting revision:", error);
      alert("حدث خطأ");
    }
  };

  const handleSubmitForReview = async (projectId) => {
    const project = projects.find(p => p.id === projectId);
    
    try {
      await base44.entities.Project.update(projectId, {
        status: "awaiting_technical_review"
      });

      // Notify technical consultant
      if (project.technical_consultant_id) {
        const consultants = await base44.entities.Consultant.filter({ 
          id: project.technical_consultant_id 
        });
        if (consultants.length > 0) {
          await sendNotification({
            recipientEmail: consultants[0].email,
            title: "مشروع جاهز للمراجعة الفنية",
            message: `المصمم أنهى العمل على مشروع: ${project.title}. جاهز للمراجعة.`,
            type: "review",
            projectId: projectId,
            priority: "high"
          });
        }
      }

      alert("تم إرسال المشروع للمراجعة الفنية");
      loadData();
    } catch (error) {
      console.error("Error submitting for review:", error);
      alert("حدث خطأ");
    }
  };

  const handleFinalApproval = async (projectId) => {
    const confirm = window.confirm("هل أنت متأكد من الموافقة النهائية؟ سيتم تحرير المبلغ للمصمم والمستشارين.");
    if (!confirm) return;

    try {
      const project = projects.find(p => p.id === projectId);
      const engineer = engineers[project.assigned_engineer_id];

      // 1. Release payment to engineer
      await base44.entities.Engineer.update(project.assigned_engineer_id, {
        available_balance: (engineer.available_balance || 0) + project.engineer_payment,
        wallet_balance: (engineer.wallet_balance || 0) + project.engineer_payment
      });

      // 2. Pay technical consultant
      if (project.technical_consultant_id) {
        const consultants = await base44.entities.Consultant.filter({ 
          id: project.technical_consultant_id 
        });
        if (consultants.length > 0) {
          await base44.entities.Consultant.update(project.technical_consultant_id, {
            wallet_balance: (consultants[0].wallet_balance || 0) + project.technical_consultant_fee
          });
          
          await sendNotification({
            recipientEmail: consultants[0].email,
            title: "تم إضافة أتعابك",
            message: `تم إضافة ${project.technical_consultant_fee.toLocaleString('ar-SA')} ريال لمحفظتك`,
            type: "payment",
            priority: "high"
          });
        }
      }

      // 3. Pay legal consultant
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
            message: `تم إضافة ${project.legal_consultant_fee.toLocaleString('ar-SA')} ريال لمحفظتك`,
            type: "payment",
            priority: "high"
          });
        }
      }

      // 4. Update project
      await base44.entities.Project.update(projectId, {
        status: "completed",
        payment_status: "completed",
        escrow_status: "released",
        client_final_approval: true,
        client_approval_date: new Date().toISOString()
      });

      // 5. Create transactions
      await base44.entities.Transaction.create({
        user_id: engineer.email,
        type: "escrow_release",
        amount: project.engineer_payment,
        status: "completed",
        description: `استلام دفعة مشروع: ${project.title}`,
        project_id: projectId
      });

      // 6. Notify engineer
      await sendNotification({
        recipientEmail: engineer.email,
        title: "تم تحرير المبلغ!",
        message: `تم إضافة ${project.engineer_payment.toLocaleString('ar-SA')} ريال لمحفظتك`,
        type: "payment",
        projectId: projectId,
        priority: "high"
      });

      alert("تم إتمام المشروع بنجاح!");
      loadData();
    } catch (error) {
      console.error("Error approving project:", error);
      alert("حدث خطأ");
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      in_progress: { label: "قيد التنفيذ", color: "bg-blue-100 text-blue-800", icon: Clock },
      awaiting_technical_review: { label: "مراجعة فنية", color: "bg-amber-100 text-amber-800", icon: Clock },
      technical_approved: { label: "معتمد فنياً", color: "bg-green-100 text-green-800", icon: CheckCircle },
      pending_client_approval: { label: "بانتظار موافقتك", color: "bg-purple-100 text-purple-800", icon: AlertCircle },
      completed: { label: "مكتمل", color: "bg-slate-100 text-slate-800", icon: CheckCircle },
      disputed: { label: "نزاع", color: "bg-red-100 text-red-800", icon: AlertCircle }
    };
    
    const config = statusMap[status] || statusMap.in_progress;
    const Icon = config.icon;
    
    return (
      <Badge className={config.color}>
        <Icon className="w-3 h-3 ml-1" />
        {config.label}
      </Badge>
    );
  };

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
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-3 mb-6">
            <ShoppingBag className="w-8 h-8 text-[#C9A66B]" />
            <div>
              <h1 className="text-3xl font-bold text-[#1a1a2e]">مشاريعي المشتراة</h1>
              <p className="text-slate-600">تابع حالة مشاريعك والدفعات</p>
            </div>
          </div>
        </motion.div>

        {projects.length === 0 ? (
          <Card>
            <CardContent className="pt-12 pb-12 text-center">
              <ShoppingBag className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">لا توجد مشاريع مشتراة</h3>
              <p className="text-slate-600 mb-4">لم تقم بشراء أي مشروع بعد</p>
              <Link to={createPageUrl("Projects")}>
                <Button>تصفح المشاريع</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {projects.map((project) => {
              const engineer = engineers[project.assigned_engineer_id];
              
              return (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Card className="hover-lift">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-xl font-bold text-[#1a1a2e]">
                              {project.title}
                            </h3>
                            {getStatusBadge(project.status)}
                          </div>
                          <p className="text-slate-600 mb-3">{project.description?.slice(0, 150)}...</p>
                          {engineer && (
                            <div className="flex items-center gap-2 text-sm text-slate-500">
                              <span>المصمم:</span>
                              <span className="font-medium text-[#1a1a2e]">{engineer.full_name}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="grid md:grid-cols-4 gap-4 mb-4 p-4 bg-slate-50 rounded-lg">
                        <div>
                          <p className="text-xs text-slate-500 mb-1">المبلغ المدفوع</p>
                          <p className="font-bold text-[#1a1a2e]">
                            {project.escrow_amount?.toLocaleString('ar-SA')} ريال
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 mb-1">حالة الدفع</p>
                          <Badge variant="outline" className="text-green-600">
                            {project.escrow_status === "held" ? "محجوز" : "محرر"}
                          </Badge>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 mb-1">التعديلات</p>
                          <p className="font-medium">
                            {project.revisions_count || 0} / {project.max_revisions || 3}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 mb-1">تاريخ البدء</p>
                          <p className="font-medium text-sm">
                            {new Date(project.created_date).toLocaleDateString('ar-SA')}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Link to={createPageUrl("ProjectDetails") + `?id=${project.id}`}>
                          <Button variant="outline" size="sm">
                            <Eye className="w-4 h-4 ml-2" />
                            عرض التفاصيل
                          </Button>
                        </Link>
                        
                        <Link to={createPageUrl("Messages") + `?engineer=${project.assigned_engineer_id}`}>
                          <Button variant="outline" size="sm">
                            <MessageSquare className="w-4 h-4 ml-2" />
                            المحادثة
                          </Button>
                        </Link>

                        {project.status === "in_progress" && project.revisions_count < project.max_revisions && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleRequestRevision(project.id)}
                          >
                            <FileText className="w-4 h-4 ml-2" />
                            طلب تعديل
                          </Button>
                        )}

                        {project.status === "technical_approved" && (
                          <Button 
                            size="sm"
                            onClick={() => handleFinalApproval(project.id)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="w-4 h-4 ml-2" />
                            تم الاستلام النهائي
                          </Button>
                        )}

                        {project.status === "completed" && engineer && !reviewedProjects[project.id] && (
                          <EngineerReviewForm
                            engineerId={engineer.id}
                            engineerName={engineer.full_name}
                            clientId={clientId || user.id}
                            clientName={user.full_name || user.email}
                            projectId={project.id}
                            onSubmitted={() => {
                              setReviewedProjects(prev => ({ ...prev, [project.id]: true }));
                              loadData();
                            }}
                            trigger={
                              <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-white">
                                <Star className="w-4 h-4 ml-2" />
                                قيّم المهندس
                              </Button>
                            }
                          />
                        )}

                        {project.status === "completed" && reviewedProjects[project.id] && (
                          <Badge className="bg-green-100 text-green-700">
                            <CheckCircle className="w-3 h-3 ml-1" />
                            تم التقييم
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}