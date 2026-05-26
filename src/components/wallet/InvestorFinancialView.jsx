import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  TrendingUp, Building2, DollarSign, PieChart, 
  Target, Activity, Wallet, Lock 
} from "lucide-react";
import { motion } from "framer-motion";
import TransactionHistory from "./TransactionHistory";
import CommissionTracker from "./CommissionTracker";
import DepositPanel from "./DepositPanel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function InvestorFinancialView({ client, transactions, projects, onRefresh, userEmail }) {
  // Calculate financial metrics
  const totalProjects = projects.length;
  const activeProjects = projects.filter(p => p.status === "in_progress").length;
  const completedProjects = projects.filter(p => p.status === "completed").length;

  // Calculate total capital deployed
  const totalDeployed = projects.reduce((sum, project) => {
    // Sum up all project budgets (you might want to use actual spent amounts)
    return sum + (project.budget_max || 0);
  }, 0);

  // Calculate remaining budget (from wallet)
  const remainingBudget = client.wallet_balance || 0;

  // Calculate locked funds in escrow
  const lockedFunds = projects
    .filter(p => p.status === "in_progress")
    .reduce((sum, p) => sum + (p.escrow_amount || 0), 0);

  // Real estate portfolio value
  const portfolioValue = (client.real_estate_portfolio || []).reduce(
    (sum, property) => sum + (property.investment_value || 0), 
    0
  );

  const totalCapital = totalDeployed + remainingBudget;
  const deploymentRate = totalCapital > 0 ? ((totalDeployed / totalCapital) * 100).toFixed(1) : 0;

  return (
    <div className="space-y-6">
      {/* Financial Overview */}
      <div className="grid md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-gradient-to-br from-purple-50 to-indigo-50 border-0 shadow-lg">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <PieChart className="w-8 h-8 text-purple-600" />
              </div>
              <p className="text-sm text-slate-600 mb-1">إجمالي رأس المال</p>
              <p className="text-2xl font-bold text-purple-900">
                {totalCapital.toLocaleString('ar-SA')} <span className="text-sm">ر.س</span>
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-0 shadow-lg">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <Target className="w-8 h-8 text-blue-600" />
              </div>
              <p className="text-sm text-slate-600 mb-1">رأس المال المنتشر</p>
              <p className="text-2xl font-bold text-blue-900">
                {totalDeployed.toLocaleString('ar-SA')} <span className="text-sm">ر.س</span>
              </p>
              <div className="mt-2">
                <Progress value={parseFloat(deploymentRate)} className="h-1" />
                <p className="text-xs text-blue-700 mt-1">{deploymentRate}% منتشر</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-0 shadow-lg">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <Lock className="w-8 h-8 text-amber-600" />
              </div>
              <p className="text-sm text-slate-600 mb-1">الأموال المحجوزة</p>
              <p className="text-2xl font-bold text-amber-900">
                {lockedFunds.toLocaleString('ar-SA')} <span className="text-sm">ر.س</span>
              </p>
              <p className="text-xs text-amber-700 mt-2">في {activeProjects} مشروع نشط</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-0 shadow-lg">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <Wallet className="w-8 h-8 text-green-600" />
              </div>
              <p className="text-sm text-slate-600 mb-1">الرصيد المتاح</p>
              <p className="text-2xl font-bold text-green-900">
                {remainingBudget.toLocaleString('ar-SA')} <span className="text-sm">ر.س</span>
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Portfolio Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-purple-600" />
            ملخص المحفظة العقارية
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-slate-600 mb-1">إجمالي المشاريع</p>
              <p className="text-3xl font-bold text-slate-900">{totalProjects}</p>
            </div>
            <div>
              <p className="text-sm text-slate-600 mb-1">مشاريع نشطة</p>
              <p className="text-3xl font-bold text-blue-600">{activeProjects}</p>
            </div>
            <div>
              <p className="text-sm text-slate-600 mb-1">مشاريع مكتملة</p>
              <p className="text-3xl font-bold text-green-600">{completedProjects}</p>
            </div>
          </div>

          {portfolioValue > 0 && (
            <div className="mt-6 pt-6 border-t">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">قيمة المحفظة العقارية</span>
                <span className="text-2xl font-bold text-purple-600">
                  {portfolioValue.toLocaleString('ar-SA')} ر.س
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Projects Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-600" />
            تفصيل المشاريع والميزانيات
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {projects.map((project) => (
              <div key={project.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                <div className="flex-1">
                  <p className="font-medium text-slate-900 mb-1">{project.title}</p>
                  <div className="flex items-center gap-2">
                    <Badge className={
                      project.status === "completed" 
                        ? "bg-green-100 text-green-700"
                        : project.status === "in_progress"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-slate-100 text-slate-700"
                    }>
                      {project.status === "completed" ? "مكتمل" : 
                       project.status === "in_progress" ? "قيد التنفيذ" : "معلق"}
                    </Badge>
                    {project.escrow_amount > 0 && (
                      <Badge className="bg-amber-100 text-amber-700 flex items-center gap-1">
                        <Lock className="w-3 h-3" />
                        محجوز: {project.escrow_amount.toLocaleString('ar-SA')} ر.س
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="text-left">
                  <p className="text-lg font-bold text-slate-900">
                    {(project.budget_max || 0).toLocaleString('ar-SA')} ر.س
                  </p>
                  <p className="text-xs text-slate-500">الميزانية</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tabbed bottom section */}
      <Tabs defaultValue="transactions">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="transactions">سجل المعاملات</TabsTrigger>
          <TabsTrigger value="deposit">إيداع رصيد</TabsTrigger>
          <TabsTrigger value="commissions">العمولات</TabsTrigger>
        </TabsList>
        <TabsContent value="transactions">
          <TransactionHistory transactions={transactions} />
        </TabsContent>
        <TabsContent value="deposit">
          <DepositPanel profile={client} userEmail={userEmail} onSuccess={onRefresh} />
        </TabsContent>
        <TabsContent value="commissions">
          <CommissionTracker transactions={transactions} userType="client" />
        </TabsContent>
      </Tabs>
    </div>
  );
}