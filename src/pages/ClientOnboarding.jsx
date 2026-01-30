import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "../utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronRight, CheckCircle2, Loader2, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const OnboardingSteps = [
  { id: 1, title: "معلومات المشروع", description: "أخبرنا عن مشروعك" },
  { id: 2, title: "المتطلبات", description: "حدد احتياجاتك بالتفصيل" },
  { id: 3, title: "اقتراح المهندسين", description: "نقترح عليك أفضل المهندسين" },
  { id: 4, title: "الاختيار", description: "اختر المهندس المناسب" },
  { id: 5, title: "إنشاء المشروع", description: "أنشئ المشروع وابدأ العمل" }
];

export default function ClientOnboarding() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [suggestedEngineers, setSuggestedEngineers] = useState([]);
  const [selectedEngineer, setSelectedEngineer] = useState(null);

  // Form data
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    budget_min: "",
    budget_max: "",
    timeline_days: "",
    location: "",
    requirements: ""
  });

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const userData = await base44.auth.me();
        setUser(userData);
      } catch {
        navigate(createPageUrl("Home"));
      }
    };
    checkAuth();
  }, [navigate]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const analyzeNeeds = async () => {
    setLoading(true);
    try {
      const response = await base44.functions.invoke("analyzeClientNeeds", {
        client_description: formData.description,
        budget: formData.budget_max,
        timeline: formData.timeline_days
      });

      if (response.data.success) {
        setAnalysis(response.data.analysis);
        setFormData(prev => ({
          ...prev,
          category: response.data.analysis.project_category,
          requirements: response.data.analysis.key_requirements.join(", ")
        }));
        suggestEngineersStep(response.data.analysis);
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const suggestEngineersStep = async (analysisData) => {
    try {
      const response = await base44.functions.invoke("suggestEngineers", {
        category: analysisData.project_category,
        skills_needed: analysisData.skills_needed,
        budget: formData.budget_max,
        timeline: formData.timeline_days,
        location: formData.location
      });

      if (response.data.success) {
        setSuggestedEngineers(response.data.suggestions);
        setCurrentStep(3);
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const createProject = async () => {
    if (!selectedEngineer) {
      alert("يرجى اختيار مهندس");
      return;
    }

    setLoading(true);
    try {
      const project = await base44.entities.Project.create({
        title: formData.title,
        description: formData.description,
        category: formData.category,
        budget: formData.budget_max,
        timeline_days: formData.timeline_days,
        location: formData.location,
        client_email: user.email,
        status: "open",
        lead_engineer_id: selectedEngineer.id
      });

      // Save onboarding flow
      await base44.entities.OnboardingFlow.create({
        client_email: user.email,
        client_name: user.full_name,
        status: "completed",
        project_details: {
          title: formData.title,
          description: formData.description,
          category: formData.category,
          budget_min: formData.budget_min,
          budget_max: formData.budget_max,
          timeline_days: formData.timeline_days,
          location: formData.location
        },
        suggested_engineers: suggestedEngineers,
        selected_engineer_id: selectedEngineer.id,
        created_project_id: project.id,
        completed_at: new Date().toISOString()
      });

      setCurrentStep(5);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return <div className="flex items-center justify-center min-h-screen"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-8" dir="rtl">
      <div className="max-w-2xl mx-auto px-4">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {OnboardingSteps.map((step, idx) => (
              <div key={step.id} className="flex items-center">
                <motion.div
                  animate={{ scale: currentStep >= step.id ? 1.1 : 1 }}
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                    currentStep >= step.id
                      ? "bg-blue-600 text-white"
                      : "bg-gray-300 text-gray-600"
                  }`}
                >
                  {currentStep > step.id ? <CheckCircle2 className="w-5 h-5" /> : step.id}
                </motion.div>
                {idx < OnboardingSteps.length - 1 && (
                  <div className={`h-1 flex-1 mx-2 ${currentStep > step.id ? "bg-blue-600" : "bg-gray-300"}`}></div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <AnimatePresence mode="wait">
          {/* Step 1: Project Info */}
          {currentStep === 1 && (
            <motion.div key="step1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-blue-600" />
                    {OnboardingSteps[0].title}
                  </CardTitle>
                  <CardDescription>{OnboardingSteps[0].description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">عنوان المشروع</label>
                    <Input
                      value={formData.title}
                      onChange={(e) => handleInputChange("title", e.target.value)}
                      placeholder="مثال: تصميم منزل حديث"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">وصف المشروع</label>
                    <Textarea
                      value={formData.description}
                      onChange={(e) => handleInputChange("description", e.target.value)}
                      placeholder="اشرح مشروعك بالتفصيل..."
                      className="mt-1 h-32"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">الميزانية (من)</label>
                      <Input
                        type="number"
                        value={formData.budget_min}
                        onChange={(e) => handleInputChange("budget_min", e.target.value)}
                        placeholder="من"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">الميزانية (إلى)</label>
                      <Input
                        type="number"
                        value={formData.budget_max}
                        onChange={(e) => handleInputChange("budget_max", e.target.value)}
                        placeholder="إلى"
                        className="mt-1"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">الجدول الزمني (أيام)</label>
                      <Input
                        type="number"
                        value={formData.timeline_days}
                        onChange={(e) => handleInputChange("timeline_days", e.target.value)}
                        placeholder="عدد الأيام"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">الموقع</label>
                      <Input
                        value={formData.location}
                        onChange={(e) => handleInputChange("location", e.target.value)}
                        placeholder="الموقع الجغرافي"
                        className="mt-1"
                      />
                    </div>
                  </div>
                  <Button onClick={() => setCurrentStep(2)} className="w-full gap-2">
                    التالي <ChevronRight className="w-4 h-4" />
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Step 2: AI Analysis */}
          {currentStep === 2 && (
            <motion.div key="step2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-blue-600" />
                    تحليل احتياجات مشروعك
                  </CardTitle>
                  <CardDescription>نحلل احتياجاتك باستخدام الذكاء الاصطناعي...</CardDescription>
                </CardHeader>
                <CardContent>
                  {!analysis ? (
                    <Button onClick={analyzeNeeds} disabled={loading} className="w-full gap-2">
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          جاري التحليل...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          حلل احتياجاتي الآن
                        </>
                      )}
                    </Button>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm font-medium mb-2">نوع المشروع:</p>
                        <Badge className="bg-blue-100 text-blue-800">{analysis.project_category}</Badge>
                      </div>
                      <div>
                        <p className="text-sm font-medium mb-2">المهارات المطلوبة:</p>
                        <div className="flex flex-wrap gap-2">
                          {analysis.skills_needed.map((skill, idx) => (
                            <Badge key={idx} variant="outline">{skill}</Badge>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-medium mb-2">الأنماط المقترحة:</p>
                        <div className="flex flex-wrap gap-2">
                          {analysis.recommended_styles.map((style, idx) => (
                            <Badge key={idx} className="bg-green-100 text-green-800">{style}</Badge>
                          ))}
                        </div>
                      </div>
                      <p className="text-sm text-slate-600 p-3 bg-slate-50 rounded">{analysis.summary}</p>
                      <Button onClick={() => setCurrentStep(3)} className="w-full gap-2">
                        عرض المهندسين المقترحين <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Step 3: Engineer Suggestions */}
          {currentStep === 3 && (
            <motion.div key="step3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-blue-600" />
                    المهندسون المقترحون
                  </CardTitle>
                  <CardDescription>اخترنا أفضل المهندسين لمشروعك</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {suggestedEngineers.map((engineer) => (
                    <button
                      key={engineer.id}
                      onClick={() => {
                        setSelectedEngineer(engineer);
                        setCurrentStep(4);
                      }}
                      className={`p-4 border-2 rounded-lg text-right transition-all ${
                        selectedEngineer?.id === engineer.id
                          ? "border-blue-600 bg-blue-50"
                          : "border-gray-200 hover:border-blue-300"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-semibold">{engineer.full_name}</p>
                          <p className="text-sm text-slate-600">{engineer.specialization}</p>
                          <div className="mt-2 flex gap-2 flex-wrap">
                            <Badge className="text-xs bg-yellow-100 text-yellow-800">
                              ⭐ {engineer.rating}/5
                            </Badge>
                            <Badge className="text-xs bg-green-100 text-green-800">
                              {engineer.completed_projects} مشروع
                            </Badge>
                          </div>
                        </div>
                        <Badge className="bg-blue-600 text-white">
                          {Math.round(engineer.match_score)}% تطابق
                        </Badge>
                      </div>
                    </button>
                  ))}
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Step 4: Confirmation */}
          {currentStep === 4 && selectedEngineer && (
            <motion.div key="step4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Card>
                <CardHeader>
                  <CardTitle>تأكيد الاختيار</CardTitle>
                  <CardDescription>تأكد من اختيارك قبل المتابعة</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm font-medium mb-2">المهندس المختار:</p>
                    <p className="text-lg font-bold">{selectedEngineer.full_name}</p>
                    <p className="text-sm text-slate-600">{selectedEngineer.specialization}</p>
                  </div>
                  <Button onClick={createProject} disabled={loading} className="w-full gap-2">
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        جاري الإنشاء...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        إنشاء المشروع
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Step 5: Success */}
          {currentStep === 5 && (
            <motion.div key="step5" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
              <Card className="border-green-200 bg-green-50">
                <CardHeader>
                  <CardTitle className="text-green-700 flex items-center gap-2">
                    <CheckCircle2 className="w-6 h-6" />
                    تم إنشاء المشروع بنجاح!
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-slate-700">
                    تم ربطك بـ <span className="font-bold">{selectedEngineer?.full_name}</span> وسيتواصل معك قريباً لبدء العمل.
                  </p>
                  <Button
                    onClick={() => navigate(createPageUrl("Dashboard"))}
                    className="w-full"
                  >
                    انتقل إلى لوحة التحكم
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}