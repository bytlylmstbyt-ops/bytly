import React, { useState } from "react";
import { motion } from "framer-motion";
import { Home, Palette, Sparkles, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import AIChat from "@/components/ai/AIChat";
import MaterialSuggester from "@/components/ai/MaterialSuggester";
import { Button } from "@/components/ui/button";

const styles = [
  { id: "modern", label: "عصري", emoji: "🏙️" },
  { id: "luxury", label: "فاخر", emoji: "👑" },
  { id: "minimalist", label: "بسيط", emoji: "⬜" },
  { id: "classic", label: "كلاسيك", emoji: "🏛️" },
  { id: "neoclassic", label: "نيوكلاسيك", emoji: "✨" },
  { id: "scandinavian", label: "إسكندنافي", emoji: "🌿" },
  { id: "industrial", label: "صناعي", emoji: "⚙️" },
  { id: "arabic", label: "عربي", emoji: "🕌" },
  { id: "japanese", label: "ياباني", emoji: "🎋" },
];

const quickPrompts = [
  "صمم لي غرفة معيشة فاخرة بأسلوب نيوكلاسيك",
  "أريد مطبخاً عصرياً مفتوحاً بألوان محايدة",
  "غرفة نوم هادئة بأسلوب إسكندنافي",
  "مكتب منزلي عملي وأنيق",
  "حمام فاخر بتصميم فندقي",
];

const SYSTEM_PROMPT = `أنت مصمم داخلية خبير محترف من فريق Bytly AI Engineers.
تخصصك: التصميم الداخلي لجميع الأنماط بما فيها المعاصرة، الفاخرة، البسيطة، الكلاسيكية، النيوكلاسيكية، الإسكندنافية، الصناعية، العربية التراثية، اليابانية.

عند تلقي طلب تصميم، قدم:
1. **المفهوم التصميمي**: فكرة عامة وشاملة
2. **لوحة الألوان**: 3-5 ألوان رئيسية مع رموز HEX
3. **اقتراحات الأثاث**: القطع الرئيسية مع المواصفات
4. **الإضاءة**: نوع وتوزيع الإضاءة
5. **الديكور والإكسسوارات**: مقترحات تفصيلية
6. **المواد والتشطيبات**: أرضيات، جدران، أسقف
7. **نصائح ختامية**: لجعل الفراغ يبدو أوسع وأجمل

التزم بالأسلوب الذي اختاره المستخدم طوال المحادثة. إذا طلب تعديلاً يحافظ على نفس الأسلوب الأساسي.
قدم ردوداً احترافية مفصلة باللغة العربية أو الإنجليزية حسب ما يكتب المستخدم.
⚠️ نبّه دائماً أن التنفيذ يحتاج مهندساً ومصمماً مرخصاً.`;

export default function AIInteriorDesigner() {
  const [selectedStyle, setSelectedStyle] = useState(null);

  const initialMsg = `مرحباً! أنا مصمم الداخلية الذكي من Bytly AI ✨

أستطيع **توليد صور تصميم فوتوريالستية** بمجرد وصف مشروعك:
• 🖼️ **4 تصاميم بصرية** لكل طلب — تلقائياً
• 🏠 غرف معيشة، مطابخ، غرف نوم، مجالس، واجهات
• 🎨 9 أنماط تصميمية (فاخر، عصري، نيوكلاسيك...)
• 📐 جودة معمارية احترافية 8K

**اختر الأسلوب التصميمي** من الجانب، ثم صف مشروعك أو اختر أمراً سريعاً!`;

  const systemWithStyle = selectedStyle
    ? `${SYSTEM_PROMPT}\n\nالأسلوب التصميمي المختار: ${selectedStyle}. التزم بهذا الأسلوب في كل ردودك.`
    : SYSTEM_PROMPT;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800" dir="rtl">
      {/* Header */}
      <div className="bg-slate-900/80 border-b border-white/10 px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center gap-3">
          <Link to="/AIEngineers">
            <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white gap-1">
              <ArrowRight className="w-4 h-4" />
              رجوع
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
              <Home className="w-4 h-4 text-white" />
            </div>
            <span className="text-white font-bold">مصمم الداخلية الذكي</span>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 flex flex-col lg:flex-row gap-6 h-[calc(100vh-65px)]">
        {/* Sidebar */}
        <div className="lg:w-72 flex-shrink-0 space-y-4 overflow-y-auto">
          {/* Styles */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Palette className="w-4 h-4 text-purple-400" />
              <span className="text-white text-sm font-medium">الأسلوب التصميمي</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {styles.map(s => (
                <button
                  key={s.id}
                  onClick={() => setSelectedStyle(s.id === selectedStyle ? null : s.label)}
                  className={`p-2 rounded-xl text-center transition-all text-xs ${
                    selectedStyle === s.label
                      ? "bg-purple-500/30 border border-purple-500/50 text-purple-300"
                      : "bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10"
                  }`}
                >
                  <div className="text-lg mb-0.5">{s.emoji}</div>
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Prompts */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span className="text-white text-sm font-medium">أمثلة سريعة</span>
            </div>
            <div className="space-y-2">
              {quickPrompts.map((p, i) => (
                <button
                  key={i}
                  className="w-full text-right text-xs text-slate-400 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-all leading-relaxed border border-transparent hover:border-white/10"
                  onClick={() => {
                    document.querySelector("textarea")?.setAttribute("value", p);
                    const event = new Event("input", { bubbles: true });
                    document.querySelector("textarea")?.dispatchEvent(event);
                  }}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Info */}
          <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-4">
            <p className="text-xs text-amber-400/80 leading-relaxed">
              💡 <strong>نصيحة:</strong> كلما زادت التفاصيل في وصفك، كان الاقتراح أكثر دقة. اذكر المساحة، عدد الأشخاص، والاستخدام.
            </p>
          </div>

          {/* Material Suggester */}
          <MaterialSuggester />
        </div>

        {/* Chat */}
        <div className="flex-1 min-h-0">
          <AIChat
            agentId="interior"
            agentName="مصمم الداخلية الذكي"
            agentIcon={<Home className="w-5 h-5" />}
            agentColor="from-purple-500 to-pink-500"
            systemPrompt={systemWithStyle}
            placeholder="صف غرفتك أو مشروعك... سيتم توليد صور احترافية تلقائياً"
            allowImages={true}
            enableImageGeneration={true}
            selectedStyle={selectedStyle}
            initialMessage={initialMsg}
          />
        </div>
      </div>
    </div>
  );
}