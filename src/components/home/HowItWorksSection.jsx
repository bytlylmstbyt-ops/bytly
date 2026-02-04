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
import { useLanguage } from "@/components/i18n/LanguageContext";

export default function HowItWorksSection() {
  const { t } = useLanguage();
  
  const ownerSteps = [
    {
      step: 1,
      icon: FileText,
      title: t('howItWorks.ownerSteps.step1.title'),
      description: t('howItWorks.ownerSteps.step1.description'),
      color: "from-blue-500 to-cyan-500"
    },
    {
      step: 2,
      icon: Users,
      title: t('howItWorks.ownerSteps.step2.title'),
      description: t('howItWorks.ownerSteps.step2.description'),
      color: "from-purple-500 to-indigo-500"
    },
    {
      step: 3,
      icon: Wallet,
      title: t('howItWorks.ownerSteps.step3.title'),
      description: t('howItWorks.ownerSteps.step3.description'),
      color: "from-green-500 to-emerald-500"
    },
    {
      step: 4,
      icon: CheckCircle,
      title: t('howItWorks.ownerSteps.step4.title'),
      description: t('howItWorks.ownerSteps.step4.description'),
      color: "from-amber-500 to-orange-500"
    }
  ];

  const engineerSteps = [
    {
      step: 1,
      icon: Upload,
      title: t('howItWorks.engineerSteps.step1.title'),
      description: t('howItWorks.engineerSteps.step1.description'),
      color: "from-indigo-500 to-purple-500"
    },
    {
      step: 2,
      icon: Search,
      title: t('howItWorks.engineerSteps.step2.title'),
      description: t('howItWorks.engineerSteps.step2.description'),
      color: "from-blue-500 to-cyan-500"
    },
    {
      step: 3,
      icon: FileText,
      title: t('howItWorks.engineerSteps.step3.title'),
      description: t('howItWorks.engineerSteps.step3.description'),
      color: "from-rose-500 to-pink-500"
    },
    {
      step: 4,
      icon: DollarSign,
      title: t('howItWorks.engineerSteps.step4.title'),
      description: t('howItWorks.engineerSteps.step4.description'),
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
            {t('howItWorks.badge')}
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold text-[#1a1a2e] mb-4">
            {t('howItWorks.title')}
          </h2>
          <p className="text-slate-600 max-w-2xl mx-auto">
            {t('howItWorks.subtitle')}
          </p>
        </motion.div>

        <Tabs defaultValue="owner" className="max-w-5xl mx-auto">
          <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto mb-12">
            <TabsTrigger value="owner" className="text-base">
              {t('howItWorks.forOwners')}
            </TabsTrigger>
            <TabsTrigger value="engineer" className="text-base">
              {t('howItWorks.forEngineers')}
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