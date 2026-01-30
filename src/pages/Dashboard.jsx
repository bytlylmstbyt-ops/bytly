import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { 
  Briefcase, Wallet, Star, MessageSquare, Eye, 
  TrendingUp, Clock, CheckCircle, Plus, ArrowLeft,
  Upload, Settings, Grid3X3, FileText, DollarSign, Award,
  Shield, Users, FileCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [userType, setUserType] = useState(null); // 'engineer' or 'client'
  const [stats, setStats] = useState({});
  const [recentProjects, setRecentProjects] = useState([]);
  const [recentProposals, setRecentProposals] = useState([]);
  const [approvedProjects, setApprovedProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setIsLoading(true);
    const currentUser = await base44.auth.me();
    setUser(currentUser);
    
    // Check if user is Admin
    if (currentUser.role === 'admin') {
      setIsAdmin(true);
      // Load approved projects for admin
      const approved = await base44.entities.Project.filter({ 
        status: "technical_approved" 
      });
      setApprovedProjects(approved);
    }

    // Check if user is engineer or client
    const [engineerData, clientData] = await Promise.all([
      base44.entities.Engineer.filter({ email: currentUser.email }),
      base44.entities.Client.filter({ email: currentUser.email })
    ]);

    if (engineerData.length > 0) {
      setUserType("engineer");
      setProfile(engineerData[0]);

      // Load engineer stats
      const [portfolios, proposals, reviews] = await Promise.all([
        base44.entities.Portfolio.filter({ engineer_id: engineerData[0].id }),
        base44.entities.Proposal.filter({ engineer_id: engineerData[0].id }),
        base44.entities.Review.filter({ engineer_id: engineerData[0].id })
      ]);

      setStats({
        portfolioCount: portfolios.length,
        proposalsCount: proposals.length,
        reviewsCount: reviews.length,
        rating: engineerData[0].rating || 0,
        completedProjects: engineerData[0].completed_projects || 0,
        walletBalance: engineerData[0].wallet_balance || 0
      });

      setRecentProposals(proposals.slice(0, 5));
    } else if (clientData.length > 0) {
      setUserType("client");
      setProfile(clientData[0]);

      // Load client stats
      const projects = await base44.entities.Project.filter({ client_id: clientData[0].id });

      setStats({
        totalProjects: projects.length,
        openProjects: projects.filter(p => p.status === "open").length,
        inProgressProjects: projects.filter(p => p.status === "in_progress").length,
        completedProjects: projects.filter(p => p.status === "completed").length,
        walletBalance: clientData[0].wallet_balance || 0
      });

      setRecentProjects(projects.slice(0, 5));
    }

    setIsLoading(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#d4a574]"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="p-8 text-center">
            <h2 className="text-xl font-bold text-slate-700 mb-4">لم يتم العثور على حساب</h2>
            <p className="text-slate-500 mb-6">يرجى إكمال التسجيل أولاً</p>
            <Link to={createPageUrl("RegisterChoice")}>
              <Button className="bg-gradient-to-r from-[#1a1a2e] to-[#d4a574] text-white">
                إنشاء حساب جديد
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-amber-50/30 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <Avatar className="w-16 h-16 border-2 border-white shadow-lg">
                <AvatarImage src={profile.profile_image} />
                <AvatarFallback className="bg-gradient-to-br from-[#1a1a2e] to-[#d4a574] text-white text-xl">
                  {profile.full_name?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-2xl font-bold text-[#1a1a2e]">
                  مرحباً، {profile.full_name}
                </h1>
                <p className="text-slate-500">
                  {userType === "engineer" ? profile.specialization : "صاحب مشاريع"}
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              {userType === "engineer" ? (
                <Link to={createPageUrl("AddPortfolio")}>
                  <Button className="bg-gradient-to-r from-[#1a1a2e] to-[#d4a574] text-white">
                    <Plus className="w-5 h-5 ml-2" />
                    إضافة عمل جديد
                  </Button>
                </Link>
              ) : (
                <Link to={createPageUrl("CreateProject")}>
                  <Button className="bg-gradient-to-r from-[#1a1a2e] to-[#d4a574] text-white">
                    <Plus className="w-5 h-5 ml-2" />
                    مشروع جديد
                  </Button>
                </Link>
              )}
              <Link to={createPageUrl("Settings")}>
                <Button variant="outline">
                  <Settings className="w-5 h-5" />
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {userType === "engineer" ? (
            <>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card className="border-0 shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                        <Grid3X3 className="w-6 h-6 text-blue-600" />
                      </div>
                      <Badge variant="secondary" className="bg-blue-50 text-blue-700">
                        أعمالي
                      </Badge>
                    </div>
                    <p className="text-3xl font-bold text-[#1a1a2e]">{stats.portfolioCount}</p>
                    <p className="text-sm text-slate-500">عمل في المعرض</p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card className="border-0 shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                        <CheckCircle className="w-6 h-6 text-green-600" />
                      </div>
                      <Badge variant="secondary" className="bg-green-50 text-green-700">
                        مكتمل
                      </Badge>
                    </div>
                    <p className="text-3xl font-bold text-[#1a1a2e]">{stats.completedProjects}</p>
                    <p className="text-sm text-slate-500">مشروع مكتمل</p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Card className="border-0 shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
                        <Star className="w-6 h-6 text-amber-600" />
                      </div>
                      <Badge variant="secondary" className="bg-amber-50 text-amber-700">
                        التقييم
                      </Badge>
                    </div>
                    <p className="text-3xl font-bold text-[#1a1a2e]">{stats.rating?.toFixed(1)}</p>
                    <p className="text-sm text-slate-500">{stats.reviewsCount} تقييم</p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Card className="border-0 shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                        <Wallet className="w-6 h-6 text-purple-600" />
                      </div>
                      <Badge variant="secondary" className="bg-purple-50 text-purple-700">
                        المحفظة
                      </Badge>
                    </div>
                    <p className="text-3xl font-bold text-[#1a1a2e]">{stats.walletBalance?.toLocaleString()}</p>
                    <p className="text-sm text-slate-500">ر.س</p>
                  </CardContent>
                </Card>
              </motion.div>
            </>
          ) : (
            <>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card className="border-0 shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                        <Briefcase className="w-6 h-6 text-blue-600" />
                      </div>
                    </div>
                    <p className="text-3xl font-bold text-[#1a1a2e]">{stats.totalProjects}</p>
                    <p className="text-sm text-slate-500">إجمالي المشاريع</p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card className="border-0 shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                        <Clock className="w-6 h-6 text-green-600" />
                      </div>
                    </div>
                    <p className="text-3xl font-bold text-[#1a1a2e]">{stats.openProjects}</p>
                    <p className="text-sm text-slate-500">مشاريع مفتوحة</p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Card className="border-0 shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
                        <TrendingUp className="w-6 h-6 text-amber-600" />
                      </div>
                    </div>
                    <p className="text-3xl font-bold text-[#1a1a2e]">{stats.inProgressProjects}</p>
                    <p className="text-sm text-slate-500">قيد التنفيذ</p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Card className="border-0 shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                        <Wallet className="w-6 h-6 text-purple-600" />
                      </div>
                    </div>
                    <p className="text-3xl font-bold text-[#1a1a2e]">{stats.walletBalance?.toLocaleString()}</p>
                    <p className="text-sm text-slate-500">ر.س في المحفظة</p>
                  </CardContent>
                </Card>
              </motion.div>
            </>
          )}
        </div>

        {/* Account Status for Engineers */}
        {userType === "engineer" && profile.status === "pending" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="border-amber-200 bg-amber-50 mb-8">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-amber-800">حسابك قيد المراجعة</h3>
                  <p className="text-sm text-amber-600">سيتم مراجعة حسابك والموافقة عليه خلال 24-48 ساعة</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Subscription Card for Engineers */}
        {userType === "engineer" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="border-0 shadow-lg mb-8 overflow-hidden">
              <div className="bg-gradient-to-r from-[#1a1a2e] to-[#d4a574] p-6 text-white">
                <h3 className="text-xl font-bold mb-2">ترقية حسابك</h3>
                <p className="text-white/80">احصل على مزايا إضافية وظهور أفضل</p>
              </div>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="border rounded-xl p-6 hover:border-[#d4a574] transition-colors cursor-pointer">
                    <Badge className="bg-blue-100 text-blue-700 mb-4">شهري</Badge>
                    <p className="text-3xl font-bold text-[#1a1a2e]">99 <span className="text-sm font-normal">ر.س/شهر</span></p>
                    <ul className="mt-4 space-y-2 text-sm text-slate-600">
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        ظهور في المقدمة
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        شارة مميز
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        تقديم عروض غير محدودة
                      </li>
                    </ul>
                    <Link to={createPageUrl("Subscription") + "?plan=monthly"}>
                      <Button className="w-full mt-4" variant="outline">اختر الخطة</Button>
                    </Link>
                  </div>
                  <div className="border-2 border-[#d4a574] rounded-xl p-6 relative">
                    <Badge className="absolute -top-3 right-4 bg-[#d4a574] text-white">الأفضل قيمة</Badge>
                    <Badge className="bg-amber-100 text-amber-700 mb-4">سنوي</Badge>
                    <p className="text-3xl font-bold text-[#1a1a2e]">799 <span className="text-sm font-normal">ر.س/سنة</span></p>
                    <p className="text-sm text-green-600">وفر 389 ر.س</p>
                    <ul className="mt-4 space-y-2 text-sm text-slate-600">
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        جميع مزايا الشهري
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        أولوية في نتائج البحث
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        دعم فني مخصص
                      </li>
                    </ul>
                    <Link to={createPageUrl("Subscription") + "?plan=yearly"}>
                      <Button className="w-full mt-4 bg-gradient-to-r from-[#1a1a2e] to-[#d4a574] text-white">
                        اختر الخطة
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Admin Quick Links */}
        {isAdmin && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <Card className="border-0 shadow-lg border-t-4 border-t-blue-600">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-6 h-6 text-blue-600" />
                  لوحة الإدارة - روابط سريعة
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid md:grid-cols-3 gap-4">
                  <Link to={createPageUrl("AllWithdrawalRequests")}>
                    <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 border-blue-200 hover:border-blue-400">
                      <CardContent className="p-6 text-center">
                        <div className="w-16 h-16 mx-auto bg-blue-100 rounded-full flex items-center justify-center mb-4">
                          <FileCheck className="w-8 h-8 text-blue-600" />
                        </div>
                        <h3 className="font-bold text-lg mb-2">طلبات السحب</h3>
                        <p className="text-sm text-slate-600">مراجعة واعتماد جميع طلبات السحب</p>
                      </CardContent>
                    </Card>
                  </Link>

                  <Link to={createPageUrl("CertificationPage")}>
                    <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 border-green-200 hover:border-green-400">
                      <CardContent className="p-6 text-center">
                        <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-4">
                          <Award className="w-8 h-8 text-green-600" />
                        </div>
                        <h3 className="font-bold text-lg mb-2">شهادات الجودة</h3>
                        <p className="text-sm text-slate-600">مراجعة الشهادات والاعتمادات</p>
                      </CardContent>
                    </Card>
                  </Link>

                  <Link to={createPageUrl("AdminWallet")}>
                    <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 border-purple-200 hover:border-purple-400">
                      <CardContent className="p-6 text-center">
                        <div className="w-16 h-16 mx-auto bg-purple-100 rounded-full flex items-center justify-center mb-4">
                          <Wallet className="w-8 h-8 text-purple-600" />
                        </div>
                        <h3 className="font-bold text-lg mb-2">إدارة المحافظ</h3>
                        <p className="text-sm text-slate-600">مراجعة طلبات السحب</p>
                      </CardContent>
                    </Card>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Admin Section - Approved Projects */}
        {isAdmin && approvedProjects.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <Card className="border-0 shadow-lg border-t-4 border-t-[#d4a574]">
              <CardHeader className="bg-gradient-to-r from-amber-50 to-green-50">
                <CardTitle className="flex items-center gap-2">
                  <Award className="w-6 h-6 text-[#d4a574]" />
                  المشاريع المعتمدة - لوحة الإدارة
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {approvedProjects.slice(0, 5).map(project => (
                    <Link 
                      key={project.id} 
                      to={createPageUrl("CertificationPage") + `?id=${project.id}`}
                      className="block"
                    >
                      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl hover:shadow-md transition-shadow border border-green-200">
                        <div className="flex-1">
                          <p className="font-bold text-[#1a1a2e]">{project.title}</p>
                          <p className="text-sm text-slate-600 mt-1">
                            العميل: {project.client_id?.slice(0, 8)}... | المبلغ: {project.escrow_amount?.toLocaleString()} ر.س
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge className="bg-green-100 text-green-700">
                            معتمد فنياً
                          </Badge>
                          <Button 
                            size="sm" 
                            className="bg-gradient-to-r from-[#1a1a2e] to-[#d4a574] text-white"
                          >
                            <Award className="w-4 h-4 ml-2" />
                            عرض الشهادة
                          </Button>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
                {approvedProjects.length > 5 && (
                  <div className="text-center mt-4">
                    <Link to={createPageUrl("Projects") + "?status=technical_approved"}>
                      <Button variant="outline" className="text-[#d4a574]">
                        عرض جميع المشاريع المعتمدة ({approvedProjects.length})
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle>
                {userType === "engineer" ? "عروضي الأخيرة" : "مشاريعي الأخيرة"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {userType === "engineer" ? (
                recentProposals.length > 0 ? (
                  <div className="space-y-4">
                    {recentProposals.map(proposal => (
                      <div key={proposal.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                        <div>
                          <p className="font-medium text-[#1a1a2e]">عرض #{proposal.id?.slice(-6)}</p>
                          <p className="text-sm text-slate-500">{proposal.price?.toLocaleString()} ر.س</p>
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
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-500">
                    <FileText className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                    <p>لم تقدم أي عروض بعد</p>
                    <Link to={createPageUrl("Projects")}>
                      <Button variant="link" className="text-[#d4a574]">
                        تصفح المشاريع المتاحة
                        <ArrowLeft className="w-4 h-4 mr-2" />
                      </Button>
                    </Link>
                  </div>
                )
              ) : (
                recentProjects.length > 0 ? (
                  <div className="space-y-4">
                    {recentProjects.map(project => (
                      <Link key={project.id} to={createPageUrl("ProjectDetails") + `?id=${project.id}`}>
                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                          <div>
                            <p className="font-medium text-[#1a1a2e]">{project.title}</p>
                            <p className="text-sm text-slate-500">{project.total_proposals || 0} عرض</p>
                          </div>
                          <Badge className={
                            project.status === "completed" ? "bg-green-100 text-green-700" :
                            project.status === "in_progress" ? "bg-blue-100 text-blue-700" :
                            project.status === "cancelled" ? "bg-red-100 text-red-700" :
                            "bg-amber-100 text-amber-700"
                          }>
                            {project.status === "completed" ? "مكتمل" :
                             project.status === "in_progress" ? "قيد التنفيذ" :
                             project.status === "cancelled" ? "ملغي" : "مفتوح"}
                          </Badge>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-500">
                    <Briefcase className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                    <p>لم تضف أي مشاريع بعد</p>
                    <Link to={createPageUrl("CreateProject")}>
                      <Button variant="link" className="text-[#d4a574]">
                        أضف مشروعك الأول
                        <ArrowLeft className="w-4 h-4 mr-2" />
                      </Button>
                    </Link>
                  </div>
                )
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}