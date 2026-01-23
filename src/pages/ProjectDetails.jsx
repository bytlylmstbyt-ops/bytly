import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { 
  MapPin, Calendar, DollarSign, Clock, Users, 
  FileText, MessageSquare, Send, Loader2, CheckCircle,
  Star, Download, Eye, ArrowLeft
} from "lucide-react";
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

  const [project, setProject] = useState(null);
  const [proposals, setProposals] = useState([]);
  const [engineers, setEngineers] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [userEngineer, setUserEngineer] = useState(null);
  const [showProposalForm, setShowProposalForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [proposalData, setProposalData] = useState({
    price: "",
    delivery_days: "",
    cover_letter: ""
  });

  useEffect(() => {
    if (projectId) {
      loadData();
    }
  }, [projectId]);

  const loadData = async () => {
    setIsLoading(true);
    
    const currentUser = await base44.auth.me();
    setUser(currentUser);

    const [projectData, proposalsData, engineersData, userEngData] = await Promise.all([
      base44.entities.Project.filter({ id: projectId }),
      base44.entities.Proposal.filter({ project_id: projectId }),
      base44.entities.Engineer.filter({ status: "approved" }),
      base44.entities.Engineer.filter({ email: currentUser.email })
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

    setIsLoading(false);
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
      status: "pending"
    });

    // Update project proposals count
    await base44.entities.Project.update(projectId, {
      total_proposals: (project.total_proposals || 0) + 1
    });

    setIsSubmitting(false);
    setShowProposalForm(false);
    setProposalData({ price: "", delivery_days: "", cover_letter: "" });
    loadData();
  };

  const handleAcceptProposal = async (proposal) => {
    setIsSubmitting(true);

    // Update proposal status
    await base44.entities.Proposal.update(proposal.id, { status: "accepted" });

    // Update project
    await base44.entities.Project.update(projectId, {
      status: "in_progress",
      assigned_engineer_id: proposal.engineer_id,
      escrow_amount: proposal.price
    });

    // Reject other proposals
    for (const p of proposals) {
      if (p.id !== proposal.id && p.status === "pending") {
        await base44.entities.Proposal.update(p.id, { status: "rejected" });
      }
    }

    setIsSubmitting(false);
    loadData();
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
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#d4a574]"></div>
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
                  <Button className="bg-gradient-to-r from-[#1a1a2e] to-[#d4a574] text-white">
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
                    <Button
                      onClick={handleSubmitProposal}
                      disabled={isSubmitting || !proposalData.price || !proposalData.delivery_days}
                      className="w-full bg-gradient-to-r from-[#1a1a2e] to-[#d4a574] text-white"
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

              {/* Proposals */}
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>العروض المقدمة</span>
                    <Badge variant="secondary">{proposals.length} عرض</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
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
                                  <AvatarFallback className="bg-gradient-to-br from-[#1a1a2e] to-[#d4a574] text-white">
                                    {engineer?.full_name?.charAt(0)}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <Link 
                                    to={createPageUrl("EngineerProfile") + `?id=${proposal.engineer_id}`}
                                    className="font-semibold text-[#1a1a2e] hover:text-[#d4a574]"
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
                                <div className="flex gap-2">
                                  <Link to={createPageUrl("Messages") + `?engineer=${proposal.engineer_id}`}>
                                    <Button variant="outline" size="sm">
                                      <MessageSquare className="w-4 h-4 ml-1" />
                                      تواصل
                                    </Button>
                                  </Link>
                                  <Button 
                                    size="sm"
                                    onClick={() => handleAcceptProposal(proposal)}
                                    disabled={isSubmitting}
                                    className="bg-green-600 hover:bg-green-700"
                                  >
                                    <CheckCircle className="w-4 h-4 ml-1" />
                                    قبول العرض
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

              <Link to={createPageUrl("Projects")}>
                <Button variant="outline" className="w-full gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  العودة للمشاريع
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}