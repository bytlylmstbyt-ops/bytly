import React, { useState } from "react";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CheckCircle2, Loader2, FileText, ShieldCheck, Clock } from "lucide-react";

const PROJECT_TYPES = [
  { value: "residential", label: "سكني" },
  { value: "commercial", label: "تجاري" },
  { value: "industrial", label: "صناعي" },
  { value: "renovation", label: "ترميم" },
  { value: "interior", label: "تصميم داخلي" },
  { value: "landscape", label: "تنسيق خارجي" },
  { value: "other", label: "أخرى" },
];

/**
 * QuoteRequestFormSection — a visible, short price-quote form on the landing
 * page. On submit it creates a QuoteRequest record and shows a clear promise
 * of what happens next (response within 24h with offers from certified engineers).
 */
export default function QuoteRequestFormSection() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    projectType: "",
    description: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.name || !form.email || !form.projectType) {
      setError("يرجى تعبئة الاسم والبريد الإلكتروني ونوع المشروع.");
      return;
    }
    setSubmitting(true);
    try {
      const typeLabel =
        PROJECT_TYPES.find((p) => p.value === form.projectType)?.label ||
        form.projectType;
      await base44.entities.QuoteRequest.create({
        client_name: form.name,
        client_email: form.email,
        client_phone: form.phone || undefined,
        project_title: `طلب عرض سعر — ${typeLabel}`,
        project_type: form.projectType,
        project_description: form.description || undefined,
        description: form.description || undefined,
        status: "pending",
      });
      setDone(true);
    } catch (err) {
      console.error("QuoteRequest create error:", err);
      setError("تعذّر إرسال الطلب، يرجى المحاولة مرة أخرى.");
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <section className="py-20 bg-gradient-to-br from-slate-50 to-amber-50/30">
        <div className="max-w-xl mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl border border-emerald-200 shadow-sm p-8"
          >
            <div className="w-16 h-16 mx-auto rounded-full bg-emerald-50 flex items-center justify-center mb-4">
              <CheckCircle2 className="w-9 h-9 text-emerald-600" />
            </div>
            <h3 className="text-xl font-bold text-[#1a1a2e] mb-2">
              تم استلام طلب عرض السعر
            </h3>
            <p className="text-slate-600 mb-2">
              سيتواصل معك فريق بيتلي خلال 24 ساعة بعروض من مهندسين معتمدين مطابقة
              لمشروعك.
            </p>
            <p className="text-sm text-slate-400 mb-6">
              تحقق من بريدك الإلكتروني — سنرسل لك العروض والتسعيرات المبدئية.
            </p>
            <Button
              variant="outline"
              onClick={() => {
                setDone(false);
                setForm({ name: "", email: "", phone: "", projectType: "", description: "" });
              }}
              className="border-[#C9A66B] text-[#6B5D4F]"
            >
              إرسال طلب آخر
            </Button>
          </motion.div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 bg-gradient-to-br from-slate-50 via-white to-amber-50/30">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#C9A66B]/10 border border-[#C9A66B]/30 mb-4">
            <FileText className="w-4 h-4 text-[#C9A66B]" />
            <span className="text-[#6B5D4F] text-sm font-medium">طلب عرض سعر</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-[#1a1a2e] mb-2">
            احصل على عرض سعر لمشروعك الهندسي
          </h2>
          <p className="text-slate-500 max-w-xl mx-auto">
            عبّئ الحقول التالية وسيتواصل معك فريق بيتلي خلال 24 ساعة بعروض من
            مهندسين معتمدين.
          </p>
        </div>

        <motion.form
          onSubmit={handleSubmit}
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 md:p-8 space-y-4"
        >
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="qr-name">الاسم *</Label>
              <Input
                id="qr-name"
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="اسمك الكامل"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="qr-email">البريد الإلكتروني *</Label>
              <Input
                id="qr-email"
                type="email"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="qr-phone">رقم الهاتف</Label>
              <Input
                id="qr-phone"
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
                placeholder="05xxxxxxxx"
                inputMode="tel"
              />
            </div>
            <div className="space-y-1.5">
              <Label>نوع المشروع *</Label>
              <Select
                value={form.projectType}
                onValueChange={(v) => set("projectType", v)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="اختر نوع المشروع" />
                </SelectTrigger>
                <SelectContent>
                  {PROJECT_TYPES.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="qr-desc">وصف مختصر للمشروع</Label>
            <Textarea
              id="qr-desc"
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="مثال: فيلا سكنية 400 م²، دورين، تصميم معماري وإنشائي..."
              rows={3}
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          {/* Post-submission promise */}
          <div className="grid sm:grid-cols-3 gap-3 pt-2">
            <div className="flex items-start gap-2 text-xs text-slate-600">
              <Clock className="w-4 h-4 text-[#C9A66B] shrink-0 mt-0.5" />
              <span>رد خلال 24 ساعة بعروض مهندسين معتمدين.</span>
            </div>
            <div className="flex items-start gap-2 text-xs text-slate-600">
              <ShieldCheck className="w-4 h-4 text-[#C9A66B] shrink-0 mt-0.5" />
              <span>أموالك محمية بالضمان ولا تُحرَّر قبل اعتمادك.</span>
            </div>
            <div className="flex items-start gap-2 text-xs text-slate-600">
              <FileText className="w-4 h-4 text-[#C9A66B] shrink-0 mt-0.5" />
              <span>تستلم عروضاً مقارنة بأسعار ومدد واضحة.</span>
            </div>
          </div>

          <Button
            type="submit"
            disabled={submitting}
            className="w-full bg-gradient-to-r from-[#6B5D4F] to-[#C9A66B] text-white hover:opacity-90"
            style={{ minHeight: 48 }}
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                جاري الإرسال...
              </>
            ) : (
              "اطلب عرض السعر الآن"
            )}
          </Button>
        </motion.form>
      </div>
    </section>
  );
}