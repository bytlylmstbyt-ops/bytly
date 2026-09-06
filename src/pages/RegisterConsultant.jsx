import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { supabase } from "@/lib/supabaseClient";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "../utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, Loader2, CheckCircle, FileText } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { motion } from "framer-motion";

export default function RegisterConsultantPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    consultant_type: "",
    engineers_society_membership_number: "",
    engineering_specialization: "",
    iban: "",
    bank_name: "",
    bio: "",
    city: "",
    country: "السعودية",
    years_experience: "",
    certificates: []
  });
  const [termsAccepted, setTermsAccepted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!termsAccepted) {
      alert("يجب الموافقة على الشروط والأحكام للمتابعة");
      return;
    }
    
    setLoading(true);

    try {
      const { data: authData } = await supabase.auth.getUser();
      const authUser = authData?.user;
      if (!authUser) throw new Error("يجب تسجيل الدخول أولاً");
      const consultant = await base44.entities.Consultant.create({
        ...formData,
        email: authUser.email || formData.email,
        user_id: authUser.id,
        years_experience: parseInt(formData.years_experience) || 0,
        status: "pending",
        terms_accepted: true,
        terms_accepted_date: new Date().toISOString()
      });
      try { base44.functions.invoke("notifyNewUserSignup", { role: "consultant", data: consultant }).catch((err) => console.error("Background notification failed:", err)); }
      catch (notifyErr) { console.error("notifyNewUserSignup consultant failed:", notifyErr); }
      try { base44.functions.invoke("sendWelcomeEmail", { role: "consultant", id: consultant.id }).catch((err) => console.error("Background notification failed:", err)); }
      catch (welcomeErr) { console.error("sendWelcomeEmail consultant failed:", welcomeErr); }

      alert("تم تقديم طلب التسجيل بنجاح! سيتم مراجعته من قبل الإدارة.");
      navigate(createPageUrl("RegistrationSuccess"));
    } catch (error) {
      console.error("Error registering consultant:", error);
      alert("حدث خطأ أثناء التسجيل. يرجى المحاولة مرة أخرى.");
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData({
        ...formData,
        certificates: [...formData.certificates, file_url]
      });
    } catch (error) {
      console.error("Error uploading file:", error);
      alert("فشل رفع الملف");
    }
  };

  return (
    <div className="min-h-screen py-12 px-4" dir="rtl">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold gradient-text mb-4">
            التسجيل كمستشار فني
          </h1>
          <p className="text-slate-600">
            انضم إلى فريق المستشارين الفنيين المعتمدين
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>بيانات التسجيل</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Personal Info */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-slate-900">المعلومات الشخصية</h3>
                  
                  <div>
                    <Label htmlFor="full_name">الاسم الكامل *</Label>
                    <Input
                      id="full_name"
                      required
                      value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="email">البريد الإلكتروني *</Label>
                      <Input
                        id="email"
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">رقم الهاتف *</Label>
                      <Input
                        id="phone"
                        required
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="city">المدينة</Label>
                      <Input
                        id="city"
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="years_experience">سنوات الخبرة</Label>
                      <Input
                        id="years_experience"
                        type="number"
                        value={formData.years_experience}
                        onChange={(e) => setFormData({ ...formData, years_experience: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                {/* Professional Info */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-slate-900">المعلومات المهنية</h3>
                  
                  <div>
                    <Label htmlFor="consultant_type">نوع الاستشارة *</Label>
                    <Select
                      value={formData.consultant_type}
                      onValueChange={(value) => setFormData({ ...formData, consultant_type: value })}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="اختر نوع الاستشارة" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="architectural">مستشار معماري</SelectItem>
                        <SelectItem value="structural">مستشار إنشائي</SelectItem>
                        <SelectItem value="graphic">مستشار جرافيك</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="engineers_society_membership_number">رقم عضوية هيئة المهندسين *</Label>
                    <Input
                      id="engineers_society_membership_number"
                      required
                      value={formData.engineers_society_membership_number}
                      onChange={(e) => setFormData({ ...formData, engineers_society_membership_number: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="engineering_specialization">التخصص الهندسي *</Label>
                    <Input
                      id="engineering_specialization"
                      required
                      value={formData.engineering_specialization}
                      onChange={(e) => setFormData({ ...formData, engineering_specialization: e.target.value })}
                      placeholder="مثال: هندسة معمارية، مدنية، جرافيك ديزاين"
                    />
                  </div>

                  <div>
                    <Label htmlFor="bio">نبذة تعريفية</Label>
                    <Textarea
                      id="bio"
                      value={formData.bio}
                      onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                      rows={4}
                    />
                  </div>
                </div>

                {/* Banking Info */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-slate-900">المعلومات البنكية</h3>
                  
                  <div>
                    <Label htmlFor="iban">رقم الآيبان (IBAN)</Label>
                    <Input
                      id="iban"
                      value={formData.iban}
                      onChange={(e) => setFormData({ ...formData, iban: e.target.value })}
                      placeholder="SA0000000000000000000000"
                      className="font-mono"
                    />
                  </div>

                  <div>
                    <Label htmlFor="bank_name">اسم البنك</Label>
                    <Input
                      id="bank_name"
                      value={formData.bank_name}
                      onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                    />
                  </div>
                </div>

                {/* Certificates */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-slate-900">الشهادات المهنية</h3>
                  
                  <div>
                    <Label htmlFor="certificates">رفع الشهادات</Label>
                    <div className="mt-2">
                      <input
                        type="file"
                        id="certificates"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => document.getElementById('certificates').click()}
                      >
                        <Upload className="w-4 h-4 ml-2" />
                        رفع ملف
                      </Button>
                    </div>
                    {formData.certificates.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {formData.certificates.map((cert, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-sm text-green-600">
                            <CheckCircle className="w-4 h-4" />
                            تم رفع الملف {idx + 1}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Terms and Conditions */}
                <div className="space-y-4 border-t pt-6">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="terms"
                      checked={termsAccepted}
                      onCheckedChange={setTermsAccepted}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <Label htmlFor="terms" className="cursor-pointer font-semibold text-slate-900">
                        أوافق على الشروط والأحكام الخاصة بالمستشارين الفنيين *
                      </Label>
                      <div className="mt-3 p-4 bg-amber-50 rounded-lg border border-amber-200 space-y-2 text-sm text-slate-700">
                        <p className="font-semibold text-slate-900 flex items-center gap-2">
                          <FileText className="w-4 h-4 text-amber-600" />
                          بصفتي مستشاراً فنياً في منصة بيتلي، ألتزم بالآتي:
                        </p>
                        <ul className="space-y-2 mr-4">
                          <li><strong>١. دقة المراجعة:</strong> أقر بمسؤوليتي المهنية عن مراجعة المخططات والتصاميم وفقاً لكود البناء السعودي والمعايير الهندسية المعتمدة.</li>
                          <li><strong>٢. النزاهة والحياد:</strong> ألتزم بتقديم تقييم فني عادل ومحايد للمخرجات دون تحيز للمصمم أو العميل.</li>
                          <li><strong>٣. سرية المعلومات:</strong> أتعهد بعدم مشاركة أو تسريب أي مخططات أو بيانات خاصة بالمشاريع التي أطلع عليها خارج نطاق المنصة.</li>
                          <li><strong>٤. الالتزام بالوقت:</strong> ألتزم بالرد على طلبات المراجعة خلال (48 ساعة) من استلام الإشعار لضمان سير العمل.</li>
                          <li><strong>٥. الأتعاب والرسوم:</strong> أوافق على آلية تحصيل الأتعاب المبرمجة آلياً داخل المنصة بعد اعتماد الجودة النهائي.</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading || !termsAccepted}
                  className="w-full bg-gradient-to-r from-[#1a1a2e] to-[#C9A66B] disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin ml-2" />
                      جاري التسجيل...
                    </>
                  ) : (
                    "تقديم طلب التسجيل"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}