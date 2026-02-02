import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, CheckCircle, XCircle, Upload, FileCheck, Clock, Shield } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

export default function FirmMilestoneControl() {
  const urlParams = new URLSearchParams(window.location.search);
  const projectId = urlParams.get("id");

  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [project, setProject] = useState(null);
  const [milestones, setMilestones] = useState([]);
  const [firm, setFirm] = useState(null);
  const [revisionNotes, setRevisionNotes] = useState({});
  const [uploadingStamps, setUploadingStamps] = useState({});
  const [baladyPermit, setBaladyPermit] = useState({});
  const [complianceNotes, setComplianceNotes] = useState({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const user = await base44.auth.me();
      
      const firms = await base44.entities.EngineeringFirm.filter({ email: user.email });
      if (firms.length === 0) {
        toast.error("غير مصرح لك بالوصول. يجب أن تكون شركة هندسية استشارية معتمدة.");
        return;
      }
      setFirm(firms[0]);

      const [projectData] = await base44.entities.Project.filter({ id: projectId });
      setProject(projectData);

      // Check if project requires firm approval
      if (projectData.project_type !== "full_construction") {
        toast.error("هذا المشروع لا يتطلب مراجعة من الشركة الاستشارية");
        return;
      }

      const milestonesData = await base44.entities.ProjectMilestone.filter(
        { project_id: projectId },
        "order"
      );
      setMilestones(milestonesData);
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("حدث خطأ في تحميل البيانات");
    } finally {
      setLoading(false);
    }
  };

  const uploadStampedDrawings = async (milestone, files) => {
    setUploadingStamps(prev => ({ ...prev, [milestone.id]: true }));
    try {
      const uploadedUrls = [];
      for (const file of files) {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        uploadedUrls.push(file_url);
      }

      await base44.entities.ProjectMilestone.update(milestone.id, {
        stamped_drawings: [...(milestone.stamped_drawings || []), ...uploadedUrls]
      });

      toast.success("تم رفع المخططات المختومة بنجاح");
      await loadData();
    } catch (error) {
      console.error("Error uploading:", error);
      toast.error("حدث خطأ في رفع الملفات");
    } finally {
      setUploadingStamps(prev => ({ ...prev, [milestone.id]: false }));
    }
  };

  const approveMilestone = async (milestone) => {
    if (!milestone.stamped_drawings || milestone.stamped_drawings.length === 0) {
      toast.error("يجب رفع المخططات المختومة أولاً");
      return;
    }

    const permitNumber = baladyPermit[milestone.id];
    if (!permitNumber?.trim()) {
      toast.error("يجب إدخال رقم رخصة البلدية أولاً");
      return;
    }

    setProcessing(true);
    try {
      const now = new Date().toISOString();
      
      // Add to audit log
      const auditEntry = {
        action: "firm_approved",
        actor_name: firm.company_name,
        actor_email: firm.email,
        timestamp: now,
        notes: `تم اعتماد المطابقة الفنية (SBC) - رقم الرخصة: ${permitNumber}`
      };

      await base44.entities.ProjectMilestone.update(milestone.id, {
        firm_approved: true,
        firm_approval_date: now,
        firm_id: firm.id,
        firm_name: firm.company_name,
        balady_permit_number: permitNumber,
        technical_compliance_notes: complianceNotes[milestone.id] || "",
        status: "firm_approved",
        audit_log: [...(milestone.audit_log || []), auditEntry]
      });

      // Send notification to client
      const clientData = await base44.entities.Client.filter({ id: project.client_id });
      if (clientData.length > 0) {
        await base44.entities.Notification.create({
          recipient_email: clientData[0].email,
          title: "✅ تم اعتماد المرحلة فنياً",
          message: `تم التحقق من المطابقة الفنية للمرحلة: ${milestone.title}. المشروع جاهز للمرحلة التالية.`,
          type: "milestone_approved",
          related_project_id: project.id,
          priority: "high"
        });
      }

      toast.success(`تم اعتماد المرحلة وإشعار العميل: ${milestone.title}`);
      setBaladyPermit(prev => ({ ...prev, [milestone.id]: "" }));
      setComplianceNotes(prev => ({ ...prev, [milestone.id]: "" }));
      await loadData();
    } catch (error) {
      console.error("Error approving:", error);
      toast.error("حدث خطأ في الاعتماد");
    } finally {
      setProcessing(false);
    }
  };

  const requestRevision = async (milestone) => {
    const notes = revisionNotes[milestone.id];
    if (!notes?.trim()) {
      toast.error("يرجى إدخال ملاحظات التعديل");
      return;
    }

    setProcessing(true);
    try {
      const now = new Date().toISOString();
      
      // Add to audit log
      const auditEntry = {
        action: "firm_revision_requested",
        actor_name: firm.company_name,
        actor_email: firm.email,
        timestamp: now,
        notes: notes
      };

      await base44.entities.ProjectMilestone.update(milestone.id, {
        status: "in_progress",
        firm_revision_notes: notes,
        revision_count: (milestone.revision_count || 0) + 1,
        firm_approved: false,
        audit_log: [...(milestone.audit_log || []), auditEntry]
      });

      // Notify engineer about revision request
      const engineerData = await base44.entities.Engineer.filter({ id: project.assigned_engineer_id });
      if (engineerData.length > 0) {
        await base44.entities.Notification.create({
          recipient_email: engineerData[0].email,
          title: "🔄 طلب تعديل من الشركة الاستشارية",
          message: `طلبت الشركة الاستشارية تعديلات على المرحلة: ${milestone.title}`,
          type: "revision_requested",
          related_project_id: project.id,
          priority: "high"
        });
      }

      setRevisionNotes(prev => ({ ...prev, [milestone.id]: "" }));
      toast.success("تم طلب التعديلات وإشعار المهندس");
      await loadData();
    } catch (error) {
      console.error("Error requesting revision:", error);
      toast.error("حدث خطأ في طلب التعديل");
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-[#d4a574]" />
      </div>
    );
  }

  if (!firm || !project) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <Shield className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-slate-600">غير مصرح بالوصول أو المشروع غير متاح</p>
            {project?.project_type === "express_service" && (
              <p className="text-sm text-slate-500 mt-2">
                هذا المشروع من نوع "خدمة سريعة" ولا يتطلب مراجعة استشارية
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-green-50/30 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <Shield className="w-8 h-8 text-green-600" />
              <h1 className="text-2xl md:text-3xl font-bold text-[#1a1a2e]">
                لوحة تحكم الشركة الاستشارية
              </h1>
            </div>
            <p className="text-slate-600">{project.title}</p>
            <Badge className="bg-green-100 text-green-800 mt-2">
              <FileCheck className="w-3 h-3 ml-1" />
              {firm.company_name}
            </Badge>
          </div>

          {/* Milestones */}
          <div className="space-y-4">
            {milestones.map((milestone, index) => (
              <motion.div
                key={milestone.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className={milestone.firm_approved ? "border-green-300 bg-green-50/30" : ""}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Badge variant="outline">المرحلة {milestone.order}</Badge>
                          {milestone.firm_approved ? (
                            <Badge className="bg-green-600 text-white">
                              <CheckCircle className="w-3 h-3 ml-1" />
                              معتمدة من الشركة
                            </Badge>
                          ) : milestone.status === "submitted" ? (
                            <Badge className="bg-amber-600 text-white">
                              <Clock className="w-3 h-3 ml-1" />
                              بانتظار الاعتماد
                            </Badge>
                          ) : (
                            <Badge className="bg-slate-400 text-white">
                              قيد العمل
                            </Badge>
                          )}
                        </div>
                        <CardTitle className="text-lg">{milestone.title}</CardTitle>
                        {milestone.description && (
                          <p className="text-sm text-slate-600 mt-2">{milestone.description}</p>
                        )}
                      </div>
                      <p className="text-2xl font-bold text-green-600">
                        {milestone.amount.toLocaleString('ar-SA')} ريال
                      </p>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Deliverable Files */}
                    {milestone.deliverable_files?.length > 0 && (
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm text-blue-800 mb-2 font-medium">ملفات المهندس:</p>
                        <div className="space-y-1">
                          {milestone.deliverable_files.map((url, idx) => (
                            <a
                              key={idx}
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-blue-600 hover:underline block"
                            >
                              📎 ملف {idx + 1}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Stamped Drawings */}
                    {milestone.stamped_drawings?.length > 0 && (
                      <div className="p-3 bg-green-50 rounded-lg">
                        <p className="text-sm text-green-800 mb-2 font-medium">المخططات المختومة:</p>
                        <div className="space-y-1">
                          {milestone.stamped_drawings.map((url, idx) => (
                            <a
                              key={idx}
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-green-600 hover:underline block"
                            >
                              ✅ مخطط مختوم {idx + 1}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Audit Log */}
                    {milestone.audit_log?.length > 0 && (
                      <div className="p-3 bg-slate-50 rounded-lg border">
                        <p className="text-sm font-medium text-slate-800 mb-2">سجل التدقيق:</p>
                        <div className="space-y-2">
                          {milestone.audit_log.map((log, idx) => (
                            <div key={idx} className="text-xs text-slate-600 border-r-2 border-green-500 pr-2">
                              <p className="font-medium">{log.actor_name}</p>
                              <p>{log.action === "firm_approved" ? "✅ اعتماد" : "🔄 طلب تعديل"}</p>
                              <p className="text-slate-400">{new Date(log.timestamp).toLocaleString('ar-SA')}</p>
                              {log.notes && <p className="mt-1">{log.notes}</p>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Actions for submitted milestones */}
                    {milestone.status === "submitted" && !milestone.firm_approved && (
                      <div className="space-y-4 pt-4 border-t">
                        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                          <p className="text-sm font-medium text-amber-800 flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            الدفعة محجوزة - بانتظار اعتماد المطابقة الفنية
                          </p>
                        </div>

                        {/* Upload Stamped Drawings */}
                        <div>
                          <Label className="text-sm mb-2 block">1. رفع المخططات المختومة (مطلوب)</Label>
                          <div className="border-2 border-dashed rounded-lg p-4 text-center">
                            <input
                              type="file"
                              multiple
                              accept=".pdf,.dwg,.jpg,.png"
                              onChange={(e) => uploadStampedDrawings(milestone, Array.from(e.target.files))}
                              className="hidden"
                              id={`stamp-${milestone.id}`}
                              disabled={uploadingStamps[milestone.id]}
                            />
                            <label htmlFor={`stamp-${milestone.id}`} className="cursor-pointer">
                              {uploadingStamps[milestone.id] ? (
                                <Loader2 className="w-8 h-8 text-slate-400 mx-auto mb-2 animate-spin" />
                              ) : (
                                <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                              )}
                              <p className="text-sm text-slate-600">رفع المخططات المختومة رسمياً</p>
                            </label>
                          </div>
                        </div>

                        {/* Balady Permit Number */}
                        <div>
                          <Label className="text-sm mb-2 block">2. رقم رخصة البلدية (Balady Permit) *</Label>
                          <Input
                            placeholder="أدخل رقم الرخصة البلدية"
                            value={baladyPermit[milestone.id] || ""}
                            onChange={(e) => setBaladyPermit(prev => ({ ...prev, [milestone.id]: e.target.value }))}
                          />
                        </div>

                        {/* Technical Compliance Notes */}
                        <div>
                          <Label className="text-sm mb-2 block">3. ملاحظات المطابقة الفنية (SBC)</Label>
                          <Textarea
                            placeholder="اكتب ملاحظاتك حول المطابقة مع كود البناء السعودي..."
                            value={complianceNotes[milestone.id] || ""}
                            onChange={(e) => setComplianceNotes(prev => ({ ...prev, [milestone.id]: e.target.value }))}
                            rows={3}
                          />
                        </div>

                        {/* Approve Button */}
                        <Button
                          onClick={() => approveMilestone(milestone)}
                          disabled={processing || !milestone.stamped_drawings?.length || !baladyPermit[milestone.id]?.trim()}
                          className="w-full bg-green-600 hover:bg-green-700 text-white"
                        >
                          {processing ? (
                            <>
                              <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                              جاري الاعتماد...
                            </>
                          ) : (
                            <>
                              <CheckCircle className="w-4 h-4 ml-2" />
                              اعتماد المطابقة الفنية وتحرير الدفع
                            </>
                          )}
                        </Button>

                        {/* Request Revision */}
                        <div className="space-y-2">
                          <Label>ملاحظات التعديل</Label>
                          <Textarea
                            placeholder="اكتب الملاحظات والتعديلات المطلوبة من المهندس..."
                            value={revisionNotes[milestone.id] || ""}
                            onChange={(e) => setRevisionNotes(prev => ({ ...prev, [milestone.id]: e.target.value }))}
                            rows={3}
                          />
                          <Button
                            onClick={() => requestRevision(milestone)}
                            disabled={processing}
                            variant="outline"
                            className="w-full border-amber-500 text-amber-700 hover:bg-amber-50"
                          >
                            <XCircle className="w-4 h-4 ml-2" />
                            طلب تعديلات وإعادة للمهندس
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Approval Info */}
                    {milestone.firm_approved && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-2">
                        <div className="flex items-center gap-2 text-green-700">
                          <CheckCircle className="w-5 h-5" />
                          <p className="font-semibold">✅ تم اعتماد المطابقة الفنية (SBC)</p>
                        </div>
                        <div className="text-sm text-green-700 space-y-1">
                          <p>الشركة المعتمدة: {milestone.firm_name}</p>
                          <p>رقم الرخصة: {milestone.balady_permit_number || "غير محدد"}</p>
                          <p className="text-xs">
                            التاريخ: {new Date(milestone.firm_approval_date).toLocaleString('ar-SA')}
                          </p>
                        </div>
                        {milestone.technical_compliance_notes && (
                          <p className="text-xs text-green-600 mt-2 pt-2 border-t border-green-200">
                            {milestone.technical_compliance_notes}
                          </p>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}