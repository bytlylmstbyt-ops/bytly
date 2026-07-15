import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import {
  HardHat, Briefcase, CheckCircle, DollarSign,
  Settings, Star, Eye, Plus, Clock, FileText
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function ContractorDashboard() {
  const [loading, setLoading] = useState(true);
  const [contractor, setContractor] = useState(null);
  const [projects, setProjects] = useState([]);
  const [availableProjects, setAvailableProjects] = useState([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const user = await base44.auth.me();
      const [contractorData] = await base44.entities.Contractor.filter({ email: user.email });

      if (contractorData) {
        setContractor(contractorData);

        const [myProjects, openProjects] = await Promise.all([
          base44.entities.Project.filter({ assigned_engineer_id: contractorData.id }),
          base44.entities.Project.filter({ status: "open" }, "-created_date", 20)
        ]);

        setProjects(myProjects);
        setAvailableProjects(openProjects);
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
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#C9A66B]"></div>
      </div>
    );
  }

  if (!contractor) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-slate-600 mb-4">لم يتم العثور على حساب مقاول مرتبط بحسابك</p>
            <Link to={createPageUrl("RegisterContractor")}>
              <Button>إنشاء حساب مقاول</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const activeProjects = projects.filter(p => p.status === "in_progress");
  const completedProjects = projects.filter(p => p.status === "completed");
  const isApproved = contractor.status === "approved";

  const statCards = [
    {
      title: "المشاريع النشطة",
      value: activeProjects.length,
      icon: Briefcase,
      color: "text-amber-500",
      bgColor: "bg-amber-50"
    },
    {
      title: "مشاريع مكتملة",
      value: completedProjects.length,
      icon: CheckCircle,
      color: "text-green-500",
      bgColor: "bg-green-50"
    },
    {
      title: "رصيد المحفظة",
      value: `${(contractor.wallet_balance || 0).toLocaleString('ar-SA')} ر.س`,
      icon: DollarSign,
      color: "text-purple-500",
      bgColor: "bg-purple-50"
    },
    {
      title: "التقييم",
      value: `${contractor.rating || 0} ⭐`,
      icon: Star,
      color: "text-amber-500",
      bgColor: "bg-amber-50"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-amber-50/30 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          {/* Header */}
          <Card className="border-0 shadow-lg overflow-hidden mb-8">
            <div
              className="h-32 bg-gradient-to-r from-[#6B5D4F] to-[#C9A66B]"
              style={{
                backgroundImage: contractor.cover_image ? `url(${contractor.cover_image})` : undefined,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
            />
            <CardContent className="pt-0">
              <div className="flex flex-col md:flex-row items-start md:items-end gap-4 -mt-16">
                <div className="w-32 h-32 rounded-2xl border-4 border-white shadow-lg bg-white flex items-center justify-center overflow-hidden">
                  {contractor.profile_image ? (
                    <img src={contractor.profile_image} alt={contractor.company_name} className="w-full h-full object-cover" />
                  ) : (
                    <HardHat className="w-16 h-16 text-slate-400" />
                  )}
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-2xl font-bold text-slate-900">{contractor.company_name}</h1>
                    {contractor.is_verified && (
                      <Badge className="bg-blue-100 text-blue-700">
                        <CheckCircle className="w-3 h-3 ml-1" />
                        موثق
                      </Badge>
                    )}
                    <Badge className={
                      isApproved ? "bg-green-100 text-green-700" :
                      contractor.status === "rejected" ? "bg-red-100 text-red-700" :
                      "bg-amber-100 text-amber-700"
                    }>
                      {isApproved ? "معتمد" : contractor.status === "rejected" ? "مرفوض" : "قيد المراجعة"}
                    </Badge>
                  </div>
                  {contractor.bio && (
                    <p className="text-slate-600 mb-3">{contractor.bio}</p>
                  )}
                  <div className="flex flex-wrap gap-3 text-sm text-slate-600">
                    <span>📍 {contractor.city}</span>
                    <span>🔧 {contractor.specialization}</span>
                    {contractor.years_experience > 0 && (
                      <span>📅 {contractor.years_experience} سنة خبرة</span>
                    )}
                    {contractor.website && (
                      <a href={contractor.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        🌐 {contractor.website}
                      </a>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Link to={createPageUrl("Settings")}>
                    <Button variant="outline" className="gap-2">
                      <Settings className="w-4 h-4" />
                      الإعدادات
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>

          {!isApproved && (
            <Card className="border-amber-200 bg-amber-50 mb-6">
              <CardContent className="p-4 flex items-center gap-3">
                <Clock className="w-5 h-5 text-amber-600" />
                <p className="text-sm text-amber-800">
                  حسابك قيد المراجعة من إدارة المنصة. ستتمكن من استقبال الطلبات فور اعتماد حسابك.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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
                        <p className="text-2xl font-bold text-[#6B5D4F]">{stat.value}</p>
                      </div>
                      <div className={`w-14 h-14 rounded-2xl ${stat.bgColor} flex items-center justify-center`}>
                        <stat.icon className={`w-7 h-7 ${stat.color}`} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Main Content Tabs */}
          <Tabs defaultValue="available" className="space-y-6">
            <TabsList className="bg-white shadow-sm">
              <TabsTrigger value="available">المشاريع المتاحة</TabsTrigger>
              <TabsTrigger value="mine">مشاريعي</TabsTrigger>
            </TabsList>

            {/* Available Projects */}
            <TabsContent value="available">
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>المشاريع المتاحة للعرض</span>
                    <Link to={createPageUrl("Projects")}>
                      <Button variant="ghost" size="sm">عرض الكل</Button>
                    </Link>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {availableProjects.length > 0 ? (
                    <div className="space-y-3">
                      {availableProjects.map((project) => (
                        <Link
                          key={project.id}
                          to={createPageUrl("ProjectDetails") + `?id=${project.id}`}
                          className="block p-4 rounded-xl border hover:border-[#C9A66B] hover:shadow-md transition-all"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-semibold text-[#6B5D4F]">{project.title}</h4>
                            <Badge className="bg-amber-100 text-amber-700">مفتوح</Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-slate-500">
                            {project.budget_max && (
                              <span>{project.budget_max.toLocaleString('ar-SA')} ر.س</span>
                            )}
                            {project.location && <span>📍 {project.location}</span>}
                            <span>{project.total_proposals || 0} عرض</span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                      <p className="text-slate-600">لا توجد مشاريع متاحة حالياً</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* My Projects */}
            <TabsContent value="mine">
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>مشاريعي ({projects.length})</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {projects.length > 0 ? (
                    <div className="space-y-3">
                      {projects.map((project) => (
                        <Link
                          key={project.id}
                          to={createPageUrl("ProjectDetails") + `?id=${project.id}`}
                          className="block p-4 rounded-xl border hover:border-[#C9A66B] hover:shadow-md transition-all"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-semibold text-[#6B5D4F]">{project.title}</h4>
                            <Badge className={
                              project.status === "completed" ? "bg-green-100 text-green-700" :
                              project.status === "in_progress" ? "bg-blue-100 text-blue-700" :
                              "bg-amber-100 text-amber-700"
                            }>
                              {project.status === "completed" ? "مكتمل" :
                               project.status === "in_progress" ? "قيد التنفيذ" : "مفتوح"}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-slate-500">
                            {project.budget_max && (
                              <span>{project.budget_max.toLocaleString('ar-SA')} ر.س</span>
                            )}
                            <span>{project.total_proposals || 0} عرض</span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                      <p className="text-slate-600 mb-3">لا توجد مشاريع مسندة إليك بعد</p>
                      <p className="text-sm text-slate-400">تصفّح المشاريع المتاحة وقدم عروضك</p>
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