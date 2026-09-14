import React, { useState, useEffect, useMemo, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, Megaphone, Users, PlayCircle, StopCircle, Clock, DollarSign, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";
import ProviderActionsMenu from "./ProviderActionsMenu";
import BulkActionBar from "./BulkActionBar";
import { useBulkSelection } from "./useBulkSelection";
import { Checkbox } from "@/components/ui/checkbox";

const ACCOUNT_BADGE = {
  approved: "bg-green-100 text-green-700 border-green-200",
  pending: "bg-amber-100 text-amber-700 border-amber-200",
  rejected: "bg-red-100 text-red-700 border-red-200",
};
const ACCOUNT_LABEL = { approved: "معتمد", pending: "معلق", rejected: "موقوف" };
const AD_TYPE_LABEL = { image: "صورة", video: "فيديو", gif: "متحرك" };
const fmtMoney = (v) => (v != null && v !== "" ? Number(v).toLocaleString("ar-SA") + " ر.س" : "—");
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString("ar-SA") : "—");
const todayStr = () => new Date().toISOString().slice(0, 10);

export default function AdvertisersPanel({ isAdmin }) {
  const [advertisers, setAdvertisers] = useState([]);
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [bulkBusy, setBulkBusy] = useState(false);
  const bulk = useBulkSelection();

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      const [advList, adList] = await Promise.all([
        base44.entities.Advertiser.list("-created_date", 500).catch(() => []),
        base44.entities.Advertisement.list("-created_date", 500).catch(() => []),
      ]);
      setAdvertisers(advList);
      setAds(adList);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const adsByName = useMemo(() => {
    const map = {};
    ads.forEach((a) => {
      const key = a.advertiser_name || "";
      if (!map[key]) map[key] = [];
      map[key].push(a);
    });
    return map;
  }, [ads]);

  const adStatusFor = (name) => {
    const list = adsByName[name] || [];
    if (!list.length) return { label: "لا توجد حملات", cls: "bg-slate-100 text-slate-500 border-slate-200" };
    const t = todayStr();
    const active = list.some((a) => a.is_active && (!a.end_date || a.end_date >= t) && (!a.start_date || a.start_date <= t));
    if (active) return { label: "نشط", cls: "bg-green-100 text-green-700 border-green-200" };
    const ended = list.some((a) => a.end_date && a.end_date < t);
    if (ended) return { label: "منتهي", cls: "bg-red-100 text-red-700 border-red-200" };
    return { label: "معلق", cls: "bg-amber-100 text-amber-700 border-amber-200" };
  };

  const stats = useMemo(() => {
    const t = todayStr();
    const activeAds = ads.filter((a) => a.is_active && (!a.end_date || a.end_date >= t) && (!a.start_date || a.start_date <= t)).length;
    const endedAds = ads.filter((a) => a.end_date && a.end_date < t).length;
    const pendingAds = ads.filter((a) => !a.is_active || (a.start_date && a.start_date > t)).length;
    const revenue = advertisers.reduce((s, a) => s + (Number(a.total_spent) || 0), 0);
    return {
      total: advertisers.length,
      activeAds,
      endedAds,
      pendingAds,
      revenue,
    };
  }, [advertisers, ads]);

  const filtered = useMemo(() => {
    return advertisers.filter((a) => {
      const q = search.toLowerCase();
      const match = !search ||
        (a.company_name || "").toLowerCase().includes(q) ||
        (a.contact_name || "").toLowerCase().includes(q) ||
        (a.email || "").toLowerCase().includes(q);
      return match;
    });
  }, [advertisers, search]);

  const onUpdate = (updated) =>
    setAdvertisers((p) => p.map((x) => (x.id === updated.id ? updated : x)));
  const onDelete = (id) => setAdvertisers((p) => p.filter((x) => x.id !== id));

  const runBulk = async (action) => {
    if (!isAdmin || bulk.selectedCount === 0) return;
    setBulkBusy(true);
    try {
      const ids = bulk.selectedIds;
      const Entity = base44.entities.Advertiser;
      if (action === "delete") {
        await Promise.all(ids.map((id) => Entity.delete(id)));
      } else {
        const patch = action === "activate" ? { status: "approved", is_available: true }
          : action === "suspend" ? { status: "rejected" }
          : action === "pause" ? { is_available: false } : null;
        if (patch) await Promise.all(ids.map((id) => Entity.update(id, patch)));
      }
      await load();
      bulk.clear();
    } catch (e) {
      console.error("bulk action failed", e);
    } finally {
      setBulkBusy(false);
    }
  };

  const statCards = [
    { label: "إجمالي المعلنين", value: stats.total, icon: Users, color: "text-[#4A3F35]", bg: "bg-[#F5F0E8]" },
    { label: "الإعلانات النشطة", value: stats.activeAds, icon: PlayCircle, color: "text-green-600", bg: "bg-green-50" },
    { label: "المنتهية", value: stats.endedAds, icon: StopCircle, color: "text-red-600", bg: "bg-red-50" },
    { label: "المعلقة", value: stats.pendingAds, icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
    { label: "إجمالي الإيرادات", value: fmtMoney(stats.revenue), icon: DollarSign, color: "text-[#C9A66B]", bg: "bg-[#FEF9EE]" },
  ];

  if (loading) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#C9A66B] animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#6B5D4F] to-[#C9A66B] flex items-center justify-center">
            <Megaphone className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[#4A3F35]">إدارة المعلنين</h2>
            <p className="text-xs text-slate-500">إدارة حسابات المعلنين وحملاتهم الإعلانية</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={refreshing}>
          <RefreshCw className={`w-4 h-4 ml-1 ${refreshing ? "animate-spin" : ""}`} />
          تحديث
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-5">
        {statCards.map((s, i) => {
          const Icon = s.icon;
          return (
            <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
              <Card className="border-0 shadow-sm">
                <CardContent className="p-4">
                  <div className={`w-9 h-9 rounded-lg ${s.bg} flex items-center justify-center mb-2`}>
                    <Icon className={`w-5 h-5 ${s.color}`} />
                  </div>
                  <p className="text-xl font-bold text-[#4A3F35]">{s.value}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Search */}
      <Card className="mb-4 border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="ابحث باسم المعلن أو الشركة أو البريد..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pr-10"
            />
          </div>
        </CardContent>
      </Card>

      <BulkActionBar
        selectedCount={bulk.selectedCount}
        entityLabel="معلن"
        onAction={runBulk}
        onClear={bulk.clear}
        isAdmin={isAdmin}
        busy={bulkBusy}
      />

      {/* Table */}
      <Card className="border-0 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#F5F0E8] text-[#4A3F35] text-right">
                <th className="px-3 py-3 w-10 text-center">
                  <Checkbox
                    checked={filtered.length > 0 && filtered.every((a) => bulk.isSelected(a.id)) ? true : filtered.some((a) => bulk.isSelected(a.id)) ? "indeterminate" : false}
                    onCheckedChange={() => bulk.toggleAll(filtered.map((a) => a.id))}
                  />
                </th>
                <th className="px-3 py-3 font-semibold whitespace-nowrap">اسم المعلن</th>
                <th className="px-3 py-3 font-semibold whitespace-nowrap">الشركة</th>
                <th className="px-3 py-3 font-semibold whitespace-nowrap">نوع الإعلان</th>
                <th className="px-3 py-3 font-semibold whitespace-nowrap">حالة الحساب</th>
                <th className="px-3 py-3 font-semibold whitespace-nowrap">حالة الإعلان</th>
                <th className="px-3 py-3 font-semibold whitespace-nowrap">البداية</th>
                <th className="px-3 py-3 font-semibold whitespace-nowrap">النهاية</th>
                <th className="px-3 py-3 font-semibold whitespace-nowrap">قيمة الحملة/الاشتراك</th>
                <th className="px-3 py-3 font-semibold whitespace-nowrap text-center sticky left-0 bg-[#F5F0E8]">الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    <Megaphone className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                    لا يوجد معلنون مطابقون
                  </td>
                </tr>
              ) : (
                filtered.map((a, idx) => {
                  const adSt = adStatusFor(a.company_name);
                  const accSt = a.is_available === false
                    ? { label: "معلّق", cls: "bg-amber-100 text-amber-700 border-amber-200" }
                    : { label: ACCOUNT_LABEL[a.status] || a.status, cls: ACCOUNT_BADGE[a.status] || "bg-slate-100 text-slate-500" };
                  const myAds = adsByName[a.company_name] || [];
                  const refAd = myAds.find((x) => x.is_active) || myAds[0] || {};
                  const value = a.campaign_value || a.subscription_value || 0;
                  const checked = bulk.isSelected(a.id);
                  return (
                    <tr key={a.id} className={`border-t border-slate-100 hover:bg-slate-50/60 ${idx % 2 ? "bg-white" : "bg-slate-50/30"} ${checked ? "ring-1 ring-inset ring-[#C9A66B]/40" : ""}`}>
                      <td className="px-3 py-3 text-center">
                        <Checkbox checked={checked} onCheckedChange={() => bulk.toggle(a.id)} />
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2">
                          {a.logo_url && <img src={a.logo_url} alt="" className="w-8 h-8 rounded object-cover" />}
                          <span className="font-medium text-[#4A3F35]">{a.contact_name || a.company_name}</span>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-slate-600">{a.company_name}</td>
                      <td className="px-3 py-3 text-slate-600">{AD_TYPE_LABEL[a.ad_type] || a.ad_type || "—"}</td>
                      <td className="px-3 py-3">
                        <Badge variant="outline" className={accSt.cls}>{accSt.label}</Badge>
                        {a.is_verified && (
                          <Badge variant="outline" className="bg-[#C9A66B]/10 text-[#C9A66B] border-[#C9A66B]/20 mr-1">موثّق</Badge>
                        )}
                      </td>
                      <td className="px-3 py-3"><Badge variant="outline" className={adSt.cls}>{adSt.label}</Badge></td>
                      <td className="px-3 py-3 text-slate-500 whitespace-nowrap">{fmtDate(refAd.start_date)}</td>
                      <td className="px-3 py-3 text-slate-500 whitespace-nowrap">{fmtDate(refAd.end_date)}</td>
                      <td className="px-3 py-3 font-semibold text-[#4A3F35] whitespace-nowrap">{fmtMoney(value)}</td>
                      <td className="px-3 py-3 text-center sticky left-0 bg-inherit">
                        <ProviderActionsMenu
                          provider={a}
                          providerKey="Advertiser"
                          nameField="company_name"
                          isAdmin={isAdmin}
                          mode="advertiser"
                          onUpdate={onUpdate}
                          onDelete={onDelete}
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <p className="text-center text-xs text-slate-400 mt-4">
        عرض {filtered.length} من {advertisers.length} معلن
      </p>
    </div>
  );
}