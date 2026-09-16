import React, { useEffect, useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Building2, Eye, Loader2, Megaphone, MousePointerClick, Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function AdvertisersDirectory() {
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const data = await base44.entities.Advertisement.list("-created_date", 100);
        setAds(data || []);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const advertisers = useMemo(() => {
    const map = new Map();
    ads.forEach((ad) => {
      const name = ad.advertiser_name || "معلن بدون اسم";
      const current = map.get(name) || { name, ads: 0, impressions: 0, clicks: 0, active: 0 };
      current.ads += 1;
      current.impressions += ad.impressions || 0;
      current.clicks += ad.clicks || 0;
      if (ad.is_active) current.active += 1;
      map.set(name, current);
    });
    return [...map.values()].filter((item) => item.name.toLowerCase().includes(search.toLowerCase()));
  }, [ads, search]);

  return (
    <div dir="rtl" className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#6B5D4F] to-[#C9A66B] flex items-center justify-center">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#6B5D4F]">المعلنون</h1>
              <p className="text-sm text-slate-500">قائمة المعلنين وإجمالي نشاط إعلاناتهم</p>
            </div>
          </div>
        </div>

        <div className="relative mb-6 max-w-xl">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="ابحث باسم المعلن..." className="pr-9" />
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-[#C9A66B]" /></div>
        ) : advertisers.length === 0 ? (
          <Card><CardContent className="py-16 text-center text-slate-500">لا توجد بيانات معلنين.</CardContent></Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {advertisers.map((advertiser) => {
              const ctr = advertiser.impressions ? ((advertiser.clicks / advertiser.impressions) * 100).toFixed(1) : "0.0";
              return (
                <Card key={advertiser.name} className="border-0 shadow-md">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-3 mb-5">
                      <div className="w-11 h-11 rounded-xl bg-amber-50 flex items-center justify-center"><Megaphone className="w-5 h-5 text-[#C9A66B]" /></div>
                      <div><h2 className="font-semibold text-[#6B5D4F]">{advertiser.name}</h2><p className="text-xs text-slate-400">{advertiser.active} إعلان نشط</p></div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="rounded-xl bg-slate-50 p-3"><Megaphone className="w-4 h-4 text-slate-400 mb-1" /><b>{advertiser.ads}</b><div className="text-xs text-slate-400">الإعلانات</div></div>
                      <div className="rounded-xl bg-slate-50 p-3"><Eye className="w-4 h-4 text-slate-400 mb-1" /><b>{advertiser.impressions.toLocaleString("ar-SA")}</b><div className="text-xs text-slate-400">الظهور</div></div>
                      <div className="rounded-xl bg-slate-50 p-3"><MousePointerClick className="w-4 h-4 text-slate-400 mb-1" /><b>{advertiser.clicks.toLocaleString("ar-SA")}</b><div className="text-xs text-slate-400">النقرات</div></div>
                      <div className="rounded-xl bg-slate-50 p-3"><b>{ctr}%</b><div className="text-xs text-slate-400 mt-1">CTR</div></div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
