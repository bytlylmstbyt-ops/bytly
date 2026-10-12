import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { supabase } from "@/lib/supabaseClient";
import { useSearchParams } from "react-router-dom";
import { DragDropContext } from "@hello-pangea/dnd";
import { motion } from "framer-motion";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Settings, BarChart3, Workflow, MessageSquare } from "lucide-react";
import KanbanColumn from "@/components/kanban/KanbanColumn";
import TaskDetailModal from "@/components/kanban/TaskDetailModal";
import TaskActivityHistory from "@/components/project/TaskActivityHistory";

const COLUMN_CONFIG = [
  { status: "todo", title: "للقيام به", color: "from-slate-50 to-slate-50" },
  { status: "in_progress", title: "قيد التنفيذ", color: "from-blue-50 to-blue-50" },
  { status: "review", title: "المراجعة", color: "from-purple-50 to-purple-50" },
  { status: "done", title: "مكتمل", color: "from-green-50 to-green-50" }
];

export default function ProjectKanban() {
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get("id");

  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [engineers, setEngineers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    loadData();
  }, [projectId]);

  const loadData = async () => {
    setLoading(true);
    setLoadError("");
    try {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!authData?.user?.id) throw new Error("سجّل الدخول لعرض مهام المشروع.");

      const [projectResult, taskResult, engineerResult] = await Promise.all([
        supabase.from("projects").select("*").eq("id", projectId).maybeSingle(),
        supabase.from("project_tasks").select("*").eq("project_id", projectId).order("created_at", { ascending: true }),
        supabase.from("engineers").select("id,user_id,full_name,email,status").eq("status", "approved"),
      ]);
      for (const result of [projectResult, taskResult, engineerResult]) if (result.error) throw result.error;
      if (!projectResult.data) throw new Error("المشروع غير موجود أو لا تملك صلاحية عرضه.");
      setProject(projectResult.data);
      setTasks((taskResult.data || []).map(task => ({
        ...task,
        progress_percentage: task.progress ?? 0,
        comments: task.comments || [],
      })));
      setEngineers(engineerResult.data || []);
    } catch (error) {
      console.error("Error loading project Kanban from Supabase:", error);
      setLoadError(error?.message || "تعذر تحميل لوحة المهام.");
      setProject(null);
      setTasks([]);
      setEngineers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnd = async (result) => {
    const { source, destination, draggableId } = result;

    if (!destination) return;

    const task = tasks.find(t => t.id === draggableId);
    if (!task) return;

    const newStatus = destination.droppableId;

    if (task.status === newStatus) return;

    // Optimistic UI — update local cache immediately, rollback on failure
    const prevTasks = tasks;
    setTasks(prev => prev.map(t =>
      t.id === task.id ? { ...t, status: newStatus } : t
    ));

    try {
      const { error } = await supabase.from("project_tasks").update({ status: newStatus, completed_at: newStatus === "done" ? new Date().toISOString() : null }).eq("id", task.id).eq("project_id", projectId);
      if (error) throw error;
    } catch (error) {
      console.error("Error updating task:", error);
      setTasks(prevTasks); // rollback to previous state
    }
  };

  const handleTaskSave = async (updatedTask) => {
    setLoadError("");
    try {
      if (!updatedTask.id) {
        await handleCreateTask(updatedTask);
        return;
      }
      const patch = {
        title: String(updatedTask.title || "").trim(),
        description: updatedTask.description || "",
        status: updatedTask.status || "todo",
        priority: updatedTask.priority || "medium",
        assigned_to: updatedTask.assigned_to || null,
        due_date: updatedTask.due_date || null,
        estimated_hours: updatedTask.estimated_hours === "" ? null : Number(updatedTask.estimated_hours) || null,
        progress: Math.max(0, Math.min(100, Number(updatedTask.progress_percentage) || 0)),
        comments: Array.isArray(updatedTask.comments) ? updatedTask.comments : [],
        completed_at: updatedTask.status === "done" ? new Date().toISOString() : null,
      };
      const { data, error } = await supabase.from("project_tasks").update(patch).eq("id", updatedTask.id).eq("project_id", projectId).select("*").single();
      if (error) throw error;
      setTasks(prev => prev.map(task => task.id === updatedTask.id ? { ...data, progress_percentage: data.progress ?? 0, comments: data.comments || [] } : task));
    } catch (error) {
      console.error("Error saving task:", error);
      setLoadError(error?.message || "تعذر حفظ المهمة.");
      throw error;
    }
  };

  const handleAddTask = (status) => {
    setSelectedTask({
      project_id: projectId,
      title: "",
      description: "",
      status,
      priority: "medium",
      progress_percentage: 0,
      comments: []
    });
    setIsModalOpen(true);
  };

  const handleCreateTask = async (taskData) => {
    setLoadError("");
    try {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!authData?.user?.id) throw new Error("انتهت الجلسة؛ سجّل الدخول مجددًا.");
      const row = {
        project_id: projectId,
        title: String(taskData.title || "").trim(),
        description: taskData.description || "",
        status: taskData.status || "todo",
        priority: taskData.priority || "medium",
        assigned_to: taskData.assigned_to || null,
        due_date: taskData.due_date || null,
        estimated_hours: taskData.estimated_hours === "" ? null : Number(taskData.estimated_hours) || null,
        progress: Math.max(0, Math.min(100, Number(taskData.progress_percentage) || 0)),
        comments: Array.isArray(taskData.comments) ? taskData.comments : [],
      };
      if (!row.title) throw new Error("اكتب عنوان المهمة أولًا.");
      const { data, error } = await supabase.from("project_tasks").insert(row).select("*").single();
      if (error) throw error;
      setTasks(prev => [...prev, { ...data, progress_percentage: data.progress ?? 0, comments: data.comments || [] }]);
      setIsModalOpen(false);
      setSelectedTask(null);
    } catch (error) {
      console.error("Error creating task:", error);
      setLoadError(error?.message || "تعذر إنشاء المهمة.");
    }
  };

  const filteredTasks = tasks.filter(t =>
    t.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#C9A66B]"></div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Card className="max-w-md w-full mx-4">
          <CardHeader>
            <CardTitle className="text-center">{loadError ? "تعذر تحميل لوحة المهام" : "المشروع غير موجود"}</CardTitle>
          {loadError && <p role="alert" className="p-4 text-sm text-red-700">{loadError}</p>}
          </CardHeader>
        </Card>
      </div>
    );
  }

  const stats = {
    total: filteredTasks.length,
    done: filteredTasks.filter(t => t.status === "done").length,
    inProgress: filteredTasks.filter(t => t.status === "in_progress").length
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-amber-50/30 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {loadError && <div role="alert" className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{loadError}</div>}
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-[#1a1a2e] mb-2">{project.title}</h1>
              <p className="text-slate-600">{project.description}</p>
            </div>
            <div className="flex gap-2">
              <Link to={createPageUrl("ProjectChat") + `?id=${projectId}`}>
                <Button variant="outline" className="gap-2">
                  <MessageSquare className="w-4 h-4" />
                  المحادثات
                </Button>
              </Link>
              <Link to={createPageUrl("WorkflowBuilder") + `?id=${projectId}`}>
                <Button variant="outline" className="gap-2">
                  <Workflow className="w-4 h-4" />
                  سير العمل
                </Button>
              </Link>
              <Button variant="outline" className="gap-2">
                <BarChart3 className="w-4 h-4" />
                التقارير
              </Button>
              <Button variant="outline" className="gap-2">
                <Settings className="w-4 h-4" />
                الإعدادات
              </Button>
            </div>
          </div>

          {/* Stats and Search */}
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="flex-1 relative">
              <Input
                placeholder="ابحث عن مهمة..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Badge variant="outline" className="px-3 py-1">
                {stats.total} مهمة
              </Badge>
              <Badge className="bg-blue-100 text-blue-800 px-3 py-1">
                {stats.inProgress} قيد التنفيذ
              </Badge>
              <Badge className="bg-green-100 text-green-800 px-3 py-1">
                {stats.done} مكتملة
              </Badge>
            </div>
          </div>
        </motion.div>

        {/* Kanban Board */}
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="flex gap-4 overflow-x-auto pb-4">
            {COLUMN_CONFIG.map((column) => (
              <KanbanColumn
                key={column.status}
                status={column.status}
                title={column.title}
                color={column.color}
                tasks={filteredTasks}
                engineers={engineers}
                onTaskClick={(task) => {
                  setSelectedTask(task);
                  setIsModalOpen(true);
                }}
                onAddTask={handleAddTask}
              />
            ))}
          </div>
        </DragDropContext>

        {/* Task Detail Modal */}
        <TaskDetailModal
          task={selectedTask}
          project={project}
          engineers={engineers}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedTask(null);
          }}
          onSave={(taskData) => {
            if (taskData.id) {
              handleTaskSave(taskData);
            } else {
              handleCreateTask(taskData);
            }
            setIsModalOpen(false);
            setSelectedTask(null);
          }}
        />

        {/* Task Activity History — سجل شفاف للتعديلات */}
        <div className="mt-8">
          <TaskActivityHistory projectId={projectId} />
        </div>
      </div>
    </div>
  );
}