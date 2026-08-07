import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { 
  MapPin, Star, CheckCircle, Briefcase, Award, Clock,
  MessageSquare, Share2, Heart, Grid3X3, ExternalLink,
  Calendar, Phone, Mail, PlusCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import AppointmentModal from "@/components/appointments/AppointmentModal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";
import EngineerReviewForm from "@/components/reviews/EngineerReviewForm";
import RatingStats from "@/components/reviews/RatingStats";
import ImageGallerySlider from "@/components/portfolio/ImageGallerySlider";
import EngineerPerformancePanel from "@/components/engineers/EngineerPerformancePanel";

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
  const [hasReviewed, setHasReviewed] = useState(false);
  const [tiktokData, setTiktokData] = useState(null);
  const [isOwner, setIsOwner] = useState(false);

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
      
      const favorites = await base44.entities.Favorite.filter({
        client_id: clientData[0].id,
        engineer_id: engineerId
      });
      setIsFavorited(favorites.length > 0);
    }

    // If engineerId is an email, filter by email; otherwise filter by id
    const isEmail = engineerId && engineerId.includes('@');
    const engineerQuery = isEmail ? { email: engineerId } : { id: engineerId };

    const [engineerData, portfolioData, reviewData] = await Promise.all([
      base44.entities.Engineer.filter(engineerQuery),
      base44.entities.Portfolio.filter({ engineer_id: engineerId }, "-created_date"),
      base44.entities.Review.filter({ engineer_id: engineerId }, "-created_date")
    ]);
    
    setEngineer(engineerData[0]);
    setPortfolios(portfolioData);
    setReviews(reviewData);

    // Resolve the real engineer id (in case an email was passed)
    const realEngineerId = engineerData[0]?.id || engineerId;

    // Check if current user is the engineer
    setIsOwner(engineerData[0]?.email === user.email);

    if (clientData.length > 0) {
      const alreadyReviewed = reviewData.some(r => r.client_id === clientData[0].id);
      setHasReviewed(alreadyReviewed);
    }

    // Fetch TikTok verified status (shared connector - platform account)
    try {
      const ttRes = await base44.functions.invoke("tiktokProfile", {});
      if (ttRes.data && !ttRes.data.error) {
        setTiktokData(ttRes.data);
      }
    } catch (e) {
      console.warn('TikTok profile fetch failed:', e?.message || e);
    }

    setIsLoading(false);
  };

  const toggleFavorite = async () => {
    if (!currentClient) {
      alert("يجب تسجيل الدخول كعميل لإضافة المفضلة");
      return;
    }

    // Optimistic UI — flip the heart instantly, rollback on failure
    const prevFavorited = isFavorited;
    setIsFavorited(!isFavorited);

    try {
      if (prevFavorited) {
        const favorites = await base44.entities.Favorite.filter({
          client_id: currentClient.id,
          engineer_id: engineerId
        });
        if (favorites.length > 0) {
          await base44.entities.Favorite.delete(favorites[0].id);
        }
      } else {
        await base44.entities.Favorite.create({
          client_id: currentClient.id,
          engineer_id: engineerId
        });
      }
    } catch (e) {
      console.error('toggleFavorite error:', e);
      setIsFavorited(prevFavorited); // rollback
    }
  };



  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-amber-50/30 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#C9A66B]"></div>
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



  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-amber-50/30">
      {/* Cover Image */}
      <div className="relative h-64 md:h-80 bg-gradient-to-br from-[#1a1a2e] to-[#C9A66B]">
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
                  <AvatarFallback className="bg-gradient-to-br from-[#1a1a2e] to-[#C9A66B] text-white text-4xl">
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
                      <Badge className="bg-gradient-to-r from-blue-500 to-blue-600 text-white mx-auto md:mx-0 gap-1.5 px-3 py-1 shadow-sm">
                        <CheckCircle className="w-4 h-4" />
                        مهندس معتمد
                        {engineer.certified_at && (
                          <span className="text-blue-200 text-xs font-normal mr-1">
                            منذ {new Date(engineer.certified_at).toLocaleDateString('ar-SA', { year: 'numeric', month: 'short' })}
                          </span>
                        )}
                      </Badge>
                    )}
                    {engineer.subscription_type !== "none" && (
                      <Badge className="bg-amber-100 text-amber-700 mx-auto md:mx-0">
                        عضو مميز
                      </Badge>
                    )}
                    {tiktokData?.is_verified && (
                      <Badge className="bg-[#010101] text-white mx-auto md:mx-0 flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.32 6.32 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.77 1.52V6.76a4.85 4.85 0 01-1-.07z"/>
                        </svg>
                        موثق TikTok
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
                    <Button className="w-full bg-gradient-to-r from-[#1a1a2e] to-[#C9A66B] text-white">
                      <MessageSquare className="w-5 h-5 ml-2" />
                      تواصل الآن
                    </Button>
                  </Link>
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
                  {currentClient && !hasReviewed && (
                    <EngineerReviewForm
                      engineerId={engineerId}
                      engineerName={engineer.full_name}
                      clientId={currentClient.id}
                      clientName={currentClient.full_name}
                      onSubmitted={loadData}
                      trigger={
                        <Button variant="outline" className="w-full border-amber-300 text-amber-700 hover:bg-amber-50 gap-2">
                          <Star className="w-4 h-4" />
                          تقييم المهندس
                        </Button>
                      }
                    />
                  )}
                  {currentClient && hasReviewed && (
                    <div className="flex items-center gap-1 text-sm text-amber-600 bg-amber-50 rounded-lg px-3 py-2 justify-center">
                      <Star className="w-4 h-4 fill-amber-500" />
                      لقد قمت بتقييم هذا المهندس
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Performance Panel */}
        <div className="mt-8">
          <EngineerPerformancePanel engineer={engineer} reviews={reviews} />
        </div>

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
                      <Briefcase className="w-5 h-5 text-[#C9A66B]" />
                      كتالوج الخدمات
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {engineer.services_offered.map((service, idx) => (
                        <div key={idx} className="p-4 border rounded-lg hover:border-[#C9A66B] transition-all">
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
                      <Award className="w-5 h-5 text-purple-600" />
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
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{portfolios.length} عمل</Badge>
                    <Link to="/Gallery">
                      <Button size="sm" variant="outline" className="gap-1 border-[#C9A66B] text-[#6B5D4F] hover:bg-amber-50">
                        <Grid3X3 className="w-4 h-4" />
                        المعرض الكامل
                      </Button>
                    </Link>
                    {isOwner && (
                      <Link to="/AddPortfolio">
                        <Button size="sm" className="gap-1">
                          <PlusCircle className="w-4 h-4" />
                          إضافة مشروع
                        </Button>
                      </Link>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {portfolios.length > 0 ? (
                    <div className="space-y-6">
                      {portfolios.map((portfolio) => (
                        <div key={portfolio.id} className="space-y-3">
                          <div className="flex items-center justify-between">
                            <h4 className="font-semibold text-slate-800">{portfolio.title}</h4>
                            <Badge variant="secondary">{portfolio.images?.length || 0} صور</Badge>
                          </div>
                          {portfolio.images && portfolio.images.length > 0 && (
                            <ImageGallerySlider images={portfolio.images} portfolio={portfolio} />
                          )}
                        </div>
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
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Star className="w-5 h-5 text-amber-500" />
                    التقييمات والمراجعات
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    {currentClient && !hasReviewed && (
                      <EngineerReviewForm
                        engineerId={engineerId}
                        engineerName={engineer.full_name}
                        clientId={currentClient.id}
                        clientName={currentClient.full_name}
                        onSubmitted={loadData}
                        trigger={
                          <Button size="sm" className="bg-gradient-to-r from-amber-500 to-amber-600 text-white gap-1">
                            <Star className="w-4 h-4 fill-white" />
                            اكتب تقييم
                          </Button>
                        }
                      />
                    )}
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold text-[#1a1a2e]">{engineer.rating?.toFixed(1) || "0.0"}</span>
                      <div className="flex">
                        {[1,2,3,4,5].map(s => (
                          <Star key={s} className={`w-4 h-4 ${s <= Math.round(engineer.rating||0) ? "fill-amber-400 text-amber-400" : "text-slate-300"}`} />
                        ))}
                      </div>
                      <span className="text-sm text-slate-500">({engineer.total_reviews || 0})</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {reviews.length > 0 ? (
                    <div className="space-y-5">
                      {reviews.map((review, index) => (
                        <div key={review.id} className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-amber-50/30 hover:border-amber-100 transition-all">
                          <div className="flex items-start gap-3">
                            <Avatar className="w-11 h-11 flex-shrink-0">
                              <AvatarFallback className="bg-gradient-to-br from-[#6B5D4F] to-[#C9A66B] text-white font-bold">
                                {String.fromCharCode(65 + (index % 26))}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1 flex-wrap gap-1">
                                <div className="flex items-center gap-2">
                                  <div className="flex">
                                    {[1, 2, 3, 4, 5].map(star => (
                                      <Star key={star} className={`w-4 h-4 ${star <= review.rating ? "fill-amber-400 text-amber-400" : "text-slate-300"}`} />
                                    ))}
                                  </div>
                                  <span className="text-sm font-bold text-amber-600">{review.rating}/5</span>
                                </div>
                                <span className="text-xs text-slate-400">
                                  {new Date(review.created_date).toLocaleDateString("ar-SA", { year: "numeric", month: "short", day: "numeric" })}
                                </span>
                              </div>

                              {/* Milestone tag — shown when review is linked to a specific phase */}
                              {review.milestone_title && (
                                <div className="inline-flex items-center gap-1 text-xs bg-amber-50 border border-amber-200 text-amber-700 px-2 py-0.5 rounded-full mb-2">
                                  🏗️ {review.milestone_title}
                                </div>
                              )}

                              {review.highlights?.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 mb-2">
                                  {review.highlights.map((h, idx) => (
                                    <span key={idx} className="text-xs bg-amber-50 text-amber-700 px-2 py-1 rounded-full border border-amber-200">
                                      ✓ {h}
                                    </span>
                                  ))}
                                </div>
                              )}
                              {review.comment && (
                                <p className="text-slate-700 text-sm leading-relaxed mb-3">{review.comment}</p>
                              )}
                              {(review.quality_rating > 0 || review.communication_rating > 0 || review.delivery_rating > 0) && (
                                <div className="flex flex-wrap gap-2">
                                  {review.quality_rating > 0 && (
                                    <span className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full border border-blue-100">
                                      🏆 جودة {review.quality_rating}/5
                                    </span>
                                  )}
                                  {review.communication_rating > 0 && (
                                    <span className="inline-flex items-center gap-1 text-xs bg-green-50 text-green-700 px-2 py-1 rounded-full border border-green-100">
                                      💬 تواصل {review.communication_rating}/5
                                    </span>
                                  )}
                                  {review.delivery_rating > 0 && (
                                    <span className="inline-flex items-center gap-1 text-xs bg-purple-50 text-purple-700 px-2 py-1 rounded-full border border-purple-100">
                                      ⏱️ مواعيد {review.delivery_rating}/5
                                    </span>
                                  )}
                                </div>
                              )}
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
            {/* Rating Stats */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
              <RatingStats engineer={engineer} reviews={reviews} />
            </motion.div>

            {/* TikTok Verified Card */}
            {tiktokData && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.18 }}
              >
                <Card className="border-0 shadow-lg overflow-hidden">
                  <div className="h-1.5 bg-gradient-to-r from-[#010101] via-[#fe2c55] to-[#25f4ee]" />
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.32 6.32 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.77 1.52V6.76a4.85 4.85 0 01-1-.07z"/>
                      </svg>
                      حساب TikTok
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2">
                      {tiktokData.avatar_url && (
                        <img src={tiktokData.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover" />
                      )}
                      <div>
                        <p className="font-semibold text-sm">{tiktokData.display_name}</p>
                        {tiktokData.is_verified && (
                          <span className="inline-flex items-center gap-1 text-xs text-[#fe2c55] font-medium">
                            <CheckCircle className="w-3 h-3" />
                            حساب موثق ✓
                          </span>
                        )}
                      </div>
                    </div>
                    {(tiktokData.follower_count !== undefined) && (
                      <div className="grid grid-cols-2 gap-2 text-center">
                        <div className="bg-slate-50 rounded-lg p-2">
                          <p className="text-base font-bold text-[#1a1a2e]">
                            {tiktokData.follower_count?.toLocaleString("ar") || 0}
                          </p>
                          <p className="text-xs text-slate-500">متابع</p>
                        </div>
                        <div className="bg-slate-50 rounded-lg p-2">
                          <p className="text-base font-bold text-[#1a1a2e]">
                            {tiktokData.video_count?.toLocaleString("ar") || 0}
                          </p>
                          <p className="text-xs text-slate-500">فيديو</p>
                        </div>
                      </div>
                    )}
                    {tiktokData.profile_deep_link && (
                      <a
                        href={tiktokData.profile_deep_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-[#fe2c55] hover:underline"
                      >
                        <ExternalLink className="w-3 h-3" />
                        عرض الملف على TikTok
                      </a>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}

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