import React, { useState } from "react";
import { Wrench, ArrowRight, Upload, ImageIcon } from "lucide-react";
import { Link } from "react-router-dom";
import AIChat from "@/components/ai/AIChat";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";

const SYSTEM_PROMPT = `أنت خبير تجديد وتحسين المنازل من فريق Bytly AI Engineers.
تخصصك: تحليل صور الغرف والمنازل واقتراح التجديدات والتحسينات.

عند تلقي صورة أو وصف للفراغ، قدم:
1. **تحليل الوضع الحالي**: نقاط القوة والضعف في التصميم الحالي
2. **أفكار التجديد**: أهم 5 تحسينات مقترحة مع أولوياتها
3. **تحسين التخطيط**: كيفية إعادة ترتيب الأثاث أو الفراغات
4. **الجدران والأرضيات**: اقتراحات الألوان والمواد البديلة
5. **الإضاءة**: تحسين مصادر الإضاءة
6. **الأثاث والديكور**: قطع يمكن استبدالها أو إضافتها
7. **تقدير التكلفة التقريبية**: رخيص / متوسط / فاخر
8. **مفهوم قبل وبعد**: وصف للحالة المتوقعة بعد التجديد

تحدث مع المستخدم بشكل تحفيزي وعملي. أعطِ أولوية للتحسينات ذات التأثير الأكبر بأقل تكلفة.
⚠️ نبّه بأن الأعمال الهيكلية تتطلب مهندساً مرخصاً.`;

export default function AIRenovation() {
  const [uploadedImages, setUploadedImages] = useState([]);
  const [uploading, setUploading] = useState(false);

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files).slice(0, 3);
    setUploading(true);
    const results = [];
    for (const file of files) {
      const reader = new FileReader();
      await new Promise(resolve => { reader.onload = resolve; reader.readAsDataURL(file); });
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      results.push({ preview: reader.result, url: file_url, name: file.name });
    }
    setUploadedImages(prev => [...prev, ...results].slice(0, 3));
    setUploading(false);
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
            <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-amber-500 rounded-lg flex items-center justify-center">
              <Wrench className="w-4 h-4 text-white" />
            </div>
            <span className="text-white font-bold">مساعد التجديد الذكي</span>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 flex flex-col lg:flex-row gap-6" style={{ height: "calc(100vh - 65px)" }}>
        {/* Left */}
        <div className="lg:w-72 flex-shrink-0 space-y-4 overflow-y-auto">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Upload className="w-4 h-4 text-orange-400" />
              <span className="text-white font-medium text-sm">ارفع صور غرفتك</span>
            </div>

            <label className="block cursor-pointer">
              <div className="border-2 border-dashed border-white/20 rounded-xl p-6 text-center hover:border-orange-500/50 transition-colors">
                <ImageIcon className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                <p className="text-sm text-slate-400 mb-1">اسحب وأفلت أو انقر</p>
                <p className="text-xs text-slate-500">حتى 3 صور</p>
              </div>
              <input type="file" multiple accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploading} />
            </label>

            {uploading && <p className="text-xs text-orange-400 text-center mt-2 animate-pulse">جاري رفع الصور...</p>}

            {uploadedImages.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mt-3">
                {uploadedImages.map((img, i) => (
                  <div key={i} className="relative">
                    <img src={img.preview} alt="" className="w-full h-20 object-cover rounded-lg border border-white/10" />
                    <button
                      onClick={() => setUploadedImages(prev => prev.filter((_, j) => j !== i))}
                      className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-white text-xs flex items-center justify-center"
                    >×</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-orange-500/5 border border-orange-500/20 rounded-2xl p-4">
            <p className="text-xs text-orange-400/80 leading-relaxed">
              💡 <strong>أفضل النتائج:</strong> ارفع صوراً واضحة من زوايا مختلفة للغرفة، وأخبرنا عن ميزانيتك المتاحة للتجديد.
            </p>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
            <p className="text-xs text-slate-400 font-medium mb-2">أمثلة سريعة</p>
            {[
              "غرفة معيشة قديمة الطراز، ميزانية 30,000 ريال",
              "مطبخ يحتاج تجديد كامل، أرضيات بلاط قديمة",
              "حمام صغير لجعله يبدو أكبر وأفخم",
            ].map((p, i) => (
              <div key={i} className="text-xs text-slate-400 hover:text-white cursor-pointer p-2 hover:bg-white/10 rounded-lg transition-all mb-1">{p}</div>
            ))}
          </div>
        </div>

        {/* Chat */}
        <div className="flex-1 min-h-0">
          <AIChat
            agentId="renovation"
            agentName="مساعد التجديد الذكي"
            agentIcon={<Wrench className="w-5 h-5" />}
            agentColor="from-orange-500 to-amber-500"
            systemPrompt={SYSTEM_PROMPT}
            placeholder="صف الغرفة أو ارفع صورتها... سيتم توليد تصاميم تجديد تلقائياً"
            allowImages={true}
            enableImageGeneration={true}
            initialMessage={`مرحباً! أنا مساعد التجديد الذكي من Bytly AI 🔧\n\nأستطيع **توليد صور التجديد** تلقائياً:\n• 📸 ارفع صورة غرفتك الحالية للتحليل\n• 🖼️ سيتم توليد 4 تصاميم تجديد مقترحة\n• 💡 نصائح تحسين بأقل تكلفة\n\n**ارفع صورة غرفتك** أو صفها وسأولّد لك تصاميم التجديد!`}
          />
        </div>
      </div>
    </div>
  );
}