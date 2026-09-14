import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import {
  Plus, Loader2, CheckCircle, Eye, MousePointerClick,
  Search, Filter, Megaphone
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle
} from "@/components/ui/dialog";
import AdCard from "@/components/ads/AdCard";
import AdForm from "@/components/ads/AdForm";

const CATEGORIES = [
  { value: "engineering", label: "هندسة" },
  { value: "contracting", label: "مقاولات" },
  { value: "decor", label: "ديكور" },
  { value: "building_materials", label: "مواد بناء" },
  { value: "furniture", label: "أثاث" },
  { value: "consulting_office", label: "مكتب استشاري" },
  { value: "concrete_supply", label: "توريد خرسانة" },
  { value: "electrical", label: "كهربائيات" },
  { value: "plumbing", label: "سباكة" },
  { value: "landscape", label: "تنسيق حدائق" },
];

const STATUS_FILTERS = [
  { value: "all", label: "الكل" },
  { value: "active", label: "نشطة" },
  { value: "inactive", label: "متوقفة" },
  { value: "verified", label: "معتمدة" },
];

export default function AdManager() {
  const [user, setUser] = useState(null);
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingAd, setEditingAd] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    try {
      const u = await base44.auth.me();
      setUser(u);
      if (u?.role !== "admin") { setLoading(false); return; }
      await loadAds();
    } catch {
      setLoading(false);
    }
  };

  const loadAds = async () => {
    setLoading(true);
    try {
      const data = await base44.entities.Advertisement.list("-created_date", 100);
      setAds(data);
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => { setEditingAd(null); setShowForm(true); };
  const openEdit = (ad) => { setEditingAd(ad); setShowForm(true); };

  const handleSave = async (payload) => {
    if (editingAd) {
      await base44.entities.Advertisement.update(editingAd.id, payload);
    } else {
      await base44.entities.Advertisement.create(payload);
    }
    setShowForm(false);
    setEditingAd(null);
    loadAds();
  };

  const handleDelete = async (id) => {
    if (!confirm("هل تريد حذف هذا الإعلان؟")) return;
    await base44.entities.Advertisement.delete(id);
    loadAds();
  };

  const toggleActive = async (ad) => {
    await base44.entities.Advertisement.update(ad.id, { is_active: !ad.is_active });
    loadAds();
  };

  const toggleVerified = async (ad) => {
    await base44.entities.Advertisement.update(ad.id, { is_verified_advertiser: !ad.is_verified_advertiser });
    loadAds();
  };

  const filteredAds = useMemo(() => {
    return ads.filter(ad => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!ad.title?.toLowerCase().includes(q) && !ad.advertiser_name?.toLowerCase().includes(q)) return false;
      }
      if (statusFilter === "active" && !ad.is_active) return false;
      if (statusFilter === "inactive" && ad.is_active) return false;
      if (statusFilter === "verified" && !ad.is_verified_advertiser) return false;
      if (categoryFilter !== "all" && ad.category !== categoryFilter) return false;
      return true;
    });
  }, [ads, searchQuery, statusFilter, categoryFilter]);

  if (!loading && (!user || user.role !== "admin")) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-slate-500">هذه الصفحة للمسؤولين فقط.</p>
      </div>
    );
  }

  const totalImpressions = ads.reduce((s, a) => s + (a.impressions || 0), 0);
  const totalClicks = ads.reduce((s, a) => s + (a.clicks || 0), 0);
  const ctr = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(1) : "0.0";

  const stats = [
    { label: "إجمالي الإعلانات", value: ads.length, icon: Megaphone, color: "text-blue-500", bg: "bg-blue-50" },
    { label: "إعلانات نشطة", value: ads.filter(a => a.is_active).length, icon: CheckCircle, color: "text-green-500", bg: "bg-green-50" },
    { label: "إجمالي الظهور", value: totalImpressions.toLocaleString('ar-SA'), icon: Eye, color: "text-purple-500", bg: "bg-purple-50" },
    { label: "نسبة النقر CTR", value: ctr + "%", icon: MousePointerClick, color: "text-amber-500", bg: "bg-amber-50" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-amber-50/30 py-8" dir="rtl">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#6B5D4F] to-[#C9A66B] flex items-center justify-center">
                  <Megaphone className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-[#6B5D4F]">مركز الإعلانات</h1>
                  <p className="text-slate-500 text-sm">إدارة الإعلانات السياقية للمنصة</p>
                </div>
              </div>
            </div>
            <Button onClick={openCreate} className="bg-gradient-to-r from-[#6B5D4F] to-[#C9A66B] text-white gap-2">
              <Plus className="w-4 h-4" />
              إعلان جديد
            </Button>
          </div>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {stats.map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
              <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-2">
                    <div className={`w-11 h-11 rounded-xl ${s.bg} flex items-center justify-center`}>
                      <s.icon className={`w-5 h-5 ${s.color}`} />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-[#6B5D4F]">{s.value}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="ابحث بالعنوان أو اسم المعلن..."
              className="pr-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-40">
              <Filter className="w-3.5 h-3.5 ml-1 text-slate-400" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_FILTERS.map(f => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full sm:w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">كل القطاعات</SelectItem>
              {CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Ads Grid */}
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-[#C9A66B]" />
          </div>
        ) : filteredAds.length === 0 ? (
          <Card className="border-0 shadow-sm">
            <CardContent className="py-16 text-center">
              <Megaphone className="w-14 h-14 text-slate-200 mx-auto mb-4" />
              <p className="text-slate-500 mb-1 font-medium">لا توجد إعلانات</p>
              <p className="text-sm text-slate-400 mb-4">ابدأ بإنشاء إعلانك الأول ليعرضه المستخدمون</p>
              <Button onClick={openCreate} className="bg-gradient-to-r from-[#6B5D4F] to-[#C9A66B] text-white gap-2">
                <Plus className="w-4 h-4" />
                إنشاء إعلان
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredAds.map(ad => (
              <AdCard
                key={ad.id}
                ad={ad}
                onEdit={openEdit}
                onDelete={handleDelete}
                onToggleActive={toggleActive}
                onToggleVerified={toggleVerified}
              />
            ))}
          </div>
        )}

        {/* Form Dialog */}
        <Dialog open={showForm} onOpenChange={(open) => { setShowForm(open); if (!open) setEditingAd(null); }}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto" dir="rtl">
            <DialogHeader>
              <DialogTitle className="text-[#6B5D4F] flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-[#C9A66B]" />
                {editingAd ? "تعديل الإعلان" : "إعلان جديد"}
              </DialogTitle>
            </DialogHeader>
            <AdForm
              editingAd={editingAd}
              onSave={handleSave}
              onCancel={() => { setShowForm(false); setEditingAd(null); }}
            />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}