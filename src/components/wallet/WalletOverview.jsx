import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wallet, TrendingUp, Clock, ArrowUpRight } from "lucide-react";
import { motion } from "framer-motion";

export default function WalletOverview({ engineer }) {
  const totalBalance = (engineer?.pending_balance || 0) + (engineer?.available_balance || 0);

  const stats = [
    {
      title: "الرصيد الكلي",
      value: totalBalance,
      icon: Wallet,
      color: "from-blue-500 to-cyan-500",
      description: "إجمالي الرصيد"
    },
    {
      title: "الرصيد المعلق",
      value: engineer?.pending_balance || 0,
      icon: Clock,
      color: "from-amber-500 to-orange-500",
      description: "في انتظار اعتماد العميل"
    },
    {
      title: "الرصيد المتاح",
      value: engineer?.available_balance || 0,
      icon: TrendingUp,
      color: "from-green-500 to-emerald-500",
      description: "قابل للسحب"
    }
  ];

  return (
    <div className="grid md:grid-cols-3 gap-6 mb-8">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="relative overflow-hidden hover-lift">
              <div className={`absolute top-0 left-0 w-1 h-full bg-gradient-to-b ${stat.color}`} />
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-lg bg-gradient-to-br ${stat.color}`}>
                  <Icon className="w-4 h-4 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-[#1a1a2e] mb-1">
                  {stat.value.toLocaleString('ar-SA')} <span className="text-lg text-slate-500">ريال</span>
                </div>
                <p className="text-xs text-slate-500">{stat.description}</p>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}