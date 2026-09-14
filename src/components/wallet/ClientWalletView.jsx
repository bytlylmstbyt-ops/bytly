import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Wallet, Lock, DollarSign, TrendingUp, AlertCircle, PieChartIcon } from "lucide-react";
import { motion } from "framer-motion";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import TransactionHistory from "./TransactionHistory";
import CommissionTracker from "./CommissionTracker";
import DepositPanel from "./DepositPanel";

export default function ClientWalletView({ client, transactions, projects, onRefresh, userEmail }) {
  // Calculate locked funds (escrow for active projects)
  const activeProjects = projects.filter(p => 
    p.status === "in_progress" || p.status === "awaiting_technical_review"
  );
  
  const lockedFunds = activeProjects.reduce((sum, project) => {
    // This would ideally come from a calculation of unpaid milestones
    return sum + (project.escrow_amount || 0);
  }, 0);

  const totalBalance = client.wallet_balance || 0;
  const availableBalance = totalBalance - lockedFunds;

  // Chart data
  const chartData = [
    { name: "متاح", value: availableBalance, color: "#10b981" },
    { name: "محجوز", value: lockedFunds, color: "#f59e0b" }
  ].filter(item => item.value > 0);

  return (
    <div className="space-y-6">
      {/* Wallet Overview */}
      <div className="grid md:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-0 shadow-lg">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <Wallet className="w-8 h-8 text-blue-600" />
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <p className="text-sm text-slate-600 mb-1">الرصيد الإجمالي</p>
              <p className="text-3xl font-bold text-blue-900">
                {totalBalance.toLocaleString('ar-SA')} <span className="text-lg">ر.س</span>
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-0 shadow-lg">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <Lock className="w-8 h-8 text-amber-600" />
                <AlertCircle className="w-5 h-5 text-amber-500" />
              </div>
              <p className="text-sm text-slate-600 mb-1">الأموال المحجوزة (Escrow)</p>
              <p className="text-3xl font-bold text-amber-900">
                {lockedFunds.toLocaleString('ar-SA')} <span className="text-lg">ر.س</span>
              </p>
              <p className="text-xs text-amber-700 mt-2">محجوزة لمشاريع نشطة</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-0 shadow-lg">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <DollarSign className="w-8 h-8 text-green-600" />
              </div>
              <p className="text-sm text-slate-600 mb-1">الرصيد المتاح</p>
              <p className="text-3xl font-bold text-green-900">
                {availableBalance.toLocaleString('ar-SA')} <span className="text-lg">ر.س</span>
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Balance Distribution Chart */}
      {totalBalance > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChartIcon className="w-5 h-5 text-blue-600" />
                توزيع الأرصدة
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row items-center gap-8">
                <div className="w-full md:w-1/2">
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value) => `${value.toLocaleString('ar-SA')} ر.س`}
                        contentStyle={{ direction: 'rtl' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="w-full md:w-1/2 space-y-3">
                  {chartData.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="text-sm font-medium">{item.name}</span>
                      </div>
                      <span className="text-sm font-bold">
                        {item.value.toLocaleString('ar-SA')} ر.س
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Active Projects with Escrow */}
      {activeProjects.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-amber-600" />
              المشاريع النشطة والأموال المحجوزة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {activeProjects.map((project) => (
                <div key={project.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div>
                    <p className="font-medium text-slate-900">{project.title}</p>
                    <Badge className="mt-1 bg-blue-100 text-blue-700 text-xs">
                      {project.status === "in_progress" ? "قيد التنفيذ" : "بانتظار المراجعة"}
                    </Badge>
                  </div>
                  <div className="text-left">
                    <p className="text-lg font-bold text-amber-600">
                      {(project.escrow_amount || 0).toLocaleString('ar-SA')} ر.س
                    </p>
                    <p className="text-xs text-slate-500">محجوز</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

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