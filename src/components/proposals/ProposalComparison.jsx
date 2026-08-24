import React, { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion, AnimatePresence } from "framer-motion";
import {
  Star, Clock, DollarSign, Award, Briefcase, MessageSquare,
  CheckCircle, X, GitCompare, ChevronDown, ChevronUp, TrendingUp,
  Shield, Zap, ArrowUpDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const StarRating = ({ value, max = 5, size = "sm" }) => {
  const filled = Math.round(value || 0);
  const cls = size === "sm" ? "w-3.5 h-3.5" : "w-4 h-4";
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: max }).map((_, i) => (
        <Star
          key={i}
          className={`${cls} ${i < filled ? "fill-amber-400 text-amber-400" : "text-slate-200"}`}
        />
      ))}
    </div>
  );
};

const ScoreBar = ({ value, max = 5, color = "amber" }) => {
  const pct = Math.min(100, ((value || 0) / max) * 100);
  const colors = {
    amber: "bg-amber-400",
    green: "bg-green-500",
    blue: "bg-blue-500",
    purple: "bg-purple-500",
  };
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className={`h-full rounded-full ${colors[color]}`}
        />
      </div>
      <span className="text-xs font-semibold text-slate-600 w-6 text-left">{value?.toFixed(1) || "–"}</span>
    </div>
  );
};

const BEST_LABELS = {
  price: { best: "الأرخص", worst: "الأغلى" },
  delivery: { best: "الأسرع", worst: "الأبطأ" },
  rating: { best: "الأعلى تقييماً", worst: "" },
  experience: { best: "الأكثر خبرة", worst: "" },
};

export default function ProposalComparison({ proposals, engineers, projectBudgetMin, projectBudgetMax, onAccept, isClient, projectStatus }) {
  const [selectedIds, setSelectedIds] = useState([]);
  const [showComparison, setShowComparison] = useState(false);
  const [sortBy, setSortBy] = useState("price");

  if (!proposals || proposals.length < 2) return null;

  // Sort proposals
  const sorted = [...proposals].sort((a, b) => {
    if (sortBy === "price") return (a.price || 0) - (b.price || 0);
    if (sortBy === "delivery") return (a.delivery_days || 999) - (b.delivery_days || 999);
    if (sortBy === "rating") return ((engineers[b.engineer_id]?.rating) || 0) - ((engineers[a.engineer_id]?.rating) || 0);
    if (sortBy === "experience") return ((engineers[b.engineer_id]?.years_experience) || 0) - ((engineers[a.engineer_id]?.years_experience) || 0);
    return 0;
  });

  const toggleSelect = (id) => {
    setSelectedIds(prev =>
      prev.includes(id)
        ? prev.filter(x => x !== id)
        : prev.length < 3 ? [...prev, id] : prev
    );
  };

  const comparedProposals = selectedIds.length > 0
    ? proposals.filter(p => selectedIds.includes(p.id))
    : sorted.slice(0, Math.min(3, sorted.length));

  // Find bests
  const minPrice = Math.min(...comparedProposals.map(p => p.price || Infinity));
  const minDays = Math.min(...comparedProposals.map(p => p.delivery_days || Infinity));
  const maxRating = Math.max(...comparedProposals.map(p => engineers[p.engineer_id]?.rating || 0));
  const maxExp = Math.max(...comparedProposals.map(p => engineers[p.engineer_id]?.years_experience || 0));

  const getBestBadge = (proposal) => {
    const eng = engineers[proposal.engineer_id];
    const badges = [];
    if (proposal.price === minPrice) badges.push({ label: "الأرخص", color: "bg-green-100 text-green-700" });
    if (proposal.delivery_days === minDays) badges.push({ label: "الأسرع", color: "bg-blue-100 text-blue-700" });
    if (eng?.rating === maxRating && maxRating > 0) badges.push({ label: "الأعلى تقييماً", color: "bg-amber-100 text-amber-700" });
    if (eng?.years_experience === maxExp && maxExp > 0) badges.push({ label: "الأكثر خبرة", color: "bg-purple-100 text-purple-700" });
    return badges;
  };

  const rows = [
    { label: "السعر", icon: <DollarSign className="w-4 h-4 text-green-600" />, render: (p) => `${p.price?.toLocaleString()} ر.س`, highlight: (p) => p.price === minPrice },
    { label: "مدة التسليم", icon: <Clock className="w-4 h-4 text-blue-600" />, render: (p) => `${p.delivery_days} يوم`, highlight: (p) => p.delivery_days === minDays },
    { label: "التقييم العام", icon: <Star className="w-4 h-4 text-amber-500" />, render: (p) => {
      const r = engineers[p.engineer_id]?.rating || 0;
      return <StarRating value={r} size="md" />;
    }, highlight: (p) => (engineers[p.engineer_id]?.rating || 0) === maxRating },
    { label: "سنوات الخبرة", icon: <Briefcase className="w-4 h-4 text-purple-600" />, render: (p) => {
      const y = engineers[p.engineer_id]?.years_experience;
      return y ? `${y} سنة` : "–";
    }, highlight: (p) => (engineers[p.engineer_id]?.years_experience || 0) === maxExp },
    { label: "جودة العمل", icon: <Award className="w-4 h-4 text-rose-500" />, render: (p) => {
      const q = engineers[p.engineer_id]?.quality_avg || engineers[p.engineer_id]?.rating || 0;
      return <ScoreBar value={q} color="amber" />;
    }},
    { label: "التواصل", icon: <MessageSquare className="w-4 h-4 text-sky-500" />, render: (p) => {
      const c = engineers[p.engineer_id]?.communication_avg || engineers[p.engineer_id]?.rating || 0;
      return <ScoreBar value={c} color="blue" />;
    }},
    { label: "المشاريع المكتملة", icon: <CheckCircle className="w-4 h-4 text-teal-500" />, render: (p) => {
      const cp = engineers[p.engineer_id]?.completed_projects || 0;
      return `${cp} مشروع`;
    }},
    { label: "الحالة", icon: <Shield className="w-4 h-4 text-indigo-500" />, render: (p) => {
      const verified = engineers[p.engineer_id]?.is_verified;
      return verified
        ? <Badge className="bg-indigo-100 text-indigo-700 text-xs">موثق ✓</Badge>
        : <span className="text-xs text-slate-400">غير موثق</span>;
    }},
  ];

  return (
    <div className="mt-4">
      {/* Toggle Button */}
      <button
        onClick={() => setShowComparison(v => !v)}
        className="w-full flex items-center justify-between px-5 py-3.5 rounded-2xl border-2 border-dashed border-amber-300 bg-amber-50 hover:bg-amber-100 transition-all group"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#1a1a2e] to-[#C9A66B] flex items-center justify-center">
            <GitCompare className="w-5 h-5 text-white" />
          </div>
          <div className="text-right">
            <p className="font-bold text-[#1a1a2e] text-sm">مقارنة العروض جنباً إلى جنب</p>
            <p className="text-xs text-slate-500">قارن {Math.min(3, proposals.length)} عروض دفعة واحدة لاتخاذ قرار أفضل</p>
          </div>
        </div>
        {showComparison
          ? <ChevronUp className="w-5 h-5 text-amber-600" />
          : <ChevronDown className="w-5 h-5 text-amber-600" />}
      </button>

      <AnimatePresence>
        {showComparison && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="pt-4 space-y-4">
              {/* Controls */}
              <div className="flex flex-wrap items-center gap-3 bg-white rounded-xl p-3 shadow-sm border border-slate-100">
                <div className="flex items-center gap-2">
                  <ArrowUpDown className="w-4 h-4 text-slate-400" />
                  <span className="text-xs font-medium text-slate-600">ترتيب حسب:</span>
                </div>
                {[
                  { value: "price", label: "السعر" },
                  { value: "delivery", label: "الأسرع" },
                  { value: "rating", label: "التقييم" },
                  { value: "experience", label: "الخبرة" },
                ].map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setSortBy(opt.value)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                      sortBy === opt.value
                        ? "bg-gradient-to-r from-[#1a1a2e] to-[#C9A66B] text-white shadow"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
                {proposals.length > 3 && (
                  <span className="text-xs text-slate-400 mr-auto">
                    اختر حتى 3 عروض للمقارنة
                  </span>
                )}
              </div>

              {/* Selection chips (if > 3 proposals) */}
              {proposals.length > 3 && (
                <div className="flex flex-wrap gap-2">
                  {sorted.map(p => {
                    const eng = engineers[p.engineer_id];
                    const sel = selectedIds.includes(p.id);
                    return (
                      <button
                        key={p.id}
                        onClick={() => toggleSelect(p.id)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium transition-all ${
                          sel
                            ? "border-[#C9A66B] bg-amber-50 text-[#1a1a2e]"
                            : "border-slate-200 bg-white text-slate-500 hover:border-amber-300"
                        }`}
                      >
                        <Avatar className="w-5 h-5">
                          <AvatarImage src={eng?.profile_image} />
                          <AvatarFallback className="text-[8px] bg-slate-200">{eng?.full_name?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        {eng?.full_name?.split(" ")[0]}
                        {sel && <X className="w-3 h-3" />}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Comparison Table */}
              <div className="overflow-x-auto rounded-2xl border border-slate-100 shadow-sm bg-white">
                <table className="w-full" dir="rtl">
                  <thead>
                    <tr className="border-b border-slate-100 bg-gradient-to-l from-slate-50 to-amber-50/30">
                      <th className="p-4 text-right text-xs font-semibold text-slate-500 w-32">المعيار</th>
                      {comparedProposals.map((proposal, idx) => {
                        const eng = engineers[proposal.engineer_id];
                        const bestBadges = getBestBadge(proposal);
                        return (
                          <th key={proposal.id} className="p-4 text-center min-w-[160px]">
                            <div className="flex flex-col items-center gap-2">
                              <div className="relative">
                                <Avatar className="w-14 h-14 ring-2 ring-amber-200">
                                  <AvatarImage src={eng?.profile_image} />
                                  <AvatarFallback className="bg-gradient-to-br from-[#1a1a2e] to-[#C9A66B] text-white font-bold">
                                    {eng?.full_name?.charAt(0)}
                                  </AvatarFallback>
                                </Avatar>
                                {idx === 0 && sortBy === "price" && (
                                  <span className="absolute -top-1 -left-1 w-5 h-5 bg-green-500 rounded-full text-white text-[9px] flex items-center justify-center font-bold">1</span>
                                )}
                              </div>
                              <div>
                                <Link
                                  to={createPageUrl("EngineerProfile") + `?id=${proposal.engineer_id}`}
                                  className="text-sm font-bold text-[#1a1a2e] hover:text-[#C9A66B] transition-colors line-clamp-1"
                                >
                                  {eng?.full_name}
                                </Link>
                                <p className="text-xs text-slate-400 mt-0.5">{eng?.specialization || eng?.user_type}</p>
                              </div>
                              {/* Best badges */}
                              <div className="flex flex-wrap gap-1 justify-center">
                                {bestBadges.slice(0, 2).map(b => (
                                  <span key={b.label} className={`text-[9px] px-1.5 py-0.5 rounded-full font-semibold ${b.color}`}>
                                    {b.label}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, ri) => (
                      <tr key={ri} className={`border-b border-slate-50 ${ri % 2 === 0 ? "bg-white" : "bg-slate-50/50"}`}>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            {row.icon}
                            <span className="text-xs font-medium text-slate-600">{row.label}</span>
                          </div>
                        </td>
                        {comparedProposals.map(proposal => {
                          const isHighlight = row.highlight?.(proposal);
                          return (
                            <td key={proposal.id} className={`p-4 text-center ${isHighlight ? "bg-green-50/60" : ""}`}>
                              <div className={`text-sm font-semibold ${isHighlight ? "text-green-700" : "text-slate-700"}`}>
                                {row.render(proposal)}
                                {isHighlight && (
                                  <div className="flex justify-center mt-1">
                                    <Zap className="w-3.5 h-3.5 text-green-500" />
                                  </div>
                                )}
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    ))}

                    {/* Cover Letter row */}
                    <tr className="border-b border-slate-50 bg-white">
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-orange-500" />
                          <span className="text-xs font-medium text-slate-600">رسالة العرض</span>
                        </div>
                      </td>
                      {comparedProposals.map(proposal => (
                        <td key={proposal.id} className="p-4 text-center">
                          {proposal.cover_letter ? (
                            <p className="text-xs text-slate-500 line-clamp-3 text-right leading-relaxed">
                              {proposal.cover_letter}
                            </p>
                          ) : (
                            <span className="text-xs text-slate-300">–</span>
                          )}
                        </td>
                      ))}
                    </tr>

                    {/* Action row */}
                    {isClient && projectStatus === "open" && (
                      <tr className="bg-gradient-to-l from-slate-50 to-amber-50/20">
                        <td className="p-4">
                          <span className="text-xs font-semibold text-slate-600">الإجراء</span>
                        </td>
                        {comparedProposals.map(proposal => (
                          <td key={proposal.id} className="p-4 text-center">
                            {proposal.status === "accepted" ? (
                              <Badge className="bg-green-100 text-green-700 gap-1">
                                <CheckCircle className="w-3 h-3" /> مقبول
                              </Badge>
                            ) : proposal.status === "pending" ? (
                              <div className="flex flex-col gap-2 items-center">
                                <Button
                                  size="sm"
                                  onClick={() => onAccept(proposal)}
                                  className="bg-gradient-to-r from-green-600 to-green-700 hover:opacity-90 text-white w-full text-xs"
                                >
                                  <CheckCircle className="w-3.5 h-3.5 ml-1" />
                                  قبول العرض
                                </Button>
                                <Link
                                  to={createPageUrl("Messages") + `?engineer=${proposal.engineer_id}`}
                                  className="w-full"
                                >
                                  <Button variant="outline" size="sm" className="w-full text-xs">
                                    <MessageSquare className="w-3.5 h-3.5 ml-1" />
                                    تواصل
                                  </Button>
                                </Link>
                              </div>
                            ) : (
                              <Badge className="bg-red-100 text-red-700 text-xs">مرفوض</Badge>
                            )}
                          </td>
                        ))}
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Budget Indicator */}
              {(projectBudgetMin || projectBudgetMax) && (
                <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 flex flex-wrap items-center gap-3 text-sm">
                  <DollarSign className="w-4 h-4 text-blue-500 flex-shrink-0" />
                  <span className="text-blue-700 font-medium">ميزانية المشروع:</span>
                  <span className="text-blue-600">
                    {projectBudgetMin?.toLocaleString()} – {projectBudgetMax?.toLocaleString()} ر.س
                  </span>
                  <span className="text-blue-400 text-xs mr-auto">
                    {comparedProposals.filter(p => p.price >= (projectBudgetMin || 0) && p.price <= (projectBudgetMax || Infinity)).length} عروض ضمن الميزانية
                  </span>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}