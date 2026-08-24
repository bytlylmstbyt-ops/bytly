import React, { useState } from "react";
import { MapPin, DollarSign, Briefcase, Clock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const PROJECT_TYPES = [
  { value: "residential", label: "سكني 🏠", desc: "فلل، شقق، منازل" },
  { value: "commercial", label: "تجاري 🏢", desc: "مكاتب، محلات، مراكز" },
  { value: "industrial", label: "صناعي 🏭", desc: "مصانع، مستودعات" },
  { value: "renovation", label: "ترميم 🔨", desc: "تجديد وإعادة تأهيل" },
  { value: "interior", label: "تصميم داخلي 🛋️", desc: "ديكور وتأثيث" },
  { value: "landscape", label: "مناظر طبيعية 🌿", desc: "حدائق وفضاءات خارجية" },
  { value: "other", label: "أخرى ✨", desc: "مشاريع متنوعة" },
];

const BUDGET_RANGES = [
  { value: "50000", label: "أقل من 50,000 ر.س" },
  { value: "100000", label: "50,000 - 100,000 ر.س" },
  { value: "300000", label: "100,000 - 300,000 ر.س" },
  { value: "500000", label: "300,000 - 500,000 ر.س" },
  { value: "1000000", label: "500,000 - 1,000,000 ر.س" },
  { value: "5000000", label: "أكثر من 1,000,000 ر.س" },
];

export default function MatchForm({ onSearch, isLoading }) {
  const [form, setForm] = useState({
    project_type: "",
    budget: "",
    location: "",
    years_experience_min: 0,
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.project_type) return;
    onSearch(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Project Type */}
      <div>
        <Label className="text-base font-semibold text-slate-700 mb-3 block">
          <Briefcase className="w-4 h-4 inline ml-2 text-[#C9A66B]" />
          نوع المشروع <span className="text-red-400">*</span>
        </Label>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {PROJECT_TYPES.map(type => (
            <button
              key={type.value}
              type="button"
              onClick={() => setForm(f => ({ ...f, project_type: type.value }))}
              className={`p-3 rounded-xl border-2 text-right transition-all ${
                form.project_type === type.value
                  ? "border-[#C9A66B] bg-amber-50 text-[#6B5D4F]"
                  : "border-slate-200 hover:border-slate-300 bg-white text-slate-600"
              }`}
            >
              <div className="font-medium text-sm">{type.label}</div>
              <div className="text-xs text-slate-400 mt-0.5">{type.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Budget */}
      <div>
        <Label className="text-base font-semibold text-slate-700 mb-3 block">
          <DollarSign className="w-4 h-4 inline ml-2 text-[#C9A66B]" />
          الميزانية التقريبية
        </Label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {BUDGET_RANGES.map(range => (
            <button
              key={range.value}
              type="button"
              onClick={() => setForm(f => ({ ...f, budget: range.value }))}
              className={`px-3 py-2.5 rounded-xl border-2 text-sm text-right transition-all ${
                form.budget === range.value
                  ? "border-[#C9A66B] bg-amber-50 text-[#6B5D4F] font-medium"
                  : "border-slate-200 hover:border-slate-300 bg-white text-slate-600"
              }`}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>

      {/* Location */}
      <div>
        <Label className="text-base font-semibold text-slate-700 mb-3 block">
          <MapPin className="w-4 h-4 inline ml-2 text-[#C9A66B]" />
          الموقع الجغرافي
        </Label>
        <Input
          placeholder="مثال: الرياض، جدة، الدمام..."
          value={form.location}
          onChange={(e) => setForm(f => ({ ...f, location: e.target.value }))}
          className="h-11 text-right"
        />
      </div>

      {/* Experience */}
      <div>
        <Label className="text-base font-semibold text-slate-700 mb-3 block">
          <Clock className="w-4 h-4 inline ml-2 text-[#C9A66B]" />
          الحد الأدنى من سنوات الخبرة: <span className="text-[#C9A66B] font-bold">{form.years_experience_min} سنة</span>
        </Label>
        <div className="flex items-center gap-3">
          {[0, 2, 5, 10, 15].map(yr => (
            <button
              key={yr}
              type="button"
              onClick={() => setForm(f => ({ ...f, years_experience_min: yr }))}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                form.years_experience_min === yr
                  ? "bg-[#6B5D4F] text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {yr === 0 ? "أي خبرة" : `${yr}+`}
            </button>
          ))}
        </div>
      </div>

      <Button
        type="submit"
        disabled={!form.project_type || isLoading}
        className="w-full h-14 text-base font-bold bg-gradient-to-r from-[#1a1a2e] via-[#6B5D4F] to-[#C9A66B] text-white rounded-2xl hover:opacity-90 transition-all shadow-lg disabled:opacity-50"
      >
        {isLoading ? (
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            جاري البحث عن أفضل المهندسين...
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            ابحث عن المهندس الأنسب
          </div>
        )}
      </Button>
    </form>
  );
}