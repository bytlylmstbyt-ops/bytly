import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { jsPDF } from "jspdf";
import {
  Building2, Clock, Plus, Edit3, Save, X, Loader2, Bell, Calendar, User, Camera, TrendingUp, Download
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";

const PHASES_CONFIG = [
  { key: "design",     label: "التصميم المعماري",    icon: "✏️", color: "blue",   defaultProgress: 0 },
  { key: "permits",    label: "استخراج الرخص",       icon: "📋", color: "yellow", defaultProgress: 0 },
  { key: "foundation", label: "الحفر والأساسات",     icon: "⛏️", color: "orange", defaultProgress: 0 },
  { key: "structure",  label: "الهيكل الإنشائي",    icon: "🏗️", color: "red",    defaultProgress: 0 },
  { key: "finishing",  label: "التشطيبات",           icon: "🎨", color: "purple", defaultProgress: 0 },
  { key: "handover",   label: "التسليم والفحص",      icon: "🔑", color: "green",  defaultProgress: 0 },
];

const STATUS_CONFIG = {
  pending:     { label: "لم يبدأ",   color: "bg-slate-100 text-slate-600",   dot: "bg-slate-400" },
  in_progress: { label: "جارٍ",      color: "bg-blue-100 text-blue-700",     dot: "bg-blue-500" },
  completed:   { label: "مكتمل",     color: "bg-green-100 text-green-700",   dot: "bg-green-500" },
  delayed:     { label: "متأخر",     color: "bg-red-100 text-red-700",       dot: "bg-red-500" },
};

const COLOR_MAP = {
  blue:   "from-blue-500 to-blue-600",
  yellow: "from-yellow-500 to-amber-500",
  orange: "from-orange-500 to-orange-600",
  red:    "from-red-500 to-rose-500",
  purple: "from-purple-500 to-purple-600",
  green:  "from-green-500 to-emerald-500",
};

function buildDefaultPhases() {
  return PHASES_CONFIG.map(p => ({
    key: p.key, label: p.label, status: "pending",
    progress: 0, start_date: "", end_date: "", notes: "", attachments: []
  }));
}

export default function ConstructionTracker() {
  const urlParams = new URLSearchParams(window.location.search);
  const trackerId = urlParams.get("id");

  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null); // 'engineer' | 'client'
  const [trackers, setTrackers] = useState([]);
  const [selectedTracker, setSelectedTracker] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [editingPhase, setEditingPhase] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [showNewModal, setShowNewModal] = useState(false);
  const [newForm, setNewForm] = useState({ project_title: "", client_email: "", start_date: "", expected_end_date: "" });
  const [projects, setProjects] = useState([]);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [logMessage, setLogMessage] = useState("");
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => { loadData(); }, []);
  useEffect(() => {
    if (trackerId && trackers.length > 0) {
      setSelectedTracker(trackers.find(t => t.id === trackerId) || trackers[0]);
    }
  }, [trackerId, trackers]);

  const loadData = async () => {
    setIsLoading(true);
    const u = await base44.auth.me();
    setUser(u);

    const [engs, clients] = await Promise.all([
      base44.entities.Engineer.filter({ email: u.email }),
      base44.entities.Client.filter({ email: u.email }),
    ]);

    let role = null;
    let list = [];
    if (engs.length > 0) {
      role = "engineer";
      list = await base44.entities.BuildingProgress.filter({ engineer_email: u.email }, "-updated_date");
    } else {
      role = "client";
      list = await base44.entities.BuildingProgress.filter({ client_email: u.email }, "-updated_date");
    }

    setUserRole(role);
    setTrackers(list);
    if (list.length > 0 && !trackerId) setSelectedTracker(list[0]);

    if (role === "engineer") {
      const projs = await base44.entities.Project.filter({ assigned_engineer_id: engs[0]?.id });
      setProjects(projs);
    }
    setIsLoading(false);
  };

  const handleCreateTracker = async () => {
    if (!newForm.project_title || !newForm.client_email) return;
    setIsSaving(true);
    const eng = await base44.entities.Engineer.filter({ email: user.email });
    const tracker = await base44.entities.BuildingProgress.create({
      project_title: newForm.project_title,
      client_email: newForm.client_email,
      engineer_email: user.email,
      engineer_name: user.full_name,
      start_date: newForm.start_date,
      expected_end_date: newForm.expected_end_date,
      current_phase: "design",
      overall_progress: 0,
      phases: buildDefaultPhases(),
      updates_log: [],
      status: "active",
    });
    setTrackers(p => [tracker, ...p]);
    setSelectedTracker(tracker);
    setShowNewModal(false);
    setNewForm({ project_title: "", client_email: "", start_date: "", expected_end_date: "" });
    setIsSaving(false);
  };

  const startEditPhase = (phase) => {
    setEditingPhase(phase.key);
    setEditForm({ ...phase });
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingFile(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setEditForm(p => ({ ...p, attachments: [...(p.attachments || []), file_url] }));
    setUploadingFile(false);
  };

  const savePhase = async () => {
    if (!selectedTracker) return;
    setIsSaving(true);

    const updatedPhases = selectedTracker.phases.map(p =>
      p.key === editingPhase ? { ...editForm, updated_at: new Date().toISOString() } : p
    );

    // Calc overall progress
    const overall = Math.round(updatedPhases.reduce((acc, p) => acc + (p.progress || 0), 0) / updatedPhases.length);

    // Find current phase (latest in_progress or last completed)
    const inProgress = updatedPhases.find(p => p.status === "in_progress");
    const lastCompleted = [...updatedPhases].reverse().find(p => p.status === "completed");
    const currentPhase = inProgress?.key || lastCompleted?.key || "design";

    // Log entry
    const logEntry = {
      date: new Date().toISOString(),
      message: `تحديث مرحلة "${editForm.label}": ${editForm.status === "completed" ? "✅ مكتملة" : editForm.status === "in_progress" ? "🔄 جارية" : editForm.status === "delayed" ? "⚠️ متأخرة" : "⏸ متوقفة"} (${editForm.progress}%)${editForm.notes ? ` - ${editForm.notes}` : ""}`,
      phase: editForm.key,
      by: user.full_name,
    };

    const updated = await base44.entities.BuildingProgress.update(selectedTracker.id, {
      phases: updatedPhases,
      overall_progress: overall,
      current_phase: currentPhase,
      updates_log: [...(selectedTracker.updates_log || []), logEntry],
    });

    // Notify client
    try {
      await base44.functions.invoke("notifyPhaseChange", {
        tracker_id: selectedTracker.id,
        phase_label: editForm.label,
        progress: editForm.progress,
        client_email: selectedTracker.client_email,
        project_title: selectedTracker.project_title,
      });
    } catch (e) {}

    setSelectedTracker({ ...selectedTracker, ...updated });
    setTrackers(p => p.map(t => t.id === updated.id ? { ...t, ...updated } : t));
    setEditingPhase(null);
    setIsSaving(false);
  };

  const exportPDF = () => {
    if (!selectedTracker) return;
    setIsExporting(true);
    try {
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageW = doc.internal.pageSize.getWidth();
      let y = 20;

      // Header
      doc.setFillColor(74, 63, 53);
      doc.rect(0, 0, pageW, 35, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(18);
      doc.text("Construction Progress Report", pageW / 2, 15, { align: "center" });
      doc.setFontSize(11);
      doc.text(selectedTracker.project_title || "", pageW / 2, 25, { align: "center" });
      doc.setTextColor(0, 0, 0);
      y = 45;

      // Project Info
      doc.setFontSize(12);
      doc.setFont(undefined, "bold");
      doc.text("Project Information", 15, y);
      doc.setFont(undefined, "normal");
      y += 7;
      doc.setFontSize(10);
      doc.setDrawColor(201, 166, 107);
      doc.line(15, y, pageW - 15, y);
      y += 5;
      doc.text(`Engineer: ${selectedTracker.engineer_name || "-"}`, 15, y); y += 6;
      doc.text(`Client Email: ${selectedTracker.client_email || "-"}`, 15, y); y += 6;
      doc.text(`Start Date: ${selectedTracker.start_date || "-"}`, 15, y);
      doc.text(`Expected Delivery: ${selectedTracker.expected_end_date || "-"}`, pageW / 2, y); y += 6;
      doc.text(`Report Date: ${new Date().toLocaleDateString("en-GB")}`, 15, y); y += 10;

      // Overall Progress
      doc.setFontSize(12);
      doc.setFont(undefined, "bold");
      doc.text("Overall Progress", 15, y); y += 7;
      doc.setFont(undefined, "normal");
      doc.setFontSize(22);
      doc.setTextColor(201, 166, 107);
      doc.text(`${selectedTracker.overall_progress || 0}%`, 15, y);
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(10);
      // Progress bar
      const barX = 35, barY = y - 5, barW = pageW - 50, barH = 6;
      doc.setDrawColor(220, 220, 220);
      doc.setFillColor(240, 240, 240);
      doc.roundedRect(barX, barY, barW, barH, 2, 2, "FD");
      const fillW = (barW * (selectedTracker.overall_progress || 0)) / 100;
      if (fillW > 0) {
        doc.setFillColor(201, 166, 107);
        doc.roundedRect(barX, barY, fillW, barH, 2, 2, "F");
      }
      y += 15;

      // Phases
      doc.setFontSize(12);
      doc.setFont(undefined, "bold");
      doc.text("Construction Phases Summary", 15, y); y += 7;
      doc.line(15, y, pageW - 15, y); y += 5;

      const statusLabel = { pending: "Not Started", in_progress: "In Progress", completed: "Completed", delayed: "Delayed" };
      const phases = selectedTracker.phases || [];
      phases.forEach(phase => {
        if (y > 260) { doc.addPage(); y = 20; }
        doc.setFont(undefined, "bold");
        doc.setFontSize(10);
        doc.text(phase.label || phase.key, 15, y);
        doc.setFont(undefined, "normal");
        const st = statusLabel[phase.status] || phase.status || "Pending";
        doc.text(`Status: ${st}  |  Progress: ${phase.progress || 0}%`, 80, y);
        y += 5;
        if (phase.notes) {
          doc.setFontSize(9);
          doc.setTextColor(100, 100, 100);
          doc.text(`Notes: ${phase.notes}`, 15, y);
          doc.setTextColor(0, 0, 0);
          y += 5;
        }
        if (phase.start_date || phase.end_date) {
          doc.setFontSize(9);
          doc.setTextColor(100, 100, 100);
          doc.text(`Start: ${phase.start_date || "-"}  End: ${phase.end_date || "-"}`, 15, y);
          doc.setTextColor(0, 0, 0);
          y += 5;
        }
        doc.setDrawColor(230, 230, 230);
        doc.line(15, y, pageW - 15, y);
        y += 4;
      });

      // Updates Log
      const logs = selectedTracker.updates_log || [];
      if (logs.length > 0) {
        if (y > 240) { doc.addPage(); y = 20; }
        y += 5;
        doc.setFontSize(12);
        doc.setFont(undefined, "bold");
        doc.text("Updates Log", 15, y); y += 7;
        doc.setDrawColor(201, 166, 107);
        doc.line(15, y, pageW - 15, y); y += 5;

        [...logs].reverse().forEach(log => {
          if (y > 275) { doc.addPage(); y = 20; }
          doc.setFontSize(9);
          doc.setFont(undefined, "bold");
          const dateStr = new Date(log.date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
          doc.text(`${dateStr} - ${log.by || ""}`, 15, y); y += 5;
          doc.setFont(undefined, "normal");
          doc.setTextColor(60, 60, 60);
          const lines = doc.splitTextToSize(log.message || "", pageW - 30);
          lines.forEach(line => {
            if (y > 275) { doc.addPage(); y = 20; }
            doc.text(line, 15, y); y += 5;
          });
          doc.setTextColor(0, 0, 0);
          y += 2;
        });
      }

      // Footer
      const totalPages = doc.internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(`Page ${i} of ${totalPages} | Generated by Bytly`, pageW / 2, 290, { align: "center" });
      }

      doc.save(`${selectedTracker.project_title || "project"}-report.pdf`);
    } finally {
      setIsExporting(false);
    }
  };

  const addLogMessage = async () => {
    if (!logMessage.trim() || !selectedTracker) return;
    setIsSaving(true);
    const logEntry = { date: new Date().toISOString(), message: logMessage, by: user.full_name, phase: selectedTracker.current_phase };
    const updated = await base44.entities.BuildingProgress.update(selectedTracker.id, {
      updates_log: [...(selectedTracker.updates_log || []), logEntry],
    });
    setSelectedTracker({ ...selectedTracker, ...updated });
    setTrackers(p => p.map(t => t.id === updated.id ? { ...t, ...updated } : t));
    setLogMessage("");
    setIsSaving(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-[#C9A66B]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-amber-50/20" dir="rtl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-[#4A3F35] flex items-center gap-2">
              <Building2 className="w-6 h-6 text-[#C9A66B]" />
              متابعة مراحل البناء
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              {userRole === "engineer" ? "تحديث مراحل مشاريعك وإبقاء العملاء على اطلاع" : "تابع تقدم مشاريعك لحظة بلحظة"}
            </p>
          </div>
          {userRole === "engineer" && (
            <Button onClick={() => setShowNewModal(true)} className="bg-gradient-to-r from-[#6B5D4F] to-[#C9A66B] text-white gap-2">
              <Plus className="w-4 h-4" /> مشروع جديد
            </Button>
          )}
        </div>

        {trackers.length === 0 ? (
          <div className="text-center py-20">
            <Building2 className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-600 mb-2">لا توجد مشاريع متابَعة</h3>
            <p className="text-slate-500 text-sm mb-4">
              {userRole === "engineer" ? "أضف مشروعاً لبدء متابعة مراحل البناء" : "سيظهر هنا تقدم مشاريعك عند تفعيل المهندس"}
            </p>
            {userRole === "engineer" && (
              <Button onClick={() => setShowNewModal(true)} className="bg-gradient-to-r from-[#6B5D4F] to-[#C9A66B] text-white gap-2">
                <Plus className="w-4 h-4" /> إضافة مشروع
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

            {/* Sidebar - project list */}
            <div className="lg:col-span-1 space-y-3">
              <h3 className="text-sm font-semibold text-slate-500 px-1">المشاريع ({trackers.length})</h3>
              {trackers.map(t => (
                <Card
                  key={t.id}
                  onClick={() => setSelectedTracker(t)}
                  className={`cursor-pointer border-0 shadow-sm transition-all hover:shadow-md ${selectedTracker?.id === t.id ? "ring-2 ring-[#C9A66B] shadow-md" : ""}`}
                >
                  <CardContent className="p-4">
                    <p className="font-semibold text-sm text-[#4A3F35] truncate">{t.project_title}</p>
                    <div className="mt-2">
                      <div className="flex justify-between text-xs text-slate-500 mb-1">
                        <span>الإنجاز</span>
                        <span>{t.overall_progress || 0}%</span>
                      </div>
                      <Progress value={t.overall_progress || 0} className="h-1.5" />
                    </div>
                    <Badge className={`mt-2 text-xs ${t.status === "active" ? "bg-green-100 text-green-700" : t.status === "completed" ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-600"}`}>
                      {t.status === "active" ? "نشط" : t.status === "completed" ? "مكتمل" : "موقوف"}
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Main content */}
            {selectedTracker && (
              <div className="lg:col-span-3 space-y-5">

                {/* Export PDF Button */}
                <div className="flex justify-end">
                  <Button
                    onClick={exportPDF}
                    disabled={isExporting}
                    variant="outline"
                    className="gap-2 border-[#C9A66B] text-[#C9A66B] hover:bg-[#C9A66B] hover:text-white"
                  >
                    {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                    تصدير تقرير PDF
                  </Button>
                </div>

                {/* Project Header */}
                <Card className="border-0 shadow-md bg-gradient-to-br from-[#4A3F35] to-[#6B5D4F] text-white">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                      <div>
                        <h2 className="text-xl font-bold">{selectedTracker.project_title}</h2>
                        <div className="flex flex-wrap gap-3 mt-2 text-white/70 text-sm">
                          <span className="flex items-center gap-1"><User className="w-3.5 h-3.5" /> {selectedTracker.engineer_name}</span>
                          {selectedTracker.start_date && <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {selectedTracker.start_date}</span>}
                          {selectedTracker.expected_end_date && <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> تسليم: {selectedTracker.expected_end_date}</span>}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-4xl font-bold">{selectedTracker.overall_progress || 0}%</div>
                        <div className="text-white/70 text-xs mt-1">إجمالي الإنجاز</div>
                      </div>
                    </div>
                    <Progress value={selectedTracker.overall_progress || 0} className="mt-4 h-2 bg-white/20" />
                  </CardContent>
                </Card>

                {/* Phases Timeline */}
                <Card className="border-0 shadow-md">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base text-[#4A3F35] flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-[#C9A66B]" /> مراحل المشروع
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {(selectedTracker.phases || buildDefaultPhases()).map((phase, idx) => {
                      const config = PHASES_CONFIG.find(p => p.key === phase.key) || PHASES_CONFIG[idx];
                      const statusCfg = STATUS_CONFIG[phase.status] || STATUS_CONFIG.pending;
                      const isEditing = editingPhase === phase.key;

                      return (
                        <motion.div key={phase.key} layout className="border rounded-xl overflow-hidden">
                          {/* Phase Header */}
                          <div className={`flex items-center gap-3 p-3 ${phase.status === "completed" ? "bg-green-50" : phase.status === "in_progress" ? "bg-blue-50" : phase.status === "delayed" ? "bg-red-50" : "bg-white"}`}>
                            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${COLOR_MAP[config?.color || "blue"]} flex items-center justify-center text-lg flex-shrink-0`}>
                              {config?.icon}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-sm text-slate-800">{phase.label}</span>
                                <span className={`text-xs px-2 py-0.5 rounded-full ${statusCfg.color}`}>{statusCfg.label}</span>
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                <Progress value={phase.progress || 0} className="h-1.5 flex-1" />
                                <span className="text-xs text-slate-500 flex-shrink-0">{phase.progress || 0}%</span>
                              </div>
                            </div>
                            {userRole === "engineer" && !isEditing && (
                              <Button size="sm" variant="ghost" onClick={() => startEditPhase(phase)} className="flex-shrink-0 text-[#C9A66B]">
                                <Edit3 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>

                          {/* Edit Form */}
                          <AnimatePresence>
                            {isEditing && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="border-t bg-white p-4 space-y-3"
                              >
                                <div className="grid grid-cols-2 gap-3">
                                  <div>
                                    <Label className="text-xs mb-1 block">الحالة</Label>
                                    <Select value={editForm.status} onValueChange={v => setEditForm(p => ({ ...p, status: v }))}>
                                      <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="pending">لم يبدأ</SelectItem>
                                        <SelectItem value="in_progress">جارٍ</SelectItem>
                                        <SelectItem value="completed">مكتمل</SelectItem>
                                        <SelectItem value="delayed">متأخر</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div>
                                    <Label className="text-xs mb-1 block">نسبة الإنجاز %</Label>
                                    <Input
                                      type="number" min="0" max="100"
                                      value={editForm.progress || 0}
                                      onChange={e => setEditForm(p => ({ ...p, progress: parseInt(e.target.value) || 0 }))}
                                      className="h-8 text-sm"
                                    />
                                  </div>
                                  <div>
                                    <Label className="text-xs mb-1 block">تاريخ البدء</Label>
                                    <Input type="date" value={editForm.start_date || ""} onChange={e => setEditForm(p => ({ ...p, start_date: e.target.value }))} className="h-8 text-sm" />
                                  </div>
                                  <div>
                                    <Label className="text-xs mb-1 block">تاريخ الانتهاء المتوقع</Label>
                                    <Input type="date" value={editForm.end_date || ""} onChange={e => setEditForm(p => ({ ...p, end_date: e.target.value }))} className="h-8 text-sm" />
                                  </div>
                                </div>
                                <div>
                                  <Label className="text-xs mb-1 block">ملاحظات</Label>
                                  <Textarea rows={2} value={editForm.notes || ""} onChange={e => setEditForm(p => ({ ...p, notes: e.target.value }))} className="text-sm" />
                                </div>
                                <div className="flex items-center gap-2">
                                  <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer border rounded-lg px-3 py-1.5 hover:bg-slate-50">
                                    <input type="file" className="hidden" onChange={handleFileUpload} accept="image/*,.pdf" />
                                    {uploadingFile ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
                                    رفع صورة/ملف
                                  </label>
                                  {(editForm.attachments || []).length > 0 && (
                                    <span className="text-xs text-green-600">{editForm.attachments.length} ملف مرفق</span>
                                  )}
                                  <div className="mr-auto flex gap-2">
                                    <Button size="sm" onClick={savePhase} disabled={isSaving} className="bg-[#C9A66B] text-white h-8 gap-1">
                                      {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} حفظ
                                    </Button>
                                    <Button size="sm" variant="ghost" onClick={() => setEditingPhase(null)} className="h-8">
                                      <X className="w-3.5 h-3.5" />
                                    </Button>
                                  </div>
                                </div>
                                {phase.notes && <p className="text-xs text-slate-500 bg-slate-50 p-2 rounded">📝 {phase.notes}</p>}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      );
                    })}
                  </CardContent>
                </Card>

                {/* Updates Log */}
                <Card className="border-0 shadow-md">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base text-[#4A3F35] flex items-center gap-2">
                      <Bell className="w-4 h-4 text-[#C9A66B]" /> سجل التحديثات
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {userRole === "engineer" && (
                      <div className="flex gap-2 mb-4">
                        <Input
                          placeholder="أضف تحديثاً للمشروع..."
                          value={logMessage}
                          onChange={e => setLogMessage(e.target.value)}
                          onKeyPress={e => e.key === "Enter" && addLogMessage()}
                        />
                        <Button onClick={addLogMessage} disabled={!logMessage.trim() || isSaving} className="bg-[#C9A66B] text-white flex-shrink-0">
                          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                        </Button>
                      </div>
                    )}

                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {(selectedTracker.updates_log || []).length === 0 ? (
                        <p className="text-slate-400 text-sm text-center py-4">لا توجد تحديثات بعد</p>
                      ) : (
                        [...(selectedTracker.updates_log || [])].reverse().map((log, i) => (
                          <div key={i} className="flex gap-3 p-3 bg-slate-50 rounded-lg">
                            <div className="w-2 h-2 rounded-full bg-[#C9A66B] mt-2 flex-shrink-0" />
                            <div className="flex-1">
                              <p className="text-sm text-slate-700">{log.message}</p>
                              <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                                <span>{log.by}</span>
                                <span>•</span>
                                <span>{new Date(log.date).toLocaleDateString("ar-SA", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        )}
      </div>

      {/* New Tracker Modal */}
      <Dialog open={showNewModal} onOpenChange={setShowNewModal}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-right text-[#4A3F35]">إضافة مشروع جديد للمتابعة</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-sm mb-1.5 block">اسم المشروع *</Label>
              <Input placeholder="مثال: فيلا العائلة - حي النرجس" value={newForm.project_title} onChange={e => setNewForm(p => ({ ...p, project_title: e.target.value }))} />
            </div>
            <div>
              <Label className="text-sm mb-1.5 block">بريد العميل *</Label>
              <Input type="email" placeholder="client@email.com" value={newForm.client_email} onChange={e => setNewForm(p => ({ ...p, client_email: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-sm mb-1.5 block">تاريخ البدء</Label>
                <Input type="date" value={newForm.start_date} onChange={e => setNewForm(p => ({ ...p, start_date: e.target.value }))} />
              </div>
              <div>
                <Label className="text-sm mb-1.5 block">تاريخ التسليم المتوقع</Label>
                <Input type="date" value={newForm.expected_end_date} onChange={e => setNewForm(p => ({ ...p, expected_end_date: e.target.value }))} />
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <Button onClick={handleCreateTracker} disabled={!newForm.project_title || !newForm.client_email || isSaving} className="flex-1 bg-gradient-to-r from-[#6B5D4F] to-[#C9A66B] text-white gap-2">
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} إنشاء المشروع
              </Button>
              <Button variant="outline" onClick={() => setShowNewModal(false)}>إلغاء</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}