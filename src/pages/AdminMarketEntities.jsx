import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Search, Building2, Phone, Mail, MapPin, TrendingUp, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import MobileSelect from "@/components/mobile/MobileSelect";

const SALES_STATUSES = [
  { value: "لم يتم التواصل", label: "لم يتم التواصل" },
  { value: "انتظار الرد", label: "انتظار الرد" },
  { value: "مهتم بالانضمام", label: "مهتم بالانضمام" },
  { value: "تم الاتفاق", label: "تم الاتفاق" },
  { value: "مرفوض", label: "مرفوض" },
];

const statusColors = {
  "لم يتم التواصل": "bg-slate-100 text-slate-700",
  "انتظار الرد": "bg-amber-100 text-amber-700",
  "مهتم بالانضمام": "bg-blue-100 text-blue-700",
  "تم الاتفاق": "bg-green-100 text-green-700",
  "مرفوض": "bg-red-100 text-red-700",
};

export default function AdminMarketEntitiesPage() {
  const [entities, setEntities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const user = await base44.auth.me();
    if (user.role !== "admin") {
      toast.error("غير مصرح لك بالوصول");
      setLoading(false);
      return;
    }
    const data = await base44.entities.MarketEntity.list("-created_date");
    setEntities(data);
    setLoading(false);
  };

  const updateSalesStatus = async (entity, newStatus) => {
    await base44.entities.MarketEntity.update(entity.id, { notes: newStatus });
    setEntities(prev => prev.map(e => e.id === entity.id ? { ...e, notes: newStatus } : e));
    toast.success("تم تحديث حالة التواصل");
  };

  const filtered = entities.filter(e => {
    const matchesSearch = e.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          e.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === "all" || e.entity_type === typeFilter;
    return matchesSearch && matchesType;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-[#c9a66b]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-amber-50/30 p-6" dir="rtl">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <div className="border-b-2 border-[#4a3c31] pb-4">
          <div className="flex items-center gap-3 mb-1">
            <Building2 className="w-7 h-7 text-[#c9a66b]" />
            <h1 className="text-2xl font-bold text-[#4a3c31]">إدارة المطورين والمستثمرين</h1>
          </div>
          <p className="text-sm text-slate-500">
            هذه البيانات خاصة بالإدارة فقط — مخفية تماماً عن الواجهة العامة للمنصة.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "الإجمالي", value: entities.length, color: "text-[#4a3c31]" },
            { label: "مطورون", value: entities.filter(e => e.entity_type === "developer").length, color: "text-blue-700" },
            { label: "مستثمرون", value: entities.filter(e => e.entity_type === "investor").length, color: "text-green-700" },
            { label: "موثقون", value: entities.filter(e => e.is_verified).length, color: "text-amber-700" },
          ].map(stat => (
            <Card key={stat.label}>
              <CardContent className="p-4 text-center">
                <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
                <p className="text-sm text-slate-500 mt-1">{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4 flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="ابحث بالاسم أو البريد الإلكتروني..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-9"
              />
            </div>
            <MobileSelect
              value={typeFilter}
              onValueChange={setTypeFilter}
              placeholder="نوع الجهة"
              options={[
                { value: "all", label: "الكل" },
                { value: "developer", label: "مطورون عقاريون" },
                { value: "investor", label: "مستثمرون" },
              ]}
            />
          </CardContent>
        </Card>

        {/* Table */}
        <Card className="overflow-hidden">
          <CardHeader className="bg-[#4a3c31] text-white py-3 px-5 rounded-t-lg">
            <CardTitle className="text-base font-semibold">
              {filtered.length} جهة مسجلة
            </CardTitle>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-right border-collapse">
              <thead className="bg-slate-50 border-b text-slate-600">
                <tr>
                  <th className="px-4 py-3">الاسم / الشركة</th>
                  <th className="px-4 py-3">النوع</th>
                  <th className="px-4 py-3">المنطقة</th>
                  <th className="px-4 py-3 text-yellow-700">📞 الجوال</th>
                  <th className="px-4 py-3 text-yellow-700">✉️ البريد</th>
                  <th className="px-4 py-3">حجم الاستثمار</th>
                  <th className="px-4 py-3">حالة التواصل</th>
                  <th className="px-4 py-3">إجراء</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((entity) => {
                  const salesStatus = entity.notes || "لم يتم التواصل";
                  return (
                    <tr key={entity.id} className="border-b hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-semibold text-[#4a3c31]">
                        <div className="flex items-center gap-2">
                          {entity.name}
                          {entity.is_verified && (
                            <Badge className="bg-amber-100 text-amber-700 text-xs px-1.5 py-0">✓ موثق</Badge>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={entity.entity_type === "developer" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"}>
                          {entity.entity_type === "developer" ? "مطور" : "مستثمر"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{entity.region}</span>
                      </td>
                      <td className="px-4 py-3 font-medium text-blue-700 direction-ltr" dir="ltr">
                        {entity.phone ? (
                          <a href={`tel:${entity.phone}`} className="hover:underline flex items-center gap-1">
                            <Phone className="w-3.5 h-3.5" /> {entity.phone}
                          </a>
                        ) : <span className="text-slate-400">—</span>}
                      </td>
                      <td className="px-4 py-3 text-blue-700">
                        {entity.email ? (
                          <a href={`mailto:${entity.email}`} className="hover:underline flex items-center gap-1">
                            <Mail className="w-3.5 h-3.5" /> {entity.email}
                          </a>
                        ) : <span className="text-slate-400">—</span>}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        <span className="flex items-center gap-1"><TrendingUp className="w-3.5 h-3.5" />{entity.investment_range}</span>
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={salesStatus}
                          onChange={(e) => updateSalesStatus(entity, e.target.value)}
                          className={`text-xs font-medium px-2 py-1.5 rounded-lg border-0 outline-none cursor-pointer ${statusColors[salesStatus] || "bg-slate-100 text-slate-700"}`}
                        >
                          {SALES_STATUSES.map(s => (
                            <option key={s.value} value={s.value}>{s.label}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        {entity.phone && (
                          <a
                            href={`https://wa.me/${entity.phone.replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Button size="sm" className="bg-[#25D366] hover:bg-[#1fb554] text-white text-xs gap-1">
                              <MessageCircle className="w-3.5 h-3.5" />
                              واتساب
                            </Button>
                          </a>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={8} className="text-center py-10 text-slate-400">
                      لا توجد بيانات مطابقة
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}