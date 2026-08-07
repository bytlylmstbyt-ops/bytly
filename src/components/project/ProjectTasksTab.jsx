import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import {
  Plus, Loader2, Clock, CheckCircle2, Circle, AlertCircle,
  User, Calendar, Send, Trash2, Edit3, X, Flag, TrendingUp
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

const STATUS = {
  todo: { label: "قيد الانتظار", icon: Circle, color: "text-slate-500 bg-slate-100" },
  in_progress: { label: "قيد التنفيذ", icon: TrendingUp, color: "text-blue-600 bg-blue-100" },
  review: { label: "للمراجعة", icon: AlertCircle, color: "text-amber-600 bg-amber-100" },
  done: { label: "مكتملة", icon: CheckCircle2, color: "text-green-600 bg-green-100" },
};

const PRIORITY = {
  low: { label: "منخفضة", color: "bg-slate-100 text-slate-600" },
  medium: { label: "متوسطة", color: "bg-blue-100 text-blue-600" },
  high: { label: "مرتفعة", color: "bg-orange-100 text-orange-600" },
  urgent: { label: "عاجلة", color: "bg-red-100 text-red-600" },
};

export default function ProjectTasksTab({ project, user, userEngineer, engineers }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [saving, setSaving] = useState(false);
  const [commentText, setCommentText] = useState({});
  const [openComments, setOpenComments] = useState(null);
  const [filter, setFilter] = useState("all");

  const [form, setForm] = useState({
    title: "", description: "", assigned_to: "", priority: "medium",
    due_date: "", progress_percentage: 0,
  });

  const isClient = project.created_by === user.email;
  const isEngineer = userEngineer && project.assigned_engineer_id === userEngineer.id;
  const canManage = isClient || isEngineer || user.role === "admin";

  const loadTasks = async () => {
    setLoading(true);
    try {
      const data = await base44.entities.ProjectTask.filter({ project_id: project.id });
      setTasks(data);
    } catch (err) { console.error("Error loading tasks:", err); } finally { setLoading(false); }
  };

  useEffect(() => { loadTasks(); }, [project.id]);

  const resetForm = () => {
    setForm({ title: "", description: "", assigned_to: "", priority: "medium", due_date: "", progress_percentage: 0 });
    setEditingTask(null);
  };

  const openCreate = () => {
    resetForm();
    setShowForm(true);
  };

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
      } else {
        await base44.entities.ProjectTask.create(payload);
        // Notify assigned user
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

  const handleStatusChange = async (task, newStatus) => {
    const progress = newStatus === "done" ? 100 : task.progress_percentage;
    await base44.entities.ProjectTask.update(task.id, { status: newStatus, progress_percentage: progress });
    loadTasks();
  };

  const handleProgressChange = async (task, value) => {
    await base44.entities.ProjectTask.update(task.id, {
      progress_percentage: value,
      status: value >= 100 ? "done" : value > 0 ? "in_progress" : "todo",
    });
    loadTasks();
  };

  const handleDelete = async (taskId) => {
    if (!window.confirm("حذف هذه المهمة؟")) return;
    try { await base44.entities.ProjectTask.delete(taskId); loadTasks(); }
    catch { alert("لا يمكن حذف المهمة — الأدمن فقط من يحذف."); }
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

  const filteredTasks = filter === "all" ? tasks : tasks.filter(t => t.status === filter);
  const stats = {
    todo: tasks.filter(t => t.status === "todo").length,
    in_progress: tasks.filter(t => t.status === "in_progress").length,
    review: tasks.filter(t => t.status === "review").length,
    done: tasks.filter(t => t.status === "done").length,
  };

  return (
    <div className="space-y-4">
      {/* Stats + Actions */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          {Object.entries(STATUS).map(([key, s]) => {
            const Icon = s.icon;
            return (
              <button
                key={key}
                onClick={() => setFilter(filter === key ? "all" : key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  filter === key ? s.color + " ring-2 ring-offset-1 ring-current" : "bg-slate-50 text-slate-500 hover:bg-slate-100"
                }`}
              >
                <Icon className="w-4 h-4" />
                {s.label}
                <span className="text-xs opacity-70">({stats[key]})</span>
              </button>
            );
          })}
        </div>
        {canManage && (
          <Button onClick={openCreate} className="bg-gradient-to-r from-[#6B5D4F] to-[#C9A66B] text-white gap-2">
            <Plus className="w-4 h-4" /> مهمة جديدة
          </Button>
        )}
      </div>

      {/* Tasks List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-[#C9A66B] animate-spin" />
        </div>
      ) : filteredTasks.length === 0 ? (
        <Card className="border-0 shadow-lg">
          <CardContent className="p-8 text-center">
            <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-600 font-medium mb-1">لا توجد مهام {filter !== "all" ? STATUS[filter]?.label : ""}</p>
            <p className="text-sm text-slate-400">
              {canManage ? "أنشئ مهمة جديدة لتعيينها لفريق المشروع" : "لم تُسند مهام إليك بعد"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredTasks.map((task) => {
            const s = STATUS[task.status] || STATUS.todo;
            const p = PRIORITY[task.priority] || PRIORITY.medium;
            const StatusIcon = s.icon;
            const assigneeEngineer = Object.values(engineers).find(e => e.email === task.assigned_to);

            return (
              <Card key={task.id} className="border-0 shadow-md hover:shadow-lg transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    {/* Status icon / quick toggle */}
                    <button
                      onClick={() => {
                        const next = task.status === "todo" ? "in_progress" : task.status === "in_progress" ? "review" : task.status === "review" ? "done" : "todo";
                        handleStatusChange(task, next);
                      }}
                      className="mt-0.5 shrink-0"
                    >
                      <StatusIcon className={`w-5 h-5 ${s.color.split(" ")[0]}`} />
                    </button>

                    <div className="flex-1 min-w-0">
                      {/* Title + Priority */}
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className={`font-semibold text-sm ${task.status === "done" ? "line-through text-slate-400" : "text-[#1a1a2e]"}`}>
                          {task.title}
                        </h3>
                        <Badge className={`${p.color} text-xs`}>
                          <Flag className="w-3 h-3 ml-1" />
                          {p.label}
                        </Badge>
                      </div>

                      {task.description && (
                        <p className="text-sm text-slate-500 mb-2 line-clamp-2">{task.description}</p>
                      )}

                      {/* Meta: assignee, due date */}
                      <div className="flex items-center gap-4 flex-wrap text-xs text-slate-500">
                        {task.assigned_to && (
                          <div className="flex items-center gap-1.5">
                            {assigneeEngineer ? (
                              <Avatar className="w-5 h-5">
                                <AvatarImage src={assigneeEngineer.profile_image} />
                                <AvatarFallback className="text-[8px] bg-slate-200">{assigneeEngineer.full_name?.charAt(0)}</AvatarFallback>
                              </Avatar>
                            ) : (
                              <User className="w-3.5 h-3.5" />
                            )}
                            <span>{assigneeEngineer?.full_name || task.assigned_to.split("@")[0]}</span>
                          </div>
                        )}
                        {task.due_date && (
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>{formatDate(task.due_date)}</span>
                          </div>
                        )}
                        {(task.comments?.length > 0) && (
                          <button onClick={() => setOpenComments(openComments === task.id ? null : task.id)} className="flex items-center gap-1 hover:text-[#C9A66B]">
                            <Send className="w-3.5 h-3.5" />
                            <span>{task.comments.length} تعليق</span>
                          </button>
                        )}
                      </div>

                      {/* Progress bar */}
                      {task.status !== "todo" && (
                        <div className="mt-2">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${task.progress_percentage >= 100 ? "bg-green-500" : "bg-[#C9A66B]"}`}
                                style={{ width: `${task.progress_percentage}%` }}
                              />
                            </div>
                            {canManage && (
                              <input
                                type="range"
                                min="0" max="100" step="10"
                                value={task.progress_percentage || 0}
                                onChange={(e) => handleProgressChange(task, parseInt(e.target.value))}
                                className="w-20 accent-[#C9A66B]"
                              />
                            )}
                            <span className="text-xs text-slate-500 w-8 text-left">{task.progress_percentage || 0}%</span>
                          </div>
                        </div>
                      )}

                      {/* Comments section */}
                      {openComments === task.id && (
                        <div className="mt-3 p-3 rounded-lg bg-slate-50 space-y-2">
                          {(task.comments || []).map((c, i) => (
                            <div key={i} className="flex items-start gap-2">
                              <Avatar className="w-6 h-6">
                                <AvatarFallback className="text-[8px] bg-slate-200">{c.author_email?.charAt(0)}</AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-slate-700">{c.author_email?.split("@")[0]}</p>
                                <p className="text-sm text-slate-600">{c.text}</p>
                              </div>
                              <span className="text-[10px] text-slate-400">{formatDate(c.created_at)}</span>
                            </div>
                          ))}
                          <div className="flex items-center gap-2 pt-1">
                            <Input
                              value={commentText[task.id] || ""}
                              onChange={(e) => setCommentText(prev => ({ ...prev, [task.id]: e.target.value }))}
                              placeholder="أضف تعليقاً..."
                              className="text-sm h-8"
                              onKeyDown={(e) => { if (e.key === "Enter") handleAddComment(task.id); }}
                            />
                            <Button size="sm" onClick={() => handleAddComment(task.id)} className="h-8 px-2 bg-[#C9A66B] hover:bg-[#b8954f]">
                              <Send className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    {canManage && (
                      <div className="flex items-center gap-1 shrink-0">
                        <button onClick={() => openEdit(task)} className="p-1.5 rounded-lg hover:bg-slate-100">
                          <Edit3 className="w-4 h-4 text-slate-400" />
                        </button>
                        {user.role === "admin" && (
                          <button onClick={() => handleDelete(task.id)} className="p-1.5 rounded-lg hover:bg-red-50">
                            <Trash2 className="w-4 h-4 text-red-400" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
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