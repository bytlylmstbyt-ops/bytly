import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { 
  MapPin, Calendar, DollarSign, Clock, Users, 
  FileText, MessageSquare, Send, Loader2, CheckCircle,
  Star, Download, Eye, ArrowLeft, Scale, Upload, X, Paperclip, Kanban,
  Cloud, ExternalLink
} from "lucide-react";
import ContractGenerator from "@/components/contracts/ContractGenerator";
import SignedContractsPanel from "@/components/contracts/SignedContractsPanel";
import ProposalComparison from "@/components/proposals/ProposalComparison";
import ProjectChatbot from "@/components/chatbot/ProjectChatbot";
import { AdSidebarSection } from "@/components/ads/SmartAdCard";
import { useAds } from "@/hooks/useAds";
import ProjectChat from "@/components/project/ProjectChat";
import MilestoneInvoicePanel from "@/components/invoices/MilestoneInvoicePanel";
import MeetCallButton from "@/components/project/MeetCallButton";
import AppointmentModal from "@/components/appointments/AppointmentModal";
import EscrowTracker from "@/components/escrow/EscrowTracker";
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
  const [showProposalForm, setShowProposalForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [proposalData, setProposalData] = useState({
    price: "",
    delivery_days: "",
    cover_letter: "",
    attachments: [],
    portfolio_items: []
  });
  const [isUploadingAttachment, setIsUploadingAttachment] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewData, setReviewData] = useState({
    rating: 5,
    quality_rating: 5,
    communication_rating: 5,
    delivery_rating: 5,
    comment: ""
  });
  const [existingReview, setExistingReview] = useState(null);
  const [isExportingToDrive, setIsExportingToDrive] = useState(false);
  const [driveExportResult, setDriveExportResult] = useState(null);

  useEffect(() => {
    if (projectId) {
      loadData();
    }
  }, [projectId]);

  useEffect(() => {
    if (project?.status === 'completed' && user) {
      checkExistingReview();
    }
  }, [project, user]);

  const loadData = async () => {
    setIsLoading(true);
    
    const currentUser = await base44.auth.me();
    setUser(currentUser);

    const [projectData, proposalsData, engineersData, userEngData, userClientData] = await Promise.all([
      base44.entities.Project.filter({ id: projectId }),
      base44.entities.Proposal.filter({ project_id: projectId }),
      base44.entities.Engineer.filter({ status: "approved" }),
      base44.entities.Engineer.filter({ email: currentUser.email }),
      base44.entities.Client.filter({ email: currentUser.email })
    ]);

    setProject(projectData[0]);
    setProposals(proposalsData);
    
    const engMap = {};
    engineersData.forEach(eng => {
      engMap[eng.id] = eng;
    });
    setEngineers(engMap);

    if (userEngData.length > 0) {
      setUserEngineer(userEngData[0]);
    }
    if (userClientData.length > 0) {
      setUserClient(userClientData[0]);
    }

    setIsLoading(false);
  };

  const checkExistingReview = async () => {
    try {
      const reviews = await base44.entities.Review.filter({ project_id: projectId });
      if (reviews.length > 0) {
        setExistingReview(reviews[0]);
      }
    } catch (error) {
      console.error("Error checking review:", error);
    }
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
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsSubmitting(false);
    }
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

    // Update project proposals count
    await base44.entities.Project.update(projectId, {
      total_proposals: (project.total_proposals || 0) + 1
    });

    // Notify client about new proposal
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
    } finally {
      setIsExportingToDrive(false);
    }
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
    
    setProposalData(prev => ({
      ...prev,
      attachments: [...prev.attachments, ...uploadedUrls]
    }));
    setIsUploadingAttachment(false);
  };

  const removeAttachment = (index) => {
    setProposalData(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index)
    }));
  };

  const handleAcceptProposal = async (proposal) => {
    // Optimistic update — mark proposal as accepted instantly
    setProposals(prev => prev.map(p =>
      p.id === proposal.id ? { ...p, status: "accepted" } : p
    ));

    const engineer = engineers[proposal.engineer_id];
    if (engineer) {
      await base44.entities.Notification.create({
        recipient_email: engineer.email,
        title: "تم قبول عرضك!",
        message: `تهانينا! تم قبول عرضك على مشروع "${project.title}" بقيمة ${proposal.price} ريال. سيتم التواصل معك قريباً.`,
        type: "approval",
        related_project_id: projectId,
        priority: "high"
      });
    }

    // Notify project owner (confirmation) — instant in-platform alert
    await base44.entities.Notification.create({
      recipient_email: user.email,
      title: "✅ تم قبول العرض بنجاح",
      message: `تم قبول عرض ${engineer?.full_name || 'المهندس'} على مشروع "${project.title}" بقيمة ${proposal.price} ريال. سيتم توجيهك لإتمام الدفع.`,
      type: "approval",
      related_project_id: projectId,
      related_entity_id: proposal.id,
      action_url: `/ProjectDetails?id=${projectId}`,
      priority: "high"
    });

    // Redirect to payment page
    window.location.href = createPageUrl("Payment") + `?project=${projectId}&proposal=${proposal.id}`;
  };

  const handleCreateContractFromProposal = async (proposal) => {
    if (!window.confirm("هل أنت متأكد من قبول هذا العرض وإنشاء العقد؟")) return;

    try {
      const response = await base44.functions.invoke("createContractFromProposal", {
        proposal_id: proposal.id
      });

      if (response.data.success) {
        alert("تم قبول العرض وإنشاء العقد بنجاح! سيتم توجيهك لصفحة العقود للتوقيع.");
        // Update local state
        setProposals(prev => prev.map(p =>
          p.id === proposal.id ? { ...p, status: "accepted" } : p
        ));
        // Refresh data
        loadData();
        // Redirect to contracts page
        setTimeout(() => {
          window.location.href = createPageUrl("MyContracts");
        }, 1500);
      }
    } catch (error) {
      console.error("Error creating contract:", error);
      alert("حدث خطأ أثناء إنشاء العقد. يرجى المحاولة مرة أخرى.");
    }
  };

  const categories = {
    interior: "تصميم داخلي",
    architecture: "تصميم معماري",
    painting: "رسم هندسي",
    landscape: "تنسيق حدائق",
    furniture: "تصميم أثاث",
    lighting: "تصميم إضاءة"
  };

  const statusColors = {
    open: "bg-green-100 text-green-700",
    in_progress: "bg-blue-100 text-blue-700",
    completed: "bg-slate-100 text-slate-700",
    cancelled: "bg-red-100 text-red-700"
  };

  const statusLabels = {
    open: "مفتوح للعروض",
    in_progress: "قيد التنفيذ",
    completed: "مكتمل",
    cancelled: "ملغي"
  };

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
          <Link to={createPageUrl("Projects")}>
            <Button>العودة للمشاريع</Button>
          </Link>
        </div>
      </div>
    );
  }

  const hasSubmittedProposal = userEngineer && proposals.some(p => p.engineer_id === userEngineer.id);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-amber-50/30 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Badge className={statusColors[project.status]}>
                  {statusLabels[project.status]}
                </Badge>
                <Badge variant="secondary">
                  {categories[project.category] || project.category}
                </Badge>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-[#1a1a2e]">
                {project.title}
              </h1>
            </div>

            {userEngineer && project.status === "open" && !hasSubmittedProposal && (
              <Dialog open={showProposalForm} onOpenChange={setShowProposalForm}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-[#1a1a2e] to-[#C9A66B] text-white">
                    <Send className="w-5 h-5 ml-2" />
                    تقديم عرض
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>تقديم عرض على المشروع</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label htmlFor="price">السعر المقترح (ر.س)</Label>
                      <Input
                        id="price"
                        type="number"
                        value={proposalData.price}
                        onChange={(e) => setProposalData(prev => ({ ...prev, price: e.target.value }))}
                        placeholder="أدخل السعر"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="delivery_days">مدة التسليم (بالأيام)</Label>
                      <Input
                        id="delivery_days"
                        type="number"
                        value={proposalData.delivery_days}
                        onChange={(e) => setProposalData(prev => ({ ...prev, delivery_days: e.target.value }))}
                        placeholder="عدد الأيام"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cover_letter">رسالة العرض</Label>
                      <Textarea
                        id="cover_letter"
                        value={proposalData.cover_letter}
                        onChange={(e) => setProposalData(prev => ({ ...prev, cover_letter: e.target.value }))}
                        placeholder="اشرح لماذا أنت الأنسب لهذا المشروع..."
                        rows={4}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>المرفقات (معرض أعمال، مستندات)</Label>
                      <div className="border-2 border-dashed rounded-xl p-4 text-center hover:border-[#C9A66B] transition-colors">
                        <input
                          type="file"
                          multiple
                          onChange={handleUploadAttachment}
                          className="hidden"
                          id="proposal-attachments"
                          accept="image/*,.pdf,.dwg"
                        />
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
                                  <div className="w-full h-full flex items-center justify-center">
                                    <FileText className="w-6 h-6 text-slate-400" />
                                  </div>
                                )}
                              </div>
                              <button
                                type="button"
                                onClick={() => removeAttachment(index)}
                                className="absolute -top-2 -left-2 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <Button
                      onClick={handleSubmitProposal}
                      disabled={isSubmitting || !proposalData.price || !proposalData.delivery_days}
                      className="w-full bg-gradient-to-r from-[#1a1a2e] to-[#C9A66B] text-white"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin ml-2" />
                          جاري الإرسال...
                        </>
                      ) : (
                        "إرسال العرض"
                      )}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}

            {hasSubmittedProposal && (
              <Badge className="bg-green-100 text-green-700 py-2 px-4">
                <CheckCircle className="w-4 h-4 ml-2" />
                تم تقديم عرضك
              </Badge>
            )}

            {project.status === 'completed' && user && project.created_by === user.email && !existingReview && (
              <Dialog open={showReviewForm} onOpenChange={setShowReviewForm}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-amber-500 to-amber-600 text-white gap-2">
                    <Star className="w-5 h-5" />
                    قيّم المشروع
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>قيّم تجربتك مع المهندس</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label>التقييم العام</Label>
                      <div className="flex gap-2 justify-center">
                        {[1, 2, 3, 4, 5].map(star => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setReviewData(prev => ({ ...prev, rating: star }))}
                            className="transition-transform hover:scale-110"
                          >
                            <Star
                              className={`w-8 h-8 ${
                                star <= reviewData.rating
                                  ? "fill-amber-400 text-amber-400"
                                  : "text-slate-300"
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <Label className="text-xs">الجودة</Label>
                        <Input
                          type="number"
                          min="1"
                          max="5"
                          value={reviewData.quality_rating}
                          onChange={(e) => setReviewData(prev => ({ ...prev, quality_rating: parseInt(e.target.value) }))}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">التواصل</Label>
                        <Input
                          type="number"
                          min="1"
                          max="5"
                          value={reviewData.communication_rating}
                          onChange={(e) => setReviewData(prev => ({ ...prev, communication_rating: parseInt(e.target.value) }))}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">التسليم</Label>
                        <Input
                          type="number"
                          min="1"
                          max="5"
                          value={reviewData.delivery_rating}
                          onChange={(e) => setReviewData(prev => ({ ...prev, delivery_rating: parseInt(e.target.value) }))}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>تعليقك</Label>
                      <Textarea
                        value={reviewData.comment}
                        onChange={(e) => setReviewData(prev => ({ ...prev, comment: e.target.value }))}
                        placeholder="شاركنا تجربتك مع المهندس..."
                        rows={4}
                      />
                    </div>

                    <Button
                      onClick={handleSubmitReview}
                      disabled={isSubmitting}
                      className="w-full bg-gradient-to-r from-amber-500 to-amber-600 text-white"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin ml-2" />
                          جاري الإرسال...
                        </>
                      ) : (
                        "إرسال التقييم"
                      )}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}

            {existingReview && (
              <Badge className="bg-amber-100 text-amber-700 py-2 px-4">
                <Star className="w-4 h-4 ml-2 fill-amber-600" />
                تم التقييم ({existingReview.rating}/5)
              </Badge>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Description */}
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle>وصف المشروع</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-600 whitespace-pre-wrap leading-relaxed">
                    {project.description}
                  </p>
                </CardContent>
              </Card>

              {/* Attachments */}
              {project.attachments?.length > 0 && (
                <Card className="border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle>المرفقات</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {project.attachments.map((url, index) => (
                        <a
                          key={index}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group relative aspect-square rounded-xl overflow-hidden bg-slate-100"
                        >
                          {url.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                            <img src={url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <FileText className="w-12 h-12 text-slate-400" />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Download className="w-6 h-6 text-white" />
                          </div>
                        </a>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Export to Google Drive — archive all project files for both parties */}
              {user && (project.created_by === user.email || (userEngineer && project.assigned_engineer_id === userEngineer.id) || user.role === 'admin') && (
                <Card className="border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Cloud className="w-5 h-5 text-[#C9A66B]" />
                      أرشفة الملفات والمخططات على Google Drive
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-slate-600 leading-relaxed">
                      صدّر جميع مرفقات المشروع والمخططات الهندسية ومخرجات المراحل إلى مجلد مشترك على Google Drive، ليتمكن الطرفان (المهندس والعميل) من الوصول إليها لاحقاً بأمان.
                    </p>
                    <Button
                      onClick={handleExportToDrive}
                      disabled={isExportingToDrive}
                      className="w-full bg-gradient-to-r from-[#6B5D4F] to-[#C9A66B] text-white gap-2"
                    >
                      {isExportingToDrive ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          جاري التصدير والأرشفة...
                        </>
                      ) : (
                        <>
                          <Cloud className="w-5 h-5" />
                          تصدير إلى Google Drive
                        </>
                      )}
                    </Button>

                    {driveExportResult?.error && (
                      <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
                        {driveExportResult.error}
                      </div>
                    )}

                    {driveExportResult?.success === false && (
                      <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-sm text-amber-700">
                        {driveExportResult.message}
                      </div>
                    )}

                    {driveExportResult?.success === true && (
                      <div className="rounded-lg bg-green-50 border border-green-200 p-4 space-y-2">
                        <div className="flex items-center gap-2 text-green-700 font-medium">
                          <CheckCircle className="w-5 h-5" />
                          تم تصدير {driveExportResult.uploaded_count} ملف بنجاح
                          {driveExportResult.failed_count > 0 && (
                            <span className="text-amber-600 text-xs">(فشل {driveExportResult.failed_count} ملف)</span>
                          )}
                        </div>
                        <a
                          href={driveExportResult.folder_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-[#C9A66B] hover:underline text-sm font-medium"
                        >
                          <ExternalLink className="w-4 h-4" />
                          فتح مجلد المشروع على Google Drive
                        </a>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Proposals */}
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>العروض المقدمة</span>
                    <Badge variant="secondary">{proposals.length} عرض</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {/* Proposal Comparison Tool */}
                  {proposals.length >= 2 && user && project.created_by === user.email && (
                    <ProposalComparison
                      proposals={proposals}
                      engineers={engineers}
                      projectBudgetMin={project.budget_min}
                      projectBudgetMax={project.budget_max}
                      onAccept={handleAcceptProposal}
                      isClient={user && project.created_by === user.email}
                      projectStatus={project.status}
                    />
                  )}
                  {proposals.length >= 2 && user && project.created_by === user.email && (
                    <div className="my-5 border-t border-slate-100" />
                  )}
                  {proposals.length > 0 ? (
                    <div className="space-y-4">
                      {proposals.map((proposal) => {
                        const engineer = engineers[proposal.engineer_id];
                        return (
                          <div
                            key={proposal.id}
                            className={`p-4 rounded-xl border ${
                              proposal.status === "accepted" 
                                ? "border-green-200 bg-green-50" 
                                : proposal.status === "rejected"
                                ? "border-red-200 bg-red-50"
                                : "border-slate-200 bg-white"
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-3">
                                <Avatar className="w-12 h-12">
                                  <AvatarImage src={engineer?.profile_image} />
                                  <AvatarFallback className="bg-gradient-to-br from-[#1a1a2e] to-[#C9A66B] text-white">
                                    {engineer?.full_name?.charAt(0)}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <Link 
                                    to={createPageUrl("EngineerProfile") + `?id=${proposal.engineer_id}`}
                                    className="font-semibold text-[#1a1a2e] hover:text-[#C9A66B]"
                                  >
                                    {engineer?.full_name}
                                  </Link>
                                  <p className="text-sm text-slate-500">{engineer?.specialization}</p>
                                  <div className="flex items-center gap-1 mt-1">
                                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                                    <span className="text-sm">{engineer?.rating?.toFixed(1) || "0.0"}</span>
                                  </div>
                                </div>
                              </div>
                              <div className="text-left">
                                <p className="text-xl font-bold text-[#1a1a2e]">
                                  {proposal.price?.toLocaleString()} ر.س
                                </p>
                                <p className="text-sm text-slate-500">
                                  {proposal.delivery_days} يوم
                                </p>
                              </div>
                            </div>
                            
                            {proposal.cover_letter && (
                              <p className="mt-3 text-slate-600 text-sm">
                                {proposal.cover_letter}
                              </p>
                            )}

                            {proposal.attachments?.length > 0 && (
                              <div className="mt-3">
                                <p className="text-xs text-slate-500 mb-2 flex items-center gap-1">
                                  <Paperclip className="w-3 h-3" />
                                  المرفقات ({proposal.attachments.length})
                                </p>
                                <div className="flex flex-wrap gap-2">
                                  {proposal.attachments.map((url, idx) => (
                                    <a
                                      key={idx}
                                      href={url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="w-12 h-12 rounded-lg overflow-hidden bg-slate-100 hover:ring-2 hover:ring-[#C9A66B] transition-all"
                                    >
                                      {url.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                                        <img src={url} alt="" className="w-full h-full object-cover" />
                                      ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                          <FileText className="w-5 h-5 text-slate-400" />
                                        </div>
                                      )}
                                    </a>
                                  ))}
                                </div>
                              </div>
                            )}

                            <div className="flex items-center justify-between mt-4">
                              <Badge className={
                                proposal.status === "accepted" ? "bg-green-100 text-green-700" :
                                proposal.status === "rejected" ? "bg-red-100 text-red-700" :
                                "bg-amber-100 text-amber-700"
                              }>
                                {proposal.status === "accepted" ? "مقبول" :
                                 proposal.status === "rejected" ? "مرفوض" : "قيد المراجعة"}
                              </Badge>

                              {project.status === "open" && proposal.status === "pending" && (
                                <div className="flex gap-2 flex-wrap">
                                  <Link to={createPageUrl("Messages") + `?engineer=${proposal.engineer_id}`}>
                                    <Button variant="outline" size="sm">
                                      <MessageSquare className="w-4 h-4 ml-1" />
                                      تواصل
                                    </Button>
                                  </Link>
                                  <Button 
                                    size="sm"
                                    onClick={() => handleCreateContractFromProposal(proposal)}
                                    disabled={isSubmitting}
                                    className="bg-gradient-to-r from-[#6B5D4F] to-[#C9A66B] text-white"
                                  >
                                    <Scale className="w-4 h-4 ml-1" />
                                    قبول وإنشاء عقد
                                  </Button>
                                  <Button 
                                    size="sm"
                                    onClick={() => handleAcceptProposal(proposal)}
                                    disabled={isSubmitting}
                                    className="bg-green-600 hover:bg-green-700"
                                  >
                                    <CheckCircle className="w-4 h-4 ml-1" />
                                    قبول فقط
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                      <p className="text-slate-500">لا توجد عروض حتى الآن</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle>تفاصيل المشروع</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {(project.budget_min || project.budget_max) && (
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                        <DollarSign className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm text-slate-500">الميزانية</p>
                        <p className="font-semibold">
                          {project.budget_min?.toLocaleString()} - {project.budget_max?.toLocaleString()} ر.س
                        </p>
                      </div>
                    </div>
                  )}

                  {project.location && (
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                        <MapPin className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm text-slate-500">الموقع</p>
                        <p className="font-semibold">{project.location}</p>
                      </div>
                    </div>
                  )}

                  {project.deadline && (
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                        <Calendar className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-sm text-slate-500">الموعد النهائي</p>
                        <p className="font-semibold">
                          {new Date(project.deadline).toLocaleDateString("ar")}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                      <Clock className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">تاريخ النشر</p>
                      <p className="font-semibold">
                        {new Date(project.created_date).toLocaleDateString("ar", {
                          year: "numeric",
                          month: "long",
                          day: "numeric"
                        })}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Escrow Panel - Always show for in_progress or when escrow exists */}
              {(project.escrow_status && project.escrow_status !== 'none') || project.status === 'in_progress' ? (
                <EscrowTracker
                  project={project}
                  proposalId={proposals.find(p => p.status === 'accepted')?.id}
                  isClient={user && project.created_by === user.email}
                  isEngineer={!!userEngineer && project.assigned_engineer_id === userEngineer.id}
                  onUpdate={loadData}
                />
              ) : null}

              {/* Google Meet Call - For in_progress projects, owner only */}
              {project?.status === "in_progress" && user && project.created_by === user.email && (
                <MeetCallButton project={project} currentUser={user} />
              )}

              {/* Design Review Meeting — Google Calendar integration */}
              {project?.status === "in_progress" && user && project.assigned_engineer_id && (() => {
                const assignedEngineer = engineers[project.assigned_engineer_id];
                const isClient = project.created_by === user.email;
                const isAssignedEngineer = userEngineer && project.assigned_engineer_id === userEngineer.id;
                if (!isClient && !isAssignedEngineer) return null;

                // Client → schedule with engineer; Engineer → schedule with client
                const target = isClient
                  ? { id: assignedEngineer?.id, name: assignedEngineer?.full_name, email: assignedEngineer?.email, type: "engineer" }
                  : { id: userClient?.id || project.client_id, name: userClient?.full_name || project.created_by, email: project.created_by, type: "engineer" };

                if (!target.email) return null;

                return (
                  <Card className="border-0 shadow-lg mb-6">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                          <Calendar className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-[#1a1a2e]">اجتماع مراجعة المخططات</h4>
                          <p className="text-sm text-slate-500">احجز موعداً مع {target.name} — يُحفظ في تقويم جوجل تلقائياً</p>
                        </div>
                      </div>
                      <AppointmentModal
                        targetId={target.id}
                        targetName={target.name}
                        targetType={target.type}
                        targetEmail={target.email}
                        trigger={
                          <Button className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white gap-2">
                            <Calendar className="w-4 h-4" />
                            حجز موعد مراجعة
                          </Button>
                        }
                      />
                    </CardContent>
                  </Card>
                );
              })()}

              {/* Kanban Board - For in progress projects */}
               {project?.status === "in_progress" && (
                 <Link to={createPageUrl("ProjectKanban") + `?id=${project.id}`}>
                   <Card className="border-0 shadow-lg mb-6 hover:shadow-xl transition-shadow cursor-pointer">
                     <CardContent className="p-4">
                       <div className="flex items-center gap-3">
                         <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                           <Kanban className="w-5 h-5 text-purple-600" />
                         </div>
                         <div>
                           <h4 className="font-semibold text-[#1a1a2e]">لوحة المشروع</h4>
                           <p className="text-sm text-slate-500">إدارة المهام والتقدم</p>
                         </div>
                       </div>
                     </CardContent>
                   </Card>
                 </Link>
               )}

              {/* Signed Contracts Upload & Archive */}
              {(project?.status === "in_progress" || project?.status === "completed" || project?.assigned_engineer_id) && user && (
                <SignedContractsPanel
                  project={project}
                  user={user}
                  userEngineer={userEngineer}
                  userClient={userClient}
                />
              )}

              {/* Contract Generator - Only for assigned engineer or client */}
               {project?.status === "in_progress" && userEngineer && userClient && (
                  <Card className="border-0 shadow-lg mb-6">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <Scale className="w-5 h-5 text-purple-500" />
                        <div>
                          <h4 className="font-semibold text-[#1a1a2e]">العقد القانوني</h4>
                          <p className="text-sm text-slate-500">أنشئ عقداً رسمياً للمشروع</p>
                        </div>
                      </div>
                      <ContractGenerator 
                        project={project} 
                        engineer={userEngineer} 
                        client={userClient} 
                      />
                    </CardContent>
                  </Card>
                )}

              {/* Milestone Invoices */}
              {project.status === "in_progress" || project.status === "completed" ? (
                <MilestoneInvoicePanel
                  projectId={projectId}
                  isClient={user && project.created_by === user.email}
                />
              ) : null}

              <Link to={createPageUrl("Projects")}>
                <Button variant="outline" className="w-full gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  العودة للمشاريع
                </Button>
              </Link>

              {/* Contextual Ads - Project Sidebar */}
              <AdSidebarSection ads={sidebarAds} />
            </div>
          </div>

          {/* AI Project Chatbot */}
          {user && (
            <div className="mt-6 mb-2 flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-500">تحليل ذكي للمشروع:</span>
              </div>
              <ProjectChatbot projectId={projectId} projectTitle={project.title} />
            </div>
          )}

          {/* Project Chat - visible when project is in_progress or has assigned engineer */}
          {(project.status === "in_progress" || project.assigned_engineer_id) && user && (
            <div className="mt-8">
              <div className="flex items-center gap-2 mb-4">
                <MessageSquare className="w-5 h-5 text-[#C9A66B]" />
                <h2 className="text-lg font-bold text-[#1a1a2e]">قناة التواصل المباشر</h2>
              </div>
              <ProjectChat
                projectId={projectId}
                project={project}
                currentUser={user}
                engineerName={engineers[project.assigned_engineer_id]?.full_name}
              />
            </div>
          )}
          
            </motion.div>
      </div>
    </div>
  );
}