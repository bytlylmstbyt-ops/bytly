import React, { useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, KeyRound, Link2, CheckCircle2, RefreshCw, Loader2 } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { startIntegrationOAuth, isDirectOAuthSupported } from "@/lib/integrationOAuth";

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
  const [connecting, setConnecting] = useState(false);

  const filtered = AVAILABLE_CONNECTORS.filter(
    (c) => c.name.toLowerCase().includes(search.toLowerCase()) || c.type.toLowerCase().includes(search.toLowerCase())
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

  const handleConnect = async () => {
    if (!selected || !isDirectOAuthSupported(selected.type)) {
      toast({
        title: "الربط المباشر غير مهيأ لهذه الخدمة",
        description: "سنفعّل OAuth المباشر للخدمات التي لا يدعمها Supabase بعد.",
        variant: "destructive",
      });
      return;
    }

    setConnecting(true);
    try {
      await startIntegrationOAuth(selected.type);
    } catch (error) {
      toast({
        title: "تعذر بدء المصادقة",
        description: error?.message || "حدث خطأ أثناء بدء الربط.",
        variant: "destructive",
      });
      setConnecting(false);
    }
  };

  const handleOpenChange = (val) => {
    if (!val) {
      setSelected(null);
      setSearch("");
      setConnecting(false);
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
            اختر الخدمة التي تريد ربطها بالتطبيق. سيتم إكمال الربط من داخل Bytly عبر المصادقة الرسمية للخدمة، بدون الحاجة إلى مغادرة لوحة الإدارة.
          </DialogDescription>
        </DialogHeader>

        {!selected ? (
          <>
            <div className="flex items-center gap-2 mb-3">
              <div className="relative flex-1">
                <Search className="absolute top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 right-3" />
                <Input placeholder="ابحث عن خدمة..." value={search} onChange={(e) => setSearch(e.target.value)} className="pr-10" />
              </div>
              <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing || !onRefresh} className="h-9 shrink-0" title="حدث القائمة بعد ربط خدمة جديدة">
                {refreshing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                تحديث
              </Button>
            </div>

            <div className="overflow-y-auto flex-1 -mx-1 px-1">
              {filtered.length === 0 ? (
                <div className="text-center py-8 text-sm text-slate-500">لا توجد خدمات مطابقة لبحثك.</div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {filtered.map((c) => {
                    const connected = isConnected(c.type);
                    return (
                      <button key={c.type} onClick={() => setSelected(c)} className={`flex items-center gap-2 p-3 rounded-lg border transition-colors text-right ${connected ? "border-green-200 bg-green-50/50" : "border-slate-200 hover:border-[#C9A66B] hover:bg-[#FEF9EE]"}`}>
                        <span className="text-xl shrink-0">{c.icon}</span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-[#4A3F35] truncate">{c.name}</p>
                          <p className="text-[10px] text-slate-400 flex items-center gap-1">
                            {c.kind === "connector" ? <><Link2 className="w-2.5 h-2.5" /> OAuth</> : <><KeyRound className="w-2.5 h-2.5" /> API Key</>}
                          </p>
                        </div>
                        {connected && <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 overflow-y-auto">
            <div className="flex items-center gap-3 mb-4 p-4 rounded-lg bg-[#FEF9EE] border border-[#C9A66B]/20">
              <span className="text-3xl">{selected.icon}</span>
              <div className="flex-1">
                <p className="font-semibold text-[#4A3F35]">{selected.name}</p>
                <p className="text-xs text-slate-500">{selected.kind === "connector" ? "ربط عبر OAuth" : "ربط عبر مفتاح API"}</p>
              </div>
              {isConnected(selected.type) && <Badge className="bg-green-100 text-green-700 shrink-0"><CheckCircle2 className="w-3 h-3 ml-1" />متصل</Badge>}
            </div>

            {selected.kind === "connector" ? (
              <div className="space-y-3 text-sm text-slate-600">
                <p className="font-medium text-slate-700">خطوات الربط:</p>
                <ol className="list-decimal list-inside space-y-1.5">
                  <li>ابدأ الربط من داخل Bytly</li>
                  <li>اختر حساب Google أو البريد المطلوب من شاشة المصادقة الرسمية</li>
                  <li>وافق على الصلاحيات المطلوبة للخدمة</li>
                  <li>ستعود تلقائيًا إلى Bytly بعد الموافقة</li>
                  <li>سيتم فحص الاتصال وتحديث الحالة</li>
                  <li>يمكنك إعادة الفحص من زر «تحديث الحالة»</li>
                </ol>
                {!isDirectOAuthSupported(selected.type) && (
                  <div className="rounded-md bg-amber-50 border border-amber-200 text-amber-800 p-3 text-xs">
                    هذا المزود يحتاج إعداد OAuth مباشر خاص به قبل تفعيله من داخل Bytly.
                  </div>
                )}
                <div className="flex gap-2 mt-2">
                  <Button className="flex-1 bg-gradient-to-r from-[#6B5D4F] to-[#C9A66B] text-white hover:opacity-90" onClick={handleConnect} disabled={connecting || !isDirectOAuthSupported(selected.type)}>
                    {connecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link2 className="w-4 h-4" />}
                    {connecting ? "جاري فتح المصادقة..." : "ربط الخدمة"}
                  </Button>
                  <Button variant="outline" onClick={handleRefresh} disabled={refreshing || !onRefresh}>
                    {refreshing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                    تحديث الحالة
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3 text-sm text-slate-600">
                <p className="font-medium text-slate-700">خطوات الربط:</p>
                <ol className="list-decimal list-inside space-y-1.5">
                  <li>أضف المفتاح المطلوب في بيئة Bytly الآمنة</li>
                  <li>احفظ التغييرات</li>
                  <li>عُد إلى هذه الصفحة واضغط «تحديث الحالة»</li>
                </ol>
                <Button className="w-full bg-gradient-to-r from-[#6B5D4F] to-[#C9A66B] text-white hover:opacity-90 mt-2" disabled>
                  <KeyRound className="w-4 h-4" /> إعداد مفتاح API
                </Button>
              </div>
            )}

            <Button variant="outline" className="w-full mt-4" onClick={() => setSelected(null)}>رجوع للقائمة</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
