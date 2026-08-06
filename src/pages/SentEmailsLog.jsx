import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Mail, Search, RefreshCw, Loader2, Calendar, User, Send, Filter } from "lucide-react";
import moment from "moment";
import MobileSelect from "@/components/mobile/MobileSelect";
import { sanitizeHtml } from "@/lib/sanitizeHtml";

export default function SentEmailsLog() {
  const { toast } = useToast();
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const loadEmails = async () => {
    setLoading(true);
    try {
      const res = await base44.functions.invoke("gmailService", {
        action: "listSystemSent",
        data: { maxResults: 200 },
      });
      setEmails(res.data?.emails || []);
    } catch (e) {
      toast.error("فشل تحميل السجلات: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadEmails(); }, []);

  const sources = useMemo(() => {
    const set = new Set(emails.map(e => e.source).filter(Boolean));
    return ["all", ...Array.from(set)];
  }, [emails]);

  const filtered = useMemo(() => {
    return emails.filter(e => {
      const q = searchQuery.toLowerCase();
      const matchesQuery = !q ||
        (e.to || "").toLowerCase().includes(q) ||
        (e.subject || "").toLowerCase().includes(q) ||
        (e.body || "").toLowerCase().includes(q);
      const eDate = e.date ? moment(e.date) : null;
      const matchesFrom = !dateFrom || (eDate && eDate.isSameOrAfter(moment(dateFrom)));
      const matchesTo = !dateTo || (eDate && eDate.isSameOrBefore(moment(dateTo).endOf("day")));
      const matchesStatus = statusFilter === "all" || (statusFilter === "sent" && !e.isFailed) || (statusFilter === "failed" && e.isFailed);
      const matchesSource = sourceFilter === "all" || e.source === sourceFilter;
      return matchesQuery && matchesFrom && matchesTo && matchesStatus && matchesSource;
    });
  }, [emails, searchQuery, dateFrom, dateTo, statusFilter, sourceFilter]);

  const openEmail = (email) => {
    setSelectedEmail(email);
    setDetailOpen(true);
  };

  const clearFilters = () => {
    setSearchQuery("");
    setDateFrom("");
    setDateTo("");
    setStatusFilter("all");
    setSourceFilter("all");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white p-3 sm:p-6" dir="rtl">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-gradient-to-br from-[#6B5D4F] to-[#C9A66B] rounded-xl flex items-center justify-center">
              <Send className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">سجل الرسائل المرسلة</h1>
              <p className="text-sm text-slate-500">كل الإيميلات والرسائل التي أرسلها النظام للمستخدمين</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={loadEmails} disabled={loading}>
            <RefreshCw className={`w-4 h-4 ml-1 ${loading ? "animate-spin" : ""}`} />
            تحديث
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          <Card className="border-slate-200">
            <CardContent className="p-4">
              <p className="text-xs text-slate-500 mb-1">إجمالي المرسل</p>
              <p className="text-2xl font-bold text-slate-800">{emails.length}</p>
            </CardContent>
          </Card>
          <Card className="border-slate-200">
            <CardContent className="p-4">
              <p className="text-xs text-slate-500 mb-1">نتائج الفلترة</p>
              <p className="text-2xl font-bold text-[#C9A66B]">{filtered.length}</p>
            </CardContent>
          </Card>
          <Card className="border-slate-200">
            <CardContent className="p-4">
              <p className="text-xs text-slate-500 mb-1">مرسلة بنجاح</p>
              <p className="text-2xl font-bold text-green-600">{emails.filter(e => !e.isFailed).length}</p>
            </CardContent>
          </Card>
          <Card className="border-slate-200">
            <CardContent className="p-4">
              <p className="text-xs text-slate-500 mb-1">فاشلة</p>
              <p className="text-2xl font-bold text-red-500">{emails.filter(e => e.isFailed).length}</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-4 border-slate-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2 text-slate-700">
              <Filter className="w-4 h-4" />
              البحث والفلترة
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="relative">
              <Search className="absolute right-3 top-2.5 w-4 h-4 text-slate-400" />
              <Input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="بحث بالبريد أو الموضوع أو المحتوى..."
                className="pr-9 text-sm"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="text-xs text-slate-500 mb-1 flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> من تاريخ
                </label>
                <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="text-sm" />
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1 flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> إلى تاريخ
                </label>
                <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="text-sm" />
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1 flex items-center gap-1">
                  <User className="w-3 h-3" /> الحالة
                </label>
                <MobileSelect
                  value={statusFilter}
                  onValueChange={(v) => setStatusFilter(v)}
                  placeholder="الحالة"
                  label="الحالة"
                  options={[
                    { value: "all", label: "الكل" },
                    { value: "sent", label: "مرسلة بنجاح" },
                    { value: "failed", label: "فاشلة" },
                  ]}
                />
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1 flex items-center gap-1">
                  <Filter className="w-3 h-3" /> المصدر
                </label>
                <MobileSelect
                  value={sourceFilter}
                  onValueChange={(v) => setSourceFilter(v)}
                  placeholder="المصدر"
                  label="المصدر"
                  options={sources.map(s => ({ value: s, label: s === "all" ? "الكل" : s }))}
                />
              </div>
            </div>
            {(searchQuery || dateFrom || dateTo || statusFilter !== "all" || sourceFilter !== "all") && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="text-slate-500">
                مسح الفلاتر
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Table */}
        <Card className="border-slate-200">
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-16 text-slate-400">
                <Mail className="w-10 h-10 mx-auto mb-2 opacity-40" />
                <p className="text-sm">لا توجد رسائل مطابقة</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 border-b">
                    <tr className="text-right text-xs text-slate-500">
                      <th className="p-3 font-medium">المستلم</th>
                      <th className="p-3 font-medium">الموضوع</th>
                      <th className="p-3 font-medium hidden md:table-cell">المصدر</th>
                      <th className="p-3 font-medium hidden sm:table-cell">التاريخ</th>
                      <th className="p-3 font-medium">الحالة</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(email => (
                      <tr
                        key={email.id}
                        onClick={() => openEmail(email)}
                        className="border-b last:border-0 hover:bg-slate-50 cursor-pointer transition-colors"
                      >
                        <td className="p-3">
                          <p className="font-medium text-slate-800 text-xs sm:text-sm truncate max-w-[180px]">
                            {email.to || "—"}
                          </p>
                        </td>
                        <td className="p-3">
                          <p className="text-slate-700 text-xs sm:text-sm truncate max-w-[250px]">
                            {email.subject || "(بدون موضوع)"}
                          </p>
                          <p className="text-xs text-slate-400 truncate max-w-[250px]">{email.snippet}</p>
                        </td>
                        <td className="p-3 hidden md:table-cell">
                          {email.source && (
                            <Badge variant="outline" className="text-xs font-normal">
                              {email.source}
                            </Badge>
                          )}
                        </td>
                        <td className="p-3 hidden sm:table-cell text-slate-500 text-xs whitespace-nowrap">
                          {email.date ? moment(email.date).format("YYYY-MM-DD HH:mm") : "—"}
                        </td>
                        <td className="p-3">
                          <Badge className={email.isFailed ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}>
                            {email.isFailed ? "فاشل" : "مرسل"}
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
      </div>

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-2xl" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-lg flex items-center gap-2">
              <Mail className="w-5 h-5 text-[#C9A66B]" />
              تفاصيل الرسالة
            </DialogTitle>
          </DialogHeader>
          {selectedEmail && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-slate-500 mb-0.5">إلى</p>
                  <p className="font-medium text-slate-800">{selectedEmail.to}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-0.5">المصدر</p>
                  <p className="font-medium text-slate-800">{selectedEmail.source || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-0.5">التاريخ</p>
                  <p className="font-medium text-slate-800">
                    {selectedEmail.date ? moment(selectedEmail.date).format("YYYY-MM-DD HH:mm") : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-0.5">الحالة</p>
                  <Badge className={selectedEmail.isFailed ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}>
                    {selectedEmail.isFailed ? "فاشل" : "مرسل"}
                  </Badge>
                </div>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-0.5">الموضوع</p>
                <p className="font-semibold text-slate-800">{selectedEmail.subject}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">المحتوى</p>
                <div
                  className="text-sm text-slate-700 leading-relaxed prose prose-sm max-w-none border rounded-md p-3 bg-slate-50 max-h-[300px] overflow-y-auto"
                  dangerouslySetInnerHTML={{ __html: sanitizeHtml(selectedEmail.body) }}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailOpen(false)}>إغلاق</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}