import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useSearchParams, Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2, Save, Loader2, GripVertical, ArrowRight } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const COLORS = ["slate", "blue", "purple", "green", "orange", "red"];

export default function WorkflowBuilder() {
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get("id");

  const [project, setProject] = useState(null);
  const [workflow, setWorkflow] = useState(null);
  const [stages, setStages] = useState([]);
  const [newStage, setNewStage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, [projectId]);

  const loadData = async () => {
    try {
      const [projectData] = await base44.entities.Project.filter({ id: projectId });
      setProject(projectData);

      const workflows = await base44.entities.ProjectWorkflow.filter({
        project_id: projectId
      });

      if (workflows.length > 0) {
        const wf = workflows[0];
        setWorkflow(wf);
        setStages(wf.stages || []);
      } else {
        // Create default workflow
        const newWorkflow = {
          project_id: projectId,
          name: "سير العمل الافتراضي",
          stages: [
            {
              stage_id: "todo",
              name: "للقيام به",
              order: 1,
              requires_approval: false,
              color: "slate"
            },
            {
              stage_id: "in_progress",
              name: "قيد التنفيذ",
              order: 2,
              requires_approval: false,
              color: "blue"
            },
            {
              stage_id: "review",
              name: "المراجعة",
              order: 3,
              requires_approval: true,
              approval_from: "client",
              color: "purple"
            },
            {
              stage_id: "done",
              name: "مكتمل",
              order: 4,
              requires_approval: false,
              color: "green"
            }
          ],
          current_stage_id: "todo",
          is_active: true
        };
        setWorkflow(newWorkflow);
        setStages(newWorkflow.stages);
      }
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddStage = () => {
    const stage = {
      stage_id: `stage_${Date.now()}`,
      name: newStage?.name || "مرحلة جديدة",
      description: newStage?.description || "",
      order: stages.length + 1,
      requires_approval: newStage?.requires_approval || false,
      approval_from: newStage?.approval_from || "none",
      completion_tasks: newStage?.completion_tasks || [],
      estimated_duration_days: newStage?.estimated_duration_days || 0,
      color: newStage?.color || "slate"
    };
    setStages([...stages, stage]);
    setNewStage(null);
  };

  const handleRemoveStage = (index) => {
    setStages(stages.filter((_, i) => i !== index));
  };

  const handleUpdateStage = (index, updates) => {
    const updated = [...stages];
    updated[index] = { ...updated[index], ...updates };
    setStages(updated);
  };

  const handleSaveWorkflow = async () => {
    setSaving(true);
    try {
      const workflowData = {
        ...workflow,
        stages,
        current_stage_id: workflow?.current_stage_id || stages[0].stage_id
      };

      if (workflow?.id) {
        await base44.entities.ProjectWorkflow.update(workflow.id, workflowData);
      } else {
        await base44.entities.ProjectWorkflow.create(workflowData);
      }

      setWorkflow(workflowData);
    } catch (error) {
      console.error("Error saving workflow:", error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#d4a574]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-amber-50/30 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          {/* Header */}
          <div className="mb-8">
            <Link to={createPageUrl("ProjectKanban") + `?id=${projectId}`}>
              <Button variant="ghost" className="mb-4">←عودة</Button>
            </Link>
            <h1 className="text-3xl font-bold text-[#1a1a2e]">بناء سير العمل</h1>
            <p className="text-slate-600 mt-2">{project?.title}</p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Stages List */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>مراحل سير العمل</CardTitle>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button size="sm" className="gap-2">
                        <Plus className="w-4 h-4" />
                        مرحلة جديدة
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>إضافة مرحلة جديدة</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium">اسم المرحلة</label>
                          <Input
                            value={newStage?.name || ""}
                            onChange={(e) => setNewStage({ ...newStage, name: e.target.value })}
                            placeholder="مثال: تصميم التفاصيل"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium">الوصف</label>
                          <Textarea
                            value={newStage?.description || ""}
                            onChange={(e) => setNewStage({ ...newStage, description: e.target.value })}
                            placeholder="وصف المرحلة"
                            rows={3}
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium">المدة المتوقعة (بالأيام)</label>
                          <Input
                            type="number"
                            value={newStage?.estimated_duration_days || ""}
                            onChange={(e) => setNewStage({ ...newStage, estimated_duration_days: parseInt(e.target.value) })}
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium">اللون</label>
                          <Select value={newStage?.color || "slate"} onValueChange={(value) => setNewStage({ ...newStage, color: value })}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {COLORS.map((color) => (
                                <SelectItem key={color} value={color}>
                                  {color === "slate" ? "رمادي" : color === "blue" ? "أزرق" : color === "purple" ? "بنفسجي" : color === "green" ? "أخضر" : color === "orange" ? "برتقالي" : "أحمر"}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex items-center gap-2">
                          <Checkbox
                            checked={newStage?.requires_approval || false}
                            onCheckedChange={(checked) => setNewStage({ ...newStage, requires_approval: checked })}
                          />
                          <label className="text-sm">تتطلب موافقة</label>
                        </div>
                        {newStage?.requires_approval && (
                          <div>
                            <label className="text-sm font-medium">موافقة من</label>
                            <Select value={newStage?.approval_from || "client"} onValueChange={(value) => setNewStage({ ...newStage, approval_from: value })}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="client">العميل</SelectItem>
                                <SelectItem value="engineer">المهندس</SelectItem>
                                <SelectItem value="both">الطرفان</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                        <Button onClick={handleAddStage} className="w-full">إضافة</Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </CardHeader>
                <CardContent className="space-y-3">
                  {stages.map((stage, index) => (
                    <motion.div
                      key={stage.stage_id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="p-4 border rounded-lg hover:border-[#d4a574] transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge>{index + 1}</Badge>
                            <h3 className="font-semibold text-slate-900">{stage.name}</h3>
                          </div>
                          {stage.description && (
                            <p className="text-sm text-slate-600 mb-2">{stage.description}</p>
                          )}
                          <div className="flex gap-2 flex-wrap">
                            {stage.requires_approval && (
                              <Badge variant="outline" className="text-xs">
                                ✓ موافقة من {stage.approval_from === "client" ? "العميل" : stage.approval_from === "engineer" ? "المهندس" : "الطرفين"}
                              </Badge>
                            )}
                            {stage.estimated_duration_days > 0 && (
                              <Badge variant="outline" className="text-xs">
                                ⏱ {stage.estimated_duration_days} أيام
                              </Badge>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveStage(index)}
                          className="text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Preview and Save */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>معاينة سير العمل</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {stages.map((stage, index) => (
                    <div key={stage.stage_id}>
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full bg-slate-400`} />
                        <span className="text-sm font-medium text-slate-700">{stage.name}</span>
                      </div>
                      {index < stages.length - 1 && (
                        <div className="w-0.5 h-6 bg-slate-200 ml-1.5" />
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Button
                onClick={handleSaveWorkflow}
                disabled={saving}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 gap-2"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    جاري الحفظ...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    حفظ سير العمل
                  </>
                )}
              </Button>

              <Link to={createPageUrl("ProjectKanban") + `?id=${projectId}`} className="block">
                <Button variant="outline" className="w-full">
                  عرض لوحة المشروع
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}