import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wallet, TrendingUp, Clock, Lock, DollarSign } from "lucide-react";
import { motion } from "framer-motion";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

export default function WalletOverview({ engineer }) {
  const totalBalance = (engineer?.pending_balance || 0) + (engineer?.available_balance || 0);
  const pendingBalance = engineer?.pending_balance || 0;
  const availableBalance = engineer?.available_balance || 0;

  const stats = [
    {
      title: "الرصيد الكلي",
      value: totalBalance,
      icon: Wallet,
      color: "from-blue-500 to-cyan-500",
      description: "إجمالي الرصيد",
      bgColor: "bg-blue-50"
    },
    {
      title: "الرصيد المعلق",
      value: pendingBalance,
      icon: Lock,
      color: "from-amber-500 to-orange-500",
      description: "في انتظار اعتماد العميل",
      bgColor: "bg-amber-50",
      highlight: true
    },
    {
      title: "الرصيد المتاح",
      value: availableBalance,
      icon: DollarSign,
      color: "from-green-500 to-emerald-500",
      description: "قابل للسحب فوراً",
      bgColor: "bg-green-50"
    }
  ];

  // Data for pie chart
  const chartData = [
    { name: "متاح للسحب", value: availableBalance, color: "#10b981" },
    { name: "معلق (في الضمان)", value: pendingBalance, color: "#f59e0b" }
  ].filter(item => item.value > 0);

  const hasBalance = totalBalance > 0;

  return (
    <div className="space-y-6 mb-8">
      {/* Balance Cards */}
      <div className="grid md:grid-cols-3 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className={`relative overflow-hidden hover-lift ${stat.highlight ? 'border-2 border-amber-300' : ''}`}>
                <div className={`absolute top-0 left-0 w-1 h-full bg-gradient-to-b ${stat.color}`} />
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-slate-600">
                    {stat.title}
                  </CardTitle>
                  <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.color} shadow-lg`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-[#1a1a2e] mb-1">
                    {stat.value.toLocaleString('ar-SA')} <span className="text-lg text-slate-500">ريال</span>
                  </div>
                  <p className="text-xs text-slate-500">{stat.description}</p>
                  
                  {stat.highlight && pendingBalance > 0 && (
                    <div className="mt-3 p-2 bg-amber-100 rounded-lg">
                      <p className="text-xs text-amber-800 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        سيتم تحريره بعد موافقة العميل
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Balance Distribution Chart */}
      {hasBalance && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                توزيع الأرصدة
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row items-center gap-8">
                {/* Pie Chart */}
                <div className="w-full md:w-1/2">
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={5}
                        dataKey="value"
                        label={({ value }) => `${value.toLocaleString('ar-SA')} ر.س`}
                      >
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value) => `${value.toLocaleString('ar-SA')} ريال`}
                        contentStyle={{ direction: 'rtl' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Legend & Stats */}
                <div className="w-full md:w-1/2 space-y-4">
                  {chartData.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-4 h-4 rounded-full" 
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="text-sm font-medium text-slate-700">{item.name}</span>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-slate-900">
                          {item.value.toLocaleString('ar-SA')} ر.س
                        </p>
                        <p className="text-xs text-slate-500">
                          {((item.value / totalBalance) * 100).toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}