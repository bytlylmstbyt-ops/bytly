import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useSearchParams, Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2, Save, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const COLORS = ["slate", "blue", "purple", "green", "orange", "red"];
const DEFAULT_STAGES = [
  { stage_id: "todo", name: "للقيام به", order: 1, requires_approval: false, color: "slate" },
  { stage_id: "in_progress", name: "قيد التنفيذ", order: 2, requires_approval: false, color: "blue" },
  { stage_id: "review", name: "المراجعة", order: 3, requires_approval: true, approval_from: "client", color: "purple" },
  { stage_id: "done", name: "مكتمل", order: 4, requires_approval: false, color: "green" },
];

export default function WorkflowBuilder() {
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get("id");
  const [project, setProject] = useState(null);
  const [workflow, setWorkflow] = useState(null);
  const [stages, setStages] = useState([]);
  const [newStage, setNewStage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadData(); }, [projectId]);

  const loadData = async () => {
    try {
      if (!projectId) throw new Error("معرّف المشروع مفقود");
      const [{ data: projectData, error: projectError }, { data: workflows, error: workflowError }] = await Promise.all([
        supabase.from("projects").select("*").eq("id", projectId).maybeSingle(),
        supabase.from("project_workflows").select("*").eq("project_id", projectId).order("created_at", { ascending: false }).limit(1),
      ]);
      if (projectError) throw projectError;
      if (workflowError) throw workflowError;
      if (!projectData) throw new Error("المشروع غير موجود");
      setProject(projectData);
      if (workflows?.length) {
        setWorkflow(workflows[0]);
        setStages(Array.isArray(workflows[0].stages) ? workflows[0].stages : []);
      } else {
        const initial = { name: "سير العمل الافتراضي", stages: DEFAULT_STAGES, current_stage_id: "todo", is_active: true };
        setWorkflow(initial);
        setStages(DEFAULT_STAGES);
      }
    } catch (error) { console.error("Error loading workflow:", error); }
    finally { setLoading(false); }
  };

  const handleAddStage = () => {
    const stage = {
      stage_id: `stage_${Date.now()}`,
      name: newStage?.name || "مرحلة جديدة",
      description: newStage?.description || "",
      order: stages.length + 1,
      requires_approval: !!newStage?.requires_approval,
      approval_from: newStage?.approval_from || "none",
      completion_tasks: newStage?.completion_tasks || [],
      estimated_duration_days: Number(newStage?.estimated_duration_days || 0),
      color: newStage?.color || "slate",
    };
    setStages([...stages, stage]);
    setNewStage(null);
  };
  const handleRemoveStage = (index) => setStages(stages.filter((_, i) => i !== index).map((s, i) => ({ ...s, order: i + 1 })));
  const handleUpdateStage = (index, updates) => { const updated = [...stages]; updated[index] = { ...updated[index], ...updates }; setStages(updated); };

  const handleSaveWorkflow = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("يجب تسجيل الدخول");
      const payload = { project_id: projectId, name: workflow?.name || "سير العمل الافتراضي", stages, current_stage_id: workflow?.current_stage_id || stages[0]?.stage_id || null, is_active: workflow?.is_active !== false, created_by: workflow?.created_by || user.id, updated_at: new Date().toISOString() };
      const result = workflow?.id
        ? await supabase.from("project_workflows").update(payload).eq("id", workflow.id).select().single()
        : await supabase.from("project_workflows").insert(payload).select().single();
      if (result.error) throw result.error;
      setWorkflow(result.data);
      setStages(result.data.stages || []);
    } catch (error) { console.error("Error saving workflow:", error); alert(error?.message || "تعذر حفظ سير العمل"); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 text-[#C9A66B] animate-spin" /></div>;

  return <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-amber-50/30 py-8"><div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8"><motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
    <div className="mb-8"><Link to={createPageUrl("ProjectKanban") + `?id=${projectId}`}><Button variant="ghost" className="mb-4">←عودة</Button></Link><h1 className="text-3xl font-bold text-[#1a1a2e]">بناء سير العمل</h1><p className="text-slate-600 mt-2">{project?.title}</p></div>
    <div className="grid lg:grid-cols-3 gap-8"><div className="lg:col-span-2"><Card><CardHeader className="flex flex-row items-center justify-between"><CardTitle>مراحل سير العمل</CardTitle><Dialog><DialogTrigger asChild><Button size="sm" className="gap-2"><Plus className="w-4 h-4" />مرحلة جديدة</Button></DialogTrigger><DialogContent><DialogHeader><DialogTitle>إضافة مرحلة جديدة</DialogTitle></DialogHeader><div className="space-y-4"><div><label className="text-sm font-medium">اسم المرحلة</label><Input value={newStage?.name || ""} onChange={(e) => setNewStage({ ...newStage, name: e.target.value })} placeholder="مثال: تصميم التفاصيل" /></div><div><label className="text-sm font-medium">الوصف</label><Textarea value={newStage?.description || ""} onChange={(e) => setNewStage({ ...newStage, description: e.target.value })} rows={3} /></div><div><label className="text-sm font-medium">المدة المتوقعة (بالأيام)</label><Input type="number" value={newStage?.estimated_duration_days || ""} onChange={(e) => setNewStage({ ...newStage, estimated_duration_days: parseInt(e.target.value || "0", 10) })} /></div><div><label className="text-sm font-medium">اللون</label><Select value={newStage?.color || "slate"} onValueChange={(value) => setNewStage({ ...newStage, color: value })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{COLORS.map((color) => <SelectItem key={color} value={color}>{color === "slate" ? "رمادي" : color === "blue" ? "أزرق" : color === "purple" ? "بنفسجي" : color === "green" ? "أخضر" : color === "orange" ? "برتقالي" : "أحمر"}</SelectItem>)}</SelectContent></Select></div><div className="flex items-center gap-2"><Checkbox checked={!!newStage?.requires_approval} onCheckedChange={(checked) => setNewStage({ ...newStage, requires_approval: checked })} /><label className="text-sm">تتطلب موافقة</label></div>{newStage?.requires_approval && <div><label className="text-sm font-medium">موافقة من</label><Select value={newStage?.approval_from || "client"} onValueChange={(value) => setNewStage({ ...newStage, approval_from: value })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="client">العميل</SelectItem><SelectItem value="engineer">المهندس</SelectItem><SelectItem value="both">الطرفان</SelectItem></SelectContent></Select></div>}<Button onClick={handleAddStage} className="w-full">إضافة</Button></div></DialogContent></Dialog></CardHeader>
      <CardContent className="space-y-3">{stages.map((stage, index) => <motion.div key={stage.stage_id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="p-4 border rounded-lg"><div className="flex items-start justify-between gap-4"><div className="flex-1"><div className="flex items-center gap-2 mb-2"><Badge>{index + 1}</Badge><Input value={stage.name || ""} onChange={(e) => handleUpdateStage(index, { name: e.target.value })} className="font-semibold" /></div>{stage.description && <p className="text-sm text-slate-600 mb-2">{stage.description}</p>}<div className="flex gap-2 flex-wrap">{stage.requires_approval && <Badge variant="outline" className="text-xs">✓ موافقة من {stage.approval_from === "client" ? "العميل" : stage.approval_from === "engineer" ? "المهندس" : "الطرفين"}</Badge>}{stage.estimated_duration_days > 0 && <Badge variant="outline" className="text-xs">⏱ {stage.estimated_duration_days} أيام</Badge>}</div></div><Button variant="ghost" size="icon" onClick={() => handleRemoveStage(index)} className="text-red-600"><Trash2 className="w-4 h-4" /></Button></div></motion.div>)}</CardContent></Card></div>
      <div className="space-y-6"><Card><CardHeader><CardTitle>معاينة سير العمل</CardTitle></CardHeader><CardContent className="space-y-4">{stages.map((stage, index) => <div key={stage.stage_id}><div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-slate-400" /><span className="text-sm font-medium text-slate-700">{stage.name}</span></div>{index < stages.length - 1 && <div className="w-0.5 h-6 bg-slate-200 ml-1.5" />}</div>)}</CardContent></Card><Button onClick={handleSaveWorkflow} disabled={saving || stages.length === 0} className="w-full gap-2">{saving ? <><Loader2 className="w-4 h-4 animate-spin" />جاري الحفظ...</> : <><Save className="w-4 h-4" />حفظ سير العمل</>}</Button><Link to={createPageUrl("ProjectKanban") + `?id=${projectId}`} className="block"><Button variant="outline" className="w-full">عرض لوحة المشروع</Button></Link></div></div>
  </motion.div></div></div>;
}
