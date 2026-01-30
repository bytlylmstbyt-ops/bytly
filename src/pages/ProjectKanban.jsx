import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useSearchParams } from "react-router-dom";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { motion } from "framer-motion";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Settings, BarChart3, Workflow } from "lucide-react";
import KanbanColumn from "@/components/kanban/KanbanColumn";
import TaskDetailModal from "@/components/kanban/TaskDetailModal";

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

  useEffect(() => {
    loadData();
  }, [projectId]);

  const loadData = async () => {
    try {
      const [projectData] = await base44.entities.Project.filter({ id: projectId });
      setProject(projectData);

      const allTasks = await base44.entities.ProjectTask.filter({ project_id: projectId });
      setTasks(allTasks);

      const engineersData = await base44.entities.Engineer.list();
      setEngineers(engineersData);
    } catch (error) {
      console.error("Error loading data:", error);
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

    try {
      await base44.entities.ProjectTask.update(task.id, {
        status: newStatus
      });

      setTasks(tasks.map(t =>
        t.id === task.id ? { ...t, status: newStatus } : t
      ));
    } catch (error) {
      console.error("Error updating task:", error);
    }
  };

  const handleTaskSave = async (updatedTask) => {
    try {
      await base44.entities.ProjectTask.update(updatedTask.id, updatedTask);
      setTasks(tasks.map(t => t.id === updatedTask.id ? updatedTask : t));
    } catch (error) {
      console.error("Error saving task:", error);
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
    try {
      const created = await base44.entities.ProjectTask.create(taskData);
      setTasks([...tasks, created]);
      setIsModalOpen(false);
      setSelectedTask(null);
    } catch (error) {
      console.error("Error creating task:", error);
    }
  };

  const filteredTasks = tasks.filter(t =>
    t.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#d4a574]"></div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Card className="max-w-md w-full mx-4">
          <CardHeader>
            <CardTitle className="text-center">المشروع غير موجود</CardTitle>
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
      </div>
    </div>
  );
}