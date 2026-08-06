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
import { useLanguage } from "@/components/i18n/LanguageContext";

const STATUS_ICONS = { pending: Clock, in_review: Clock, resolved: CheckCircle, closed: CheckCircle };

export default function ComplaintsPage() {
  const { t, isRTL, language } = useLanguage();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [complaints, setComplaints] = useState([]);
  const [formData, setFormData] = useState({ type: "", subject: "", description: "", attachments: [] });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const userData = await base44.auth.me();
      setUser(userData);
      const userComplaints = await base44.entities.Complaint.filter({ user_id: userData.email }, "-created_date");
      setComplaints(userComplaints);
    } catch (error) { console.error("Error loading data:", error); }
    finally { setLoading(false); }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData({ ...formData, attachments: [...formData.attachments, file_url] });
    } catch (error) { console.error("Error uploading file:", error); alert(t('complaintsPage.uploadError')); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await base44.entities.Complaint.create({ ...formData, user_id: user.email });
      alert(t('complaintsPage.successMsg'));
      setFormData({ type: "", subject: "", description: "", attachments: [] });
      loadData();
    } catch (error) { console.error("Error submitting complaint:", error); alert(t('complaintsPage.errorMsg')); }
    finally { setSubmitting(false); }
  };

  const getStatusBadge = (status) => {
    const statuses = t('complaintsPage.statuses') || {};
    const colorMap = {
      pending: "bg-amber-100 text-amber-800",
      in_review: "bg-blue-100 text-blue-800",
      resolved: "bg-green-100 text-green-800",
      closed: "bg-gray-100 text-gray-800"
    };
    const Icon = STATUS_ICONS[status] || Clock;
    return (
      <Badge className={colorMap[status] || colorMap.pending}>
        <Icon className="w-3 h-3 ml-1" />
        {statuses[status] || status}
      </Badge>
    );
  };

  const types = t('complaintsPage.types') || {};

  return (
    <div className="min-h-screen py-8 px-4" dir={isRTL ? "rtl" : "ltr"}>
      <div className="max-w-5xl mx-auto space-y-6">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
          <MessageSquare className="w-16 h-16 text-[#C9A66B] mx-auto mb-4" />
          <h1 className="text-3xl font-bold gradient-text mb-2">{t('complaintsPage.title')}</h1>
          <p className="text-slate-600">{t('complaintsPage.subtitle')}</p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <Card>
              <CardHeader><CardTitle>{t('complaintsPage.formTitle')}</CardTitle></CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="type">{t('complaintsPage.type')}</Label>
                    <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })} required>
                      <SelectTrigger><SelectValue placeholder={t('complaintsPage.typePlaceholder')} /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(types).map(([val, label]) => (
                          <SelectItem key={val} value={val}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="subject">{t('complaintsPage.subject')}</Label>
                    <Input id="subject" required value={formData.subject} onChange={(e) => setFormData({ ...formData, subject: e.target.value })} placeholder={t('complaintsPage.subjectPlaceholder')} />
                  </div>

                  <div>
                    <Label htmlFor="description">{t('complaintsPage.details')}</Label>
                    <Textarea id="description" required value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={5} placeholder={t('complaintsPage.detailsPlaceholder')} />
                  </div>

                  <div>
                    <Label>{t('complaintsPage.attachments')}</Label>
                    <input type="file" id="attachments" onChange={handleFileUpload} className="hidden" />
                    <Button type="button" variant="outline" onClick={() => document.getElementById('attachments').click()} className="w-full">
                      <Upload className="w-4 h-4 ml-2" /> {t('complaintsPage.uploadFile')}
                    </Button>
                    {formData.attachments.length > 0 && (
                      <p className="text-sm text-green-600 mt-2">{t('complaintsPage.uploadedCount').replace('{count}', formData.attachments.length)}</p>
                    )}
                  </div>

                  <Button type="submit" disabled={submitting} className="w-full bg-gradient-to-r from-[#1a1a2e] to-[#C9A66B]">
                    {submitting ? (
                      <><Loader2 className="w-5 h-5 animate-spin ml-2" /> {t('complaintsPage.submitting')}</>
                    ) : (
                      <><Send className="w-5 h-5 ml-2" /> {t('complaintsPage.submit')}</>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <Card>
              <CardHeader><CardTitle>{t('complaintsPage.previousTitle')}</CardTitle></CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8"><Loader2 className="w-8 h-8 animate-spin text-[#C9A66B] mx-auto" /></div>
                ) : complaints.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500">{t('complaintsPage.emptyPrevious')}</p>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-[500px] overflow-y-auto">
                    {complaints.map((complaint) => (
                      <div key={complaint.id} className="p-4 rounded-lg border bg-slate-50">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-semibold text-slate-900">{complaint.subject}</h4>
                          {getStatusBadge(complaint.status)}
                        </div>
                        <p className="text-sm text-slate-600 mb-2">{complaint.description}</p>
                        <p className="text-xs text-slate-400">{new Date(complaint.created_date).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US')}</p>
                        {complaint.admin_response && (
                          <div className="mt-3 p-3 bg-blue-50 rounded border border-blue-200">
                            <p className="text-sm font-medium text-blue-900 mb-1">{t('complaintsPage.adminResponse')}</p>
                            <p className="text-sm text-blue-800">{complaint.admin_response}</p>
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