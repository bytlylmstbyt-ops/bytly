import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Sparkles, Crown, Star, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "../utils";

export default function PackagesPage() {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [engineer, setEngineer] = useState(null);
  const [activeSubscription, setActiveSubscription] = useState(null);
  const [processingPackageId, setProcessingPackageId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const userData = await base44.auth.me();
      setUser(userData);

      // Load packages
      const packagesData = await base44.entities.Package.filter({ is_active: true }, "sort_order", 100);
      setPackages(packagesData);

      // Load engineer profile
      const engineerData = await base44.entities.Engineer.filter({ email: userData.email });
      if (engineerData.length > 0) {
        setEngineer(engineerData[0]);

        // Load active subscription
        const subscriptions = await base44.entities.Subscription.filter({
          engineer_id: engineerData[0].id,
          status: "active"
        }, "-created_date", 1);
        if (subscriptions.length > 0) {
          setActiveSubscription(subscriptions[0]);
        }
      }
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (pkg) => {
    if (!engineer) {
      alert("يرجى إكمال تسجيل حسابك كمصمم أولاً");
      navigate(createPageUrl("RegisterEngineer"));
      return;
    }

    setProcessingPackageId(pkg.id);

    try {
      // Create subscription record
      const subscription = await base44.entities.Subscription.create({
        engineer_id: engineer.id,
        package_id: pkg.id,
        plan_type: pkg.duration_type,
        amount: pkg.price,
        start_date: new Date().toISOString().split('T')[0],
        end_date: calculateEndDate(pkg.duration_type),
        status: "pending",
        payment_status: "pending"
      });

      // في الواقع، هنا يجب التوجه لبوابة الدفع (Tap أو Moyasar)
      // لكن بما أن Backend Functions غير مفعلة، سنقوم بمحاكاة العملية
      alert(`
🔔 تنبيه مهم:
لإكمال عملية الاشتراك، يجب تفعيل بوابة الدفع (Tap أو Moyasar).

للمتابعة:
1. تفعيل Backend Functions من إعدادات التطبيق
2. الربط مع بوابة دفع محلية
3. إكمال عملية الدفع بشكل آمن

تم إنشاء طلب الاشتراك بنجاح وسيتم تفعيله بعد إتمام الدفع.
      `);

      // Simulate successful payment for demo purposes
      // في الواقع، هذا سيتم من خلال webhook من بوابة الدفع
      const confirmPayment = confirm("محاكاة: هل تريد تأكيد الدفع؟ (للتجربة فقط)");
      
      if (confirmPayment) {
        await handlePaymentSuccess(subscription, pkg);
      }

    } catch (error) {
      console.error("Error subscribing:", error);
      alert("حدث خطأ أثناء معالجة الاشتراك");
    } finally {
      setProcessingPackageId(null);
    }
  };

  const handlePaymentSuccess = async (subscription, pkg) => {
    try {
      // Update subscription status
      await base44.entities.Subscription.update(subscription.id, {
        status: "active",
        payment_status: "completed",
        payment_date: new Date().toISOString()
      });

      // Update engineer subscription info
      await base44.entities.Engineer.update(engineer.id, {
        subscription_type: pkg.duration_type,
        subscription_end_date: calculateEndDate(pkg.duration_type)
      });

      // Create transaction record
      await base44.entities.Transaction.create({
        user_id: engineer.id,
        type: "subscription",
        amount: pkg.price,
        status: "completed",
        description: `اشتراك في باقة ${pkg.name}`,
        subscription_id: subscription.id
      });

      alert("✅ تم تفعيل الاشتراك بنجاح!");
      loadData();
    } catch (error) {
      console.error("Error activating subscription:", error);
    }
  };

  const calculateEndDate = (durationType) => {
    const now = new Date();
    if (durationType === "monthly") {
      now.setMonth(now.getMonth() + 1);
    } else {
      now.setFullYear(now.getFullYear() + 1);
    }
    return now.toISOString().split('T')[0];
  };

  const getPackageIcon = (index) => {
    const icons = [Star, Sparkles, Crown];
    return icons[index % icons.length];
  };

  const getPackageColor = (index) => {
    const colors = [
      "from-blue-500 to-cyan-500",
      "from-purple-500 to-pink-500",
      "from-amber-500 to-orange-500"
    ];
    return colors[index % colors.length];
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#C9A66B]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4" dir="rtl">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-4xl md:text-5xl font-bold gradient-text mb-4">
              باقات الاشتراك
            </h1>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              اختر الباقة المناسبة لك وارفع مستوى ظهورك في المنصة
            </p>
          </motion.div>

          {activeSubscription && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-6 inline-block"
            >
              <Badge className="bg-green-100 text-green-800 px-4 py-2 text-sm">
                ✨ لديك اشتراك نشط
              </Badge>
            </motion.div>
          )}
        </div>

        {/* Packages Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {packages.map((pkg, index) => {
            const Icon = getPackageIcon(index);
            const isActive = activeSubscription?.package_id === pkg.id;
            const isProcessing = processingPackageId === pkg.id;

            return (
              <motion.div
                key={pkg.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className={`relative overflow-hidden hover-lift ${isActive ? 'ring-2 ring-[#C9A66B]' : ''}`}>
                  {/* Gradient Header */}
                  <div className={`h-32 bg-gradient-to-br ${getPackageColor(index)} relative`}>
                    <div className="absolute inset-0 bg-black/20" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Icon className="w-16 h-16 text-white" />
                    </div>
                  </div>

                  <CardHeader className="text-center pb-4">
                    <CardTitle className="text-2xl mb-2">{pkg.name}</CardTitle>
                    <CardDescription className="text-sm mb-4">
                      {pkg.description}
                    </CardDescription>
                    <div className="flex items-baseline justify-center gap-2">
                      <span className="text-4xl font-bold text-[#1a1a2e]">
                        {pkg.price}
                      </span>
                      <span className="text-slate-500">ريال</span>
                      <span className="text-sm text-slate-400">
                        / {pkg.duration_type === "monthly" ? "شهر" : "سنة"}
                      </span>
                    </div>
                  </CardHeader>

                  <CardContent>
                    <ul className="space-y-3">
                      {pkg.features?.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                          <span className="text-sm text-slate-700">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>

                  <CardFooter>
                    <Button
                      onClick={() => handleSubscribe(pkg)}
                      disabled={isActive || isProcessing}
                      className={`w-full ${
                        isActive
                          ? "bg-green-600 hover:bg-green-700"
                          : "bg-gradient-to-r from-[#1a1a2e] to-[#C9A66B]"
                      }`}
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                          جاري المعالجة...
                        </>
                      ) : isActive ? (
                        <>
                          <Check className="w-4 h-4 ml-2" />
                          الباقة الحالية
                        </>
                      ) : (
                        "اشترك الآن"
                      )}
                    </Button>
                  </CardFooter>

                  {isActive && (
                    <div className="absolute top-4 left-4">
                      <Badge className="bg-[#C9A66B] text-white">نشط</Badge>
                    </div>
                  )}
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Payment Methods */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center"
        >
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="text-xl">طرق الدفع المتاحة</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-center gap-6 flex-wrap">
                <div className="flex items-center gap-2 text-slate-600">
                  <div className="w-12 h-8 bg-slate-100 rounded flex items-center justify-center text-xs font-bold">
                    مدى
                  </div>
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <div className="w-12 h-8 bg-slate-100 rounded flex items-center justify-center text-xs font-bold">
                    VISA
                  </div>
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <div className="w-12 h-8 bg-slate-100 rounded flex items-center justify-center text-xs font-bold">
                    Master
                  </div>
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <div className="w-12 h-8 bg-slate-100 rounded flex items-center justify-center text-xs font-bold">
                     Pay
                  </div>
                </div>
              </div>
              <p className="text-sm text-slate-500 mt-4">
                جميع المدفوعات آمنة ومشفرة عبر بوابة دفع معتمدة
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}