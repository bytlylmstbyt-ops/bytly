import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Send, MessageCircle, X, Loader2, Phone } from "lucide-react";

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
  const messagesEndRef = useRef(null);
  const widgetRef = useRef(null);

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
    setMessages(newConv.messages);
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage = inputValue;
    setInputValue("");
    
    // Add user message to UI
    setMessages(prev => [...prev, {
      role: "user",
      content: userMessage,
      timestamp: new Date().toISOString()
    }]);

    setLoading(true);

    try {
      const response = await base44.functions.invoke("chatbotHandler", {
        user_message: userMessage,
        visitor_id: visitorId,
        conversation_id: conversationId,
        user_type: currentUser ? (currentUser.role === 'admin' ? 'consultant' : 'client') : 'visitor'
      });

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
      }
    } catch (error) {
      console.error("Error:", error);
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "أعتذر، حدثت مشكلة تقنية. يرجى محاولة لاحقاً.",
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
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;
    
    const maxX = window.innerWidth - (widgetRef.current?.offsetWidth || 384);
    const maxY = window.innerHeight - (widgetRef.current?.offsetHeight || 600);
    
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
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragStart]);

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
              left: position.x || '24px',
              bottom: position.y || '96px',
              right: 'auto',
              cursor: isDragging ? 'grabbing' : 'auto'
            }}
            className="fixed z-[9999] w-96 max-h-[600px] flex flex-col"
            onMouseDown={handleMouseDown}
          >
            <Card className="h-full shadow-2xl flex flex-col">
              {/* Header */}
              <CardHeader className="border-b bg-gradient-to-r from-[#d4a574] to-[#1a1a2e] text-white rounded-t-xl cursor-grab active:cursor-grabbing">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-white">مساعد بيتلي</CardTitle>
                    <p className="text-xs text-white/80 mt-1">متاح 24/7 • اسحبني لتحريكي</p>
                  </div>
                </div>
              </CardHeader>

              {/* Messages */}
              <CardContent className="chat-window-content flex-1 overflow-y-auto p-4 space-y-4">
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

                      {/* Suggested Engineers */}
                      {msg.suggestedEngineers?.length > 0 && (
                        <div className="mt-2 space-y-1">
                          <p className="text-xs font-medium">المهندسين المقترحين:</p>
                          {msg.suggestedEngineers.map((eng) => (
                            <Badge key={eng.id} variant="outline" className="block text-xs w-full">
                              {eng.name} - {eng.specialization}
                            </Badge>
                          ))}
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
              <div className="chat-window-content border-t p-3 flex gap-2">
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="اكتب سؤالك..."
                  disabled={loading}
                  className="text-sm"
                />
                <Button
                  size="icon"
                  onClick={handleSendMessage}
                  disabled={loading || !inputValue.trim()}
                  className="bg-[#d4a574] hover:bg-[#c89864]"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}