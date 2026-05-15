import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Mic, MicOff, Paperclip, Bot, User, Loader2, X, Image as ImageIcon, Sparkles, Wand2, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import AIImageGallery from "@/components/ai/AIImageGallery";
import { buildImagePrompt, shouldGenerateImage, SMART_COMMANDS } from "@/components/ai/imagePromptBuilder";

export default function AIChat({
  agentId,
  agentName,
  agentIcon,
  agentColor = "from-purple-500 to-pink-500",
  systemPrompt,
  placeholder = "اكتب رسالتك...",
  allowImages = false,
  initialMessage,
  onResultGenerated,
  enableImageGeneration = false,
  selectedStyle = null,
}) {
  const [messages, setMessages] = useState(() => {
    const initial = initialMessage || `مرحباً! أنا ${agentName}. كيف يمكنني مساعدتك اليوم؟`;
    return [{ role: "assistant", content: initial, timestamp: new Date() }];
  });
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [generatingImages, setGeneratingImages] = useState(false);
  const [recording, setRecording] = useState(false);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);
  const [imageMode, setImageMode] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const conversationHistory = messages
    .filter(m => !m.images)
    .map(m => ({ role: m.role, content: m.content }));

  const generateImages = async (userPrompt, msgIndex) => {
    setGeneratingImages(true);
    const optimizedPrompt = buildImagePrompt(userPrompt, selectedStyle);

    // Generate 4 images in parallel
    const results = await Promise.allSettled([
      base44.integrations.Core.GenerateImage({ prompt: optimizedPrompt }),
      base44.integrations.Core.GenerateImage({ prompt: optimizedPrompt + ", different angle and composition" }),
      base44.integrations.Core.GenerateImage({ prompt: optimizedPrompt + ", alternative furniture layout" }),
      base44.integrations.Core.GenerateImage({ prompt: optimizedPrompt + ", different color palette variation" }),
    ]);

    const urls = results
      .filter(r => r.status === "fulfilled" && r.value?.url)
      .map(r => r.value.url);

    setGeneratingImages(false);

    // Attach images to the assistant message
    setMessages(prev => {
      const updated = [...prev];
      if (updated[msgIndex]) {
        updated[msgIndex] = { ...updated[msgIndex], images: urls };
      }
      return updated;
    });
  };

  const sendMessage = async (text, imgUrl = null, forceGenerateImages = false) => {
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

    const willGenerateImages = enableImageGeneration && (forceGenerateImages || imageMode || shouldGenerateImage(text));

    const imageInstruction = willGenerateImages
      ? "\n\nالمستخدم طلب تصميماً بصرياً. سيتم توليد صور AI تلقائياً. قدم وصفاً موجزاً للتصميم المقترح (5-7 أسطر فقط) تشمل: الألوان الرئيسية، الأثاث، الإضاءة، المواد. لا تكتب تقريراً طويلاً."
      : "";

    const fullPrompt = `${systemPrompt}${imageInstruction}

سجل المحادثة:
${historyForPrompt}

المستخدم: ${text}

أجب بشكل احترافي. استخدم التنسيق الجيد مع النقاط عند الحاجة.`;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: fullPrompt,
      file_urls: imgUrl ? [imgUrl] : undefined,
    });

    const assistantMsg = {
      role: "assistant",
      content: result,
      timestamp: new Date(),
      generatingImages: willGenerateImages,
    };
    setMessages(prev => [...prev, assistantMsg]);
    const newMsgIndex = messages.length + 1; // index after adding user + assistant
    setLoading(false);

    if (onResultGenerated) onResultGenerated(result);

    if (willGenerateImages) {
      // Get current length to find the correct index
      setMessages(prev => {
        const idx = prev.length - 1;
        generateImagesForIndex(text, prev, idx);
        return prev;
      });
    }
  };

  const generateImagesForIndex = async (userPrompt, currentMessages, idx) => {
    setGeneratingImages(true);
    const optimizedPrompt = buildImagePrompt(userPrompt, selectedStyle);

    const results = await Promise.allSettled([
      base44.integrations.Core.GenerateImage({ prompt: optimizedPrompt }),
      base44.integrations.Core.GenerateImage({ prompt: optimizedPrompt + ", wide angle different composition" }),
      base44.integrations.Core.GenerateImage({ prompt: optimizedPrompt + ", alternative layout variation" }),
      base44.integrations.Core.GenerateImage({ prompt: optimizedPrompt + ", different color palette" }),
    ]);

    const urls = results
      .filter(r => r.status === "fulfilled" && r.value?.url)
      .map(r => r.value.url);

    setGeneratingImages(false);
    setMessages(prev => {
      const updated = [...prev];
      if (updated[idx]) {
        updated[idx] = { ...updated[idx], images: urls, generatingImages: false };
      }
      return updated;
    });
  };

  const handleRegenerate = (userPrompt, assistantIdx) => {
    setMessages(prev => {
      const updated = [...prev];
      if (updated[assistantIdx]) {
        updated[assistantIdx] = { ...updated[assistantIdx], images: [], generatingImages: true };
      }
      return updated;
    });
    setGeneratingImages(true);
    generateImagesForIndex(userPrompt, messages, assistantIdx);
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
      const boldLine = line.replace(/\*\*(.+?)\*\*/g, (_, m) => `<strong>${m}</strong>`);
      if (boldLine !== line) return <p key={i} className="my-0.5 leading-relaxed" dangerouslySetInnerHTML={{ __html: boldLine }} />;
      if (line === "") return <div key={i} className="h-2" />;
      return <p key={i} className="my-0.5 leading-relaxed">{line}</p>;
    });
  };

  // Find user message for a given assistant message index
  const getUserPromptForAssistant = (assistantIdx) => {
    for (let i = assistantIdx - 1; i >= 0; i--) {
      if (messages[i]?.role === "user") return messages[i].content;
    }
    return "";
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
            {enableImageGeneration && <span className="mr-2 bg-white/20 rounded-full px-2 py-0.5 text-white/80">✨ توليد صور AI</span>}
          </div>
        </div>
        <div className="mr-auto flex items-center gap-2">
          {enableImageGeneration && (
            <button
              onClick={() => setImageMode(!imageMode)}
              title="وضع توليد الصور"
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                imageMode
                  ? "bg-white/30 text-white"
                  : "bg-white/10 text-white/60 hover:bg-white/20 hover:text-white"
              }`}
            >
              <Wand2 className="w-3.5 h-3.5" />
              صور
            </button>
          )}
          <Sparkles className="w-5 h-5 text-white/60" />
        </div>
      </div>

      {/* Smart Commands */}
      {enableImageGeneration && (
        <div className="px-4 pt-3 pb-1 flex gap-2 overflow-x-auto scrollbar-hide">
          {SMART_COMMANDS.map((cmd, i) => (
            <button
              key={i}
              onClick={() => sendMessage(cmd.prompt, null, true)}
              disabled={loading}
              className="flex-shrink-0 text-xs px-3 py-1.5 bg-white/5 border border-white/10 rounded-full text-slate-300 hover:bg-white/10 hover:text-white transition-all whitespace-nowrap"
            >
              {cmd.label}
            </button>
          ))}
        </div>
      )}

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
              <div className={`max-w-[85%] ${msg.role === "user" ? "items-end" : "items-start"} flex flex-col`}>
                {msg.image && (
                  <img src={msg.image} alt="uploaded" className="w-48 h-32 object-cover rounded-xl mb-2 border border-white/20" />
                )}
                <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-amber-500/20 text-white border border-amber-500/30 rounded-tr-sm"
                    : "bg-white/5 text-slate-200 border border-white/10 rounded-tl-sm"
                }`}>
                  {renderContent(msg.content)}

                  {/* Image gallery inside assistant message */}
                  {msg.role === "assistant" && (msg.generatingImages || (msg.images && msg.images.length > 0)) && (
                    <AIImageGallery
                      images={msg.images || []}
                      loading={msg.generatingImages && (!msg.images || msg.images.length === 0)}
                      onRegenerate={() => handleRegenerate(getUserPromptForAssistant(i), i)}
                    />
                  )}
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
        {/* Image mode indicator */}
        {enableImageGeneration && imageMode && (
          <div className="mb-2 flex items-center gap-2 text-xs text-purple-400 bg-purple-500/10 rounded-xl px-3 py-1.5 border border-purple-500/20">
            <Wand2 className="w-3.5 h-3.5" />
            <span>وضع توليد الصور مفعّل — سيتم توليد 4 تصاميم تلقائياً</span>
            <button onClick={() => setImageMode(false)} className="mr-auto text-purple-400/60 hover:text-purple-400">
              <X className="w-3 h-3" />
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex gap-2 items-end">
          <div className="flex-1 bg-white/5 border border-white/10 rounded-xl p-2 flex items-end gap-2">
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(e); } }}
              placeholder={imageMode ? "صف تصميمك... سيتم توليد الصور تلقائياً" : placeholder}
              className="flex-1 bg-transparent text-white placeholder-slate-500 text-sm resize-none outline-none max-h-32 min-h-[40px] leading-relaxed"
              rows={1}
              disabled={loading || generatingImages}
            />
            <div className="flex gap-1 flex-shrink-0">
              {(allowImages || enableImageGeneration) && (
                <button type="button" onClick={() => fileInputRef.current?.click()} className="p-2 text-slate-400 hover:text-white transition-colors" title="رفع صورة">
                  <Camera className="w-4 h-4" />
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
            disabled={loading || generatingImages || (!input.trim() && !imageUrl)}
            className={`bg-gradient-to-r ${agentColor} text-white border-0 w-10 h-10 p-0 rounded-xl shadow-lg flex-shrink-0`}
          >
            {(loading || generatingImages) ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </form>
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
        <p className="text-xs text-slate-600 text-center mt-2">
          يدعم العربية والإنجليزية • صوت • صور
          {enableImageGeneration && " • توليد صور AI فوتوريالستي"}
        </p>
      </div>
    </div>
  );
}