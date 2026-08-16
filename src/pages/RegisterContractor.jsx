import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { HardHat, Upload, Loader2, CheckCircle } from "lucide-react";
import { toast } from "sonner";

export default function RegisterContractor() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingDocs, setUploadingDocs] = useState(false);
  const [uploadingLicense, setUploadingLicense] = useState(false);
  const [uploadingReg, setUploadingReg] = useState(false);

  const [formData, setFormData] = useState({
    company_name: "",
    email: "",
    phone: "",
    contractor_type: "company",
    specialization: "",
    services: [],
    commercial_registration: "",
    license_number: "",
    license_file: "",
    registration_file: "",
    bio: "",
    city: "",
    country: "السعودية",
    profile_image: "",
    cover_image: "",
    documents: [],
    years_experience: 0,
    team_size: 0,
    established_year: new Date().getFullYear(),
    website: ""
  });

  const specializations = [
    "بناء وتشييد",
    "تشطيبات داخلية",
    "أعمال خرسانية",
    "أعمال سباكة",
    "أعمال كهرباء",
    "أعمال تكييف وتهوية",
    "أعمال دهانات وديكور",
    "أعمال جبس وأسقف",
    "أعمال أرضيات وبورسلين",
    "أعمال خشب وأبواب",
    "أعمال ألمنيوم وزجاج",
    "أعمال عزل ومائية وحرارية",
    "أعمال حدائق ومناظر طبيعية",
    "هدم وحفر",
    "صيانة وترميم"
  ];

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingLogo(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData({ ...formData, profile_image: file_url });
      toast.success("تم رفع الشعار بنجاح");
    } catch (error) {
      toast.error("فشل رفع الشعار");
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleCoverUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingCover(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData({ ...formData, cover_image: file_url });
      toast.success("تم رفع صورة الغلاف بنجاح");
    } catch (error) {
      toast.error("فشل رفع صورة الغلاف");
    } finally {
      setUploadingCover(false);
    }
  };

  const handleLicenseUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingLicense(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData({ ...formData, license_file: file_url });
      toast.success("تم رفع رخصة العمل بنجاح");
    } catch (error) {
      toast.error("فشل رفع رخصة العمل");
    } finally {
      setUploadingLicense(false);
    }
  };

  const handleRegUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingReg(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData({ ...formData, registration_file: file_url });
      toast.success("تم رفع السجل التجاري بنجاح");
    } catch (error) {
      toast.error("فشل رفع السجل التجاري");
    } finally {
      setUploadingReg(false);
    }
  };

  const handleDocumentsUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    setUploadingDocs(true);
    try {
      const uploadedDocs = [];
      for (const file of files) {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        uploadedDocs.push(file_url);
      }
      setFormData({
        ...formData,
        documents: [...formData.documents, ...uploadedDocs]
      });
      toast.success(`تم رفع ${files.length} مستند بنجاح`);
    } catch (error) {
      toast.error("فشل رفع المستندات");
    } finally {
      setUploadingDocs(false);
    }
  };

  const toggleSpecialization = (spec) => {
    if (formData.services.includes(spec)) {
      setFormData({
        ...formData,
        services: formData.services.filter(s => s !== spec)
      });
    } else {
      setFormData({
        ...formData,
        services: [...formData.services, spec]
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.company_name || !formData.email || !formData.specialization) {
      toast.error("يرجى ملء جميع الحقول المطلوبة");
      return;
    }

    setLoading(true);
    try {
      const user = await base44.auth.me();

      const contractor = await base44.entities.Contractor.create({
        ...formData,
        email: user.email
      });
      try { await base44.functions.invoke("sendWelcomeEmail", { role: "contractor", id: contractor.id }); }
      catch (welcomeErr) { console.error("sendWelcomeEmail contractor failed (non-blocking):", welcomeErr); }

      toast.success("تم تسجيل المقاول بنجاح! في انتظار الموافقة من الإدارة");
      navigate(createPageUrl("RegistrationSuccess"));
    } catch (error) {
      console.error("Error:", error);
      toast.error("حدث خطأ أثناء التسجيل");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-amber-50/30 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <Card className="border-0 shadow-xl">
          <CardHeader className="text-center space-y-2 pb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-[#6B5D4F] to-[#C9A66B] rounded-2xl flex items-center justify-center mx-auto mb-4">
              <HardHat className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-3xl">تسجيل مقاول جديد</CardTitle>
            <p className="text-slate-600">انضم إلى شبكة المقاولين المعتمدين في بيتلي</p>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Info */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-900 pb-2 border-b">معلومات المقاول / الشركة</h3>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>اسم الشركة أو المقاول *</Label>
                    <Input
                      value={formData.company_name}
                      onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                      placeholder="مثال: شركة البناء الحديث"
                      required
                    />
                  </div>

                  <div>
                    <Label>التخصص *</Label>
                    <Input
                      value={formData.specialization}
                      onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                      placeholder="مثال: تشطيبات داخلية"
                      required
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>رقم التواصل *</Label>
                    <Input
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+966 5XXXXXXXX"
                    />
                  </div>

                  <div>
                    <Label>نوع الحساب</Label>
                    <div className="flex gap-3 mt-2">
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, contractor_type: "company" })}
                        className={`flex-1 p-3 rounded-lg border text-sm transition-all ${
                          formData.contractor_type === "company"
                            ? "border-[#C9A66B] bg-amber-50 text-[#6B5D4F] font-medium"
                            : "border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        شركة
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, contractor_type: "individual" })}
                        className={`flex-1 p-3 rounded-lg border text-sm transition-all ${
                          formData.contractor_type === "individual"
                            ? "border-[#C9A66B] bg-amber-50 text-[#6B5D4F] font-medium"
                            : "border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        مقاول فردي
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>السجل التجاري</Label>
                    <Input
                      value={formData.commercial_registration}
                      onChange={(e) => setFormData({ ...formData, commercial_registration: e.target.value })}
                      placeholder="1234567890"
                    />
                  </div>

                  <div>
                    <Label>رقم رخصة العمل</Label>
                    <Input
                      value={formData.license_number}
                      onChange={(e) => setFormData({ ...formData, license_number: e.target.value })}
                      placeholder="رقم الرخصة"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <Label>المدينة</Label>
                    <Input
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      placeholder="الرياض"
                    />
                  </div>

                  <div>
                    <Label>الدولة</Label>
                    <Input
                      value={formData.country}
                      onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label>سنة التأسيس</Label>
                    <Input
                      type="number"
                      value={formData.established_year}
                      onChange={(e) => setFormData({ ...formData, established_year: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>سنوات الخبرة</Label>
                    <Input
                      type="number"
                      value={formData.years_experience}
                      onChange={(e) => setFormData({ ...formData, years_experience: parseInt(e.target.value) || 0 })}
                    />
                  </div>

                  <div>
                    <Label>عدد أفراد الفريق</Label>
                    <Input
                      type="number"
                      value={formData.team_size}
                      onChange={(e) => setFormData({ ...formData, team_size: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                </div>

                <div>
                  <Label>الموقع الإلكتروني</Label>
                  <Input
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    placeholder="https://example.com"
                  />
                </div>

                <div>
                  <Label>نبذة تعريفية</Label>
                  <Textarea
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    placeholder="اكتب نبذة عن خبرتك وخدماتك..."
                    rows={4}
                  />
                </div>
              </div>

              {/* Specializations */}
              <div className="space-y-3">
                <Label>الخدمات المقدمة</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {specializations.map((spec) => (
                    <button
                      key={spec}
                      type="button"
                      onClick={() => toggleSpecialization(spec)}
                      className={`p-3 rounded-lg border text-sm transition-all ${
                        formData.services.includes(spec)
                          ? "border-[#C9A66B] bg-amber-50 text-[#6B5D4F] font-medium"
                          : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      {formData.services.includes(spec) && (
                        <CheckCircle className="w-4 h-4 inline ml-1 text-green-600" />
                      )}
                      {spec}
                    </button>
                  ))}
                </div>
              </div>

              {/* Images Upload */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>شعار / صورة الملف</Label>
                  <div className="mt-2">
                    {formData.profile_image ? (
                      <div className="relative">
                        <img
                          src={formData.profile_image}
                          alt="Logo"
                          className="w-32 h-32 object-cover rounded-lg border"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="mt-2"
                          onClick={() => setFormData({ ...formData, profile_image: "" })}
                        >
                          تغيير
                        </Button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-slate-50">
                        <div className="flex flex-col items-center">
                          {uploadingLogo ? (
                            <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
                          ) : (
                            <>
                              <Upload className="w-8 h-8 text-slate-400 mb-2" />
                              <span className="text-sm text-slate-600">رفع الشعار</span>
                            </>
                          )}
                        </div>
                        <input type="file" className="hidden" onChange={handleLogoUpload} accept="image/*" />
                      </label>
                    )}
                  </div>
                </div>

                <div>
                  <Label>صورة الغلاف</Label>
                  <div className="mt-2">
                    {formData.cover_image ? (
                      <div className="relative">
                        <img
                          src={formData.cover_image}
                          alt="Cover"
                          className="w-full h-32 object-cover rounded-lg border"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="mt-2"
                          onClick={() => setFormData({ ...formData, cover_image: "" })}
                        >
                          تغيير
                        </Button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-slate-50">
                        <div className="flex flex-col items-center">
                          {uploadingCover ? (
                            <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
                          ) : (
                            <>
                              <Upload className="w-8 h-8 text-slate-400 mb-2" />
                              <span className="text-sm text-slate-600">رفع صورة الغلاف</span>
                            </>
                          )}
                        </div>
                        <input type="file" className="hidden" onChange={handleCoverUpload} accept="image/*" />
                      </label>
                    )}
                  </div>
                </div>
              </div>

              {/* License & Registration uploads */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>مرفق رخصة العمل</Label>
                  <div className="mt-2">
                    {formData.license_file ? (
                      <p className="text-sm text-green-600 flex items-center gap-1">
                        <CheckCircle className="w-4 h-4" />
                        تم رفع رخصة العمل
                      </p>
                    ) : (
                      <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-lg cursor-pointer hover:bg-slate-50">
                        <div className="flex flex-col items-center">
                          {uploadingLicense ? (
                            <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                          ) : (
                            <>
                              <Upload className="w-6 h-6 text-slate-400 mb-1" />
                              <span className="text-sm text-slate-600">رفع رخصة العمل</span>
                            </>
                          )}
                        </div>
                        <input type="file" className="hidden" onChange={handleLicenseUpload} accept=".pdf,.jpg,.jpeg,.png" />
                      </label>
                    )}
                  </div>
                </div>

                <div>
                  <Label>مرفق السجل التجاري</Label>
                  <div className="mt-2">
                    {formData.registration_file ? (
                      <p className="text-sm text-green-600 flex items-center gap-1">
                        <CheckCircle className="w-4 h-4" />
                        تم رفع السجل التجاري
                      </p>
                    ) : (
                      <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-lg cursor-pointer hover:bg-slate-50">
                        <div className="flex flex-col items-center">
                          {uploadingReg ? (
                            <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                          ) : (
                            <>
                              <Upload className="w-6 h-6 text-slate-400 mb-1" />
                              <span className="text-sm text-slate-600">رفع السجل التجاري</span>
                            </>
                          )}
                        </div>
                        <input type="file" className="hidden" onChange={handleRegUpload} accept=".pdf,.jpg,.jpeg,.png" />
                      </label>
                    )}
                  </div>
                </div>
              </div>

              {/* Additional Documents */}
              <div>
                <Label>مستندات إضافية (شهادات، عقود سابقة، إلخ)</Label>
                <div className="mt-2">
                  <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-lg cursor-pointer hover:bg-slate-50">
                    <div className="flex flex-col items-center">
                      {uploadingDocs ? (
                        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                      ) : (
                        <>
                          <Upload className="w-6 h-6 text-slate-400 mb-1" />
                          <span className="text-sm text-slate-600">رفع المستندات</span>
                        </>
                      )}
                    </div>
                    <input type="file" className="hidden" onChange={handleDocumentsUpload} accept=".pdf,.jpg,.jpeg,.png" multiple />
                  </label>
                  {formData.documents.length > 0 && (
                    <p className="text-sm text-green-600 mt-2">
                      تم رفع {formData.documents.length} مستند
                    </p>
                  )}
                </div>
              </div>

              {/* Submit */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-[#6B5D4F] to-[#C9A66B] text-white"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                      جاري التسجيل...
                    </>
                  ) : (
                    "تسجيل المقاول"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}