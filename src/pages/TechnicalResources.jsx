import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import {
  BookOpen, Search, Filter, ExternalLink, Download, Link2,
  CheckCircle, AlertCircle, Clock, Plus, X, Tag, Building2,
  FileText, Flame, Zap, Droplets, Layers, RefreshCw, Star
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import SBCStandardsList from "@/components/technical/SBCStandardsList";
import DesignComplianceChecker from "@/components/technical/DesignComplianceChecker";

const CATEGORIES = [
  { key: "all", label: "الكل", icon: Layers, color: "bg-slate-100 text-slate-700" },
  { key: "sbc_structural", label: "SBC - إنشائي", icon: Building2, color: "bg-blue-100 text-blue-700" },
  { key: "sbc_fire", label: "SBC - الحريق", icon: Flame, color: "bg-red-100 text-red-700" },
  { key: "sbc_energy", label: "SBC - الطاقة", icon: Zap, color: "bg-yellow-100 text-yellow-700" },
  { key: "sbc_plumbing", label: "SBC - السباكة", icon: Droplets, color: "bg-cyan-100 text-cyan-700" },
  { key: "sbc_electrical", label: "SBC - الكهرباء", icon: Zap, color: "bg-purple-100 text-purple-700" },
  { key: "sbc_general", label: "SBC - عام", icon: BookOpen, color: "bg-green-100 text-green-700" },
  { key: "municipality_update", label: "تحديثات البلدية", icon: RefreshCw, color: "bg-orange-100 text-orange-700" },
  { key: "regulation", label: "لوائح تنظيمية", icon: FileText, color: "bg-indigo-100 text-indigo-700" },
];

const STATUS_CONFIG = {
  active: { label: "ساري", color: "bg-green-100 text-green-700", icon: CheckCircle },
  superseded: { label: "مُستبدَل", color: "bg-slate-100 text-slate-500", icon: Clock },
  draft: { label: "مسودة", color: "bg-yellow-100 text-yellow-700", icon: AlertCircle },
};

const DEFAULT_RESOURCES = [
  {
    title: "كود البناء السعودي - الأحمال الإنشائية SBC 301",
    category: "sbc_structural",
    version: "2018",
    issuing_authority: "وزارة الشؤون البلدية والقروية",
    issue_date: "2018-01-01",
    summary: "يحدد متطلبات الأحمال الإنشائية للمباني والمنشآت في المملكة العربية السعودية",
    key_points: ["أحمال الرياح", "أحمال الزلازل", "الأحمال الميتة والحية", "متطلبات التصميم الإنشائي"],
    external_url: "https://momra.gov.sa",
    is_mandatory: true,
    applies_to: ["سكني", "تجاري", "صناعي"],
    status: "active",
    tags: ["SBC", "إنشائي", "أحمال"]
  },
  {
    title: "كود البناء السعودي - الوقاية من الحريق SBC 801",
    category: "sbc_fire",
    version: "2018",
    issuing_authority: "وزارة الشؤون البلدية والقروية",
    issue_date: "2018-01-01",
    summary: "اشتراطات الوقاية من الحريق وأنظمة الإطفاء وطرق الإخلاء",
    key_points: ["مخارج الطوارئ", "أنظمة الرش التلقائي", "أجهزة الإنذار", "درجات مقاومة الحريق"],
    external_url: "https://momra.gov.sa",
    is_mandatory: true,
    applies_to: ["سكني", "تجاري", "صناعي"],
    status: "active",
    tags: ["SBC", "حريق", "سلامة"]
  },
  {
    title: "كود البناء السعودي - كفاءة الطاقة SBC 601",
    category: "sbc_energy",
    version: "2018",
    issuing_authority: "وزارة الشؤون البلدية والقروية",
    issue_date: "2018-01-01",
    summary: "متطلبات كفاءة الطاقة في المباني وعزل الأسطح والجدران",
    key_points: ["عزل حراري", "كفاءة أجهزة التكييف", "الإضاءة الموفرة", "الطاقة الشمسية"],
    external_url: "https://momra.gov.sa",
    is_mandatory: true,
    applies_to: ["سكني", "تجاري"],
    status: "active",
    tags: ["SBC", "طاقة", "استدامة"]
  },
  {
    title: "اشتراطات البناء في مناطق التربة الضعيفة - أمانة الرياض",
    category: "municipality_update",
    version: "2023",
    issuing_authority: "أمانة منطقة الرياض",
    issue_date: "2023-06-01",
    summary: "تحديث اشتراطات تصميم الأساسات في مناطق التربة الرملية والجبسية",
    key_points: ["فحص التربة الإلزامي", "أعماق الأساسات", "معالجة التربة", "حماية من الرطوبة"],
    external_url: "https://www.alriyadh.gov.sa",
    is_mandatory: true,
    applies_to: ["سكني", "تجاري"],
    status: "active",
    tags: ["بلدية", "أساسات", "تربة", "الرياض"]
  },
  {
    title: "كود البناء السعودي - الصرف الصحي SBC 701",
    category: "sbc_plumbing",
    version: "2018",
    issuing_authority: "وزارة الشؤون البلدية والقروية",
    issue_date: "2018-01-01",
    summary: "متطلبات أنظمة السباكة والصرف الصحي والمياه",
    key_points: ["مواصفات الأنابيب", "حجم خزانات المياه", "نظام الصرف", "معدلات التدفق"],
    external_url: "https://momra.gov.sa",
    is_mandatory: true,
    applies_to: ["سكني", "تجاري"],
    status: "active",
    tags: ["SBC", "سباكة", "صرف صحي"]
  },
  {
    title: "اشتراطات ذوي الاحتياجات الخاصة في المباني - تحديث 2024",
    category: "municipality_update",
    version: "2024",
    issuing_authority: "وزارة الشؤون البلدية والقروية",
    issue_date: "2024-01-01",
    summary: "المعايير المحدثة لتوفير إمكانية الوصول لذوي الاحتياجات الخاصة",
    key_points: ["المنحدرات ومواصفاتها", "أبعاد المصاعد", "دورات المياه الخاصة", "مواقف السيارات"],
    external_url: "https://momra.gov.sa",
    is_mandatory: true,
    applies_to: ["تجاري", "حكومي", "سكني مجمعات"],
    status: "active",
    tags: ["إمكانية الوصول", "ذوو احتياجات خاصة", "2024"]
  },
];

export default function TechnicalResources() {
  const [resources, setResources] = useState([]);
  const [projects, setProjects] = useState([]);
  const [user, setUser] = useState(null);
  const [engineerProfile, setEngineerProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [selectedResource, setSelectedResource] = useState(null);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [linkingResource, setLinkingResource] = useState(null);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [newResource, setNewResource] = useState({
    title: "", category: "sbc_general", version: "", issuing_authority: "",
    summary: "", external_url: "", is_mandatory: false, status: "active"
  });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setIsLoading(true);
    const currentUser = await base44.auth.me();
    setUser(currentUser);

    const [stored, engineers, projectsData] = await Promise.all([
      base44.entities.TechnicalResource.list("-created_date"),
      base44.entities.Engineer.filter({ email: currentUser.email }),
      base44.entities.Project.filter({ assigned_engineer_id: { $exists: true } }),
    ]);

    if (engineers.length > 0) setEngineerProfile(engineers[0]);

    if (stored.length === 0) {
      // Seed default resources
      const created = await base44.entities.TechnicalResource.bulkCreate(DEFAULT_RESOURCES);
      setResources(created);
    } else {
      setResources(stored);
    }

    setProjects(projectsData);
    setIsLoading(false);
  };

  const handleLinkToProject = async () => {
    if (!selectedProjectId || !linkingResource) return;
    const current = linkingResource.linked_project_ids || [];
    if (current.includes(selectedProjectId)) return;
    await base44.entities.TechnicalResource.update(linkingResource.id, {
      linked_project_ids: [...current, selectedProjectId]
    });
    setResources(prev => prev.map(r => r.id === linkingResource.id
      ? { ...r, linked_project_ids: [...current, selectedProjectId] }
      : r
    ));
    setShowLinkModal(false);
    setSelectedProjectId("");
    setLinkingResource(null);
  };

  const handleUnlinkProject = async (resource, projectId) => {
    const updated = (resource.linked_project_ids || []).filter(id => id !== projectId);
    await base44.entities.TechnicalResource.update(resource.id, { linked_project_ids: updated });
    setResources(prev => prev.map(r => r.id === resource.id ? { ...r, linked_project_ids: updated } : r));
  };

  const handleAddResource = async () => {
    if (!newResource.title) return;
    const created = await base44.entities.TechnicalResource.create(newResource);
    setResources(prev => [created, ...prev]);
    setShowAddModal(false);
    setNewResource({ title: "", category: "sbc_general", version: "", issuing_authority: "", summary: "", external_url: "", is_mandatory: false, status: "active" });
  };

  const filtered = resources.filter(r => {
    const matchCat = activeCategory === "all" || r.category === activeCategory;
    const matchSearch = !searchQuery || r.title?.toLowerCase().includes(searchQuery.toLowerCase()) || r.summary?.toLowerCase().includes(searchQuery.toLowerCase()) || r.tags?.some(t => t.includes(searchQuery));
    return matchCat && matchSearch;
  });

  const getCategoryInfo = (key) => CATEGORIES.find(c => c.key === key) || CATEGORIES[0];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#C9A66B]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-amber-50/30" dir="rtl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-[#4A3F35] flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#6B5D4F] to-[#C9A66B] flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-white" />
                </div>
                الموارد الفنية والمعايير
              </h1>
              <p className="text-slate-500 mt-1">كود البناء السعودي (SBC) وتحديثات البلديات — اربط المعايير مباشرة بمشاريعك</p>
            </div>
            <Button
              onClick={() => setShowAddModal(true)}
              className="bg-gradient-to-r from-[#6B5D4F] to-[#C9A66B] text-white gap-2"
            >
              <Plus className="w-4 h-4" />
              إضافة مورد فني
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            {[
              { label: "إجمالي المعايير", value: resources.length, color: "text-blue-600" },
              { label: "إلزامية التطبيق", value: resources.filter(r => r.is_mandatory).length, color: "text-red-600" },
              { label: "تحديثات البلدية", value: resources.filter(r => r.category === "municipality_update").length, color: "text-orange-600" },
              { label: "مرتبطة بمشاريع", value: resources.filter(r => r.linked_project_ids?.length > 0).length, color: "text-green-600" },
            ].map((stat, i) => (
              <Card key={i} className="border-0 shadow-sm">
                <CardContent className="p-4 text-center">
                  <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                  <p className="text-xs text-slate-500 mt-1">{stat.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.div>

        {/* SBC Standards Reference List */}
        <div className="mb-8">
          <SBCStandardsList />
        </div>

        {/* Design Compliance Checker */}
        <div className="mb-8">
          <DesignComplianceChecker />
        </div>

        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="ابحث في المعايير..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pr-9"
            />
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {CATEGORIES.map(cat => (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                activeCategory === cat.key ? "bg-[#4A3F35] text-white shadow" : "bg-white text-slate-600 border hover:border-[#C9A66B]"
              }`}
            >
              <cat.icon className="w-3.5 h-3.5" />
              {cat.label}
            </button>
          ))}
        </div>

        {/* Resources Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((resource, i) => {
            const catInfo = getCategoryInfo(resource.category);
            const statusInfo = STATUS_CONFIG[resource.status] || STATUS_CONFIG.active;
            const StatusIcon = statusInfo.icon;
            const linkedProjects = projects.filter(p => resource.linked_project_ids?.includes(p.id));

            return (
              <motion.div
                key={resource.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <Card className="border-0 shadow-md hover:shadow-lg transition-shadow h-full flex flex-col">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${catInfo.color}`}>
                            {catInfo.label}
                          </span>
                          {resource.is_mandatory && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-medium flex items-center gap-1">
                              <Star className="w-3 h-3" /> إلزامي
                            </span>
                          )}
                          <span className={`text-xs px-2 py-0.5 rounded-full flex items-center gap-1 ${statusInfo.color}`}>
                            <StatusIcon className="w-3 h-3" />
                            {statusInfo.label}
                          </span>
                        </div>
                        <h3 className="font-semibold text-[#4A3F35] text-sm leading-snug">{resource.title}</h3>
                      </div>
                    </div>
                    {resource.version && (
                      <p className="text-xs text-slate-400">الإصدار: {resource.version} | {resource.issuing_authority}</p>
                    )}
                  </CardHeader>

                  <CardContent className="flex-1 flex flex-col gap-3 pt-0">
                    {resource.summary && (
                      <p className="text-sm text-slate-600 leading-relaxed line-clamp-2">{resource.summary}</p>
                    )}

                    {resource.key_points?.length > 0 && (
                      <ul className="space-y-1">
                        {resource.key_points.slice(0, 3).map((point, j) => (
                          <li key={j} className="flex items-start gap-1.5 text-xs text-slate-500">
                            <CheckCircle className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0" />
                            {point}
                          </li>
                        ))}
                      </ul>
                    )}

                    {/* Linked Projects */}
                    {linkedProjects.length > 0 && (
                      <div className="border-t pt-2">
                        <p className="text-xs text-slate-400 mb-1.5 flex items-center gap-1">
                          <Link2 className="w-3 h-3" /> مرتبط بـ {linkedProjects.length} مشروع
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {linkedProjects.map(p => (
                            <div key={p.id} className="flex items-center gap-1 bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded-full">
                              <span className="max-w-[100px] truncate">{p.title}</span>
                              <button onClick={() => handleUnlinkProject(resource, p.id)} className="hover:text-red-500">
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 mt-auto pt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 text-xs gap-1 border-[#C9A66B] text-[#6B5D4F] hover:bg-amber-50"
                        onClick={() => { setLinkingResource(resource); setShowLinkModal(true); }}
                      >
                        <Link2 className="w-3.5 h-3.5" />
                        ربط بمشروع
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs gap-1"
                        onClick={() => setSelectedResource(resource)}
                      >
                        <FileText className="w-3.5 h-3.5" />
                        التفاصيل
                      </Button>
                      {resource.external_url && (
                        <Button size="sm" variant="ghost" className="px-2" asChild>
                          <a href={resource.external_url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16">
            <BookOpen className="w-16 h-16 text-slate-200 mx-auto mb-4" />
            <p className="text-slate-400">لا توجد موارد تطابق البحث</p>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <Dialog open={!!selectedResource} onOpenChange={() => setSelectedResource(null)}>
        <DialogContent className="max-w-lg" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-right text-[#4A3F35]">{selectedResource?.title}</DialogTitle>
          </DialogHeader>
          {selectedResource && (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Badge className={getCategoryInfo(selectedResource.category).color + " border-0"}>
                  {getCategoryInfo(selectedResource.category).label}
                </Badge>
                {selectedResource.is_mandatory && <Badge className="bg-red-100 text-red-700 border-0">إلزامي</Badge>}
                {selectedResource.version && <Badge variant="outline">الإصدار: {selectedResource.version}</Badge>}
              </div>
              {selectedResource.issuing_authority && (
                <p className="text-sm text-slate-500">جهة الإصدار: <span className="font-medium text-slate-700">{selectedResource.issuing_authority}</span></p>
              )}
              {selectedResource.summary && (
                <p className="text-sm text-slate-600 leading-relaxed">{selectedResource.summary}</p>
              )}
              {selectedResource.key_points?.length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-slate-700 mb-2">النقاط الرئيسية:</p>
                  <ul className="space-y-1.5">
                    {selectedResource.key_points.map((p, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                        <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        {p}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {selectedResource.applies_to?.length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-slate-700 mb-1">يطبق على:</p>
                  <div className="flex flex-wrap gap-1">
                    {selectedResource.applies_to.map((t, i) => (
                      <Badge key={i} variant="secondary">{t}</Badge>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex gap-2 pt-2">
                <Button
                  className="flex-1 bg-gradient-to-r from-[#6B5D4F] to-[#C9A66B] text-white gap-2"
                  onClick={() => { setLinkingResource(selectedResource); setSelectedResource(null); setShowLinkModal(true); }}
                >
                  <Link2 className="w-4 h-4" /> ربط بمشروع
                </Button>
                {selectedResource.external_url && (
                  <Button variant="outline" asChild>
                    <a href={selectedResource.external_url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Link to Project Modal */}
      <Dialog open={showLinkModal} onOpenChange={setShowLinkModal}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-right text-[#4A3F35]">ربط بمشروع</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-slate-500">اختر المشروع لربط هذا المعيار به:</p>
            <p className="text-sm font-medium text-[#4A3F35] bg-amber-50 p-2 rounded">{linkingResource?.title}</p>
            <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
              <SelectTrigger>
                <SelectValue placeholder="اختر مشروعاً..." />
              </SelectTrigger>
              <SelectContent>
                {projects.map(p => (
                  <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex gap-2">
              <Button className="flex-1 bg-gradient-to-r from-[#6B5D4F] to-[#C9A66B] text-white" onClick={handleLinkToProject} disabled={!selectedProjectId}>
                ربط المعيار
              </Button>
              <Button variant="outline" onClick={() => setShowLinkModal(false)}>إلغاء</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Resource Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="max-w-lg" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-right text-[#4A3F35]">إضافة مورد فني جديد</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>عنوان المورد *</Label>
              <Input value={newResource.title} onChange={e => setNewResource(p => ({ ...p, title: e.target.value }))} placeholder="مثال: كود البناء السعودي..." />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>التصنيف</Label>
                <Select value={newResource.category} onValueChange={v => setNewResource(p => ({ ...p, category: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.filter(c => c.key !== "all").map(c => (
                      <SelectItem key={c.key} value={c.key}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>الإصدار</Label>
                <Input value={newResource.version} onChange={e => setNewResource(p => ({ ...p, version: e.target.value }))} placeholder="2024" />
              </div>
            </div>
            <div>
              <Label>جهة الإصدار</Label>
              <Input value={newResource.issuing_authority} onChange={e => setNewResource(p => ({ ...p, issuing_authority: e.target.value }))} placeholder="وزارة الشؤون البلدية..." />
            </div>
            <div>
              <Label>ملخص</Label>
              <Textarea value={newResource.summary} onChange={e => setNewResource(p => ({ ...p, summary: e.target.value }))} rows={3} placeholder="وصف مختصر..." />
            </div>
            <div>
              <Label>رابط خارجي</Label>
              <Input value={newResource.external_url} onChange={e => setNewResource(p => ({ ...p, external_url: e.target.value }))} placeholder="https://..." />
            </div>
            <div className="flex gap-2">
              <Button className="flex-1 bg-gradient-to-r from-[#6B5D4F] to-[#C9A66B] text-white" onClick={handleAddResource} disabled={!newResource.title}>
                إضافة المورد
              </Button>
              <Button variant="outline" onClick={() => setShowAddModal(false)}>إلغاء</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}