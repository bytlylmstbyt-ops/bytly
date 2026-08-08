import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Sparkles, Send, Loader2, ShieldAlert, ArrowUpRight, ShieldCheck, Eye,
} from "lucide-react";

const EXAMPLE_QUESTIONS = [
  { ar: "أرني المشاريع المتأخرة", en: "Show me overdue projects" },
  { ar: "كم الإيرادات هذا الشهر؟", en: "What's this month's revenue?" },
  { ar: "أعطني أعلى المهندسين تقييمًا", en: "Give me the top-rated engineers" },
  { ar: "ما هي النزاعات المفتوحة؟", en: "What are the open disputes?" },
];

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

function AssistantMessage({ msg }) {
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
  return (
    <div className="flex justify-start">
      <Card className="max-w-[90%] border-[#EFE6D3]">
        <CardContent className="p-4">
          <p className="text-sm text-[#4A3F35] leading-relaxed">{msg.answer}</p>
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
          {msg.dataSources?.length > 0 && (
            <p className="mt-2 text-[11px] text-slate-400">
              مصدر البيانات: {msg.dataSources.join("، ")} · {msg.rowCount ?? 0} سجل
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
          <p className="text-sm text-slate-500">غير مصرح لك بالوصول إلى مساعد بيانات المنصة.</p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AdminAIAssistant() {
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [asking, setAsking] = useState(false);
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

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, asking]);

  const ask = async (question) => {
    const q = (question ?? input).trim();
    if (!q || asking) return;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", text: q }]);
    setAsking(true);
    try {
      const res = await base44.functions.invoke("platformDataAssistant", { question: q });
      const data = res.data;
      if (data?.error) {
        setMessages((prev) => [...prev, { role: "error", text: data.error }]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            answer: data.answer,
            table: data.table,
            admin_page: data.admin_page,
            dataSources: data.table?.rows?.length ? undefined : undefined,
            rowCount: data.table?.rows?.length,
          },
        ]);
      }
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        { role: "error", text: "تعذّر الحصول على إجابة الآن. حاول مرة أخرى." },
      ]);
    } finally {
      setAsking(false);
    }
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
          <h1 className="text-2xl font-bold text-[#4A3F35]">مساعد بيانات المنصة</h1>
        </div>
        <p className="text-sm text-slate-500 mt-1">
          اسأل بلغتك الطبيعية (عربي أو إنجليزي) عن بيانات بيتلي. هذا المساعد للقراءة فقط — لا يعدّل أي كود أو بيانات.
        </p>
      </div>

      <div className="flex items-center gap-4 mb-4 text-xs text-slate-500">
        <span className="inline-flex items-center gap-1.5">
          <Eye className="w-3.5 h-3.5 text-[#C9A66B]" /> قراءة فقط
        </span>
        <span className="inline-flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-[#C9A66B]" /> كل سؤال يُسجَّل في سجل التدقيق
        </span>
      </div>

      <Card className="border-[#EFE6D3]">
        <CardContent className="p-4">
          <div ref={scrollRef} className="h-[50vh] overflow-y-auto space-y-3 pr-1">
            {messages.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center gap-4 px-4">
                <Sparkles className="w-8 h-8 text-[#C9A66B]/50" />
                <p className="text-sm text-slate-400">جرّب أحد الأسئلة التالية، أو اكتب سؤالك الخاص</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {EXAMPLE_QUESTIONS.map((q) => (
                    <button
                      key={q.ar}
                      onClick={() => ask(q.ar)}
                      className="text-xs px-3 py-1.5 rounded-full border border-[#C9A66B]/40 text-[#4A3F35] hover:bg-[#FEF9EE] transition-colors"
                    >
                      {q.ar}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((m, i) => (
              <AssistantMessage key={i} msg={m} />
            ))}
            {asking && (
              <div className="flex justify-start">
                <div className="bg-[#FEF9EE] rounded-2xl rounded-tr-sm px-4 py-2.5 text-sm text-slate-500 inline-flex items-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> جارٍ البحث في البيانات...
                </div>
              </div>
            )}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              ask();
            }}
            className="mt-4 flex items-end gap-2 border-t border-[#EFE6D3] pt-4"
          >
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  ask();
                }
              }}
              placeholder="اكتب سؤالك هنا... / Type your question..."
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
