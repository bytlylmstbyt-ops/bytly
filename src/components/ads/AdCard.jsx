import React from "react";
import { motion } from "framer-motion";
import {
  CheckCircle, Eye, MousePointerClick, Shield, Pencil,
  Trash2, XCircle, Play
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

const CATEGORIES = [
  { value: "engineering", label: "هندسة" },
  { value: "contracting", label: "مقاولات" },
  { value: "decor", label: "ديكور" },
  { value: "building_materials", label: "مواد بناء" },
  { value: "furniture", label: "أثاث" },
  { value: "consulting_office", label: "مكتب استشاري" },
  { value: "concrete_supply", label: "توريد خرسانة" },
  { value: "electrical", label: "كهربائيات" },
  { value: "plumbing", label: "سباكة" },
  { value: "landscape", label: "تنسيق حدائق" },
];

export default function AdCard({ ad, onEdit, onDelete, onToggleActive, onToggleVerified }) {
  const categoryLabel = CATEGORIES.find(c => c.value === ad.category)?.label || ad.category;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border border-slate-100 overflow-hidden hover-lift group"
    >
      {/* Media Preview */}
      <div className="relative h-40 bg-slate-100 overflow-hidden">
        {ad.media_type === "video" && ad.video_url ? (
          <video src={ad.video_url} poster={ad.image_url} className="w-full h-full object-cover" muted loop autoPlay playsInline />
        ) : (
          <img src={ad.image_url} alt={ad.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        )}
        {/* Status badge */}
        <div className="absolute top-3 right-3 flex gap-1.5">
          <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold backdrop-blur-md ${
            ad.is_active ? "bg-green-500/90 text-white" : "bg-slate-600/80 text-white"
          }`}>
            {ad.is_active ? "نشط" : "متوقف"}
          </span>
          {(ad.media_type === "video" || ad.media_type === "gif") && (
            <span className="px-2 py-1 rounded-full text-[10px] font-semibold bg-black/60 text-white backdrop-blur-md">
              {ad.media_type === "video" ? <Play className="w-2.5 h-2.5 inline ml-0.5" /> : null}
              {ad.media_type === "video" ? "فيديو" : "GIF"}
            </span>
          )}
        </div>
        {/* Verified badge */}
        {ad.is_verified_advertiser && (
          <div className="absolute bottom-3 right-3 flex items-center gap-1 bg-blue-500/90 text-white text-[10px] font-semibold px-2.5 py-1 rounded-full backdrop-blur-md">
            <Shield className="w-3 h-3" />
            معلن معتمد
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 min-w-0">
            {ad.logo_url ? (
              <img src={ad.logo_url} alt="" className="w-7 h-7 rounded-full object-cover flex-shrink-0" />
            ) : null}
            <span className="font-semibold text-sm text-slate-800 truncate">{ad.advertiser_name}</span>
          </div>
          <span className="text-[10px] bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full border border-amber-200 flex-shrink-0">
            {categoryLabel}
          </span>
        </div>

        <p className="text-sm text-slate-700 font-medium mb-1 line-clamp-1">{ad.title}</p>
        {ad.description && (
          <p className="text-xs text-slate-500 line-clamp-2 mb-3">{ad.description}</p>
        )}

        {/* Metrics */}
        <div className="flex items-center gap-3 text-[11px] text-slate-400 mb-3">
          <span className="flex items-center gap-1">
            <Eye className="w-3.5 h-3.5" />
            {(ad.impressions || 0).toLocaleString('ar-SA')}
          </span>
          <span className="flex items-center gap-1">
            <MousePointerClick className="w-3.5 h-3.5" />
            {(ad.clicks || 0).toLocaleString('ar-SA')}
          </span>
          {ad.impressions > 0 && (
            <span className="text-amber-600 font-medium">
              {((ad.clicks / ad.impressions) * 100).toFixed(1)}%
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 pt-3 border-t border-slate-50">
          <button
            onClick={() => onToggleVerified(ad)}
            title={ad.is_verified_advertiser ? "إلغاء الاعتماد" : "اعتماد المعلن"}
            className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-medium transition-colors ${
              ad.is_verified_advertiser
                ? "bg-blue-50 text-blue-600 hover:bg-blue-100"
                : "bg-slate-50 text-slate-400 hover:bg-blue-50 hover:text-blue-500"
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            {ad.is_verified_advertiser ? "معتمد" : "اعتماد"}
          </button>
          <button
            onClick={() => onToggleActive(ad)}
            title={ad.is_active ? "إيقاف" : "تفعيل"}
            className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-medium transition-colors ${
              ad.is_active
                ? "bg-green-50 text-green-600 hover:bg-green-100"
                : "bg-slate-50 text-slate-400 hover:bg-green-50 hover:text-green-500"
            }`}
          >
            {ad.is_active ? <XCircle className="w-3.5 h-3.5" /> : <CheckCircle className="w-3.5 h-3.5" />}
            {ad.is_active ? "إيقاف" : "تفعيل"}
          </button>
          <button
            onClick={() => onEdit(ad)}
            className="p-2 rounded-lg bg-slate-50 text-slate-400 hover:bg-amber-50 hover:text-amber-600 transition-colors"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDelete(ad.id)}
            className="p-2 rounded-lg bg-slate-50 text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}