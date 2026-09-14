import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle, TrendingUp, TrendingDown, Clock,
  Wallet, ListChecks, Activity, RefreshCw, Bell,
  ChevronLeft, Sparkles, AlertCircle, CheckCircle2, Loader2
} from "lucide-react";

const severityStyles = {
  high:   { bg: "bg-red-50",     border: "border-red-200",     text: "text-red-700",     icon: AlertTriangle, badge: "destructive" },
  medium: { bg: "bg-amber-50",   border: "border-amber-200",   text: "text-amber-700",   icon: AlertCircle,   badge: "secondary" },
  low:    { bg: "bg-blue-50",    border: "border-blue-200",    text: "text-blue-700",    icon: Bell,          badge: "outline" }
};

const categoryIcons = {
  delays:       Clock,
  budget:       Wallet,
  scope:        ListChecks,
  satisfaction: Activity,
  progress:     TrendingUp,
  general:      Bell
};

function daysBetween(a, b) {
  return Math.floor((new Date(b).getTime() - new Date(a).getTime()) / (1000 * 60 * 60 * 24));
}

// Compute smart alerts purely from the client's project data
function computeAlerts(projects, milestones, tasks) {
  const alerts = [];
  const now = new Date();

  for (const p of projects) {
    if (p.status !== "in_progress") continue;
    const pMs = milestones.filter(m => m.project_id === p.id);
    const pTasks = tasks.filter(t => t.project_id === p.id);

    // 1) Overdue milestones
    const overdueMs = pMs.filter(m =>
      m.due_date && new Date(m.due_date) < now &&
      !["completed", "approved", "firm_approved"].includes(m.status)
    );
    overdueMs.forEach(m => {
      const late = daysBetween(m.due_date, now);
      alerts.push({
        project_id: p.id,
        project_title: p.title,
        severity: late > 7 ? "high" : "medium",
        category: "delays",
        title: `مرحلة متأخرة: ${m.title}`,
        description: `تأخرت مرحلة "${m.title}" في مشروع "${p.title}" بمقدار ${late} يوم عن موعد الاستحقاق.`,
        action_url: `/ProjectMilestones?project=${p.id}`
      });
    });

    // 2) Schedule health — deadline approaching with low completion
    if (p.deadline && p.start_date) {
      const scheduled = daysBetween(p.start_date, p.deadline);
      const elapsed = daysBetween(p.start_date, now);
      if (scheduled > 0 && elapsed > 0) {
        const completionRate = pTasks.length > 0
          ? (pTasks.filter(t => t.status === "done").length / pTasks.length) * 100
          : 0;
        const expectedRate = (elapsed / scheduled) * 100;
        if (elapsed < scheduled && (expectedRate - completionRate) > 25) {
          alerts.push({
            project_id: p.id,
            project_title: p.title,
            severity: "high",
            category: "progress",
            title: `تباطؤ واضح في ${p.title}`,
            description: `نسبة الإنجاز ${completionRate.toFixed(0)}% بينما مضى ${elapsed} من أصل ${scheduled} يوم. الفجوة ${Math.round(expectedRate - completionRate)}%.`,
            action_url: `/ProjectDetails?id=${p.id}`
          });
        }
        const remaining = scheduled - elapsed;
        if (remaining <= 7 && remaining >= 0) {
          alerts.push({
            project_id: p.id,
            project_title: p.title,
            severity: "medium",
            category: "delays",
            title: `اقتراب موعد التسليم — ${p.title}`,
            description: `بقي ${remaining} يوم على الموعد النهائي لتسليم المشروع.`,
            action_url: `/ProjectDetails?id=${p.id}`
          });
        }
      }
    }

    // 3) Revision-heavy milestones (scope creep signal)
    const heavyRevisionMs = pMs.filter(m => (m.revision_count || 0) >= 3);
    heavyRevisionMs.forEach(m => {
      alerts.push({
        project_id: p.id,
        project_title: p.title,
        severity: "medium",
        category: "scope",
        title: `طلبات تعديل متكررة — ${m.title}`,
        description: `طلبت ${m.revision_count} تعديلات على مرحلة "${m.title}". قد يشير ذلك إلى تغيّر نطاق العمل.`,
        action_url: `/ProjectMilestones?project=${p.id}`
      });
    });

    // 4) Stalled project (no milestones submitted recently)
    const inProgressMs = pMs.filter(m => ["in_progress", "submitted"].includes(m.status));
    const lastActivity = pMs
      .map(m => m.submitted_date || m.completion_date || m.start_date)
      .filter(Boolean)
      .sort((a, b) => new Date(b) - new Date(a))[0];
    if (inProgressMs.length > 0 && lastActivity) {
      const sinceActivity = daysBetween(lastActivity, now);
      if (sinceActivity > 10) {
        alerts.push({
          project_id: p.id,
          project_title: p.title,
          severity: sinceActivity > 20 ? "high" : "medium",
          category: "satisfaction",
          title: `لا نشاط منذ ${sinceActivity} يوم — ${p.title}`,
          description: `لم يتم تسليم أو تحديث أي مرحلة في "${p.title}" منذ أكثر من ${sinceActivity} يوم. يُنصح بمتابعة المهندس.`,
          action_url: `/Messages?project=${p.id}`
        });
      }
    }

    // 5) Budget utilization warning
    if (p.budget_max && p.escrow_amount) {
      const util = (p.escrow_amount / p.budget_max) * 100;
      if (util > 80) {
        alerts.push({
          project_id: p.id,
          project_title: p.title,
          severity: "high",
          category: "budget",
          title: `استهلاك مرتفع للميزانية — ${p.title}`,
          description: `تم استخدام ${util.toFixed(0)}% من ميزانية المشروع البالغة ${p.budget_max.toLocaleString('ar-SA')} ر.س.`,
          action_url: `/Wallet`
        });
      }
    }
  }

  return alerts.sort((a, b) => {
    const order = { high: 0, medium: 1, low: 2 };
    return order[a.severity] - order[b.severity];
  });
}

export default function SmartAlertsDashboard({ client }) {
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [projects, setProjects] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [digest, setDigest] = useState(null);
  const [expandedAlert, setExpandedAlert] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const user = await base44.auth.me();
      const [clientData] = await base44.entities.Client.filter({ email: user.email });
      if (!clientData) { setLoading(false); return; }

      const projs = await base44.entities.Project.filter({ client_id: clientData.id });
      const activeProjects = projs.filter(p => p.status === "in_progress");
      setProjects(projs);

      // Load milestones + tasks for active projects
      const allMs = await base44.entities.ProjectMilestone.filter({});
      const allTasks = await base44.entities.ProjectTask.filter({});
      const myMs = allMs.filter(m => activeProjects.some(p => p.id === m.project_id));
      const myTasks = allTasks.filter(t => activeProjects.some(p => p.id === t.project_id));
      setMilestones(myMs);
      setTasks(myTasks);

      // System notifications addressed to this client
      const notifs = await base44.entities.Notification.filter({ recipient_email: user.email });
      const relevant = notifs
        .filter(n => ["project_update", "project_status", "milestone", "complaint", "system"].includes(n.type))
        .sort((a, b) => new Date(b.created_date) - new Date(a.created_date))
        .slice(0, 8);
      setNotifications(relevant);

      const computed = computeAlerts(activeProjects, myMs, myTasks);
      setAlerts(computed);

      // Generate AI weekly digest (only if there are active projects)
      if (activeProjects.length > 0) {
        setAnalyzing(true);
        try {
          const projectSummaries = activeProjects.map(p => {
            const pMs = myMs.filter(m => m.project_id === p.id);
            const pTasks = myTasks.filter(t => t.project_id === p.id);
            const done = pTasks.filter(t => t.status === "done").length;
            const overdue = pMs.filter(m => m.due_date && new Date(m.due_date) < new Date() && !["completed","approved","firm_approved"].includes(m.status)).length;
            return `- "${p.title}": الحالة ${p.status}، ${pTasks.length} مهمة (${done} مكتملة)، ${pMs.length} مرحلة (${overdue} متأخرة)${p.deadline ? `، الموعد النهائي ${p.deadline}` : ""}`;
          }).join("\n");

          const alertsText = computed.slice(0, 6).map(a => `• [${a.severity}] ${a.title}: ${a.description}`).join("\n");

          const result = await base44.integrations.Core.InvokeLLM({
            prompt: `أنت Bytly AI — المساعد الذكي لمتابعة المشاريع الهندسية في منصة بيتلي.
حلل حالة مشاريع العميل النشطة وقدم ملخصاً تنفيذياً أسبوعياً مختصراً يغطي:
1. مؤشر الصحة العام للمشاريع (0-100)
2. أهم 3 مخاطر حالية مع التوصية لكل منها
3. التوقع لـ 7 أيام قادمة (هل يتحسن الوضع أم يتدهور؟)
4. إجراء واحد موصى به هذا الأسبوع

بيانات المشاريع النشطة للعميل:
${projectSummaries}

التنبيهات المكتشفة آلياً:
${alertsText || "لا توجد تنبيهات حرجة"}

أعد النتيجة JSON بالشكل:
{
  "health_score": <0-100>,
  "trend": "improving|stable|deteriorating",
  "top_risks": [{"title":"","recommendation":""}],
  "next_7_days_outlook": "وصف موجز",
  "recommended_action": "إجراء واحد محدد"
}`,
            response_json_schema: {
              type: "object",
              properties: {
                health_score: { type: "number" },
                trend: { type: "string" },
                top_risks: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      title: { type: "string" },
                      recommendation: { type: "string" }
                    }
                  }
                },
                next_7_days_outlook: { type: "string" },
                recommended_action: { type: "string" }
              }
            }
          });
          setDigest(result);
        } catch (e) {
          console.error("Digest generation failed:", e);
        } finally {
          setAnalyzing(false);
        }
      }
    } catch (err) {
      console.error("SmartAlertsDashboard error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const highCount = alerts.filter(a => a.severity === "high").length;
  const mediumCount = alerts.filter(a => a.severity === "medium").length;

  const healthScore = digest?.health_score ?? Math.max(0, 100 - highCount * 20 - mediumCount * 8);
  const healthColor = healthScore >= 75 ? "#16a34a" : healthScore >= 50 ? "#d97706" : "#dc2626";
  const healthLabel = healthScore >= 75 ? "وضع صحي" : healthScore >= 50 ? "يحتاج متابعة" : "مخاطر مرتفعة";

  if (loading) {
    return (
      <Card className="border-[#C9A66B]/30">
        <CardContent className="py-10 flex items-center justify-center gap-2 text-slate-500">
          <Loader2 className="w-5 h-5 animate-spin" /> جاري تحليل حالة المشاريع...
        </CardContent>
      </Card>
    );
  }

  const activeProjects = projects.filter(p => p.status === "in_progress");

  if (activeProjects.length === 0) {
    return (
      <Card className="border-[#C9A66B]/30 bg-gradient-to-br from-white to-amber-50/40">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-[#4A3F35]">
              <Sparkles className="w-5 h-5 text-[#C9A66B]" />
              التنبيهات الذكية
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={loadData} className="h-8 w-8">
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="text-center py-6 text-slate-500">
          <CheckCircle2 className="w-10 h-10 mx-auto mb-2 text-emerald-500" />
          لا توجد مشاريع نشطة حالياً. ستظهر التنبيهات الذكية فور بدء تنفيذ مشروعك القادم.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-[#C9A66B]/30 bg-gradient-to-br from-white via-white to-amber-50/40 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-[#4A3F35]">
            <Sparkles className="w-5 h-5 text-[#C9A66B]" />
            لوحة التنبيهات الذكية — متابعة أسبوعية
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={loadData} disabled={analyzing}
            className="text-[#6B5D4F] hover:text-[#C9A66B]">
            <RefreshCw className={`w-4 h-4 ml-1 ${analyzing ? "animate-spin" : ""}`} />
            تحديث
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Health score + trend */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="rounded-xl border border-[#C9A66B]/20 bg-white p-4 text-center">
            <p className="text-xs text-slate-500 mb-1">مؤشر الصحة العام</p>
            <p className="text-3xl font-bold" style={{ color: healthColor }}>{Math.round(healthScore)}</p>
            <Badge variant="outline" className="mt-1" style={{ color: healthColor, borderColor: healthColor }}>
              {healthLabel}
            </Badge>
          </div>
          <div className="rounded-xl border border-[#C9A66B]/20 bg-white p-4 flex flex-col justify-center">
            <p className="text-xs text-slate-500 mb-1">الاتجاه المتوقع</p>
            {digest?.trend === "improving" && <span className="flex items-center gap-1 text-emerald-600 font-medium"><TrendingUp className="w-4 h-4" /> في تحسن</span>}
            {digest?.trend === "deteriorating" && <span className="flex items-center gap-1 text-red-600 font-medium"><TrendingDown className="w-4 h-4" /> في تدهور</span>}
            {(!digest?.trend || digest.trend === "stable") && <span className="flex items-center gap-1 text-slate-600 font-medium"><Activity className="w-4 h-4" /> مستقر</span>}
            <p className="text-[11px] text-slate-400 mt-1">
              {analyzing ? "جاري التحليل..." : (digest?.next_7_days_outlook || "لا يوجد توقع متاح")}
            </p>
          </div>
          <div className="rounded-xl border border-[#C9A66B]/20 bg-white p-4 flex items-center justify-around">
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">{highCount}</p>
              <p className="text-[11px] text-slate-500">تنبيهات حرجة</p>
            </div>
            <div className="w-px h-8 bg-slate-200" />
            <div className="text-center">
              <p className="text-2xl font-bold text-amber-600">{mediumCount}</p>
              <p className="text-[11px] text-slate-500">تنبيهات متوسطة</p>
            </div>
          </div>
        </div>

        {/* AI weekly digest */}
        {digest && (
          <div className="rounded-xl border border-[#C9A66B]/30 bg-gradient-to-br from-amber-50/60 to-white p-4">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-[#C9A66B]" />
              <h4 className="text-sm font-semibold text-[#4A3F35]">الملخص الأسبوعي الذكي</h4>
            </div>
            {digest.top_risks?.length > 0 && (
              <div className="space-y-2 mb-3">
                {digest.top_risks.slice(0, 3).map((r, i) => (
                  <div key={i} className="text-sm bg-white/70 rounded-lg p-2 border border-[#C9A66B]/10">
                    <p className="font-medium text-[#4A3F35]">{r.title}</p>
                    <p className="text-slate-600 text-[13px]">↳ {r.recommendation}</p>
                  </div>
                ))}
              </div>
            )}
            {digest.recommended_action && (
              <div className="flex items-start gap-2 text-sm bg-[#C9A66B]/10 rounded-lg p-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#6B5D4F] shrink-0 mt-0.5" />
                <p className="text-[#4A3F35]"><span className="font-semibold">إجراء موصى به هذا الأسبوع: </span>{digest.recommended_action}</p>
              </div>
            )}
          </div>
        )}

        {analyzing && !digest && (
          <div className="flex items-center justify-center gap-2 py-4 text-slate-500 text-sm">
            <Loader2 className="w-4 h-4 animate-spin" /> Bytly AI يحلل حالة مشاريعك...
          </div>
        )}

        {/* Smart alerts list */}
        <div>
          <h4 className="text-sm font-semibold text-[#4A3F35] mb-2 flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-[#C9A66B]" />
            التنبيهات المكتشفة ({alerts.length})
          </h4>
          {alerts.length === 0 ? (
            <div className="flex items-center gap-2 text-sm text-emerald-600 bg-emerald-50 rounded-lg p-3">
              <CheckCircle2 className="w-4 h-4" /> لا توجد تنبيهات حالية — مشاريعك تسير وفق الجدول.
            </div>
          ) : (
            <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
              {alerts.map((a, i) => {
                const st = severityStyles[a.severity];
                const Icon = categoryIcons[a.category] || Bell;
                const open = expandedAlert === i;
                return (
                  <div key={i} className={`rounded-lg border ${st.border} ${st.bg} p-3`}>
                    <div
                      className="flex items-start gap-2 cursor-pointer"
                      onClick={() => setExpandedAlert(open ? null : i)}
                    >
                      <st.icon className={`w-4 h-4 ${st.text} shrink-0 mt-0.5`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className={`text-sm font-medium ${st.text}`}>{a.title}</p>
                          <Badge variant={st.badge} className="text-[10px] shrink-0">{a.severity === "high" ? "حرجة" : a.severity === "medium" ? "متوسطة" : "منخفضة"}</Badge>
                        </div>
                        {open && (
                          <>
                            <p className="text-[13px] text-slate-600 mt-1 leading-relaxed">{a.description}</p>
                            {a.action_url && (
                              <Link to={a.action_url} className="inline-flex items-center gap-1 text-[12px] text-[#6B5D4F] hover:text-[#C9A66B] mt-2 font-medium">
                                عرض التفاصيل <ChevronLeft className="w-3 h-3" />
                              </Link>
                            )}
                          </>
                        )}
                      </div>
                      <Icon className={`w-4 h-4 ${st.text} opacity-50 shrink-0 mt-1`} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent system notifications */}
        {notifications.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-[#4A3F35] mb-2 flex items-center gap-1.5">
              <Bell className="w-4 h-4 text-[#C9A66B]" />
              إشعارات النظام الأخيرة
            </h4>
            <div className="space-y-1.5 max-h-[180px] overflow-y-auto pr-1">
              {notifications.map(n => (
                <div key={n.id} className="flex items-start gap-2 text-sm bg-slate-50 rounded-lg p-2.5 border border-slate-100">
                  <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${n.is_read ? "bg-slate-300" : "bg-[#C9A66B]"}`} />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-700 truncate">{n.title}</p>
                    <p className="text-[12px] text-slate-500 line-clamp-2">{n.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}