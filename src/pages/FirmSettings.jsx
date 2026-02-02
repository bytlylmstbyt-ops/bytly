import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Upload, Loader2, CheckCircle, Shield } from "lucide-react";
import { toast } from "sonner";

export default function FirmSettings() {
  const [firm, setFirm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState({ stamp: false, signature: false });

  useEffect(() => {
    loadFirm();
  }, []);

  const loadFirm = async () => {
    try {
      const user = await base44.auth.me();
      const [firmData] = await base44.entities.EngineeringFirm.filter({ email: user.email });
      setFirm(firmData);
    } catch (error) {
      console.error("Error loading firm:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadStamp = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading({ ...uploading, stamp: true });
    try {
      const { data } = await base44.integrations.Core.UploadFile({ file });
      await base44.entities.EngineeringFirm.update(firm.id, {
        official_stamp: data.file_url
      });
      toast.success("تم رفع الختم الرسمي بنجاح");
      await loadFirm();
    } catch (error) {
      toast.error("خطأ في رفع الختم");
    } finally {
      setUploading({ ...uploading, stamp: false });
    }
  };

  const handleUploadSignature = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading({ ...uploading, signature: true });
    try {
      const { data } = await base44.integrations.Core.UploadFile({ file });
      await base44.entities.EngineeringFirm.update(firm.id, {
        authorized_signature: data.file_url
      });
      toast.success("تم رفع التوقيع الرسمي بنجاح");
      await loadFirm();
    } catch (error) {
      toast.error("خطأ في رفع التوقيع");
    } finally {
      setUploading({ ...uploading, signature: false });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-amber-50/30 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#1a1a2e]">إعدادات الشركة</h1>
          <p className="text-slate-600 mt-1">إدارة الختم والتوقيع الرسمي</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-purple-600" />
              الختم والتوقيع الرسمي
            </CardTitle>
            <p className="text-sm text-slate-600 mt-2">
              سيتم استخدام الختم والتوقيع تلقائياً في توليد المستندات الرسمية والمخططات المختومة
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Official Stamp */}
            <div>
              <Label className="mb-3 block">الختم الرسمي للشركة</Label>
              {firm?.official_stamp ? (
                <div className="flex items-center gap-4">
                  <img
                    src={firm.official_stamp}
                    alt="Official Stamp"
                    className="w-32 h-32 object-contain border rounded-lg p-2"
                  />
                  <div className="flex-1">
                    <Badge className="bg-green-100 text-green-700 mb-2">
                      <CheckCircle className="w-3 h-3 ml-1" />
                      تم الرفع
                    </Badge>
                    <p className="text-sm text-slate-600">الختم الرسمي جاهز للاستخدام</p>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    id="stamp-update"
                    onChange={handleUploadStamp}
                  />
                  <label htmlFor="stamp-update">
                    <Button variant="outline" disabled={uploading.stamp} asChild>
                      <span>تحديث الختم</span>
                    </Button>
                  </label>
                </div>
              ) : (
                <div className="border-2 border-dashed rounded-lg p-8 text-center">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    id="stamp-upload"
                    onChange={handleUploadStamp}
                  />
                  <label htmlFor="stamp-upload" className="cursor-pointer">
                    {uploading.stamp ? (
                      <Loader2 className="w-12 h-12 text-slate-400 mx-auto mb-3 animate-spin" />
                    ) : (
                      <Upload className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                    )}
                    <p className="text-slate-600 font-medium">رفع الختم الرسمي</p>
                    <p className="text-xs text-slate-500 mt-1">PNG أو JPG - خلفية شفافة مفضلة</p>
                  </label>
                </div>
              )}
            </div>

            {/* Authorized Signature */}
            <div>
              <Label className="mb-3 block">توقيع المفوض الرسمي</Label>
              {firm?.authorized_signature ? (
                <div className="flex items-center gap-4">
                  <img
                    src={firm.authorized_signature}
                    alt="Signature"
                    className="w-32 h-20 object-contain border rounded-lg p-2"
                  />
                  <div className="flex-1">
                    <Badge className="bg-green-100 text-green-700 mb-2">
                      <CheckCircle className="w-3 h-3 ml-1" />
                      تم الرفع
                    </Badge>
                    <p className="text-sm text-slate-600">التوقيع الرسمي جاهز للاستخدام</p>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    id="signature-update"
                    onChange={handleUploadSignature}
                  />
                  <label htmlFor="signature-update">
                    <Button variant="outline" disabled={uploading.signature} asChild>
                      <span>تحديث التوقيع</span>
                    </Button>
                  </label>
                </div>
              ) : (
                <div className="border-2 border-dashed rounded-lg p-8 text-center">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    id="signature-upload"
                    onChange={handleUploadSignature}
                  />
                  <label htmlFor="signature-upload" className="cursor-pointer">
                    {uploading.signature ? (
                      <Loader2 className="w-12 h-12 text-slate-400 mx-auto mb-3 animate-spin" />
                    ) : (
                      <Upload className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                    )}
                    <p className="text-slate-600 font-medium">رفع التوقيع الرسمي</p>
                    <p className="text-xs text-slate-500 mt-1">PNG أو JPG - خلفية شفافة مفضلة</p>
                  </label>
                </div>
              )}
            </div>

            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                💡 <strong>ملاحظة:</strong> سيتم إضافة الختم والتوقيع تلقائياً على جميع المخططات المعتمدة والمستندات الرسمية
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}