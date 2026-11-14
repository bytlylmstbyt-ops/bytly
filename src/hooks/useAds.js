import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

export function useAds({ placement, tags = [], maxAds = 3 }) {
  const [ads, setAds] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      const loadAds = async () => {
        try {
          const today = new Date().toISOString().slice(0, 10);
          const { data, error } = await supabase
            .from("advertisements")
            .select("*")
            .eq("is_active", true)
            .eq("placement", placement)
            .or(`start_date.is.null,start_date.lte.${today}`)
            .or(`end_date.is.null,end_date.gte.${today}`)
            .limit(Math.max(maxAds * 5, 15));
          if (error) throw error;
          const requestedTags = new Set((Array.isArray(tags) ? tags : []).map((tag) => String(tag).toLowerCase()));
          const matching = (data || []).filter((ad) => {
            const targetTags = Array.isArray(ad.target_tags) ? ad.target_tags : [];
            return targetTags.length === 0 || targetTags.some((tag) => requestedTags.has(String(tag).toLowerCase()));
          });
          setAds(matching.slice(0, maxAds));
        } catch (error) {
          console.warn("Contextual ads could not be loaded:", error?.message || error);
          setAds([]);
        } finally {
          setLoaded(true);
        }
      };
      loadAds();
    }, 400);
    return () => clearTimeout(timer);
  }, [placement, JSON.stringify(tags)]);

  return { ads, loaded };
}