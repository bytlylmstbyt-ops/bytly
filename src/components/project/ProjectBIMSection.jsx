import React, { useState, useEffect, useMemo, useRef } from "react";
import { base44 } from "@/api/base44Client";
import {
  Card, CardContent, CardHeader, CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import {
  Loader2, Upload, Download, Eye, X, Box, FileText, Image as ImageIcon,
  PencilRuler, FileBox, Trash2, Building2, Layers, Plus, File
} from "lucide-react";
import { notifyWorkspaceUpdate } from "./notifyWorkspaceUpdate";

/* ── تصنيف الملف حسب الامتداد ── */
function classifyUploadedFile(fileName) {
  const ext = (fileName.split(".").pop() || "").toLowerCase();
  if (["rvt", "rfa", "rte", "nwd", "nwc", "ifc", "skp", "3dm"].includes(ext))
    return { file_type: "bim_model", icon: Box, color: "text-purple-600", bg: "bg-purple-50", label: "نموذج BIM" };
  if (["dwg", "dxf", "dwf", "plt"].includes(ext))
    return { file_type: "drawing", icon: PencilRuler, color: "text-red-600", bg: "bg-red-50", label: "مخطط هندسي" };
  if (["pdf"].includes(ext))
    return { file_type: "pdf", icon: FileText, color: "text-blue-600", bg: "bg-blue-50", label: "PDF" };
  if (["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp"].includes(ext))
    return { file_type: "image", icon: ImageIcon, color: "text-green-600", bg: "bg-green-50", label: "صورة" };
  if (["doc", "docx", "xls", "xlsx", "ppt", "pptx", "txt", "csv"].includes(ext))
    return { file_type: "document", icon: FileText, color: "text-amber-600", bg: "bg-amber-50", label: "مستند" };
  return { file_type: "other", icon: FileBox, color: "text-slate-500", bg: "bg-slate-100", label: "أخرى" };
}

function getFileMeta(item) {
  if (item.file_url) {
    return classifyUploadedFile(item.file_url);
  }
  // BIM360 model
  return { file_type: "bim_model", icon: Box, color: "text-purple-600", bg: "bg-purple-50", label: "نموذج BIM360" };
}

function formatFileSize(bytes) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isPreviewableImage(url) {
  return url && url.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i);
}
function isPreviewablePdf(url) {
  return url && url.match(/\.pdf$/i);
}

export default function ProjectBIMSection({ project, user, userEngineer, assignedEngineer, onUpdated }) {
  const [bimFiles, setBimFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [previewItem, setPreviewItem] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    floor_level: "",
    building_type: "",
  });
  const [pendingFile, setPendingFile] = useState(null);
  const fileInputRef = useRef(null);

  const canUpload = user && (
    project.created_by === user.email ||
    (userEngineer && project.assigned_engineer_id === userEngineer.id) ||
    user.role === "admin"
  );

  useEffect(() => {
    loadBimFiles();
  }, [project.id]);

  const loadBimFiles = async () => {
    setLoading(true);
    try {
      const files = await base44.entities.BIMModel.filter({ linked_project_id: project.id }, "-created_date", 100);
      setBimFiles(files);
    } catch (err) {
      console.error("Error loading BIM files:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPendingFile(file);
    // Auto-fill name from filename if empty
    if (!formData.name) {
      const baseName = file.name.replace(/\.[^/.]+$/, "");
      setFormData(prev => ({ ...prev, name: baseName }));
    }
  };

  const handleUpload = async () => {
    if (!pendingFile || !formData.name) return;
    setUploading(true);
    try {
      // 1) Upload the file
      const { file_url } = await base44.integrations.Core.UploadFile({ file: pendingFile });
      const classification = classifyUploadedFile(pendingFile.name);

      // 2) Create BIMModel record
      await base44.entities.BIMModel.create({
        name: formData.name,
        description: formData.description || "",
        floor_level: formData.floor_level || "",
        building_type: formData.building_type || "",
        linked_project_id: project.id,
        file_url,
        file_type: classification.file_type,
        file_size: pendingFile.size,
        source: "direct_upload",
        owner_engineer_id: userEngineer?.id || "",
        client_email: project.created_by || "",
      });

      // 3) Notify workspace
      await notifyWorkspaceUpdate({
        project,
        assignedEngineer,
        user,
        activityType: "file_uploaded",
        summary: `رفع ${user?.full_name || user?.email || "مستخدم"} ملف ${classification.label}: ${formData.name}`,
        notifyTitle: "📐 ملف BIM/مخطط جديد",
        notifyMessage: `قام ${user?.full_name || "المهندس"} برفع ${classification.label} "${formData.name}" في مشروع "${project.title}". يمكنك معاينته الآن.`,
        entityType: "file",
        entityTitle: formData.name,
        priority: "medium",
      });

      // Reset
      setFormData({ name: "", description: "", floor_level: "", building_type: "" });
      setPendingFile(null);
      setShowUploadForm(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
      await loadBimFiles();
      onUpdated?.();
    } catch (err) {
      console.error("Upload failed:", err);
      alert("حدث خطأ أثناء رفع الملف");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`هل أنت متأكد من حذف "${item.name}"؟`)) return;
    try {
      await base44.entities.BIMModel.delete(item.id);
      await notifyWorkspaceUpdate({
        project,
        assignedEngineer,
        user,
        activityType: "file_deleted",
        summary: `حذف ${user?.full_name || user?.email || "مستخدم"} ملف: ${item.name}`,
        notifyTitle: "🗑️ تم حذف ملف BIM/مخطط",
        notifyMessage: `تم حذف الملف "${item.name}" من مشروع "${project.title}".`,
        entityType: "file",
        priority: "low",
      });
      await loadBimFiles();
      onUpdated?.();
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  // Group files by type
  const groupedFiles = useMemo(() => {
    const groups = { bim_model: [], drawing: [], pdf: [], image: [], document: [], other: [] };
    bimFiles.forEach(f => {
      const meta = getFileMeta(f);
      groups[meta.file_type]?.push(f);
    });
    return groups;
  }, [bimFiles]);

  const typeLabels = {
    bim_model: { label: "نماذج BIM", icon: Box, color: "text-purple-600", bg: "bg-purple-50" },
    drawing: { label: "المخططات الهندسية", icon: PencilRuler, color: "text-red-600", bg: "bg-red-50" },
    pdf: { label: "ملفات PDF", icon: FileText, color: "text-blue-600", bg: "bg-blue-50" },
    image: { label: "الصور", icon: ImageIcon, color: "text-green-600", bg: "bg-green-50" },
    document: { label: "المستندات", icon: File, color: "text-amber-600", bg: "bg-amber-50" },
    other: { label: "أخرى", icon: FileBox, color: "text-slate-500", bg: "bg-slate-100" },
  };

  const hasFiles = bimFiles.length > 0;

  return (
    <Card className="border-0 shadow-lg" id="project-bim">
      <CardHeader>
        <CardTitle className="flex items-center justify-between flex-wrap gap-2">
          <span className="flex items-center gap-2">
            <Box className="w-5 h-5 text-[#C9A66B]" />
            ملفات BIM والمخططات الهندسية
          </span>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{bimFiles.length} ملف</Badge>
            {canUpload && (
              <Button
                size="sm"
                onClick={() => setShowUploadForm(true)}
                className="bg-gradient-to-r from-[#6B5D4F] to-[#C9A66B] text-white gap-1.5"
              >
                <Plus className="w-4 h-4" /> رفع ملف
              </Button>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Info banner for client */}
        {!canUpload && hasFiles && (
          <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 flex items-start gap-2">
            <Eye className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
            <p className="text-sm text-blue-800">
              يمكنك معاينة الملفات التي رفعها المهندس. اضغط على أي ملف لعرضه أو تحميله.
            </p>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-[#C9A66B] animate-spin" />
          </div>
        ) : !hasFiles ? (
          <div className="text-center py-12">
            <Box className="w-14 h-14 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">لا توجد ملفات BIM أو مخططات بعد</p>
            {canUpload ? (
              <p className="text-slate-400 text-sm mt-1">ارفع نماذج BIM أو المخططات الهندسية ليتمكن العميل من معاينتها</p>
            ) : (
              <p className="text-slate-400 text-sm mt-1">سيظهر هنا ما يرفعه المهندس من ملفات</p>
            )}
          </div>
        ) : (
          /* Grouped file display */
          Object.entries(groupedFiles).map(([type, files]) => {
            if (files.length === 0) return null;
            const TypeInfo = typeLabels[type];
            const Icon = TypeInfo.icon;
            return (
              <div key={type} className="space-y-3">
                {/* Group header */}
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-lg ${TypeInfo.bg} flex items-center justify-center`}>
                    <Icon className={`w-4 h-4 ${TypeInfo.color}`} />
                  </div>
                  <h4 className="text-sm font-semibold text-slate-700">{TypeInfo.label}</h4>
                  <Badge variant="outline" className="text-xs">{files.length}</Badge>
                </div>

                {/* File cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {files.map((item) => {
                    const meta = getFileMeta(item);
                    const FileIcon = meta.icon;
                    const url = item.file_url;
                    const canPreview = url && (isPreviewableImage(url) || isPreviewablePdf(url));
                    return (
                      <div
                        key={item.id}
                        className="group relative rounded-xl border border-slate-200 bg-white overflow-hidden hover:shadow-md transition-shadow"
                      >
                        {/* Thumbnail / Preview area */}
                        <div
                          className="aspect-video bg-slate-50 flex items-center justify-center cursor-pointer relative"
                          onClick={() => canPreview && setPreviewItem(item)}
                        >
                          {url && isPreviewableImage(url) ? (
                            <img src={url} alt={item.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="flex flex-col items-center gap-2">
                              <FileIcon className={`w-12 h-12 ${meta.color}`} />
                              <span className="text-xs text-slate-400">{meta.label}</span>
                            </div>
                          )}
                          {/* Type badge */}
                          <div className={`absolute top-2 right-2 ${meta.bg} ${meta.color} text-[10px] font-medium px-2 py-0.5 rounded-full flex items-center gap-1`}>
                            <FileIcon className="w-2.5 h-2.5" />
                            {meta.label}
                          </div>
                          {/* Hover overlay */}
                          {canPreview && (
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center">
                                <Eye className="w-5 h-5 text-slate-700" />
                              </div>
                            </div>
                          )}
                        </div>

                        {/* File info */}
                        <div className="p-3 space-y-1.5">
                          <div className="flex items-start justify-between gap-2">
                            <h5 className="text-sm font-semibold text-slate-800 truncate" title={item.name}>
                              {item.name}
                            </h5>
                            {canUpload && (
                              <button
                                onClick={() => handleDelete(item)}
                                className="text-slate-300 hover:text-red-500 transition-colors shrink-0"
                                title="حذف"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                          {item.description && (
                            <p className="text-xs text-slate-500 line-clamp-2">{item.description}</p>
                          )}
                          <div className="flex items-center gap-2 flex-wrap text-xs text-slate-400">
                            {item.floor_level && (
                              <span className="flex items-center gap-1">
                                <Layers className="w-3 h-3" />
                                {item.floor_level}
                              </span>
                            )}
                            {item.building_type && (
                              <span className="flex items-center gap-1">
                                <Building2 className="w-3 h-3" />
                                {item.building_type}
                              </span>
                            )}
                            {item.file_size > 0 && (
                              <span>{formatFileSize(item.file_size)}</span>
                            )}
                          </div>
                          {/* Actions */}
                          <div className="flex items-center gap-2 pt-1.5">
                            {canPreview && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs gap-1 flex-1"
                                onClick={() => setPreviewItem(item)}
                              >
                                <Eye className="w-3.5 h-3.5" /> معاينة
                              </Button>
                            )}
                            {url && (
                              <a href={url} target="_blank" rel="noopener noreferrer" className="flex-1">
                                <Button size="sm" variant="outline" className="h-7 text-xs gap-1 w-full">
                                  <Download className="w-3.5 h-3.5" /> تحميل
                                </Button>
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}

        {/* Upload Dialog */}
        <Dialog open={showUploadForm} onOpenChange={setShowUploadForm}>
          <DialogContent className="max-w-lg" dir="rtl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5 text-[#C9A66B]" />
                رفع ملف BIM أو مخطط هندسي
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              {/* File picker */}
              <div className="space-y-2">
                <Label>الملف *</Label>
                <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center hover:border-[#C9A66B] transition-colors">
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="bim-file-upload"
                    accept=".rvt,.rfa,.rte,.nwd,.nwc,.ifc,.skp,.3dm,.dwg,.dxf,.dwf,.plt,.pdf,.jpg,.jpeg,.png,.gif,.webp,.svg,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
                  />
                  <label htmlFor="bim-file-upload" className="cursor-pointer">
                    {pendingFile ? (
                      <div className="flex items-center justify-center gap-2 text-sm text-green-600">
                        <FileBox className="w-5 h-5" />
                        <span className="font-medium">{pendingFile.name}</span>
                        <span className="text-slate-400">({formatFileSize(pendingFile.size)})</span>
                      </div>
                    ) : (
                      <>
                        <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                        <p className="text-sm text-slate-600 font-medium">اختر ملفاً للرفع</p>
                        <p className="text-xs text-slate-400 mt-1">يدعم: RVT, IFC, DWG, DXF, PDF, صور، مستندات</p>
                      </>
                    )}
                  </label>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bim-name">اسم الملف *</Label>
                <Input
                  id="bim-name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="مثال: مخطط الطابق الأرضي"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="bim-floor">الطابق / المستوى</Label>
                  <Input
                    id="bim-floor"
                    value={formData.floor_level}
                    onChange={(e) => setFormData(prev => ({ ...prev, floor_level: e.target.value }))}
                    placeholder="مثال: الدور الأرضي"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bim-building">نوع المبنى</Label>
                  <Input
                    id="bim-building"
                    value={formData.building_type}
                    onChange={(e) => setFormData(prev => ({ ...prev, building_type: e.target.value }))}
                    placeholder="مثال: سكني"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bim-desc">وصف الملف</Label>
                <Textarea
                  id="bim-desc"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="وصف موجز لمحتوى الملف..."
                  rows={3}
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <Button variant="outline" onClick={() => setShowUploadForm(false)} disabled={uploading}>
                  إلغاء
                </Button>
                <Button
                  onClick={handleUpload}
                  disabled={uploading || !pendingFile || !formData.name}
                  className="bg-gradient-to-r from-[#6B5D4F] to-[#C9A66B] text-white gap-2"
                >
                  {uploading ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> جاري الرفع...</>
                  ) : (
                    <><Upload className="w-4 h-4" /> رفع الملف</>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Quick Preview Modal */}
        <Dialog open={!!previewItem} onOpenChange={() => setPreviewItem(null)}>
          <DialogContent className="max-w-4xl" dir="rtl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 pr-8">
                {previewItem && (() => {
                  const meta = getFileMeta(previewItem);
                  const Icon = meta.icon;
                  return <><Icon className={`w-5 h-5 ${meta.color}`} /> {previewItem.name}</>;
                })()}
              </DialogTitle>
            </DialogHeader>
            {previewItem && (
              <div className="space-y-3">
                {previewItem.file_url && isPreviewableImage(previewItem.file_url) && (
                  <img src={previewItem.file_url} alt={previewItem.name} className="w-full rounded-lg" />
                )}
                {previewItem.file_url && isPreviewablePdf(previewItem.file_url) && (
                  <iframe
                    src={previewItem.file_url}
                    title={previewItem.name}
                    className="w-full h-[70vh] rounded-lg border border-slate-200"
                  />
                )}
                {previewItem.description && (
                  <p className="text-sm text-slate-600">{previewItem.description}</p>
                )}
                <div className="flex items-center gap-4 flex-wrap text-xs text-slate-500 pt-2 border-t border-slate-100">
                  {previewItem.floor_level && (
                    <span className="flex items-center gap-1"><Layers className="w-3.5 h-3.5" /> {previewItem.floor_level}</span>
                  )}
                  {previewItem.building_type && (
                    <span className="flex items-center gap-1"><Building2 className="w-3.5 h-3.5" /> {previewItem.building_type}</span>
                  )}
                  {previewItem.file_size > 0 && (
                    <span>{formatFileSize(previewItem.file_size)}</span>
                  )}
                </div>
                {previewItem.file_url && (
                  <a href={previewItem.file_url} target="_blank" rel="noopener noreferrer">
                    <Button className="w-full bg-gradient-to-r from-[#6B5D4F] to-[#C9A66B] text-white gap-2">
                      <Download className="w-4 h-4" /> تحميل الملف
                    </Button>
                  </a>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}