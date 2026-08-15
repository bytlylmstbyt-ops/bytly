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
    if (!window.confirm(`حذف قاعدة "${rule.name}"؟ لا يمكن التراجع عن هذا الإجراء.`)) return;
    await base44.entities.AutomationRule.delete(rule.id);
    await loadData();
  };

  const handleToggleActive = async (rule) => {
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

      await base44.entities.AutomationRule.update(rule.id, {
        run_count: (rule.run_count || 0) + 1,
        last_run_at: endedAt,
        last_run_status: "success",
      });

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
          {rules.length === 0 ? (
            <Card className="border-dashed border-2">
              <CardContent className="p-10 text-center text-slate-500">
                <Workflow className="w-10 h-10 mx-auto mb-3 text-slate-300" />
                لا توجد قواعد أتمتة بعد. اضغطي "سير عمل جديد" للبدء.
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {rules.map((rule) => {
                const triggerCfg = TRIGGER_TYPE_CONFIG[rule.trigger_type] || TRIGGER_TYPE_CONFIG.manual;
                const TriggerIcon = triggerCfg.icon;
                return (
                  <Card key={rule.id} className="border-r-4 border-[#C9A66B] hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="font-semibold text-[#4A3F35] text-sm truncate">{rule.name}</p>
                            {rule.is_template && (
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
                        <Switch checked={rule.is_active !== false} onCheckedChange={() => handleToggleActive(rule)} />
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
                          onClick={() => handleRunNow(rule)}
                        >
                          {runningId === rule.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                          تشغيل تجريبي
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => openEditDialog(rule)}>
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button size="sm" variant="ghost" className="text-red-600 hover:bg-red-50" onClick={() => handleDelete(rule)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
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
