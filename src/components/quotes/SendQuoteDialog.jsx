import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Loader2, Send, FileText, Check, ChevronLeft, Share2, Clock, DollarSign, Package } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export default function SendQuoteDialog({ open, onOpenChange, conversation, user, onSent }) {
  const { toast } = useToast();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [form, setForm] = useState({});

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const data = await base44.entities.QuoteTemplate.list("-updated_date");
      setTemplates(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      loadTemplates();
      setSelectedTemplate(null);
    }
  }, [open]);

  const selectTemplate = (tpl) => {
    setSelectedTemplate(tpl);
    setForm({
      project_title: tpl.project_title || "",
      scope_of_work: tpl.scope_of_work || "",
      deliverables: (tpl.deliverables || []).join("\n"),
      estimated_budget: tpl.estimated_budget || 0,
      estimated_duration_days: tpl.estimated_duration_days || 0,
      terms_and_conditions: tpl.terms_and_conditions || "",
    });
  };

  const handleSend = async () => {
    if (!conversation || !user) return;
    setSending(true);
    try {
      const deliverables = (form.deliverables || "")
        .split("\n")
        .map(d => d.trim())
        .filter(Boolean);

      const budget = Number(form.estimated_budget) || 0;
      const duration = Number(form.estimated_duration_days) || 0;

      const lines = [
        "📋 عرض سعر / مشروع",
        "",
        `📌 العنوان: ${form.project_title || "—"}`
      ];
      if (form.scope_of_work?.trim()) {
        lines.push("", "📝 نطاق العمل:", form.scope_of_work.trim());
      }
      if (deliverables.length > 0) {
        lines.push("", "📦 المخرجات:", ...deliverables.map((d, i) => `   ${i + 1}. ${d}`));
      }
      if (budget > 0) {
        lines.push("", `💰 الميزانية التقديرية: ${budget.toLocaleString()} ريال سعودي`);
      }
      if (duration > 0) {
        lines.push(`⏱️ المدة المقدرة: ${duration} يوم`);
      }
      if (form.terms_and_conditions?.trim()) {
        lines.push("", "📋 الشروط والأحكام:", form.terms_and_conditions.trim());
      }
      lines.push("", "—", "للاستفسار أو الموافقة، يرجى الرد على هذه الرسالة.");

      const content = lines.join("\n");

      const message = await base44.entities.Message.create({
        conversation_id: conversation.id,
        project_id: conversation.project_id || "direct",
        sender_email: user.email,
        sender_name: user.full_name,
        content,
      });

      await base44.entities.Conversation.update(conversation.id, {
        last_message: "📋 عرض سعر / مشروع",
        last_message_date: new Date().toISOString(),
      });

      // Increment template usage count
      if (selectedTemplate?.id) {
        try {
          await base44.entities.QuoteTemplate.update(selectedTemplate.id, {
            usage_count: (selectedTemplate.usage_count || 0) + 1,
          });
        } catch (_) { /* non-critical */ }
      }

      toast({ title: "تم إرسال العرض للعميل" });
      onSent?.(message);
      onOpenChange(false);
    } catch (e) {
      toast({ title: "فشل الإرسال", description: e.message, variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  const recipientName = conversation?.name || "العميل";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="w-5 h-5 text-[#C9A66B]" />
            إرسال عرض للعميل: {recipientName}
          </DialogTitle>
        </DialogHeader>

        {!selectedTemplate ? (
          /* Template selection */
          <div className="py-2">
            {loading ? (
              <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-[#C9A66B]" /></div>
            ) : templates.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <FileText className="w-10 h-10 mx-auto mb-2 opacity-40" />
                <p className="text-sm">لا توجد قوالب بعد. أنشئ قالباً من صفحة القوالب.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[50vh] overflow-y-auto">
                {templates.map(tpl => (
                  <Card
                    key={tpl.id}
                    className="border-slate-200 cursor-pointer hover:border-[#C9A66B] hover:shadow-sm transition-all"
                    onClick={() => selectTemplate(tpl)}
                  >
                    <CardContent className="p-3 flex items-start gap-3">
                      <div className="w-9 h-9 rounded-lg bg-[#FEF9EE] flex items-center justify-center shrink-0">
                        <FileText className="w-4 h-4 text-[#C9A66B]" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-[#4A3F35] text-sm truncate">{tpl.name}</h4>
                          <Badge className={tpl.template_type === "quote" ? "bg-blue-100 text-blue-700 text-xs" : "bg-purple-100 text-purple-700 text-xs"}>
                            {tpl.template_type === "quote" ? "عرض سعر" : "مشروع"}
                          </Badge>
                        </div>
                        {tpl.project_title && <p className="text-xs text-slate-500 truncate">{tpl.project_title}</p>}
                        <div className="flex items-center gap-3 mt-1 flex-wrap text-xs text-slate-400">
                          {tpl.is_shared && <span className="flex items-center gap-1 text-[#C9A66B]"><Share2 className="w-3 h-3" />مشترك</span>}
                          {tpl.estimated_budget > 0 && <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" />{tpl.estimated_budget.toLocaleString()}</span>}
                          {tpl.estimated_duration_days > 0 && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{tpl.estimated_duration_days} يوم</span>}
                          {tpl.deliverables?.length > 0 && <span className="flex items-center gap-1"><Package className="w-3 h-3" />{tpl.deliverables.length}</span>}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Edit & send */
          <div className="py-2 space-y-3">
            <button
              onClick={() => setSelectedTemplate(null)}
              className="flex items-center gap-1 text-xs text-slate-500 hover:text-[#C9A66B]"
            >
              <ChevronLeft className="w-3.5 h-3.5" />العودة للقوالب
            </button>

            <div className="flex items-center gap-2 p-2 bg-[#FEF9EE] rounded-lg">
              <Check className="w-4 h-4 text-[#C9A66B]" />
              <span className="text-xs text-slate-600">القالب: <strong>{selectedTemplate.name}</strong> — عدّل التفاصيل قبل الإرسال</span>
            </div>

            <div>
              <Label className="text-xs">عنوان المشروع</Label>
              <Input
                value={form.project_title || ""}
                onChange={e => setForm({ ...form, project_title: e.target.value })}
                className="text-sm mt-1"
              />
            </div>

            <div>
              <Label className="text-xs">نطاق العمل</Label>
              <Textarea
                value={form.scope_of_work || ""}
                onChange={e => setForm({ ...form, scope_of_work: e.target.value })}
                rows={3}
                className="text-sm mt-1"
              />
            </div>

            <div>
              <Label className="text-xs">المخرجات (سطر لكل بند)</Label>
              <Textarea
                value={form.deliverables || ""}
                onChange={e => setForm({ ...form, deliverables: e.target.value })}
                rows={4}
                className="text-sm mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">الميزانية (ريال)</Label>
                <Input
                  type="number"
                  value={form.estimated_budget}
                  onChange={e => setForm({ ...form, estimated_budget: e.target.value })}
                  className="text-sm mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">المدة (أيام)</Label>
                <Input
                  type="number"
                  value={form.estimated_duration_days}
                  onChange={e => setForm({ ...form, estimated_duration_days: e.target.value })}
                  className="text-sm mt-1"
                />
              </div>
            </div>

            <div>
              <Label className="text-xs">الشروط والأحكام</Label>
              <Textarea
                value={form.terms_and_conditions || ""}
                onChange={e => setForm({ ...form, terms_and_conditions: e.target.value })}
                rows={2}
                className="text-sm mt-1"
              />
            </div>
          </div>
        )}

        {selectedTemplate && (
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>إلغاء</Button>
            <Button onClick={handleSend} disabled={sending} className="bg-[#C9A66B] text-white hover:bg-[#B8965B]">
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              إرسال للعميل
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}