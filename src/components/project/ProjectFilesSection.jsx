import React, { useState, useRef, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import {
  Upload, Download, FileText, Loader2, X, Paperclip, Eye, Files,
  Folder, Image as ImageIcon, FileBox, PencilRuler
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle
} from "@/components/ui/dialog";
import { notifyWorkspaceUpdate } from "./notifyWorkspaceUpdate";

/**
 * تصنيف الملف تلقائياً حسب امتداده.
 * @returns {{type: string, folderId: string}}
 */
function classifyFile(url) {
  const ext = (url.split(".").pop() || "").toLowerCase();
  // مخططات أوتوكاد وهندسية
  if (["dwg", "dxf", "dwf", "rvt", "rfa", "rte", "nwd", "nwc", "skp", "3dm"].includes(ext)) {
    return { type: "autocad", folderId: "autocad" };
  }
  // صور
  if (["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp", "tiff", "tif"].includes(ext)) {
    return { type: "image", folderId: "image" };
  }
  // مستندات
  if (["pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "txt", "csv", "rtf", "odt"].includes(ext)) {
    return { type: "document", folderId: "document" };
  }
  return { type: "other", folderId: "other" };
}

const FOLDERS = [
  { id: "all", label: "كل الملفات", icon: Folder, color: "text-[#C9A66B]", bg: "bg-[#C9A66B]/10" },
  { id: "autocad", label: "مخططات أوتوكاد", icon: PencilRuler, color: "text-red-600", bg: "bg-red-50" },
  { id: "image", label: "صور", icon: ImageIcon, color: "text-green-600", bg: "bg-green-50" },
  { id: "document", label: "مستندات", icon: FileText, color: "text-blue-600", bg: "bg-blue-50" },
  { id: "other", label: "أخرى", icon: FileBox, color: "text-slate-500", bg: "bg-slate-100" },
];

function getFileIcon(folderId) {
  const folder = FOLDERS.find(f => f.id === folderId);
  return folder ? folder.icon : FileBox;
}

function getFileName(url) {
  const decoded = decodeURIComponent(url.split("/").pop() || "ملف");
  return decoded;
}

export default function ProjectFilesSection({ project, user, userEngineer, assignedEngineer, onUpdated }) {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [activeFolder, setActiveFolder] = useState("all");
  const fileInputRef = useRef(null);

  const canUpload = user && (
    project.created_by === user.email ||
    (userEngineer && project.assigned_engineer_id === userEngineer.id) ||
    user.role === "admin"
  );

  const attachments = project.attachments || [];

  // تصنيف كل ملف مرة واحدة
  const classifiedFiles = useMemo(() => {
    return attachments.map((url, index) => {
      const { folderId } = classifyFile(url);
      return { url, index, folderId, name: getFileName(url) };
    });
  }, [attachments]);

  // عدّ الملفات في كل مجلد
  const folderCounts = useMemo(() => {
    const counts = { all: classifiedFiles.length, autocad: 0, image: 0, document: 0, other: 0 };
    classifiedFiles.forEach(f => { counts[f.folderId] = (counts[f.folderId] || 0) + 1; });
    return counts;
  }, [classifiedFiles]);

  // فلترة الملفات حسب المجلد النشط
  const filteredFiles = useMemo(() => {
    if (activeFolder === "all") return classifiedFiles;
    return classifiedFiles.filter(f => f.folderId === activeFolder);
  }, [classifiedFiles, activeFolder]);

  const handleUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    setIsUploading(true);
    try {
      const uploadedUrls = [];
      for (const file of files) {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        uploadedUrls.push(file_url);
      }
      await base44.entities.Project.update(project.id, {
        attachments: [...attachments, ...uploadedUrls],
      });

      // تصنيف الملفات المرفوعة حديثاً للإشعار
      const newCategories = uploadedUrls.map(u => {
        const c = classifyFile(u);
        return FOLDERS.find(f => f.id === c.folderId)?.label || "أخرى";
      });
      const categorySummary = [...new Set(newCategories)].join("، ");

      const fileCount = uploadedUrls.length;
      await notifyWorkspaceUpdate({
        project,
        assignedEngineer,
        user,
        activityType: "file_uploaded",
        summary: `رفع ${user?.full_name || user?.email || "مستخدم"} ${fileCount} ملف جديد (${categorySummary})`,
        notifyTitle: "📁 ملفات جديدة في مساحة العمل",
        notifyMessage: `قام ${user?.full_name || "أحد المشاركين"} برفع ${fileCount} ملف جديد (${categorySummary}) في مشروع "${project.title}". تم تصنيفها تلقائياً في المجلدات المناسبة.`,
        entityType: "file",
        entityTitle: `${fileCount} ملف جديد`,
        priority: "medium",
      });

      onUpdated?.();
    } catch (err) {
      console.error("Upload failed:", err);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemove = async (index) => {
    const newAttachments = attachments.filter((_, i) => i !== index);
    await base44.entities.Project.update(project.id, { attachments: newAttachments });

    await notifyWorkspaceUpdate({
      project,
      assignedEngineer,
      user,
      activityType: "file_deleted",
      summary: `حذف ${user?.full_name || user?.email || "مستخدم"} ملفاً من مساحة العمل`,
      notifyTitle: "🗑️ تم حذف ملف من مساحة العمل",
      notifyMessage: `قام ${user?.full_name || "أحد المشاركين"} بحذف ملف من مشروع "${project.title}".`,
      entityType: "file",
      priority: "low",
    });

    onUpdated?.();
  };

  const isImage = (url) => url.match(/\.(jpg|jpeg|png|gif|webp)$/i);

  return (
    <Card className="border-0 shadow-lg" id="project-files">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Files className="w-5 h-5 text-[#C9A66B]" />
            ملفات المشروع
          </span>
          <Badge variant="secondary">{attachments.length} ملف</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {canUpload && (
          <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center hover:border-[#C9A66B] transition-colors">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleUpload}
              className="hidden"
              id="project-file-upload"
              accept="image/*,.pdf,.dwg,.dxf,.docx,.xlsx,.pptx"
            />
            <label htmlFor="project-file-upload" className="cursor-pointer">
              {isUploading ? (
                <Loader2 className="w-8 h-8 text-[#C9A66B] mx-auto animate-spin" />
              ) : (
                <>
                  <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-sm text-slate-600 font-medium">رفع ملف جديد</p>
                  <p className="text-xs text-slate-400 mt-1">سيتم تصنيفه تلقائياً: مخططات أوتوكاد، صور، مستندات</p>
                </>
              )}
            </label>
          </div>
        )}

        {/* ── نظام المجلدات ── */}
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {FOLDERS.map((folder) => {
              const Icon = folder.icon;
              const isActive = activeFolder === folder.id;
              const count = folderCounts[folder.id] || 0;
              if (count === 0 && folder.id !== "all") return null;
              return (
                <button
                  key={folder.id}
                  onClick={() => setActiveFolder(folder.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all border ${
                    isActive
                      ? "bg-gradient-to-r from-[#6B5D4F] to-[#C9A66B] text-white border-transparent shadow-md"
                      : "bg-white text-slate-600 border-slate-200 hover:border-[#C9A66B] hover:bg-slate-50"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-white" : folder.color}`} />
                  <span>{folder.label}</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                    isActive ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* ── قائمة الملفات المصنّفة ── */}
        {filteredFiles.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {filteredFiles.map(({ url, index, folderId, name }) => {
              const FileIcon = getFileIcon(folderId);
              const folder = FOLDERS.find(f => f.id === folderId);
              return (
                <div key={`${index}-${url}`} className="group relative aspect-square rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
                  {isImage(url) ? (
                    <img src={url} alt={name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-1">
                      <FileIcon className={`w-10 h-10 ${folder?.color || "text-slate-400"}`} />
                      <span className="text-xs text-slate-400 px-2 truncate w-full text-center" title={name}>
                        {name.slice(0, 14)}
                      </span>
                    </div>
                  )}
                  {/* شارة نوع الملف */}
                  <div className={`absolute top-1 right-1 ${folder?.bg} ${folder?.color} text-[10px] font-medium px-1.5 py-0.5 rounded-full flex items-center gap-0.5`}>
                    <FileIcon className="w-2.5 h-2.5" />
                  </div>
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    {isImage(url) && (
                      <button
                        onClick={() => setPreviewUrl(url)}
                        className="w-9 h-9 rounded-full bg-white/90 flex items-center justify-center hover:bg-white"
                      >
                        <Eye className="w-4 h-4 text-slate-700" />
                      </button>
                    )}
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-9 h-9 rounded-full bg-white/90 flex items-center justify-center hover:bg-white"
                    >
                      <Download className="w-4 h-4 text-slate-700" />
                    </a>
                    {canUpload && (
                      <button
                        onClick={() => handleRemove(index)}
                        className="w-9 h-9 rounded-full bg-red-500 flex items-center justify-center hover:bg-red-600"
                      >
                        <X className="w-4 h-4 text-white" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : attachments.length > 0 ? (
          <div className="text-center py-8">
            <FileBox className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 text-sm">لا توجد ملفات في هذا المجلد</p>
            <Button variant="ghost" size="sm" onClick={() => setActiveFolder("all")} className="mt-2 text-[#C9A66B]">
              عرض كل الملفات
            </Button>
          </div>
        ) : (
          <div className="text-center py-8">
            <Paperclip className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 text-sm">لا توجد ملفات بعد</p>
            {canUpload && <p className="text-slate-400 text-xs mt-1">ارفع المخططات والمستندات لتبدأ</p>}
          </div>
        )}

        {/* Image Preview Modal */}
        <Dialog open={!!previewUrl} onOpenChange={() => setPreviewUrl(null)}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>معاينة الملف</DialogTitle>
            </DialogHeader>
            {previewUrl && isImage(previewUrl) && (
              <img src={previewUrl} alt="" className="w-full rounded-lg" />
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}