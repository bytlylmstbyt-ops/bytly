import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Send, Loader2, CheckCircle, Clock, Upload } from "lucide-react";
import { motion } from "framer-motion";

export default function ComplaintsPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [complaints, setComplaints] = useState([]);
  const [formData, setFormData] = useState({
    type: "",
    subject: "",
    description: "",
    attachments: []
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const userData = await base44.auth.me();
      setUser(userData);
      
      const userComplaints = await base44.entities.Complaint.filter({ 
        user_id: userData.email 
      }, "-created_date");
      setComplaints(userComplaints);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData({
        ...formData,
        attachments: [...formData.attachments, file_url]
      });
    } catch (error) {
      console.error("Error uploading file:", error);
      alert("فشل رفع الملف");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await base44.entities.Complaint.create({
        ...formData,
        user_id: user.email
      });

      alert("تم إرسال طلبك بنجاح! سيتم الرد عليك قريباً.");
      setFormData({
        type: "",
        subject: "",
        description: "",
        attachments: []
      });
      loadData();
    } catch (error) {
      console.error("Error submitting complaint:", error);
      alert("حدث خطأ أثناء الإرسال");
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      pending: { label: "قيد المراجعة", color: "bg-amber-100 text-amber-800", icon: Clock },
      in_review: { label: "جاري المعالجة", color: "bg-blue-100 text-blue-800", icon: Clock },
      resolved: { label: "تم الحل", color: "bg-green-100 text-green-800", icon: CheckCircle },
      closed: { label: "مغلق", color: "bg-gray-100 text-gray-800", icon: CheckCircle }
    };
    
    const config = statusMap[status] || statusMap.pending;
    const Icon = config.icon;
    
    return (
      <Badge className={config.color}>
        <Icon className="w-3 h-3 ml-1" />
        {config.label}
      </Badge>
    );
  };

  return (
    <div className="min-h-screen py-8 px-4" dir="rtl">
      <div className="max-w-5xl mx-auto space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <MessageSquare className="w-16 h-16 text-[#C9A66B] mx-auto mb-4" />
          <h1 className="text-3xl font-bold gradient-text mb-2">
            الشكاوى والاقتراحات
          </h1>
          <p className="text-slate-600">
            نحن نهتم بآرائكم وملاحظاتكم لتحسين خدماتنا
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Submit Form */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>تقديم شكوى أو اقتراح</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="type">النوع *</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value) => setFormData({ ...formData, type: value })}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="اختر النوع" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="complaint">شكوى</SelectItem>
                        <SelectItem value="suggestion">اقتراح</SelectItem>
                        <SelectItem value="feedback">ملاحظة عامة</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="subject">الموضوع *</Label>
                    <Input
                      id="subject"
                      required
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      placeholder="عنوان الشكوى أو الاقتراح"
                    />
                  </div>

                  <div>
                    <Label htmlFor="description">التفاصيل *</Label>
                    <Textarea
                      id="description"
                      required
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={5}
                      placeholder="اشرح تفاصيل شكواك أو اقتراحك..."
                    />
                  </div>

                  <div>
                    <Label>المرفقات (اختياري)</Label>
                    <input
                      type="file"
                      id="attachments"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById('attachments').click()}
                      className="w-full"
                    >
                      <Upload className="w-4 h-4 ml-2" />
                      رفع ملف
                    </Button>
                    {formData.attachments.length > 0 && (
                      <p className="text-sm text-green-600 mt-2">
                        تم رفع {formData.attachments.length} ملف
                      </p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-gradient-to-r from-[#1a1a2e] to-[#C9A66B]"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin ml-2" />
                        جاري الإرسال...
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5 ml-2" />
                        إرسال
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </motion.div>

          {/* Previous Complaints */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>طلباتك السابقة</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8">
                    <Loader2 className="w-8 h-8 animate-spin text-[#C9A66B] mx-auto" />
                  </div>
                ) : complaints.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500">لا توجد طلبات سابقة</p>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-[500px] overflow-y-auto">
                    {complaints.map((complaint) => (
                      <div
                        key={complaint.id}
                        className="p-4 rounded-lg border bg-slate-50"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-semibold text-slate-900">
                            {complaint.subject}
                          </h4>
                          {getStatusBadge(complaint.status)}
                        </div>
                        <p className="text-sm text-slate-600 mb-2">
                          {complaint.description}
                        </p>
                        <p className="text-xs text-slate-400">
                          {new Date(complaint.created_date).toLocaleDateString('ar-SA')}
                        </p>
                        {complaint.admin_response && (
                          <div className="mt-3 p-3 bg-blue-50 rounded border border-blue-200">
                            <p className="text-sm font-medium text-blue-900 mb-1">
                              رد الإدارة:
                            </p>
                            <p className="text-sm text-blue-800">
                              {complaint.admin_response}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}