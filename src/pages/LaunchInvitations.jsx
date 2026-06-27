import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Mail, Send, Users, CheckCircle, XCircle, Loader2, Rocket, UploadCloud, FileSpreadsheet, Shuffle, HardHat } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useLanguage } from "@/components/i18n/LanguageContext";

export default function LaunchInvitations() {
  const { t, isRTL } = useLanguage();
  const [surveyRespondents, setSurveyRespondents] = useState([]);
  const [engineers, setEngineers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmails, setSelectedEmails] = useState([]);
  const [manualEmails, setManualEmails] = useState("");
  const [randomCount, setRandomCount] = useState(10);
  const [subject, setSubject] = useState("🚀 انطلقت منصة بيتلي – كن من أوائل المهندسين المستخدمين!");
  const [body, setBody] = useState(
    `مرحباً بك،\n\nنحن متحمسون لإخبارك بأن منصة بيتلي – لمسة بيت قد أطلقت رسمياً في مرحلتها التجريبية!\n\nبيتلي هي أول منصة هندسية ذكية في المملكة العربية السعودية تربطك مباشرة بالعملاء الباحثين عن خبراتك الهندسية.\n\n✨ لماذا تنضم الآن؟\n- كن من أوائل المهندسين المعتمدين على المنصة\n- احصل على أولوية الظهور في نتائج البحث\n- أسعار خاصة للمستخدمين الأوائل\n- دعم مباشر من فريقنا\n- وصول مبكر للميزات الجديدة\n\nسجّل الدخول الآن وأكمل ملفك المهني:\nhttps://mybytly.com\n\nنتطلع لرؤيتك ضمن عائلة بيتلي!\n\nفريق بيتلي – لمسة بيت`
  );
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);
  const [csvPreview, setCsvPreview] = useState([]);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const fileInputRef = useRef(null);

  const parseCSV = (text) => {
    const lines = text.split(/\r?\n/).filter(l => l.trim());
    if (lines.length === 0) return [];
    const splitLine = (line) => {
      const cells = [];
      let cur = "";
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') { inQuotes = !inQuotes; continue; }
        if (ch === "," && !inQuotes) { cells.push(cur.trim()); cur = ""; continue; }
        cur += ch;
      }
      cells.push(cur.trim());
      return cells;
    };
    const header = splitLine(lines[0]).map(h => h.toLowerCase());
    const emailIdx = header.findIndex(h => h.includes("email") || h.includes("بريد") || h.includes("e-mail"));
    const nameIdx = header.findIndex(h => h.includes("name") || h.includes("اسم") || h.includes("first"));
    const phoneIdx = header.findIndex(h => h.includes("phone") || h.includes("هاتف") || h.includes("mobile"));
    const hasHeader = emailIdx >= 0;
    const rows = hasHeader ? lines.slice(1) : lines;
    return rows.map(line => {
      const cells = splitLine(line);
      const email = hasHeader ? cells[emailIdx] : cells.find(c => c.includes("@"));
      const name = hasHeader && nameIdx >= 0 ? cells[nameIdx] : (email ? email.split("@")[0] : "");
      const phone = hasHeader && phoneIdx >= 0 ? cells[phoneIdx] : "";
      return { name: name || "", email: email || "", phone: phone || "" };
    }).filter(r => r.email && r.email.includes("@"));
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportResult(null);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const contacts = parseCSV(ev.target.result);
      setCsvPreview(contacts);
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (csvPreview.length === 0) return;
    setImporting(true);
    setImportResult(null);
    try {
      const leads = csvPreview.map(c => ({
        name: c.name || c.email.split("@")[0],
        email: c.email,
        phone: c.phone || undefined,
        source: "linkedin",
        status: "new",
        notes: "مستورد من ملف CSV لدعوة الإطلاق التجريبي"
      }));
      const created = await base44.entities.Lead.bulkCreate(leads);
      const emails = csvPreview.map(c => c.email);
      setSelectedEmails(prev => [...new Set([...prev, ...emails])]);
      setImportResult({ success: true, count: Array.isArray(created) ? created.length : csvPreview.length });
      setCsvPreview([]);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err) {
      setImportResult({ error: err.message });
    }
    setImporting(false);
  };

  useEffect(() => {
    const loadRespondents = async () => {
      try {
        const [responses, engList] = await Promise.all([
          base44.entities.SurveyResponse.list("-created_date", 500),
          base44.entities.Engineer.list("-created_date", 500),
        ]);
        const withEmail = (responses || []).filter(r => r.respondent_email);
        setSurveyRespondents(withEmail);
        const engWithValidEmail = (engList || []).filter(e => e.email && e.email.includes("@"));
        setEngineers(engWithValidEmail);
      } catch (e) {
        console.error("Error loading data:", e);
      }
      setLoading(false);
    };
    loadRespondents();
  }, []);

  const selectRandomEngineers = () => {
    const pool = engineers.filter(e => e.email);
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    const count = Math.min(randomCount, shuffled.length);
    const randomPicks = shuffled.slice(0, count).map(e => e.email);
    setSelectedEmails(prev => [...new Set([...prev, ...randomPicks])]);
  };

  const selectAllEngineers = () => {
    setSelectedEmails(prev => [...new Set([...prev, ...engineers.map(e => e.email)])]);
  };

  const toggleEmail = (email) => {
    setSelectedEmails(prev =>
      prev.includes(email) ? prev.filter(e => e !== email) : [...prev, email]
    );
  };

  const selectAllInterested = () => {
    const interested = surveyRespondents
      .filter(r => r.platform_interest === "very_interested" || r.platform_interest === "interested")
      .map(r => r.respondent_email);
    setSelectedEmails(interested);
  };

  const allRecipients = () => {
    const manual = manualEmails
      .split(/[\n,;]/)
      .map(e => e.trim())
      .filter(e => e && e.includes("@"));
    return [...new Set([...selectedEmails, ...manual])];
  };

  const handleSend = async () => {
    const recipients = allRecipients();
    if (recipients.length === 0) {
      alert("يرجى اختيار مستلم واحد على الأقل");
      return;
    }
    setSending(true);
    setResult(null);
    try {
      const res = await base44.functions.invoke("sendLaunchInvitation", {
        recipients,
        subject,
        body,
        from_name: "بيتلي - لمسة بيت"
      });
      setResult(res.data);
    } catch (err) {
      setResult({ error: err.message });
    }
    setSending(false);
  };

  const recipients = allRecipients();

  return (
    <div className="min-h-screen bg-slate-50" dir={isRTL ? "rtl" : "ltr"}>
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#6B5D4F] to-[#C9A66B] flex items-center justify-center shrink-0">
            <Rocket className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#4A3F35]">دعوات الإطلاق التجريبي</h1>
            <p className="text-sm text-slate-500 mt-0.5">أرسل دعوات بريد إلكتروني لاستقطاب أوائل المستخدمين</p>
          </div>
        </div>

        {/* Recipients from Survey */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold text-[#4A3F35] flex items-center gap-2">
                <Users className="w-4 h-4" />
                المستجيبون للاستطلاع ({surveyRespondents.length})
              </CardTitle>
              <Button variant="outline" size="sm" onClick={selectAllInterested} disabled={loading}>
                اختيار المهتمين
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading
              ? <div className="h-24 bg-slate-100 rounded animate-pulse" />
              : surveyRespondents.length === 0
                ? <p className="text-slate-400 text-sm text-center py-6">لا يوجد مستجيبون ببريد إلكتروني بعد</p>
                : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {surveyRespondents.map((r) => (
                      <label key={r.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedEmails.includes(r.respondent_email)}
                          onChange={() => toggleEmail(r.respondent_email)}
                          className="w-4 h-4 accent-[#C9A66B]"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[#4A3F35] truncate">
                            {r.respondent_name || r.respondent_email}
                          </p>
                          <p className="text-xs text-slate-400 truncate">{r.respondent_email}</p>
                        </div>
                        {r.platform_interest && (
                          <Badge variant="outline" className="text-xs shrink-0">
                            {r.platform_interest === "very_interested" ? "مهتم جداً"
                             : r.platform_interest === "interested" ? "مهتم"
                             : r.platform_interest === "maybe" ? "ربما"
                             : "غير مهتم"}
                          </Badge>
                        )}
                      </label>
                    ))}
                  </div>
                )
            }
          </CardContent>
        </Card>

        {/* Engineers on the Platform */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CardTitle className="text-sm font-semibold text-[#4A3F35] flex items-center gap-2">
                <HardHat className="w-4 h-4 text-[#C9A66B]" />
                المهندسون المسجّلون ({engineers.length})
              </CardTitle>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min="1"
                  max={engineers.length}
                  value={randomCount}
                  onChange={(e) => setRandomCount(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-20 h-8 text-xs"
                  dir="ltr"
                />
                <Button variant="outline" size="sm" onClick={selectRandomEngineers} disabled={loading || engineers.length === 0}>
                  <Shuffle className="w-3.5 h-3.5 ml-1" />
                  اختيار عشوائي
                </Button>
                <Button variant="ghost" size="sm" onClick={selectAllEngineers} disabled={loading || engineers.length === 0}>
                  تحديد الكل
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading
              ? <div className="h-24 bg-slate-100 rounded animate-pulse" />
              : engineers.length === 0
                ? <p className="text-slate-400 text-sm text-center py-6">لا يوجد مهندسون مسجّلون بعد</p>
                : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {engineers.map((eng) => (
                      <label key={eng.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedEmails.includes(eng.email)}
                          onChange={() => toggleEmail(eng.email)}
                          className="w-4 h-4 accent-[#C9A66B]"
                        />
                        <Avatar className="w-8 h-8 shrink-0">
                          <AvatarImage src={eng.profile_image} />
                          <AvatarFallback className="bg-gradient-to-br from-[#6B5D4F] to-[#C9A66B] text-white text-xs">
                            {eng.full_name?.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[#4A3F35] truncate">
                            {eng.full_name || eng.email}
                          </p>
                          <p className="text-xs text-slate-400 truncate">{eng.email}</p>
                        </div>
                        {eng.status === "approved" && (
                          <Badge className="bg-green-50 text-green-700 text-xs shrink-0">معتمد</Badge>
                        )}
                        {eng.specialization && (
                          <Badge variant="outline" className="text-xs shrink-0 hidden sm:inline-flex">{eng.specialization}</Badge>
                        )}
                      </label>
                    ))}
                  </div>
                )
            }
          </CardContent>
        </Card>

        {/* CSV Import from LinkedIn */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-[#4A3F35] flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4" />
              استيراد جهات اتصال من ملف CSV (LinkedIn)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-slate-500 leading-relaxed">
              صدّر جهات اتصالك من LinkedIn عبر: الإعدادات ← الخصوصية ← تصدير بيانات LinkedIn، ثم ارفع الملف هنا.
              سيتم استيرادها كعملاء محتملين وإضافتها تلقائياً لقائمة المستلمين.
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              onChange={handleFileChange}
              className="hidden"
            />
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="w-full border-dashed border-2 border-[#C9A66B]/40 hover:border-[#C9A66B] hover:bg-amber-50/50"
            >
              <UploadCloud className="w-4 h-4 ml-2" />
              اختيار ملف CSV
            </Button>

            {csvPreview.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">{csvPreview.length} جهة اتصال في الملف</span>
                  <Button size="sm" onClick={handleImport} disabled={importing}
                    className="bg-gradient-to-r from-[#6B5D4F] to-[#C9A66B] text-white">
                    {importing
                      ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> جارٍ الاستيراد...</>
                      : "استيراد وإضافة للقائمة"}
                  </Button>
                </div>
                <div className="max-h-40 overflow-y-auto rounded-lg border border-slate-100 divide-y divide-slate-50">
                  {csvPreview.slice(0, 50).map((c, i) => (
                    <div key={i} className="flex items-center justify-between px-3 py-1.5 text-xs">
                      <span className="font-medium text-[#4A3F35] truncate">{c.name || c.email}</span>
                      <span className="text-slate-400 truncate">{c.email}</span>
                    </div>
                  ))}
                  {csvPreview.length > 50 && (
                    <div className="px-3 py-1.5 text-xs text-slate-400 text-center">+{csvPreview.length - 50} أخرى</div>
                  )}
                </div>
              </div>
            )}

            {importResult && (
              <div className={`flex items-center gap-2 text-sm p-2 rounded-lg ${importResult.error ? "bg-red-50 text-red-600" : "bg-green-50 text-green-600"}`}>
                {importResult.error
                  ? <><XCircle className="w-4 h-4" /> {importResult.error}</>
                  : <><CheckCircle className="w-4 h-4" /> تم استيراد {importResult.count} عميل محتمل وإضافتهم للقائمة</>
                }
              </div>
            )}
          </CardContent>
        </Card>

        {/* Manual Emails */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-[#4A3F35]">إضافة بريد إلكتروني يدوياً</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="أدخل البريد الإلكتروني، افصل بينها بفاصلة أو سطر جديد"
              value={manualEmails}
              onChange={(e) => setManualEmails(e.target.value)}
              rows={3}
            />
          </CardContent>
        </Card>

        {/* Email Composition */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-[#4A3F35] flex items-center gap-2">
              <Mail className="w-4 h-4" />
              محتوى الرسالة
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label className="text-xs">عنوان الرسالة</Label>
              <Input value={subject} onChange={(e) => setSubject(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">نص الرسالة</Label>
              <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={12} className="mt-1" />
            </div>
          </CardContent>
        </Card>

        {/* Send Bar */}
        <div className="sticky bottom-4 bg-white rounded-xl shadow-lg border border-slate-200 p-4 flex items-center justify-between gap-3">
          <div className="text-sm">
            <span className="font-semibold text-[#4A3F35]">{recipients.length}</span>
            <span className="text-slate-500"> مستلم محدد</span>
          </div>
          <Button
            onClick={handleSend}
            disabled={sending || recipients.length === 0}
            className="bg-gradient-to-r from-[#6B5D4F] to-[#C9A66B] text-white"
          >
            {sending
              ? <><Loader2 className="w-4 h-4 animate-spin" /> جارٍ الإرسال...</>
              : <><Send className="w-4 h-4" /> إرسال الدعوات</>
            }
          </Button>
        </div>

        {/* Results */}
        {result && (
          <Card className={result.error ? "border-red-300" : "border-green-300"}>
            <CardContent className="p-4">
              {result.error ? (
                <div className="flex items-center gap-2 text-red-600">
                  <XCircle className="w-5 h-5" />
                  <span className="text-sm">خطأ: {result.error}</span>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="w-5 h-5" />
                    <span className="text-sm font-semibold">تم الإرسال بنجاح</span>
                  </div>
                  <div className="flex gap-4 text-sm">
                    <span className="text-green-600">✓ تم إرسال: {result.sent}</span>
                    {result.failed > 0 && <span className="text-red-500">✗ فشل: {result.failed}</span>}
                  </div>
                  {result.results?.filter(r => !r.success).length > 0 && (
                    <div className="text-xs text-red-500 mt-2">
                      {result.results.filter(r => !r.success).map(r => `${r.email}: ${r.error}`).join("، ")}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}