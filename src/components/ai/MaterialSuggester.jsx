import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import {
  Layers, Sparkles, Loader2, Upload, X, ExternalLink,
  MapPin, ShoppingBag, Star, ChevronDown, ChevronUp, Package
} from "lucide-react";
import { Button } from "@/components/ui/button";

const MATERIAL_PROMPT = `أنت خبير مواد بناء وتشطيب في السوق السعودي. بناءً على الصورة أو الوصف المقدم، قدم اقتراحات خامات حقيقية ومحددة.

لكل خامة مقترحة، قدم بالضبط هذا التنسيق JSON:
{
  "materials": [
    {
      "category": "فئة الخامة (أرضيات/دهانات/رخام/خشب/بلاط/إضاءة)",
      "name": "اسم الخامة المحدد",
      "brand": "اسم الماركة أو المنتج المحدد",
      "description": "وصف مختصر (جملتين)",
      "color": "اللون/الصبغة المقترحة",
      "price_range": "نطاق السعر بالريال (م² أو الوحدة)",
      "quality": "اقتصادي/متوسط/فاخر",
      "durability": "عدد السنوات المتوقعة",
      "availability": [
        {
          "store": "اسم المتجر",
          "city": "المدينة",
          "address": "العنوان التقريبي",
          "phone": "رقم الهاتف إن وجد"
        }
      ],
      "sample_url": "رابط لطلب عينة أو صفحة المنتج (URL حقيقي إن وجد، وإلا null)",
      "why_recommended": "سبب اقتراح هذه الخامة بجملة واحدة",
      "maintenance_level": "منخفض/متوسط/عالي"
    }
  ]
}

أقترح 4-6 خامات مناسبة للتصميم. ركز على ماركات متوفرة فعلاً في السوق السعودي مثل:
- أرضيات: Porcelanosa، RAK Ceramics، Vivo Ceramics، Euro Ceramica
- دهانات: Jotun، Dulux، Caparol، Sigma
- رخام: الرخام السعودي، Marmi Max، القصيم للرخام
- أخشاب: IKEA، Pan Emirates، مكتبة جرير
- سيراميك: Kajaria، RAK، Somany
المتاجر: هوم سنتر، داني ديكور، بان إيميريتس، مجموعة الصويدان، أبيات.`;

const qualityColors = {
  "اقتصادي": "bg-green-500/20 text-green-400 border-green-500/30",
  "متوسط": "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  "فاخر": "bg-purple-500/20 text-purple-400 border-purple-500/30",
};

const maintenanceColors = {
  "منخفض": "text-green-400",
  "متوسط": "text-yellow-400",
  "عالي": "text-red-400",
};

const categoryIcons = {
  "أرضيات": "🏠", "دهانات": "🎨", "رخام": "💎", "خشب": "🌳",
  "بلاط": "⬛", "إضاءة": "💡", "default": "🧱"
};

function MaterialCard({ material, index }) {
  const [expanded, setExpanded] = useState(false);
  const icon = categoryIcons[material.category] || categoryIcons.default;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:border-yellow-500/30 transition-all"
    >
      {/* Header */}
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-yellow-500/10 border border-yellow-500/20 rounded-xl flex items-center justify-center text-xl flex-shrink-0">
            {icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-white font-semibold text-sm">{material.name}</span>
              {material.quality && (
                <span className={`text-xs px-2 py-0.5 rounded-full border ${qualityColors[material.quality] || qualityColors["متوسط"]}`}>
                  {material.quality}
                </span>
              )}
            </div>
            <div className="text-yellow-400/80 text-xs mt-0.5">{material.brand}</div>
            {material.color && (
              <div className="text-slate-400 text-xs mt-0.5">اللون: {material.color}</div>
            )}
          </div>
          <div className="text-right flex-shrink-0">
            <div className="text-yellow-400 text-sm font-bold">{material.price_range}</div>
            <div className="text-slate-500 text-xs">{material.durability} سنة</div>
          </div>
        </div>

        <p className="text-slate-300 text-xs mt-3 leading-relaxed">{material.description}</p>

        {material.why_recommended && (
          <div className="mt-2 flex items-start gap-1.5">
            <Star className="w-3.5 h-3.5 text-yellow-400 flex-shrink-0 mt-0.5" />
            <p className="text-yellow-400/70 text-xs">{material.why_recommended}</p>
          </div>
        )}

        {material.maintenance_level && (
          <div className="mt-2 text-xs text-slate-500">
            صيانة: <span className={maintenanceColors[material.maintenance_level] || "text-slate-400"}>
              {material.maintenance_level}
            </span>
          </div>
        )}
      </div>

      {/* Action bar */}
      <div className="px-4 pb-3 flex items-center gap-2 flex-wrap">
        {material.sample_url && (
          <a
            href={material.sample_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/20 px-3 py-1.5 rounded-lg transition-all"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            طلب عينة
            <ExternalLink className="w-3 h-3" />
          </a>
        )}
        {material.availability?.length > 0 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1.5 text-xs bg-blue-500/10 border border-blue-500/30 text-blue-400 hover:bg-blue-500/20 px-3 py-1.5 rounded-lg transition-all"
          >
            <MapPin className="w-3.5 h-3.5" />
            {material.availability.length} متجر
            {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        )}
      </div>

      {/* Availability dropdown */}
      <AnimatePresence>
        {expanded && material.availability?.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-white/10 overflow-hidden"
          >
            <div className="p-4 space-y-2">
              <p className="text-xs text-slate-500 mb-2">أماكن التوفر في السوق المحلي:</p>
              {material.availability.map((store, j) => (
                <div key={j} className="flex items-start gap-2 bg-white/5 rounded-xl p-3">
                  <MapPin className="w-3.5 h-3.5 text-blue-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="text-white text-xs font-medium">{store.store}</div>
                    <div className="text-slate-400 text-xs">{store.city}{store.address ? ` — ${store.address}` : ""}</div>
                    {store.phone && <div className="text-blue-400 text-xs">{store.phone}</div>}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function MaterialSuggester({ designImageUrl = null }) {
  const [loading, setLoading] = useState(false);
  const [materials, setMaterials] = useState([]);
  const [error, setError] = useState(null);
  const [uploadedPreview, setUploadedPreview] = useState(null);
  const [uploadedUrl, setUploadedUrl] = useState(designImageUrl);
  const [customPrompt, setCustomPrompt] = useState("");
  const [hasResults, setHasResults] = useState(false);
  const fileInputRef = React.useRef(null);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setUploadedPreview(ev.target.result);
    reader.readAsDataURL(file);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setUploadedUrl(file_url);
  };

  const analyzeMaterials = async () => {
    setLoading(true);
    setError(null);

    const userDesc = customPrompt || "التصميم المرفق";
    const prompt = `${MATERIAL_PROMPT}

المستخدم طلب: ${userDesc}
${uploadedUrl ? "تم إرفاق صورة التصميم للتحليل." : ""}

قدم الإجابة كـ JSON خالص بدون أي نص إضافي.`;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt,
      file_urls: uploadedUrl ? [uploadedUrl] : undefined,
      response_json_schema: {
        type: "object",
        properties: {
          materials: {
            type: "array",
            items: {
              type: "object",
              properties: {
                category: { type: "string" },
                name: { type: "string" },
                brand: { type: "string" },
                description: { type: "string" },
                color: { type: "string" },
                price_range: { type: "string" },
                quality: { type: "string" },
                durability: { type: "string" },
                availability: { type: "array", items: { type: "object" } },
                sample_url: { type: "string" },
                why_recommended: { type: "string" },
                maintenance_level: { type: "string" }
              }
            }
          }
        }
      }
    });

    const parsed = typeof result === "string" ? JSON.parse(result) : result;
    setMaterials(parsed?.materials || []);
    setHasResults(true);
    setLoading(false);
  };

  return (
    <div className="bg-slate-900/80 border border-yellow-500/20 rounded-2xl overflow-hidden" dir="rtl">
      {/* Header */}
      <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/10 border-b border-yellow-500/20 px-5 py-4 flex items-center gap-3">
        <div className="w-9 h-9 bg-yellow-500/20 rounded-xl flex items-center justify-center">
          <Package className="w-5 h-5 text-yellow-400" />
        </div>
        <div>
          <div className="text-white font-bold text-sm">اقتراح الخامات الذكي</div>
          <div className="text-yellow-400/70 text-xs">سيراميك • رخام • طلاء • خشب — مع أماكن التوفر</div>
        </div>
        <Sparkles className="w-4 h-4 text-yellow-400 mr-auto animate-pulse" />
      </div>

      <div className="p-5 space-y-4">
        {/* Upload / Image preview */}
        {!designImageUrl && (
          <div>
            {uploadedPreview ? (
              <div className="relative inline-block">
                <img src={uploadedPreview} alt="design" className="h-28 w-48 object-cover rounded-xl border border-white/20" />
                <button
                  onClick={() => { setUploadedPreview(null); setUploadedUrl(null); }}
                  className="absolute -top-2 -left-2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center"
                >
                  <X className="w-3 h-3 text-white" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full border-2 border-dashed border-white/20 hover:border-yellow-500/40 rounded-xl p-5 flex flex-col items-center gap-2 transition-all group"
              >
                <Upload className="w-6 h-6 text-slate-500 group-hover:text-yellow-400 transition-colors" />
                <span className="text-sm text-slate-400 group-hover:text-slate-300">ارفع صورة التصميم (اختياري)</span>
              </button>
            )}
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
          </div>
        )}

        {designImageUrl && (
          <div className="flex items-center gap-2 text-xs text-green-400 bg-green-500/10 rounded-xl px-3 py-2 border border-green-500/20">
            <Layers className="w-3.5 h-3.5" />
            سيتم تحليل التصميم المولد لاقتراح الخامات المناسبة
          </div>
        )}

        {/* Custom description */}
        <textarea
          value={customPrompt}
          onChange={e => setCustomPrompt(e.target.value)}
          placeholder="أضف وصفاً (اختياري): مثال — غرفة معيشة عصرية بألوان داكنة، ميزانية متوسطة..."
          className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white placeholder-slate-500 resize-none outline-none focus:border-yellow-500/40 transition-colors"
          rows={2}
        />

        <Button
          onClick={analyzeMaterials}
          disabled={loading || (!uploadedUrl && !customPrompt.trim())}
          className="w-full bg-gradient-to-r from-yellow-500 to-orange-400 text-white border-0 rounded-xl h-11 font-medium hover:opacity-90"
        >
          {loading ? (
            <><Loader2 className="w-4 h-4 animate-spin" />جاري تحليل التصميم واقتراح الخامات...</>
          ) : (
            <><Sparkles className="w-4 h-4" />اقترح خامات مناسبة للتصميم</>
          )}
        </Button>

        {/* Results */}
        <AnimatePresence>
          {hasResults && materials.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-3 mt-2"
            >
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Layers className="w-3.5 h-3.5 text-yellow-400" />
                <span>{materials.length} خامة مقترحة بناءً على التصميم</span>
              </div>
              {materials.map((mat, i) => (
                <MaterialCard key={i} material={mat} index={i} />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {hasResults && materials.length === 0 && !loading && (
          <div className="text-center text-slate-500 text-sm py-4">
            لم يتم العثور على اقتراحات. حاول إضافة وصف أكثر تفصيلاً.
          </div>
        )}
      </div>
    </div>
  );
}