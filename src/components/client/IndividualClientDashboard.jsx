import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { supabase } from "@/lib/supabaseClient";
import { motion } from "framer-motion";
import { 
  Briefcase, Wallet, Plus, ArrowLeft, Clock, 
  TrendingUp, Settings, Shield, Unlock, Scale, Star, CalendarDays, Bell, FileText, Mail, Phone, MapPin, MessageCircle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import ProjectScheduleCalendar from "@/components/engineers/ProjectScheduleCalendar";

export default function IndividualClientDashboard({ client, stats, recentProjects, recentProposals = [] }) {
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [conversationCount, setConversationCount] = useState(0);

  useEffect(() => {
    let active = true;
    const loadCommunicationSummary = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || !active) return;
        const [notificationsResult, conversationsResult] = await Promise.all([
          supabase.from("notifications").select("id", { count: "exact", head: true }).eq("user_id", user.id).is("read_at", null),
          user.email
            ? supabase.from("user_conversations").select("id", { count: "exact", head: true }).contains("participants", [user.email.trim().toLowerCase()])
            : Promise.resolve({ count: 0, error: null })
        ]);
        if (!active) return;
        if (!notificationsResult.error) setUnreadNotifications(notificationsResult.count || 0);
        if (!conversationsResult.error) setConversationCount(conversationsResult.count || 0);
      } catch (error) {
        console.error("Could not load client communication summary", error);
      }
    };
    loadCommunicationSummary();
    return () => { active = false; };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-amber-50/30 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <Avatar className="w-16 h-16 border-2 border-white shadow-lg">
                <AvatarImage src={client.profile_image} />
                <AvatarFallback className="bg-gradient-to-br from-[#1a1a2e] to-[#C9A66B] text-white text-xl">
                  {client.full_name?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <h1 className="text-2xl font-bold text-[#1a1a2e]">
                  مرحباً بك، {client.full_name || "عميل بيتلي"}
                </h1>
                <p className="text-slate-500">صاحب مشاريع · أهلاً بك في بيتلي</p>
                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm text-slate-600">
                  {client.phone && <a href={`tel:${client.phone}`} className="inline-flex items-center gap-1.5 hover:text-[#9a7740]" dir="ltr"><Phone className="h-4 w-4" />{client.phone}</a>}
                  {client.email && <a href={`mailto:${client.email}`} className="inline-flex items-center gap-1.5 hover:text-[#9a7740]"><Mail className="h-4 w-4" />{client.email}</a>}
                  {(client.city || client.location || client.address) && <span className="inline-flex items-center gap-1.5"><MapPin className="h-4 w-4" />{[client.city, client.location, client.address].filter(Boolean).join("، ")}</span>}
                </div>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Link to={createPageUrl("NotificationCenter")} aria-label="الإشعارات" title="الإشعارات">
                <Button variant="outline" className="relative" size="icon">
                  <Bell className="h-5 w-5" />
                  {unreadNotifications > 0 && <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-red-600 px-1 text-[10px] leading-5 text-white">{unreadNotifications > 99 ? "99+" : unreadNotifications}</span>}
                </Button>
              </Link>
              <Link to={createPageUrl("Messages")} aria-label="الرسائل" title="الرسائل">
                <Button variant="outline" className="relative" size="icon">
                  <MessageCircle className="h-5 w-5" />
                  {conversationCount > 0 && <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-[#C9A66B] px-1 text-[10px] leading-5 text-white">{conversationCount > 99 ? "99+" : conversationCount}</span>}
                </Button>
              </Link>
              <Link to={createPageUrl("CreateProject")}>
                <Button className="bg-gradient-to-r from-[#1a1a2e] to-[#C9A66B] text-white">
                  <Plus className="w-5 h-5 ml-2" />
                  مشروع جديد
                </Button>
              </Link>
              <Link to={createPageUrl("MyDisputes")}>
                <Button variant="outline" className="border-amber-300 text-amber-800 hover:bg-amber-50">
                  <Scale className="w-5 h-5 ml-2" />
                  النزاعات
                </Button>
              </Link>
              <Link to={createPageUrl("Settings")}>
                <Button variant="outline">
                  <Settings className="w-5 h-5" />
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                    <Briefcase className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
                <p className="text-3xl font-bold text-[#1a1a2e]">{stats.totalProjects}</p>
                <p className="text-sm text-slate-500">إجمالي المشاريع</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                    <Clock className="w-6 h-6 text-green-600" />
                  </div>
                </div>
                <p className="text-3xl font-bold text-[#1a1a2e]">{stats.openProjects}</p>
                <p className="text-sm text-slate-500">مشاريع مفتوحة</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-amber-600" />
                  </div>
                </div>
                <p className="text-3xl font-bold text-[#1a1a2e]">{stats.inProgressProjects}</p>
                <p className="text-sm text-slate-500">قيد التنفيذ</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                    <Wallet className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
                <p className="text-3xl font-bold text-[#1a1a2e]">{stats.walletBalance?.toLocaleString()}</p>
                <p className="text-sm text-slate-500">ر.س في المحفظة</p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Quick overview — simplified to match the engineer dashboard while staying client-focused */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
          <Card className="border-0 shadow-lg xl:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-[#1a1a2e]">
                <FileText className="w-5 h-5 text-[#C9A66B]" />
                ملخص العروض المقدمة لمشاريعك
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentProposals.length > 0 ? (
                <div className="space-y-3">
                  {recentProposals.slice(0, 4).map((offer, index) => {
                    const linkedProject = recentProjects.find(project => project.id === offer.project_id);
                    const statusLabel = offer.status === "accepted" ? "مقبول" : offer.status === "rejected" ? "مرفوض" : offer.status === "pending" ? "بانتظار الرد" : "قيد المراجعة";
                    const statusClass = offer.status === "accepted" ? "bg-green-100 text-green-700" : offer.status === "rejected" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-800";
                    return (
                      <div key={offer.id || index} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50 p-4">
                        <div>
                          <p className="font-semibold text-slate-800">{linkedProject?.title || offer.provider_name || offer.firm_name || `العرض رقم ${index + 1}`}</p>
                          <p className="mt-1 text-sm text-slate-500">{offer.provider_name || offer.firm_name || "مقدم خدمة عبر بيتلي"}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          {offer.amount != null && <span className="text-sm font-semibold text-slate-700">{Number(offer.amount).toLocaleString("ar-SA")} ر.س</span>}
                          <Badge className={statusClass}>{statusLabel}</Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-xl bg-slate-50 p-5 text-center text-sm text-slate-500">ستظهر هنا عروض المهندسين والمكاتب فور تقديمها على مشاريعك.</div>
              )}
            </CardContent>
          </Card>
          <Card className="border-0 shadow-lg">
            <CardHeader><CardTitle className="flex items-center gap-2"><Wallet className="w-5 h-5 text-emerald-600" />ملخص المحفظة والضمان</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-xl bg-emerald-50 p-4">
                <p className="text-sm text-emerald-800">الرصيد المتاح</p>
                <p className="mt-1 text-2xl font-bold text-emerald-900">{Number(stats.walletBalance || 0).toLocaleString("ar-SA")} ر.س</p>
              </div>
              <div className="rounded-xl bg-blue-50 p-4">
                <p className="text-sm text-blue-800">المبالغ المحجوزة للمشاريع</p>
                <p className="mt-1 text-2xl font-bold text-blue-900">{recentProjects.filter(project => project.escrow_status === "held").reduce((sum, project) => sum + Number(project.escrow_amount || 0), 0).toLocaleString("ar-SA")} ر.س</p>
              </div>
              <p className="text-xs leading-5 text-slate-500">الأرقام المعروضة تعتمد على البيانات المتاحة للمشاريع والمحفظة، ولا تعني تنفيذ أي عملية مالية.</p>
              <Link to={createPageUrl("Wallet")}><Button variant="outline" className="w-full">تفاصيل المحفظة</Button></Link>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Link to={createPageUrl("CreateProject")} className="block">
            <Card className="h-full border-0 shadow-md transition hover:-translate-y-0.5 hover:shadow-lg">
              <CardContent className="flex items-center gap-3 p-5">
                <div className="rounded-xl bg-amber-100 p-3"><Briefcase className="h-5 w-5 text-amber-800" /></div>
                <div><p className="font-bold text-slate-800">طلب عمل جديد</p><p className="text-sm text-slate-500">أضف تفاصيل المشروع واحتياجاتك</p></div>
              </CardContent>
            </Card>
          </Link>
          <Link to={createPageUrl("MyDisputes")} className="block">
            <Card className="h-full border-0 shadow-md transition hover:-translate-y-0.5 hover:shadow-lg">
              <CardContent className="flex items-center gap-3 p-5">
                <div className="rounded-xl bg-purple-100 p-3"><Bell className="h-5 w-5 text-purple-700" /></div>
                <div><p className="font-bold text-slate-800">المساعدة والاسترجاع</p><p className="text-sm text-slate-500">تابع الاعتراضات وطلبات المساعدة</p></div>
              </CardContent>
            </Card>
          </Link>
          <Link to={createPageUrl("Settings")} className="block">
            <Card className="h-full border-0 shadow-md transition hover:-translate-y-0.5 hover:shadow-lg">
              <CardContent className="flex items-center gap-3 p-5">
                <div className="rounded-xl bg-rose-100 p-3"><Star className="h-5 w-5 text-rose-700" /></div>
                <div><p className="font-bold text-slate-800">تقييماتي وملفي العام</p><p className="text-sm text-slate-500">راجع بياناتك وتابع جودة الخدمات</p></div>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Escrow Alert for in-progress projects */}
        {recentProjects.some(p => p.status === 'in_progress' && p.escrow_status === 'held') && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
            <Card className="border-blue-200 bg-blue-50 border-0 shadow-lg">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-200 flex items-center justify-center shrink-0">
                    <Shield className="w-5 h-5 text-blue-700" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-blue-900">مبالغ ضمان محجوزة</h3>
                    <p className="text-sm text-blue-700 mt-1">
                      لديك مشاريع بمبالغ محجوزة في بيتلي. بعد استلام المخططات يمكنك تحرير المبلغ للمهندس من صفحة تفاصيل المشروع.
                    </p>
                    <div className="flex gap-2 mt-3">
                      {recentProjects.filter(p => p.status === 'in_progress' && p.escrow_status === 'held').map(p => (
                        <Link key={p.id} to={createPageUrl("ProjectDetails") + `?id=${p.id}`}>
                          <Badge className="bg-blue-100 text-blue-700 cursor-pointer hover:bg-blue-200 gap-1">
                            <Unlock className="w-3 h-3" /> {p.title?.slice(0, 20)}...
                          </Badge>
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Project Schedule Calendar — تقويم مشاريع العميل */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <ProjectScheduleCalendar clientId={client.id} />
        </motion.div>

        {/* Disputes & Support */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <Card className="border-amber-200 bg-gradient-to-l from-amber-50 via-white to-white shadow-lg">
            <CardContent className="p-5 md:p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                    <Scale className="w-6 h-6 text-amber-700" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-[#1a1a2e]">النزاعات وحل المشكلات</h2>
                    <p className="text-sm text-slate-600 mt-1">
                      إذا كان لديك اعتراض على مشروع أو مرحلة، يمكنك تقديم نزاع وإرفاق المستندات والأدلة ومتابعة حالته.
                    </p>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 shrink-0">
                  <Link to={createPageUrl("FileDispute")}>
                    <Button className="w-full sm:w-auto bg-gradient-to-r from-[#1a1a2e] to-[#C9A66B] text-white">
                      <Scale className="w-4 h-4 ml-2" />
                      تقديم نزاع
                    </Button>
                  </Link>
                  <Link to={createPageUrl("MyDisputes")}>
                    <Button variant="outline" className="w-full sm:w-auto border-amber-300 text-amber-800 hover:bg-amber-50">
                      متابعة نزاعاتي
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Projects */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle>مشاريعي الأخيرة</CardTitle>
            </CardHeader>
            <CardContent>
              {recentProjects.length > 0 ? (
                <div className="space-y-4">
                  {recentProjects.map(project => (
                    <Link key={project.id} to={createPageUrl("ProjectDetails") + `?id=${project.id}`}>
                      <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                        <div>
                          <p className="font-medium text-[#1a1a2e]">{project.title}</p>
                          <p className="text-sm text-slate-500">{project.total_proposals || 0} عرض</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {project.escrow_status === 'held' && (
                            <Badge className="bg-blue-100 text-blue-700 gap-1">
                              <Shield className="w-3 h-3" /> ضمان محجوز
                            </Badge>
                          )}
                          <Badge className={
                            project.status === "completed" ? "bg-green-100 text-green-700" :
                            project.status === "in_progress" ? "bg-blue-100 text-blue-700" :
                            project.status === "cancelled" ? "bg-red-100 text-red-700" :
                            "bg-amber-100 text-amber-700"
                          }>
                            {project.status === "completed" ? "مكتمل" :
                             project.status === "in_progress" ? "قيد التنفيذ" :
                             project.status === "cancelled" ? "ملغي" : "مفتوح"}
                          </Badge>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500">
                  <Briefcase className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                  <p>لم تضف أي مشاريع بعد</p>
                  <Link to={createPageUrl("CreateProject")}>
                    <Button variant="link" className="text-[#C9A66B]">
                      أضف مشروعك الأول
                      <ArrowLeft className="w-4 h-4 mr-2" />
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}