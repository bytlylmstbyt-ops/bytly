import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { 
  Crown, CheckCircle, Star, Zap, Shield, 
  Clock, Loader2, ArrowLeft, Gift, Calendar
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { differenceInDays } from "date-fns";

export default function Subscription() {
  const navigate = useNavigate();
  const [userProfile, setUserProfile] = useState(null);
  const [userType, setUserType] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [trialDaysLeft, setTrialDaysLeft] = useState(null);
  const [isInFreeTrial, setIsInFreeTrial] = useState(true);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    setIsLoading(true);
    try {
      const user = await base44.auth.me();
      
      const [engineerData] = await base44.entities.Engineer.filter({ email: user.email });
      const [firmData] = await base44.entities.EngineeringFirm.filter({ email: user.email });
      const [clientData] = await base44.entities.Client.filter({ email: user.email });

      let profile = null;
      let type = null;

      if (engineerData) {
        profile = engineerData;
        type = "engineer";
      } else if (firmData) {
        profile = firmData;
        type = "firm";
      } else if (clientData) {
        profile = clientData;
        type = "client";
      }

      setUserProfile(profile);
      setUserType(type);

      // Calculate trial days left
      if (profile?.trial_end_date) {
        const daysLeft = differenceInDays(new Date(profile.trial_end_date), new Date());
        setTrialDaysLeft(daysLeft);
        setIsInFreeTrial(profile.subscription_type === "free_trial" && daysLeft > 0);
      } else {
        // Auto-set trial period (90 days from now) if not set
        const trialEnd = new Date();
        trialEnd.setDate(trialEnd.getDate() + 90);
        
        if (type === "engineer") {
          await base44.entities.Engineer.update(profile.id, {
            trial_end_date: trialEnd.toISOString().split('T')[0],
            subscription_type: "free_trial",
            is_subscription_active: true
          });
        } else if (type === "firm") {
          await base44.entities.EngineeringFirm.update(profile.id, {
            trial_end_date: trialEnd.toISOString().split('T')[0],
            subscription_type: "free_trial",
            is_subscription_active: true
          });
        } else if (type === "client") {
          await base44.entities.Client.update(profile.id, {
            trial_end_date: trialEnd.toISOString().split('T')[0],
            subscription_type: "free_trial",
            is_subscription_active: true
          });
        }

        setTrialDaysLeft(90);
        setIsInFreeTrial(true);
      }
    } catch (error) {
      console.error("Error loading user data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubscribe = async (planType, amount) => {
    if (!userProfile) return;

    const startDate = new Date();
    const endDate = new Date();
    if (planType === "monthly") {
      endDate.setMonth(endDate.getMonth() + 1);
    } else {
      endDate.setFullYear(endDate.getFullYear() + 1);
    }

    try {
      // Update subscription based on user type
      if (userType === "engineer") {
        await base44.entities.Engineer.update(userProfile.id, {
          subscription_type: planType,
          subscription_start_date: startDate.toISOString().split("T")[0],
          subscription_end_date: endDate.toISOString().split("T")[0],
          is_subscription_active: true
        });
      } else if (userType === "firm") {
        await base44.entities.EngineeringFirm.update(userProfile.id, {
          subscription_type: planType,
          subscription_start_date: startDate.toISOString().split("T")[0],
          subscription_end_date: endDate.toISOString().split("T")[0],
          is_subscription_active: true
        });
      } else if (userType === "client") {
        await base44.entities.Client.update(userProfile.id, {
          subscription_type: planType,
          subscription_start_date: startDate.toISOString().split("T")[0],
          subscription_end_date: endDate.toISOString().split("T")[0],
          is_subscription_active: true
        });
      }

      // Create transaction
      await base44.entities.Transaction.create({
        user_email: userProfile.email,
        user_type: userType,
        type: "subscription",
        amount: amount,
        status: "completed",
        description: `اشتراك ${planType === "monthly" ? "شهري" : "سنوي"}`
      });

      navigate(createPageUrl("Dashboard"));
    } catch (error) {
      console.error("Error subscribing:", error);
    }
  };

  const plans = [
    {
      id: "monthly",
      name: "الباقة الشهرية",
      price: 0,
      originalPrice: 99,
      period: "شهرياً",
      freeNote: "مجاني خلال الفترة الترويجية",
      features: [
        "ظهور في قائمة المصممين المميزين",
        "شارة مميز على ملفك الشخصي",
        "تقديم عروض غير محدودة على المشاريع",
        "أولوية في نتائج البحث",
        "إحصائيات تفصيلية لملفك"
      ],
      color: "from-blue-500 to-cyan-500",
      popular: false
    },
    {
      id: "yearly",
      name: "الباقة السنوية",
      price: 0,
      originalPrice: 799,
      period: "سنوياً",
      freeNote: "مجاني خلال الفترة الترويجية",
      savings: "وفر 389 ر.س (بعد انتهاء الفترة التجريبية)",
      features: [
        "جميع مزايا الباقة الشهرية",
        "أولوية قصوى في نتائج البحث",
        "دعم فني مخصص على مدار الساعة",
        "تحليلات متقدمة للأداء",
        "شارة ذهبية مميزة",
        "عرض أعمالك في الصفحة الرئيسية"
      ],
      color: "from-amber-500 to-orange-500",
      popular: true
    }
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-[#d4a574]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-amber-50/30 py-12" dir="rtl">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Free Trial Banner */}
        {isInFreeTrial && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <Card className="bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0 shadow-xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                      <Gift className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold mb-1">🎉 وصول مجاني لفترة محدودة!</h3>
                      <p className="text-green-50">
                        استمتع بجميع المزايا مجاناً لمدة {trialDaysLeft} يوم متبقي
                      </p>
                    </div>
                  </div>
                  <Badge className="bg-white text-green-600 text-lg px-4 py-2">
                    <Calendar className="w-4 h-4 ml-2" />
                    {trialDaysLeft} يوم
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center mb-6">
            <Crown className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-[#1a1a2e] mb-4">
            {isInFreeTrial ? "الباقات المستقبلية" : "اختر باقتك"}
          </h1>
          <p className="text-slate-600 max-w-2xl mx-auto">
            {isInFreeTrial 
              ? "ستكون هذه الباقات متاحة بعد انتهاء الفترة الترويجية المجانية"
              : "اختر الباقة المناسبة لك واحصل على مزايا إضافية"}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className={`relative border-0 shadow-xl overflow-hidden h-full ${
                plan.popular ? "ring-2 ring-[#d4a574]" : ""
              }`}>
                {plan.popular && (
                  <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-center py-2 text-sm font-medium">
                    <Star className="w-4 h-4 inline ml-1" />
                    الأكثر شعبية
                  </div>
                )}
                {isInFreeTrial && (
                  <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-center py-2 text-sm font-medium">
                    <Gift className="w-4 h-4 inline ml-1" />
                    مجاني حالياً
                  </div>
                )}
                <CardContent className={`p-8 ${plan.popular || isInFreeTrial ? "pt-14" : ""}`}>
                  <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${plan.color} flex items-center justify-center mb-6`}>
                    {plan.id === "yearly" ? (
                      <Zap className="w-7 h-7 text-white" />
                    ) : (
                      <Clock className="w-7 h-7 text-white" />
                    )}
                  </div>

                  <h2 className="text-2xl font-bold text-[#1a1a2e] mb-2">{plan.name}</h2>
                  
                  <div className="mb-6">
                    <div className="flex items-baseline gap-2">
                      {isInFreeTrial ? (
                        <>
                          <span className="text-4xl font-bold text-green-600">0.00</span>
                          <span className="text-slate-500">ر.س / {plan.period}</span>
                        </>
                      ) : (
                        <>
                          <span className="text-4xl font-bold text-[#1a1a2e]">{plan.price}</span>
                          <span className="text-slate-500">ر.س / {plan.period}</span>
                        </>
                      )}
                    </div>
                    {isInFreeTrial && (
                      <div className="mt-2">
                        <Badge className="bg-green-100 text-green-700">
                          <Gift className="w-3 h-3 ml-1" />
                          {plan.freeNote}
                        </Badge>
                        <p className="text-xs text-slate-500 mt-1">
                          السعر الأصلي: {plan.originalPrice} ر.س
                        </p>
                      </div>
                    )}
                    {!isInFreeTrial && plan.savings && (
                      <Badge className="bg-green-100 text-green-700 mt-2">{plan.savings}</Badge>
                    )}
                  </div>

                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2 text-slate-600">
                        <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    onClick={() => handleSubscribe(plan.id, plan.price)}
                    disabled={isInFreeTrial}
                    className={`w-full py-6 text-lg ${
                      plan.popular 
                        ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:opacity-90"
                        : "bg-[#1a1a2e] text-white hover:bg-[#1a1a2e]/90"
                    } ${isInFreeTrial ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    {isInFreeTrial ? (
                      <>
                        <Gift className="w-5 h-5 ml-2" />
                        نشط مجاناً
                      </>
                    ) : (
                      <>اشترك الآن</>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Trial Expiry Warning */}
        {isInFreeTrial && trialDaysLeft <= 15 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-8"
          >
            <Card className="border-2 border-amber-300 bg-amber-50">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Clock className="w-6 h-6 text-amber-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-amber-900 mb-2">
                      ⚠️ فترة الوصول المجاني تنتهي قريباً!
                    </h3>
                    <p className="text-amber-800 mb-4">
                      لديك {trialDaysLeft} يوم متبقي من فترة الوصول المبكر المجاني. 
                      اشترك الآن للحفاظ على مشاريعك نشطة والاستمرار في تلقي العروض.
                    </p>
                    <Button className="bg-amber-600 hover:bg-amber-700 text-white">
                      اشترك الآن وحافظ على مزاياك
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Features */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-16"
        >
          <Card className="border-0 shadow-lg bg-[#1a1a2e] text-white">
            <CardContent className="p-8">
              <div className="text-center mb-8">
                <Shield className="w-12 h-12 mx-auto mb-4 text-[#d4a574]" />
                <h3 className="text-2xl font-bold mb-2">
                  {isInFreeTrial ? "استمتع بجميع المزايا مجاناً الآن" : "ضمان استرداد الأموال"}
                </h3>
                <p className="text-slate-300">
                  {isInFreeTrial 
                    ? "جميع الباقات متاحة بالكامل خلال الفترة الترويجية بدون أي قيود"
                    : "نقدم ضمان استرداد الأموال خلال 14 يوماً إذا لم تكن راضياً"}
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                <div>
                  <div className="text-3xl font-bold text-[#d4a574] mb-2">+50%</div>
                  <p className="text-slate-300">زيادة في المشاهدات</p>
                </div>
                <div>
                  <div className="text-3xl font-bold text-[#d4a574] mb-2">3x</div>
                  <p className="text-slate-300">فرص الحصول على مشاريع</p>
                </div>
                <div>
                  <div className="text-3xl font-bold text-[#d4a574] mb-2">24/7</div>
                  <p className="text-slate-300">دعم فني متواصل</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <div className="text-center mt-8">
          <Button 
            variant="ghost" 
            onClick={() => navigate(createPageUrl("Dashboard"))}
            className="text-slate-500"
          >
            <ArrowLeft className="w-4 h-4 ml-2" />
            العودة للوحة التحكم
          </Button>
        </div>
      </div>
    </div>
  );
}