import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { supabase } from "@/lib/supabaseClient";
import { FileText, Search, Loader2, AlertCircle, Eye, CalendarDays, Banknote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const STATUS_LABELS = {
  draft: "مسودة",
  pending_signature: "بانتظار التوقيع",
  signed: "موقّع",
  active: "ساري",
  completed: "مكتمل",
  terminated: "منتهي",
  archived: "مؤرشف",
};

export default function ContractArchive() {
  const [contracts, setContracts] = useState([]);
  const [projects, setProjects] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      setLoadError("");
      try {
        const { data: authData, error: authError } = await supabase.auth.getUser();
        if (authError) throw authError;
        const userId = authData?.user?.id;
        if (!userId) throw new Error("سجّل الدخول لعرض أرشيف العقود.");

        const { data, error } = await supabase
          .from("project_contracts")
          .select("*")
          .or(`client_user_id.eq.${userId},provider_user_id.eq.${userId}`)
          .order("created_at", { ascending: false })
          .limit(500);
        if (error) throw error;
        const rows = data || [];

        const projectIds = [...new Set(rows.map(row => row.project_id).filter(Boolean))];
        let projectMap = {};
        if (projectIds.length) {
          const { data: projectRows, error: projectError } = await supabase
            .from("projects")
            .select("id,title")
            .in("id", projectIds);
          if (projectError) throw projectError;
          projectMap = Object.fromEntries((projectRows || []).map(project => [project.id, project]));
        }
        if (!active) return;
        setContracts(rows);
        setProjects(projectMap);
      } catch (error) {
        console.error("Contract archive failed to load:", error);
        if (!active) return;
        setLoadError(error?.message || "تعذر تحميل أرشيف العقود.");
        setContracts([]);
        setProjects({});
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => { active = false; };
  }, []);

  const filteredContracts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return contracts.filter(contract => {
      const statusMatches = statusFilter === "all" || contract.status === statusFilter;
      const projectTitle = projects[contract.project_id]?.title || contract.title || "";
      const searchMatches = !q ||
        String(contract.contract_number || "").toLowerCase().includes(q) ||
        String(projectTitle).toLowerCase().includes(q);
      return statusMatches && searchMatches;
    });
  }, [contracts, projects, searchQuery, statusFilter]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center" dir="rtl"><Loader2 className="w-10 h-10 animate-spin text-[#C9A66B]" /></div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-amber-50/30 py-8" dir="rtl">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-7">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-[#1a1a2e] flex items-center gap-2"><FileText className="w-7 h-7 text-[#C9A66B]" /> أرشيف العقود</h1>
            <p className="text-sm text-slate-500 mt-2">العقود المرتبطة بحسابك في بيتلي</p>
          </div>
          <Badge variant="secondary" className="w-fit">{filteredContracts.length} عقد</Badge>
        </div>

        {loadError && (
          <div role="alert" className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 flex gap-2">
            <AlertCircle className="w-5 h-5 shrink-0" /> {loadError}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input value={searchQuery} onChange={event => setSearchQuery(event.target.value)} placeholder="ابحث برقم العقد أو اسم المشروع..." className="pr-9 rounded-xl bg-white" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-52 rounded-xl bg-white"><SelectValue placeholder="حالة العقد" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">كل الحالات</SelectItem>
              {Object.entries(STATUS_LABELS).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {filteredContracts.length ? (
          <div className="space-y-3">
            {filteredContracts.map(contract => {
              const projectTitle = projects[contract.project_id]?.title || contract.title || "مشروع بدون عنوان";
              const amount = contract.total_amount ?? contract.amount;
              return (
                <Card key={contract.id} className="border-0 shadow-sm">
                  <CardContent className="p-5 flex flex-col md:flex-row md:items-center gap-4">
                    <div className="w-11 h-11 rounded-xl bg-amber-50 flex items-center justify-center shrink-0"><FileText className="w-5 h-5 text-[#C9A66B]" /></div>
                    <div className="flex-1 min-w-0">
                      <h2 className="font-bold text-[#1a1a2e] truncate">{projectTitle}</h2>
                      <p className="text-xs text-slate-500 mt-1">رقم العقد: {contract.contract_number || "غير محدد"}</p>
                      <div className="flex flex-wrap gap-x-4 gap-y-2 mt-3 text-sm text-slate-500">
                        <span className="inline-flex items-center gap-1"><CalendarDays className="w-4 h-4" />{contract.created_at ? new Date(contract.created_at).toLocaleDateString("ar-SA") : "—"}</span>
                        <span className="inline-flex items-center gap-1"><Banknote className="w-4 h-4" />{amount != null ? Number(amount).toLocaleString("ar-SA") + " ر.س" : "القيمة غير محددة"}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="secondary">{STATUS_LABELS[contract.status] || contract.status || "غير محدد"}</Badge>
                      <Link to={createPageUrl("Contract") + `?id=${encodeURIComponent(contract.id)}`}>
                        <Button variant="outline" size="sm"><Eye className="w-4 h-4 ml-1" /> عرض العقد</Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="border-dashed shadow-none bg-white/70">
            <CardContent className="py-14 text-center">
              <FileText className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <h2 className="font-semibold text-slate-700">لا توجد عقود مطابقة</h2>
              <p className="text-sm text-slate-500 mt-2">{contracts.length ? "جرّب تغيير البحث أو فلتر الحالة." : "ستظهر العقود المرتبطة بحسابك هنا عند توفرها."}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
