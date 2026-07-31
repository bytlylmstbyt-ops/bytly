import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { 
  Building2, DollarSign, TrendingUp, Briefcase, 
  Star, Plus, BarChart3, Eye, CheckCircle, Clock
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import MasterProgressDashboard from "@/components/investor/MasterProgressDashboard";

export default function InvestorClientDashboard({ client, stats, recentProjects }) {
  const [preferredFirms, setPreferredFirms] = useState([]);

  useEffect(() => {
    if (client.preferred_firms?.length) {
      loadPreferredFirms();
    }
  }, [client]);

  const loadPreferredFirms = async () => {
    const firms = await base44.entities.EngineeringFirm.filter({
      id: { $in: client.preferred_firms }
    });
    setPreferredFirms(firms);
  };

  const addToShortlist = async (firmId) => {
    const updated = [...(client.preferred_firms || []), firmId];
    await base44.entities.Client.update(client.id, {
      preferred_firms: updated
    });
    await loadPreferredFirms();
  };

  const financialStats = [
    {
      title: "إجمالي الاستثمار",
      value: `${stats.totalSpent.toLocaleString('ar-SA')} ر.س`,
      icon: DollarSign,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50"
    },
    {
      title: "متوسط تكلفة المشروع",
      value: stats.totalProjects > 0 ? 
        `${Math.round(stats.totalSpent / stats.totalProjects).toLocaleString('ar-SA')} ر.س` : 
        "0 ر.س",
      icon: BarChart3,
      color: "text-blue-600",
      bgColor: "bg-blue-50"
    },
    {
      title: "المشاريع النشطة",
      value: stats.inProgressProjects,
      icon: Briefcase,
      color: "text-amber-600",
      bgColor: "bg-amber-50"
    }
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 text-white"
      >
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">
              {client.company_name || client.full_name}
            </h2>
            <p className="text-slate-300">لوحة تحكم المستثمر</p>
            <div className="flex items-center gap-4 mt-4">
              <div className="flex items-center gap-2">
                <Briefcase className="w-4 h-4" />
                <span className="text-sm">{stats.totalProjects} مشروع</span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                <span className="text-sm">{stats.inProgressProjects} نشط</span>
              </div>
            </div>
          </div>
          <Building2 className="w-12 h-12 opacity-20" />
        </div>
      </motion.div>

      {/* Financial Analytics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {financialStats.map((stat, idx) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500 mb-1">{stat.title}</p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                  </div>
                  <div className={`w-12 h-12 rounded-xl ${stat.bgColor} flex items-center justify-center`}>
                    <stat.icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Master Progress Dashboard */}
        <div className="lg:col-span-2">
          <MasterProgressDashboard projects={recentProjects} />

          <Card className="mt-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>جميع المشاريع</CardTitle>
                <Link to={createPageUrl("CreateProject")}>
                  <Button size="sm">
                    <Plus className="w-4 h-4 ml-2" />
                    مشروع جديد
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {recentProjects.length > 0 ? (
                <div className="space-y-3">
                  {recentProjects.map((project) => (
                    <Link
                      key={project.id}
                      to={createPageUrl("ProjectDetails") + `?id=${project.id}`}
                      className="block p-4 rounded-xl border hover:border-[#C9A66B] hover:shadow-md transition-all"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h4 className="font-semibold text-[#1a1a2e]">{project.title}</h4>
                          <p className="text-sm text-slate-500 mt-1">{project.category}</p>
                        </div>
                        <Badge className={
                          project.status === "completed" ? "bg-green-100 text-green-700" :
                          project.status === "in_progress" ? "bg-blue-100 text-blue-700" :
                          "bg-slate-100 text-slate-700"
                        }>
                          {project.status === "open" ? "مفتوح" :
                           project.status === "in_progress" ? "قيد التنفيذ" : "مكتمل"}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-slate-500">
                        <span className="flex items-center gap-1">
                          <DollarSign className="w-4 h-4" />
                          {project.escrow_amount?.toLocaleString('ar-SA') || 0} ر.س
                        </span>
                        <span className="flex items-center gap-1">
                          <Eye className="w-4 h-4" />
                          {project.total_proposals || 0} عرض
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500">لا توجد مشاريع بعد</p>
                  <Link to={createPageUrl("CreateProject")}>
                    <Button variant="outline" size="sm" className="mt-3">
                      أنشئ مشروعك الأول
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Preferred Firms Shortlist */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="w-5 h-5 text-amber-500" />
                الشركات المفضلة
              </CardTitle>
            </CardHeader>
            <CardContent>
              {preferredFirms.length > 0 ? (
                <div className="space-y-3">
                  {preferredFirms.map((firm) => (
                    <div
                      key={firm.id}
                      className="flex items-center gap-3 p-3 rounded-lg border hover:border-[#C9A66B] transition-colors"
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={firm.company_logo} />
                        <AvatarFallback>{firm.company_name?.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{firm.company_name}</p>
                        <p className="text-xs text-slate-500">
                          {firm.total_projects || 0} مشروع
                        </p>
                      </div>
                      {firm.is_verified && (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Star className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-sm text-slate-500">لا توجد شركات مفضلة</p>
                  <Link to={createPageUrl("Engineers")}>
                    <Button variant="outline" size="sm" className="mt-3">
                      تصفح الشركات
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}