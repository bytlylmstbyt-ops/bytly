import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Edit2, Trash2, FileText, LayoutGrid, Loader2, Share2, Clock, DollarSign, Package } from "lucide-react";
import QuoteTemplateForm from "@/components/quotes/QuoteTemplateForm";
import { useToast } from "@/components/ui/use-toast";
import moment from "moment";

const CATEGORY_LABELS = {
  interior: "تصميم داخلي", architecture: "معماري", painting: "دهانات",
  landscape: "تنسيق حدائق", furniture: "أثاث", lighting: "إضاءة", general: "عام",
};

export default function QuoteTemplates() {
  const { toast } = useToast();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);

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

  useEffect(() => { loadTemplates(); }, []);

  const handleDelete = async (id) => {
    if (!confirm("هل تريد حذف هذا القالب؟")) return;
    try {
      await base44.entities.QuoteTemplate.delete(id);
      toast({ title: "تم الحذف" });
      loadTemplates();
    } catch (e) {
      toast({ title: "فشل الحذف", variant: "destructive" });
    }
  };

  const filtered = templates.filter(t => {
    const q = search.toLowerCase();
    return !q || t.name?.toLowerCase().includes(q) || t.project_title?.toLowerCase().includes(q);
  });

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6" dir="rtl">
      <div className="max-w-6xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-xl font-bold text-[#4A3F35] flex items-center gap-2">
              <LayoutGrid className="w-5 h-5 text-[#C9A66B]" />
              قوالب العروض والمشاريع
            </h1>
            <p className="text-sm text-slate-500 mt-1">أنشئ قوالب جاهزة وأرسلها للعملاء بسرعة من مركز الرسائل</p>
          </div>
          <Button
            onClick={() => { setEditingTemplate(null); setShowForm(true); }}
            className="bg-[#C9A66B] text-white hover:bg-[#B8965B] gap-1"
          >
            <Plus className="w-4 h-4" /> قالب جديد
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="ابحث في القوالب..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pr-9 text-sm"
          />
        </div>

        {/* Grid */}
        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-[#C9A66B]" /></div>
        ) : filtered.length === 0 ? (
          <Card><CardContent className="text-center py-16 text-slate-400">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p className="text-sm">لا توجد قوالب بعد. أنشئ أول قالب الآن!</p>
          </CardContent></Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filtered.map(tpl => (
              <Card key={tpl.id} className="border-slate-200 hover:shadow-md transition-shadow">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-[#4A3F35] text-sm truncate">{tpl.name}</h3>
                      {tpl.project_title && <p className="text-xs text-slate-500 truncate mt-0.5">{tpl.project_title}</p>}
                    </div>
                    <Badge className={tpl.template_type === "quote" ? "bg-blue-100 text-blue-700 text-xs" : "bg-purple-100 text-purple-700 text-xs"}>
                      {tpl.template_type === "quote" ? "عرض سعر" : "مشروع"}
                    </Badge>
                  </div>

                  {tpl.scope_of_work && (
                    <p className="text-xs text-slate-600 line-clamp-2">{tpl.scope_of_work}</p>
                  )}

                  <div className="flex items-center gap-3 flex-wrap text-xs text-slate-500">
                    {tpl.category && <Badge variant="outline" className="text-xs">{CATEGORY_LABELS[tpl.category] || tpl.category}</Badge>}
                    {tpl.is_shared && <span className="flex items-center gap-1 text-[#C9A66B]"><Share2 className="w-3 h-3" />مشترك</span>}
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{tpl.usage_count || 0} استخدام</span>
                  </div>

                  {(tpl.estimated_budget > 0 || tpl.estimated_duration_days > 0) && (
                    <div className="flex items-center gap-3 text-xs">
                      {tpl.estimated_budget > 0 && (
                        <span className="flex items-center gap-1 text-green-600"><DollarSign className="w-3 h-3" />{tpl.estimated_budget.toLocaleString()} ر.س</span>
                      )}
                      {tpl.estimated_duration_days > 0 && (
                        <span className="flex items-center gap-1 text-slate-600"><Package className="w-3 h-3" />{tpl.estimated_duration_days} يوم</span>
                      )}
                    </div>
                  )}

                  {tpl.deliverables?.length > 0 && (
                    <div className="text-xs text-slate-500">
                      <span className="flex items-center gap-1 mb-1"><Package className="w-3 h-3" />{tpl.deliverables.length} مخرجات</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                    <Button size="sm" variant="ghost" className="h-8 text-xs"
                      onClick={() => { setEditingTemplate(tpl); setShowForm(true); }}>
                      <Edit2 className="w-3.5 h-3.5" />تعديل
                    </Button>
                    <Button size="sm" variant="ghost" className="h-8 text-xs text-red-500 mr-auto"
                      onClick={() => handleDelete(tpl.id)}>
                      <Trash2 className="w-3.5 h-3.5" />حذف
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <QuoteTemplateForm
        open={showForm}
        onOpenChange={setShowForm}
        template={editingTemplate}
        onSaved={loadTemplates}
      />
    </div>
  );
}