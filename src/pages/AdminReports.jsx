import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  TrendingUp, Users, DollarSign, Award, 
  Briefcase, CheckCircle, XCircle, Loader2,
  BarChart3, PieChart, Activity, Wallet
} from "lucide-react";
import { motion } from "framer-motion";

export default function AdminReportsPage() {
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState({
    engineers: [],
    clients: [],
    platform: {},
    financial: {}
  });

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      const user = await base44.auth.me();
      
      if (user.role !== "admin") {
        alert("غير مصرح لك بالوصول لهذه الصفحة");
        return;
      }

      // Load all data
      const [
        engineers,
        clients,
        projects,
        transactions,
        withdrawalRequests,
        reviews
      ] = await Promise.all([
        base44.entities.Engineer.list(),
        base44.entities.Client.list(),
        base44.entities.Project.list(),
        base44.entities.Transaction.list(),
        base44.entities.WithdrawalRequest.list(),
        base44.entities.Review.list()
      ]);

      // Calculate engineer statistics
      const engineersStats = engineers.map(engineer => {
        const engineerProjects = projects.filter(
          p => p.assigned_engineer_id === engineer.id && p.status === "completed"
        );
        const engineerReviews = reviews.filter(r => r.engineer_id === engineer.id);
        const avgRating = engineerReviews.length > 0
          ? engineerReviews.reduce((sum, r) => sum + r.rating, 0) / engineerReviews.length
          : 0;
        
        const totalEarnings = engineerProjects.reduce(
          (sum, p) => sum + (p.engineer_payment || 0), 0
        );

        return {
          ...engineer,
          completedProjects: engineerProjects.length,
          avgRating: avgRating.toFixed(1),
          totalEarnings
        };
      }).sort((a, b) => b.totalEarnings - a.totalEarnings);

      // Calculate client statistics
      const clientsStats = clients.map(client => {
        const clientProjects = projects.filter(p => p.client_id === client.id);
        const totalSpent = clientProjects.reduce(
          (sum, p) => sum + (p.escrow_amount || 0), 0
        );
        const completedProjects = clientProjects.filter(
          p => p.status === "completed"
        ).length;

        return {
          ...client,
          totalProjects: clientProjects.length,
          completedProjects,
          totalSpent
        };
      }).sort((a, b) => b.totalSpent - a.totalSpent);

      // Calculate platform statistics
      const completedProjects = projects.filter(p => p.status === "completed");
      const totalCommissions = completedProjects.reduce(
        (sum, p) => sum + ((p.escrow_amount || 0) * (p.platform_commission || 15) / 100), 0
      );
      
      const activeUsers = engineers.filter(
        e => e.status === "approved"
      ).length + clients.length;

      const platformStats = {
        totalCommissions,
        completedProjects: completedProjects.length,
        totalProjects: projects.length,
        activeUsers,
        totalEngineers: engineers.length,
        approvedEngineers: engineers.filter(e => e.status === "approved").length,
        totalClients: clients.length
      };

      // Calculate financial statistics
      const approvedWithdrawals = withdrawalRequests.filter(
        w => w.status === "completed"
      );
      const rejectedWithdrawals = withdrawalRequests.filter(
        w => w.status === "rejected"
      );
      const pendingWithdrawals = withdrawalRequests.filter(
        w => w.status === "pending" || w.status === "processing"
      );

      const financialStats = {
        totalWithdrawals: withdrawalRequests.length,
        approvedWithdrawals: approvedWithdrawals.length,
        rejectedWithdrawals: rejectedWithdrawals.length,
        pendingWithdrawals: pendingWithdrawals.length,
        approvedAmount: approvedWithdrawals.reduce((sum, w) => sum + w.amount, 0),
        rejectedAmount: rejectedWithdrawals.reduce((sum, w) => sum + w.amount, 0),
        pendingAmount: pendingWithdrawals.reduce((sum, w) => sum + w.amount, 0),
        totalRevenue: transactions.filter(t => t.type === "commission" && t.status === "completed")
          .reduce((sum, t) => sum + t.amount, 0)
      };

      setReports({
        engineers: engineersStats,
        clients: clientsStats,
        platform: platformStats,
        financial: financialStats
      });

    } catch (error) {
      console.error("Error loading reports:", error);
      alert("حدث خطأ في تحميل التقارير");
    } finally {
      setLoading(false);
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-amber-50/30 py-8 px-4" dir="rtl">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-3 mb-2">
            <BarChart3 className="w-8 h-8 text-[#C9A66B]" />
            <h1 className="text-3xl font-bold text-[#1a1a2e]">التقارير والإحصائيات</h1>
          </div>
          <p className="text-slate-600">تقارير شاملة عن أداء المنصة</p>
        </motion.div>

        {/* Platform Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <DollarSign className="w-8 h-8 text-green-600" />
                  <Badge className="bg-green-100 text-green-800">عمولات</Badge>
                </div>
                <p className="text-2xl font-bold text-[#1a1a2e]">
                  {reports.platform.totalCommissions?.toLocaleString('ar-SA')}
                </p>
                <p className="text-sm text-slate-500">إجمالي العمولات</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <Briefcase className="w-8 h-8 text-blue-600" />
                  <Badge className="bg-blue-100 text-blue-800">مشاريع</Badge>
                </div>
                <p className="text-2xl font-bold text-[#1a1a2e]">
                  {reports.platform.completedProjects}
                </p>
                <p className="text-sm text-slate-500">مشاريع مكتملة</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <Users className="w-8 h-8 text-purple-600" />
                  <Badge className="bg-purple-100 text-purple-800">مستخدمين</Badge>
                </div>
                <p className="text-2xl font-bold text-[#1a1a2e]">
                  {reports.platform.activeUsers}
                </p>
                <p className="text-sm text-slate-500">مستخدمين نشطين</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <Activity className="w-8 h-8 text-amber-600" />
                  <Badge className="bg-amber-100 text-amber-800">أداء</Badge>
                </div>
                <p className="text-2xl font-bold text-[#1a1a2e]">
                  {reports.platform.approvedEngineers}
                </p>
                <p className="text-sm text-slate-500">مهندسين معتمدين</p>
              </CardContent>
            </Card>
          </div>
        </motion.div>

        {/* Detailed Reports */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Tabs defaultValue="engineers" className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-6">
              <TabsTrigger value="engineers">المهندسين</TabsTrigger>
              <TabsTrigger value="clients">العملاء</TabsTrigger>
              <TabsTrigger value="platform">المنصة</TabsTrigger>
              <TabsTrigger value="financial">التقارير المالية</TabsTrigger>
            </TabsList>

            {/* Engineers Report */}
            <TabsContent value="engineers">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-blue-600" />
                    تقرير أداء المهندسين
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {reports.engineers.slice(0, 10).map((engineer, index) => (
                      <div
                        key={engineer.id}
                        className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 bg-slate-50 rounded-xl gap-3"
                      >
                        <div className="flex items-center gap-4 min-w-0">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold shrink-0">
                            {index + 1}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-[#1a1a2e] truncate">{engineer.full_name}</p>
                            <p className="text-sm text-slate-500 truncate">{engineer.specialization}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 sm:gap-6 text-sm shrink-0">
                          <div className="text-center">
                            <p className="font-bold text-blue-600">{engineer.completedProjects}</p>
                            <p className="text-slate-500">مشروع</p>
                          </div>
                          <div className="text-center">
                            <p className="font-bold text-amber-600">{engineer.avgRating}</p>
                            <p className="text-slate-500">تقييم</p>
                          </div>
                          <div className="text-center">
                            <p className="font-bold text-green-600">
                              {engineer.totalEarnings.toLocaleString('ar-SA')}
                            </p>
                            <p className="text-slate-500">ريال</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Clients Report */}
            <TabsContent value="clients">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-purple-600" />
                    تقرير أداء العملاء
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {reports.clients.slice(0, 10).map((client, index) => (
                      <div
                        key={client.id}
                        className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 bg-slate-50 rounded-xl gap-3"
                      >
                        <div className="flex items-center gap-4 min-w-0">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold shrink-0">
                            {index + 1}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-[#1a1a2e] truncate">{client.full_name}</p>
                            <p className="text-sm text-slate-500 truncate">{client.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 sm:gap-6 text-sm shrink-0">
                          <div className="text-center">
                            <p className="font-bold text-blue-600">{client.totalProjects}</p>
                            <p className="text-slate-500">مشاريع</p>
                          </div>
                          <div className="text-center">
                            <p className="font-bold text-green-600">{client.completedProjects}</p>
                            <p className="text-slate-500">مكتمل</p>
                          </div>
                          <div className="text-center">
                            <p className="font-bold text-purple-600">
                              {client.totalSpent.toLocaleString('ar-SA')}
                            </p>
                            <p className="text-slate-500">ريال</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Platform Report */}
            <TabsContent value="platform">
              <div className="grid md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-green-600" />
                      إحصائيات المشاريع
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                      <span className="text-slate-600">إجمالي المشاريع</span>
                      <span className="font-bold text-lg">{reports.platform.totalProjects}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                      <span className="text-slate-600">مشاريع مكتملة</span>
                      <span className="font-bold text-lg text-green-600">
                        {reports.platform.completedProjects}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                      <span className="text-slate-600">معدل الإنجاز</span>
                      <span className="font-bold text-lg">
                        {reports.platform.totalProjects > 0
                          ? Math.round((reports.platform.completedProjects / reports.platform.totalProjects) * 100)
                          : 0}%
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="w-5 h-5 text-blue-600" />
                      إحصائيات المستخدمين
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                      <span className="text-slate-600">إجمالي المهندسين</span>
                      <span className="font-bold text-lg">{reports.platform.totalEngineers}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                      <span className="text-slate-600">مهندسين معتمدين</span>
                      <span className="font-bold text-lg text-blue-600">
                        {reports.platform.approvedEngineers}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                      <span className="text-slate-600">إجمالي العملاء</span>
                      <span className="font-bold text-lg">{reports.platform.totalClients}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Financial Report */}
            <TabsContent value="financial">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Wallet className="w-5 h-5 text-green-600" />
                      تقرير طلبات السحب
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="p-4 bg-green-50 rounded-xl">
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle className="w-5 h-5 text-green-600" />
                          <span className="text-sm text-slate-600">طلبات معتمدة</span>
                        </div>
                        <p className="text-2xl font-bold text-green-600">
                          {reports.financial.approvedWithdrawals}
                        </p>
                        <p className="text-sm text-slate-500 mt-1">
                          {reports.financial.approvedAmount?.toLocaleString('ar-SA')} ريال
                        </p>
                      </div>

                      <div className="p-4 bg-red-50 rounded-xl">
                        <div className="flex items-center gap-2 mb-2">
                          <XCircle className="w-5 h-5 text-red-600" />
                          <span className="text-sm text-slate-600">طلبات مرفوضة</span>
                        </div>
                        <p className="text-2xl font-bold text-red-600">
                          {reports.financial.rejectedWithdrawals}
                        </p>
                        <p className="text-sm text-slate-500 mt-1">
                          {reports.financial.rejectedAmount?.toLocaleString('ar-SA')} ريال
                        </p>
                      </div>

                      <div className="p-4 bg-amber-50 rounded-xl">
                        <div className="flex items-center gap-2 mb-2">
                          <Loader2 className="w-5 h-5 text-amber-600" />
                          <span className="text-sm text-slate-600">قيد المعالجة</span>
                        </div>
                        <p className="text-2xl font-bold text-amber-600">
                          {reports.financial.pendingWithdrawals}
                        </p>
                        <p className="text-sm text-slate-500 mt-1">
                          {reports.financial.pendingAmount?.toLocaleString('ar-SA')} ريال
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <DollarSign className="w-5 h-5 text-purple-600" />
                      الإيرادات والعمولات
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="p-6 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl text-white">
                        <p className="text-sm opacity-90 mb-2">إجمالي العمولات المحصلة</p>
                        <p className="text-3xl font-bold">
                          {reports.platform.totalCommissions?.toLocaleString('ar-SA')} ريال
                        </p>
                      </div>
                      <div className="p-6 bg-gradient-to-br from-green-500 to-green-600 rounded-xl text-white">
                        <p className="text-sm opacity-90 mb-2">إجمالي الإيرادات</p>
                        <p className="text-3xl font-bold">
                          {reports.financial.totalRevenue?.toLocaleString('ar-SA')} ريال
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
}