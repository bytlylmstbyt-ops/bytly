import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { 
  ShoppingCart, Upload, X, Loader2, CheckCircle, 
  FileText, Plus, DollarSign, Ruler, Layers, Bed, Bath
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function AddDesign() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [seller, setSeller] = useState(null);
  const [sellerType, setSellerType] = useState(null);
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    design_style: "",
    price: "",
    modification_fee: "",
    area_sqm: "",
    floors: "",
    bedrooms: "",
    bathrooms: "",
    preview_images: [],
    design_files: [],
    includes: [],
    specifications: {
      has_basement: false,
      has_garage: false,
      has_garden: false,
      has_pool: false,
      has_majlis: false
    },
    tags: "",
    modification_available: true
  });

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    const currentUser = await base44.auth.me();
    setUser(currentUser);
    
    // Check if engineer or firm
    const engineerData = await base44.entities.Engineer.filter({ email: currentUser.email });
    if (engineerData.length > 0) {
      setSeller(engineerData[0]);
      setSellerType("engineer");
      return;
    }
    
    const firmData = await base44.entities.EngineeringFirm.filter({ email: currentUser.email });
    if (firmData.length > 0) {
      setSeller(firmData[0]);
      setSellerType("firm");
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSpecChange = (spec, checked) => {
    setFormData(prev => ({
      ...prev,
      specifications: { ...prev.specifications, [spec]: checked }
    }));
  };

  const handleImageUpload = async (e, type) => {
    const files = Array.from(e.target.files);
    setIsLoading(true);
    
    const uploadedUrls = [];
    for (const file of files) {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      uploadedUrls.push(file_url);
    }
    
    setFormData(prev => ({
      ...prev,
      [type]: [...prev[type], ...uploadedUrls]
    }));
    setIsLoading(false);
  };

  const removeFile = (type, index) => {
    setFormData(prev => ({
      ...prev,
      [type]: prev[type].filter((_, i) => i !== index)
    }));
  };

  const addInclude = () => {
    const newInclude = prompt("أدخل العنصر:");
    if (newInclude?.trim()) {
      setFormData(prev => ({
        ...prev,
        includes: [...prev.includes, newInclude.trim()]
      }));
    }
  };

  const removeInclude = (index) => {
    setFormData(prev => ({
      ...prev,
      includes: prev.includes.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!seller) {
      alert("يجب أن تكون مهندساً أو شركة هندسية لإضافة تصاميم");
      return;
    }

    setIsLoading(true);
    
    const tags = formData.tags.split(',').map(t => t.trim()).filter(t => t);
    
    await base44.entities.ReadyMadeDesign.create({
      seller_id: seller.id,
      seller_type: sellerType,
      seller_name: seller.full_name || seller.company_name,
      title: formData.title,
      description: formData.description,
      category: formData.category,
      design_style: formData.design_style,
      price: parseFloat(formData.price),
      modification_fee: parseFloat(formData.modification_fee) || 0,
      modification_available: formData.modification_available,
      area_sqm: parseFloat(formData.area_sqm) || null,
      floors: parseInt(formData.floors) || null,
      bedrooms: parseInt(formData.bedrooms) || null,
      bathrooms: parseInt(formData.bathrooms) || null,
      preview_images: formData.preview_images,
      design_files: formData.design_files,
      includes: formData.includes,
      specifications: formData.specifications,
      tags: tags,
      status: "active"
    });

    alert("تم إضافة التصميم بنجاح!");
    navigate(createPageUrl("DesignMarketplace"));
  };

  const categories = [
    { value: "villa", label: "فلل" },
    { value: "apartment", label: "شقق سكنية" },
    { value: "facade", label: "واجهات" },
    { value: "interior", label: "تصميم داخلي" },
    { value: "landscape", label: "حدائق" },
    { value: "commercial", label: "تجاري" }
  ];

  const styles = [
    { value: "modern", label: "عصري" },
    { value: "classic", label: "كلاسيكي" },
    { value: "islamic", label: "إسلامي" },
    { value: "contemporary", label: "معاصر" },
    { value: "minimalist", label: "بسيط" },
    { value: "luxury", label: "فاخر" }
  ];

  const isFormValid = formData.title && formData.description && formData.category && 
    formData.price && formData.preview_images.length > 0 && formData.design_files.length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-amber-50/30 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-green-600 to-emerald-600 flex items-center justify-center mb-4">
            <ShoppingCart className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#1a1a2e] mb-2">
            إضافة تصميم جاهز للبيع
          </h1>
          <p className="text-slate-600">اعرض تصاميمك الجاهزة للبيع في المتجر</p>
        </motion.div>

        <Card className="border-0 shadow-xl">
          <CardContent className="p-6 md:p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Info */}
              <div className="space-y-2">
                <Label htmlFor="title">عنوان التصميم *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange("title", e.target.value)}
                  placeholder="مثال: فيلا عصرية 400 متر"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">وصف التصميم *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  placeholder="اشرح مميزات التصميم والتفاصيل المعمارية..."
                  rows={5}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>التصنيف *</Label>
                  <Select value={formData.category} onValueChange={(value) => handleInputChange("category", value)} required>
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
                  <Label>النمط المعماري *</Label>
                  <Select value={formData.design_style} onValueChange={(value) => handleInputChange("design_style", value)} required>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر النمط" />
                    </SelectTrigger>
                    <SelectContent>
                      {styles.map(style => (
                        <SelectItem key={style.value} value={style.value}>{style.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Pricing */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">السعر (ر.س) *</Label>
                  <Input
                    id="price"
                    type="number"
                    value={formData.price}
                    onChange={(e) => handleInputChange("price", e.target.value)}
                    placeholder="5000"
                    required
                  />
                  <p className="text-xs text-amber-600">
                    💡 سيُخصم 25% عمولة منصة من كل عملية بيع
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="modification_fee">رسوم التعديل (ر.س)</Label>
                  <Input
                    id="modification_fee"
                    type="number"
                    value={formData.modification_fee}
                    onChange={(e) => handleInputChange("modification_fee", e.target.value)}
                    placeholder="1000"
                  />
                </div>
              </div>
              
              {/* Revenue Breakdown */}
              {formData.price && (
                <div className="p-4 bg-slate-50 rounded-lg space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">سعر البيع:</span>
                    <span className="font-semibold">{parseFloat(formData.price).toLocaleString('ar-SA')} ر.س</span>
                  </div>
                  <div className="flex justify-between text-red-600">
                    <span>عمولة المنصة (25%):</span>
                    <span>- {(parseFloat(formData.price) * 0.25).toLocaleString('ar-SA')} ر.س</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t text-green-600 font-bold">
                    <span>صافي أرباحك:</span>
                    <span>{(parseFloat(formData.price) * 0.75).toLocaleString('ar-SA')} ر.س</span>
                  </div>
                </div>
              )}

              {/* Specifications */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="area_sqm">المساحة (م²)</Label>
                  <Input
                    id="area_sqm"
                    type="number"
                    value={formData.area_sqm}
                    onChange={(e) => handleInputChange("area_sqm", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="floors">الطوابق</Label>
                  <Input
                    id="floors"
                    type="number"
                    value={formData.floors}
                    onChange={(e) => handleInputChange("floors", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bedrooms">غرف النوم</Label>
                  <Input
                    id="bedrooms"
                    type="number"
                    value={formData.bedrooms}
                    onChange={(e) => handleInputChange("bedrooms", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bathrooms">دورات المياه</Label>
                  <Input
                    id="bathrooms"
                    type="number"
                    value={formData.bathrooms}
                    onChange={(e) => handleInputChange("bathrooms", e.target.value)}
                  />
                </div>
              </div>

              {/* Additional Features */}
              <div className="space-y-3">
                <Label>مميزات إضافية</Label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { key: "has_basement", label: "قبو" },
                    { key: "has_garage", label: "مرآب" },
                    { key: "has_garden", label: "حديقة" },
                    { key: "has_pool", label: "مسبح" },
                    { key: "has_majlis", label: "مجلس" }
                  ].map(spec => (
                    <div key={spec.key} className="flex items-center gap-2">
                      <Checkbox
                        id={spec.key}
                        checked={formData.specifications[spec.key]}
                        onCheckedChange={(checked) => handleSpecChange(spec.key, checked)}
                      />
                      <Label htmlFor={spec.key} className="cursor-pointer">{spec.label}</Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Preview Images */}
              <div className="space-y-2">
                <Label>صور المعاينة * (على الأقل صورة واحدة)</Label>
                <div className="border-2 border-dashed rounded-xl p-6 text-center hover:border-[#d4a574] transition-colors">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, "preview_images")}
                    className="hidden"
                    id="preview_images"
                  />
                  <label htmlFor="preview_images" className="cursor-pointer">
                    <Upload className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                    <p className="text-sm text-slate-500">اضغط لرفع صور التصميم</p>
                  </label>
                </div>
                {formData.preview_images.length > 0 && (
                  <div className="grid grid-cols-4 gap-2 mt-3">
                    {formData.preview_images.map((url, index) => (
                      <div key={index} className="relative group">
                        <img src={url} alt="" className="w-full h-24 object-cover rounded-lg" />
                        <button
                          type="button"
                          onClick={() => removeFile("preview_images", index)}
                          className="absolute -top-2 -left-2 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Design Files */}
              <div className="space-y-2">
                <Label>الملفات الأصلية * (DWG, PDF, ZIP)</Label>
                <div className="border-2 border-dashed rounded-xl p-6 text-center hover:border-green-500 transition-colors bg-green-50/30">
                  <input
                    type="file"
                    multiple
                    accept=".dwg,.pdf,.zip,.rar"
                    onChange={(e) => handleImageUpload(e, "design_files")}
                    className="hidden"
                    id="design_files"
                  />
                  <label htmlFor="design_files" className="cursor-pointer">
                    <FileText className="w-10 h-10 text-green-600 mx-auto mb-2" />
                    <p className="text-sm text-green-700">رفع المخططات الأصلية</p>
                    <p className="text-xs text-slate-500 mt-1">المشتري سيحصل على هذه الملفات</p>
                  </label>
                </div>
                {formData.design_files.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.design_files.map((url, index) => (
                      <div key={index} className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg group">
                        <FileText className="w-4 h-4 text-green-600" />
                        <span className="text-sm">ملف {index + 1}</span>
                        <button
                          type="button"
                          onClick={() => removeFile("design_files", index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* What's Included */}
              <div className="space-y-2">
                <Label>ما يتضمنه التصميم</Label>
                <div className="space-y-2">
                  {formData.includes.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="flex-1 text-sm">{item}</span>
                      <button
                        type="button"
                        onClick={() => removeInclude(idx)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addInclude}
                    className="w-full border-dashed"
                  >
                    <Plus className="w-4 h-4 ml-2" />
                    إضافة عنصر
                  </Button>
                </div>
              </div>

              {/* Tags */}
              <div className="space-y-2">
                <Label htmlFor="tags">وسوم البحث (افصل بفواصل)</Label>
                <Input
                  id="tags"
                  value={formData.tags}
                  onChange={(e) => handleInputChange("tags", e.target.value)}
                  placeholder="فيلا, عصري, فاخر, مع مسبح"
                />
              </div>

              {/* Submit */}
              <Button
                type="submit"
                disabled={!isFormValid || isLoading}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-6 text-lg"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin ml-2" />
                    جاري النشر...
                  </>
                ) : (
                  <>
                    نشر في المتجر
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