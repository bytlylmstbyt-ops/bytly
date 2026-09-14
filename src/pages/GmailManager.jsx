import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  Mail, Send, Inbox, Trash2, RefreshCw, Loader2,
  Reply, Sparkles, Search, CheckCheck, PenSquare, X
} from "lucide-react";
import { toast } from "sonner";
import { sanitizeHtml } from "@/lib/sanitizeHtml";

function EmailRow({ email, onSelect, onMarkRead, onTrash, isSent }) {
  return (
    <div
      onClick={() => onSelect(email)}
      className={`flex items-start gap-3 p-4 border-b cursor-pointer hover:bg-slate-50 transition-colors ${email.isUnread ? 'bg-blue-50/40' : 'bg-white'}`}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className={`text-sm truncate ${email.isUnread ? 'font-semibold text-slate-900' : 'font-medium text-slate-700'}`}>
            {email.from?.replace(/<.*>/, '').trim() || 'غير معروف'}
          </span>
          <span className="text-xs text-slate-400 shrink-0">{email.date ? new Date(email.date).toLocaleDateString('ar-SA') : ''}</span>
        </div>
        <p className={`text-sm truncate mt-0.5 ${email.isUnread ? 'text-slate-800 font-medium' : 'text-slate-600'}`}>
          {email.subject || '(بدون موضوع)'}
        </p>
        <p className="text-xs text-slate-400 truncate mt-0.5">{email.snippet}</p>
      </div>
      {isSent && (() => {
        const bounceKeywords = ['delivery status', 'mail delivery failed', 'undelivered', 'returned mail', 'failure notice', 'delivery failure', 'bounced', 'could not be delivered'];
        const checkText = `${email.subject || ''} ${email.snippet || ''}`.toLowerCase();
        const isBounced = bounceKeywords.some(k => checkText.includes(k));
        return isBounced ? (
          <div className="flex items-center gap-1 shrink-0 mt-0.5 px-2 py-1 rounded-full bg-red-50 border border-red-200">
            <X className="w-3.5 h-3.5 text-red-600" />
            <span className="text-[10px] font-medium text-red-700">لم يتم التسليم</span>
          </div>
        ) : (
          <div className="flex items-center gap-1 shrink-0 mt-0.5 px-2 py-1 rounded-full bg-green-50 border border-green-200">
            <CheckCheck className="w-3.5 h-3.5 text-green-600" />
            <span className="text-[10px] font-medium text-green-700">تم التسليم</span>
          </div>
        );
      })()}
      <div className="flex gap-1 shrink-0 md:opacity-0 md:group-hover:opacity-100" onClick={e => e.stopPropagation()}>
        {email.isUnread && (
          <button onClick={() => onMarkRead(email.id)} title="تحديد كمقروء" className="p-1.5 hover:bg-slate-200 rounded-md" style={{ minHeight: 36, minWidth: 36 }}>
            <CheckCheck className="w-4 h-4 text-blue-500" />
          </button>
        )}
        <button onClick={() => onTrash(email.id)} title="حذف" className="p-1.5 hover:bg-red-100 rounded-md" style={{ minHeight: 36, minWidth: 36 }}>
          <Trash2 className="w-4 h-4 text-red-400" />
        </button>
      </div>
      {email.isUnread && <div className="w-2 h-2 bg-blue-500 rounded-full shrink-0 mt-1.5" />}
    </div>
  );
}

export default function GmailManager() {
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('inbox');
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [emailDetail, setEmailDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [composeOpen, setComposeOpen] = useState(false);
  const [replyOpen, setReplyOpen] = useState(false);
  const [draftLoading, setDraftLoading] = useState(false);
  const [composeForm, setComposeForm] = useState({ to: '', subject: '', body: '' });
  const [replyForm, setReplyForm] = useState({ body: '' });
  const [sendLoading, setSendLoading] = useState(false);

  const invoke = async (action, data) => {
    const res = await base44.functions.invoke('gmailService', { action, data });
    return res.data;
  };

  const loadEmails = async () => {
    setLoading(true);
    try {
      const labelIds = activeTab === 'inbox' ? ['INBOX'] : activeTab === 'sent' ? ['SENT'] : ['UNREAD'];
      const result = await invoke('listEmails', { maxResults: 30, labelIds, q: searchQuery });
      let combined = result.emails || [];

      // Merge system-sent emails into the "sent" tab
      if (activeTab === 'sent') {
        try {
          const sysResult = await invoke('listSystemSent', { maxResults: 50 });
          const sysEmails = (sysResult.emails || []).filter(e =>
            !searchQuery ||
            (e.to || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (e.subject || '').toLowerCase().includes(searchQuery.toLowerCase())
          );
          combined = [...combined, ...sysEmails].sort((a, b) =>
            new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime()
          );
        } catch (e) { console.error('Failed to load system emails:', e); }
      }

      setEmails(combined);
    } catch (e) {
      toast.error('فشل تحميل الرسائل: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadEmails(); }, [activeTab]);

  const openEmail = async (email) => {
    setSelectedEmail(email);
    setDetailLoading(true);
    try {
      // System-sent emails already have full body — no need to fetch from Gmail
      if (email.isSystemEmail) {
        setEmailDetail({
          id: email.id,
          from: 'Bytly System',
          to: email.to,
          subject: email.subject,
          date: email.date,
          body: email.body,
        });
        return;
      }
      const result = await invoke('getEmail', { messageId: email.id });
      setEmailDetail(result.email);
      if (email.isUnread) {
        await invoke('markAsRead', { messageId: email.id });
        setEmails(prev => prev.map(e => e.id === email.id ? { ...e, isUnread: false } : e));
      }
    } catch (e) {
      toast.error('فشل تحميل الرسالة');
    } finally {
      setDetailLoading(false);
    }
  };

  const handleTrash = async (messageId) => {
    try {
      await invoke('trashEmail', { messageId });
      setEmails(prev => prev.filter(e => e.id !== messageId));
      if (selectedEmail?.id === messageId) setSelectedEmail(null);
      toast.success('تم نقل الرسالة للمهملات');
    } catch { toast.error('فشل الحذف'); }
  };

  const handleMarkRead = async (messageId) => {
    try {
      await invoke('markAsRead', { messageId });
      setEmails(prev => prev.map(e => e.id === messageId ? { ...e, isUnread: false } : e));
    } catch { toast.error('فشل التحديث'); }
  };

  const handleSend = async () => {
    if (!composeForm.to || !composeForm.subject || !composeForm.body) {
      toast.error('يرجى ملء جميع الحقول');
      return;
    }
    setSendLoading(true);
    try {
      await invoke('sendEmail', composeForm);
      toast.success('تم إرسال البريد الإلكتروني ✓');
      setComposeOpen(false);
      setComposeForm({ to: '', subject: '', body: '' });
    } catch (e) {
      toast.error('فشل الإرسال: ' + e.message);
    } finally {
      setSendLoading(false);
    }
  };

  const handleReply = async () => {
    if (!replyForm.body) { toast.error('اكتب نص الرد'); return; }
    setSendLoading(true);
    try {
      await invoke('replyEmail', {
        messageId: emailDetail.id,
        threadId: emailDetail.threadId,
        to: emailDetail.from,
        subject: emailDetail.subject,
        body: replyForm.body,
      });
      toast.success('تم إرسال الرد ✓');
      setReplyOpen(false);
      setReplyForm({ body: '' });
    } catch (e) {
      toast.error('فشل الإرسال: ' + e.message);
    } finally {
      setSendLoading(false);
    }
  };

  const generateAIDraft = async () => {
    if (!emailDetail) return;
    setDraftLoading(true);
    try {
      const result = await invoke('draftReply', {
        emailBody: emailDetail.body?.slice(0, 1000),
        emailFrom: emailDetail.from,
        emailSubject: emailDetail.subject,
      });
      setReplyForm({ body: result.draft });
      setReplyOpen(true);
    } catch { toast.error('فشل توليد الرد'); } finally { setDraftLoading(false); }
  };

  const unreadCount = emails.filter(e => e.isUnread).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white p-3 sm:p-6" dir="rtl">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center">
              <Mail className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">بريد Gmail</h1>
              <p className="text-sm text-slate-500">إدارة البريد الإلكتروني من خلال Bytly</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={loadEmails} disabled={loading}>
              <RefreshCw className={`w-4 h-4 ml-1 ${loading ? 'animate-spin' : ''}`} />
              تحديث
            </Button>
            <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={() => setComposeOpen(true)}>
              <PenSquare className="w-4 h-4 ml-1" />
              إنشاء رسالة
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Email List */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader className="pb-3">
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="w-full">
                    <TabsTrigger value="inbox" className="flex-1 text-xs">
                      البريد الوارد {unreadCount > 0 && <Badge className="mr-1 text-xs bg-blue-500 text-white">{unreadCount}</Badge>}
                    </TabsTrigger>
                    <TabsTrigger value="sent" className="flex-1 text-xs">المرسل</TabsTrigger>
                    <TabsTrigger value="unread" className="flex-1 text-xs">غير مقروء</TabsTrigger>
                  </TabsList>
                </Tabs>
                <div className="mt-2 relative">
                  <Search className="absolute right-3 top-2.5 w-4 h-4 text-slate-400" />
                  <Input
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && loadEmails()}
                    placeholder="بحث في الرسائل..."
                    className="pr-9 text-sm"
                  />
                </div>
              </CardHeader>
              <CardContent className="p-0 max-h-[450px] md:max-h-[600px] overflow-y-auto">
                {loading ? (
                  <div className="flex items-center justify-center py-16">
                    <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                  </div>
                ) : emails.length === 0 ? (
                  <div className="text-center py-16 text-slate-400">
                    <Inbox className="w-10 h-10 mx-auto mb-2 opacity-40" />
                    <p className="text-sm">لا توجد رسائل</p>
                  </div>
                ) : (
                  <div className="group">
                    {emails.map(email => (
                      <EmailRow
                        key={email.id}
                        email={email}
                        onSelect={openEmail}
                        onMarkRead={handleMarkRead}
                        onTrash={handleTrash}
                        isSent={activeTab === 'sent'}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Email Detail */}
          <div className="lg:col-span-2">
            {!selectedEmail ? (
              <Card className="h-full flex items-center justify-center min-h-[400px]">
                <div className="text-center text-slate-400">
                  <Mail className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>اختر رسالة للعرض</p>
                </div>
              </Card>
            ) : (
              <Card>
                <CardHeader className="border-b">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <h2 className="text-lg font-semibold text-slate-800">{emailDetail?.subject || selectedEmail.subject || '(بدون موضوع)'}</h2>
                      <div className="text-sm text-slate-500 mt-1 space-y-0.5">
                        <p>من: <span className="text-slate-700">{emailDetail?.from || selectedEmail.from}</span></p>
                        <p>إلى: <span className="text-slate-700">{emailDetail?.to || selectedEmail.to}</span></p>
                        <p>التاريخ: <span className="text-slate-700">{emailDetail?.date || selectedEmail.date}</span></p>
                      </div>
                    </div>
                    <div className="flex gap-1.5 shrink-0">
                      <Button size="sm" variant="outline" onClick={generateAIDraft} disabled={draftLoading || !emailDetail}>
                        {draftLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-amber-500" />}
                        <span className="mr-1 text-xs hidden sm:inline">رد ذكي</span>
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setReplyOpen(true)} disabled={!emailDetail}>
                        <Reply className="w-3.5 h-3.5" />
                        <span className="mr-1 text-xs hidden sm:inline">رد</span>
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => handleTrash(selectedEmail.id)}>
                        <Trash2 className="w-3.5 h-3.5 text-red-400" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="py-4 max-h-[480px] overflow-y-auto">
                  {detailLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                    </div>
                  ) : emailDetail?.body ? (
                    <div
                      className="text-sm text-slate-700 leading-relaxed prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: sanitizeHtml(emailDetail.body) }}
                    />
                  ) : (
                    <p className="text-slate-500 text-sm">{selectedEmail.snippet}</p>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Compose Dialog */}
      <Dialog open={composeOpen} onOpenChange={setComposeOpen}>
        <DialogContent className="max-w-lg" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PenSquare className="w-5 h-5 text-red-500" />
              إنشاء رسالة جديدة
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              placeholder="إلى (البريد الإلكتروني)"
              value={composeForm.to}
              onChange={e => setComposeForm({ ...composeForm, to: e.target.value })}
            />
            <Input
              placeholder="الموضوع"
              value={composeForm.subject}
              onChange={e => setComposeForm({ ...composeForm, subject: e.target.value })}
            />
            <Textarea
              placeholder="نص الرسالة..."
              rows={8}
              value={composeForm.body}
              onChange={e => setComposeForm({ ...composeForm, body: e.target.value })}
            />
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setComposeOpen(false)}>إلغاء</Button>
            <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={handleSend} disabled={sendLoading}>
              {sendLoading ? <Loader2 className="w-4 h-4 animate-spin ml-1" /> : <Send className="w-4 h-4 ml-1" />}
              إرسال
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reply Dialog */}
      <Dialog open={replyOpen} onOpenChange={setReplyOpen}>
        <DialogContent className="max-w-lg" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Reply className="w-5 h-5 text-blue-500" />
              رد على الرسالة
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <p className="text-xs text-slate-500">الرد إلى: <span className="font-medium text-slate-700">{emailDetail?.from}</span></p>
            <Textarea
              placeholder="اكتب ردك هنا..."
              rows={8}
              value={replyForm.body}
              onChange={e => setReplyForm({ body: e.target.value })}
            />
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setReplyOpen(false)}>إلغاء</Button>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={handleReply} disabled={sendLoading}>
              {sendLoading ? <Loader2 className="w-4 h-4 animate-spin ml-1" /> : <Send className="w-4 h-4 ml-1" />}
              إرسال الرد
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}