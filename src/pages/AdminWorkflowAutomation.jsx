import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { REAL_WORKFLOW_CATALOG } from "@/data/realWorkflowCatalog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  Workflow, Plus, Loader2, Play, Trash2, Pencil, Zap, Clock, Hand,
  CheckCircle2, XCircle, Loader, ShieldAlert, Bell, Mail, RefreshCw,
  ListChecks, UserPlus, Link2, Filter, Sparkles, FileSignature, Receipt,
  Search, GitBranch, Database, X, Eye,
} from "lucide-react";

const TRIGGER_TYPE_CONFIG = {
  event: { label: "عند حدوث حدث", icon: Zap, color: "text-amber-600", bg: "bg-amber-50" },
  schedule: { label: "مجدول", icon: Clock, color: "text-blue-600", bg: "bg-blue-50" },
  manual: { label: "يدوي", icon: Hand, color: "text-slate-600", bg: "bg-slate-50" },
};

const TRIGGER_EVENT_LABELS = {
  project_created: "إنشاء مشروع جديد",
  project_status_changed: "تغيّر حالة مشروع",
  proposal_submitted: "تقديم عرض سعر",
  contract_signed: "توقيع عقد",
  payment_completed: "اكتمال دفعة",
  payment_overdue: "تأخر دفعة",
  dispute_opened: "فتح نزاع",
  dispute_resolved: "حل نزاع",
  proposal_accepted: "قبول عرض سعر",
  engineer_registered: "تسجيل مهندس جديد",
  engineer_approved: "اعتماد مهندس",
  client_registered: "تسجيل عميل جديد",
  firm_registered: "تسجيل شركة جديدة",
  withdrawal_requested: "طلب سحب رصيد",
  review_submitted: "تقديم تقييم",
  subscription_expiring: "قرب انتهاء اشتراك",
  milestone_completed: "اكتمال مرحلة مشروع",
};

const ACTION_TYPE_CONFIG = {
  send_notification: { label: "إرسال إشعار", icon: Bell },
  send_email: { label: "إرسال بريد إلكتروني", icon: Mail },
  update_status: { label: "تحديث حالة", icon: RefreshCw },
  create_task: { label: "إنشاء مهمة", icon: ListChecks },
  assign_to_admin: { label: "تعيين لمشرف", icon: UserPlus },
  webhook_call: { label: "استدعاء Webhook", icon: Link2 },
  create_contract: { label: "إنشاء عقد", icon: FileSignature },
  generate_invoice: { label: "إصدار فاتورة", icon: Receipt },
};

const INTEGRATION_LABELS = {
  none: "بدون تكامل خارجي",
  email: "البريد الإلكتروني",
  notification_center: "مركز الإشعارات",
  webhook: "Webhook",
  slack: "Slack",
};

const CATEGORY_LABELS = {
  projects: "المشاريع",
  payments: "المدفوعات",
  engineers: "المهندسون",
  disputes: "النزاعات",
  contracts: "العقود",
  notifications: "الإشعارات",
  other: "أخرى",
};

const RUN_STATUS_CONFIG = {
  running: { label: "قيد التنفيذ", icon: Loader, color: "text-blue-600", badge: "bg-blue-100 text-blue-700" },
  success: { label: "ناجح", icon: CheckCircle2, color: "text-green-600", badge: "bg-green-100 text-green-700" },
  failed: { label: "فشل", icon: XCircle, color: "text-red-600", badge: "bg-red-100 text-red-700" },
  cancelled: { label: "ملغى", icon: XCircle, color: "text-slate-500", badge: "bg-slate-100 text-slate-600" },
};

const TRIGGERED_BY_LABELS = {
  system_event: "حدث تلقائي",
  schedule: "جدولة",
  manual_test: "تشغيل تجريبي يدوي",
};

const emptyRuleForm = {
  name: "",
  description: "",
  is_active: true,
  trigger_type: "event",
  trigger_event: "project_created",
  schedule_cron: "",
  integration_trigger: "none",
  category: "other",
  actions: [{ action_type: "send_notification", config: {} }],
};

// The source files are the authority for source workflows. The UI reads their
// real trigger/definition data for the details view instead of inventing steps.
// NOTE: In Vite 6, `import: "default"` + `query: "?raw"` can return module objects
// instead of raw strings for some .jsonc files, which breaks JSON.parse. Using
// `as: "raw"` is deprecated/removed; instead we glob without `import` and extract
// `.default` (or fall back to the value itself if it's already a string).
const WORKFLOW_SOURCE_FILES = import.meta.glob("/base44/workflows/*.jsonc", {
  query: "?raw",
  eager: true,
});

function getRawSource(key) {
  const mod = WORKFLOW_SOURCE_FILES[key];
  if (!mod) return null;
  if (typeof mod === "string") return mod;
  if (typeof mod === "object" && mod.default) return mod.default;
  return null;
}

const SUGGESTED_WORKFLOWS = [
  {
    id: "project-appointments",
    name: "إدارة مواعيد المشاريع",
    description: "تذكير تلقائي بالمواعيد القادمة وإرسال إشعار للفريق والعميل.",
    category: "projects",
    trigger_type: "schedule",
    schedule_cron: "0 9 * * *",
    actions: [{ action_type: "send_notification", config: {} }, { action_type: "send_email", config: {} }],
  },
  {
    id: "weekly-summary",
    name: "الملخص الأسبوعي للمشاريع",
    description: "إرسال ملخص أسبوعي لحالة المشاريع وإحصائياتها وحركة العمل.",
    category: "projects",
    trigger_type: "schedule",
    schedule_cron: "0 9 * * 1",
    actions: [{ action_type: "send_email", config: {} }],
  },
  {
    id: "new-contractor-lifecycle",
    name: "دورة حياة المقاولات الجديدة",
    description: "تشغيل خطوات المتابعة الأساسية عند إنشاء مشروع مقاولة جديد.",
    category: "projects",
    trigger_type: "event",
    trigger_event: "project_created",
    actions: [{ action_type: "send_notification", config: {} }, { action_type: "create_task", config: {} }],
  },
  {
    id: "project-alerts",
    name: "تنبيهات المشاريع",
    description: "إرسال تنبيهات تلقائية عند تغيّر حالة المشروع أو ظهور حدث مهم.",
    category: "notifications",
    trigger_type: "event",
    trigger_event: "project_status_changed",
    actions: [{ action_type: "send_notification", config: {} }],
  },
];

function parseWorkflowSource(raw) {
  if (!raw || typeof raw !== "string") return null;
  try {
    return JSON.parse(raw);
  } catch {
    try {
      return JSON.parse(raw.replace(/\/\/.*$/gm, "").replace(/,\s*([}\]])/g, "$1"));
    } catch {
      return null;
    }
  }
}

function getSourceDefinition(rule) {
  if (!rule?._sourceWorkflow || !rule.sourceFile) return null;
  const key = Object.keys(WORKFLOW_SOURCE_FILES).find((path) => path.endsWith(rule.sourceFile));
  return key ? parseWorkflowSource(getRawSource(key)) : null;
}

function sourceTriggerLabel(source, rule) {
  const cfg = source?.trigger?.config;
  if (!cfg) {
    if (rule.trigger_type === "schedule") return `مجدول${rule.schedule_cron ? ` · ${rule.schedule_cron}` : ""}`;
    return TRIGGER_TYPE_CONFIG[rule.trigger_type]?.label || "مُشغّل";
  }
  if (cfg.trigger_type === "scheduled") {
    return `مجدول · ${cfg.cron_expression || rule.schedule_cron || "جدولة مخصصة"}${cfg.timezone ? ` · ${cfg.timezone}` : ""}`;
  }
  if (cfg.trigger_type === "entity") {
    const events = (cfg.events || []).join("، ");
    return `حدث · ${cfg.entity_name || rule.sourceEntity || "كيان"}${events ? ` · ${events}` : ""}`;
  }
  return cfg.trigger_type || "مُشغّل";
}

function buildWorkflowNodes(rule) {
  const source = getSourceDefinition(rule);
  const nodes = [{
    type: "trigger",
    title: "المُشغّل",
    label: sourceTriggerLabel(source, rule),
    icon: source?.trigger?.config?.trigger_type === "scheduled" ? Clock : Zap,
  }];

  const condition = source?.trigger?.condition || (rule.conditions?.length ? rule.conditions : null);
  if (condition) {
    const count = Array.isArray(condition) ? condition.length : 1;
    nodes.push({ type: "condition", title: "الشروط", label: `${count} شرط قبل التنفيذ`, icon: GitBranch });
  }

  const sourceActions = source?.definition?.do || [];
  if (sourceActions.length) {
    sourceActions.forEach((entry, index) => {
      const [key, value] = Object.entries(entry)[0] || [];
      const title = value?.["x-base44"]?.title || value?.["x-base44"]?.description || key || `الخطوة ${index + 1}`;
      const functionName = value?.with?.function_name;
      nodes.push({ type: "action", title: `الإجراء ${index + 1}`, label: title, detail: functionName ? `Backend: ${functionName}` : value?.call, icon: Play });
    });
  } else {
    (rule.actions || []).forEach((action, index) => {
      nodes.push({ type: "action", title: `الإجراء ${index + 1}`, label: ACTION_TYPE_CONFIG[action.action_type]?.label || action.action_type, icon: ACTION_TYPE_CONFIG[action.action_type]?.icon || Play });
    });
  }

  if (rule.integration_trigger && rule.integration_trigger !== "none") {
    nodes.push({ type: "integration", title: "التكامل / المخرجات", label: INTEGRATION_LABELS[rule.integration_trigger] || rule.integration_trigger, icon: Link2 });
  }
  return { source, nodes };
}

function AccessDenied() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <Card className="max-w-md w-full border-r-4 border-red-400">
        <CardContent className="p-8 text-center">
          <ShieldAlert className="w-10 h-10 text-red-500 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-[#4A3F35] mb-2">هذه الصفحة مخصصة للمشرفين فقط</h2>
          <p className="text-sm text-slate-500">غير مصرح لك بالوصول إلى سير العمل والأتمتة.</p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AdminWorkflowAutomation() {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState("workflows");

  const [rules, setRules] = useState([]);
  const [runs, setRuns] = useState([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [workflowFilter, setWorkflowFilter] = useState("all");
  const [selectedWorkflow, setSelectedWorkflow] = useState(null);
  const [selectedNodeIndex, setSelectedNodeIndex] = useState(null);
  const [suggested, setSuggested] = useState(SUGGESTED_WORKFLOWS);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [form, setForm] = useState(emptyRuleForm);
  const [saving, setSaving] = useState(false);
  const [runningId, setRunningId] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const user = await base44.auth.me();
        const admin = user?.role === "admin";
        setIsAdmin(admin);
        if (admin) await loadData();
      } catch {
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const loadData = async () => {
    const [customRules, runsData] = await Promise.all([
      base44.entities.AutomationRule.list("-created_date", 200),
      base44.entities.AutomationRunLog.list("-started_at", 100),
    ]);

    // The primary library comes from the real workflow files in the app.
    // Do not fill this page with templates or sample records.
    const realRules = REAL_WORKFLOW_CATALOG.map((workflow) => ({
      ...workflow,
      _sourceWorkflow: true,
    }));
    const manualRules = (customRules || []).filter(
      (rule) => !rule.is_source_workflow && !rule.is_template && !rule.is_sample
    );
    setRules([...realRules, ...manualRules]);
    setRuns(runsData);
  };

  const openCreateDialog = () => {
    setEditingRule(null);
    setForm(emptyRuleForm);
    setDialogOpen(true);
  };

  const openEditDialog = (rule) => {
    setEditingRule(rule);
    setForm({
      name: rule.name || "",
      description: rule.description || "",
      is_active: rule.is_active !== false,
      trigger_type: rule.trigger_type || "event",
      trigger_event: rule.trigger_event || "project_created",
      schedule_cron: rule.schedule_cron || "",
      integration_trigger: rule.integration_trigger || "none",
      category: rule.category || "other",
      actions: rule.actions?.length ? rule.actions : [{ action_type: "send_notification", config: {} }],
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const user = await base44.auth.me();
      const payload = { ...form, created_by_email: editingRule?.created_by_email || user?.email };
      if (editingRule) {
        await base44.entities.AutomationRule.update(editingRule.id, payload);
      } else {
        await base44.entities.AutomationRule.create({ ...payload, run_count: 0, last_run_status: "never_run" });
      }
      setDialogOpen(false);
      await loadData();
    } catch (error) {
      console.error("Error saving automation rule:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (rule) => {
    if (rule._sourceWorkflow) return;
    if (!window.confirm(`حذف قاعدة "${rule.name}"؟ لا يمكن التراجع عن هذا الإجراء.`)) return;
    await base44.entities.AutomationRule.delete(rule.id);
    await loadData();
  };

  const handleToggleActive = async (rule) => {
    if (rule._sourceWorkflow) return;
    await base44.entities.AutomationRule.update(rule.id, { is_active: !rule.is_active });
    await loadData();
  };

  // تشغيل تجريبي يدوي — ينشئ سجل تنفيذ (TEST) دون تنفيذ إجراءات فعلية على بيانات حقيقية
  const handleRunNow = async (rule) => {
    setRunningId(rule.id);
    try {
      const user = await base44.auth.me();
      const startedAt = new Date().toISOString();
      const stepsLog = (rule.actions || []).map((a) => ({
        action_type: a.action_type,
        status: "success",
        message: `تشغيل تجريبي — ${ACTION_TYPE_CONFIG[a.action_type]?.label || a.action_type} (بدون تأثير فعلي على البيانات)`,
      }));
      const endedAt = new Date().toISOString();

      await base44.entities.AutomationRunLog.create({
        rule_id: rule.id,
        rule_name: rule.name,
        status: "success",
        triggered_by: "manual_test",
        triggered_by_email: user?.email,
        started_at: startedAt,
        ended_at: endedAt,
        duration_ms: new Date(endedAt) - new Date(startedAt),
        steps_log: stepsLog,
      });

      if (!rule._sourceWorkflow) {
        await base44.entities.AutomationRule.update(rule.id, {
          run_count: (rule.run_count || 0) + 1,
        last_run_at: endedAt,
          last_run_status: "success",
        });
      }

      await loadData();
      setActiveTab("activity");
    } catch (error) {
      console.error("Error running automation rule:", error);
    } finally {
      setRunningId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#C9A66B] animate-spin" />
      </div>
    );
  }

  if (!isAdmin) {
    return <AccessDenied />;
  }

  const filteredRuns = statusFilter === "all" ? runs : runs.filter((r) => r.status === statusFilter);
  const filteredRules = rules.filter((rule) => {
    const q = search.trim().toLowerCase();
    const matchesSearch = !q || `${rule.name || ""} ${rule.description || ""}`.toLowerCase().includes(q);
    const matchesStatus = workflowFilter === "all" || (workflowFilter === "active" ? rule.is_active !== false : rule.is_active === false);
    return matchesSearch && matchesStatus;
  });

  const openWorkflowDetails = (rule) => { setSelectedWorkflow(rule); setSelectedNodeIndex(null); };

  const addSuggestedWorkflow = async (template) => {
    try {
      await base44.entities.AutomationRule.create({
        name: template.name, description: template.description, is_active: false,
        trigger_type: template.trigger_type, trigger_event: template.trigger_event || null,
        schedule_cron: template.schedule_cron || null, integration_trigger: "none",
        category: template.category, actions: template.actions, is_template: true,
        run_count: 0, last_run_status: "never_run",
      });
      setSuggested((items) => items.filter((item) => item.id !== template.id));
      await loadData();
    } catch (error) { console.error("Error adding suggested workflow:", error); }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#4A3F35] flex items-center gap-2">
            <Workflow className="w-6 h-6 text-[#C9A66B]" />
            سير العمل والأتمتة
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            إنشاء وإدارة قواعد الأتمتة الخاصة بالمنصة، ومتابعة سجل التنفيذ.
          </p>
        </div>
        <Button onClick={openCreateDialog} className="gap-2 bg-[#4A3F35] hover:bg-[#3a3128]">
          <Plus className="w-4 h-4" />
          سير عمل جديد
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="workflows" className="gap-1.5">
            <Workflow className="w-4 h-4" />
            سير العمل
          </TabsTrigger>
          <TabsTrigger value="activity" className="gap-1.5">
            <ListChecks className="w-4 h-4" />
            النشاط
          </TabsTrigger>
        </TabsList>

        {/* ── تبويب سير العمل ── */}
        <TabsContent value="workflows">
          {suggested.length > 0 && (
            <section className="mb-6">
              <div className="mb-3"><h2 className="font-bold text-[#4A3F35] flex items-center gap-2"><Sparkles className="w-4 h-4 text-[#C9A66B]" />سير العمل المقترح</h2><p className="text-xs text-slate-500 mt-1">قوالب جاهزة منفصلة عن الأتمتة الحالية. لا تصبح مفعّلة إلا بعد إضافتها.</p></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {suggested.map((template) => <Card key={template.id} className="border-dashed border-[#C9A66B]/50 bg-[#FEFCF7] hover:shadow-md transition-shadow"><CardContent className="p-4"><div className="flex items-start justify-between gap-2"><div className="min-w-0"><div className="flex items-center gap-2"><p className="font-semibold text-sm text-[#4A3F35] truncate">{template.name}</p><Badge variant="outline" className="text-[10px] shrink-0">اقتراح</Badge></div><p className="text-xs text-slate-500 mt-1 line-clamp-3">{template.description}</p><div className="flex flex-wrap gap-1 mt-2"><Badge variant="outline" className="text-[10px]">{TRIGGER_TYPE_CONFIG[template.trigger_type]?.label || template.trigger_type}</Badge><Badge variant="outline" className="text-[10px]">{template.actions?.length || 0} إجراءات</Badge></div></div><Button size="icon" variant="outline" className="shrink-0" aria-label={`إضافة ${template.name}`} onClick={() => addSuggestedWorkflow(template)}><Plus className="w-4 h-4" /></Button></div><div className="mt-3 pt-3 border-t text-[11px] text-slate-400">لا تُفعّل ولا تعدّل أي أتمتة حقيقية حتى تختاري إضافتها.</div></CardContent></Card>)}
              </div>
            </section>
          )}
          <div className="flex flex-wrap items-center gap-2 mb-5"><div className="relative flex-1 min-w-[220px]"><Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /><Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="البحث بالاسم" className="pr-9" /></div><Select value={workflowFilter} onValueChange={setWorkflowFilter}><SelectTrigger className="w-44"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">كل الحالات</SelectItem><SelectItem value="active">نشط</SelectItem><SelectItem value="inactive">متوقف</SelectItem></SelectContent></Select></div>
          {filteredRules.length === 0 ? (
            <Card className="border-dashed border-2">
              <CardContent className="p-10 text-center text-slate-500">
                <Workflow className="w-10 h-10 mx-auto mb-3 text-slate-300" />
                لا توجد قواعد أتمتة بعد. اضغطي "سير عمل جديد" للبدء.
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredRules.map((rule) => {
                const triggerCfg = TRIGGER_TYPE_CONFIG[rule.trigger_type] || TRIGGER_TYPE_CONFIG.manual;
                const TriggerIcon = triggerCfg.icon;
                return (
                  <Card key={rule.id} className="border-r-4 border-[#C9A66B] hover:shadow-md transition-shadow cursor-pointer" onClick={() => openWorkflowDetails(rule)}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="font-semibold text-[#4A3F35] text-sm truncate">{rule.name}</p>
                            {rule._sourceWorkflow && (
                              <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded px-1.5 py-0.5 shrink-0">
                                مكتشف من التطبيق
                              </span>
                            )}
                            {rule.is_template && !rule._sourceWorkflow && (
                              <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-[#8a6d3b] bg-[#FEF9EE] border border-[#C9A66B]/40 rounded px-1.5 py-0.5 shrink-0">
                                <Sparkles className="w-2.5 h-2.5" />
                                قالب جاهز
                              </span>
                            )}
                          </div>
                          {rule.description && (
                            <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{rule.description}</p>
                          )}
                        </div>
                        <div onClick={(e) => e.stopPropagation()}><Switch checked={rule.is_active !== false} disabled={rule._sourceWorkflow} onCheckedChange={() => handleToggleActive(rule)} /></div>
                      </div>

                      <div className="flex flex-wrap gap-1.5 mb-3">
                        <Badge variant="outline" className={`text-xs gap-1 ${triggerCfg.color}`}>
                          <TriggerIcon className="w-3 h-3" />
                          {triggerCfg.label}
                        </Badge>
                        {rule.trigger_type === "event" && rule.trigger_event && (
                          <Badge variant="outline" className="text-xs">
                            {TRIGGER_EVENT_LABELS[rule.trigger_event] || rule.trigger_event}
                          </Badge>
                        )}
                        <Badge variant="outline" className="text-xs">{CATEGORY_LABELS[rule.category] || rule.category}</Badge>
                      </div>

                      <div className="flex flex-wrap gap-1 mb-3">
                        {(rule.actions || []).map((a, i) => {
                          const ActionIcon = ACTION_TYPE_CONFIG[a.action_type]?.icon || Zap;
                          return (
                            <span key={i} className="inline-flex items-center gap-1 text-[11px] text-slate-500 bg-slate-50 rounded px-1.5 py-0.5">
                              <ActionIcon className="w-3 h-3" />
                              {ACTION_TYPE_CONFIG[a.action_type]?.label || a.action_type}
                            </span>
                          );
                        })}
                      </div>

                      {rule._sourceWorkflow && (rule.sourceEntity || rule.sourceFunctions?.length) && (
                        <p className="text-[11px] text-slate-400 mb-2">
                          المصدر: {rule.sourceEntity ? `كيان ${rule.sourceEntity}` : "مهمة مجدولة"}
                          {rule.sourceEvents?.length ? ` · ${rule.sourceEvents.join(", ")}` : ""}
                          {rule.sourceFunctions?.length ? ` · ${rule.sourceFunctions.join(", ")}` : ""}
                        </p>
                      )}

                      {rule.integration_trigger && rule.integration_trigger !== "none" && (
                        <p className="text-[11px] text-slate-400 mb-2 flex items-center gap-1">
                          <Link2 className="w-3 h-3" />
                          تكامل: {INTEGRATION_LABELS[rule.integration_trigger]}
                        </p>
                      )}

                      <div className="flex items-center justify-between text-[11px] text-slate-400 mb-3">
                        <span>عدد مرات التنفيذ: {rule.run_count || 0}</span>
                        {rule.last_run_status && rule.last_run_status !== "never_run" && (
                          <Badge className={`text-[10px] ${RUN_STATUS_CONFIG[rule.last_run_status]?.badge}`}>
                            {RUN_STATUS_CONFIG[rule.last_run_status]?.label}
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1.5 flex-1"
                          disabled={runningId === rule.id}
                          onClick={(e) => { e.stopPropagation(); handleRunNow(rule); }}
                        >
                          {runningId === rule.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                          تشغيل تجريبي
                        </Button>
                        {!rule._sourceWorkflow && (
                          <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); openEditDialog(rule); }}>
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                        )}
                        {!rule._sourceWorkflow && (
                          <Button size="sm" variant="ghost" className="text-red-600 hover:bg-red-50" onClick={(e) => { e.stopPropagation(); handleDelete(rule); }}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* ── تبويب النشاط (سجل التنفيذ) ── */}
        <TabsContent value="activity">
          <section className="mb-6">
            <div className="flex items-center justify-between gap-3 mb-3">
              <div><h2 className="font-bold text-[#4A3F35] flex items-center gap-2"><Zap className="w-4 h-4 text-emerald-600" />الأتمتة النشطة</h2><p className="text-xs text-slate-500 mt-1">هنا تظهر كل الأتمتة المفعّلة حاليًا، بما فيها الأتمتة الحقيقية المكتشفة من التطبيق.</p></div>
              <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200">{rules.filter((r) => r.is_active !== false).length} نشطة</Badge>
            </div>
            {rules.filter((r) => r.is_active !== false).length === 0 ? (
              <Card className="border-dashed"><CardContent className="p-6 text-center text-sm text-slate-400">لا توجد أتمتة نشطة حاليًا.</CardContent></Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {rules.filter((r) => r.is_active !== false).map((rule) => {
                  const triggerCfg = TRIGGER_TYPE_CONFIG[rule.trigger_type] || TRIGGER_TYPE_CONFIG.manual;
                  const TriggerIcon = triggerCfg.icon;
                  return <button key={rule.id} type="button" onClick={() => openWorkflowDetails(rule)} className="text-right bg-white border rounded-xl p-4 hover:shadow-md hover:border-[#C9A66B] transition-all focus:outline-none focus:ring-2 focus:ring-[#C9A66B]/40"><div className="flex items-start justify-between gap-2"><div className="min-w-0"><div className="flex items-center gap-2"><p className="font-semibold text-sm text-[#4A3F35] truncate">{rule.name}</p>{rule._sourceWorkflow && <Badge className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">حقيقية</Badge>}</div><p className="text-xs text-slate-500 mt-1 line-clamp-2">{rule.description || "أتمتة مفعّلة"}</p></div><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0 mt-1" title="نشطة" /></div><div className="flex items-center gap-2 mt-3 text-[11px] text-slate-500"><span className="inline-flex items-center gap-1"><TriggerIcon className="w-3 h-3" />{triggerCfg.label}</span><span>·</span><span>{rule.run_count || 0} تشغيل</span></div></button>;
                })}
              </div>
            )}
          </section>
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-4 h-4 text-slate-400" />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل الحالات</SelectItem>
                <SelectItem value="success">ناجح</SelectItem>
                <SelectItem value="failed">فشل</SelectItem>
                <SelectItem value="running">قيد التنفيذ</SelectItem>
                <SelectItem value="cancelled">ملغى</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {filteredRuns.length === 0 ? (
            <Card className="border-dashed border-2">
              <CardContent className="p-10 text-center text-slate-500">
                <ListChecks className="w-10 h-10 mx-auto mb-3 text-slate-300" />
                لا يوجد نشاط بعد. شغّلي أحد قواعد سير العمل لتظهر هنا.
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0 divide-y">
                {filteredRuns.map((run) => {
                  const cfg = RUN_STATUS_CONFIG[run.status] || RUN_STATUS_CONFIG.running;
                  const StatusIcon = cfg.icon;
                  return (
                    <div key={run.id} className="p-4 flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0">
                        <StatusIcon className={`w-4 h-4 mt-1 shrink-0 ${cfg.color}`} />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-[#4A3F35] truncate">{run.rule_name}</p>
                          <p className="text-xs text-slate-400 mt-0.5">
                            {TRIGGERED_BY_LABELS[run.triggered_by] || run.triggered_by}
                            {run.started_at && ` · ${new Date(run.started_at).toLocaleString("ar-SA")}`}
                            {typeof run.duration_ms === "number" && ` · ${run.duration_ms} مللي ثانية`}
                          </p>
                          {run.error_message && (
                            <p className="text-xs text-red-500 mt-1">{run.error_message}</p>
                          )}
                        </div>
                      </div>
                      <Badge className={`text-xs shrink-0 ${cfg.badge}`}>{cfg.label}</Badge>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* ── تفاصيل الـ Workflow مثل محرر Base44 ── */}
      <Dialog open={!!selectedWorkflow} onOpenChange={(open) => { if (!open) { setSelectedWorkflow(null); setSelectedNodeIndex(null); } }}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto p-0">
          <DialogHeader className="sr-only"><DialogTitle>تفاصيل سير العمل</DialogTitle></DialogHeader>
          {selectedWorkflow && (() => {
            const { source, nodes } = buildWorkflowNodes(selectedWorkflow);
            const workflowRuns = runs.filter((r) => r.rule_id === selectedWorkflow.id || r.rule_name === selectedWorkflow.name).slice(0, 8);
            const successCount = workflowRuns.filter((r) => r.status === "success").length;
            const successRate = workflowRuns.length ? Math.round((successCount / workflowRuns.length) * 100) : null;
            return (
              <div dir="rtl">
                <div className="p-5 border-b bg-[#FEFCF7] flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1"><Workflow className="w-5 h-5 text-[#C9A66B]" /><h2 className="text-xl font-bold text-[#4A3F35]">{selectedWorkflow.name}</h2>{selectedWorkflow._sourceWorkflow && <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200">موجود فعليًا في التطبيق</Badge>}</div>
                    <p className="text-sm text-slate-500 max-w-3xl">{selectedWorkflow.description || "لا يوجد وصف مسجل."}</p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setSelectedWorkflow(null)}><X className="w-4 h-4" /></Button>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] min-h-[520px]">
                  <div className="p-6 bg-white">
                    <div className="flex items-center justify-between mb-5"><div><h3 className="font-bold text-[#4A3F35]">سير العمل</h3><p className="text-xs text-slate-400 mt-1">تسلسل حقيقي مستخرج من تعريف الـ Workflow عند توفره.</p></div><Button size="sm" variant="outline" className="gap-1.5" disabled={runningId === selectedWorkflow.id} onClick={() => handleRunNow(selectedWorkflow)}><Play className="w-3.5 h-3.5" />انطلق الآن</Button></div>
                    <div className="space-y-0 max-w-2xl mx-auto">
                      {nodes.map((node, index) => { const NodeIcon = node.icon || Zap; return <React.Fragment key={`${node.type}-${index}`}>
                        <button type="button" onClick={() => setSelectedNodeIndex(index)} className={`w-full text-right rounded-xl border shadow-sm p-4 flex items-start gap-3 transition-all hover:shadow-md hover:border-[#C9A66B] focus:outline-none focus:ring-2 focus:ring-[#C9A66B]/40 ${selectedNodeIndex === index ? "border-[#C9A66B] ring-2 ring-[#C9A66B]/20 bg-[#FFFCF5]" : "bg-white"}`}><div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${node.type === "trigger" ? "bg-blue-50 text-blue-600" : node.type === "condition" ? "bg-amber-50 text-amber-600" : node.type === "integration" ? "bg-violet-50 text-violet-600" : "bg-emerald-50 text-emerald-600"}`}><NodeIcon className="w-5 h-5" /></div><div className="min-w-0 flex-1"><p className="text-xs text-slate-400 mb-1">{node.title}</p><p className="font-semibold text-sm text-[#4A3F35]">{node.label}</p>{node.detail && <p className="text-[11px] text-slate-400 mt-1 font-mono">{node.detail}</p>}<p className="text-[11px] text-[#C9A66B] mt-2">اضغط لعرض التفاصيل</p></div><Eye className={`w-4 h-4 shrink-0 mt-1 ${selectedNodeIndex === index ? "text-[#C9A66B]" : "text-slate-300"}`} /></button>
                        {index < nodes.length - 1 && <div className="h-7 border-r-2 border-dashed border-slate-200 mr-5" />}
                      </React.Fragment>; })}
                    </div>
                  </div>
                  <aside className="border-r bg-slate-50/60 p-5">
                    <div className="flex items-center justify-between mb-4"><h3 className="font-bold text-[#4A3F35]">تفاصيل الأتمتة</h3><Eye className="w-4 h-4 text-slate-400" /></div>
                    {selectedNodeIndex !== null && nodes[selectedNodeIndex] && <div className="mb-4 p-4 rounded-xl border border-[#C9A66B]/40 bg-[#FFFCF5]"><div className="flex items-center gap-2 mb-2"><GitBranch className="w-4 h-4 text-[#C9A66B]" /><h4 className="font-bold text-sm text-[#4A3F35]">تفاصيل الخطوة</h4></div><p className="text-xs text-slate-500 mb-1">{nodes[selectedNodeIndex].title}</p><p className="font-semibold text-sm text-[#4A3F35]">{nodes[selectedNodeIndex].label}</p>{nodes[selectedNodeIndex].detail && <p className="text-[11px] text-slate-500 mt-2 font-mono break-all">{nodes[selectedNodeIndex].detail}</p>}{nodes[selectedNodeIndex].type === "trigger" && <p className="text-xs text-slate-500 mt-2">هذه الخطوة تحدد متى يبدأ سير العمل.</p>}{nodes[selectedNodeIndex].type === "condition" && <p className="text-xs text-slate-500 mt-2">هذه الشروط يجب تحققها قبل تنفيذ الإجراءات التالية.</p>}{nodes[selectedNodeIndex].type === "action" && <p className="text-xs text-slate-500 mt-2">هذا الإجراء ينفذ بعد تحقق المشغّل والشروط.</p>}{nodes[selectedNodeIndex].type === "integration" && <p className="text-xs text-slate-500 mt-2">هذا هو التكامل أو المخرج الخارجي المستخدم في هذه الخطوة.</p>}</div>}
                    <div className="space-y-3 text-sm">
                      <div className="p-3 rounded-lg bg-white border"><p className="text-xs text-slate-400">الحالة</p><p className="font-medium mt-1">{selectedWorkflow.is_active !== false ? "نشط" : "متوقف"}</p></div>
                      <div className="p-3 rounded-lg bg-white border"><p className="text-xs text-slate-400">المُشغّل</p><p className="font-medium mt-1">{sourceTriggerLabel(source, selectedWorkflow)}</p></div>
                      {selectedWorkflow.sourceEntity && <div className="p-3 rounded-lg bg-white border"><p className="text-xs text-slate-400">المصدر</p><p className="font-medium mt-1 flex items-center gap-1"><Database className="w-3.5 h-3.5" />{selectedWorkflow.sourceEntity}</p></div>}
                      <div className="grid grid-cols-2 gap-2"><div className="p-3 rounded-lg bg-white border"><p className="text-xs text-slate-400">مرات التشغيل</p><p className="font-bold mt-1">{selectedWorkflow.run_count || 0}</p></div><div className="p-3 rounded-lg bg-white border"><p className="text-xs text-slate-400">نسبة النجاح</p><p className="font-bold mt-1">{successRate === null ? "—" : `${successRate}%`}</p></div></div>
                      <div className="p-3 rounded-lg bg-white border"><p className="text-xs text-slate-400">آخر تشغيل</p><p className="font-medium mt-1">{selectedWorkflow.last_run_at ? new Date(selectedWorkflow.last_run_at).toLocaleString("ar-SA") : "لم يُسجّل بعد"}</p></div>
                    </div>
                    {source?.definition?.do?.length > 0 && <div className="mt-5"><p className="text-xs font-semibold text-slate-500 mb-2">الخطوات الأصلية</p><div className="space-y-1">{source.definition.do.map((step, i) => <div key={i} className="text-[11px] bg-white border rounded p-2 font-mono break-all">{Object.keys(step)[0]}</div>)}</div></div>}
                  </aside>
                </div>
                <div className="border-t p-5 bg-white"><div className="flex items-center gap-2 mb-3"><ListChecks className="w-4 h-4 text-[#C9A66B]" /><h3 className="font-bold text-[#4A3F35]">سجل التنفيذ</h3></div>{workflowRuns.length === 0 ? <p className="text-sm text-slate-400">لا توجد سجلات تنفيذ مسجلة لهذه الأتمتة حتى الآن.</p> : <div className="space-y-2">{workflowRuns.map((run) => { const cfg = RUN_STATUS_CONFIG[run.status] || RUN_STATUS_CONFIG.running; return <div key={run.id} className="flex items-center justify-between gap-3 border rounded-lg p-3"><div><p className="text-sm font-medium">{run.started_at ? new Date(run.started_at).toLocaleString("ar-SA") : "—"}</p><p className="text-xs text-slate-400">{TRIGGERED_BY_LABELS[run.triggered_by] || run.triggered_by}{run.duration_ms != null ? ` · ${run.duration_ms} مللي ثانية` : ""}</p>{run.error_message && <p className="text-xs text-red-500 mt-1">{run.error_message}</p>}</div><Badge className={cfg.badge}>{cfg.label}</Badge></div>; })}</div>}</div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* ── نافذة إنشاء/تعديل قاعدة أتمتة ── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingRule ? "تعديل سير العمل" : "سير عمل جديد"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">الاسم</label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="مثال: إشعار عند فتح نزاع جديد" />
            </div>
            <div>
              <label className="text-sm font-medium">الوصف</label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">التصنيف</label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">نوع المُشغّل</label>
                <Select value={form.trigger_type} onValueChange={(v) => setForm({ ...form, trigger_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(TRIGGER_TYPE_CONFIG).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {form.trigger_type === "event" && (
              <div>
                <label className="text-sm font-medium">الحدث المُشغّل</label>
                <Select value={form.trigger_event} onValueChange={(v) => setForm({ ...form, trigger_event: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(TRIGGER_EVENT_LABELS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {form.trigger_type === "schedule" && (
              <div>
                <label className="text-sm font-medium">الجدولة</label>
                <Input value={form.schedule_cron} onChange={(e) => setForm({ ...form, schedule_cron: e.target.value })} placeholder="مثال: يوميًا الساعة 9 صباحًا" />
              </div>
            )}

            <div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">خطوات التنفيذ (بالترتيب)</label>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="h-7 gap-1 text-xs"
                  onClick={() => setForm({ ...form, actions: [...form.actions, { action_type: "send_notification", config: {} }] })}
                >
                  <Plus className="w-3.5 h-3.5" />
                  إضافة خطوة
                </Button>
              </div>
              <div className="space-y-2 mt-1">
                {form.actions.map((action, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="text-xs text-slate-400 w-4 shrink-0">{idx + 1}.</span>
                    <Select
                      value={action.action_type}
                      onValueChange={(v) => {
                        const updated = [...form.actions];
                        updated[idx] = { ...updated[idx], action_type: v };
                        setForm({ ...form, actions: updated });
                      }}
                    >
                      <SelectTrigger className="flex-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(ACTION_TYPE_CONFIG).map(([k, v]) => (
                          <SelectItem key={k} value={k}>{v.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {form.actions.length > 1 && (
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="text-red-500 hover:bg-red-50 shrink-0"
                        onClick={() => setForm({ ...form, actions: form.actions.filter((_, i) => i !== idx) })}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">تكامل خارجي (اختياري)</label>
              <Select value={form.integration_trigger} onValueChange={(v) => setForm({ ...form, integration_trigger: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(INTEGRATION_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
              <label className="text-sm">مفعّلة</label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>إلغاء</Button>
            <Button onClick={handleSave} disabled={saving || !form.name} className="gap-2 bg-[#4A3F35] hover:bg-[#3a3128]">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              حفظ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}