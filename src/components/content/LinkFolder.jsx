import React from "react";
import { Link } from "react-router-dom";
import { FolderOpen, ArrowLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/components/i18n/LanguageContext";

/**
 * LinkFolder — يعرض مجموعة روابط داخل "مجلد علوي" واضح
 * props:
 *  - icon: lucide icon component
 *  - title: اسم المجلد
 *  - subtitle: وصف قصير (اختياري)
 *  - items: [{ icon, title, desc, to, tag, read? }]
 */
export default function LinkFolder({ icon: Icon, title, subtitle, items }) {
  const { t } = useLanguage();
  return (
    <div className="mb-10">
      {/* Folder header */}
      <div className="flex items-center gap-3 mb-4 pb-3 border-b border-[#C9A66B]/20">
        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#6B5D4F] to-[#C9A66B] flex items-center justify-center shrink-0">
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-[#4A3F35]">{title}</h3>
            <Badge variant="outline" className="text-[10px] text-[#C9A66B] border-[#C9A66B]/30">
              {items.length} {t('common.items')}
            </Badge>
          </div>
          {subtitle && <p className="text-sm text-slate-500 truncate">{subtitle}</p>}
        </div>
        <FolderOpen className="w-5 h-5 text-[#C9A66B]/40 shrink-0" />
      </div>

      {/* Items grid */}
      <div className="grid sm:grid-cols-2 gap-4">
        {items.map((m, i) => (
          <Link key={i} to={m.to}>
            <Card className="h-full border-[#C9A66B]/20 hover:border-[#C9A66B] hover:shadow-lg transition-all hover-lift">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#C9A66B]/10 flex items-center justify-center shrink-0">
                    <m.icon className="w-5 h-5 text-[#6B5D4F]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <h4 className="font-semibold text-[#4A3F35] text-sm">{m.title}</h4>
                      {m.tag && (
                        <Badge variant="outline" className="text-[10px] text-[#C9A66B] border-[#C9A66B]/30 shrink-0">{m.tag}</Badge>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed mb-2">{m.desc}</p>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-100 pt-2">
                      {m.read ? <span>{m.read}</span> : <span />}
                      <span className="flex items-center gap-1 text-[#6B5D4F]">{t('common.open')} <ArrowLeft className="w-3 h-3" /></span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}