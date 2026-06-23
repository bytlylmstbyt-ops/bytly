import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Upload, FileText, Download, Loader2, Scale, CheckCircle, Eye, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function SignedContractsPanel({ project, user, userEngineer, userClient }) {
  const [contracts, setContracts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [uploadData, setUploadData] = useState({
    contract_number: "",
    title: "",
    file: null
  });

  const isClient = user && project.created_by === user.email;
  const isEngineer = !!userEngineer && project.assigned_engineer_id === userEngineer.id;
  const canUpload = isClient || isEngineer;

  const loadContracts = useCallback(async () => {
    if (!project?.id) return;
    setIsLoading(true);
    try {
      const data = await base44.entities.Contract.filter({ project_id: project.id });
      setContracts(data.sort((a, b) => new Date(b.created_date) - new Date(a.created_date)));
    } catch (error) {
      console.error("Error loading contracts:", error);
    } finally {
      setIsLoading(false);
    }
  }, [project?.id]);

  useEffect(() => {
    loadContracts();
  }, [loadContracts]);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadData(prev => ({ ...prev, file }));
    }
  };

  const handleUpload = async () => {
    if (!uploadData.file) return;
    setIsUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file: uploadData.file });

      await base44.entities.Contract.create({
        project_id: project.id,
        client_id: project.client_id || project.created_by,
        engineer_id: project.assigned_engineer_id,
        contract_type: "service_agreement",
        contract_number: uploadData.contract_number || `CTR-${Date.now().toString().slice(-6)}`,
        service_description: uploadData.title || "عقد موقّع بين المهندس والعميل",
        total_amount: project.budget_max || 0,
        contract_pdf_url: file_url,
        status: "signed",
        client_signature: true,
        engineer_signature: true,
        client_signature_date: new Date().toISOString(),
        engineer_signature_date: new Date().toISOString(),
        description: uploadData.title || "نسخة موقّعة من العقد بين المهندس والعميل"
      });

      setShowUpload(false);
      setUploadData({ contract_number: "", title: "", file: null });
      loadContracts();
    } catch (error) {
      console.error("Error uploading contract:", error);
      alert("حدث خطأ أثناء رفع العقد. حاول مرة أخرى.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (contractId) => {
    if (!confirm("هل أنت متأكد من حذف هذا العقد؟")) return;
    try {
      await base44.entities.Contract.delete(contractId);
      loadContracts();
    } catch (error) {
      console.error("Error deleting contract:", error);
      alert("تعذّر حذف العقد.");
    }
  };

  const getStatusBadge = (status) => {
    const map = {
      draft: { label: "مسودة", variant: "secondary" },
      pending_signature: { label: "بانتظار التوقيع", variant: "outline" },
      signed: { label: "موقّع", variant: "default" },
      active: { label: "ساري", variant: "default" },
      completed: { label: "مكتمل", variant: "default" },
      terminated: { label: "منتهي", variant: "destructive" },
      archived: { label: "مؤرشف", variant: "secondary" }
    };
    return map[status] || { label: status, variant: "secondary" };
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("ar", {
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  };

  return (
    <Card className="border-0 shadow-lg mb-6">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
            <Scale className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <CardTitle className="text-base">العقود الموقّعة</CardTitle>
            <p className="text-sm text-slate-500">رفع ومراجعة العقود بين الطرفين</p>
          </div>
        </div>
        {canUpload && (
          <Dialog open={showUpload} onOpenChange={setShowUpload}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-gradient-to-r from-[#6B5D4F] to-[#C9A66B] text-white gap-1.5">
                <Upload className="w-4 h-4" />
                رفع عقد
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>رفع عقد موقّع</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>عنوان العقد</Label>
                  <Input
                    value={uploadData.title}
                    onChange={(e) => setUploadData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="مثال: عقد تصميم داخلي — نسخة موقّعة"
                  />
                </div>
                <div className="space-y-2">
                  <Label>رقم العقد (اختياري)</Label>
                  <Input
                    value={uploadData.contract_number}
                    onChange={(e) => setUploadData(prev => ({ ...prev, contract_number: e.target.value }))}
                    placeholder="سيتم توليد رقم تلقائياً إذا تُرك فارغاً"
                  />
                </div>
                <div className="space-y-2">
                  <Label>ملف العقد الموقّع (PDF / صورة)</Label>
                  <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center hover:border-[#C9A66B] transition-colors">
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                      onChange={handleFileChange}
                      className="hidden"
                      id="signed-contract-file"
                    />
                    <label htmlFor="signed-contract-file" className="cursor-pointer flex flex-col items-center gap-2">
                      {uploadData.file ? (
                        <>
                          <CheckCircle className="w-8 h-8 text-green-500" />
                          <span className="text-sm font-medium text-slate-700">{uploadData.file.name}</span>
                          <span className="text-xs text-slate-400">اضغط للتغيير</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-8 h-8 text-slate-400" />
                          <span className="text-sm text-slate-500">اضغط لاختيار الملف</span>
                        </>
                      )}
                    </label>
                  </div>
                </div>
                <Button
                  onClick={handleUpload}
                  disabled={!uploadData.file || isUploading}
                  className="w-full bg-gradient-to-r from-[#6B5D4F] to-[#C9A66B] text-white"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin ml-2" />
                      جاري الرفع...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 ml-2" />
                      حفظ العقد
                    </>
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
          </div>
        ) : contracts.length === 0 ? (
          <div className="text-center py-6">
            <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm text-slate-500">لا توجد عقود محفوظة بعد</p>
            {canUpload && (
              <p className="text-xs text-slate-400 mt-1">ارفع نسخة العقد الموقّعة ليرجع إليها كلا الطرفين</p>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {contracts.map((contract) => {
              const statusInfo = getStatusBadge(contract.status);
              return (
                <div
                  key={contract.id}
                  className="flex items-start gap-3 p-3 rounded-xl border border-slate-100 hover:border-[#C9A66B]/30 hover:bg-slate-50/50 transition-colors"
                >
                  <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5 text-red-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-sm text-[#1a1a2e] truncate">
                        {contract.service_description || contract.description || "عقد موقّع"}
                      </p>
                      <Badge variant={statusInfo.variant} className="text-[10px]">
                        {statusInfo.label}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      رقم: {contract.contract_number || "—"} · {formatDate(contract.created_date)}
                    </p>
                    {contract.contract_pdf_url && (
                      <div className="flex items-center gap-2 mt-2">
                        <a
                          href={contract.contract_pdf_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-[#C9A66B] hover:underline"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          عرض
                        </a>
                        <a
                          href={contract.contract_pdf_url}
                          download
                          className="inline-flex items-center gap-1 text-xs text-blue-500 hover:underline"
                        >
                          <Download className="w-3.5 h-3.5" />
                          تحميل
                        </a>
                        {canUpload && (
                          <button
                            onClick={() => handleDelete(contract.id)}
                            className="inline-flex items-center gap-1 text-xs text-red-400 hover:text-red-600 mr-auto"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}