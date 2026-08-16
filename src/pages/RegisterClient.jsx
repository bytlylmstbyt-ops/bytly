import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { 
  User, Mail, Phone, MapPin, Upload, 
  Loader2, CheckCircle, Briefcase, Home, Building2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export default function RegisterClient() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    city: "",
    country: "",
    profile_image: "",
    client_type: "individual",
    company_name: ""
  });

  // Load Google user info if available
  useEffect(() => {
    const storedInfo = sessionStorage.getItem('googleUserInfo');
    if (storedInfo) {
      try {
        const userInfo = JSON.parse(storedInfo);
        setFormData(prev => ({
          ...prev,
          full_name: userInfo.name || prev.full_name,
          email: userInfo.email || prev.email,
          profile_image: userInfo.picture || prev.profile_image
        }));
        sessionStorage.removeItem('googleUserInfo');
      } catch (err) {
        console.error('Error loading Google user info:', err);
      }
    }
  }, []);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsLoading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    handleInputChange("profile_image", file_url);
    setIsLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    const client = await base44.entities.Client.create({
      ...formData,
      wallet_balance: 0,
      total_projects: 0
    });
    try { await base44.functions.invoke("notifyNewUserSignup", { role: "client", data: client }); }
    catch (notifyErr) { console.error("notifyNewUserSignup client failed (non-blocking):", notifyErr); }
    try { await base44.functions.invoke("sendWelcomeEmail", { role: "client", id: client.id }); }
    catch (welcomeErr) { console.error("sendWelcomeEmail client failed (non-blocking):", welcomeErr); }

    setIsLoading(false);
    navigate(createPageUrl("RegistrationSuccess"));
  };

  const isFormValid = formData.full_name && formData.email && formData.phone;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-amber-50/30 py-12">
      <div className="max-w-lg mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center mb-4">
            <Briefcase className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#1a1a2e] mb-2">
            التسجيل كصاحب مشروع
          </h1>
          <p className="text-slate-600">أنشئ حسابك وابدأ في طرح مشاريعك</p>
        </motion.div>

        {/* Form Card */}
        <Card className="border-0 shadow-xl">
          <CardHeader>
            <CardTitle className="text-xl">معلومات الحساب</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Client Type Selection */}
              <div className="space-y-3">
                <Label>نوع الحساب *</Label>
                <RadioGroup
                  value={formData.client_type}
                  onValueChange={(value) => handleInputChange("client_type", value)}
                  className="grid grid-cols-2 gap-4"
                >
                  <div>
                    <RadioGroupItem value="individual" id="individual" className="peer sr-only" />
                    <Label
                      htmlFor="individual"
                      className="flex flex-col items-center justify-between rounded-xl border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-[#C9A66B] peer-data-[state=checked]:bg-[#C9A66B]/5 cursor-pointer"
                    >
                      <Home className="mb-3 h-8 w-8" />
                      <div className="text-center">
                        <p className="font-semibold">صاحب منزل</p>
                        <p className="text-xs text-muted-foreground mt-1">مشروع شخصي واحد</p>
                      </div>
                    </Label>
                  </div>
                  <div>
                    <RadioGroupItem value="investor" id="investor" className="peer sr-only" />
                    <Label
                      htmlFor="investor"
                      className="flex flex-col items-center justify-between rounded-xl border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-[#C9A66B] peer-data-[state=checked]:bg-[#C9A66B]/5 cursor-pointer"
                    >
                      <Building2 className="mb-3 h-8 w-8" />
                      <div className="text-center">
                        <p className="font-semibold">مستثمر/مطور</p>
                        <p className="text-xs text-muted-foreground mt-1">مشاريع متعددة</p>
                      </div>
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {formData.client_type === "investor" && (
                <div className="space-y-2">
                  <Label htmlFor="company_name">اسم الشركة</Label>
                  <Input
                    id="company_name"
                    value={formData.company_name}
                    onChange={(e) => handleInputChange("company_name", e.target.value)}
                    placeholder="أدخل اسم شركتك أو مؤسستك"
                  />
                </div>
              )}

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
                    required
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
                    required
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
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="country">الدولة</Label>
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
                  <Label htmlFor="city">المدينة</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => handleInputChange("city", e.target.value)}
                    placeholder="مثال: الرياض"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>صورة شخصية (اختياري)</Label>
                <div className="border-2 border-dashed rounded-xl p-6 text-center hover:border-[#C9A66B] transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
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

              <Button
                type="submit"
                disabled={!isFormValid || isLoading}
                className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white py-6 text-lg"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin ml-2" />
                    جاري التسجيل...
                  </>
                ) : (
                  <>
                    إنشاء الحساب
                    <CheckCircle className="w-5 h-5 mr-2" />
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-center mt-6"
        >
          <p className="text-slate-500">
            لديك حساب بالفعل؟{" "}
            <button 
              onClick={() => window.location.href = '/login'}
              className="text-[#C9A66B] font-medium hover:underline"
            >
              تسجيل الدخول
            </button>
          </p>
        </motion.div>
      </div>
    </div>
  );
}