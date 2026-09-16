import React, { useEffect, useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Eye, Loader2, Megaphone, MousePointerClick, Plus, TrendingUp, CalendarDays, Tag, MapPin, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
      const data = await base44.entities.Advertisement.list("-created_date", 500);
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

  const metrics = [
    ["إجمالي الإعلانات", ads.length, Megaphone],
    ["إعلانات نشطة", ads.filter(a => a.is_active).length, TrendingUp],
    ["إجمالي المشاهدات", totals.impressions.toLocaleString("ar-SA"), Eye],
    ["إجمالي النقرات", totals.clicks.toLocaleString("ar-SA"), MousePointerClick],
    ["نسبة النقر CTR", `${totals.ctr}%`, MousePointerClick],
  ];

  return (
    <div dir="rtl" className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3"><div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#6B5D4F] to-[#C9A66B] flex items-center justify-center"><Megaphone className="w-6 h-6 text-white" /></div><div><h1 className="text-2xl font-bold text-[#6B5D4F]">بوابة المعلن</h1><p className="text-sm text-slate-500">لوحة الإعلانات والأداء وتفاصيل الحملات</p></div></div>
          <Button onClick={() => { setEditingAd(null); setShowForm(true); }} className="bg-gradient-to-r from-[#6B5D4F] to-[#C9A66B] text-white gap-2"><Plus className="w-4 h-4" /> إعلان جديد</Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4 mb-8">
          {metrics.map(([label, value, Icon]) => <Card key={label} className="border-0 shadow-md"><CardContent className="p-5"><Icon className="w-5 h-5 text-[#C9A66B] mb-2" /><p className="text-2xl font-bold text-[#6B5D4F]">{value}</p><p className="text-xs text-slate-500">{label}</p></CardContent></Card>)}
        </div>

        {ads.length > 0 && <AdReportsPanel ads={ads} />}

        <div className="mb-4"><h2 className="text-xl font-bold text-[#6B5D4F]">الإعلانات وتفاصيلها</h2><p className="text-sm text-slate-500">الإعلان، الحالة، المشاهدات، النقرات، نسبة النقر، القطاع، موضع الظهور، المدة والوسوم</p></div>
        <div className="space-y-4">
          {ads.map(ad => {
            const ctr = ad.impressions ? ((ad.clicks / ad.impressions) * 100).toFixed(1) : "0.0";
            return <Card key={ad.id} className="border-0 shadow-sm"><CardContent className="p-4">
              <div className="flex flex-col lg:flex-row gap-5">
                <div className="w-full lg:w-48 h-28 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0">{ad.image_url && <img src={ad.image_url} alt={ad.title || ""} className="w-full h-full object-cover" />}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2"><div className="font-semibold text-slate-800">{ad.title}</div>{ad.is_active ? <Badge className="bg-green-50 text-green-600">نشط</Badge> : <Badge variant="outline">متوقف</Badge>}{ad.is_verified_advertiser && <Badge className="bg-blue-50 text-blue-600">معلن موثق</Badge>}</div>
                  <div className="text-sm text-slate-500 mt-1">{ad.advertiser_name || "معلن"}</div>
                  {ad.description && <p className="text-sm text-slate-600 mt-2">{ad.description}</p>}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4">
                    <div className="rounded-lg bg-slate-50 p-2"><div className="text-xs text-slate-400">المشاهدات</div><b>{(ad.impressions || 0).toLocaleString("ar-SA")}</b></div>
                    <div className="rounded-lg bg-slate-50 p-2"><div className="text-xs text-slate-400">النقرات</div><b>{(ad.clicks || 0).toLocaleString("ar-SA")}</b></div>
                    <div className="rounded-lg bg-slate-50 p-2"><div className="text-xs text-slate-400">CTR</div><b>{ctr}%</b></div>
                    <div className="rounded-lg bg-slate-50 p-2"><div className="text-xs text-slate-400">المحتوى</div><b>{ad.media_type || "image"}</b></div>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-3 text-xs text-slate-500">
                    {ad.category && <Badge variant="outline"><Tag className="w-3 h-3 ml-1" />{ad.category}</Badge>}
                    {ad.placement && <Badge variant="outline"><MapPin className="w-3 h-3 ml-1" />{ad.placement}</Badge>}
                    {(ad.start_date || ad.end_date) && <Badge variant="outline"><CalendarDays className="w-3 h-3 ml-1" />{ad.start_date || "—"} → {ad.end_date || "—"}</Badge>}
                    {ad.target_tags?.length > 0 && <Badge variant="outline">الوسوم: {ad.target_tags.join("، ")}</Badge>}
                    {ad.destination_url && <a href={ad.destination_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-blue-600 hover:underline"><ExternalLink className="w-3 h-3" />رابط الإعلان</a>}
                  </div>
                </div>
                <div className="flex lg:flex-col gap-2 lg:justify-start"><Button variant="outline" onClick={() => { setEditingAd(ad); setShowForm(true); }}>تعديل</Button></div>
              </div>
            </CardContent></Card>;
          })}
        </div>

        <Dialog open={showForm} onOpenChange={setShowForm}><DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto" dir="rtl"><DialogHeader><DialogTitle>إدارة الإعلان</DialogTitle></DialogHeader><AdForm editingAd={editingAd} onSave={save} onCancel={() => { setShowForm(false); setEditingAd(null); }} /></DialogContent></Dialog>
      </div>
    </div>
  );
}
