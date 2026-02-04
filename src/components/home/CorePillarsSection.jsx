import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Shield, Users, BarChart3, ShoppingBag,
  CheckCircle, Star, Lock, Zap
} from "lucide-react";
import { useLanguage } from "@/components/i18n/LanguageContext";

export default function CorePillarsSection() {
  const { t } = useLanguage();
  
  const pillars = [
    {
      icon: Shield,
      title: t('corePillars.pillars.financial.title'),
      subtitle: t('corePillars.pillars.financial.subtitle'),
      description: t('corePillars.pillars.financial.description'),
      features: t('corePillars.pillars.financial.features'),
      color: "from-green-500 to-emerald-500",
      stats: t('corePillars.pillars.financial.stats')
    },
    {
      icon: Users,
      title: t('corePillars.pillars.experts.title'),
      subtitle: t('corePillars.pillars.experts.subtitle'),
      description: t('corePillars.pillars.experts.description'),
      features: t('corePillars.pillars.experts.features'),
      color: "from-blue-500 to-cyan-500",
      stats: t('corePillars.pillars.experts.stats')
    },
    {
      icon: BarChart3,
      title: t('corePillars.pillars.tracking.title'),
      subtitle: t('corePillars.pillars.tracking.subtitle'),
      description: t('corePillars.pillars.tracking.description'),
      features: t('corePillars.pillars.tracking.features'),
      color: "from-purple-500 to-indigo-500",
      stats: t('corePillars.pillars.tracking.stats')
    },
    {
      icon: ShoppingBag,
      title: t('corePillars.pillars.designs.title'),
      subtitle: t('corePillars.pillars.designs.subtitle'),
      description: t('corePillars.pillars.designs.description'),
      features: t('corePillars.pillars.designs.features'),
      color: "from-amber-500 to-orange-500",
      stats: t('corePillars.pillars.designs.stats')
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
            {t('corePillars.badge')}
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold text-[#1a1a2e] mb-4">
            {t('corePillars.title')}
          </h2>
          <p className="text-slate-600 max-w-2xl mx-auto">
            {t('corePillars.subtitle')}
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
              <p className="text-sm text-slate-600">{t('corePillars.trust.securePayment')}</p>
            </CardContent>
          </Card>

          <Card className="border-2 border-blue-200 bg-blue-50/50">
            <CardContent className="pt-6 text-center">
              <CheckCircle className="w-8 h-8 text-blue-600 mx-auto mb-3" />
              <p className="text-2xl font-bold text-blue-900 mb-1">5000+</p>
              <p className="text-sm text-slate-600">{t('corePillars.trust.completedProjects')}</p>
            </CardContent>
          </Card>

          <Card className="border-2 border-purple-200 bg-purple-50/50">
            <CardContent className="pt-6 text-center">
              <Zap className="w-8 h-8 text-purple-600 mx-auto mb-3" />
              <p className="text-2xl font-bold text-purple-900 mb-1">24/7</p>
              <p className="text-sm text-slate-600">{t('corePillars.trust.support')}</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </section>
  );
}