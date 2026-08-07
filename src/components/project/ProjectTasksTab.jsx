import React, { useState, useEffect, useMemo } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { base44 } from "@/api/base44Client";
import {
  Plus, Loader2, Clock, CheckCircle2, Circle, AlertCircle,
  User, Calendar, Send, Trash2, Edit3, X, Flag, TrendingUp, GripVertical
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import MobileSelect from "@/components/mobile/MobileSelect";
import { logWorkspaceActivity } from "@/components/project/logWorkspaceActivity";

export const STATUS = {
  todo:        { label: "قيد الانتظار", icon: Circle,      color: "text-slate-500",   bg: "bg-slate-100",   border: "border-slate-200",   dot: "bg-slate-400" },
  in_progress: { label: "قيد التنفيذ", icon: TrendingUp,  color: "text-blue-600",    bg: "bg-blue-50",     border: "border-blue-200",    dot: "bg-blue-500" },
  review:      { label: "للمراجعة",   icon: AlertCircle,  color: "text-amber-600",   bg: "bg-amber-50",    border: "border-amber-200",   dot: "bg-amber-500" },
  done:        { label: "مكتملة",     icon: CheckCircle2, color: "text-green-600",   bg: "bg-green-50",    border: "border-green-200",   dot: "bg-green-500" },
};

const STATUS_ORDER = ["todo", "in_progress", "review", "done"];

const PRIORITY = {
  low:    { label: "منخفضة", color: "bg-slate-100 text-slate-600" },
  medium: { label: "متوسطة", color: "bg-blue-100 text-blue-600" },
  high:   { label: "مرتفعة", color: "bg-orange-100 text-orange-600" },
  urgent: { label: "عاجلة",  color: "bg-red-100 text-red-600" },
};

function KanbanCard({ task, engineers, onEdit, onDelete, onOpenComments, openComments, commentText, setCommentText, onAddComment, canManage, formatDate, isDragging }) {
  const s = STATUS[task.status] || STATUS.todo;
  const p = PRIORITY[task.priority] || PRIORITY.medium;
  const assigneeEngineer = Object.values(engineers).find(e => e.email === task.assigned_to);

  return (
    <div className={`bg-white rounded-lg border shadow-sm ${isDragging ? "shadow-lg ring-2 ring-[#C9A66B]/40 rotate-1" : "hover:shadow-md"} transition-all`}>
      {/* Priority bar */}
      <div className={`h-1 rounded-t-lg ${
        task.priority === "urgent" ? "bg-red-500" :
        task.priority === "high" ? "bg-orange-500" :
        task.priority === "medium" ? "bg-blue-400" : "bg-slate-300"
      }`} />
      <div className="p-3">
        {/* Title + priority */}
        <div className="flex items-start gap-1.5 mb-1.5">
          <GripVertical className="w-3.5 h-3.5 text-slate-300 mt-0.5 shrink-0" />
          <h4 className={`font-semibold text-sm flex-1 ${task.status === "done" ? "line-through text-slate-400" : "text-[#1a1a2e]"}`}>
            {task.title}
          </h4>
          <Badge className={`${p.color} text-[10px] px-1.5 py-0`}>
            {p.label}
          </Badge>
        </div>

        {task.description && (
          <p className="text-xs text-slate-500 mb-2 line-clamp-2 pr-5">{task.description}</p>
        )}

        {/* Progress bar */}
        {task.status !== "todo" && (
          <div className="mb-2 pr-5">
            <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${task.progress_percentage >= 100 ? "bg-green-500" : "bg-[#C9A66B]"}`}
                style={{ width: `${task.progress_percentage || 0}%` }}
              />
            </div>
          </div>
        )}

        {/* Meta: assignee, due date */}
        <div className="flex items-center gap-3 flex-wrap text-[11px] text-slate-500 pr-5">
          {task.assigned_to && (
            <div className="flex items-center gap-1">
              {assigneeEngineer ? (
                <Avatar className="w-5 h-5">
                  <AvatarImage src={assigneeEngineer.profile_image} />
                  <AvatarFallback className="text-[8px] bg-slate-200">{assigneeEngineer.full_name?.charAt(0)}</AvatarFallback>
                </Avatar>
              ) : (
                <User className="w-3 h-3" />
              )}
              <span className="truncate max-w-[80px]">{assigneeEngineer?.full_name || task.assigned_to.split("@")[0]}</span>
            </div>
          )}
          {task.due_date && (
            <div className="flex items-center gap-0.5">
              <Calendar className="w-3 h-3" />
              <span>{formatDate(task.due_date)}</span>
            </div>
          )}
          {(task.comments?.length > 0) && (
            <button onClick={() => onOpenComments(openComments === task.id ? null : task.id)} className="flex items-center gap-0.5 hover:text-[#C9A66B]">
              <Send className="w-3 h-3" />
              <span>{task.comments.length}</span>
            </button>
          )}
        </div>

        {/* Comments */}
        {openComments === task.id && (
          <div className="mt-2 p-2.5 rounded-lg bg-slate-50 space-y-1.5 pr-5">
            {(task.comments || []).map((c, i) => (
              <div key={i} className="flex items-start gap-1.5">
                <Avatar className="w-5 h-5">
                  <AvatarFallback className="text-[8px] bg-slate-200">{c.author_email?.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-medium text-slate-700">{c.author_email?.split("@")[0]}</p>
                  <p className="text-xs text-slate-600">{c.text}</p>
                </div>
              </div>
            ))}
            <div className="flex items-center gap-1 pt-0.5">
              <Input
                value={commentText[task.id] || ""}
                onChange={(e) => setCommentText(prev => ({ ...prev, [task.id]: e.target.value }))}
                placeholder="تعليق..."
                className="text-xs h-7"
                onKeyDown={(e) => { if (e.key === "Enter") onAddComment(task.id); }}
              />
              <Button size="sm" onClick={() => onAddComment(task.id)} className="h-7 w-7 p-0 bg-[#C9A66B] hover:bg-[#b8954f]">
                <Send className="w-3 h-3" />
              </Button>
            </div>
          </div>
        )}

        {/* Actions */}
        {canManage && (
          <div className="flex items-center justify-end gap-0.5 mt-1.5 pr-5">
            <button onClick={() => onEdit(task)} className="p-1 rounded hover:bg-slate-100">
              <Edit3 className="w-3.5 h-3.5 text-slate-400" />
            </button>
            {onDelete && (
              <button onClick={() => onDelete(task.id)} className="p-1 rounded hover:bg-red-50">
                <Trash2 className="w-3.5 h-3.5 text-red-400" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function KanbanColumn({ statusKey, tasks, engineers, onEdit, onDelete, onOpenComments, openComments, commentText, setCommentText, onAddComment, canManage, formatDate }) {
  const s = STATUS[statusKey];

  return (
    <Droppable droppableId={statusKey}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.droppableProps}
          className={`flex flex-col rounded-xl border-2 ${s.border} ${s.bg} min-w-[260px] w-[260px] md:w-1/4 md:min-w-0 transition-colors ${snapshot.isDraggingOver ? "ring-2 ring-[#C9A66B]/50" : ""}`}
          style={{ minHeight: "200px" }}
        >
          {/* Column header */}
          <div className="flex items-center justify-between px-3 py-2.5 border-b border-black/5">
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${s.dot}`} />
              <span className={`font-semibold text-sm ${s.color}`}>{s.label}</span>
              <span className={`text-xs font-medium ${s.color} opacity-60`}>{tasks.length}</span>
            </div>
          </div>

          {/* Tasks list */}
          <div className="flex-1 p-2 space-y-2 overflow-y-auto max-h-[60vh] overscroll-contain">
            {tasks.map((task, index) => (
              <Draggable key={task.id} draggableId={task.id} index={index}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    style={{
                      ...provided.draggableProps.style,
                    }}
                  >
                    <KanbanCard
                      task={task}
                      engineers={engineers}
                      onEdit={onEdit}
                      onDelete={onDelete}
                      onOpenComments={onOpenComments}
                      openComments={openComments}
                      commentText={commentText}
                      setCommentText={setCommentText}
                      onAddComment={onAddComment}
                      canManage={canManage}
                      formatDate={formatDate}
                      isDragging={snapshot.isDragging}
                    />
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
            {tasks.length === 0 && !snapshot.isDraggingOver && (
              <div className="text-center py-6">
                <p className="text-xs text-slate-400">اسحب المهام هنا</p>
              </div>
            )}
          </div>
        </div>
      )}
    </Droppable>
  );
}

export default function ProjectTasksTab({ project, user, userEngineer, engineers }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [saving, setSaving] = useState(false);
  const [commentText, setCommentText] = useState({});
  const [openComments, setOpenComments] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  const [form, setForm] = useState({
    title: "", description: "", assigned_to: "", priority: "medium",
    due_date: "", progress_percentage: 0,
  });

  const isClient = project.created_by === user.email;
  const isEngineer = userEngineer && project.assigned_engineer_id === userEngineer.id;
  const canManage = isClient || isEngineer || user.role === "admin";

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const loadTasks = async () => {
    setLoading(true);
    try {
      const data = await base44.entities.ProjectTask.filter({ project_id: project.id });
      setTasks(data);
    } catch (err) { console.error("Error loading tasks:", err); } finally { setLoading(false); }
  };

  useEffect(() => { loadTasks(); }, [project.id]);

  // Group tasks by status
  const columns = useMemo(() => {
    const grouped = { todo: [], in_progress: [], review: [], done: [] };
    tasks.forEach((t) => {
      const status = t.status in grouped ? t.status : "todo";
      grouped[status].push(t);
    });
    return grouped;
  }, [tasks]);

  const resetForm = () => {
    setForm({ title: "", description: "", assigned_to: "", priority: "medium", due_date: "", progress_percentage: 0 });
    setEditingTask(null);
  };

  const openCreate = () => { resetForm(); setShowForm(true); };

  const openEdit = (task) => {
    setForm({
      title: task.title || "",
      description: task.description || "",
      assigned_to: task.assigned_to || "",
      priority: task.priority || "medium",
      due_date: task.due_date || "",
      progress_percentage: task.progress_percentage || 0,
    });
    setEditingTask(task);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.title || !form.assigned_to) return;
    setSaving(true);
    try {
      const payload = {
        project_id: project.id,
        title: form.title,
        description: form.description,
        assigned_to: form.assigned_to,
        assigned_by: user.email,
        priority: form.priority,
        due_date: form.due_date || null,
        progress_percentage: form.progress_percentage,
        status: form.progress_percentage >= 100 ? "done" : form.progress_percentage > 0 ? "in_progress" : (editingTask?.status || "todo"),
      };

      if (editingTask) {
        await base44.entities.ProjectTask.update(editingTask.id, payload);
        await logWorkspaceActivity({
          projectId: project.id, user, activityType: "task_updated",
          summary: `تم تعديل المهمة "${form.title}"`, entityType: "task",
          entityId: editingTask.id, entityTitle: form.title,
        });
      } else {
        const created = await base44.entities.ProjectTask.create(payload);
        await logWorkspaceActivity({
          projectId: project.id, user, activityType: "task_created",
          summary: `تم إنشاء مهمة جديدة "${form.title}"`, entityType: "task",
          entityId: created.id, entityTitle: form.title,
        });
        await base44.entities.Notification.create({
          recipient_email: form.assigned_to,
          title: "📝 مهمة جديدة مسندة إليك",
          message: `تم إسناد مهمة "${form.title}" إليك في مشروع "${project.title}".`,
          type: "project_update",
          related_project_id: project.id,
          priority: form.priority === "urgent" ? "urgent" : "high",
          action_url: `/ProjectDetails?id=${project.id}`,
        });
      }
      setShowForm(false);
      resetForm();
      loadTasks();
    } catch (err) { console.error("Error saving task:", err); } finally { setSaving(false); }
  };

  const onDragEnd = async (result) => {
    const { source, destination, draggableId } = result;
    if (!destination || (source.droppableId === destination.droppableId && source.index === destination.index)) return;

    const newStatus = destination.droppableId;
    const oldStatus = source.droppableId;

    // Optimistic update
    const task = tasks.find((t) => t.id === draggableId);
    if (!task) return;

    setTasks((prev) => prev.map((t) =>
      t.id === draggableId ? { ...t, status: newStatus } : t
    ));

    const progress = newStatus === "done" ? 100 : newStatus === "todo" ? 0 : task.progress_percentage;

    try {
      await base44.entities.ProjectTask.update(draggableId, {
        status: newStatus,
        progress_percentage: progress,
      });
      await logWorkspaceActivity({
        projectId: project.id, user, activityType: "task_status_changed",
        summary: `تم نقل المهمة "${task.title}" من "${STATUS[oldStatus]?.label}" إلى "${STATUS[newStatus]?.label}"`,
        entityType: "task", entityId: task.id, entityTitle: task.title,
        oldValue: STATUS[oldStatus]?.label, newValue: STATUS[newStatus]?.label,
      });
    } catch (err) {
      console.error("Error updating task status:", err);
      setTasks((prev) => prev.map((t) =>
        t.id === draggableId ? { ...t, status: oldStatus } : t
      ));
      alert("تعذّر تحديث حالة المهمة");
    }
  };

  const handleDelete = async (taskId) => {
    if (!window.confirm("حذف هذه المهمة؟")) return;
    const task = tasks.find((t) => t.id === taskId);
    try {
      await base44.entities.ProjectTask.delete(taskId);
      await logWorkspaceActivity({
        projectId: project.id, user, activityType: "task_deleted",
        summary: `تم حذف المهمة "${task?.title || ""}"`, entityType: "task",
        entityId: taskId, entityTitle: task?.title,
      });
      loadTasks();
    } catch { alert("لا يمكن حذف المهمة — الأدمن فقط من يحذف."); }
  };

  const handleAddComment = async (taskId) => {
    const text = commentText[taskId]?.trim();
    if (!text) return;
    const task = tasks.find(t => t.id === taskId);
    const newComment = {
      author_email: user.email,
      text,
      created_at: new Date().toISOString(),
    };
    await base44.entities.ProjectTask.update(taskId, {
      comments: [...(task.comments || []), newComment],
    });
    setCommentText(prev => ({ ...prev, [taskId]: "" }));
    loadTasks();
  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString("ar-SA", { month: "short", day: "numeric" }) : "";

  return (
    <div className="space-y-4">
      {/* Header + Actions */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <span className="font-medium">لوحة المهام — اسحب وأفلت بين الحالات</span>
        </div>
        {canManage && (
          <Button onClick={openCreate} className="bg-gradient-to-r from-[#6B5D4F] to-[#C9A66B] text-white gap-2">
            <Plus className="w-4 h-4" /> مهمة جديدة
          </Button>
        )}
      </div>

      {/* Kanban Board */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-[#C9A66B] animate-spin" />
        </div>
      ) : tasks.length === 0 ? (
        <Card className="border-0 shadow-lg">
          <CardContent className="p-8 text-center">
            <Circle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-600 font-medium mb-1">لا توجد مهام بعد</p>
            <p className="text-sm text-slate-400">
              {canManage ? "أنشئ مهمة جديدة لتعيينها لفريق المشروع" : "لم تُسند مهام إليك بعد"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <DragDropContext onDragEnd={onDragEnd}>
          <div className={`flex gap-3 ${isMobile ? "overflow-x-auto pb-2 snap-x snap-mandatory" : "flex-row"}`}>
            {STATUS_ORDER.map((statusKey) => (
              <div key={statusKey} className={isMobile ? "snap-start shrink-0" : "flex-1"}>
                <KanbanColumn
                  statusKey={statusKey}
                  tasks={columns[statusKey]}
                  engineers={engineers}
                  onEdit={openEdit}
                  onDelete={user.role === "admin" ? handleDelete : null}
                  onOpenComments={setOpenComments}
                  openComments={openComments}
                  commentText={commentText}
                  setCommentText={setCommentText}
                  onAddComment={handleAddComment}
                  canManage={canManage}
                  formatDate={formatDate}
                />
              </div>
            ))}
          </div>
        </DragDropContext>
      )}

      {/* Task Form Dialog */}
      <Dialog open={showForm} onOpenChange={(o) => { if (!o) resetForm(); setShowForm(o); }}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle>{editingTask ? "تعديل المهمة" : "مهمة جديدة"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs">عنوان المهمة *</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="مثال: إعداد المخططات المعمارية"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">الوصف</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="تفاصيل المهمة..."
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">المسؤول *</Label>
                <MobileSelect
                  value={form.assigned_to}
                  onValueChange={(v) => setForm(prev => ({ ...prev, assigned_to: v }))}
                  placeholder="اختر المسؤول"
                  label="المسؤول"
                  options={[
                    { value: project.created_by, label: "العميل" },
                    ...Object.values(engineers).filter(e => e.email).map(e => ({ value: e.email, label: e.full_name })),
                  ].filter((v, i, arr) => arr.findIndex(x => x.value === v.value) === i)}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">الأولوية</Label>
                <MobileSelect
                  value={form.priority}
                  onValueChange={(v) => setForm(prev => ({ ...prev, priority: v }))}
                  label="الأولوية"
                  options={[
                    { value: "low", label: "منخفضة" },
                    { value: "medium", label: "متوسطة" },
                    { value: "high", label: "مرتفعة" },
                    { value: "urgent", label: "عاجلة 🚨" },
                  ]}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">تاريخ الاستحقاق</Label>
                <Input
                  type="date"
                  value={form.due_date}
                  onChange={(e) => setForm(prev => ({ ...prev, due_date: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">نسبة الإنجاز: {form.progress_percentage}%</Label>
                <input
                  type="range" min="0" max="100" step="10"
                  value={form.progress_percentage}
                  onChange={(e) => setForm(prev => ({ ...prev, progress_percentage: parseInt(e.target.value) }))}
                  className="w-full accent-[#C9A66B] mt-2"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowForm(false); resetForm(); }}>إلغاء</Button>
            <Button
              onClick={handleSave}
              disabled={saving || !form.title || !form.assigned_to}
              className="bg-gradient-to-r from-[#6B5D4F] to-[#C9A66B] text-white gap-2"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              {editingTask ? "حفظ التعديلات" : "إنشاء المهمة"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}