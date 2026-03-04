import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Sparkles, Mail, Calendar, Send, Tag, Clock, Copy, CheckCircle } from "lucide-react";
import { toast } from "sonner";

// ── helpers ──────────────────────────────────────────────────────────────────
const CATEGORY_COLORS = {
  project_update:  "bg-blue-100 text-blue-800",
  proposal:        "bg-purple-100 text-purple-800",
  payment:         "bg-green-100 text-green-800",
  complaint:       "bg-red-100 text-red-800",
  inquiry:         "bg-amber-100 text-amber-800",
  contract:        "bg-indigo-100 text-indigo-800",
  spam:            "bg-slate-100 text-slate-600",
  other:           "bg-gray-100 text-gray-700",
};

const CATEGORY_LABELS = {
  project_update: "تحديث مشروع",
  proposal:       "عرض سعر",
  payment:        "دفع / فاتورة",
  complaint:      "شكوى",
  inquiry:        "استفسار",
  contract:       "عقد",
  spam:           "بريد مزعج",
  other:          "أخرى",
};

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("تم النسخ ✓");
  };
  return (
    <button onClick={copy} className="p-1.5 hover:bg-slate-100 rounded transition-colors">
      {copied ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-slate-400" />}
    </button>
  );
}

// ── Tab 1: Email Categorizer ──────────────────────────────────────────────────
function EmailCategorizer() {
  const [subject, setSubject]   = useState("");
  const [body, setBody]         = useState("");
  const [loading, setLoading]   = useState(false);
  const [result, setResult]     = useState(null);

  const analyze = async () => {
    if (!subject && !body) { toast.error("أدخل موضوع أو محتوى البريد"); return; }
    setLoading(true);
    setResult(null);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `صنّف هذا البريد الإلكتروني وحلله بدقة.

الموضوع: ${subject}
المحتوى: ${body}

أعد JSON بهذا الشكل فقط:
{
  "category": "project_update|proposal|payment|complaint|inquiry|contract|spam|other",
  "priority": "low|medium|high|urgent",
  "sentiment": "positive|neutral|negative",
  "summary": "ملخص قصير بالعربية (جملة واحدة)",
  "key_points": ["نقطة 1", "نقطة 2", "نقطة 3"],
  "suggested_action": "الإجراء المقترح بالعربية",
  "requires_response": true|false,
  "response_deadline_hours": 24
}`,
        response_json_schema: {
          type: "object",
          properties: {
            category:               { type: "string" },
            priority:               { type: "string" },
            sentiment:              { type: "string" },
            summary:                { type: "string" },
            key_points:             { type: "array", items: { type: "string" } },
            suggested_action:       { type: "string" },
            requires_response:      { type: "boolean" },
            response_deadline_hours:{ type: "number" },
          }
        }
      });
      setResult(res);
    } catch (e) { toast.error("فشل التحليل: " + e.message); }
    finally { setLoading(false); }
  };

  const priorityColor = { low: "bg-slate-100 text-slate-600", medium: "bg-yellow-100 text-yellow-700", high: "bg-orange-100 text-orange-700", urgent: "bg-red-100 text-red-700" };
  const sentimentIcon = { positive: "😊", neutral: "😐", negative: "😟" };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Tag className="w-4 h-4 text-blue-500" />
            تصنيف البريد الإلكتروني تلقائياً
          </CardTitle>
          <p className="text-xs text-slate-500">الصق محتوى أي بريد وسيقوم الذكاء الاصطناعي بتصنيفه وتحليله</p>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input placeholder="موضوع البريد..." value={subject} onChange={e => setSubject(e.target.value)} />
          <Textarea placeholder="محتوى البريد الإلكتروني..." rows={5} value={body} onChange={e => setBody(e.target.value)} />
          <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white" onClick={analyze} disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : <Sparkles className="w-4 h-4 ml-2" />}
            تحليل وتصنيف
          </Button>
        </CardContent>
      </Card>

      {result && (
        <Card className="border-blue-200 bg-blue-50/30">
          <CardContent className="pt-4 space-y-4">
            {/* Top badges */}
            <div className="flex flex-wrap gap-2">
              <Badge className={CATEGORY_COLORS[result.category] || "bg-gray-100"}>
                {CATEGORY_LABELS[result.category] || result.category}
              </Badge>
              <Badge className={priorityColor[result.priority] || "bg-slate-100"}>
                {result.priority === 'urgent' ? '🚨 عاجل' : result.priority === 'high' ? '🔴 مرتفع' : result.priority === 'medium' ? '🟡 متوسط' : '🟢 منخفض'}
              </Badge>
              <Badge variant="outline">{sentimentIcon[result.sentiment]} {result.sentiment === 'positive' ? 'إيجابي' : result.sentiment === 'negative' ? 'سلبي' : 'محايد'}</Badge>
              {result.requires_response && (
                <Badge className="bg-purple-100 text-purple-700">⏰ يتطلب رداً خلال {result.response_deadline_hours} ساعة</Badge>
              )}
            </div>

            {/* Summary */}
            <div className="bg-white rounded-lg p-3 border">
              <p className="text-xs font-semibold text-slate-500 mb-1">الملخص</p>
              <p className="text-sm text-slate-800">{result.summary}</p>
            </div>

            {/* Key points */}
            {result.key_points?.length > 0 && (
              <div className="bg-white rounded-lg p-3 border">
                <p className="text-xs font-semibold text-slate-500 mb-2">النقاط الرئيسية</p>
                <ul className="space-y-1">
                  {result.key_points.map((pt, i) => (
                    <li key={i} className="text-sm text-slate-700 flex items-start gap-2">
                      <span className="text-blue-400 mt-0.5">•</span>{pt}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Suggested action */}
            <div className="bg-amber-50 rounded-lg p-3 border border-amber-200">
              <p className="text-xs font-semibold text-amber-700 mb-1">💡 الإجراء المقترح</p>
              <p className="text-sm text-amber-800">{result.suggested_action}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ── Tab 2: Smart Meeting Scheduler ───────────────────────────────────────────
function SmartScheduler() {
  const [form, setForm] = useState({
    meetingTitle:    "",
    participants:    "",
    duration:        "60",
    preferredTime:   "morning",
    meetingType:     "project_review",
    notes:           "",
  });
  const [loading, setLoading]   = useState(false);
  const [result, setResult]     = useState(null);

  const suggest = async () => {
    if (!form.meetingTitle || !form.participants) { toast.error("أدخل عنوان الاجتماع والمشاركين"); return; }
    setLoading(true);
    setResult(null);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `أنت مساعد جدولة ذكي لشركة Bytly للخدمات الهندسية في السعودية.

اقترح أفضل أوقات الاجتماع بناءً على:
- عنوان الاجتماع: ${form.meetingTitle}
- المشاركون: ${form.participants}
- مدة الاجتماع: ${form.duration} دقيقة
- الوقت المفضل: ${form.preferredTime === 'morning' ? 'صباحاً (9-12)' : form.preferredTime === 'afternoon' ? 'بعد الظهر (1-5)' : 'مساءً (5-8)'}
- نوع الاجتماع: ${form.meetingType}
${form.notes ? `- ملاحظات: ${form.notes}` : ''}

أعد JSON بهذا الشكل:
{
  "suggested_slots": [
    { "day": "الأحد", "date_offset_days": 1, "time": "10:00 AM", "reason": "سبب الاقتراح" },
    { "day": "الاثنين", "date_offset_days": 2, "time": "2:00 PM", "reason": "سبب الاقتراح" },
    { "day": "الثلاثاء", "date_offset_days": 3, "time": "11:00 AM", "reason": "سبب الاقتراح" }
  ],
  "recommended_slot_index": 0,
  "meeting_agenda": ["نقطة 1", "نقطة 2", "نقطة 3"],
  "preparation_tips": ["نصيحة 1", "نصيحة 2"],
  "calendar_invite_subject": "عنوان الدعوة المقترح",
  "calendar_invite_body": "نص الدعوة بالعربية"
}`,
        response_json_schema: {
          type: "object",
          properties: {
            suggested_slots:         { type: "array", items: { type: "object" } },
            recommended_slot_index:  { type: "number" },
            meeting_agenda:          { type: "array", items: { type: "string" } },
            preparation_tips:        { type: "array", items: { type: "string" } },
            calendar_invite_subject: { type: "string" },
            calendar_invite_body:    { type: "string" },
          }
        }
      });
      setResult(res);
    } catch (e) { toast.error("فشل الاقتراح: " + e.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="w-4 h-4 text-green-500" />
            اقتراح توقيت الاجتماعات ذكياً
          </CardTitle>
          <p className="text-xs text-slate-500">أدخل تفاصيل الاجتماع وسيقترح الذكاء الاصطناعي أفضل الأوقات</p>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input placeholder="عنوان الاجتماع *" value={form.meetingTitle} onChange={e => setForm({...form, meetingTitle: e.target.value})} />
          <Input placeholder="المشاركون (الأسماء أو البريد، مفصولة بفواصل) *" value={form.participants} onChange={e => setForm({...form, participants: e.target.value})} />
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-xs text-slate-500 mb-1 block">المدة</label>
              <select className="w-full border rounded-md px-2 py-2 text-sm" value={form.duration} onChange={e => setForm({...form, duration: e.target.value})}>
                <option value="30">30 دقيقة</option>
                <option value="60">ساعة</option>
                <option value="90">90 دقيقة</option>
                <option value="120">ساعتان</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">الوقت المفضل</label>
              <select className="w-full border rounded-md px-2 py-2 text-sm" value={form.preferredTime} onChange={e => setForm({...form, preferredTime: e.target.value})}>
                <option value="morning">صباحاً</option>
                <option value="afternoon">بعد الظهر</option>
                <option value="evening">مساءً</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">نوع الاجتماع</label>
              <select className="w-full border rounded-md px-2 py-2 text-sm" value={form.meetingType} onChange={e => setForm({...form, meetingType: e.target.value})}>
                <option value="project_review">مراجعة مشروع</option>
                <option value="proposal">تقديم عرض</option>
                <option value="kickoff">انطلاق مشروع</option>
                <option value="followup">متابعة</option>
                <option value="handover">تسليم</option>
              </select>
            </div>
          </div>
          <Textarea placeholder="ملاحظات إضافية (اختياري)..." rows={2} value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} />
          <Button className="w-full bg-green-600 hover:bg-green-700 text-white" onClick={suggest} disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : <Sparkles className="w-4 h-4 ml-2" />}
            اقتراح الأوقات
          </Button>
        </CardContent>
      </Card>

      {result && (
        <div className="space-y-3">
          {/* Suggested slots */}
          <Card className="border-green-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-green-700">📅 الأوقات المقترحة</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {result.suggested_slots?.map((slot, i) => (
                <div key={i} className={`flex items-center gap-3 p-3 rounded-lg border ${i === result.recommended_slot_index ? 'bg-green-50 border-green-300' : 'bg-white border-slate-200'}`}>
                  {i === result.recommended_slot_index && <span className="text-xs bg-green-500 text-white px-2 py-0.5 rounded-full shrink-0">الأفضل</span>}
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-800">{slot.day} — {slot.time}</p>
                    <p className="text-xs text-slate-500">{slot.reason}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Agenda */}
          {result.meeting_agenda?.length > 0 && (
            <Card>
              <CardContent className="pt-4">
                <p className="text-xs font-semibold text-slate-500 mb-2">📋 جدول الاجتماع المقترح</p>
                <ol className="space-y-1">
                  {result.meeting_agenda.map((item, i) => (
                    <li key={i} className="text-sm text-slate-700 flex gap-2"><span className="text-green-500 font-bold">{i+1}.</span>{item}</li>
                  ))}
                </ol>
              </CardContent>
            </Card>
          )}

          {/* Calendar invite body */}
          {result.calendar_invite_body && (
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold text-slate-500">✉️ نص دعوة التقويم</p>
                  <CopyButton text={result.calendar_invite_body} />
                </div>
                <p className="text-sm text-slate-700 whitespace-pre-line bg-slate-50 p-3 rounded-lg border">{result.calendar_invite_body}</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

// ── Tab 3: Follow-up Email Drafter ───────────────────────────────────────────
function FollowupDrafter() {
  const [form, setForm] = useState({
    emailType:       "project_update",
    recipientName:   "",
    recipientRole:   "client",
    projectTitle:    "",
    context:         "",
    tone:            "professional",
    language:        "arabic",
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult]   = useState(null);

  const draft = async () => {
    if (!form.recipientName || !form.projectTitle) { toast.error("أدخل اسم المستلم وعنوان المشروع"); return; }
    setLoading(true);
    setResult(null);
    try {
      const typeLabels = {
        project_update: "تحديث مشروع",
        proposal_followup: "متابعة عرض سعر",
        payment_reminder: "تذكير بالدفع",
        milestone_complete: "اكتمال مرحلة",
        contract_renewal: "تجديد عقد",
      };
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `أنت كاتب بريد إلكتروني محترف لشركة Bytly للخدمات الهندسية والتصميم في السعودية.

اكتب بريداً إلكترونياً للمتابعة بناءً على:
- نوع البريد: ${typeLabels[form.emailType]}
- اسم المستلم: ${form.recipientName}
- دور المستلم: ${form.recipientRole === 'client' ? 'عميل' : form.recipientRole === 'engineer' ? 'مهندس' : 'شريك'}
- عنوان المشروع: ${form.projectTitle}
- السياق والتفاصيل: ${form.context || 'غير محدد'}
- أسلوب الكتابة: ${form.tone === 'professional' ? 'رسمي ومهني' : form.tone === 'friendly' ? 'ودود ومريح' : 'مختصر ومباشر'}
- اللغة: ${form.language === 'arabic' ? 'العربية' : 'الإنجليزية'}

أعد JSON بهذا الشكل:
{
  "subject": "موضوع البريد",
  "greeting": "جملة الترحيب",
  "body_paragraphs": ["فقرة 1", "فقرة 2", "فقرة 3"],
  "call_to_action": "الدعوة للعمل",
  "closing": "جملة الختام",
  "full_email": "البريد الكامل مع كل العناصر",
  "alternative_subjects": ["موضوع بديل 1", "موضوع بديل 2"]
}`,
        response_json_schema: {
          type: "object",
          properties: {
            subject:               { type: "string" },
            greeting:              { type: "string" },
            body_paragraphs:       { type: "array", items: { type: "string" } },
            call_to_action:        { type: "string" },
            closing:               { type: "string" },
            full_email:            { type: "string" },
            alternative_subjects:  { type: "array", items: { type: "string" } },
          }
        }
      });
      setResult(res);
    } catch (e) { toast.error("فشل الصياغة: " + e.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Send className="w-4 h-4 text-purple-500" />
            صياغة رسائل المتابعة تلقائياً
          </CardTitle>
          <p className="text-xs text-slate-500">حدد نوع البريد والسياق وسيكتب الذكاء الاصطناعي الرسالة كاملة</p>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-500 mb-1 block">نوع البريد</label>
              <select className="w-full border rounded-md px-2 py-2 text-sm" value={form.emailType} onChange={e => setForm({...form, emailType: e.target.value})}>
                <option value="project_update">تحديث مشروع</option>
                <option value="proposal_followup">متابعة عرض</option>
                <option value="payment_reminder">تذكير بالدفع</option>
                <option value="milestone_complete">اكتمال مرحلة</option>
                <option value="contract_renewal">تجديد عقد</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">دور المستلم</label>
              <select className="w-full border rounded-md px-2 py-2 text-sm" value={form.recipientRole} onChange={e => setForm({...form, recipientRole: e.target.value})}>
                <option value="client">عميل</option>
                <option value="engineer">مهندس</option>
                <option value="partner">شريك</option>
              </select>
            </div>
          </div>
          <Input placeholder="اسم المستلم *" value={form.recipientName} onChange={e => setForm({...form, recipientName: e.target.value})} />
          <Input placeholder="عنوان المشروع *" value={form.projectTitle} onChange={e => setForm({...form, projectTitle: e.target.value})} />
          <Textarea placeholder="السياق والتفاصيل (مرحلة المشروع، مبلغ الدفع، ملاحظات...)" rows={3} value={form.context} onChange={e => setForm({...form, context: e.target.value})} />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-500 mb-1 block">الأسلوب</label>
              <select className="w-full border rounded-md px-2 py-2 text-sm" value={form.tone} onChange={e => setForm({...form, tone: e.target.value})}>
                <option value="professional">رسمي ومهني</option>
                <option value="friendly">ودود</option>
                <option value="direct">مختصر ومباشر</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">اللغة</label>
              <select className="w-full border rounded-md px-2 py-2 text-sm" value={form.language} onChange={e => setForm({...form, language: e.target.value})}>
                <option value="arabic">العربية</option>
                <option value="english">الإنجليزية</option>
              </select>
            </div>
          </div>
          <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white" onClick={draft} disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : <Sparkles className="w-4 h-4 ml-2" />}
            صياغة البريد
          </Button>
        </CardContent>
      </Card>

      {result && (
        <Card className="border-purple-200">
          <CardContent className="pt-4 space-y-3">
            {/* Subject */}
            <div className="bg-white border rounded-lg p-3">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs font-semibold text-slate-500">الموضوع</p>
                <CopyButton text={result.subject} />
              </div>
              <p className="text-sm font-medium text-slate-800">{result.subject}</p>
              {result.alternative_subjects?.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {result.alternative_subjects.map((s, i) => (
                    <span key={i} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full cursor-pointer hover:bg-slate-200" onClick={() => navigator.clipboard.writeText(s) && toast.success("تم النسخ")}>{s}</span>
                  ))}
                </div>
              )}
            </div>

            {/* Full email */}
            <div className="bg-slate-50 border rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-slate-500">البريد الكامل</p>
                <CopyButton text={result.full_email} />
              </div>
              <p className="text-sm text-slate-700 whitespace-pre-line leading-relaxed">{result.full_email}</p>
            </div>

            {/* CTA highlight */}
            {result.call_to_action && (
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                <p className="text-xs font-semibold text-purple-700 mb-1">🎯 الدعوة للعمل</p>
                <p className="text-sm text-purple-800">{result.call_to_action}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function AIAssistant() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50/20 p-6" dir="rtl">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
            <Sparkles className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">مساعد الذكاء الاصطناعي</h1>
            <p className="text-sm text-slate-500">أتمتة المهام المتكررة بقوة الذكاء الاصطناعي</p>
          </div>
        </div>

        <Tabs defaultValue="categorize">
          <TabsList className="grid grid-cols-3 w-full mb-6">
            <TabsTrigger value="categorize" className="flex items-center gap-1.5 text-xs">
              <Tag className="w-3.5 h-3.5" /> تصنيف البريد
            </TabsTrigger>
            <TabsTrigger value="schedule" className="flex items-center gap-1.5 text-xs">
              <Clock className="w-3.5 h-3.5" /> جدولة الاجتماعات
            </TabsTrigger>
            <TabsTrigger value="followup" className="flex items-center gap-1.5 text-xs">
              <Send className="w-3.5 h-3.5" /> رسائل المتابعة
            </TabsTrigger>
          </TabsList>

          <TabsContent value="categorize"><EmailCategorizer /></TabsContent>
          <TabsContent value="schedule"><SmartScheduler /></TabsContent>
          <TabsContent value="followup"><FollowupDrafter /></TabsContent>
        </Tabs>
      </div>
    </div>
  );
}