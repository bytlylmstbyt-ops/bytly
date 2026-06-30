import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { 
  Upload, X, Plus, CheckCircle, Loader2, Image as ImageIcon,
  Trash2, Edit3
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";

export default function AddPortfolio() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [engineer, setEngineer] = useState(null);
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    style: "",
    project_type: "",
    location: "",
    year: new Date().getFullYear(),
    client_name: "",
    tags: []
  });
  
  const [images, setImages] = useState([]);
  const [tagInput, setTagInput] = useState("");

  const categories = [
    { value: "interior", label: "تصميم داخلي" },
    { value: "architecture", label: "عمارة" },
    { value: "painting", label: "رسم" },
    { value: "landscape", label: "تنسيق حدائق" },
    { value: "furniture", label: "أثاث" },
    { value: "lighting", label: "إضاءة" },
    { value: "civil_engineering", label: "هندسة مدنية" },
    { value: "structural_design", label: "تصميم إنشائي" },
    { value: "executive_drawing", label: "رسومات تنفيذية" }
  ];

  const styles = [
    { value: "modern", label: "مودرن" },
    { value: "classic", label: "كلاسيك" },
    { value: "contemporary", label: "معاصر" },
    { value: "traditional", label: "تقليدي" },
    { value: "minimalist", label: "مينيماليست" },
    { value: "luxury", label: "فاخر" },
    { value: "industrial", label: "صناعي" },
    { value: "scandinavian", label: "اسكندنافي" },
    { value: "mediterranean", label: "متوسطي" },
    { value: "islamic", label: "إسلامي" },
    { value: "other", label: "آخر" }
  ];

  useEffect(() => {
    loadEngineer();
  }, []);

  const loadEngineer = async () => {
    try {
      const user = await base44.auth.me();
      const engineers = await base44.entities.Engineer.filter({ email: user.email });
      
      if (engineers.length === 0) {
        toast({
          title: "تنبيه",
          description: "يجب إنشاء ملف مهندس أولاً",
          variant: "destructive"
        });
        navigate("/Dashboard");
        return;
      }
      
      setEngineer(engineers[0]);
    } catch (error) {
      console.error("Error loading engineer:", error);
    }
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploadingImages(true);
    
    try {
      const uploadPromises = files.map(async (file) => {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        return file_url;
      });

      const uploadedUrls = await Promise.all(uploadPromises);
      setImages(prev => [...prev, ...uploadedUrls]);
      
      toast({
        title: "تم الرفع",
        description: `تم رفع ${uploadedUrls.length} صورة بنجاح`,
      });
    } catch (error) {
      toast({
        title: "خطأ",
        description: "فشل رفع الصور",
        variant: "destructive"
      });
    } finally {
      setUploadingImages(false);
    }
  };

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!engineer) {
      toast({
        title: "خطأ",
        description: "يجب إنشاء ملف مهندس أولاً",
        variant: "destructive"
      });
      return;
    }

    if (images.length === 0) {
      toast({
        title: "تنبيه",
        description: "يجب رفع صورة واحدة على الأقل",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      await base44.entities.Portfolio.create({
        ...formData,
        engineer_id: engineer.id,
        images
      });

      toast({
        title: "تم الحفظ",
        description: "تمت إضافة العمل للمعرض بنجاح",
      });

      navigate(`/EngineerProfile?id=${engineer.id}`);
    } catch (error) {
      toast({
        title: "خطأ",
        description: error?.message || "فشل الحفظ",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-amber-50/30 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-[#1a1a2e] mb-2">إضافة عمل جديد</h1>
            <p className="text-slate-600">أضف مشروعاً جديداً إلى معرض أعمالك</p>
          </div>

          <Card className="border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-[#d4a574]" />
                معلومات المشروع
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Images Upload */}
                <div className="space-y-2">
                  <Label>صور المشروع *</Label>
                  <div className="border-2 border-dashed border-slate-200 rounded-lg p-6 text-center hover:border-[#d4a574] transition-colors">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageUpload}
                      disabled={uploadingImages}
                      className="hidden"
                      id="image-upload"
                    />
                    <label htmlFor="image-upload">
                      <div className="cursor-pointer">
                        <Upload className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                        <p className="text-sm text-slate-600 mb-1">
                          {uploadingImages ? "جاري الرفع..." : "اضغط لرفع الصور"}
                        </p>
                        <p className="text-xs text-slate-500">
                          PNG, JPG حتى 10MB
                        </p>
                      </div>
                    </label>
                  </div>

                  {images.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                      {images.map((url, index) => (
                        <div key={index} className="relative group aspect-square rounded-lg overflow-hidden border">
                          <img src={url} alt="" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute top-1 right-1 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Title */}
                <div className="space-y-2">
                  <Label htmlFor="title">عنوان المشروع *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="مثال: تصميم فيلا مودرن"
                    required
                  />
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description">وصف المشروع</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="اكتب وصفاً تفصيلياً للمشروع..."
                    rows={4}
                  />
                </div>

                {/* Category & Style & Project Type */}
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>التصنيف</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="اختر التصنيف" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map(cat => (
                          <SelectItem key={cat.value} value={cat.value}>
                            {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>النمط</Label>
                    <Select
                      value={formData.style}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, style: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="اختر النمط" />
                      </SelectTrigger>
                      <SelectContent>
                        {styles.map(style => (
                          <SelectItem key={style.value} value={style.value}>
                            {style.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="project_type">نوع المشروع</Label>
                    <Input
                      id="project_type"
                      value={formData.project_type}
                      onChange={(e) => setFormData(prev => ({ ...prev, project_type: e.target.value }))}
                      placeholder="مثال: سكني، تجاري..."
                    />
                  </div>
                </div>

                {/* Location & Year */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="location">الموقع</Label>
                    <Input
                      id="location"
                      value={formData.location}
                      onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                      placeholder="المدينة، الدولة"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="year">سنة التنفيذ</Label>
                    <Input
                      id="year"
                      type="number"
                      value={formData.year}
                      onChange={(e) => setFormData(prev => ({ ...prev, year: parseInt(e.target.value) }))}
                      min={1900}
                      max={new Date().getFullYear()}
                    />
                  </div>
                </div>

                {/* Client Name */}
                <div className="space-y-2">
                  <Label htmlFor="client_name">اسم العميل (اختياري)</Label>
                  <Input
                    id="client_name"
                    value={formData.client_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, client_name: e.target.value }))}
                    placeholder="اسم العميل أو الشركة"
                  />
                </div>

                {/* Tags */}
                <div className="space-y-2">
                  <Label>الوسوم</Label>
                  <div className="flex gap-2">
                    <Input
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                      placeholder="أضف وسماً واضغط Enter"
                    />
                    <Button type="button" onClick={addTag} variant="outline">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  {formData.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {formData.tags.map((tag, index) => (
                        <Badge key={index} variant="secondary" className="gap-1">
                          {tag}
                          <button
                            type="button"
                            onClick={() => removeTag(tag)}
                            className="hover:text-red-500"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                {/* Submit */}
                <div className="flex gap-3 pt-4">
                  <Button 
                    type="submit" 
                    className="flex-1 bg-gradient-to-r from-[#1a1a2e] to-[#d4a574]"
                    disabled={loading || uploadingImages}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        جاري الحفظ...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4 ml-2" />
                        حفظ المشروع
                      </>
                    )}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => navigate(-1)}
                    disabled={loading}
                  >
                    إلغاء
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}