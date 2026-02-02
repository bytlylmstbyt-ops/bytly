import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { 
  Briefcase, MapPin, Calendar, DollarSign, 
  Upload, X, Loader2, CheckCircle, FileText, Plus, Building, Zap, HelpCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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
    project_type: "express_service",
    budget_min: "",
    budget_max: "",
    location: "",
    deadline: "",
    attachments: [],
    milestones: []
  });
  
  const [showMilestones, setShowMilestones] = useState(false);

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

  const addMilestone = () => {
    const newMilestone = {
      title: "",
      description: "",
      percentage: 0,
      due_days: 7
    };
    setFormData(prev => ({
      ...prev,
      milestones: [...prev.milestones, newMilestone]
    }));
  };

  const updateMilestone = (index, field, value) => {
    const updatedMilestones = [...formData.milestones];
    updatedMilestones[index][field] = value;
    setFormData(prev => ({ ...prev, milestones: updatedMilestones }));
  };

  const removeMilestone = (index) => {
    setFormData(prev => ({
      ...prev,
      milestones: prev.milestones.filter((_, i) => i !== index)
    }));
  };

  const totalPercentage = formData.milestones.reduce((sum, m) => sum + (parseFloat(m.percentage) || 0), 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!client) {
      alert("يرجى إكمال تسجيل حساب صاحب مشروع أولاً");
      return;
    }

    if (showMilestones && totalPercentage !== 100) {
      alert("يجب أن يكون مجموع نسب المراحل 100%");
      return;
    }

    setIsLoading(true);
    
    const newProject = await base44.entities.Project.create({
      title: formData.title,
      description: formData.description,
      category: formData.category,
      project_type: formData.project_type,
      budget_min: parseFloat(formData.budget_min) || 0,
      budget_max: parseFloat(formData.budget_max) || 0,
      location: formData.location,
      deadline: formData.deadline,
      attachments: formData.attachments,
      client_id: client.id,
      status: "open",
      total_proposals: 0
    });

    // Create milestones if defined
    if (showMilestones && formData.milestones.length > 0) {
      const projectBudget = parseFloat(formData.budget_max) || parseFloat(formData.budget_min) || 0;
      
      for (let i = 0; i < formData.milestones.length; i++) {
        const milestone = formData.milestones[i];
        const milestoneAmount = (projectBudget * parseFloat(milestone.percentage)) / 100;
        
        await base44.entities.ProjectMilestone.create({
          project_id: newProject.id,
          title: milestone.title,
          description: milestone.description,
          amount: milestoneAmount,
          percentage: parseFloat(milestone.percentage),
          order: i + 1,
          status: "pending",
          due_date: new Date(Date.now() + milestone.due_days * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        });
      }
    }

    // Update client's total projects
    await base44.entities.Client.update(client.id, {
      total_projects: (client.total_projects || 0) + 1
    });

    // Send notifications to matching engineers
    const matchingEngineers = await base44.entities.Engineer.filter({
      status: "approved"
    });

    const notificationsToSend = matchingEngineers
      .filter(eng => {
        // Match by category or user_type
        if (formData.category === "interior" && eng.user_type === "engineer") return true;
        if (formData.category === "architecture" && eng.user_type === "architect") return true;
        if (formData.category === "painting" && eng.user_type === "painter") return true;
        if (formData.category === "civil_engineering" && eng.user_type === "civil") return true;
        return false;
      })
      .map(eng => ({
        recipient_email: eng.email,
        title: "مشروع جديد مطابق لتخصصك",
        message: `تم نشر مشروع جديد: ${formData.title}. الميزانية: ${formData.budget_min}-${formData.budget_max} ريال.`,
        type: "project_update",
        related_project_id: newProject.id,
        priority: "high"
      }));

    // Create notifications in bulk
    if (notificationsToSend.length > 0) {
      await Promise.all(
        notificationsToSend.map(notif => base44.entities.Notification.create(notif))
      );
    }

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
              {/* Project Type Selection */}
              <div className="space-y-3">
                <Label className="text-base font-semibold flex items-center gap-2">
                  نوع المشروع *
                  <HelpCircle className="w-4 h-4 text-slate-400" />
                </Label>
                <RadioGroup
                  value={formData.project_type}
                  onValueChange={(value) => {
                    handleInputChange("project_type", value);
                    setShowMilestones(value === "full_construction");
                  }}
                  className="grid grid-cols-1 md:grid-cols-2 gap-4"
                >
                  <div>
                    <RadioGroupItem value="full_construction" id="full_construction" className="peer sr-only" />
                    <Label
                      htmlFor="full_construction"
                      className="flex flex-col rounded-xl border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-[#d4a574] peer-data-[state=checked]:bg-[#d4a574]/5 cursor-pointer transition-all"
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <Building className="h-6 w-6 text-slate-700" />
                        <div className="flex-1">
                          <p className="font-semibold text-slate-900">مشروع بناء كامل</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            6 مراحل + مراجعة استشارية
                          </p>
                        </div>
                      </div>
                      <div className="space-y-1 text-xs text-slate-600">
                        <p>✓ تصميم إنشائي كامل</p>
                        <p>✓ موافقة الشركة الهندسية</p>
                        <p>✓ دفع محجوز بأمان</p>
                      </div>
                    </Label>
                  </div>
                  <div>
                    <RadioGroupItem value="express_service" id="express_service" className="peer sr-only" />
                    <Label
                      htmlFor="express_service"
                      className="flex flex-col rounded-xl border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-[#d4a574] peer-data-[state=checked]:bg-[#d4a574]/5 cursor-pointer transition-all"
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <Zap className="h-6 w-6 text-amber-600" />
                        <div className="flex-1">
                          <p className="font-semibold text-slate-900">خدمة سريعة</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            مرحلتين فقط (50% + 50%)
                          </p>
                        </div>
                      </div>
                      <div className="space-y-1 text-xs text-slate-600">
                        <p>✓ تصميم واجهات / ديكور</p>
                        <p>✓ رسومات تنفيذية 2D</p>
                        <p>✓ تسليم سريع</p>
                      </div>
                    </Label>
                  </div>
                </RadioGroup>
                
                {formData.project_type === "full_construction" && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
                    💡 المشاريع الكاملة تتطلب موافقة شركة هندسية استشارية قبل تحرير الدفعات
                  </div>
                )}
              </div>

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

              {/* Milestones Section */}
              <div className="space-y-3 border-t pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>
                      {formData.project_type === "full_construction" ? 
                        "مراحل المشروع (6 مراحل)" : 
                        "تحديد مراحل المشروع (اختياري)"}
                    </Label>
                    <p className="text-xs text-slate-500 mt-1">
                      {formData.project_type === "full_construction" ? 
                        "المشاريع الكاملة تتطلب تقسيم لمراحل متعددة" :
                        "قسّم المشروع لمراحل لضمان دفع آمن ومتدرج"}
                    </p>
                  </div>
                  {formData.project_type === "express_service" && (
                    <Button
                      type="button"
                      variant={showMilestones ? "default" : "outline"}
                      onClick={() => setShowMilestones(!showMilestones)}
                      size="sm"
                    >
                      {showMilestones ? "إخفاء المراحل" : "إضافة مراحل"}
                    </Button>
                  )}
                </div>

                {showMilestones && (
                  <div className="space-y-3">
                    {formData.milestones.map((milestone, index) => (
                      <Card key={index} className="p-4 border-[#d4a574]/30">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium text-sm">المرحلة {index + 1}</h4>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeMilestone(index)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                          
                          <Input
                            placeholder="عنوان المرحلة"
                            value={milestone.title}
                            onChange={(e) => updateMilestone(index, "title", e.target.value)}
                          />
                          
                          <Textarea
                            placeholder="وصف المرحلة والمخرجات المطلوبة"
                            value={milestone.description}
                            onChange={(e) => updateMilestone(index, "description", e.target.value)}
                            rows={2}
                          />
                          
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <Label className="text-xs">النسبة من المبلغ %</Label>
                              <Input
                                type="number"
                                placeholder="0"
                                value={milestone.percentage}
                                onChange={(e) => updateMilestone(index, "percentage", e.target.value)}
                                min="0"
                                max="100"
                              />
                            </div>
                            <div>
                              <Label className="text-xs">المدة بالأيام</Label>
                              <Input
                                type="number"
                                placeholder="7"
                                value={milestone.due_days}
                                onChange={(e) => updateMilestone(index, "due_days", e.target.value)}
                                min="1"
                              />
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                    
                    <Button
                      type="button"
                      variant="outline"
                      onClick={addMilestone}
                      className="w-full border-dashed"
                    >
                      + إضافة مرحلة جديدة
                    </Button>
                    
                    {formData.milestones.length > 0 && (
                      <div className={`text-sm p-3 rounded-lg ${totalPercentage === 100 ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>
                        إجمالي النسب: {totalPercentage}% {totalPercentage === 100 ? '✓' : '(يجب أن يساوي 100%)'}
                      </div>
                    )}
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