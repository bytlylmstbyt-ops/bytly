import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { 
  Building2, Users, Briefcase, CheckCircle, DollarSign, Plus, Settings, Star, Award, Eye
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function FirmDashboard() {
  const [loading, setLoading] = useState(true);
  const [firm, setFirm] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [engineers, setEngineers] = useState([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const user = await base44.auth.me();
      const [firmData] = await base44.entities.EngineeringFirm.filter({ email: user.email });
      
      if (firmData) {
        setFirm(firmData);
        
        const [members, projectsData, engineersData] = await Promise.all([
          base44.entities.FirmTeamMember.filter({ firm_id: firmData.id }),
          base44.entities.Project.filter({ client_id: firmData.id }),
          base44.entities.Engineer.filter({ status: "approved" }, "-created_date", 20)
        ]);

        setTeamMembers(members);
        setProjects(projectsData);
        setEngineers(engineersData);
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

  if (!firm) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-slate-600 mb-4">لم يتم العثور على حساب الشركة الاستشارية</p>
            <Link to={createPageUrl("RegisterFirm")}>
              <Button>إنشاء حساب شركة استشارية</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const activeProjects = projects.filter(p => p.status === "in_progress");
  const completedProjects = projects.filter(p => p.status === "completed");
  const hasSubscription = firm.subscription_type !== "none";

  const statCards = [
    {
      title: "أعضاء الفريق",
      value: teamMembers.length,
      icon: Users,
      color: "bg-blue-500",
      bgColor: "bg-blue-50"
    },
    {
      title: "المشاريع النشطة",
      value: activeProjects.length,
      icon: Briefcase,
      color: "bg-amber-500",
      bgColor: "bg-amber-50"
    },
    {
      title: "مشاريع مكتملة",
      value: completedProjects.length,
      icon: CheckCircle,
      color: "bg-green-500",
      bgColor: "bg-green-50"
    },
    {
      title: "رصيد المحفظة",
      value: `${(firm.wallet_balance || 0).toLocaleString('ar-SA')} ر.س`,
      icon: DollarSign,
      color: "bg-purple-500",
      bgColor: "bg-purple-50"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-amber-50/30 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          {/* Header with Company Info */}
          <Card className="border-0 shadow-lg overflow-hidden mb-8">
            <div 
              className="h-32 bg-gradient-to-r from-[#1a1a2e] to-[#C9A66B]"
              style={{ 
                backgroundImage: firm.cover_image ? `url(${firm.cover_image})` : undefined,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
            />
            <CardContent className="pt-0">
              <div className="flex flex-col md:flex-row items-start md:items-end gap-4 -mt-16">
                <div className="w-32 h-32 rounded-2xl border-4 border-white shadow-lg bg-white flex items-center justify-center overflow-hidden">
                  {firm.company_logo ? (
                    <img src={firm.company_logo} alt={firm.company_name} className="w-full h-full object-cover" />
                  ) : (
                    <Building2 className="w-16 h-16 text-slate-400" />
                  )}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-2xl font-bold text-slate-900">{firm.company_name}</h1>
                    {firm.is_verified && (
                      <Badge className="bg-blue-100 text-blue-700">
                        <CheckCircle className="w-3 h-3 ml-1" />
                        موثق
                      </Badge>
                    )}
                    {hasSubscription && (
                      <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white">
                        <Award className="w-3 h-3 ml-1" />
                        عضوية مميزة
                      </Badge>
                    )}
                  </div>
                  {firm.description && (
                    <p className="text-slate-600 mb-3">{firm.description}</p>
                  )}
                  <div className="flex flex-wrap gap-3 text-sm text-slate-600">
                    <span>📍 {firm.city}</span>
                    <span>📅 تأسست عام {firm.established_year}</span>
                    {firm.website && (
                      <a href={firm.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        🌐 {firm.website}
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
                  {!hasSubscription && (
                    <Link to={createPageUrl("Subscription")}>
                      <Button className="bg-gradient-to-r from-amber-500 to-orange-500 text-white">
                        <Award className="w-4 h-4 ml-2" />
                        ترقية الحساب
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

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

          {/* Main Content Tabs */}
          <Tabs defaultValue="projects" className="space-y-6">
            <TabsList className="bg-white shadow-sm">
              <TabsTrigger value="projects">المشاريع</TabsTrigger>
              <TabsTrigger value="team">الفريق</TabsTrigger>
              <TabsTrigger value="engineers">قاعدة المواهب</TabsTrigger>
            </TabsList>

            <TabsContent value="projects">
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>مشاريع الشركة</span>
                    <Link to={createPageUrl("CreateProject")}>
                      <Button className="bg-gradient-to-r from-[#1a1a2e] to-[#C9A66B] text-white">
                        <Plus className="w-5 h-5 ml-2" />
                        مشروع جديد
                      </Button>
                    </Link>
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
                            <h4 className="font-semibold text-[#1a1a2e]">{project.title}</h4>
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
                            <span>{project.budget_max?.toLocaleString('ar-SA')} ر.س</span>
                            <span>{project.total_proposals || 0} عرض</span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                      <p className="text-slate-600 mb-3">لا توجد مشاريع بعد</p>
                      <Link to={createPageUrl("CreateProject")}>
                        <Button variant="outline">أنشئ مشروعك الأول</Button>
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="team">
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>أعضاء الفريق ({teamMembers.length})</span>
                    <Button className="bg-gradient-to-r from-[#1a1a2e] to-[#C9A66B] text-white">
                      <Plus className="w-5 h-5 ml-2" />
                      إضافة عضو
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {teamMembers.length > 0 ? (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {teamMembers.map((member) => (
                        <Card key={member.id} className="border hover:shadow-md transition-shadow">
                          <CardContent className="p-4">
                            <div className="flex items-center gap-3 mb-3">
                              <Avatar>
                                <AvatarImage src={member.profile_image} />
                                <AvatarFallback>{member.full_name?.charAt(0)}</AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <h4 className="font-medium text-slate-900">{member.full_name}</h4>
                                <p className="text-sm text-slate-600">{member.position}</p>
                              </div>
                            </div>
                            <p className="text-xs text-slate-500">{member.specialization}</p>
                            {member.years_experience && (
                              <p className="text-xs text-slate-500 mt-1">{member.years_experience} سنوات خبرة</p>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                      <p className="text-slate-600 mb-3">لا يوجد أعضاء في الفريق</p>
                      <Button variant="outline">إضافة أول عضو</Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="engineers">
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>قاعدة المواهب الهندسية</span>
                    <Link to={createPageUrl("Engineers")}>
                      <Button variant="ghost" size="sm">عرض الكل</Button>
                    </Link>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {engineers.length > 0 ? (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {engineers.map((engineer) => (
                        <Link
                          key={engineer.id}
                          to={createPageUrl("EngineerProfile") + `?id=${engineer.id}`}
                          className="block p-4 rounded-xl border hover:border-[#C9A66B] hover:shadow-md transition-all"
                        >
                          <div className="flex items-center gap-3 mb-3">
                            <Avatar>
                              <AvatarImage src={engineer.profile_image} />
                              <AvatarFallback>{engineer.full_name?.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <h4 className="font-medium text-slate-900">{engineer.full_name}</h4>
                              <p className="text-sm text-slate-600">{engineer.specialization}</p>
                            </div>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="flex items-center gap-1 text-amber-600">
                              <Star className="w-4 h-4 fill-amber-600" />
                              {engineer.rating || 0}
                            </span>
                            <span className="text-slate-500">{engineer.completed_projects || 0} مشروع</span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Eye className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                      <p className="text-slate-600">استكشف المهندسين المتاحين</p>
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