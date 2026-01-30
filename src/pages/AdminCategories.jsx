import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Tag, Plus, Edit, Trash2, Loader2, Save, X
} from "lucide-react";
import { motion } from "framer-motion";

export default function AdminCategoriesPage() {
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([
    { id: "interior", label: "تصميم داخلي", active: true },
    { id: "architecture", label: "تصميم معماري", active: true },
    { id: "painting", label: "رسم هندسي", active: true },
    { id: "landscape", label: "تنسيق حدائق", active: true },
    { id: "furniture", label: "تصميم أثاث", active: true },
    { id: "lighting", label: "تصميم إضاءة", active: true },
    { id: "civil_engineering", label: "هندسة مدنية", active: true },
    { id: "structural_design", label: "تصميم إنشائي", active: true },
    { id: "executive_drawing", label: "رسومات تنفيذية", active: true }
  ]);
  const [projectTypes, setProjectTypes] = useState([
    "فيلا", "شقة", "مكتب", "محل تجاري", "مطعم", "فندق", 
    "مستشفى", "مدرسة", "مسجد", "حديقة", "أخرى"
  ]);
  const [editingCategory, setEditingCategory] = useState(null);
  const [newProjectType, setNewProjectType] = useState("");

  useEffect(() => {
    checkAdmin();
  }, []);

  const checkAdmin = async () => {
    try {
      const user = await base44.auth.me();
      if (user.role !== "admin") {
        alert("غير مصرح لك بالوصول لهذه الصفحة");
        return;
      }
      setLoading(false);
    } catch (error) {
      alert("حدث خطأ في التحقق من الصلاحيات");
    }
  };

  const toggleCategoryStatus = (categoryId) => {
    setCategories(prev => prev.map(cat => 
      cat.id === categoryId ? { ...cat, active: !cat.active } : cat
    ));
  };

  const updateCategoryLabel = (categoryId, newLabel) => {
    setCategories(prev => prev.map(cat => 
      cat.id === categoryId ? { ...cat, label: newLabel } : cat
    ));
    setEditingCategory(null);
  };

  const addProjectType = () => {
    if (newProjectType.trim() && !projectTypes.includes(newProjectType.trim())) {
      setProjectTypes(prev => [...prev, newProjectType.trim()]);
      setNewProjectType("");
    }
  };

  const removeProjectType = (type) => {
    setProjectTypes(prev => prev.filter(t => t !== type));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-[#d4a574]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-amber-50/30 py-8 px-4" dir="rtl">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-3 mb-2">
            <Tag className="w-8 h-8 text-[#d4a574]" />
            <h1 className="text-3xl font-bold text-[#1a1a2e]">إدارة التصنيفات وأنواع المشاريع</h1>
          </div>
          <p className="text-slate-600">تخصيص التصنيفات وأنواع المشاريع المتاحة في المنصة</p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Categories Management */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Tag className="w-5 h-5" />
                  تصنيفات الأعمال
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {categories.map((category) => (
                  <div
                    key={category.id}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      category.active 
                        ? "border-green-200 bg-green-50" 
                        : "border-slate-200 bg-slate-50 opacity-60"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      {editingCategory === category.id ? (
                        <div className="flex-1 flex gap-2">
                          <Input
                            defaultValue={category.label}
                            onBlur={(e) => updateCategoryLabel(category.id, e.target.value)}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                updateCategoryLabel(category.id, e.target.value);
                              }
                            }}
                            className="flex-1"
                            autoFocus
                          />
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => setEditingCategory(null)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ) : (
                        <>
                          <div className="flex-1">
                            <p className="font-bold text-[#1a1a2e]">{category.label}</p>
                            <p className="text-xs text-slate-500">{category.id}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setEditingCategory(category.id)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant={category.active ? "destructive" : "default"}
                              onClick={() => toggleCategoryStatus(category.id)}
                            >
                              {category.active ? "تعطيل" : "تفعيل"}
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>

          {/* Project Types Management */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Tag className="w-5 h-5" />
                  أنواع المشاريع
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Add New Type */}
                <div className="flex gap-2">
                  <Input
                    placeholder="إضافة نوع جديد..."
                    value={newProjectType}
                    onChange={(e) => setNewProjectType(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') addProjectType();
                    }}
                  />
                  <Button onClick={addProjectType}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>

                {/* Types List */}
                <div className="flex flex-wrap gap-2">
                  {projectTypes.map((type, index) => (
                    <Badge
                      key={index}
                      className="bg-blue-100 text-blue-800 px-3 py-2 text-sm flex items-center gap-2 hover:bg-blue-200 cursor-pointer group"
                    >
                      {type}
                      <button
                        onClick={() => removeProjectType(type)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-3xl font-bold text-[#1a1a2e]">
                  {categories.filter(c => c.active).length}
                </p>
                <p className="text-sm text-slate-500">تصنيفات نشطة</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-3xl font-bold text-[#1a1a2e]">
                  {categories.length}
                </p>
                <p className="text-sm text-slate-500">إجمالي التصنيفات</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-3xl font-bold text-[#1a1a2e]">
                  {projectTypes.length}
                </p>
                <p className="text-sm text-slate-500">أنواع المشاريع</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <Button className="w-full bg-gradient-to-r from-[#1a1a2e] to-[#d4a574] text-white">
                  <Save className="w-4 h-4 ml-2" />
                  حفظ التغييرات
                </Button>
              </CardContent>
            </Card>
          </div>
        </motion.div>
      </div>
    </div>
  );
}