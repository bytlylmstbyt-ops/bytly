import React, { useState } from "react";
import { DraftingCompass, ArrowRight, Layers, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import AIChat from "@/components/ai/AIChat";
import { Button } from "@/components/ui/button";

const SYSTEM_PROMPT = `أنت مهندس معماري خبير محترف من فريق Bytly AI Engineers.
تخصصك: التصميم المعماري للمباني السكنية والتجارية في السوق السعودي والخليجي.

عند تلقي طلب تصميم معماري، قدم:
1. **المفهوم المعماري**: فلسفة التصميم وهوية المبنى
2. **توزيع الفراغات**: خريطة ذهنية للطوابق والغرف
3. **الدوران الذكي**: حركة السكان داخل المبنى
4. **الواجهات**: مفهوم الواجهة الخارجية ومواد التشطيب
5. **توصيات هيكلية**: نوع الهيكل المناسب (خرسانة / حديد)
6. **الاستدامة**: اقتراحات توفير الطاقة والمياه
7. **الامتثال للكود السعودي**: توجيهات الكود SBC ذات الصلة
8. **المساحات المقترحة**: بالمتر المربع لكل فراغ

احتفظ بمتطلبات المستخدم (حجم الأرض، عدد الطوابق، الغرف) طوال المحادثة.
استخدم اصطلاحات هندسية دقيقة مع شرح مبسط للعميل.
⚠️ أكد دائماً أن المخططات التنفيذية تتطلب مهندساً مرخصاً ومكتباً هندسياً معتمداً.`;

const quickInputs = [
  { label: "فيلا صغيرة", prompt: "أرض 375م²، فيلا دورين + روف، 4 غرف نوم، مجلس رجال ونساء، مطبخ مفتوح، الرياض" },
  { label: "شقة استثمارية", prompt: "أرض 200م²، مبنى 4 طوابق شقق استثمارية، كل طابق شقتين، جدة" },
  { label: "استراحة", prompt: "أرض 1000م²، استراحة دور واحد، مجالس خارجية، مسبح، ملعب، الدمام" },
  { label: "مكاتب تجارية", prompt: "أرض 500م²، مبنى تجاري 5 طوابق، إيجارات مكتبية، مواقف سيارات في البدروم" },
];

export default function AIArchitect() {
  const [formData, setFormData] = useState({ landSize: "", floors: "", rooms: "", style: "", city: "" });
  const [chatStarted, setChatStarted] = useState(false);
  const [startPrompt, setStartPrompt] = useState("");

  const handleStartFromForm = () => {
    const prompt = `أريد تصميم مبنى بالمواصفات التالية:
- مساحة الأرض: ${formData.landSize} متر مربع
- عدد الطوابق: ${formData.floors}
- الغرف المطلوبة: ${formData.rooms}
- الأسلوب المعماري: ${formData.style || "غير محدد"}
- المدينة: ${formData.city || "السعودية"}
أريد توصيات معمارية شاملة.`;
    setStartPrompt(prompt);
    setChatStarted(true);
  };

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
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
              <DraftingCompass className="w-4 h-4 text-white" />
            </div>
            <span className="text-white font-bold">المهندس المعماري الذكي</span>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 flex flex-col lg:flex-row gap-6" style={{ height: "calc(100vh - 65px)" }}>
        {/* Left panel */}
        <div className="lg:w-72 flex-shrink-0 space-y-4 overflow-y-auto">
          {!chatStarted ? (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <Layers className="w-4 h-4 text-blue-400" />
                <span className="text-white font-medium text-sm">بيانات المشروع</span>
              </div>
              {[
                { key: "landSize", label: "مساحة الأرض (م²)", placeholder: "مثال: 375" },
                { key: "floors", label: "عدد الطوابق", placeholder: "مثال: 2" },
                { key: "rooms", label: "الغرف المطلوبة", placeholder: "مثال: 4 غرف نوم، مجلسان" },
                { key: "style", label: "الأسلوب المعماري", placeholder: "عصري، كلاسيك..." },
                { key: "city", label: "المدينة", placeholder: "الرياض، جدة..." },
              ].map(field => (
                <div key={field.key}>
                  <label className="text-xs text-slate-400 mb-1 block">{field.label}</label>
                  <input
                    value={formData[field.key]}
                    onChange={e => setFormData(p => ({ ...p, [field.key]: e.target.value }))}
                    placeholder={field.placeholder}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 outline-none focus:border-blue-500/50"
                  />
                </div>
              ))}
              <Button
                onClick={handleStartFromForm}
                disabled={!formData.landSize}
                className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-0"
              >
                <Sparkles className="w-4 h-4 ml-2" />
                ابدأ التصميم
              </Button>
            </div>
          ) : (
            <Button
              onClick={() => { setChatStarted(false); setStartPrompt(""); }}
              variant="outline"
              className="w-full border-white/10 text-slate-400 hover:text-white"
            >
              تصميم جديد
            </Button>
          )}

          <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
            <p className="text-xs text-slate-400 font-medium mb-3">أمثلة سريعة</p>
            <div className="space-y-2">
              {quickInputs.map((q, i) => (
                <button
                  key={i}
                  onClick={() => { setStartPrompt(q.prompt); setChatStarted(true); }}
                  className="w-full text-right text-xs text-slate-400 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-all border border-transparent hover:border-white/10 leading-relaxed"
                >
                  <span className="text-blue-400 font-medium">{q.label}: </span>{q.prompt}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Chat */}
        <div className="flex-1 min-h-0">
          <AIChat
            agentId="architect"
            agentName="المهندس المعماري الذكي"
            agentIcon={<DraftingCompass className="w-5 h-5" />}
            agentColor="from-blue-500 to-cyan-500"
            systemPrompt={SYSTEM_PROMPT}
            placeholder="صف مشروعك المعماري... حجم الأرض، الطوابق، المتطلبات"
            allowImages={true}
            initialMessage={chatStarted && startPrompt ? startPrompt : undefined}
          />
        </div>
      </div>
    </div>
  );
}