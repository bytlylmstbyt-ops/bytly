import React, { useState, useEffect, useMemo, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Building2, Briefcase, Scale, HardHat, Package, Loader2, Search,
  CheckCircle2, XCircle, Clock, RefreshCw, Users, MapPin, Star
} from "lucide-react";
import { motion } from "framer-motion";
import ProviderActionsMenu from "@/components/admin/ProviderActionsMenu";
import AdvertisersPanel from "@/components/admin/AdvertisersPanel";
import { Megaphone } from "lucide-react";

const PROVIDERS = [
  { key: "EngineeringFirm", label: "الشركات الهندسية", icon: Building2, nameField: "company_name", subField: "specializations" },
  { key: "ConsultingFirm", label: "الشركات الاستشارية", icon: Briefcase, nameField: "company_name", subField: "specializations" },
  { key: "Consultant", label: "الاستشاريون", icon: Scale, nameField: "full_name", subField: "consultant_type" },
  { key: "Contractor", label: "المقاولون", icon: HardHat, nameField: "company_name", subField: "specialization" },
  { key: "Supplier", label: "الموردون", icon: Package, nameField: "company_name", subField: "specialization" },
];

const STATUS_BADGE = {
  approved: "bg-green-100 text-green-700 border-green-200",
  pending: "bg-amber-100 text-amber-700 border-amber-200",
  rejected: "bg-red-100 text-red-700 border-red-200",
};
const STATUS_LABEL = { approved: "معتمد", pending: "معلق", rejected: "مرفوض" };

export default function AdminProviders() {
  const [activeKey, setActiveKey] = useState(PROVIDERS[0].key);
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    base44.auth.me().then((u) => setIsAdmin(u?.role === "admin")).catch(() => {});
  }, []);

  const loadAll = useCallback(async () => {
    setRefreshing(true);
    try {
      const results = await Promise.all(
        PROVIDERS.map(p => base44.entities[p.key].list("-created_date", 500).catch(() => []))
      );
      const map = {};
      PROVIDERS.forEach((p, i) => { map[p.key] = results[i]; });
      setData(map);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  const activeProvider = PROVIDERS.find(p => p.key === activeKey);
  const activeList = data[activeKey] || [];

  const filtered = useMemo(() => {
    return activeList.filter(item => {
      const name = item[activeProvider.nameField] || "";
      const matchSearch = !search || name.toLowerCase().includes(search.toLowerCase()) ||
        (item.email || "").toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === "all" || item.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [activeList, search, statusFilter, activeProvider]);

  const stats = useMemo(() => {
    const list = data[activeKey] || [];
    return {
      total: list.length,
      approved: list.filter(x => x.status === "approved").length,
      pending: list.filter(x => x.status === "pending").length,
      rejected: list.filter(x => x.status === "rejected").length,
      verified: list.filter(x => x.is_verified).length,
    };
  }, [data, activeKey]);

  const statCards = [
    { label: "الإجمالي", value: stats.total, icon: Users, color: "text-[#4A3F35]", bg: "bg-[#F5F0E8]" },
    { label: "معتمد", value: stats.approved, icon: CheckCircle2, color: "text-green-600", bg: "bg-green-50" },
    { label: "معلق", value: stats.pending, icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
    { label: "مرفوض", value: stats.rejected, icon: XCircle, color: "text-red-600", bg: "bg-red-50" },
    { label: "موثّق", value: stats.verified, icon: Star, color: "text-[#C9A66B]", bg: "bg-[#FEF9EE]" },
  ];

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#C9A66B] animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10" dir="rtl">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#6B5D4F] to-[#C9A66B] flex items-center justify-center">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#4A3F35]">لوحة مقدمي الخدمة</h1>
              <p className="text-sm text-slate-500">إدارة الشركات الهندسية والاستشارية والاستشاريين والمقاولين والموردين</p>
            </div>
          </div>
          <Button variant="outline" onClick={loadAll} disabled={refreshing}>
            <RefreshCw className={`w-4 h-4 ml-2 ${refreshing ? "animate-spin" : ""}`} />
            تحديث
          </Button>
        </div>
      </motion.div>

      {/* Provider type tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-5">
        {PROVIDERS.map(p => {
          const Icon = p.icon;
          const count = (data[p.key] || []).length;
          const isActive = p.key === activeKey;
          return (
            <button
              key={p.key}
              onClick={() => { setActiveKey(p.key); setSearch(""); setStatusFilter("all"); }}
              className={`flex items-center gap-2 shrink-0 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? "bg-[#4A3F35] text-white shadow-sm"
                  : "bg-white text-[#4A3F35] border border-slate-200 hover:border-[#C9A66B]/40"
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? "text-[#C9A66B]" : "text-[#C9A66B]"}`} />
              {p.label}
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${isActive ? "bg-white/20" : "bg-slate-100"}`}>{count}</span>
            </button>
          );
        })}
        <button
          onClick={() => { setActiveKey("Advertiser"); setSearch(""); setStatusFilter("all"); }}
          className={`flex items-center gap-2 shrink-0 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
            activeKey === "Advertiser"
              ? "bg-[#4A3F35] text-white shadow-sm"
              : "bg-white text-[#4A3F35] border border-slate-200 hover:border-[#C9A66B]/40"
          }`}
        >
          <Megaphone className="w-4 h-4 text-[#C9A66B]" />
          المعلنون
        </button>
      </div>

      {activeKey !== "Advertiser" && (
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
      )}

      {/* Filters */}
      {activeKey !== "Advertiser" && (
      <Card className="mb-4 border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="ابحث بالاسم أو البريد..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pr-10"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:border-[#C9A66B] cursor-pointer"
            >
              <option value="all">كل الحالات</option>
              <option value="approved">معتمد</option>
              <option value="pending">معلق</option>
              <option value="rejected">مرفوض</option>
            </select>
          </div>
        </CardContent>
      </Card>
      )}

      {activeKey === "Advertiser" ? (
        <AdvertisersPanel isAdmin={isAdmin} />
      ) : (
      <div className="space-y-3">
...
      </div>
      )}

      <p className="text-center text-xs text-slate-400 mt-6">
        عرض {filtered.length} من {activeList.length} سجل
      </p>
    </div>
  );
}