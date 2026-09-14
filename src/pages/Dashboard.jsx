import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { 
  Briefcase, Wallet, Star, 
  TrendingUp, Clock, CheckCircle, Plus, ArrowLeft, Settings, Grid3X3, FileText, DollarSign, Award,
  Shield, Users, FileCheck, BarChart3, Building2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import IndividualClientDashboard from "@/components/client/IndividualClientDashboard";
import DailyFollowUpTasks from "@/components/dashboard/DailyFollowUpTasks";
import ProviderRatingsReport from "@/components/dashboard/ProviderRatingsReport";
import { useLanguage } from "@/components/i18n/LanguageContext";
import PullToRefreshWrapper from "@/components/mobile/PullToRefreshWrapper";

export default function Dashboard() {
  const { t } = useLanguage();
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

      const totalSpent = projects.reduce((sum, p) => sum + (p.escrow_amount || 0), 0);

      setStats({
        totalProjects: projects.length,
        openProjects: projects.filter(p => p.status === "open").length,
        inProgressProjects: projects.filter(p => p.status === "in_progress").length,
        completedProjects: projects.filter(p => p.status === "completed").length,
        walletBalance: clientData[0].wallet_balance || 0,
        totalSpent
      });

      setRecentProjects(projects.slice(0, 5));
    }

    setIsLoading(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#C9A66B]"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="p-8 text-center">
            <h2 className="text-xl font-bold text-slate-700 mb-4">{t('dashboard.noAccount.title')}</h2>
            <p className="text-slate-500 mb-6">{t('dashboard.noAccount.message')}</p>
            <Link to={createPageUrl("RegisterChoice")}>
              <Button className="bg-gradient-to-r from-[#1a1a2e] to-[#C9A66B] text-white">
                {t('dashboard.noAccount.createAccount')}
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Redirect investors to InvestorHub (but not admins)
  if (userType === "client" && profile?.client_type === "investor" && !isAdmin) {
    window.location.href = createPageUrl("InvestorHub");
    return null;
  }

  // Render specialized dashboard for individual clients
  if (userType === "client" && profile?.client_type === "individual") {
    return <IndividualClientDashboard client={profile} stats={stats} recentProjects={recentProjects} />;
  }

  return (
    <PullToRefreshWrapper onRefresh={loadDashboardData} className="min-h-screen">
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
                <AvatarFallback className="bg-gradient-to-br from-[#1a1a2e] to-[#C9A66B] text-white text-xl">
                  {profile.full_name?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-2xl font-bold text-[#1a1a2e]">
                  {t('dashboard.welcome').replace('{name}', profile.full_name)}
                </h1>
                <p className="text-slate-500">
                  {userType === "engineer" ? profile.specialization : t('dashboard.specialization')}
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              {userType === "engineer" ? (
                <Link to={createPageUrl("AddPortfolio")}>
                  <Button className="bg-gradient-to-r from-[#1a1a2e] to-[#C9A66B] text-white">
                    <Plus className="w-5 h-5 ml-2" />
                    {t('dashboard.buttons.addNewWork')}
                  </Button>
                </Link>
              ) : (
                <Link to={createPageUrl("CreateProject")}>
                  <Button className="bg-gradient-to-r from-[#1a1a2e] to-[#C9A66B] text-white">
                    <Plus className="w-5 h-5 ml-2" />
                    {t('dashboard.buttons.newProject')}
                  </Button>
                </Link>
              )}
              {userType === "engineer" && (
                <Link to={createPageUrl("EngineerProjects")}>
                  <Button variant="outline">
                    <Briefcase className="w-5 h-5 ml-2" />
                    {t('dashboard.buttons.myProjects')}
                  </Button>
                </Link>
              )}
              <Link to={createPageUrl("ContractArchive")}>
                <Button variant="outline">
                  <FileText className="w-5 h-5 ml-2" />
                  {t('dashboard.buttons.contracts')}
                </Button>
              </Link>
              <Link to={createPageUrl("InvoiceManager")}>
                <Button variant="outline">
                  <DollarSign className="w-5 h-5 ml-2" />
                  {t('dashboard.buttons.invoices')}
                </Button>
              </Link>
              {(userType === "client" || isAdmin) && (
                <Link to={createPageUrl("ContractTemplates")}>
                  <Button variant="outline">
                    <FileText className="w-5 h-5 ml-2" />
                    {t('dashboard.buttons.templates')}
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
                        {t('dashboard.stats.myWorks')}
                      </Badge>
                    </div>
                    <p className="text-3xl font-bold text-[#1a1a2e]">{stats.portfolioCount}</p>
                    <p className="text-sm text-slate-500">{t('dashboard.stats.worksInGallery')}</p>
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
                        {t('dashboard.stats.completed')}
                      </Badge>
                    </div>
                    <p className="text-3xl font-bold text-[#1a1a2e]">{stats.completedProjects}</p>
                    <p className="text-sm text-slate-500">{t('dashboard.stats.completedProjects')}</p>
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
                        {t('dashboard.stats.rating')}
                      </Badge>
                    </div>
                    <p className="text-3xl font-bold text-[#1a1a2e]">{stats.rating?.toFixed(1)}</p>
                    <p className="text-sm text-slate-500">{t('dashboard.stats.reviews').replace('{count}', stats.reviewsCount)}</p>
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
                        {t('dashboard.stats.wallet')}
                      </Badge>
                    </div>
                    <p className="text-3xl font-bold text-[#1a1a2e]">{stats.walletBalance?.toLocaleString()}</p>
                    <p className="text-sm text-slate-500">{t('dashboard.stats.sar')}</p>
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
                    <p className="text-sm text-slate-500">{t('dashboard.stats.totalProjects')}</p>
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
                    <p className="text-sm text-slate-500">{t('dashboard.stats.openProjects')}</p>
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
                    <p className="text-sm text-slate-500">{t('dashboard.stats.inProgress')}</p>
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
                    <p className="text-sm text-slate-500">{t('dashboard.stats.sarInWallet')}</p>
                  </CardContent>
                </Card>
              </motion.div>
            </>
          )}
        </div>

        {/* Provider Ratings Report */}
        <ProviderRatingsReport />

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
                  <h3 className="font-semibold text-amber-800">{t('dashboard.accountStatus.underReview')}</h3>
                  <p className="text-sm text-amber-600">{t('dashboard.accountStatus.reviewMessage')}</p>
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
              <div className="bg-gradient-to-r from-[#1a1a2e] to-[#C9A66B] p-6 text-white">
                <h3 className="text-xl font-bold mb-2">{t('dashboard.subscription.upgrade')}</h3>
                <p className="text-white/80">{t('dashboard.subscription.upgradeMessage')}</p>
              </div>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="border rounded-xl p-6 hover:border-[#C9A66B] transition-colors cursor-pointer">
                    <Badge className="bg-blue-100 text-blue-700 mb-4">{t('dashboard.subscription.monthly')}</Badge>
                    <p className="text-3xl font-bold text-[#1a1a2e]">99 <span className="text-sm font-normal">{t('dashboard.subscription.perMonth')}</span></p>
                    <ul className="mt-4 space-y-2 text-sm text-slate-600">
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        {t('dashboard.subscription.features.topPlacement')}
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        {t('dashboard.subscription.features.badge')}
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        {t('dashboard.subscription.features.unlimitedProposals')}
                      </li>
                    </ul>
                    <Link to={createPageUrl("Subscription") + "?plan=monthly"}>
                      <Button className="w-full mt-4" variant="outline">{t('dashboard.subscription.choosePlan')}</Button>
                    </Link>
                  </div>
                  <div className="border-2 border-[#C9A66B] rounded-xl p-6 relative">
                    <Badge className="absolute -top-3 right-4 bg-[#C9A66B] text-white">{t('dashboard.subscription.bestValue')}</Badge>
                    <Badge className="bg-amber-100 text-amber-700 mb-4">{t('dashboard.subscription.yearly')}</Badge>
                    <p className="text-3xl font-bold text-[#1a1a2e]">799 <span className="text-sm font-normal">{t('dashboard.subscription.perYear')}</span></p>
                    <p className="text-sm text-green-600">{t('dashboard.subscription.save').replace('{amount}', '389')}</p>
                    <ul className="mt-4 space-y-2 text-sm text-slate-600">
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        {t('dashboard.subscription.features.allMonthly')}
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        {t('dashboard.subscription.features.searchPriority')}
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        {t('dashboard.subscription.features.dedicatedSupport')}
                      </li>
                    </ul>
                    <Link to={createPageUrl("Subscription") + "?plan=yearly"}>
                      <Button className="w-full mt-4 bg-gradient-to-r from-[#1a1a2e] to-[#C9A66B] text-white">
                        {t('dashboard.subscription.choosePlan')}
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Daily Follow-Up Tasks (Admin) */}
        {isAdmin && (
          <div className="mb-8">
            <DailyFollowUpTasks />
          </div>
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
                  {t('dashboard.adminPanel.title')}
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
                        <h3 className="font-bold text-lg mb-2">{t('dashboard.adminPanel.withdrawalRequests')}</h3>
                        <p className="text-sm text-slate-600">{t('dashboard.adminPanel.withdrawalDesc')}</p>
                      </CardContent>
                    </Card>
                  </Link>

                  <Link to={createPageUrl("AllCertifications")}>
                    <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 border-green-200 hover:border-green-400">
                      <CardContent className="p-6 text-center">
                        <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-4">
                          <Award className="w-8 h-8 text-green-600" />
                        </div>
                        <h3 className="font-bold text-lg mb-2">{t('dashboard.adminPanel.certifications')}</h3>
                        <p className="text-sm text-slate-600">{t('dashboard.adminPanel.certificationsDesc')}</p>
                      </CardContent>
                    </Card>
                  </Link>

                  <Link to={createPageUrl("AdminWallet")}>
                    <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 border-purple-200 hover:border-purple-400">
                      <CardContent className="p-6 text-center">
                        <div className="w-16 h-16 mx-auto bg-purple-100 rounded-full flex items-center justify-center mb-4">
                          <Wallet className="w-8 h-8 text-purple-600" />
                        </div>
                        <h3 className="font-bold text-lg mb-2">{t('dashboard.adminPanel.walletManagement')}</h3>
                        <p className="text-sm text-slate-600">{t('dashboard.adminPanel.walletManagementDesc')}</p>
                      </CardContent>
                    </Card>
                  </Link>
                </div>
                
                <div className="mt-4 grid md:grid-cols-2 gap-4">
                  <Link to="/InvestorHub">
                    <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 border-emerald-200 hover:border-emerald-400">
                      <CardContent className="p-6 text-center">
                        <div className="w-16 h-16 mx-auto bg-emerald-100 rounded-full flex items-center justify-center mb-4">
                          <Building2 className="w-8 h-8 text-emerald-600" />
                        </div>
                        <h3 className="font-bold text-lg mb-2">مركز المستثمرين</h3>
                        <p className="text-sm text-slate-600">لوحة تحكم المشاريع العقارية والمحافظ الاستثمارية</p>
                      </CardContent>
                    </Card>
                  </Link>
    <Link to={createPageUrl("AdminReports")}>
                    <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 border-amber-200 hover:border-amber-400">
                      <CardContent className="p-6 text-center">
                        <div className="w-16 h-16 mx-auto bg-amber-100 rounded-full flex items-center justify-center mb-4">
                          <BarChart3 className="w-8 h-8 text-amber-600" />
                        </div>
                        <h3 className="font-bold text-lg mb-2">{t('dashboard.adminPanel.reportsAndStats')}</h3>
                        <p className="text-sm text-slate-600">{t('dashboard.adminPanel.reportsDesc')}</p>
                      </CardContent>
                    </Card>
                  </Link>
                  <Link to="/FinancialReports">
                    <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 border-emerald-200 hover:border-emerald-400">
                      <CardContent className="p-6 text-center">
                        <div className="w-16 h-16 mx-auto bg-emerald-100 rounded-full flex items-center justify-center mb-4">
                          <DollarSign className="w-8 h-8 text-emerald-600" />
                        </div>
                        <h3 className="font-bold text-lg mb-2">التقارير المالية</h3>
                        <p className="text-sm text-slate-600">إجمالي العمليات، العمولات، وحالة المحافظ الإلكترونية</p>
                      </CardContent>
                    </Card>
                  </Link>
                  <Link to="/LaunchPerformanceDashboard">
                    <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 border-orange-200 hover:border-orange-400">
                      <CardContent className="p-6 text-center">
                        <div className="w-16 h-16 mx-auto bg-orange-100 rounded-full flex items-center justify-center mb-4">
                          <TrendingUp className="w-8 h-8 text-orange-600" />
                        </div>
                        <h3 className="font-bold text-lg mb-2">أداء الإطلاق التجريبي</h3>
                        <p className="text-sm text-slate-600">رسوم بيانية حية لنمو المهندسين والمشاريع</p>
                      </CardContent>
                    </Card>
                  </Link>
                </div>

                {/* Management Section */}
                <div className="mt-8">
                  <h2 className="text-xl font-bold text-[#1a1a2e] mb-4">{t('dashboard.adminPanel.dataManagement')}</h2>
                  <div className="grid md:grid-cols-3 gap-4">
                    <Link to={createPageUrl("AdminCategories")}>
                      <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 border-slate-200 hover:border-slate-400">
                        <CardContent className="p-6 text-center">
                          <div className="w-16 h-16 mx-auto bg-slate-100 rounded-full flex items-center justify-center mb-4">
                            <Settings className="w-8 h-8 text-slate-600" />
                          </div>
                          <h3 className="font-bold text-lg mb-2">{t('dashboard.adminPanel.categories')}</h3>
                          <p className="text-sm text-slate-600">{t('dashboard.adminPanel.categoriesDesc')}</p>
                        </CardContent>
                      </Card>
                    </Link>

                    <Link to={createPageUrl("AdminClients")}>
                      <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 border-slate-200 hover:border-slate-400">
                        <CardContent className="p-6 text-center">
                          <div className="w-16 h-16 mx-auto bg-slate-100 rounded-full flex items-center justify-center mb-4">
                            <Users className="w-8 h-8 text-slate-600" />
                          </div>
                          <h3 className="font-bold text-lg mb-2">{t('dashboard.adminPanel.clientsManagement')}</h3>
                          <p className="text-sm text-slate-600">{t('dashboard.adminPanel.clientsManagementDesc')}</p>
                        </CardContent>
                      </Card>
                    </Link>

                    <Link to={createPageUrl("AdminEngineers")}>
                      <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 border-slate-200 hover:border-slate-400">
                        <CardContent className="p-6 text-center">
                          <div className="w-16 h-16 mx-auto bg-slate-100 rounded-full flex items-center justify-center mb-4">
                            <Award className="w-8 h-8 text-slate-600" />
                          </div>
                          <h3 className="font-bold text-lg mb-2">{t('dashboard.adminPanel.engineersManagement')}</h3>
                          <p className="text-sm text-slate-600">{t('dashboard.adminPanel.engineersManagementDesc')}</p>
                        </CardContent>
                      </Card>
                    </Link>
                  </div>
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
            <Card className="border-0 shadow-lg border-t-4 border-t-[#C9A66B]">
              <CardHeader className="bg-gradient-to-r from-amber-50 to-green-50">
                <CardTitle className="flex items-center gap-2">
                  <Award className="w-6 h-6 text-[#C9A66B]" />
                  {t('dashboard.adminPanel.approvedProjects')}
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
                            {t('dashboard.adminPanel.client')}: {project.client_id?.slice(0, 8)}... | {t('dashboard.adminPanel.amount')}: {project.escrow_amount?.toLocaleString()} {t('dashboard.stats.sar')}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge className="bg-green-100 text-green-700">
                            {t('dashboard.adminPanel.technicallyApproved')}
                          </Badge>
                          <Button 
                            size="sm" 
                            className="bg-gradient-to-r from-[#1a1a2e] to-[#C9A66B] text-white"
                          >
                            <Award className="w-4 h-4 ml-2" />
                            {t('dashboard.adminPanel.viewCertificate')}
                          </Button>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
                {approvedProjects.length > 5 && (
                  <div className="text-center mt-4">
                    <Link to={createPageUrl("Projects") + "?status=technical_approved"}>
                      <Button variant="outline" className="text-[#C9A66B]">
                        {t('dashboard.adminPanel.viewAllApproved').replace('{count}', approvedProjects.length)}
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
                {userType === "engineer" ? t('dashboard.recentActivity.engineerProposals') : t('dashboard.recentActivity.clientProjects')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {userType === "engineer" ? (
                recentProposals.length > 0 ? (
                  <div className="space-y-4">
                    {recentProposals.map(proposal => (
                      <div key={proposal.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                        <div>
                          <p className="font-medium text-[#1a1a2e]">{t('dashboard.recentActivity.proposalId').replace('{id}', proposal.id?.slice(-6))}</p>
                          <p className="text-sm text-slate-500">{proposal.price?.toLocaleString()} {t('dashboard.stats.sar')}</p>
                        </div>
                        <Badge className={
                          proposal.status === "accepted" ? "bg-green-100 text-green-700" :
                          proposal.status === "rejected" ? "bg-red-100 text-red-700" :
                          "bg-amber-100 text-amber-700"
                        }>
                          {proposal.status === "accepted" ? t('dashboard.recentActivity.accepted') :
                           proposal.status === "rejected" ? t('dashboard.recentActivity.rejected') : t('dashboard.recentActivity.underReview')}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-500">
                    <FileText className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                    <p>{t('dashboard.recentActivity.noProposals')}</p>
                    <Link to={createPageUrl("Projects")}>
                      <Button variant="link" className="text-[#C9A66B]">
                        {t('dashboard.recentActivity.browseProjects')}
                        <ArrowLeft className="w-4 h-4 mr-2" />
                      </Button>
                    </Link>
                  </div>
                )
              ) : (
                recentProjects.length > 0 ? (
                  <div className="space-y-4">
                    {recentProjects.map(project => (
                      <div key={project.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                        <Link to={createPageUrl("ProjectDetails") + `?id=${project.id}`} className="flex-1 min-w-0">
                          <p className="font-medium text-[#1a1a2e]">{project.title}</p>
                          <p className="text-sm text-slate-500">{t('dashboard.recentActivity.proposals').replace('{count}', project.total_proposals || 0)}</p>
                        </Link>
                        <div className="flex items-center gap-2">
                          <Badge className={
                            project.status === "completed" ? "bg-green-100 text-green-700" :
                            project.status === "in_progress" ? "bg-blue-100 text-blue-700" :
                            project.status === "cancelled" ? "bg-red-100 text-red-700" :
                            "bg-amber-100 text-amber-700"
                          }>
                            {project.status === "completed" ? t('dashboard.recentActivity.completed') :
                             project.status === "in_progress" ? t('dashboard.recentActivity.inProgress') :
                             project.status === "cancelled" ? t('dashboard.recentActivity.cancelled') : t('dashboard.recentActivity.open')}
                          </Badge>
                          <Link to={`/ProjectProposals?project_id=${project.id}`}>
                            <Button size="sm" variant="outline" className="text-xs border-[#C9A66B] text-[#C9A66B] hover:bg-amber-50">
                              عروض الأسعار
                            </Button>
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-500">
                    <Briefcase className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                    <p>{t('dashboard.recentActivity.noProjects')}</p>
                    <Link to={createPageUrl("CreateProject")}>
                      <Button variant="link" className="text-[#C9A66B]">
                        {t('dashboard.recentActivity.addFirstProject')}
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
    </PullToRefreshWrapper>
  );
}