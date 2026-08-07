import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import {
  MapPin, Calendar, DollarSign, Clock, Users,
  FileText, MessageSquare, Send, Loader2, CheckCircle,
  Star, Download, Eye, ArrowLeft, Scale, Upload, X, Paperclip,
  Kanban, Cloud, ExternalLink, LayoutDashboard, Files as FilesIcon,
  CreditCard, Activity, Video, CalendarPlus
} from "lucide-react";
import ProposalComparison from "@/components/proposals/ProposalComparison";
import ProjectChatbot from "@/components/chatbot/ProjectChatbot";
import { AdSidebarSection } from "@/components/ads/SmartAdCard";
import { useAds } from "@/hooks/useAds";
import ProjectChat from "@/components/project/ProjectChat";
import MilestoneInvoicePanel from "@/components/invoices/MilestoneInvoicePanel";
import MeetCallButton from "@/components/project/MeetCallButton";
import AppointmentModal from "@/components/appointments/AppointmentModal";
import EscrowTracker from "@/components/escrow/EscrowTracker";
import NextStepCard from "@/components/project/NextStepCard";
import ProjectFilesSection from "@/components/project/ProjectFilesSection";
import ProjectActivityLog from "@/components/project/ProjectActivityLog";
import WorkspaceActivityFeed from "@/components/project/WorkspaceActivityFeed";
import ProjectContractSection from "@/components/project/ProjectContractSection";
import ProjectPaymentsSection from "@/components/project/ProjectPaymentsSection";
import ProjectOverviewTab from "@/components/project/ProjectOverviewTab";
import ProjectTasksTab from "@/components/project/ProjectTasksTab";
import ProjectCalendar from "@/components/project/ProjectCalendar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const TABS = [
  { id: "overview", label: "نظرة عامة", icon: LayoutDashboard },
  { id: "calendar", label: "التقويم", icon: Calendar },
  { id: "files", label: "الملفات", icon: FilesIcon },
  { id: "tasks", label: "المهام والمراحل", icon: Kanban },
  { id: "proposals", label: "العروض", icon: Users },
  { id: "contract", label: "العقود", icon: Scale },
  { id: "payments", label: "المدفوعات", icon: CreditCard },
  { id: "chat", label: "المحادثات", icon: MessageSquare },
  { id: "activity", label: "سجل النشاط", icon: Activity },
];

export default function ProjectDetails() {
  const urlParams = new URLSearchParams(window.location.search);
  const projectId = urlParams.get("id");

  const { ads: sidebarAds } = useAds({ placement: "project_details", tags: [], maxAds: 2 });

  const [project, setProject] = useState(null);
  const [proposals, setProposals] = useState([]);
  const [engineers, setEngineers] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [userEngineer, setUserEngineer] = useState(null);
  const [userClient, setUserClient] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [showProposalForm, setShowProposalForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [proposalData, setProposalData] = useState({ price: "", delivery_days: "", cover_letter: "", attachments: [], portfolio_items: [] });
  const [isUploadingAttachment, setIsUploadingAttachment] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewData, setReviewData] = useState({ rating: 5, quality_rating: 5, communication_rating: 5, delivery_rating: 5, comment: "" });
  const [existingReview, setExistingReview] = useState(null);
  const [isExportingToDrive, setIsExportingToDrive] = useState(false);
  const [driveExportResult, setDriveExportResult] = useState(null);
  const [contracts, setContracts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [selectedProposal, setSelectedProposal] = useState(null);

  useEffect(() => {
    if (projectId) loadData();
  }, [projectId]);

  useEffect(() => {
    if (project?.status === 'completed' && user) checkExistingReview();
  }, [project, user]);

  const loadData = async () => {
    setIsLoading(true);
    const currentUser = await base44.auth.me();
    setUser(currentUser);

    const [projectData, proposalsData, engineersData, userEngData, userClientData, contractsData, transactionsData] = await Promise.all([
      base44.entities.Project.filter({ id: projectId }),
      base44.entities.Proposal.filter({ project_id: projectId }),
      base44.entities.Engineer.filter({ status: "approved" }),
      base44.entities.Engineer.filter({ email: currentUser.email }),
      base44.entities.Client.filter({ email: currentUser.email }),
      base44.entities.Contract.filter({ project_id: projectId }),
      base44.entities.Transaction.filter({ project_id: projectId }),
    ]);

    setProject(projectData[0]);
    setProposals(proposalsData);
    setContracts(contractsData);
    setTransactions(transactionsData);

    const engMap = {};
    engineersData.forEach(eng => { engMap[eng.id] = eng; });
    setEngineers(engMap);

    if (userEngData.length > 0) setUserEngineer(userEngData[0]);
    if (userClientData.length > 0) setUserClient(userClientData[0]);
    setIsLoading(false);
  };

  const checkExistingReview = async () => {
    try {
      const reviews = await base44.entities.Review.filter({ project_id: projectId });
      if (reviews.length > 0) setExistingReview(reviews[0]);
    } catch (error) { console.error("Error checking review:", error); }
  };

  const handleSubmitReview = async () => {
    setIsSubmitting(true);
    try {
      const clientData = await base44.entities.Client.filter({ email: user.email });
      const client = clientData[0];
      await base44.entities.Review.create({
        engineer_id: project.assigned_engineer_id,
        client_id: client?.id,
        project_id: projectId,
        rating: reviewData.rating,
        quality_rating: reviewData.quality_rating,
        communication_rating: reviewData.communication_rating,
        delivery_rating: reviewData.delivery_rating,
        comment: reviewData.comment
      });
      setShowReviewForm(false);
      checkExistingReview();
    } catch (error) { console.error("Error:", error); } finally { setIsSubmitting(false); }
  };

  const handleSubmitProposal = async () => {
    if (!userEngineer) return;
    setIsSubmitting(true);
    await base44.entities.Proposal.create({
      project_id: projectId,
      engineer_id: userEngineer.id,
      price: parseFloat(proposalData.price),
      delivery_days: parseInt(proposalData.delivery_days),
      cover_letter: proposalData.cover_letter,
      attachments: proposalData.attachments,
      portfolio_items: proposalData.portfolio_items,
      status: "pending"
    });
    await base44.entities.Project.update(projectId, { total_proposals: (project.total_proposals || 0) + 1 });
    await base44.entities.Notification.create({
      recipient_email: project.created_by,
      title: "عرض جديد على مشروعك",
      message: `قدم ${userEngineer.full_name} عرضاً جديداً على مشروع "${project.title}" بسعر ${proposalData.price} ريال.`,
      type: "project_update",
      related_project_id: projectId,
      priority: "high"
    });
    setIsSubmitting(false);
    setShowProposalForm(false);
    setProposalData({ price: "", delivery_days: "", cover_letter: "", attachments: [], portfolio_items: [] });
    loadData();
  };

  const handleExportToDrive = async () => {
    setIsExportingToDrive(true);
    setDriveExportResult(null);
    try {
      const response = await base44.functions.invoke("exportProjectFilesToDrive", { project_id: projectId });
      setDriveExportResult(response.data);
    } catch (error) {
      console.error("Error exporting to Drive:", error);
      setDriveExportResult({ error: error.message || "حدث خطأ أثناء التصدير" });
    } finally { setIsExportingToDrive(false); }
  };

  const handleUploadAttachment = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    setIsUploadingAttachment(true);
    const uploadedUrls = [];
    for (const file of files) {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      uploadedUrls.push(file_url);
    }
    setProposalData(prev => ({ ...prev, attachments: [...prev.attachments, ...uploadedUrls] }));
    setIsUploadingAttachment(false);
  };

  const removeAttachment = (index) => {
    setProposalData(prev => ({ ...prev, attachments: prev.attachments.filter((_, i) => i !== index) }));
  };

  const handleAcceptProposal = async (proposal) => {
    setProposals(prev => prev.map(p => p.id === proposal.id ? { ...p, status: "accepted" } : p));
    const engineer = engineers[proposal.engineer_id];
    if (engineer) {
      await base44.entities.Notification.create({
        recipient_email: engineer.email,
        title: "تم قبول عرضك!",
        message: `تهانينا! تم قبول عرضك على مشروع "${project.title}" بقيمة ${proposal.price} ريال.`,
        type: "approval",
        related_project_id: projectId,
        priority: "high"
      });
    }
    await base44.entities.Notification.create({
      recipient_email: user.email,
      title: "✅ تم قبول العرض بنجاح",
      message: `تم قبول عرض ${engineer?.full_name || 'المهندس'} على مشروع "${project.title}".`,
      type: "approval",
      related_project_id: projectId,
      related_entity_id: proposal.id,
      action_url: `/ProjectDetails?id=${projectId}`,
      priority: "high"
    });
    window.location.href = createPageUrl("Payment") + `?project=${projectId}&proposal=${proposal.id}`;
  };

  const handleRejectProposal = async (proposal) => {
    if (!window.confirm("هل أنت متأكد من رفض هذا العرض؟")) return;
    try {
      await base44.entities.Proposal.update(proposal.id, { status: "rejected" });
      setProposals(prev => prev.map(p => p.id === proposal.id ? { ...p, status: "rejected" } : p));
      const engineer = engineers[proposal.engineer_id];
      if (engineer) {
        await base44.entities.Notification.create({
          recipient_email: engineer.email,
          title: "تم رفض عرضك",
          message: `تم رفض عرضك على مشروع "${project.title}".`,
          type: "proposal",
          related_project_id: projectId,
          priority: "medium"
        });
      }
    } catch (error) { console.error("Error rejecting proposal:", error); alert("حدث خطأ أثناء رفض العرض"); }
  };

  const handleCreateContractFromProposal = async (proposal) => {
    if (!window.confirm("هل أنت متأكد من قبول هذا العرض وإنشاء العقد؟")) return;
    try {
      const response = await base44.functions.invoke("createContractFromProposal", { proposal_id: proposal.id });
      if (response.data.success) {
        alert("تم قبول العرض وإنشاء العقد بنجاح!");
        setProposals(prev => prev.map(p => p.id === proposal.id ? { ...p, status: "accepted" } : p));
        loadData();
        setTimeout(() => { window.location.href = createPageUrl("MyContracts"); }, 1500);
      }
    } catch (error) { console.error("Error creating contract:", error); alert("حدث خطأ أثناء إنشاء العقد."); }
  };

  const categories = { interior: "تصميم داخلي", architecture: "تصميم معماري", painting: "رسم هندسي", landscape: "تنسيق حدائق", furniture: "تصميم أثاث", lighting: "تصميم إضاءة" };
  const statusColors = { open: "bg-green-100 text-green-700", in_progress: "bg-blue-100 text-blue-700", completed: "bg-slate-100 text-slate-700", cancelled: "bg-red-100 text-red-700" };
  const statusLabels = { open: "مفتوح للعروض", in_progress: "قيد التنفيذ", completed: "مكتمل", cancelled: "ملغي" };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#C9A66B]"></div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-700 mb-4">لم يتم العثور على المشروع</h2>
          <Link to={createPageUrl("Projects")}><Button>العودة للمشاريع</Button></Link>
        </div>
      </div>
    );
  }

  const isClient = project.created_by === user.email;
  const isEngineer = userEngineer && project.assigned_engineer_id === userEngineer.id;
  const hasSubmittedProposal = userEngineer && proposals.some(p => p.engineer_id === userEngineer.id);
  const canExportDrive = user && (isClient || isEngineer || user.role === 'admin');

  const switchTab = (tabId) => {
    setActiveTab(tabId);
    setTimeout(() => {
      const el = document.getElementById(`tab-${tabId}`);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  };

  const assignedEngineer = engineers[project.assigned_engineer_id];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-amber-50/30 py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
            <div className="flex-1">
              <Link to={createPageUrl("Projects")} className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-[#C9A66B] mb-2">
                <ArrowLeft className="w-4 h-4" /> المشاريع
              </Link>
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <Badge className={statusColors[project.status]}>{statusLabels[project.status]}</Badge>
                <Badge variant="secondary">{categories[project.category] || project.category}</Badge>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-[#1a1a2e]">{project.title}</h1>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Submit Proposal Button (engineer) */}
              {userEngineer && project.status === "open" && !hasSubmittedProposal && (
                <Dialog open={showProposalForm} onOpenChange={setShowProposalForm}>
                  <DialogTrigger asChild>
                    <Button className="bg-gradient-to-r from-[#1a1a2e] to-[#C9A66B] text-white gap-2">
                      <Send className="w-4 h-4" /> تقديم عرض
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader><DialogTitle>تقديم عرض على المشروع</DialogTitle></DialogHeader>
                    <div className="space-y-4 mt-4">
                      <div className="space-y-2">
                        <Label htmlFor="price">السعر المقترح (ر.س)</Label>
                        <Input id="price" type="number" value={proposalData.price} onChange={(e) => setProposalData(prev => ({ ...prev, price: e.target.value }))} placeholder="أدخل السعر" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="delivery_days">مدة التسليم (بالأيام)</Label>
                        <Input id="delivery_days" type="number" value={proposalData.delivery_days} onChange={(e) => setProposalData(prev => ({ ...prev, delivery_days: e.target.value }))} placeholder="عدد الأيام" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="cover_letter">رسالة العرض</Label>
                        <Textarea id="cover_letter" value={proposalData.cover_letter} onChange={(e) => setProposalData(prev => ({ ...prev, cover_letter: e.target.value }))} placeholder="اشرح لماذا أنت الأنسب لهذا المشروع..." rows={4} />
                      </div>
                      <div className="space-y-2">
                        <Label>المرفقات (معرض أعمال، مستندات)</Label>
                        <div className="border-2 border-dashed rounded-xl p-4 text-center hover:border-[#C9A66B] transition-colors">
                          <input type="file" multiple onChange={handleUploadAttachment} className="hidden" id="proposal-attachments" accept="image/*,.pdf,.dwg" />
                          <label htmlFor="proposal-attachments" className="cursor-pointer">
                            {isUploadingAttachment ? (
                              <Loader2 className="w-8 h-8 text-slate-400 mx-auto animate-spin" />
                            ) : (
                              <>
                                <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                                <p className="text-sm text-slate-500">أضف ملفات توضيحية</p>
                              </>
                            )}
                          </label>
                        </div>
                        {proposalData.attachments.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {proposalData.attachments.map((url, index) => (
                              <div key={index} className="relative group">
                                <div className="w-16 h-16 rounded-lg overflow-hidden bg-slate-100">
                                  {url.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                                    <img src={url} alt="" className="w-full h-full object-cover" />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center"><FileText className="w-6 h-6 text-slate-400" /></div>
                                  )}
                                </div>
                                <button type="button" onClick={() => removeAttachment(index)} className="absolute -top-2 -left-2 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <Button onClick={handleSubmitProposal} disabled={isSubmitting || !proposalData.price || !proposalData.delivery_days} className="w-full bg-gradient-to-r from-[#1a1a2e] to-[#C9A66B] text-white">
                        {isSubmitting ? (<><Loader2 className="w-5 h-5 animate-spin ml-2" /> جاري الإرسال...</>) : "إرسال العرض"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}

              {hasSubmittedProposal && (
                <Badge className="bg-green-100 text-green-700 py-2 px-4">
                  <CheckCircle className="w-4 h-4 ml-2" /> تم تقديم عرضك
                </Badge>
              )}

              {/* Review Button */}
              {project.status === 'completed' && isClient && !existingReview && (
                <Dialog open={showReviewForm} onOpenChange={setShowReviewForm}>
                  <DialogTrigger asChild>
                    <Button className="bg-gradient-to-r from-amber-500 to-amber-600 text-white gap-2">
                      <Star className="w-5 h-5" /> قيّم المشروع
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader><DialogTitle>قيّم تجربتك مع المهندس</DialogTitle></DialogHeader>
                    <div className="space-y-4 mt-4">
                      <div className="space-y-2">
                        <Label>التقييم العام</Label>
                        <div className="flex gap-2 justify-center">
                          {[1, 2, 3, 4, 5].map(star => (
                            <button key={star} type="button" onClick={() => setReviewData(prev => ({ ...prev, rating: star }))} className="transition-transform hover:scale-110">
                              <Star className={`w-8 h-8 ${star <= reviewData.rating ? "fill-amber-400 text-amber-400" : "text-slate-300"}`} />
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <Label className="text-xs">الجودة</Label>
                          <Input type="number" min="1" max="5" value={reviewData.quality_rating} onChange={(e) => setReviewData(prev => ({ ...prev, quality_rating: parseInt(e.target.value) }))} />
                        </div>
                        <div>
                          <Label className="text-xs">التواصل</Label>
                          <Input type="number" min="1" max="5" value={reviewData.communication_rating} onChange={(e) => setReviewData(prev => ({ ...prev, communication_rating: parseInt(e.target.value) }))} />
                        </div>
                        <div>
                          <Label className="text-xs">التسليم</Label>
                          <Input type="number" min="1" max="5" value={reviewData.delivery_rating} onChange={(e) => setReviewData(prev => ({ ...prev, delivery_rating: parseInt(e.target.value) }))} />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>تعليقك</Label>
                        <Textarea value={reviewData.comment} onChange={(e) => setReviewData(prev => ({ ...prev, comment: e.target.value }))} placeholder="شاركنا تجربتك..." rows={4} />
                      </div>
                      <Button onClick={handleSubmitReview} disabled={isSubmitting} className="w-full bg-gradient-to-r from-amber-500 to-amber-600 text-white">
                        {isSubmitting ? (<><Loader2 className="w-5 h-5 animate-spin ml-2" /> جاري الإرسال...</>) : "إرسال التقييم"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}

              {existingReview && (
                <Badge className="bg-amber-100 text-amber-700 py-2 px-4">
                  <Star className="w-4 h-4 ml-2 fill-amber-600" /> تم التقييم ({existingReview.rating}/5)
                </Badge>
              )}
            </div>
          </div>

          {/* Next Step Card */}
          <div className="mb-6">
            <NextStepCard
              project={project}
              proposals={proposals}
              contracts={contracts}
              transactions={transactions}
              user={user}
              userEngineer={userEngineer}
              onScrollToProposals={() => switchTab("proposals")}
              onScrollToContract={() => switchTab("contract")}
              onScrollToPayments={() => switchTab("payments")}
            />
          </div>

          {/* Tab Navigation */}
          <div className="mb-6 sticky top-16 z-30 bg-background/80 backdrop-blur-md rounded-xl border border-slate-100 shadow-sm p-1.5 overflow-x-auto">
            <div className="flex gap-1 min-w-max">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => switchTab(tab.id)}
                    className={`flex items-center gap-2 px-3 md:px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                      isActive
                        ? "bg-gradient-to-r from-[#6B5D4F] to-[#C9A66B] text-white shadow-md"
                        : "text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="hidden sm:inline">{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tab Content */}
          <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
            {/* Overview Tab */}
            {activeTab === "overview" && (
              <div id="tab-overview">
                <ProjectOverviewTab
                  project={project}
                  proposals={proposals}
                  contracts={contracts}
                  transactions={transactions}
                  engineers={engineers}
                  user={user}
                  userEngineer={userEngineer}
                  userClient={userClient}
                  isClient={isClient}
                  isEngineer={isEngineer}
                  onScrollToProposals={() => switchTab("proposals")}
                  onScrollToContract={() => switchTab("contract")}
                  onScrollToPayments={() => switchTab("payments")}
                  onScrollToFiles={() => switchTab("files")}
                  onScrollToChat={() => switchTab("chat")}
                />

                {/* Escrow + Meet + Appointments in overview */}
                <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {(project.escrow_status && project.escrow_status !== 'none') || project.status === 'in_progress' ? (
                    <EscrowTracker
                      project={project}
                      proposalId={proposals.find(p => p.status === 'accepted')?.id}
                      isClient={isClient}
                      isEngineer={isEngineer}
                      onUpdate={loadData}
                    />
                  ) : null}

                  {project?.status === "in_progress" && isClient && (
                    <MeetCallButton project={project} currentUser={user} />
                  )}

                  {project?.status === "in_progress" && project.assigned_engineer_id && (() => {
                    const target = isClient
                      ? { id: assignedEngineer?.id, name: assignedEngineer?.full_name, email: assignedEngineer?.email, type: "engineer" }
                      : isEngineer
                        ? { id: userClient?.id || project.client_id, name: userClient?.full_name || project.created_by, email: project.created_by, type: "engineer" }
                        : null;
                    if (!target || !target.email) return null;
                    return (
                      <Card className="border-0 shadow-lg">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                              <CalendarPlus className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-[#1a1a2e] text-sm">اجتماع مراجعة المخططات</h4>
                              <p className="text-xs text-slate-500">احجز موعداً مع {target.name}</p>
                            </div>
                          </div>
                          <AppointmentModal
                            targetId={target.id}
                            targetName={target.name}
                            targetType={target.type}
                            targetEmail={target.email}
                            trigger={
                              <Button className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white gap-2">
                                <Calendar className="w-4 h-4" /> حجز موعد مراجعة
                              </Button>
                            }
                          />
                        </CardContent>
                      </Card>
                    );
                  })()}
                </div>
              </div>
            )}

            {/* Calendar Tab */}
            {activeTab === "calendar" && (
              <div id="tab-calendar">
                <ProjectCalendar
                  project={project}
                  user={user}
                  userEngineer={userEngineer}
                  engineers={engineers}
                  isClient={isClient}
                  isEngineer={isEngineer}
                  onNavigate={switchTab}
                />
              </div>
            )}

            {/* Files Tab */}
            {activeTab === "files" && (
              <div id="tab-files" className="space-y-6">
                <ProjectFilesSection project={project} user={user} userEngineer={userEngineer} onUpdated={loadData} />
                {canExportDrive && (
                  <Card className="border-0 shadow-lg">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Cloud className="w-5 h-5 text-[#C9A66B]" />
                        أرشفة الملفات على Google Drive
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-sm text-slate-600 leading-relaxed">
                        صدّر جميع مرفقات المشروع والمخططات إلى مجلد مشترك على Google Drive.
                      </p>
                      <Button onClick={handleExportToDrive} disabled={isExportingToDrive} className="w-full bg-gradient-to-r from-[#6B5D4F] to-[#C9A66B] text-white gap-2">
                        {isExportingToDrive ? (<><Loader2 className="w-5 h-5 animate-spin" /> جاري التصدير...</>) : (<><Cloud className="w-5 h-5" /> تصدير إلى Google Drive</>)}
                      </Button>
                      {driveExportResult?.error && (
                        <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">{driveExportResult.error}</div>
                      )}
                      {driveExportResult?.success === true && (
                        <div className="rounded-lg bg-green-50 border border-green-200 p-4 space-y-2">
                          <div className="flex items-center gap-2 text-green-700 font-medium">
                            <CheckCircle className="w-5 h-5" />
                            تم تصدير {driveExportResult.uploaded_count} ملف بنجاح
                          </div>
                          <a href={driveExportResult.folder_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-[#C9A66B] hover:underline text-sm font-medium">
                            <ExternalLink className="w-4 h-4" /> فتح مجلد المشروع على Google Drive
                          </a>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* Tasks & Milestones Tab */}
            {activeTab === "tasks" && (
              <div id="tab-tasks" className="space-y-6">
                {/* Inline interactive task management */}
                <ProjectTasksTab project={project} user={user} userEngineer={userEngineer} engineers={engineers} />

                {/* Quick links to external tools */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {project.status === "in_progress" && (
                    <Link to={createPageUrl("ProjectKanban") + `?id=${project.id}`}>
                      <Card className="border-0 shadow-md hover:shadow-lg transition-shadow cursor-pointer h-full">
                        <CardContent className="p-4 flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
                            <Kanban className="w-5 h-5 text-purple-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-[#1a1a2e] text-sm">لوحة Kanban</h3>
                            <p className="text-xs text-slate-500">عرض جميع المهام بشكل بصري</p>
                          </div>
                          <ArrowLeft className="w-4 h-4 text-slate-300" />
                        </CardContent>
                      </Card>
                    </Link>
                  )}
                  <Link to={createPageUrl("ProjectMilestones") + `?id=${project.id}`}>
                    <Card className="border-0 shadow-md hover:shadow-lg transition-shadow cursor-pointer h-full">
                      <CardContent className="p-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
                          <Calendar className="w-5 h-5 text-green-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-[#1a1a2e] text-sm">مراحل المشروع</h3>
                          <p className="text-xs text-slate-500">إدارة مراحل التنفيذ والدفعات</p>
                        </div>
                        <ArrowLeft className="w-4 h-4 text-slate-300" />
                      </CardContent>
                    </Card>
                  </Link>
                </div>

                {(project.status === "in_progress" || project.status === "completed") && (
                  <MilestoneInvoicePanel projectId={projectId} isClient={isClient} />
                )}
              </div>
            )}

            {/* Proposals Tab */}
            {activeTab === "proposals" && (
              <div id="tab-proposals">
                <Card className="border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>العروض المقدمة</span>
                      <div className="flex items-center gap-2">
                        {proposals.length >= 2 && isClient && (
                          <Badge className="bg-[#C9A66B]/10 text-[#C9A66B]">مقارنة متاحة</Badge>
                        )}
                        <Badge variant="secondary">{proposals.length} عرض</Badge>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {proposals.length >= 2 && isClient && (
                      <>
                        <ProposalComparison
                          proposals={proposals}
                          engineers={engineers}
                          projectBudgetMin={project.budget_min}
                          projectBudgetMax={project.budget_max}
                          onAccept={handleAcceptProposal}
                          isClient={isClient}
                          projectStatus={project.status}
                        />
                        <div className="my-5 border-t border-slate-100" />
                      </>
                    )}
                    {proposals.length > 0 ? (
                      <div className="space-y-4">
                        {proposals.map((proposal) => {
                          const engineer = engineers[proposal.engineer_id];
                          return (
                            <div key={proposal.id} className={`p-4 rounded-xl border ${proposal.status === "accepted" ? "border-green-200 bg-green-50" : proposal.status === "rejected" ? "border-red-200 bg-red-50" : "border-slate-200 bg-white"}`}>
                              <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                  <Avatar className="w-12 h-12">
                                    <AvatarImage src={engineer?.profile_image} />
                                    <AvatarFallback className="bg-gradient-to-br from-[#1a1a2e] to-[#C9A66B] text-white">{engineer?.full_name?.charAt(0)}</AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <Link to={createPageUrl("EngineerProfile") + `?id=${proposal.engineer_id}`} className="font-semibold text-[#1a1a2e] hover:text-[#C9A66B]">{engineer?.full_name}</Link>
                                    <p className="text-sm text-slate-500">{engineer?.specialization}</p>
                                    <div className="flex items-center gap-1 mt-1">
                                      <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                                      <span className="text-sm">{engineer?.rating?.toFixed(1) || "0.0"}</span>
                                    </div>
                                  </div>
                                </div>
                                <div className="text-left">
                                  <p className="text-xl font-bold text-[#1a1a2e]">{proposal.price?.toLocaleString()} ر.س</p>
                                  <p className="text-sm text-slate-500">{proposal.delivery_days} يوم</p>
                                </div>
                              </div>
                              {proposal.cover_letter && <p className="mt-3 text-slate-600 text-sm">{proposal.cover_letter}</p>}
                              {proposal.attachments?.length > 0 && (
                                <div className="mt-3">
                                  <p className="text-xs text-slate-500 mb-2 flex items-center gap-1"><Paperclip className="w-3 h-3" /> المرفقات ({proposal.attachments.length})</p>
                                  <div className="flex flex-wrap gap-2">
                                    {proposal.attachments.map((url, idx) => (
                                      <a key={idx} href={url} target="_blank" rel="noopener noreferrer" className="w-12 h-12 rounded-lg overflow-hidden bg-slate-100 hover:ring-2 hover:ring-[#C9A66B] transition-all">
                                        {url.match(/\.(jpg|jpeg|png|gif)$/i) ? <img src={url} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><FileText className="w-5 h-5 text-slate-400" /></div>}
                                      </a>
                                    ))}
                                  </div>
                                </div>
                              )}
                              <div className="flex items-center justify-between mt-4">
                                <Badge className={proposal.status === "accepted" ? "bg-green-100 text-green-700" : proposal.status === "rejected" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}>
                                  {proposal.status === "accepted" ? "مقبول" : proposal.status === "rejected" ? "مرفوض" : "قيد المراجعة"}
                                </Badge>
                                <div className="flex gap-2 flex-wrap">
                                  <Button variant="outline" size="sm" onClick={() => setSelectedProposal(proposal)}>
                                    <Eye className="w-4 h-4 ml-1" /> تفاصيل
                                  </Button>
                                  <Link to={createPageUrl("Messages") + `?engineer=${proposal.engineer_id}&project=${project.id}`}>
                                    <Button variant="outline" size="sm"><MessageSquare className="w-4 h-4 ml-1" /> مراسلة</Button>
                                  </Link>
                                  {isClient && engineer?.email && (
                                    <AppointmentModal
                                      targetId={engineer.id}
                                      targetName={engineer.full_name}
                                      targetType="engineer"
                                      targetEmail={engineer.email}
                                      trigger={
                                        <Button variant="outline" size="sm"><Video className="w-4 h-4 ml-1" /> اجتماع</Button>
                                      }
                                    />
                                  )}
                                  {project.status === "open" && proposal.status === "pending" && isClient && (
                                    <>
                                      <Button size="sm" onClick={() => handleCreateContractFromProposal(proposal)} disabled={isSubmitting} className="bg-gradient-to-r from-[#6B5D4F] to-[#C9A66B] text-white">
                                        <Scale className="w-4 h-4 ml-1" /> قبول وإنشاء عقد
                                      </Button>
                                      <Button size="sm" onClick={() => handleAcceptProposal(proposal)} disabled={isSubmitting} className="bg-green-600 hover:bg-green-700">
                                        <CheckCircle className="w-4 h-4 ml-1" /> قبول
                                      </Button>
                                      <Button size="sm" variant="outline" onClick={() => handleRejectProposal(proposal)} className="border-red-200 text-red-600 hover:bg-red-50">
                                        <X className="w-4 h-4 ml-1" /> رفض
                                      </Button>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                        <p className="text-slate-500 font-medium">لا توجد عروض حتى الآن</p>
                        <p className="text-slate-400 text-sm mt-1">
                          {isClient ? "سيصلك إشعار فور وصول أول عرض من المهندسين" : "كن أول من يقدم عرضاً على هذا المشروع"}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Proposal Details Dialog */}
                <Dialog open={!!selectedProposal} onOpenChange={() => setSelectedProposal(null)}>
                  <DialogContent className="max-w-lg">
                    <DialogHeader><DialogTitle>تفاصيل العرض</DialogTitle></DialogHeader>
                    {selectedProposal && (() => {
                      const eng = engineers[selectedProposal.engineer_id];
                      return (
                        <div className="space-y-4 mt-2">
                          <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                            <Avatar className="w-14 h-14">
                              <AvatarImage src={eng?.profile_image} />
                              <AvatarFallback className="bg-gradient-to-br from-[#1a1a2e] to-[#C9A66B] text-white text-lg">{eng?.full_name?.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <Link to={createPageUrl("EngineerProfile") + `?id=${selectedProposal.engineer_id}`} className="font-bold text-[#1a1a2e] hover:text-[#C9A66B] text-lg">{eng?.full_name}</Link>
                              <p className="text-sm text-slate-500">{eng?.specialization}</p>
                              <div className="flex items-center gap-1 mt-1">
                                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                                <span className="text-sm">{eng?.rating?.toFixed(1) || "0.0"}</span>
                                <span className="text-xs text-slate-400">({eng?.total_reviews || 0} تقييم)</span>
                              </div>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="p-3 rounded-lg bg-slate-50">
                              <p className="text-xs text-slate-500">السعر المقترح</p>
                              <p className="text-lg font-bold text-[#1a1a2e]">{selectedProposal.price?.toLocaleString()} ر.س</p>
                            </div>
                            <div className="p-3 rounded-lg bg-slate-50">
                              <p className="text-xs text-slate-500">مدة التسليم</p>
                              <p className="text-lg font-bold text-[#1a1a2e]">{selectedProposal.delivery_days} يوم</p>
                            </div>
                          </div>
                          {selectedProposal.cover_letter && (
                            <div>
                              <p className="text-sm font-medium text-slate-700 mb-1">رسالة العرض</p>
                              <p className="text-sm text-slate-600 whitespace-pre-wrap p-3 rounded-lg bg-slate-50 leading-relaxed">{selectedProposal.cover_letter}</p>
                            </div>
                          )}
                          {selectedProposal.attachments?.length > 0 && (
                            <div>
                              <p className="text-sm font-medium text-slate-700 mb-2">المرفقات ({selectedProposal.attachments.length})</p>
                              <div className="flex flex-wrap gap-2">
                                {selectedProposal.attachments.map((url, idx) => (
                                  <a key={idx} href={url} target="_blank" rel="noopener noreferrer" className="w-14 h-14 rounded-lg overflow-hidden bg-slate-100 hover:ring-2 hover:ring-[#C9A66B]">
                                    {url.match(/\.(jpg|jpeg|png|gif)$/i) ? <img src={url} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><FileText className="w-5 h-5 text-slate-400" /></div>}
                                  </a>
                                ))}
                              </div>
                            </div>
                          )}
                          <div className="flex gap-2 pt-2 flex-wrap">
                            <Link to={createPageUrl("Messages") + `?engineer=${selectedProposal.engineer_id}&project=${project.id}`} className="flex-1">
                              <Button variant="outline" className="w-full gap-2"><MessageSquare className="w-4 h-4" /> مراسلة المهندس</Button>
                            </Link>
                            {isClient && eng?.email && (
                              <AppointmentModal
                                targetId={eng.id}
                                targetName={eng.full_name}
                                targetType="engineer"
                                targetEmail={eng.email}
                                trigger={
                                  <Button variant="outline" className="flex-1 gap-2"><Video className="w-4 h-4" /> اجتماع</Button>
                                }
                              />
                            )}
                            {project.status === "open" && selectedProposal.status === "pending" && isClient && (
                              <>
                                <Button onClick={() => { handleCreateContractFromProposal(selectedProposal); setSelectedProposal(null); }} className="flex-1 bg-gradient-to-r from-[#6B5D4F] to-[#C9A66B] text-white gap-2">
                                  <Scale className="w-4 h-4" /> قبول وإنشاء عقد
                                </Button>
                                <Button onClick={() => { handleRejectProposal(selectedProposal); setSelectedProposal(null); }} variant="outline" className="flex-1 border-red-200 text-red-600 hover:bg-red-50 gap-2">
                                  <X className="w-4 h-4" /> رفض العرض
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })()}
                  </DialogContent>
                </Dialog>
              </div>
            )}

            {/* Contract Tab */}
            {activeTab === "contract" && (
              <div id="tab-contract" className="space-y-6">
                <ProjectContractSection project={project} contracts={contracts} user={user} userEngineer={userEngineer} userClient={userClient} onUpdated={loadData} />
              </div>
            )}

            {/* Payments Tab */}
            {activeTab === "payments" && (
              <div id="tab-payments" className="space-y-6">
                <ProjectPaymentsSection project={project} transactions={transactions} user={user} userEngineer={userEngineer} onUpdated={loadData} />
                {(project.status === "in_progress" || project.status === "completed") && (
                  <MilestoneInvoicePanel projectId={projectId} isClient={isClient} />
                )}
              </div>
            )}

            {/* Chat Tab */}
            {activeTab === "chat" && (
              <div id="tab-chat" className="space-y-6">
                {(project.status === "in_progress" || project.assigned_engineer_id) && user && (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="w-5 h-5 text-[#C9A66B]" />
                        <h2 className="text-lg font-bold text-[#1a1a2e]">قناة التواصل المباشر</h2>
                      </div>
                      <Link to={createPageUrl("Messages") + `?project=${project.id}`}>
                        <Button className="bg-gradient-to-r from-[#6B5D4F] to-[#C9A66B] text-white gap-2">
                          <MessageSquare className="w-4 h-4" /> المحادثات الكاملة
                        </Button>
                      </Link>
                    </div>
                    <ProjectChat projectId={projectId} project={project} currentUser={user} engineerName={assignedEngineer?.full_name} />
                  </div>
                )}

                {(project.status === "open" || !project.assigned_engineer_id) && user && (
                  <Card className="border-0 shadow-lg">
                    <CardContent className="p-6 text-center">
                      <MessageSquare className="w-10 h-10 text-[#C9A66B] mx-auto mb-3" />
                      <h3 className="font-semibold text-[#1a1a2e] mb-1">قناة التواصل المباشر</h3>
                      <p className="text-sm text-slate-500 mb-4">ابدأ محادثة مع المهندسين لتوضيح تفاصيل المشروع</p>
                      <Link to={createPageUrl("Messages") + `?project=${project.id}`}>
                        <Button className="bg-gradient-to-r from-[#6B5D4F] to-[#C9A66B] text-white gap-2">
                          <MessageSquare className="w-4 h-4" /> ابدأ محادثة
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                )}

                {/* Google Meet + Appointments */}
                {project?.status === "in_progress" && isClient && (
                  <MeetCallButton project={project} currentUser={user} />
                )}

                {project?.status === "in_progress" && project.assigned_engineer_id && (() => {
                  const target = isClient
                    ? { id: assignedEngineer?.id, name: assignedEngineer?.full_name, email: assignedEngineer?.email, type: "engineer" }
                    : isEngineer
                      ? { id: userClient?.id || project.client_id, name: userClient?.full_name || project.created_by, email: project.created_by, type: "engineer" }
                      : null;
                  if (!target || !target.email) return null;
                  return (
                    <Card className="border-0 shadow-lg">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                            <Video className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-[#1a1a2e] text-sm">اجتماع مراجعة المخططات</h4>
                            <p className="text-xs text-slate-500">احجز موعداً مع {target.name} — يُحفظ في تقويم جوجل</p>
                          </div>
                        </div>
                        <AppointmentModal
                          targetId={target.id}
                          targetName={target.name}
                          targetType={target.type}
                          targetEmail={target.email}
                          trigger={
                            <Button className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white gap-2">
                              <CalendarPlus className="w-4 h-4" /> حجز موعد مراجعة
                            </Button>
                          }
                        />
                      </CardContent>
                    </Card>
                  );
                })()}
              </div>
            )}

            {/* Activity Tab */}
            {activeTab === "activity" && (
              <div id="tab-activity" className="space-y-6">
                <WorkspaceActivityFeed
                  project={project}
                  proposals={proposals}
                  contracts={contracts}
                  transactions={transactions}
                  engineers={engineers}
                  user={user}
                  isClient={isClient}
                  isEngineer={isEngineer}
                />
              </div>
            )}
          </motion.div>

          {/* AI Project Chatbot */}
          {user && (
            <div className="mt-8 mb-2 flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-500">تحليل ذكي للمشروع:</span>
              </div>
              <ProjectChatbot projectId={projectId} projectTitle={project.title} />
            </div>
          )}

          {/* Sidebar Ads */}
          <div className="mt-8">
            <AdSidebarSection ads={sidebarAds} />
          </div>
        </motion.div>
      </div>
    </div>
  );
}