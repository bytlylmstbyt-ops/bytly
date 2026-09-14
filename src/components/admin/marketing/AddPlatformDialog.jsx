import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/components/i18n/LanguageContext";
import { Check } from "lucide-react";

export default function AddPlatformDialog({ open, onOpenChange, onAdd, availablePlatforms, existingIds }) {
  const { t, isRTL } = useLanguage();

  const filtered = availablePlatforms.filter(p => !existingIds.includes(p.id));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" dir={isRTL ? "rtl" : "ltr"}>
        <DialogHeader>
          <DialogTitle className="text-lg">{t("integrations.adminMarketing.addPlatform.title")}</DialogTitle>
          <p className="text-sm text-slate-500">{t("integrations.adminMarketing.addPlatform.subtitle")}</p>
        </DialogHeader>
        <div className="space-y-2">
          {filtered.length === 0 ? (
            <p className="text-center text-sm text-slate-400 py-8">{isRTL ? "جميع المنصات المتاحة مضافة بالفعل" : "All available platforms are already added"}</p>
          ) : (
            filtered.map(platform => {
              const Icon = platform.icon;
              return (
                <div key={platform.id} className="flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:border-slate-300 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: platform.color }}>
                      <Icon className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-[#4A3F35] text-sm">{platform.label}</p>
                      <p className="text-xs text-slate-400">{platform.type === "connector" ? "OAuth" : "API Key"}</p>
                    </div>
                  </div>
                  <Button size="sm" className="bg-gradient-to-r from-[#6B5D4F] to-[#C9A66B] text-white h-8 text-xs" onClick={() => onAdd(platform)}>
                    <Check className="w-3.5 h-3.5" />{t("integrations.adminMarketing.platform.connect")}
                  </Button>
                </div>
              );
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}