import React, { useState } from "react";
import { Globe2, Link2, Mail, Plus, Copy, CheckCircle2, MoreHorizontal, X, ShoppingCart, ArrowLeftRight, Send, ShieldCheck, Trash2, BookOpen, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useLanguage } from "@/components/i18n/LanguageContext";

const DOMAIN = "mybytly.com";

export default function AdminDomains() {
  const { isRTL } = useLanguage();
  const [dialog, setDialog] = useState(null);
  const [copied, setCopied] = useState(false);
  const [redirects, setRedirects] = useState([]);
  const [redirectPath, setRedirectPath] = useState("");
  const [sender, setSender] = useState("info@mybytly.com");
  const [senderName, setSenderName] = useState("بيتلي - المنظومة الهندسية المتكاملة");
  const [connectedDomain, setConnectedDomain] = useState("");
  const [copiedField, setCopiedField] = useState("");
  const [verifyStatus, setVerifyStatus] = useState(null); // null | 'verifying' | 'success' | 'failed'
  const [dnsTab, setDnsTab] = useState("standard");

  const dnsRecords = {
    standard: [
      { type: "A", host: "@", value: "216.24.57.1" },
      { type: "CNAME", host: "www", value: "base44.onrender.com" },
    ],
    alias: [
      { type: "CNAME", host: "em", value: "u108699198.wl199.sendgrid.net" },
      { type: "CNAME", host: "s1", value: "s1.domainkey.u108699198.wl199.sendgrid.net" },
      { type: "CNAME", host: "s2", value: "s2.domainkey.u108699198.wl199.sendgrid.net" },
    ],
  };

  const copyField = async (field, value) => {
    try { await navigator.clipboard.writeText(value); } catch (_) {}
    setCopiedField(field);
    setTimeout(() => setCopiedField(""), 1600);
  };

  const handleVerify = () => {
    setVerifyStatus("verifying");
    setTimeout(() => setVerifyStatus("success"), 1800);
  };

  const copyFreeUrl = async () => {
    try { await navigator.clipboard.writeText("mybytly.base44.app"); } catch (_) {}
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  const addRedirect = () => {
    if (!redirectPath.trim()) return;
    setRedirects(prev => [...prev, { path: redirectPath.trim(), createdAt: new Date().toLocaleDateString("ar-SA") }]);
    setRedirectPath("");
    setDialog(null);
  };

  return (
    <div dir={isRTL ? "rtl" : "rtl"} className="min-h-screen bg-white text-[#3f3a36]">
      <div className="max-w-6xl mx-auto px-6 md:px-10 py-9">
        {/* Header */}
        <div className="mb-7">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-[#f5f2ed] flex items-center justify-center">
              <Globe2 className="w-5 h-5 text-[#6B5D4F]" />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">النطاقات</h1>
          </div>
          <p className="text-sm text-slate-500 mr-[52px]">اعرف المزيد عن نطاقاتك وبريدك الإلكتروني، وقم بتوصيلها وإدارتها.</p>
        </div>

        <div className="space-y-5">
          {/* Free URL */}
          <section className="rounded-xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(0,0,0,.03)] overflow-hidden">
            <div className="px-6 py-5 flex items-center justify-between gap-4 border-b border-slate-100">
              <div>
                <h2 className="font-semibold text-base">رابط مجاني</h2>
                <p className="text-xs text-slate-500 mt-1">قم بتخصيص عنوان URL المجاني الذي يمكن للمستخدمين استخدامه قبل ربط نطاق مخصص.</p>
              </div>
              <Button variant="outline" className="shrink-0 text-xs h-9" onClick={() => setDialog("free-url")}>تعديل عنوان URL</Button>
            </div>
            <div className="p-5">
              <div className="flex items-center gap-2">
                <Input readOnly value="mybytly.base44.app" className="h-10 bg-slate-50 text-sm" />
                <Button variant="outline" size="icon" className="h-10 w-10 shrink-0" onClick={copyFreeUrl} title="نسخ الرابط">
                  {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          </section>

          {/* Custom domains */}
          <section className="rounded-xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(0,0,0,.03)] overflow-hidden">
            <div className="px-6 py-5 flex items-center justify-between gap-4">
              <h2 className="font-semibold text-base">النطاقات المخصصة</h2>
              <div className="flex items-center gap-2">
                <Button variant="outline" className="h-9 text-xs" onClick={() => setDialog("connect")}>ربط النطاق الحالي</Button>
                <Button className="h-9 text-xs bg-[#4a4642] hover:bg-[#3d3935] text-white" onClick={() => setDialog("purchase")}><ShoppingCart className="w-3.5 h-3.5 ml-1.5" />شراء نطاق</Button>
              </div>
            </div>
            <div className="px-6 pb-5">
              <div className="rounded-lg border border-slate-100 bg-slate-50/50 px-4 py-4 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm">{DOMAIN}</span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px]"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />نشط</span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-50 text-orange-700 text-[11px]">نطاق Base44</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">تنتهي صلاحيتها خلال 167 يوماً</p>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => setDialog("domain-actions")}><MoreHorizontal className="w-4 h-4" /></Button>
              </div>
            </div>
          </section>

          {/* Redirects */}
          <section className="rounded-xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(0,0,0,.03)] overflow-hidden">
            <div className="px-6 py-5 flex items-center justify-between gap-4">
              <div>
                <h2 className="font-semibold text-base">إعادة توجيه الصفحة</h2>
                <p className="text-xs text-slate-500 mt-1">قم بإعادة توجيه عناوين الصفحات القديمة إلى عناوين جديدة.</p>
              </div>
              <Button className="h-9 text-xs bg-[#4a4642] hover:bg-[#3d3935] text-white" onClick={() => setDialog("redirect")}><Plus className="w-3.5 h-3.5 ml-1.5" />إضافة إعادة توجيه</Button>
            </div>
            <div className="px-6 pb-5">
              {redirects.length === 0 ? (
                <p className="text-xs text-slate-400 py-1">لا توجد عمليات إعادة توجيه حتى الآن. أضف واحدة بعد إعادة تسمية الصفحة.</p>
              ) : redirects.map((r, i) => (
                <div key={i} className="border-t border-slate-100 py-3 flex items-center justify-between text-sm">
                  <span>{r.path}</span><span className="text-xs text-slate-400">تمت الإضافة {r.createdAt}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Email sender */}
          <section className="rounded-xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(0,0,0,.03)] overflow-hidden">
            <div className="px-6 py-5">
              <h2 className="font-semibold text-base">رسائل البريد الإلكتروني</h2>
            </div>
            <div className="px-6 pb-5">
              <div className="rounded-lg border border-slate-100 bg-white px-4 py-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center shrink-0"><Mail className="w-4 h-4 text-slate-600" /></div>
                  <div className="min-w-0">
                    <p className="text-xs text-slate-500 mb-1">عنوان الإرسال</p>
                    <div className="flex items-center gap-2 flex-wrap"><span className="text-sm font-medium">{sender}</span><span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px]"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />نشط</span></div>
                    <p className="text-xs text-slate-500 mt-1">اسم المرسل: {senderName}</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => setDialog("sender")}><MoreHorizontal className="w-4 h-4" /></Button>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Dialogs */}
      <Dialog open={!!dialog} onOpenChange={(open) => !open && setDialog(null)}>
        <DialogContent dir="rtl" className={dialog === "dns-instructions" ? "sm:max-w-lg" : "sm:max-w-md"}>
          {dialog === "purchase" && <>
            <DialogHeader><DialogTitle>شراء نطاق</DialogTitle><DialogDescription>اختر شركة تسجيل النطاقات التي تريد استخدامها. سيتم فتح موقع الشركة في تبويب جديد لإكمال البحث والشراء.</DialogDescription></DialogHeader>
            <div className="grid gap-3">
              <a href="https://onswebhost.com/domain-names/" target="_blank" rel="noopener noreferrer" onClick={() => setDialog(null)} className="rounded-xl border border-slate-200 p-4 hover:border-[#6B5D4F] hover:bg-slate-50 transition flex items-center justify-between gap-4">
                <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center"><Globe2 className="w-5 h-5 text-[#6B5D4F]" /></div><div><p className="text-sm font-semibold">ONS Technologies</p><p className="text-xs text-slate-500 mt-1">شراء وإدارة النطاقات</p></div></div><span className="text-xs text-slate-400">فتح الموقع ↗</span>
              </a>
              <a href="https://www.godaddy.com/domains" target="_blank" rel="noopener noreferrer" onClick={() => setDialog(null)} className="rounded-xl border border-slate-200 p-4 hover:border-[#6B5D4F] hover:bg-slate-50 transition flex items-center justify-between gap-4">
                <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center"><ShoppingCart className="w-5 h-5 text-[#6B5D4F]" /></div><div><p className="text-sm font-semibold">GoDaddy</p><p className="text-xs text-slate-500 mt-1">البحث عن نطاق وشراؤه</p></div></div><span className="text-xs text-slate-400">فتح الموقع ↗</span>
              </a>
            </div>
            <DialogFooter><Button variant="outline" onClick={() => setDialog(null)}>إلغاء</Button></DialogFooter>
          </>}
          {dialog === "connect" && <>
            <DialogHeader><DialogTitle>ربط النطاق الحالي</DialogTitle><DialogDescription>أدخل النطاق الذي تملكه بالفعل لربطه بمنصة بيتلي.</DialogDescription></DialogHeader>
            <Input placeholder="example.com" value={connectedDomain} onChange={e => setConnectedDomain(e.target.value)} />
            <div className="text-xs text-slate-500 flex items-center gap-2"><ShieldCheck className="w-4 h-4" />بعد الربط ستحتاج إلى تحديث سجلات DNS لدى مزود النطاق.</div>
            <DialogFooter><Button variant="outline" onClick={() => setDialog(null)}>إلغاء</Button><Button disabled={!connectedDomain.trim()} className="bg-[#4a4642] text-white" onClick={() => setDialog(null)}>ربط النطاق</Button></DialogFooter>
          </>}
          {dialog === "redirect" && <>
            <DialogHeader><DialogTitle>إضافة إعادة توجيه</DialogTitle><DialogDescription>حدد المسار القديم الذي تريد توجيهه إلى الصفحة الجديدة.</DialogDescription></DialogHeader>
            <Input placeholder="/الصفحة-القديمة" value={redirectPath} onChange={e => setRedirectPath(e.target.value)} />
            <DialogFooter><Button variant="outline" onClick={() => setDialog(null)}>إلغاء</Button><Button disabled={!redirectPath.trim()} className="bg-[#4a4642] text-white" onClick={addRedirect}>إضافة إعادة توجيه</Button></DialogFooter>
          </>}
          {dialog === "sender" && <>
            <DialogHeader><DialogTitle>عنوان الإرسال</DialogTitle><DialogDescription>إدارة عنوان البريد واسم المرسل المستخدمين في رسائل المنصة.</DialogDescription></DialogHeader>
            <div className="space-y-3"><div><label className="text-xs text-slate-500">عنوان البريد</label><Input value={sender} onChange={e => setSender(e.target.value)} /></div><div><label className="text-xs text-slate-500">اسم المرسل</label><Input value={senderName} onChange={e => setSenderName(e.target.value)} /></div></div>
            <DialogFooter><Button variant="outline" onClick={() => setDialog(null)}>إلغاء</Button><Button className="bg-[#4a4642] text-white" onClick={() => setDialog(null)}>حفظ</Button></DialogFooter>
          </>}
          {dialog === "free-url" && <>
            <DialogHeader><DialogTitle>تعديل عنوان URL</DialogTitle><DialogDescription>خصص الرابط المجاني الذي يظهر للمستخدمين قبل ربط نطاقك الخاص.</DialogDescription></DialogHeader>
            <Input defaultValue="mybytly" /><DialogFooter><Button variant="outline" onClick={() => setDialog(null)}>إلغاء</Button><Button className="bg-[#4a4642] text-white" onClick={() => setDialog(null)}>حفظ</Button></DialogFooter>
          </>}
          {dialog === "domain-actions" && <>
            <DialogHeader><DialogTitle>إدارة {DOMAIN}</DialogTitle><DialogDescription>خيارات إدارة النطاق المتصل بالمنصة.</DialogDescription></DialogHeader>
            <div className="grid gap-2">
              <Button variant="outline" className="justify-start" onClick={() => { setVerifyStatus(null); setDialog("dns-instructions"); }}><ShieldCheck className="w-4 h-4 ml-2" />تحقق من النطاق</Button>
              <Button variant="outline" className="justify-start" onClick={() => { setVerifyStatus(null); setDialog("dns-instructions"); }}><BookOpen className="w-4 h-4 ml-2" />تعليمات نظام أسماء النطاقات DNS</Button>
              <Button variant="outline" className="justify-start text-red-600 hover:text-red-700" onClick={() => setDialog("delete-domain")}><Trash2 className="w-4 h-4 ml-2" />حذف النطاق</Button>
            </div>
          </>}
          {dialog === "dns-instructions" && <>
            <DialogHeader className="text-right">
              <DialogTitle className="text-xl font-semibold">قم بربط نطاقك من خلال مزود خدمة نظام أسماء النطاقات (DNS) الخاص بك</DialogTitle>
              <DialogDescription className="text-sm leading-6">اتبع التعليمات أدناه لتكوين سجلات نظام أسماء النطاقات (DNS).</DialogDescription>
            </DialogHeader>

            <div className="-mx-6 border-t border-slate-100">
              <div className="px-6 flex items-end gap-8 border-b border-slate-200">
                <button
                  type="button"
                  onClick={() => setDnsTab("alias")}
                  className={`relative py-3 text-sm font-medium transition-colors ${dnsTab === "alias" ? "text-[#3f3a36]" : "text-slate-500 hover:text-slate-700"}`}
                >
                  الاسم المستعار
                  {dnsTab === "alias" && <span className="absolute bottom-0 right-0 left-0 h-0.5 bg-[#4a4642]" />}
                </button>
                <button
                  type="button"
                  onClick={() => setDnsTab("standard")}
                  className={`relative py-3 text-sm font-medium transition-colors ${dnsTab === "standard" ? "text-[#3f3a36]" : "text-slate-500 hover:text-slate-700"}`}
                >
                  رقم قياسي
                  {dnsTab === "standard" && <span className="absolute bottom-0 right-0 left-0 h-0.5 bg-[#4a4642]" />}
                </button>
              </div>
            </div>

            <div className="space-y-4 max-h-[52vh] overflow-y-auto pr-1">
              <p className="text-sm leading-7 text-slate-600">1. أضف هذه السجلات إلى لوحة تحكم مزود الخدمة الخاص بك لإكمال الإعداد:</p>

              <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                <div className="grid grid-cols-[1fr_1fr_2fr] border-b border-slate-200 bg-slate-50/70 text-sm font-medium text-slate-600">
                  <div className="px-4 py-3">يكتب</div>
                  <div className="px-4 py-3">يستضيف</div>
                  <div className="px-4 py-3">قيمة</div>
                </div>
                {dnsRecords[dnsTab].map((record, index) => (
                  <div key={`${dnsTab}-${index}`} className="grid grid-cols-[1fr_1fr_2fr] items-center border-b border-slate-100 last:border-b-0 text-sm">
                    <div className="px-4 py-3 font-medium text-slate-700">{record.type}</div>
                    <div className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="min-w-0 truncate rounded-md bg-slate-50 px-2 py-1 font-mono text-sm text-slate-700">{record.host}</span>
                        <button type="button" className="shrink-0 text-slate-400 hover:text-slate-700" onClick={() => copyField(`host-${index}`, record.host)} title="نسخ">
                          {copiedField === `host-${index}` ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                    <div className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="min-w-0 flex-1 truncate rounded-md bg-slate-50 px-2 py-1 font-mono text-sm text-slate-700" title={record.value}>{record.value}</span>
                        <button type="button" className="shrink-0 text-slate-400 hover:text-slate-700" onClick={() => copyField(`value-${index}`, record.value)} title="نسخ">
                          {copiedField === `value-${index}` ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-2 text-sm leading-7 text-slate-600">
                <p>• تأكد من إزالة أي سجلات AAAA (IPv6)، لأنها قد تحظر الاتصالات.</p>
                <p>2. تحقق من النطاق بعد تحديث جميع السجلات في لوحة تحكم مزود الخدمة. انقر على "تحقق من النطاق". قد تستغرق تغييرات نظام أسماء النطاقات (DNS) ما يصل إلى 48-78 ساعة حتى يتم نشرها.</p>
                <p>يرجى ملاحظة أنه بعد إضافة سجلات نظام أسماء النطاقات (DNS)، قد يستغرق الأمر بعض الوقت حتى تنتشر التغييرات بالكامل عبر الإنترنت. خلال هذه الفترة، قد لا يعمل النطاق بشكل صحيح.</p>
              </div>

              {verifyStatus === "verifying" && (
                <div className="flex items-center gap-2 text-xs text-slate-500"><div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-slate-300 border-t-[#6B5D4F]" />جارٍ التحقق من السجلات...</div>
              )}
              {verifyStatus === "success" && (
                <div className="flex items-center gap-2 text-xs text-emerald-600"><CheckCircle2 className="h-4 w-4" />تم التحقق من النطاق بنجاح.</div>
              )}
            </div>

            <DialogFooter className="gap-2 border-t border-slate-100 pt-4 sm:justify-start">
              <Button variant="outline" onClick={() => setDialog(null)}>يغلق</Button>
              <Button className="bg-[#4a4642] text-white hover:bg-[#3d3935]" disabled={verifyStatus === "verifying"} onClick={handleVerify}>تحقق من النطاق</Button>
            </DialogFooter>
          </>}
          {dialog === "delete-domain" && <>
            <DialogHeader><DialogTitle className="flex items-center gap-2 text-red-600"><Trash2 className="w-5 h-5" />حذف النطاق</DialogTitle><DialogDescription>سيؤدي حذف النطاق إلى إلغاء ربطه بالمنصة. لن يتم حذف النطاق نفسه من مزود التسجيل.</DialogDescription></DialogHeader>
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-xs text-red-700 flex items-start gap-2"><FileText className="w-4 h-4 mt-0.5 shrink-0" />سيستمر المستخدمون في الوصول عبر الرابط المجاني mybytly.base44.app بعد الحذف.</div>
            <DialogFooter className="gap-2 sm:gap-2"><Button variant="outline" onClick={() => setDialog(null)}>إلغاء</Button><Button variant="destructive" className="bg-red-600 hover:bg-red-700" onClick={() => setDialog(null)}><Trash2 className="w-4 h-4 ml-1.5" />حذف النطاق</Button></DialogFooter>
          </>}
        </DialogContent>
      </Dialog>
    </div>
  );
}