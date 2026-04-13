import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  FileCheck, Clock, CheckCircle, XCircle, 
  Wallet, TrendingUp, AlertCircle, FileText,
  Eye, Filter, Calendar, Download
} from "lucide-react";
import { motion } from "framer-motion";

export default function ConsultantDashboard() {
  const [loading, setLoading] = useState(true);
  const [consultant, setConsultant] = useState(null);
  const [stats, setStats] = useState({
    pending_reviews: 0,
    completed_reviews: 0,
    total_earnings: 0,
    avg_response_time: 0
  });
  const [pendingRequests, setPendingRequests] = useState([]);
  const [completedRequests, setCompletedRequests] = useState([]);
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const user = await base44.auth.me();
      
      // Load consultant profile
      // Allow admin access
      if (user.role === "admin") {
        // Admin can view - use first available consultant for demo
        const allConsultants = await base44.entities.Consultant.filter({ status: "approved" });
        if (allConsultants.length > 0) {
          setConsultant(allConsultants[0]);
        } else {
          // Create dummy consultant for admin view
          setConsultant({
            id: "admin-view",
            full_name: "عرض المدير",
            email: user.email,
            consultant_type: "architectural",
            wallet_balance: 0,
            total_reviews: 0
          });
        }
      } else {
        const consultants = await base44.entities.Consultant.filter({ 
          email: user.email 
        });
        
        if (consultants.length === 0) {
          alert("غير مصرح لك بالوصول لهذه الصفحة");
          return;
        }
        
        const consultantData = consultants[0];
        setConsultant(consultantData);
      }
      
      // Load pending withdrawal requests for review
      const currentConsultant = consultant || (user.role === "admin" ? { id: "admin-view" } : null);
      const allRequests = await base44.entities.WithdrawalRequest.list();
      const pending = allRequests.filter(r => !r.consultant_approval && r.status === "pending");
      const completed = allRequests.filter(r => currentConsultant && r.consultant_id === currentConsultant.id);
      
      setPendingRequests(pending);
      setCompletedRequests(completed);
      
      // Load projects for review
      const allProjects = await base44.entities.Project.list();
      const reviewProjects = allProjects.filter(p => 
        p.status === "pending_approval" || p.status === "in_progress"
      );
      setProjects(reviewProjects);
      
      // Calculate stats
      const totalEarnings = completed.reduce((sum, req) => {
        if (req.consultant_approval) {
          return sum + (req.amount * 0.05);
        }
        return sum;
      }, 0);
      
      setStats({
        pending_reviews: pending.length,
        completed_reviews: completed.length,
        total_earnings: totalEarnings,
        avg_response_time: 0
      });
      
    } catch (error) {
      console.error("Error loading dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const getComplianceStatusBadge = (status) => {
    const statusMap = {
      compliant: { label: "مطابق", color: "bg-green-100 text-green-800", icon: CheckCircle },
      compliant_with_notes: { label: "مطابق مع ملاحظات", color: "bg-amber-100 text-amber-800", icon: AlertCircle },
      rejected: { label: "مرفوض فنياً", color: "bg-red-100 text-red-800", icon: XCircle }
    };
    
    const config = statusMap[status] || { label: "غير محدد", color: "bg-gray-100 text-gray-800", icon: Clock };
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
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#d4a574] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (!consultant) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">غير مصرح</h3>
            <p className="text-slate-600">ليس لديك صلاحية الوصول لهذه الصفحة</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-green-50/30 py-8 px-4" dir="rtl">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
        >
          <div>
            <h1 className="text-3xl font-bold text-[#1a1a2e] mb-2">
              لوحة تحكم المستشار الفني
            </h1>
            <p className="text-slate-600">
              مرحباً {consultant.full_name} - {consultant.consultant_type === "architectural" ? "مستشار معماري" : consultant.consultant_type === "structural" ? "مستشار إنشائي" : "مستشار جرافيك"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge className="bg-green-100 text-green-800 px-4 py-2">
              <CheckCircle className="w-4 h-4 ml-1" />
              مستشار معتمد
            </Badge>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="hover-lift">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
                    <Clock className="w-6 h-6 text-amber-600" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-[#1a1a2e] mb-1">
                  {stats.pending_reviews}
                </p>
                <p className="text-sm text-slate-600">طلبات معلقة</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="hover-lift">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-[#1a1a2e] mb-1">
                  {stats.completed_reviews}
                </p>
                <p className="text-sm text-slate-600">مراجعات مكتملة</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="hover-lift">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                    <Wallet className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-[#1a1a2e] mb-1">
                  {(consultant.wallet_balance || 0).toLocaleString('ar-SA')}
                </p>
                <p className="text-sm text-slate-600">رصيد المحفظة</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="hover-lift">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-[#1a1a2e] mb-1">
                  {stats.total_earnings.toLocaleString('ar-SA')}
                </p>
                <p className="text-sm text-slate-600">إجمالي الأتعاب</p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Main Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Tabs defaultValue="pending" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="pending" className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                طلبات السحب المعلقة ({pendingRequests.length})
              </TabsTrigger>
              <TabsTrigger value="completed" className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                المراجعات المكتملة
              </TabsTrigger>
              <TabsTrigger value="projects" className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                المشاريع تحت المراجعة
              </TabsTrigger>
            </TabsList>

            {/* Pending Requests */}
            <TabsContent value="pending">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileCheck className="w-5 h-5 text-amber-600" />
                    طلبات السحب التي تحتاج مراجعة فنية
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {pendingRequests.length === 0 ? (
                    <div className="text-center py-12">
                      <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">لا توجد طلبات معلقة</h3>
                      <p className="text-slate-600">جميع الطلبات تمت مراجعتها</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {pendingRequests.map((request) => (
                        <div
                          key={request.id}
                          className="p-4 rounded-lg border hover:border-[#d4a574] transition-colors"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#1a1a2e] to-[#d4a574] flex items-center justify-center text-white font-bold">
                                  {request.engineer_id?.slice(0, 2).toUpperCase()}
                                </div>
                                <div>
                                  <p className="font-semibold text-slate-900">
                                    طلب سحب #{request.id.slice(0, 8)}
                                  </p>
                                  <p className="text-sm text-slate-500">
                                    تاريخ الطلب: {new Date(request.created_date).toLocaleDateString('ar-SA')}
                                  </p>
                                </div>
                              </div>

                              <div className="grid md:grid-cols-3 gap-4 mb-3">
                                <div>
                                  <p className="text-sm text-slate-500">المبلغ المطلوب</p>
                                  <p className="font-bold text-lg text-[#1a1a2e]">
                                    {request.amount.toLocaleString('ar-SA')} ريال
                                  </p>
                                </div>
                                <div>
                                  <p className="text-sm text-slate-500">أتعاب المراجعة (5%)</p>
                                  <p className="font-bold text-green-600">
                                    {(request.amount * 0.05).toLocaleString('ar-SA')} ريال
                                  </p>
                                </div>
                                <div>
                                  <p className="text-sm text-slate-500">الحالة</p>
                                  <Badge className="bg-amber-100 text-amber-800">
                                    <Clock className="w-3 h-3 ml-1" />
                                    بانتظار المراجعة
                                  </Badge>
                                </div>
                              </div>

                              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 mb-3">
                                <p className="text-sm text-blue-900 font-medium mb-1">
                                  ⚠️ مسؤوليتك كمستشار:
                                </p>
                                <ul className="text-xs text-blue-800 space-y-1 mr-4">
                                  <li>• مراجعة مطابقة التصميم للكود السعودي</li>
                                  <li>• التأكد من الجدوى التنفيذية للمخططات</li>
                                  <li>• كتابة تقرير فني شامل للعميل</li>
                                </ul>
                              </div>
                            </div>

                            <Link to={createPageUrl("ConsultantApproval") + `?id=${request.id}`}>
                              <Button className="bg-gradient-to-r from-green-600 to-emerald-600">
                                <FileCheck className="w-4 h-4 ml-2" />
                                بدء المراجعة
                              </Button>
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Completed Reviews */}
            <TabsContent value="completed">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    المراجعات المكتملة
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {completedRequests.length === 0 ? (
                    <div className="text-center py-12">
                      <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">لا توجد مراجعات مكتملة</h3>
                      <p className="text-slate-600">ابدأ بمراجعة الطلبات المعلقة</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {completedRequests.map((request) => (
                        <div
                          key={request.id}
                          className="p-4 rounded-lg border bg-slate-50"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <p className="font-semibold text-slate-900 mb-1">
                                طلب #{request.id.slice(0, 8)}
                              </p>
                              <p className="text-sm text-slate-500">
                                تاريخ الاعتماد: {request.consultant_approval_date ? new Date(request.consultant_approval_date).toLocaleDateString('ar-SA') : 'غير محدد'}
                              </p>
                            </div>
                            {getComplianceStatusBadge(request.compliance_status)}
                          </div>

                          <div className="grid md:grid-cols-3 gap-4 mb-3 text-sm">
                            <div>
                              <p className="text-slate-500">المبلغ</p>
                              <p className="font-medium">{request.amount.toLocaleString('ar-SA')} ريال</p>
                            </div>
                            <div>
                              <p className="text-slate-500">أتعابك</p>
                              <p className="font-medium text-green-600">
                                {(request.amount * 0.05).toLocaleString('ar-SA')} ريال
                              </p>
                            </div>
                            <div>
                              <p className="text-slate-500">حالة الدفع</p>
                              <Badge variant="outline" className="text-green-600">
                                مكتملة
                              </Badge>
                            </div>
                          </div>

                          {request.saudi_code_notes && (
                            <div className="p-3 bg-white rounded border text-sm">
                              <p className="font-medium text-slate-700 mb-1">ملاحظات الكود السعودي:</p>
                              <p className="text-slate-600">{request.saudi_code_notes}</p>
                            </div>
                          )}

                          {request.approved_report_file && (
                            <div className="mt-3">
                              <a 
                                href={request.approved_report_file} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800"
                              >
                                <Download className="w-4 h-4" />
                                تحميل التقرير المعتمد
                              </a>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Projects Under Review */}
            <TabsContent value="projects">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-600" />
                    المشاريع النشطة المتاحة للمراجعة
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {projects.length === 0 ? (
                    <div className="text-center py-12">
                      <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">لا توجد مشاريع للمراجعة</h3>
                      <p className="text-slate-600">سيتم إشعارك عند توفر مشاريع جديدة</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {projects.map((project) => (
                        <div
                          key={project.id}
                          className="p-4 rounded-lg border hover:border-[#d4a574] transition-colors"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-semibold text-slate-900 mb-2">
                                {project.title}
                              </h4>
                              <p className="text-sm text-slate-600 mb-3">
                                {project.description?.slice(0, 150)}...
                              </p>
                              <div className="flex items-center gap-4 text-sm">
                                <Badge variant="outline">
                                  {project.category}
                                </Badge>
                                <span className="text-slate-500">
                                  {project.location}
                                </span>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Link to={createPageUrl("ProjectDetails") + `?id=${project.id}`}>
                                <Button variant="outline">
                                  <Eye className="w-4 h-4 ml-2" />
                                  عرض التفاصيل
                                </Button>
                              </Link>
                              {project.status === "awaiting_technical_review" && (
                                <Link to={createPageUrl("TechnicalReviewPage") + `?projectId=${project.id}`}>
                                  <Button className="bg-gradient-to-r from-green-600 to-emerald-600">
                                    <FileCheck className="w-4 h-4 ml-2" />
                                    مراجعة فنية
                                  </Button>
                                </Link>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
}