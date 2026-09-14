import React, { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import {
  Star, Clock, DollarSign, CheckCircle, Loader2,
  ArrowUp, ArrowDown, Search, TrendingDown, Zap, Award, Table2,
} from "lucide-react";

const STATUS_LABELS = { pending: "معلق", accepted: "مقبول", rejected: "مرفوض" };

export default function ProposalsCompareTable({ proposals, engineers, onAccept, acceptingId }) {
  const [sortKey, setSortKey] = useState("price");
  const [sortDir, setSortDir] = useState("asc");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const rows = useMemo(() => {
    const q = search.toLowerCase();
    let list = proposals.filter((p) => {
      const name = (engineers[p.engineer_id]?.full_name || "").toLowerCase();
      const ms = !q || name.includes(q);
      const mst = statusFilter === "all" ? true : p.status === statusFilter;
      return ms && mst;
    });
    const val = (p) => {
      if (sortKey === "price") return p.price || 0;
      if (sortKey === "delivery") return p.delivery_days || 0;
      if (sortKey === "rating") return engineers[p.engineer_id]?.rating || 0;
      return 0;
    };
    return [...list].sort((a, b) => (sortDir === "asc" ? val(a) - val(b) : val(b) - val(a)));
  }, [proposals, engineers, search, statusFilter, sortKey, sortDir]);

  const stats = useMemo(() => ({
    minPrice: Math.min(...proposals.map((p) => p.price || 0)),
    minDays: Math.min(...proposals.map((p) => p.delivery_days || Infinity)),
    maxRating: Math.max(...proposals.map((p) => engineers[p.engineer_id]?.rating || 0)),
  }), [proposals, engineers]);

  const toggleSort = (key) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir(key === "rating" ? "desc" : "asc"); }
  };

  const quickSort = (key, dir) => { setSortKey(key); setSortDir(dir); };

  const SortHeader = ({ label, icon: Icon, k }) => (
    <th className="px-3 py-2.5 text-right">
      <button onClick={() => toggleSort(k)} className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-[#C9A66B]">
        {Icon && <Icon className="w-3.5 h-3.5" />}
        {label}
        {sortKey === k ? (sortDir === "asc" ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />) : null}
      </button>
    </th>
  );

  return (
    <div className="rounded-2xl border border-[#C9A66B]/30 bg-white shadow-sm overflow-hidden" dir="rtl">
      <div className="flex items-center gap-2 px-4 py-3 bg-gradient-to-l from-[#FEF9EE] to-white border-b border-[#C9A66B]/20">
        <Table2 className="w-5 h-5 text-[#C9A66B]" />
        <h3 className="font-bold text-[#1a1a2e]">جدول مقارنة العروض</h3>
        <Badge className="bg-amber-100 text-amber-700 text-xs mr-1">{proposals.length} عرض</Badge>
      </div>

      {/* Quick sort + filters */}
      <div className="px-4 py-3 flex items-center gap-2 flex-wrap border-b border-slate-100">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input placeholder="ابحث باسم مقدم الخدمة..." value={search} onChange={(e) => setSearch(e.target.value)} className="pr-10" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white cursor-pointer">
          <option value="all">كل الحالات</option>
          <option value="pending">معلق</option>
          <option value="accepted">مقبول</option>
          <option value="rejected">مرفوض</option>
        </select>
      </div>

      <div className="px-4 py-2 flex items-center gap-2 flex-wrap bg-slate-50/60 border-b border-slate-100">
        <span className="text-xs text-slate-400">ترتيب سريع:</span>
        {[
          { key: "price", dir: "asc", label: "أقل سعر", icon: TrendingDown },
          { key: "price", dir: "desc", label: "أعلى سعر", icon: DollarSign },
          { key: "delivery", dir: "asc", label: "أسرع مدة", icon: Zap },
          { key: "rating", dir: "desc", label: "أعلى تقييم", icon: Star },
        ].map((opt) => {
          const active = sortKey === opt.key && sortDir === opt.dir;
          const Ic = opt.icon;
          return (
            <button key={opt.label} onClick={() => quickSort(opt.key, opt.dir)}
              className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${active ? "bg-[#C9A66B] text-white" : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"}`}>
              <Ic className="w-3.5 h-3.5" /> {opt.label}
            </button>
          );
        })}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-3 py-2.5 text-right text-xs font-semibold text-slate-600">مقدم الخدمة</th>
              <SortHeader label="السعر" icon={DollarSign} k="price" />
              <SortHeader label="مدة التنفيذ" icon={Clock} k="delivery" />
              <SortHeader label="التقييم" icon={Star} k="rating" />
              <th className="px-3 py-2.5 text-right text-xs font-semibold text-slate-600">الحالة</th>
              <th className="px-3 py-2.5 text-right text-xs font-semibold text-slate-600">تفاصيل العرض</th>
              <th className="px-3 py-2.5 text-right text-xs font-semibold text-slate-600">إجراء</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => {
              const eng = engineers[p.engineer_id];
              const bestPrice = (p.price || 0) === stats.minPrice;
              const bestDays = (p.delivery_days || 0) === stats.minDays;
              const bestRating = (eng?.rating || 0) === stats.maxRating && stats.maxRating > 0;
              return (
                <tr key={p.id} className="border-t border-slate-100 hover:bg-amber-50/40 align-top">
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      <Avatar className="w-9 h-9 shrink-0">
                        <AvatarImage src={eng?.profile_image} />
                        <AvatarFallback className="bg-gradient-to-br from-[#6B5D4F] to-[#C9A66B] text-white text-xs">{eng?.full_name?.charAt(0) || "م"}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="font-semibold text-[#1a1a2e] truncate">{eng?.full_name || "مهندس"}</p>
                        <p className="text-xs text-slate-400 truncate">{eng?.specialization}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-[#1a1a2e]">{(p.price || 0).toLocaleString()} ر.س</span>
                      {bestPrice && <Badge className="bg-green-100 text-green-700 text-[10px]">أقل سعر</Badge>}
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-[#1a1a2e]">{p.delivery_days || "—"}</span>
                      <span className="text-xs text-slate-400">يوم</span>
                      {bestDays && <Badge className="bg-blue-100 text-blue-700 text-[10px]">أسرع</Badge>}
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-1.5">
                      <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                      <span className="font-bold text-[#1a1a2e]">{eng?.rating?.toFixed(1) || "—"}</span>
                      {bestRating && <Badge className="bg-amber-100 text-amber-700 text-[10px]">أعلى تقييم</Badge>}
                    </div>
                  </td>
                  <td className="px-3 py-3"><Badge variant="outline">{STATUS_LABELS[p.status] || p.status}</Badge></td>
                  <td className="px-3 py-3 max-w-[260px]">
                    <p className="text-xs text-slate-600 bg-slate-50 rounded-lg p-2 leading-relaxed line-clamp-3">{p.cover_letter || "—"}</p>
                  </td>
                  <td className="px-3 py-3">
                    {p.status !== "accepted" && onAccept ? (
                      <Button size="sm" className="bg-gradient-to-r from-[#6B5D4F] to-[#C9A66B] text-white" disabled={acceptingId === p.id} onClick={() => onAccept(p.id)}>
                        {acceptingId === p.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4 ml-1" />}
                        اعتماد
                      </Button>
                    ) : (
                      <Badge className="bg-green-100 text-green-700 text-[10px]">معتمد</Badge>
                    )}
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr><td colSpan={7} className="text-center py-8 text-slate-400 text-sm">لا توجد عروض مطابقة للبحث/الفلتر</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="px-4 py-2 text-xs text-slate-400 flex items-center gap-1.5">
        <Award className="w-3.5 h-3.5 text-[#C9A66B]" />
        القيم الأفضل مُميّزة تلقائياً (أقل سعر / أسرع تنفيذ / أعلى تقييم) لتسهيل اتخاذ القرار.
      </p>
    </div>
  );
}