import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import { 
  Palette, Building2, PenTool, Briefcase, 
  ArrowLeft, CheckCircle, Star, Scale
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function RegisterChoice() {
  const options = [
    {
      id: "investor",
      icon: Building2,
      title: "مستثمر / مطور عقاري",
      description: "أدر محفظة مشاريعك العقارية من لوحة تحكم واحدة",
      features: ["نظام إشارات ضوئية للمشاريع", "إدارة مركزية للمدفوعات", "مستندات موحدة"],
      color: "from-purple-600 to-indigo-600",
      link: createPageUrl("RegisterClient") + "?type=investor",
      featured: true
    },
    {
      id: "client",
      icon: Briefcase,
      title: "صاحب منزل",
      description: "ابحث عن أفضل المصممين لمشروعك السكني",
      features: ["طرح مشاريع مجاناً", "مقارنة العروض", "دفع آمن"],
      color: "from-amber-500 to-orange-500",
      link: createPageUrl("RegisterClient") + "?type=individual"
    },
    {
      id: "engineer",
      icon: Building2,
      title: "مهندس مستقل",
      description: "انضم كمهندس معتمد واعرض أعمالك للعملاء",
      features: ["عرض Portfolio احترافي", "استقبال طلبات المشاريع", "محفظة إلكترونية"],
      color: "from-blue-500 to-cyan-500",
      link: createPageUrl("RegisterEngineer") + "?type=engineer"
    },
    {
      id: "firm",
      icon: Building2,
      title: "شركة استشارية",
      description: "سجل شركتك الاستشارية للمشاريع الكبرى",
      features: ["إدارة الفريق", "اعتماد المخططات", "عضوية مميزة"],
      color: "from-teal-600 to-cyan-600",
      link: createPageUrl("RegisterFirm")
    },
    {
      id: "legal",
      icon: Scale,
      title: "مستشار قانوني",
      description: "انضم لحماية حقوق المصممين والعملاء",
      features: ["صياغة العقود", "حل النزاعات", "حماية الملكية"],
      color: "from-slate-600 to-gray-700",
      link: createPageUrl("RegisterLegalConsultant")
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-amber-50/30 py-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-3xl md:text-4xl font-bold text-[#1a1a2e] mb-4">
            انضم لـ بيتلي
          </h1>
          <p className="text-slate-600 max-w-2xl mx-auto">
            اختر نوع حسابك وابدأ رحلتك معنا
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {options.map((option, index) => (
            <motion.div
              key={option.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={option.featured ? "md:col-span-2 lg:col-span-1" : ""}
            >
              <Card className={`h-full hover-lift cursor-pointer shadow-lg hover:shadow-xl transition-all group ${
                option.featured ? "border-2 border-purple-400 bg-gradient-to-br from-purple-50 to-indigo-50" : "border-0"
              }`}>
                <CardContent className="p-6 h-full flex flex-col">
                  {option.featured && (
                    <div className="mb-3">
                      <Star className="w-5 h-5 text-purple-600 fill-purple-600" />
                    </div>
                  )}
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${option.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                    <option.icon className="w-8 h-8 text-white" />
                  </div>
                  
                  <h3 className="text-xl font-bold text-[#1a1a2e] mb-2">
                    {option.title}
                  </h3>
                  <p className="text-slate-600 text-sm mb-6">
                    {option.description}
                  </p>

                  <ul className="space-y-2 mb-6 flex-1">
                    {option.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-slate-600">
                        <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>

                  <Link to={option.link}>
                    <Button className={`w-full bg-gradient-to-r ${option.color} text-white hover:opacity-90`}>
                      اختر هذا الحساب
                      <ArrowLeft className="w-4 h-4 mr-2" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center mt-8"
        >
          <p className="text-slate-500">
            لديك حساب بالفعل؟{" "}
            <button 
              onClick={() => window.base44?.auth?.redirectToLogin()}
              className="text-[#d4a574] font-medium hover:underline"
            >
              تسجيل الدخول
            </button>
          </p>
        </motion.div>
      </div>
    </div>
  );
}