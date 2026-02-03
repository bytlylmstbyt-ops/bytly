import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Shield, Users, BarChart3, ShoppingBag,
  CheckCircle, Star, Lock, Zap
} from "lucide-react";

export default function CorePillarsSection() {
  const pillars = [
    {
      icon: Shield,
      title: "الأمان المالي",
      subtitle: "Financial Safety",
      description: "نظام ضمان (Escrow) يحمي أموالك حتى استلام العمل كاملاً. دفع آمن ومشفر عبر بوابات موثوقة.",
      features: [
        "حماية كاملة للمدفوعات",
        "لا تحويل قبل الموافقة",
        "استرداد في حالة النزاع"
      ],
      color: "from-green-500 to-emerald-500",
      stats: "98% رضا عن الأمان"
    },
    {
      icon: Users,
      title: "خبراء معتمدون",
      subtitle: "Expert Access",
      description: "مئات المهندسين والمصممين المعتمدين بشهادات رسمية ومعرض أعمال احترافي.",
      features: [
        "توثيق رسمي لكل مهندس",
        "معرض أعمال شامل",
        "تقييمات حقيقية من عملاء"
      ],
      color: "from-blue-500 to-cyan-500",
      stats: "1000+ مهندس معتمد"
    },
    {
      icon: BarChart3,
      title: "سهولة المتابعة",
      subtitle: "Easy Tracking",
      description: "لوحة تحكم شاملة لمتابعة مشاريعك بنظام الإشارات الضوئية والمراحل التفصيلية.",
      features: [
        "نظام إشارات ضوئية للمشاريع",
        "تتبع المراحل لحظياً",
        "تنبيهات ذكية ومباشرة"
      ],
      color: "from-purple-500 to-indigo-500",
      stats: "متابعة 24/7"
    },
    {
      icon: ShoppingBag,
      title: "تصاميم جاهزة",
      subtitle: "Ready Designs",
      description: "متجر تصاميم معمارية جاهزة للشراء والتحميل الفوري بأسعار تنافسية.",
      features: [
        "تحميل فوري بعد الدفع",
        "مخططات معتمدة ومختومة",
        "إمكانية طلب تعديلات"
      ],
      color: "from-amber-500 to-orange-500",
      stats: "500+ تصميم جاهز"
    }
  ];

  return (
    <section className="py-20 bg-gradient-to-br from-slate-50 via-white to-purple-50/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <Badge className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white mb-4 px-4 py-2">
            عن بيتلي
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold text-[#1a1a2e] mb-4">
            أركان بيتلي الأساسية
          </h2>
          <p className="text-slate-600 max-w-2xl mx-auto">
            بُنيت بيتلي على أسس راسخة لضمان تجربة استثنائية لجميع المستخدمين
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {pillars.map((pillar, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="h-full border-0 shadow-lg hover:shadow-2xl transition-all group hover:-translate-y-1">
                <CardContent className="p-6">
                  {/* Icon */}
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${pillar.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg`}>
                    <pillar.icon className="w-8 h-8 text-white" />
                  </div>

                  {/* Title */}
                  <h3 className="text-xl font-bold text-slate-900 mb-1">
                    {pillar.title}
                  </h3>
                  <p className="text-xs text-slate-500 mb-4 font-medium">
                    {pillar.subtitle}
                  </p>

                  {/* Description */}
                  <p className="text-sm text-slate-600 leading-relaxed mb-4">
                    {pillar.description}
                  </p>

                  {/* Features */}
                  <ul className="space-y-2 mb-4">
                    {pillar.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-xs text-slate-600">
                        <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Stats Badge */}
                  <div className={`mt-auto pt-4 border-t`}>
                    <Badge variant="outline" className="w-full justify-center py-2 text-xs font-semibold">
                      <Star className="w-3 h-3 ml-1 fill-amber-400 text-amber-400" />
                      {pillar.stats}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Trust Indicators */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-16 grid md:grid-cols-3 gap-6"
        >
          <Card className="border-2 border-green-200 bg-green-50/50">
            <CardContent className="pt-6 text-center">
              <Lock className="w-8 h-8 text-green-600 mx-auto mb-3" />
              <p className="text-2xl font-bold text-green-900 mb-1">100%</p>
              <p className="text-sm text-slate-600">دفع آمن ومشفر</p>
            </CardContent>
          </Card>

          <Card className="border-2 border-blue-200 bg-blue-50/50">
            <CardContent className="pt-6 text-center">
              <CheckCircle className="w-8 h-8 text-blue-600 mx-auto mb-3" />
              <p className="text-2xl font-bold text-blue-900 mb-1">5000+</p>
              <p className="text-sm text-slate-600">مشروع مكتمل</p>
            </CardContent>
          </Card>

          <Card className="border-2 border-purple-200 bg-purple-50/50">
            <CardContent className="pt-6 text-center">
              <Zap className="w-8 h-8 text-purple-600 mx-auto mb-3" />
              <p className="text-2xl font-bold text-purple-900 mb-1">24/7</p>
              <p className="text-sm text-slate-600">دعم فني متواصل</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </section>
  );
}