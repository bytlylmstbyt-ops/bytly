import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Building2, Flame, Zap, Droplets, Wrench, BookOpen,
  ChevronDown, ChevronUp, CheckCircle2, ExternalLink, Search, ShieldCheck
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

const SBC_CATEGORIES = [
  {
    code: "SBC 201",
    title: "الاشتراطات الإدارية",
    icon: BookOpen,
    color: "bg-slate-100 text-slate-700",
    description: "الاشتراطات الإدارية العامة لرخص البناء",
    standards: [
      { code: "SBC 201", name: "الاشتراطات الإدارية", scope: "إجراءات الترخيص، الوثائق المطلوبة، المخططات", mandatory: true },
    ]
  },
  {
    code: "SBC 301",
    title: "الأحمال والقوى الإنشائية",
    icon: Building2,
    color: "bg-blue-100 text-blue-700",
    description: "تحديد الأحمال الإنشائية للمباني والمنشآت",
    standards: [
      { code: "SBC 301", name: "الأحمال الإنشائية", scope: "الأحمال الميتة والحية، أحمال الرياح، أحمال الزلازل", mandatory: true },
      { code: "SBC 302", name: "المنشآت الخرسانية", scope: "تصميم وفق ACI 318، متطلبات التسليح، تغطية الخرسانة", mandatory: true },
      { code: "SBC 303", name: "المنشآت المعدنية", scope: "تصميم المنشآت الحديدية، لحامات، وصلات", mandatory: true },
      { code: "SBC 304", name: "المنشآت الخشبية", scope: "تصميم المنشآت الخشبية، معالجة الحريق", mandatory: false },
      { code: "SBC 305", name: "الأساسات والتربة", scope: "نوع الأساس، فحص التربة، أعماق الحفر", mandatory: true },
    ]
  },
  {
    code: "SBC 401",
    title: "التصميم المعماري",
    icon: Building2,
    color: "bg-indigo-100 text-indigo-700",
    description: "اشتراطات التصميم المعماري والفراغات",
    standards: [
      { code: "SBC 401", name: "التصميم المعماري", scope: "الارتفاعات، الارتدادات، نسب البناء، الإضاءة الطبيعية", mandatory: true },
      { code: "SBC 402", name: "إمكانية الوصول", scope: "مسارات ذوي الاحتياجات الخاصة، مصاعد، منحدرات", mandatory: true },
    ]
  },
  {
    code: "SBC 501",
    title: "الأنظمة الكهربائية",
    icon: Zap,
    color: "bg-purple-100 text-purple-700",
    description: "اشتراطات التمديدات والأنظمة الكهربائية",
    standards: [
      { code: "SBC 501", name: "الأنظمة الكهربائية", scope: "لوحات التوزيع، التأريض، الحماية من الصواعق", mandatory: true },
      { code: "SBC 502", name: "الإنذار والحريق", scope: "أنظمة الإنذار، كواشف الدخان، الطوارئ", mandatory: true },
    ]
  },
  {
    code: "SBC 601",
    title: "كفاءة استهلاك الطاقة",
    icon: Zap,
    color: "bg-yellow-100 text-yellow-700",
    description: "متطلبات كفاءة الطاقة في المباني",
    standards: [
      { code: "SBC 601", name: "كفاءة الطاقة", scope: "العزل الحراري، كفاءة التكييف، الإضاءة الموفرة", mandatory: true },
    ]
  },
  {
    code: "SBC 701",
    title: "السباكة والصرف",
    icon: Droplets,
    color: "bg-cyan-100 text-cyan-700",
    description: "أنظمة السباكة والصرف الصحي",
    standards: [
      { code: "SBC 701", name: "السباكة والصرف الصحي", scope: "مواسير المياه، خزانات، نظام الصرف", mandatory: true },
      { code: "SBC 702", name: "المياه والتهوية", scope: "جودة مياه الشرب، نظام التهوية", mandatory: true },
    ]
  },
  {
    code: "SBC 801",
    title: "الوقاية من الحريق",
    icon: Flame,
    color: "bg-red-100 text-red-700",
    description: "اشتراطات السلامة من الحريق",
    standards: [
      { code: "SBC 801", name: "الوقاية من الحريق", scope: "مخارج الطوارئ، أنظمة الرش، الإنذار، مقاومة الحريق", mandatory: true },
      { code: "SBC 802", name: "تجهيزات مكافحة الحريق", scope: "الطفايات، الرشاشات، خراطيم الإطفاء", mandatory: true },
    ]
  },
  {
    code: "SBC 901",
    title: "المواد والإنشاءات",
    icon: Wrench,
    color: "bg-orange-100 text-orange-700",
    description: "مواصفات مواد البناء وطرق الإنشاء",
    standards: [
      { code: "SBC 901", name: "مواد البناء", scope: "الخرسانة، الطوب، العزل، الدهانات", mandatory: true },
      { code: "SBC 902", name: "أعمال التشطيب", scope: "الجبس، البلاط، الأرضيات، الأبواب", mandatory: false },
    ]
  },
];

export default function SBCStandardsList() {
  const [expandedCat, setExpandedCat] = useState(null);
  const [search, setSearch] = useState("");

  const filteredCategories = SBC_CATEGORIES.map(cat => ({
    ...cat,
    standards: cat.standards.filter(s =>
      !search ||
      s.code?.toLowerCase().includes(search.toLowerCase()) ||
      s.name?.includes(search) ||
      s.scope?.includes(search)
    )
  })).filter(cat => cat.standards.length > 0);

  const totalStandards = SBC_CATEGORIES.reduce((sum, cat) => sum + cat.standards.length, 0);
  const mandatoryCount = SBC_CATEGORIES.reduce((sum, cat) => sum + cat.standards.filter(s => s.mandatory).length, 0);

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card className="border-[#C9A66B]/20 bg-gradient-to-l from-[#4A3F35] to-[#6B5D4F] text-white border-0">
        <CardContent className="p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 bg-white/10 rounded-lg">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold">قائمة معايير كود البناء السعودي (SBC)</h2>
              <p className="text-white/70 text-sm">دليل مرجعي شامل لجميع معايير SBC مصنفة حسب التخصص</p>
            </div>
          </div>
          <div className="flex gap-4 mt-3">
            <div className="bg-white/10 rounded-lg px-4 py-2 text-center">
              <p className="text-2xl font-bold">{totalStandards}</p>
              <p className="text-xs text-white/70">معيار إجمالي</p>
            </div>
            <div className="bg-white/10 rounded-lg px-4 py-2 text-center">
              <p className="text-2xl font-bold">{mandatoryCount}</p>
              <p className="text-xs text-white/70">إلزامي</p>
            </div>
            <div className="bg-white/10 rounded-lg px-4 py-2 text-center">
              <p className="text-2xl font-bold">{SBC_CATEGORIES.length}</p>
              <p className="text-xs text-white/70">تصنيفات</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search */}
      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          placeholder="ابحث في معايير SBC (رقم المعيار، الاسم، النطاق)..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pr-9"
        />
      </div>

      {/* Categories */}
      <div className="space-y-3">
        {filteredCategories.map((cat, idx) => {
          const isExpanded = expandedCat === cat.code;
          const Icon = cat.icon;
          return (
            <motion.div
              key={cat.code}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.03 }}
            >
              <Card className="overflow-hidden border-slate-200 shadow-sm">
                <button
                  onClick={() => setExpandedCat(isExpanded ? null : cat.code)}
                  className="w-full text-right p-4 hover:bg-slate-50 transition-colors flex items-center gap-3"
                >
                  <div className={`p-2 rounded-lg ${cat.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-[#4A3F35]">{cat.code}</span>
                      <span className="text-slate-700 text-sm font-medium">{cat.title}</span>
                      <Badge variant="outline" className="text-xs">{cat.standards.length} معيار</Badge>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{cat.description}</p>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-slate-400 shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-slate-400 shrink-0" />
                  )}
                </button>

                {isExpanded && (
                  <div className="border-t bg-slate-50/50 p-3 space-y-2">
                    {cat.standards.map((std, i) => (
                      <div key={i} className="bg-white rounded-lg border border-slate-200 p-3 flex items-start gap-3">
                        <div className="flex-shrink-0 mt-0.5">
                          {std.mandatory ? (
                            <CheckCircle2 className="w-4 h-4 text-red-500" />
                          ) : (
                            <CheckCircle2 className="w-4 h-4 text-slate-300" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge className={`${cat.color} border-0 text-xs`}>{std.code}</Badge>
                            <span className="text-sm font-medium text-slate-800">{std.name}</span>
                            {std.mandatory && (
                              <Badge className="bg-red-100 text-red-700 border-0 text-xs">إلزامي</Badge>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 mt-1">{std.scope}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </motion.div>
          );
        })}
      </div>

      {filteredCategories.length === 0 && (
        <div className="text-center py-12 text-slate-400">
          <Search className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p className="text-sm">لا توجد معايير مطابقة للبحث</p>
        </div>
      )}

      {/* Footer note */}
      <div className="flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-700">
        <ExternalLink className="w-4 h-4 shrink-0 mt-0.5" />
        <p>المصدر الرسمي: <a href="https://sbcrs.sa" target="_blank" rel="noopener noreferrer" className="font-bold underline">النظام السعودي للكود الإنشائي (SBCRS)</a> — للاطلاع على النصوص الكاملة للمعايير، يرجى زيارة الموقع الرسمي.</p>
      </div>
    </div>
  );
}