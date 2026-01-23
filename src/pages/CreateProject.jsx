import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { 
  Briefcase, MapPin, Calendar, DollarSign, 
  Upload, X, Loader2, CheckCircle, FileText
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function CreateProject() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [client, setClient] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    budget_min: "",
    budget_max: "",
    location: "",
    deadline: "",
    attachments: []
  });

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    const currentUser = await base44.auth.me();
    setUser(currentUser);
    
    const clientData = await base44.entities.Client.filter({ email: currentUser.email });
    if (clientData.length > 0) {
      setClient(clientData[0]);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    setIsLoading(true);
    
    const uploadedUrls = [];
    for (const file of files) {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      uploadedUrls.push(file_url);
    }
    
    setFormData(prev => ({
      ...prev,
      attachments: [...prev.attachments, ...uploadedUrls]
    }));
    setIsLoading(false);
  };

  const removeAttachment = (index) => {
    setFormData(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!client) {
      alert("يرجى إكمال تسجيل حساب صاحب مشروع أولاً");
      return;
    }

    setIsLoading(true);
    
    await base44.entities.Project.create({
      ...formData,
      client_id: client.id,
      budget_min: parseFloat(formData.budget_min) || 0,
      budget_max: parseFloat(formData.budget_max) || 0,
      status: "open",
      total_proposals: 0
    });

    // Update client's total projects
    await base44.entities.Client.update(client.id, {
      total_projects: (client.total_projects || 0) + 1
    });

    setIsLoading(false);
    navigate(createPageUrl("Projects"));
  };

  const categories = [
    { value: "interior", label: "تصميم داخلي" },
    { value: "architecture", label: "تصميم معماري" },
    { value: "painting", label: "رسم هندسي" },
    { value: "landscape", label: "تنسيق حدائق" },
    { value: "furniture", label: "تصميم أثاث" },
    { value: "lighting", label: "تصميم إضاءة" }
  ];

  const isFormValid = formData.title && formData.description && formData.category;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-amber-50/30 py-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-[#1a1a2e] to-[#d4a574] flex items-center justify-center mb-4">
            <Briefcase className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#1a1a2e] mb-2">
            إضافة مشروع جديد
          </h1>
          <p className="text-slate-600">أضف تفاصيل مشروعك للحصول على عروض من المهندسين</p>
        </motion.div>

        <Card className="border-0 shadow-xl">
          <CardContent className="p-6 md:p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">عنوان المشروع *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange("title", e.target.value)}
                  placeholder="مثال: تصميم شقة سكنية 150 متر"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">وصف المشروع *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  placeholder="اشرح تفاصيل مشروعك ومتطلباتك..."
                  rows={5}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>تصنيف المشروع *</Label>
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

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="budget_min">الميزانية من (ر.س)</Label>
                  <div className="relative">
                    <DollarSign className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <Input
                      id="budget_min"
                      type="number"
                      value={formData.budget_min}
                      onChange={(e) => handleInputChange("budget_min", e.target.value)}
                      className="pr-10"
                      placeholder="0"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="budget_max">الميزانية إلى (ر.س)</Label>
                  <div className="relative">
                    <DollarSign className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <Input
                      id="budget_max"
                      type="number"
                      value={formData.budget_max}
                      onChange={(e) => handleInputChange("budget_max", e.target.value)}
                      className="pr-10"
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">موقع المشروع</Label>
                <div className="relative">
                  <MapPin className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => handleInputChange("location", e.target.value)}
                    className="pr-10"
                    placeholder="مثال: الرياض، حي النخيل"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="deadline">الموعد النهائي المتوقع</Label>
                <div className="relative">
                  <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <Input
                    id="deadline"
                    type="date"
                    value={formData.deadline}
                    onChange={(e) => handleInputChange("deadline", e.target.value)}
                    className="pr-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>المرفقات (صور، مخططات، ملفات)</Label>
                <div className="border-2 border-dashed rounded-xl p-6 text-center hover:border-[#d4a574] transition-colors">
                  <input
                    type="file"
                    multiple
                    onChange={handleFileUpload}
                    className="hidden"
                    id="attachments"
                    accept="image/*,.pdf,.dwg"
                  />
                  <label htmlFor="attachments" className="cursor-pointer">
                    <Upload className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                    <p className="text-sm text-slate-500">اضغط لرفع الملفات</p>
                    <p className="text-xs text-slate-400 mt-1">صور، PDF، DWG</p>
                  </label>
                </div>

                {formData.attachments.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {formData.attachments.map((url, index) => (
                      <div key={index} className="relative group">
                        <div className="w-20 h-20 rounded-lg overflow-hidden bg-slate-100">
                          {url.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                            <img src={url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <FileText className="w-8 h-8 text-slate-400" />
                            </div>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => removeAttachment(index)}
                          className="absolute -top-2 -left-2 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Button
                type="submit"
                disabled={!isFormValid || isLoading}
                className="w-full bg-gradient-to-r from-[#1a1a2e] to-[#d4a574] text-white py-6 text-lg"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin ml-2" />
                    جاري النشر...
                  </>
                ) : (
                  <>
                    نشر المشروع
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