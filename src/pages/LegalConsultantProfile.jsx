import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Scale, Save, Loader2, Camera } from "lucide-react";
import LegalTermsSection from "../components/LegalTermsSection";
import LegalTemplateUploader from "../components/LegalTemplateUploader";

export default function LegalConsultantProfile() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    const currentUser = await base44.auth.me();
    setUser(currentUser);

    const [legalConsultant] = await base44.entities.LegalConsultant.filter({
      email: currentUser.email
    });

    if (legalConsultant) {
      setProfile(legalConsultant);
      setFormData(legalConsultant);
    }

    setIsLoading(false);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsSaving(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    handleInputChange("profile_image", file_url);
    setIsSaving(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await base44.entities.LegalConsultant.update(profile.id, formData);
      setProfile(formData);
      alert("تم حفظ التغييرات بنجاح");
    } catch (error) {
      console.error("Error saving profile:", error);
      alert("حدث خطأ أثناء الحفظ");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#C9A66B]"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="p-8 text-center">
            <Scale className="w-12 h-12 mx-auto mb-4 text-slate-400" />
            <h2 className="text-xl font-bold text-slate-700 mb-4">لم يتم العثور على الملف الشخصي</h2>
            <p className="text-slate-500">يرجى إكمال التسجيل كمستشار قانوني أولاً</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-amber-50/30 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-4">
            <div className="relative">
              <Avatar className="w-24 h-24 border-4 border-white shadow-lg">
                <AvatarImage src={formData.profile_image} />
                <AvatarFallback className="bg-gradient-to-br from-blue-600 to-indigo-600 text-white text-2xl">
                  {formData.full_name?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <label className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-[#C9A66B] text-white flex items-center justify-center cursor-pointer hover:bg-[#C9A66B] transition-colors">
                <Camera className="w-4 h-4" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-[#1a1a2e]">{formData.full_name}</h1>
              <p className="text-slate-600">{formData.legal_specialization}</p>
              <div className="flex gap-2 mt-2">
                <Badge className={
                  profile.status === 'approved' ? 'bg-green-100 text-green-800' :
                  profile.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }>
                  {profile.status === 'approved' ? 'معتمد' :
                   profile.status === 'pending' ? 'قيد المراجعة' : 'مرفوض'}
                </Badge>
                {profile.is_verified && (
                  <Badge className="bg-blue-100 text-blue-800">موثق</Badge>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="bg-white shadow-sm">
            <TabsTrigger value="profile">المعلومات الشخصية</TabsTrigger>
            <TabsTrigger value="terms">الشروط والأحكام</TabsTrigger>
            <TabsTrigger value="templates">القوالب القانونية</TabsTrigger>
            <TabsTrigger value="stats">الإحصائيات</TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <Card>
              <CardContent className="pt-6 space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">الاسم الكامل</label>
                    <Input
                      value={formData.full_name || ""}
                      onChange={(e) => handleInputChange("full_name", e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">البريد الإلكتروني</label>
                    <Input
                      type="email"
                      value={formData.email || ""}
                      disabled
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">رقم الهاتف</label>
                    <Input
                      value={formData.phone || ""}
                      onChange={(e) => handleInputChange("phone", e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">المدينة</label>
                    <Input
                      value={formData.city || ""}
                      onChange={(e) => handleInputChange("city", e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">التخصص القانوني</label>
                    <Input
                      value={formData.legal_specialization || ""}
                      onChange={(e) => handleInputChange("legal_specialization", e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">سنوات الخبرة</label>
                    <Input
                      type="number"
                      value={formData.years_experience || ""}
                      onChange={(e) => handleInputChange("years_experience", e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">رقم ترخيص المحاماة</label>
                  <Input
                    value={formData.lawyer_license_number || ""}
                    onChange={(e) => handleInputChange("lawyer_license_number", e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">نبذة تعريفية</label>
                  <Textarea
                    value={formData.bio || ""}
                    onChange={(e) => handleInputChange("bio", e.target.value)}
                    rows={4}
                  />
                </div>

                <Button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin ml-2" />
                      جاري الحفظ...
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5 ml-2" />
                      حفظ التغييرات
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Terms Tab */}
          <TabsContent value="terms">
            <LegalTermsSection isEditMode={true} />
          </TabsContent>

          {/* Templates Tab */}
          <TabsContent value="templates">
            <LegalTemplateUploader consultantId={profile.id} />
          </TabsContent>

          {/* Stats Tab */}
          <TabsContent value="stats">
            <div className="grid md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6 text-center">
                  <p className="text-3xl font-bold text-[#1a1a2e]">
                    {profile.total_contracts_reviewed || 0}
                  </p>
                  <p className="text-slate-600 text-sm mt-2">عقد تم مراجعته</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <p className="text-3xl font-bold text-[#1a1a2e]">
                    {profile.total_disputes_resolved || 0}
                  </p>
                  <p className="text-slate-600 text-sm mt-2">نزاع تم حله</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <p className="text-3xl font-bold text-[#1a1a2e]">
                    {profile.wallet_balance?.toLocaleString()}
                  </p>
                  <p className="text-slate-600 text-sm mt-2">رصيد المحفظة</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}