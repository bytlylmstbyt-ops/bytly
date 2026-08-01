import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle, Clock, Sparkles,
  Users, ShoppingBag, DollarSign,
  Bell, BarChart3, FileSignature, Boxes, Bot, Megaphone, ShieldCheck
} from "lucide-react";
import { motion } from "framer-motion";

export default function DevelopmentRoadmap() {
  const roadmapItems = [
    {
      section: "واجهة المستخدم",
      feature: "زر انضمام موحد",
      details: 'تحويل "انضم كمهندس" إلى "انضم لـ بيتلي" بفتح قائمة الخيارات.',
      status: "completed",
      icon: Users
    },
    {
      section: "أنواع الحسابات",
      feature: "تعدد الأدوار",
      details: "(عميل، مهندس مستقل، شركة استشارية، مقاول، مورد، مسّاح، مستشار قانوني، مستثمر).",
      status: "completed",
      icon: Users
    },
    {
      section: "سوق المشاريع",
      feature: "العطاءات والتوظيف المباشر",
      details: "نظام عطاءات (Bidding) + نظام توظيف مباشر من الـ Portfolio مع مقارنة العروض.",
      status: "completed",
      icon: ShoppingBag
    },
    {
      section: "المتجر الرقمي",
      feature: "التصاميم الجاهزة",
      details: 'ميزة "شراء وتحميل فوراً" للمخططات الجاهزة مع دفع آلي وعمولة 25%.',
      status: "completed",
      icon: ShoppingBag
    },
    {
      section: "المسارات الإنشائية",
      feature: "المراجعة الفنية المعتمدة",
      details: "ربط إلزامي مع المستشار الفني وكيان TechnicalReview للتعميد قبل تحرير الدفعات.",
      status: "completed",
      icon: ShieldCheck
    },
    {
      section: "النظام المالي",
      feature: "الضمان والعمولة الآلية",
      details: "نظام Escrow مع خصم عمولة المنصة (15%) آلياً عند اعتماد كل مرحلة.",
      status: "completed",
      icon: DollarSign
    },
    {
      section: "العقود الإلكترونية",
      feature: "التوقيع والأرشفة",
      details: "عقود إلكترونية موقعة مع أرشفة في Google Drive وربط بتقويم جوجل.",
      status: "completed",
      icon: FileSignature
    },
    {
      section: "لوحة المستثمر",
      feature: "إدارة المحفظة",
      details: "شاشة واحدة لمتابعة جميع المشاريع بنظام الإشارات الضوئية وإدارة الدفعات.",
      status: "completed",
      icon: BarChart3
    },
    {
      section: "تكامل BIM",
      feature: "نماذج Autodesk",
      details: "تكامل مع Autodesk Platform Services لاستيراد ومزامنة نماذج BIM360.",
      status: "in_progress",
      icon: Boxes
    },
    {
      section: "الذكاء الاصطناعي",
      feature: "مساعد بيتلي الذكي",
      details: "وكيل ذكي لتحليل المخاطر، اقتراح المهندسين، وتلخيص المشاريع.",
      status: "in_progress",
      icon: Bot
    },
    {
      section: "التنبيهات",
      feature: "الإشعارات اللحظية",
      details: "تنبيهات داخل التطبيق وبريدية عند (التعميد، طلب تعديل، رسالة جديدة).",
      status: "in_progress",
      icon: Bell
    },
    {
      section: "نظام الإعلانات",
      feature: "الإعلانات الذكية",
      details: "بوابة للمعلنين مع إعلانات سياقية وتتبع النقرات وتقارير الأداء.",
      status: "new",
      icon: Megaphone
    }
  ];

  const statusConfig = {
    completed: {
      label: "مكتمل",
      icon: CheckCircle,
      badge: "bg-green-100 text-green-700 border-green-300"
    },
    in_progress: {
      label: "قيد التطوير",
      icon: Clock,
      badge: "bg-amber-100 text-amber-700 border-amber-300"
    },
    new: {
      label: "إضافة جديدة",
      icon: Sparkles,
      badge: "bg-blue-100 text-blue-700 border-blue-300"
    }
  };

  // ألوان أيقونات الأقسام ضمن لوحة العلامة (ذهبي/بني/كريمي)
  const getSectionColor = (section) => {
    const colors = {
      "واجهة المستخدم": "from-[#6B5D4F] to-[#A89178]",
      "أنواع الحسابات": "from-[#4A3F35] to-[#6B5D4F]",
      "سوق المشاريع": "from-[#A89178] to-[#C9A66B]",
      "المتجر الرقمي": "from-[#C9A66B] to-[#E5D4B8]",
      "المسارات الإنشائية": "from-[#8C7256] to-[#A89178]",
      "النظام المالي": "from-[#4A3F35] to-[#8C7256]",
      "العقود الإلكترونية": "from-[#6B5D4F] to-[#C9A66B]",
      "لوحة المستثمر": "from-[#1a1a2e] to-[#4A3F35]",
      "تكامل BIM": "from-[#A89178] to-[#6B5D4F]",
      "الذكاء الاصطناعي": "from-[#8C7256] to-[#C9A66B]",
      "التنبيهات": "from-[#C9A66B] to-[#A89178]",
      "نظام الإعلانات": "from-[#6B5D4F] to-[#4A3F35]"
    };
    return colors[section] || "from-[#6B5D4F] to-[#A89178]";
  };

  const completedCount = roadmapItems.filter(i => i.status === "completed").length;
  const inProgressCount = roadmapItems.filter(i => i.status === "in_progress").length;
  const newCount = roadmapItems.filter(i => i.status === "new").length;

  const stats = [
    { label: "إجمالي المراحل", value: roadmapItems.length, color: "text-[#4A3F35]" },
    { label: "ميزات مكتملة", value: completedCount, color: "text-green-600" },
    { label: "قيد التطوير", value: inProgressCount, color: "text-[#C9A66B]" },
    { label: "إضافات جديدة", value: newCount, color: "text-blue-600" }
  ];

  const completionPercent = Math.round((completedCount / roadmapItems.length) * 100);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F5F0E8] via-white to-[#FBF8F3] py-8" dir="rtl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#6B5D4F] to-[#C9A66B] flex items-center justify-center shadow-md">
              <BarChart3 className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold gradient-text">
                خارطة الطريق التطويرية
              </h1>
              <p className="text-[#8C7256]">
                تحديثات هيكلية ونظام الربحية — منصة بيتلي
              </p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-4 p-4 rounded-xl bg-white border border-[#E5D4B8]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-[#4A3F35]">نسبة الإنجاز الكلية</span>
              <span className="text-sm font-bold text-[#6B5D4F]">{completionPercent}%</span>
            </div>
            <div className="h-2.5 rounded-full bg-[#F5F0E8] overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${completionPercent}%` }}
                transition={{ delay: 0.4, duration: 0.8 }}
                className="h-full rounded-full bg-gradient-to-l from-[#C9A66B] to-[#6B5D4F]"
              />
            </div>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            {stats.map((stat, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + idx * 0.05 }}
              >
                <Card className="border border-[#E5D4B8] shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="pt-6 text-center">
                    <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
                    <p className="text-sm text-[#8C7256] mt-1">{stat.label}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Roadmap Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border border-[#E5D4B8] shadow-lg overflow-hidden">
            <CardHeader className="bg-gradient-to-l from-[#FBF8F3] to-[#F5F0E8] border-b border-[#E5D4B8]">
              <CardTitle className="text-xl text-[#4A3F35]">جدول التنفيذ</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-[#FBF8F3] border-b-2 border-[#E5D4B8]">
                    <tr>
                      <th className="px-6 py-4 text-right text-sm font-semibold text-[#4A3F35]">القسم</th>
                      <th className="px-6 py-4 text-right text-sm font-semibold text-[#4A3F35]">الميزة / الوظيفة</th>
                      <th className="px-6 py-4 text-right text-sm font-semibold text-[#4A3F35]">التفاصيل التقنية (للتطبيق)</th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-[#4A3F35]">الحالة</th>
                    </tr>
                  </thead>
                  <tbody>
                    {roadmapItems.map((item, idx) => {
                      const config = statusConfig[item.status];
                      const Icon = item.icon;
                      const StatusIcon = config.icon;

                      return (
                        <motion.tr
                          key={idx}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.3 + idx * 0.04 }}
                          className="border-b border-[#F0E8D8] hover:bg-[#FBF8F3] transition-colors"
                        >
                          {/* Section */}
                          <td className="px-6 py-5">
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${getSectionColor(item.section)} flex items-center justify-center flex-shrink-0`}>
                                <Icon className="w-5 h-5 text-white" />
                              </div>
                              <span className="font-semibold text-[#4A3F35]">{item.section}</span>
                            </div>
                          </td>

                          {/* Feature */}
                          <td className="px-6 py-5">
                            <p className="font-medium text-[#1a1a2e]">{item.feature}</p>
                          </td>

                          {/* Details */}
                          <td className="px-6 py-5">
                            <p className="text-sm text-[#6B5D4F] leading-relaxed max-w-md">
                              {item.details}
                            </p>
                          </td>

                          {/* Status */}
                          <td className="px-6 py-5">
                            <div className="flex justify-center">
                              <Badge className={`${config.badge} px-4 py-2 text-sm border flex items-center gap-2`}>
                                <StatusIcon className="w-4 h-4" />
                                <span>{config.label}</span>
                              </Badge>
                            </div>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Legend */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="mt-8"
        >
          <Card className="border border-[#E5D4B8] shadow-sm bg-gradient-to-l from-[#FBF8F3] to-[#F5F0E8]">
            <CardContent className="pt-6">
              <h3 className="font-semibold text-[#4A3F35] mb-4">دليل الحالات:</h3>
              <div className="grid md:grid-cols-3 gap-4">
                {Object.entries(statusConfig).map(([key, config]) => {
                  const Icon = config.icon;
                  return (
                    <div key={key} className="flex items-center gap-2">
                      <Badge className={`${config.badge} px-3 py-1.5 border flex items-center gap-2`}>
                        <Icon className="w-4 h-4" />
                        <span>{config.label}</span>
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Summary Notes */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          className="mt-8 grid md:grid-cols-2 gap-6"
        >
          <Card className="border-2 border-green-200 bg-green-50/50">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2 text-green-800">
                <CheckCircle className="w-5 h-5" />
                مكتمل وجاهز للاستخدام
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-slate-700">
                <li>✓ زر "انضم لـ بيتلي" الموحد في الواجهة الرئيسية</li>
                <li>✓ 8 أنواع حسابات مع صفحات تسجيل مخصصة لكل نوع</li>
                <li>✓ سوق المشاريع بنظام العطاءات والتوظيف المباشر</li>
                <li>✓ متجر التصاميم الجاهزة مع تحميل فوري وعمولة آلية</li>
                <li>✓ نظام المراجعة الفنية والمستشار المعتمد</li>
                <li>✓ نظام الضمان (Escrow) وخصم العمولة الآلي</li>
                <li>✓ العقود الإلكترونية الموقعة مع الأرشفة السحابية</li>
                <li>✓ لوحة المستثمر بنظام الإشارات الضوئية</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-2 border-amber-200 bg-amber-50/50">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2 text-amber-800">
                <Clock className="w-5 h-5" />
                قيد التطوير حالياً
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-slate-700">
                <li>🔄 تكامل BIM مع Autodesk Platform Services</li>
                <li>🔄 مساعد بيتلي الذكي (تحليل المخاطر، اقتراح المهندسين)</li>
                <li>🔄 نظام الإشعارات اللحظية (Push) للجوال</li>
                <li>🆕 بوابة الإعلانات الذكية للمعلنين</li>
              </ul>
            </CardContent>
          </Card>
        </motion.div>

        {/* Footer Note */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="mt-8 text-center"
        >
          <Card className="border border-[#E5D4B8] bg-gradient-to-l from-[#FBF8F3] to-[#F5F0E8]">
            <CardContent className="py-6">
              <p className="text-sm text-[#6B5D4F]">
                📋 <strong className="text-[#4A3F35]">للمستثمرين ومنشآت:</strong> هذا الجدول يوضح التقدم التقني الفعلي للمنصة.
                جميع الميزات المكتملة جاهزة للاستخدام الفوري، والميزات قيد التطوير سيتم إطلاقها تدريجياً.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}