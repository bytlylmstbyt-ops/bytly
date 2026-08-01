import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import {
  MapPin, DollarSign, FileCheck,
  CheckCircle, Clock, Plus, Wallet, Shield,
  Building2, CreditCard, Loader2, Eye, Calendar,
  FileText, Download, FolderOpen, TrendingUp
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
      <div className="min-h-screen flex items-center justify-center bg-[#F5F0E8]">
        <Loader2 className="w-12 h-12 animate-spin text-[#C9A66B]" />
      </div>
    );
  }

  const activeProjects = projects.filter(p => p.status === "in_progress").length;
  const totalEscrow = projects.reduce((sum, p) => sum + (p.escrow_amount || 0), 0);
  const completedMilestones = allMilestones.filter(m => m.firm_approved && m.balady_permit_number).length;
  const totalInvestment = projects.reduce((sum, p) => sum + (p.budget_max || 0), 0);
  const completionRate = allMilestones.length > 0
    ? Math.round((allMilestones.filter(m => m.status === "completed").length / allMilestones.length) * 100)
    : 0;

  const statusColors = {
    green: { bg: "bg-green-50", text: "text-green-700", border: "border-green-300", dot: "bg-green-500", label: "يسير حسب الخطة" },
    yellow: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-300", dot: "bg-amber-500", label: "يحتاج انتباهك" },
    red: { bg: "bg-red-50", text: "text-red-700", border: "border-red-300", dot: "bg-red-500", label: "تأخير أو مشكلة" }
  };

  const kpiCards = [
    {
      icon: Building2,
      iconBg: "bg-[#E5D4B8]",
      iconColor: "text-[#6B5D4F]",
      badge: activeProjects,
      label: "المشاريع النشطة",
      sub: `من أصل ${projects.length}`,
      value: null,
      gradient: "from-[#FBF8F3] to-white"
    },
    {
      icon: Shield,
      iconBg: "bg-[#F5E9D3]",
      iconColor: "text-[#C9A66B]",
      label: "إجمالي المبالغ في الضمان",
      value: `${totalEscrow.toLocaleString('ar-SA')} ر.س`,
      gradient: "from-[#FBF8F3] to-[#F5F0E8]"
    },
    {
      icon: FileCheck,
      iconBg: "bg-green-100",
      iconColor: "text-green-600",
      badge: completedMilestones,
      label: "التراخيص المستلمة",
      sub: "رخصة بلدية",
      value: null,
      gradient: "from-[#F0FAF0] to-white"
    },
    {
      icon: Wallet,
      iconBg: "bg-[#4A3F35]",
      iconColor: "text-white",
      label: "رصيد المحفظة",
      value: `${(client?.wallet_balance || 0).toLocaleString('ar-SA')} ر.س`,
      gradient: "from-[#FBF8F3] to-[#F5F0E8]"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F5F0E8] via-white to-[#FBF8F3] py-8" dir="rtl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#6B5D4F] to-[#C9A66B] flex items-center justify-center shadow-md">
                <Building2 className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold gradient-text mb-1">
                  مركز المستثمر
                </h1>
                <p className="text-[#8C7256]">
                  إدارة محفظة مشاريعك وتتبع التقدم المالي من لوحة واحدة
                </p>
              </div>
            </div>
            <Link to={createPageUrl("CreateProject")}>
              <Button className="bg-gradient-to-r from-[#6B5D4F] to-[#C9A66B] text-white hover:opacity-90 shadow-md">
                <Plus className="w-4 h-4 ml-2" />
                مشروع جديد
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* KPI Cards */}
        <div className="grid md:grid-cols-4 gap-5 mb-8">
          {kpiCards.map((card, idx) => {
            const Icon = card.icon;
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + idx * 0.05 }}
              >
                <Card className={`bg-gradient-to-br ${card.gradient} border border-[#E5D4B8] shadow-sm hover:shadow-md transition-shadow`}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className={`w-14 h-14 ${card.iconBg} rounded-2xl flex items-center justify-center`}>
                        <Icon className={`w-7 h-7 ${card.iconColor}`} />
                      </div>
                      {card.badge !== undefined && (
                        <Badge className="bg-[#4A3F35] text-white text-lg px-3 py-1">{card.badge}</Badge>
                      )}
                    </div>
                    <p className="text-sm text-[#8C7256] mb-1">{card.label}</p>
                    {card.value ? (
                      <p className="text-2xl font-bold text-[#4A3F35]">{card.value}</p>
                    ) : (
                      <p className="text-lg font-bold text-[#4A3F35]">{card.sub}</p>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        <Tabs defaultValue="projects" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 max-w-3xl bg-[#FBF8F3] border border-[#E5D4B8]">
            <TabsTrigger value="projects" className="data-[state=active]:bg-white data-[state=active]:text-[#6B5D4F] data-[state=active]:shadow-sm">
              <Building2 className="w-4 h-4 ml-2" />
              نظرة شاملة
            </TabsTrigger>
            <TabsTrigger value="payments" className="data-[state=active]:bg-white data-[state=active]:text-[#6B5D4F] data-[state=active]:shadow-sm">
              <DollarSign className="w-4 h-4 ml-2" />
              الدفعات ({pendingPayments.length})
            </TabsTrigger>
            <TabsTrigger value="documents" className="data-[state=active]:bg-white data-[state=active]:text-[#6B5D4F] data-[state=active]:shadow-sm">
              <FolderOpen className="w-4 h-4 ml-2" />
              المستندات
            </TabsTrigger>
            <TabsTrigger value="analytics" className="data-[state=active]:bg-white data-[state=active]:text-[#6B5D4F] data-[state=active]:shadow-sm">
              <TrendingUp className="w-4 h-4 ml-2" />
              التحليلات
            </TabsTrigger>
          </TabsList>

          {/* Project Traffic Lights */}
          <TabsContent value="projects">
            <Card className="border border-[#E5D4B8] shadow-sm">
              <CardHeader className="border-b border-[#F0E8D8]">
                <CardTitle className="text-[#4A3F35]">نظرة شاملة على جميع المشاريع</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
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
                          className={`p-6 rounded-xl border-2 ${colorConfig.border} ${colorConfig.bg} hover:shadow-md transition-all`}
                        >
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <div className={`w-4 h-4 rounded-full ${colorConfig.dot} shadow-md`} />
                                <h3 className="text-xl font-bold text-[#1a1a2e]">{project.title}</h3>
                              </div>
                              <div className="flex items-center gap-4 text-sm text-[#6B5D4F]">
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
                            <Badge className={`${colorConfig.bg} ${colorConfig.text} border ${colorConfig.border} text-sm px-3 py-1`}>
                              {colorConfig.label}
                            </Badge>
                          </div>

                          <div className="mb-4">
                            <div className="flex items-center justify-between text-sm mb-2">
                              <span className="text-[#8C7256]">التقدم الإجمالي</span>
                              <span className="font-semibold text-[#4A3F35]">{completedCount} / {projectMilestones.length} مراحل</span>
                            </div>
                            <Progress value={progressPercent} className="h-2 [&>div]:bg-gradient-to-l [&>div]:from-[#C9A66B] [&>div]:to-[#6B5D4F]" />
                          </div>

                          <div className="flex items-center justify-between pt-4 border-t border-[#E5D4B8]">
                            <div className="flex items-center gap-4">
                              <span className="text-sm text-[#6B5D4F]">
                                <Shield className="w-4 h-4 inline ml-1" />
                                في الضمان: <strong>{project.escrow_amount?.toLocaleString('ar-SA') || 0} ر.س</strong>
                              </span>
                              <span className="text-sm text-[#6B5D4F]">
                                <Eye className="w-4 h-4 inline ml-1" />
                                <strong>{project.total_proposals || 0}</strong> عرض
                              </span>
                            </div>
                            <Button size="sm" variant="ghost" className="text-[#C9A66B] hover:text-[#6B5D4F]">
                              عرض التفاصيل ←
                            </Button>
                          </div>
                        </motion.div>
                      </Link>
                    );
                  })}

                  {projects.length === 0 && (
                    <div className="text-center py-12">
                      <Building2 className="w-16 h-16 text-[#E5D4B8] mx-auto mb-4" />
                      <p className="text-[#8C7256] mb-4">لا توجد مشاريع بعد</p>
                      <Link to={createPageUrl("CreateProject")}>
                        <Button className="bg-gradient-to-r from-[#6B5D4F] to-[#C9A66B] text-white">
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
            <Card className="border border-[#E5D4B8] shadow-sm">
              <CardHeader className="border-b border-[#F0E8D8]">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-[#4A3F35]">الدفعات القادمة</CardTitle>
                  {selectedPayments.length > 0 && (
                    <Button
                      onClick={handleBulkPayment}
                      className="bg-gradient-to-r from-[#6B5D4F] to-[#C9A66B] text-white hover:opacity-90"
                    >
                      <CreditCard className="w-4 h-4 ml-2" />
                      دفع الكل ({selectedPayments.length})
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pt-6">
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
                              ? "border-[#C9A66B] bg-[#FBF8F3] shadow-md"
                              : "border-[#E5D4B8] bg-white hover:border-[#C9A66B]"
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3 flex-1">
                              <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center ${
                                isSelected ? "bg-[#6B5D4F] border-[#6B5D4F]" : "bg-white border-[#E5D4B8]"
                              }`}>
                                {isSelected && <CheckCircle className="w-4 h-4 text-white" />}
                              </div>
                              <div className="flex-1">
                                <h4 className="font-semibold text-[#1a1a2e] mb-1">{milestone.title}</h4>
                                <p className="text-sm text-[#8C7256] mb-2">{milestone.project_title}</p>
                                <div className="flex items-center gap-3 text-xs text-[#6B5D4F]">
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
                              <p className="text-2xl font-bold text-[#4A3F35]">
                                {milestone.amount.toLocaleString('ar-SA')}
                              </p>
                              <p className="text-sm text-[#8C7256]">ر.س</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {selectedPayments.length > 0 && (
                      <div className="bg-gradient-to-l from-[#FBF8F3] to-[#F5F0E8] p-6 rounded-xl border-2 border-[#C9A66B]">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-[#8C7256] mb-1">إجمالي المبلغ المحدد</p>
                            <p className="text-3xl font-bold text-[#4A3F35]">
                              {selectedPayments.reduce((sum, id) => {
                                const m = pendingPayments.find(milestone => milestone.id === id);
                                return sum + (m?.amount || 0);
                              }, 0).toLocaleString('ar-SA')} ر.س
                            </p>
                          </div>
                          <Button
                            onClick={handleBulkPayment}
                            size="lg"
                            className="bg-gradient-to-r from-[#6B5D4F] to-[#C9A66B] text-white px-8 hover:opacity-90"
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
                    <p className="text-[#8C7256]">لا توجد دفعات معلقة</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Document Vault */}
          <TabsContent value="documents">
            <Card className="border border-[#E5D4B8] shadow-sm">
              <CardHeader className="border-b border-[#F0E8D8]">
                <CardTitle className="text-[#4A3F35]">مركز المستندات الموحد</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
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
                      <div key={project.id} className="border border-[#E5D4B8] rounded-xl p-5 hover:shadow-md transition-shadow bg-white">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-[#F5F0E8] rounded-xl flex items-center justify-center">
                              <FolderOpen className="w-6 h-6 text-[#6B5D4F]" />
                            </div>
                            <div>
                              <h3 className="font-bold text-lg text-[#1a1a2e]">{project.title}</h3>
                              <p className="text-sm text-[#8C7256]">
                                {project.location} • {documentsCount} مستند
                              </p>
                            </div>
                          </div>
                          <Link to={createPageUrl("ProjectMilestones") + `?id=${project.id}`}>
                            <Button size="sm" variant="outline" className="border-[#C9A66B] text-[#6B5D4F] hover:bg-[#FBF8F3]">
                              <Eye className="w-4 h-4 ml-2" />
                              عرض المستندات
                            </Button>
                          </Link>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          {projectMilestones.slice(0, 4).map((milestone) => (
                            <div key={milestone.id} className="bg-[#FBF8F3] p-3 rounded-lg border border-[#F0E8D8]">
                              <p className="text-xs text-[#8C7256] mb-1">المرحلة {milestone.order}</p>
                              <p className="text-sm font-medium text-[#4A3F35] truncate">{milestone.title}</p>
                              <div className="flex items-center gap-1 mt-2 flex-wrap">
                                {milestone.balady_permit_number && (
                                  <Badge className="bg-green-100 text-green-700 text-xs">
                                    <FileCheck className="w-3 h-3 ml-1" />
                                    رخصة
                                  </Badge>
                                )}
                                {milestone.stamped_drawings?.length > 0 && (
                                  <Badge className="bg-[#E5D4B8] text-[#6B5D4F] text-xs">
                                    {milestone.stamped_drawings.length} مخطط
                                  </Badge>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>

                        {projectMilestones.length > 4 && (
                          <p className="text-sm text-[#8C7256] text-center mt-3">
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
              <Card className="border border-[#E5D4B8] shadow-sm">
                <CardHeader className="border-b border-[#F0E8D8]">
                  <CardTitle className="text-[#4A3F35]">ملخص الأداء المالي</CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-4 bg-[#FBF8F3] rounded-lg border border-[#F0E8D8]">
                      <span className="text-sm text-[#6B5D4F]">إجمالي الاستثمار</span>
                      <span className="text-xl font-bold text-[#4A3F35]">
                        {totalInvestment.toLocaleString('ar-SA')} ر.س
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                      <span className="text-sm text-[#6B5D4F]">المدفوع حتى الآن</span>
                      <span className="text-xl font-bold text-green-800">
                        {totalEscrow.toLocaleString('ar-SA')} ر.س
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-[#F5F0E8] rounded-lg border border-[#E5D4B8]">
                      <span className="text-sm text-[#6B5D4F]">معدل الإنجاز</span>
                      <span className="text-xl font-bold text-[#6B5D4F]">
                        {completionRate}%
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-[#E5D4B8] shadow-sm">
                <CardHeader className="border-b border-[#F0E8D8]">
                  <CardTitle className="text-[#4A3F35]">توزيع حالات المشاريع</CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    {[
                      { key: "green", color: "bg-green-500", label: "يسير حسب الخطة" },
                      { key: "yellow", color: "bg-amber-500", label: "يحتاج انتباهك" },
                      { key: "red", color: "bg-red-500", label: "تأخير أو مشكلة" }
                    ].map((item) => (
                      <div key={item.key} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${item.color}`} />
                          <span className="text-sm text-[#6B5D4F]">{item.label}</span>
                        </div>
                        <span className="font-bold text-[#4A3F35]">
                          {projects.filter(p => getProjectStatus(p) === item.key).length}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card className="mt-6 border border-[#E5D4B8] shadow-sm">
              <CardHeader className="border-b border-[#F0E8D8]">
                <CardTitle className="text-[#4A3F35]">إجراءات سريعة</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid md:grid-cols-3 gap-4">
                  <Link to={createPageUrl("WalletTopup")}>
                    <Button variant="outline" className="w-full justify-start border-[#E5D4B8] text-[#6B5D4F] hover:bg-[#FBF8F3] hover:border-[#C9A66B]">
                      <Wallet className="w-4 h-4 ml-2" />
                      شحن المحفظة
                    </Button>
                  </Link>
                  <Link to={createPageUrl("InvoiceManager")}>
                    <Button variant="outline" className="w-full justify-start border-[#E5D4B8] text-[#6B5D4F] hover:bg-[#FBF8F3] hover:border-[#C9A66B]">
                      <FileText className="w-4 h-4 ml-2" />
                      إدارة الفواتير
                    </Button>
                  </Link>
                  <Link to={createPageUrl("Wallet")}>
                    <Button variant="outline" className="w-full justify-start border-[#E5D4B8] text-[#6B5D4F] hover:bg-[#FBF8F3] hover:border-[#C9A66B]">
                      <Download className="w-4 h-4 ml-2" />
                      كشف حساب
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Project Locations Preview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-8"
        >
          <Card className="border border-[#E5D4B8] shadow-sm">
            <CardHeader className="border-b border-[#F0E8D8]">
              <CardTitle className="text-[#4A3F35]">مواقع المشاريع</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {projects.map((project) => {
                  const status = getProjectStatus(project);
                  return (
                    <div key={project.id} className="flex items-center gap-3 p-4 bg-[#FBF8F3] rounded-lg border border-[#F0E8D8]">
                      <div className="w-10 h-10 bg-[#E5D4B8] rounded-full flex items-center justify-center flex-shrink-0">
                        <MapPin className="w-5 h-5 text-[#6B5D4F]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-[#4A3F35] truncate">{project.title}</p>
                        <p className="text-sm text-[#8C7256] truncate">{project.location}</p>
                      </div>
                      <div className={`w-3 h-3 rounded-full flex-shrink-0 ${statusColors[status].dot}`} />
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}