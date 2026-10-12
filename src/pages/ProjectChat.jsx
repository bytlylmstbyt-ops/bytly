import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useSearchParams, Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, MessageCircle, Loader2 } from "lucide-react";
import EnhancedChatWindow from "@/components/chat/EnhancedChatWindow";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";

export default function ProjectChat() {
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get("id");

  const [project, setProject] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedParticipants, setSelectedParticipants] = useState([]);
  const [availableParticipants, setAvailableParticipants] = useState([]);
  const [newConvName, setNewConvName] = useState("");
  const [creatingConv, setCreatingConv] = useState(false);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    loadData();
  }, [projectId]);

  useEffect(() => {
    const channel = supabase
      .channel(`project-conversations-${projectId || "none"}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "conversations" }, payload => {
        const row = payload.new || payload.old;
        if (!row || row.project_id !== projectId) return;
        if (payload.eventType === "INSERT") setConversations(prev => prev.some(item => item.id === row.id) ? prev : [...prev, mapConversation(row)]);
        if (payload.eventType === "UPDATE") setConversations(prev => prev.map(item => item.id === row.id ? mapConversation(row) : item));
        if (payload.eventType === "DELETE") setConversations(prev => prev.filter(item => item.id !== row.id));
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [projectId]);

  const mapConversation = row => ({
    ...row,
    name: row.title || "محادثة المشروع",
    participants: Array.isArray(row.participants) ? row.participants : [],
    is_archived: row.is_archived || false,
    participant_roles: row.participant_roles || {},
  });

  const loadData = async () => {
    setLoading(true);
    setLoadError("");
    try {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      const user = authData?.user;
      if (!user?.id) throw new Error("سجّل الدخول لعرض محادثات المشروع.");
      setCurrentUser({ id: user.id, email: user.email, full_name: user.user_metadata?.full_name || user.email });
      if (!projectId) throw new Error("معرّف المشروع غير موجود في الرابط.");
      const { data: projectData, error: projectError } = await supabase.from("projects").select("*").eq("id", projectId).maybeSingle();
      if (projectError) throw projectError;
      if (!projectData) throw new Error("المشروع غير موجود أو لا تملك صلاحية عرضه.");
      setProject(projectData);
      const [convResult, memberResult, engineerResult, clientResult] = await Promise.all([
        supabase.from("conversations").select("*").eq("project_id", projectId).eq("is_archived", false).order("created_at", { ascending: false }),
        supabase.from("conversation_members").select("conversation_id").eq("user_id", user.id),
        supabase.from("engineers").select("id,user_id,email,full_name,status").limit(500),
        supabase.from("clients").select("id,user_id,email,full_name,status").limit(500),
      ]);
      for (const result of [convResult, memberResult, engineerResult, clientResult]) if (result.error) throw result.error;
      const memberIds = new Set((memberResult.data || []).map(row => row.conversation_id));
      setConversations((convResult.data || []).filter(row => row.created_by === user.id || memberIds.has(row.id)).map(mapConversation));
      const allParticipants = [
        ...(engineerResult.data || []).map(item => ({ email: item.email, name: item.full_name, type: "engineer", user_id: item.user_id })),
        ...(clientResult.data || []).map(item => ({ email: item.email, name: item.full_name, type: "client", user_id: item.user_id })),
      ].filter(item => item.email && item.user_id && item.user_id !== user.id);
      const unique = new Map();
      allParticipants.forEach(item => { if (!unique.has(item.user_id)) unique.set(item.user_id, item); });
      setAvailableParticipants([...unique.values()]);
    } catch (error) {
      console.error("Error loading project chat:", error);
      setLoadError(error?.message || "تعذر تحميل محادثات المشروع.");
      setProject(null);
      setConversations([]);
      setAvailableParticipants([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateConversation = async () => {
    if (!selectedParticipants.length || !currentUser?.id) return;
    setCreatingConv(true);
    setLoadError("");
    try {
      const selected = availableParticipants.filter(item => selectedParticipants.includes(item.email));
      if (selected.length !== selectedParticipants.length) throw new Error("تعذر التحقق من جميع المشاركين المحددين.");
      const userIds = [...new Set([currentUser.id, ...selected.map(item => item.user_id)])];
      const emails = [currentUser.email, ...selected.map(item => item.email)].filter(Boolean);
      const roles = { [currentUser.email]: "user" };
      selected.forEach(item => { roles[item.email] = item.type; });
      const { data: created, error } = await supabase.from("conversations").insert({
        project_id: projectId,
        created_by: currentUser.id,
        title: newConvName.trim() || `محادثة مع ${selected.map(item => item.name || item.email).join("، ")}`,
        type: selected.length > 1 ? "group" : "direct",
        participants: emails,
        participant_roles: roles,
        is_archived: false,
      }).select("*").single();
      if (error) throw error;
      const { error: membersError } = await supabase.from("conversation_members").insert(
        userIds.map(user_id => ({ conversation_id: created.id, user_id }))
      );
      if (membersError) throw new Error("أُنشئت المحادثة لكن تعذرت إضافة المشاركين. أعيدي المحاولة أو تواصلي مع الدعم.");
      setConversations(prev => [mapConversation(created), ...prev]);
      setSelectedParticipants([]);
      setNewConvName("");
    } catch (error) {
      console.error("Error creating Supabase conversation:", error);
      setLoadError(error?.message || "تعذر إنشاء المحادثة.");
    } finally {
      setCreatingConv(false);
    }
  };

  const filteredConversations = conversations.filter(conv =>
    conv.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.participants.some(p => p.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#C9A66B]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-amber-50/30 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          {loadError && <div role="alert" className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{loadError}</div>}
          {/* Header */}
          <div className="mb-8">
            <Link to={createPageUrl("ProjectKanban") + `?id=${projectId}`}>
              <Button variant="ghost" className="mb-4">← عودة</Button>
            </Link>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-[#1a1a2e]">محادثات المشروع</h1>
                <p className="text-slate-600 mt-1">{project?.title}</p>
              </div>
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="gap-2 bg-gradient-to-r from-blue-600 to-indigo-600">
                    <Plus className="w-4 h-4" />
                    محادثة جديدة
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>إنشاء محادثة جديدة</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">اسم المحادثة (اختياري)</label>
                      <Input
                        value={newConvName}
                        onChange={(e) => setNewConvName(e.target.value)}
                        placeholder="مثال: مناقشة التصميم"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">المشاركون</label>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {availableParticipants
                          .filter(p => p.email !== currentUser?.email)
                          .map((participant) => (
                            <div
                              key={participant.email}
                              className="flex items-center gap-2 p-2 hover:bg-slate-100 rounded"
                            >
                              <Checkbox
                                checked={selectedParticipants.includes(participant.email)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setSelectedParticipants([...selectedParticipants, participant.email]);
                                  } else {
                                    setSelectedParticipants(selectedParticipants.filter(e => e !== participant.email));
                                  }
                                }}
                              />
                              <div className="flex-1">
                                <p className="text-sm font-medium">{participant.name}</p>
                                <p className="text-xs text-slate-600">{participant.email}</p>
                              </div>
                              <Badge variant="outline" className="text-xs">
                                {participant.type === "engineer" ? "مهندس" : "عميل"}
                              </Badge>
                            </div>
                          ))}
                      </div>
                    </div>

                    <Button
                      onClick={handleCreateConversation}
                      disabled={creatingConv || selectedParticipants.length === 0}
                      className="w-full bg-gradient-to-r from-blue-600 to-indigo-600"
                    >
                      {creatingConv ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin ml-2" />
                          جاري الإنشاء...
                        </>
                      ) : (
                        "إنشاء المحادثة"
                      )}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Conversations List */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>المحادثات</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Input
                    placeholder="ابحث عن محادثة..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />

                  <div className="space-y-2 mt-4 max-h-96 overflow-y-auto">
                    {filteredConversations.length === 0 ? (
                      <p className="text-sm text-slate-500 text-center py-8">لا توجد محادثات</p>
                    ) : (
                      filteredConversations.map((conv) => (
                        <motion.button
                          key={conv.id}
                          whileHover={{ x: 4 }}
                          onClick={() => setSelectedConversation(conv)}
                          className={`w-full text-left p-3 rounded-lg transition-all ${
                            selectedConversation?.id === conv.id
                              ? "bg-blue-100 border-l-4 border-blue-600"
                              : "hover:bg-slate-100"
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">
                                {conv.name || "محادثة"}
                              </p>
                              <p className="text-xs text-slate-600 truncate mt-1">
                                {conv.last_message || "لا توجد رسائل"}
                              </p>
                            </div>
                            <MessageCircle className="w-4 h-4 text-slate-400 flex-shrink-0" />
                          </div>
                        </motion.button>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Chat Window */}
            <div className="lg:col-span-2">
              {selectedConversation ? (
                <EnhancedChatWindow
                  conversation={selectedConversation}
                  currentUserEmail={currentUser?.email}
                  onClose={() => setSelectedConversation(null)}
                  projectData={project}
                />
              ) : (
                <Card className="h-96">
                  <CardContent className="flex items-center justify-center h-full text-slate-500">
                    <div className="text-center">
                      <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>اختر محادثة أو أنشئ محادثة جديدة</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}