import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { 
  ShoppingCart, Star, Download, Ruler, Layers, 
  Bed, Bath, Home, Check, ArrowLeft, MessageSquare,
  Zap, CheckCircle, Shield, Award, ChevronLeft, ChevronRight,
  FileText, Edit3, Loader2, Wallet
} from "lucide-react";
import PaymentMethodChoice from "@/components/payment/PaymentMethodChoice";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function DesignDetails() {
  const urlParams = new URLSearchParams(window.location.search);
  const designId = urlParams.get("id");
  const navigate = useNavigate();

  const [design, setDesign] = useState(null);
  const [seller, setSeller] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [user, setUser] = useState(null);
  const [hasPurchased, setHasPurchased] = useState(false);
  const [purchase, setPurchase] = useState(null);
  const [showModificationRequest, setShowModificationRequest] = useState(false);
  const [modificationNotes, setModificationNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPaymentOptions, setShowPaymentOptions] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [currentClient, setCurrentClient] = useState(null);

  useEffect(() => {
    if (designId) {
      loadData();
    }
  }, [designId]);

  const loadData = async () => {
    setIsLoading(true);
    
    const currentUser = await base44.auth.me();
    setUser(currentUser);

    const [clientData] = await base44.entities.Client.filter({ email: currentUser.email });
    setCurrentClient(clientData);

    const [designData] = await base44.entities.ReadyMadeDesign.filter({ id: designId });
    setDesign(designData);

    // Check if user has purchased this design
    const purchases = await base44.entities.DesignPurchase.filter({ 
      design_id: designId,
      buyer_email: currentUser.email,
      payment_status: "completed"
    });
    
    if (purchases.length > 0) {
      setHasPurchased(true);
      setPurchase(purchases[0]);
    }

    // Load seller info
    if (designData.seller_type === "engineer") {
      const [engineerData] = await base44.entities.Engineer.filter({ id: designData.seller_id });
      setSeller(engineerData);
    } else {
      const [firmData] = await base44.entities.EngineeringFirm.filter({ id: designData.seller_id });
      setSeller(firmData);
    }

    setIsLoading(false);
  };

  const handlePurchase = () => {
    setShowPaymentDialog(true);
  };

  const payWithWallet = async () => {
    if (!currentClient || currentClient.wallet_balance < design.price) {
      alert("رصيد المحفظة غير كافٍ");
      return;
    }

    setIsSubmitting(true);
    try {
      const commissionRate = 0.25;
      const commissionAmount = design.price * commissionRate;
      const sellerEarnings = design.price - commissionAmount;

      // Create purchase record
      const purchase = await base44.entities.DesignPurchase.create({
        design_id: designId,
        buyer_email: user.email,
        buyer_name: user.full_name,
        buyer_id: currentClient.id,
        seller_id: design.seller_id,
        seller_email: design.created_by,
        amount_paid: design.price,
        platform_commission: commissionAmount,
        seller_earnings: sellerEarnings,
        payment_status: "completed",
        payment_method: "wallet",
        download_url: design.design_files?.[0] || null
      });

      // Deduct from buyer wallet
      await base44.entities.Client.update(currentClient.id, {
        wallet_balance: currentClient.wallet_balance - design.price
      });

      // Add to seller balance
      const sellers = design.seller_type === "engineer" 
        ? await base44.entities.Engineer.filter({ id: design.seller_id })
        : await base44.entities.EngineeringFirm.filter({ id: design.seller_id });
      
      const seller = sellers[0];
      if (seller) {
        const entityName = design.seller_type === "engineer" ? "Engineer" : "EngineeringFirm";
        await base44.entities[entityName].update(seller.id, {
          available_balance: (seller.available_balance || 0) + sellerEarnings
        });
      }

      // Update design stats
      await base44.entities.ReadyMadeDesign.update(designId, {
        total_purchases: (design.total_purchases || 0) + 1
      });

      window.location.href = createPageUrl("DesignPurchaseSuccess") + `?purchase_id=${purchase.id}`;
    } catch (error) {
      alert("حدث خطأ في الدفع");
      setIsSubmitting(false);
    }
  };

  const payWithStripe = async () => {
    setIsSubmitting(true);
    try {
      const response = await base44.functions.invoke('createDesignCheckout', {
        design_id: designId,
        buyer_email: user.email
      });

      if (response.data?.url) {
        window.location.href = response.data.url;
      }
    } catch (error) {
      alert("حدث خطأ في إنشاء عملية الدفع");
      setIsSubmitting(false);
    }
  };

  const requestInvoice = async () => {
    setIsSubmitting(true);
    try {
      await base44.entities.Invoice.create({
        client_id: currentClient.id,
        client_email: user.email,
        design_id: designId,
        amount: design.price,
        description: `فاتورة شراء تصميم: ${design.title}`,
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        status: "pending"
      });

      alert("تم إرسال طلب الفاتورة. سيتم التواصل معك خلال 24 ساعة");
      setShowPaymentDialog(false);
    } catch (error) {
      alert("حدث خطأ");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRequestModification = async () => {
    if (!modificationNotes.trim()) {
      alert("يرجى كتابة التعديلات المطلوبة");
      return;
    }

    setIsSubmitting(true);
    
    try {
      await base44.entities.DesignPurchase.update(purchase.id, {
        has_modification_request: true,
        modification_notes: modificationNotes,
        modification_status: "pending",
        modification_fee: design.modification_fee || 0
      });

      // Notify seller
      await base44.entities.Notification.create({
        recipient_email: design.created_by,
        title: "طلب تعديل على تصميم جاهز",
        message: `طلب ${user.full_name} تعديلات على تصميم "${design.title}"`,
        type: "modification_request",
        priority: "high"
      });

      alert("تم إرسال طلب التعديل بنجاح");
      setShowModificationRequest(false);
      loadData();
    } catch (error) {
      alert("حدث خطأ في إرسال الطلب");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-[#d4a574]" />
      </div>
    );
  }

  if (!design) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">التصميم غير موجود</h2>
          <Link to={createPageUrl("DesignMarketplace")}>
            <Button>العودة للمتجر</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-amber-50/30 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image Gallery */}
            <Card className="border-0 shadow-xl overflow-hidden">
              <div className="relative h-96 bg-slate-100">
                <img 
                  src={design.preview_images?.[currentImageIndex]} 
                  alt={design.title}
                  className="w-full h-full object-cover"
                />
                {design.preview_images?.length > 1 && (
                  <>
                    <button
                      onClick={() => setCurrentImageIndex(prev => prev === 0 ? design.preview_images.length - 1 : prev - 1)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 flex items-center justify-center hover:bg-white shadow-lg"
                    >
                      <ChevronRight className="w-6 h-6" />
                    </button>
                    <button
                      onClick={() => setCurrentImageIndex(prev => prev === design.preview_images.length - 1 ? 0 : prev + 1)}
                      className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 flex items-center justify-center hover:bg-white shadow-lg"
                    >
                      <ChevronLeft className="w-6 h-6" />
                    </button>
                  </>
                )}
                {design.is_featured && (
                  <Badge className="absolute top-4 right-4 bg-amber-500 text-white">
                    <Award className="w-4 h-4 ml-1" />
                    تصميم مميز
                  </Badge>
                )}
              </div>
              
              {/* Thumbnail Strip */}
              {design.preview_images?.length > 1 && (
                <div className="p-4 bg-white flex gap-2 overflow-x-auto">
                  {design.preview_images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentImageIndex(idx)}
                      className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden ${
                        currentImageIndex === idx ? "ring-2 ring-[#d4a574]" : ""
                      }`}
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </Card>

            {/* Description */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>وصف التصميم</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 whitespace-pre-wrap leading-relaxed">
                  {design.description}
                </p>
              </CardContent>
            </Card>

            {/* Specifications */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>المواصفات</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {design.area_sqm && (
                    <div className="flex items-center gap-2">
                      <Ruler className="w-5 h-5 text-[#d4a574]" />
                      <div>
                        <p className="text-sm text-slate-500">المساحة</p>
                        <p className="font-semibold">{design.area_sqm} م²</p>
                      </div>
                    </div>
                  )}
                  {design.floors && (
                    <div className="flex items-center gap-2">
                      <Layers className="w-5 h-5 text-[#d4a574]" />
                      <div>
                        <p className="text-sm text-slate-500">الطوابق</p>
                        <p className="font-semibold">{design.floors}</p>
                      </div>
                    </div>
                  )}
                  {design.bedrooms && (
                    <div className="flex items-center gap-2">
                      <Bed className="w-5 h-5 text-[#d4a574]" />
                      <div>
                        <p className="text-sm text-slate-500">غرف النوم</p>
                        <p className="font-semibold">{design.bedrooms}</p>
                      </div>
                    </div>
                  )}
                  {design.bathrooms && (
                    <div className="flex items-center gap-2">
                      <Bath className="w-5 h-5 text-[#d4a574]" />
                      <div>
                        <p className="text-sm text-slate-500">دورات المياه</p>
                        <p className="font-semibold">{design.bathrooms}</p>
                      </div>
                    </div>
                  )}
                </div>

                {design.specifications && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-sm font-semibold mb-2">مميزات إضافية:</p>
                    <div className="flex flex-wrap gap-2">
                      {design.specifications.has_basement && (
                        <Badge variant="outline">قبو</Badge>
                      )}
                      {design.specifications.has_garage && (
                        <Badge variant="outline">مرآب</Badge>
                      )}
                      {design.specifications.has_garden && (
                        <Badge variant="outline">حديقة</Badge>
                      )}
                      {design.specifications.has_pool && (
                        <Badge variant="outline">مسبح</Badge>
                      )}
                      {design.specifications.has_majlis && (
                        <Badge variant="outline">مجلس</Badge>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* What's Included */}
            {design.includes?.length > 0 && (
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle>ما يتضمنه التصميم</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-3">
                    {design.includes.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <span className="text-slate-700">{item}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Price Card */}
            <Card className="border-2 border-[#d4a574] shadow-xl sticky top-8">
              <CardContent className="p-6">
                <div className="text-center mb-6">
                  <p className="text-3xl font-bold text-[#1a1a2e] mb-1">
                    {design.price?.toLocaleString('ar-SA')} ر.س
                  </p>
                  <p className="text-sm text-slate-500">شراء فوري وتحميل مباشر</p>
                  <p className="text-xs text-slate-400 mt-1">(شامل 25% عمولة منصة)</p>
                </div>

                {hasPurchased ? (
                  <div className="space-y-3">
                    <Badge className="w-full py-2 bg-green-100 text-green-700 justify-center">
                      <CheckCircle className="w-4 h-4 ml-2" />
                      تم الشراء
                    </Badge>
                    
                    <a 
                      href={purchase.download_url} 
                      download 
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white">
                        <Download className="w-5 h-5 ml-2" />
                        تحميل الملفات
                      </Button>
                    </a>

                    {design.modification_available && !purchase.has_modification_request && (
                      <Dialog open={showModificationRequest} onOpenChange={setShowModificationRequest}>
                        <DialogTrigger asChild>
                          <Button variant="outline" className="w-full">
                            <Edit3 className="w-5 h-5 ml-2" />
                            طلب تعديل
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>طلب تعديل على التصميم</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4 mt-4">
                            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm">
                              <p className="text-amber-800">
                                رسوم التعديل: <span className="font-bold">{design.modification_fee?.toLocaleString('ar-SA')} ر.س</span>
                              </p>
                            </div>
                            <Textarea
                              placeholder="اكتب التعديلات المطلوبة بالتفصيل..."
                              value={modificationNotes}
                              onChange={(e) => setModificationNotes(e.target.value)}
                              rows={5}
                            />
                            <Button 
                              onClick={handleRequestModification}
                              disabled={isSubmitting}
                              className="w-full"
                            >
                              {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "إرسال الطلب"}
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    )}

                    {purchase.has_modification_request && (
                      <Badge className="w-full py-2 bg-purple-100 text-purple-700 justify-center">
                        <Zap className="w-4 h-4 ml-2" />
                        طلب تعديل قيد المعالجة
                      </Badge>
                    )}
                  </div>
                ) : (
                  <>
                    <Button 
                      onClick={handlePurchase}
                      disabled={isSubmitting}
                      className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white text-lg py-6"
                    >
                      <ShoppingCart className="w-6 h-6 ml-2" />
                      اشتر الآن
                    </Button>

                    {/* Payment Method Dialog */}
                    <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
                      <DialogContent className="max-w-lg">
                        <DialogHeader>
                          <DialogTitle>اختر طريقة الدفع</DialogTitle>
                        </DialogHeader>
                        {currentClient && (
                          <PaymentMethodChoice
                            amount={design.price}
                            walletBalance={currentClient.wallet_balance || 0}
                            showInvoiceOption={currentClient.client_type === "investor"}
                            onWalletPay={payWithWallet}
                            onStripePay={payWithStripe}
                            onInvoiceRequest={requestInvoice}
                          />
                        )}
                      </DialogContent>
                    </Dialog>
                  </>
                )}

                <div className="mt-4 space-y-2 text-sm text-slate-600">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-green-600" />
                    دفع آمن ومحمي
                  </div>
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-blue-600" />
                    تحميل فوري بعد الدفع
                  </div>
                  {design.modification_available && (
                    <div className="flex items-center gap-2">
                      <Edit3 className="w-4 h-4 text-purple-600" />
                      إمكانية طلب تعديلات
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Seller Card */}
            {seller && (
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle>عن البائع</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3 mb-4">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={seller.profile_image || seller.company_logo} />
                      <AvatarFallback className="bg-gradient-to-br from-[#1a1a2e] to-[#d4a574] text-white">
                        {seller.full_name?.charAt(0) || seller.company_name?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <Link 
                        to={createPageUrl(design.seller_type === "engineer" ? "EngineerProfile" : "FirmProfile") + `?id=${design.seller_id}`}
                        className="font-semibold text-[#1a1a2e] hover:text-[#d4a574]"
                      >
                        {seller.full_name || seller.company_name}
                      </Link>
                      {seller.rating > 0 && (
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                          <span className="text-sm">{seller.rating.toFixed(1)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <Link to={createPageUrl("Messages") + `?${design.seller_type}=${design.seller_id}`}>
                    <Button variant="outline" className="w-full">
                      <MessageSquare className="w-5 h-5 ml-2" />
                      تواصل مع البائع
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}

            {/* Stats */}
            <Card className="border-0 shadow-lg">
              <CardContent className="pt-6">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-[#1a1a2e]">{design.total_purchases || 0}</p>
                    <p className="text-sm text-slate-500">مشتري</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-[#1a1a2e]">{design.rating?.toFixed(1) || "0.0"}</p>
                    <p className="text-sm text-slate-500">التقييم</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Sidebar - Title & Details */}
          <div className="lg:col-span-1 space-y-6 lg:order-first">
            <div>
              <Link to={createPageUrl("DesignMarketplace")}>
                <Button variant="ghost" className="mb-4">
                  <ArrowLeft className="w-4 h-4 ml-2" />
                  العودة للمتجر
                </Button>
              </Link>
              
              <h1 className="text-3xl font-bold text-[#1a1a2e] mb-4">
                {design.title}
              </h1>

              {design.tags?.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {design.tags.map((tag, idx) => (
                    <Badge key={idx} variant="outline">{tag}</Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}