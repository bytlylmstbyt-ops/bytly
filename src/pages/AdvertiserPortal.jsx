import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import {
  Plus, Loader2, Eye, MousePointerClick, Megaphone,
  CheckCircle, XCircle, Shield, Pencil, Trash2, BarChart3
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle
} from "@/components/ui/dialog";
import AdvertiseWithUs from "@/pages/AdvertiseWithUs";
import AdForm from "@/components/ads/AdForm";
import AdReportsPanel from "@/components/ads/AdReportsPanel";

export default function AdvertiserPortal() {
  const [user, setUser] = useState(null);
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingAd, setEditingAd] = useState(null);
  const [showPortal, setShowPortal] = useState(false);

  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    try {
      const authed = await base44.auth.isAuthenticated();
      if (!authed) { setLoading(false); return; }
      const u = await base44.auth.me();
      setUser(u);
      await loadAds();
    } catch {
      setLoading(false);
    }
  };

  const loadAds = async () => {
    setLoading(true);
    try {
      const data = await base44.entities.Advertisement.list("-created_date", 50);
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

  const totalImpressions = ads.reduce((s, a) => s + (a.impressions || 0), 0);
  const totalClicks = ads.reduce((s, a) => s + (a.clicks || 0), 0);
  const ctr = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(1) : "0.0";

  // Show landing page if no ads yet or user hasn't entered the portal
  if (!loading && (ads.length === 0 && !showPortal)) {
    return (
      <div dir="rtl">
        <AdvertiseWithUs
          hasAds={false}
          onStart={() => {
            if (!user) {
              sessionStorage.setItem('loginReturnUrl', window.location.pathname);
              window.location.href = '/login';
              return;
            }
            setShowPortal(true);
          }}
        />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#C9A66B]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-8" dir="rtl">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#6B5D4F] to-[#C9A66B] flex items-center justify-center">
                <Megaphone className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-[#6B5D4F]">بوابة المعلن</h1>
                <p className="text-slate-500 text-sm">{user?.full_name || user?.email}</p>
              </div>
            </div>
            <Button onClick={openCreate} className="bg-gradient-to-r from-[#6B5D4F] to-[#C9A66B] text-white gap-2">
              <Plus className="w-4 h-4" />
              إعلان جديد
            </Button>
          </div>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: "إجمالي إعلاناتي", value: ads.length, icon: Megaphone, color: "text-blue-500", bg: "bg-blue-50" },
            { label: "إعلانات نشطة", value: ads.filter(a => a.is_active).length, icon: CheckCircle, color: "text-green-500", bg: "bg-green-50" },
            { label: "إجمالي الظهور", value: totalImpressions.toLocaleString('ar-SA'), icon: Eye, color: "text-purple-500", bg: "bg-purple-50" },
            { label: "نسبة النقر CTR", value: ctr + "%", icon: MousePointerClick, color: "text-amber-500", bg: "bg-amber-50" },
          ].map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
              <Card className="border-0 shadow-md">
                <CardContent className="p-5">
                  <div className={`w-11 h-11 rounded-xl ${s.bg} flex items-center justify-center mb-2`}>
                    <s.icon className={`w-5 h-5 ${s.color}`} />
                  </div>
                  <p className="text-2xl font-bold text-[#6B5D4F]">{s.value}</p>
                  <p className="text-xs text-slate-500">{s.label}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Performance Reports Panel */}
        {ads.length > 0 && <AdReportsPanel ads={ads} />}

        {/* My Ads */}
        {ads.length === 0 ? (
          <Card className="border-0 shadow-sm">
            <CardContent className="py-16 text-center">
              <Megaphone className="w-14 h-14 text-slate-200 mx-auto mb-4" />
              <p className="text-slate-500 mb-1 font-medium">لا توجد إعلانات بعد</p>
              <p className="text-sm text-slate-400 mb-4">أنشئ إعلانك الأول ليظهر لجمهور بيتلي</p>
              <Button onClick={openCreate} className="bg-gradient-to-r from-[#6B5D4F] to-[#C9A66B] text-white gap-2">
                <Plus className="w-4 h-4" />
                إنشاء إعلان
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {ads.map(ad => (
              <motion.div
                key={ad.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-white rounded-2xl border border-slate-100 p-4 flex flex-col sm:flex-row gap-4 hover-lift"
              >
                {/* Thumbnail */}
                <div className="relative w-full sm:w-32 h-24 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0">
                  {ad.media_type === "video" && ad.video_url ? (
                    <video src={ad.video_url} poster={ad.image_url} className="w-full h-full object-cover" muted />
                  ) : (
                    <img src={ad.image_url} alt={ad.title} className="w-full h-full object-cover" />
                  )}
                  {ad.is_active ? (
                    <span className="absolute top-2 right-2 bg-green-500/90 text-white text-[9px] font-bold px-2 py-0.5 rounded-full">نشط</span>
                  ) : (
                    <span className="absolute top-2 right-2 bg-slate-600/80 text-white text-[9px] font-bold px-2 py-0.5 rounded-full">متوقف</span>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    {ad.logo_url && <img src={ad.logo_url} alt="" className="w-5 h-5 rounded-full object-cover" />}
                    <span className="font-semibold text-sm text-slate-800">{ad.advertiser_name}</span>
                    {ad.is_verified_advertiser && (
                      <Badge className="bg-blue-50 text-blue-600 border border-blue-200 text-[9px] gap-1">
                        <Shield className="w-2.5 h-2.5" /> معتمد
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-slate-700 font-medium truncate mb-1">{ad.title}</p>
                  {ad.description && <p className="text-xs text-slate-400 line-clamp-1">{ad.description}</p>}
                  <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-400">
                    <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {(ad.impressions || 0).toLocaleString('ar-SA')}</span>
                    <span className="flex items-center gap-1"><MousePointerClick className="w-3 h-3" /> {(ad.clicks || 0).toLocaleString('ar-SA')}</span>
                    {ad.impressions > 0 && (
                      <span className="text-amber-600 font-medium">{((ad.clicks / ad.impressions) * 100).toFixed(1)}% CTR</span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex sm:flex-col items-center gap-1.5">
                  <button
                    onClick={() => toggleActive(ad)}
                    className={`flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                      ad.is_active ? "bg-green-50 text-green-600 hover:bg-green-100" : "bg-slate-50 text-slate-400 hover:bg-green-50 hover:text-green-500"
                    }`}
                  >
                    {ad.is_active ? <XCircle className="w-3.5 h-3.5" /> : <CheckCircle className="w-3.5 h-3.5" />}
                    {ad.is_active ? "إيقاف" : "تفعيل"}
                  </button>
                  <button onClick={() => openEdit(ad)} className="p-2 rounded-lg bg-slate-50 text-slate-400 hover:bg-amber-50 hover:text-amber-600 transition-colors">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => handleDelete(ad.id)} className="p-2 rounded-lg bg-slate-50 text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
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