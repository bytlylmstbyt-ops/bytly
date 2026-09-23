import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { supabase } from "@/lib/supabaseClient";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Briefcase, Wallet, Star, Bell, FileText, ShieldAlert, Settings,
  Plus, CheckCircle2, Clock3, MapPin, Mail, Phone, Award, Image as ImageIcon,
  CalendarDays, ArrowLeft
} from "lucide-react";

const ROLE_LABELS = {
  engineer: "مهندس / مهندسة",
  client: "مالك مشروع / عميل",
  contractor: "مقاول / شركة مقاولات",
  supplier: "مورد",
  consultant: "استشاري",
  legal_consultant: "مستشار قانوني",
  engineering_firm: "مكتب / شركة هندسية",
  firm: "مكتب / شركة هندسية",
  investor: "مستثمر / مطور",
  user: "مستخدم",
  admin: "مشرف"
};

const safe = (value, fallback = "—") => value === null || value === undefined || value === "" ? fallback : value;
const money = (value) => Number(value || 0).toLocaleString("ar-SA");

function StatCard({ icon: Icon, title, value, subtitle }) {
  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm text-slate-500">{title}</p>
            <p className="text-2xl font-bold text-[#1a1a2e] mt-1">{value}</p>
            {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
          </div>
          <div className="w-11 h-11 rounded-xl bg-amber-50 flex items-center justify-center">
            <Icon className="w-5 h-5 text-[#C9A66B]" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function UnifiedUserDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [entity, setEntity] = useState(null);
  const [entityType, setEntityType] = useState(user?.role || "user");
  const [projects, setProjects] = useState([]);
  const [portfolio, setPortfolio] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [disputes, setDisputes] = useState([]);
  const [wallet, setWallet] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!user?.id || !supabase) return;
      setLoading(true);
      setError("");
      try {
        const uid = user.id;
        const queries = [
          ["engineer", "engineers", { user_id: uid }],
          ["client", "clients", { user_id: uid }],
          ["contractor", "contractors", { user_id: uid }],
          ["supplier", "suppliers", { user_id: uid }],
          ["consultant", "consultants", { user_id: uid }],
          ["legal_consultant", "legal_consultants", { user_id: uid }],
          ["engineering_firm", "engineering_firms", { owner_user_id: uid }]
        ];

        let found = null;
        for (const [type, table, filter] of queries) {
          const { data, error: queryError } = await supabase.from(table).select("*").match(filter).limit(1);
          if (queryError) throw queryError;
          if (data?.[0]) { found = { type, data: data[0] }; break; }
        }

        const profile = { ...user };
        if (!cancelled) {
          setEntity(found?.data || profile);
          setEntityType(found?.type || user.role || "user");
        }

        const projectQuery = (() => {
          if (found?.type === "engineer") return supabase.from("projects").select("*").eq("assigned_engineer_id", found.data.id).order("created_at", { ascending: false }).limit(20);
          if (found?.type === "client") return supabase.from("projects").select("*").eq("client_user_id", uid).order("created_at", { ascending: false }).limit(20);
          if (found?.type === "contractor") return supabase.from("projects").select("*").eq("assigned_contractor_id", found.data.id).order("created_at", { ascending: false }).limit(20);
          if (found?.type === "supplier") return supabase.from("projects").select("*").eq("assigned_supplier_id", found.data.id).order("created_at", { ascending: false }).limit(20);
          return supabase.from("project_members").select("project_id, role, status, projects(*)").eq("user_id", uid).order("created_at", { ascending: false }).limit(20);
        })();

        const [projectResult, notificationResult, disputeResult, walletResult] = await Promise.all([
          projectQuery,
          supabase.from("notifications").select("*").eq("user_id", uid).order("created_at", { ascending: false }).limit(8),
          supabase.from("disputes").select("*").or("opened_by.eq." + uid + ",against_user_id.eq." + uid).order("created_at", { ascending: false }).limit(8),
          supabase.from("wallet_accounts").select("*").eq("user_id", uid).maybeSingle()
        ]);

        if (projectResult.error) throw projectResult.error;
        const normalizedProjects = (projectResult.data || []).map(row => row.projects ? row.projects : row);
        if (!cancelled) {
          setProjects(normalizedProjects);
          setNotifications(notificationResult.data || []);
          setDisputes(disputeResult.data || []);
          setWallet(walletResult.data || null);
        }

        if (found?.type === "engineer") {
          const portfolioResult = await supabase.from("portfolios").select("*").eq("engineer_id", found.data.id).order("created_at", { ascending: false }).limit(8);
          if (!cancelled) setPortfolio(portfolioResult.data || []);
        }
      } catch (e) {
        console.error("Dashboard load failed", e);
        if (!cancelled) setError("تعذر تحميل بعض بيانات اللوحة. يمكنك تحديث الصفحة والمحاولة مرة أخرى.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [user]);

  const stats = useMemo(() => {
    const completed = projects.filter(p => ["completed", "closed"].includes(p.status || p.lifecycle_status)).length;
    const active = projects.filter(p => ["in_progress", "assigned", "contracted"].includes(p.status || p.lifecycle_status)).length;
    const open = projects.filter(p => ["open", "published", "offers_received"].includes(p.status || p.lifecycle_status)).length;
    return { total: projects.length, completed, active, open };
  }, [projects]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="w-10 h-10 rounded-full border-4 border-slate-200 border-t-[#C9A66B] animate-spin" /></div>;
  }

  const name = safe(entity?.full_name || entity?.company_name || user?.full_name || user?.email, "مستخدم بيتلي");
  const role = ROLE_LABELS[entityType] || ROLE_LABELS[user?.role] || "مستخدم";
  const image = entity?.profile_image;
  const unread = notifications.filter(n => !n.read_at).length;
  const balance = wallet?.available_balance ?? entity?.wallet_balance ?? 0;
  const specialization = entity?.specialization || entity?.engineering_specialization || entity?.legal_specialization || entity?.consultant_kind || entity?.contractor_type || entity?.supplier_type;
  const city = entity?.city;
  const verified = entity?.is_verified || entity?.verification_status === "verified" || entity?.status === "approved";

  return (
    <div dir="rtl" className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-amber-50/30 py-7">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <Card className="overflow-hidden border-0 shadow-sm">
          <div className="h-28 bg-gradient-to-l from-[#1a1a2e] via-[#332d35] to-[#C9A66B]" />
          <CardContent className="relative pt-0">
            <div className="-mt-12 flex flex-col md:flex-row md:items-end gap-4">
              <Avatar className="w-24 h-24 border-4 border-white shadow-lg bg-white">
                <AvatarImage src={image || ""} />
                <AvatarFallback className="bg-[#1a1a2e] text-white text-2xl">{name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 pb-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-bold text-[#1a1a2e]">{name}</h1>
                  {verified && <Badge className="bg-green-100 text-green-700 hover:bg-green-100"><CheckCircle2 className="w-3 h-3 ml-1" /> موثق</Badge>}
                </div>
                <p className="text-slate-500 mt-1">{role}{specialization ? " • " + specialization : ""}</p>
                <div className="flex flex-wrap gap-4 text-xs text-slate-500 mt-2">
                  {city && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{city}</span>}
                  {user?.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{user.email}</span>}
                  {entity?.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{entity.phone}</span>}
                </div>
              </div>
              <div className="flex gap-2 pb-1">
                <Link to={createPageUrl("Settings")}><Button variant="outline"><Settings className="w-4 h-4 ml-2" /> الإعدادات</Button></Link>
                <Link to={createPageUrl(entityType === "engineer" ? "AddPortfolio" : "CreateProject")}>
                  <Button className="bg-gradient-to-r from-[#1a1a2e] to-[#C9A66B] text-white">
                    <Plus className="w-4 h-4 ml-2" /> {entityType === "engineer" ? "إضافة عمل" : "مشروع جديد"}
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        {error && <Card className="border-red-200 bg-red-50"><CardContent className="p-4 text-red-700">{error}</CardContent></Card>}

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={Briefcase} title="إجمالي المشاريع" value={stats.total} />
          <StatCard icon={Clock3} title="المشاريع النشطة" value={stats.active} />
          <StatCard icon={CheckCircle2} title="المشاريع المكتملة" value={stats.completed} />
          <StatCard icon={Wallet} title="الرصيد المتاح" value={money(balance)} subtitle="ريال سعودي" />
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 border-0 shadow-sm">
            <CardHeader><CardTitle className="flex items-center gap-2"><Briefcase className="w-5 h-5 text-[#C9A66B]" /> مشاريعي</CardTitle></CardHeader>
            <CardContent>
              {projects.length === 0 ? (
                <div className="py-12 text-center text-slate-500"><Briefcase className="w-10 h-10 mx-auto mb-3 text-slate-300" /><p>لا توجد مشاريع مرتبطة بحسابك حالياً.</p></div>
              ) : (
                <div className="space-y-3">{projects.slice(0, 6).map(project => (
                  <Link key={project.id} to={createPageUrl("ProjectDetails") + "?id=" + project.id} className="block rounded-xl border p-4 hover:border-[#C9A66B] transition">
                    <div className="flex items-center justify-between gap-4">
                      <div><p className="font-semibold text-slate-900">{safe(project.title, "مشروع بدون اسم")}</p><p className="text-xs text-slate-500 mt-1">{safe(project.location)} {project.category ? " • " + project.category : ""}</p></div>
                      <Badge variant="secondary">{safe(project.lifecycle_status || project.status, "جديد")}</Badge>
                    </div>
                    <div className="flex justify-between text-xs text-slate-500 mt-3"><span>{project.phase ? "المرحلة: " + project.phase : ""}</span><span>{project.phase_progress ?? 0}%</span></div>
                  </Link>
                ))}</div>
              )}
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="border-0 shadow-sm">
              <CardHeader><CardTitle className="flex items-center gap-2"><Bell className="w-5 h-5 text-[#C9A66B]" /> الإشعارات {unread > 0 && <Badge>{unread}</Badge>}</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {notifications.length === 0 ? <p className="text-sm text-slate-500">لا توجد إشعارات جديدة.</p> : notifications.slice(0, 5).map(n => <div key={n.id} className="border-b pb-3 last:border-0"><p className="font-medium text-sm">{safe(n.title)}</p><p className="text-xs text-slate-500 mt-1">{safe(n.body)}</p></div>)}
                <Link to={createPageUrl("Notifications")} className="text-sm text-[#8b6b35] flex items-center gap-1">عرض كل الإشعارات <ArrowLeft className="w-3 h-3" /></Link>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardHeader><CardTitle className="flex items-center gap-2"><ShieldAlert className="w-5 h-5 text-[#C9A66B]" /> النزاعات</CardTitle></CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{disputes.length}</p>
                <p className="text-xs text-slate-500 mb-3">نزاع مرتبط بحسابك</p>
                <Link to={createPageUrl("MyDisputes")}><Button variant="outline" className="w-full">إدارة النزاعات</Button></Link>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <Link to={createPageUrl("MyContracts")}><Card className="hover:border-[#C9A66B] transition"><CardContent className="p-5 flex items-center gap-3"><FileText className="w-5 h-5 text-[#C9A66B]" /><span className="font-medium">العقود والاتفاقيات</span></CardContent></Card></Link>
          <Link to={createPageUrl("Wallet")}><Card className="hover:border-[#C9A66B] transition"><CardContent className="p-5 flex items-center gap-3"><Wallet className="w-5 h-5 text-[#C9A66B]" /><span className="font-medium">المحفظة والمعاملات</span></CardContent></Card></Link>
          <Link to={createPageUrl("FileDispute")}><Card className="hover:border-[#C9A66B] transition"><CardContent className="p-5 flex items-center gap-3"><ShieldAlert className="w-5 h-5 text-[#C9A66B]" /><span className="font-medium">تقديم نزاع</span></CardContent></Card></Link>
        </div>

        {entityType === "engineer" && (
          <Card className="border-0 shadow-sm">
            <CardHeader><CardTitle className="flex items-center gap-2"><ImageIcon className="w-5 h-5 text-[#C9A66B]" /> معرض أعمالي <span className="text-sm font-normal text-slate-400">({portfolio.length})</span></CardTitle></CardHeader>
            <CardContent>
              {portfolio.length === 0 ? <p className="text-sm text-slate-500">لم تتم إضافة أعمال بعد.</p> : <div className="grid grid-cols-2 md:grid-cols-4 gap-4">{portfolio.map(item => {
                const imgs = Array.isArray(item.images) ? item.images : [];
                const src = imgs[0] || (typeof imgs[0] === "object" ? imgs[0]?.url : "") || "";
                return <div key={item.id} className="rounded-xl overflow-hidden border bg-slate-50"><div className="aspect-video bg-slate-100 flex items-center justify-center">{src ? <img src={src} alt={item.title || "عمل"} className="w-full h-full object-cover" /> : <ImageIcon className="w-8 h-8 text-slate-300" />}</div><p className="p-3 text-sm font-medium truncate">{safe(item.title)}</p></div>;
              })}</div>}
            </CardContent>
          </Card>
        )}

        <Card className="border-0 shadow-sm">
          <CardHeader><CardTitle className="flex items-center gap-2"><Award className="w-5 h-5 text-[#C9A66B]" /> بيانات الحساب</CardTitle></CardHeader>
          <CardContent className="grid md:grid-cols-3 gap-5 text-sm">
            <div><p className="text-slate-400">نوع الحساب</p><p className="font-medium mt-1">{role}</p></div>
            <div><p className="text-slate-400">الحالة</p><p className="font-medium mt-1">{safe(entity?.status, "نشط")}</p></div>
            <div><p className="text-slate-400">التقييم</p><p className="font-medium mt-1 flex items-center gap-1"><Star className="w-4 h-4 text-amber-500" /> {safe(entity?.rating, "—")}</p></div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
