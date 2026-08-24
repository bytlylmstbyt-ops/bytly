import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Loader2, Megaphone, Power, Trash2, Plus, Inbox, MousePointerClick, Eye } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Link } from "react-router-dom";

const MEDIA_LABEL = { image: "صورة", video: "فيديو", gif: "متحرك" };
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString("ar-SA") : "—");
const today = () => new Date().toISOString().slice(0, 10);

const adStatus = (ad) => {
  if (!ad.is_active) return { label: "معطّل", cls: "bg-slate-100 text-slate-600 border-slate-200" };
  if (ad.end_date && ad.end_date < today()) return { label: "منتهي", cls: "bg-red-100 text-red-700 border-red-200" };
  if (ad.start_date && ad.start_date > today()) return { label: "مجدول", cls: "bg-amber-100 text-amber-700 border-amber-200" };
  return { label: "نشط", cls: "bg-green-100 text-green-700 border-green-200" };
};

export default function AdvertiserCampaignsDialog({ advertiser, open, onOpenChange }) {
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const { toast } = useToast();

  const load = async () => {
    setLoading(true);
    try {
      const list = await base44.entities.Advertisement.filter({
        advertiser_name: advertiser.company_name,
      });
      setAds(list);
    } catch { setAds([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { if (open) load(); }, [open]);

  const toggle = async (ad) => {
    setBusy(true);
    try {
      await base44.entities.Advertisement.update(ad.id, { is_active: !ad.is_active });
      setAds((p) => p.map((x) => (x.id === ad.id ? { ...x, is_active: !x.is_active } : x)));
      toast({ title: ad.is_active ? "تم إيقاف الحملة" : "تم تفعيل الحملة" });
    } catch (e) {
      toast({ variant: "destructive", title: "تعذّر التنفيذ", description: e.message });
    } finally { setBusy(false); }
  };

  const remove = async (ad) => {
    if (!confirm(`حذف الحملة «${ad.title}» نهائيًا؟`)) return;
    setBusy(true);
    try {
      await base44.entities.Advertisement.delete(ad.id);
      setAds((p) => p.filter((x) => x.id !== ad.id));
      toast({ title: "تم حذف الحملة" });
    } catch (e) {
      toast({ variant: "destructive", title: "تعذّر الحذف", description: e.message });
    } finally { setBusy(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-[#C9A66B]" />
            إدارة الحملات الإعلانية — {advertiser.company_name}
          </DialogTitle>
          <DialogDescription>تفعيل وإيقاف وحذف الحملات الإعلانية الخاصة بالمعلن</DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-between mb-3">
          <p className="text-sm text-slate-500">{ads.length} حملة</p>
          <Button asChild size="sm" className="bg-gradient-to-r from-[#6B5D4F] to-[#C9A66B]">
            <Link to="/AdManager">
              <Plus className="w-4 h-4 ml-1" /> حملة جديدة
            </Link>
          </Button>
        </div>

        {loading ? (
          <div className="py-12 flex justify-center"><Loader2 className="w-6 h-6 text-[#C9A66B] animate-spin" /></div>
        ) : ads.length === 0 ? (
          <div className="py-10 text-center text-slate-400 flex flex-col items-center gap-2">
            <Inbox className="w-8 h-8" />
            <p className="text-sm">لا توجد حملات إعلانية لهذا المعلن</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[50vh] overflow-y-auto">
            {ads.map((ad) => {
              const st = adStatus(ad);
              return (
                <div key={ad.id} className="border border-slate-100 rounded-lg p-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {ad.image_url && (
                      <img src={ad.image_url} alt="" className="w-12 h-12 rounded object-cover shrink-0" />
                    )}
                    <div className="min-w-0">
                      <p className="font-semibold text-[#4A3F35] text-sm truncate">{ad.title}</p>
                      <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5 flex-wrap">
                        <span>{MEDIA_LABEL[ad.media_type] || ad.media_type}</span>
                        <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {ad.impressions || 0}</span>
                        <span className="flex items-center gap-1"><MousePointerClick className="w-3 h-3" /> {ad.clicks || 0}</span>
                        <span>{fmtDate(ad.start_date)} ← {fmtDate(ad.end_date)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant="outline" className={st.cls}>{st.label}</Badge>
                    <Button size="sm" variant="outline" onClick={() => toggle(ad)} disabled={busy}>
                      <Power className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => remove(ad)} disabled={busy}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}