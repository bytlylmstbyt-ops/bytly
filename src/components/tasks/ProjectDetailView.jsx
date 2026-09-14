import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import MobileSelect from "@/components/mobile/MobileSelect";
import {
  X, Plus, Flag, BarChart3, Loader2, Save,
  CheckCircle2, Clock, Circle, Sparkles, Link2, Trash2, Edit2, Paperclip
} from "lucide-react";
import DocumentsPanel from "./DocumentsPanel";
import { format, parseISO, isPast } from "date-fns";
import { ar } from "date-fns/locale";
import { toast } from "sonner";
import TaskCard from "./TaskCard";

// ── Milestone badge ──────────────────────────────────────────────────────────
const MILESTONE_STATUS = {
  pending:     { label: "قادم",      icon: Circle,       color: "bg-slate-100 text-slate-600" },
  in_progress: { label: "جارٍ",      icon: Clock,        color: "bg-blue-100 text-blue-700" },
  completed:   { label: "مكتمل",     icon: CheckCircle2, color: "bg-green-100 text-green-700" },
};

function MilestoneRow({ milestone, onEdit, onDelete, onStatusChange }) {
  const cfg = MILESTONE_STATUS[milestone.status] || MILESTONE_STATUS.pending;
  const Icon = cfg.icon;
  const overdue = milestone.due_date && isPast(parseISO(milestone.due_date)) && milestone.status !== 'completed';
  return (
    <div className="flex items-center gap-3 p-3 bg-white rounded-lg border group">
      <button onClick={() => onStatusChange(milestone)} className="shrink-0">
        <Icon className={`w-5 h-5 ${milestone.status === 'completed' ? 'text-green-500' : milestone.status === 'in_progress' ? 'text-blue-500' : 'text-slate-300'}`} />
      </button>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium ${milestone.status === 'completed' ? 'line-through text-slate-400' : 'text-slate-800'}`}>{milestone.title}</p>
        {milestone.description && <p className="text-xs text-slate-500 truncate">{milestone.description}</p>}
        {milestone.due_date && (
          <p className={`text-xs mt-0.5 ${overdue ? 'text-red-600 font-semibold' : 'text-slate-400'}`}>
            📅 {format(parseISO(milestone.due_date), 'd MMM yyyy', { locale: ar })} {overdue && '⚠️ متأخر'}
          </p>
        )}
      </div>
      <Badge className={`text-xs ${cfg.color}`}>{cfg.label}</Badge>
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
        <button onClick={() => onEdit(milestone)} className="p-1 hover:bg-slate-100 rounded"><Edit2 className="w-3 h-3 text-slate-400" /></button>
        <button onClick={() => onDelete(milestone.id)} className="p-1 hover:bg-red-50 rounded"><Trash2 className="w-3 h-3 text-red-400" /></button>
      </div>
    </div>
  );
}

// ── Milestone form ───────────────────────────────────────────────────────────
function MilestoneFormModal({ open, onClose, onSave, initial, loading }) {
  const [form, setForm] = useState({ title: "", description: "", due_date: "", status: "pending" });
  useEffect(() => {
    setForm(initial
      ? { title: initial.title || "", description: initial.description || "", due_date: initial.due_date || "", status: initial.status || "pending" }
      : { title: "", description: "", due_date: "", status: "pending" });
  }, [initial, open]);
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md" dir="rtl">
        <DialogHeader><DialogTitle>{initial ? "تعديل المعلم" : "معلم جديد"}</DialogTitle></DialogHeader>
        <div className="space-y-3 py-2">
          <Input placeholder="عنوان المعلم *" value={form.title} onChange={e => setForm(p => ({...p, title: e.target.value}))} />
          <Textarea rows={2} placeholder="الوصف..." value={form.description} onChange={e => setForm(p => ({...p, description: e.target.value}))} />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-500 mb-1 block">تاريخ الاستحقاق</label>
              <Input type="date" value={form.due_date} onChange={e => setForm(p => ({...p, due_date: e.target.value}))} />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">الحالة</label>
              <MobileSelect
                value={form.status}
                onValueChange={v => setForm(p => ({...p, status: v}))}
                label="الحالة"
                options={[
                  { value: "pending", label: "قادم" },
                  { value: "in_progress", label: "جارٍ" },
                  { value: "completed", label: "مكتمل" },
                ]}
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>إلغاء</Button>
          <Button className="bg-blue-600 text-white hover:bg-blue-700" onClick={() => onSave(form)} disabled={loading || !form.title}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin ml-1" /> : <Save className="w-4 h-4 ml-1" />}حفظ
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────
export default function ProjectDetailView({ project, tasks, onClose, onRefresh, onEditTask, onStatusChange }) {
  const [milestones, setMilestones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [milestoneModal, setMilestoneModal] = useState({ open: false, initial: null });
  const [savingMilestone, setSavingMilestone] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);
  const [report, setReport] = useState(null);
  const [budgetEdit, setBudgetEdit] = useState(false);
  const [budgetForm, setBudgetForm] = useState({ budget_total: project?.budget_total || 0, budget_spent: project?.budget_spent || 0, budget_notes: project?.budget_notes || "" });
  const [savingBudget, setSavingBudget] = useState(false);

  useEffect(() => { if (project) loadMilestones(); }, [project?.id]);

  const loadMilestones = async () => {
    setLoading(true);
    try {
      const ms = await base44.entities.ProjectMilestone2.filter({ project_id: project.id }, 'order', 50);
      setMilestones(ms);
    } catch { setMilestones([]); }
    finally { setLoading(false); }
  };

  const saveMilestone = async (form) => {
    setSavingMilestone(true);
    try {
      if (milestoneModal.initial) {
        await base44.entities.ProjectMilestone2.update(milestoneModal.initial.id, form);
      } else {
        await base44.entities.ProjectMilestone2.create({ ...form, project_id: project.id, order: milestones.length });
      }
      setMilestoneModal({ open: false, initial: null });
      loadMilestones();
      toast.success("تم حفظ المعلم ✓");
    } catch (e) { toast.error("فشل الحفظ"); }
    finally { setSavingMilestone(false); }
  };

  const deleteMilestone = async (id) => {
    if (!confirm("حذف هذا المعلم؟")) return;
    await base44.entities.ProjectMilestone2.delete(id);
    setMilestones(prev => prev.filter(m => m.id !== id));
    toast.success("تم الحذف");
  };

  const cycleMilestoneStatus = async (milestone) => {
    const next = { pending: "in_progress", in_progress: "completed", completed: "pending" };
    const newStatus = next[milestone.status];
    await base44.entities.ProjectMilestone2.update(milestone.id, { status: newStatus });
    setMilestones(prev => prev.map(m => m.id === milestone.id ? { ...m, status: newStatus } : m));
  };

  const saveBudget = async () => {
    setSavingBudget(true);
    try {
      await base44.entities.TaskProject.update(project.id, budgetForm);
      toast.success("تم تحديث الميزانية ✓");
      setBudgetEdit(false);
      onRefresh?.();
    } catch { toast.error("فشل التحديث"); }
    finally { setSavingBudget(false); }
  };

  const generateReport = async () => {
    setReportLoading(true);
    setReport(null);
    try {
      const done = pTasks.filter(t => t.status === 'completed').length;
      const overdue = pTasks.filter(t => t.due_date && isPast(parseISO(t.due_date)) && t.status !== 'completed').length;
      const msCompleted = milestones.filter(m => m.status === 'completed').length;
      const budgetPct = project.budget_total ? Math.round((project.budget_spent / project.budget_total) * 100) : 0;

      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `أنت مدير مشاريع. أنشئ تقرير تقدم موجز باللغة العربية للمشروع:
- اسم المشروع: ${project.name}
- الحالة: ${project.status}
- إجمالي المهام: ${pTasks.length} | مكتملة: ${done} | متأخرة: ${overdue}
- المعالم: ${milestones.length} | مكتملة: ${msCompleted}
- الميزانية الإجمالية: ${project.budget_total?.toLocaleString() || 'غير محددة'} ر.س | المصروف: ${project.budget_spent?.toLocaleString() || 0} ر.س (${budgetPct}%)
- الموعد النهائي: ${project.due_date || 'غير محدد'}

أعد JSON بهذا الشكل:
{
  "overall_status": "on_track|at_risk|behind",
  "summary": "ملخص تنفيذي (3 جمل)",
  "achievements": ["إنجاز 1", "إنجاز 2"],
  "risks": ["خطر 1", "خطر 2"],
  "recommendations": ["توصية 1", "توصية 2"],
  "next_steps": ["خطوة 1", "خطوة 2"]
}`,
        response_json_schema: {
          type: "object",
          properties: {
            overall_status: { type: "string" },
            summary: { type: "string" },
            achievements: { type: "array", items: { type: "string" } },
            risks: { type: "array", items: { type: "string" } },
            recommendations: { type: "array", items: { type: "string" } },
            next_steps: { type: "array", items: { type: "string" } },
          }
        }
      });
      setReport(res);
    } catch (e) { toast.error("فشل توليد التقرير"); }
    finally { setReportLoading(false); }
  };

  const pTasks = tasks.filter(t => t.project_id === project.id);
  const done = pTasks.filter(t => t.status === 'completed').length;
  const pct = pTasks.length ? Math.round((done / pTasks.length) * 100) : 0;
  const budgetPct = project.budget_total ? Math.min(100, Math.round(((project.budget_spent || 0) / project.budget_total) * 100)) : 0;
  const budgetRemaining = (project.budget_total || 0) - (project.budget_spent || 0);

  const taskMap = Object.fromEntries(pTasks.map(t => [t.id, t]));

  const statusColor = { on_track: "bg-green-100 text-green-700", at_risk: "bg-amber-100 text-amber-700", behind: "bg-red-100 text-red-700" };
  const statusLabel = { on_track: "✅ على المسار", at_risk: "⚠️ في خطر", behind: "🔴 متأخر" };

  return (
    <div className="fixed inset-0 z-50 flex" dir="rtl">
      <div className="flex-1 bg-black/40" onClick={onClose} />
      <div className="w-full max-w-2xl bg-white shadow-2xl overflow-y-auto flex flex-col">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white border-b px-5 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-sm"
                style={{ backgroundColor: project.color }}>
                {project.name.charAt(0)}
              </div>
              <div>
                <h2 className="font-bold text-slate-800 text-lg leading-tight">{project.name}</h2>
                <p className="text-xs text-slate-500">{pTasks.length} مهمة • {milestones.length} معلم</p>
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg"><X className="w-5 h-5 text-slate-500" /></button>
          </div>

          {/* Overall progress bar */}
          <div className="mt-3 space-y-1">
            <div className="flex justify-between text-xs text-slate-500">
              <span>تقدم المشروع</span><span className="font-semibold">{pct}%</span>
            </div>
            <Progress value={pct} className="h-2.5" style={{ '--progress-color': project.color }} />
          </div>
        </div>

        <Tabs defaultValue="overview" className="flex-1 flex flex-col">
          <TabsList className="mx-4 mt-3 grid grid-cols-5 shrink-0">
            <TabsTrigger value="overview" className="text-xs">نظرة عامة</TabsTrigger>
            <TabsTrigger value="milestones" className="text-xs">المعالم</TabsTrigger>
            <TabsTrigger value="budget" className="text-xs">الميزانية</TabsTrigger>
            <TabsTrigger value="documents" className="text-xs flex items-center gap-1">
              <Paperclip className="w-3 h-3" />مستندات
            </TabsTrigger>
            <TabsTrigger value="report" className="text-xs">التقرير</TabsTrigger>
          </TabsList>

          {/* Overview */}
          <TabsContent value="overview" className="p-4 space-y-4 flex-1">
            {/* Stats grid */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "المهام الكلية", value: pTasks.length, color: "text-slate-700" },
                { label: "مكتملة", value: done, color: "text-green-600" },
                { label: "متأخرة", value: pTasks.filter(t => t.due_date && isPast(parseISO(t.due_date)) && t.status !== 'completed').length, color: "text-red-600" },
              ].map(s => (
                <Card key={s.label}>
                  <CardContent className="p-3 text-center">
                    <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                    <p className="text-xs text-slate-500">{s.label}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Status breakdown */}
            <Card>
              <CardContent className="p-4 space-y-2">
                {[
                  { key: "todo", label: "انتظار", color: "bg-slate-400" },
                  { key: "in_progress", label: "تنفيذ", color: "bg-blue-500" },
                  { key: "on_hold", label: "معلقة", color: "bg-amber-500" },
                  { key: "completed", label: "مكتملة", color: "bg-green-500" },
                ].map(s => {
                  const cnt = pTasks.filter(t => t.status === s.key).length;
                  const p2 = pTasks.length ? Math.round((cnt / pTasks.length) * 100) : 0;
                  return (
                    <div key={s.key} className="flex items-center gap-3">
                      <span className="text-xs text-slate-500 w-16 shrink-0">{s.label}</span>
                      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${s.color}`} style={{ width: `${p2}%` }} />
                      </div>
                      <span className="text-xs text-slate-500 w-8 text-left">{cnt}</span>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Tasks with dependencies */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-slate-700">المهام ({pTasks.length})</h3>
              {pTasks.slice(0, 20).map(task => (
                <div key={task.id}>
                  <TaskCard
                    task={task}
                    projectColor={project.color}
                    onClick={() => onEditTask(task)}
                    onStatusChange={onStatusChange}
                  />
                  {task.dependencies?.length > 0 && (
                    <div className="flex items-center gap-1 mr-7 mt-0.5">
                      <Link2 className="w-3 h-3 text-slate-300" />
                      <span className="text-xs text-slate-400">يعتمد على: </span>
                      {task.dependencies.map(depId => {
                        const dep = taskMap[depId];
                        return dep ? (
                          <Badge key={depId} variant="outline" className={`text-xs py-0 ${dep.status === 'completed' ? 'border-green-300 text-green-600' : 'border-amber-300 text-amber-600'}`}>
                            {dep.status === 'completed' ? '✓' : '⏳'} {dep.title}
                          </Badge>
                        ) : null;
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </TabsContent>

          {/* Milestones */}
          <TabsContent value="milestones" className="p-4 space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-semibold text-slate-700">المعالم الرئيسية</h3>
              <Button size="sm" onClick={() => setMilestoneModal({ open: true, initial: null })} className="bg-blue-600 text-white hover:bg-blue-700">
                <Plus className="w-3.5 h-3.5 ml-1" />معلم جديد
              </Button>
            </div>

            {/* Milestone timeline */}
            {milestones.length > 0 && (
              <div className="relative pr-4">
                <div className="absolute right-5 top-0 bottom-0 w-0.5 bg-slate-200" />
                {milestones.map((ms, i) => {
                  const cfg = MILESTONE_STATUS[ms.status] || MILESTONE_STATUS.pending;
                  const Icon = cfg.icon;
                  return (
                    <div key={ms.id} className="relative flex items-start gap-3 mb-4">
                      <div className={`relative z-10 w-6 h-6 rounded-full flex items-center justify-center border-2 border-white shadow ${ms.status === 'completed' ? 'bg-green-500' : ms.status === 'in_progress' ? 'bg-blue-500' : 'bg-slate-300'}`}>
                        <Icon className="w-3 h-3 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <MilestoneRow
                          milestone={ms}
                          onEdit={m => setMilestoneModal({ open: true, initial: m })}
                          onDelete={deleteMilestone}
                          onStatusChange={cycleMilestoneStatus}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {loading && <div className="text-center py-6"><Loader2 className="w-5 h-5 animate-spin mx-auto text-slate-400" /></div>}
            {!loading && milestones.length === 0 && (
              <div className="text-center py-10 text-slate-400">
                <Flag className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">لا توجد معالم بعد</p>
              </div>
            )}
          </TabsContent>

          {/* Budget */}
          <TabsContent value="budget" className="p-4 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-semibold text-slate-700">الميزانية والتكاليف</h3>
              <Button size="sm" variant="outline" onClick={() => setBudgetEdit(!budgetEdit)}>
                <Edit2 className="w-3.5 h-3.5 ml-1" />{budgetEdit ? "إلغاء" : "تعديل"}
              </Button>
            </div>

            {budgetEdit ? (
              <div className="bg-slate-50 rounded-xl p-4 space-y-3 border">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-slate-500 mb-1 block">الميزانية الإجمالية (ر.س)</label>
                    <Input type="number" value={budgetForm.budget_total} onChange={e => setBudgetForm(p => ({...p, budget_total: Number(e.target.value)}))} />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 mb-1 block">المصروف الفعلي (ر.س)</label>
                    <Input type="number" value={budgetForm.budget_spent} onChange={e => setBudgetForm(p => ({...p, budget_spent: Number(e.target.value)}))} />
                  </div>
                </div>
                <Textarea rows={2} placeholder="ملاحظات الميزانية..." value={budgetForm.budget_notes} onChange={e => setBudgetForm(p => ({...p, budget_notes: e.target.value}))} />
                <Button onClick={saveBudget} disabled={savingBudget} className="w-full bg-blue-600 text-white hover:bg-blue-700">
                  {savingBudget ? <Loader2 className="w-4 h-4 animate-spin ml-1" /> : <Save className="w-4 h-4 ml-1" />}حفظ الميزانية
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Budget overview cards */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: "الإجمالي", value: project.budget_total, color: "text-slate-700" },
                    { label: "المصروف", value: project.budget_spent || 0, color: budgetPct > 90 ? "text-red-600" : "text-amber-600" },
                    { label: "المتبقي", value: budgetRemaining, color: budgetRemaining < 0 ? "text-red-600" : "text-green-600" },
                  ].map(s => (
                    <Card key={s.label}>
                      <CardContent className="p-3 text-center">
                        <p className={`text-lg font-bold ${s.color}`}>{s.value?.toLocaleString() || '-'}</p>
                        <p className="text-xs text-slate-500">{s.label} ر.س</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Budget bar */}
                {project.budget_total > 0 && (
                  <Card>
                    <CardContent className="p-4 space-y-2">
                      <div className="flex justify-between text-xs text-slate-600">
                        <span>استهلاك الميزانية</span>
                        <span className={`font-bold ${budgetPct > 90 ? 'text-red-600' : budgetPct > 70 ? 'text-amber-600' : 'text-green-600'}`}>{budgetPct}%</span>
                      </div>
                      <div className="h-4 bg-slate-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all ${budgetPct > 90 ? 'bg-red-500' : budgetPct > 70 ? 'bg-amber-500' : 'bg-green-500'}`}
                          style={{ width: `${Math.min(100, budgetPct)}%` }} />
                      </div>
                      {budgetPct > 90 && <p className="text-xs text-red-600">⚠️ تجاوز الميزانية وشيك!</p>}
                    </CardContent>
                  </Card>
                )}

                {/* Task costs */}
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm">تكاليف المهام</CardTitle></CardHeader>
                  <CardContent className="space-y-2">
                    {pTasks.filter(t => t.cost > 0).map(t => (
                      <div key={t.id} className="flex justify-between items-center text-sm py-1 border-b last:border-0">
                        <span className="text-slate-700 truncate flex-1 ml-3">{t.title}</span>
                        <span className="font-medium text-slate-600 shrink-0">{t.cost?.toLocaleString()} ر.س</span>
                      </div>
                    ))}
                    {pTasks.filter(t => t.cost > 0).length === 0 && (
                      <p className="text-xs text-slate-400 text-center py-4">لا توجد تكاليف مسجلة للمهام</p>
                    )}
                    {pTasks.filter(t => t.cost > 0).length > 0 && (
                      <div className="flex justify-between text-sm font-bold pt-2 border-t">
                        <span>الإجمالي</span>
                        <span>{pTasks.reduce((sum, t) => sum + (t.cost || 0), 0).toLocaleString()} ر.س</span>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {project.budget_notes && (
                  <div className="bg-slate-50 rounded-lg p-3 text-xs text-slate-600 border">
                    <p className="font-medium mb-1">ملاحظات الميزانية:</p>
                    <p>{project.budget_notes}</p>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          {/* Documents */}
          <TabsContent value="documents" className="p-4">
            <DocumentsPanel linkedTo="project" linkedId={project.id} />
          </TabsContent>

          {/* Report */}
          <TabsContent value="report" className="p-4 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-semibold text-slate-700">تقرير التقدم</h3>
              <Button onClick={generateReport} disabled={reportLoading} className="bg-purple-600 hover:bg-purple-700 text-white">
                {reportLoading ? <Loader2 className="w-4 h-4 animate-spin ml-1" /> : <Sparkles className="w-4 h-4 ml-1" />}
                توليد التقرير بالذكاء الاصطناعي
              </Button>
            </div>

            {reportLoading && (
              <div className="text-center py-10 text-slate-400">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                <p className="text-sm">جارٍ تحليل بيانات المشروع...</p>
              </div>
            )}

            {report && (
              <div className="space-y-3">
                <div className={`p-3 rounded-lg ${statusColor[report.overall_status] || 'bg-slate-100 text-slate-700'}`}>
                  <p className="font-bold text-sm">{statusLabel[report.overall_status] || report.overall_status}</p>
                </div>

                <Card>
                  <CardContent className="p-4">
                    <p className="text-xs font-semibold text-slate-500 mb-1">الملخص التنفيذي</p>
                    <p className="text-sm text-slate-700 leading-relaxed">{report.summary}</p>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-2 gap-3">
                  <Card className="border-green-200">
                    <CardContent className="p-3">
                      <p className="text-xs font-semibold text-green-700 mb-2">✅ الإنجازات</p>
                      <ul className="space-y-1">
                        {report.achievements?.map((a, i) => <li key={i} className="text-xs text-slate-600">• {a}</li>)}
                      </ul>
                    </CardContent>
                  </Card>
                  <Card className="border-red-200">
                    <CardContent className="p-3">
                      <p className="text-xs font-semibold text-red-700 mb-2">⚠️ المخاطر</p>
                      <ul className="space-y-1">
                        {report.risks?.map((r, i) => <li key={i} className="text-xs text-slate-600">• {r}</li>)}
                      </ul>
                    </CardContent>
                  </Card>
                </div>

                <Card className="border-blue-200">
                  <CardContent className="p-3">
                    <p className="text-xs font-semibold text-blue-700 mb-2">💡 التوصيات</p>
                    <ul className="space-y-1">
                      {report.recommendations?.map((r, i) => <li key={i} className="text-xs text-slate-600">• {r}</li>)}
                    </ul>
                  </CardContent>
                </Card>

                <Card className="border-purple-200">
                  <CardContent className="p-3">
                    <p className="text-xs font-semibold text-purple-700 mb-2">🚀 الخطوات القادمة</p>
                    <ol className="space-y-1">
                      {report.next_steps?.map((s, i) => <li key={i} className="text-xs text-slate-600">{i+1}. {s}</li>)}
                    </ol>
                  </CardContent>
                </Card>
              </div>
            )}

            {!report && !reportLoading && (
              <div className="text-center py-10 text-slate-400">
                <BarChart3 className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">اضغط الزر لتوليد تقرير تقدم آلي</p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        <MilestoneFormModal
          open={milestoneModal.open}
          onClose={() => setMilestoneModal({ open: false, initial: null })}
          onSave={saveMilestone}
          initial={milestoneModal.initial}
          loading={savingMilestone}
        />
      </div>
    </div>
  );
}