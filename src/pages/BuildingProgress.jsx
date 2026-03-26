import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import {
  HardHat, CheckCircle2, Clock, Circle, ChevronDown, ChevronUp,
  Upload, Loader2, Bell, Plus, Camera, FileText, Calendar,
  TrendingUp, AlertCircle, Edit3, X, Save
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle
} from "@/components/ui/dialog";

const STAGES = [
  { key: "design", label: "التصميم المعماري", icon: "🏛️", desc: "رسومات معمارية وهندسية", progress: 10 },
  { key: "permits", label: "استخراج الرخص", icon: "📋", desc: "رخصة البناء والموافقات", progress: 25 },
  { key: "foundation", label: "أعمال الأساسات", icon: "⛏️", desc: "حفر وصب الأساسات", progress: 45 },
  { key: "structure", label: "الهيكل الإنشائي", icon: "🏗️", desc: "الأعمدة والأسقف والجدران", progress: 70 },
  { key: "finishing", label: "التشطيبات", icon: "🎨", desc: "تشطيبات داخلية وخارجية", progress: 90 },
  { key: "handover", label: "التسليم النهائي", icon: "🔑", desc: "التسليم وتوثيق الضمانات", progress: 100 },
];

function StageIcon({ status }) {
  if (status === "done") return <CheckCircle2 className="w-6 h-6 text-green-500" />;
  if (status === "active") return <div className="w-6 h-6 rounded-full border-2 border-[#C9A66B] bg-amber-100 animate-pulse" />;
  return <Circle className="w-6 h-6 text-slate-300" />;
}

export default function BuildingProgress() {
  const urlParams = new URLSearchParams(window.location.search);
  const projectId = urlParams.get("project_id");

  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null); // "engineer" | "client"
  const [progressRecords, setProgressRecords] = useState([]);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [expandedStage, setExpandedStage] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const [updateForm, setUpdateForm] = useState({ stage: "", note: "", progress: 0, attachments: [] });
  const [createForm, setCreateForm] = useState({ project_id: "", expected_completion: "" });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setIsLoading(true);
    const u = await base44.auth.me();
    setUser(u);

    const [engineerData, clientData] = await Promise.all([
      base44.entities.Engineer.filter({ email: u.email }),
      base44.entities.Client.filter({ email: u.email }),
    ]);

    let role = "client";
    if (engineerData.length > 0) role = "engineer";
    setUserRole(role);

    const filter = role === "engineer"
      ? { engineer_email: u.email }
      : { client_email: u.email };

    const records = await base44.entities.BuildingProgress.filter(filter, "-updated_date");
    setProgressRecords(records);

    if (projectId) {
      const found = records.find(r => r.project_id === projectId);
      if (found) setSelectedRecord(found);
    } else if (records.length > 0) {
      setSelectedRecord(records[0]);
    }

    // Load projects for engineer (to link new progress tracking)
    if (role === "engineer") {
      const eng = engineerData[0];
      const projs = await base44.entities.Project.filter({ assigned_engineer_id: eng.id }, "-created_date", 20);
      setProjects(projs);
    }

    setIsLoading(false);
  };

  const getStageStatus = (stageKey, currentStage) => {
    const stageIdx = STAGES.findIndex(s => s.key === stageKey);
    const currentIdx = STAGES.findIndex(s => s.key === currentStage);
    if (stageIdx < currentIdx) return "done";
    if (stageIdx === currentIdx) return "active";
    return "pending";
  };

  const handleUpdateStage = async () => {
    if (!selectedRecord) return;
    setIsSaving(true);
    const stageData = STAGES.find(s => s.key === updateForm.stage);
    await base44.entities.BuildingProgress.update(selectedRecord.id, {
      current_stage: updateForm.stage,
      overall_progress: updateForm.progress || stageData?.progress || 0,
      last_update_note: updateForm.note,
      last_updated_by: user.full_name || user.email,
      attachments: [...(selectedRecord.attachments || []), ...updateForm.attachments],
    });
    await loadData();
    setShowUpdateModal(false);
    setIsSaving(false);
  };

  const handleCreateTracking = async () => {
    if (!createForm.project_id) return;
    setIsSaving(true);
    const project = projects.find(p => p.id === createForm.project_id);
    await base44.entities.BuildingProgress.create({
      project_id: createForm.project_id,
      project_title: project?.title || "مشروع جديد",
      client_email: project?.created_by || "",
      engineer_email: user.email,
      engineer_name: user.full_name,
      current_stage: "design",
      overall_progress: 10,
      expected_completion: createForm.expected_completion,
      stages: STAGES.map(s => ({ key: s.key, label: s.label, notes: [], attachments: [] })),
      last_update_note: "بدء متابعة مراحل البناء",
      last_updated_by: user.full_name,
    });
    await loadData();
    setShowCreateModal(false);
    setIsSaving(false);
  };

  const handleUploadAttachment = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setUpdateForm(p => ({ ...p, attachments: [...p.attachments, file_url] }));
    setIsUploading(false);
  };

  const openUpdateModal = () => {
    setUpdateForm({
      stage: selectedRecord?.current_stage || "design",
      note: "",
      progress: selectedRecord?.overall_progress || 0,
      attachments: [],
    });
    setShowUpdateModal(true);
  };

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#C9A66B]"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-amber-50/20" dir="rtl">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-[#4A3F35] flex items-center gap-2">
              <HardHat className="w-7 h-7 text-[#C9A66B]" /> متابعة مراحل البناء
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              {userRole === "engineer" ? "تحديث تقدم المشاريع وإشعار الملاك" : "تابع تقدم مشروعك لحظة بلحظة"}
            </p>
          </div>
          {userRole === "engineer" && (
            <Button
              onClick={() => setShowCreateModal(true)}
              className="bg-gradient-to-r from-[#6B5D4F] to-[#C9A66B] text-white gap-2"
            >
              <Plus className="w-4 h-4" /> ربط مشروع جديد
            </Button>
          )}
        </div>

        {progressRecords.length === 0 ? (
          <Card className="border-0 shadow-md">
            <CardContent className="p-12 text-center">
              <HardHat className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-600 mb-2">لا توجد مشاريع مرتبطة</h3>
              <p className="text-slate-400 text-sm">
                {userRole === "engineer"
                  ? "اضغط 'ربط مشروع جديد' لبدء متابعة مراحل البناء"
                  : "سيقوم المهندس المسؤول بربط مشروعك قريباً"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Projects List */}
            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">المشاريع</h2>
              {progressRecords.map(record => {
                const stageInfo = STAGES.find(s => s.key === record.current_stage);
                const isSelected = selectedRecord?.id === record.id;
                return (
                  <Card
                    key={record.id}
                    onClick={() => setSelectedRecord(record)}
                    className={`border-0 cursor-pointer transition-all shadow-sm hover:shadow-md ${isSelected ? "ring-2 ring-[#C9A66B]" : ""}`}
                  >
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-sm text-[#4A3F35] truncate">{record.project_title}</h3>
                      <div className="flex items-center gap-1 mt-1 mb-2">
                        <span className="text-base">{stageInfo?.icon}</span>
                        <span className="text-xs text-slate-500">{stageInfo?.label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Progress value={record.overall_progress || 0} className="flex-1 h-1.5" />
                        <span className="text-xs font-bold text-[#C9A66B]">{record.overall_progress || 0}%</span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Detail View */}
            {selectedRecord && (
              <motion.div
                key={selectedRecord.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="lg:col-span-2 space-y-5"
              >
                {/* Project Overview */}
                <Card className="border-0 shadow-lg overflow-hidden">
                  <div className="bg-gradient-to-r from-[#4A3F35] to-[#6B5D4F] p-5 text-white">
                    <div className="flex items-start justify-between">
                      <div>
                        <h2 className="text-xl font-bold">{selectedRecord.project_title}</h2>
                        <p className="text-white/70 text-sm mt-1">
                          مهندس: {selectedRecord.engineer_name || selectedRecord.engineer_email}
                        </p>
                        {selectedRecord.expected_completion && (
                          <p className="text-white/60 text-xs mt-1 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            تاريخ الانتهاء المتوقع: {new Date(selectedRecord.expected_completion).toLocaleDateString("ar")}
                          </p>
                        )}
                      </div>
                      <div className="text-center">
                        <div className="text-4xl font-bold text-[#C9A66B]">{selectedRecord.overall_progress || 0}%</div>
                        <div className="text-white/60 text-xs">إنجاز كلي</div>
                      </div>
                    </div>
                    <Progress value={selectedRecord.overall_progress || 0} className="mt-4 h-2 bg-white/20" />
                  </div>

                  {selectedRecord.last_update_note && (
                    <div className="px-5 py-3 bg-amber-50 border-b flex items-start gap-2">
                      <Bell className="w-4 h-4 text-[#C9A66B] mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-slate-600">{selectedRecord.last_update_note}</p>
                    </div>
                  )}
                </Card>

                {/* Stages Timeline */}
                <Card className="border-0 shadow-md">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base text-[#4A3F35] flex items-center justify-between">
                      مراحل التنفيذ
                      {userRole === "engineer" && (
                        <Button size="sm" onClick={openUpdateModal} className="bg-[#C9A66B] text-white gap-1.5">
                          <Edit3 className="w-3.5 h-3.5" /> تحديث الحالة
                        </Button>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-1">
                      {STAGES.map((stage, idx) => {
                        const status = getStageStatus(stage.key, selectedRecord.current_stage);
                        const isExpanded = expandedStage === stage.key;
                        return (
                          <div key={stage.key}>
                            <button
                              className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-right ${
                                status === "active" ? "bg-amber-50 border border-amber-200" :
                                status === "done" ? "bg-green-50" : "hover:bg-slate-50"
                              }`}
                              onClick={() => setExpandedStage(isExpanded ? null : stage.key)}
                            >
                              <StageIcon status={status} />
                              <span className="text-xl">{stage.icon}</span>
                              <div className="flex-1 text-right">
                                <p className={`text-sm font-medium ${status === "active" ? "text-[#4A3F35]" : status === "done" ? "text-green-700" : "text-slate-400"}`}>
                                  {stage.label}
                                </p>
                                <p className="text-xs text-slate-400">{stage.desc}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                {status === "active" && (
                                  <Badge className="bg-amber-100 text-amber-700 text-xs border-0">جارٍ</Badge>
                                )}
                                {status === "done" && (
                                  <Badge className="bg-green-100 text-green-700 text-xs border-0">مكتمل</Badge>
                                )}
                                {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                              </div>
                            </button>

                            {/* Connector Line */}
                            {idx < STAGES.length - 1 && (
                              <div className={`w-0.5 h-4 mr-6 ${status === "done" ? "bg-green-300" : "bg-slate-200"}`} />
                            )}

                            {/* Expanded: attachments if any */}
                            <AnimatePresence>
                              {isExpanded && status !== "pending" && selectedRecord.attachments?.length > 0 && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: "auto", opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  className="mr-12 mb-2 grid grid-cols-3 gap-2"
                                >
                                  {selectedRecord.attachments.slice(0, 6).map((url, i) => (
                                    <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                                      <div className="aspect-square rounded-lg bg-slate-100 overflow-hidden">
                                        <img src={url} alt="" className="w-full h-full object-cover" onError={e => e.target.style.display = "none"} />
                                      </div>
                                    </a>
                                  ))}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                {/* Recent Attachments */}
                {selectedRecord.attachments?.length > 0 && (
                  <Card className="border-0 shadow-md">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base text-[#4A3F35] flex items-center gap-2">
                        <Camera className="w-4 h-4 text-[#C9A66B]" /> صور وملفات المشروع
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                        {selectedRecord.attachments.map((url, i) => (
                          <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                            className="aspect-square rounded-lg bg-slate-100 overflow-hidden block hover:opacity-90 transition-opacity">
                            <img src={url} alt="" className="w-full h-full object-cover"
                              onError={e => { e.target.style.display = "none"; e.target.parentElement.innerHTML = '<div class="w-full h-full flex items-center justify-center text-slate-400"><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg></div>'; }} />
                          </a>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </motion.div>
            )}
          </div>
        )}
      </div>

      {/* Update Stage Modal */}
      <Dialog open={showUpdateModal} onOpenChange={setShowUpdateModal}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-right text-[#4A3F35]">تحديث مرحلة البناء</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-sm mb-1.5 block">المرحلة الحالية</Label>
              <Select value={updateForm.stage} onValueChange={v => {
                const s = STAGES.find(x => x.key === v);
                setUpdateForm(p => ({ ...p, stage: v, progress: s?.progress || p.progress }));
              }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STAGES.map(s => (
                    <SelectItem key={s.key} value={s.key}>
                      {s.icon} {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm mb-1.5 block">نسبة الإنجاز: <span className="font-bold text-[#C9A66B]">{updateForm.progress}%</span></Label>
              <input
                type="range" min={0} max={100} step={5}
                value={updateForm.progress}
                onChange={e => setUpdateForm(p => ({ ...p, progress: parseInt(e.target.value) }))}
                className="w-full accent-[#C9A66B]"
              />
              <div className="flex justify-between text-xs text-slate-400">
                <span>0%</span><span>100%</span>
              </div>
            </div>

            <div>
              <Label className="text-sm mb-1.5 block">ملاحظات للمالك (ستصله كإشعار)</Label>
              <Textarea
                placeholder="وصف ما تم إنجازه في هذه المرحلة..."
                value={updateForm.note}
                onChange={e => setUpdateForm(p => ({ ...p, note: e.target.value }))}
                rows={3}
              />
            </div>

            <div>
              <Label className="text-sm mb-1.5 block flex items-center gap-1">
                <Camera className="w-3.5 h-3.5" /> إضافة صور التقدم
              </Label>
              <div className="flex gap-2">
                <input type="file" id="progress-upload" accept="image/*,.pdf" className="hidden" onChange={handleUploadAttachment} />
                <label htmlFor="progress-upload">
                  <Button type="button" variant="outline" size="sm" className="gap-1.5 cursor-pointer" asChild>
                    <span>{isUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                      رفع ملف</span>
                  </Button>
                </label>
                {updateForm.attachments.length > 0 && (
                  <span className="text-xs text-green-600 self-center">{updateForm.attachments.length} ملف مرفق</span>
                )}
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                onClick={handleUpdateStage}
                disabled={isSaving}
                className="flex-1 bg-gradient-to-r from-[#6B5D4F] to-[#C9A66B] text-white gap-2"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                حفظ وإشعار المالك
              </Button>
              <Button variant="outline" onClick={() => setShowUpdateModal(false)}>إلغاء</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Tracking Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-right text-[#4A3F35]">ربط مشروع بمتابعة البناء</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-sm mb-1.5 block">اختر المشروع</Label>
              <Select value={createForm.project_id} onValueChange={v => setCreateForm(p => ({ ...p, project_id: v }))}>
                <SelectTrigger><SelectValue placeholder="اختر مشروعاً..." /></SelectTrigger>
                <SelectContent>
                  {projects.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {projects.length === 0 && (
                <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> لا توجد مشاريع مسندة لك حالياً
                </p>
              )}
            </div>
            <div>
              <Label className="text-sm mb-1.5 block">تاريخ الانتهاء المتوقع</Label>
              <Input
                type="date"
                value={createForm.expected_completion}
                onChange={e => setCreateForm(p => ({ ...p, expected_completion: e.target.value }))}
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleCreateTracking}
                disabled={isSaving || !createForm.project_id}
                className="flex-1 bg-gradient-to-r from-[#6B5D4F] to-[#C9A66B] text-white gap-2"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                ربط وبدء المتابعة
              </Button>
              <Button variant="outline" onClick={() => setShowCreateModal(false)}>إلغاء</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}