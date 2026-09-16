import React, { useEffect, useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Building2, Eye, Loader2, Mail, Megaphone, MousePointerClick, Phone, Search, ShieldCheck, Globe, MapPin } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export default function AdvertisersDirectory() {
  const [ads, setAds] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const [adData, advertiserData] = await Promise.all([
          base44.entities.Advertisement.list("-created_date", 500),
          base44.entities.Advertiser.list("-created_date", 500),
        ]);
        setAds(adData || []);
        setProfiles(advertiserData || []);
      } catch (error) {
        console.error("Failed to load advertiser data", error);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const advertisers = useMemo(() => {
    const map = new Map();
    profiles.forEach((profile) => {
      const name = profile.company_name || "معلن بدون اسم";
      map.set(name, { ...profile, name, ads: 0, impressions: 0, clicks: 0, active: 0 });
    });
    ads.forEach((ad) => {
      const name = ad.advertiser_name || "معلن بدون اسم";
      const current = map.get(name) || { name, ads: 0, impressions: 0, clicks: 0, active: 0 };
      current.ads += 1;
      current.impressions += ad.impressions || 0;
      current.clicks += ad.clicks || 0;
      if (ad.is_active) current.active += 1;
      if (!current.category) current.category = ad.category;
      map.set(name, current);
    });
    const q = search.trim().toLowerCase();
    return [...map.values()].filter((item) => !q || [item.name, item.contact_name, item.email, item.phone, item.city, item.category].filter(Boolean).some((v) => String(v).toLowerCase().includes(q)));
  }, [ads, profiles, search]);

  return (
    <div dir="rtl" className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-8 flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#6B5D4F] to-[#C9A66B] flex items-center justify-center"><Building2 className="w-6 h-6 text-white" /></div>
          <div><h1 className="text-2xl font-bold text-[#6B5D4F]">المعلنون</h1><p className="text-sm text-slate-500">بيانات المعلنين + بيانات التواصل + عدد الإعلانات وأداؤها</p></div>
        </div>

        <div className="relative mb-6 max-w-xl">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="ابحث باسم الشركة أو الشخص أو البريد أو الجوال..." className="pr-9" />
        </div>

        {loading ? <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-[#C9A66B]" /></div> : advertisers.length === 0 ? (
          <Card><CardContent className="py-16 text-center text-slate-500">لا توجد بيانات معلنين في كيان Advertiser حالياً.</CardContent></Card>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
            {advertisers.map((advertiser) => {
              const ctr = advertiser.impressions ? ((advertiser.clicks / advertiser.impressions) * 100).toFixed(1) : "0.0";
              return (
                <Card key={advertiser.name} className="border-0 shadow-md">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-3 mb-5">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-amber-50 flex items-center justify-center"><Megaphone className="w-5 h-5 text-[#C9A66B]" /></div>
                        <div><h2 className="font-semibold text-[#6B5D4F]">{advertiser.name}</h2><p className="text-xs text-slate-400">{advertiser.contact_name || "بيانات جهة الاتصال غير مسجلة"}</p></div>
                      </div>
                      <div className="flex gap-1 flex-wrap justify-end">
                        {advertiser.is_verified && <Badge className="bg-blue-50 text-blue-600"><ShieldCheck className="w-3 h-3 ml-1" />موثق</Badge>}
                        {advertiser.status && <Badge variant="outline">{advertiser.status}</Badge>}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4 text-xs">
                      <div className="rounded-lg bg-slate-50 p-3 flex gap-2 items-center"><Mail className="w-4 h-4 text-slate-400" /><span>{advertiser.email || "البريد غير مسجل"}</span></div>
                      <div className="rounded-lg bg-slate-50 p-3 flex gap-2 items-center"><Phone className="w-4 h-4 text-slate-400" /><span>{advertiser.phone || "الجوال غير مسجل"}</span></div>
                      <div className="rounded-lg bg-slate-50 p-3 flex gap-2 items-center"><MapPin className="w-4 h-4 text-slate-400" /><span>{[advertiser.city, advertiser.country].filter(Boolean).join("، ") || "الموقع غير مسجل"}</span></div>
                      <div className="rounded-lg bg-slate-50 p-3 flex gap-2 items-center"><Globe className="w-4 h-4 text-slate-400" />{advertiser.website ? <a href={advertiser.website} target="_blank" rel="noreferrer" className="truncate text-blue-600">{advertiser.website}</a> : <span>الموقع غير مسجل</span>}</div>
                    </div>

                    {advertiser.bio && <p className="text-sm text-slate-600 mb-4">{advertiser.bio}</p>}

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
                      <div className="rounded-xl bg-slate-50 p-3"><Megaphone className="w-4 h-4 text-slate-400 mb-1" /><b>{advertiser.ads}</b><div className="text-xs text-slate-400">الإعلانات</div></div>
                      <div className="rounded-xl bg-slate-50 p-3"><Eye className="w-4 h-4 text-slate-400 mb-1" /><b>{advertiser.impressions.toLocaleString("ar-SA")}</b><div className="text-xs text-slate-400">المشاهدات</div></div>
                      <div className="rounded-xl bg-slate-50 p-3"><MousePointerClick className="w-4 h-4 text-slate-400 mb-1" /><b>{advertiser.clicks.toLocaleString("ar-SA")}</b><div className="text-xs text-slate-400">النقرات</div></div>
                      <div className="rounded-xl bg-slate-50 p-3"><b>{ctr}%</b><div className="text-xs text-slate-400 mt-1">CTR</div></div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-500">
                      {advertiser.category && <Badge variant="outline">القطاع: {advertiser.category}</Badge>}
                      {advertiser.subscription_type && <Badge variant="outline">الاشتراك: {advertiser.subscription_type}</Badge>}
                      {advertiser.campaign_value > 0 && <Badge variant="outline">قيمة الحملة: {advertiser.campaign_value.toLocaleString("ar-SA")} ر.س</Badge>}
                      {advertiser.total_spent > 0 && <Badge variant="outline">إجمالي الإنفاق: {advertiser.total_spent.toLocaleString("ar-SA")} ر.س</Badge>}
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
