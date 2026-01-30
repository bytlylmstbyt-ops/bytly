import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { FileUp, Trash2, Download, CheckCircle, Loader2 } from "lucide-react";

export default function LegalTemplateUploader({ consultantId, onTemplateUpload }) {
  const [templates, setTemplates] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [templateData, setTemplateData] = useState({
    name: "",
    description: ""
  });

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.includes('pdf')) {
      alert("يجب أن يكون الملف بصيغة PDF");
      return;
    }

    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      
      const newTemplate = {
        template_id: `template_${Date.now()}`,
        name: templateData.name || file.name,
        file_url: file_url,
        upload_date: new Date().toISOString(),
        description: templateData.description
      };

      setTemplates([...templates, newTemplate]);
      setTemplateData({ name: "", description: "" });
      onTemplateUpload?.(newTemplate);

      alert("تم رفع القالب بنجاح");
    } catch (error) {
      console.error("Error uploading template:", error);
      alert("حدث خطأ أثناء رفع الملف");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = (templateId) => {
    setTemplates(templates.filter(t => t.template_id !== templateId));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileUp className="w-5 h-5 text-[#d4a574]" />
            رفع قوالب العقود القانونية
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-900">
              <span className="font-bold">ملاحظة:</span> يمكنك رفع مسودات وقوالب العقود والاتفاقيات المعتمدة. 
              سيتم مراجعتها من قبل إدارة المنصة قبل الموافقة عليها.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="template_name">اسم القالب *</Label>
              <Input
                id="template_name"
                placeholder="مثال: عقد تصميم داخلي، اتفاقية السرية"
                value={templateData.name}
                onChange={(e) => setTemplateData({ ...templateData, name: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="template_desc">الوصف</Label>
              <Textarea
                id="template_desc"
                placeholder="اكتب وصفاً قصيراً للقالب والاستخدام"
                value={templateData.description}
                onChange={(e) => setTemplateData({ ...templateData, description: e.target.value })}
                rows={3}
              />
            </div>

            <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center hover:border-[#d4a574] transition-colors">
              <input
                type="file"
                id="file_upload"
                accept=".pdf"
                onChange={handleFileUpload}
                disabled={uploading}
                className="hidden"
              />
              <label
                htmlFor="file_upload"
                className="cursor-pointer flex flex-col items-center gap-2"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-8 h-8 text-[#d4a574] animate-spin" />
                    <span className="text-sm text-slate-600">جاري الرفع...</span>
                  </>
                ) : (
                  <>
                    <FileUp className="w-8 h-8 text-slate-400" />
                    <span className="text-sm text-slate-600">اضغط لاختيار ملف PDF</span>
                    <span className="text-xs text-slate-500">أو قم بالسحب والإفلات</span>
                  </>
                )}
              </label>
            </div>
          </div>

          {/* Uploaded Templates List */}
          {templates.length > 0 && (
            <div className="mt-8 space-y-4">
              <h4 className="font-semibold text-slate-900">القوالب المرفوعة ({templates.length})</h4>
              <div className="space-y-3">
                {templates.map((template) => (
                  <motion.div
                    key={template.template_id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-slate-900">{template.name}</p>
                        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                          قيد المراجعة
                        </Badge>
                      </div>
                      {template.description && (
                        <p className="text-sm text-slate-600 mt-1">{template.description}</p>
                      )}
                      <p className="text-xs text-slate-500 mt-2">
                        رفع بتاريخ: {new Date(template.upload_date).toLocaleDateString('ar-SA')}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <a href={template.file_url} download target="_blank" rel="noopener noreferrer">
                        <Button size="sm" variant="outline" className="gap-1">
                          <Download className="w-4 h-4" />
                          تحميل
                        </Button>
                      </a>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600 hover:text-red-700 border-red-200"
                        onClick={() => handleDelete(template.template_id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}