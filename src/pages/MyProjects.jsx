import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { supabase } from "@/lib/supabaseClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { BriefcaseBusiness, Plus, RefreshCw, Search, Eye, FileText, MessageCircle, FolderKanban, Clock3, CheckCircle2, AlertCircle } from "lucide-react";

const STATUS = {
  open: { label: "يستقبل عروضًا", className: "bg-emerald-100 text-emerald-800" },
  in_progress: { label: "قيد التنفيذ", className: "bg-blue-100 text-blue-800" },
  completed: { label: "مكتمل", className: "bg-slate-100 text-slate-700" },
  cancelled: { label: "ملغي", className: "bg-rose-100 text-rose-800" },
  pending: { label: "بانتظار المراجعة", className: "bg-amber-100 text-amber-800" },
};

export default function MyProjects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const loadProjects = useCallback(async (refresh = false) => {
    setError("");
    refresh ? setRefreshing(true) : setLoading(true);
    try {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      const user = authData?.user;
      if (!user?.id) {
        setProjects([]);
        setError("سجّل الدخول أولًا لعرض مشاريعك.");
        return;
      }

      const { data: client } = await supabase.from("clients").select("id").eq("user_id", user.id).maybeSingle();
      let query = supabase.from("projects").select("*").order("created_at", { ascending: false });
      if (client?.id) {
        query = query.or(`client_id.eq.${client.id},client_user_id.eq.${user.id}`);
      } else {
        query = query.eq("client_user_id", user.id);
      }
      const { data, error: queryError } = await query;
      if (queryError) throw queryError;
      setProjects(data || []);
    } catch (e) {
      console.error("Unable to load projects", e);
      setError("تعذّر تحميل المشاريع الآن. حاول تحديث الصفحة، وإذا استمرت المشكلة تواصل مع الدعم.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadProjects(); }, [loadProjects]);

  const filtered = useMemo(() => projects.filter((project) => {
    const term = search.trim().toLowerCase();
    const matchesSearch = !term || [project.title, project.name, project.description, project.location].some((value) => String(value || "").toLowerCase().includes(term));
    return matchesSearch && (filter === "all" || String(project.status || "pending") === filter);
  }), [projects, search, filter]);

  const count = (status) => projects.filter((project) => String(project.status || "pending") === status).length;
  const money = (value) => value == null || value === "" ? "غير محدد" : `${Number(value).toLocaleString("ar-SA")} ر.س`;

  return (
    <div dir="rtl" className="min-h-screen bg-[#F7F4EE] py-6 md:py-10">
      <div className="mx-auto max-w-7xl space-y-6 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="mb-2 text-sm font-medium text-[#9A743B]">مساحة عملك في بيتلي</p>
            <h1 className="text-3xl font-bold text-[#332719]">إدارة مشاريعي</h1>
            <p className="mt-2 text-sm text-slate-600">تابع تفاصيل مشاريعك وحالتها وميزانياتها، وانتقل إلى الإجراءات المتاحة لكل مشروع.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => loadProjects(true)} disabled={refreshing}>
              <RefreshCw className={`ml-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} /> تحديث البيانات
            </Button>
            <Link to={createPageUrl("CreateProject")}>
              <Button className="bg-[#9A743B] text-white hover:bg-[#7F5E2D]"><Plus className="ml-2 h-4 w-4" /> أضف مشروعًا</Button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {[
            { label: "كل المشاريع", value: projects.length, icon: FolderKanban },
            { label: "تستقبل عروضًا", value: count("open"), icon: BriefcaseBusiness },
            { label: "قيد التنفيذ", value: count("in_progress"), icon: Clock3 },
            { label: "مكتملة", value: count("completed"), icon: CheckCircle2 },
          ].map((item) => {
            const Icon = item.icon;
            return <Card key={item.label} className="border-[#E8DFD0] shadow-sm"><CardContent className="flex items-center gap-3 p-4"><div className="rounded-xl bg-[#F1E6D2] p-3 text-[#8B6836]"><Icon className="h-5 w-5" /></div><div><p className="text-sm text-slate-500">{item.label}</p><p className="text-2xl font-bold text-[#332719]">{item.value}</p></div></CardContent></Card>;
          })}
        </div>

        <Card className="border-[#E8DFD0] shadow-sm">
          <CardContent className="flex flex-col gap-3 p-4 md:flex-row">
            <div className="relative flex-1"><Search className="absolute right-3 top-3 h-4 w-4 text-slate-400" /><Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="ابحث باسم المشروع أو الموقع..." className="pr-9" /></div>
            <div className="flex flex-wrap gap-2">
              {[["all","الكل"],["open","تستقبل عروضًا"],["in_progress","قيد التنفيذ"],["completed","مكتملة"],["cancelled","ملغاة"]].map(([value,label]) => <Button key={value} size="sm" variant={filter === value ? "default" : "outline"} className={filter === value ? "bg-[#9A743B] hover:bg-[#7F5E2D]" : ""} onClick={() => setFilter(value)}>{label}</Button>)}
            </div>
          </CardContent>
        </Card>

        {error && <Card className="border-amber-200"><CardContent className="flex items-start gap-3 p-5 text-amber-900"><AlertCircle className="mt-1 h-5 w-5 shrink-0" /><p>{error}</p></CardContent></Card>}
        {loading ? <Card><CardContent className="p-12 text-center text-slate-500">جارٍ تحميل مشاريعك...</CardContent></Card> : filtered.length === 0 ? (
          <Card className="border-dashed border-[#D8C7A9]"><CardContent className="flex flex-col items-center p-10 text-center"><FolderKanban className="mb-3 h-10 w-10 text-[#B08A50]" /><h2 className="text-xl font-bold text-[#332719]">{projects.length ? "لا توجد نتائج مطابقة" : "ابدأ أول مشروع لك في بيتلي"}</h2><p className="mt-2 max-w-md text-sm text-slate-500">{projects.length ? "جرّب تغيير البحث أو حالة المشروع." : "أضف بيانات مشروعك ليتمكن مقدمو الخدمة من الاطلاع على طلبك وتقديم عروضهم."}</p>{!projects.length && <Link className="mt-4" to={createPageUrl("CreateProject")}><Button className="bg-[#9A743B] hover:bg-[#7F5E2D]"><Plus className="ml-2 h-4 w-4" /> إقدام مشروعك</Button></Link>}</CardContent></Card>
        ) : (
          <div className="grid gap-4">
            {filtered.map((project) => {
              const status = STATUS[project.status] || STATUS.pending;
              const title = project.title || project.name || "مشروع بدون عنوان";
              return <Card key={project.id} className="border-[#E8DFD0] shadow-sm transition-shadow hover:shadow-md"><CardContent className="p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex flex-wrap items-center gap-2"><h2 className="text-lg font-bold text-[#332719]">{title}</h2><Badge className={status.className}>{status.label}</Badge></div>
                    <p className="line-clamp-2 text-sm leading-6 text-slate-600">{project.description || "لم تُضف تفاصيل وصفية لهذا المشروع بعد."}</p>
                    <div className="mt-4 grid gap-3 text-sm text-slate-600 sm:grid-cols-3">
                      <div><span className="block text-xs text-slate-400">الموقع</span>{project.location || "غير محدد"}</div>
                      <div><span className="block text-xs text-slate-400">الميزانية</span>{money(project.budget_max || project.budget_min)}</div>
                      <div><span className="block text-xs text-slate-400">تاريخ الإنشاء</span>{project.created_at ? new Date(project.created_at).toLocaleDateString("ar-SA") : "غير متاح"}</div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 lg:max-w-64">
                    <Link to={`${createPageUrl("ProjectDetails")}?id=${encodeURIComponent(project.id)}`}><Button size="sm" className="bg-[#9A743B] hover:bg-[#7F5E2D]"><Eye className="ml-2 h-4 w-4" /> تفاصيل المشروع</Button></Link>
                    <Link to={`${createPageUrl("ProjectDetails")}?id=${encodeURIComponent(project.id)}#offers`}><Button size="sm" variant="outline"><FileText className="ml-2 h-4 w-4" /> العروض</Button></Link>
                    <Link to={createPageUrl("Messages")}><Button size="sm" variant="outline"><MessageCircle className="ml-2 h-4 w-4" /> المحادثات</Button></Link>
                  </div>
                </div>
              </CardContent></Card>;
            })}
          </div>
        )}
      </div>
    </div>
  );
}
