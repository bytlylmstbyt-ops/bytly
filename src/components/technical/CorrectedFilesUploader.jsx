import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, Loader2, FileText, X, Paperclip } from "lucide-react";

export default function CorrectedFilesUploader({ correctedFiles, onChange, disabled }) {
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    e.target.value = "";
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      onChange([...(correctedFiles || []), file_url]);
    } catch (err) {
      console.error("Upload failed:", err);
      alert("فشل رفع الملف");
    } finally {
      setUploading(false);
    }
  };

  const removeFile = (index) => {
    const next = [...(correctedFiles || [])];
    next.splice(index, 1);
    onChange(next);
  };

  const getFileName = (url) => {
    try {
      const decoded = decodeURIComponent(url.split("/").pop() || url);
      return decoded.length > 40 ? decoded.slice(-40) : decoded;
    } catch {
      return "ملف مرفق";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Paperclip className="w-4.5 h-4.5 text-[#C9A66B]" />
          الملفات المصححة المرفقة
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs text-slate-500">
          أرفق المخططات المعدلة أو الوثائق المصححة لتسهيل مراجعتها من قبل المالك.
        </p>

        {disabled ? (
          <p className="text-xs text-slate-400 italic">لا يمكن تعديل الملفات بعد الاعتماد</p>
        ) : (
          <label className="flex flex-col items-center justify-center gap-2 p-5 border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:border-[#C9A66B] hover:bg-[#C9A66B]/5 transition-colors">
            {uploading ? (
              <Loader2 className="w-6 h-6 animate-spin text-[#C9A66B]" />
            ) : (
              <Upload className="w-6 h-6 text-slate-400" />
            )}
            <span className="text-sm text-slate-600 font-medium">
              {uploading ? "جاري الرفع..." : "اضغط لاختيار ملف مصحح"}
            </span>
            <input type="file" className="hidden" onChange={handleUpload} disabled={uploading} />
          </label>
        )}

        {(correctedFiles?.length > 0) && (
          <div className="space-y-2">
            {correctedFiles.map((url, i) => (
              <div key={i} className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                <FileText className="w-4 h-4 text-[#C9A66B] shrink-0" />
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 text-sm text-slate-700 hover:text-[#C9A66B] truncate"
                >
                  {getFileName(url)}
                </a>
                {!disabled && (
                  <button
                    onClick={() => removeFile(i)}
                    className="p-1 hover:bg-red-50 rounded text-red-500"
                    type="button"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}