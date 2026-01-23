import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import { 
  Palette, Building2, PenTool, Briefcase, 
  ArrowLeft, CheckCircle, Star
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function RegisterChoice() {
  const options = [
    {
      id: "engineer",
      icon: Building2,
      title: "مهندس تصميم داخلي / معماري",
      description: "انضم كمهندس معتمد واعرض أعمالك للعملاء",
      features: ["عرض Portfolio احترافي", "استقبال طلبات المشاريع", "محفظة إلكترونية"],
      color: "from-blue-500 to-cyan-500",
      link: createPageUrl("RegisterEngineer") + "?type=engineer"
    },
    {
      id: "painter",
      icon: PenTool,
      title: "رسام هندسي",
      description: "قدم خدمات الرسم الهندسي والمخططات",
      features: ["عرض أعمال الرسم", "التعاون مع المهندسين", "مشاريع متنوعة"],
      color: "from-violet-500 to-purple-500",
      link: createPageUrl("RegisterEngineer") + "?type=painter"
    },
    {
      id: "client",
      icon: Briefcase,
      title: "صاحب مشروع",
      description: "ابحث عن أفضل المصممين لمشروعك",
      features: ["طرح مشاريع مجاناً", "مقارنة العروض", "دفع آمن"],
      color: "from-amber-500 to-orange-500",
      link: createPageUrl("RegisterClient")
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
            انضم إلى بيتلي
          </h1>
          <p className="text-slate-600 max-w-2xl mx-auto">
            اختر نوع حسابك وابدأ رحلتك معنا
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {options.map((option, index) => (
            <motion.div
              key={option.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="h-full hover-lift cursor-pointer border-0 shadow-lg hover:shadow-xl transition-all group">
                <CardContent className="p-6 h-full flex flex-col">
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
                        <CheckCircle className="w-4 h-4 text-green-500" />
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