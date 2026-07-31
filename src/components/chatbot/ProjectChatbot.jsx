import React, { useState, useRef, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Loader2, Bot, User, AlertTriangle, CheckCircle, X, ChevronDown, ChevronUp, Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

const QUICK_QUESTIONS = [
  "ما حالة المشروع الحالية؟",
  "هل هناك تأخير في الجدول الزمني؟",
  "كم مرحلة متبقية؟",
  "ملخص المشروع",
];

export default function ProjectChatbot({ projectId, projectTitle }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: `مرحباً! 👋 أنا مساعدك الذكي لمشروع "${projectTitle || 'مشروعك'}". يمكنني تحليل بيانات المشروع والإجابة على أسئلتك حول الحالة والجداول الزمنية والتأخير. كيف يمكنني مساعدتك؟`,
      timestamp: new Date().toISOString(),
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [delayAlerts, setDelayAlerts] = useState([]);
  const [projectSummary, setProjectSummary] = useState(null);
  const [attachments, setAttachments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto-load project summary on open
  useEffect(() => {
    if (isOpen && messages.length === 1) {
      handleSend("ملخص المشروع", true);
    }
  }, [isOpen]);

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setUploading(true);
    for (const file of files) {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setAttachments(prev => [...prev, { name: file.name, url: file_url }]);
    }
    setUploading(false);
  };

  const handleSend = async (messageOverride, silent = false) => {
    const text = messageOverride || input.trim();
    if (!text && attachments.length === 0) return;

    if (!silent) {
      setMessages(prev => [...prev, {
        role: "user",
        content: text || "📎 ملف مرفق",
        attachments: [...attachments],
        timestamp: new Date().toISOString()
      }]);
      setInput("");
      setAttachments([]);
    }

    setLoading(true);
    try {
      const conversationHistory = messages.slice(-6);
      const res = await base44.functions.invoke("projectAIChatbot", {
        project_id: projectId,
        user_message: text,
        conversation_history: conversationHistory,
        attachments: attachments.map(a => a.url),
      });

      const data = res.data;

      if (data.delay_alerts) setDelayAlerts(data.delay_alerts);
      if (data.project_summary) setProjectSummary(data.project_summary);

      setMessages(prev => [...prev, {
        role: "assistant",
        content: data.response || "لا توجد استجابة.",
        timestamp: new Date().toISOString(),
        delay_alerts: data.delay_alerts,
      }]);
    } catch (err) {
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "⚠️ حدث خطأ في معالجة طلبك. تأكد من صلاحياتك وحاول مرة أخرى.",
        timestamp: new Date().toISOString()
      }]);
    } finally {
      setLoading(false);
    }
  };

  const hasDelays = delayAlerts.some(d => d.daysOverdue > 0);

  return (
    <div className="relative">
      {/* Trigger Button */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 ${hasDelays ? 'bg-red-600 hover:bg-red-700' : 'bg-gradient-to-r from-[#1a1a2e] to-[#C9A66B]'} text-white`}
      >
        <Bot className="w-4 h-4" />
        مساعد المشروع الذكي
        {hasDelays && (
          <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
        )}
        {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </Button>

      {/* Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.97 }}
            className="absolute left-0 top-12 z-50 w-[420px] max-w-[95vw] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden"
            style={{ maxHeight: '540px' }}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-[#1a1a2e] to-[#C9A66B] p-4 flex items-center justify-between">
              <div className="flex items-center gap-2 text-white">
                <Bot className="w-5 h-5" />
                <div>
                  <p className="font-semibold text-sm">مساعد المشروع الذكي</p>
                  <p className="text-xs text-white/70">يعمل بـ Gemini AI</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {projectSummary && (
                  <Badge className={`text-xs ${projectSummary.has_delays ? 'bg-red-500' : 'bg-green-500'} text-white`}>
                    {projectSummary.has_delays ? '⚠️ تأخير' : `✅ ${projectSummary.progress}%`}
                  </Badge>
                )}
                <button onClick={() => setIsOpen(false)} className="text-white/80 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Delay Alerts Bar */}
            {hasDelays && (
              <div className="bg-red-50 border-b border-red-200 px-4 py-2">
                <p className="text-xs text-red-700 font-semibold flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  {delayAlerts.filter(d => d.daysOverdue > 0).length} مراحل متأخرة عن الجدول
                </p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {delayAlerts.filter(d => d.daysOverdue > 0).map((a, i) => (
                    <span key={i} className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                      {a.milestone} • {a.daysOverdue} يوم
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ maxHeight: '300px' }}>
              {messages.map((msg, i) => (
                <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role === 'assistant' && (
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#1a1a2e] to-[#C9A66B] flex items-center justify-center flex-shrink-0 mt-1">
                      <Bot className="w-3.5 h-3.5 text-white" />
                    </div>
                  )}
                  <div className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                    msg.role === 'user'
                      ? 'bg-[#C9A66B] text-white rounded-tr-sm'
                      : 'bg-slate-100 text-slate-800 rounded-tl-sm'
                  }`}>
                    {msg.content}
                    {msg.attachments?.map((a, j) => (
                      <a key={j} href={a.url} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1 mt-1 text-xs underline opacity-80">
                        <Paperclip className="w-3 h-3" />{a.name}
                      </a>
                    ))}
                  </div>
                  {msg.role === 'user' && (
                    <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0 mt-1">
                      <User className="w-3.5 h-3.5 text-slate-600" />
                    </div>
                  )}
                </div>
              ))}
              {loading && (
                <div className="flex gap-2 justify-start">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#1a1a2e] to-[#C9A66B] flex items-center justify-center flex-shrink-0">
                    <Bot className="w-3.5 h-3.5 text-white" />
                  </div>
                  <div className="bg-slate-100 rounded-2xl rounded-tl-sm px-4 py-3">
                    <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Questions */}
            <div className="px-3 py-2 border-t border-slate-100 flex flex-wrap gap-1">
              {QUICK_QUESTIONS.map((q, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(q)}
                  disabled={loading}
                  className="text-xs bg-slate-100 hover:bg-[#C9A66B]/20 text-slate-600 hover:text-[#1a1a2e] px-2 py-1 rounded-full transition-colors disabled:opacity-50"
                >
                  {q}
                </button>
              ))}
            </div>

            {/* Input */}
            <div className="p-3 border-t border-slate-100 flex gap-2">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                multiple
                accept=".pdf,.dwg,.dxf,.jpg,.jpeg,.png,.xlsx,.doc,.docx"
                className="hidden"
              />
              <Button
                variant="outline"
                size="icon"
                className="flex-shrink-0"
                onClick={() => fileInputRef.current?.click()}
                disabled={loading || uploading}
                title="إرفاق ملف"
              >
                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Paperclip className="w-4 h-4" />}
              </Button>
              <Input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
                placeholder="اسأل عن حالة المشروع..."
                disabled={loading}
                className="text-sm flex-1"
              />
              <Button
                size="icon"
                onClick={() => handleSend()}
                disabled={loading || (!input.trim() && attachments.length === 0)}
                className="bg-[#C9A66B] hover:bg-[#c89864] flex-shrink-0"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </Button>
            </div>
            {attachments.length > 0 && (
              <div className="px-3 pb-2 flex flex-wrap gap-1">
                {attachments.map((f, i) => (
                  <span key={i} className="text-xs bg-slate-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Paperclip className="w-3 h-3" />{f.name}
                    <button onClick={() => setAttachments(prev => prev.filter((_, j) => j !== i))}><X className="w-3 h-3" /></button>
                  </span>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}