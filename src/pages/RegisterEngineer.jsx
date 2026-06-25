import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { 
  User, Mail, Phone, MapPin, Briefcase, Award,
  Upload, FileText, ArrowLeft, ArrowRight, CheckCircle,
  Building2, PenTool, Palette, Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import MobileSelect from "@/components/mobile/MobileSelect";

export default function RegisterEngineer() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const userType = urlParams.get("type") || "engineer";

  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    user_type: userType === "painter" ? "painter" : "engineer",
    specialization: "",
    registration_number: "",
    bio: "",
    city: "",
    country: "",
    years_experience: "",
    graduation_certificate_url: "",
    profile_image: ""
  });

  const specializations = userType === "painter" 
    ? ["رسم معماري", "رسم داخلي", "رسم هندسي 3D", "رسم مخططات", "رسم تنفيذي"]
    : ["تصميم داخلي", "تصميم معماري", "تصميم ديكور", "تصميم إضاءة", "تصميم أثاث", "تصميم حدائق"];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = async (e, field) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsLoading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    handleInputChange(field, file_url);
    setIsLoading(false);
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    
    await base44.entities.Engineer.create({
      ...formData,
      years_experience: parseInt(formData.years_experience) || 0,
      status: "pending",
      is_verified: false,
      rating: 0,
      total_reviews: 0,
      completed_projects: 0,
      wallet_balance: 0,
      subscription_type: "none"
    });

    base44.analytics.track({
      eventName: "engineer_profile_created",
      properties: {
        user_type: formData.user_type,
        specialization: formData.specialization,
        city: formData.city,
        country: formData.country
      }
    });

    setIsLoading(false);
    navigate(createPageUrl("RegistrationSuccess"));
  };

  const isStep1Valid = formData.full_name && formData.email && formData.phone;
  const isStep2Valid = formData.specialization && formData.city && formData.country;
  const isStep3Valid = formData.registration_number && formData.graduation_certificate_url;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-amber-50/30 py-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className={`w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br ${
            userType === "painter" ? "from-violet-500 to-purple-500" : "from-blue-500 to-cyan-500"
          } flex items-center justify-center mb-4`}>
            {userType === "painter" ? (
              <PenTool className="w-8 h-8 text-white" />
            ) : (
              <Building2 className="w-8 h-8 text-white" />
            )}
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#1a1a2e] mb-2">
            {userType === "painter" ? "التسجيل كرسام هندسي" : "التسجيل كمهندس"}
          </h1>
          <p className="text-slate-600">أكمل بياناتك للانضمام إلى منصة بيتلي</p>
        </motion.div>

        {/* Progress Steps */}
        <div className="flex justify-center items-center gap-4 mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                step >= s 
                  ? "bg-gradient-to-r from-[#1a1a2e] to-[#d4a574] text-white" 
                  : "bg-slate-200 text-slate-500"
              }`}>
                {step > s ? <CheckCircle className="w-5 h-5" /> : s}
              </div>
              {s < 3 && (
                <div className={`w-16 h-1 mx-2 rounded ${
                  step > s ? "bg-gradient-to-r from-[#1a1a2e] to-[#d4a574]" : "bg-slate-200"
                }`} />
              )}
            </div>
          ))}
        </div>

        {/* Form Card */}
        <Card className="border-0 shadow-xl">
          <CardHeader>
            <CardTitle className="text-xl">
              {step === 1 && "المعلومات الأساسية"}
              {step === 2 && "التخصص والموقع"}
              {step === 3 && "الوثائق والاعتماد"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {step === 3 && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
                <Award className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-semibold mb-1">نظام الاعتماد المهني</p>
                  <p>رفع رقم القيد المهني وشهادة التخرج إلزامي للحصول على شارة "مهندس معتمد". ستتم مراجعة وثائقك من قبل إدارة المنصة قبل ظهور الشارة في ملفك الشخصي.</p>
                </div>
              </div>
            )}
            {/* Step 1 */}
            {step === 1 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label htmlFor="full_name">الاسم الكامل *</Label>
                  <div className="relative">
                    <User className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <Input
                      id="full_name"
                      value={formData.full_name}
                      onChange={(e) => handleInputChange("full_name", e.target.value)}
                      className="pr-10"
                      placeholder="أدخل اسمك الكامل"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">البريد الإلكتروني *</Label>
                  <div className="relative">
                    <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      className="pr-10"
                      placeholder="example@email.com"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">رقم الهاتف *</Label>
                  <div className="relative">
                    <Phone className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => handleInputChange("phone", e.target.value)}
                      className="pr-10"
                      placeholder="+966 5xx xxx xxx"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 2 */}
            {step === 2 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label>التخصص *</Label>
                  <MobileSelect
                    value={formData.specialization}
                    onValueChange={(value) => handleInputChange("specialization", value)}
                    placeholder="اختر تخصصك"
                    label="التخصص"
                    options={specializations.map(s => ({ value: s, label: s }))}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="country">الدولة *</Label>
                    <div className="relative">
                      <MapPin className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <Input
                        id="country"
                        value={formData.country}
                        onChange={(e) => handleInputChange("country", e.target.value)}
                        className="pr-10"
                        placeholder="مثال: السعودية"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="city">المدينة *</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => handleInputChange("city", e.target.value)}
                      placeholder="مثال: الرياض"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="years_experience">سنوات الخبرة</Label>
                  <div className="relative">
                    <Award className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <Input
                      id="years_experience"
                      type="number"
                      value={formData.years_experience}
                      onChange={(e) => handleInputChange("years_experience", e.target.value)}
                      className="pr-10"
                      placeholder="عدد السنوات"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 3 */}
            {step === 3 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label htmlFor="registration_number">رقم القيد المهني <span className="text-red-500">*</span></Label>
                  <div className="relative">
                    <FileText className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <Input
                      id="registration_number"
                      value={formData.registration_number}
                      onChange={(e) => handleInputChange("registration_number", e.target.value)}
                      className="pr-10"
                      placeholder="رقم التسجيل المهني (إلزامي للاعتماد)"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">نبذة تعريفية عنك</Label>
                  <Textarea
                    id="bio"
                    value={formData.bio}
                    onChange={(e) => handleInputChange("bio", e.target.value)}
                    placeholder="اكتب نبذة مختصرة عن خبراتك ومهاراتك..."
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label>صورة شخصية</Label>
                  <div className="border-2 border-dashed rounded-xl p-6 text-center hover:border-[#d4a574] transition-colors">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, "profile_image")}
                      className="hidden"
                      id="profile_image"
                    />
                    <label htmlFor="profile_image" className="cursor-pointer">
                      {formData.profile_image ? (
                        <img src={formData.profile_image} alt="Profile" className="w-24 h-24 rounded-full mx-auto object-cover" />
                      ) : (
                        <>
                          <Upload className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                          <p className="text-sm text-slate-500">اضغط لرفع صورة</p>
                        </>
                      )}
                    </label>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>شهادة التخرج <span className="text-red-500">*</span></Label>
                  <div className="border-2 border-dashed rounded-xl p-6 text-center hover:border-[#d4a574] transition-colors">
                    <input
                      type="file"
                      accept=".pdf,image/*"
                      onChange={(e) => handleFileUpload(e, "graduation_certificate_url")}
                      className="hidden"
                      id="graduation_certificate"
                    />
                    <label htmlFor="graduation_certificate" className="cursor-pointer">
                      {formData.graduation_certificate_url ? (
                        <div className="flex items-center justify-center gap-2 text-green-600">
                          <CheckCircle className="w-6 h-6" />
                          <span>تم رفع الشهادة</span>
                        </div>
                      ) : (
                        <>
                          <FileText className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                          <p className="text-sm text-slate-500">اضغط لرفع الشهادة (إلزامي للاعتماد)</p>
                        </>
                      )}
                    </label>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-6">
              {step > 1 ? (
                <Button
                  variant="outline"
                  onClick={() => setStep(step - 1)}
                  className="gap-2"
                >
                  <ArrowRight className="w-4 h-4" />
                  السابق
                </Button>
              ) : (
                <div />
              )}

              {step < 3 ? (
                <Button
                  onClick={() => setStep(step + 1)}
                  disabled={
                    (step === 1 && !isStep1Valid) ||
                    (step === 2 && !isStep2Valid)
                  }
                  className="bg-gradient-to-r from-[#1a1a2e] to-[#d4a574] text-white gap-2"
                >
                  التالي
                  <ArrowLeft className="w-4 h-4" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={isLoading || !isStep3Valid}
                  className="bg-gradient-to-r from-[#1a1a2e] to-[#d4a574] text-white gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      جاري التسجيل...
                    </>
                  ) : (
                    <>
                      إتمام التسجيل
                      <CheckCircle className="w-4 h-4" />
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}