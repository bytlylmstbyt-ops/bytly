import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { Send, X, Minimize2, Maximize2, Loader2, Sparkles, Bot, User, RotateCcw, Mic, Square } from "lucide-react";

const QUICK_QUESTIONS = [
  { label: "🔍 أريد مهندساً", text: "أريد البحث عن مهندس مناسب لمشروعي" },
  { label: "💰 الأسعار", text: "ما هي تكاليف وأسعار الخدمات في بيتلي؟" },
  { label: "📋 أنشر مشروع", text: "كيف أنشر مشروعي على المنصة؟" },
  { label: "🏢 أنا مهندس", text: "أريد التسجيل كمهندس في بيتلي" },
];

export default function BytlyAdvisorChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordDuration, setRecordDuration] = useState(0);
  const [showPulse, setShowPulse] = useState(true);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordTimerRef = useRef(null);
  const unsubscribeRef = useRef(null);

  useEffect(() => {
    const t = setTimeout(() => setShowPulse(false), 6000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (isOpen && !conversationId) {
      initConversation();
    }
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 300);
    return () => {
      if (!isOpen && unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [isOpen]);

  const WELCOME = "مرحباً! أنا **Bytly AI** 🌟 مستشارك الهندسي الذكي.\n\nكيف أستطيع مساعدتك اليوم؟\n\n• 🏗️ إيجاد مهندس لمشروعك\n• 💼 الاستفسار عن خدماتنا\n• 📋 نشر مشروعك\n• 🏢 التسجيل كمهندس أو شركة";

  const initConversation = async () => {
    setMessages([{ role: "assistant", content: WELCOME, id: "welcome" }]);
    try {
      const conv = await base44.agents.createConversation({
        agent_name: "bytly_advisor",
        metadata: { source: "widget" }
      });
      setConversationId(conv.id);

      unsubscribeRef.current = base44.agents.subscribeToConversation(conv.id, (data) => {
        try {
          if (data?.messages && data.messages.length > 0) {
            setMessages(data.messages);
            setLoading(false);
          }
        } catch (e) {
          console.warn("Agent update callback error:", e);
        }
      });
    } catch (err) {
      console.error("Chat init error:", err);
    }
  };

  const sendMessage = async (text) => {
    const msg = (text || inputValue).trim();
    if (!msg || loading || !conversationId) return;
    setInputValue("");
    setLoading(true);
    try {
      const conv = await base44.agents.getConversation(conversationId);
      await base44.agents.addMessage(conv, { role: "user", content: msg });
    } catch (err) {
      console.error("Send error:", err);
      setLoading(false);
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "عذراً، حدثت مشكلة. يرجى المحاولة مجدداً. 🔄",
        id: `err-${Date.now()}`
      }]);
    }
  };

  const handleReset = () => {
    if (unsubscribeRef.current) unsubscribeRef.current();
    unsubscribeRef.current = null;
    setConversationId(null);
    setMessages([]);
    initConversation();
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      audioChunksRef.current = [];
      rec.ondataavailable = e => audioChunksRef.current.push(e.data);
      rec.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const file = new File([blob], `voice_${Date.now()}.webm`, { type: "audio/webm" });
        try {
          const { file_url } = await base44.integrations.Core.UploadFile({ file });
          const text = await base44.integrations.Core.TranscribeAudio({ audio_url: file_url });
          if (text) setInputValue(text);
        } catch { /* silent */ }
      };
      mediaRecorderRef.current = rec;
      rec.start();
      setIsRecording(true);
      setRecordDuration(0);
      recordTimerRef.current = setInterval(() => setRecordDuration(p => p + 1), 1000);
    } catch { alert("يرجى السماح بالوصول للميكروفون"); }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
    clearInterval(recordTimerRef.current);
  };

  // Simple markdown renderer
  const renderContent = (text) => {
    const lines = text.split('\n');
    return lines.map((line, i) => {
      if (line.startsWith('**') && line.endsWith('**')) {
        return <p key={i} className="font-bold text-[#6B5D4F] mb-1">{line.slice(2, -2)}</p>;
      }
      const boldRegex = /\*\*(.*?)\*\*/g;
      const parts = [];
      let last = 0, match;
      while ((match = boldRegex.exec(line)) !== null) {
        if (match.index > last) parts.push(line.slice(last, match.index));
        parts.push(<strong key={match.index} className="font-semibold text-[#6B5D4F]">{match[1]}</strong>);
        last = match.index + match[0].length;
      }
      if (last < line.length) parts.push(line.slice(last));
      return <p key={i} className="mb-0.5 last:mb-0">{parts.length ? parts : line}</p>;
    });
  };

  return (
    <>
      {/* Floating Button — on mobile clears BottomNav + safe-area; on desktop stays at bottom-6 */}
      <div className="fixed left-6 z-[9999] bytly-fab-anchor">

        {/* Tooltip */}
        <AnimatePresence>
          {showPulse && !isOpen && (
            <motion.div
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              className="absolute bottom-20 left-0 bg-white border border-amber-200 rounded-2xl px-4 py-2 shadow-lg whitespace-nowrap"
            >
              <p className="text-sm font-medium text-slate-700">👋 كيف أساعدك؟</p>
              <div className="absolute -bottom-1.5 left-5 w-3 h-3 bg-white border-b border-r border-amber-200 rotate-45" />
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          onClick={() => setIsOpen(o => !o)}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.93 }}
          className="w-16 h-16 rounded-2xl shadow-2xl flex items-center justify-center relative overflow-visible"
          style={{ background: "linear-gradient(135deg, #4A3F35 0%, #6B5D4F 50%, #C9A66B 100%)" }}
        >
          <AnimatePresence mode="wait">
            {isOpen
              ? <motion.div key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}><X className="w-7 h-7 text-white" /></motion.div>
              : <motion.div key="bot" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }}><Bot className="w-7 h-7 text-white" /></motion.div>
            }
          </AnimatePresence>
          {!isOpen && <span className="absolute inset-0 rounded-2xl animate-ping opacity-25" style={{ background: "#C9A66B" }} />}
        </motion.button>
      </div>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            className="fixed left-6 z-[9998] flex flex-col rounded-2xl shadow-2xl overflow-hidden bytly-chat-anchor"
            dir="rtl"
            style={{
              width: "360px",
              maxWidth: "calc(100vw - 48px)",
              maxHeight: isMinimized ? "60px" : "560px",
              transition: "max-height 0.3s ease"
            }}
          >
            {/* Header */}
            <div
              className="flex items-center gap-3 px-4 py-3 flex-shrink-0"
              style={{ background: "linear-gradient(135deg, #4A3F35 0%, #6B5D4F 50%, #C9A66B 100%)" }}
            >
              <div className="relative flex-shrink-0">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center border border-white/30">
                  <Sparkles className="w-5 h-5 text-amber-200" />
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-bold text-sm leading-tight">Bytly AI</p>
                <p className="text-amber-200 text-xs">مستشارك الهندسي الذكي ✨</p>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={handleReset} style={{ minWidth: 44, minHeight: 44 }} className="flex items-center justify-center rounded-lg hover:bg-white/20 text-white/70 hover:text-white transition-colors" title="محادثة جديدة">
                  <RotateCcw className="w-4 h-4" />
                </button>
                <button onClick={() => setIsMinimized(m => !m)} style={{ minWidth: 44, minHeight: 44 }} className="flex items-center justify-center rounded-lg hover:bg-white/20 text-white/70 hover:text-white transition-colors">
                  {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
                </button>
                <button onClick={() => setIsOpen(false)} style={{ minWidth: 44, minHeight: 44 }} className="flex items-center justify-center rounded-lg hover:bg-white/20 text-white/70 hover:text-white transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {!isMinimized && (
              <>
                {/* Messages */}
                <div className="flex-1 overflow-y-auto bg-slate-50 p-3 space-y-3" style={{ minHeight: "300px", maxHeight: "370px" }}>
                  {messages.map((msg, idx) => (
                    <motion.div
                      key={msg.id || idx}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex gap-2 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
                    >
                      <div className={`w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center ${
                        msg.role === "user" ? "bg-gradient-to-br from-[#6B5D4F] to-[#C9A66B]" : "bg-gradient-to-br from-[#4A3F35] to-[#8B7355]"
                      }`}>
                        {msg.role === "user" ? <User className="w-4 h-4 text-white" /> : <Sparkles className="w-4 h-4 text-amber-200" />}
                      </div>
                      <div className={`chat-message-content max-w-[78%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                        msg.role === "user"
                          ? "bg-gradient-to-br from-[#6B5D4F] to-[#C9A66B] text-white rounded-tr-sm"
                          : "bg-white text-slate-800 border border-slate-100 shadow-sm rounded-tl-sm"
                      }`}>
                        {msg.role === "assistant" ? renderContent(msg.content || "") : <p>{msg.content}</p>}
                      </div>
                    </motion.div>
                  ))}

                  {loading && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-2">
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#4A3F35] to-[#8B7355] flex items-center justify-center flex-shrink-0">
                        <Sparkles className="w-4 h-4 text-amber-200" />
                      </div>
                      <div className="bg-white border border-slate-100 shadow-sm rounded-2xl rounded-tl-sm px-4 py-3 flex gap-1 items-center">
                        {[0, 150, 300].map(d => (
                          <div key={d} className="w-2 h-2 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: `${d}ms` }} />
                        ))}
                      </div>
                    </motion.div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Quick Questions */}
                {messages.length <= 1 && (
                  <div className="bg-white border-t border-slate-100 px-3 py-2 flex flex-wrap gap-1.5">
                    {QUICK_QUESTIONS.map(q => (
                      <button
                        key={q.label}
                        onClick={() => sendMessage(q.text)}
                        className="text-xs px-2.5 py-1.5 rounded-full border border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100 transition-colors font-medium"
                      >
                        {q.label}
                      </button>
                    ))}
                  </div>
                )}

                {/* Input */}
                <div className="bg-white border-t border-slate-100 p-3 flex-shrink-0">
                  {isRecording && (
                    <div className="flex items-center gap-2 mb-2 px-3 py-1.5 bg-red-50 rounded-xl">
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                      <span className="text-xs text-red-700 font-mono flex-1">
                        {Math.floor(recordDuration / 60)}:{String(recordDuration % 60).padStart(2, "0")}
                      </span>
                      <button onClick={stopRecording} className="text-xs text-red-600 font-medium">إيقاف</button>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={isRecording ? stopRecording : startRecording}
                      style={{ minWidth: 44, minHeight: 44 }}
                      className={`flex items-center justify-center rounded-xl transition-colors flex-shrink-0 ${isRecording ? "bg-red-100 text-red-600" : "bg-slate-100 text-slate-500 hover:bg-amber-100 hover:text-amber-700"}`}
                    >
                      {isRecording ? <Square className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                    </button>
                    <input
                      ref={inputRef}
                      value={inputValue}
                      onChange={e => setInputValue(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="اكتب سؤالك هنا..."
                      disabled={loading}
                      className="flex-1 text-sm bg-slate-100 rounded-xl px-3.5 py-2.5 outline-none focus:ring-2 focus:ring-amber-300 placeholder:text-slate-400 text-slate-800 disabled:opacity-60"
                      dir="rtl"
                    />
                    <motion.button
                      onClick={() => sendMessage()}
                      disabled={loading || !inputValue.trim()}
                      whileTap={{ scale: 0.9 }}
                      className="flex items-center justify-center rounded-xl text-white flex-shrink-0 disabled:opacity-40"
                      style={{ minWidth: 44, minHeight: 44, background: "linear-gradient(135deg, #6B5D4F, #C9A66B)" }}
                    >
                      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" style={{ transform: "scaleX(-1)" }} />}
                    </motion.button>
                  </div>
                  <p className="text-center text-xs text-slate-400 mt-2">Bytly AI • مستشارك الهندسي الذكي 🤖</p>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}