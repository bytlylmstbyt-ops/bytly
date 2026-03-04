import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Plus, RefreshCw, Loader2, FolderOpen, CheckSquare, Calendar,
  Bell, BellRing, Edit2, Trash2, Search, AlertCircle, LayoutList, LayoutGrid
} from "lucide-react";
import { toast } from "sonner";
import { isPast, isToday, parseISO, differenceInDays, format } from "date-fns";
import { ar } from "date-fns/locale";
import TaskCard from "@/components/tasks/TaskCard";
import TaskFormModal from "@/components/tasks/TaskFormModal";
import ProjectFormModal from "@/components/tasks/ProjectFormModal";
import TaskCalendarView from "@/components/tasks/TaskCalendarView";
import ProjectDetailView from "@/components/tasks/ProjectDetailView";
import ProjectAlertsPanel from "@/components/tasks/ProjectAlertsPanel";
import GlobalSearchPanel from "@/components/tasks/GlobalSearchPanel";

const STATUS_COLS = [
  { key: "todo",        label: "قيد الانتظار", color: "bg-slate-100" },
  { key: "in_progress", label: "قيد التنفيذ",  color: "bg-blue-50" },
  { key: "on_hold",     label: "معلقة",         color: "bg-amber-50" },
  { key: "completed",   label: "مكتملة",         color: "bg-green-50" },
];

export default function TaskManager() {
  const [projects, setProjects]           = useState([]);
  const [tasks, setTasks]                 = useState([]);
  const [loading, setLoading]             = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [user, setUser]                   = useState(null);

  // UI state
  const [activeTab, setActiveTab]         = useState("board");
  const [selectedProject, setSelectedProject] = useState("all");
  const [searchQuery, setSearchQuery]     = useState("");
  const [statusFilter, setStatusFilter]   = useState("all");
  const [view, setView]                   = useState("board"); // board | list

  // Modals
  const [taskModal, setTaskModal]         = useState({ open: false, initial: null });
  const [projectModal, setProjectModal]   = useState({ open: false, initial: null });
  const [editingTask, setEditingTask]     = useState(null);

  // Notifications
  const [notifications, setNotifications] = useState([]);
  const [detailProject, setDetailProject] = useState(null);
  const [alertsOpen, setAlertsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    base44.auth.me().then(u => {
      setUser(u);
      if (u?.email) loadUnreadCount(u.email);
    }).catch(() => {});
    loadAll();
  }, []);

  const loadUnreadCount = async (email) => {
    try {
      const notifs = await base44.entities.Notification.filter(
        { recipient_email: email, type: 'project_update', is_read: false },
        '-created_date', 50
      );
      setUnreadCount(notifs.length);
    } catch { setUnreadCount(0); }
  };

  const loadAll = async () => {
    setLoading(true);
    try {
      const [projs, tsks] = await Promise.all([
        base44.entities.TaskProject.list('-created_date', 50),
        base44.entities.Task.list('-created_date', 200),
      ]);
      setProjects(projs);
      setTasks(tsks);
      checkNotifications(tsks);
    } catch (e) { toast.error("فشل التحميل: " + e.message); }
    finally { setLoading(false); }
  };

  const checkNotifications = (tsks) => {
    const alerts = tsks.filter(t => {
      if (t.status === 'completed') return false;
      if (!t.due_date) return false;
      const diff = differenceInDays(parseISO(t.due_date), new Date());
      return diff <= 2; // due within 2 days or overdue
    }).map(t => {
      const diff = differenceInDays(parseISO(t.due_date), new Date());
      return {
        ...t,
        alertType: diff < 0 ? 'overdue' : diff === 0 ? 'today' : 'soon',
        daysLeft: diff,
      };
    });
    setNotifications(alerts);
  };

  // Filter tasks
  const filteredTasks = tasks.filter(t => {
    if (selectedProject !== "all" && t.project_id !== selectedProject) return false;
    if (statusFilter !== "all" && t.status !== statusFilter) return false;
    if (searchQuery && !t.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const projectMap = Object.fromEntries(projects.map(p => [p.id, p]));

  // CRUD
  const saveTask = async (form) => {
    setActionLoading(true);
    try {
      if (editingTask) {
        await base44.entities.Task.update(editingTask.id, form);
        toast.success("تم تحديث المهمة ✓");
      } else {
        await base44.entities.Task.create({ ...form, assigned_by: user?.email });
        toast.success("تم إنشاء المهمة ✓");
      }
      setTaskModal({ open: false, initial: null });
      setEditingTask(null);
      loadAll();
    } catch (e) { toast.error("فشل الحفظ: " + e.message); }
    finally { setActionLoading(false); }
  };

  const saveProject = async (form) => {
    setActionLoading(true);
    try {
      if (projectModal.initial) {
        await base44.entities.TaskProject.update(projectModal.initial.id, form);
        toast.success("تم تحديث المشروع ✓");
      } else {
        await base44.entities.TaskProject.create({ ...form, owner_email: user?.email });
        toast.success("تم إنشاء المشروع ✓");
      }
      setProjectModal({ open: false, initial: null });
      loadAll();
    } catch (e) { toast.error("فشل الحفظ: " + e.message); }
    finally { setActionLoading(false); }
  };

  const deleteTask = async (id) => {
    if (!confirm("هل أنت متأكد من حذف هذه المهمة؟")) return;
    await base44.entities.Task.delete(id);
    setTasks(prev => prev.filter(t => t.id !== id));
    toast.success("تم حذف المهمة");
  };

  const changeStatus = async (task, newStatus) => {
    await base44.entities.Task.update(task.id, {
      status: newStatus,
      completion_date: newStatus === 'completed' ? new Date().toISOString() : null,
      progress: newStatus === 'completed' ? 100 : task.progress,
    });
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: newStatus } : t));
  };

  const openEditTask = (task) => {
    setEditingTask(task);
    setTaskModal({ open: true, initial: task });
  };

  // Stats
  const stats = {
    total:      tasks.length,
    todo:       tasks.filter(t => t.status === 'todo').length,
    inProgress: tasks.filter(t => t.status === 'in_progress').length,
    completed:  tasks.filter(t => t.status === 'completed').length,
    overdue:    tasks.filter(t => t.due_date && isPast(parseISO(t.due_date)) && t.status !== 'completed').length,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white p-4 md:p-6" dir="rtl">
      <div className="max-w-7xl mx-auto space-y-4">

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow">
              <CheckSquare className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800">إدارة المهام</h1>
              <p className="text-xs text-slate-500">{stats.total} مهمة • {stats.inProgress} قيد التنفيذ</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setSearchOpen(true)}>
              <Search className="w-4 h-4 ml-1" />بحث شامل
            </Button>
            <Button variant="outline" size="sm" onClick={loadAll} disabled={loading}>
              <RefreshCw className={`w-4 h-4 ml-1 ${loading ? 'animate-spin' : ''}`} />تحديث
            </Button>
            <Button variant="outline" size="sm" className="relative" onClick={() => setAlertsOpen(true)}>
              {unreadCount > 0 ? <BellRing className="w-4 h-4 ml-1 text-amber-500" /> : <Bell className="w-4 h-4 ml-1" />}
              إشعارات
              {unreadCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold leading-none">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Button>
            <Button variant="outline" onClick={() => setProjectModal({ open: true, initial: null })}>
              <FolderOpen className="w-4 h-4 ml-1" />مشروع جديد
            </Button>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => { setEditingTask(null); setTaskModal({ open: true, initial: null }); }}>
              <Plus className="w-4 h-4 ml-1" />مهمة جديدة
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { label: "الكل", value: stats.total, color: "bg-slate-50 border-slate-200", text: "text-slate-700" },
            { label: "انتظار", value: stats.todo, color: "bg-slate-50 border-slate-200", text: "text-slate-600" },
            { label: "تنفيذ", value: stats.inProgress, color: "bg-blue-50 border-blue-200", text: "text-blue-700" },
            { label: "مكتملة", value: stats.completed, color: "bg-green-50 border-green-200", text: "text-green-700" },
            { label: "متأخرة", value: stats.overdue, color: "bg-red-50 border-red-200", text: "text-red-700" },
          ].map(s => (
            <Card key={s.label} className={`border ${s.color}`}>
              <CardContent className="p-3 text-center">
                <p className={`text-2xl font-bold ${s.text}`}>{s.value}</p>
                <p className="text-xs text-slate-500">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Notifications */}
        {notifications.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
            <div className="flex items-center gap-2 mb-2">
              <Bell className="w-4 h-4 text-amber-600" />
              <p className="text-sm font-semibold text-amber-800">إشعارات الاستحقاق ({notifications.length})</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {notifications.map(n => (
                <Badge key={n.id} className={n.alertType === 'overdue' ? 'bg-red-100 text-red-700' : n.alertType === 'today' ? 'bg-amber-200 text-amber-800' : 'bg-yellow-100 text-yellow-700'}>
                  {n.alertType === 'overdue' ? `⚠️ متأخرة: ${n.title}` : n.alertType === 'today' ? `⏰ اليوم: ${n.title}` : `🔔 قريباً (${n.daysLeft}): ${n.title}`}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap gap-2 items-center">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute right-3 top-2.5 w-4 h-4 text-slate-400" />
            <Input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="بحث في المهام..." className="pr-9 text-sm" />
          </div>
          <Select value={selectedProject} onValueChange={setSelectedProject}>
            <SelectTrigger className="w-44"><SelectValue placeholder="كل المشاريع" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">كل المشاريع</SelectItem>
              {projects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36"><SelectValue placeholder="كل الحالات" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">كل الحالات</SelectItem>
              <SelectItem value="todo">انتظار</SelectItem>
              <SelectItem value="in_progress">تنفيذ</SelectItem>
              <SelectItem value="on_hold">معلقة</SelectItem>
              <SelectItem value="completed">مكتملة</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="board" className="flex items-center gap-1.5 text-xs"><LayoutGrid className="w-3.5 h-3.5" />لوحة</TabsTrigger>
            <TabsTrigger value="list" className="flex items-center gap-1.5 text-xs"><LayoutList className="w-3.5 h-3.5" />قائمة</TabsTrigger>
            <TabsTrigger value="calendar" className="flex items-center gap-1.5 text-xs"><Calendar className="w-3.5 h-3.5" />تقويم</TabsTrigger>
            <TabsTrigger value="projects" className="flex items-center gap-1.5 text-xs"><FolderOpen className="w-3.5 h-3.5" />المشاريع</TabsTrigger>
          </TabsList>

          {/* Board View */}
          <TabsContent value="board">
            {loading ? (
              <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {STATUS_COLS.map(col => {
                  const colTasks = filteredTasks.filter(t => t.status === col.key);
                  return (
                    <div key={col.key} className={`${col.color} rounded-xl p-3 min-h-[300px]`}>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-semibold text-slate-700">{col.label}</h3>
                        <Badge variant="outline" className="text-xs">{colTasks.length}</Badge>
                      </div>
                      <div className="space-y-2">
                        {colTasks.map(task => (
                          <div key={task.id} className="group relative">
                            <TaskCard
                              task={task}
                              projectColor={projectMap[task.project_id]?.color}
                              onClick={() => openEditTask(task)}
                              onStatusChange={changeStatus}
                            />
                            <button
                              onClick={() => deleteTask(task.id)}
                              className="absolute top-2 left-2 p-1 bg-white rounded opacity-0 group-hover:opacity-100 hover:bg-red-50 transition-all"
                            >
                              <Trash2 className="w-3 h-3 text-red-400" />
                            </button>
                          </div>
                        ))}
                        {colTasks.length === 0 && (
                          <p className="text-xs text-slate-400 text-center py-6">لا توجد مهام</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* List View */}
          <TabsContent value="list">
            <div className="space-y-2">
              {filteredTasks.length === 0 ? (
                <div className="text-center py-16 text-slate-400"><CheckSquare className="w-10 h-10 mx-auto mb-2 opacity-30" /><p>لا توجد مهام</p></div>
              ) : filteredTasks.map(task => (
                <div key={task.id} className="group relative">
                  <TaskCard
                    task={task}
                    projectColor={projectMap[task.project_id]?.color}
                    onClick={() => openEditTask(task)}
                    onStatusChange={changeStatus}
                  />
                  <div className="absolute top-3 left-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                    <button onClick={() => openEditTask(task)} className="p-1.5 bg-white rounded border hover:bg-slate-50">
                      <Edit2 className="w-3 h-3 text-slate-500" />
                    </button>
                    <button onClick={() => deleteTask(task.id)} className="p-1.5 bg-white rounded border hover:bg-red-50">
                      <Trash2 className="w-3 h-3 text-red-400" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* Calendar View */}
          <TabsContent value="calendar">
            <TaskCalendarView tasks={filteredTasks} projects={projects} onTaskClick={openEditTask} />
          </TabsContent>

          {/* Projects View */}
          <TabsContent value="projects">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {projects.map(p => {
                const pTasks = tasks.filter(t => t.project_id === p.id);
                const done = pTasks.filter(t => t.status === 'completed').length;
                const pct = pTasks.length ? Math.round((done / pTasks.length) * 100) : 0;
                return (
                  <Card key={p.id} className="hover:shadow-md transition-all cursor-pointer group" onClick={() => setDetailProject(p)}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-lg"
                          style={{ backgroundColor: p.color }}>
                          {p.name.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-slate-800 truncate">{p.name}</h3>
                          <p className="text-xs text-slate-500">{pTasks.length} مهمة</p>
                        </div>
                        <button onClick={e => { e.stopPropagation(); setProjectModal({ open: true, initial: p }); }}
                          className="p-1.5 hover:bg-slate-100 rounded opacity-0 group-hover:opacity-100 transition-all">
                          <Edit2 className="w-3.5 h-3.5 text-slate-400" />
                        </button>
                      </div>
                      {p.description && <p className="text-xs text-slate-500 mb-3 line-clamp-2">{p.description}</p>}
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs text-slate-500">
                          <span>الإنجاز</span><span>{done}/{pTasks.length}</span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: p.color }} />
                        </div>
                      </div>
                      {p.due_date && (
                        <p className="text-xs text-slate-400 mt-2">
                          📅 {format(parseISO(p.due_date), 'd MMM yyyy', { locale: ar })}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
              <Card className="border-dashed border-2 cursor-pointer hover:bg-slate-50 transition-colors" onClick={() => setProjectModal({ open: true, initial: null })}>
                <CardContent className="p-4 flex flex-col items-center justify-center text-slate-400 min-h-[150px]">
                  <Plus className="w-8 h-8 mb-2" />
                  <p className="text-sm">مشروع جديد</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Modals */}
      <TaskFormModal
        open={taskModal.open}
        onClose={() => { setTaskModal({ open: false, initial: null }); setEditingTask(null); }}
        onSave={saveTask}
        initial={editingTask}
        projects={projects}
        allTasks={tasks}
        loading={actionLoading}
      />

      {alertsOpen && user?.email && (
        <ProjectAlertsPanel
          userEmail={user.email}
          onClose={() => { setAlertsOpen(false); loadUnreadCount(user.email); }}
        />
      )}

      {detailProject && (
        <ProjectDetailView
          project={detailProject}
          tasks={tasks}
          onClose={() => setDetailProject(null)}
          onRefresh={loadAll}
          onEditTask={openEditTask}
          onStatusChange={changeStatus}
        />
      )}
      <ProjectFormModal
        open={projectModal.open}
        onClose={() => setProjectModal({ open: false, initial: null })}
        onSave={saveProject}
        initial={projectModal.initial}
        loading={actionLoading}
      />

      <GlobalSearchPanel
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        projects={projects}
        tasks={tasks}
        onEditTask={openEditTask}
        onOpenProject={setDetailProject}
      />
    </div>
  );
}