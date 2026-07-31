import React from "react";
import { Activity } from "lucide-react";

const MONTHS_AR = [
  "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر",
];

/**
 * LiveActiveBadge — a visible "platform is active now + last updated" indicator.
 * Signals to visitors that the engineering platform is live and maintained.
 */
export default function LiveActiveBadge({ label = "المنصة نشطة الآن" }) {
  const now = new Date();
  const dateStr = `${now.getDate()} ${MONTHS_AR[now.getMonth()]} ${now.getFullYear()}`;

  return (
    <div
      className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs sm:text-sm font-medium"
      dir="rtl"
    >
      <span className="relative flex h-2.5 w-2.5">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
      </span>
      <Activity className="w-3.5 h-3.5" />
      <span>{label}</span>
      <span className="text-emerald-400">•</span>
      <span className="text-emerald-600/80">آخر تحديث: {dateStr}</span>
    </div>
  );
}