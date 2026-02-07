import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Send, MessageCircle, X, Loader2, Phone, Video, Mic, Paperclip, Square } from "lucide-react";

export default function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [conversationId, setConversationId] = useState(null);
  const [visitorId, setVisitorId] = useState(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [attachments, setAttachments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordDuration, setRecordDuration] = useState(0);
  const messagesEndRef = useRef(null);
  const widgetRef = useRef(null);
  const fileInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordTimerRef = useRef(null);

  useEffect(() => {
    initializeChatbot();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const initializeChatbot = async () => {
    // Get or create visitor ID
    let vid = localStorage.getItem("bytly_visitor_id");
    if (!vid) {
      vid = `visitor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem("bytly_visitor_id", vid);
    }
    setVisitorId(vid);

    // Check if user is authenticated
    try {
      const user = await base44.auth.me();
      setCurrentUser(user);
    } catch {
      setCurrentUser(null);
    }

    // Create initial conversation
    const newConv = await base44.entities.ChatbotConversation.create({
      visitor_id: vid,
      messages: [
        {
          role: "assistant",
          content: "مرحباً بك في بيتلي 👋\n\nأنا مساعد بيتلي الذكي، كيف يمكنني مساعدتك في مشروعك اليوم؟",
          timestamp: new Date().toISOString()
        }
      ]
    });

    setConversationId(newConv.id);
    setMessages([
      {
        role: "assistant",
        content: "مرحباً بك في بيتلي! 👋\n\nأنا نور، مساعدتك الذكية. سعيدة بمساعدتك في مشروعك الهندسي 🏗️\n\nكيف يمكنني خدمتك اليوم؟",
        timestamp: new Date().toISOString()
      }
    ]);
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploading(true);
    try {
      for (const file of files) {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        setAttachments(prev => [...prev, {
          name: file.name,
          url: file_url,
          size: file.size,
          type: file.type
        }]);
      }
    } catch (error) {
      console.error("Error uploading file:", error);
    } finally {
      setUploading(false);
    }
  };

  const startRecording = async () => {
    try {
      // Optimized audio constraints for human voice with Opus/Ogg codec
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 48000, // Opus optimal rate
          channelCount: 1, // Mono for voice
          latency: 0
        }
      });
      
      // Prioritize Opus/Ogg codec for modern browsers (best quality & compression)
      let mimeType = 'audio/ogg;codecs=opus';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'audio/webm;codecs=opus';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = 'audio/webm';
        }
      }
      
      // High-quality audio buffer for stream processing
      const mediaRecorder = new MediaRecorder(stream, { 
        mimeType,
        audioBitsPerSecond: 256000 // High bitrate for clarity
      });
      
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      
      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(track => track.stop());
        
        const mimeType = mediaRecorderRef.current.mimeType || 'audio/webm';
        const extension = mimeType.includes('ogg') ? 'ogg' : (mimeType.includes('webm') ? 'webm' : 'mp4');
        
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        const audioFile = new File([audioBlob], `voice_${Date.now()}.${extension}`, { type: mimeType });
        
        // Transcribe with Gemini 1.5 Pro (supports audio streams: WebM, MP3, MP4)
        setUploading(true);
        
        // Show processing message
        setMessages(prev => [...prev, {
          role: "assistant",
          content: "🎧 جاري معالجة الرسالة الصوتية...",
          timestamp: new Date().toISOString(),
          isProcessing: true
        }]);
        
        // Unlimited retry with direct stream processing (no limits)
        try {
          let retryCount = 0;
          let transcriptionResult = null;
          let success = false;
          
          // Keep trying until success (no retry limit)
          while (!success) {
            try {
              retryCount++;
              
              // Direct upload with optimized buffer (immediate processing)
              const { file_url } = await base44.integrations.Core.UploadFile({ file: audioFile });
              
              // Immediate transcription (no waiting delay)
              transcriptionResult = await base44.integrations.Core.InvokeLLM({
                prompt: `استمع لهذه الرسالة الصوتية وحولها لنص عربي فصيح.

تعليمات التحويل:
- دعم اللهجة السعودية والعامية الخليجية بالكامل
- تحويل الكلمات العامية للفصحى أو الإبقاء عليها إن كانت واضحة
- التعامل مع المصطلحات الهندسية والتقنية (تصميم، إنشاءات، رخصة بناء، إلخ)
- إزالة أصوات الخلفية والضوضاء من الفهم
- معالجة ملفات صوتية بصيغة Opus/Ogg, WebM, MP3 بمعدل 48kHz
- التعرف على الترددات البشرية بدقة عالية
- البث المباشر للصوت (Direct Stream)

إذا كان الصوت غير واضح أو مشوش، أرجع فقط: [غير واضح]
وإلا، أرجع النص المحول فقط بدون أي شرح أو إضافات.`,
                file_urls: [file_url]
              });
              
              // Success - exit loop
              success = true;
              
            } catch (uploadError) {
              console.error(`محاولة رقم ${retryCount}:`, uploadError);
              
              // Update processing message with attempt number
              setMessages(prev => prev.map(m => 
                m.isProcessing ? {
                  ...m,
                  content: `🎧 جاري المعالجة... محاولة ${retryCount}`
                } : m
              ));
              
              // Short delay before retry (500ms only)
              await new Promise(resolve => setTimeout(resolve, 500));
              
              // If too many retries, give user option to cancel
              if (retryCount >= 10) {
                const shouldContinue = confirm(`فشلت ${retryCount} محاولة. هل تريد الاستمرار؟`);
                if (!shouldContinue) {
                  throw new Error('تم إلغاء العملية من قبل المستخدم');
                }
              }
            }
          }
          
          // Remove processing message
          setMessages(prev => prev.filter(m => !m.isProcessing));

          if (transcriptionResult) {
            const cleanText = transcriptionResult.trim();
            
            // Check if audio was unclear
            if (cleanText.includes('[غير واضح]') || cleanText.toLowerCase().includes('unclear')) {
              setMessages(prev => [...prev, {
                role: "assistant",
                content: "⚠️ عذراً، الرسالة الصوتية غير واضحة.\n\nيرجى:\n• التسجيل في مكان هادئ\n• التحدث بوضوح وببطء\n• التأكد من قرب الميكروفون\n• تأكد من تفعيل الميكروفون بشكل صحيح\n\nجرب مرة أخرى 🎤",
                timestamp: new Date().toISOString()
              }]);
            } else {
              setInputValue(`🎤 ${cleanText}`);
            }
          }
          
        } catch (error) {
          console.error("خطأ في تحويل الصوت:", error);
          
          // Remove processing message
          setMessages(prev => prev.filter(m => !m.isProcessing));
          
          const errorMessage = error.message === 'تم إلغاء العملية من قبل المستخدم' 
            ? '🚫 تم إلغاء التحويل الصوتي.\n\nيمكنك كتابة رسالتك نصاً 📝'
            : `⚠️ حدثت مشكلة في معالجة الصوت.\n\nالحلول الفورية:\n✓ تأكد من جودة اتصال الإنترنت\n✓ تحدث بوضوح في مكان هادئ\n✓ تأكد من صلاحيات الميكروفون\n\nجرب مرة أخرى 🎤 أو اكتب رسالتك 📝`;
          
          setMessages(prev => [...prev, {
            role: "assistant",
            content: errorMessage,
            timestamp: new Date().toISOString()
          }]);
        } finally {
          setUploading(false);
        }
      };
      
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
      setRecordDuration(0);
      
      recordTimerRef.current = setInterval(() => {
        setRecordDuration(prev => prev + 1);
      }, 1000);
      
    } catch (error) {
      console.error('Microphone access error:', error);
      alert('لا يمكن الوصول للميكروفون. تأكد من الأذونات.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordTimerRef.current) {
        clearInterval(recordTimerRef.current);
        recordTimerRef.current = null;
      }
    }
  };

  useEffect(() => {
    return () => {
      if (recordTimerRef.current) clearInterval(recordTimerRef.current);
      if (mediaRecorderRef.current) mediaRecorderRef.current.stop();
    };
  }, []);

  const handleSendMessage = async () => {
    if (!inputValue.trim() && attachments.length === 0) return;

    const userMessage = inputValue;
    const userAttachments = [...attachments];
    setInputValue("");
    setAttachments([]);
    
    // Add user message to UI
    setMessages(prev => [...prev, {
      role: "user",
      content: userMessage || "📎 ملفات مرفقة",
      attachments: userAttachments,
      timestamp: new Date().toISOString()
    }]);

    setLoading(true);

    try {
      console.log('Sending message to chatbot...', { messageLength: userMessage.length, hasAttachments: userAttachments.length > 0 });
      
      const response = await base44.functions.invoke("chatbotHandler", {
        user_message: userMessage,
        visitor_id: visitorId,
        conversation_id: conversationId,
        user_type: currentUser ? (currentUser.role === 'admin' ? 'consultant' : 'client') : 'visitor',
        attachments: userAttachments
      });

      console.log('Chatbot response received:', { success: response.data?.success, hasResponse: !!response.data?.response });

      if (response.data.success) {
        setMessages(prev => [...prev, {
          role: "assistant",
          content: response.data.response,
          timestamp: new Date().toISOString(),
          suggestedEngineers: response.data.suggestedEngineers
        }]);

        if (response.data.shouldEscalate) {
          setMessages(prev => [...prev, {
            role: "assistant",
            content: "سيتواصل معك فريق الدعم الفني قريباً 📞",
            timestamp: new Date().toISOString()
          }]);
        }
      } else {
        // Handle case where success is false
        setMessages(prev => [...prev, {
          role: "assistant",
          content: response.data.response || "⚠️ حدثت مشكلة في معالجة طلبك. يرجى المحاولة مرة أخرى.",
          timestamp: new Date().toISOString()
        }]);
      }
    } catch (error) {
      console.error("Chatbot error:", error);
      
      let errorMessage = "⚠️ حدثت مشكلة في إرسال رسالتك.\n\n";
      
      if (error.message?.includes('timeout') || error.message?.includes('network')) {
        errorMessage += "المشكلة: انقطاع الاتصال بالإنترنت\nالحل: تحقق من اتصالك وأعد المحاولة";
      } else if (error.message?.includes('429')) {
        errorMessage += "المشكلة: طلبات كثيرة جداً\nالحل: انتظر 30 ثانية ثم حاول مرة أخرى";
      } else {
        errorMessage += "يرجى:\n• المحاولة مرة أخرى\n• إذا استمرت المشكلة، تواصل معنا:\n  info@mybytly.com";
      }
      
      setMessages(prev => [...prev, {
        role: "assistant",
        content: errorMessage,
        timestamp: new Date().toISOString()
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleMouseDown = (e) => {
    if (e.target.closest('.chat-window-content')) return;
    e.preventDefault();
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    e.preventDefault();
    
    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;
    
    const widgetWidth = widgetRef.current?.offsetWidth || 384;
    const widgetHeight = widgetRef.current?.offsetHeight || 600;
    
    const maxX = window.innerWidth - widgetWidth;
    const maxY = window.innerHeight - widgetHeight;
    
    setPosition({
      x: Math.max(0, Math.min(newX, maxX)),
      y: Math.max(0, Math.min(newY, maxY))
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragStart, position]);

  return (
    <>
      {/* Widget Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 left-6 z-[9999] bg-gradient-to-r from-[#d4a574] to-[#1a1a2e] text-white rounded-full p-4 shadow-lg hover:shadow-xl transition-all"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        {isOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <MessageCircle className="w-6 h-6" />
        )}
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={widgetRef}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            style={{
              left: `${position.x || 24}px`,
              top: `${position.y || 80}px`,
              right: 'auto',
              bottom: 'auto'
            }}
            className="fixed z-[9999] w-96 max-h-[600px] flex flex-col"
          >
            <Card className="h-full shadow-2xl flex flex-col">
              {/* Header */}
              <CardHeader 
                className="border-b bg-gradient-to-r from-[#d4a574] to-[#1a1a2e] text-white rounded-t-xl cursor-grab active:cursor-grabbing select-none"
                onMouseDown={handleMouseDown}
                style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-white flex items-center gap-2">
                      <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                      نور - مساعدة بيتلي
                    </CardTitle>
                    <p className="text-xs text-white/80 mt-1">🎤 رسائل صوتية • 💬 رد فوري • 📱 متاح دائماً</p>
                  </div>
                </div>
              </CardHeader>

              {/* Messages */}
              <CardContent className="chat-window-content flex-1 overflow-y-auto p-4 space-y-4 max-h-[400px]">
                {messages.map((msg, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-xs px-4 py-2 rounded-lg ${
                        msg.role === "user"
                          ? "bg-[#d4a574] text-white"
                          : "bg-slate-100 text-slate-900"
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>

                      {/* Attachments */}
                      {msg.attachments?.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {msg.attachments.map((att, i) => (
                            <a 
                              key={i}
                              href={att.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-xs underline hover:no-underline"
                            >
                              <Paperclip className="w-3 h-3" />
                              {att.name}
                            </a>
                          ))}
                        </div>
                      )}

                      {/* Suggested Engineers */}
                      {msg.suggestedEngineers?.length > 0 && (
                        <div className="mt-3 space-y-2 border-t pt-2">
                          <p className="text-sm font-semibold text-slate-700">👨‍💼 مهندسين مقترحين:</p>
                          <div className="space-y-2">
                            {msg.suggestedEngineers.map((eng) => (
                              <a
                                key={eng.id}
                                href={`/engineers/${eng.id}`}
                                target="_blank"
                                className="block p-2 bg-white border border-slate-200 rounded-lg hover:shadow-md hover:border-[#C9A66B] transition-all"
                              >
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="text-sm font-medium text-slate-800">{eng.name}</p>
                                    <p className="text-xs text-slate-500">{eng.specialization}</p>
                                  </div>
                                  {eng.rating > 0 && (
                                    <div className="text-xs text-amber-600">
                                      ⭐ {eng.rating.toFixed(1)}
                                    </div>
                                  )}
                                </div>
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
                {loading && (
                  <div className="flex justify-start">
                    <div className="bg-slate-100 rounded-lg p-3">
                      <Loader2 className="w-4 h-4 text-slate-600 animate-spin" />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </CardContent>

              {/* Input */}
              <div className="chat-window-content border-t p-3 space-y-2">
                {/* Attachments Preview */}
                {attachments.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {attachments.map((file, idx) => (
                      <div key={idx} className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded text-xs">
                        <Paperclip className="w-3 h-3" />
                        <span className="truncate max-w-[100px]">{file.name}</span>
                        <button
                          onClick={() => setAttachments(prev => prev.filter((_, i) => i !== idx))}
                          className="hover:bg-slate-200 rounded p-0.5"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    multiple
                    accept=".pdf,.dwg,.dxf,.jpg,.jpeg,.png"
                    className="hidden"
                  />
                  
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={loading || uploading}
                    title="إرفاق ملف"
                  >
                    {uploading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Paperclip className="w-4 h-4" />
                    )}
                  </Button>

                  {!isRecording ? (
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={startRecording}
                      disabled={loading || uploading}
                      title="تسجيل رسالة صوتية"
                      className="relative"
                    >
                      <Mic className="w-4 h-4" />
                    </Button>
                  ) : (
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={stopRecording}
                      title="إيقاف التسجيل"
                      className="animate-pulse"
                    >
                      <Square className="w-4 h-4" />
                    </Button>
                  )}

                  <Input
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="اكتب سؤالك..."
                    disabled={loading || uploading}
                    className="text-sm flex-1"
                  />

                  <Button
                    size="icon"
                    onClick={handleSendMessage}
                    disabled={loading || uploading || (!inputValue.trim() && attachments.length === 0)}
                    className="bg-[#d4a574] hover:bg-[#c89864]"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </Button>
                </div>

                {isRecording && (
                  <div className="flex items-center justify-center gap-2 py-1 bg-red-50 rounded">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                    <span className="text-xs text-red-700 font-mono">
                      جاري التسجيل... {Math.floor(recordDuration / 60)}:{(recordDuration % 60).toString().padStart(2, '0')}
                    </span>
                  </div>
                )}
                <p className="text-xs text-slate-500 text-center">
                  مدعوم بـ Gemini AI 🤖 • رسائل صوتية مباشرة 🎤 • مرفقات ومخططات 📎
                </p>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}