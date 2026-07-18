import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Star, Search, User, Building2, Package, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import ServiceReviewForm from "@/components/reviews/ServiceReviewForm";

const TARGET_TABS = [
  { key: "engineer", label: "المهندسون", entity: "Engineer", icon: User, nameField: "full_name", subField: "specialization" },
  { key: "contractor", label: "المقاولون", entity: "Contractor", icon: Building2, nameField: "company_name", subField: "specialization" },
  { key: "supplier", label: "الموردون", entity: "Supplier", icon: Package, nameField: "company_name", subField: "specialization" },
];

function ProviderCard({ provider, tab, onReview, alreadyReviewed }) {
  const name = provider[tab.nameField] || "غير محدد";
  const subtitle = provider[tab.subField] || provider.city || "";

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4 flex items-center gap-3">
        <Avatar className="w-12 h-12 shrink-0">
          <AvatarImage src={provider.profile_image || provider.company_logo} />
          <AvatarFallback className="bg-gradient-to-br from-[#6B5D4F] to-[#C9A66B] text-white">
            {name?.charAt(0)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-slate-800 truncate">{name}</p>
          {subtitle && <p className="text-sm text-slate-500 truncate">{subtitle}</p>}
          <div className="flex items-center gap-1 mt-1">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <span className="text-sm font-medium text-slate-600">
              {provider.rating?.toFixed(1) || "0.0"}
            </span>
            <span className="text-xs text-slate-400">({provider.total_reviews || 0} تقييم)</span>
          </div>
        </div>
        {alreadyReviewed ? (
          <Badge className="bg-green-100 text-green-700 shrink-0">تم التقييم</Badge>
        ) : (
          <Button
            size="sm"
            className="bg-gradient-to-r from-[#6B5D4F] to-[#C9A66B] text-white shrink-0"
            onClick={() => onReview(provider)}
          >
            <Star className="w-4 h-4 ml-1" />
            تقييم
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

function ReviewCard({ review }) {
  const typeLabels = { engineer: "مهندس", contractor: "مقاول", supplier: "مورد" };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-slate-800">{review.target_name || "مقدم خدمة"}</p>
            <Badge variant="secondary" className="text-xs">
              {typeLabels[review.target_type] || review.target_type}
            </Badge>
          </div>
          <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map(s => (
              <Star
                key={s}
                className={`w-4 h-4 ${s <= review.rating ? "fill-amber-400 text-amber-400" : "text-slate-200"}`}
              />
            ))}
          </div>
        </div>
        {review.comment && (
          <p className="text-sm text-slate-600 mt-2 whitespace-pre-wrap">{review.comment}</p>
        )}
        <p className="text-xs text-slate-400 mt-2">
          {new Date(review.created_date).toLocaleDateString("ar-SA")}
        </p>
      </CardContent>
    </Card>
  );
}

export default function ServiceReviews() {
  const { toast } = useToast();
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [activeTab, setActiveTab] = useState("engineer");
  const [search, setSearch] = useState("");
  const [providers, setProviders] = useState([]);
  const [loadingProviders, setLoadingProviders] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [pendingReviews, setPendingReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [reviewDialog, setReviewDialog] = useState({ open: false, provider: null, pending: null });

  useEffect(() => {
    base44.auth.me()
      .then(u => { setUser(u); })
      .catch(() => {})
      .finally(() => setLoadingUser(false));
  }, []);

  const fetchProviders = useCallback(async (tabKey) => {
    const tab = TARGET_TABS.find(t => t.key === tabKey);
    if (!tab) return;
    setLoadingProviders(true);
    try {
      const list = await base44.entities[tab.entity].list("-rating", 50);
      setProviders(list);
    } catch {
      toast({ title: "تعذر تحميل القائمة", variant: "destructive" });
    } finally {
      setLoadingProviders(false);
    }
  }, [toast]);

  const fetchReviews = useCallback(async () => {
    if (!user) return;
    setLoadingReviews(true);
    try {
      const list = await base44.entities.Review.filter(
        { client_id: user.id },
        "-created_date",
        50
      );
      setReviews(list.filter(r => r.status === 'completed'));
      setPendingReviews(list.filter(r => r.status === 'pending_response'));
    } catch {
      try {
        const list = await base44.entities.Review.list("-created_date", 200);
        const mine = list.filter(r => r.client_id === user.id);
        setReviews(mine.filter(r => r.status === 'completed'));
        setPendingReviews(mine.filter(r => r.status === 'pending_response'));
      } catch {}
    } finally {
      setLoadingReviews(false);
    }
  }, [user]);

  useEffect(() => {
    fetchProviders(activeTab);
  }, [activeTab, fetchProviders]);

  useEffect(() => {
    if (user) fetchReviews();
  }, [user, fetchReviews]);

  const currentTab = TARGET_TABS.find(t => t.key === activeTab);
  const filteredProviders = providers.filter(p => {
    if (!search) return true;
    const q = search.toLowerCase();
    const name = (p[currentTab.nameField] || "").toLowerCase();
    const sub = (p[currentTab.subField] || "").toLowerCase();
    const city = (p.city || "").toLowerCase();
    return name.includes(q) || sub.includes(q) || city.includes(q);
  });

  const reviewedTargetIds = new Set(
    reviews
      .filter(r => r.target_type === activeTab)
      .map(r => r.engineer_id || r.contractor_id || r.supplier_id)
  );

  const handleReviewSubmitted = () => {
    setReviewDialog({ open: false, provider: null, pending: null });
    fetchReviews();
    fetchProviders(activeTab);
    toast({ title: "تم إرسال تقييمك بنجاح" });
  };

  const handleCompletePending = (pending) => {
    const tabKey = pending.target_type;
    const tab = TARGET_TABS.find(t => t.key === tabKey);
    if (!tab) return;
    setActiveTab(tabKey);
    setReviewDialog({
      open: true,
      provider: {
        id: pending.contractor_id || pending.supplier_id || pending.engineer_id,
        [tab.nameField]: pending.target_name
      },
      pending
    });
  };

  if (loadingUser) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-[#C9A66B] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6" dir="rtl">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-[#4A3F35]">تقييم الخدمات</h1>
        <p className="text-slate-500 mt-1">قيّم تجربتك مع المهندسين والمقاولين والموردين لضمان جودة العمل</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3 w-full">
          {TARGET_TABS.map(tab => {
            const Icon = tab.icon;
            return (
              <TabsTrigger key={tab.key} value={tab.key} className="flex items-center gap-1.5">
                <Icon className="w-4 h-4" />
                {tab.label}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {TARGET_TABS.map(tab => (
          <TabsContent key={tab.key} value={tab.key} className="space-y-4 mt-4">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder={`ابحث عن ${tab.label}...`}
                value={activeTab === tab.key ? search : ""}
                onChange={e => setSearch(e.target.value)}
                className="pr-10"
              />
            </div>

            {loadingProviders ? (
              <div className="flex justify-center py-12">
                <div className="w-8 h-8 border-4 border-slate-200 border-t-[#C9A66B] rounded-full animate-spin" />
              </div>
            ) : filteredProviders.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>لا يوجد {tab.label} متاحون حالياً</p>
              </div>
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {filteredProviders.map(provider => (
                  <ProviderCard
                    key={provider.id}
                    provider={provider}
                    tab={tab}
                    onReview={(p) => setReviewDialog({ open: true, provider: p })}
                    alreadyReviewed={reviewedTargetIds.has(provider.id)}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* Pending Reviews (from completed milestones) */}
      {pendingReviews.length > 0 && (
        <Card className="border-amber-200 bg-amber-50/50">
          <CardContent className="p-4 space-y-3">
            <h2 className="font-bold text-[#4A3F35] flex items-center gap-2">
              <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
              تقييمات بانتظارك ({pendingReviews.length})
            </h2>
            <p className="text-sm text-slate-500">أكملت مراحل عمل — شارك رأيك في جودة العمل وسرعة الإنجاز</p>
            <div className="space-y-2">
              {pendingReviews.map(pr => (
                <div key={pr.id} className="flex items-center justify-between bg-white rounded-lg p-3 border border-amber-100">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-800 truncate">{pr.target_name || "مقدم خدمة"}</p>
                    <p className="text-xs text-slate-500">
                      {pr.milestone_title ? `مرحلة: ${pr.milestone_title}` : ""}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    className="bg-gradient-to-r from-[#6B5D4F] to-[#C9A66B] text-white shrink-0"
                    onClick={() => handleCompletePending(pr)}
                  >
                    <Star className="w-4 h-4 ml-1" />
                    قيّم الآن
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* My Reviews History */}
      <div className="pt-4">
        <h2 className="text-lg font-bold text-[#4A3F35] mb-3 flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          تقييماتي السابقة
        </h2>
        {loadingReviews ? (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-4 border-slate-200 border-t-[#C9A66B] rounded-full animate-spin" />
          </div>
        ) : reviews.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-slate-400">
              <Star className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <p>لم تقم بأي تقييمات بعد</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {reviews.map(r => <ReviewCard key={r.id} review={r} />)}
          </div>
        )}
      </div>

      {/* Review Dialog */}
      {reviewDialog.provider && user && (
        <ServiceReviewForm
          targetType={activeTab}
          targetId={reviewDialog.provider.id}
          targetName={reviewDialog.provider[currentTab.nameField]}
          milestoneId={reviewDialog.pending?.milestone_id}
          milestoneTitle={reviewDialog.pending?.milestone_title}
          projectId={reviewDialog.pending?.project_id}
          open={reviewDialog.open}
          onOpenChange={(open) => setReviewDialog({ open, provider: open ? reviewDialog.provider : null, pending: open ? reviewDialog.pending : null })}
          onSubmitted={handleReviewSubmitted}
        />
      )}
    </div>
  );
}