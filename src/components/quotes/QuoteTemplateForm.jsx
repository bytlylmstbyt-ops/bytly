import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Loader2, Save } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const CATEGORIES = [
  { value: "interior", label: "تصميم داخلي" },
  { value: "architecture", label: "معماري" },
  { value: "painting", label: "دهانات" },
  { value: "landscape", label: "تنسيق حدائق" },
  { value: "furniture", label: "أثاث" },
  { value: "lighting", label: "إضاءة" },
  { value: "general", label: "عام" },
];

export default function QuoteTemplateForm({ open, onOpenChange, template, onSaved }) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState(
    template || {
      name: "",
      template_type: "quote",
      category: "general",
      project_title: "",
      scope_of_work: "",
      deliverables: [],
      estimated_budget: 0,
      estimated_duration_days: 0,
      terms_and_conditions: "",
      is_shared: false,
      description: "",
    }
  );
  const [deliverablesText, setDeliverablesText] = useState(
    template?.deliverables?.join("\n") || ""
  );

  React.useEffect(() => {
    if (template) {
      setForm(template);
      setDeliverablesText(template.deliverables?.join("\n") || "");
    } else {
      setForm({
        name: "", template_type: "quote", category: "general",
        project_title: "", scope_of_work: "", deliverables: [],
        estimated_budget: 0, estimated_duration_days: 0,
        terms_and_conditions: "", is_shared: false, description: "",
      });
      setDeliverablesText("");
    }
  }, [template, open]);

  const handleSave = async () => {
    if (!form.name?.trim()) {
      toast({ title: "أدخل اسم القالب", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const deliverables = deliverablesText
        .split("\n")
        .map(d => d.trim())
        .filter(Boolean);

      const payload = {
        ...form,
        deliverables,
        estimated_budget: Number(form.estimated_budget) || 0,
        estimated_duration_days: Number(form.estimated_duration_days) || 0,
      };

      if (template?.id) {
        await base44.entities.QuoteTemplate.update(template.id, payload);
        toast({ title: "تم تحديث القالب" });
      } else {
        await base44.entities.QuoteTemplate.create(payload);
        toast({ title: "تم إنشاء القالب" });
      }
      onSaved?.();
      onOpenChange(false);
    } catch (e) {
      toast({ title: "فشل الحفظ", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{template ? "تعديل القالب" : "قالب جديد"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">اسم القالب *</Label>
              <Input
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder="مثال: تصميم داخلي لفيلا"
                className="text-sm mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">النوع</Label>
              <select
                value={form.template_type}
                onChange={e => setForm({ ...form, template_type: e.target.value })}
                className="w-full h-9 text-sm border border-slate-200 rounded-md px-2 mt-1"
              >
                <option value="quote">عرض سعر</option>
                <option value="project">مشروع</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">التصنيف</Label>
              <select
                value={form.category}
                onChange={e => setForm({ ...form, category: e.target.value })}
                className="w-full h-9 text-sm border border-slate-200 rounded-md px-2 mt-1"
              >
                {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <Label className="text-xs">عنوان المشروع الافتراضي</Label>
              <Input
                value={form.project_title || ""}
                onChange={e => setForm({ ...form, project_title: e.target.value })}
                placeholder="عنوان افتراضي يظهر للعميل"
                className="text-sm mt-1"
              />
            </div>
          </div>

          <div>
            <Label className="text-xs">نطاق العمل</Label>
            <Textarea
              value={form.scope_of_work || ""}
              onChange={e => setForm({ ...form, scope_of_work: e.target.value })}
              rows={3}
              placeholder="وصف تفصيلي لنطاق العمل..."
              className="text-sm mt-1"
            />
          </div>

          <div>
            <Label className="text-xs">المخرجات (سطر لكل بند)</Label>
            <Textarea
              value={deliverablesText}
              onChange={e => setDeliverablesText(e.target.value)}
              rows={4}
              placeholder={"مثال:\nمخطط معماري ثلاثي الأبعاد\nمخطط تنفيذي\nتقرير فني"}
              className="text-sm mt-1"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">الميزانية التقديرية (ريال)</Label>
              <Input
                type="number"
                value={form.estimated_budget}
                onChange={e => setForm({ ...form, estimated_budget: e.target.value })}
                className="text-sm mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">المدة المقدرة (أيام)</Label>
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
              rows={3}
              placeholder="شروط الدفع، الضمان، إلخ..."
              className="text-sm mt-1"
            />
          </div>

          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
            <Switch
              checked={form.is_shared}
              onCheckedChange={v => setForm({ ...form, is_shared: v })}
            />
            <div>
              <p className="text-sm font-medium text-slate-700">قالب مشترك</p>
              <p className="text-xs text-slate-500">متاح لجميع المهندسين على المنصة</p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>إلغاء</Button>
          <Button onClick={handleSave} disabled={loading} className="bg-[#C9A66B] text-white hover:bg-[#B8965B]">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            حفظ
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}