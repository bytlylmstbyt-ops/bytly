import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { 
  Search, ArrowLeft, Star, CheckCircle, Users, 
  Briefcase, Award, Shield, Palette, Building2,
  PenTool, Sparkles, ChevronLeft, Ruler
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function Home() {
  const [engineers, setEngineers] = useState([]);
  const [portfolios, setPortfolios] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    const [engineersData, portfoliosData] = await Promise.all([
      base44.entities.Engineer.filter({ status: "approved", is_verified: true }, "-rating", 6),
      base44.entities.Portfolio.filter({ is_featured: true }, "-created_date", 8)
    ]);
    
    // Load portfolios for each engineer to show as background
    const engineersWithPortfolios = await Promise.all(
      engineersData.map(async (engineer) => {
        const engineerPortfolios = await base44.entities.Portfolio.filter(
          { engineer_id: engineer.id }, 
          "-created_date", 
          1
        );
        return {
          ...engineer,
          featured_portfolio: engineerPortfolios[0]?.images?.[0] || engineer.cover_image
        };
      })
    );
    
    setEngineers(engineersWithPortfolios);
    setPortfolios(portfoliosData);
    setIsLoading(false);
  };

  const categories = [
    { icon: Palette, title: "تصميم داخلي", count: "500+", color: "from-rose-500 to-orange-500" },
    { icon: Building2, title: "تصميم معماري", count: "300+", color: "from-blue-500 to-cyan-500" },
    { icon: Building2, title: "هندسة مدنية", count: "250+", color: "from-gray-600 to-slate-700" },
    { icon: PenTool, title: "رسم هندسي", count: "200+", color: "from-violet-500 to-purple-500" },
    { icon: Ruler, title: "رسم تنفيذي", count: "150+", color: "from-emerald-500 to-teal-500" },
    { icon: Sparkles, title: "ديكور وإكسسوارات", count: "400+", color: "from-amber-500 to-yellow-500" },
  ];

  const stats = [
    { value: "1000+", label: "مهندس ومصمم" },
    { value: "5000+", label: "مشروع مكتمل" },
    { value: "98%", label: "رضا العملاء" },
    { value: "24/7", label: "دعم فني" },
  ];

  return (
    <div className="overflow-hidden">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center">
        {/* Background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-[#1a1a2e]/95 via-[#1a1a2e]/80 to-[#d4a574]/30" />
          <img 
            src="https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=1920"
            alt="Interior Design"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a2e] via-transparent to-transparent" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <Badge className="bg-white/10 text-white border-white/20 mb-6 px-4 py-2">
                <Sparkles className="w-4 h-4 ml-2" />
                منصة التصميم الأولى في المنطقة
              </Badge>
              
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
                حوّل منزلك إلى
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-[#d4a574] to-[#e8c9a8]">
                  تحفة فنية
                </span>
              </h1>
              
              <p className="text-lg text-slate-300 mb-8 max-w-lg">
                سواء كنت صاحب منزل، مستثمر عقاري، أو مهندس محترف - 
                بيتلي هي منصتك الموثوقة لإنجاز مشاريعك بجودة واحترافية.
              </p>

              {/* Search Box */}
              <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-2 border border-white/20">
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="flex-1 relative">
                    <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <Input
                      placeholder="ابحث عن مصمم أو تخصص..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pr-12 h-14 bg-white border-0 rounded-xl text-slate-800 placeholder:text-slate-400"
                    />
                  </div>
                  <Link to={createPageUrl("Engineers") + (searchQuery ? `?search=${searchQuery}` : "")}>
                    <Button className="h-14 px-8 bg-gradient-to-r from-[#d4a574] to-[#c9a227] text-white rounded-xl hover:opacity-90 w-full sm:w-auto">
                      ابحث الآن
                      <ArrowLeft className="w-5 h-5 mr-2" />
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-12">
                {stats.map((stat, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + index * 0.1 }}
                    className="text-center"
                  >
                    <div className="text-2xl md:text-3xl font-bold text-white">{stat.value}</div>
                    <div className="text-sm text-slate-400 mt-1">{stat.label}</div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Hero Image/Cards */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="hidden lg:block relative"
            >
              <div className="relative">
                <div className="absolute -top-4 -right-4 w-72 h-72 bg-gradient-to-br from-[#d4a574]/30 to-transparent rounded-full blur-3xl" />
                <div className="relative grid grid-cols-2 gap-4">
                  <div className="space-y-4">
                    <div className="h-48 rounded-2xl overflow-hidden">
                      <img 
                        src="https://images.unsplash.com/photo-1600210492493-0946911123ea?w=400"
                        alt="Design 1"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="h-64 rounded-2xl overflow-hidden">
                      <img 
                        src="https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=400"
                        alt="Design 2"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                  <div className="space-y-4 pt-8">
                    <div className="h-64 rounded-2xl overflow-hidden">
                      <img 
                        src="https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=400"
                        alt="Design 3"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="h-48 rounded-2xl overflow-hidden">
                      <img 
                        src="https://images.unsplash.com/photo-1618219908412-a29a1bb7b86e?w=400"
                        alt="Design 4"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-[#1a1a2e] mb-4">
              اكتشف التخصصات
            </h2>
            <p className="text-slate-600 max-w-2xl mx-auto">
              مجموعة متنوعة من المتخصصين في مختلف مجالات التصميم والهندسة
            </p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {categories.map((category, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Link to={createPageUrl("Engineers") + `?category=${category.title}`}>
                  <Card className="group hover-lift cursor-pointer border-0 shadow-lg hover:shadow-xl">
                    <CardContent className="p-6 text-center">
                      <div className={`w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br ${category.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                        <category.icon className="w-8 h-8 text-white" />
                      </div>
                      <h3 className="font-semibold text-[#1a1a2e] mb-1">{category.title}</h3>
                      <p className="text-sm text-slate-500">{category.count} متخصص</p>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Engineers */}
      <section className="py-20 bg-gradient-to-br from-slate-50 to-amber-50/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex justify-between items-end mb-12"
          >
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-[#1a1a2e] mb-4">
                مهندسون مميزون
              </h2>
              <p className="text-slate-600">
                أفضل المصممين والمهندسين المعتمدين
              </p>
            </div>
            <Link to={createPageUrl("Engineers")}>
              <Button variant="outline" className="hidden md:flex items-center gap-2 border-[#d4a574] text-[#d4a574] hover:bg-[#d4a574] hover:text-white">
                عرض الكل
                <ChevronLeft className="w-4 h-4" />
              </Button>
            </Link>
          </motion.div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-16 h-16 rounded-full bg-slate-200" />
                      <div className="space-y-2">
                        <div className="h-4 w-32 bg-slate-200 rounded" />
                        <div className="h-3 w-24 bg-slate-200 rounded" />
                      </div>
                    </div>
                    <div className="h-20 bg-slate-200 rounded" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : engineers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {engineers.map((engineer, index) => (
                <motion.div
                  key={engineer.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Link to={createPageUrl("EngineerProfile") + `?id=${engineer.id}`}>
                    <Card className="hover-lift cursor-pointer overflow-hidden border-0 shadow-lg">
                      <div className="relative h-32 bg-gradient-to-br from-[#1a1a2e] to-[#d4a574]">
                        {engineer.featured_portfolio ? (
                          <img 
                            src={engineer.featured_portfolio} 
                            alt="" 
                            className="w-full h-full object-cover opacity-60" 
                          />
                        ) : engineer.cover_image ? (
                          <img 
                            src={engineer.cover_image} 
                            alt="" 
                            className="w-full h-full object-cover opacity-50" 
                          />
                        ) : null}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                      </div>
                      <CardContent className="relative p-6 pt-0">
                        <Avatar className="w-20 h-20 border-4 border-white -mt-10 shadow-lg">
                          <AvatarImage src={engineer.profile_image} />
                          <AvatarFallback className="bg-gradient-to-br from-[#1a1a2e] to-[#d4a574] text-white text-xl">
                            {engineer.full_name?.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="mt-4">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-bold text-lg text-[#1a1a2e]">{engineer.full_name}</h3>
                            {engineer.is_verified && (
                              <CheckCircle className="w-5 h-5 text-blue-500" />
                            )}
                          </div>
                          <p className="text-sm text-slate-600 mb-3">{engineer.specialization}</p>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1">
                              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                              <span className="font-semibold">{engineer.rating?.toFixed(1) || "0.0"}</span>
                              <span className="text-slate-400 text-sm">({engineer.total_reviews || 0})</span>
                            </div>
                            <Badge variant="secondary" className="bg-slate-100">
                              {engineer.completed_projects || 0} مشروع
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">لا يوجد مهندسين حالياً</p>
            </div>
          )}
        </div>
      </section>

      {/* Portfolio Gallery */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-[#1a1a2e] mb-4">
              معرض الأعمال المميزة
            </h2>
            <p className="text-slate-600 max-w-2xl mx-auto">
              استلهم من أفضل التصاميم والأعمال المنفذة
            </p>
          </motion.div>

          {portfolios.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {portfolios.map((portfolio, index) => (
                <motion.div
                  key={portfolio.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05 }}
                  className={`group relative overflow-hidden rounded-2xl cursor-pointer ${
                    index === 0 || index === 5 ? "md:col-span-2 md:row-span-2" : ""
                  }`}
                >
                  <Link to={createPageUrl("Gallery") + `?id=${portfolio.id}`}>
                    <div className="aspect-square">
                      <img
                        src={portfolio.images?.[0] || "https://images.unsplash.com/photo-1618219908412-a29a1bb7b86e?w=600"}
                        alt={portfolio.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="absolute bottom-0 left-0 right-0 p-4">
                        <h3 className="text-white font-semibold">{portfolio.title}</h3>
                        <p className="text-white/80 text-sm">{portfolio.category}</p>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Palette className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">لا توجد أعمال حالياً</p>
            </div>
          )}

          <div className="text-center mt-8">
            <Link to={createPageUrl("Gallery")}>
              <Button className="bg-gradient-to-r from-[#1a1a2e] to-[#d4a574] text-white px-8">
                استكشف المزيد
                <ChevronLeft className="w-4 h-4 mr-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-20 bg-[#1a1a2e]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              لماذا بيتلي؟
            </h2>
            <p className="text-slate-300 max-w-2xl mx-auto">
              نقدم لك تجربة فريدة في عالم التصميم والهندسة
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: Shield,
                title: "دفع آمن",
                description: "نظام دفع ضامن يحمي حقوقك حتى استلام التصميم"
              },
              {
                icon: Users,
                title: "مهندسون معتمدون",
                description: "جميع المهندسين موثقون ومعتمدون بشهادات رسمية"
              },
              {
                icon: Award,
                title: "جودة عالية",
                description: "معرض أعمال احترافي يضمن لك أعلى معايير الجودة"
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-[#d4a574] to-[#c9a227] flex items-center justify-center mb-6">
                  <feature.icon className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                <p className="text-slate-400">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-[#d4a574] to-[#c9a227]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              انضم إلى بيتلي اليوم
            </h2>
            <p className="text-white/90 text-lg mb-8 max-w-2xl mx-auto">
              سواء كنت تبحث عن تصميم منزلك، أو مهندس تريد عرض خدماتك، 
              أو شركة استشارية ترغب في تقديم خدماتك - بيتلي هي منصتك المثالية.
            </p>
            <Link to={createPageUrl("RegisterChoice")}>
              <Button size="lg" className="bg-white text-[#1a1a2e] hover:bg-white/90 px-8 py-6 text-lg">
                انضم لـ بيتلي
                <ArrowLeft className="w-5 h-5 mr-2" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}