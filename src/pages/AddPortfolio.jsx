import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { 
  Palette, MapPin, Calendar, Upload, X, 
  Loader2, CheckCircle, Image, Plus
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

export default function AddPortfolio() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [engineer, setEngineer] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    project_type: "",
    location: "",
    year: new Date().getFullYear(),
    images: [],
    is_featured: false
  });

  useEffect(() => {
    loadEngineerData();
  }, []);

  const loadEngineerData = async () => {
    const user = await base44.auth.me();
    const engineerData = await base44.entities.Engineer.filter({ email: user.email });
    if (engineerData.length > 0) {
      setEngineer(engineerData[0]);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setIsUploading(true);
    
    const uploadedUrls = [];
    for (const file of files) {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      uploadedUrls.push(file_url);
    }
    
    setFormData(prev => ({
      ...prev,
      images: [...prev.images, ...uploadedUrls]
    }));
    setIsUploading(false);
  };

  const removeImage = (index) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!engineer) {
      alert("يرجى إكمال تسجيل حساب المهندس أولاً");
      return;
    }

    setIsLoading(true);
    
    await base44.entities.Portfolio.create({
      ...formData,
      engineer_id: engineer.id,
      year: parseInt(formData.year)
    });

    setIsLoading(false);
    navigate(createPageUrl("Dashboard"));
  };

  const categories = [
    { value: "interior", label: "تصميم داخلي" },
    { value: "architecture", label: "تصميم معماري" },
    { value: "painting", label: "رسم هندسي" },
    { value: "landscape", label: "تنسيق حدائق" },
    { value: "furniture", label: "تصميم أثاث" },
    { value: "lighting", label: "تصميم إضاءة" }
  ];

  const projectTypes = [
    "فيلا", "شقة", "مكتب", "محل تجاري", "مطعم", "فندق", 
    "مستشفى", "مدرسة", "مسجد", "حديقة", "أخرى"
  ];

  const isFormValid = formData.title && formData.category && formData.images.length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-amber-50/30 py-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-[#1a1a2e] to-[#d4a574] flex items-center justify-center mb-4">
            <Palette className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#1a1a2e] mb-2">
            إضافة عمل جديد
          </h1>
          <p className="text-slate-600">أضف أعمالك لعرضها على العملاء المحتملين</p>
        </motion.div>

        <Card className="border-0 shadow-xl">
          <CardContent className="p-6 md:p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Images Upload */}
              <div className="space-y-2">
                <Label>صور العمل * (يمكن رفع حتى 10 صور)</Label>
                <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                  {formData.images.map((url, index) => (
                    <div key={index} className="relative group aspect-square">
                      <img 
                        src={url} 
                        alt="" 
                        className="w-full h-full object-cover rounded-xl"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-2 right-2 w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/70 text-white text-xs rounded">
                        {index + 1}
                      </div>
                    </div>
                  ))}
                  
                  {formData.images.length < 10 && (
                    <label className="aspect-square border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-[#d4a574] transition-colors">
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                      {isUploading ? (
                        <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
                      ) : (
                        <>
                          <Plus className="w-8 h-8 text-slate-400 mb-2" />
                          <span className="text-xs text-slate-500 text-center px-2">إضافة صور</span>
                        </>
                      )}
                    </label>
                  )}
                </div>
                <p className="text-xs text-slate-500">رفعت {formData.images.length} من 10 صور</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">عنوان العمل *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange("title", e.target.value)}
                  placeholder="مثال: تصميم فيلا فاخرة"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">وصف العمل</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  placeholder="اشرح تفاصيل العمل ومميزاته..."
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>التصنيف *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => handleInputChange("category", value)}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر التصنيف" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(cat => (
                        <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>نوع المشروع</Label>
                  <Select
                    value={formData.project_type}
                    onValueChange={(value) => handleInputChange("project_type", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر النوع" />
                    </SelectTrigger>
                    <SelectContent>
                      {projectTypes.map(type => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="location">موقع المشروع</Label>
                  <div className="relative">
                    <MapPin className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <Input
                      id="location"
                      value={formData.location}
                      onChange={(e) => handleInputChange("location", e.target.value)}
                      className="pr-10"
                      placeholder="المدينة"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="year">سنة التنفيذ</Label>
                  <div className="relative">
                    <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <Input
                      id="year"
                      type="number"
                      value={formData.year}
                      onChange={(e) => handleInputChange("year", e.target.value)}
                      className="pr-10"
                      min={2000}
                      max={new Date().getFullYear()}
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                <div>
                  <Label htmlFor="featured" className="text-base">عمل مميز</Label>
                  <p className="text-sm text-slate-500">سيظهر في الصفحة الرئيسية</p>
                </div>
                <Switch
                  id="featured"
                  checked={formData.is_featured}
                  onCheckedChange={(checked) => handleInputChange("is_featured", checked)}
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
                    إضافة العمل
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