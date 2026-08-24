import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Link2, ChevronRight } from "lucide-react";

export default function TaskDependencies({ task, projectId, onTaskSelect }) {
  const [dependencies, setDependencies] = useState([]);
  const [dependents, setDependents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDependencies();
  }, [task?.id]);

  const loadDependencies = async () => {
    try {
      setLoading(true);
      const allTasks = await base44.entities.ProjectTask.filter({ project_id: projectId });

      // Get dependency tasks
      if (task?.dependencies?.length > 0) {
        const depTasks = allTasks.filter(t => task.dependencies.includes(t.id));
        setDependencies(depTasks);
      }

      // Get dependent tasks
      if (task?.dependent_tasks?.length > 0) {
        const depTasks = allTasks.filter(t => task.dependent_tasks.includes(t.id));
        setDependents(depTasks);
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "done":
        return "bg-green-100 text-green-800";
      case "in_progress":
        return "bg-blue-100 text-blue-800";
      case "review":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) return null;

  if (dependencies.length === 0 && dependents.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Link2 className="w-4 h-4" />
          التبعيات والمهام المترابطة
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Dependencies */}
        {dependencies.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-slate-600 mb-2">تعتمد على:</p>
            <div className="space-y-2">
              {dependencies.map((dep) => (
                <button
                  key={dep.id}
                  onClick={() => onTaskSelect(dep)}
                  className="w-full text-right p-2 rounded border border-slate-200 hover:bg-slate-50 transition-colors flex items-center justify-between group"
                >
                  <div>
                    <p className="text-sm font-medium">{dep.title}</p>
                    <Badge className={`text-xs mt-1 ${getStatusColor(dep.status)}`}>
                      {dep.status === "done" ? "✓ مكتملة" : "قيد الانتظار"}
                    </Badge>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Blockers Alert */}
        {dependencies.some(d => d.status !== "done") && (
          <div className="flex gap-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <p>هذه المهمة مرتبطة بمهام أخرى لم تكتمل بعد</p>
          </div>
        )}

        {/* Dependents */}
        {dependents.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-slate-600 mb-2">مهام تعتمد عليها:</p>
            <div className="space-y-2">
              {dependents.map((dep) => (
                <button
                  key={dep.id}
                  onClick={() => onTaskSelect(dep)}
                  className="w-full text-right p-2 rounded border border-slate-200 hover:bg-slate-50 transition-colors flex items-center justify-between group"
                >
                  <div>
                    <p className="text-sm font-medium">{dep.title}</p>
                    <Badge variant="outline" className="text-xs mt-1">
                      ينتظر إكمال هذه المهمة
                    </Badge>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600" />
                </button>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}