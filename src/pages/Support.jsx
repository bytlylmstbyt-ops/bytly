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
import { useLanguage } from "@/components/i18n/LanguageContext";

const STATUS_ICONS = { open: AlertCircle, in_progress: Clock, waiting_customer: Clock, resolved: CheckCircle, closed: CheckCircle };

export default function SupportPage() {
  const { t, isRTL, language } = useLanguage();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [tickets, setTickets] = useState([]);
  const [formData, setFormData] = useState({ category: "", subject: "", description: "", attachments: [] });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const userData = await base44.auth.me();
      setUser(userData);
      const userTickets = await base44.entities.SupportTicket.filter({ user_id: userData.email }, "-created_date");
      setTickets(userTickets);
    } catch (error) { console.error("Error loading data:", error); }
    finally { setLoading(false); }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData({ ...formData, attachments: [...formData.attachments, file_url] });
    } catch (error) { console.error("Error uploading file:", error); alert(t('supportPage.uploadError')); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await base44.entities.SupportTicket.create({ ...formData, user_id: user.email });
      alert(t('supportPage.successMsg'));
      setFormData({ category: "", subject: "", description: "", attachments: [] });
      loadData();
    } catch (error) { console.error("Error submitting ticket:", error); alert(t('supportPage.errorMsg')); }
    finally { setSubmitting(false); }
  };

  const getStatusBadge = (status) => {
    const statuses = t('supportPage.statuses') || {};
    const colorMap = {
      open: "bg-blue-100 text-blue-800",
      in_progress: "bg-amber-100 text-amber-800",
      waiting_customer: "bg-purple-100 text-purple-800",
      resolved: "bg-green-100 text-green-800",
      closed: "bg-gray-100 text-gray-800"
    };
    const Icon = STATUS_ICONS[status] || AlertCircle;
    return (
      <Badge className={colorMap[status] || colorMap.open}>
        <Icon className="w-3 h-3 ml-1" />
        {statuses[status] || status}
      </Badge>
    );
  };

  const categories = t('supportPage.categories') || {};

  return (
    <div className="min-h-screen py-8 px-4" dir={isRTL ? "rtl" : "ltr"}>
      <div className="max-w-6xl mx-auto space-y-6">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
          <Headphones className="w-16 h-16 text-[#C9A66B] mx-auto mb-4" />
          <h1 className="text-3xl font-bold gradient-text mb-2">{t('supportPage.title')}</h1>
          <p className="text-slate-600">{t('supportPage.subtitle')}</p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <Card>
              <CardHeader><CardTitle>{t('supportPage.formTitle')}</CardTitle></CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="category">{t('supportPage.categoryLabel')}</Label>
                    <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })} required>
                      <SelectTrigger><SelectValue placeholder={t('supportPage.categoryPlaceholder')} /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(categories).map(([val, label]) => (
                          <SelectItem key={val} value={val}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="subject">{t('supportPage.subject')}</Label>
                    <Input id="subject" required value={formData.subject} onChange={(e) => setFormData({ ...formData, subject: e.target.value })} placeholder={t('supportPage.subjectPlaceholder')} />
                  </div>

                  <div>
                    <Label htmlFor="description">{t('supportPage.description')}</Label>
                    <Textarea id="description" required value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={6} placeholder={t('supportPage.descriptionPlaceholder')} />
                  </div>

                  <div>
                    <Label>{t('supportPage.attachments')}</Label>
                    <input type="file" id="attachments" onChange={handleFileUpload} className="hidden" accept="image/*" />
                    <Button type="button" variant="outline" onClick={() => document.getElementById('attachments').click()} className="w-full">
                      <Upload className="w-4 h-4 ml-2" /> {t('supportPage.uploadImage')}
                    </Button>
                    {formData.attachments.length > 0 && (
                      <p className="text-sm text-green-600 mt-2">{t('supportPage.uploadedCount').replace('{count}', formData.attachments.length)}</p>
                    )}
                  </div>

                  <Button type="submit" disabled={submitting} className="w-full bg-gradient-to-r from-blue-600 to-indigo-600">
                    {submitting ? (
                      <><Loader2 className="w-5 h-5 animate-spin ml-2" /> {t('supportPage.submitting')}</>
                    ) : (
                      <><Send className="w-5 h-5 ml-2" /> {t('supportPage.submit')}</>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <Card>
              <CardHeader><CardTitle>{t('supportPage.previousTitle')}</CardTitle></CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8"><Loader2 className="w-8 h-8 animate-spin text-[#C9A66B] mx-auto" /></div>
                ) : tickets.length === 0 ? (
                  <div className="text-center py-8">
                    <Headphones className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500">{t('supportPage.emptyPrevious')}</p>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-[550px] overflow-y-auto">
                    {tickets.map((ticket) => (
                      <div key={ticket.id} className="p-4 rounded-lg border bg-slate-50">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="font-semibold text-slate-900 mb-1">{ticket.subject}</h4>
                            <Badge variant="outline" className="text-xs">{categories[ticket.category] || ticket.category}</Badge>
                          </div>
                          {getStatusBadge(ticket.status)}
                        </div>
                        <p className="text-sm text-slate-600 mb-2">{ticket.description}</p>
                        <p className="text-xs text-slate-400">{new Date(ticket.created_date).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US')}</p>
                        {ticket.support_responses && ticket.support_responses.length > 0 && (
                          <div className="mt-3 space-y-2">
                            {ticket.support_responses.map((response, idx) => (
                              <div key={idx} className="p-3 bg-blue-50 rounded border border-blue-200">
                                <p className="text-sm font-medium text-blue-900 mb-1">{t('supportPage.responseLabel')}</p>
                                <p className="text-sm text-blue-800">{response.message}</p>
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