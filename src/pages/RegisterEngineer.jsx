import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { supabase } from "@/lib/supabaseClient";
import { saveRegistration } from "@/lib/registrationService";
import { motion } from "framer-motion";
import { Phone, MapPin, Briefcase, Award, Upload, FileText, ArrowLeft, ArrowRight, CheckCircle, Building2, PenTool, Loader2, Gift, User, Mail } from "lucide-react";
import PortfolioStep from "@/components/registration/PortfolioStep";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import MobileSelect from "@/components/mobile/MobileSelect";
import { toast } from "react-hot-toast";

export default function RegisterEngineer() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const userType = urlParams.get("type") || "engineer";
  const STORAGE_KEY = `bytly_reg_engineer_${userType}`;
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFileUploading, setIsFileUploading] = useState(false);
  const [notice, setNotice] = useState(null);
  const [freeOffer, setFreeOffer] = useState({ loading: true, isEligible: false, remaining: 0, registeredCount: 0 });
  const [portfolioItems, setPortfolioItems] = useState([]);
  const [skippedUploads, setSkippedUploads] = useState(new Set());
  const [formData, setFormData] = useState({
    full_name: "", email: "", phone: "",
    user_type: userType === "painter" ? "painter" : "engineer",
    specialization: userType === "surveyor" ? "هندسة المساحة" : "",
    registration_number: "", bio: "", city: "", country: "", years_experience: "",
    graduation_certificate_url: "", saudi_engineers_council_certificate_url: "", profile_image: "", completed_projects: ""
  });

  // A real authenticated user belongs in Login, not in the new-account flow.
  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (active && data?.session?.user) navigate(createPageUrl("Home"), { replace: true });
    }).catch(() => {});
    return () => { active = false; };
  }, [navigate]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return;
      const parsed = JSON.parse(saved);
      if (parsed.formData) setFormData(prev => ({ ...prev, ...parsed.formData }));
      if (typeof parsed.step === "number") setStep(parsed.step);
      if (Array.isArray(parsed.portfolioItems)) setPortfolioItems(parsed.portfolioItems);
      if (Array.isArray(parsed.skippedUploads)) setSkippedUploads(new Set(parsed.skippedUploads));
    } catch {}
  }, [STORAGE_KEY]);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ formData, step, portfolioItems, skippedUploads: [...skippedUploads] })); } catch {}
  }, [STORAGE_KEY, formData, step, portfolioItems, skippedUploads]);

  useEffect(() => {
    const checkEligibility = async () => {
      try {
        const result = await Promise.resolve(base44.functions.invoke("checkFreeRegistrationEligibility", {}));
        const data = result?.data || result || {};
        setFreeOffer({ loading: false, isEligible: !!data.is_eligible, remaining: data.remaining_free_slots || 0, registeredCount: data.registered_count || 0 });
      } catch {
        setFreeOffer({ loading: false, isEligible: true, remaining: 100, registeredCount: 0 });
      }
    };
    checkEligibility();
  }, []);

  const specializations = userType === "painter"
    ? ["رسم معماري", "رسم داخلي", "رسم هندسي 3D", "رسم مخططات", "رسم تنفيذي", "رسم مناظير طبيعية", "رسم تفاصيل إنشائية"]
    : userType === "surveyor"
      ? ["هندسة المساحة", "المساحة الطبوغرافية", "المساحة الميكانيكية", "المساحة الفوتوغرامترية", "المساحة الجوية والطائرات المسيّرة", "مساحة الأراضي والقطع", "تخطيط المدن والعقارات", "تحديد الإحداثيات والمواقع"]
      : ["هندسة مدنية", "هندسة معمارية", "هندسة إنشائية", "هندسة كهربائية", "هندسة ميكانيكية", "هندسة صحية و MEP", "هندسة التكييف والتهوية (HVAC)", "هندسة الحريق والسلامة", "هندسة المساحة", "هندسة الجيوتكنيك", "هندسة البيئة", "هندسة الطرق والنقل", "هندسة المياه والسدود", "هندسة البترول", "هندسة الكيمياء", "تصميم داخلي", "تصميم ديكور", "تصميم إضاءة", "تصميم أثاث", "تصميم حدائق ومداخل", "تصميم واجهات", "إدارة مشاريع", "تقدير التكاليف (كميات)", "استشارات فنية", "ترميم وصيانة"];

  const handleInputChange = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));
  const withTimeout = (promise, timeoutMs = 30000) => new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("timeout")), timeoutMs);
    Promise.resolve(promise).then(result => { clearTimeout(timer); resolve(result); }, error => { clearTimeout(timer); reject(error); });
  });
  const isPlanLimitError = (error) => {
    const status = error?.status || error?.response?.status || error?.code;
    const message = `${error?.message || ""} ${error?.data?.message || ""} ${error?.data?.error || ""} ${error?.response?.data?.message || ""} ${error?.response?.data?.error || ""}`.toLowerCase();
    return status === 402 || message.includes("limit") || message.includes("quota") || (message.includes("integration") && message.includes("month"));
  };
  const MAX_FILE_SIZE = 10 * 1024 * 1024;

  const handleFileUpload = async (e, field) => {
    const file = e.target.files[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > MAX_FILE_SIZE) { const message = `حجم الملف ${(file.size / 1024 / 1024).toFixed(1)} ميجابايت. الحد الأقصى 10 ميجابايت.`; setNotice({ type: "error", title: "حجم الملف كبير", message }); toast.error(message); return; }
    setIsFileUploading(true);
    setNotice({ type: "info", title: "جارٍ رفع الملف", message: `جارٍ رفع: ${file.name} — قد يستغرق ذلك قليلًا...` });
    try {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const path = `engineers/${Date.now()}-${Math.random().toString(36).slice(2)}-${safeName}`;
      const { error: uploadError } = await withTimeout(supabase.storage.from("registration-documents").upload(path, file, { upsert: false, contentType: file.type || undefined }), 120000);
      if (uploadError) throw uploadError;
      const { data: publicUrlData } = supabase.storage.from("registration-documents").getPublicUrl(path);
      const file_url = publicUrlData?.publicUrl;
      if (!file_url) throw new Error("تم رفع الملف لكن تعذر الحصول على رابطه.");
      handleInputChange(field, file_url);
      setSkippedUploads(prev => { const next = new Set(prev); next.delete(field); return next; });
      setNotice({ type: "success", title: "تم رفع الملف بنجاح", message: "يمكنك المتابعة في إكمال التسجيل." });
    } catch (error) {
      const responseData = error?.data || error?.response?.data;
      if (isPlanLimitError(error)) {
        setSkippedUploads(prev => new Set(prev).add(field));
        const fieldLabel = field === "graduation_certificate_url" ? "شهادة التخرج" : field === "saudi_engineers_council_certificate_url" ? "شهادة القيد بالهيئة السعودية للمهندسين" : "الصورة الشخصية";
        const skipMessage = `تعذر رفع ${fieldLabel} بسبب حد التكامل في الخطة. يمكنك إكمال التسجيل الآن وإضافة ${fieldLabel} لاحقًا من إعدادات الملف الشخصي، أو ترقية الخطة.`;
        setNotice({ type: "warning", title: "تعذر رفع الملف - يمكنك المتابعة", message: skipMessage }); toast(skipMessage, { icon: "⚠️", duration: 8000 });
      } else {
        const message = error?.message === "timeout" ? "انتهت مهلة رفع الملف. حاول استخدام ملف أصغر أو إعادة المحاولة لاحقًا." : responseData?.message || responseData?.detail || responseData?.error || "تعذر رفع الملف مؤقتًا. يُرجى التحقق من الاتصال وإعادة المحاولة.";
        setNotice({ type: "error", title: "تعذر رفع الملف", message }); toast.error(message);
      }
      console.error("RegisterEngineer upload error:", error);
    } finally { setIsFileUploading(false); }
  };

  const handleSubmit = async () => {
    if (isSubmitting || isFileUploading) return;
    if (!isStep3Valid) { setStep(3); const message = "أكمل رقم القيد المهني والوثائق المطلوبة أولاً، ثم تابع لإتمام التسجيل."; setNotice({ type: "error", title: "بيانات الاعتماد غير مكتملة", message }); toast.error(message); return; }
    setIsSubmitting(true);
    setNotice({ type: "info", title: "جارٍ إنشاء الحساب", message: "جارٍ حفظ بياناتك وإنشاء حسابك في بيتلي…" });
    try {
      const isFreeEligible = freeOffer.isEligible;
      const today = new Date();
      const trialEnd = new Date(); trialEnd.setMonth(trialEnd.getMonth() + 3);
      const localDate = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const engineer = await withTimeout(saveRegistration({
        table: "engineers", role: "engineer", fullName: formData.full_name, email: formData.email, phone: formData.phone,
        row: { full_name: formData.full_name, phone: formData.phone, city: formData.city, country: formData.country, specialization: formData.specialization, registration_number: formData.registration_number, bio: formData.bio, graduation_certificate_url: formData.graduation_certificate_url, saudi_engineers_council_certificate_url: formData.saudi_engineers_council_certificate_url, profile_image: formData.profile_image, years_experience: parseInt(formData.years_experience) || 0, completed_projects: parseInt(formData.completed_projects) || 0, status: "pending", is_verified: false, rating: 0, total_reviews: 0, wallet_balance: 0, subscription_type: isFreeEligible ? "free_trial" : "none", is_subscription_active: isFreeEligible, subscription_start_date: isFreeEligible ? localDate(today) : undefined, trial_end_date: isFreeEligible ? localDate(trialEnd) : undefined, is_real: true, source: "supabase" }
      }), 15000);
      const validPortfolioItems = portfolioItems.filter(item => item.title || item.images?.length > 0);
      if (validPortfolioItems.length > 0) void Promise.allSettled(validPortfolioItems.map(item => base44.entities.Portfolio.create({ engineer_id: engineer.id, title: item.title || "عمل سابق", description: item.description || "", images: item.images || [] }))).catch(() => {});
      const notificationPayload = { full_name: formData.full_name, email: formData.email, user_type: formData.user_type, specialization: formData.specialization };
      [
        () => base44.functions.invoke("notifyNewUserSignup", { role: formData.user_type === "surveyor" ? "surveyor" : "engineer", data: engineer }),
        () => base44.functions.invoke("sendWelcomeEmail", { role: formData.user_type === "surveyor" ? "surveyor" : "engineer", id: engineer.id }),
        () => base44.functions.invoke("notifyNewEngineer", { engineer_id: engineer.id }),
        () => base44.functions.invoke("notifyNewRegistration", { eventType: "engineer_registered", data: notificationPayload })
      ].forEach(call => { try { void Promise.resolve(call()).catch(() => {}); } catch {} });
      try { localStorage.removeItem(STORAGE_KEY); } catch {}
      navigate(createPageUrl("RegistrationSuccess"));
    } catch (error) {
      if (error?.message === "EMAIL_CONFIRMATION_REQUIRED") {
        setNotice({ type: "success", title: "تم بدء إنشاء الحساب", message: "أرسلنا رابط التفعيل إلى بريدك الإلكتروني. افتح الرسالة لإكمال إنشاء حسابك ثم العودة إلى بيتلي." });
        toast.success("تحققي من بريدك الإلكتروني لإكمال إنشاء الحساب.");
      } else {
        const responseData = error?.data || error?.response?.data;
        const message = isPlanLimitError(error) ? "تعذر إكمال التسجيل بسبب حد التكامل في الخطة." : error?.message === "timeout" ? "انتهت مهلة الاتصال بحفظ التسجيل. يُرجى المحاولة مرة أخرى." : responseData?.message || responseData?.detail || responseData?.error || "تعذر إكمال التسجيل مؤقتًا. يُرجى مراجعة البيانات وإعادة المحاولة.";
        setNotice({ type: "error", title: "تعذر إكمال التسجيل", message }); toast.error(message);
      }
    } finally { setIsSubmitting(false); setIsFileUploading(false); }
  };

  const isStep1Valid = !!(formData.full_name?.trim() && formData.email?.trim() && formData.phone?.trim() && formData.city?.trim());
  const isStep2Valid = !!(formData.specialization && formData.country?.trim());
  const isStep3Valid = !!(formData.registration_number?.trim() && (formData.graduation_certificate_url || skippedUploads.has("graduation_certificate_url")) && (formData.saudi_engineers_council_certificate_url || skippedUploads.has("saudi_engineers_council_certificate_url")));

  return <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-amber-50/30 py-12"><div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8"><div className={`w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br ${userType === "painter" ? "from-violet-500 to-purple-500" : userType === "surveyor" ? "from-green-500 to-emerald-600" : "from-blue-500 to-cyan-500"} flex items-center justify-center mb-4`}>{userType === "painter" ? <PenTool className="w-8 h-8 text-white" /> : <Building2 className="w-8 h-8 text-white" />}</div><h1 className="text-2xl md:text-3xl font-bold text-[#1a1a2e] mb-2">{userType === "painter" ? "التسجيل كرسام هندسي" : userType === "surveyor" ? "التسجيل كمهندس مساحة" : "التسجيل كمهندس"}</h1><p className="text-slate-600">أكمل بياناتك للانضمام إلى منصة بيتلي</p></motion.div>
    {!freeOffer.loading && freeOffer.isEligible && <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="rounded-2xl border border-emerald-300 bg-gradient-to-br from-emerald-50 to-teal-50 p-4 mb-6 flex items-start gap-3"><div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shrink-0"><Gift className="w-5 h-5 text-white" /></div><div><p className="font-bold text-emerald-800">🎉 تسجيل مجاني — أنت ضمن أول 100 مهندس!</p><p className="text-sm text-emerald-700 mt-1">ضمن الفترة التجريبية لقياس المنصة، يتمتع أول 100 مهندس باشتراك مجاني لمدة 3 أشهر. المتاح حالياً: <span className="font-bold">{freeOffer.remaining}</span> مقعد مجاني.</p></div></motion.div>}
    {!freeOffer.loading && !freeOffer.isEligible && <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 mb-6 text-sm text-amber-800">تم اكتمال قائمة أول 100 مهندس المجانيين. التسجيل متاح بالاشتراكات العادية بعد الموافقة.</div>}
    {notice && <div className={`rounded-2xl border p-4 mb-6 ${notice.type === "error" ? "border-red-200 bg-red-50 text-red-700" : notice.type === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : notice.type === "warning" ? "border-amber-300 bg-amber-50 text-amber-800" : "border-blue-200 bg-blue-50 text-blue-700"}`}><p className="font-semibold">{notice.title}</p><p className="text-sm mt-1">{notice.message}</p></div>}
    <div className="flex justify-center items-center gap-4 mb-8">{[1,2,3,4].map(s => <div key={s} className="flex items-center"><div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${step >= s ? "bg-gradient-to-r from-[#1a1a2e] to-[#C9A66B] text-white" : "bg-slate-200 text-slate-500"}`}>{step > s ? <CheckCircle className="w-5 h-5" /> : s}</div>{s < 4 && <div className={`w-16 h-1 mx-2 rounded ${step > s ? "bg-gradient-to-r from-[#1a1a2e] to-[#C9A66B]" : "bg-slate-200"}`} />}</div>)}</div>
    <Card className="border-0 shadow-xl"><CardHeader><CardTitle className="text-xl">{step === 1 && "بيانات الحساب"}{step === 2 && "التخصص والموقع"}{step === 3 && "الوثائق والاعتماد"}{step === 4 && "الأعمال السابقة"}</CardTitle></CardHeader><CardContent className="space-y-6">
      {step === 1 && <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
        <div className="space-y-2"><Label htmlFor="full_name">الاسم الكامل *</Label><div className="relative"><User className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" /><Input id="full_name" value={formData.full_name} onChange={e => handleInputChange("full_name", e.target.value)} className="pr-10" placeholder="اكتب اسمك الكامل" /></div></div>
        <div className="space-y-2"><Label htmlFor="email">البريد الإلكتروني *</Label><div className="relative"><Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" /><Input id="email" type="email" value={formData.email} onChange={e => handleInputChange("email", e.target.value)} className="pr-10" placeholder="example@email.com" /></div></div>
        <div className="space-y-2"><Label htmlFor="phone">رقم الهاتف *</Label><div className="relative"><Phone className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" /><Input id="phone" value={formData.phone} onChange={e => handleInputChange("phone", e.target.value)} className="pr-10" placeholder="+966 5xx xxx xxx" /></div></div>
        <div className="space-y-2"><Label htmlFor="city">المدينة *</Label><div className="relative"><MapPin className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" /><Input id="city" value={formData.city} onChange={e => handleInputChange("city", e.target.value)} className="pr-10" placeholder="مثال: الرياض" /></div></div>
      </motion.div>}
      {step === 2 && <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4"><div className="space-y-2"><Label>التخصص *</Label><MobileSelect value={formData.specialization} onValueChange={value => handleInputChange("specialization", value)} placeholder="اختر تخصصك" label="التخصص" options={specializations.map(s => ({ value: s, label: s }))} /></div><div className="space-y-2"><Label htmlFor="country">الدولة *</Label><Input id="country" value={formData.country} onChange={e => handleInputChange("country", e.target.value)} placeholder="مثال: السعودية" /></div><div className="space-y-2"><Label htmlFor="years_experience">سنوات الخبرة</Label><Input id="years_experience" type="number" value={formData.years_experience} onChange={e => handleInputChange("years_experience", e.target.value)} placeholder="عدد السنوات" /></div><div className="space-y-2"><Label htmlFor="completed_projects">عدد المشاريع المنجزة</Label><Input id="completed_projects" type="number" value={formData.completed_projects} onChange={e => handleInputChange("completed_projects", e.target.value)} placeholder="عدد المشاريع" /></div></motion.div>}
      {step === 3 && <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4"><div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3"><Award className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" /><div className="text-sm text-blue-800"><p className="font-semibold mb-1">نظام الاعتماد المهني</p><p>رفع رقم القيد المهني وشهادة التخرج وشهادة القيد في الهيئة السعودية للمهندسين إلزامي للحصول على شارة "مهندس معتمد".</p></div></div><div className="space-y-2"><Label htmlFor="registration_number">رقم القيد المهني *</Label><Input id="registration_number" value={formData.registration_number} onChange={e => handleInputChange("registration_number", e.target.value)} placeholder="رقم التسجيل المهني" /></div><div className="space-y-2"><Label htmlFor="bio">نبذة تعريفية عنك</Label><Textarea id="bio" value={formData.bio} onChange={e => handleInputChange("bio", e.target.value)} placeholder="اكتب نبذة مختصرة عن خبراتك ومهاراتك..." rows={3} /></div><div className="space-y-2"><Label>صورة شخصية</Label><input type="file" accept="image/*" onChange={e => handleFileUpload(e, "profile_image")} disabled={isFileUploading || isSubmitting} /></div><div className="space-y-2"><Label>شهادة التخرج *</Label><input type="file" accept=".pdf,image/*" onChange={e => handleFileUpload(e, "graduation_certificate_url")} disabled={isFileUploading || isSubmitting} /></div><div className="space-y-2"><Label>شهادة القيد في الهيئة السعودية للمهندسين *</Label><input type="file" accept=".pdf,image/*" onChange={e => handleFileUpload(e, "saudi_engineers_council_certificate_url")} disabled={isFileUploading || isSubmitting} /></div></motion.div>}
      {step === 4 && <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}><PortfolioStep portfolioItems={portfolioItems} setPortfolioItems={setPortfolioItems} /></motion.div>}
      <div className="flex justify-between pt-6">{step > 1 ? <Button variant="outline" onClick={() => setStep(step - 1)} className="gap-2"><ArrowRight className="w-4 h-4" />السابق</Button> : <div />}{step < 4 ? <Button onClick={() => { if (step === 1 && !isStep1Valid) { toast.error("أكمل الاسم والبريد الإلكتروني ورقم الهاتف والمدينة أولاً."); return; } if (step === 2 && !isStep2Valid) { toast.error("أكمل التخصص والدولة أولاً."); return; } if (step === 3 && !isStep3Valid) { toast.error("أكمل رقم القيد والوثائق المطلوبة أولاً."); return; } setStep(step + 1); }} disabled={(step === 1 && !isStep1Valid) || (step === 2 && !isStep2Valid) || (step === 3 && !isStep3Valid)} className="bg-gradient-to-r from-[#1a1a2e] to-[#C9A66B] text-white gap-2">التالي<ArrowLeft className="w-4 h-4" /></Button> : <Button onClick={handleSubmit} disabled={isSubmitting || isFileUploading} className="bg-gradient-to-r from-[#1a1a2e] to-[#C9A66B] text-white gap-2">{isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" />جاري إنشاء الحساب...</> : <>إنشاء الحساب<CheckCircle className="w-4 h-4" /></>}</Button>}</div>
    </CardContent></Card>
  </div></div>;
}