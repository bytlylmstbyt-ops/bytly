import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Mail, Search, RefreshCw, Loader2, Inbox } from "lucide-react";
import { useLanguage } from "@/components/i18n/LanguageContext";
import { useToast } from "@/components/ui/use-toast";
import { sanitizeHtml } from "@/lib/sanitizeHtml";
import moment from "moment";

export default function EmailSentLogTab({ onRefresh, limit }) {
  const { t, isRTL } = useLanguage();
  const { toast } = useToast();
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const loadEmails = async () => {
    setLoading(true);
    try {
      const res = await base44.functions.invoke("gmailService", {
        action: "listSystemSent",
        data: { maxResults: limit || 200 },
      });
      setEmails(res.data?.emails || []);
    } catch (e) {
      toast({ title: isRTL ? "فشل تحميل السجلات" : "Failed to load", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadEmails(); }, [limit]);

  const filtered = useMemo(() => {
    return emails.filter(e => {
      const q = searchQuery.toLowerCase();
      const matchesQuery = !q || (e.to || "").toLowerCase().includes(q) || (e.subject || "").toLowerCase().includes(q);
      const matchesStatus = statusFilter === "all" || (statusFilter === "sent" && !e.isFailed) || (statusFilter === "failed" && e.isFailed);
      return matchesQuery && matchesStatus;
    });
  }, [emails, searchQuery, statusFilter]);

  const openEmail = (email) => { setSelectedEmail(email); setDetailOpen(true); };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card className="border-slate-200">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <h3 className="text-sm font-semibold text-[#4A3F35]">{t("integrations.adminEmail.sent.title")}</h3>
            <Button variant="outline" size="sm" onClick={() => { loadEmails(); onRefresh?.(); }} disabled={loading} className="h-8">
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
              {isRTL ? "تحديث" : "Refresh"}
            </Button>
          </div>
          <div className="flex gap-2 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute right-3 top-2.5 w-4 h-4 text-slate-400" />
              <Input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder={t("integrations.adminEmail.sent.search")} className="pr-9 text-sm" />
            </div>
            <div className="flex gap-1">
              {["all", "sent", "failed"].map(s => (
                <Button key={s} size="sm" variant={statusFilter === s ? "default" : "outline"} className="h-9 text-xs" onClick={() => setStatusFilter(s)}>
                  {s === "all" ? (isRTL ? "الكل" : "All") : s === "sent" ? (isRTL ? "مرسل" : "Sent") : (isRTL ? "فاشل" : "Failed")}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="border-slate-200">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <Inbox className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <p className="text-sm">{t("integrations.adminEmail.empty")}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b">
                  <tr className={`text-xs text-slate-500 ${isRTL ? "text-right" : "text-left"}`}>
                    <th className="p-3 font-medium">{t("integrations.adminEmail.sent.recipient")}</th>
                    <th className="p-3 font-medium">{t("integrations.adminEmail.sent.subject")}</th>
                    <th className="p-3 font-medium hidden md:table-cell">{t("integrations.adminEmail.sent.source")}</th>
                    <th className="p-3 font-medium hidden sm:table-cell">{t("integrations.adminEmail.sent.date")}</th>
                    <th className="p-3 font-medium">{t("integrations.adminEmail.sent.status")}</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(email => (
                    <tr key={email.id} onClick={() => openEmail(email)} className="border-b last:border-0 hover:bg-slate-50 cursor-pointer transition-colors">
                      <td className="p-3"><p className="font-medium text-slate-800 text-xs sm:text-sm truncate max-w-[180px]">{email.to || "—"}</p></td>
                      <td className="p-3"><p className="text-slate-700 text-xs sm:text-sm truncate max-w-[250px]">{email.subject || "—"}</p></td>
                      <td className="p-3 hidden md:table-cell">{email.source && <Badge variant="outline" className="text-xs font-normal">{email.source}</Badge>}</td>
                      <td className="p-3 hidden sm:table-cell text-slate-500 text-xs whitespace-nowrap">{email.date ? moment(email.date).format("YYYY-MM-DD HH:mm") : "—"}</td>
                      <td className="p-3"><Badge className={email.isFailed ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}>{email.isFailed ? (isRTL ? "فاشل" : "Failed") : (isRTL ? "مرسل" : "Sent")}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-2xl" dir={isRTL ? "rtl" : "ltr"}>
          <DialogHeader>
            <DialogTitle className="text-lg flex items-center gap-2"><Mail className="w-5 h-5 text-[#C9A66B]" />{isRTL ? "تفاصيل الرسالة" : "Email Details"}</DialogTitle>
          </DialogHeader>
          {selectedEmail && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div><p className="text-xs text-slate-500 mb-0.5">{t("integrations.adminEmail.sent.recipient")}</p><p className="font-medium text-slate-800">{selectedEmail.to}</p></div>
                <div><p className="text-xs text-slate-500 mb-0.5">{t("integrations.adminEmail.sent.source")}</p><p className="font-medium text-slate-800">{selectedEmail.source || "—"}</p></div>
                <div><p className="text-xs text-slate-500 mb-0.5">{t("integrations.adminEmail.sent.date")}</p><p className="font-medium text-slate-800">{selectedEmail.date ? moment(selectedEmail.date).format("YYYY-MM-DD HH:mm") : "—"}</p></div>
                <div><p className="text-xs text-slate-500 mb-0.5">{t("integrations.adminEmail.sent.status")}</p><Badge className={selectedEmail.isFailed ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}>{selectedEmail.isFailed ? (isRTL ? "فاشل" : "Failed") : (isRTL ? "مرسل" : "Sent")}</Badge></div>
              </div>
              <div><p className="text-xs text-slate-500 mb-0.5">{t("integrations.adminEmail.sent.subject")}</p><p className="font-semibold text-slate-800">{selectedEmail.subject}</p></div>
              <div><p className="text-xs text-slate-500 mb-1">{t("integrations.adminEmail.compose.body")}</p><div className="text-sm text-slate-700 leading-relaxed border rounded-md p-3 bg-slate-50 max-h-[300px] overflow-y-auto" dangerouslySetInnerHTML={{ __html: sanitizeHtml(selectedEmail.body) }} /></div>
            </div>
          )}
          <DialogFooter><Button variant="outline" onClick={() => setDetailOpen(false)}>{isRTL ? "إغلاق" : "Close"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}