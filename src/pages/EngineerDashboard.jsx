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
  CheckCircle, Clock, AlertCircle, Edit
} from "lucide-react";

export default function EngineerDashboard() {
  const [user, setUser] = useState(null);
  const [engineer, setEngineer] = useState(null);
  const [projects, setProjects] = useState([]);
  const [portfolio, setPortfolio] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [disputes, setDisputes] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const currentUser = await base44.auth.me();
    setUser(currentUser);

    const [engineerData, projectsData, portfolioData, reviewsData, disputesData, notificationsData] = await Promise.all([
      base44.entities.Engineer.filter({ email: currentUser.email }),
      base44.entities.Project.filter({ assigned_engineer_email: currentUser.email }),
      base44.entities.Portfolio.filter({ engineer_id: currentUser.id }),
      base44.entities.Review.filter({ engineer_email: currentUser.email }),
      base44.entities.Dispute.list("-created_date"),
      base44.entities.Notification.filter({ recipient_email: currentUser.email }, "-created_date", 5)
    ]);

    if (engineerData.length > 0) {
      setEngineer(engineerData[0]);
    }

    setProjects(projectsData);
    setPortfolio(portfolioData.slice(0, 6));
    setReviews(reviewsData);
    
    const engineerDisputes = disputesData.filter(
      d => d.raised_by === currentUser.email || d.raised_against === currentUser.email
    );
    setDisputes(engineerDisputes);
    setNotifications(notificationsData);
    
    setIsLoading(false);
  };

  const activeProjects = projects.filter(p => p.status === 'in_progress' || p.status === 'pending');
  const completedProjects = projects.filter(p => p.status === 'completed');
  const pendingDisputes = disputes.filter(d => !['resolved', 'closed'].includes(d.status));
  const unreadNotifications = notifications.filter(n => !n.is_read);

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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Briefcase className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{activeProjects.length}</p>
                  <p className="text-sm text-slate-600">مشاريع نشطة</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{completedProjects.length}</p>
                  <p className="text-sm text-slate-600">مشاريع مكتملة</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-amber-100 flex items-center justify-center">
                  <Star className="w-6 h-6 text-amber-600" />
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
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{engineer.available_balance || 0}</p>
                  <p className="text-sm text-slate-600">رصيد متاح</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

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

        {/* Tabs Section */}
        <Tabs defaultValue="projects" className="space-y-6">
          <TabsList className="bg-white shadow-sm">
            <TabsTrigger value="projects">المشاريع</TabsTrigger>
            <TabsTrigger value="portfolio">معرض الأعمال</TabsTrigger>
            <TabsTrigger value="reviews">التقييمات</TabsTrigger>
          </TabsList>

          <TabsContent value="projects">
            <Card>
              <CardHeader>
                <CardTitle>المشاريع النشطة</CardTitle>
              </CardHeader>
              <CardContent>
                {activeProjects.length === 0 ? (
                  <div className="text-center py-12">
                    <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-600">لا توجد مشاريع نشطة حالياً</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {activeProjects.map(project => (
                      <div key={project.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                        <div className="flex-1">
                          <h3 className="font-medium text-slate-900">{project.title}</h3>
                          <p className="text-sm text-slate-600">{project.client_email}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge>
                            {project.status === 'in_progress' ? 'قيد التنفيذ' : 'معلق'}
                          </Badge>
                          <Link to={createPageUrl(`ProjectDetails?id=${project.id}`)}>
                            <Button size="sm" variant="outline">عرض</Button>
                          </Link>
                        </div>
                      </div>
                    ))}
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