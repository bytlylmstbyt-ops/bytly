import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload, X, FileText, CheckCircle, ArrowRight, ArrowLeft,
  Building2, MapPin, DollarSign, Calendar, Users, Paperclip,
  Send, Star, AlertCircle, Image, File
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import MobileSelect from "@/components/mobile/MobileSelect";

const PROJECT_TYPES = [
  { value: "residential", label: "سكني", icon: "🏠" },
  { value: "commercial", label: "تجاري", icon: "🏢" },
  { value: "industrial", label: "صناعي", icon: "🏭" },
  { value: "renovation", label: "تجديد وترميم", icon: "🔧" },
  { value: "interior", label: "تصميم داخلي", icon: "🛋️" },
  { value: "landscape", label: "تنسيق الحدائق", icon: "🌿" },
  { value: "other", label: "أخرى", icon: "📋" }
];

const BUDGET_RANGES = [
  { value: "under_100k", label: "أقل من 100,000 ريال" },
  { value: "100k_300k", label: "100,000 - 300,000 ريال" },
  { value: "300k_500k", label: "300,000 - 500,000 ريال" },
  { value: "500k_1m", label: "500,000 - 1,000,000 ريال" },
  { value: "over_1m", label: "أكثر من 1,000,000 ريال" }
];

const STEPS = [
  { id: 1, title: "نوع المشروع", icon: Building2 },
  { id: 2, title: "تفاصيل المشروع", icon: FileText },
  { id: 3, title: "رفع المخططات", icon: Upload },
  { id: 4, title: "معلومات التواصل", icon: Users }
];

export default function RequestQuote() {
  const urlParams = new URLSearchParams(window.location.search);
  const engineerId = urlParams.get("engineer");
  const engineerName = urlParams.get("name");

  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [currentClient, setCurrentClient] = useState(null);

  const [form, setForm] = useState({
    project_title: "",
    project_type: "",
    project_description: "",
    location: "",
    land_area: "",
    floors_count: "",
    budget_range: "",
    timeline: "",
    special_requirements: "",
    client_name: "",
    client_email: "",
    client_phone: "",
    engineering_files: [],
    file_names: [],
    target_engineer_id: engineerId || "",
    target_engineer_name: engineerName || ""
  });

  useEffect(() => {
    const loadClient = async () => {
      const user = await base44.auth.me();
      if (user) {
        const clients = await base44.entities.Client.filter({ email: user.email });
        if (clients.length > 0) {
          setCurrentClient(clients[0]);
          setForm(prev => ({
            ...prev,
            client_name: clients[0].full_name || "",
            client_email: clients[0].email || user.email || "",
            client_phone: clients[0].phone || ""
          }));
        } else {
          setForm(prev => ({
            ...prev,
            client_email: user.email || "",
            client_name: user.full_name || ""
          }));
        }
      }
    };
    loadClient();
  }, []);

  const update = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleFileUpload = async (files) => {
    if (!files || files.length === 0) return;
    setUploadingFiles(true);
    const urls = [...form.engineering_files];
    const names = [...form.file_names];

    for (const file of Array.from(files)) {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      urls.push(file_url);
      names.push(file.name);
    }

    setForm(prev => ({ ...prev, engineering_files: urls, file_names: names }));
    setUploadingFiles(false);
  };

  const removeFile = (index) => {
    const urls = [...form.engineering_files];
    const names = [...form.file_names];
    urls.splice(index, 1);
    names.splice(index, 1);
    setForm(prev => ({ ...prev, engineering_files: urls, file_names: names }));
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFileUpload(e.dataTransfer.files);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    await base44.entities.QuoteRequest.create({
      ...form,
      land_area: form.land_area ? Number(form.land_area) : undefined,
      floors_count: form.floors_count ? Number(form.floors_count) : undefined,
      client_id: currentClient?.id || "",
      status: "pending"
    });

    // Notify engineer if targeted
    if (form.target_engineer_id) {
      const engineers = await base44.entities.Engineer.filter({ id: form.target_engineer_id });
      if (engineers.length > 0 && engineers[0].email) {
        await base44.integrations.Core.SendEmail({
          to: engineers[0].email,
          subject: `طلب عرض سعر جديد: ${form.project_title}`,
          body: `
            <div dir="rtl" style="font-family: Arial; max-width: 600px; margin: auto;">
              <h2 style="color: #C9A66B;">طلب عرض سعر جديد</h2>
              <p>مرحباً ${engineers[0].full_name}،</p>
              <p>لديك طلب عرض سعر جديد من <strong>${form.client_name}</strong></p>
              <table style="width:100%; border-collapse:collapse;">
                <tr><td style="padding:8px; border:1px solid #ddd;"><strong>المشروع</strong></td><td style="padding:8px; border:1px solid #ddd;">${form.project_title}</td></tr>
                <tr><td style="padding:8px; border:1px solid #ddd;"><strong>الموقع</strong></td><td style="padding:8px; border:1px solid #ddd;">${form.location || "غير محدد"}</td></tr>
                <tr><td style="padding:8px; border:1px solid #ddd;"><strong>الميزانية</strong></td><td style="padding:8px; border:1px solid #ddd;">${BUDGET_RANGES.find(b => b.value === form.budget_range)?.label || "غير محدد"}</td></tr>
                <tr><td style="padding:8px; border:1px solid #ddd;"><strong>التواصل</strong></td><td style="padding:8px; border:1px solid #ddd;">${form.client_email} | ${form.client_phone}</td></tr>
              </table>
              <p style="margin-top:16px;">يرجى مراجعة لوحة التحكم للاطلاع على المخططات والتفاصيل الكاملة.</p>
            </div>
          `
        });
      }
    }

    setIsSubmitting(false);
    setIsSubmitted(true);
  };

  const canProceed = () => {
    if (currentStep === 1) return !!form.project_type;
    if (currentStep === 2) return form.project_title.length > 2 && !!form.location;
    if (currentStep === 3) return true;
    if (currentStep === 4) return form.client_name.length > 1 && form.client_email.includes("@");
    return true;
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-amber-50/30 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md"
        >
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          <h2 className="text-3xl font-bold text-[#1a1a2e] mb-3">تم إرسال طلبك بنجاح!</h2>
          <p className="text-slate-600 mb-2">سيتواصل معك المهندس قريباً بعرض السعر المناسب.</p>
          <p className="text-slate-500 text-sm mb-8">يمكنك متابعة طلبك من لوحة التحكم الخاصة بك.</p>
          <div className="flex gap-3 justify-center">
            <Link to={createPageUrl("Dashboard")}>
              <Button className="bg-gradient-to-r from-[#6B5D4F] to-[#C9A66B] text-white">
                لوحة التحكم
              </Button>
            </Link>
            <Link to={createPageUrl("Engineers")}>
              <Button variant="outline">تصفح المهندسين</Button>
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-amber-50/30" dir="rtl">
      <div className="max-w-3xl mx-auto px-4 py-10">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[#1a1a2e] mb-2">طلب عرض سعر</h1>
          <p className="text-slate-500">
            {form.target_engineer_name
              ? `إرسال طلب إلى: ${form.target_engineer_name}`
              : "أرسل تفاصيل مشروعك واحصل على تقدير دقيق من المهندسين"}
          </p>
        </motion.div>

        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            {STEPS.map((step, i) => (
              <div key={step.id} className="flex items-center">
                <div className={`flex flex-col items-center gap-1 ${i < STEPS.length - 1 ? "flex-1" : ""}`}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                    currentStep > step.id ? "bg-green-500 text-white" :
                    currentStep === step.id ? "bg-[#C9A66B] text-white" :
                    "bg-slate-200 text-slate-500"
                  }`}>
                    {currentStep > step.id ? <CheckCircle className="w-5 h-5" /> : step.id}
                  </div>
                  <span className={`text-xs hidden sm:block ${currentStep === step.id ? "text-[#C9A66B] font-medium" : "text-slate-400"}`}>
                    {step.title}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`h-0.5 flex-1 mx-2 transition-all ${currentStep > step.id ? "bg-green-400" : "bg-slate-200"}`} />
                )}
              </div>
            ))}
          </div>
          <Progress value={(currentStep / STEPS.length) * 100} className="h-1.5" />
        </div>

        {/* Step Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.2 }}
          >
            <Card className="border-0 shadow-xl">
              <CardContent className="p-6 md:p-8">

                {/* Step 1: Project Type */}
                {currentStep === 1 && (
                  <div>
                    <h2 className="text-xl font-bold mb-2">ما نوع مشروعك؟</h2>
                    <p className="text-slate-500 text-sm mb-6">اختر التصنيف الأنسب لمشروعك</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {PROJECT_TYPES.map(pt => (
                        <button
                          key={pt.value}
                          onClick={() => update("project_type", pt.value)}
                          className={`p-4 rounded-xl border-2 text-center transition-all hover:border-[#C9A66B] ${
                            form.project_type === pt.value
                              ? "border-[#C9A66B] bg-amber-50 shadow-md"
                              : "border-slate-200 bg-white"
                          }`}
                        >
                          <div className="text-3xl mb-2">{pt.icon}</div>
                          <div className="text-sm font-medium text-[#1a1a2e]">{pt.label}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Step 2: Project Details */}
                {currentStep === 2 && (
                  <div className="space-y-5">
                    <h2 className="text-xl font-bold mb-2">تفاصيل المشروع</h2>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">عنوان المشروع *</label>
                      <input
                        type="text"
                        value={form.project_title}
                        onChange={e => update("project_title", e.target.value)}
                        placeholder="مثال: فيلا سكنية في الرياض"
                        className="w-full border border-slate-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#C9A66B] text-right"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">وصف المشروع</label>
                      <textarea
                        value={form.project_description}
                        onChange={e => update("project_description", e.target.value)}
                        placeholder="اشرح تفاصيل مشروعك، متطلباتك، وأي معلومات إضافية مفيدة..."
                        rows={4}
                        className="w-full border border-slate-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#C9A66B] text-right resize-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">موقع المشروع *</label>
                      <input
                        type="text"
                        value={form.location}
                        onChange={e => update("location", e.target.value)}
                        placeholder="المدينة، الحي"
                        className="w-full border border-slate-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#C9A66B] text-right"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">مساحة الأرض (م²)</label>
                        <input
                          type="number"
                          value={form.land_area}
                          onChange={e => update("land_area", e.target.value)}
                          placeholder="500"
                          className="w-full border border-slate-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#C9A66B] text-right"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">عدد الطوابق</label>
                        <input
                          type="number"
                          value={form.floors_count}
                          onChange={e => update("floors_count", e.target.value)}
                          placeholder="2"
                          className="w-full border border-slate-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#C9A66B] text-right"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">نطاق الميزانية</label>
                      <MobileSelect
                        value={form.budget_range}
                        onValueChange={v => update("budget_range", v)}
                        placeholder="اختر نطاق الميزانية"
                        label="نطاق الميزانية"
                        options={[
                          { value: "", label: "اختر نطاق الميزانية" },
                          ...BUDGET_RANGES.map(b => ({ value: b.value, label: b.label }))
                        ]}
                        triggerClassName="border-slate-200 rounded-lg focus:ring-[#C9A66B] text-right bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">الجدول الزمني المطلوب</label>
                      <input
                        type="text"
                        value={form.timeline}
                        onChange={e => update("timeline", e.target.value)}
                        placeholder="مثال: 6 أشهر، سنة كاملة"
                        className="w-full border border-slate-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#C9A66B] text-right"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">متطلبات خاصة</label>
                      <textarea
                        value={form.special_requirements}
                        onChange={e => update("special_requirements", e.target.value)}
                        placeholder="أي اشتراطات أو رغبات خاصة..."
                        rows={3}
                        className="w-full border border-slate-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#C9A66B] text-right resize-none"
                      />
                    </div>
                  </div>
                )}

                {/* Step 3: File Upload */}
                {currentStep === 3 && (
                  <div>
                    <h2 className="text-xl font-bold mb-2">رفع الملفات الهندسية</h2>
                    <p className="text-slate-500 text-sm mb-6">ارفع المخططات والوثائق الهندسية لتساعد المهندس في تقدير التكلفة بدقة أكبر (اختياري)</p>

                    {/* Drop Zone */}
                    <div
                      onDrop={handleDrop}
                      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                      onDragLeave={() => setDragOver(false)}
                      className={`border-2 border-dashed rounded-2xl p-10 text-center transition-all cursor-pointer ${
                        dragOver ? "border-[#C9A66B] bg-amber-50" : "border-slate-300 hover:border-[#C9A66B] hover:bg-slate-50"
                      }`}
                      onClick={() => document.getElementById("file-input").click()}
                    >
                      <Upload className={`w-12 h-12 mx-auto mb-4 ${dragOver ? "text-[#C9A66B]" : "text-slate-400"}`} />
                      <p className="text-slate-600 font-medium mb-1">اسحب وأفلت الملفات هنا</p>
                      <p className="text-slate-400 text-sm">أو انقر للاختيار من جهازك</p>
                      <p className="text-slate-400 text-xs mt-2">PDF, DWG, DXF, PNG, JPG, ZIP مدعومة</p>
                      <input
                        id="file-input"
                        type="file"
                        multiple
                        className="hidden"
                        accept=".pdf,.dwg,.dxf,.png,.jpg,.jpeg,.zip,.rar"
                        onChange={e => handleFileUpload(e.target.files)}
                      />
                    </div>

                    {uploadingFiles && (
                      <div className="mt-4 flex items-center gap-3 text-[#C9A66B] bg-amber-50 p-3 rounded-lg">
                        <div className="animate-spin w-5 h-5 border-2 border-[#C9A66B] border-t-transparent rounded-full" />
                        <span className="text-sm">جاري رفع الملفات...</span>
                      </div>
                    )}

                    {/* Uploaded Files */}
                    {form.file_names.length > 0 && (
                      <div className="mt-5 space-y-2">
                        <h3 className="font-medium text-slate-700 mb-3">الملفات المرفوعة ({form.file_names.length})</h3>
                        {form.file_names.map((name, idx) => (
                          <div key={idx} className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                            <div className="w-9 h-9 bg-green-100 rounded-lg flex items-center justify-center">
                              {name.match(/\.(png|jpg|jpeg)$/i) ? (
                                <Image className="w-5 h-5 text-green-600" />
                              ) : (
                                <FileText className="w-5 h-5 text-green-600" />
                              )}
                            </div>
                            <span className="flex-1 text-sm text-slate-700 truncate">{name}</span>
                            <CheckCircle className="w-4 h-4 text-green-500 ml-1" />
                            <button onClick={() => removeFile(idx)} className="text-slate-400 hover:text-red-500 transition-colors">
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {form.file_names.length === 0 && (
                      <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg flex gap-3">
                        <AlertCircle className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                        <p className="text-sm text-blue-700">يمكنك المتابعة بدون رفع ملفات، لكن توفير المخططات يساعد المهندس في تقديم تقدير أدق.</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Step 4: Contact Info */}
                {currentStep === 4 && (
                  <div className="space-y-5">
                    <h2 className="text-xl font-bold mb-2">معلومات التواصل</h2>
                    <p className="text-slate-500 text-sm mb-4">سيتواصل معك المهندس على هذه البيانات</p>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">الاسم الكامل *</label>
                      <input
                        type="text"
                        value={form.client_name}
                        onChange={e => update("client_name", e.target.value)}
                        placeholder="اسمك الكامل"
                        className="w-full border border-slate-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#C9A66B] text-right"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">البريد الإلكتروني *</label>
                      <input
                        type="email"
                        value={form.client_email}
                        onChange={e => update("client_email", e.target.value)}
                        placeholder="example@email.com"
                        className="w-full border border-slate-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#C9A66B] text-left"
                        dir="ltr"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">رقم الهاتف</label>
                      <input
                        type="tel"
                        value={form.client_phone}
                        onChange={e => update("client_phone", e.target.value)}
                        placeholder="+966 5X XXX XXXX"
                        className="w-full border border-slate-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#C9A66B] text-left"
                        dir="ltr"
                      />
                    </div>

                    {/* Summary */}
                    <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                      <h3 className="font-semibold text-[#1a1a2e] mb-3">ملخص طلبك</h3>
                      <div className="space-y-2 text-sm text-slate-600">
                        <div className="flex justify-between">
                          <span>نوع المشروع:</span>
                          <span className="font-medium">{PROJECT_TYPES.find(p => p.value === form.project_type)?.label}</span>
                        </div>
                        {form.project_title && (
                          <div className="flex justify-between">
                            <span>عنوان المشروع:</span>
                            <span className="font-medium">{form.project_title}</span>
                          </div>
                        )}
                        {form.location && (
                          <div className="flex justify-between">
                            <span>الموقع:</span>
                            <span className="font-medium">{form.location}</span>
                          </div>
                        )}
                        {form.budget_range && (
                          <div className="flex justify-between">
                            <span>الميزانية:</span>
                            <span className="font-medium">{BUDGET_RANGES.find(b => b.value === form.budget_range)?.label}</span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span>الملفات المرفقة:</span>
                          <span className="font-medium">{form.file_names.length} ملف</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex justify-between mt-6">
          <Button
            variant="outline"
            onClick={() => setCurrentStep(s => s - 1)}
            disabled={currentStep === 1}
            className="flex items-center gap-2"
          >
            <ArrowRight className="w-4 h-4" />
            السابق
          </Button>

          {currentStep < 4 ? (
            <Button
              onClick={() => setCurrentStep(s => s + 1)}
              disabled={!canProceed()}
              className="bg-gradient-to-r from-[#6B5D4F] to-[#C9A66B] text-white flex items-center gap-2"
            >
              التالي
              <ArrowLeft className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={!canProceed() || isSubmitting}
              className="bg-gradient-to-r from-green-600 to-emerald-600 text-white flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                  جاري الإرسال...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  إرسال الطلب
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}