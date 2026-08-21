import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "../utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Scale, Loader2, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import LegalTermsSection from "../components/LegalTermsSection";

export default function RegisterLegalConsultantPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState({
    confidentiality: false,
    responsibility: false,
    intellectual_property: false,
    all_terms: false
  });
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    lawyer_license_number: "",
    city: "",
    legal_specialization: "",
    bio: "",
    years_experience: ""
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!termsAccepted.all_terms) {
      alert("يجب الموافقة على جميع الشروط والأحكام القانونية لإكمال التسجيل");
      return;
    }

    setLoading(true);

    try {
      const legalConsultant = await base44.entities.LegalConsultant.create({
        ...formData,
        years_experience: parseInt(formData.years_experience) || 0,
        status: "pending",
        terms_and_conditions: {
          confidentiality_clause: "تم الموافقة",
          responsibility_clause: "تم الموافقة",
          intellectual_property_clause: "تم الموافقة",
          accepted: true,
          accepted_date: new Date().toISOString()
        }
      });
      try { await base44.functions.invoke("notifyNewUserSignup", { role: "legal_consultant", data: legalConsultant }); }
      catch (notifyErr) { console.error("notifyNewUserSignup legal consultant failed:", notifyErr); }
      try { await base44.functions.invoke("sendWelcomeEmail", { role: "legal_consultant", id: legalConsultant.id }); }
      catch (welcomeErr) { console.error("sendWelcomeEmail legal consultant failed:", welcomeErr); }

      alert("تم تقديم طلب التسجيل بنجاح! سيتم مراجعته من قبل الإدارة.");
      navigate(createPageUrl("RegistrationSuccess"));
    } catch (error) {
      console.error("Error registering legal consultant:", error);
      alert("حدث خطأ أثناء التسجيل. يرجى المحاولة مرة أخرى.");
    } finally {
      setLoading(false);
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
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center mx-auto mb-4">
            <Scale className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold gradient-text mb-4">
            التسجيل كمستشار قانوني
          </h1>
          <p className="text-slate-600">
            انضم لفريق المستشارين القانونيين لحماية حقوق المصممين والعملاء
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
                      <Label htmlFor="city">المدينة *</Label>
                      <Input
                        id="city"
                        required
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

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-slate-900">المعلومات المهنية</h3>
                  
                  <div>
                    <Label htmlFor="lawyer_license_number">رقم ترخيص المحاماة *</Label>
                    <Input
                      id="lawyer_license_number"
                      required
                      value={formData.lawyer_license_number}
                      onChange={(e) => setFormData({ ...formData, lawyer_license_number: e.target.value })}
                      placeholder="رقم الترخيص من وزارة العدل"
                    />
                  </div>

                  <div>
                    <Label htmlFor="legal_specialization">التخصص القانوني *</Label>
                    <Input
                      id="legal_specialization"
                      required
                      value={formData.legal_specialization}
                      onChange={(e) => setFormData({ ...formData, legal_specialization: e.target.value })}
                      placeholder="مثال: قانون العقود التجارية، الملكية الفكرية، حل النزاعات"
                    />
                  </div>

                  <div>
                    <Label htmlFor="bio">نبذة تعريفية</Label>
                    <Textarea
                      id="bio"
                      value={formData.bio}
                      onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                      rows={4}
                      placeholder="اكتب نبذة عن خبرتك القانونية..."
                    />
                  </div>
                  </div>

                  <LegalTermsSection 
                  onAcceptanceChange={setTermsAccepted}
                  isEditMode={false}
                  />

                  {!termsAccepted.all_terms && (
                  <motion.div
                   initial={{ opacity: 0 }}
                   animate={{ opacity: 1 }}
                   className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg"
                  >
                   <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                   <p className="text-sm text-red-700">
                     يجب الموافقة على جميع الشروط والأحكام القانونية لإكمال التسجيل
                   </p>
                  </motion.div>
                  )}

                  <Button
                  type="submit"
                  disabled={loading || !termsAccepted.all_terms}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 disabled:opacity-50"
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