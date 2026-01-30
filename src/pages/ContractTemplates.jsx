import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { 
  FileText, Plus, Edit, Trash2, Copy, Eye, 
  Check, X, ChevronDown, ChevronUp
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

export default function ContractTemplates() {
  const [templates, setTemplates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [expandedClauses, setExpandedClauses] = useState([]);
  const [templateData, setTemplateData] = useState({
    name: "",
    description: "",
    contract_type: "service_agreement",
    default_terms: "",
    default_payment_terms: "30% دفعة مقدمة، 40% عند التصاميم الأولية، 30% عند التسليم النهائي",
    custom_clauses: [],
    is_active: true,
    is_default: false
  });
  const [newClause, setNewClause] = useState({
    title: "",
    content: "",
    is_required: false,
    is_editable: true,
    order: 0
  });

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    setIsLoading(true);
    const data = await base44.entities.ContractTemplate.list();
    setTemplates(data);
    setIsLoading(false);
  };

  const handleAddClause = () => {
    if (!newClause.title || !newClause.content) {
      alert("يرجى ملء عنوان ومحتوى البند");
      return;
    }

    const clause = {
      ...newClause,
      clause_id: `clause_${Date.now()}`,
      order: templateData.custom_clauses.length
    };

    setTemplateData({
      ...templateData,
      custom_clauses: [...templateData.custom_clauses, clause]
    });

    setNewClause({
      title: "",
      content: "",
      is_required: false,
      is_editable: true,
      order: 0
    });
  };

  const handleRemoveClause = (clauseId) => {
    setTemplateData({
      ...templateData,
      custom_clauses: templateData.custom_clauses.filter(c => c.clause_id !== clauseId)
    });
  };

  const handleSaveTemplate = async () => {
    if (!templateData.name) {
      alert("يرجى إدخال اسم القالب");
      return;
    }

    try {
      if (editingTemplate) {
        await base44.entities.ContractTemplate.update(editingTemplate.id, templateData);
      } else {
        await base44.entities.ContractTemplate.create(templateData);
      }

      setIsDialogOpen(false);
      setEditingTemplate(null);
      resetForm();
      loadTemplates();
    } catch (error) {
      console.error("Error saving template:", error);
      alert("حدث خطأ أثناء حفظ القالب");
    }
  };

  const handleEditTemplate = (template) => {
    setEditingTemplate(template);
    setTemplateData({
      name: template.name,
      description: template.description || "",
      contract_type: template.contract_type,
      default_terms: template.default_terms || "",
      default_payment_terms: template.default_payment_terms || "",
      custom_clauses: template.custom_clauses || [],
      is_active: template.is_active,
      is_default: template.is_default
    });
    setIsDialogOpen(true);
  };

  const handleDeleteTemplate = async (id) => {
    if (!confirm("هل أنت متأكد من حذف هذا القالب؟")) return;

    try {
      await base44.entities.ContractTemplate.delete(id);
      loadTemplates();
    } catch (error) {
      console.error("Error deleting template:", error);
    }
  };

  const resetForm = () => {
    setTemplateData({
      name: "",
      description: "",
      contract_type: "service_agreement",
      default_terms: "",
      default_payment_terms: "30% دفعة مقدمة، 40% عند التصاميم الأولية، 30% عند التسليم النهائي",
      custom_clauses: [],
      is_active: true,
      is_default: false
    });
  };

  const toggleClauseExpansion = (clauseId) => {
    setExpandedClauses(prev => 
      prev.includes(clauseId) 
        ? prev.filter(id => id !== clauseId)
        : [...prev, clauseId]
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#d4a574]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-amber-50/30 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-[#1a1a2e] flex items-center gap-3">
                <FileText className="w-8 h-8 text-[#d4a574]" />
                قوالب العقود
              </h1>
              <p className="text-slate-600 mt-2">إدارة وتخصيص قوالب العقود القابلة لإعادة الاستخدام</p>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  className="bg-gradient-to-r from-[#1a1a2e] to-[#d4a574] text-white"
                  onClick={() => {
                    setEditingTemplate(null);
                    resetForm();
                  }}
                >
                  <Plus className="w-5 h-5 ml-2" />
                  قالب جديد
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingTemplate ? "تعديل القالب" : "إنشاء قالب جديد"}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-6 mt-4">
                  {/* Basic Info */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>اسم القالب *</Label>
                      <Input
                        value={templateData.name}
                        onChange={(e) => setTemplateData({ ...templateData, name: e.target.value })}
                        placeholder="مثال: عقد تصميم داخلي قياسي"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>نوع العقد</Label>
                      <Select
                        value={templateData.contract_type}
                        onValueChange={(value) => setTemplateData({ ...templateData, contract_type: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="project_start">عقد بدء مشروع</SelectItem>
                          <SelectItem value="service_agreement">عقد اتفاق خدمات</SelectItem>
                          <SelectItem value="custom">مخصص</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>الوصف</Label>
                    <Textarea
                      value={templateData.description}
                      onChange={(e) => setTemplateData({ ...templateData, description: e.target.value })}
                      placeholder="وصف القالب واستخداماته..."
                      rows={2}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>شروط الدفع الافتراضية</Label>
                    <Textarea
                      value={templateData.default_payment_terms}
                      onChange={(e) => setTemplateData({ ...templateData, default_payment_terms: e.target.value })}
                      rows={2}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>الشروط الافتراضية</Label>
                    <Textarea
                      value={templateData.default_terms}
                      onChange={(e) => setTemplateData({ ...templateData, default_terms: e.target.value })}
                      placeholder="أي شروط إضافية افتراضية..."
                      rows={3}
                    />
                  </div>

                  {/* Custom Clauses */}
                  <div className="border-t pt-6">
                    <h3 className="text-lg font-semibold mb-4">البنود المخصصة القابلة للتعديل</h3>
                    
                    {/* Existing Clauses */}
                    {templateData.custom_clauses.length > 0 && (
                      <div className="space-y-3 mb-4">
                        {templateData.custom_clauses.map((clause) => (
                          <div key={clause.clause_id} className="border rounded-lg p-4 bg-slate-50">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1">
                                <h4 className="font-semibold text-slate-900">{clause.title}</h4>
                                <div className="flex gap-2 mt-1">
                                  {clause.is_required && (
                                    <Badge variant="secondary" className="bg-red-100 text-red-700">
                                      إلزامي
                                    </Badge>
                                  )}
                                  {clause.is_editable && (
                                    <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                                      قابل للتعديل
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => toggleClauseExpansion(clause.clause_id)}
                                >
                                  {expandedClauses.includes(clause.clause_id) ? (
                                    <ChevronUp className="w-4 h-4" />
                                  ) : (
                                    <ChevronDown className="w-4 h-4" />
                                  )}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleRemoveClause(clause.clause_id)}
                                >
                                  <Trash2 className="w-4 h-4 text-red-500" />
                                </Button>
                              </div>
                            </div>
                            {expandedClauses.includes(clause.clause_id) && (
                              <p className="text-sm text-slate-600 mt-2 whitespace-pre-wrap">
                                {clause.content}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Add New Clause */}
                    <Card>
                      <CardContent className="pt-6 space-y-4">
                        <div className="space-y-2">
                          <Label>عنوان البند</Label>
                          <Input
                            value={newClause.title}
                            onChange={(e) => setNewClause({ ...newClause, title: e.target.value })}
                            placeholder="مثال: شروط التعديلات الإضافية"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>محتوى البند</Label>
                          <Textarea
                            value={newClause.content}
                            onChange={(e) => setNewClause({ ...newClause, content: e.target.value })}
                            placeholder="نص البند التفصيلي..."
                            rows={4}
                          />
                        </div>
                        <div className="flex gap-4">
                          <div className="flex items-center gap-2">
                            <Checkbox
                              checked={newClause.is_required}
                              onCheckedChange={(checked) => setNewClause({ ...newClause, is_required: checked })}
                            />
                            <Label className="cursor-pointer">بند إلزامي</Label>
                          </div>
                          <div className="flex items-center gap-2">
                            <Checkbox
                              checked={newClause.is_editable}
                              onCheckedChange={(checked) => setNewClause({ ...newClause, is_editable: checked })}
                            />
                            <Label className="cursor-pointer">قابل للتعديل</Label>
                          </div>
                        </div>
                        <Button onClick={handleAddClause} variant="outline" className="w-full">
                          <Plus className="w-4 h-4 ml-2" />
                          إضافة البند
                        </Button>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Options */}
                  <div className="flex gap-4 pt-4">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={templateData.is_active}
                        onCheckedChange={(checked) => setTemplateData({ ...templateData, is_active: checked })}
                      />
                      <Label className="cursor-pointer">القالب نشط</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={templateData.is_default}
                        onCheckedChange={(checked) => setTemplateData({ ...templateData, is_default: checked })}
                      />
                      <Label className="cursor-pointer">قالب افتراضي</Label>
                    </div>
                  </div>

                  <Button
                    onClick={handleSaveTemplate}
                    className="w-full bg-gradient-to-r from-[#1a1a2e] to-[#d4a574] text-white"
                  >
                    <Check className="w-4 h-4 ml-2" />
                    {editingTemplate ? "حفظ التعديلات" : "إنشاء القالب"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </motion.div>

        {/* Templates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template) => (
            <motion.div
              key={template.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="hover:shadow-lg transition-all">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-2">{template.name}</CardTitle>
                      <div className="flex gap-2">
                        {template.is_default && (
                          <Badge className="bg-green-100 text-green-700">افتراضي</Badge>
                        )}
                        {!template.is_active && (
                          <Badge variant="secondary">غير نشط</Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEditTemplate(template)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteTemplate(template.id)}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-600 mb-4">
                    {template.description || "لا يوجد وصف"}
                  </p>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-500">عدد البنود:</span>
                      <span className="font-medium">{template.custom_clauses?.length || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">الاستخدامات:</span>
                      <span className="font-medium">{template.usage_count || 0}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {templates.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="w-16 h-16 mx-auto text-slate-300 mb-4" />
              <h3 className="text-lg font-semibold mb-2">لا توجد قوالب</h3>
              <p className="text-slate-600">ابدأ بإنشاء قالب عقد جديد</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}