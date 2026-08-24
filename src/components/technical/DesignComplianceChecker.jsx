import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Building2, Flame, Zap, Droplets, Wrench, BookOpen,
  CheckCircle2, Circle, AlertTriangle, ShieldCheck, ChevronDown, ChevronUp, FileCheck
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

const DISCIPLINES = [
  {
    key: "structural",
    label: "الهندسة الإنشائية",
    icon: Building2,
    color: "bg-blue-100 text-blue-700",
    items: [
      { standard: "SBC 301", requirement: "حساب الأحمال الميتة والحية والرياح والزلازل", details: "تحليل الأحمال وفق SBC 301 لجميع العناصر الإنشائية" },
      { standard: "SBC 302", requirement: "تصميم المنشآت الخرسانية وفق ACI 318", details: "نسب التسليح، تغطية الخرسانة، أقطار الأشرطة" },
      { standard: "SBC 303", requirement: "تصميم الوصلات واللحامات للمنشآت المعدنية", details: "فحوصات اللحام، مقاومة القص والشد" },
      { standard: "SBC 305", requirement: "تقرير فحص التربة وتصميم الأساسات", details: "نوع الأساس، أعماق الحفر، معالجة التربة الضعيفة" },
    ]
  },
  {
    key: "architectural",
    label: "التصميم المعماري",
    icon: BookOpen,
    color: "bg-indigo-100 text-indigo-700",
    items: [
      { standard: "SBC 401", requirement: "الالتزام بالارتفاعات والارتدادات ونسب البناء", details: "نسبة البناء المسموحة، ارتفاعات الطوابق" },
      { standard: "SBC 401", requirement: "توفير الإضاءة والتهوية الطبيعية", details: "مساحة النوافذ نسبة لمساحة الأرضية" },
      { standard: "SBC 402", requirement: "مسارات ومواصفات ذوي الاحتياجات الخاصة", details: "منحدرات، مصاعد، دورات مياه، مواقف" },
    ]
  },
  {
    key: "electrical",
    label: "الأنظمة الكهربائية",
    icon: Zap,
    color: "bg-purple-100 text-purple-700",
    items: [
      { standard: "SBC 501", requirement: "لوحات التوزيع والتأريض والحماية من الصواعق", details: "حساب الأحمال، مقاسات الكابلات، نظام التأريض" },
      { standard: "SBC 502", requirement: "أنظمة الإنذار وكواشف الدخان", details: "توزيع الكواشف، نظام الإنذار المرتبط بالحريق" },
    ]
  },
  {
    key: "energy",
    label: "كفاءة الطاقة",
    icon: Zap,
    color: "bg-yellow-100 text-yellow-700",
    items: [
      { standard: "SBC 601", requirement: "العزل الحراري للأسقف والجدران", details: "قيمة U-factor، سمك العزل المطلوب" },
      { standard: "SBC 601", requirement: "كفاءة أجهزة التكييف والإضاءة", details: "معدل SEER، الإضاءة LED" },
    ]
  },
  {
    key: "plumbing",
    label: "السباكة والصرف",
    icon: Droplets,
    color: "bg-cyan-100 text-cyan-700",
    items: [
      { standard: "SBC 701", requirement: "مواسير المياه والصرف الصحي", details: "أنواع المواسير المعتمدة، الأقطار" },
      { standard: "SBC 701", requirement: "أحجام خزانات المياه ومعدلات التدفق", details: "سعة الخزان، ضغط المياه" },
      { standard: "SBC 702", requirement: "جودة مياه الشرب ونظام التهوية", details: "فصل مياه الشرب عن الصرف، التهوية" },
    ]
  },
  {
    key: "fire",
    label: "الوقاية من الحريق",
    icon: Flame,
    color: "bg-red-100 text-red-700",
    items: [
      { standard: "SBC 801", requirement: "مخارج الطوارئ ومسارات الإخلاء", details: "عرض المخارج، أقصى مسافة إخلاء" },
      { standard: "SBC 801", requirement: "أنظمة الرش التلقائي والإنذار", details: "تغطية الرشاشات، مواقع الإنذار" },
      { standard: "SBC 802", requirement: "تجهيزات مكافحة الحريق", details: "الطفايات، خراطيم الإطفاء، تصميم درجات المقاومة" },
    ]
  },
  {
    key: "materials",
    label: "المواد والإنشاءات",
    icon: Wrench,
    color: "bg-orange-100 text-orange-700",
    items: [
      { standard: "SBC 901", requirement: "مواصفات الخرسانة والطوب والعزل", details: "مقاومة الضغط، نوع الطوب، قيم العزل" },
      { standard: "SBC 902", requirement: "مواصفات أعمال التشطيب", details: "الجبس، البلاط، الأرضيات، الأبواب المعتمدة" },
    ]
  },
];

export default function DesignComplianceChecker() {
  const [checked, setChecked] = useState({});
  const [expanded, setExpanded] = useState(null);

  const toggle = (key) => {
    setChecked(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const totalItems = DISCIPLINES.reduce((s, d) => s + d.items.length, 0);
  const checkedCount = Object.values(checked).filter(Boolean).length;
  const compliancePercent = totalItems > 0 ? Math.round((checkedCount / totalItems) * 100) : 0;

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card className="border-0 bg-gradient-to-l from-[#6B5D4F] to-[#C9A66B] text-white">
        <CardContent className="p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 bg-white/15 rounded-lg">
              <FileCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold">مدقق التنسيق الهندسي — SBC Compliance</h2>
              <p className="text-white/70 text-sm">ربط التصميم الهندسي بمعايير الكود السعودي والتأكد من المطابقة</p>
            </div>
          </div>
          <div className="flex items-center gap-4 mt-3">
            <div className="flex-1 bg-white/10 rounded-full h-3 overflow-hidden">
              <motion.div
                className="h-full bg-white rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${compliancePercent}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
            <div className="text-center min-w-[80px]">
              <p className="text-2xl font-bold">{compliancePercent}%</p>
              <p className="text-xs text-white/70">{checkedCount}/{totalItems} مطابق</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Disciplines */}
      <div className="space-y-3">
        {DISCIPLINES.map((disc, idx) => {
          const isExpanded = expanded === disc.key;
          const discChecked = disc.items.filter((_, i) => checked[`${disc.key}-${i}`]).length;
          const Icon = disc.icon;
          return (
            <motion.div key={disc.key} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.03 }}>
              <Card className="overflow-hidden border-slate-200 shadow-sm">
                <button
                  onClick={() => setExpanded(isExpanded ? null : disc.key)}
                  className="w-full text-right p-4 hover:bg-slate-50 transition-colors flex items-center gap-3"
                >
                  <div className={`p-2 rounded-lg ${disc.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-[#4A3F35]">{disc.label}</span>
                      <Badge variant="outline" className="text-xs">{discChecked}/{disc.items.length} مطابق</Badge>
                      {discChecked === disc.items.length && (
                        <Badge className="bg-green-100 text-green-700 border-0 text-xs">
                          <ShieldCheck className="w-3 h-3 ml-1" /> مكتمل
                        </Badge>
                      )}
                    </div>
                  </div>
                  {isExpanded ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                </button>

                {isExpanded && (
                  <div className="border-t bg-slate-50/50 p-3 space-y-2">
                    {disc.items.map((item, i) => {
                      const key = `${disc.key}-${i}`;
                      const isChecked = checked[key];
                      return (
                        <div key={i} className="bg-white rounded-lg border border-slate-200 p-3 flex items-start gap-3">
                          <button onClick={() => toggle(key)} className="flex-shrink-0 mt-0.5">
                            {isChecked
                              ? <CheckCircle2 className="w-5 h-5 text-green-500" />
                              : <Circle className="w-5 h-5 text-slate-300 hover:text-[#C9A66B]" />}
                          </button>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <Badge className={`${disc.color} border-0 text-xs`}>{item.standard}</Badge>
                              <span className={`text-sm font-medium ${isChecked ? "text-green-700 line-through" : "text-slate-800"}`}>{item.requirement}</span>
                            </div>
                            <p className="text-xs text-slate-500">{item.details}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Summary */}
      <Card className="border-[#C9A66B]/30 bg-amber-50">
        <CardContent className="p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-sm text-amber-800">
            هذا المدقق أداة إرشادية للمهندس لمراجعة مطابقة التصميم. يجب الحصول على اعتماد الشركة الاستشارية المرخصة قبل التقديم للبلدية.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}