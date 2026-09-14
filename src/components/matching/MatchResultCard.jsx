import React, { useState } from "react";
import { motion } from "framer-motion";
import { Star, MapPin, CheckCircle, ChevronDown, ChevronUp, MessageSquare, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link } from "react-router-dom";

function MatchBar({ percentage }) {
  const color =
    percentage >= 80 ? "#22c55e" :
    percentage >= 60 ? "#C9A66B" :
    percentage >= 40 ? "#f59e0b" : "#ef4444";

  return (
    <div className="relative">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-slate-500">نسبة التوافق</span>
        <span className="text-lg font-black" style={{ color }}>{percentage}%</span>
      </div>
      <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="h-full rounded-full"
          style={{ background: `linear-gradient(90deg, ${color}88, ${color})` }}
        />
      </div>
    </div>
  );
}

function BreakdownRow({ item }) {
  const pct = item.max > 0 ? Math.round((item.score / item.max) * 100) : 0;
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="text-slate-500 w-28 text-right shrink-0">{item.label}</span>
      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full bg-[#C9A66B]/70"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-slate-600 font-medium w-10 text-left">{item.score}/{item.max}</span>
    </div>
  );
}

export default function MatchResultCard({ engineer, index }) {
  const [showBreakdown, setShowBreakdown] = useState(false);
  const pct = engineer.match_percentage;

  const badgeColor =
    pct >= 80 ? "bg-green-100 text-green-700 border-green-200" :
    pct >= 60 ? "bg-amber-100 text-amber-700 border-amber-200" :
    "bg-slate-100 text-slate-600 border-slate-200";

  const rankLabel =
    index === 0 ? "🥇 الأنسب" :
    index === 1 ? "🥈 الثاني" :
    index === 2 ? "🥉 الثالث" : null;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.08 }}
      className="bg-white rounded-2xl shadow-md hover:shadow-lg transition-all border border-slate-100 overflow-hidden"
    >
      <div className="p-5">
        <div className="flex gap-4">
          {/* Avatar + rank */}
          <div className="relative shrink-0">
            <Avatar className="w-16 h-16 border-2 border-[#C9A66B]/30">
              <AvatarImage src={engineer.profile_image} />
              <AvatarFallback className="bg-gradient-to-br from-[#1a1a2e] to-[#C9A66B] text-white text-xl font-bold">
                {engineer.full_name?.charAt(0)}
              </AvatarFallback>
            </Avatar>
            {rankLabel && (
              <div className="absolute -top-2 -right-2 text-sm leading-none">
                {rankLabel.split(" ")[0]}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-[#1a1a2e] text-base leading-tight">{engineer.full_name}</h3>
              {engineer.is_verified && <CheckCircle className="w-4 h-4 text-blue-500 shrink-0" />}
              {rankLabel && (
                <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${badgeColor}`}>
                  {rankLabel}
                </span>
              )}
            </div>
            <p className="text-sm text-slate-500 mt-0.5 truncate">{engineer.specialization}</p>
            <div className="flex flex-wrap gap-3 mt-1.5 text-xs text-slate-400">
              {engineer.city && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {engineer.city}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                {engineer.rating?.toFixed(1) || "0.0"} ({engineer.total_reviews || 0})
              </span>
              {engineer.years_experience > 0 && (
                <span>{engineer.years_experience} سنة خبرة</span>
              )}
            </div>
          </div>
        </div>

        {/* Match bar */}
        <div className="mt-4">
          <MatchBar percentage={pct} />
        </div>

        {/* Breakdown toggle */}
        <button
          onClick={() => setShowBreakdown(v => !v)}
          className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 mt-2 transition-colors"
        >
          {showBreakdown ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          تفاصيل نسبة التوافق
        </button>

        {showBreakdown && engineer.match_breakdown && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="mt-3 space-y-1.5 border-t border-slate-50 pt-3"
          >
            {engineer.match_breakdown.map((item, i) => (
              <BreakdownRow key={i} item={item} />
            ))}
          </motion.div>
        )}

        {/* Actions */}
        <div className="flex gap-2 mt-4">
          <Link to={`/EngineerProfile?id=${engineer.id}`} className="flex-1">
            <Button size="sm" variant="outline" className="w-full border-[#C9A66B] text-[#6B5D4F] hover:bg-amber-50">
              <User className="w-3.5 h-3.5 ml-1" />
              عرض الملف
            </Button>
          </Link>
          <Link to={`/RequestQuote?engineer_id=${engineer.id}`} className="flex-1">
            <Button size="sm" className="w-full bg-gradient-to-r from-[#6B5D4F] to-[#C9A66B] text-white hover:opacity-90">
              <MessageSquare className="w-3.5 h-3.5 ml-1" />
              طلب عرض سعر
            </Button>
          </Link>
        </div>
      </div>
    </motion.div>
  );
}