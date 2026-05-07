import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";

export function useAds({ placement, tags = [], maxAds = 3 }) {
  const [ads, setAds] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      base44.functions.invoke("getContextualAds", { placement, tags, limit: maxAds })
        .then(res => { if (res.data?.ads?.length > 0) setAds(res.data.ads); })
        .catch(() => {})
        .finally(() => setLoaded(true));
    }, 400);
    return () => clearTimeout(timer);
  }, [placement, JSON.stringify(tags)]);

  return { ads, loaded };
}