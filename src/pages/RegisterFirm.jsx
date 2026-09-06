import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { supabase } from "@/lib/supabaseClient";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Building2, Upload, Loader2, CheckCircle, FileText, Info } from "lucide-react";
import { toast } from "sonner";

export default function RegisterFirm() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
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

  useEffect(() => {
    base44.auth.isAuthenticated().then((ok) => {
      if (!ok) {
        window.location.href = "/login";
        return;
      }
      setAuthChecked(true);
    }).catch(() => {
      window.location.href = "/login";
    });
  }, []);

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
      const { data: authData } = await supabase.auth.getUser();
      const user = authData?.user;
      if (!user) throw new Error("يجب تسجيل الدخول أولاً");
      
      const firm = await base44.entities.EngineeringFirm.create({
        ...formData,
        email: user.email,
        owner_user_id: user.id
      });
      try { await base44.functions.invoke("notifyNewUserSignup", { role: "firm", data: firm }); }
      catch (notifyErr) { console.error("notifyNewUserSignup firm failed:", notifyErr); }
      try { await base44.functions.invoke("sendWelcomeEmail", { role: "firm", id: firm.id }); }
      catch (welcomeErr) { console.error("sendWelcomeEmail firm failed:", welcomeErr); }

      toast.success("تم تسجيل الشركة الاستشارية بنجاح! في انتظار الموافقة من الإدارة");
      navigate(createPageUrl("RegistrationSuccess"));
    } catch (error) {
      console.error("Error:", error);
      if (error?.status === 401 || error?.message?.includes("401")) {
        toast.error("انتهت الجلسة، يرجى تسجيل الدخول");
        window.location.href = "/login";
        return;
      }
      toast.error("حدث خطأ أثناء التسجيل");
    } finally {
      setLoading(false);
    }
  };

  if (!authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#C9A66B]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-amber-50/30 py-6 md:py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <Card className="border-0 shadow-xl overflow-hidden">
          <CardHeader className="text-center space-y-3 pb-6 md:pb-8 px-5 md:px-8 pt-6 md:pt-8 bg-gradient-to-b from-[#FDFBF7] to-white">
            <div className="w-16 h-16 bg-gradient-to-br from-[#6B5D4F] to-[#C9A66B] rounded-2xl flex items-center justify-center mx-auto mb-2 shadow-lg">
              <Building2 className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl md:text-3xl font-bold text-[#4A3F35]">تسجيل شركة هندسية استشارية</CardTitle>
            <p className="text-slate-500 text-sm md:text-base">انضم إلى شبكة الشركات الهندسية الاستشارية المعتمدة</p>
            <div className="flex items-start gap-2 bg-amber-50/60 border border-amber-100 rounded-lg p-3 text-right">
              <Info className="w-4 h-4 text-[#C9A66B] shrink-0 mt-0.5" />
              <p className="text-xs text-slate-600 leading-relaxed">
                الحقول المطلوبة مميزة بعلامة <span className="text-red-500 font-bold">*</span> — سيتم مراجعة طلبك من إدارة المنصة خلال 24 ساعة.
              </p>
            </div>
          </CardHeader>

          <CardContent className="px-5 md:px-8 pb-6 md:pb-8">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Company Basic Info */}
              <section>
                <div className="flex items-center gap-2 mb-4 pb-2 border-b-2 border-[#C9A66B]/30">
                  <div className="w-7 h-7 rounded-full bg-[#6B5D4F] text-white text-sm font-bold flex items-center justify-center">1</div>
                  <h3 className="text-base md:text-lg font-semibold text-[#4A3F35]">معلومات الشركة الأساسية</h3>
                </div>

                <div className="space-y-5">
                  <div>
                    <Label className="block mb-1.5 text-sm font-medium text-[#4A3F35]">
                      اسم الشركة <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      value={formData.company_name}
                      onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                      placeholder="مثال: شركة التصميم الحديث"
                      required
                      className="h-12 text-base"
                    />
                  </div>

                  <div>
                    <Label className="block mb-1.5 text-sm font-medium text-[#4A3F35]">
                      رقم السجل التجاري <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      value={formData.commercial_registration}
                      onChange={(e) => setFormData({ ...formData, commercial_registration: e.target.value })}
                      placeholder="1234567890"
                      required
                      inputMode="numeric"
                      className="h-12 text-base"
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-5">
                    <div>
                      <Label className="block mb-1.5 text-sm font-medium text-[#4A3F35]">
                        رقم الهاتف
                      </Label>
                      <Input
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="+966 5XXXXXXXX"
                        inputMode="tel"
                        className="h-12 text-base"
                      />
                    </div>

                    <div>
                      <Label className="block mb-1.5 text-sm font-medium text-[#4A3F35]">
                        الموقع الإلكتروني
                      </Label>
                      <Input
                        value={formData.website}
                        onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                        placeholder="https://example.com"
                        inputMode="url"
                        className="h-12 text-base"
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-3 gap-5">
                    <div>
                      <Label className="block mb-1.5 text-sm font-medium text-[#4A3F35]">المدينة</Label>
                      <Input
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        placeholder="الرياض"
                        className="h-12 text-base"
                      />
                    </div>

                    <div>
                      <Label className="block mb-1.5 text-sm font-medium text-[#4A3F35]">الدولة</Label>
                      <Input
                        value={formData.country}
                        onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                        className="h-12 text-base"
                      />
                    </div>

                    <div>
                      <Label className="block mb-1.5 text-sm font-medium text-[#4A3F35]">سنة التأسيس</Label>
                      <Input
                        type="number"
                        value={formData.established_year}
                        onChange={(e) => setFormData({ ...formData, established_year: parseInt(e.target.value) })}
                        className="h-12 text-base"
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="block mb-1.5 text-sm font-medium text-[#4A3F35]">نبذة عن الشركة</Label>
                    <Textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="اكتب نبذة تعريفية عن الشركة وخدماتها..."
                      rows={4}
                      className="text-base"
                    />
                  </div>
                </div>
              </section>

              {/* Specializations */}
              <section>
                <div className="flex items-center gap-2 mb-4 pb-2 border-b-2 border-[#C9A66B]/30">
                  <div className="w-7 h-7 rounded-full bg-[#6B5D4F] text-white text-sm font-bold flex items-center justify-center">2</div>
                  <h3 className="text-base md:text-lg font-semibold text-[#4A3F35]">التخصصات الهندسية</h3>
                  <span className="text-xs text-slate-400 mr-auto">(اختياري — اختر ما يناسبك)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                  {specializations.map((spec) => {
                    const selected = formData.specializations.includes(spec);
                    return (
                      <button
                        key={spec}
                        type="button"
                        onClick={() => toggleSpecialization(spec)}
                        className={`flex items-center gap-2 p-3 rounded-xl border-2 text-sm transition-all text-right min-h-[48px] ${
                          selected
                            ? "border-[#C9A66B] bg-amber-50 text-[#4A3F35] font-medium"
                            : "border-slate-200 bg-white text-slate-600 hover:border-[#C9A66B]/50"
                        }`}
                      >
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                          selected ? "border-[#C9A66B] bg-[#C9A66B]" : "border-slate-300"
                        }`}>
                          {selected && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                        </div>
                        <span className="leading-tight">{spec}</span>
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* Images Upload */}
              <section>
                <div className="flex items-center gap-2 mb-4 pb-2 border-b-2 border-[#C9A66B]/30">
                  <div className="w-7 h-7 rounded-full bg-[#6B5D4F] text-white text-sm font-bold flex items-center justify-center">3</div>
                  <h3 className="text-base md:text-lg font-semibold text-[#4A3F35]">الشعار وصورة الغلاف</h3>
                  <span className="text-xs text-slate-400 mr-auto">(اختياري)</span>
                </div>

                <div className="grid md:grid-cols-2 gap-5">
                  <div>
                    <Label className="block mb-2 text-sm font-medium text-[#4A3F35]">شعار الشركة</Label>
                    {formData.company_logo ? (
                      <div className="flex items-center gap-3">
                        <img src={formData.company_logo} alt="الشعار" className="w-20 h-20 object-cover rounded-lg border-2 border-[#C9A66B]/30" />
                        <Button type="button" variant="outline" size="sm" onClick={() => setFormData({ ...formData, company_logo: "" })}>
                          تغيير
                        </Button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer hover:bg-amber-50/40 hover:border-[#C9A66B] transition-colors min-h-[112px]">
                        <div className="flex flex-col items-center">
                          {uploadingLogo ? (
                            <Loader2 className="w-7 h-7 animate-spin text-[#C9A66B]" />
                          ) : (
                            <>
                              <Upload className="w-6 h-6 text-[#C9A66B] mb-1.5" />
                              <span className="text-sm text-slate-500 font-medium">رفع الشعار</span>
                              <span className="text-xs text-slate-400 mt-0.5">PNG, JPG</span>
                            </>
                          )}
                        </div>
                        <input type="file" className="hidden" onChange={handleLogoUpload} accept="image/*" />
                      </label>
                    )}
                  </div>

                  <div>
                    <Label className="block mb-2 text-sm font-medium text-[#4A3F35]">صورة الغلاف</Label>
                    {formData.cover_image ? (
                      <div>
                        <img src={formData.cover_image} alt="الغلاف" className="w-full h-28 object-cover rounded-xl border-2 border-[#C9A66B]/30" />
                        <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => setFormData({ ...formData, cover_image: "" })}>
                          تغيير
                        </Button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer hover:bg-amber-50/40 hover:border-[#C9A66B] transition-colors min-h-[112px]">
                        <div className="flex flex-col items-center">
                          {uploadingCover ? (
                            <Loader2 className="w-7 h-7 animate-spin text-[#C9A66B]" />
                          ) : (
                            <>
                              <Upload className="w-6 h-6 text-[#C9A66B] mb-1.5" />
                              <span className="text-sm text-slate-500 font-medium">رفع صورة الغلاف</span>
                              <span className="text-xs text-slate-400 mt-0.5">PNG, JPG</span>
                            </>
                          )}
                        </div>
                        <input type="file" className="hidden" onChange={handleCoverUpload} accept="image/*" />
                      </label>
                    )}
                  </div>
                </div>
              </section>

              {/* Documents */}
              <section>
                <div className="flex items-center gap-2 mb-4 pb-2 border-b-2 border-[#C9A66B]/30">
                  <div className="w-7 h-7 rounded-full bg-[#6B5D4F] text-white text-sm font-bold flex items-center justify-center">4</div>
                  <h3 className="text-base md:text-lg font-semibold text-[#4A3F35]">المستندات الرسمية</h3>
                </div>

                <Label className="block mb-2 text-sm font-medium text-[#4A3F35]">
                  السجل التجاري، الرخصة، وما إلى ذلك
                </Label>
                <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer hover:bg-amber-50/40 hover:border-[#C9A66B] transition-colors min-h-[96px]">
                  <div className="flex flex-col items-center">
                    {uploadingDocs ? (
                      <Loader2 className="w-6 h-6 animate-spin text-[#C9A66B]" />
                    ) : (
                      <>
                        <FileText className="w-6 h-6 text-[#C9A66B] mb-1" />
                        <span className="text-sm text-slate-500 font-medium">رفع المستندات</span>
                        <span className="text-xs text-slate-400 mt-0.5">PDF, JPG, PNG — يمكن رفع أكثر من ملف</span>
                      </>
                    )}
                  </div>
                  <input type="file" className="hidden" onChange={handleDocumentsUpload} accept=".pdf,.jpg,.jpeg,.png" multiple />
                </label>
                {formData.documents.length > 0 && (
                  <p className="text-sm text-green-600 mt-2 flex items-center gap-1">
                    <CheckCircle className="w-4 h-4" />
                    تم رفع {formData.documents.length} مستند
                  </p>
                )}
              </section>

              {/* Submit */}
              <div className="pt-2">
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-13 bg-gradient-to-r from-[#6B5D4F] to-[#C9A66B] text-white text-base font-semibold py-3.5 min-h-[52px]"
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