import React, { useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Search, Plus, KeyRound, Link2, CheckCircle2, RefreshCw, Loader2 } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

// All connectors supported by the platform
const AVAILABLE_CONNECTORS = [
  { type: "googlecalendar", name: "Google Calendar", icon: "📅", kind: "connector" },
  { type: "gmail", name: "Gmail", icon: "✉️", kind: "connector" },
  { type: "googledrive", name: "Google Drive", icon: "📁", kind: "connector" },
  { type: "googlesheets", name: "Google Sheets", icon: "📈", kind: "connector" },
  { type: "googlemeet", name: "Google Meet", icon: "🎥", kind: "connector" },
  { type: "google_analytics", name: "Google Analytics", icon: "📊", kind: "connector" },
  { type: "instagram", name: "Instagram", icon: "📸", kind: "connector" },
  { type: "tiktok", name: "TikTok", icon: "🎵", kind: "connector" },
  { type: "linkedin", name: "LinkedIn", icon: "💼", kind: "connector" },
  { type: "slack", name: "Slack", icon: "💬", kind: "connector" },
  { type: "notion", name: "Notion", icon: "📝", kind: "connector" },
  { type: "github", name: "GitHub", icon: "🐙", kind: "connector" },
  { type: "jira", name: "Jira", icon: "🎯", kind: "connector" },
  { type: "asana", name: "Asana", icon: "✅", kind: "connector" },
  { type: "hubspot", name: "HubSpot", icon: "🟠", kind: "connector" },
  { type: "salesforce", name: "Salesforce", icon: "☁️", kind: "connector" },
  { type: "airtable", name: "Airtable", icon: "🗂️", kind: "connector" },
  { type: "discord", name: "Discord", icon: "🎮", kind: "connector" },
  { type: "outlook", name: "Outlook", icon: "📬", kind: "connector" },
  { type: "dropbox", name: "Dropbox", icon: "📦", kind: "connector" },
  { type: "linear", name: "Linear", icon: "📐", kind: "connector" },
  { type: "clickup", name: "ClickUp", icon: "👆", kind: "connector" },
  { type: "stripe", name: "Stripe (API Key)", icon: "💳", kind: "secret" },
  { type: "square", name: "Square (OAuth)", icon: "🔷", kind: "connector" },
];

export default function AddIntegrationDialog({ open, onOpenChange, connectedTypes = [], onRefresh }) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const filtered = AVAILABLE_CONNECTORS.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.type.toLowerCase().includes(search.toLowerCase())
  );

  const isConnected = (type) => connectedTypes.includes(type);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await onRefresh?.();
      toast({ title: "✅ تم تحديث حالة التكاملات" });
    } catch (e) {
      toast({ title: "تعذر التحديث", variant: "destructive" });
    } finally {
      setRefreshing(false);
    }
  };

  const handleOpenChange = (val) => {
    if (!val) {
      setSelected(null);
      setSearch("");
    }
    onOpenChange(val);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5 text-[#C9A66B]" />
            إضافة تكامل جديد
          </DialogTitle>
          <DialogDescription className="text-sm text-slate-600">
            اختر الخدمة التي تريد ربطها بالتطبيق. يتم ربط خدمات OAuth من خلال منصة Base44.
          </DialogDescription>
        </DialogHeader>

        {!selected ? (
          <>
            {/* Search + Refresh */}
            <div className="flex items-center gap-2 mb-3">
              <div className="relative flex-1">
                <Search className="absolute top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 right-3" />
                <Input
                  placeholder="ابحث عن خدمة..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pr-10"
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={refreshing || !onRefresh}
                className="h-9 shrink-0"
                title="حدث القائمة بعد ربط خدمة جديدة"
              >
                {refreshing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                تحديث
              </Button>
            </div>

            {/* Grid of available connectors */}
            <div className="overflow-y-auto flex-1 -mx-1 px-1">
              {filtered.length === 0 ? (
                <div className="text-center py-8 text-sm text-slate-500">
                  لا توجد خدمات مطابقة لبحثك.
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {filtered.map((c) => {
                    const connected = isConnected(c.type);
                    return (
                      <button
                        key={c.type}
                        onClick={() => setSelected(c)}
                        className={`flex items-center gap-2 p-3 rounded-lg border transition-colors text-right ${
                          connected
                            ? "border-green-200 bg-green-50/50"
                            : "border-slate-200 hover:border-[#C9A66B] hover:bg-[#FEF9EE]"
                        }`}
                      >
                        <span className="text-xl shrink-0">{c.icon}</span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-[#4A3F35] truncate">{c.name}</p>
                          <p className="text-[10px] text-slate-400 flex items-center gap-1">
                            {c.kind === "connector" ? (
                              <><Link2 className="w-2.5 h-2.5" /> OAuth</>
                            ) : (
                              <><KeyRound className="w-2.5 h-2.5" /> API Key</>
                            )}
                          </p>
                        </div>
                        {connected && (
                          <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        ) : (
          /* Selected service detail */
          <div className="flex-1 overflow-y-auto">
            <div className="flex items-center gap-3 mb-4 p-4 rounded-lg bg-[#FEF9EE] border border-[#C9A66B]/20">
              <span className="text-3xl">{selected.icon}</span>
              <div className="flex-1">
                <p className="font-semibold text-[#4A3F35]">{selected.name}</p>
                <p className="text-xs text-slate-500">
                  {selected.kind === "connector" ? "ربط عبر OAuth" : "ربط عبر مفتاح API"}
                </p>
              </div>
              {isConnected(selected.type) && (
                <Badge className="bg-green-100 text-green-700 shrink-0">
                  <CheckCircle2 className="w-3 h-3 ml-1" />
                  متصل
                </Badge>
              )}
            </div>

            {selected.kind === "connector" ? (
              <div className="space-y-3 text-sm text-slate-600">
                <p className="font-medium text-slate-700">خطوات الربط:</p>
                <ol className="list-decimal list-inside space-y-1.5">
                  <li>انتقل إلى لوحة تحكم Base44</li>
                  <li>افتح تبويب Integrations</li>
                  <li>ابحث عن "{selected.name}" واضغط Connect</li>
                  <li>أكمل عملية المصادقة عبر OAuth</li>
                  <li>عُد إلى هذه الصفحة واضغط "تحديث"</li>
                </ol>
                <div className="flex gap-2 mt-2">
                  <Button
                    className="flex-1 bg-gradient-to-r from-[#6B5D4F] to-[#C9A66B] text-white hover:opacity-90"
                    onClick={() => window.open("https://app.base44.com", "_blank", "noopener,noreferrer")}
                  >
                    <ExternalLink className="w-4 h-4" />
                    فتح لوحة Base44
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleRefresh}
                    disabled={refreshing || !onRefresh}
                  >
                    {refreshing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                    تحديث الحالة
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3 text-sm text-slate-600">
                <p className="font-medium text-slate-700">خطوات الربط:</p>
                <ol className="list-decimal list-inside space-y-1.5">
                  <li>انتقل إلى إعدادات التطبيق ثم Secrets</li>
                  <li>أضف المفتاح المطلوب (مثل STRIPE_SECRET_KEY)</li>
                  <li>احفظ التغييرات</li>
                  <li>عُد إلى هذه الصفحة واضغط "تحديث الحالة"</li>
                </ol>
                <Button
                  className="w-full bg-gradient-to-r from-[#6B5D4F] to-[#C9A66B] text-white hover:opacity-90 mt-2"
                  onClick={() => window.open("https://app.base44.com/app/" , "_blank", "noopener,noreferrer")}
                >
                  <ExternalLink className="w-4 h-4" />
                  فتح إعدادات Base44
                </Button>
              </div>
            )}

            <Button
              variant="outline"
              className="w-full mt-4"
              onClick={() => setSelected(null)}
            >
              رجوع للقائمة
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}