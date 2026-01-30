import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "../utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Phone, Mail, MessageSquare, Plus, TrendingUp, TrendingDown,
  AlertCircle, CheckCircle2, Clock, Filter, Download
} from "lucide-react";
import CRMInteractionForm from "@/components/CRMInteractionForm";
import InteractionTimeline from "@/components/InteractionTimeline";
import SentimentAnalyzer from "@/components/SentimentAnalyzer";

export default function CRMDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [interactions, setInteractions] = useState([]);
  const [followUps, setFollowUps] = useState([]);
  const [clients, setClients] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [showNewInteraction, setShowNewInteraction] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const userData = await base44.auth.me();
        setUser(userData);
        loadData();
      } catch {
        navigate(createPageUrl("Home"));
      }
    };
    checkAuth();
  }, [navigate]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [interactionData, followUpData] = await Promise.all([
        base44.entities.ClientInteraction.list('-interaction_date', 100),
        base44.entities.FollowUpMeeting.filter({ status: 'scheduled' })
      ]);

      setInteractions(interactionData);
      setFollowUps(followUpData);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const getSentimentColor = (sentiment) => {
    switch (sentiment) {
      case "positive":
        return "bg-green-100 text-green-800";
      case "negative":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getInteractionIcon = (type) => {
    switch (type) {
      case "call":
        return <Phone className="w-4 h-4" />;
      case "email":
        return <Mail className="w-4 h-4" />;
      case "message":
        return <MessageSquare className="w-4 h-4" />;
      default:
        return <MessageSquare className="w-4 h-4" />;
    }
  };

  const filteredInteractions = interactions.filter(i => {
    const matchesSearch = i.title.includes(searchTerm) || i.client_email.includes(searchTerm);
    const matchesType = filterType === "all" || i.interaction_type === filterType;
    return matchesSearch && matchesType;
  });

  const sentimentStats = {
    positive: interactions.filter(i => i.sentiment === "positive").length,
    negative: interactions.filter(i => i.sentiment === "negative").length,
    neutral: interactions.filter(i => i.sentiment === "neutral").length
  };

  const urgentFollowUps = followUps.filter(f => {
    const date = new Date(f.scheduled_date);
    const today = new Date();
    const daysUntil = (date - today) / (1000 * 60 * 60 * 24);
    return daysUntil <= 2;
  });

  if (loading) return <div className="p-8 text-center">جاري التحميل...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-8" dir="rtl">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-slate-900">وحدة CRM</h1>
            <p className="text-slate-600">تتبع وإدارة تفاعلات العملاء</p>
          </div>
          <Dialog open={showNewInteraction} onOpenChange={setShowNewInteraction}>
            <DialogTrigger asChild>
              <Button className="gap-2 bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4" />
                تفاعل جديد
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>تسجيل تفاعل جديد</DialogTitle>
              </DialogHeader>
              <CRMInteractionForm
                onSuccess={() => {
                  setShowNewInteraction(false);
                  loadData();
                }}
              />
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-slate-600 mb-2">إجمالي التفاعلات</p>
                <p className="text-3xl font-bold">{interactions.length}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center flex flex-col items-center">
                <div className="flex items-center gap-1 mb-2">
                  <TrendingUp className="w-4 h-4 text-green-600" />
                  <p className="text-sm text-slate-600">إيجابي</p>
                </div>
                <p className="text-3xl font-bold text-green-600">{sentimentStats.positive}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center flex flex-col items-center">
                <div className="flex items-center gap-1 mb-2">
                  <TrendingDown className="w-4 h-4 text-red-600" />
                  <p className="text-sm text-slate-600">سلبي</p>
                </div>
                <p className="text-3xl font-bold text-red-600">{sentimentStats.negative}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center flex flex-col items-center">
                <div className="flex items-center gap-1 mb-2">
                  <AlertCircle className="w-4 h-4 text-yellow-600" />
                  <p className="text-sm text-slate-600">متابعات عاجلة</p>
                </div>
                <p className="text-3xl font-bold text-yellow-600">{urgentFollowUps.length}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="interactions" className="space-y-4">
          <TabsList>
            <TabsTrigger value="interactions">التفاعلات</TabsTrigger>
            <TabsTrigger value="followups">المتابعات</TabsTrigger>
            <TabsTrigger value="analytics">التحليلات</TabsTrigger>
          </TabsList>

          {/* Interactions Tab */}
          <TabsContent value="interactions">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>سجل التفاعلات</CardTitle>
                  <div className="flex gap-2">
                    <Input
                      placeholder="ابحث عن بريد أو عنوان..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-64"
                    />
                    <select
                      value={filterType}
                      onChange={(e) => setFilterType(e.target.value)}
                      className="px-3 py-2 border rounded-md"
                    >
                      <option value="all">جميع الأنواع</option>
                      <option value="call">مكالمات</option>
                      <option value="email">رسائل بريد</option>
                      <option value="meeting">اجتماعات</option>
                      <option value="message">رسائل</option>
                      <option value="note">ملاحظات</option>
                    </select>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {filteredInteractions.length === 0 ? (
                  <p className="text-slate-500 py-8 text-center">لا توجد تفاعلات</p>
                ) : (
                  filteredInteractions.map((interaction) => (
                    <div
                      key={interaction.id}
                      className="p-4 border rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex gap-4 flex-1">
                          <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-lg">
                            {getInteractionIcon(interaction.interaction_type)}
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold">{interaction.title}</p>
                            <p className="text-sm text-slate-600">{interaction.client_email}</p>
                            <p className="text-sm text-slate-500 mt-1 line-clamp-2">{interaction.content}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          {interaction.sentiment && (
                            <Badge className={`${getSentimentColor(interaction.sentiment)} mb-2 block`}>
                              {interaction.sentiment === "positive" ? "إيجابي" : interaction.sentiment === "negative" ? "سلبي" : "محايد"}
                            </Badge>
                          )}
                          <p className="text-xs text-slate-500">
                            {new Date(interaction.interaction_date).toLocaleDateString("ar-SA")}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Follow-ups Tab */}
          <TabsContent value="followups">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  الاجتماعات المجدولة
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {followUps.length === 0 ? (
                  <p className="text-slate-500 py-8 text-center">لا توجد متابعات مجدولة</p>
                ) : (
                  followUps.map((meeting) => {
                    const isUrgent = urgentFollowUps.find(u => u.id === meeting.id);
                    return (
                      <div
                        key={meeting.id}
                        className={`p-4 border rounded-lg ${isUrgent ? "bg-yellow-50 border-yellow-200" : "hover:bg-slate-50"}`}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-semibold flex items-center gap-2">
                              {meeting.title}
                              {isUrgent && <Badge className="bg-yellow-600 text-white">عاجل</Badge>}
                            </p>
                            <p className="text-sm text-slate-600">{meeting.client_email}</p>
                            <p className="text-sm text-slate-500 mt-1">{meeting.description}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-sm">
                              {new Date(meeting.scheduled_date).toLocaleDateString("ar-SA")}
                            </p>
                            <p className="text-xs text-slate-500">
                              {new Date(meeting.scheduled_date).toLocaleTimeString("ar-SA")}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>توزيع المشاعر</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between mb-1">
                        <p className="text-sm font-medium">إيجابي</p>
                        <p className="text-sm">{Math.round((sentimentStats.positive / interactions.length) * 100)}%</p>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-600 h-2 rounded-full"
                          style={{ width: `${(sentimentStats.positive / interactions.length) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <p className="text-sm font-medium">محايد</p>
                        <p className="text-sm">{Math.round((sentimentStats.neutral / interactions.length) * 100)}%</p>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-gray-600 h-2 rounded-full"
                          style={{ width: `${(sentimentStats.neutral / interactions.length) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <p className="text-sm font-medium">سلبي</p>
                        <p className="text-sm">{Math.round((sentimentStats.negative / interactions.length) * 100)}%</p>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-red-600 h-2 rounded-full"
                          style={{ width: `${(sentimentStats.negative / interactions.length) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}