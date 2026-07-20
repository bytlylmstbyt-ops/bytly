import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import { 
  Palette, Building2, PenTool, Briefcase, 
  ArrowLeft, CheckCircle, Star, Scale, MapPin, HardHat, Package, Compass
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/components/i18n/LanguageContext";

export default function RegisterChoice() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [googleUserInfo, setGoogleUserInfo] = useState(null);

  useEffect(() => {
    // Check if user logged in via Google
    const storedInfo = sessionStorage.getItem('googleUserInfo');
    if (storedInfo) {
      try {
        const userInfo = JSON.parse(storedInfo);
        setGoogleUserInfo(userInfo);
        // Clear from session after reading
        sessionStorage.removeItem('googleUserInfo');
      } catch (err) {
        console.error('Error parsing Google user info:', err);
      }
    }
  }, []);
  
  const options = [
    {
      id: "investor",
      icon: Building2,
      title: t('registerChoice.roles.investor.title'),
      description: t('registerChoice.roles.investor.description'),
      features: t('registerChoice.roles.investor.features'),
      color: "from-purple-600 to-indigo-600",
      link: createPageUrl("RegisterClient") + "?type=investor",
      featured: true
    },
    {
      id: "client",
      icon: Briefcase,
      title: t('registerChoice.roles.homeowner.title'),
      description: t('registerChoice.roles.homeowner.description'),
      features: t('registerChoice.roles.homeowner.features'),
      color: "from-amber-500 to-orange-500",
      link: createPageUrl("RegisterClient") + "?type=individual"
    },
    {
      id: "engineer",
      icon: Building2,
      title: t('registerChoice.roles.engineer.title'),
      description: t('registerChoice.roles.engineer.description'),
      features: t('registerChoice.roles.engineer.features'),
      color: "from-blue-500 to-cyan-500",
      link: createPageUrl("RegisterEngineer") + "?type=engineer"
    },
    {
      id: "surveyor",
      icon: MapPin,
      title: "مهندس مساحة",
      description: "سجّل كمساح معتمد لاستقبال طلبات المساحة والخرائط",
      features: ["استقبال طلبات مساحة قريبة منك", "رفع مخرجات مساحية (CAD)", "نظام دفع وضمان آمن"],
      color: "from-green-500 to-emerald-600",
      link: createPageUrl("RegisterEngineer") + "?type=surveyor"
    },
    {
      id: "firm",
      icon: Building2,
      title: t('registerChoice.roles.firm.title'),
      description: t('registerChoice.roles.firm.description'),
      features: t('registerChoice.roles.firm.features'),
      color: "from-teal-600 to-cyan-600",
      link: createPageUrl("RegisterFirm")
    },
    {
      id: "legal",
      icon: Scale,
      title: t('registerChoice.roles.legal.title'),
      description: t('registerChoice.roles.legal.description'),
      features: t('registerChoice.roles.legal.features'),
      color: "from-slate-600 to-gray-700",
      link: createPageUrl("RegisterLegalConsultant")
    },
    {
      id: "consultant",
      icon: Compass,
      title: "مستشار فني",
      description: "سجّل كمستشار فني معتمد لمراجعة وتدقيق المشاريع الهندسية",
      features: ["مراجعة المخرجات الفنية للمشاريع", "اعتماد تقارير الإنجاز والجودة", "دخل إضافي عبر استشاراتك"],
      color: "from-amber-600 to-yellow-600",
      link: createPageUrl("RegisterConsultant")
    },
    {
      id: "contractor",
      icon: HardHat,
      title: "مقاول",
      description: "سجّل كمقاول معتمد لاستقبال مشاريع التنفيذ والتشطيبات",
      features: ["استعراض المشاريع المتاحة", "تقديم العروض على المشاريع", "إدارة مشاريعك من لوحة واحدة"],
      color: "from-orange-600 to-amber-600",
      link: createPageUrl("RegisterContractor")
    },
    {
      id: "supplier",
      icon: Package,
      title: "مورد",
      description: "سجّل كمورد معتمد لتوريد المواد والمنتجات للمشاريع",
      features: ["استعراض الطلبات المتاحة", "عرض فئات منتجاتك", "إدارة طلباتك من لوحة واحدة"],
      color: "from-indigo-600 to-blue-600",
      link: createPageUrl("RegisterSupplier")
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
            {t('registerChoice.title')}
          </h1>
          <p className="text-slate-600 max-w-2xl mx-auto">
            {t('registerChoice.subtitle')}
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
                      {t('registerChoice.chooseAccount')}
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
            {t('registerChoice.alreadyHaveAccount')}{" "}
            <button 
              onClick={() => window.location.href = '/login'}
              className="text-[#d4a574] font-medium hover:underline"
            >
              {t('registerChoice.login')}
            </button>
          </p>
        </motion.div>
      </div>
    </div>
  );
}