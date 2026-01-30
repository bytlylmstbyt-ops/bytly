import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { 
  User, Upload, X, Loader2, CheckCircle, Mail, Phone, 
  MapPin, Briefcase, Award, FileText
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function AddEngineer() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    user_type: "",
    specialization: "",
    registration_number: "",
    bio: "",
    city: "",
    country: "المملكة العربية السعودية",
    profile_image: "",
    cover_image: "",
    graduation_certificate_url: "",
    years_experience: 0,
    is_verified: true,
    status: "approved"
  });

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = async (e, field) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setFormData(prev => ({ ...prev, [field]: file_url }));
    setIsUploading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    await base44.entities.Engineer.create({
      ...formData,
      years_experience: parseInt(formData.years_experience)
    });

    setIsLoading(false);
    navigate(createPageUrl("Engineers"));
  };

  const userTypes = [
    { value: "engineer", label: "مهندس تصميم داخلي" },
    { value: "architect", label: "مهندس معماري" },
    { value: "painter", label: "رسام هندسي" }
  ];

  const isFormValid = formData.full_name && formData.email && formData.user_type && formData.profile_image;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-amber-50/30 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-[#1a1a2e] to-[#d4a574] flex items-center justify-center mb-4">
            <User className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#1a1a2e] mb-2">
            إضافة مهندس جديد
          </h1>
          <p className="text-slate-600">أضف بيانات المهندس كاملة للمنصة</p>
        </motion.div>

        <Card className="border-0 shadow-xl">
          <CardContent className="p-6 md:p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Profile & Cover Images */}
              <div className="space-y-4">
                <Label>الصور</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Profile Image */}
                  <div className="space-y-2">
                    <Label className="text-sm text-slate-600">الصورة الشخصية *</Label>
                    {formData.profile_image ? (
                      <div className="relative group">
                        <img 
                          src={formData.profile_image} 
                          alt="Profile" 
                          className="w-full h-48 object-cover rounded-xl"
                        />
                        <button
                          type="button"
                          onClick={() => handleInputChange("profile_image", "")}
                          className="absolute top-2 right-2 w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <label className="h-48 border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-[#d4a574] transition-colors">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileUpload(e, "profile_image")}
                          className="hidden"
                        />
                        {isUploading ? (
                          <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
                        ) : (
                          <>
                            <Upload className="w-8 h-8 text-slate-400 mb-2" />
                            <span className="text-sm text-slate-500">رفع الصورة</span>
                          </>
                        )}
                      </label>
                    )}
                  </div>

                  {/* Cover Image */}
                  <div className="space-y-2">
                    <Label className="text-sm text-slate-600">صورة الغلاف</Label>
                    {formData.cover_image ? (
                      <div className="relative group">
                        <img 
                          src={formData.cover_image} 
                          alt="Cover" 
                          className="w-full h-48 object-cover rounded-xl"
                        />
                        <button
                          type="button"
                          onClick={() => handleInputChange("cover_image", "")}
                          className="absolute top-2 right-2 w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <label className="h-48 border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-[#d4a574] transition-colors">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileUpload(e, "cover_image")}
                          className="hidden"
                        />
                        <Upload className="w-8 h-8 text-slate-400 mb-2" />
                        <span className="text-sm text-slate-500">رفع الصورة</span>
                      </label>
                    )}
                  </div>
                </div>
              </div>

              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="full_name">الاسم الكامل *</Label>
                  <Input
                    id="full_name"
                    value={formData.full_name}
                    onChange={(e) => handleInputChange("full_name", e.target.value)}
                    required
                  />
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
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">رقم الهاتف</Label>
                  <div className="relative">
                    <Phone className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => handleInputChange("phone", e.target.value)}
                      className="pr-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>نوع المهندس *</Label>
                  <Select
                    value={formData.user_type}
                    onValueChange={(value) => handleInputChange("user_type", value)}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر النوع" />
                    </SelectTrigger>
                    <SelectContent>
                      {userTypes.map(type => (
                        <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="specialization">التخصص</Label>
                  <div className="relative">
                    <Briefcase className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <Input
                      id="specialization"
                      value={formData.specialization}
                      onChange={(e) => handleInputChange("specialization", e.target.value)}
                      className="pr-10"
                      placeholder="مثال: تصميم داخلي معاصر"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="registration_number">رقم القيد المهني</Label>
                  <div className="relative">
                    <Award className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <Input
                      id="registration_number"
                      value={formData.registration_number}
                      onChange={(e) => handleInputChange("registration_number", e.target.value)}
                      className="pr-10"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">المدينة</Label>
                  <div className="relative">
                    <MapPin className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => handleInputChange("city", e.target.value)}
                      className="pr-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="years_experience">سنوات الخبرة</Label>
                  <Input
                    id="years_experience"
                    type="number"
                    value={formData.years_experience}
                    onChange={(e) => handleInputChange("years_experience", e.target.value)}
                    min={0}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">نبذة تعريفية</Label>
                <Textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => handleInputChange("bio", e.target.value)}
                  placeholder="نبذة عن المهندس وخبراته..."
                  rows={4}
                />
              </div>

              {/* Certificate Upload */}
              <div className="space-y-2">
                <Label>شهادة التخرج</Label>
                {formData.graduation_certificate_url ? (
                  <div className="flex items-center justify-between p-4 bg-green-50 rounded-xl">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="text-sm text-green-700">تم رفع الشهادة</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleInputChange("graduation_certificate_url", "")}
                      className="text-red-600 hover:text-red-700"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                ) : (
                  <label className="border-2 border-dashed rounded-xl p-6 flex flex-col items-center cursor-pointer hover:border-[#d4a574] transition-colors">
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => handleFileUpload(e, "graduation_certificate_url")}
                      className="hidden"
                    />
                    <FileText className="w-8 h-8 text-slate-400 mb-2" />
                    <span className="text-sm text-slate-500">رفع شهادة التخرج</span>
                  </label>
                )}
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                <div>
                  <Label htmlFor="is_verified" className="text-base">حساب موثق</Label>
                  <p className="text-sm text-slate-500">سيظهر المهندس كموثق</p>
                </div>
                <Switch
                  id="is_verified"
                  checked={formData.is_verified}
                  onCheckedChange={(checked) => handleInputChange("is_verified", checked)}
                />
              </div>

              <Button
                type="submit"
                disabled={!isFormValid || isLoading}
                className="w-full bg-gradient-to-r from-[#1a1a2e] to-[#d4a574] text-white py-6 text-lg"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin ml-2" />
                    جاري الإضافة...
                  </>
                ) : (
                  <>
                    إضافة المهندس
                    <CheckCircle className="w-5 h-5 mr-2" />
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}