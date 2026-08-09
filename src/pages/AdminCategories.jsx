import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Tag, Plus, Edit, Trash2, Loader2, Save, X, Search, RotateCcw,
  ArrowUp, ArrowDown, Power, CheckCircle2, AlertCircle
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
  const [newCategory, setNewCategory] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [editingType, setEditingType] = useState(null);
  const [editingTypeValue, setEditingTypeValue] = useState("");

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

  const editProjectType = (oldType) => {
    setEditingType(oldType);
    setEditingTypeValue(oldType);
  };

  const saveProjectType = (oldType) => {
    const trimmed = editingTypeValue.trim();
    if (trimmed && !projectTypes.includes(trimmed)) {
      setProjectTypes(prev => prev.map(t => t === oldType ? trimmed : t));
    }
    setEditingType(null);
    setEditingTypeValue("");
  };

  const moveProjectType = (index, direction) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= projectTypes.length) return;
    setProjectTypes(prev => {
      const arr = [...prev];
      [arr[index], arr[newIndex]] = [arr[newIndex], arr[index]];
      return arr;
    });
  };

  const addCategory = () => {
    const trimmed = newCategory.trim();
    if (!trimmed) return;
    const id = trimmed.toLowerCase().replace(/\s+/g, "_");
    if (categories.some(c => c.id === id)) {
      alert("هذا التصنيف موجود بالفعل");
      return;
    }
    setCategories(prev => [...prev, { id, label: trimmed, active: true }]);
    setNewCategory("");
  };

  const deleteCategory = (categoryId) => {
    if (confirm("هل أنت متأكد من حذف هذا التصنيف؟")) {
      setCategories(prev => prev.filter(c => c.id !== categoryId));
    }
  };

  const toggleAllCategories = (active) => {
    setCategories(prev => prev.map(c => ({ ...c, active })));
  };

  const filteredCategories = categories.filter(c =>
    c.label.includes(searchQuery) || c.id.includes(searchQuery)
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-[#C9A66B]" />
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
            <Tag className="w-8 h-8 text-[#C9A66B]" />
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
                {/* Search + Add Category */}
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      placeholder="بحث في التصنيفات..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pr-9"
                    />
                  </div>
                  <Input
                    placeholder="تصنيف جديد..."
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') addCategory(); }}
                    className="w-40"
                  />
                  <Button onClick={addCategory} className="bg-[#2D2D2D] hover:bg-[#1a1a1a] shrink-0">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>

                {/* Bulk toggle buttons */}
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => toggleAllCategories(true)}
                    className="text-green-600 border-green-300 hover:bg-green-50"
                  >
                    <Power className="w-3.5 h-3.5 ml-1" />
                    تفعيل الكل
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => toggleAllCategories(false)}
                    className="text-red-600 border-red-300 hover:bg-red-50"
                  >
                    <Power className="w-3.5 h-3.5 ml-1" />
                    تعطيل الكل
                  </Button>
                </div>
                {filteredCategories.length === 0 && (
                  <p className="text-center text-slate-400 py-6 text-sm">لا توجد تصنيفات مطابقة</p>
                )}
                {filteredCategories.map((category) => (
                  <div
                    key={category.id}
                    className={`p-4 rounded-xl border transition-all ${
                      category.active 
                        ? "border-[#D4EDDA] bg-[#F0FAF2]" 
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
                            <p className="font-bold text-[#2D2D2D] text-base">{category.label}</p>
                            <p className="text-xs text-slate-400 font-light">{category.id}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="hover:bg-slate-100"
                              onClick={() => setEditingCategory(category.id)}
                            >
                              <Edit className="w-4 h-4 text-slate-600" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="hover:bg-red-50 text-red-500"
                              onClick={() => deleteCategory(category.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant={category.active ? "destructive" : "default"}
                              className={category.active ? "bg-[#FF4D4D] hover:bg-[#e63939]" : "bg-[#6B5D4F] hover:bg-[#5a4d40]"}
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
                  <Button onClick={addProjectType} className="bg-[#2D2D2D] hover:bg-[#1a1a1a]">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>

                {/* Types List */}
                <div className="flex flex-wrap gap-2">
                  {projectTypes.map((type, index) => (
                    <div
                      key={index}
                      className="bg-[#E8F0FE] text-[#1a73e8] px-3 py-2 text-sm rounded-lg flex items-center gap-1.5 group transition-colors hover:bg-[#d3e3fd]"
                    >
                      {editingType === type ? (
                        <>
                          <input
                            value={editingTypeValue}
                            onChange={(e) => setEditingTypeValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') saveProjectType(type);
                              if (e.key === 'Escape') { setEditingType(null); setEditingTypeValue(""); }
                            }}
                            className="bg-white/80 rounded px-1 outline-none text-[#1a73e8] w-20"
                            autoFocus
                          />
                          <button onClick={() => saveProjectType(type)} className="text-green-600 hover:scale-110 transition-transform">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      ) : (
                        <>
                          <span>{type}</span>
                          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => moveProjectType(index, -1)} className="hover:text-[#1a73e8]/70" title="تحريك لليسار">
                              <ArrowUp className="w-3 h-3 rotate-90" />
                            </button>
                            <button onClick={() => moveProjectType(index, 1)} className="hover:text-[#1a73e8]/70" title="تحريك لليمين">
                              <ArrowDown className="w-3 h-3 rotate-90" />
                            </button>
                            <button onClick={() => editProjectType(type)} className="hover:text-[#1a73e8]/70" title="تعديل">
                              <Edit className="w-3 h-3" />
                            </button>
                            <button onClick={() => removeProjectType(type)} className="hover:text-red-500" title="حذف">
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                  {projectTypes.length === 0 && (
                    <p className="text-center text-slate-400 py-4 text-sm w-full">لا توجد أنواع مشاريع بعد</p>
                  )}
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
              <CardContent className="p-6 space-y-2">
                <Button className="w-full bg-gradient-to-r from-[#1a1a2e] to-[#C9A66B] text-white">
                  <Save className="w-4 h-4 ml-2" />
                  حفظ التغييرات
                </Button>
                <Button
                  variant="outline"
                  className="w-full border-slate-300 text-slate-600 hover:bg-slate-50"
                  onClick={() => {
                    setCategories([
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
                    setProjectTypes(["فيلا", "شقة", "مكتب", "محل تجاري", "مطعم", "فندق", "مستشفى", "مدرسة", "مسجد", "حديقة", "أخرى"]);
                    setSearchQuery("");
                  }}
                >
                  <RotateCcw className="w-4 h-4 ml-2" />
                  إعادة تعيين
                </Button>
              </CardContent>
            </Card>
          </div>
        </motion.div>
      </div>
    </div>
  );
}