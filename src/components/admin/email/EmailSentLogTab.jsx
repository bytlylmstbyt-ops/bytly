import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Mail, Search, RefreshCw, Loader2, Inbox, Calendar, X, Filter } from "lucide-react";
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
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const loadEmails = async () => {
    setLoading(true);
    try {
      // Fetch from Gmail API, SentEmail entity, and scheduled EmailCampaigns in parallel
      const [gmailRes, sentEmails, campaigns] = await Promise.allSettled([
        base44.functions.invoke("gmailService", {
          action: "listSystemSent",
          data: { maxResults: limit || 200 },
        }),
        base44.entities.SentEmail.list("-created_date", limit || 200),
        base44.entities.EmailCampaign.filter({ status: "scheduled" }, "-created_date", 50),
      ]);

      const gmailEmails = (gmailRes.status === "fulfilled" ? gmailRes.value?.data?.emails : []) || [];
      const dbSent = (sentEmails.status === "fulfilled" ? sentEmails.value : []) || [];
      const scheduled = (campaigns.status === "fulfilled" ? campaigns.value : []) || [];

      // Normalize Gmail emails
      const normalizedGmail = gmailEmails.map(e => ({
        id: `gmail_${e.id}`,
        to: e.to || "",
        recipientName: e.to || "",
        subject: e.subject || "",
        source: e.source || "Gmail",
        date: e.date || null,
        status: e.isFailed ? "failed" : "sent",
        body: e.body || "",
      }));

      // Normalize SentEmail DB records (skip duplicates already in Gmail by to+subject+date)
      const gmailKeys = new Set(normalizedGmail.map(e => `${e.to}|${e.subject}|${e.date}`));
      const normalizedDb = dbSent
        .filter(e => !gmailKeys.has(`${e.to_email}|${e.subject}|${e.sent_at}`))
        .map(e => ({
          id: `db_${e.id}`,
          to: e.to_email || "",
          recipientName: e.recipient_name || e.to_email || "",
          subject: e.subject || "",
          source: e.source || "System",
          date: e.sent_at || e.created_date || null,
          status: e.status || "sent",
          body: e.body || "",
        }));

      // Normalize scheduled campaigns
      const normalizedScheduled = scheduled.map(c => ({
        id: `camp_${c.id}`,
        to: (c.recipients && c.recipients[0]) || (c.recipient_type === "all_users" ? "جميع المستخدمين" : ""),
        recipientName: (c.recipients && c.recipients[0]) || "حملة مجدولة",
        subject: c.subject || "",
        source: "حملة بريدية",
        date: c.scheduled_at || c.created_date || null,
        status: "scheduled",
        body: c.body || "",
      }));

      setEmails([...normalizedScheduled, ...normalizedGmail, ...normalizedDb]);
    } catch (e) {
      toast({ title: isRTL ? "فشل تحميل السجلات" : "Failed to load", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadEmails(); }, [limit]);

  const hasActiveFilters = searchQuery || statusFilter !== "all" || dateFrom || dateTo;

  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setDateFrom("");
    setDateTo("");
  };

  const filtered = useMemo(() => {
    return emails.filter(e => {
      const q = searchQuery.toLowerCase();
      const matchesQuery = !q ||
        (e.to || "").toLowerCase().includes(q) ||
        (e.recipientName || "").toLowerCase().includes(q) ||
        (e.subject || "").toLowerCase().includes(q);
      const matchesStatus = statusFilter === "all" || e.status === statusFilter;

      // Date range filter
      let matchesDate = true;
      if (e.date) {
        const emailDate = moment(e.date);
        if (dateFrom && emailDate.isBefore(moment(dateFrom), "day")) matchesDate = false;
        if (dateTo && emailDate.isAfter(moment(dateTo), "day")) matchesDate = false;
      } else if (dateFrom || dateTo) {
        matchesDate = false;
      }

      return matchesQuery && matchesStatus && matchesDate;
    });
  }, [emails, searchQuery, statusFilter, dateFrom, dateTo]);

  const openEmail = (email) => { setSelectedEmail(email); setDetailOpen(true); };

  return (
    <div className="space-y-4">
      {/* Advanced Filters */}
      <Card className="border-slate-200">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <h3 className="text-sm font-semibold text-[#4A3F35] flex items-center gap-1.5">
              <Filter className="w-4 h-4 text-[#C9A66B]" />
              {t("integrations.adminEmail.sent.title")}
            </h3>
            <div className="flex items-center gap-2">
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8 text-xs text-slate-500">
                  <X className="w-3.5 h-3.5" />
                  {isRTL ? "مسح الفلاتر" : "Clear"}
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={() => { loadEmails(); onRefresh?.(); }} disabled={loading} className="h-8">
                {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                {isRTL ? "تحديث" : "Refresh"}
              </Button>
            </div>
          </div>

          {/* Row 1: Search + Status */}
          <div className="flex gap-2 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute right-3 top-2.5 w-4 h-4 text-slate-400" />
              <Input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder={isRTL ? "ابحث بالبريد أو اسم العميل أو الموضوع..." : "Search by email, client name or subject..."} className="pr-9 text-sm" />
            </div>
            <div className="flex gap-1">
              {[
                { key: "all", label: isRTL ? "الكل" : "All" },
                { key: "sent", label: isRTL ? "مرسل" : "Sent" },
                { key: "scheduled", label: isRTL ? "مجدول" : "Scheduled" },
                { key: "failed", label: isRTL ? "فاشل" : "Failed" },
              ].map(s => (
                <Button key={s.key} size="sm" variant={statusFilter === s.key ? "default" : "outline"} className="h-9 text-xs" onClick={() => setStatusFilter(s.key)}>
                  {s.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Row 2: Date range */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <Calendar className="w-3.5 h-3.5" />
              <span>{isRTL ? "نطاق التاريخ" : "Date range"}</span>
            </div>
            <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="h-9 text-xs w-auto" />
            <span className="text-slate-400 text-xs">—</span>
            <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="h-9 text-xs w-auto" />
            <span className="text-xs text-slate-400 mr-auto">
              {isRTL ? `${filtered.length} نتيجة` : `${filtered.length} results`}
            </span>
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
                      <td className="p-3">
                        <p className="font-medium text-slate-800 text-xs sm:text-sm truncate max-w-[180px]">{email.recipientName || email.to || "—"}</p>
                        {email.recipientName && email.to && email.recipientName !== email.to && (
                          <p className="text-[10px] text-slate-400 truncate max-w-[180px]">{email.to}</p>
                        )}
                      </td>
                      <td className="p-3"><p className="text-slate-700 text-xs sm:text-sm truncate max-w-[250px]">{email.subject || "—"}</p></td>
                      <td className="p-3 hidden md:table-cell">{email.source && <Badge variant="outline" className="text-xs font-normal">{email.source}</Badge>}</td>
                      <td className="p-3 hidden sm:table-cell text-slate-500 text-xs whitespace-nowrap">{email.date ? moment(email.date).format("YYYY-MM-DD HH:mm") : "—"}</td>
                      <td className="p-3">
                        <Badge className={
                          email.status === "failed" ? "bg-red-100 text-red-700" :
                          email.status === "scheduled" ? "bg-blue-100 text-blue-700" :
                          "bg-green-100 text-green-700"
                        }>
                          {email.status === "failed" ? (isRTL ? "فاشل" : "Failed") :
                           email.status === "scheduled" ? (isRTL ? "مجدول" : "Scheduled") :
                           (isRTL ? "مرسل" : "Sent")}
                        </Badge>
                      </td>
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
                <div><p className="text-xs text-slate-500 mb-0.5">{t("integrations.adminEmail.sent.recipient")}</p><p className="font-medium text-slate-800">{selectedEmail.recipientName || selectedEmail.to || "—"}</p></div>
                <div><p className="text-xs text-slate-500 mb-0.5">{t("integrations.adminEmail.sent.source")}</p><p className="font-medium text-slate-800">{selectedEmail.source || "—"}</p></div>
                <div><p className="text-xs text-slate-500 mb-0.5">{t("integrations.adminEmail.sent.date")}</p><p className="font-medium text-slate-800">{selectedEmail.date ? moment(selectedEmail.date).format("YYYY-MM-DD HH:mm") : "—"}</p></div>
                <div><p className="text-xs text-slate-500 mb-0.5">{t("integrations.adminEmail.sent.status")}</p><Badge className={selectedEmail.status === "failed" ? "bg-red-100 text-red-700" : selectedEmail.status === "scheduled" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"}>{selectedEmail.status === "failed" ? (isRTL ? "فاشل" : "Failed") : selectedEmail.status === "scheduled" ? (isRTL ? "مجدول" : "Scheduled") : (isRTL ? "مرسل" : "Sent")}</Badge></div>
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