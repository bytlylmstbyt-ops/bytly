import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Star, Search, Trash2, MessageSquare, User, Briefcase, Filter } from "lucide-react";

export default function AdminReviews() {
  const [user, setUser] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [engineers, setEngineers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRating, setFilterRating] = useState("all");
  const [filterEngineer, setFilterEngineer] = useState("all");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userData = await base44.auth.me();
        setUser(userData);

        if (userData.role !== 'admin') {
          window.location.href = '/';
          return;
        }

        const [reviewsData, engineersData, projectsData, clientsData] = await Promise.all([
          base44.entities.Review.list('-created_date'),
          base44.entities.Engineer.list(),
          base44.entities.Project.list(),
          base44.entities.Client.list()
        ]);

        setReviews(reviewsData);
        setEngineers(engineersData);
        setProjects(projectsData);
        setClients(clientsData);
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleDeleteReview = async (reviewId, engineerId) => {
    if (!confirm("هل أنت متأكد من حذف هذا التقييم؟")) return;

    try {
      await base44.entities.Review.delete(reviewId);
      await base44.functions.invoke("updateEngineerRating", { engineer_id: engineerId });
      setReviews(reviews.filter(r => r.id !== reviewId));
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const getEngineerName = (engineerId) => {
    const engineer = engineers.find(e => e.id === engineerId);
    return engineer?.full_name || "غير معروف";
  };

  const getProjectTitle = (projectId) => {
    const project = projects.find(p => p.id === projectId);
    return project?.title || "غير معروف";
  };

  const getClientName = (clientId) => {
    const client = clients.find(c => c.id === clientId);
    return client?.client_name || client?.full_name || "غير معروف";
  };

  const filteredReviews = reviews.filter(review => {
    const matchesSearch = 
      getEngineerName(review.engineer_id).toLowerCase().includes(searchQuery.toLowerCase()) ||
      getProjectTitle(review.project_id).toLowerCase().includes(searchQuery.toLowerCase()) ||
      review.comment?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRating = filterRating === "all" || 
      (filterRating === "5" && review.rating === 5) ||
      (filterRating === "4" && review.rating === 4) ||
      (filterRating === "3" && review.rating === 3) ||
      (filterRating === "low" && review.rating <= 2);

    const matchesEngineer = filterEngineer === "all" || review.engineer_id === filterEngineer;

    return matchesSearch && matchesRating && matchesEngineer;
  });

  const averageRating = reviews.length > 0 
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(2)
    : 0;

  const ratingDistribution = {
    5: reviews.filter(r => r.rating === 5).length,
    4: reviews.filter(r => r.rating === 4).length,
    3: reviews.filter(r => r.rating === 3).length,
    2: reviews.filter(r => r.rating === 2).length,
    1: reviews.filter(r => r.rating === 1).length
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-[#C9A66B] border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-slate-600">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-amber-50/30 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#6B5D4F] mb-2">إدارة التقييمات</h1>
          <p className="text-slate-600">مراجعة وإدارة تقييمات العملاء للمشاريع المكتملة</p>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">إجمالي التقييمات</p>
                  <p className="text-3xl font-bold text-[#6B5D4F]">{reviews.length}</p>
                </div>
                <MessageSquare className="w-10 h-10 text-[#C9A66B] opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">متوسط التقييم</p>
                  <div className="flex items-center gap-1">
                    <p className="text-3xl font-bold text-[#6B5D4F]">{averageRating}</p>
                    <Star className="w-6 h-6 fill-amber-400 text-amber-400" />
                  </div>
                </div>
                <Star className="w-10 h-10 text-[#C9A66B] opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">تقييمات 5 نجوم</p>
                  <p className="text-3xl font-bold text-green-600">{ratingDistribution[5]}</p>
                </div>
                <Star className="w-10 h-10 text-green-500 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">تقييمات منخفضة</p>
                  <p className="text-3xl font-bold text-red-600">{ratingDistribution[1] + ratingDistribution[2]}</p>
                </div>
                <Star className="w-10 h-10 text-red-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input
                  placeholder="ابحث في التقييمات..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-10"
                />
              </div>
              
              <Select value={filterRating} onValueChange={setFilterRating}>
                <SelectTrigger>
                  <SelectValue placeholder="فلتر حسب التقييم" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">كل التقييمات</SelectItem>
                  <SelectItem value="5">5 نجوم</SelectItem>
                  <SelectItem value="4">4 نجوم</SelectItem>
                  <SelectItem value="3">3 نجوم</SelectItem>
                  <SelectItem value="low">منخفضة (1-2)</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterEngineer} onValueChange={setFilterEngineer}>
                <SelectTrigger>
                  <SelectValue placeholder="فلتر حسب المهندس" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">كل المهندسين</SelectItem>
                  {engineers.map(engineer => (
                    <SelectItem key={engineer.id} value={engineer.id}>
                      {engineer.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Rating Distribution */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>توزيع التقييمات</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[5, 4, 3, 2, 1].map(rating => (
                <div key={rating} className="flex items-center gap-3">
                  <div className="flex items-center gap-1 w-16">
                    <span className="text-sm font-medium">{rating}</span>
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  </div>
                  <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-amber-400 h-full transition-all"
                      style={{ width: `${reviews.length > 0 ? (ratingDistribution[rating] / reviews.length) * 100 : 0}%` }}
                    ></div>
                  </div>
                  <span className="text-sm text-slate-600 w-12 text-left">{ratingDistribution[rating]}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Reviews List */}
        <div className="space-y-4">
          {filteredReviews.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <MessageSquare className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500">لا توجد تقييمات مطابقة للفلتر</p>
              </CardContent>
            </Card>
          ) : (
            filteredReviews.map(review => (
              <Card key={review.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map(star => (
                            <Star
                              key={star}
                              className={`w-5 h-5 ${
                                star <= review.rating
                                  ? "fill-amber-400 text-amber-400"
                                  : "text-slate-300"
                              }`}
                            />
                          ))}
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {new Date(review.created_date).toLocaleDateString("ar-SA")}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-4 text-sm text-slate-600 mb-3">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          <span>{getEngineerName(review.engineer_id)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Briefcase className="w-4 h-4" />
                          <span>{getProjectTitle(review.project_id)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MessageSquare className="w-4 h-4" />
                          <span>{getClientName(review.client_id)}</span>
                        </div>
                      </div>

                      {review.comment && (
                        <p className="text-slate-700 bg-slate-50 p-3 rounded-lg">
                          "{review.comment}"
                        </p>
                      )}

                      {(review.quality_rating || review.communication_rating || review.delivery_rating) && (
                        <div className="flex gap-4 mt-3 text-xs">
                          {review.quality_rating && (
                            <div>
                              <span className="text-slate-500">الجودة:</span>
                              <span className="font-medium mr-1">{review.quality_rating}/5</span>
                            </div>
                          )}
                          {review.communication_rating && (
                            <div>
                              <span className="text-slate-500">التواصل:</span>
                              <span className="font-medium mr-1">{review.communication_rating}/5</span>
                            </div>
                          )}
                          {review.delivery_rating && (
                            <div>
                              <span className="text-slate-500">التسليم:</span>
                              <span className="font-medium mr-1">{review.delivery_rating}/5</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteReview(review.id, review.engineer_id)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-5 h-5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}