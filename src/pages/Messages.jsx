import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, Send, Paperclip, MoreVertical,
  Phone, Video, ChevronLeft, Download, Loader2, Mic, MicOff,
  Users, User, Building2, Filter, Plus, X, UserCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

const CATEGORY_FILTERS = [
  { key: "all", label: "الكل", icon: Filter },
  { key: "client", label: "العملاء", icon: User },
  { key: "engineer", label: "المهندسون", icon: UserCircle },
  { key: "firm", label: "الشركات", icon: Building2 },
];

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
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [allUsers, setAllUsers] = useState({ engineers: [], clients: [], firms: [] });
  const [usersMap, setUsersMap] = useState({});
  const [showMobileChat, setShowMobileChat] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [showNewChat, setShowNewChat] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const messagesEndRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  useEffect(() => { loadInitialData(); }, []);
  useEffect(() => { if (selectedConversation) loadMessages(selectedConversation.id); }, [selectedConversation]);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const loadInitialData = async () => {
    setIsLoading(true);
    const currentUser = await base44.auth.me();
    setUser(currentUser);

    const [convos, engineersData, clientsData, firmsData] = await Promise.all([
      base44.entities.Conversation.filter({ participants: currentUser.email }, "-last_message_date"),
      base44.entities.Engineer.list(),
      base44.entities.Client.list(),
      base44.entities.EngineeringFirm.list(),
    ]);

    const map = {};
    engineersData.forEach(u => { map[u.email] = { ...u, _type: "engineer" }; });
    clientsData.forEach(u => { map[u.email] = { ...u, _type: "client" }; });
    firmsData.forEach(u => { map[u.email] = { ...u, _type: "firm", full_name: u.company_name }; });

    setUsersMap(map);
    setAllUsers({ engineers: engineersData, clients: clientsData, firms: firmsData });
    setConversations(convos);

    if (engineerIdFromUrl) {
      const engineer = engineersData.find(e => e.id === engineerIdFromUrl);
      if (engineer) {
        const existing = convos.find(c => c.participants?.includes(engineer.email) && c.participants?.includes(currentUser.email));
        if (existing) {
          setSelectedConversation(existing);
        } else {
          const newConvo = await base44.entities.Conversation.create({
            project_id: "direct",
            participants: [currentUser.email, engineer.email],
            participant_roles: { engineer: engineer.email, client: currentUser.email },
            type: "direct",
            name: engineer.full_name,
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
    const msgs = await base44.entities.Message.filter({ conversation_id: conversationId }, "created_date");
    setMessages(msgs);
    const unread = msgs.filter(m => !m.is_read && m.sender_email !== user?.email);
    for (const msg of unread) {
      await base44.entities.Message.update(msg.id, { is_read: true });
    }
  };

  const getConversationName = (conversation) => {
    if (conversation.name) return conversation.name;
    const others = (conversation.participants || []).filter(e => e !== user?.email);
    return others.map(e => usersMap[e]?.full_name || usersMap[e]?.company_name || e).join("، ");
  };

  const getConversationAvatar = (conversation) => {
    const others = (conversation.participants || []).filter(e => e !== user?.email);
    if (others.length === 1) return usersMap[others[0]]?.profile_image || usersMap[others[0]]?.company_logo;
    return null;
  };

  const getConversationType = (conversation) => {
    if (conversation.type === "group" || (conversation.participants?.length > 2)) return "group";
    const other = (conversation.participants || []).find(e => e !== user?.email);
    return usersMap[other]?._type || "direct";
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;
    setIsSending(true);
    const senderInfo = usersMap[user.email] || {};
    const message = await base44.entities.Message.create({
      conversation_id: selectedConversation.id,
      project_id: selectedConversation.project_id || "direct",
      sender_email: user.email,
      sender_name: user.full_name || senderInfo.full_name,
      sender_role: senderInfo._type || "client",
      content: newMessage.trim(),
    });
    await base44.entities.Conversation.update(selectedConversation.id, {
      last_message: newMessage.trim(),
      last_message_date: new Date().toISOString(),
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
    const message = await base44.entities.Message.create({
      conversation_id: selectedConversation.id,
      project_id: selectedConversation.project_id || "direct",
      sender_email: user.email,
      sender_name: user.full_name,
      content: `📎 ${file.name}`,
      attachments: [{ name: file.name, url: file_url, type: file.type }],
    });
    await base44.entities.Conversation.update(selectedConversation.id, {
      last_message: "📎 مرفق",
      last_message_date: new Date().toISOString(),
    });
    setMessages(prev => [...prev, message]);
    setIsSending(false);
  };

  const getJitsiRoomId = (id) => `bytly-${id?.replace(/[^a-zA-Z0-9]/g, '').slice(0, 20)}`;

  const handleVideoCall = () => {
    if (!selectedConversation) return;
    const url = `https://meet.jit.si/${getJitsiRoomId(selectedConversation.id)}`;
    sendCallInvite('فيديو', url);
    window.open(url, '_blank', 'width=900,height=700');
  };

  const handleVoiceCall = () => {
    if (!selectedConversation) return;
    const url = `https://meet.jit.si/${getJitsiRoomId(selectedConversation.id)}#config.startWithVideoMuted=true`;
    sendCallInvite('صوتية', url);
    window.open(url, '_blank', 'width=900,height=700');
  };

  const sendCallInvite = async (type, url) => {
    const message = await base44.entities.Message.create({
      conversation_id: selectedConversation.id,
      project_id: selectedConversation.project_id || "direct",
      sender_email: user.email,
      sender_name: user.full_name,
      content: `📞 دعوة مكالمة ${type} — انضم عبر: ${url}`,
      is_system_message: false,
    });
    setMessages(prev => [...prev, message]);
  };

  const handleVoiceRecord = async () => {
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
      return;
    }
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream);
    audioChunksRef.current = [];
    recorder.ondataavailable = (e) => audioChunksRef.current.push(e.data);
    recorder.onstop = async () => {
      const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      stream.getTracks().forEach(t => t.stop());
      const file = new File([blob], 'voice-message.webm', { type: 'audio/webm' });
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      const msg = await base44.entities.Message.create({
        conversation_id: selectedConversation.id,
        project_id: selectedConversation.project_id || "direct",
        sender_email: user.email,
        sender_name: user.full_name,
        content: '🎤 رسالة صوتية',
        attachments: [{ name: 'voice-message.webm', url: file_url, type: 'audio/webm' }],
      });
      setMessages(prev => [...prev, msg]);
    };
    recorder.start();
    mediaRecorderRef.current = recorder;
    setIsRecording(true);
  };

  const startNewConversation = async (targetUser, targetType) => {
    if (!user) return;
    const targetEmail = targetUser.email;
    const existing = conversations.find(c => c.participants?.includes(targetEmail) && c.participants?.includes(user.email) && c.participants?.length === 2);
    if (existing) {
      setSelectedConversation(existing);
      setShowNewChat(false);
      setShowMobileChat(true);
      return;
    }
    const name = targetType === "firm" ? targetUser.company_name : targetUser.full_name;
    const newConvo = await base44.entities.Conversation.create({
      project_id: "direct",
      participants: [user.email, targetEmail],
      type: "direct",
      name,
      participant_roles: targetType === "firm"
        ? { firm: targetEmail }
        : targetType === "engineer"
          ? { engineer: targetEmail }
          : { client: targetEmail },
    });
    setConversations(prev => [newConvo, ...prev]);
    setSelectedConversation(newConvo);
    setShowNewChat(false);
    setShowMobileChat(true);
  };

  const createGroupChat = async (participants, groupName) => {
    const newConvo = await base44.entities.Conversation.create({
      project_id: "group",
      participants: [user.email, ...participants.map(p => p.email)],
      type: "group",
      name: groupName || "محادثة جماعية",
    });
    setConversations(prev => [newConvo, ...prev]);
    setSelectedConversation(newConvo);
    setShowNewChat(false);
    setShowMobileChat(true);
  };

  // Filter conversations
  const filteredConversations = conversations.filter(c => {
    const name = getConversationName(c).toLowerCase();
    const matchSearch = !searchQuery || name.includes(searchQuery.toLowerCase());
    if (!matchSearch) return false;
    if (categoryFilter === "all") return true;
    const type = getConversationType(c);
    return type === categoryFilter;
  });

  // Search users for new chat
  const searchResults = userSearch.trim().length > 0
    ? [
        ...allUsers.engineers.filter(e => e.email !== user?.email && (e.full_name?.toLowerCase().includes(userSearch.toLowerCase()) || e.email?.includes(userSearch))).map(e => ({ ...e, _type: "engineer" })),
        ...allUsers.clients.filter(c => c.email !== user?.email && (c.full_name?.toLowerCase().includes(userSearch.toLowerCase()) || c.email?.includes(userSearch))).map(c => ({ ...c, _type: "client" })),
        ...allUsers.firms.filter(f => f.company_name?.toLowerCase().includes(userSearch.toLowerCase()) || f.email?.includes(userSearch)).map(f => ({ ...f, _type: "firm", full_name: f.company_name })),
      ]
    : [];

  const typeLabel = { engineer: "مهندس", client: "عميل", firm: "شركة استشارية" };
  const typeBadgeColor = { engineer: "bg-blue-100 text-blue-700", client: "bg-green-100 text-green-700", firm: "bg-purple-100 text-purple-700" };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#d4a574]"></div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-80px)] bg-slate-50" dir="rtl">
      <div className="max-w-7xl mx-auto h-full">
        <div className="flex h-full bg-white shadow-lg rounded-lg overflow-hidden">
          
          {/* Sidebar */}
          <div className={`w-full md:w-96 border-l flex flex-col ${showMobileChat ? "hidden md:flex" : "flex"}`}>
            {/* Header */}
            <div className="p-4 border-b space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-[#1a1a2e]">المحادثات</h2>
                <Button
                  size="sm"
                  onClick={() => setShowNewChat(true)}
                  className="bg-gradient-to-r from-[#1a1a2e] to-[#d4a574] text-white gap-1"
                >
                  <Plus className="w-4 h-4" />
                  محادثة جديدة
                </Button>
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="ابحث في المحادثات..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-9 text-sm"
                />
              </div>

              {/* Category Filters */}
              <div className="flex gap-1.5 flex-wrap">
                {CATEGORY_FILTERS.map(f => (
                  <button
                    key={f.key}
                    onClick={() => setCategoryFilter(f.key)}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                      categoryFilter === f.key
                        ? "bg-[#1a1a2e] text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    <f.icon className="w-3 h-3" />
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Conversations List */}
            <ScrollArea className="flex-1">
              {filteredConversations.length > 0 ? (
                filteredConversations.map((conversation) => {
                  const isSelected = selectedConversation?.id === conversation.id;
                  const name = getConversationName(conversation);
                  const avatar = getConversationAvatar(conversation);
                  const type = getConversationType(conversation);
                  const isGroup = type === "group";

                  return (
                    <div
                      key={conversation.id}
                      onClick={() => { setSelectedConversation(conversation); setShowMobileChat(true); }}
                      className={`p-4 flex items-center gap-3 cursor-pointer transition-colors border-b ${
                        isSelected ? "bg-amber-50 border-r-2 border-r-[#d4a574]" : "hover:bg-slate-50"
                      }`}
                    >
                      <div className="relative">
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={avatar} />
                          <AvatarFallback className={`text-white ${isGroup ? 'bg-gradient-to-br from-purple-500 to-indigo-500' : 'bg-gradient-to-br from-[#1a1a2e] to-[#d4a574]'}`}>
                            {isGroup ? <Users className="w-5 h-5" /> : name?.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        {isGroup && (
                          <div className="absolute -bottom-1 -left-1 w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center">
                            <Users className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="font-semibold text-slate-800 truncate text-sm">{name}</h3>
                          <span className="text-xs text-slate-400 flex-shrink-0">
                            {conversation.last_message_date &&
                              new Date(conversation.last_message_date).toLocaleDateString('ar')}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 mt-0.5">
                          {!isGroup && type !== "direct" && (
                            <span className={`text-xs px-1.5 py-0.5 rounded-full ${typeBadgeColor[type] || 'bg-slate-100 text-slate-600'}`}>
                              {typeLabel[type] || type}
                            </span>
                          )}
                          {isGroup && (
                            <span className="text-xs px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-700">
                              جماعية
                            </span>
                          )}
                          <p className="text-xs text-slate-500 truncate">
                            {conversation.last_message || "ابدأ المحادثة"}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-8 text-center text-slate-500">
                  <Users className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                  <p className="text-sm">لا توجد محادثات</p>
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Chat Area */}
          <div className={`flex-1 flex flex-col ${!showMobileChat ? "hidden md:flex" : "flex"}`}>
            {selectedConversation ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b flex items-center justify-between bg-white shadow-sm">
                  <div className="flex items-center gap-3">
                    <button onClick={() => setShowMobileChat(false)} className="md:hidden p-2 hover:bg-slate-100 rounded-lg">
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={getConversationAvatar(selectedConversation)} />
                      <AvatarFallback className={`text-white ${getConversationType(selectedConversation) === 'group' ? 'bg-gradient-to-br from-purple-500 to-indigo-500' : 'bg-gradient-to-br from-[#1a1a2e] to-[#d4a574]'}`}>
                        {getConversationType(selectedConversation) === 'group'
                          ? <Users className="w-5 h-5" />
                          : getConversationName(selectedConversation)?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold text-slate-800 text-sm">{getConversationName(selectedConversation)}</h3>
                      {getConversationType(selectedConversation) === "group" ? (
                        <p className="text-xs text-purple-600">
                          محادثة جماعية · {selectedConversation.participants?.length} مشاركين
                        </p>
                      ) : (
                        <p className="text-xs text-green-500">متصل الآن</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleVoiceCall}
                      className="p-2 rounded-full bg-green-100 hover:bg-green-200 text-green-600 transition-colors"
                      title="مكالمة صوتية جماعية"
                    >
                      <Phone className="w-5 h-5" />
                    </button>
                    <button
                      onClick={handleVideoCall}
                      className="p-2 rounded-full bg-blue-100 hover:bg-blue-200 text-blue-600 transition-colors"
                      title="مكالمة فيديو جماعية"
                    >
                      <Video className="w-5 h-5" />
                    </button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="w-5 h-5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start">
                        <DropdownMenuItem>عرض المشاركين</DropdownMenuItem>
                        <DropdownMenuItem>كتم الإشعارات</DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600">حذف المحادثة</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                {/* Participants Strip for Group */}
                {getConversationType(selectedConversation) === "group" && selectedConversation.participants?.length > 0 && (
                  <div className="px-4 py-2 bg-purple-50 border-b flex items-center gap-2 overflow-x-auto">
                    <span className="text-xs text-purple-600 font-medium flex-shrink-0">المشاركون:</span>
                    {selectedConversation.participants.map(email => {
                      const u = usersMap[email];
                      const name = u?.full_name || u?.company_name || email;
                      const type = u?._type;
                      return (
                        <div key={email} className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full flex-shrink-0 ${typeBadgeColor[type] || 'bg-slate-100 text-slate-600'}`}>
                          {type === "firm" ? <Building2 className="w-3 h-3" /> : type === "engineer" ? <UserCircle className="w-3 h-3" /> : <User className="w-3 h-3" />}
                          {name}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Messages */}
                <ScrollArea className="flex-1 p-4 bg-slate-50">
                  <div className="space-y-4">
                    {messages.map((message) => {
                      const isOwn = message.sender_email === user?.email;
                      const senderInfo = usersMap[message.sender_email];
                      const senderType = senderInfo?._type;
                      return (
                        <motion.div
                          key={message.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`flex gap-2 ${isOwn ? "justify-start" : "justify-end"}`}
                        >
                          {!isOwn && (
                            <Avatar className="w-8 h-8 flex-shrink-0">
                              <AvatarImage src={senderInfo?.profile_image || senderInfo?.company_logo} />
                              <AvatarFallback className="bg-gradient-to-br from-[#1a1a2e] to-[#d4a574] text-white text-xs">
                                {(message.sender_name || message.sender_email)?.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                          )}
                          <div className={`max-w-[65%]`}>
                            {!isOwn && getConversationType(selectedConversation) === "group" && (
                              <div className="flex items-center gap-1 mb-1">
                                <span className="text-xs text-slate-600 font-medium">{message.sender_name || message.sender_email}</span>
                                {senderType && (
                                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${typeBadgeColor[senderType] || ''}`}>
                                    {typeLabel[senderType]}
                                  </span>
                                )}
                              </div>
                            )}
                            <div className={`rounded-2xl px-4 py-2 ${
                              isOwn
                                ? "bg-gradient-to-r from-[#1a1a2e] to-[#d4a574] text-white rounded-br-none"
                                : "bg-white shadow-sm rounded-bl-none"
                            }`}>
                              <p className="text-sm">{message.content}</p>
                              {message.attachments?.map((att, i) => (
                                <a
                                  key={i}
                                  href={att.url || att}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className={`flex items-center gap-2 mt-2 text-sm ${isOwn ? "text-white/80 hover:text-white" : "text-blue-600 hover:text-blue-800"}`}
                                >
                                  <Download className="w-4 h-4" />
                                  {att.name || "تحميل المرفق"}
                                </a>
                              ))}
                            </div>
                            <p className={`text-xs text-slate-400 mt-1 ${isOwn ? "text-right" : "text-left"}`}>
                              {new Date(message.created_date).toLocaleTimeString('ar', { hour: "2-digit", minute: "2-digit" })}
                            </p>
                          </div>
                        </motion.div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>

                {/* Input */}
                <div className="p-4 border-t bg-white">
                  <div className="flex items-center gap-2">
                    <input type="file" id="file-upload" className="hidden" onChange={handleFileUpload} />
                    <label htmlFor="file-upload" className="p-2 hover:bg-slate-100 rounded-lg cursor-pointer">
                      <Paperclip className="w-5 h-5 text-slate-500" />
                    </label>
                    <button
                      onClick={handleVoiceRecord}
                      className={`p-2 rounded-lg transition-colors ${isRecording ? 'bg-red-100 text-red-600 animate-pulse' : 'hover:bg-slate-100 text-slate-500'}`}
                    >
                      {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                    </button>
                    <Input
                      placeholder="اكتب رسالتك..."
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
                      {isSending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
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
                  <h3 className="text-lg font-semibold text-slate-700 mb-2">اختر محادثة</h3>
                  <p className="text-slate-500 text-sm">اختر محادثة أو ابدأ محادثة جديدة</p>
                  <Button onClick={() => setShowNewChat(true)} className="mt-4 bg-gradient-to-r from-[#1a1a2e] to-[#d4a574] text-white">
                    <Plus className="w-4 h-4 ml-2" />
                    محادثة جديدة
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* New Chat Modal */}
      <AnimatePresence>
        {showNewChat && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowNewChat(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-[#1a1a2e]">محادثة جديدة</h3>
                <button onClick={() => setShowNewChat(false)} className="p-1 hover:bg-slate-100 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="relative mb-4">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="ابحث عن عميل، مهندس، أو شركة..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="pr-9"
                  autoFocus
                />
              </div>

              <div className="space-y-2 max-h-80 overflow-y-auto">
                {searchResults.length > 0 ? (
                  searchResults.map((u) => (
                    <div
                      key={u.email}
                      onClick={() => startNewConversation(u, u._type)}
                      className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors"
                    >
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={u.profile_image || u.company_logo} />
                        <AvatarFallback className="bg-gradient-to-br from-[#1a1a2e] to-[#d4a574] text-white">
                          {(u.full_name || u.company_name)?.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-800 text-sm">{u.full_name || u.company_name}</p>
                        <p className="text-xs text-slate-500 truncate">{u.email}</p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full flex-shrink-0 ${typeBadgeColor[u._type]}`}>
                        {typeLabel[u._type]}
                      </span>
                    </div>
                  ))
                ) : userSearch.length > 0 ? (
                  <p className="text-center text-slate-500 py-4 text-sm">لا توجد نتائج</p>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-sm text-slate-500 mb-3">أو أنشئ محادثة جماعية ثلاثية</p>
                    <Button
                      variant="outline"
                      className="gap-2 border-purple-200 text-purple-700 hover:bg-purple-50"
                      onClick={() => {
                        const participants = [...allUsers.engineers.slice(0,1), ...allUsers.firms.slice(0,1)];
                        if (participants.length > 0) createGroupChat(participants, "محادثة مشروع جماعية");
                      }}
                    >
                      <Users className="w-4 h-4" />
                      إنشاء محادثة جماعية
                    </Button>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}