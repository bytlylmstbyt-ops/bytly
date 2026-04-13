import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { 
  MapPin, DollarSign, FileCheck, AlertCircle, 
  CheckCircle, Clock, Plus, Wallet, Shield,
  Building2, CreditCard, Loader2, Eye, Calendar,
  FileText, Download, Upload, FolderOpen, TrendingUp
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { differenceInDays, format } from "date-fns";
import { toast } from "sonner";
import { ar } from "date-fns/locale";

export default function InvestorHub() {
  const [loading, setLoading] = useState(true);
  const [client, setClient] = useState(null);
  const [projects, setProjects] = useState([]);
  const [allMilestones, setAllMilestones] = useState([]);
  const [pendingPayments, setPendingPayments] = useState([]);
  const [selectedPayments, setSelectedPayments] = useState([]);

  useEffect(() => {
    loadInvestorData();
  }, []);

  const loadInvestorData = async () => {
    try {
      const user = await base44.auth.me();
      
      // Allow admin to access all pages
      const isAdmin = user.role === 'admin';
      
      const [clientData] = await base44.entities.Client.filter({ email: user.email });
      
      if (!isAdmin && (!clientData || clientData.client_type !== "investor")) {
        window.location.href = createPageUrl("Dashboard");
        return;
      }

      setClient(clientData || { full_name: user.full_name, email: user.email, client_type: "investor" });

      // If admin, load all projects; otherwise load only client's projects
      const projectsList = isAdmin 
        ? await base44.entities.Project.filter({})
        : await base44.entities.Project.filter({ client_id: clientData.id });
      setProjects(projectsList);

      const milestonesList = await Promise.all(
        projectsList.map(async (project) => {
          const milestones = await base44.entities.ProjectMilestone.filter({ 
            project_id: project.id 
          });
          return milestones.map(m => ({ ...m, project_title: project.title, project_location: project.location }));
        })
      );

      const flatMilestones = milestonesList.flat();
      setAllMilestones(flatMilestones);

      const pending = flatMilestones.filter(m => 
        m.status === "pending" || 
        (m.status === "submitted" && !m.client_approved)
      );
      setPendingPayments(pending);

    } catch (error) {
      console.error("Error loading investor data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getProjectStatus = (project) => {
    const projectMilestones = allMilestones.filter(m => m.project_id === project.id);
    
    const hasPendingApproval = projectMilestones.some(m => 
      m.status === "submitted" && !m.client_approved
    );
    
    const hasOverdueMilestones = projectMilestones.some(m => {
      if (!m.due_date || m.status === "completed") return false;
      return differenceInDays(new Date(m.due_date), new Date()) < 0;
    });

    if (hasOverdueMilestones || project.status === "disputed") return "red";
    if (hasPendingApproval || projectMilestones.some(m => m.status === "revision_requested")) return "yellow";
    return "green";
  };

  const togglePaymentSelection = (milestoneId) => {
    setSelectedPayments(prev =>
      prev.includes(milestoneId)
        ? prev.filter(id => id !== milestoneId)
        : [...prev, milestoneId]
    );
  };

  const handleBulkPayment = async () => {
    if (selectedPayments.length === 0) {
      toast.error("يرجى اختيار مرحلة واحدة على الأقل");
      return;
    }

    const totalAmount = selectedPayments.reduce((sum, id) => {
      const milestone = pendingPayments.find(m => m.id === id);
      return sum + (milestone?.amount || 0);
    }, 0);

    // In production, integrate with Stripe for bulk checkout
    console.log("Processing bulk payment:", { selectedPayments, totalAmount });
    toast.success("جاري تحويلك لبوابة الدفع...");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-purple-600" />
      </div>
    );
  }

  const activeProjects = projects.filter(p => p.status === "in_progress").length;
  const totalEscrow = projects.reduce((sum, p) => sum + (p.escrow_amount || 0), 0);
  const completedMilestones = allMilestones.filter(m => m.firm_approved && m.balady_permit_number).length;

  const statusColors = {
    green: { bg: "bg-green-100", text: "text-green-700", border: "border-green-300", label: "يسير حسب الخطة" },
    yellow: { bg: "bg-yellow-100", text: "text-yellow-700", border: "border-yellow-300", label: "يحتاج انتباهك" },
    red: { bg: "bg-red-100", text: "text-red-700", border: "border-red-300", label: "تأخير أو مشكلة" }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50/30 py-8" dir="rtl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold gradient-text mb-2">
                مركز المستثمر
              </h1>
              <p className="text-slate-600">
                إدارة محفظة مشاريعك وتتبع التقدم المالي من لوحة واحدة
              </p>
            </div>
            <Link to={createPageUrl("CreateProject")}>
              <Button className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
                <Plus className="w-4 h-4 ml-2" />
                مشروع جديد
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* Overview Counters */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-0 shadow-lg">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center">
                    <Building2 className="w-7 h-7 text-blue-600" />
                  </div>
                  <Badge className="bg-blue-600 text-white text-lg px-3 py-1">{activeProjects}</Badge>
                </div>
                <p className="text-sm text-slate-600 mb-1">المشاريع النشطة</p>
                <p className="text-2xl font-bold text-blue-900">من أصل {projects.length}</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-0 shadow-lg">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-14 h-14 bg-amber-100 rounded-2xl flex items-center justify-center">
                    <Shield className="w-7 h-7 text-amber-600" />
                  </div>
                </div>
                <p className="text-sm text-slate-600 mb-1">إجمالي المبالغ في الضمان</p>
                <p className="text-2xl font-bold text-amber-900">{totalEscrow.toLocaleString('ar-SA')} ر.س</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-0 shadow-lg">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center">
                    <FileCheck className="w-7 h-7 text-green-600" />
                  </div>
                  <Badge className="bg-green-600 text-white text-lg px-3 py-1">{completedMilestones}</Badge>
                </div>
                <p className="text-sm text-slate-600 mb-1">التراخيص المستلمة</p>
                <p className="text-2xl font-bold text-green-900">رخصة بلدية</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <Card className="bg-gradient-to-br from-purple-50 to-indigo-50 border-0 shadow-lg">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-14 h-14 bg-purple-100 rounded-2xl flex items-center justify-center">
                    <Wallet className="w-7 h-7 text-purple-600" />
                  </div>
                </div>
                <p className="text-sm text-slate-600 mb-1">رصيد المحفظة</p>
                <p className="text-2xl font-bold text-purple-900">{(client?.wallet_balance || 0).toLocaleString('ar-SA')} ر.س</p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <Tabs defaultValue="projects" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 max-w-3xl">
            <TabsTrigger value="projects">
              <Building2 className="w-4 h-4 ml-2" />
              نظرة شاملة
            </TabsTrigger>
            <TabsTrigger value="payments">
              <DollarSign className="w-4 h-4 ml-2" />
              الدفعات ({pendingPayments.length})
            </TabsTrigger>
            <TabsTrigger value="documents">
              <FolderOpen className="w-4 h-4 ml-2" />
              المستندات
            </TabsTrigger>
            <TabsTrigger value="analytics">
              <TrendingUp className="w-4 h-4 ml-2" />
              التحليلات
            </TabsTrigger>
          </TabsList>

          {/* Project Traffic Lights */}
          <TabsContent value="projects">
            <Card>
              <CardHeader>
                <CardTitle>نظرة شاملة على جميع المشاريع</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {projects.map((project) => {
                    const status = getProjectStatus(project);
                    const colorConfig = statusColors[status];
                    const projectMilestones = allMilestones.filter(m => m.project_id === project.id);
                    const completedCount = projectMilestones.filter(m => m.status === "completed").length;
                    const progressPercent = projectMilestones.length > 0 
                      ? (completedCount / projectMilestones.length) * 100 
                      : 0;

                    return (
                      <Link 
                        key={project.id}
                        to={createPageUrl("ProjectDetails") + `?id=${project.id}`}
                      >
                        <motion.div
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className={`p-6 rounded-xl border-2 ${colorConfig.border} ${colorConfig.bg} hover:shadow-lg transition-all`}
                        >
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <div className={`w-4 h-4 rounded-full ${status === 'green' ? 'bg-green-500' : status === 'yellow' ? 'bg-yellow-500' : 'bg-red-500'} shadow-lg`} />
                                <h3 className="text-xl font-bold text-slate-900">{project.title}</h3>
                              </div>
                              <div className="flex items-center gap-4 text-sm text-slate-600">
                                <span className="flex items-center gap-1">
                                  <MapPin className="w-4 h-4" />
                                  {project.location || "غير محدد"}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-4 h-4" />
                                  {project.deadline ? format(new Date(project.deadline), 'PPP', { locale: ar }) : "بدون موعد"}
                                </span>
                              </div>
                            </div>
                            <Badge className={`${colorConfig.bg} ${colorConfig.text} text-sm px-3 py-1`}>
                              {colorConfig.label}
                            </Badge>
                          </div>

                          <div className="mb-4">
                            <div className="flex items-center justify-between text-sm mb-2">
                              <span className="text-slate-600">التقدم الإجمالي</span>
                              <span className="font-semibold">{completedCount} / {projectMilestones.length} مراحل</span>
                            </div>
                            <Progress value={progressPercent} className="h-2" />
                          </div>

                          <div className="flex items-center justify-between pt-4 border-t">
                            <div className="flex items-center gap-4">
                              <span className="text-sm text-slate-600">
                                <DollarSign className="w-4 h-4 inline ml-1" />
                                في الضمان: <strong>{project.escrow_amount?.toLocaleString('ar-SA') || 0} ر.س</strong>
                              </span>
                              <span className="text-sm text-slate-600">
                                <Eye className="w-4 h-4 inline ml-1" />
                                <strong>{project.total_proposals || 0}</strong> عرض
                              </span>
                            </div>
                            <Button size="sm" variant="ghost" className="text-blue-600">
                              عرض التفاصيل ←
                            </Button>
                          </div>
                        </motion.div>
                      </Link>
                    );
                  })}

                  {projects.length === 0 && (
                    <div className="text-center py-12">
                      <Building2 className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                      <p className="text-slate-500 mb-4">لا توجد مشاريع بعد</p>
                      <Link to={createPageUrl("CreateProject")}>
                        <Button>
                          <Plus className="w-4 h-4 ml-2" />
                          أنشئ مشروعك الأول
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Centralized Payments */}
          <TabsContent value="payments">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>الدفعات القادمة</CardTitle>
                  {selectedPayments.length > 0 && (
                    <Button 
                      onClick={handleBulkPayment}
                      className="bg-gradient-to-r from-green-600 to-emerald-600 text-white"
                    >
                      <CreditCard className="w-4 h-4 ml-2" />
                      دفع الكل ({selectedPayments.length})
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {pendingPayments.length > 0 ? (
                  <div className="space-y-3">
                    {pendingPayments.map((milestone) => {
                      const isSelected = selectedPayments.includes(milestone.id);
                      const daysUntilDue = milestone.due_date 
                        ? differenceInDays(new Date(milestone.due_date), new Date())
                        : null;

                      return (
                        <div
                          key={milestone.id}
                          onClick={() => togglePaymentSelection(milestone.id)}
                          className={`p-5 rounded-xl border-2 cursor-pointer transition-all ${
                            isSelected 
                              ? "border-green-500 bg-green-50 shadow-md" 
                              : "border-slate-200 bg-white hover:border-slate-300"
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3 flex-1">
                              <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center ${
                                isSelected ? "bg-green-500 border-green-500" : "bg-white border-slate-300"
                              }`}>
                                {isSelected && <CheckCircle className="w-4 h-4 text-white" />}
                              </div>
                              <div className="flex-1">
                                <h4 className="font-semibold text-slate-900 mb-1">{milestone.title}</h4>
                                <p className="text-sm text-slate-600 mb-2">{milestone.project_title}</p>
                                <div className="flex items-center gap-3 text-xs text-slate-500">
                                  {daysUntilDue !== null && (
                                    <span className={`flex items-center gap-1 ${daysUntilDue < 7 ? 'text-red-600 font-semibold' : ''}`}>
                                      <Clock className="w-3 h-3" />
                                      {daysUntilDue > 0 ? `${daysUntilDue} يوم متبقي` : "متأخر"}
                                    </span>
                                  )}
                                  <span>{milestone.percentage}% من المبلغ الكلي</span>
                                </div>
                              </div>
                            </div>
                            <div className="text-left">
                              <p className="text-2xl font-bold text-slate-900">
                                {milestone.amount.toLocaleString('ar-SA')}
                              </p>
                              <p className="text-sm text-slate-500">ر.س</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {selectedPayments.length > 0 && (
                      <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-xl border-2 border-green-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-slate-600 mb-1">إجمالي المبلغ المحدد</p>
                            <p className="text-3xl font-bold text-green-900">
                              {selectedPayments.reduce((sum, id) => {
                                const m = pendingPayments.find(milestone => milestone.id === id);
                                return sum + (m?.amount || 0);
                              }, 0).toLocaleString('ar-SA')} ر.س
                            </p>
                          </div>
                          <Button 
                            onClick={handleBulkPayment}
                            size="lg"
                            className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-8"
                          >
                            <CreditCard className="w-5 h-5 ml-2" />
                            ادفع الآن
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <CheckCircle className="w-16 h-16 text-green-300 mx-auto mb-4" />
                    <p className="text-slate-500">لا توجد دفعات معلقة</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Document Vault */}
          <TabsContent value="documents">
            <Card>
              <CardHeader>
                <CardTitle>مركز المستندات الموحد</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {projects.map((project) => {
                    const projectMilestones = allMilestones.filter(m => m.project_id === project.id);
                    const documentsCount = projectMilestones.reduce((count, m) => {
                      return count + 
                        (m.stamped_drawings?.length || 0) + 
                        (m.deliverable_files?.length || 0) +
                        (m.balady_permit_number ? 1 : 0);
                    }, 0);

                    return (
                      <div key={project.id} className="border rounded-xl p-5 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center">
                              <FolderOpen className="w-6 h-6 text-slate-600" />
                            </div>
                            <div>
                              <h3 className="font-bold text-lg text-slate-900">{project.title}</h3>
                              <p className="text-sm text-slate-600">
                                {project.location} • {documentsCount} مستند
                              </p>
                            </div>
                          </div>
                          <Link to={createPageUrl("ProjectMilestones") + `?id=${project.id}`}>
                            <Button size="sm" variant="outline">
                              <Eye className="w-4 h-4 ml-2" />
                              عرض المستندات
                            </Button>
                          </Link>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          {projectMilestones.slice(0, 4).map((milestone) => (
                            <div key={milestone.id} className="bg-slate-50 p-3 rounded-lg">
                              <p className="text-xs text-slate-500 mb-1">المرحلة {milestone.order}</p>
                              <p className="text-sm font-medium text-slate-900 truncate">{milestone.title}</p>
                              <div className="flex items-center gap-1 mt-2">
                                {milestone.balady_permit_number && (
                                  <Badge className="bg-green-100 text-green-700 text-xs">
                                    <FileCheck className="w-3 h-3 ml-1" />
                                    رخصة
                                  </Badge>
                                )}
                                {milestone.stamped_drawings?.length > 0 && (
                                  <Badge className="bg-blue-100 text-blue-700 text-xs">
                                    {milestone.stamped_drawings.length} مخطط
                                  </Badge>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>

                        {projectMilestones.length > 4 && (
                          <p className="text-sm text-slate-500 text-center mt-3">
                            + {projectMilestones.length - 4} مراحل أخرى
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>ملخص الأداء المالي</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                      <span className="text-sm text-slate-600">إجمالي الاستثمار</span>
                      <span className="text-xl font-bold text-blue-900">
                        {projects.reduce((sum, p) => sum + (p.budget_max || 0), 0).toLocaleString('ar-SA')} ر.س
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                      <span className="text-sm text-slate-600">المدفوع حتى الآن</span>
                      <span className="text-xl font-bold text-green-900">
                        {totalEscrow.toLocaleString('ar-SA')} ر.س
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
                      <span className="text-sm text-slate-600">معدل الإنجاز</span>
                      <span className="text-xl font-bold text-purple-900">
                        {projects.length > 0 
                          ? Math.round((allMilestones.filter(m => m.status === "completed").length / allMilestones.length) * 100)
                          : 0}%
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>توزيع حالات المشاريع</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-green-500" />
                        <span className="text-sm text-slate-600">يسير حسب الخطة</span>
                      </div>
                      <span className="font-bold text-slate-900">
                        {projects.filter(p => getProjectStatus(p) === "green").length}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-yellow-500" />
                        <span className="text-sm text-slate-600">يحتاج انتباهك</span>
                      </div>
                      <span className="font-bold text-slate-900">
                        {projects.filter(p => getProjectStatus(p) === "yellow").length}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-500" />
                        <span className="text-sm text-slate-600">تأخير أو مشكلة</span>
                      </div>
                      <span className="font-bold text-slate-900">
                        {projects.filter(p => getProjectStatus(p) === "red").length}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>إجراءات سريعة</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4">
                  <Link to={createPageUrl("WalletTopup")}>
                    <Button variant="outline" className="w-full justify-start">
                      <Wallet className="w-4 h-4 ml-2" />
                      شحن المحفظة
                    </Button>
                  </Link>
                  <Link to={createPageUrl("InvoiceManager")}>
                    <Button variant="outline" className="w-full justify-start">
                      <FileText className="w-4 h-4 ml-2" />
                      إدارة الفواتير
                    </Button>
                  </Link>
                  <Link to={createPageUrl("Wallet")}>
                    <Button variant="outline" className="w-full justify-start">
                      <Download className="w-4 h-4 ml-2" />
                      كشف حساب
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Project Locations Map Preview */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-8"
        >
          <Card>
            <CardHeader>
              <CardTitle>مواقع المشاريع</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {projects.map((project, idx) => (
                  <div key={project.id} className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-900 truncate">{project.title}</p>
                      <p className="text-sm text-slate-600 truncate">{project.location}</p>
                    </div>
                    <div className={`w-3 h-3 rounded-full flex-shrink-0 ${
                      getProjectStatus(project) === 'green' ? 'bg-green-500' :
                      getProjectStatus(project) === 'yellow' ? 'bg-yellow-500' : 'bg-red-500'
                    }`} />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}