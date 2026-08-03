// Shared helper: detect status / financial changes on a Project and log them
// to the TaskActivityLog entity for transparent admin audit.
import { base44 } from "@/api/base44Client";

const STATUS_FIELDS = { status: "الحالة", technical_review_status: "حالة المراجعة الفنية", payment_status: "حالة الدفع", escrow_status: "حالة الضمان" };

const FINANCIAL_FIELDS = {
  escrow_amount: "مبلغ الضمان",
  budget_min: "الحد الأدنى للميزانية",
  budget_max: "الحد الأعلى للميزانية",
  platform_commission: "عمولة المنصة %",
  engineer_payment: "صافي دفع المهندس",
  technical_consultant_fee: "أتعاب المستشار الفني",
  legal_consultant_fee: "أتعاب المستشار القانوني",
  assigned_engineer_id: "المهندس المسؤول",
};

const LABELS = { ...STATUS_FIELDS, ...FINANCIAL_FIELDS };

function buildSummary(field, oldV, newV) {
  const label = LABELS[field] || field;
  const isMoney = ["escrow_amount", "budget_min", "budget_max", "engineer_payment", "technical_consultant_fee", "legal_consultant_fee"].includes(field);
  const fmt = (v) => {
    if (v === null || v === undefined || v === "") return "—";
    if (isMoney) return `${Number(v).toLocaleString("en-US")} ر.س`;
    return String(v);
  };
  return `تم تغيير «${label}» من ${fmt(oldV)} إلى ${fmt(newV)}`;
}

/**
 * Compare the project record before update with the new data patch,
 * and create one TaskActivityLog entry per detected status / financial change.
 * Safe to call after any Project.update — silently skips if nothing relevant changed.
 */
export async function logProjectChange(projectBefore, newData, actor) {
  if (!projectBefore?.id || !actor) return;
  const entries = [];

  Object.keys(STATUS_FIELDS).forEach((f) => {
    if (!(f in newData)) return;
    const oldV = projectBefore[f], newV = newData[f];
    if (String(oldV ?? "") === String(newV ?? "")) return;
    entries.push({
      project_id: projectBefore.id,
      task_id: projectBefore.id,
      task_title: projectBefore.title || "",
      actor_email: actor.email || "",
      actor_name: actor.full_name || actor.email || "",
      action_type: "status_changed",
      field_name: f,
      old_value: oldV == null ? "" : String(oldV),
      new_value: newV == null ? "" : String(newV),
      summary: buildSummary(f, oldV, newV),
    });
  });

  Object.keys(FINANCIAL_FIELDS).forEach((f) => {
    if (!(f in newData)) return;
    const oldV = projectBefore[f], newV = newData[f];
    if (String(oldV ?? "") === String(newV ?? "")) return;
    entries.push({
      project_id: projectBefore.id,
      task_id: projectBefore.id,
      task_title: projectBefore.title || "",
      actor_email: actor.email || "",
      actor_name: actor.full_name || actor.email || "",
      action_type: "updated",
      field_name: f,
      old_value: oldV == null ? "" : String(oldV),
      new_value: newV == null ? "" : String(newV),
      summary: buildSummary(f, oldV, newV),
    });
  });

  // Generic edit (title/description) with no status/money change
  if (entries.length === 0 && ("title" in newData || "description" in newData)) {
    entries.push({
      project_id: projectBefore.id,
      task_id: projectBefore.id,
      task_title: newData.title || projectBefore.title || "",
      actor_email: actor.email || "",
      actor_name: actor.full_name || actor.email || "",
      action_type: "updated",
      field_name: "title/description",
      old_value: projectBefore.title || "",
      new_value: newData.title || "",
      summary: "تم تعديل بيانات المشروع",
    });
  }

  await Promise.all(entries.map((e) => base44.entities.TaskActivityLog.create(e).catch(() => {})));
}

export async function logProjectFlagChange(project, actor, field, oldV, newV, summary) {
  if (!project?.id || !actor) return;
  await base44.entities.TaskActivityLog.create({
    project_id: project.id,
    task_id: project.id,
    task_title: project.title || "",
    actor_email: actor.email || "",
    actor_name: actor.full_name || actor.email || "",
    action_type: "updated",
    field_name: field,
    old_value: oldV == null ? "" : String(oldV),
    new_value: newV == null ? "" : String(newV),
    summary,
  }).catch(() => {});
}

export async function logProjectDeletion(projectBefore, actor) {
  if (!projectBefore?.id || !actor) return;
  await base44.entities.TaskActivityLog.create({
    project_id: projectBefore.id,
    task_id: projectBefore.id,
    task_title: projectBefore.title || "",
    actor_email: actor.email || "",
    actor_name: actor.full_name || actor.email || "",
    action_type: "deleted",
    field_name: "project",
    old_value: projectBefore.status || "",
    new_value: "",
    summary: `تم حذف المشروع «${projectBefore.title || ""}» نهائيًا`,
  }).catch(() => {});
}