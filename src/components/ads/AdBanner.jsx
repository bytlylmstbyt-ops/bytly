import React, { useEffect, useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { ExternalLink, CheckCircle } from "lucide-react";

const CATEGORY_LABELS = {
  engineering: "هندسة",
  contracting: "مقاولات",
  decor: "ديكور",
  building_materials: "مواد بناء",
  furniture: "أثاث",
  consulting_office: "مكتب استشاري",
  concrete_supply: "توريد خرسانة",
  electrical: "كهربائيات",
  plumbing: "سباكة",
  landscape: "تنسيق حدائق",
};

function SingleAdCard({ ad, variant = "horizontal" }) {
  const clickedRef = useRef(false);
  const handleClick = () => {
    if (clickedRef.current) return;
    clickedRef.current = true;
    base44.functions.invoke("trackAdClick", { ad_id: ad.id, timestamp: new Date().toISOString() }).catch(() => {}).finally(() => {
      setTimeout(() => { clickedRef.current = false; }, 700);
    });
    window.open(ad.destination_url, "_blank", "noopener,noreferrer");
  };

  if (variant === "sidebar") {
    return (
      <div
        onClick={handleClick}
        role="button"
        tabIndex={0}
        aria-label={`فتح الإعلان ${ad.title}`}
        className="cursor-pointer group rounded-xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition-all overflow-hidden"
      >
        <div className="relative">
          <img
            src={ad.image_url}
            alt={ad.title}
            className="w-full h-32 object-cover group-hover:opacity-90 transition-opacity"
            loading="lazy"
          />
          <span className="absolute top-2 right-2 bg-black/50 text-white text-[10px] px-2 py-0.5 rounded-full">
            إعلان
          </span>
        </div>
        <div className="p-3">
          <div className="flex items-center gap-1 mb-1">
            {ad.logo_url && (
              <img src={ad.logo_url} alt="" className="w-5 h-5 rounded-full object-cover" />
            )}
            <span className="text-xs font-semibold text-slate-800 truncate">{ad.advertiser_name}</span>
            {ad.is_verified_advertiser && (
              <CheckCircle className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" title="معلن معتمد" />
            )}
          </div>
          <p className="text-xs text-slate-500 line-clamp-2">{ad.title}</p>
          <div className="flex items-center justify-between mt-2">
            <span className="text-[10px] bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full border border-amber-200">
              {CATEGORY_LABELS[ad.category] || ad.category}
            </span>
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </div>
        </div>
      </div>
    );
  }

  // Horizontal / bottom variant
  return (
    <div
      onClick={handleClick}
      role="button"
      tabIndex={0}
      aria-label={`فتح الإعلان ${ad.title}`}
      className="cursor-pointer group flex gap-3 rounded-xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition-all p-3 items-center"
    >
      <img
        src={ad.image_url}
        alt={ad.title}
        className="w-20 h-16 object-cover rounded-lg flex-shrink-0 group-hover:opacity-90 transition-opacity"
        loading="lazy"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1 mb-0.5">
          {ad.logo_url && (
            <img src={ad.logo_url} alt="" className="w-4 h-4 rounded-full object-cover" />
          )}
          <span className="text-sm font-semibold text-slate-800 truncate">{ad.advertiser_name}</span>
          {ad.is_verified_advertiser && (
            <CheckCircle className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" title="معلن معتمد" />
          )}
          <span className="mr-auto text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">إعلان</span>
        </div>
        <p className="text-xs text-slate-600 line-clamp-1">{ad.title}</p>
        {ad.description && (
          <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">{ad.description}</p>
        )}
        <div className="flex items-center gap-2 mt-1">
          <span className="text-[10px] bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full border border-amber-200">
            {CATEGORY_LABELS[ad.category] || ad.category}
          </span>
          <span className="text-[10px] text-[#C9A66B] flex items-center gap-0.5">
            اعرف أكثر <ExternalLink className="w-2.5 h-2.5" />
          </span>
        </div>
      </div>
    </div>
  );
}

export default function AdBanner({ placement, tags = [], variant = "horizontal", maxAds = 2 }) {
  const [ads, setAds] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const clickedRef = useRef(false);

  useEffect(() => {
    // Async load - doesn't block page render
    const timer = setTimeout(() => {
      base44.functions.invoke("getContextualAds", {
        placement,
        tags,
        limit: maxAds,
      })
        .then(res => {
          if (res.data?.ads?.length > 0) setAds(res.data.ads);
        })
        .catch(() => {})
        .finally(() => setLoaded(true));
    }, 300); // small delay so page renders first

    return () => clearTimeout(timer);
  }, [placement, JSON.stringify(tags)]);

  if (!loaded || ads.length === 0) return null;

  return (
    <div className="mt-4">
      <p className="text-[11px] text-slate-400 mb-2">محتوى مدعوم</p>
      <div className={variant === "sidebar" ? "space-y-3" : "space-y-2"}>
        {ads.map(ad => (
          <SingleAdCard key={ad.id} ad={ad} variant={variant} />
        ))}
      </div>
    </div>
  );
}