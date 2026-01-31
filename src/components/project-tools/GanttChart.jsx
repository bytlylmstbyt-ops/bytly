import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, Calendar, Clock, CheckCircle, AlertCircle, 
  Loader2, Edit2, Trash2, Save, X 
} from "lucide-react";
import { format, differenceInDays, parseISO } from "date-fns";
import { ar } from "date-fns/locale";

export default function GanttChart({ project, user }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTask, setNewTask] = useState({
    title: "",
    start_date: "",
    due_date: "",
    assigned_to: "",
    status: "todo",
    priority: "medium"
  });

  useEffect(() => {
    loadTasks();
  }, [project.id]);

  const loadTasks = async () => {
    try {
      const tasksData = await base44.entities.ProjectTask.filter({ 
        project_id: project.id 
      });
      setTasks(tasksData.sort((a, b) => new Date(a.start_date) - new Date(b.start_date)));
    } catch (error) {
      console.error("Error loading tasks:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTask = async () => {
    if (!newTask.title || !newTask.start_date || !newTask.due_date) {
      alert("الرجاء إدخال جميع البيانات المطلوبة");
      return;
    }

    setSaving(true);
    try {
      await base44.entities.ProjectTask.create({
        ...newTask,
        project_id: project.id,
        assigned_by: user.email
      });
      await loadTasks();
      setShowAddForm(false);
      setNewTask({
        title: "",
        start_date: "",
        due_date: "",
        assigned_to: "",
        status: "todo",
        priority: "medium"
      });
    } catch (error) {
      console.error("Error adding task:", error);
      alert("حدث خطأ في إضافة المهمة");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateTask = async (taskId, updates) => {
    setSaving(true);
    try {
      await base44.entities.ProjectTask.update(taskId, updates);
      await loadTasks();
      setEditingTask(null);
    } catch (error) {
      console.error("Error updating task:", error);
      alert("حدث خطأ في تحديث المهمة");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!confirm("هل أنت متأكد من حذف هذه المهمة؟")) return;

    setSaving(true);
    try {
      await base44.entities.ProjectTask.delete(taskId);
      await loadTasks();
    } catch (error) {
      console.error("Error deleting task:", error);
      alert("حدث خطأ في حذف المهمة");
    } finally {
      setSaving(false);
    }
  };

  const calculateProgress = (startDate, dueDate) => {
    const start = parseISO(startDate);
    const end = parseISO(dueDate);
    const today = new Date();
    const total = differenceInDays(end, start);
    const elapsed = differenceInDays(today, start);
    return Math.min(Math.max((elapsed / total) * 100, 0), 100);
  };

  const getStatusColor = (status) => {
    const colors = {
      todo: "bg-slate-100 text-slate-700",
      in_progress: "bg-blue-100 text-blue-700",
      review: "bg-amber-100 text-amber-700",
      done: "bg-green-100 text-green-700"
    };
    return colors[status] || colors.todo;
  };

  const getPriorityColor = (priority) => {
    const colors = {
      low: "bg-slate-200",
      medium: "bg-amber-200",
      high: "bg-orange-300",
      urgent: "bg-red-300"
    };
    return colors[priority] || colors.medium;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#6B5D4F] mx-auto" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Add Task Button */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              الجدول الزمني للمشروع
            </CardTitle>
            <Button onClick={() => setShowAddForm(!showAddForm)}>
              <Plus className="w-4 h-4 ml-2" />
              إضافة مهمة
            </Button>
          </div>
        </CardHeader>
        
        {showAddForm && (
          <CardContent className="border-t">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <Label>عنوان المهمة</Label>
                <Input
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  placeholder="مثال: تصميم الواجهة الرئيسية"
                />
              </div>
              <div>
                <Label>المسؤول</Label>
                <Input
                  value={newTask.assigned_to}
                  onChange={(e) => setNewTask({ ...newTask, assigned_to: e.target.value })}
                  placeholder="البريد الإلكتروني للمسؤول"
                />
              </div>
              <div>
                <Label>تاريخ البدء</Label>
                <Input
                  type="date"
                  value={newTask.start_date}
                  onChange={(e) => setNewTask({ ...newTask, start_date: e.target.value })}
                />
              </div>
              <div>
                <Label>تاريخ الاستحقاق</Label>
                <Input
                  type="date"
                  value={newTask.due_date}
                  onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleAddTask} disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : <Save className="w-4 h-4 ml-2" />}
                حفظ
              </Button>
              <Button variant="outline" onClick={() => setShowAddForm(false)}>
                <X className="w-4 h-4 ml-2" />
                إلغاء
              </Button>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Gantt Chart */}
      <Card>
        <CardContent className="p-6">
          {tasks.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>لا توجد مهام في الجدول الزمني</p>
              <p className="text-sm">قم بإضافة مهمة جديدة للبدء</p>
            </div>
          ) : (
            <div className="space-y-4">
              {tasks.map((task) => (
                <div key={task.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold text-lg">{task.title}</h4>
                        <Badge className={getStatusColor(task.status)}>
                          {task.status === "done" ? "مكتمل" : 
                           task.status === "in_progress" ? "قيد التنفيذ" :
                           task.status === "review" ? "مراجعة" : "قيد الانتظار"}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-4 text-sm text-slate-600">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {format(parseISO(task.start_date), "d MMM yyyy", { locale: ar })} - 
                          {format(parseISO(task.due_date), "d MMM yyyy", { locale: ar })}
                        </span>
                        {task.assigned_to && (
                          <span className="flex items-center gap-1">
                            المسؤول: {task.assigned_to}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {differenceInDays(parseISO(task.due_date), parseISO(task.start_date))} يوم
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setEditingTask(task.id === editingTask ? null : task.id)}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleDeleteTask(task.id)}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-3">
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-slate-600">التقدم</span>
                      <span className="font-semibold">{Math.round(task.progress_percentage || 0)}%</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${getPriorityColor(task.priority)}`}
                        style={{ width: `${task.progress_percentage || 0}%` }}
                      />
                    </div>
                  </div>

                  {/* Status Update */}
                  {editingTask === task.id && (
                    <div className="pt-3 border-t grid grid-cols-2 gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleUpdateTask(task.id, { status: "in_progress" })}
                      >
                        قيد التنفيذ
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleUpdateTask(task.id, { status: "review" })}
                      >
                        مراجعة
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleUpdateTask(task.id, { status: "done", completion_date: new Date().toISOString() })}
                      >
                        <CheckCircle className="w-4 h-4 ml-1" />
                        مكتمل
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleUpdateTask(task.id, { status: "todo" })}
                      >
                        قيد الانتظار
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}