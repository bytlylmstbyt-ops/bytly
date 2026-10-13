import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

export function useAds({ placement, tags = [], maxAds = 3 }) {
  const [ads, setAds] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        if (!supabase) throw new Error("Supabase is not configured");
        const today = new Date().toISOString().slice(0, 10);
        const { data, error } = await supabase
          .from("advertisements")
          .select("id, title, advertiser_name, image_url, video_url, media_type, destination_url, category, target_tags, placement, description, logo_url")
          .eq("is_active", true)
          .in("placement", [placement, "all"])
          .or(`start_date.is.null,start_date.lte.${today}`)
          .or(`end_date.is.null,end_date.gte.${today}`)
          .order("impressions", { ascending: true })
          .limit(Math.max(maxAds * 4, maxAds));
        if (error) throw error;

        const normalizedTags = (tags || []).map((tag) => String(tag).toLowerCase());
        const matching = (data || []).filter((ad) => {
          const targetTags = Array.isArray(ad.target_tags) ? ad.target_tags : [];
          return targetTags.length === 0 ||
            normalizedTags.length === 0 ||
            targetTags.some((tag) => normalizedTags.includes(String(tag).toLowerCase()));
        }).slice(0, maxAds);

        if (!cancelled) setAds(matching);
      } catch (error) {
        console.error("Contextual ads load error:", error.message);
        if (!cancelled) setAds([]);
      } finally {
        if (!cancelled) setLoaded(true);
      }
    }, 400);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [placement, JSON.stringify(tags), maxAds]);

  return { ads, loaded };
}
