import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Sparkles, Send, Loader2, ShieldAlert, ArrowUpRight, ShieldCheck, Eye, HelpCircle,
  Wrench, Database, Server, KeyRound, CheckCircle2, XCircle, AlertTriangle, Ban, MessageCircle,
  RefreshCw, Layers, Plug, ShieldOff, Mic, MicOff, Paperclip, X, FileText, Image as ImageIcon, Bug,
} from "lucide-react";

const EXAMPLE_PROMPTS = [
  "إيش المشاريع اللي تحتاج متابعة؟",
  "كم دخلنا هذا الشهر مقارنة بالشهر الماضي؟",
  "مين أعلى المهندسين تقييمًا؟",
  "أضف فلتر للمشاريع المتأخرة",
  "أضف بطاقة تعرض عدد المشاريع النشطة",
];

const RISK_LABELS = {
  low: { ar: "منخفض", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  medium: { ar: "متوسط", className: "bg-amber-50 text-amber-700 border-amber-200" },
  high: { ar: "مرتفع", className: "bg-red-50 text-red-700 border-red-200" },
};

const COVERAGE_LABELS = {
  supported: { ar: "مدعوم بالكامل", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  partial: { ar: "مدعوم جزئيًا", className: "bg-amber-50 text-amber-700 border-amber-200" },
  unsupported: { ar: "غير مدعوم حاليًا", className: "bg-slate-100 text-slate-600 border-slate-200" },
};

function DataTable({ table }) {
  if (!table?.rows?.length) return null;
  return (
    <div className="mt-3 overflow-x-auto rounded-lg border border-[#EFE6D3]">
      <table className="w-full text-xs">
        <thead>
          <tr className="bg-[#FEF9EE]">
            {table.columns.map((c) => (
              <th key={c.key} className="text-right px-3 py-2 font-semibold text-[#4A3F35] whitespace-nowrap">{c.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.rows.map((row, i) => (
            <tr key={row.id || i} className="border-t border-[#EFE6D3]">
              {table.columns.map((c) => (
                <td key={c.key} className="px-3 py-2 text-slate-600 whitespace-nowrap">{String(row[c.key] ?? "—")}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PlanRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-2 py-1.5 border-t border-[#EFE6D3]/70 first:border-t-0">
      <Icon className="w-3.5 h-3.5 text-[#C9A66B] mt-0.5 shrink-0" />
      <div className="text-xs">
        <span className="font-semibold text-[#4A3F35]">{label}: </span>
        <span className="text-slate-600">{value}</span>
      </div>
    </div>
  );
}

function AttachmentChips({ attachments, imageOnly }) {
  if (!attachments?.length) return null;
  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {attachments.map((a, i) =>
        a.isImage ? (
          <img key={i} src={a.url} alt={a.name} className="w-20 h-20 object-cover rounded-lg border border-white/20" />
        ) : (
          !imageOnly && (
            <a key={i} href={a.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-[11px] bg-black/10 rounded-lg px-2 py-1">
              <FileText className="w-3.5 h-3.5" /> {a.name}
            </a>
          )
        )
      )}
    </div>
  );
}

function Bubble({ children, tone = "bot", attachments }) {
  if (tone === "user") {
    return (
      <div className="flex justify-end">
        <div className="bg-[#4A3F35] text-white rounded-2xl rounded-tl-sm px-4 py-2.5 max-w-[85%] text-sm">
          {children}
          <AttachmentChips attachments={attachments} />
        </div>
      </div>
    );
  }
  if (tone === "error") {
    return (
      <div className="flex justify-start">
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl rounded-tr-sm px-4 py-2.5 max-w-[85%] text-sm">{children}</div>
      </div>
    );
  }
  return (
    <div className="flex justify-start">
      <div className="bg-[#FEF9EE] rounded-2xl rounded-tr-sm px-4 py-2.5 max-w-[85%] text-sm text-[#4A3F35]">{children}</div>
    </div>
  );
}

function AgentMessage({ msg, onDecision, deciding }) {
  if (msg.role === "user") return <Bubble tone="user" attachments={msg.attachments}>{msg.text}</Bubble>;
  if (msg.role === "error") return <Bubble tone="error">{msg.text}</Bubble>;
  if (msg.role === "clarify") return <Bubble tone="bot">{msg.text}</Bubble>;
  if (msg.role === "decision") return <Bubble tone="bot">{msg.text}</Bubble>;
  if (msg.role === "index_status") return <Bubble tone="bot">{msg.text}</Bubble>;

  if (msg.role === "data") {
    const isUnsupported = msg.coverage === "unsupported";
    const cov = COVERAGE_LABELS[msg.coverage];
    return (
      <div className="flex justify-start">
        <Card className={`max-w-[90%] ${isUnsupported ? "border-slate-200 bg-slate-50" : "border-[#EFE6D3]"}`}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full border bg-[#FEF9EE] text-[#4A3F35] border-[#C9A66B]/30">
                <Eye className="w-3 h-3" /> قراءة فقط
              </span>
              {cov && <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full border ${cov.className}`}>{cov.ar}</span>}
            </div>
            <p className={`text-sm leading-relaxed ${isUnsupported ? "text-slate-500" : "text-[#4A3F35]"}`}>
              {isUnsupported && <HelpCircle className="inline w-4 h-4 ml-1 mb-0.5 text-slate-400" />}
              {msg.answer}
            </p>
            <DataTable table={msg.table} />
            {msg.admin_page && (
              <Link to={createPageUrl(msg.admin_page)} className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-[#C9A66B] hover:underline">
                فتح القسم ذو الصلة في مركز الإدارة <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // role === "plan"
  const plan = msg.plan;
  const risk = RISK_LABELS[plan.risk_level];
  const yesNo = (b) => (b ? "نعم" : "لا");

  if (plan.blocked) {
    return (
      <div className="flex justify-start">
        <Card className="max-w-[90%] border-red-200 bg-red-50/60">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Ban className="w-4 h-4 text-red-500" />
              <span className="text-xs font-bold text-red-700">هذا التعديل يحتاج مراجعة إضافية ولا يمكن تنفيذه تلقائيًا في هذه المرحلة</span>
            </div>
            <p className="text-sm text-red-700/90 leading-relaxed">{plan.block_reason}</p>
            <p className="text-xs text-slate-500 mt-2">فهمت طلبك كالتالي: {plan.detected_intent}</p>
            {plan.security_notes && (
              <div className="mt-3 rounded-lg border border-red-200 bg-white/60 p-3">
                <PlanRow icon={ShieldAlert} label="المراجعة الأمنية" value={plan.security_notes} />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex justify-start">
      <Card className="max-w-[90%] border-[#EFE6D3]">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 flex-wrap mb-3">
            <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full border bg-[#FEF9EE] text-[#4A3F35] border-[#C9A66B]/30">
              <Wrench className="w-3 h-3" /> خطة تغيير
            </span>
            {risk && (
              <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full border ${risk.className}`}>
                <AlertTriangle className="w-3 h-3" /> مستوى الخطورة: {risk.ar}
              </span>
            )}
          </div>

          <p className="text-xs font-semibold text-slate-500 mb-1">فهمت طلبك كالتالي:</p>
          <p className="text-sm leading-relaxed text-[#4A3F35] mb-3">{plan.plain_explanation_ar}</p>

          {(plan.problem_description || plan.likely_cause) && (
            <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50/50 p-3">
              {plan.problem_description && <PlanRow icon={Bug} label="المشكلة" value={plan.problem_description} />}
              {plan.likely_cause && <PlanRow icon={HelpCircle} label="السبب المحتمل" value={plan.likely_cause} />}
            </div>
          )}

          <div className="rounded-lg border border-[#EFE6D3] p-3 bg-[#FEF9EE]/50">
            <PlanRow icon={ArrowUpRight} label="الصفحة المتأثرة" value={plan.target_page} />
            <PlanRow icon={Wrench} label="الملفات المتأثرة (تقديرية)" value={plan.affected_files?.length ? plan.affected_files.join('، ') : '—'} />
            <PlanRow icon={Database} label="يحتاج تعديل قاعدة بيانات؟" value={yesNo(plan.requires_db_change)} />
            <PlanRow icon={Server} label="يحتاج تعديل Backend؟" value={yesNo(plan.requires_backend_change)} />
            <PlanRow icon={KeyRound} label="يحتاج تعديل صلاحيات؟" value={yesNo(plan.requires_permission_change)} />
            <PlanRow icon={ShieldCheck} label="الاختبارات المطلوبة" value={plan.tests_required?.length ? plan.tests_required.join('، ') : '—'} />
          </div>

          {plan.security_notes && (
            <div className="mt-3 rounded-lg border border-[#EFE6D3] p-3">
              <p className="text-[11px] font-semibold text-slate-500 mb-2">المراجعة الأمنية</p>
              <PlanRow icon={ShieldAlert} label="النتيجة" value={plan.security_notes} />
            </div>
          )}

          {(plan.affected_pages?.length || plan.affected_entities?.length || plan.affected_functions?.length || plan.affected_integrations?.length || plan.unaffected_summary) && (
            <div className="mt-3 rounded-lg border border-[#EFE6D3] p-3">
              <p className="text-[11px] font-semibold text-slate-500 mb-2">تحليل الأثر (Impact Analysis)</p>
              {!!plan.affected_pages?.length && <PlanRow icon={Layers} label="الصفحات المتأثرة" value={plan.affected_pages.join('، ')} />}
              {!!plan.affected_entities?.length && <PlanRow icon={Database} label="الكيانات المتأثرة" value={plan.affected_entities.join('، ')} />}
              {!!plan.affected_functions?.length && <PlanRow icon={Server} label="دوال Backend المتأثرة" value={plan.affected_functions.join('، ')} />}
              {!!plan.affected_integrations?.length && <PlanRow icon={Plug} label="التكاملات المتأثرة" value={plan.affected_integrations.join('، ')} />}
              {plan.unaffected_summary && <PlanRow icon={ShieldOff} label="ما لن يتغيّر" value={plan.unaffected_summary} />}
            </div>
          )}

          {plan.diff_preview && (
            <div className="mt-3">
              <p className="text-[11px] font-semibold text-slate-500 mb-1">معاينة التغيير (Diff تقنية، اختيارية):</p>
              <pre className="text-[11px] bg-[#4A3F35] text-[#F5EFE3] rounded-lg p-3 overflow-x-auto whitespace-pre-wrap">{plan.diff_preview}</pre>
            </div>
          )}

          {plan.status === "awaiting_approval" && (
            <div className="mt-4 flex items-center gap-2">
              <Button size="sm" disabled={deciding} onClick={() => onDecision(msg.id, "approve")} className="bg-emerald-600 hover:bg-emerald-700">
                {deciding === "approve" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                موافقة وتنفيذ في المعاينة
              </Button>
              <Button size="sm" variant="outline" disabled={deciding} onClick={() => onDecision(msg.id, "reject")}>
                {deciding === "reject" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
                إلغاء
              </Button>
            </div>
          )}
          {plan.status === "approved" && (
            <p className="mt-4 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
              ✓ تمت الموافقة وتسجيلها. التنفيذ الفعلي يتم يدويًا في جلسة المحرر فقط — أخبرني بالموافقة في هذه الجلسة لأطبّق التغيير فعليًا.
            </p>
          )}
          {plan.status === "rejected" && (
            <p className="mt-4 text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">تم إلغاء هذا الاقتراح.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function AccessDenied() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <Card className="max-w-md w-full border-r-4 border-red-400">
        <CardContent className="p-8 text-center">
          <ShieldAlert className="w-10 h-10 text-red-500 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-[#4A3F35] mb-2">هذه الصفحة مخصصة للمشرفين فقط</h2>
          <p className="text-sm text-slate-500">غير مصرح لك بالوصول إلى مساعد المنصة.</p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AdminAIAssistant() {
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [asking, setAsking] = useState(false);
  const [decidingId, setDecidingId] = useState(null);
  const [pendingPlanId, setPendingPlanId] = useState(null);
  const [refreshingIndex, setRefreshingIndex] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const [pendingAttachments, setPendingAttachments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const scrollRef = useRef(null);
  const fileInputRef = useRef(null);
  const recognitionRef = useRef(null);
  const speechSupported = typeof window !== "undefined" && (window.SpeechRecognition || window.webkitSpeechRecognition);

  useEffect(() => {
    (async () => {
      try {
        const u = await base44.auth.me();
        setIsAdmin(u?.role === "admin");
        setCurrentUser(u);
        if (u?.role === "admin") {
          const existing = await base44.entities.AIAgentConversation.filter({ asked_by_email: u.email }, "-updated_date", 1);
          if (existing?.[0]) {
            setConversationId(existing[0].id);
            try {
              const parsed = JSON.parse(existing[0].messages_json || "[]");
              setMessages(Array.isArray(parsed) ? parsed : []);
              const lastPlan = [...parsed].reverse().find((m) => m.role === "plan" && m.plan?.status === "awaiting_approval" && !m.plan?.blocked);
              if (lastPlan) setPendingPlanId(lastPlan.id);
            } catch {
              setMessages([]);
            }
          }
        }
      } catch {
        setIsAdmin(false);
      } finally {
        setLoadingAuth(false);
      }
    })();
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, asking]);

  // Persist conversation memory — debounced, fires after messages settle.
  useEffect(() => {
    if (!currentUser || !messages.length) return;
    const timer = setTimeout(async () => {
      const attachmentsCount = messages.reduce((sum, m) => sum + (m.attachments?.length || 0), 0);
      const messages_json = JSON.stringify(messages).slice(0, 100000);
      try {
        if (conversationId) {
          await base44.entities.AIAgentConversation.update(conversationId, { messages_json, attachments_count: attachmentsCount });
        } else {
          const created = await base44.entities.AIAgentConversation.create({ asked_by_email: currentUser.email, messages_json, attachments_count: attachmentsCount });
          setConversationId(created.id);
        }
      } catch {
        // Memory persistence is best-effort — never block the chat on a save failure.
      }
    }, 800);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, conversationId]);

  const recentHistoryForContext = () =>
    messages.slice(-6).map((m) => ({
      role: m.role,
      text: m.text || m.answer || m.plan?.detected_intent || "",
    }));

  const send = async (text) => {
    const q = (text ?? input).trim();
    if ((!q && !pendingAttachments.length) || asking) return;
    const attachmentsForMessage = pendingAttachments;
    setInput("");
    setPendingAttachments([]);
    const attachmentNote = attachmentsForMessage.length
      ? `\n\n[مرفقات أرفقها المستخدم: ${attachmentsForMessage.map((a) => `${a.name} (${a.url})`).join("، ")}]`
      : "";
    setMessages((prev) => [...prev, { role: "user", text: q, attachments: attachmentsForMessage }]);
    setAsking(true);
    try {
      const res = await base44.functions.invoke("platformAgent", {
        action: "message",
        message: q + attachmentNote,
        pending_plan_id: pendingPlanId,
        recent_history: recentHistoryForContext(),
      });
      const data = res.data;
      if (data?.error) {
        setMessages((prev) => [...prev, { role: "error", text: data.error }]);
      } else if (data.kind === "data") {
        setMessages((prev) => [...prev, {
          role: "data", answer: data.answer, table: data.table, admin_page: data.admin_page, coverage: data.coverage,
        }]);
      } else if (data.kind === "plan") {
        setMessages((prev) => [...prev, { role: "plan", id: data.id, plan: data.plan }]);
        if (!data.plan.blocked && data.plan.status === "proposed") setPendingPlanId(data.id);
      } else if (data.kind === "decision") {
        setMessages((prev) => {
          const updated = prev.map((m) => (m.role === "plan" && m.id === data.id ? { ...m, plan: { ...m.plan, status: data.status } } : m));
          return [...updated, { role: "decision", text: data.note || (data.status === "approved" ? "تمت الموافقة." : "تم الإلغاء.") }];
        });
        setPendingPlanId(null);
      } else if (data.kind === "clarify") {
        setMessages((prev) => [...prev, { role: "clarify", text: data.message }]);
      }
    } catch {
      setMessages((prev) => [...prev, { role: "error", text: "تعذّر معالجة طلبك الآن. حاول مرة أخرى." }]);
    } finally {
      setAsking(false);
    }
  };

  const handleDecision = async (id, action) => {
    setDecidingId(`${id}:${action}`);
    try {
      const res = await base44.functions.invoke("platformAgent", { action, id });
      if (res.data?.status) {
        setMessages((prev) => prev.map((m) => (m.role === "plan" && m.id === id ? { ...m, plan: { ...m.plan, status: res.data.status } } : m)));
        if (id === pendingPlanId) setPendingPlanId(null);
      }
    } finally {
      setDecidingId(null);
    }
  };

  const refreshIndexStatus = async () => {
    setRefreshingIndex(true);
    try {
      const res = await base44.functions.invoke("platformAgent", { action: "refresh_index_status" });
      const data = res.data;
      const meta = data?.meta;
      const text = meta
        ? `حالة فهرس المشروع: ${meta.total_count ?? data.live_total_indexed ?? "غير معروف"} عنصر مفهرس (${meta.pages_count ?? "?"} صفحة، ${meta.entities_count ?? "?"} كيان، ${meta.functions_count ?? "?"} دالة) — آخر تحديث: ${meta.last_indexed_at ? new Date(meta.last_indexed_at).toLocaleString("ar") : "غير معروف"}.\n${data.note || ""}`
        : `لم يتم إنشاء فهرس بعد. عدد السجلات الحالية المقروءة: ${data?.live_total_indexed ?? 0}.`;
      setMessages((prev) => [...prev, { role: "index_status", text }]);
    } catch {
      setMessages((prev) => [...prev, { role: "error", text: "تعذّر جلب حالة الفهرس الآن." }]);
    } finally {
      setRefreshingIndex(false);
    }
  };

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    if (!files.length) return;
    setUploading(true);
    try {
      for (const file of files) {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        setPendingAttachments((prev) => [...prev, { url: file_url, name: file.name, isImage: file.type.startsWith("image/") }]);
      }
    } catch {
      setMessages((prev) => [...prev, { role: "error", text: "تعذّر رفع أحد الملفات. حاول مرة أخرى." }]);
    } finally {
      setUploading(false);
    }
  };

  const removePendingAttachment = (idx) => {
    setPendingAttachments((prev) => prev.filter((_, i) => i !== idx));
  };

  const toggleVoice = () => {
    if (!speechSupported) return;
    if (isRecording) {
      recognitionRef.current?.stop();
      return;
    }
    const SpeechRecognitionCtor = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognitionCtor();
    recognition.lang = "ar-SA";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = (event) => {
      const transcript = event.results?.[0]?.[0]?.transcript || "";
      setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
    };
    recognition.onend = () => setIsRecording(false);
    recognition.onerror = () => setIsRecording(false);
    recognitionRef.current = recognition;
    recognition.start();
    setIsRecording(true);
  };

  if (loadingAuth) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#C9A66B] animate-spin" />
      </div>
    );
  }
  if (!isAdmin) return <AccessDenied />;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10">
      <div className="mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-[#C9A66B]" />
          <h1 className="text-2xl font-bold text-[#4A3F35]">مساعد الإدارة المركزي</h1>
        </div>
        <p className="text-sm text-slate-500 mt-1">اسأل عن بيانات المنصة، أو اطلب تعديلًا — يفهم الوكيل نوع طلبك تلقائيًا بدون اختيار مسبق.</p>
      </div>

      <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
        <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap">
          <span className="inline-flex items-center gap-1.5"><Eye className="w-3.5 h-3.5 text-[#C9A66B]" /> قراءة فقط للبيانات</span>
          <span className="inline-flex items-center gap-1.5"><Wrench className="w-3.5 h-3.5 text-[#C9A66B]" /> معاينة قبل أي تعديل</span>
          <span className="inline-flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-[#C9A66B]" /> التنفيذ يدويًا في جلسة المحرر فقط</span>
        </div>
        <Button size="sm" variant="outline" onClick={refreshIndexStatus} disabled={refreshingIndex} className="text-xs">
          {refreshingIndex ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
          تحديث معرفة المشروع
        </Button>
      </div>

      <Card className="border-[#EFE6D3]">
        <CardContent className="p-4">
          <div ref={scrollRef} className="h-[55vh] overflow-y-auto space-y-3 pr-1">
            {messages.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center gap-4 px-4">
                <MessageCircle className="w-8 h-8 text-[#C9A66B]/50" />
                <p className="text-sm font-semibold text-[#4A3F35]">ماذا تريد أن أفعل؟</p>
                <p className="text-xs text-slate-400 -mt-2">اكتب طلبك مباشرة — سؤال بيانات أو طلب تعديل، بدون اختيار نوع مسبقًا</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {EXAMPLE_PROMPTS.map((q) => (
                    <button key={q} onClick={() => send(q)} className="text-xs px-3 py-1.5 rounded-full border border-[#C9A66B]/40 text-[#4A3F35] hover:bg-[#FEF9EE] transition-colors">
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((m, i) => (
              <AgentMessage
                key={i}
                msg={m}
                deciding={m.role === "plan" && decidingId?.startsWith(`${m.id}:`) ? decidingId.split(":")[1] : null}
                onDecision={handleDecision}
              />
            ))}
            {asking && (
              <div className="flex justify-start">
                <div className="bg-[#FEF9EE] rounded-2xl rounded-tr-sm px-4 py-2.5 text-sm text-slate-500 inline-flex items-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> جارٍ الفهم والمعالجة...
                </div>
              </div>
            )}
          </div>

          <form onSubmit={(e) => { e.preventDefault(); send(); }} className="mt-4 border-t border-[#EFE6D3] pt-4">
            {!!pendingAttachments.length && (
              <div className="flex flex-wrap gap-2 mb-2">
                {pendingAttachments.map((a, i) => (
                  <div key={i} className="relative inline-flex items-center gap-1.5 text-[11px] bg-[#FEF9EE] border border-[#EFE6D3] rounded-lg px-2 py-1">
                    {a.isImage ? <ImageIcon className="w-3.5 h-3.5 text-[#C9A66B]" /> : <FileText className="w-3.5 h-3.5 text-[#C9A66B]" />}
                    <span className="max-w-[120px] truncate">{a.name}</span>
                    <button type="button" onClick={() => removePendingAttachment(i)} className="text-slate-400 hover:text-red-500">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex items-end gap-2">
              <input ref={fileInputRef} type="file" multiple hidden onChange={handleFileSelect} accept="image/*,.pdf,.doc,.docx,.xlsx,.csv,.txt" />
              <Button type="button" variant="outline" size="icon" disabled={uploading} onClick={() => fileInputRef.current?.click()} title="إرفاق صورة أو ملف" className="shrink-0">
                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Paperclip className="w-4 h-4" />}
              </Button>
              {speechSupported && (
                <Button type="button" variant={isRecording ? "default" : "outline"} size="icon" onClick={toggleVoice} title="إدخال صوتي" className={`shrink-0 ${isRecording ? "bg-red-500 hover:bg-red-600" : ""}`}>
                  {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </Button>
              )}
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
                placeholder={isRecording ? "جارٍ الاستماع... تحدّث" : "ماذا تريد أن أفعل؟"}
                rows={1}
                className="resize-none flex-1"
              />
              <Button type="submit" disabled={asking || (!input.trim() && !pendingAttachments.length)} className="bg-[#4A3F35] hover:bg-[#3a3129] shrink-0">
                {asking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}