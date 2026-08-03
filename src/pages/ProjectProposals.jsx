import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import {
  ArrowRight, Star, Clock, DollarSign, User, CheckCircle,
  BarChart3, TrendingDown, Award, MessageSquare, ChevronDown, ChevronUp, Loader2,
  Search, Plus, RefreshCw, X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useBulkSelection } from "@/components/admin/useBulkSelection";
import AddProposalDialog from "@/components/proposals/AddProposalDialog";
import ProposalsCompareModal from "@/components/proposals/ProposalsCompareModal";

export default function ProjectProposals() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const projectId = urlParams.get("project_id");

  const [project, setProject] = useState(null);
  const [proposals, setProposals] = useState([]);
  const [engineers, setEngineers] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [compareList, setCompareList] = useState([]);
  const [expandedProposal, setExpandedProposal] = useState(null);
  const [sortBy, setSortBy] = useState("price_asc");
  const [isAdmin, setIsAdmin] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showAdd, setShowAdd] = useState(false);
  const [showCompare, setShowCompare] = useState(false);
  const [busy, setBusy] = useState(false);
  const [pendingBulk, setPendingBulk] = useState(null);
  const bulk = useBulkSelection();

  useEffect(() => {
    loadData();
  }, [projectId]);

  const loadData = async (silent = false) => {
    if (!silent) setIsLoading(true);
    let me = null;
    try { me = await base44.auth.me(); } catch {}
    setIsAdmin(me?.role === "admin");
    let projectData = [];
    let proposalsData = [];

    if (projectId) {
      [projectData, proposalsData] = await Promise.all([
        base44.entities.Project.filter({ id: projectId }),
        base44.entities.Proposal.filter({ project_id: projectId })
      ]);
    } else {
      // Admin overview — load all proposals and related projects
      proposalsData = await base44.entities.Proposal.list("-created_date", 200);
      const projectIds = [...new Set(proposalsData.map(p => p.project_id).filter(Boolean))];
      if (projectIds.length) {
        const projectsMap = await base44.entities.Project.list("-created_date", 200);
        projectData = projectsMap.filter(pr => projectIds.includes(pr.id));
      }
    }

    setProject(projectData[0] || null);
    setProposals(proposalsData);

    // Load engineer profiles
    const engineerIds = [...new Set(proposalsData.map(p => p.engineer_id).filter(Boolean))];
    const engineerMap = {};
    await Promise.all(
      engineerIds.map(async (id) => {
        const data = await base44.entities.Engineer.filter({ id });
        if (data[0]) engineerMap[id] = data[0];
      })
    );

    setEngineers(engineerMap);
    setIsLoading(false);
  };

  const filteredProposals = proposals.filter(p => {
    const q = search.toLowerCase();
    const ms = !q || (engineers[p.engineer_id]?.full_name || "").toLowerCase().includes(q) || (p.id || "").slice(-6).toLowerCase().includes(q);
    const mst = statusFilter === "all" ? true : p.status === statusFilter;
    return ms && mst;
  });

  const sortedProposals = [...filteredProposals].sort((a, b) => {
    if (sortBy === "price_asc") return (a.price || 0) - (b.price || 0);
    if (sortBy === "price_desc") return (b.price || 0) - (a.price || 0);
    if (sortBy === "delivery_asc") return (a.delivery_days || 0) - (b.delivery_days || 0);
    if (sortBy === "rating_desc") {
      const ra = engineers[a.engineer_id]?.rating || 0;
      const rb = engineers[b.engineer_id]?.rating || 0;
      return rb - ra;
    }
    return 0;
  });

  const minPrice = proposals.length ? Math.min(...proposals.map(p => p.price || 0)) : 0;
  const maxPrice = proposals.length ? Math.max(...proposals.map(p => p.price || 0)) : 1;
  const minDays = proposals.length ? Math.min(...proposals.map(p => p.delivery_days || 0)) : 0;
  const maxDays = proposals.length ? Math.max(...proposals.map(p => p.delivery_days || 0)) : 1;

  const toggleCompare = (id) => {
    setCompareList(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : prev.length < 3 ? [...prev, id] : prev
    );
  };

  const [acceptingId, setAcceptingId] = useState(null);

  const handleAccept = async (proposalId) => {
    setAcceptingId(proposalId);
    try {
      await base44.entities.Proposal.update(proposalId, { status: "accepted" });
      // Reject others
      const others = proposals.filter(p => p.id !== proposalId);
      await Promise.all(others.map(p => base44.entities.Proposal.update(p.id, { status: "rejected" })));
      // Generate digital work contract automatically
      await base44.functions.invoke("autoGenerateContract", { proposalId });
      await loadData();
    } catch (err) {
      console.error("Accept failed:", err);
    } finally {
      setAcceptingId(null);
    }
  };

  const runBulk = async (action) => {
    setBusy(true);
    try {
      const ids = bulk.selectedIds;
      if (action === "delete") {
        await Promise.all(ids.map(id => base44.entities.Proposal.delete(id)));
      } else {
        await Promise.all(ids.map(id => base44.entities.Proposal.update(id, { status: action })));
      }
      bulk.clear();
      await loadData(true);
    } catch (err) { console.error("bulk failed", err); }
    finally { setBusy(false); setPendingBulk(null); }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#C9A66B]" />
      </div>
    );
  }

  if (!project && projectId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md w-full mx-4 text-center p-8">
          <p className="text-slate-500">لم يتم العثور على المشروع</p>
          <Button className="mt-4" onClick={() => navigate(-1)}>رجوع</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-amber-50/20 py-8" dir="rtl">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-500 hover:text-[#C9A66B] transition-colors mb-4">
            <ArrowRight className="w-4 h-4" />
            <span className="text-sm">رجوع</span>
          </button>

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-[#1a1a2e]">{project ? "عروض المشروع" : "إدارة العروض"}</h1>
              <p className="text-slate-500 mt-1">{project ? project.title : "جميع عروض المشاريع على المنصة"}</p>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              {isAdmin && (
                <>
                  <Button onClick={() => setShowAdd(true)} className="bg-gradient-to-r from-[#6B5D4F] to-[#C9A66B] text-white">
                    <Plus className="w-4 h-4 ml-2" /> إضافة عرض
                  </Button>
                  <Button variant="outline" onClick={() => loadData(true)} disabled={isLoading}>
                    <RefreshCw className={`w-4 h-4 ml-2 ${isLoading ? "animate-spin" : ""}`} /> تحديث البيانات
                  </Button>
                </>
              )}
              <Badge className="bg-amber-100 text-amber-700 text-sm px-3 py-1">
                {proposals.length} عرض مستلم
              </Badge>
              {compareList.length > 1 && (
                <Button
                  onClick={() => setShowCompare(true)}
                  className="bg-gradient-to-r from-[#1a1a2e] to-[#C9A66B] text-white"
                >
                  <BarChart3 className="w-4 h-4 ml-2" />
                  مقارنة العروض ({compareList.length})
                </Button>
              )}
            </div>
          </div>
        </motion.div>

        {/* Stats Bar */}
        {proposals.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {[
                { label: "أقل سعر", value: `${minPrice.toLocaleString()} ر.س`, icon: TrendingDown, color: "green" },
                { label: "أعلى سعر", value: `${maxPrice.toLocaleString()} ر.س`, icon: DollarSign, color: "red" },
                { label: "أسرع تسليم", value: `${minDays} يوم`, icon: Clock, color: "blue" },
                { label: "إجمالي العروض", value: proposals.length, icon: BarChart3, color: "amber" },
              ].map(({ label, value, icon: Icon, color }) => (
                <Card key={label} className="border-0 shadow-sm">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl bg-${color}-100 flex items-center justify-center shrink-0`}>
                      <Icon className={`w-5 h-5 text-${color}-600`} />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">{label}</p>
                      <p className="font-bold text-[#1a1a2e]">{value}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </motion.div>
        )}

        {/* Search & filters */}
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input placeholder="ابحث باسم المهندس أو رقم العرض..." value={search} onChange={(e) => setSearch(e.target.value)} className="pr-10" />
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white cursor-pointer">
            <option value="all">كل الحالات</option>
            <option value="pending">معلق</option>
            <option value="accepted">مقبول</option>
            <option value="rejected">مرفوض</option>
          </select>
        </div>

        {/* Bulk actions */}
        {isAdmin && bulk.selectedCount > 0 && (
          <div className="sticky top-2 z-30 mb-4 rounded-xl border border-[#C9A66B]/30 bg-[#4A3F35] text-white shadow-lg px-4 py-2.5 flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="bg-[#C9A66B] text-[#4A3F35] rounded-full w-7 h-7 flex items-center justify-center font-bold text-sm">{bulk.selectedCount}</span>
              <span className="text-sm">تم تحديد {bulk.selectedCount} عرض</span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white" disabled={busy} onClick={() => runBulk("pending")}>تعليق</Button>
              <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" disabled={busy} onClick={() => runBulk("accepted")}>قبول</Button>
              <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white" disabled={busy} onClick={() => runBulk("rejected")}>رفض</Button>
              <Button size="sm" className="bg-red-700 hover:bg-red-800 text-white" disabled={busy} onClick={() => setPendingBulk("delete")}>حذف</Button>
              <Button size="sm" variant="ghost" className="text-white hover:bg-white/10" onClick={bulk.clear} disabled={busy}>
                <X className="w-4 h-4 ml-1" /> إلغاء التحديد
              </Button>
            </div>
          </div>
        )}

        {/* Sort & Compare hint */}
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500">ترتيب حسب:</span>
            {[
              { value: "price_asc", label: "أقل سعر" },
              { value: "price_desc", label: "أعلى سعر" },
              { value: "delivery_asc", label: "أسرع تسليم" },
              { value: "rating_desc", label: "أعلى تقييم" },
            ].map(opt => (
              <button
                key={opt.value}
                onClick={() => setSortBy(opt.value)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  sortBy === opt.value
                    ? "bg-[#C9A66B] text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          {compareList.length > 0 && compareList.length < 3 && (
            <p className="text-xs text-slate-400">اختر حتى 3 عروض للمقارنة</p>
          )}
        </div>

        {/* Proposals List */}
        {sortedProposals.length === 0 ? (
          <Card className="text-center py-16">
            <CardContent>
              <MessageSquare className="w-16 h-16 mx-auto text-slate-300 mb-4" />
              <p className="text-lg font-medium text-slate-500">لا توجد عروض مطابقة</p>
              <p className="text-sm text-slate-400 mt-2">جرّب تعديل البحث أو الفلاتر</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {sortedProposals.map((proposal, index) => {
              const engineer = engineers[proposal.engineer_id];
              const isExpanded = expandedProposal === proposal.id;
              const isInCompare = compareList.includes(proposal.id);
              const priceScore = maxPrice > minPrice ? 100 - ((proposal.price - minPrice) / (maxPrice - minPrice)) * 100 : 100;
              const deliveryScore = maxDays > minDays ? 100 - ((proposal.delivery_days - minDays) / (maxDays - minDays)) * 100 : 100;

              return (
                <motion.div
                  key={proposal.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className={`border-0 shadow-md hover:shadow-lg transition-all ${
                    proposal.status === "accepted" ? "border-2 border-green-400 bg-green-50/30" :
                    isInCompare ? "border-2 border-[#C9A66B]" : ""
                  }`}>
                    <CardContent className="p-5">
                      <div className="flex flex-col md:flex-row md:items-start gap-4">

                        {isAdmin && (
                          <div className="pt-1">
                            <Checkbox checked={bulk.isSelected(proposal.id)} onCheckedChange={() => bulk.toggle(proposal.id)} />
                          </div>
                        )}

                        {/* Engineer Info */}
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <Avatar className="w-12 h-12 shrink-0">
                            <AvatarImage src={engineer?.profile_image} />
                            <AvatarFallback className="bg-gradient-to-br from-[#1a1a2e] to-[#C9A66B] text-white">
                              {engineer?.full_name?.charAt(0) || "م"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-bold text-[#1a1a2e]">{engineer?.full_name || "مهندس"}</p>
                              {engineer?.is_verified && (
                                <Badge className="bg-blue-100 text-blue-700 text-xs">موثّق</Badge>
                              )}
                              {proposal.status === "accepted" && (
                                <Badge className="bg-green-100 text-green-700 text-xs">✓ مقبول</Badge>
                              )}
                            </div>
                            <p className="text-sm text-slate-500 truncate">{engineer?.specialization}</p>
                            <div className="flex items-center gap-1 mt-1">
                              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                              <span className="text-xs text-slate-600">{engineer?.rating?.toFixed(1) || "—"}</span>
                              <span className="text-xs text-slate-400">({engineer?.reviews_count || 0} تقييم)</span>
                            </div>
                          </div>
                        </div>

                        {/* Price & Delivery */}
                        <div className="flex gap-6 shrink-0">
                          <div className="text-center">
                            <p className="text-xs text-slate-500 mb-1">السعر</p>
                            <p className="text-xl font-bold text-[#1a1a2e]">{proposal.price?.toLocaleString()}</p>
                            <p className="text-xs text-slate-400">ريال سعودي</p>
                          </div>
                          <div className="text-center">
                            <p className="text-xs text-slate-500 mb-1">مدة التسليم</p>
                            <p className="text-xl font-bold text-[#1a1a2e]">{proposal.delivery_days || "—"}</p>
                            <p className="text-xs text-slate-400">يوم</p>
                          </div>
                        </div>

                        {/* Score Bars */}
                        <div className="w-full md:w-40 shrink-0 space-y-2">
                          <div>
                            <div className="flex justify-between text-xs text-slate-500 mb-1">
                              <span>تنافسية السعر</span>
                              <span>{Math.round(priceScore)}%</span>
                            </div>
                            <Progress value={priceScore} className="h-1.5" />
                          </div>
                          <div>
                            <div className="flex justify-between text-xs text-slate-500 mb-1">
                              <span>سرعة التسليم</span>
                              <span>{Math.round(deliveryScore)}%</span>
                            </div>
                            <Progress value={deliveryScore} className="h-1.5" />
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-row md:flex-col gap-2 shrink-0">
                          <Link to={`/Messages?engineer=${proposal.engineer_id}&project=${projectId}`}>
                            <Button variant="outline" size="sm" className="text-xs border-blue-200 text-blue-600 hover:bg-blue-50 hover:text-blue-700">
                              <MessageSquare className="w-3.5 h-3.5 ml-1" />
                              محادثة
                            </Button>
                          </Link>

                          <button
                            onClick={() => toggleCompare(proposal.id)}
                            disabled={!isInCompare && compareList.length >= 3}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                              isInCompare
                                ? "border-[#C9A66B] bg-amber-50 text-[#C9A66B]"
                                : "border-slate-200 text-slate-500 hover:border-[#C9A66B] hover:text-[#C9A66B] disabled:opacity-40"
                            }`}
                          >
                            {isInCompare ? "✓ للمقارنة" : "قارن"}
                          </button>

                          {proposal.status !== "accepted" && (
                            <Button
                              size="sm"
                              className="bg-gradient-to-r from-[#1a1a2e] to-[#C9A66B] text-white text-xs"
                              disabled={acceptingId === proposal.id}
                              onClick={() => handleAccept(proposal.id)}
                            >
                              {acceptingId === proposal.id ? (
                                <>
                                  <Loader2 className="w-3.5 h-3.5 animate-spin ml-1" />
                                  جاري توليد العقد...
                                </>
                              ) : (
                                <>
                                  <CheckCircle className="w-3.5 h-3.5 ml-1" />
                                  قبول
                                </>
                              )}
                            </Button>
                          )}

                          <button
                            onClick={() => setExpandedProposal(isExpanded ? null : proposal.id)}
                            className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600"
                          >
                            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                            {isExpanded ? "إخفاء" : "التفاصيل"}
                          </button>
                        </div>
                      </div>

                      {/* Expanded Details */}
                      {isExpanded && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          className="mt-4 pt-4 border-t border-slate-100"
                        >
                          {proposal.cover_letter && (
                            <div className="mb-3">
                              <p className="text-xs font-semibold text-slate-500 mb-1">رسالة العرض</p>
                              <p className="text-sm text-slate-700 bg-slate-50 rounded-lg p-3 leading-relaxed">
                                {proposal.cover_letter}
                              </p>
                            </div>
                          )}
                          {proposal.custom_milestones?.length > 0 && (
                            <div>
                              <p className="text-xs font-semibold text-slate-500 mb-2">مراحل التنفيذ</p>
                              <div className="space-y-2">
                                {proposal.custom_milestones.map((m, i) => (
                                  <div key={i} className="flex items-center gap-3 text-sm">
                                    <span className="w-6 h-6 rounded-full bg-[#C9A66B]/20 text-[#C9A66B] flex items-center justify-center text-xs font-bold shrink-0">
                                      {i + 1}
                                    </span>
                                    <span className="text-slate-700">{m.title || m.name || JSON.stringify(m)}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          <div className="mt-3 flex gap-2">
                            <Link to={`/EngineerProfile?id=${proposal.engineer_id}`}>
                              <Button variant="outline" size="sm" className="text-xs">
                                <User className="w-3.5 h-3.5 ml-1" />
                                عرض الملف
                              </Button>
                            </Link>
                          </div>
                        </motion.div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}

        {isAdmin && (
          <AddProposalDialog open={showAdd} onOpenChange={setShowAdd} preselectedProjectId={projectId} onCreated={() => loadData(true)} />
        )}

        <ProposalsCompareModal
          open={showCompare}
          onOpenChange={setShowCompare}
          proposals={compareList.map((id) => proposals.find((p) => p.id === id)).filter(Boolean)}
          engineers={engineers}
          onAccept={handleAccept}
          acceptingId={acceptingId}
        />

        <AlertDialog open={!!pendingBulk} onOpenChange={(o) => !o && setPendingBulk(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>تأكيد الحذف الجماعي</AlertDialogTitle>
              <AlertDialogDescription>
                سيتم حذف {bulk.selectedCount} عرض نهائيًا. لا يمكن التراجع. هل أنت متأكد؟
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={busy}>إلغاء</AlertDialogCancel>
              <AlertDialogAction onClick={() => runBulk(pendingBulk)} disabled={busy} className="bg-red-600 hover:bg-red-700">
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : "تأكيد الحذف"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

    </div>
  );
}