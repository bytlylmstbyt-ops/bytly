import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { supabase } from "@/lib/supabaseClient";
import { uploadScopedFile } from "@/lib/projectFileStorage";
import { motion } from "framer-motion";
import {
  MapPin, DollarSign, FileCheck, CheckCircle, Clock, Plus, Wallet, Shield,
  Building2, CreditCard, Loader2, Eye, Calendar, FileText, Download,
  FolderOpen, TrendingUp, Upload
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { differenceInDays, format } from "date-fns";
import { toast } from "sonner";
import { ar } from "date-fns/locale";

const PLATFORM_OWNER_EMAIL = "bytlylmstbyt@gmail.com";

export default function InvestorHubSupabase() {
  const [loading, setLoading] = useState(true);
  const [client, setClient] = useState(null);
  const [projects, setProjects] = useState([]);
  const [allMilestones, setAllMilestones] = useState([]);
  const [pendingPayments, setPendingPayments] = useState([]);
  const [selectedPayments, setSelectedPayments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => { loadInvestorData(); }, []);

  const loadInvestorData = async () => {
    setLoading(true);
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        window.location.href = createPageUrl("Dashboard");
        return;
      }

      const email = (user.email || "").trim().toLowerCase();
      const { data: profile } = await supabase
        .from("profiles")
        .select("role,full_name,email")
        .eq("id", user.id)
        .maybeSingle();
      const isAdmin = email === PLATFORM_OWNER_EMAIL || profile?.role === "admin";

      const { data: clientData, error: clientError } = await supabase
        .from("clients")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (clientError) throw clientError;

      if (!isAdmin && (!clientData || clientData.client_type !== "investor")) {
        window.location.href = createPageUrl("Dashboard");
        return;
      }

      const investorClient = clientData || {
        full_name: profile?.full_name || user.user_metadata?.full_name || user.email,
        email: user.email,
        client_type: "investor",
        wallet_balance: 0
      };
      setClient(investorClient);

      let projectsQuery = supabase.from("projects").select("*").order("created_at", { ascending: false });
      if (!isAdmin) {
        projectsQuery = projectsQuery.or(`client_user_id.eq.${user.id},client_id.eq.${investorClient.id}`);
      }
      const { data: projectRows, error: projectError } = await projectsQuery;
      if (projectError) throw projectError;
      const projectsList = projectRows || [];
      setProjects(projectsList);

      if (projectsList.length === 0) {
        setAllMilestones([]);
        setPendingPayments([]);
        return;
      }

      const projectIds = projectsList.map(p => p.id);
      const { data: milestones, error: milestoneError } = await supabase
        .from("project_milestones")
        .select("*")
        .in("project_id", projectIds)
        .order("sequence_no", { ascending: true });
      if (milestoneError) throw milestoneError;

      const projectMap = Object.fromEntries(projectsList.map(p => [p.id, p]));
      const enriched = (milestones || []).map(m => ({
        ...m,
        project_title: projectMap[m.project_id]?.title,
        project_location: projectMap[m.project_id]?.location,
        order: m.sequence_no
      }));
      setAllMilestones(enriched);
      setPendingPayments(enriched.filter(m => m.status === "pending" || m.status === "submitted"));
    } catch (error) {
      console.error("Error loading Supabase investor data:", error);
      toast.error("تعذّر تحميل بيانات مركز المستثمر");
      setProjects([]);
      setAllMilestones([]);
      setPendingPayments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadDocument = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploading(true);
      await uploadScopedFile("investor", file);
      toast.success("تم رفع المستند بنجاح");
      await loadInvestorData();
    } catch (err) {
      console.error("Upload error:", err);
      toast.error("تعذّر رفع المستند");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const getProjectStatus = (project) => {
    const ms = allMilestones.filter(m => m.project_id === project.id);
    const overdue = ms.some(m => m.due_date && m.status !== "completed" && differenceInDays(new Date(m.due_date), new Date()) < 0);
    const attention = ms.some(m => m.status === "submitted" || m.status === "revision_requested");
    if (overdue || project.status === "disputed") return "red";
    if (attention) return "yellow";
    return "green";
  };

  const togglePaymentSelection = (id) => setSelectedPayments(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const handleBulkPayment = () => {
    if (!selectedPayments.length) {
      toast.error("يرجى اختيار مرحلة واحدة على الأقل");
      return;
    }
    toast.info("بوابة الدفع ستُربط بمسار الدفع المعتمد في Bytly قبل الإطلاق");
  };

  const activeProjects = projects.filter(p => p.status === "in_progress").length;
  const totalEscrow = projects.reduce((sum, p) => sum + Number(p.escrow_amount || 0), 0);
  const completedMilestones = allMilestones.filter(m => m.status === "completed").length;
  const totalInvestment = projects.reduce((sum, p) => sum + Number(p.budget_max || 0), 0);
  const completionRate = allMilestones.length ? Math.round((completedMilestones / allMilestones.length) * 100) : 0;
  const selectedTotal = selectedPayments.reduce((sum, id) => sum + Number(pendingPayments.find(m => m.id === id)?.amount || 0), 0);

  const statusColors = {
    green: { bg: "bg-green-50", text: "text-green-700", border: "border-green-300", dot: "bg-green-500", label: "يسير حسب الخطة" },
    yellow: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-300", dot: "bg-amber-500", label: "يحتاج انتباهك" },
    red: { bg: "bg-red-50", text: "text-red-700", border: "border-red-300", dot: "bg-red-500", label: "تأخير أو مشكلة" }
  };

  const kpiCards = useMemo(() => [
    { icon: Building2, iconBg: "bg-[#E5D4B8]", iconColor: "text-[#6B5D4F]", badge: activeProjects, label: "المشاريع النشطة", sub: `من أصل ${projects.length}`, value: null, gradient: "from-[#FBF8F3] to-white" },
    { icon: Shield, iconBg: "bg-[#F5E9D3]", iconColor: "text-[#C9A66B]", label: "إجمالي المبالغ في الضمان", value: `${totalEscrow.toLocaleString("ar-SA")} ر.س`, gradient: "from-[#FBF8F3] to-[#F5F0E8]" },
    { icon: FileCheck, iconBg: "bg-green-100", iconColor: "text-green-600", badge: completedMilestones, label: "المراحل المكتملة", sub: "من مراحل المشاريع", value: null, gradient: "from-[#F0FAF0] to-white" },
    { icon: Wallet, iconBg: "bg-[#4A3F35]", iconColor: "text-white", label: "رصيد المحفظة", value: `${Number(client?.wallet_balance || 0).toLocaleString("ar-SA")} ر.س`, gradient: "from-[#FBF8F3] to-[#F5F0E8]" }
  ], [activeProjects, projects.length, totalEscrow, completedMilestones, client?.wallet_balance]);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#F5F0E8]"><Loader2 className="w-12 h-12 animate-spin text-[#C9A66B]" /></div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F5F0E8] via-white to-[#FBF8F3] py-8" dir="rtl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3"><div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#6B5D4F] to-[#C9A66B] flex items-center justify-center shadow-md"><Building2 className="w-7 h-7 text-white" /></div><div><h1 className="text-3xl md:text-4xl font-bold gradient-text mb-1">مركز المستثمر</h1><p className="text-[#8C7256]">إدارة محفظة مشاريعك وتتبع التقدم المالي من لوحة واحدة</p></div></div>
            <Link to={createPageUrl("CreateProject")}><Button className="bg-gradient-to-r from-[#6B5D4F] to-[#C9A66B] text-white hover:opacity-90 shadow-md"><Plus className="w-4 h-4 ml-2" />مشروع جديد</Button></Link>
          </div>
        </motion.div>

        <div className="grid md:grid-cols-4 gap-5 mb-8">{kpiCards.map((card, idx) => { const Icon = card.icon; return <motion.div key={idx} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + idx * 0.05 }}><Card className={`bg-gradient-to-br ${card.gradient} border border-[#E5D4B8] shadow-sm hover:shadow-md transition-shadow`}><CardContent className="pt-6"><div className="flex items-center justify-between mb-4"><div className={`w-14 h-14 ${card.iconBg} rounded-2xl flex items-center justify-center`}><Icon className={`w-7 h-7 ${card.iconColor}`} /></div>{card.badge !== undefined && <Badge className="bg-[#4A3F35] text-white text-lg px-3 py-1">{card.badge}</Badge>}</div><p className="text-sm text-[#8C7256] mb-1">{card.label}</p>{card.value ? <p className="text-2xl font-bold text-[#4A3F35]">{card.value}</p> : <p className="text-lg font-bold text-[#4A3F35]">{card.sub}</p>}</CardContent></Card></motion.div>; })}</div>

        <Tabs defaultValue="projects" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 max-w-3xl bg-[#FBF8F3] border border-[#E5D4B8]">
            <TabsTrigger value="projects"><Building2 className="w-4 h-4 ml-2" />نظرة شاملة</TabsTrigger>
            <TabsTrigger value="payments"><DollarSign className="w-4 h-4 ml-2" />الدفعات ({pendingPayments.length})</TabsTrigger>
            <TabsTrigger value="documents"><FolderOpen className="w-4 h-4 ml-2" />المستندات</TabsTrigger>
            <TabsTrigger value="analytics"><TrendingUp className="w-4 h-4 ml-2" />التحليلات</TabsTrigger>
          </TabsList>

          <TabsContent value="projects"><Card className="border border-[#E5D4B8] shadow-sm"><CardHeader className="border-b border-[#F0E8D8]"><CardTitle className="text-[#4A3F35]">نظرة شاملة على جميع المشاريع</CardTitle></CardHeader><CardContent className="pt-6"><div className="space-y-4">{projects.map(project => { const status = getProjectStatus(project); const c = statusColors[status]; const ms = allMilestones.filter(m => m.project_id === project.id); const completed = ms.filter(m => m.status === "completed").length; const progress = ms.length ? (completed / ms.length) * 100 : Number(project.phase_progress || 0); return <Link key={project.id} to={createPageUrl("ProjectDetails") + `?id=${project.id}`}><motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className={`p-6 rounded-xl border-2 ${c.border} ${c.bg} hover:shadow-md transition-all`}><div className="flex items-start justify-between mb-4"><div className="flex-1"><div className="flex items-center gap-3 mb-2"><div className={`w-4 h-4 rounded-full ${c.dot} shadow-md`} /><h3 className="text-xl font-bold text-[#1a1a2e]">{project.title}</h3></div><div className="flex items-center gap-4 text-sm text-[#6B5D4F]"><span className="flex items-center gap-1"><MapPin className="w-4 h-4" />{project.location || "غير محدد"}</span><span className="flex items-center gap-1"><Calendar className="w-4 h-4" />{project.deadline ? format(new Date(project.deadline), "PPP", { locale: ar }) : "بدون موعد"}</span></div></div><Badge className={`${c.bg} ${c.text} border ${c.border} text-sm px-3 py-1`}>{c.label}</Badge></div><div className="mb-4"><div className="flex items-center justify-between text-sm mb-2"><span className="text-[#8C7256]">التقدم الإجمالي</span><span className="font-semibold text-[#4A3F35]">{Math.round(progress)}%</span></div><Progress value={progress} className="h-2 [&>div]:bg-gradient-to-l [&>div]:from-[#C9A66B] [&>div]:to-[#6B5D4F]" /></div><div className="flex items-center justify-between pt-4 border-t border-[#E5D4B8]"><span className="text-sm text-[#6B5D4F]"><Shield className="w-4 h-4 inline ml-1" />في الضمان: <strong>{Number(project.escrow_amount || 0).toLocaleString("ar-SA")} ر.س</strong></span><Button size="sm" variant="ghost" className="text-[#C9A66B]">عرض التفاصيل ←</Button></div></motion.div></Link>; })}{projects.length === 0 && <div className="text-center py-12"><Building2 className="w-16 h-16 text-[#E5D4B8] mx-auto mb-4" /><p className="text-[#8C7256] mb-4">لا توجد مشاريع بعد</p><Link to={createPageUrl("CreateProject")}><Button className="bg-gradient-to-r from-[#6B5D4F] to-[#C9A66B] text-white"><Plus className="w-4 h-4 ml-2" />أنشئ مشروعك الأول</Button></Link></div>}</div></CardContent></Card></TabsContent>

          <TabsContent value="payments"><Card className="border border-[#E5D4B8] shadow-sm"><CardHeader className="border-b border-[#F0E8D8]"><div className="flex items-center justify-between"><CardTitle className="text-[#4A3F35]">الدفعات القادمة</CardTitle>{selectedPayments.length > 0 && <Button onClick={handleBulkPayment} className="bg-gradient-to-r from-[#6B5D4F] to-[#C9A66B] text-white"><CreditCard className="w-4 h-4 ml-2" />دفع الكل ({selectedPayments.length})</Button>}</div></CardHeader><CardContent className="pt-6">{pendingPayments.length ? <div className="space-y-3">{pendingPayments.map(m => { const selected = selectedPayments.includes(m.id); const days = m.due_date ? differenceInDays(new Date(m.due_date), new Date()) : null; return <div key={m.id} onClick={() => togglePaymentSelection(m.id)} className={`p-5 rounded-xl border-2 cursor-pointer transition-all ${selected ? "border-[#C9A66B] bg-[#FBF8F3] shadow-md" : "border-[#E5D4B8] bg-white hover:border-[#C9A66B]"}`}><div className="flex items-start justify-between"><div className="flex items-start gap-3 flex-1"><div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center ${selected ? "bg-[#6B5D4F] border-[#6B5D4F]" : "bg-white border-[#E5D4B8]"}`}>{selected && <CheckCircle className="w-4 h-4 text-white" />}</div><div><h4 className="font-semibold text-[#1a1a2e] mb-1">{m.title}</h4><p className="text-sm text-[#8C7256] mb-2">{m.project_title}</p>{days !== null && <span className={`flex items-center gap-1 text-xs ${days < 7 ? "text-red-600 font-semibold" : "text-[#6B5D4F]"}`}><Clock className="w-3 h-3" />{days > 0 ? `${days} يوم متبقي` : "متأخر"}</span>}</div></div><div className="text-left"><p className="text-2xl font-bold text-[#4A3F35]">{Number(m.amount || 0).toLocaleString("ar-SA")}</p><p className="text-sm text-[#8C7256]">ر.س</p></div></div></div>; })}{selectedPayments.length > 0 && <div className="bg-gradient-to-l from-[#FBF8F3] to-[#F5F0E8] p-6 rounded-xl border-2 border-[#C9A66B]"><div className="flex items-center justify-between"><div><p className="text-sm text-[#8C7256]">إجمالي المبلغ المحدد</p><p className="text-3xl font-bold text-[#4A3F35]">{selectedTotal.toLocaleString("ar-SA")} ر.س</p></div><Button onClick={handleBulkPayment} size="lg" className="bg-gradient-to-r from-[#6B5D4F] to-[#C9A66B] text-white"><CreditCard className="w-5 h-5 ml-2" />ادفع الآن</Button></div></div>}</div> : <div className="text-center py-12"><CheckCircle className="w-16 h-16 text-green-300 mx-auto mb-4" /><p className="text-[#8C7256]">لا توجد دفعات معلقة</p></div>}</CardContent></Card></TabsContent>

          <TabsContent value="documents"><Card className="border border-[#E5D4B8] shadow-sm"><CardHeader className="border-b border-[#F0E8D8]"><div className="flex items-center justify-between"><CardTitle className="text-[#4A3F35]">مركز المستندات الموحد</CardTitle><div><input ref={fileInputRef} type="file" className="hidden" onChange={handleUploadDocument} /><Button onClick={() => fileInputRef.current?.click()} disabled={uploading} className="bg-gradient-to-r from-[#6B5D4F] to-[#C9A66B] text-white">{uploading ? <Loader2 className="w-4 h-4 ml-2 animate-spin" /> : <Upload className="w-4 h-4 ml-2" />}رفع مستند</Button></div></div></CardHeader><CardContent className="pt-6"><div className="space-y-4">{projects.map(project => { const ms = allMilestones.filter(m => m.project_id === project.id); return <div key={project.id} className="border border-[#E5D4B8] rounded-xl p-5 bg-white"><div className="flex items-start justify-between mb-4"><div className="flex items-center gap-3"><div className="w-12 h-12 bg-[#F5F0E8] rounded-xl flex items-center justify-center"><FolderOpen className="w-6 h-6 text-[#6B5D4F]" /></div><div><h3 className="font-bold text-lg text-[#1a1a2e]">{project.title}</h3><p className="text-sm text-[#8C7256]">{project.location || "غير محدد"} • {ms.length} مرحلة</p></div></div><Link to={createPageUrl("ProjectMilestones") + `?id=${project.id}`}><Button size="sm" variant="outline" className="border-[#C9A66B] text-[#6B5D4F]"><Eye className="w-4 h-4 ml-2" />عرض المستندات</Button></Link></div><div className="grid grid-cols-2 md:grid-cols-4 gap-3">{ms.slice(0, 4).map(m => <div key={m.id} className="bg-[#FBF8F3] p-3 rounded-lg border border-[#F0E8D8]"><p className="text-xs text-[#8C7256] mb-1">المرحلة {m.sequence_no || "-"}</p><p className="text-sm font-medium text-[#4A3F35] truncate">{m.title}</p><Badge className={m.status === "completed" ? "bg-green-100 text-green-700 text-xs mt-2" : "bg-[#E5D4B8] text-[#6B5D4F] text-xs mt-2"}>{m.status || "قيد المتابعة"}</Badge></div>)}</div></div>; })}</div></CardContent></Card></TabsContent>

          <TabsContent value="analytics"><div className="grid md:grid-cols-2 gap-6"><Card className="border border-[#E5D4B8] shadow-sm"><CardHeader className="border-b border-[#F0E8D8]"><CardTitle className="text-[#4A3F35]">ملخص الأداء المالي</CardTitle></CardHeader><CardContent className="pt-6"><div className="space-y-3"><div className="flex items-center justify-between p-4 bg-[#FBF8F3] rounded-lg border border-[#F0E8D8]"><span className="text-sm text-[#6B5D4F]">إجمالي الاستثمار</span><span className="text-xl font-bold text-[#4A3F35]">{totalInvestment.toLocaleString("ar-SA")} ر.س</span></div><div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200"><span className="text-sm text-[#6B5D4F]">المبالغ في الضمان</span><span className="text-xl font-bold text-green-800">{totalEscrow.toLocaleString("ar-SA")} ر.س</span></div><div className="flex items-center justify-between p-4 bg-[#F5F0E8] rounded-lg border border-[#E5D4B8]"><span className="text-sm text-[#6B5D4F]">معدل الإنجاز</span><span className="text-xl font-bold text-[#6B5D4F]">{completionRate}%</span></div></div></CardContent></Card><Card className="border border-[#E5D4B8] shadow-sm"><CardHeader className="border-b border-[#F0E8D8]"><CardTitle className="text-[#4A3F35]">توزيع حالات المشاريع</CardTitle></CardHeader><CardContent className="pt-6"><div className="space-y-4">{Object.entries(statusColors).map(([key, item]) => <div key={key} className="flex items-center justify-between"><div className="flex items-center gap-2"><div className={`w-3 h-3 rounded-full ${item.dot}`} /><span className="text-sm text-[#6B5D4F]">{item.label}</span></div><span className="font-bold text-[#4A3F35]">{projects.filter(p => getProjectStatus(p) === key).length}</span></div>)}</div></CardContent></Card></div><Card className="mt-6 border border-[#E5D4B8] shadow-sm"><CardHeader className="border-b border-[#F0E8D8]"><CardTitle className="text-[#4A3F35]">إجراءات سريعة</CardTitle></CardHeader><CardContent className="pt-6"><div className="grid md:grid-cols-3 gap-4"><Link to={createPageUrl("WalletTopup")}><Button variant="outline" className="w-full justify-start border-[#E5D4B8] text-[#6B5D4F]"><Wallet className="w-4 h-4 ml-2" />شحن المحفظة</Button></Link><Link to={createPageUrl("InvoiceManager")}><Button variant="outline" className="w-full justify-start border-[#E5D4B8] text-[#6B5D4F]"><FileText className="w-4 h-4 ml-2" />إدارة الفواتير</Button></Link><Link to={createPageUrl("Wallet")}><Button variant="outline" className="w-full justify-start border-[#E5D4B8] text-[#6B5D4F]"><Download className="w-4 h-4 ml-2" />كشف حساب</Button></Link></div></CardContent></Card></TabsContent>
        </Tabs>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-8"><Card className="border border-[#E5D4B8] shadow-sm"><CardHeader className="border-b border-[#F0E8D8]"><CardTitle className="text-[#4A3F35]">مواقع المشاريع</CardTitle></CardHeader><CardContent className="pt-6"><div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">{projects.map(project => { const status = getProjectStatus(project); return <div key={project.id} className="flex items-center gap-3 p-4 bg-[#FBF8F3] rounded-lg border border-[#F0E8D8]"><div className="w-10 h-10 bg-[#E5D4B8] rounded-full flex items-center justify-center flex-shrink-0"><MapPin className="w-5 h-5 text-[#6B5D4F]" /></div><div className="flex-1 min-w-0"><p className="font-medium text-[#4A3F35] truncate">{project.title}</p><p className="text-sm text-[#8C7256] truncate">{project.location || "غير محدد"}</p></div><div className={`w-3 h-3 rounded-full flex-shrink-0 ${statusColors[status].dot}`} /></div>; })}</div></CardContent></Card></motion.div>
      </div>
    </div>
  );
}
