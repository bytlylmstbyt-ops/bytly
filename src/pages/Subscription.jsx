import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { 
  Crown, CheckCircle, Star, Zap, Shield, 
  Clock, Loader2, ArrowLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function Subscription() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const selectedPlan = urlParams.get("plan");

  const [engineer, setEngineer] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    loadEngineerData();
  }, []);

  const loadEngineerData = async () => {
    setIsLoading(true);
    const user = await base44.auth.me();
    
    const [engineerData, firmData] = await Promise.all([
      base44.entities.Engineer.filter({ email: user.email }).catch(() => []),
      base44.entities.EngineeringFirm.filter({ email: user.email }).catch(() => [])
    ]);
    
    if (engineerData.length > 0) {
      setEngineer(engineerData[0]);
    } else if (firmData.length > 0) {
      setEngineer(firmData[0]);
    }
    
    setIsLoading(false);
  };

  const handleSubscribe = async (planType, amount) => {
    if (!engineer) return;

    setIsProcessing(true);

    const startDate = new Date();
    const endDate = new Date();
    if (planType === "monthly") {
      endDate.setMonth(endDate.getMonth() + 1);
    } else {
      endDate.setFullYear(endDate.getFullYear() + 1);
    }

    // Create subscription
    await base44.entities.Subscription.create({
      engineer_id: engineer.id,
      plan_type: planType,
      amount: amount,
      start_date: startDate.toISOString().split("T")[0],
      end_date: endDate.toISOString().split("T")[0],
      status: "active"
    });

    // Create transaction
    await base44.entities.Transaction.create({
      user_id: engineer.id,
      type: "subscription",
      amount: amount,
      status: "completed",
      description: `اشتراك ${planType === "monthly" ? "شهري" : "سنوي"}`
    });

    // Update engineer or firm
    const engineerCheck = await base44.entities.Engineer.filter({ id: engineer.id }).catch(() => []);
    if (engineerCheck.length > 0) {
      await base44.entities.Engineer.update(engineer.id, {
        subscription_type: planType,
        subscription_end_date: endDate.toISOString().split("T")[0]
      });
    } else {
      await base44.entities.EngineeringFirm.update(engineer.id, {
        subscription_type: planType,
        subscription_end_date: endDate.toISOString().split("T")[0]
      });
    }

    setIsProcessing(false);
    navigate(createPageUrl("Dashboard"));
  };

  const plans = [
    {
      id: "monthly",
      name: "الخطة الشهرية",
      price: 99,
      period: "شهرياً",
      features: [
        "ظهور في قائمة المهندسين المميزين",
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
      name: "الخطة السنوية",
      price: 799,
      originalPrice: 1188,
      period: "سنوياً",
      savings: "وفر 389 ر.س",
      features: [
        "جميع مزايا الخطة الشهرية",
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
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#d4a574]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-amber-50/30 py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center mb-6">
            <Crown className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-[#1a1a2e] mb-4">
            ترقية حسابك
          </h1>
          <p className="text-slate-600 max-w-2xl mx-auto">
            اختر الخطة المناسبة لك واحصل على مزايا إضافية لزيادة فرص الحصول على مشاريع جديدة
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
              } ${selectedPlan === plan.id ? "ring-2 ring-[#1a1a2e]" : ""}`}>
                {plan.popular && (
                  <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-center py-2 text-sm font-medium">
                    <Star className="w-4 h-4 inline ml-1" />
                    الأكثر شعبية
                  </div>
                )}
                <CardContent className={`p-8 ${plan.popular ? "pt-14" : ""}`}>
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
                      <span className="text-4xl font-bold text-[#1a1a2e]">{plan.price}</span>
                      <span className="text-slate-500">ر.س / {plan.period}</span>
                    </div>
                    {plan.originalPrice && (
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-slate-400 line-through">{plan.originalPrice} ر.س</span>
                        <Badge className="bg-green-100 text-green-700">{plan.savings}</Badge>
                      </div>
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
                    disabled={isProcessing}
                    className={`w-full py-6 text-lg ${
                      plan.popular 
                        ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:opacity-90"
                        : "bg-[#1a1a2e] text-white hover:bg-[#1a1a2e]/90"
                    }`}
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin ml-2" />
                        جاري المعالجة...
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
                <h3 className="text-2xl font-bold mb-2">ضمان استرداد الأموال</h3>
                <p className="text-slate-300">نقدم ضمان استرداد الأموال خلال 14 يوماً إذا لم تكن راضياً</p>
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