import React, { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Search, FileText, CheckCircle, Wallet,
  Upload, Users, Star, DollarSign
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function HowItWorksSection() {
  const ownerSteps = [
    {
      step: 1,
      icon: FileText,
      title: "اطرح مشروعك",
      description: "حدد التفاصيل والميزانية والموعد النهائي للمشروع",
      color: "from-blue-500 to-cyan-500"
    },
    {
      step: 2,
      icon: Users,
      title: "استقبل العروض",
      description: "قارن بين المهندسين والأسعار والمدة المقترحة",
      color: "from-purple-500 to-indigo-500"
    },
    {
      step: 3,
      icon: Wallet,
      title: "ادفع بأمان",
      description: "المبلغ يُحفظ في نظام الضمان حتى تستلم العمل كاملاً",
      color: "from-green-500 to-emerald-500"
    },
    {
      step: 4,
      icon: CheckCircle,
      title: "اعتمد واستلم",
      description: "راجع التصميم، اعتمده، واحصل على جميع الملفات",
      color: "from-amber-500 to-orange-500"
    }
  ];

  const engineerSteps = [
    {
      step: 1,
      icon: Upload,
      title: "أنشئ ملفك",
      description: "ارفع أعمالك السابقة وحدد تخصصاتك الرئيسية",
      color: "from-indigo-500 to-purple-500"
    },
    {
      step: 2,
      icon: Search,
      title: "تصفح المشاريع",
      description: "ابحث عن فرص عمل تناسب خبرتك وتخصصك",
      color: "from-blue-500 to-cyan-500"
    },
    {
      step: 3,
      icon: FileText,
      title: "قدّم عرضك",
      description: "حدد السعر والمدة الزمنية والبدء في العمل",
      color: "from-rose-500 to-pink-500"
    },
    {
      step: 4,
      icon: DollarSign,
      title: "استلم مستحقاتك",
      description: "بعد موافقة العميل، يُحول المبلغ لمحفظتك فوراً",
      color: "from-green-500 to-emerald-500"
    }
  ];

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <Badge className="bg-purple-100 text-purple-700 mb-4 px-4 py-2">
            كيف يعمل بيتلي
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold text-[#1a1a2e] mb-4">
            خطوات بسيطة نحو مشروعك
          </h2>
          <p className="text-slate-600 max-w-2xl mx-auto">
            سواء كنت صاحب مشروع أو مهندس محترف، العملية واضحة ومباشرة
          </p>
        </motion.div>

        <Tabs defaultValue="owner" className="max-w-5xl mx-auto">
          <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto mb-12">
            <TabsTrigger value="owner" className="text-base">
              لأصحاب المشاريع
            </TabsTrigger>
            <TabsTrigger value="engineer" className="text-base">
              للمهندسين
            </TabsTrigger>
          </TabsList>

          {/* Owner Flow */}
          <TabsContent value="owner">
            <div className="grid md:grid-cols-4 gap-6">
              {ownerSteps.map((step, index) => (
                <motion.div
                  key={step.step}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="border-0 shadow-lg hover:shadow-xl transition-all relative overflow-hidden group">
                    <div className={`absolute inset-0 bg-gradient-to-br ${step.color} opacity-0 group-hover:opacity-5 transition-opacity`} />
                    <CardContent className="pt-8 pb-6 text-center relative">
                      <div className="mb-4 relative">
                        <div className={`w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center shadow-lg`}>
                          <step.icon className="w-10 h-10 text-white" />
                        </div>
                        <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-white shadow-md flex items-center justify-center border-2 border-slate-100">
                          <span className="text-sm font-bold text-slate-700">{step.step}</span>
                        </div>
                      </div>
                      <h3 className="text-lg font-bold text-slate-900 mb-2">
                        {step.title}
                      </h3>
                      <p className="text-sm text-slate-600 leading-relaxed">
                        {step.description}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </TabsContent>

          {/* Engineer Flow */}
          <TabsContent value="engineer">
            <div className="grid md:grid-cols-4 gap-6">
              {engineerSteps.map((step, index) => (
                <motion.div
                  key={step.step}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="border-0 shadow-lg hover:shadow-xl transition-all relative overflow-hidden group">
                    <div className={`absolute inset-0 bg-gradient-to-br ${step.color} opacity-0 group-hover:opacity-5 transition-opacity`} />
                    <CardContent className="pt-8 pb-6 text-center relative">
                      <div className="mb-4 relative">
                        <div className={`w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center shadow-lg`}>
                          <step.icon className="w-10 h-10 text-white" />
                        </div>
                        <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-white shadow-md flex items-center justify-center border-2 border-slate-100">
                          <span className="text-sm font-bold text-slate-700">{step.step}</span>
                        </div>
                      </div>
                      <h3 className="text-lg font-bold text-slate-900 mb-2">
                        {step.title}
                      </h3>
                      <p className="text-sm text-slate-600 leading-relaxed">
                        {step.description}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </section>
  );
}