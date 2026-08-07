import React, { useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import {
  Upload, Download, FileText, Loader2, X, Paperclip, Eye, Files
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle
} from "@/components/ui/dialog";
import { notifyWorkspaceUpdate } from "./notifyWorkspaceUpdate";

export default function ProjectFilesSection({ project, user, userEngineer, assignedEngineer, onUpdated }) {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const fileInputRef = useRef(null);

  const canUpload = user && (
    project.created_by === user.email ||
    (userEngineer && project.assigned_engineer_id === userEngineer.id) ||
    user.role === "admin"
  );

  const attachments = project.attachments || [];

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

      // إشعار لحظي للمهندس والعميل برفع ملفات جديدة
      const fileCount = uploadedUrls.length;
      await notifyWorkspaceUpdate({
        project,
        assignedEngineer,
        user,
        activityType: "file_uploaded",
        summary: `رفع ${user?.full_name || user?.email || "مستخدم"} ${fileCount} ملف جديد في مساحة العمل`,
        notifyTitle: "📁 ملفات جديدة في مساحة العمل",
        notifyMessage: `قام ${user?.full_name || "أحد المشاركين"} برفع ${fileCount} ملف جديد في مشروع "${project.title}". افتح مساحة العمل للاطلاع عليها.`,
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

    // إشعار لحظي بحذف ملف
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
              accept="image/*,.pdf,.dwg,.docx,.xlsx"
            />
            <label htmlFor="project-file-upload" className="cursor-pointer">
              {isUploading ? (
                <Loader2 className="w-8 h-8 text-[#C9A66B] mx-auto animate-spin" />
              ) : (
                <>
                  <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-sm text-slate-600 font-medium">رفع ملف جديد</p>
                  <p className="text-xs text-slate-400 mt-1">صور، PDF، مخططات، مستندات</p>
                </>
              )}
            </label>
          </div>
        )}

        {attachments.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {attachments.map((url, index) => (
              <div key={index} className="group relative aspect-square rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
                {isImage(url) ? (
                  <img src={url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-1">
                    <FileText className="w-10 h-10 text-slate-400" />
                    <span className="text-xs text-slate-400 px-2 truncate w-full text-center">
                      {url.split("/").pop()?.slice(0, 12)}
                    </span>
                  </div>
                )}
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
            ))}
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