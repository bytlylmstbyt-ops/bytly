import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { Send, X, Minimize2, Maximize2, Mic, Square, Loader2, Sparkles, Bot, User, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import ReactMarkdown from "react-markdown";

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
  const [hasNewMessage, setHasNewMessage] = useState(false);
  const [showWelcomePulse, setShowWelcomePulse] = useState(true);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordTimerRef = useRef(null);

  useEffect(() => {
    const timer = setTimeout(() => setShowWelcomePulse(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      initConversation();
    }
    if (isOpen) {
      setHasNewMessage(false);
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const initConversation = async () => {
    try {
      const conv = await base44.agents.createConversation({
        agent_name: "bytly_advisor",
        metadata: { source: "widget", page: window.location.pathname }
      });
      setConversationId(conv.id);

      // Subscribe to real-time updates
      const unsubscribe = base44.agents.subscribeToConversation(conv.id, (data) => {
        setMessages(data.messages || []);
      });

      // Initial greeting
      setMessages([{
        role: "assistant",
        content: "مرحباً! أنا **Bytly AI** 🌟 مستشارك الهندسي الذكي من منصة بيتلي.\n\nيسعدني مساعدتك في:\n- 🏗️ إيجاد المهندس المثالي لمشروعك\n- 💼 الاستفسار عن خدماتنا وأسعارنا\n- 📋 نشر مشروعك والحصول على عروض\n- 🏢 التسجيل في المنصة كمهندس أو شركة\n\n**بماذا أستطيع مساعدتك اليوم؟** 😊",
        id: "welcome"
      }]);

      return () => unsubscribe();
    } catch (err) {
      console.error("Failed to init conversation", err);
    }
  };

  const sendMessage = async (text) => {
    const msg = text || inputValue.trim();
    if (!msg || loading || !conversationId) return;

    setInputValue("");
    setLoading(true);

    // Optimistic user message
    const tempUserMsg = { role: "user", content: msg, id: `temp-${Date.now()}` };
    setMessages(prev => [...prev, tempUserMsg]);

    try {
      const conv = await base44.agents.getConversation(conversationId);
      await base44.agents.addMessage(conv, { role: "user", content: msg });
    } catch (err) {
      console.error("Send error:", err);
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "عذراً، حدثت مشكلة تقنية. يرجى المحاولة مجدداً. 🔄",
        id: `err-${Date.now()}`
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleReset = async () => {
    setMessages([]);
    setConversationId(null);
    await initConversation();
  };

  // Voice recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      audioChunksRef.current = [];
      mediaRecorder.ondataavailable = (e) => audioChunksRef.current.push(e.data);
      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const file = new File([blob], `voice_${Date.now()}.webm`, { type: "audio/webm" });
        try {
          const { file_url } = await base44.integrations.Core.UploadFile({ file });
          const text = await base44.integrations.Core.TranscribeAudio({ audio_url: file_url });
          if (text) setInputValue(text);
        } catch { /* silent */ }
      };
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
      setRecordDuration(0);
      recordTimerRef.current = setInterval(() => setRecordDuration(p => p + 1), 1000);
    } catch {
      alert("يرجى السماح بالوصول للميكروفون");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(recordTimerRef.current);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <div className="fixed bottom-6 left-6 z-[9999] flex flex-col items-start gap-2">
        {/* Welcome Tooltip */}
        <AnimatePresence>
          {showWelcomePulse && !isOpen && (
            <motion.div
              initial={{ opacity: 0, x: -10, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -10, scale: 0.9 }}
              className="bg-white border border-amber-200 rounded-xl px-4 py-2.5 shadow-lg flex items-center gap-2 max-w-[200px]"
            >
              <span className="text-sm text-slate-700 font-medium">👋 كيف أساعدك؟</span>
              <div className="absolute -bottom-2 left-5 w-3 h-3 bg-white border-r border-b border-amber-200 rotate-45" />
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          onClick={() => setIsOpen(!isOpen)}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
          className="relative w-16 h-16 rounded-2xl shadow-2xl overflow-hidden flex items-center justify-center"
          style={{ background: "linear-gradient(135deg, #6B5D4F 0%, #C9A66B 60%, #B8936D 100%)" }}
        >
          <AnimatePresence mode="wait">
            {isOpen ? (
              <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}>
                <X className="w-7 h-7 text-white" />
              </motion.div>
            ) : (
              <motion.div key="open" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} className="flex flex-col items-center">
                <Bot className="w-7 h-7 text-white" />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Pulse Ring */}
          {!isOpen && (
            <>
              <span className="absolute inset-0 rounded-2xl animate-ping opacity-20 bg-amber-400" />
              <span className="absolute inset-0 rounded-2xl animate-pulse opacity-10 bg-amber-300" />
            </>
          )}

          {/* New Message Badge */}
          {hasNewMessage && !isOpen && (
            <span className="absolute top-1 right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white animate-bounce" />
          )}
        </motion.button>
      </div>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.92 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed bottom-28 left-6 z-[9998] w-[380px] max-w-[calc(100vw-48px)] flex flex-col rounded-2xl overflow-hidden shadow-2xl"
            dir="rtl"
            style={{ maxHeight: isMinimized ? "60px" : "580px" }}
          >
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3 flex-shrink-0" style={{ background: "linear-gradient(135deg, #4A3F35 0%, #6B5D4F 50%, #C9A66B 100%)" }}>
              {/* Avatar */}
              <div className="relative">
                <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
                  <Sparkles className="w-5 h-5 text-amber-200" />
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-white" />
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-white font-bold text-sm">Bytly AI</p>
                <p className="text-amber-200 text-xs truncate">مستشارك الهندسي الذكي 🌟</p>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={handleReset}
                  className="p-1.5 rounded-lg hover:bg-white/20 transition-colors text-white/70 hover:text-white"
                  title="محادثة جديدة"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="p-1.5 rounded-lg hover:bg-white/20 transition-colors text-white/70 hover:text-white"
                >
                  {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-white/20 transition-colors text-white/70 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {!isMinimized && (
              <>
                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto bg-slate-50 p-4 space-y-3" style={{ minHeight: "320px", maxHeight: "380px" }}>
                  {messages.map((msg, idx) => (
                    <motion.div
                      key={msg.id || idx}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex gap-2 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
                    >
                      {/* Avatar */}
                      <div className={`flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center ${
                        msg.role === "user"
                          ? "bg-gradient-to-br from-[#6B5D4F] to-[#C9A66B]"
                          : "bg-gradient-to-br from-[#4A3F35] to-[#8B7355]"
                      }`}>
                        {msg.role === "user"
                          ? <User className="w-4 h-4 text-white" />
                          : <Sparkles className="w-4 h-4 text-amber-200" />
                        }
                      </div>

                      {/* Bubble */}
                      <div className={`max-w-[75%] ${msg.role === "user" ? "items-end" : "items-start"} flex flex-col gap-1`}>
                        <div className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                          msg.role === "user"
                            ? "bg-gradient-to-br from-[#6B5D4F] to-[#C9A66B] text-white rounded-tr-sm"
                            : "bg-white text-slate-800 border border-slate-100 shadow-sm rounded-tl-sm"
                        }`}>
                          {msg.role === "assistant" ? (
                            <ReactMarkdown
                              components={{
                                p: ({ children }) => <p className="mb-1 last:mb-0">{children}</p>,
                                strong: ({ children }) => <strong className="font-semibold text-[#6B5D4F]">{children}</strong>,
                                ul: ({ children }) => <ul className="list-none space-y-0.5 mt-1">{children}</ul>,
                                li: ({ children }) => <li className="flex items-start gap-1 text-slate-700">{children}</li>,
                                a: ({ href, children }) => (
                                  <a href={href} className="text-amber-600 underline hover:text-amber-700" target="_blank" rel="noopener noreferrer">{children}</a>
                                ),
                              }}
                            >
                              {msg.content}
                            </ReactMarkdown>
                          ) : (
                            <p>{msg.content}</p>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}

                  {/* Typing Indicator */}
                  {loading && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-2 items-end">
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#4A3F35] to-[#8B7355] flex items-center justify-center flex-shrink-0">
                        <Sparkles className="w-4 h-4 text-amber-200" />
                      </div>
                      <div className="bg-white border border-slate-100 shadow-sm rounded-2xl rounded-tl-sm px-4 py-3">
                        <div className="flex gap-1 items-center">
                          <div className="w-2 h-2 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                          <div className="w-2 h-2 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                          <div className="w-2 h-2 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                        </div>
                      </div>
                    </motion.div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Quick Questions */}
                {messages.length <= 1 && (
                  <div className="bg-white border-t border-slate-100 px-3 py-2">
                    <div className="flex flex-wrap gap-1.5">
                      {QUICK_QUESTIONS.map((q) => (
                        <button
                          key={q.label}
                          onClick={() => sendMessage(q.text)}
                          className="text-xs px-2.5 py-1.5 rounded-full border border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100 hover:border-amber-300 transition-all font-medium"
                        >
                          {q.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Input Area */}
                <div className="bg-white border-t border-slate-100 p-3 flex-shrink-0">
                  {isRecording && (
                    <div className="flex items-center gap-2 mb-2 px-3 py-1.5 bg-red-50 rounded-xl">
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                      <span className="text-xs text-red-700 font-mono flex-1">
                        جاري التسجيل... {Math.floor(recordDuration / 60)}:{String(recordDuration % 60).padStart(2, "0")}
                      </span>
                      <button onClick={stopRecording} className="text-xs text-red-600 font-medium hover:text-red-800">
                        إيقاف
                      </button>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <button
                      onClick={isRecording ? stopRecording : startRecording}
                      className={`p-2 rounded-xl transition-all flex-shrink-0 ${
                        isRecording
                          ? "bg-red-100 text-red-600 hover:bg-red-200"
                          : "bg-slate-100 text-slate-500 hover:bg-amber-100 hover:text-amber-700"
                      }`}
                    >
                      {isRecording ? <Square className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                    </button>

                    <input
                      ref={inputRef}
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="اكتب سؤالك هنا..."
                      disabled={loading}
                      className="flex-1 text-sm bg-slate-100 rounded-xl px-3.5 py-2.5 outline-none focus:ring-2 focus:ring-amber-300 transition-all placeholder:text-slate-400 text-slate-800 disabled:opacity-60"
                      dir="rtl"
                    />

                    <motion.button
                      onClick={() => sendMessage()}
                      disabled={loading || !inputValue.trim()}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="p-2.5 rounded-xl text-white transition-all flex-shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
                      style={{ background: "linear-gradient(135deg, #6B5D4F, #C9A66B)" }}
                    >
                      {loading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" style={{ transform: "scaleX(-1)" }} />
                      )}
                    </motion.button>
                  </div>

                  <p className="text-center text-xs text-slate-400 mt-2">
                    Bytly AI • مستشارك الهندسي الذكي 🤖
                  </p>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}