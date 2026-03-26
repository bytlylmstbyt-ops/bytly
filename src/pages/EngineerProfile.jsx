import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { 
  MapPin, Star, CheckCircle, Briefcase, Award, Clock,
  MessageSquare, Share2, Heart, Grid3X3, ExternalLink,
  Calendar, Phone, Mail, ChevronLeft, ChevronRight, HeartOff
} from "lucide-react";
import { Button } from "@/components/ui/button";
import AppointmentModal from "@/components/appointments/AppointmentModal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function EngineerProfile() {
  const urlParams = new URLSearchParams(window.location.search);
  const engineerId = urlParams.get("id");

  const [engineer, setEngineer] = useState(null);
  const [portfolios, setPortfolios] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isFavorited, setIsFavorited] = useState(false);
  const [currentClient, setCurrentClient] = useState(null);

  useEffect(() => {
    if (engineerId) {
      loadData();
    }
  }, [engineerId]);

  const loadData = async () => {
    setIsLoading(true);
    
    const user = await base44.auth.me();
    const clientData = await base44.entities.Client.filter({ email: user.email });
    
    if (clientData.length > 0) {
      setCurrentClient(clientData[0]);
      
      // Check if favorited
      const favorites = await base44.entities.Favorite.filter({
        client_id: clientData[0].id,
        engineer_id: engineerId
      });
      setIsFavorited(favorites.length > 0);
    }

    const [engineerData, portfolioData, reviewData] = await Promise.all([
      base44.entities.Engineer.filter({ id: engineerId }),
      base44.entities.Portfolio.filter({ engineer_id: engineerId }, "-created_date"),
      base44.entities.Review.filter({ engineer_id: engineerId }, "-created_date")
    ]);
    
    setEngineer(engineerData[0]);
    setPortfolios(portfolioData);
    setReviews(reviewData);
    setIsLoading(false);
  };

  const toggleFavorite = async () => {
    if (!currentClient) {
      alert("يجب تسجيل الدخول كعميل لإضافة المفضلة");
      return;
    }

    if (isFavorited) {
      // Remove from favorites
      const favorites = await base44.entities.Favorite.filter({
        client_id: currentClient.id,
        engineer_id: engineerId
      });
      if (favorites.length > 0) {
        await base44.entities.Favorite.delete(favorites[0].id);
      }
      setIsFavorited(false);
    } else {
      // Add to favorites
      await base44.entities.Favorite.create({
        client_id: currentClient.id,
        engineer_id: engineerId
      });
      setIsFavorited(true);
    }
  };

  const allImages = portfolios.flatMap(p => p.images || []);

  const handlePrevImage = () => {
    setCurrentImageIndex(prev => (prev === 0 ? allImages.length - 1 : prev - 1));
    setSelectedImage(allImages[currentImageIndex === 0 ? allImages.length - 1 : currentImageIndex - 1]);
  };

  const handleNextImage = () => {
    setCurrentImageIndex(prev => (prev === allImages.length - 1 ? 0 : prev + 1));
    setSelectedImage(allImages[currentImageIndex === allImages.length - 1 ? 0 : currentImageIndex + 1]);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-amber-50/30 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#d4a574]"></div>
      </div>
    );
  }

  if (!engineer) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-amber-50/30 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-700 mb-4">لم يتم العثور على المهندس</h2>
          <Link to={createPageUrl("Engineers")}>
            <Button>العودة للقائمة</Button>
          </Link>
        </div>
      </div>
    );
  }

  const ratingBreakdown = {
    quality: engineer.rating || 0,
    communication: reviews.length ? reviews.reduce((acc, r) => acc + (r.communication_rating || 0), 0) / reviews.length : 0,
    delivery: reviews.length ? reviews.reduce((acc, r) => acc + (r.delivery_rating || 0), 0) / reviews.length : 0
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-amber-50/30">
      {/* Cover Image */}
      <div className="relative h-64 md:h-80 bg-gradient-to-br from-[#1a1a2e] to-[#d4a574]">
        {engineer.cover_image && (
          <img 
            src={engineer.cover_image} 
            alt="" 
            className="w-full h-full object-cover opacity-60"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a2e]/80 to-transparent" />
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-32 relative z-10 pb-16">
        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="border-0 shadow-xl overflow-hidden">
            <CardContent className="p-6 md:p-8">
              <div className="flex flex-col md:flex-row gap-6">
                {/* Avatar */}
                <Avatar className="w-32 h-32 border-4 border-white shadow-xl mx-auto md:mx-0">
                  <AvatarImage src={engineer.profile_image} />
                  <AvatarFallback className="bg-gradient-to-br from-[#1a1a2e] to-[#d4a574] text-white text-4xl">
                    {engineer.full_name?.charAt(0)}
                  </AvatarFallback>
                </Avatar>

                {/* Info */}
                <div className="flex-1 text-center md:text-right">
                  <div className="flex flex-col md:flex-row md:items-center gap-2 justify-center md:justify-start mb-2">
                    <h1 className="text-2xl md:text-3xl font-bold text-[#1a1a2e]">
                      {engineer.full_name}
                    </h1>
                    {engineer.is_verified && (
                      <Badge className="bg-blue-100 text-blue-700 mx-auto md:mx-0">
                        <CheckCircle className="w-4 h-4 ml-1" />
                        موثق
                      </Badge>
                    )}
                    {engineer.subscription_type !== "none" && (
                      <Badge className="bg-amber-100 text-amber-700 mx-auto md:mx-0">
                        عضو مميز
                      </Badge>
                    )}
                  </div>

                  <p className="text-lg text-slate-600 mb-3">{engineer.specialization}</p>

                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm text-slate-500 mb-4">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {engineer.city}, {engineer.country}
                    </span>
                    <span className="flex items-center gap-1">
                      <Award className="w-4 h-4" />
                      {engineer.years_experience || 0} سنة خبرة
                    </span>
                    <span className="flex items-center gap-1">
                      <Briefcase className="w-4 h-4" />
                      {engineer.completed_projects || 0} مشروع مكتمل
                    </span>
                  </div>

                  {/* Rating */}
                  <div className="flex items-center justify-center md:justify-start gap-4">
                    <div className="flex items-center gap-2">
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map(star => (
                          <Star 
                            key={star} 
                            className={`w-5 h-5 ${star <= Math.round(engineer.rating || 0) ? "fill-amber-400 text-amber-400" : "text-slate-300"}`}
                          />
                        ))}
                      </div>
                      <span className="font-bold text-lg">{engineer.rating?.toFixed(1) || "0.0"}</span>
                      <span className="text-slate-500">({engineer.total_reviews || 0} تقييم)</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-3 min-w-[200px]">
                  <AppointmentModal
                    targetId={engineer.id}
                    targetName={engineer.full_name}
                    targetType="engineer"
                    targetEmail={engineer.email}
                    trigger={
                      <Button className="w-full bg-gradient-to-r from-amber-500 to-amber-600 text-white">
                        <Calendar className="w-5 h-5 ml-2" />
                        حجز موعد استشارة
                      </Button>
                    }
                  />
                  <Link to={createPageUrl("CreateProject") + `?engineer=${engineer.id}`}>
                    <Button className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white">
                      <Briefcase className="w-5 h-5 ml-2" />
                      طلب خدمة خاصة
                    </Button>
                  </Link>
                  <Link to={createPageUrl("Messages") + `?engineer=${engineer.id}`}>
                  <div className="flex gap-2">
                    {currentClient && (
                      <Button 
                        variant={isFavorited ? "default" : "outline"}
                        className={`flex-1 ${isFavorited ? "bg-red-500 hover:bg-red-600" : ""}`}
                        onClick={toggleFavorite}
                      >
                        {isFavorited ? (
                          <Heart className="w-5 h-5 fill-current" />
                        ) : (
                          <Heart className="w-5 h-5" />
                        )}
                      </Button>
                    )}
                    <Button variant="outline" className="flex-1">
                      <Share2 className="w-5 h-5" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Service Catalog */}
            {engineer.services_offered?.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card className="border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Briefcase className="w-5 h-5 text-[#d4a574]" />
                      كتالوج الخدمات
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {engineer.services_offered.map((service, idx) => (
                        <div key={idx} className="p-4 border rounded-lg hover:border-[#d4a574] transition-all">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-semibold text-[#1a1a2e] mb-1">{service.service_name}</h4>
                              <p className="text-sm text-slate-600 mb-2">{service.description}</p>
                              <div className="flex items-center gap-4 text-xs text-slate-500">
                                {service.delivery_time && (
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {service.delivery_time}
                                  </span>
                                )}
                                {service.price_range && (
                                  <Badge variant="outline" className="text-xs">
                                    {service.price_range}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Bio */}
            {engineer.bio && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
              >
                <Card className="border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle>نبذة عني</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-slate-600 leading-relaxed">{engineer.bio}</p>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Firm Ratings */}
            {engineer.firm_ratings?.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.18 }}
              >
                <Card className="border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="w-5 h-5 text-purple-600" />
                      تقييمات الشركات الاستشارية
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {engineer.firm_ratings.map((rating, idx) => (
                        <div key={idx} className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-purple-900">{rating.firm_name}</span>
                            <div className="flex items-center gap-1">
                              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                              <span className="font-bold">{rating.rating}</span>
                            </div>
                          </div>
                          {rating.comment && (
                            <p className="text-sm text-purple-700">{rating.comment}</p>
                          )}
                          <p className="text-xs text-purple-600 mt-1">
                            {new Date(rating.date).toLocaleDateString('ar-SA')}
                          </p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Portfolio */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="border-0 shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Grid3X3 className="w-5 h-5" />
                    معرض الأعمال
                  </CardTitle>
                  <Badge variant="secondary">{portfolios.length} عمل</Badge>
                </CardHeader>
                <CardContent>
                  {portfolios.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {portfolios.map((portfolio, index) => (
                        portfolio.images?.map((image, imgIndex) => (
                          <Dialog key={`${portfolio.id}-${imgIndex}`}>
                            <DialogTrigger asChild>
                              <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: (index * portfolio.images?.length + imgIndex) * 0.05 }}
                                className="group relative aspect-square rounded-xl overflow-hidden cursor-pointer"
                                onClick={() => {
                                  const globalIndex = portfolios.slice(0, index).reduce((acc, p) => acc + (p.images?.length || 0), 0) + imgIndex;
                                  setCurrentImageIndex(globalIndex);
                                  setSelectedImage(image);
                                }}
                              >
                                <img
                                  src={image}
                                  alt={portfolio.title}
                                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                                  <div className="absolute bottom-3 right-3">
                                    <p className="text-white text-sm font-medium">{portfolio.title}</p>
                                  </div>
                                </div>
                              </motion.div>
                            </DialogTrigger>
                            <DialogContent className="max-w-4xl p-0 bg-black/95 border-0">
                              <div className="relative">
                                <img
                                  src={selectedImage || image}
                                  alt={portfolio.title}
                                  className="w-full h-auto max-h-[80vh] object-contain"
                                />
                                {allImages.length > 1 && (
                                  <>
                                    <button
                                      onClick={handlePrevImage}
                                      className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
                                    >
                                      <ChevronRight className="w-6 h-6 text-white" />
                                    </button>
                                    <button
                                      onClick={handleNextImage}
                                      className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
                                    >
                                      <ChevronLeft className="w-6 h-6 text-white" />
                                    </button>
                                  </>
                                )}
                              </div>
                            </DialogContent>
                          </Dialog>
                        ))
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Grid3X3 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                      <p className="text-slate-500">لا توجد أعمال حالياً</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Reviews */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle>التقييمات والمراجعات</CardTitle>
                </CardHeader>
                <CardContent>
                  {reviews.length > 0 ? (
                    <div className="space-y-6">
                      {reviews.map((review, index) => (
                        <div key={review.id} className={`${index > 0 ? "border-t pt-6" : ""}`}>
                          <div className="flex items-start gap-4">
                            <Avatar className="w-12 h-12">
                              <AvatarFallback className="bg-slate-200">
                                {review.client_id?.charAt(0) || "U"}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  {[1, 2, 3, 4, 5].map(star => (
                                    <Star 
                                      key={star} 
                                      className={`w-4 h-4 ${star <= review.rating ? "fill-amber-400 text-amber-400" : "text-slate-300"}`}
                                    />
                                  ))}
                                </div>
                                <span className="text-sm text-slate-500">
                                  {new Date(review.created_date).toLocaleDateString("ar")}
                                </span>
                              </div>
                              <p className="text-slate-600">{review.comment}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Star className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                      <p className="text-slate-500">لا توجد تقييمات حتى الآن</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Rating Breakdown */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-lg">تفاصيل التقييم</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>جودة العمل</span>
                      <span>{ratingBreakdown.quality.toFixed(1)}</span>
                    </div>
                    <Progress value={ratingBreakdown.quality * 20} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>التواصل</span>
                      <span>{ratingBreakdown.communication.toFixed(1)}</span>
                    </div>
                    <Progress value={ratingBreakdown.communication * 20} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>الالتزام بالمواعيد</span>
                      <span>{ratingBreakdown.delivery.toFixed(1)}</span>
                    </div>
                    <Progress value={ratingBreakdown.delivery * 20} className="h-2" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Quick Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-lg">معلومات سريعة</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {engineer.registration_number && (
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                        <Award className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm text-slate-500">رقم القيد</p>
                        <p className="font-medium">{engineer.registration_number}</p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">انضم في</p>
                      <p className="font-medium">
                        {new Date(engineer.created_date).toLocaleDateString("ar", { year: "numeric", month: "long" })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                      <Clock className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">متوسط وقت الرد</p>
                      <p className="font-medium">خلال ساعات</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}