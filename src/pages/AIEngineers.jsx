import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Home, DraftingCompass, Wrench, Calculator,
  Layers, Users, Brain, ChevronRight, Zap,
  Star, Shield, Globe
} from "lucide-react";
import { Button } from "@/components/ui/button";

const agents = [
  {
    id: "interior",
    icon: <Home className="w-7 h-7" />,
    color: "from-purple-500 to-pink-500",
    bgLight: "from-purple-50 to-pink-50",
    border: "border-purple-200",
    title: "مصمم الداخلية الذكي",
    titleEn: "AI Interior Designer",
    desc: "صف غرفتك وسيقترح عليك المفهوم التصميمي كاملاً: ألوان، أثاث، إضاءة، ديكور",
    tags: ["Modern", "Luxury", "Minimalist", "Arabic", "Scandinavian"],
    path: "/AIInteriorDesigner"
  },
  {
    id: "architect",
    icon: <DraftingCompass className="w-7 h-7" />,
    color: "from-blue-500 to-cyan-500",
    bgLight: "from-blue-50 to-cyan-50",
    border: "border-blue-200",
    title: "المهندس المعماري الذكي",
    titleEn: "AI Architectural Engineer",
    desc: "أدخل حجم الأرض وعدد الطوابق ومتطلباتك، واحصل على توصيات معمارية ذكية",
    tags: ["مخططات", "توزيع الفراغات", "الواجهات", "الدوران"],
    path: "/AIArchitect"
  },
  {
    id: "renovation",
    icon: <Wrench className="w-7 h-7" />,
    color: "from-orange-500 to-amber-500",
    bgLight: "from-orange-50 to-amber-50",
    border: "border-orange-200",
    title: "مساعد التجديد الذكي",
    titleEn: "AI Renovation Assistant",
    desc: "ارفع صور غرفتك الحالية وسيقترح أفضل أفكار التجديد والتحسين",
    tags: ["رفع صور", "قبل/بعد", "تخطيط أفضل", "تحسين الفراغ"],
    path: "/AIRenovation"
  },
  {
    id: "budget",
    icon: <Calculator className="w-7 h-7" />,
    color: "from-green-500 to-emerald-500",
    bgLight: "from-green-50 to-emerald-50",
    border: "border-green-200",
    title: "مقدّر التكلفة الذكي",
    titleEn: "AI Budget Estimator",
    desc: "احسب تكلفة مشروعك بالريال السعودي حسب المدينة والمساحة والتشطيبات",
    tags: ["اقتصادي", "متوسط", "فاخر", "ريال سعودي"],
    path: "/AIBudgetEstimator"
  },
  {
    id: "materials",
    icon: <Layers className="w-7 h-7" />,
    color: "from-yellow-500 to-orange-400",
    bgLight: "from-yellow-50 to-orange-50",
    border: "border-yellow-200",
    title: "مستشار المواد الذكي",
    titleEn: "AI Material Advisor",
    desc: "احصل على توصيات المواد المثالية بناءً على الجودة والبيئة والميزانية",
    tags: ["أرضيات", "دهانات", "رخام", "إضاءة", "مطابخ"],
    path: "/AIMaterialAdvisor"
  },
  {
    id: "recommend",
    icon: <Users className="w-7 h-7" />,
    color: "from-rose-500 to-red-400",
    bgLight: "from-rose-50 to-red-50",
    border: "border-rose-200",
    title: "محرك التوصية الذكي",
    titleEn: "AI Smart Recommender",
    desc: "يرشح لك أفضل المقاولين والمصممين والموردين حسب تقييماتهم ومدينتك وميزانيتك",
    tags: ["مقاولون", "مصممون", "موردون", "تقييمات"],
    path: "/AIRecommender"
  }
];

const stats = [
  { value: "+2,400", label: "تصميم مُولَّد", icon: <Sparkles className="w-5 h-5" /> },
  { value: "9", label: "أسلوب تصميمي", icon: <Star className="w-5 h-5" /> },
  { value: "100%", label: "عربي + إنجليزي", icon: <Globe className="w-5 h-5" /> },
  { value: "آمن", label: "بياناتك محمية", icon: <Shield className="w-5 h-5" /> }
];

export default function AIEngineers() {
  const [hovered, setHovered] = useState(null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-white" dir="rtl">
      {/* Hero */}
      <section className="relative overflow-hidden px-4 pt-16 pb-12">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
          <div className="absolute top-40 left-1/4 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-1/2 w-full h-px bg-gradient-to-r from-transparent via-amber-400/30 to-transparent" />
        </div>

        <div className="max-w-5xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-400 text-sm mb-6"
          >
            <Zap className="w-4 h-4" />
            مدعوم بالذكاء الاصطناعي المتقدم
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-6xl font-bold mb-4"
          >
            <span className="text-white">Bytly </span>
            <span className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
              AI Engineers
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-slate-300 text-lg md:text-xl max-w-2xl mx-auto mb-8 leading-relaxed"
          >
            نظام ذكاء اصطناعي هندسي متكامل — مهندسون ومصممون رقميون يعملون معك على مدار الساعة لتحويل أفكارك إلى مشاريع حقيقية
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-wrap justify-center gap-3"
          >
            <Link to="/AIInteriorDesigner">
              <Button className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 px-6 py-3 text-base font-bold hover:opacity-90 shadow-lg shadow-amber-500/25">
                <Sparkles className="w-4 h-4 ml-2" />
                ابدأ تصميم حلمك
              </Button>
            </Link>
            <Link to="/AIBudgetEstimator">
              <Button variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-800 px-6 py-3 text-base">
                <Calculator className="w-4 h-4 ml-2" />
                احسب تكلفة مشروعك
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="max-w-4xl mx-auto px-4 pb-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * i }}
              className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center"
            >
              <div className="flex justify-center mb-2 text-amber-400">{s.icon}</div>
              <div className="text-2xl font-bold text-white">{s.value}</div>
              <div className="text-xs text-slate-400 mt-1">{s.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Agents Grid */}
      <section className="max-w-6xl mx-auto px-4 pb-16">
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">اختر مساعدك الذكي</h2>
          <p className="text-slate-400">6 وكلاء هندسيون متخصصون تحت تصرفك</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {agents.map((agent, i) => (
            <motion.div
              key={agent.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.07 * i }}
              onMouseEnter={() => setHovered(agent.id)}
              onMouseLeave={() => setHovered(null)}
            >
              <Link to={agent.path}>
                <div className={`group relative bg-white/5 border border-white/10 rounded-2xl p-6 cursor-pointer transition-all duration-300 hover:bg-white/10 hover:border-white/20 hover:shadow-2xl hover:-translate-y-1 h-full`}>
                  {/* Icon */}
                  <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${agent.color} mb-4 text-white shadow-lg`}>
                    {agent.icon}
                  </div>

                  {/* Title */}
                  <h3 className="text-lg font-bold text-white mb-1">{agent.title}</h3>
                  <p className="text-xs text-slate-400 mb-3">{agent.titleEn}</p>

                  {/* Description */}
                  <p className="text-sm text-slate-300 leading-relaxed mb-4">{agent.desc}</p>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {agent.tags.map(tag => (
                      <span key={tag} className="text-xs px-2 py-0.5 bg-white/10 rounded-full text-slate-300">
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* CTA */}
                  <div className="flex items-center text-amber-400 text-sm font-medium">
                    ابدأ الآن
                    <ChevronRight className="w-4 h-4 mr-1 group-hover:translate-x-1 transition-transform" />
                  </div>

                  {/* Hover glow */}
                  <AnimatePresence>
                    {hovered === agent.id && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${agent.color} opacity-5 pointer-events-none`}
                      />
                    )}
                  </AnimatePresence>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Multi-agent collaboration banner */}
      <section className="max-w-5xl mx-auto px-4 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-400/20 rounded-3xl p-8 text-center"
        >
          <Brain className="w-12 h-12 text-amber-400 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-white mb-3">تعاون الوكلاء الذكي</h3>
          <p className="text-slate-300 max-w-2xl mx-auto leading-relaxed mb-6">
            الوكلاء يعملون معاً: يرسم المهندس المعماري المخطط → يُأثثه مصمم الداخلية → يحسب مقدّر التكلفة الميزانية → يوصي مستشار المواد بأفضل التشطيبات
          </p>
          <div className="flex justify-center flex-wrap gap-4 text-sm text-amber-400 font-medium">
            <div className="flex items-center gap-2"><DraftingCompass className="w-4 h-4" /> مخططات معمارية</div>
            <span className="text-slate-600">→</span>
            <div className="flex items-center gap-2"><Home className="w-4 h-4" /> تصميم داخلي</div>
            <span className="text-slate-600">→</span>
            <div className="flex items-center gap-2"><Calculator className="w-4 h-4" /> تقدير التكلفة</div>
            <span className="text-slate-600">→</span>
            <div className="flex items-center gap-2"><Layers className="w-4 h-4" /> توصية المواد</div>
          </div>
        </motion.div>
      </section>

      {/* Disclaimer */}
      <section className="max-w-3xl mx-auto px-4 pb-12 text-center">
        <p className="text-xs text-slate-500 leading-relaxed">
          ⚠️ المخرجات الذكية للاسترشاد والتخطيط فقط. رسومات التنفيذ النهائية تتطلب مهندساً مرخصاً. Bytly AI لا تحل محل الخبرة الهندسية المعتمدة.
        </p>
      </section>
    </div>
  );
}