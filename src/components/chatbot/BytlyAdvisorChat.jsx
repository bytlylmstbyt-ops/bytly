import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, X, Minimize2, Maximize2, Loader2, Sparkles, Bot, User, RotateCcw, Mic, Square } from "lucide-react";
import { callGemini } from "@/lib/geminiClient";

const QUICK_QUESTIONS = [
  { label: "🔍 أريد مهندساً", text: "أريد البحث عن مهندس مناسب لمشروعي" },
  { label: "💰 الأسعار", text: "ما هي تكاليف وأسعار الخدمات في بيتلي؟" },
  { label: "📋 أنشر مشروع", text: "كيف أنشر مشروعي على المنصة؟" },
  { label: "🏢 أنا مهندس", text: "أريد التسجيل كمهندس في بيتلي" },
];

const WELCOME = "مرحباً! أنا **Bytly AI** 🌟 مستشارك الهندسي الذكي.\n\nكيف أستطيع مساعدتك اليوم؟\n\n• 🏗️ إيجاد مهندس لمشروعك\n• 💼 الاستفسار عن خدماتنا\n• 📋 نشر مشروعك\n• 🏢 التسجيل كمهندس أو شركة";

export default function BytlyAdvisorChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([{ role: "assistant", content: WELCOME, id: "welcome" }]);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordDuration, setRecordDuration] = useState(0);
  const [showPulse, setShowPulse] = useState(true);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordTimerRef = useRef(null);

  useEffect(() => {
    const timer = setTimeout(() => setShowPulse(false), 6000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (isOpen && !isMinimized) {
      const timer = setTimeout(() => inputRef.current?.focus(), 150);
      return () => clearTimeout(timer);
    }
  }, [isOpen, isMinimized]);

  useEffect(() => () => {
    clearInterval(recordTimerRef.current);
    mediaRecorderRef.current?.stream?.getTracks?.().forEach((track) => track.stop());
  }, []);

  const sendMessage = async (text) => {
    const msg = String(text ?? inputValue).trim();
    if (!msg || loading) return;

    setInputValue("");
    setMessages((prev) => [...prev, { role: "user", content: msg, id: `user-${Date.now()}` }]);
    setLoading(true);

    try {
      const result = await callGemini({
        agent: "assistant",
        prompt: msg,
        context: {
          source: "bytly_advisor_chat",
          conversation: messages.slice(-12).map(({ role, content }) => ({ role, content })),
        },
      });

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: typeof result === "string" ? result : JSON.stringify(result), id: `assistant-${Date.now()}` },
      ]);
    } catch (error) {
      console.error("Bytly AI error:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `تعذر الاتصال بالمساعد الذكي حالياً. ${error?.message || "يرجى المحاولة مرة أخرى."}`,
          id: `error-${Date.now()}`,
        },
      ]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const handleReset = () => {
    if (isRecording) stopRecording();
    setMessages([{ role: "assistant", content: WELCOME, id: `welcome-${Date.now()}` }]);
    setInputValue("");
    setLoading(false);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  };

  const startRecording = async () => {
    try {
      if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
        throw new Error("الميكروفون غير مدعوم في هذا المتصفح");
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        setIsRecording(false);
        clearInterval(recordTimerRef.current);
        setRecordDuration(0);
        setMessages((prev) => [...prev, {
          role: "assistant",
          content: "تم تسجيل الصوت. الإدخال الصوتي سيُفعّل عبر خدمة تحويل الكلام إلى نص في مرحلة التكامل التالية.",
          id: `voice-${Date.now()}`,
        }]);
      };
      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
      setRecordDuration(0);
      recordTimerRef.current = setInterval(() => setRecordDuration((value) => value + 1), 1000);
    } catch (error) {
      console.error("Microphone error:", error);
      alert("يرجى السماح بالوصول إلى الميكروفون أو استخدام متصفح يدعم التسجيل الصوتي.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current?.state !== "inactive") mediaRecorderRef.current?.stop();
    else setIsRecording(false);
    clearInterval(recordTimerRef.current);
  };

  const renderContent = (text) => text.split("\n").map((line, index) => {
    const parts = [];
    const regex = /\*\*(.*?)\*\*/g;
    let last = 0;
    let match;
    while ((match = regex.exec(line)) !== null) {
      if (match.index > last) parts.push(line.slice(last, match.index));
      parts.push(<strong key={`${index}-${match.index}`} className="font-semibold text-[#6B5D4F]">{match[1]}</strong>);
      last = match.index + match[0].length;
    }
    if (last < line.length) parts.push(line.slice(last));
    return <p key={index} className="mb-0.5 last:mb-0">{parts.length ? parts : line || "\u00A0"}</p>;
  });

  return (
    <>
      <div className="fixed left-6 bottom-[calc(5rem+env(safe-area-inset-bottom))] md:bottom-6 z-[9999]">
        <AnimatePresence>
          {showPulse && !isOpen && (
            <motion.div
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              className="absolute bottom-20 left-0 bg-white border border-amber-200 rounded-2xl px-4 py-2 shadow-lg whitespace-nowrap"
            >
              <p className="text-sm font-medium text-slate-700">👋 كيف أساعدك؟</p>
            </motion.div>
          )}
        </AnimatePresence>
        <motion.button
          type="button"
          aria-label="فتح مساعد Bytly AI"
          onClick={() => setIsOpen((open) => !open)}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.93 }}
          className="w-16 h-16 rounded-2xl shadow-2xl flex items-center justify-center relative overflow-visible"
          style={{ background: "linear-gradient(135deg, #4A3F35 0%, #6B5D4F 50%, #C9A66B 100%)" }}
        >
          {isOpen ? <X className="w-7 h-7 text-white" /> : <Bot className="w-7 h-7 text-white" />}
        </motion.button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            className="fixed left-6 bottom-[calc(10rem+env(safe-area-inset-bottom))] md:bottom-24 z-[9998] flex flex-col rounded-2xl shadow-2xl overflow-hidden"
            dir="rtl"
            style={{ width: "360px", maxWidth: "calc(100vw - 48px)", maxHeight: isMinimized ? "60px" : "560px" }}
          >
            <div className="flex items-center gap-3 px-4 py-3 flex-shrink-0" style={{ background: "linear-gradient(135deg, #4A3F35 0%, #6B5D4F 50%, #C9A66B 100%)" }}>
              <div className="relative flex-shrink-0">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center border border-white/30"><Sparkles className="w-5 h-5 text-amber-200" /></div>
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-bold text-sm leading-tight">Bytly AI</p>
                <p className="text-amber-200 text-xs">مستشارك الهندسي الذكي ✨</p>
              </div>
              <div className="flex items-center gap-1">
                <button type="button" onClick={handleReset} className="flex items-center justify-center rounded-lg hover:bg-white/20 text-white/70 hover:text-white" style={{ minWidth: 44, minHeight: 44 }} title="محادثة جديدة" aria-label="محادثة جديدة"><RotateCcw className="w-4 h-4" /></button>
                <button type="button" onClick={() => setIsMinimized((value) => !value)} className="flex items-center justify-center rounded-lg hover:bg-white/20 text-white/70 hover:text-white" style={{ minWidth: 44, minHeight: 44 }} aria-label={isMinimized ? "تكبير المحادثة" : "تصغير المحادثة"}>{isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}</button>
                <button type="button" onClick={() => setIsOpen(false)} className="flex items-center justify-center rounded-lg hover:bg-white/20 text-white/70 hover:text-white" style={{ minWidth: 44, minHeight: 44 }} aria-label="إغلاق"><X className="w-4 h-4" /></button>
              </div>
            </div>

            {!isMinimized && (
              <>
                <div className="flex-1 overflow-y-auto bg-slate-50 p-3 space-y-3" style={{ minHeight: 300, maxHeight: 370 }}>
                  {messages.map((message, index) => (
                    <motion.div key={message.id || index} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className={`flex gap-2 ${message.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                      <div className={`w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center ${message.role === "user" ? "bg-gradient-to-br from-[#6B5D4F] to-[#C9A66B]" : "bg-gradient-to-br from-[#4A3F35] to-[#8B7355]"}`}>
                        {message.role === "user" ? <User className="w-4 h-4 text-white" /> : <Sparkles className="w-4 h-4 text-amber-200" />}
                      </div>
                      <div className={`max-w-[78%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${message.role === "user" ? "bg-gradient-to-br from-[#6B5D4F] to-[#C9A66B] text-white rounded-tr-sm" : "bg-white text-slate-800 border border-slate-100 shadow-sm rounded-tl-sm"}`}>
                        {message.role === "assistant" ? renderContent(message.content || "") : <p>{message.content}</p>}
                      </div>
                    </motion.div>
                  ))}
                  {loading && <div className="flex gap-2"><div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#4A3F35] to-[#8B7355] flex items-center justify-center flex-shrink-0"><Sparkles className="w-4 h-4 text-amber-200" /></div><div className="bg-white border border-slate-100 shadow-sm rounded-2xl px-4 py-3"><Loader2 className="w-4 h-4 animate-spin text-[#C9A66B]" /></div></div>}
                  <div ref={messagesEndRef} />
                </div>

                {messages.length <= 1 && !loading && (
                  <div className="bg-white border-t border-slate-100 px-3 py-2 flex flex-wrap gap-1.5">
                    {QUICK_QUESTIONS.map((question) => (
                      <button key={question.label} type="button" onClick={() => sendMessage(question.text)} className="text-xs px-2.5 py-1.5 rounded-full border border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100 transition-colors font-medium">{question.label}</button>
                    ))}
                  </div>
                )}

                <div className="bg-white border-t border-slate-100 p-3 flex-shrink-0">
                  {isRecording && <div className="flex items-center gap-2 mb-2 px-3 py-1.5 bg-red-50 rounded-xl"><span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" /><span className="text-xs text-red-700 font-mono flex-1">{Math.floor(recordDuration / 60)}:{String(recordDuration % 60).padStart(2, "0")}</span><button type="button" onClick={stopRecording} className="text-xs text-red-600 font-medium">إيقاف</button></div>}
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={isRecording ? stopRecording : startRecording} className={`flex items-center justify-center rounded-xl transition-colors flex-shrink-0 ${isRecording ? "bg-red-100 text-red-600" : "bg-slate-100 text-slate-500 hover:bg-amber-100 hover:text-amber-700"}`} style={{ minWidth: 44, minHeight: 44 }} aria-label={isRecording ? "إيقاف التسجيل" : "تسجيل صوتي"}>{isRecording ? <Square className="w-4 h-4" /> : <Mic className="w-4 h-4" />}</button>
                    <input ref={inputRef} value={inputValue} onChange={(event) => setInputValue(event.target.value)} onKeyDown={handleKeyDown} placeholder="اكتب سؤالك هنا..." disabled={loading} className="flex-1 text-sm bg-slate-100 rounded-xl px-3.5 py-2.5 outline-none focus:ring-2 focus:ring-amber-300 placeholder:text-slate-400 text-slate-800 disabled:opacity-60" dir="rtl" aria-label="رسالة إلى Bytly AI" />
                    <motion.button type="button" onClick={() => sendMessage()} disabled={loading || !inputValue.trim()} whileTap={{ scale: 0.9 }} className="flex items-center justify-center rounded-xl text-white flex-shrink-0 disabled:opacity-40" style={{ minWidth: 44, minHeight: 44, background: "linear-gradient(135deg, #6B5D4F, #C9A66B)" }} aria-label="إرسال الرسالة">{loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" style={{ transform: "scaleX(-1)" }} />}</motion.button>
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
