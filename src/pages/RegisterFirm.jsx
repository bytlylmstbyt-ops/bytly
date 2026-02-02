import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Building2, Upload, Loader2, CheckCircle } from "lucide-react";
import { toast } from "sonner";

export default function RegisterFirm() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingDocs, setUploadingDocs] = useState(false);
  
  const [formData, setFormData] = useState({
    company_name: "",
    email: "",
    phone: "",
    commercial_registration: "",
    company_logo: "",
    cover_image: "",
    description: "",
    city: "",
    country: "السعودية",
    website: "",
    established_year: new Date().getFullYear(),
    specializations: [],
    documents: []
  });

  const specializations = [
    "تصميم داخلي",
    "تصميم معماري",
    "هندسة مدنية",
    "الإشراف على التنفيذ",
    "التخطيط العمراني",
    "هندسة المناظر الطبيعية",
    "الاستشارات الهندسية"
  ];

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingLogo(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData({ ...formData, company_logo: file_url });
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
    if (formData.specializations.includes(spec)) {
      setFormData({
        ...formData,
        specializations: formData.specializations.filter(s => s !== spec)
      });
    } else {
      setFormData({
        ...formData,
        specializations: [...formData.specializations, spec]
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.company_name || !formData.email || !formData.commercial_registration) {
      toast.error("يرجى ملء جميع الحقول المطلوبة");
      return;
    }

    setLoading(true);
    try {
      const user = await base44.auth.me();
      
      await base44.entities.EngineeringFirm.create({
        ...formData,
        email: user.email
      });

      toast.success("تم تسجيل الشركة الاستشارية بنجاح! في انتظار الموافقة من الإدارة");
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
            <div className="w-16 h-16 bg-gradient-to-br from-[#1a1a2e] to-[#d4a574] rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Building2 className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-3xl">تسجيل شركة هندسية استشارية</CardTitle>
<parameter name="p">انضم إلى شبكة الشركات الهندسية الاستشارية المعتمدة
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Company Basic Info */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-900 pb-2 border-b">معلومات الشركة</h3>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>اسم الشركة *</Label>
                    <Input
                      value={formData.company_name}
                      onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                      placeholder="مثال: شركة التصميم الحديث"
                      required
                    />
                  </div>

                  <div>
                    <Label>رقم السجل التجاري *</Label>
                    <Input
                      value={formData.commercial_registration}
                      onChange={(e) => setFormData({ ...formData, commercial_registration: e.target.value })}
                      placeholder="1234567890"
                      required
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>رقم الهاتف</Label>
                    <Input
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+966 5XXXXXXXX"
                    />
                  </div>

                  <div>
                    <Label>الموقع الإلكتروني</Label>
                    <Input
                      value={formData.website}
                      onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                      placeholder="https://example.com"
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
                      onChange={(e) => setFormData({ ...formData, established_year: parseInt(e.target.value) })}
                    />
                  </div>
                </div>

                <div>
                  <Label>نبذة عن الشركة</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="اكتب نبذة تعريفية عن الشركة وخدماتها..."
                    rows={4}
                  />
                </div>
              </div>

              {/* Specializations */}
              <div className="space-y-3">
                <Label>التخصصات</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {specializations.map((spec) => (
                    <button
                      key={spec}
                      type="button"
                      onClick={() => toggleSpecialization(spec)}
                      className={`p-3 rounded-lg border text-sm transition-all ${
                        formData.specializations.includes(spec)
                          ? "border-[#d4a574] bg-amber-50 text-[#1a1a2e] font-medium"
                          : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      {formData.specializations.includes(spec) && (
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
                  <Label>شعار الشركة</Label>
                  <div className="mt-2">
                    {formData.company_logo ? (
                      <div className="relative">
                        <img 
                          src={formData.company_logo} 
                          alt="Logo" 
                          className="w-32 h-32 object-cover rounded-lg border"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="mt-2"
                          onClick={() => setFormData({ ...formData, company_logo: "" })}
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

              {/* Documents */}
              <div>
                <Label>المستندات الرسمية (السجل التجاري، الرخصة، إلخ)</Label>
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
                  className="flex-1 bg-gradient-to-r from-[#1a1a2e] to-[#d4a574] text-white"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                      جاري التسجيل...
                    </>
                  ) : (
                    "تسجيل الشركة الاستشارية"
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