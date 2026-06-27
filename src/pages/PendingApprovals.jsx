import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle, XCircle, Clock, User, Building2, MapPin, Mail, Phone, Briefcase, FileSpreadsheet } from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "@/components/i18n/LanguageContext";

export default function PendingApprovals() {
  const { isRTL } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState([]);
  const [sheetPending, setSheetPending] = useState([]);
  const [sheetLoading, setSheetLoading] = useState(true);
  const [sheetError, setSheetError] = useState(null);
  const [acting, setActing] = useState(null);
  const [error, setError] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const user = await base44.auth.me();
      if (user.role !== "admin") {
        setError("غير مصرح لك بالوصول لهذه الصفحة");
        setLoading(false);
        return;
      }
      const [engineers, surveyors, firms] = await Promise.all([
        base44.entities.Engineer.filter({ status: "pending" }, "-created_date", 200),
        base44.entities.SurveyorProfile.filter({ status: "pending" }, "-created_date", 200),
        base44.entities.EngineeringFirm.filter({ status: "pending" }, "-created_date", 200),
      ]);
      const items = [
        ...(engineers || []).map(e => ({
          id: e.id,
          type: "engineer",
          typeLabel: "مهندس",
          name: e.full_name,
          email: e.email,
          phone: e.phone,
          city: e.city,
          specialization: e.specialization,
          extra: e.registration_number ? `رقم القيد: ${e.registration_number}` : null,
          hasDoc: !!e.graduation_certificate_url,
          docUrl: e.graduation_certificate_url,
          created_date: e.created_date,
        })),
        ...(surveyors || []).map(s => ({
          id: s.id,
          type: "surveyor",
          typeLabel: "مسّاح",
          name: s.full_name,
          email: s.email,
          phone: s.phone,
          city: s.city,
          specialization: s.license_number ? `رخصة: ${s.license_number}` : null,
          extra: null,
          hasDoc: (s.verification_documents || []).length > 0,
          docUrl: (s.verification_documents || [])[0],
          created_date: s.created_date,
        })),
        ...(firms || []).map(f => ({
          id: f.id,
          type: "firm",
          typeLabel: "شركة استشارية",
          name: f.company_name,
          email: f.email,
          phone: f.phone,
          city: f.city,
          specialization: (f.specializations || []).join("، ") || null,
          extra: f.commercial_registration ? `سجل تجاري: ${f.commercial_registration}` : null,
          hasDoc: (f.documents || []).length > 0,
          docUrl: (f.documents || [])[0],
          created_date: f.created_date,
        })),
      ].sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
      setPending(items);
    } catch (err) {
      console.error("Error loading pending approvals:", err);
      setError("حدث خطأ في تحميل البيانات");
    }
    setLoading(false);
  }, []);

  const loadSheetData = useCallback(async () => {
    setSheetLoading(true);
    setSheetError(null);
    try {
      const res = await base44.functions.invoke("fetchPendingRegistrations", {});
      setSheetPending(res.data?.pending || []);
      if (res.data?.message) setSheetError(res.data.message);
    } catch (err) {
      setSheetError("تعذّر تحميل بيانات Google Sheets");
    }
    setSheetLoading(false);
  }, []);

  useEffect(() => { loadData(); loadSheetData(); }, [loadData, loadSheetData]);

  const handleSheetAction = async (item, action) => {
    setActing(`sheet-${item.row_number}-${action}`);
    try {
      await base44.functions.invoke("updateSheetRegistrationStatus", {
        row_number: item.row_number,
        status: action,
        email: item.email,
        spreadsheet_id: sheetPending.length > 0 ? undefined : undefined,
      });
      setSheetPending(prev => prev.filter(p => p.row_number !== item.row_number));
    } catch (err) {
      alert("حدث خطأ في التحديث");
    }
    setActing(null);
  };

  const entityMap = {
    engineer: "Engineer",
    surveyor: "SurveyorProfile",
    firm: "EngineeringFirm",
  };

  const handleAction = async (item, action) => {
    setActing(item.id + action);
    try {
      await base44.entities[entityMap[item.type]].update(item.id, {
        status: action === "approved" ? "approved" : "rejected",
        ...(action === "approved" ? {
          is_verified: true,
          certified_at: new Date().toISOString(),
          certified_by: (await base44.auth.me()).email,
        } : {}),
      });
      setPending(prev => prev.filter(p => p.id !== item.id));
    } catch (err) {
      alert("حدث خطأ في التحديث");
    }
    setActing(null);
  };

  const typeIcon = {
    engineer: <User className="w-4 h-4" />,
    surveyor: <MapPin className="w-4 h-4" />,
    firm: <Building2 className="w-4 h-4" />,
  };

  const typeColor = {
    engineer: "bg-blue-100 text-blue-800",
    surveyor: "bg-purple-100 text-purple-800",
    firm: "bg-teal-100 text-teal-800",
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" dir={isRTL ? "rtl" : "ltr"}>
        <Loader2 className="w-10 h-10 animate-spin text-[#C9A66B]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center" dir={isRTL ? "rtl" : "ltr"}>
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-amber-50/30 py-8 px-4" dir="rtl">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#6B5D4F] to-[#C9A66B] flex items-center justify-center shrink-0">
              <Clock className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#4A3F35]">طلبات الانضمام المعلقة</h1>
              <p className="text-sm text-slate-500 mt-0.5">
                {pending.length > 0 ? `${pending.length} طلب بانتظار المراجعة` : "لا توجد طلبات معلقة حالياً"}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Google Sheets Registrations */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <FileSpreadsheet className="w-5 h-5 text-green-600" />
              <h2 className="text-base font-bold text-[#4A3F35]">تسجيلات Google Sheets</h2>
              {sheetPending.length > 0 && (
                <Badge className="bg-green-100 text-green-800">{sheetPending.length}</Badge>
              )}
            </div>
            {sheetLoading ? (
              <div className="h-16 bg-slate-100 rounded-lg animate-pulse" />
            ) : sheetPending.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">
                {sheetError || "لا توجد تسجيلات معلقة في الجدول"}
              </p>
            ) : (
              <div className="space-y-2">
                {sheetPending.map((item, index) => (
                  <motion.div
                    key={`sheet-${item.row_number}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.04 }}
                    className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-lg border border-slate-100 hover:bg-slate-50"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-bold text-[#1a1a2e]">{item.full_name}</span>
                        <Badge variant="outline" className="text-xs">{item.user_type}</Badge>
                      </div>
                      <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-slate-500">
                        <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{item.email}</span>
                        {item.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{item.phone}</span>}
                        {item.city && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{item.city}</span>}
                        {item.specialization && <span className="flex items-center gap-1"><Briefcase className="w-3 h-3" />{item.specialization}</span>}
                      </div>
                    </div>
                    <div className="flex gap-1.5 shrink-0">
                      <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white h-8 px-3"
                        disabled={acting === `sheet-${item.row_number}-approved`}
                        onClick={() => handleSheetAction(item, "approved")}>
                        {acting === `sheet-${item.row_number}-approved`
                          ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          : <CheckCircle className="w-3.5 h-3.5" />}
                      </Button>
                      <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50 h-8 px-3"
                        disabled={acting === `sheet-${item.row_number}-rejected`}
                        onClick={() => handleSheetAction(item, "rejected")}>
                        {acting === `sheet-${item.row_number}-rejected`
                          ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          : <XCircle className="w-3.5 h-3.5" />}
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Entity List */}
        <div className="flex items-center gap-2 pt-2">
          <User className="w-5 h-5 text-[#C9A66B]" />
          <h2 className="text-base font-bold text-[#4A3F35]">طلابات قاعدة البيانات</h2>
        </div>
        {pending.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <CheckCircle className="w-10 h-10 text-green-500 mx-auto mb-2" />
              <p className="text-sm text-slate-500">لا توجد طلبات معلقة في قاعدة البيانات</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {pending.map((item, index) => (
              <motion.div
                key={`${item.type}-${item.id}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04 }}
              >
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="p-5">
                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <Badge className={typeColor[item.type]}>
                            {typeIcon[item.type]}
                            <span className="mr-1">{item.typeLabel}</span>
                          </Badge>
                          <h3 className="text-base font-bold text-[#1a1a2e]">{item.name}</h3>
                        </div>
                        <div className="grid sm:grid-cols-2 gap-x-4 gap-y-1.5 text-sm text-slate-600">
                          <div className="flex items-center gap-1.5">
                            <Mail className="w-3.5 h-3.5 text-slate-400" />
                            <span className="truncate">{item.email}</span>
                          </div>
                          {item.phone && (
                            <div className="flex items-center gap-1.5">
                              <Phone className="w-3.5 h-3.5 text-slate-400" />
                              {item.phone}
                            </div>
                          )}
                          {item.city && (
                            <div className="flex items-center gap-1.5">
                              <MapPin className="w-3.5 h-3.5 text-slate-400" />
                              {item.city}
                            </div>
                          )}
                          {item.specialization && (
                            <div className="flex items-center gap-1.5">
                              <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                              <span className="truncate">{item.specialization}</span>
                            </div>
                          )}
                          {item.extra && (
                            <div className="flex items-center gap-1.5">
                              <span className="text-slate-400 text-xs">{item.extra}</span>
                            </div>
                          )}
                        </div>
                        <div className="mt-2 flex items-center gap-3 text-xs text-slate-400">
                          <span>تاريخ الطلب: {new Date(item.created_date).toLocaleDateString('ar-SA')}</span>
                          {item.hasDoc && item.docUrl && (
                            <a href={item.docUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                              عرض المستند
                            </a>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 shrink-0">
                        <Button
                          size="sm"
                          onClick={() => handleAction(item, "approved")}
                          disabled={acting === item.id + "approved"}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          {acting === item.id + "approved"
                            ? <Loader2 className="w-4 h-4 animate-spin" />
                            : <><CheckCircle className="w-4 h-4 ml-1" /> قبول</>
                          }
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleAction(item, "rejected")}
                          disabled={acting === item.id + "rejected"}
                          className="text-red-600 border-red-200 hover:bg-red-50"
                        >
                          {acting === item.id + "rejected"
                            ? <Loader2 className="w-4 h-4 animate-spin" />
                            : <><XCircle className="w-4 h-4 ml-1" /> رفض</>
                          }
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}