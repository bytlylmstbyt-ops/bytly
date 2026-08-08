import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Sparkles, Send, Loader2, ShieldAlert, ArrowUpRight, ShieldCheck, Eye, HelpCircle,
  Wrench, Database, Server, KeyRound, CheckCircle2, XCircle, AlertTriangle, Ban,
} from "lucide-react";

const EXAMPLE_QUESTIONS = [
  { ar: "إيش المشاريع اللي تحتاج متابعة؟", en: "Which projects need follow-up?" },
  { ar: "مين عنده أعلى تقييم؟", en: "Who has the highest rating?" },
  { ar: "كم دخلنا هذا الشهر مقارنة بالشهر الماضي؟", en: "How does this month's revenue compare to last month?" },
  { ar: "إيش العقود النشطة؟", en: "What are the active contracts?" },
  { ar: "هل فيه طلبات سحب معلقة؟", en: "Are there pending withdrawal requests?" },
  { ar: "مين المهندسين اللي عندهم مشاريع متأخرة؟", en: "Which engineers have overdue projects?" },
  { ar: "أعطني ملخص عن حالة المنصة اليوم", en: "Give me a summary of the platform's status today" },
  { ar: "ما هي أهم الأشياء التي تحتاج انتباهي؟", en: "What are the most important things needing my attention?" },
];

const EXAMPLE_CHANGES = [
  "أبغى أضيف فلتر للمشاريع المتأخرة في إدارة المشاريع",
  "أبغى أضيف عمود تقييم العملاء في جدول المهندسين",
  "أبغى أعدل عنوان هذه الصفحة",
  "أبغى أخلي البحث في إدارة المشاريع يبحث باسم المشروع واسم العميل",
];

const COVERAGE_LABELS = {
  supported: { ar: "مدعوم بالكامل", en: "Supported", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  partial: { ar: "مدعوم جزئيًا", en: "Partially supported", className: "bg-amber-50 text-amber-700 border-amber-200" },
  unsupported: { ar: "غير مدعوم حاليًا", en: "Not supported", className: "bg-slate-100 text-slate-600 border-slate-200" },
};

const RISK_LABELS = {
  low: { ar: "منخفض", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  medium: { ar: "متوسط", className: "bg-amber-50 text-amber-700 border-amber-200" },
  high: { ar: "مرتفع", className: "bg-red-50 text-red-700 border-red-200" },
};

function CoverageBadge({ coverage }) {
  const info = COVERAGE_LABELS[coverage];
  if (!info) return null;
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full border ${info.className}`}>
      {info.ar} / {info.en}
    </span>
  );
}

function DataTable({ table }) {
  if (!table?.rows?.length) return null;
  return (
    <div className="mt-3 overflow-x-auto rounded-lg border border-[#EFE6D3]">
      <table className="w-full text-xs">
        <thead>
          <tr className="bg-[#FEF9EE]">
            {table.columns.map((c) => (
              <th key={c.key} className="text-right px-3 py-2 font-semibold text-[#4A3F35] whitespace-nowrap">
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.rows.map((row, i) => (
            <tr key={row.id || i} className="border-t border-[#EFE6D3]">
              {table.columns.map((c) => (
                <td key={c.key} className="px-3 py-2 text-slate-600 whitespace-nowrap">
                  {String(row[c.key] ?? "—")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function DataAssistantMessage({ msg }) {
  if (msg.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="bg-[#4A3F35] text-white rounded-2xl rounded-tl-sm px-4 py-2.5 max-w-[85%] text-sm">
          {msg.text}
        </div>
      </div>
    );
  }
  if (msg.role === "error") {
    return (
      <div className="flex justify-start">
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl rounded-tr-sm px-4 py-2.5 max-w-[85%] text-sm">
          {msg.text}
        </div>
      </div>
    );
  }
  const isUnsupported = msg.coverage === "unsupported";
  return (
    <div className="flex justify-start">
      <Card className={`max-w-[90%] ${isUnsupported ? "border-slate-200 bg-slate-50" : "border-[#EFE6D3]"}`}>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full border bg-[#FEF9EE] text-[#4A3F35] border-[#C9A66B]/30">
              <Eye className="w-3 h-3" /> قراءة فقط / Read-only
            </span>
            {msg.coverage && <CoverageBadge coverage={msg.coverage} />}
          </div>
          <p className={`text-sm leading-relaxed ${isUnsupported ? "text-slate-500" : "text-[#4A3F35]"}`}>
            {isUnsupported && <HelpCircle className="inline w-4 h-4 ml-1 mb-0.5 text-slate-400" />}
            {msg.answer}
          </p>
          <DataTable table={msg.table} />
          {msg.admin_page && (
            <Link
              to={createPageUrl(msg.admin_page)}
              className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-[#C9A66B] hover:underline"
            >
              فتح القسم ذو الصلة في مركز الإدارة
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          )}
          {typeof msg.rowCount === "number" && (
            <p className="mt-2 text-[11px] text-slate-400">
              {msg.dataSources?.length ? `مصدر البيانات: ${msg.dataSources.join("، ")} · ` : ""}
              {msg.rowCount} سجل تمت قراءته
            </p>
          )}
        </CardContent>
      </Card>
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

function ChangePlanMessage({ msg, onDecision, deciding }) {
  if (msg.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="bg-[#4A3F35] text-white rounded-2xl rounded-tl-sm px-4 py-2.5 max-w-[85%] text-sm">
          {msg.text}
        </div>
      </div>
    );
  }
  if (msg.role === "error") {
    return (
      <div className="flex justify-start">
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl rounded-tr-sm px-4 py-2.5 max-w-[85%] text-sm">
          {msg.text}
        </div>
      </div>
    );
  }
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
            <p className="text-xs text-slate-500 mt-2">فهم الطلب: {plan.detected_intent}</p>
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

          <p className="text-sm leading-relaxed text-[#4A3F35] mb-3">{plan.plain_explanation_ar}</p>

          <div className="rounded-lg border border-[#EFE6D3] p-3 bg-[#FEF9EE]/50">
            <PlanRow icon={HelpCircle} label="فهم الذكاء الاصطناعي للطلب" value={plan.detected_intent} />
            <PlanRow icon={ArrowUpRight} label="الصفحة المتأثرة" value={plan.target_page} />
            <PlanRow icon={Wrench} label="الملفات المتأثرة (تقديرية)" value={plan.affected_files?.length ? plan.affected_files.join('، ') : '—'} />
            <PlanRow icon={Database} label="يحتاج تعديل قاعدة بيانات؟" value={yesNo(plan.requires_db_change)} />
            <PlanRow icon={Server} label="يحتاج تعديل Backend؟" value={yesNo(plan.requires_backend_change)} />
            <PlanRow icon={KeyRound} label="يحتاج تعديل صلاحيات؟" value={yesNo(plan.requires_permission_change)} />
            <PlanRow icon={ShieldCheck} label="الاختبارات المطلوبة" value={plan.tests_required?.length ? plan.tests_required.join('، ') : '—'} />
          </div>

          {plan.diff_preview && (
            <div className="mt-3">
              <p className="text-[11px] font-semibold text-slate-500 mb-1">معاينة التغيير (تقنية، اختيارية):</p>
              <pre className="text-[11px] bg-[#4A3F35] text-[#F5EFE3] rounded-lg p-3 overflow-x-auto whitespace-pre-wrap">{plan.diff_preview}</pre>
            </div>
          )}

          {plan.status === "proposed" && (
            <div className="mt-4 flex items-center gap-2">
              <Button
                size="sm"
                disabled={deciding}
                onClick={() => onDecision(msg.id, "approve")}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {deciding === "approve" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                موافقة
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={deciding}
                onClick={() => onDecision(msg.id, "reject")}
              >
                {deciding === "reject" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
                إلغاء
              </Button>
            </div>
          )}
          {plan.status === "approved" && (
            <p className="mt-4 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
              ✓ تمت الموافقة. التنفيذ الفعلي يتم يدويًا من قِبل المطوّر/جلسة المساعد — لا يوجد تنفيذ تلقائي داخل التطبيق في هذه المرحلة.
            </p>
          )}
          {plan.status === "rejected" && (
            <p className="mt-4 text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
              تم إلغاء هذا الاقتراح.
            </p>
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
  const [mode, setMode] = useState("data"); // "data" | "change"
  const [dataMessages, setDataMessages] = useState([]);
  const [changeMessages, setChangeMessages] = useState([]);
  const [input, setInput] = useState("");
  const [asking, setAsking] = useState(false);
  const [decidingId, setDecidingId] = useState(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const user = await base44.auth.me();
        setIsAdmin(user?.role === "admin");
      } catch {
        setIsAdmin(false);
      } finally {
        setLoadingAuth(false);
      }
    })();
  }, []);

  const messages = mode === "data" ? dataMessages : changeMessages;
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [dataMessages, changeMessages, asking, mode]);

  const askData = async (question) => {
    setDataMessages((prev) => [...prev, { role: "user", text: question }]);
    setAsking(true);
    try {
      const res = await base44.functions.invoke("platformDataAssistant", { question });
      const data = res.data;
      if (data?.error) {
        setDataMessages((prev) => [...prev, { role: "error", text: data.error }]);
      } else {
        setDataMessages((prev) => [
          ...prev,
          { role: "assistant", answer: data.answer, table: data.table, admin_page: data.admin_page, coverage: data.coverage, rowCount: data.table?.rows?.length ?? 0 },
        ]);
      }
    } catch {
      setDataMessages((prev) => [...prev, { role: "error", text: "تعذّر الحصول على إجابة الآن. حاول مرة أخرى." }]);
    } finally {
      setAsking(false);
    }
  };

  const askChange = async (requestText) => {
    setChangeMessages((prev) => [...prev, { role: "user", text: requestText }]);
    setAsking(true);
    try {
      const res = await base44.functions.invoke("platformChangePlanner", { action: "propose", request: requestText });
      const data = res.data;
      if (data?.error) {
        setChangeMessages((prev) => [...prev, { role: "error", text: data.error }]);
      } else {
        setChangeMessages((prev) => [...prev, { role: "plan", id: data.id, plan: data.plan }]);
      }
    } catch {
      setChangeMessages((prev) => [...prev, { role: "error", text: "تعذّر إنشاء خطة التغيير الآن. حاول مرة أخرى." }]);
    } finally {
      setAsking(false);
    }
  };

  const handleDecision = async (id, action) => {
    setDecidingId(`${id}:${action}`);
    try {
      const res = await base44.functions.invoke("platformChangePlanner", { action, id });
      if (res.data?.success) {
        setChangeMessages((prev) =>
          prev.map((m) => (m.role === "plan" && m.id === id ? { ...m, plan: { ...m.plan, status: res.data.status } } : m))
        );
      }
    } finally {
      setDecidingId(null);
    }
  };

  const submit = () => {
    const q = input.trim();
    if (!q || asking) return;
    setInput("");
    if (mode === "data") askData(q);
    else askChange(q);
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
          <h1 className="text-2xl font-bold text-[#4A3F35]">مساعد المنصة الذكي</h1>
        </div>
        <p className="text-sm text-slate-500 mt-1">اسأل عن بيانات المنصة، أو اطلب تعديلًا واحصل على خطة تغيير ومعاينة قبل أي تنفيذ.</p>
      </div>

      <div className="inline-flex rounded-xl border border-[#EFE6D3] p-1 bg-[#FEF9EE] mb-4">
        <button
          onClick={() => setMode("data")}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${mode === "data" ? "bg-[#4A3F35] text-white" : "text-[#4A3F35]"}`}
        >
          اسأل عن بيانات المنصة
        </button>
        <button
          onClick={() => setMode("change")}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${mode === "change" ? "bg-[#4A3F35] text-white" : "text-[#4A3F35]"}`}
        >
          اطلب تعديلًا على المنصة
        </button>
      </div>

      <div className="flex items-center gap-4 mb-4 text-xs text-slate-500 flex-wrap">
        {mode === "data" ? (
          <>
            <span className="inline-flex items-center gap-1.5"><Eye className="w-3.5 h-3.5 text-[#C9A66B]" /> الوضع الحالي: قراءة فقط</span>
            <span className="inline-flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-[#C9A66B]" /> كل سؤال يُسجَّل في سجل التدقيق</span>
          </>
        ) : (
          <>
            <span className="inline-flex items-center gap-1.5"><Wrench className="w-3.5 h-3.5 text-[#C9A66B]" /> الوضع الحالي: مخطِّط تغييرات (معاينة فقط)</span>
            <span className="inline-flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-[#C9A66B]" /> لا تنفيذ تلقائي — كل خطة تحتاج مراجعتك</span>
          </>
        )}
      </div>

      <Card className="border-[#EFE6D3]">
        <CardContent className="p-4">
          <div ref={scrollRef} className="h-[55vh] overflow-y-auto space-y-3 pr-1">
            {messages.length === 0 && mode === "data" && (
              <div className="h-full flex flex-col items-center justify-center text-center gap-4 px-4">
                <Sparkles className="w-8 h-8 text-[#C9A66B]/50" />
                <p className="text-sm text-slate-400">جرّب أحد الأسئلة التالية، أو اكتب سؤالك الخاص</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {EXAMPLE_QUESTIONS.map((q) => (
                    <button key={q.ar} onClick={() => askData(q.ar)} className="text-xs px-3 py-1.5 rounded-full border border-[#C9A66B]/40 text-[#4A3F35] hover:bg-[#FEF9EE] transition-colors">
                      {q.ar}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {messages.length === 0 && mode === "change" && (
              <div className="h-full flex flex-col items-center justify-center text-center gap-4 px-4">
                <Wrench className="w-8 h-8 text-[#C9A66B]/50" />
                <p className="text-sm text-slate-400">صف التعديل الذي تريده وسأعرض عليك خطة ومعاينة قبل أي تنفيذ</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {EXAMPLE_CHANGES.map((q) => (
                    <button key={q} onClick={() => askChange(q)} className="text-xs px-3 py-1.5 rounded-full border border-[#C9A66B]/40 text-[#4A3F35] hover:bg-[#FEF9EE] transition-colors">
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {mode === "data"
              ? messages.map((m, i) => <DataAssistantMessage key={i} msg={m} />)
              : messages.map((m, i) => (
                  <ChangePlanMessage
                    key={i}
                    msg={m}
                    deciding={decidingId?.startsWith(`${m.id}:`) ? decidingId.split(":")[1] : null}
                    onDecision={handleDecision}
                  />
                ))}
            {asking && (
              <div className="flex justify-start">
                <div className="bg-[#FEF9EE] rounded-2xl rounded-tr-sm px-4 py-2.5 text-sm text-slate-500 inline-flex items-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> {mode === "data" ? "جارٍ البحث في البيانات..." : "جارٍ تحليل الطلب وإعداد خطة التغيير..."}
                </div>
              </div>
            )}
          </div>

          <form
            onSubmit={(e) => { e.preventDefault(); submit(); }}
            className="mt-4 flex items-end gap-2 border-t border-[#EFE6D3] pt-4"
          >
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); } }}
              placeholder={mode === "data" ? "اكتب سؤالك هنا... / Type your question..." : "صف التعديل الذي تريده... / Describe the change you want..."}
              rows={1}
              className="resize-none flex-1"
            />
            <Button type="submit" disabled={asking || !input.trim()} className="bg-[#4A3F35] hover:bg-[#3a3129] shrink-0">
              {asking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
