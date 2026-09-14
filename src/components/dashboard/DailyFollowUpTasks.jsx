import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Phone, Mail, MapPin, CheckCircle2, AlertCircle, ClipboardList, Calendar } from "lucide-react";
import { motion } from "framer-motion";

const PROFILE_CHECKS = [
  { key: "profile_image", label: "صورة شخصية", check: (e) => !!e.profile_image },
  { key: "bio", label: "نبذة تعريفية", check: (e) => !!e.bio && e.bio.trim().length > 10 },
  { key: "specialization", label: "التخصص", check: (e) => !!e.specialization },
  { key: "city", label: "المدينة", check: (e) => !!e.city },
  { key: "phone", label: "رقم الهاتف", check: (e) => !!e.phone },
  { key: "graduation_certificate_url", label: "شهادة التخرج", check: (e) => !!e.graduation_certificate_url },
  { key: "registration_number", label: "رقم القيد", check: (e) => !!e.registration_number },
  { key: "iban", label: "الآيبان", check: (e) => !!e.iban },
  { key: "years_experience", label: "سنوات الخبرة", check: (e) => !!e.years_experience },
];

function isSameDay(dateStr) {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const today = new Date();
  return d.getFullYear() === today.getFullYear() && d.getMonth() === today.getMonth() && d.getDate() === today.getDate();
}

export default function DailyFollowUpTasks() {
  const [engineers, setEngineers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const all = await base44.entities.Engineer.filter({ status: "approved" }, "-created_date", 500);
      // Filter: has at least one missing field AND not followed up today
      const needsFollowUp = all.filter((eng) => {
        const missing = PROFILE_CHECKS.filter((c) => !c.check(eng));
        if (missing.length === 0) return false;
        if (isSameDay(eng.last_followup_date)) return false;
        return true;
      });
      setEngineers(needsFollowUp);
    } catch (err) {
      console.error("Error loading follow-up tasks:", err);
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleMarkContacted = async (eng) => {
    setActing(eng.id);
    try {
      await base44.entities.Engineer.update(eng.id, {
        last_followup_date: new Date().toISOString(),
      });
      setEngineers((prev) => prev.filter((e) => e.id !== eng.id));
    } catch (err) {
      alert("حدث خطأ في التحديث");
    }
    setActing(null);
  };

  const getMissingFields = (eng) => PROFILE_CHECKS.filter((c) => !c.check(eng));

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="border-0 shadow-lg border-t-4 border-t-orange-500">
        <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50">
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="w-6 h-6 text-orange-600" />
            مهام المتابعة اليومية
            {engineers.length > 0 && (
              <Badge className="bg-orange-100 text-orange-700">{engineers.length} مهندس</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
            </div>
          ) : engineers.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-green-500" />
              <p className="text-slate-600 font-medium">لا توجد مهام متابعة اليوم</p>
              <p className="text-sm text-slate-400 mt-1">جميع المهندسين أكملوا ملفاتهم أو تمت متابعتهم</p>
            </div>
          ) : (
            <div className="space-y-3">
              {engineers.map((eng, index) => {
                const missing = getMissingFields(eng);
                return (
                  <motion.div
                    key={eng.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.04 }}
                    className="flex flex-col md:flex-row md:items-center gap-3 p-4 rounded-xl border border-orange-100 bg-orange-50/30 hover:bg-orange-50/60 transition-colors"
                  >
                    {/* Engineer Info */}
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <Avatar className="w-10 h-10 shrink-0">
                        <AvatarImage src={eng.profile_image} />
                        <AvatarFallback className="bg-gradient-to-br from-[#6B5D4F] to-[#C9A66B] text-white text-sm">
                          {eng.full_name?.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="font-bold text-[#1a1a2e] text-sm truncate">{eng.full_name}</p>
                        <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-slate-500 mt-0.5">
                          <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{eng.email}</span>
                          {eng.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{eng.phone}</span>}
                          {eng.city && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{eng.city}</span>}
                        </div>
                      </div>
                    </div>

                    {/* Missing Fields */}
                    <div className="flex flex-wrap gap-1.5 md:max-w-md">
                      {missing.map((m) => (
                        <Badge key={m.key} variant="outline" className="text-xs text-red-600 border-red-200 bg-red-50">
                          <AlertCircle className="w-3 h-3 ml-0.5" />
                          {m.label}
                        </Badge>
                      ))}
                    </div>

                    {/* Action */}
                    <div className="shrink-0">
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 text-white"
                        disabled={acting === eng.id}
                        onClick={() => handleMarkContacted(eng)}
                      >
                        {acting === eng.id
                          ? <Loader2 className="w-4 h-4 animate-spin" />
                          : <><CheckCircle2 className="w-4 h-4 ml-1" /> تم التواصل</>}
                      </Button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
          {!loading && engineers.length > 0 && (
            <div className="mt-4 flex items-center gap-2 text-xs text-slate-400">
              <Calendar className="w-3.5 h-3.5" />
              تُحدّث القائمة يومياً — المهندسون الذين تم التواصل معهم اليوم لا يظهرون مجدداً
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}