import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { 
  Briefcase, FileText, Clock, CheckCircle, DollarSign,
  TrendingUp, Users, Eye, MessageSquare, Calendar, Plus
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function ClientDashboard() {
  const [loading, setLoading] = useState(true);
  const [client, setClient] = useState(null);
  const [stats, setStats] = useState({
    totalProjects: 0,
    openProjects: 0,
    inProgressProjects: 0,
    completedProjects: 0,
    totalSpent: 0,
    activeProposals: 0
  });
  const [recentProjects, setRecentProjects] = useState([]);
  const [recentProposals, setRecentProposals] = useState([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const user = await base44.auth.me();
      const [clientData] = await base44.entities.Client.filter({ email: user.email });
      setClient(clientData);

      if (clientData) {
        // Load projects
        const projects = await base44.entities.Project.filter({ client_id: clientData.id });
        
        // Load proposals for all projects
        const allProposals = await base44.entities.Proposal.filter({});
        const myProposals = allProposals.filter(p => 
          projects.some(proj => proj.id === p.project_id)
        );

        // Calculate stats
        const openProjects = projects.filter(p => p.status === "open");
        const inProgressProjects = projects.filter(p => p.status === "in_progress");
        const completedProjects = projects.filter(p => p.status === "completed");
        const totalSpent = completedProjects.reduce((sum, p) => sum + (p.escrow_amount || 0), 0);
        const activeProposals = myProposals.filter(p => p.status === "pending").length;

        setStats({
          totalProjects: projects.length,
          openProjects: openProjects.length,
          inProgressProjects: inProgressProjects.length,
          completedProjects: completedProjects.length,
          totalSpent,
          activeProposals
        });

        // Get recent projects
        setRecentProjects(projects.slice(0, 5));

        // Get recent proposals
        setRecentProposals(myProposals.slice(0, 5));
      }
    } catch (error) {
      console.error("Error loading dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#d4a574]"></div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-slate-600 mb-4">لم يتم العثور على حساب عميل</p>
            <Link to={createPageUrl("RegisterClient")}>
              <Button>إنشاء حساب عميل</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statCards = [
    {
      title: "إجمالي المشاريع",
      value: stats.totalProjects,
      icon: Briefcase,
      color: "bg-blue-500",
      bgColor: "bg-blue-50"
    },
    {
      title: "مشاريع مفتوحة",
      value: stats.openProjects,
      icon: Clock,
      color: "bg-green-500",
      bgColor: "bg-green-50"
    },
    {
      title: "قيد التنفيذ",
      value: stats.inProgressProjects,
      icon: TrendingUp,
      color: "bg-amber-500",
      bgColor: "bg-amber-50"
    },
    {
      title: "مكتملة",
      value: stats.completedProjects,
      icon: CheckCircle,
      color: "bg-purple-500",
      bgColor: "bg-purple-50"
    },
    {
      title: "إجمالي الإنفاق",
      value: `${stats.totalSpent.toLocaleString('ar-SA')} ر.س`,
      icon: DollarSign,
      color: "bg-emerald-500",
      bgColor: "bg-emerald-50"
    },
    {
      title: "عروض جديدة",
      value: stats.activeProposals,
      icon: Users,
      color: "bg-rose-500",
      bgColor: "bg-rose-50"
    }
  ];

  const statusColors = {
    open: "bg-green-100 text-green-700",
    in_progress: "bg-blue-100 text-blue-700",
    completed: "bg-slate-100 text-slate-700"
  };

  const statusLabels = {
    open: "مفتوح",
    in_progress: "قيد التنفيذ",
    completed: "مكتمل"
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-amber-50/30 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-[#1a1a2e] mb-2">
                مرحباً، {client.full_name}
              </h1>
              <p className="text-slate-600">لوحة تحكم العميل</p>
            </div>
            <Link to={createPageUrl("CreateProject")}>
              <Button className="bg-gradient-to-r from-[#1a1a2e] to-[#d4a574] text-white">
                <Plus className="w-5 h-5 ml-2" />
                مشروع جديد
              </Button>
            </Link>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {statCards.map((stat, index) => (
              <motion.div
                key={stat.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-slate-500 mb-1">{stat.title}</p>
                        <p className="text-2xl font-bold text-[#1a1a2e]">{stat.value}</p>
                      </div>
                      <div className={`w-14 h-14 rounded-2xl ${stat.bgColor} flex items-center justify-center`}>
                        <stat.icon className={`w-7 h-7 ${stat.color.replace('bg-', 'text-')}`} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Recent Projects */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>مشاريعي</span>
                  <Link to={createPageUrl("Projects")}>
                    <Button variant="ghost" size="sm">
                      عرض الكل
                    </Button>
                  </Link>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {recentProjects.length > 0 ? (
                  <div className="space-y-3">
                    {recentProjects.map((project) => (
                      <Link
                        key={project.id}
                        to={createPageUrl("ProjectDetails") + `?id=${project.id}`}
                        className="block p-4 rounded-xl border hover:border-[#d4a574] hover:shadow-md transition-all"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-semibold text-[#1a1a2e]">{project.title}</h4>
                          <Badge className={statusColors[project.status]}>
                            {statusLabels[project.status]}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-slate-500">
                          <span className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            {project.total_proposals || 0} عرض
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {new Date(project.created_date).toLocaleDateString('ar-SA')}
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

            {/* Recent Proposals */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>العروض الواردة</CardTitle>
              </CardHeader>
              <CardContent>
                {recentProposals.length > 0 ? (
                  <div className="space-y-3">
                    {recentProposals.map((proposal) => {
                      const project = recentProjects.find(p => p.id === proposal.project_id);
                      return (
                        <Link
                          key={proposal.id}
                          to={createPageUrl("ProjectDetails") + `?id=${proposal.project_id}`}
                          className="block p-4 rounded-xl border hover:border-[#d4a574] hover:shadow-md transition-all"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <p className="font-medium text-[#1a1a2e] text-sm">{project?.title}</p>
                              <p className="text-xl font-bold text-green-600 mt-1">
                                {proposal.price?.toLocaleString('ar-SA')} ر.س
                              </p>
                            </div>
                            <Badge className={
                              proposal.status === "accepted" ? "bg-green-100 text-green-700" :
                              proposal.status === "rejected" ? "bg-red-100 text-red-700" :
                              "bg-amber-100 text-amber-700"
                            }>
                              {proposal.status === "accepted" ? "مقبول" :
                               proposal.status === "rejected" ? "مرفوض" : "قيد المراجعة"}
                            </Badge>
                          </div>
                          <p className="text-sm text-slate-500">
                            مدة التسليم: {proposal.delivery_days} يوم
                          </p>
                        </Link>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500">لا توجد عروض بعد</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </motion.div>
      </div>
    </div>
  );
}