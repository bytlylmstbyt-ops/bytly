import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Loader2, Star, Briefcase, ShieldAlert, Bell, 
  MapPin, Mail, Phone, Plus, TrendingUp, DollarSign,
  CheckCircle, Clock, AlertCircle, Edit, FileText, Wallet, Shield
} from "lucide-react";
import { AdSidebarCards } from "@/components/ads/DemoAdBanner";
import { useAds } from "@/hooks/useAds";

export default function EngineerDashboard() {
  const { ads: dashboardAds } = useAds({ placement: "engineer_dashboard", tags: ["مدني", "هندسة", "مقاولات"], maxAds: 2 });
  const [user, setUser] = useState(null);
  const [engineer, setEngineer] = useState(null);
  const [projects, setProjects] = useState([]);
  const [portfolio, setPortfolio] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [disputes, setDisputes] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [proposals, setProposals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const currentUser = await base44.auth.me();
    setUser(currentUser);

    const engineerData = await base44.entities.Engineer.filter({ email: currentUser.email });

    if (engineerData && engineerData.length > 0) {
      const eng = engineerData[0];
      setEngineer(eng);

      const [projectsData, portfolioData, reviewsData, disputesData, notificationsData, proposalsData] = await Promise.all([
        base44.entities.Project.filter({ assigned_engineer_id: eng.id }),
        base44.entities.Portfolio.filter({ engineer_id: eng.id }),
        base44.entities.Review.filter({ engineer_id: eng.id }),
        base44.entities.Dispute.list("-created_date"),
        base44.entities.Notification.filter({ recipient_email: currentUser.email }, "-created_date", 5),
        base44.entities.Proposal.filter({ engineer_id: eng.id })
      ]);

      setProjects(projectsData);
      setPortfolio(portfolioData.slice(0, 6));
      setReviews(reviewsData);
      setProposals(proposalsData);
      
      const engineerDisputes = disputesData.filter(
        d => d.raised_by === currentUser.email || d.raised_against === currentUser.email
      );
      setDisputes(engineerDisputes);
      setNotifications(notificationsData);
    }
    
    setIsLoading(false);
  };

  const activeProjects = projects.filter(p => p.status === 'in_progress');
  const completedProjects = projects.filter(p => p.status === 'completed');
  const escrowHeldProjects = activeProjects.filter(p => p.escrow_status === 'held');
  const pendingEscrowProjects = activeProjects.filter(p => !p.escrow_status || p.escrow_status === 'none');
  const pendingDisputes = disputes.filter(d => !['resolved', 'closed'].includes(d.status));
  const unreadNotifications = notifications.filter(n => !n.is_read);
  const pendingProposals = proposals.filter(p => p.status === 'pending');
  const acceptedProposals = proposals.filter(p => p.status === 'accepted');
  const totalEarnings = completedProjects.reduce((sum, p) => sum + (p.engineer_payment || 0), 0);

  const averageRating = reviews.length > 0 
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : 0;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#C9A66B]" />
      </div>
    );
  }

  if (!engineer) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">الملف الشخصي غير مكتمل</h3>
            <p className="text-slate-600 mb-4">يرجى إكمال ملفك الشخصي أولاً</p>
            <Link to={createPageUrl("Settings")}>
              <Button className="bg-gradient-to-r from-[#6B5D4F] to-[#C9A66B]">
                إكمال الملف الشخصي
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-amber-50/30 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header Section */}
        <div className="mb-8">
          <Card className="border-0 shadow-lg overflow-hidden">
            <div 
              className="h-32 bg-gradient-to-r from-[#6B5D4F] to-[#C9A66B]"
              style={{ 
                backgroundImage: engineer.cover_image ? `url(${engineer.cover_image})` : undefined,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
            />
            <CardContent className="pt-0">
              <div className="flex flex-col md:flex-row items-start md:items-end gap-4 -mt-16 md:-mt-12">
                <Avatar className="w-32 h-32 border-4 border-white shadow-lg">
                  <AvatarImage src={engineer.profile_image} />
                  <AvatarFallback className="bg-gradient-to-br from-[#6B5D4F] to-[#C9A66B] text-white text-3xl">
                    {engineer.full_name?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-2xl font-bold text-slate-900">{engineer.full_name}</h1>
                    {engineer.is_verified && (
                      <Badge className="bg-blue-100 text-blue-700">
                        <CheckCircle className="w-3 h-3 ml-1" />
                        موثق
                      </Badge>
                    )}
                    {engineer.status === 'approved' && (
                      <Badge className="bg-green-100 text-green-700">معتمد</Badge>
                    )}
                  </div>
                  <p className="text-slate-600 mb-3">{engineer.specialization}</p>
                  <div className="flex flex-wrap gap-4 text-sm text-slate-600">
                    {engineer.city && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {engineer.city}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Mail className="w-4 h-4" />
                      {engineer.email}
                    </span>
                    {engineer.phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="w-4 h-4" />
                        {engineer.phone}
                      </span>
                    )}
                  </div>
                </div>

                <Link to={createPageUrl("Settings")}>
                  <Button variant="outline" className="gap-2">
                    <Edit className="w-4 h-4" />
                    تعديل الملف
                  </Button>
                </Link>
              </div>

              {engineer.bio && (
                <p className="mt-4 text-slate-700 leading-relaxed">{engineer.bio}</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col gap-2">
                <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Briefcase className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{activeProjects.length}</p>
                  <p className="text-sm text-slate-600">قيد التنفيذ</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col gap-2">
                <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{completedProjects.length}</p>
                  <p className="text-sm text-slate-600">مكتملة</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col gap-2">
                <div className="w-12 h-12 rounded-lg bg-amber-100 flex items-center justify-center">
                  <FileText className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{pendingProposals.length}</p>
                  <p className="text-sm text-slate-600">عروض معلقة</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col gap-2">
                <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
                  <Star className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{averageRating}</p>
                  <p className="text-sm text-slate-600">التقييم ({reviews.length})</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col gap-2">
                <div className="w-12 h-12 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{totalEarnings.toLocaleString('ar-SA')}</p>
                  <p className="text-sm text-slate-600">إجمالي الأرباح</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Link to={createPageUrl("Wallet")} className="block">
            <Card className="h-full hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="flex flex-col gap-2">
                  <div className="w-12 h-12 rounded-lg bg-indigo-100 flex items-center justify-center">
                    <Wallet className="w-6 h-6 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-900">{(engineer.available_balance || 0).toLocaleString('ar-SA')}</p>
                    <p className="text-sm text-slate-600">رصيد متاح</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Financial Dashboard Quick Link */}
        <div className="mb-6">
          <Link to="/EngineerFinancialDashboard">
            <Card className="hover:shadow-lg transition-shadow border-[#d4a574]/40 bg-gradient-to-r from-[#1a1a2e]/5 to-[#d4a574]/10 cursor-pointer">
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#d4a574] flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-[#1a1a2e]">اللوحة المالية التفصيلية</p>
                      <p className="text-xs text-slate-500">عرض الأرباح • الفواتير • المعاملات • تصدير PDF</p>
                    </div>
                  </div>
                  <span className="text-[#d4a574] text-xl">←</span>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Escrow Status Alert */}
        {(escrowHeldProjects.length > 0 || pendingEscrowProjects.length > 0) && (
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            {escrowHeldProjects.length > 0 && (
              <Card className="border-blue-200 bg-blue-50">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-blue-200 flex items-center justify-center shrink-0">
                      <Shield className="w-5 h-5 text-blue-700" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-blue-900">مبالغ ضمان محجوزة</h3>
                      <p className="text-sm text-blue-700">
                        {escrowHeldProjects.length} مشروع بمبلغ إجمالي {escrowHeldProjects.reduce((s, p) => s + (p.escrow_amount || 0), 0).toLocaleString('ar-SA')} ريال محجوز في بيتلي — سيُحوَّل إليك عند موافقة العميل.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            {pendingEscrowProjects.length > 0 && (
              <Card className="border-amber-200 bg-amber-50">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-amber-200 flex items-center justify-center shrink-0">
                      <Clock className="w-5 h-5 text-amber-700" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-amber-900">في انتظار إيداع الضمان</h3>
                      <p className="text-sm text-amber-700">
                        {pendingEscrowProjects.length} مشروع لم يُودَع مبلغه بعد — تواصل مع العميل لإتمام الإيداع.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Alerts */}
        {(pendingDisputes.length > 0 || unreadNotifications.length > 0) && (
          <div className="grid md:grid-cols-2 gap-4 mb-8">
            {pendingDisputes.length > 0 && (
              <Card className="border-orange-200 bg-orange-50">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <ShieldAlert className="w-5 h-5 text-orange-600 mt-0.5" />
                    <div className="flex-1">
                      <h3 className="font-semibold text-orange-900">نزاعات معلقة</h3>
                      <p className="text-sm text-orange-700 mb-3">
                        لديك {pendingDisputes.length} نزاع يحتاج إلى متابعة
                      </p>
                      <Link to={createPageUrl("MyDisputes")}>
                        <Button size="sm" variant="outline" className="border-orange-300">
                          عرض النزاعات
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {unreadNotifications.length > 0 && (
              <Card className="border-blue-200 bg-blue-50">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <Bell className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div className="flex-1">
                      <h3 className="font-semibold text-blue-900">إشعارات جديدة</h3>
                      <p className="text-sm text-blue-700 mb-3">
                        لديك {unreadNotifications.length} إشعار جديد
                      </p>
                      <Link to={createPageUrl("Notifications")}>
                        <Button size="sm" variant="outline" className="border-blue-300">
                          عرض الإشعارات
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Contextual Ads - Dashboard */}
        <AdSidebarCards ads={dashboardAds} />

        {/* Tabs Section */}
        <Tabs defaultValue="projects" className="space-y-6">
          <TabsList className="bg-white shadow-sm">
            <TabsTrigger value="projects">المشاريع</TabsTrigger>
            <TabsTrigger value="proposals">العروض المقدمة</TabsTrigger>
            <TabsTrigger value="portfolio">معرض الأعمال</TabsTrigger>
            <TabsTrigger value="reviews">التقييمات</TabsTrigger>
          </TabsList>

          <TabsContent value="projects">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>المشاريع قيد التنفيذ</span>
                  <Link to={createPageUrl("Projects")}>
                    <Button variant="ghost" size="sm">تصفح المزيد</Button>
                  </Link>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {activeProjects.length === 0 ? (
                  <div className="text-center py-12">
                    <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-600 mb-3">لا توجد مشاريع قيد التنفيذ</p>
                    <Link to={createPageUrl("Projects")}>
                      <Button variant="outline">تصفح المشاريع المتاحة</Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {activeProjects.map(project => (
                      <Link
                        key={project.id}
                        to={createPageUrl("ProjectDetails") + `?id=${project.id}`}
                        className="block p-4 rounded-xl border hover:border-[#C9A66B] hover:shadow-md transition-all"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h3 className="font-semibold text-slate-900">{project.title}</h3>
                            <p className="text-sm text-slate-600 mt-1">{project.description?.slice(0, 100)}...</p>
                          </div>
                          <Badge className="bg-blue-100 text-blue-700">قيد التنفيذ</Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-slate-500 mt-3">
                          <span className="flex items-center gap-1">
                            <DollarSign className="w-4 h-4" />
                            {project.budget_max?.toLocaleString('ar-SA')} ر.س
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {project.deadline ? new Date(project.deadline).toLocaleDateString('ar-SA') : 'غير محدد'}
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="proposals">
            <Card>
              <CardHeader>
                <CardTitle>عروضي المقدمة</CardTitle>
              </CardHeader>
              <CardContent>
                {proposals.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-600 mb-3">لم تقدم أي عروض بعد</p>
                    <Link to={createPageUrl("Projects")}>
                      <Button variant="outline">تصفح المشاريع</Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {proposals.map(proposal => {
                      const project = projects.find(p => p.id === proposal.project_id);
                      return (
                        <div
                          key={proposal.id}
                          className="p-4 rounded-xl border"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <Link 
                                to={createPageUrl("ProjectDetails") + `?id=${proposal.project_id}`}
                                className="font-semibold text-slate-900 hover:text-[#C9A66B]"
                              >
                                {project?.title || 'مشروع محذوف'}
                              </Link>
                              <p className="text-sm text-slate-600 mt-1">{proposal.cover_letter?.slice(0, 100)}...</p>
                            </div>
                            <Badge className={
                              proposal.status === "accepted" ? "bg-green-100 text-green-700" :
                              proposal.status === "rejected" ? "bg-red-100 text-red-700" :
                              "bg-amber-100 text-amber-700"
                            }>
                              {proposal.status === "accepted" ? "مقبول ✓" :
                               proposal.status === "rejected" ? "مرفوض" : "قيد المراجعة"}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm">
                            <span className="font-bold text-green-600">
                              {proposal.price?.toLocaleString('ar-SA')} ر.س
                            </span>
                            <span className="text-slate-500">
                              {proposal.delivery_days} يوم
                            </span>
                            <span className="text-slate-400 text-xs">
                              {new Date(proposal.created_date).toLocaleDateString('ar-SA')}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="portfolio">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>معرض الأعمال</CardTitle>
                <Link to={createPageUrl("AddPortfolio")}>
                  <Button size="sm" className="bg-gradient-to-r from-[#6B5D4F] to-[#C9A66B]">
                    <Plus className="w-4 h-4 ml-2" />
                    إضافة عمل
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                {portfolio.length === 0 ? (
                  <div className="text-center py-12">
                    <TrendingUp className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-600 mb-3">لم تضف أي أعمال بعد</p>
                    <Link to={createPageUrl("AddPortfolio")}>
                      <Button variant="outline">إضافة أول عمل</Button>
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {portfolio.map(item => (
                      <div key={item.id} className="group relative rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-shadow">
                        <img 
                          src={item.images?.[0] || '/placeholder.jpg'} 
                          alt={item.title}
                          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="p-3 bg-white">
                          <h3 className="font-medium text-slate-900 line-clamp-1">{item.title}</h3>
                          <p className="text-sm text-slate-600 line-clamp-2">{item.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reviews">
            <Card>
              <CardHeader>
                <CardTitle>التقييمات من العملاء</CardTitle>
              </CardHeader>
              <CardContent>
                {reviews.length === 0 ? (
                  <div className="text-center py-12">
                    <Star className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-600">لا توجد تقييمات بعد</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {reviews.map(review => (
                      <div key={review.id} className="p-4 bg-slate-50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className="flex">
                              {[...Array(5)].map((_, i) => (
                                <Star 
                                  key={i} 
                                  className={`w-4 h-4 ${i < review.rating ? 'text-amber-500 fill-amber-500' : 'text-slate-300'}`}
                                />
                              ))}
                            </div>
                            <span className="text-sm font-medium">{review.rating}/5</span>
                          </div>
                          <span className="text-xs text-slate-500">
                            {new Date(review.created_date).toLocaleDateString('ar-SA')}
                          </span>
                        </div>
                        <p className="text-sm text-slate-700">{review.comment}</p>
                        <p className="text-xs text-slate-500 mt-2">من: {review.client_email}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}