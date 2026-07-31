import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Star, BarChart2, MessageSquare, Plus, Award, Clock, Shield, Loader2 } from "lucide-react";
import EngineerPerformanceCharts from "@/components/reviews/EngineerPerformanceCharts";
import DetailedReviewForm from "@/components/reviews/DetailedReviewForm";

const CRITERIA = [
  { key: "quality_rating",        label: "الجودة",       color: "#10b981" },
  { key: "delivery_rating",       label: "الوقت",        color: "#3b82f6" },
  { key: "communication_rating",  label: "التواصل",     color: "#8b5cf6" },
  { key: "professionalism_rating",label: "الاحترافية",  color: "#f59e0b" },
];

const MiniBar = ({ value, color }) => (
  <div className="flex items-center gap-2">
    <div className="flex-1 h-1.5 bg-slate-100 rounded-full">
      <div className="h-full rounded-full transition-all" style={{ width: `${(value / 5) * 100}%`, backgroundColor: color }} />
    </div>
    <span className="text-xs text-slate-500 w-4">{value || "—"}</span>
  </div>
);

const ReviewCard = ({ review }) => {
  const [expanded, setExpanded] = useState(false);
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-5">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              <Avatar className="w-10 h-10">
                <AvatarFallback className="bg-gradient-to-br from-[#1a1a2e] to-[#C9A66B] text-white text-sm">
                  {review.client_email?.charAt(0)?.toUpperCase() || "?"}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium text-slate-800 text-sm">{review.client_email?.split("@")[0] || "عميل"}</p>
                <p className="text-xs text-slate-400">{new Date(review.created_date).toLocaleDateString("ar-SA")}</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {[1,2,3,4,5].map(s => (
                <Star key={s} className={`w-4 h-4 ${s <= Math.round(review.rating) ? "text-amber-400 fill-amber-400" : "text-slate-200"}`} />
              ))}
              <span className="font-bold text-slate-700 mr-1">{review.rating?.toFixed(1)}</span>
            </div>
          </div>

          {/* Criteria mini bars */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 mb-3">
            {CRITERIA.map(c => (
              <div key={c.key}>
                <div className="flex justify-between text-xs text-slate-500 mb-0.5">
                  <span>{c.label}</span>
                </div>
                <MiniBar value={review[c.key]} color={c.color} />
              </div>
            ))}
          </div>

          {review.comment && (
            <div>
              <p className={`text-sm text-slate-600 leading-relaxed ${!expanded && "line-clamp-2"}`}>{review.comment}</p>
              {review.comment.length > 100 && (
                <button onClick={() => setExpanded(!expanded)} className="text-xs text-[#C9A66B] mt-1 hover:underline">
                  {expanded ? "عرض أقل" : "عرض المزيد"}
                </button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default function EngineerReviews() {
  const urlParams = new URLSearchParams(window.location.search);
  const engineerId = urlParams.get("id");

  const [engineer, setEngineer] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [canReview, setCanReview] = useState(false);
  const [user, setUser] = useState(null);
  const [projectId, setProjectId] = useState(null);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    if (!engineerId) { setLoading(false); return; }
    const [eng, revs] = await Promise.all([
      base44.entities.Engineer.filter({ id: engineerId }),
      base44.entities.Review.filter({ engineer_id: engineerId }, "-created_date", 50),
    ]);
    setEngineer(eng[0]);
    setReviews(revs);

    // Check if logged-in user can review
    const authenticated = await base44.auth.isAuthenticated();
    if (authenticated) {
      const u = await base44.auth.me();
      setUser(u);
      const projects = await base44.entities.Project.filter({ assigned_engineer_id: engineerId });
      const clientProjects = projects.filter(p => p.status === "completed" && p.client_id === u.id);
      if (clientProjects.length > 0) {
        const alreadyReviewed = revs.some(r => r.client_id === u.id && r.project_id === clientProjects[0].id);
        setCanReview(!alreadyReviewed);
        setProjectId(clientProjects[0].id);
      }
    }
    setLoading(false);
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-[#C9A66B]" />
    </div>
  );

  if (!engineer) return (
    <div className="min-h-screen flex items-center justify-center text-slate-500" dir="rtl">
      لم يتم العثور على المهندس
    </div>
  );

  const overallAvg = reviews.length
    ? (reviews.reduce((s, r) => s + (r.rating || 0), 0) / reviews.length).toFixed(1)
    : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-amber-50/30 py-8" dir="rtl">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-bold text-[#1a1a2e] flex items-center gap-2">
                <BarChart2 className="w-7 h-7 text-[#C9A66B]" />
                تقييمات {engineer.full_name}
              </h1>
              <p className="text-slate-500 text-sm mt-1">{engineer.specialization} — {reviews.length} تقييم</p>
            </div>
            <div className="flex items-center gap-3">
              {overallAvg && (
                <div className="bg-gradient-to-br from-[#1a1a2e] to-[#2d2d4e] rounded-xl px-5 py-3 text-center">
                  <p className="text-3xl font-bold text-[#C9A66B]">{overallAvg}</p>
                  <div className="flex gap-0.5 justify-center mt-1">
                    {[1,2,3,4,5].map(s => <Star key={s} className={`w-3 h-3 ${s <= Math.round(overallAvg) ? "text-[#C9A66B] fill-[#C9A66B]" : "text-white/20"}`} />)}
                  </div>
                </div>
              )}
              {canReview && (
                <Button onClick={() => setShowReviewModal(true)}
                  className="bg-gradient-to-r from-[#1a1a2e] to-[#C9A66B] text-white gap-2">
                  <Plus className="w-4 h-4" />
                  أضف تقييم
                </Button>
              )}
            </div>
          </div>
        </motion.div>

        <Tabs defaultValue="charts" className="space-y-6">
          <TabsList className="bg-white shadow-sm">
            <TabsTrigger value="charts" className="gap-2">
              <BarChart2 className="w-4 h-4" />
              الأداء والرسوم البيانية
            </TabsTrigger>
            <TabsTrigger value="reviews" className="gap-2">
              <MessageSquare className="w-4 h-4" />
              التقييمات ({reviews.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="charts">
            <EngineerPerformanceCharts reviews={reviews} />
          </TabsContent>

          <TabsContent value="reviews">
            <div className="space-y-4">
              {reviews.length === 0 ? (
                <div className="text-center py-16 text-slate-400">
                  <Star className="w-16 h-16 mx-auto mb-3 opacity-20" />
                  <p>لا توجد تقييمات بعد</p>
                </div>
              ) : (
                reviews.map(r => <ReviewCard key={r.id} review={r} />)
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Review Modal */}
      <Dialog open={showReviewModal} onOpenChange={setShowReviewModal}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle>تقييم المهندس</DialogTitle>
          </DialogHeader>
          <DetailedReviewForm
            engineerId={engineerId}
            projectId={projectId}
            engineerName={engineer.full_name}
            onSuccess={() => { setShowReviewModal(false); loadData(); }}
            onCancel={() => setShowReviewModal(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}