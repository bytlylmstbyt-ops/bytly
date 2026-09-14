import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Sparkles, ArrowRight, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function AIProjectAssistant({ onComplete, initialData = {} }) {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [projectData, setProjectData] = useState({
    type: initialData.category || "",
    scope: "",
    requirements: "",
    budget_min: initialData.budget_min || "",
    budget_max: initialData.budget_max || "",
    timeline: "",
    location: initialData.location || "",
    ...initialData
  });
  const [generatedBrief, setGeneratedBrief] = useState("");
  const [suggestedEngineers, setSuggestedEngineers] = useState([]);

  const questions = [
    {
      id: "type",
      title: "ما نوع المشروع؟",
      type: "select",
      options: [
        { value: "interior", label: "تصميم داخلي" },
        { value: "architecture", label: "تصميم معماري" },
        { value: "structural", label: "تصميم إنشائي" },
        { value: "landscape", label: "تنسيق حدائق" },
        { value: "furniture", label: "تصميم أثاث" },
        { value: "lighting", label: "تصميم إضاءة" }
      ]
    },
    {
      id: "scope",
      title: "ما هو نطاق العمل المطلوب؟",
      subtitle: "مثال: تصميم فيلا من دورين، مساحة 400 متر مربع",
      type: "textarea",
      placeholder: "اشرح التفاصيل الأساسية للمشروع..."
    },
    {
      id: "requirements",
      title: "ما هي متطلباتك الخاصة؟",
      subtitle: "مثال: غرف نوم (5)، مجالس، حمامات، مطبخ، حديقة",
      type: "textarea",
      placeholder: "اذكر المتطلبات والمواصفات المطلوبة..."
    },
    {
      id: "budget",
      title: "ما هو نطاق الميزانية؟",
      type: "budget",
      fields: ["budget_min", "budget_max"]
    },
    {
      id: "timeline",
      title: "ما هو الإطار الزمني المتوقع؟",
      subtitle: "متى تريد إنجاز المشروع؟",
      type: "textarea",
      placeholder: "مثال: خلال شهرين، أو قبل نهاية السنة..."
    }
  ];

  const handleNext = () => {
    if (step < questions.length - 1) {
      setStep(step + 1);
    } else {
      generateProjectBrief();
    }
  };

  const handleBack = () => {
    if (step > 0) setStep(step - 1);
  };

  const updateField = (field, value) => {
    setProjectData(prev => ({ ...prev, [field]: value }));
  };

  const generateProjectBrief = async () => {
    setLoading(true);
    try {
      const prompt = `أنت مستشار هندسي محترف في منصة بيتلي. قم بإنشاء وصف تفصيلي واحترافي لمشروع بناءً على المعلومات التالية:

نوع المشروع: ${projectData.type}
نطاق العمل: ${projectData.scope}
المتطلبات: ${projectData.requirements}
الميزانية: ${projectData.budget_min} - ${projectData.budget_max} ريال
الإطار الزمني: ${projectData.timeline}
${projectData.location ? `الموقع: ${projectData.location}` : ''}

المطلوب:
1. عنوان جذاب ومختصر للمشروع
2. وصف تفصيلي احترافي يشمل:
   - نطاق العمل والمتطلبات
   - المواصفات الفنية المتوقعة
   - التسليمات المطلوبة (مخططات، رسومات، إلخ)
   - أي تفاصيل إضافية مهمة

الرد يجب أن يكون بالصيغة التالية فقط:
العنوان: [العنوان هنا]
---
الوصف:
[الوصف التفصيلي هنا]`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: prompt,
        add_context_from_internet: false
      });

      const [titlePart, ...descParts] = result.split('---');
      const title = titlePart.replace('العنوان:', '').trim();
      const description = descParts.join('---').replace('الوصف:', '').trim();

      setGeneratedBrief({ title, description });

      // Now suggest engineers
      await suggestEngineers(description);

    } catch (error) {
      console.error('Error generating brief:', error);
      alert('حدث خطأ في توليد الوصف. يرجى المحاولة مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };

  const suggestEngineers = async (projectDescription) => {
    try {
      const allEngineers = await base44.entities.Engineer.filter({ 
        status: "approved",
        is_verified: true 
      });

      const prompt = `أنت خبير في مطابقة المشاريع مع المهندسين المناسبين.

وصف المشروع:
${projectDescription}

نوع المشروع: ${projectData.type}

قائمة المهندسين المتاحين:
${allEngineers.map((e, i) => `
${i + 1}. الاسم: ${e.full_name}
   التخصص: ${e.specialization || e.user_type}
   الخبرة: ${e.years_experience} سنوات
   التقييم: ${e.rating || 'جديد'}
   المشاريع المكتملة: ${e.completed_projects || 0}
`).join('\n')}

المطلوب: اختر أفضل 3 مهندسين من القائمة أعلاه الأكثر ملاءمة لهذا المشروع.
أرجع الرد كـ JSON بهذا الشكل فقط (أرقام المهندسين من القائمة):
{"engineers": [1, 3, 5]}`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: prompt,
        response_json_schema: {
          type: "object",
          properties: {
            engineers: {
              type: "array",
              items: { type: "number" }
            }
          }
        }
      });

      const selectedIndices = result.engineers || [];
      const selected = selectedIndices
        .map(idx => allEngineers[idx - 1])
        .filter(Boolean)
        .slice(0, 3);

      setSuggestedEngineers(selected);

    } catch (error) {
      console.error('Error suggesting engineers:', error);
    }
  };

  const handleComplete = () => {
    onComplete({
      ...projectData,
      title: generatedBrief.title,
      description: generatedBrief.description,
      suggestedEngineers
    });
  };

  const currentQuestion = questions[step];
  const canProceed = currentQuestion ? 
    (currentQuestion.type === 'budget' ? 
      projectData.budget_min && projectData.budget_max : 
      projectData[currentQuestion.id]) : 
    false;

  if (generatedBrief) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <Card className="border-green-200 bg-green-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-900">
              <Check className="w-5 h-5" />
              تم إنشاء وصف المشروع بنجاح
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold text-lg mb-2">{generatedBrief.title}</h3>
              <p className="text-slate-700 whitespace-pre-wrap">{generatedBrief.description}</p>
            </div>

            {suggestedEngineers.length > 0 && (
              <div className="border-t pt-4">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  مهندسون مقترحون لمشروعك
                </h4>
                <div className="grid gap-3">
                  {suggestedEngineers.map((eng) => (
                    <div 
                      key={eng.id}
                      className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-200 hover:border-amber-300 transition-colors"
                    >
                      <div>
                        <p className="font-medium text-slate-900">{eng.full_name}</p>
                        <p className="text-sm text-slate-600">{eng.specialization || eng.user_type}</p>
                        <p className="text-xs text-slate-500">
                          {eng.years_experience} سنوات خبرة • {eng.completed_projects || 0} مشروع
                        </p>
                      </div>
                      {eng.rating > 0 && (
                        <div className="text-amber-600 font-semibold">
                          ⭐ {eng.rating.toFixed(1)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button
                onClick={() => {
                  setGeneratedBrief("");
                  setStep(0);
                }}
                variant="outline"
                className="flex-1"
              >
                إعادة المحاولة
              </Button>
              <Button
                onClick={handleComplete}
                className="flex-1 bg-gradient-to-r from-[#6B5D4F] to-[#C9A66B]"
              >
                استخدام هذا الوصف
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Progress */}
      <div className="flex items-center gap-2">
        {questions.map((_, idx) => (
          <div
            key={idx}
            className={`h-2 flex-1 rounded-full transition-colors ${
              idx <= step ? 'bg-gradient-to-r from-[#6B5D4F] to-[#C9A66B]' : 'bg-slate-200'
            }`}
          />
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" />
                {currentQuestion.title}
              </CardTitle>
              {currentQuestion.subtitle && (
                <p className="text-sm text-slate-600 mt-2">{currentQuestion.subtitle}</p>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              {currentQuestion.type === 'select' && (
                <Select
                  value={projectData[currentQuestion.id]}
                  onValueChange={(value) => updateField(currentQuestion.id, value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر نوع المشروع" />
                  </SelectTrigger>
                  <SelectContent>
                    {currentQuestion.options.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {currentQuestion.type === 'textarea' && (
                <Textarea
                  value={projectData[currentQuestion.id] || ""}
                  onChange={(e) => updateField(currentQuestion.id, e.target.value)}
                  placeholder={currentQuestion.placeholder}
                  rows={5}
                  className="resize-none"
                />
              )}

              {currentQuestion.type === 'budget' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-slate-600 mb-2 block">الحد الأدنى</label>
                    <Input
                      type="number"
                      value={projectData.budget_min}
                      onChange={(e) => updateField('budget_min', e.target.value)}
                      placeholder="مثال: 5000"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-slate-600 mb-2 block">الحد الأقصى</label>
                    <Input
                      type="number"
                      value={projectData.budget_max}
                      onChange={(e) => updateField('budget_max', e.target.value)}
                      placeholder="مثال: 15000"
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <Button
                  onClick={handleBack}
                  disabled={step === 0}
                  variant="outline"
                >
                  السابق
                </Button>
                <Button
                  onClick={handleNext}
                  disabled={!canProceed || loading}
                  className="flex-1 bg-gradient-to-r from-[#6B5D4F] to-[#C9A66B]"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                      جاري التوليد...
                    </>
                  ) : step === questions.length - 1 ? (
                    <>
                      <Sparkles className="w-4 h-4 ml-2" />
                      توليد الوصف
                    </>
                  ) : (
                    <>
                      التالي
                      <ArrowRight className="w-4 h-4 mr-2" />
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}