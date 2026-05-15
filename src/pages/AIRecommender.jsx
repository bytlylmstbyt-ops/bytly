import React, { useState } from "react";
import { Users, ArrowRight, Star, MapPin, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import AIChat from "@/components/ai/AIChat";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";

const SYSTEM_PROMPT = `أنت مستشار التوصية الذكي من فريق Bytly AI Engineers.
تخصصك: مساعدة أصحاب المشاريع في العثور على أفضل المقاولين والمصممين والموردين في السوق السعودي.

عند طلب التوصية، قدم:
1. **معايير الاختيار**: ما الذي يجب البحث عنه في هذا النوع من الخدمات
2. **أسئلة التأهيل**: أسئلة يجب طرحها قبل التعاقد
3. **علامات التحذير**: أشياء تدل على عدم الاحترافية
4. **نصائح التفاوض**: كيف تحصل على أفضل سعر
5. **بنود العقد المهمة**: ما يجب أن يتضمنه العقد
6. **التوقعات الواقعية**: مدد التنفيذ وهوامش الأسعار المعقولة
7. **الأوراق المطلوبة**: ما تحتاجه قبل البدء

للمقاولين: احرص على السجل التجاري، شهادة التصنيف، الضمان.
للمصممين: محفظة الأعمال، شهادات الخبرة، أسلوب العمل.
للموردين: الضمان، خدمة ما بعد البيع، التوافر.

بإمكانك أيضاً إرشاد المستخدم للبحث في منصة بيتلي على /engineers و/consulting-firms للعثور على متخصصين معتمدين.`;

const categories = [
  { id: "contractor", label: "مقاول بناء", emoji: "🏗️" },
  { id: "interior", label: "مصمم داخلي", emoji: "🎨" },
  { id: "architect", label: "مكتب هندسي", emoji: "📐" },
  { id: "supplier", label: "مورد مواد", emoji: "📦" },
  { id: "landscape", label: "مشغل ديزاين", emoji: "🌿" },
  { id: "electrical", label: "كهرباء وميكانيكا", emoji: "⚡" },
];

export default function AIRecommender() {
  const [form, setForm] = useState({ type: "", city: "", budget: "", projectType: "" });

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
            <div className="w-8 h-8 bg-gradient-to-br from-rose-500 to-red-400 rounded-lg flex items-center justify-center">
              <Users className="w-4 h-4 text-white" />
            </div>
            <span className="text-white font-bold">محرك التوصية الذكي</span>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 flex flex-col lg:flex-row gap-6" style={{ height: "calc(100vh - 65px)" }}>
        <div className="lg:w-72 flex-shrink-0 space-y-4 overflow-y-auto">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
            <p className="text-xs text-slate-400 font-medium mb-3">نوع الخدمة المطلوبة</p>
            <div className="grid grid-cols-2 gap-2">
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setForm(p => ({ ...p, type: cat.id === p.type ? "" : cat.label }))}
                  className={`p-3 rounded-xl text-center text-xs transition-all border ${
                    form.type === cat.label
                      ? "bg-rose-500/20 border-rose-500/40 text-white"
                      : "bg-white/5 border-white/10 text-slate-400 hover:text-white"
                  }`}
                >
                  <div className="text-lg mb-1">{cat.emoji}</div>
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3">
            {[
              { key: "city", label: "المدينة", placeholder: "الرياض، جدة..." },
              { key: "budget", label: "الميزانية الإجمالية", placeholder: "مثال: 500,000 ريال" },
              { key: "projectType", label: "نوع المشروع", placeholder: "فيلا، شقة، مكاتب..." },
            ].map(f => (
              <div key={f.key}>
                <label className="text-xs text-slate-400 mb-1 block">{f.label}</label>
                <input
                  value={form[f.key]}
                  onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                  placeholder={f.placeholder}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 outline-none focus:border-rose-500/50"
                />
              </div>
            ))}
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
            <div className="flex items-center gap-1 mb-2">
              <Star className="w-4 h-4 text-amber-400" />
              <span className="text-xs text-white font-medium">ابحث في بيتلي</span>
            </div>
            <p className="text-xs text-slate-400 mb-3">منصة بيتلي تضم مهندسين ومكاتب استشارية معتمدة.</p>
            <Link to="/Engineers">
              <Button size="sm" variant="outline" className="w-full border-amber-400/30 text-amber-400 hover:bg-amber-400/10 text-xs">
                <Sparkles className="w-3 h-3 ml-1" />
                تصفح المهندسين المعتمدين
              </Button>
            </Link>
          </div>
        </div>

        <div className="flex-1 min-h-0">
          <AIChat
            agentId="recommender"
            agentName="محرك التوصية الذكي"
            agentIcon={<Users className="w-5 h-5" />}
            agentColor="from-rose-500 to-red-400"
            systemPrompt={
              form.type
                ? `${SYSTEM_PROMPT}\n\nالمستخدم يبحث عن: ${form.type}${form.city ? ` في ${form.city}` : ""}${form.budget ? ` بميزانية ${form.budget}` : ""}.`
                : SYSTEM_PROMPT
            }
            placeholder="أخبرني عن مشروعك وما تحتاجه من متخصصين..."
            initialMessage={`مرحباً! أنا محرك التوصية الذكي من Bytly AI ⭐

أساعدك في:
• اختيار المقاول المناسب لمشروعك
• إيجاد أفضل المصممين الداخليين
• التحقق من موردي المواد الموثوقين
• نصائح التعاقد وحماية حقوقك

اختر نوع الخدمة من القائمة أو أخبرني مباشرة بما تحتاجه!`}
          />
        </div>
      </div>
    </div>
  );
}