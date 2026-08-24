import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  FileText, Upload, Trash2, Folder, 
  File, Image, FileSpreadsheet, Search, Loader2,
  Eye
} from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

export default function DocumentManager({ project, user }) {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [showUploadForm, setShowUploadForm] = useState(false);

  const categories = [
    { id: "all", label: "الكل", icon: Folder },
    { id: "contract", label: "عقود", icon: FileText },
    { id: "design", label: "تصاميم", icon: Image },
    { id: "invoice", label: "فواتير", icon: FileSpreadsheet },
    { id: "other", label: "أخرى", icon: File }
  ];

  useEffect(() => {
    loadDocuments();
  }, [project.id]);

  const loadDocuments = async () => {
    try {
      // Load documents from project attachments and other sources
      const projectData = await base44.entities.Project.filter({ id: project.id });
      if (projectData[0]?.attachments) {
        const docs = projectData[0].attachments.map((url, index) => ({
          id: `doc-${index}`,
          name: url.split('/').pop(),
          url: url,
          category: "other",
          uploaded_at: project.created_date,
          uploaded_by: project.created_by,
          size: "غير محدد"
        }));
        setDocuments(docs);
      }
    } catch (error) {
      console.error("Error loading documents:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploading(true);
    try {
      const uploadedUrls = [];
      for (const file of files) {
        const { data } = await base44.integrations.Core.UploadFile({ file });
        uploadedUrls.push(data.file_url);
      }

      // Update project attachments
      const currentAttachments = project.attachments || [];
      await base44.entities.Project.update(project.id, {
        attachments: [...currentAttachments, ...uploadedUrls]
      });

      await loadDocuments();
      setShowUploadForm(false);
    } catch (error) {
      console.error("Error uploading files:", error);
      alert("حدث خطأ في رفع الملفات");
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDocument = async (docUrl) => {
    if (!confirm("هل أنت متأكد من حذف هذا المستند؟")) return;

    try {
      const currentAttachments = project.attachments || [];
      const updatedAttachments = currentAttachments.filter(url => url !== docUrl);
      
      await base44.entities.Project.update(project.id, {
        attachments: updatedAttachments
      });

      await loadDocuments();
    } catch (error) {
      console.error("Error deleting document:", error);
      alert("حدث خطأ في حذف المستند");
    }
  };

  const getFileIcon = (filename) => {
    const ext = filename.split('.').pop().toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return Image;
    if (['pdf'].includes(ext)) return FileText;
    if (['xlsx', 'xls', 'csv'].includes(ext)) return FileSpreadsheet;
    return File;
  };

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || doc.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#6B5D4F] mx-auto" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              إدارة المستندات
            </CardTitle>
            <Button onClick={() => setShowUploadForm(!showUploadForm)}>
              <Upload className="w-4 h-4 ml-2" />
              رفع ملفات
            </Button>
          </div>
        </CardHeader>

        {showUploadForm && (
          <CardContent className="border-t">
            <div className="space-y-4">
              <div>
                <Label>اختر الملفات</Label>
                <Input
                  type="file"
                  multiple
                  onChange={handleFileUpload}
                  disabled={uploading}
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.xlsx,.xls"
                />
                <p className="text-sm text-slate-500 mt-1">
                  الملفات المدعومة: PDF, Word, Excel, صور
                </p>
              </div>
              {uploading && (
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  جاري رفع الملفات...
                </div>
              )}
            </div>
          </CardContent>
        )}
      </Card>

      {/* Search and Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="بحث في المستندات..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {categories.map((cat) => {
                const Icon = cat.icon;
                return (
                  <Button
                    key={cat.id}
                    variant={selectedCategory === cat.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategory(cat.id)}
                  >
                    <Icon className="w-4 h-4 ml-1" />
                    {cat.label}
                  </Button>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Documents Grid */}
      <Card>
        <CardContent className="p-6">
          {filteredDocuments.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <Folder className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>لا توجد مستندات</p>
              <p className="text-sm">قم برفع أول مستند للبدء</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredDocuments.map((doc) => {
                const Icon = getFileIcon(doc.name);
                return (
                  <div
                    key={doc.id}
                    className="border rounded-lg p-4 hover:shadow-md transition-all group"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Icon className="w-5 h-5 text-slate-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm truncate">{doc.name}</h4>
                          <p className="text-xs text-slate-500">
                            {doc.size}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="text-xs text-slate-500 mb-3">
                      <p>رفع بواسطة: {doc.uploaded_by}</p>
                      <p>{doc.uploaded_at && format(new Date(doc.uploaded_at), "d MMM yyyy", { locale: ar })}</p>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => window.open(doc.url, '_blank')}
                      >
                        <Eye className="w-3 h-3 ml-1" />
                        عرض
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteDocument(doc.url)}
                      >
                        <Trash2 className="w-3 h-3 text-red-500" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-[#6B5D4F]">{documents.length}</p>
              <p className="text-sm text-slate-600">إجمالي المستندات</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">
                {documents.filter(d => d.category === "design").length}
              </p>
              <p className="text-sm text-slate-600">التصاميم</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                {documents.filter(d => d.category === "contract").length}
              </p>
              <p className="text-sm text-slate-600">العقود</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-amber-600">
                {documents.filter(d => d.category === "invoice").length}
              </p>
              <p className="text-sm text-slate-600">الفواتير</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}