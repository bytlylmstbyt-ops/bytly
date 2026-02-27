import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, Send, Paperclip, MoreVertical,
  Phone, Video, ChevronLeft, Download, Loader2, Mic, MicOff
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLanguage } from "@/components/i18n/LanguageContext";

export default function Messages() {
  const { t, language } = useLanguage();
  const urlParams = new URLSearchParams(window.location.search);
  const engineerIdFromUrl = urlParams.get("engineer");

  const [user, setUser] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [otherUsers, setOtherUsers] = useState({});
  const [showMobileChat, setShowMobileChat] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const messagesEndRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation.id);
    }
  }, [selectedConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadInitialData = async () => {
    setIsLoading(true);
    const currentUser = await base44.auth.me();
    setUser(currentUser);

    const convos = await base44.entities.Conversation.filter({
      $or: [
        { participant_1: currentUser.email },
        { participant_2: currentUser.email }
      ]
    }, "-last_message_date");

    // Load other users info
    const userEmails = new Set();
    convos.forEach(c => {
      if (c.participant_1 !== currentUser.email) userEmails.add(c.participant_1);
      if (c.participant_2 !== currentUser.email) userEmails.add(c.participant_2);
    });

    const [engineersData, clientsData] = await Promise.all([
      base44.entities.Engineer.list(),
      base44.entities.Client.list()
    ]);

    const usersMap = {};
    [...engineersData, ...clientsData].forEach(u => {
      usersMap[u.email] = u;
    });

    setOtherUsers(usersMap);
    setConversations(convos);

    // Handle engineer from URL
    if (engineerIdFromUrl) {
      const engineer = engineersData.find(e => e.id === engineerIdFromUrl);
      if (engineer) {
        // Check if conversation exists
        const existingConvo = convos.find(c => 
          (c.participant_1 === currentUser.email && c.participant_2 === engineer.email) ||
          (c.participant_2 === currentUser.email && c.participant_1 === engineer.email)
        );
        
        if (existingConvo) {
          setSelectedConversation(existingConvo);
        } else {
          // Create new conversation
          const newConvo = await base44.entities.Conversation.create({
            participant_1: currentUser.email,
            participant_2: engineer.email
          });
          setConversations(prev => [newConvo, ...prev]);
          setSelectedConversation(newConvo);
        }
        setShowMobileChat(true);
      }
    }

    setIsLoading(false);
  };

  const loadMessages = async (conversationId) => {
    const msgs = await base44.entities.Message.filter(
      { conversation_id: conversationId },
      "created_date"
    );
    setMessages(msgs);

    // Mark as read
    const unread = msgs.filter(m => !m.is_read && m.sender_id !== user?.email);
    for (const msg of unread) {
      await base44.entities.Message.update(msg.id, { is_read: true });
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const getOtherParticipant = (conversation) => {
    const otherEmail = conversation.participant_1 === user?.email 
      ? conversation.participant_2 
      : conversation.participant_1;
    return otherUsers[otherEmail] || { full_name: otherEmail, email: otherEmail };
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    setIsSending(true);
    const otherParticipant = getOtherParticipant(selectedConversation);

    const message = await base44.entities.Message.create({
      conversation_id: selectedConversation.id,
      sender_id: user.email,
      receiver_id: otherParticipant.email,
      content: newMessage.trim()
    });

    // Update conversation
    await base44.entities.Conversation.update(selectedConversation.id, {
      last_message: newMessage.trim(),
      last_message_date: new Date().toISOString()
    });

    setMessages(prev => [...prev, message]);
    setNewMessage("");
    setIsSending(false);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !selectedConversation) return;

    setIsSending(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    
    const otherParticipant = getOtherParticipant(selectedConversation);
    const message = await base44.entities.Message.create({
      conversation_id: selectedConversation.id,
      sender_id: user.email,
      receiver_id: otherParticipant.email,
      content: `📎 ${file.name}`,
      attachments: [file_url]
    });

    await base44.entities.Conversation.update(selectedConversation.id, {
      last_message: `📎 ${language === 'ar' ? 'مرفق' : 'Attachment'}`,
      last_message_date: new Date().toISOString()
    });

    setMessages(prev => [...prev, message]);
    setIsSending(false);
  };

  const filteredConversations = conversations.filter(c => {
    const other = getOtherParticipant(c);
    return other.full_name?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#d4a574]"></div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-80px)] bg-slate-50">
      <div className="max-w-7xl mx-auto h-full">
        <div className="flex h-full bg-white shadow-lg rounded-lg overflow-hidden">
          {/* Conversations List */}
          <div className={`w-full md:w-96 border-l flex flex-col ${showMobileChat ? "hidden md:flex" : "flex"}`}>
            {/* Header */}
            <div className="p-4 border-b">
              <h2 className="text-xl font-bold text-[#1a1a2e] mb-4">{t('messages.title')}</h2>
              <div className="relative">
                <Search className={`absolute ${language === 'ar' ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400`} />
                <Input
                  placeholder={t('messages.searchPlaceholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={language === 'ar' ? 'pr-10' : 'pl-10'}
                />
              </div>
            </div>

            {/* Conversations */}
            <ScrollArea className="flex-1">
              {filteredConversations.length > 0 ? (
                filteredConversations.map((conversation) => {
                  const other = getOtherParticipant(conversation);
                  const isSelected = selectedConversation?.id === conversation.id;

                  return (
                    <div
                      key={conversation.id}
                      onClick={() => {
                        setSelectedConversation(conversation);
                        setShowMobileChat(true);
                      }}
                      className={`p-4 flex items-center gap-3 cursor-pointer transition-colors border-b ${
                        isSelected ? "bg-amber-50" : "hover:bg-slate-50"
                      }`}
                    >
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={other.profile_image} />
                        <AvatarFallback className="bg-gradient-to-br from-[#1a1a2e] to-[#d4a574] text-white">
                          {other.full_name?.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-slate-800 truncate">
                            {other.full_name}
                          </h3>
                          <span className="text-xs text-slate-500">
                            {conversation.last_message_date && 
                              new Date(conversation.last_message_date).toLocaleDateString(language === 'ar' ? 'ar' : 'en')}
                          </span>
                        </div>
                        <p className="text-sm text-slate-500 truncate">
                          {conversation.last_message || t('messages.startConversation')}
                        </p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-8 text-center text-slate-500">
                  {t('messages.noConversations')}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Chat Area */}
          <div className={`flex-1 flex flex-col ${!showMobileChat ? "hidden md:flex" : "flex"}`}>
            {selectedConversation ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b flex items-center justify-between bg-white">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setShowMobileChat(false)}
                      className="md:hidden p-2 hover:bg-slate-100 rounded-lg"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={getOtherParticipant(selectedConversation).profile_image} />
                      <AvatarFallback className="bg-gradient-to-br from-[#1a1a2e] to-[#d4a574] text-white">
                        {getOtherParticipant(selectedConversation).full_name?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold text-slate-800">
                        {getOtherParticipant(selectedConversation).full_name}
                      </h3>
                      <p className="text-xs text-green-500">{t('messages.onlineNow')}</p>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="w-5 h-5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                      <DropdownMenuItem>{t('messages.menu.viewProfile')}</DropdownMenuItem>
                      <DropdownMenuItem>{t('messages.menu.muteNotifications')}</DropdownMenuItem>
                      <DropdownMenuItem className="text-red-600">{t('messages.menu.deleteConversation')}</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Messages */}
                <ScrollArea className="flex-1 p-4 bg-slate-50">
                  <div className="space-y-4">
                    {messages.map((message, index) => {
                      const isOwn = message.sender_id === user?.email;
                      return (
                        <motion.div
                          key={message.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`flex ${isOwn ? "justify-start" : "justify-end"}`}
                        >
                          <div className={`max-w-[70%] ${isOwn ? "order-1" : "order-2"}`}>
                            <div className={`rounded-2xl px-4 py-2 ${
                              isOwn 
                                ? "bg-gradient-to-r from-[#1a1a2e] to-[#d4a574] text-white rounded-br-none"
                                : "bg-white shadow-sm rounded-bl-none"
                            }`}>
                              <p className="text-sm">{message.content}</p>
                              {message.attachments?.map((att, i) => (
                                <a 
                                  key={i} 
                                  href={att} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className={`flex items-center gap-2 mt-2 text-sm ${
                                    isOwn ? "text-white/80 hover:text-white" : "text-blue-600 hover:text-blue-800"
                                  }`}
                                >
                                  <Download className="w-4 h-4" />
                                  {t('messages.downloadAttachment')}
                                </a>
                              ))}
                            </div>
                            <p className={`text-xs text-slate-400 mt-1 ${isOwn ? "text-right" : "text-left"}`}>
                              {new Date(message.created_date).toLocaleTimeString(language === 'ar' ? 'ar' : 'en', { 
                                hour: "2-digit", 
                                minute: "2-digit" 
                              })}
                            </p>
                          </div>
                        </motion.div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>

                {/* Message Input */}
                <div className="p-4 border-t bg-white">
                  <div className="flex items-center gap-3">
                    <input
                      type="file"
                      id="file-upload"
                      className="hidden"
                      onChange={handleFileUpload}
                    />
                    <label
                      htmlFor="file-upload"
                      className="p-2 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
                    >
                      <Paperclip className="w-5 h-5 text-slate-500" />
                    </label>
                    <Input
                      placeholder={t('messages.typingPlaceholder')}
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                      className="flex-1"
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim() || isSending}
                      className="bg-gradient-to-r from-[#1a1a2e] to-[#d4a574] text-white"
                    >
                      {isSending ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Send className="w-5 h-5" />
                      )}
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center bg-slate-50">
                <div className="text-center">
                  <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-slate-200 flex items-center justify-center">
                    <Send className="w-10 h-10 text-slate-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-700 mb-2">{t('messages.selectConversation')}</h3>
                  <p className="text-slate-500">{t('messages.selectConversationMessage')}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}