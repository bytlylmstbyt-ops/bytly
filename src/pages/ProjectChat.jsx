import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useSearchParams, Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, MessageCircle, Search, Archive, Loader2 } from "lucide-react";
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

  useEffect(() => {
    loadData();
  }, [projectId]);

  useEffect(() => {
    // Real-time subscription to conversation updates
    const unsubscribe = base44.entities.Conversation.subscribe((event) => {
      if (event.data?.project_id === projectId) {
        if (event.type === 'create') {
          setConversations(prev => [...prev, event.data]);
        } else if (event.type === 'update') {
          setConversations(prev => prev.map(c => c.id === event.id ? event.data : c));
        }
      }
    });

    return () => unsubscribe();
  }, [projectId]);

  const loadData = async () => {
    try {
      const user = await base44.auth.me();
      setCurrentUser(user);

      const [projectData] = await base44.entities.Project.filter({ id: projectId });
      setProject(projectData);

      let convs = await base44.entities.Conversation.filter({
        project_id: projectId,
        is_archived: false
      });

      // Create main room if it doesn't exist
      const mainRoom = convs.find(c => c.is_main_room);
      if (!mainRoom && projectData.project_type === "full_construction") {
        const participants = [projectData.client_id];
        if (projectData.assigned_engineer_id) participants.push(projectData.assigned_engineer_id);
        
        const newMainRoom = await base44.entities.Conversation.create({
          project_id: projectId,
          type: "three_way",
          name: "غرفة المشروع الرئيسية - جميع الأطراف",
          description: "محادثة بين العميل والمهندس والشركة الاستشارية",
          participants,
          is_main_room: true
        });
        convs = [newMainRoom, ...convs];
      }
      
      setConversations(convs);

      // Load available participants
      const [engineers, clients] = await Promise.all([
        base44.entities.Engineer.list(),
        base44.entities.Client.list()
      ]);
      setAvailableParticipants([
        ...engineers.map(e => ({ email: e.email, name: e.full_name, type: "engineer" })),
        ...clients.map(c => ({ email: c.email, name: c.full_name, type: "client" }))
      ]);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateConversation = async () => {
    if (selectedParticipants.length === 0) return;

    setCreatingConv(true);
    try {
      const newConv = await base44.entities.Conversation.create({
        project_id: projectId,
        type: selectedParticipants.length > 1 ? "group" : "direct",
        name: newConvName || `محادثة مع ${selectedParticipants.join(", ")}`,
        participants: [currentUser.email, ...selectedParticipants],
        admin_emails: [currentUser.email]
      });

      setConversations([...conversations, newConv]);
      setSelectedParticipants([]);
      setNewConvName("");
    } catch (error) {
      console.error("Error creating conversation:", error);
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