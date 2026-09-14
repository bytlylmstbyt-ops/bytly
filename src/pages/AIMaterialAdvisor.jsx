import React, { useState } from "react";
import { Layers, ArrowRight, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import AIChat from "@/components/ai/AIChat";
import MaterialSuggester from "@/components/ai/MaterialSuggester";
import { Button } from "@/components/ui/button";

const SYSTEM_PROMPT = `أنت خبير مواد البناء والتشطيب في السوق السعودي من فريق Bytly AI Engineers.

عند الاستفسار عن المواد، قدم:
1. **المواد المقترحة**: أسماء محددة مع المواصفات
2. **مقارنة الخيارات**: جدول مقارنة بين الخيارات المتاحة
3. **الأسعار التقريبية**: بالريال السعودي (م² أو الوحدة)
4. **مدة الصلاحية والمتانة**: بالسنوات
5. **ملاءمة البيئة السعودية**: درجات الحرارة، الرطوبة، الغبار
6. **الصيانة**: مستوى الصيانة المطلوبة
7. **أفضل الموردين**: أسماء ماركات متوفرة في السعودية
8. **نصائح التركيب**: أهم الأخطاء الشائعة وكيف تتجنبها

فئات المواد: أرضيات، دهانات، رخام وجرانيت، خشب، إضاءة، مطابخ، حمامات.
استخدم معايير جودة دولية (ISO, BS) عند الإشارة إليها.`;

const categories = [
  { id: "flooring", label: "أرضيات", emoji: "🏠", desc: "سيراميك، بورسلين، خشب، رخام" },
  { id: "paint", label: "دهانات", emoji: "🎨", desc: "أكريليك، زيتي، جبس، ديكوري" },
  { id: "marble", label: "رخام وجرانيت", emoji: "💎", desc: "محلي ومستورد" },
  { id: "wood", label: "أخشاب", emoji: "🌳", desc: "MDF، خشب طبيعي، باركيه" },
  { id: "lighting", label: "إضاءة", emoji: "💡", desc: "LED، ديكوري، خارجي" },
  { id: "kitchen", label: "مطابخ", emoji: "🍳", desc: "ألواح، سطوح، بلاط" },
  { id: "bathroom", label: "حمامات", emoji: "🚿", desc: "سيراميك، أدوات صحية" },
];

export default function AIMaterialAdvisor() {
  const [selectedCat, setSelectedCat] = useState(null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800" dir="rtl">
      <div className="bg-slate-900/80 border-b border-white/10 px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center gap-3">
          <Link to="/AIEngineers">
            <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white gap-1">
              <ArrowRight className="w-4 h-4" />رجوع
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-yellow-500 to-orange-400 rounded-lg flex items-center justify-center">
              <Layers className="w-4 h-4 text-white" />
            </div>
            <span className="text-white font-bold">مستشار المواد الذكي</span>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 flex flex-col lg:flex-row gap-6" style={{ height: "calc(100vh - 65px)" }}>
        <div className="lg:w-72 flex-shrink-0 space-y-4 overflow-y-auto">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-yellow-400" />
              <span className="text-white text-sm font-medium">اختر الفئة</span>
            </div>
            <div className="space-y-2">
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCat(selectedCat === cat.id ? null : cat.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl text-right transition-all ${
                    selectedCat === cat.id
                      ? "bg-yellow-500/20 border border-yellow-500/40 text-white"
                      : "bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10"
                  }`}
                >
                  <span className="text-xl">{cat.emoji}</span>
                  <div>
                    <div className="text-sm font-medium">{cat.label}</div>
                    <div className="text-xs opacity-60">{cat.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-2xl p-4">
            <p className="text-xs text-yellow-400/80 leading-relaxed">
              💡 حدد فئة المواد، ثم أخبرنا عن ميزانيتك ومستوى الجودة المطلوب لاقتراحات مخصصة.
            </p>
          </div>

          {/* Material Suggester Tool */}
          <MaterialSuggester />
        </div>

        <div className="flex-1 min-h-0">
          <AIChat
            agentId="materials"
            agentName="مستشار المواد الذكي"
            agentIcon={<Layers className="w-5 h-5" />}
            agentColor="from-yellow-500 to-orange-400"
            systemPrompt={
              selectedCat
                ? `${SYSTEM_PROMPT}\n\nالفئة المختارة: ${categories.find(c => c.id === selectedCat)?.label}. ركز على هذه الفئة في إجاباتك.`
                : SYSTEM_PROMPT
            }
            placeholder="اسألني عن أي مادة بناء أو تشطيب..."
            initialMessage={`مرحباً! أنا مستشار المواد الذكي من Bytly AI 🧱

أساعدك في اختيار أفضل المواد لمشروعك حسب:
• **المتانة**: أطول عمر افتراضي
• **الميزانية**: اقتصادي إلى فاخر
• **البيئة السعودية**: مقاومة للحرارة والرطوبة
• **سهولة الصيانة**

اختر فئة المواد من القائمة أو اسألني مباشرة!`}
          />
        </div>
      </div>
    </div>
  );
}