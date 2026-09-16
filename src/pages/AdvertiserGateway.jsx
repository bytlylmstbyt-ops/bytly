import React, { useEffect, useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Eye, Loader2, Megaphone, MousePointerClick, Plus, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import AdReportsPanel from "@/components/ads/AdReportsPanel";
import AdForm from "@/components/ads/AdForm";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function AdvertiserGateway() {
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingAd, setEditingAd] = useState(null);

  const loadAds = async () => {
    setLoading(true);
    try {
      const data = await base44.entities.Advertisement.list("-created_date", 50);
      setAds(data || []);
    } finally { setLoading(false); }
  };

  useEffect(() => { loadAds(); }, []);

  const totals = useMemo(() => {
    const impressions = ads.reduce((s, a) => s + (a.impressions || 0), 0);
    const clicks = ads.reduce((s, a) => s + (a.clicks || 0), 0);
    return { impressions, clicks, ctr: impressions ? ((clicks / impressions) * 100).toFixed(1) : "0.0" };
  }, [ads]);

  const save = async (payload) => {
    if (editingAd) await base44.entities.Advertisement.update(editingAd.id, payload);
    else await base44.entities.Advertisement.create(payload);
    setShowForm(false); setEditingAd(null); loadAds();
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-[#C9A66B]" /></div>;

  return (
    <div dir="rtl" className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3"><div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#6B5D4F] to-[#C9A66B] flex items-center justify-center"><Megaphone className="w-6 h-6 text-white" /></div><div><h1 className="text-2xl font-bold text-[#6B5D4F]">بوابة المعلن</h1><p className="text-sm text-slate-500">لوحة الإعلانات والأداء</p></div></div>
          <Button onClick={() => { setEditingAd(null); setShowForm(true); }} className="bg-gradient-to-r from-[#6B5D4F] to-[#C9A66B] text-white gap-2"><Plus className="w-4 h-4" /> إعلان جديد</Button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[["إجمالي الإعلانات", ads.length, Megaphone], ["إعلانات نشطة", ads.filter(a => a.is_active).length, TrendingUp], ["إجمالي الظهور", totals.impressions.toLocaleString("ar-SA"), Eye], ["نسبة النقر CTR", `${totals.ctr}%`, MousePointerClick]].map(([label, value, Icon]) => <Card key={label} className="border-0 shadow-md"><CardContent className="p-5"><Icon className="w-5 h-5 text-[#C9A66B] mb-2" /><p className="text-2xl font-bold text-[#6B5D4F]">{value}</p><p className="text-xs text-slate-500">{label}</p></CardContent></Card>)}
        </div>

        {ads.length > 0 && <div className="mb-8"><AdReportsPanel ads={ads} /></div>}

        <div className="mb-4"><h2 className="text-xl font-bold text-[#6B5D4F]">الإعلانات</h2><p className="text-sm text-slate-500">تفاصيل كل إعلان ومشاهداته ونقراته ونسبة النقر</p></div>
        <div className="space-y-3">
          {ads.map(ad => <Card key={ad.id} className="border-0 shadow-sm"><CardContent className="p-4"><div className="flex flex-col md:flex-row md:items-center gap-4"><div className="w-full md:w-40 h-24 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0">{ad.image_url && <img src={ad.image_url} alt={ad.title || ""} className="w-full h-full object-cover" />}</div><div className="flex-1"><div className="font-semibold text-slate-800">{ad.title}</div><div className="text-sm text-slate-500 mt-1">{ad.advertiser_name || "معلن"}</div><div className="flex flex-wrap gap-4 mt-3 text-xs text-slate-500"><span><Eye className="inline w-3.5 h-3.5 ml-1" />{(ad.impressions || 0).toLocaleString("ar-SA")} ظهور</span><span><MousePointerClick className="inline w-3.5 h-3.5 ml-1" />{(ad.clicks || 0).toLocaleString("ar-SA")} نقرة</span><span>{ad.impressions ? ((ad.clicks / ad.impressions) * 100).toFixed(1) : "0.0"}% CTR</span></div></div><Button variant="outline" onClick={() => { setEditingAd(ad); setShowForm(true); }}>تعديل</Button></div></CardContent></Card>)}
        </div>

        <Dialog open={showForm} onOpenChange={setShowForm}><DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto" dir="rtl"><DialogHeader><DialogTitle>إدارة الإعلان</DialogTitle></DialogHeader><AdForm editingAd={editingAd} onSave={save} onCancel={() => { setShowForm(false); setEditingAd(null); }} /></DialogContent></Dialog>
      </div>
    </div>
  );
}
