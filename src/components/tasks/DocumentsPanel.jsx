import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  Upload, FileText, File, Image, FileSpreadsheet,
  Trash2, ExternalLink, Loader2, Plus, Download
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

const DOC_TYPES = {
  contract:      { label: "عقد",        color: "bg-purple-100 text-purple-700" },
  specification: { label: "مواصفات",   color: "bg-blue-100 text-blue-700" },
  design:        { label: "تصميم",      color: "bg-pink-100 text-pink-700" },
  report:        { label: "تقرير",      color: "bg-amber-100 text-amber-700" },
  invoice:       { label: "فاتورة",     color: "bg-green-100 text-green-700" },
  other:         { label: "أخرى",       color: "bg-slate-100 text-slate-600" },
};

function getFileIcon(fileType) {
  if (!fileType) return <File className="w-5 h-5 text-slate-400" />;
  if (fileType.includes("image")) return <Image className="w-5 h-5 text-blue-400" />;
  if (fileType.includes("pdf")) return <FileText className="w-5 h-5 text-red-400" />;
  if (fileType.includes("sheet") || fileType.includes("excel") || fileType.includes("csv"))
    return <FileSpreadsheet className="w-5 h-5 text-green-500" />;
  return <FileText className="w-5 h-5 text-slate-500" />;
}

function formatSize(bytes) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// Upload Dialog
function UploadDocDialog({ open, onClose, onUploaded, linkedTo, linkedId }) {
  const [name, setName] = useState("");
  const [docType, setDocType] = useState("other");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef();

  const reset = () => { setName(""); setDocType("other"); setDescription(""); setFile(null); };

  const handleFile = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    if (!name) setName(f.name.replace(/\.[^/.]+$/, ""));
  };

  const handleUpload = async () => {
    if (!file || !name) return;
    setUploading(true);
    try {
      const user = await base44.auth.me();
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      await base44.entities.Document.create({
        name,
        file_url,
        file_type: file.type,
        file_size: file.size,
        document_type: docType,
        description,
        linked_to: linkedTo,
        linked_id: linkedId,
        uploaded_by: user?.email,
      });
      toast.success("تم رفع المستند ✓");
      reset();
      onUploaded();
    } catch (e) {
      toast.error("فشل الرفع: " + e.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => { reset(); onClose(); }}>
      <DialogContent className="max-w-md" dir="rtl">
        <DialogHeader><DialogTitle>رفع مستند جديد</DialogTitle></DialogHeader>
        <div className="space-y-3 py-2">
          {/* File picker */}
          <div
            className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-colors"
            onClick={() => fileRef.current?.click()}
          >
            <input ref={fileRef} type="file" className="hidden" onChange={handleFile} />
            {file ? (
              <div className="flex items-center justify-center gap-2">
                {getFileIcon(file.type)}
                <span className="text-sm text-slate-700 font-medium">{file.name}</span>
                <span className="text-xs text-slate-400">({formatSize(file.size)})</span>
              </div>
            ) : (
              <>
                <Upload className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                <p className="text-sm text-slate-500">اضغط لاختيار ملف</p>
                <p className="text-xs text-slate-400 mt-1">PDF، صور، Word، Excel وغيرها</p>
              </>
            )}
          </div>

          <Input
            placeholder="اسم المستند *"
            value={name}
            onChange={e => setName(e.target.value)}
          />

          <Select value={docType} onValueChange={setDocType}>
            <SelectTrigger><SelectValue placeholder="نوع المستند" /></SelectTrigger>
            <SelectContent>
              {Object.entries(DOC_TYPES).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Input
            placeholder="وصف مختصر (اختياري)"
            value={description}
            onChange={e => setDescription(e.target.value)}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => { reset(); onClose(); }}>إلغاء</Button>
          <Button
            className="bg-blue-600 hover:bg-blue-700 text-white"
            onClick={handleUpload}
            disabled={uploading || !file || !name}
          >
            {uploading ? <Loader2 className="w-4 h-4 animate-spin ml-1" /> : <Upload className="w-4 h-4 ml-1" />}
            رفع المستند
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Main DocumentsPanel
export default function DocumentsPanel({ linkedTo, linkedId, title }) {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [filterType, setFilterType] = useState("all");

  useEffect(() => {
    if (linkedId) loadDocs();
  }, [linkedId]);

  const loadDocs = async () => {
    setLoading(true);
    try {
      const result = await base44.entities.Document.filter(
        { linked_to: linkedTo, linked_id: linkedId },
        '-created_date', 100
      );
      setDocs(result);
    } catch { setDocs([]); }
    finally { setLoading(false); }
  };

  const deleteDoc = async (id) => {
    if (!confirm("هل تريد حذف هذا المستند؟")) return;
    await base44.entities.Document.delete(id);
    setDocs(prev => prev.filter(d => d.id !== id));
    toast.success("تم الحذف");
  };

  const filtered = filterType === "all" ? docs : docs.filter(d => d.document_type === filterType);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-slate-700">
            المستندات {docs.length > 0 && <span className="text-slate-400">({docs.length})</span>}
          </h3>
          {docs.length > 0 && (
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="h-7 text-xs w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">الكل</SelectItem>
                {Object.entries(DOC_TYPES).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
        <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white h-8 text-xs" onClick={() => setUploadOpen(true)}>
          <Plus className="w-3.5 h-3.5 ml-1" />رفع مستند
        </Button>
      </div>

      {loading && (
        <div className="flex justify-center py-6">
          <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="text-center py-8 text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">
          <FileText className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm">لا توجد مستندات بعد</p>
          <Button variant="ghost" size="sm" className="mt-2 text-blue-500 text-xs" onClick={() => setUploadOpen(true)}>
            + ارفع أول مستند
          </Button>
        </div>
      )}

      <div className="space-y-2">
        {filtered.map(doc => {
          const typeInfo = DOC_TYPES[doc.document_type] || DOC_TYPES.other;
          return (
            <div key={doc.id} className="flex items-center gap-3 p-3 bg-white border rounded-lg hover:border-blue-200 hover:shadow-sm transition-all group">
              <div className="shrink-0">{getFileIcon(doc.file_type)}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-medium text-slate-800 truncate">{doc.name}</p>
                  <Badge className={`text-xs py-0 ${typeInfo.color}`}>{typeInfo.label}</Badge>
                </div>
                {doc.description && <p className="text-xs text-slate-500 truncate mt-0.5">{doc.description}</p>}
                <p className="text-xs text-slate-400 mt-0.5">
                  {formatSize(doc.file_size)}{doc.file_size ? " • " : ""}
                  {format(new Date(doc.created_date), 'd MMM yyyy', { locale: ar })}
                </p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
                  <Button variant="ghost" size="icon" className="w-8 h-8 hover:bg-blue-50" title="فتح">
                    <ExternalLink className="w-3.5 h-3.5 text-blue-500" />
                  </Button>
                </a>
                <a href={doc.file_url} download={doc.name}>
                  <Button variant="ghost" size="icon" className="w-8 h-8 hover:bg-slate-100" title="تحميل">
                    <Download className="w-3.5 h-3.5 text-slate-500" />
                  </Button>
                </a>
                <Button
                  variant="ghost" size="icon"
                  className="w-8 h-8 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all"
                  onClick={() => deleteDoc(doc.id)}
                  title="حذف"
                >
                  <Trash2 className="w-3.5 h-3.5 text-red-400" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      <UploadDocDialog
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onUploaded={() => { setUploadOpen(false); loadDocs(); }}
        linkedTo={linkedTo}
        linkedId={linkedId}
      />
    </div>
  );
}