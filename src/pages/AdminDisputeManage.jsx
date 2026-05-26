import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useSearchParams, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import MobileSelect from "@/components/mobile/MobileSelect";
import { Badge } from "@/components/ui/badge";
import { Loader2, Save, Plus, Check, X } from "lucide-react";
import { toast } from "sonner";

export default function AdminDisputeManage() {
  const [searchParams] = useSearchParams();
  const disputeId = searchParams.get("id");
  const navigate = useNavigate();
  
  const [user, setUser] = useState(null);
  const [dispute, setDispute] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const [status, setStatus] = useState("");
  const [assignedAdmin, setAssignedAdmin] = useState("");
  const [adminNote, setAdminNote] = useState("");
  const [resolutionSummary, setResolutionSummary] = useState("");
  const [newStepTitle, setNewStepTitle] = useState("");
  const [newStepDescription, setNewStepDescription] = useState("");

  useEffect(() => {
    loadData();
  }, [disputeId]);

  const loadData = async () => {
    const currentUser = await base44.auth.me();
    setUser(currentUser);

    const disputes = await base44.entities.Dispute.filter({ id: disputeId });
    if (disputes.length > 0) {
      const d = disputes[0];
      setDispute(d);
      setStatus(d.status);
      setAssignedAdmin(d.assigned_admin || "");
      setResolutionSummary(d.resolution_summary || "");
    }
    setIsLoading(false);
  };

  const handleAddNote = async () => {
    if (!adminNote.trim()) return;
    
    const notes = dispute.admin_notes || [];
    notes.push({
      admin_email: user.email,
      note: adminNote,
      timestamp: new Date().toISOString(),
      action_taken: "إضافة ملاحظة"
    });

    await base44.entities.Dispute.update(dispute.id, { admin_notes: notes });
    setAdminNote("");
    toast.success("تم إضافة الملاحظة");
    await loadData();
  };

  const handleAddResolutionStep = async () => {
    if (!newStepTitle.trim()) return;
    
    const steps = dispute.resolution_steps || [];
    steps.push({
      step_number: steps.length + 1,
      step_title: newStepTitle,
      description: newStepDescription,
      status: "pending",
      responsible_party: "both"
    });

    await base44.entities.Dispute.update(dispute.id, { resolution_steps: steps });
    setNewStepTitle("");
    setNewStepDescription("");
    toast.success("تم إضافة خطوة الحل");
    await loadData();
  };

  const handleUpdateStepStatus = async (stepIndex, newStatus) => {
    const steps = [...dispute.resolution_steps];
    steps[stepIndex].status = newStatus;
    if (newStatus === 'completed') {
      steps[stepIndex].completion_date = new Date().toISOString();
    }

    await base44.entities.Dispute.update(dispute.id, { resolution_steps: steps });
    toast.success("تم تحديث حالة الخطوة");
    await loadData();
  };

  const handleSave = async () => {
    setIsSaving(true);
    
    const updates = {
      status,
      assigned_admin: assignedAdmin || user.email,
      resolution_summary: resolutionSummary
    };

    if (status === 'resolved') {
      updates.resolution_date = new Date().toISOString();
    }

    await base44.entities.Dispute.update(dispute.id, updates);
    toast.success("تم حفظ التغييرات");
    setIsSaving(false);
    navigate(createPageUrl("AdminDisputes"));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#C9A66B]" />
      </div>
    );
  }

  if (!dispute) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-slate-600">النزاع غير موجود</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-amber-50/30 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">إدارة النزاع</h1>
          <p className="text-slate-600">{dispute.title}</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>تفاصيل النزاع</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-slate-500 mb-1">الوصف</p>
                  <p className="text-slate-700">{dispute.description}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-slate-500">رفعه</p>
                    <p className="text-sm font-medium">{dispute.raised_by}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">ضد</p>
                    <p className="text-sm font-medium">{dispute.raised_against}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>خطوات الحل</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {dispute.resolution_steps?.map((step, idx) => (
                  <div key={idx} className="flex gap-3 p-3 bg-slate-50 rounded-lg">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      step.status === 'completed' ? 'bg-green-100 text-green-700' :
                      step.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                      'bg-slate-200 text-slate-600'
                    }`}>
                      {step.step_number}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{step.step_title}</p>
                      <p className="text-xs text-slate-600">{step.description}</p>
                      <div className="flex gap-2 mt-2">
                        {step.status !== 'completed' && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleUpdateStepStatus(idx, 'in_progress')}
                            >
                              جاري
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleUpdateStepStatus(idx, 'completed')}
                              className="text-green-600"
                            >
                              <Check className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                <div className="border-t pt-4 space-y-2">
                  <Input
                    placeholder="عنوان الخطوة"
                    value={newStepTitle}
                    onChange={(e) => setNewStepTitle(e.target.value)}
                  />
                  <Input
                    placeholder="وصف الخطوة"
                    value={newStepDescription}
                    onChange={(e) => setNewStepDescription(e.target.value)}
                  />
                  <Button onClick={handleAddResolutionStep} variant="outline" size="sm">
                    <Plus className="w-4 h-4 ml-2" />
                    إضافة خطوة
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>ملاحظات الإدارة</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {dispute.admin_notes?.map((note, idx) => (
                    <div key={idx} className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                      <div className="flex justify-between text-xs text-slate-600 mb-1">
                        <span>{note.admin_email}</span>
                        <span>{new Date(note.timestamp).toLocaleString('ar-SA')}</span>
                      </div>
                      <p className="text-sm">{note.note}</p>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Textarea
                    value={adminNote}
                    onChange={(e) => setAdminNote(e.target.value)}
                    placeholder="أضف ملاحظة..."
                    rows={2}
                  />
                  <Button onClick={handleAddNote} size="sm">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>إدارة الحالة</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>الحالة</Label>
                  <MobileSelect
                    value={status}
                    onValueChange={setStatus}
                    placeholder="اختر الحالة"
                    label="حالة النزاع"
                    options={[
                      { value: "submitted", label: "مقدم" },
                      { value: "under_review", label: "قيد المراجعة" },
                      { value: "investigation", label: "قيد التحقيق" },
                      { value: "mediation", label: "في الوساطة" },
                      { value: "resolved", label: "تم الحل" },
                      { value: "closed", label: "مغلق" },
                      { value: "escalated", label: "مصعّد" },
                    ]}
                  />
                </div>

                <div className="space-y-2">
                  <Label>المسؤول المكلف</Label>
                  <Input
                    value={assignedAdmin}
                    onChange={(e) => setAssignedAdmin(e.target.value)}
                    placeholder="البريد الإلكتروني"
                  />
                </div>

                <div className="space-y-2">
                  <Label>ملخص الحل النهائي</Label>
                  <Textarea
                    value={resolutionSummary}
                    onChange={(e) => setResolutionSummary(e.target.value)}
                    placeholder="اكتب ملخص الحل..."
                    rows={4}
                  />
                </div>

                <Button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="w-full bg-gradient-to-r from-[#6B5D4F] to-[#C9A66B]"
                >
                  {isSaving ? <Loader2 className="w-5 h-5 animate-spin ml-2" /> : <Save className="w-5 h-5 ml-2" />}
                  حفظ التغييرات
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}