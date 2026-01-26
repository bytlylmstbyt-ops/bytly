import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Headphones, Send, Loader2, Upload, AlertCircle, CheckCircle, Clock } from "lucide-react";
import { motion } from "framer-motion";

export default function SupportPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [tickets, setTickets] = useState([]);
  const [formData, setFormData] = useState({
    category: "",
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
      
      const userTickets = await base44.entities.SupportTicket.filter({ 
        user_id: userData.email 
      }, "-created_date");
      setTickets(userTickets);
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
      await base44.entities.SupportTicket.create({
        ...formData,
        user_id: user.email
      });

      alert("تم إرسال طلب الدعم بنجاح! سنتواصل معك قريباً.");
      setFormData({
        category: "",
        subject: "",
        description: "",
        attachments: []
      });
      loadData();
    } catch (error) {
      console.error("Error submitting ticket:", error);
      alert("حدث خطأ أثناء الإرسال");
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      open: { label: "مفتوحة", color: "bg-blue-100 text-blue-800", icon: AlertCircle },
      in_progress: { label: "قيد المعالجة", color: "bg-amber-100 text-amber-800", icon: Clock },
      waiting_customer: { label: "بانتظار ردك", color: "bg-purple-100 text-purple-800", icon: Clock },
      resolved: { label: "تم الحل", color: "bg-green-100 text-green-800", icon: CheckCircle },
      closed: { label: "مغلقة", color: "bg-gray-100 text-gray-800", icon: CheckCircle }
    };
    
    const config = statusMap[status] || statusMap.open;
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
      <div className="max-w-6xl mx-auto space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <Headphones className="w-16 h-16 text-[#d4a574] mx-auto mb-4" />
          <h1 className="text-3xl font-bold gradient-text mb-2">
            الدعم الفني
          </h1>
          <p className="text-slate-600">
            فريقنا جاهز لمساعدتك في حل أي مشكلة تقنية
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
                <CardTitle>فتح تذكرة دعم جديدة</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="category">تصنيف المشكلة *</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) => setFormData({ ...formData, category: value })}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="اختر التصنيف" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="technical">مشكلة تقنية</SelectItem>
                        <SelectItem value="payment">الدفع والمحفظة</SelectItem>
                        <SelectItem value="account">الحساب والإعدادات</SelectItem>
                        <SelectItem value="project">المشاريع والعقود</SelectItem>
                        <SelectItem value="general">عام</SelectItem>
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
                      placeholder="عنوان المشكلة"
                    />
                  </div>

                  <div>
                    <Label htmlFor="description">وصف المشكلة *</Label>
                    <Textarea
                      id="description"
                      required
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={6}
                      placeholder="اشرح المشكلة بالتفصيل ليتمكن فريقنا من مساعدتك بشكل أفضل..."
                    />
                  </div>

                  <div>
                    <Label>إرفاق لقطات شاشة (اختياري)</Label>
                    <input
                      type="file"
                      id="attachments"
                      onChange={handleFileUpload}
                      className="hidden"
                      accept="image/*"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById('attachments').click()}
                      className="w-full"
                    >
                      <Upload className="w-4 h-4 ml-2" />
                      رفع صورة
                    </Button>
                    {formData.attachments.length > 0 && (
                      <p className="text-sm text-green-600 mt-2">
                        تم رفع {formData.attachments.length} صورة
                      </p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin ml-2" />
                        جاري الإرسال...
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5 ml-2" />
                        إرسال التذكرة
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </motion.div>

          {/* Previous Tickets */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>تذاكر الدعم السابقة</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8">
                    <Loader2 className="w-8 h-8 animate-spin text-[#d4a574] mx-auto" />
                  </div>
                ) : tickets.length === 0 ? (
                  <div className="text-center py-8">
                    <Headphones className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500">لا توجد تذاكر سابقة</p>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-[550px] overflow-y-auto">
                    {tickets.map((ticket) => (
                      <div
                        key={ticket.id}
                        className="p-4 rounded-lg border bg-slate-50"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="font-semibold text-slate-900 mb-1">
                              {ticket.subject}
                            </h4>
                            <Badge variant="outline" className="text-xs">
                              {ticket.category === "technical" ? "تقني" :
                               ticket.category === "payment" ? "الدفع" :
                               ticket.category === "account" ? "الحساب" :
                               ticket.category === "project" ? "المشاريع" : "عام"}
                            </Badge>
                          </div>
                          {getStatusBadge(ticket.status)}
                        </div>
                        <p className="text-sm text-slate-600 mb-2">
                          {ticket.description}
                        </p>
                        <p className="text-xs text-slate-400">
                          {new Date(ticket.created_date).toLocaleDateString('ar-SA')}
                        </p>
                        {ticket.support_responses && ticket.support_responses.length > 0 && (
                          <div className="mt-3 space-y-2">
                            {ticket.support_responses.map((response, idx) => (
                              <div key={idx} className="p-3 bg-blue-50 rounded border border-blue-200">
                                <p className="text-sm font-medium text-blue-900 mb-1">
                                  رد فريق الدعم:
                                </p>
                                <p className="text-sm text-blue-800">
                                  {response.message}
                                </p>
                              </div>
                            ))}
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