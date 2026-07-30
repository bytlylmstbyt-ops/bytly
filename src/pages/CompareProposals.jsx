import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import {
  ArrowRight, Star, Clock, DollarSign, CheckCircle, X,
  Briefcase, Award, MessageSquare, Loader2, Trophy, Zap,
  TrendingDown, ShieldCheck, User, Calendar
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function CompareProposals() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const idsParam = urlParams.get("ids") || "";
  const projectId = urlParams.get("project_id");

  const proposalIds = idsParam.split(",").filter(Boolean);

  const [project, setProject] = useState(null);
  const [proposals, setProposals] = useState([]);
  const [engineers, setEngineers] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [acceptingId, setAcceptingId] = useState(null);

  useEffect(() => {
    if (proposalIds.length > 0) loadData();
    else setIsLoading(false);
  }, [idsParam]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const proposalResults = await Promise.all(
        proposalIds.map(id => base44.entities.Proposal.filter({ id }))
      );
      const validProposals = proposalResults.map(r => r[0]).filter(Boolean);
      setProposals(validProposals);

      if (projectId) {
        const proj = await base44.entities.Project.filter({ id: projectId });
        setProject(proj[0] || null);
      }

      const engineerIds = [...new Set(validProposals.map(p => p.engineer_id).filter(Boolean))];
      const engineerMap = {};
      await Promise.all(
        engineerIds.map(async (id) => {
          const data = await base44.entities.Engineer.filter({ id });
          if (data[0]) engineerMap[id] = data[0];
        })
      );
      setEngineers(engineerMap);
    } catch (err) {
      console.error("Load compare data failed:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAccept = async (proposalId) => {
    setAcceptingId(proposalId);
    try {
      await base44.entities.Proposal.update(proposalId, { status: "accepted" });
      const others = proposals.filter(p => p.id !== proposalId);
      await Promise.all(others.map(p => base44.entities.Proposal.update(p.id, { status: "rejected" })));
      await base44.functions.invoke("autoGenerateContract", { proposalId });
      navigate(`/ProjectProposals?project_id=${projectId}`);
    } catch (err) {
      console.error("Accept failed:", err);
    } finally {
      setAcceptingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#C9A66B]" />
      </div>
    );
  }

  if (proposals.length < 2) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <Card className="max-w-md w-full text-center p-8">
          <Trophy className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-lg font-medium text-slate-600">تحتاج إلى عرضين على الأقل للمقارنة</p>
          <Button className="mt-4" onClick={() => navigate(-1)}>رجوع</Button>
        </Card>
      </div>
    );
  }

  // Best values
  const minPrice = Math.min(...proposals.map(p => p.price || Infinity));
  const minDays = Math.min(...proposals.map(p => p.delivery_days || Infinity));
  const maxRating = Math.max(...proposals.map(p => engineers[p.engineer_id]?.rating || 0));
  const maxExperience = Math.max(...proposals.map(p => engineers[p.engineer_id]?.years_experience || 0));
  const maxCompleted = Math.max(...proposals.map(p => engineers[p.engineer_id]?.completed_projects || 0));

  const MetricRow = ({ icon, label, children, highlight }) => (
    <div className={`px-4 py-3 border-t border-slate-100 ${highlight ? "bg-green-50/50" : ""}`}>
      <div className="flex items-center gap-2 mb-1.5">
        {icon}
        <span className="text-xs font-medium text-slate-500">{label}</span>
      </div>
      <div className={`text-sm font-semibold ${highlight ? "text-green-700" : "text-slate-800"}`}>
        {children}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-amber-50/20 py-6" dir="rtl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-500 hover:text-[#C9A66B] transition-colors mb-3">
            <ArrowRight className="w-4 h-4" />
            <span className="text-sm">رجوع للعروض</span>
          </button>

          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#1a1a2e] to-[#C9A66B] flex items-center justify-center">
              <Trophy className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#1a1a2e]">مقارنة العروض جنباً إلى جنب</h1>
              <p className="text-slate-500 text-sm mt-0.5">
                {project?.title && <span>{project.title} • </span>}
                مقارنة {proposals.length} عروض حسب التكلفة والتقييم
              </p>
            </div>
          </div>
        </motion.div>

        {/* Summary bar */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card className="border-0 shadow-sm">
              <CardContent className="p-3 flex items-center gap-2">
                <div className="w-9 h-9 rounded-lg bg-green-100 flex items-center justify-center shrink-0">
                  <TrendingDown className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">أقل سعر</p>
                  <p className="font-bold text-[#1a1a2e] text-sm">{minPrice.toLocaleString()} ر.س</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-3 flex items-center gap-2">
                <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                  <Clock className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">أسرع تسليم</p>
                  <p className="font-bold text-[#1a1a2e] text-sm">{minDays} يوم</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-3 flex items-center gap-2">
                <div className="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                  <Star className="w-4 h-4 text-amber-600 fill-amber-400" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">أعلى تقييم</p>
                  <p className="font-bold text-[#1a1a2e] text-sm">{maxRating.toFixed(1)} / 5</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-3 flex items-center gap-2">
                <div className="w-9 h-9 rounded-lg bg-purple-100 flex items-center justify-center shrink-0">
                  <Award className="w-4 h-4 text-purple-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">عدد العروض</p>
                  <p className="font-bold text-[#1a1a2e] text-sm">{proposals.length} عرض</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.div>

        {/* Comparison columns */}
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-4 min-w-min">
            {proposals.map((proposal, index) => {
              const engineer = engineers[proposal.engineer_id];
              const isCheapest = proposal.price === minPrice;
              const isFastest = proposal.delivery_days === minDays;
              const isTopRated = (engineer?.rating || 0) === maxRating && maxRating > 0;
              const isMostExp = (engineer?.years_experience || 0) === maxExperience && maxExperience > 0;

              return (
                <motion.div
                  key={proposal.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.08 }}
                  className="w-72 sm:w-80 shrink-0"
                >
                  <Card className={`border-0 shadow-lg overflow-hidden h-full flex flex-col ${
                    proposal.status === "accepted" ? "ring-2 ring-green-400" :
                    isCheapest ? "ring-1 ring-green-200" : ""
                  }`}>

                    {/* Header — engineer identity */}
                    <div className="bg-gradient-to-br from-[#1a1a2e] to-[#4A3F35] p-4 text-white">
                      <div className="flex items-center gap-3 mb-3">
                        <Avatar className="w-14 h-14 ring-2 ring-[#C9A66B]/40">
                          <AvatarImage src={engineer?.profile_image} />
                          <AvatarFallback className="bg-white/20 text-white text-lg font-bold">
                            {engineer?.full_name?.charAt(0) || "م"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <Link to={`/EngineerProfile?id=${proposal.engineer_id}`} className="font-bold text-white hover:text-[#C9A66B] transition-colors block truncate">
                            {engineer?.full_name || "مهندس"}
                          </Link>
                          <p className="text-xs text-white/60 truncate">{engineer?.specialization}</p>
                        </div>
                      </div>

                      {/* Best badges */}
                      <div className="flex flex-wrap gap-1.5">
                        {isCheapest && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/20 text-green-300 font-semibold flex items-center gap-1">
                            <TrendingDown className="w-3 h-3" /> الأرخص
                          </span>
                        )}
                        {isFastest && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-semibold flex items-center gap-1">
                            <Zap className="w-3 h-3" /> الأسرع
                          </span>
                        )}
                        {isTopRated && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-semibold flex items-center gap-1">
                            <Star className="w-3 h-3 fill-current" /> الأعلى تقييماً
                          </span>
                        )}
                        {isMostExp && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-semibold flex items-center gap-1">
                            <Briefcase className="w-3 h-3" /> الأكثر خبرة
                          </span>
                        )}
                        {engineer?.is_verified && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-semibold flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3" /> موثق
                          </span>
                        )}
                        {proposal.status === "accepted" && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/30 text-green-200 font-semibold flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" /> مقبول
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Price — featured metric */}
                    <div className={`px-4 py-4 text-center ${isCheapest ? "bg-green-50" : "bg-slate-50/50"}`}>
                      <p className="text-xs text-slate-500 mb-1">السعر المعروض</p>
                      <p className={`text-2xl font-bold ${isCheapest ? "text-green-700" : "text-[#1a1a2e]"}`}>
                        {proposal.price?.toLocaleString()}
                        <span className="text-sm font-normal text-slate-400 mr-1">ر.س</span>
                      </p>
                      {isCheapest && (
                        <p className="text-[10px] text-green-600 font-semibold mt-0.5 flex items-center justify-center gap-1">
                          <TrendingDown className="w-3 h-3" />
                          وفّر {Math.max(...proposals.map(p => p.price || 0)) - proposal.price} ر.س
                        </p>
                      )}
                    </div>

                    {/* Metrics */}
                    <div className="flex-1 divide-y divide-slate-50">
                      <MetricRow
                        icon={<Clock className="w-4 h-4 text-blue-500" />}
                        label="مدة التسليم"
                        highlight={isFastest}
                      >
                        {proposal.delivery_days || "—"} يوم
                      </MetricRow>

                      <MetricRow
                        icon={<Star className="w-4 h-4 text-amber-500 fill-amber-400" />}
                        label="التقييم العام"
                        highlight={isTopRated}
                      >
                        <div className="flex items-center gap-1">
                          <div className="flex">
                            {[1, 2, 3, 4, 5].map(s => (
                              <Star key={s} className={`w-3.5 h-3.5 ${s <= Math.round(engineer?.rating || 0) ? "fill-amber-400 text-amber-400" : "text-slate-200"}`} />
                            ))}
                          </div>
                          <span className="text-xs text-slate-500">({engineer?.rating?.toFixed(1) || "0.0"} • {engineer?.total_reviews || 0} تقييم)</span>
                        </div>
                      </MetricRow>

                      <MetricRow
                        icon={<Briefcase className="w-4 h-4 text-purple-500" />}
                        label="سنوات الخبرة"
                        highlight={isMostExp}
                      >
                        {engineer?.years_experience ? `${engineer.years_experience} سنة` : "غير محدد"}
                      </MetricRow>

                      <MetricRow
                        icon={<CheckCircle className="w-4 h-4 text-teal-500" />}
                        label="مشاريع مكتملة"
                        highlight={(engineer?.completed_projects || 0) === maxCompleted && maxCompleted > 0}
                      >
                        {engineer?.completed_projects || 0} مشروع
                      </MetricRow>

                      <MetricRow
                        icon={<Calendar className="w-4 h-4 text-rose-500" />}
                        label="تاريخ التقديم"
                      >
                        {new Date(proposal.created_date).toLocaleDateString("ar-SA", { year: "numeric", month: "short", day: "numeric" })}
                      </MetricRow>

                      {/* Cover letter */}
                      {proposal.cover_letter && (
                        <div className="px-4 py-3 border-t border-slate-100">
                          <div className="flex items-center gap-2 mb-1.5">
                            <MessageSquare className="w-4 h-4 text-orange-500" />
                            <span className="text-xs font-medium text-slate-500">رسالة العرض</span>
                          </div>
                          <p className="text-xs text-slate-600 leading-relaxed line-clamp-4">
                            {proposal.cover_letter}
                          </p>
                        </div>
                      )}

                      {/* Milestones */}
                      {proposal.custom_milestones?.length > 0 && (
                        <div className="px-4 py-3 border-t border-slate-100">
                          <div className="flex items-center gap-2 mb-2">
                            <Award className="w-4 h-4 text-[#C9A66B]" />
                            <span className="text-xs font-medium text-slate-500">مراحل التنفيذ ({proposal.custom_milestones.length})</span>
                          </div>
                          <div className="space-y-1.5">
                            {proposal.custom_milestones.slice(0, 4).map((m, i) => (
                              <div key={i} className="flex items-center gap-2 text-xs">
                                <span className="w-5 h-5 rounded-full bg-[#C9A66B]/20 text-[#C9A66B] flex items-center justify-center font-bold shrink-0">
                                  {i + 1}
                                </span>
                                <span className="text-slate-600 truncate">{m.title || m.name || `مرحلة ${i + 1}`}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="p-4 border-t border-slate-100 space-y-2 bg-white">
                      {proposal.status === "accepted" ? (
                        <Badge className="w-full justify-center bg-green-100 text-green-700 py-2">
                          <CheckCircle className="w-4 h-4 ml-1" /> تم قبول هذا العرض
                        </Badge>
                      ) : (
                        <>
                          <Button
                            className="w-full bg-gradient-to-r from-[#1a1a2e] to-[#C9A66B] text-white"
                            disabled={acceptingId === proposal.id}
                            onClick={() => handleAccept(proposal.id)}
                          >
                            {acceptingId === proposal.id ? (
                              <><Loader2 className="w-4 h-4 animate-spin ml-1" /> جاري القبول...</>
                            ) : (
                              <><CheckCircle className="w-4 h-4 ml-1" /> قبول هذا العرض</>
                            )}
                          </Button>
                          <Link to={`/Messages?engineer=${proposal.engineer_id}&project=${projectId}`} className="block">
                            <Button variant="outline" className="w-full text-blue-600 border-blue-200 hover:bg-blue-50">
                              <MessageSquare className="w-4 h-4 ml-1" /> محادثة
                            </Button>
                          </Link>
                          <Link to={`/EngineerProfile?id=${proposal.engineer_id}`} className="block">
                            <Button variant="ghost" className="w-full text-slate-600">
                              <User className="w-4 h-4 ml-1" /> عرض الملف الكامل
                            </Button>
                          </Link>
                        </>
                      )}
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Hint */}
        <p className="text-center text-xs text-slate-400 mt-4">
          ⭐ القيم المميزة بالأخضر تشير إلى الأفضل في كل معيار لتسهيل قرارك
        </p>
      </div>
    </div>
  );
}