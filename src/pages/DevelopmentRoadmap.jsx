import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle, Clock, AlertCircle, Sparkles, 
  Users, ShoppingBag, Wallet, DollarSign, 
  Bell, BarChart3, Zap
} from "lucide-react";
import { motion } from "framer-motion";

export default function DevelopmentRoadmap() {
  const roadmapItems = [
    {
      section: "واجهة المستخدم",
      feature: "زر انضمام موحد",
      details: 'تحويل "انضم كمهندس" إلى "انضم لـ بيتلي" بفتح قائمة الخيارات.',
      status: "completed",
      icon: Users,
      color: "green"
    },
    {
      section: "أنواع الحسابات",
      feature: "تعدد الأدوار",
      details: "(مستثمر/مطور، صاحب منزل، مهندس مستقل، شركة استشارية، مستشار قانوني).",
      status: "completed",
      icon: Users,
      color: "green"
    },
    {
      section: "سوق المشاريع",
      feature: "المشاريع العامة والمباشرة",
      details: "نظام عطاءات (Bidding) + نظام توظيف مباشر من الـ Portfolio.",
      status: "in_progress",
      icon: ShoppingBag,
      color: "yellow"
    },
    {
      section: "المتجر الرقمي",
      feature: "التصاميم الجاهزة",
      details: 'ميزة "شراء وتحميل فوراً" للمخططات الجاهزة مع دفع آلي.',
      status: "new",
      icon: Sparkles,
      color: "blue"
    },
    {
      section: "المسارات",
      feature: "مسار (A) الإنشائي",
      details: "ربط إلزامي مع الشركة الاستشارية للتعميد قبل تحويل المال.",
      status: "in_progress",
      icon: AlertCircle,
      color: "yellow"
    },
    {
      section: "النظام المالي",
      feature: "التقسيم الآلي (Split)",
      details: "خصم نسبة المنصة (15-25%) آلياً عند اعتماد كل مرحلة.",
      status: "needs_programming",
      icon: DollarSign,
      color: "orange"
    },
    {
      section: "التنبيهات",
      feature: "إشعارات Push",
      details: "تنبيهات لحظية للجوال عند (التعميد، طلب تعديل، رسالة جديدة).",
      status: "in_progress",
      icon: Bell,
      color: "yellow"
    },
    {
      section: "لوحة المستثمر",
      feature: "إدارة المحفظة",
      details: "شاشة واحدة لمتابعة جميع المشاريع ونسب إنجازها (Portfolio Tracker).",
      status: "new",
      icon: BarChart3,
      color: "blue"
    }
  ];

  const statusConfig = {
    completed: {
      label: "تم التأسيس",
      icon: CheckCircle,
      badge: "bg-green-100 text-green-700 border-green-300",
      emoji: "✅"
    },
    in_progress: {
      label: "قيد التنفيذ",
      icon: Clock,
      badge: "bg-yellow-100 text-yellow-700 border-yellow-300",
      emoji: "🔄"
    },
    needs_programming: {
      label: "يتطلب برمجة",
      icon: Zap,
      badge: "bg-orange-100 text-orange-700 border-orange-300",
      emoji: "🔔"
    },
    new: {
      label: "إضافة جديدة",
      icon: Sparkles,
      badge: "bg-blue-100 text-blue-700 border-blue-300",
      emoji: "🆕"
    }
  };

  const getSectionColor = (section) => {
    const colors = {
      "واجهة المستخدم": "from-purple-500 to-indigo-500",
      "أنواع الحسابات": "from-blue-500 to-cyan-500",
      "سوق المشاريع": "from-amber-500 to-orange-500",
      "المتجر الرقمي": "from-green-500 to-emerald-500",
      "المسارات": "from-rose-500 to-pink-500",
      "النظام المالي": "from-yellow-500 to-amber-500",
      "التنبيهات": "from-red-500 to-orange-500",
      "لوحة المستثمر": "from-indigo-600 to-purple-600"
    };
    return colors[section] || "from-slate-500 to-gray-500";
  };

  const stats = [
    { label: "ميزات مكتملة", value: roadmapItems.filter(i => i.status === "completed").length, color: "text-green-600" },
    { label: "قيد التطوير", value: roadmapItems.filter(i => i.status === "in_progress").length, color: "text-yellow-600" },
    { label: "ميزات جديدة", value: roadmapItems.filter(i => i.status === "new").length, color: "text-blue-600" },
    { label: "إجمالي المراحل", value: roadmapItems.length, color: "text-slate-700" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 py-8" dir="rtl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center">
              <BarChart3 className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold gradient-text">
                خارطة الطريق التطويرية
              </h1>
              <p className="text-slate-600">
                تحديثات هيكلية ونظام الربحية - منصة بيتلي
              </p>
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
                <Card className="border-0 shadow-md">
                  <CardContent className="pt-6 text-center">
                    <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
                    <p className="text-sm text-slate-600 mt-1">{stat.label}</p>
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
          <Card className="border-0 shadow-xl">
            <CardHeader className="bg-gradient-to-r from-slate-50 to-indigo-50 border-b">
              <CardTitle className="text-xl">جدول التنفيذ</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-100 border-b-2">
                    <tr>
                      <th className="px-6 py-4 text-right text-sm font-semibold text-slate-700">القسم</th>
                      <th className="px-6 py-4 text-right text-sm font-semibold text-slate-700">الميزة / الوظيفة</th>
                      <th className="px-6 py-4 text-right text-sm font-semibold text-slate-700">التفاصيل التقنية (للتطبيق)</th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-slate-700">الحالة</th>
                    </tr>
                  </thead>
                  <tbody>
                    {roadmapItems.map((item, idx) => {
                      const config = statusConfig[item.status];
                      const Icon = item.icon;

                      return (
                        <motion.tr
                          key={idx}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.3 + idx * 0.05 }}
                          className="border-b hover:bg-slate-50/50 transition-colors"
                        >
                          {/* Section */}
                          <td className="px-6 py-5">
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${getSectionColor(item.section)} flex items-center justify-center flex-shrink-0`}>
                                <Icon className="w-5 h-5 text-white" />
                              </div>
                              <span className="font-semibold text-slate-800">{item.section}</span>
                            </div>
                          </td>

                          {/* Feature */}
                          <td className="px-6 py-5">
                            <p className="font-medium text-slate-900">{item.feature}</p>
                          </td>

                          {/* Details */}
                          <td className="px-6 py-5">
                            <p className="text-sm text-slate-600 leading-relaxed max-w-md">
                              {item.details}
                            </p>
                          </td>

                          {/* Status */}
                          <td className="px-6 py-5">
                            <div className="flex justify-center">
                              <Badge className={`${config.badge} px-4 py-2 text-sm border flex items-center gap-2`}>
                                <span className="text-lg">{config.emoji}</span>
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
          <Card className="border-0 shadow-lg bg-gradient-to-r from-slate-50 to-amber-50">
            <CardContent className="pt-6">
              <h3 className="font-semibold text-slate-900 mb-4">دليل الحالات:</h3>
              <div className="grid md:grid-cols-4 gap-4">
                {Object.entries(statusConfig).map(([key, config]) => (
                  <div key={key} className="flex items-center gap-2">
                    <span className="text-2xl">{config.emoji}</span>
                    <span className="text-sm text-slate-600">{config.label}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Implementation Notes */}
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
                تم تنفيذه بنجاح
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-slate-700">
                <li>✓ زر "انضم لـ بيتلي" في الصفحة الرئيسية والـ Layout</li>
                <li>✓ صفحة اختيار نوع الحساب محدثة مع 5 خيارات</li>
                <li>✓ لوحة تحكم المستثمر بنظام الإشارات الضوئية</li>
                <li>✓ نظام عمولات آلي (15% مشاريع، 25% تصاميم)</li>
                <li>✓ متجر التصاميم الجاهزة مع تحميل فوري</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-2 border-blue-200 bg-blue-50/50">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2 text-blue-800">
                <Zap className="w-5 h-5" />
                قيد التطوير
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-slate-700">
                <li>🔄 نظام التنبيهات الذكية (Push Notifications)</li>
                <li>🔄 ربط إلزامي مع الشركات الاستشارية للمسار الإنشائي</li>
                <li>🔄 تحسين نظام العطاءات (Bidding)</li>
                <li>🔔 تفعيل خصم العمولة تلقائياً في كل معاملة</li>
              </ul>
            </CardContent>
          </Card>
        </motion.div>

        {/* Technical Notes */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
          className="mt-8"
        >
          <Card className="border-2 border-purple-200 bg-purple-50/30">
            <CardHeader>
              <CardTitle className="text-lg">ملاحظات تقنية للفريق:</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm text-slate-700">
                <div className="p-4 bg-white rounded-lg border border-purple-200">
                  <p className="font-semibold text-purple-900 mb-2">🔐 نظام الدفع الآمن:</p>
                  <p>جميع المدفوعات تمر عبر Stripe مع دعم مدى، Visa، Apple Pay، و Google Pay. العمولة تُخصم آلياً من كل معاملة قبل تحويل المبالغ للمهندسين.</p>
                </div>
                
                <div className="p-4 bg-white rounded-lg border border-purple-200">
                  <p className="font-semibold text-purple-900 mb-2">💰 نظام المحافظ الإلكترونية:</p>
                  <p>كل مستخدم (عميل/مهندس/شركة) لديه محفظة تعرض: الرصيد الكلي، الرصيد المعلق (في الضمان)، والرصيد المتاح للسحب.</p>
                </div>

                <div className="p-4 bg-white rounded-lg border border-purple-200">
                  <p className="font-semibold text-purple-900 mb-2">📊 لوحة المستثمر:</p>
                  <p>تم تطوير واجهة خاصة للمستثمرين تعرض جميع المشاريع في شاشة واحدة مع نظام الإشارات الضوئية (🟢 يسير بخطة، 🟡 يحتاج انتباه، 🔴 تأخير) + إدارة مركزية للدفعات والمستندات.</p>
                </div>

                <div className="p-4 bg-white rounded-lg border border-purple-200">
                  <p className="font-semibold text-purple-900 mb-2">🛒 متجر التصاميم الجاهزة:</p>
                  <p>نظام شراء فوري مع تحميل مباشر للملفات بعد الدفع. عمولة المنصة 25% تُخصم تلقائياً، والبائع يستلم 75% في محفظته فوراً.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Footer Note */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="mt-8 text-center"
        >
          <Card className="border-0 bg-gradient-to-r from-amber-100 to-orange-100">
            <CardContent className="py-6">
              <p className="text-sm text-slate-700">
                📋 <strong>للمستثمرين ومنشآت:</strong> هذا الجدول يوضح التقدم التقني الفعلي للمنصة. 
                جميع الميزات المكتملة (✅) جاهزة للاستخدام الفوري، والميزات قيد التطوير (🔄) سيتم إطلاقها تدريجياً.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}