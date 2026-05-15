import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Mic, MicOff, Paperclip, Bot, User, Loader2, X, Image as ImageIcon, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";

export default function AIChat({
  agentId,
  agentName,
  agentIcon,
  agentColor = "from-purple-500 to-pink-500",
  systemPrompt,
  placeholder = "اكتب رسالتك...",
  allowImages = false,
  initialMessage,
  onResultGenerated
}) {
  const [messages, setMessages] = useState(() => {
    const initial = initialMessage || `مرحباً! أنا ${agentName}. كيف يمكنني مساعدتك اليوم؟`;
    return [{ role: "assistant", content: initial, timestamp: new Date() }];
  });
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [recording, setRecording] = useState(false);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const conversationHistory = messages.map(m => ({
    role: m.role,
    content: m.content
  }));

  const sendMessage = async (text, imgUrl = null) => {
    if (!text.trim() && !imgUrl) return;
    const userMsg = { role: "user", content: text, image: imgUrl, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setUploadedImage(null);
    setImageUrl(null);
    setLoading(true);

    const historyForPrompt = conversationHistory.slice(-10).map(m =>
      `${m.role === "user" ? "المستخدم" : "المساعد"}: ${m.content}`
    ).join("\n");

    const fullPrompt = `${systemPrompt}

سجل المحادثة:
${historyForPrompt}

المستخدم: ${text}

أجب بشكل احترافي وعملي. استخدم التنسيق الجيد مع النقاط والعناوين عند الحاجة.`;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: fullPrompt,
      file_urls: imgUrl ? [imgUrl] : undefined,
    });

    const assistantMsg = { role: "assistant", content: result, timestamp: new Date() };
    setMessages(prev => [...prev, assistantMsg]);
    setLoading(false);
    if (onResultGenerated) onResultGenerated(result);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage(input, imageUrl);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setUploadedImage(ev.target.result);
    reader.readAsDataURL(file);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setImageUrl(file_url);
  };

  const toggleRecording = async () => {
    if (recording) {
      mediaRecorderRef.current?.stop();
      setRecording(false);
      return;
    }
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mediaRecorder = new MediaRecorder(stream);
    mediaRecorderRef.current = mediaRecorder;
    audioChunksRef.current = [];
    mediaRecorder.ondataavailable = e => audioChunksRef.current.push(e.data);
    mediaRecorder.onstop = async () => {
      const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
      const { file_url } = await base44.integrations.Core.UploadFile({ file: blob });
      const transcript = await base44.integrations.Core.TranscribeAudio({ audio_url: file_url });
      setInput(transcript);
    };
    mediaRecorder.start();
    setRecording(true);
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" });
  };

  const renderContent = (text) => {
    const lines = text.split("\n");
    return lines.map((line, i) => {
      if (line.startsWith("## ")) return <h3 key={i} className="font-bold text-base mt-3 mb-1">{line.slice(3)}</h3>;
      if (line.startsWith("# ")) return <h2 key={i} className="font-bold text-lg mt-3 mb-1">{line.slice(2)}</h2>;
      if (line.startsWith("- ") || line.startsWith("• ")) return <div key={i} className="flex gap-2 my-0.5"><span className="text-amber-400 mt-0.5">•</span><span>{line.slice(2)}</span></div>;
      if (line.startsWith("**") && line.endsWith("**")) return <strong key={i} className="font-bold block my-0.5">{line.slice(2, -2)}</strong>;
      if (line === "") return <div key={i} className="h-2" />;
      return <p key={i} className="my-0.5 leading-relaxed">{line}</p>;
    });
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 rounded-2xl overflow-hidden border border-white/10">
      {/* Header */}
      <div className={`bg-gradient-to-r ${agentColor} p-4 flex items-center gap-3`}>
        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-white">
          {agentIcon || <Bot className="w-6 h-6" />}
        </div>
        <div>
          <div className="text-white font-bold">{agentName}</div>
          <div className="text-white/70 text-xs flex items-center gap-1">
            <span className="w-2 h-2 bg-green-400 rounded-full inline-block animate-pulse" />
            متاح الآن
          </div>
        </div>
        <div className="mr-auto">
          <Sparkles className="w-5 h-5 text-white/60" />
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
        <AnimatePresence initial={false}>
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
            >
              <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-white text-sm ${
                msg.role === "user" ? "bg-amber-500" : `bg-gradient-to-br ${agentColor}`
              }`}>
                {msg.role === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>
              <div className={`max-w-[80%] ${msg.role === "user" ? "items-end" : "items-start"} flex flex-col`}>
                {msg.image && (
                  <img src={msg.image} alt="uploaded" className="w-48 h-32 object-cover rounded-xl mb-2 border border-white/20" />
                )}
                <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-amber-500/20 text-white border border-amber-500/30 rounded-tr-sm"
                    : "bg-white/5 text-slate-200 border border-white/10 rounded-tl-sm"
                }`}>
                  {renderContent(msg.content)}
                </div>
                <span className="text-xs text-slate-600 mt-1">{formatTime(msg.timestamp)}</span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
            <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${agentColor} flex items-center justify-center`}>
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl rounded-tl-sm px-4 py-3">
              <div className="flex gap-1.5 items-center">
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Image preview */}
      {uploadedImage && (
        <div className="px-4 pb-2">
          <div className="relative inline-block">
            <img src={uploadedImage} alt="preview" className="h-20 w-28 object-cover rounded-xl border border-white/20" />
            <button
              onClick={() => { setUploadedImage(null); setImageUrl(null); }}
              className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center"
            >
              <X className="w-3 h-3 text-white" />
            </button>
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t border-white/10">
        <form onSubmit={handleSubmit} className="flex gap-2 items-end">
          <div className="flex-1 bg-white/5 border border-white/10 rounded-xl p-2 flex items-end gap-2">
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(e); } }}
              placeholder={placeholder}
              className="flex-1 bg-transparent text-white placeholder-slate-500 text-sm resize-none outline-none max-h-32 min-h-[40px] leading-relaxed"
              rows={1}
              disabled={loading}
            />
            <div className="flex gap-1 flex-shrink-0">
              {allowImages && (
                <button type="button" onClick={() => fileInputRef.current?.click()} className="p-2 text-slate-400 hover:text-white transition-colors">
                  <ImageIcon className="w-4 h-4" />
                </button>
              )}
              <button
                type="button"
                onClick={toggleRecording}
                className={`p-2 transition-colors ${recording ? "text-red-400 animate-pulse" : "text-slate-400 hover:text-white"}`}
              >
                {recording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <Button
            type="submit"
            disabled={loading || (!input.trim() && !imageUrl)}
            className={`bg-gradient-to-r ${agentColor} text-white border-0 w-10 h-10 p-0 rounded-xl shadow-lg flex-shrink-0`}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </form>
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
        <p className="text-xs text-slate-600 text-center mt-2">يدعم العربية والإنجليزية • صوت • {allowImages ? "صور • " : ""}ذاكرة المحادثة</p>
      </div>
    </div>
  );
}