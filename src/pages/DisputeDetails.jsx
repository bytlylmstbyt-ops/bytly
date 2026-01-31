import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, ShieldAlert, Send, FileText, Download } from "lucide-react";
import { toast } from "sonner";

export default function DisputeDetails() {
  const [searchParams] = useSearchParams();
  const disputeId = searchParams.get("id");
  
  const [user, setUser] = useState(null);
  const [dispute, setDispute] = useState(null);
  const [project, setProject] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [newMessage, setNewMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    loadData();
  }, [disputeId]);

  const loadData = async () => {
    const currentUser = await base44.auth.me();
    setUser(currentUser);

    const disputes = await base44.entities.Dispute.filter({ id: disputeId });
    if (disputes.length > 0) {
      setDispute(disputes[0]);
      
      const projects = await base44.entities.Project.filter({ id: disputes[0].project_id });
      if (projects.length > 0) {
        setProject(projects[0]);
      }
    }
    setIsLoading(false);
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;
    
    setIsSending(true);
    const messages = dispute.messages || [];
    messages.push({
      sender_email: user.email,
      message: newMessage,
      timestamp: new Date().toISOString(),
      is_internal: false
    });

    await base44.entities.Dispute.update(dispute.id, { messages });
    setNewMessage("");
    toast.success("تم إرسال الرسالة");
    await loadData();
    setIsSending(false);
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
        <p className="text-slate-600">النزاع غير موجود</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-amber-50/30 py-8">
      <div className="max-w-5xl mx-auto px-4">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <ShieldAlert className="w-8 h-8 text-[#C9A66B]" />
            <h1 className="text-3xl font-bold text-slate-900">{dispute.title}</h1>
          </div>
          <p className="text-slate-600">رقم النزاع: {dispute.id}</p>
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

                {dispute.evidence_files?.length > 0 && (
                  <div>
                    <p className="text-sm text-slate-500 mb-2">المرفقات</p>
                    <div className="space-y-2">
                      {dispute.evidence_files.map((url, idx) => (
                        <a
                          key={idx}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-blue-600 hover:underline"
                        >
                          <FileText className="w-4 h-4" />
                          <span>ملف {idx + 1}</span>
                          <Download className="w-3 h-3" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {dispute.resolution_steps?.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-3">خطوات الحل</p>
                    <div className="space-y-3">
                      {dispute.resolution_steps.map((step, idx) => (
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
                            {step.deadline && (
                              <p className="text-xs text-slate-500 mt-1">
                                الموعد النهائي: {new Date(step.deadline).toLocaleDateString('ar-SA')}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>المحادثات</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 mb-4 max-h-96 overflow-y-auto">
                  {dispute.messages?.filter(m => !m.is_internal).map((msg, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-lg ${
                        msg.sender_email === user.email
                          ? 'bg-blue-50 ml-12'
                          : 'bg-slate-50 mr-12'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-sm font-medium">
                          {msg.sender_email === user.email ? 'أنت' : 'الطرف الآخر'}
                        </span>
                        <span className="text-xs text-slate-500">
                          {new Date(msg.timestamp).toLocaleString('ar-SA')}
                        </span>
                      </div>
                      <p className="text-sm text-slate-700">{msg.message}</p>
                    </div>
                  )) || <p className="text-center text-slate-500">لا توجد رسائل بعد</p>}
                </div>

                {dispute.status !== 'closed' && dispute.status !== 'resolved' && (
                  <div className="flex gap-2">
                    <Textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="اكتب رسالتك..."
                      rows={3}
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={isSending || !newMessage.trim()}
                      className="bg-gradient-to-r from-[#6B5D4F] to-[#C9A66B]"
                    >
                      {isSending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>معلومات عامة</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-slate-500">الحالة</p>
                  <Badge className="mt-1">
                    {dispute.status === 'submitted' ? 'مقدم' :
                     dispute.status === 'under_review' ? 'قيد المراجعة' :
                     dispute.status === 'investigation' ? 'قيد التحقيق' :
                     dispute.status === 'mediation' ? 'في الوساطة' :
                     dispute.status === 'resolved' ? 'تم الحل' :
                     dispute.status === 'closed' ? 'مغلق' :
                     dispute.status === 'escalated' ? 'مصعّد' : dispute.status}
                  </Badge>
                </div>

                <div>
                  <p className="text-sm text-slate-500">المشروع</p>
                  <p className="text-sm font-medium">{project?.title || 'غير متوفر'}</p>
                </div>

                <div>
                  <p className="text-sm text-slate-500">النوع</p>
                  <p className="text-sm">{dispute.dispute_type}</p>
                </div>

                <div>
                  <p className="text-sm text-slate-500">الأولوية</p>
                  <p className="text-sm">{dispute.priority}</p>
                </div>

                <div>
                  <p className="text-sm text-slate-500">تاريخ التقديم</p>
                  <p className="text-sm">{new Date(dispute.created_date).toLocaleString('ar-SA')}</p>
                </div>

                {dispute.assigned_admin && (
                  <div>
                    <p className="text-sm text-slate-500">المسؤول المكلف</p>
                    <p className="text-sm">{dispute.assigned_admin}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {dispute.resolution_summary && (
              <Card className="bg-green-50 border-green-200">
                <CardHeader>
                  <CardTitle className="text-green-900">الحل النهائي</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-green-800">{dispute.resolution_summary}</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}