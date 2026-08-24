import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  CheckCircle2, FilePlus, Users, Scale, FileSignature,
  CreditCard, ClipboardList, Clock, RefreshCw, Activity
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const STATUS_LABELS = {
  open: "مفتوح للعروض", in_progress: "قيد التنفيذ",
  awaiting_technical_review: "بانتظار المراجعة الفنية",
  technical_approved: "معتمد فنياً", pending_client_approval: "بانتظار موافقة العميل",
  completed: "مكتمل", cancelled: "ملغي", disputed: "نزاع",
};

export default function ProjectActivityLog({ project, proposals, contracts, transactions, engineers }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    buildTimeline();
  }, [project, proposals, contracts, transactions]);

  const buildTimeline = async () => {
    const events = [];

    // 1. إنشاء المشروع
    if (project?.created_date) {
      events.push({
        time: project.created_date,
        icon: FilePlus,
        color: "text-blue-600 bg-blue-50",
        title: "تم إنشاء المشروع",
        desc: `أنشأ ${project.created_by?.split("@")[0] || "المستخدم"} المشروع`,
      });
    }

    // 2. نشر طلب المشروع
    if (project?.created_date) {
      events.push({
        time: project?.created_date,
        icon: Users,
        color: "text-[#C9A66B] bg-amber-50",
        title: "تم نشر طلب المشروع",
        desc: project?.status === "open"
          ? "المشروع متاح الآن لاستقبال العروض من المهندسين"
          : "تم نشر المشروع لاستقبال العروض",
      });
    }

    // 3. استلام العروض
    if (proposals?.length > 0) {
      proposals.forEach((p, i) => {
        const eng = engineers?.[p.engineer_id];
        events.push({
          time: p.created_date,
          icon: Users,
          color: "text-purple-600 bg-purple-50",
          title: i === 0 ? `تم استلام أول عرض` : `تم استلام عرض جديد`,
          desc: `${eng?.full_name || "مهندس"} قدّم عرضاً بقيمة ${p.price?.toLocaleString()} ر.س`,
        });
      });

      // ملخص إذا كان هناك أكثر من عرض
      if (proposals.length > 1) {
        events.push({
          time: proposals[proposals.length - 1]?.created_date,
          icon: CheckCircle2,
          color: "text-indigo-600 bg-indigo-50",
          title: `تم استلام ${proposals.length} عروض`,
          desc: "راجع وقارن العروض لاختيار الأنسب",
        });
      }
    }

    // 4. قبول عرض
    const accepted = proposals?.find(p => p.status === "accepted");
    if (accepted) {
      const eng = engineers?.[accepted.engineer_id];
      events.push({
        time: accepted.updated_date || accepted.created_date,
        icon: CheckCircle2,
        color: "text-green-600 bg-green-50",
        title: "تم قبول العرض",
        desc: `تم اختيار ${eng?.full_name || "المهندس"} لتنفيذ المشروع`,
      });
    }

    // 5. إنشاء العقد
    if (contracts?.length > 0) {
      contracts.forEach(c => {
        events.push({
          time: c.created_date,
          icon: Scale,
          color: "text-purple-600 bg-purple-50",
          title: "تم إنشاء العقد",
          desc: `عقد رقم #${(c.id || "").slice(-6)} — ${c.status === "signed" || c.status === "active" ? "موقّع" : "بانتظار التوقيع"}`,
        });
        if (c.status === "signed" || c.status === "active") {
          events.push({
            time: c.updated_date || c.created_date,
            icon: FileSignature,
            color: "text-indigo-600 bg-indigo-50",
            title: "تم توقيع العقد إلكترونياً",
            desc: "العقد أصبح ساري المفعول",
          });
        }
      });
    }

    // 6. المعاملات المالية
    if (transactions?.length > 0) {
      transactions.forEach(t => {
        events.push({
          time: t.created_date,
          icon: CreditCard,
          color: t.status === "completed" ? "text-green-600 bg-green-50" : "text-amber-600 bg-amber-50",
          title: t.type === "escrow_hold" ? "تم حجز مبلغ الضمان" :
                 t.type === "escrow_release" ? "تم تحرير الدفعة" :
                 t.type === "deposit" ? "تم إيداع المبلغ" : "معاملة مالية",
          desc: `${t.amount?.toLocaleString()} ر.س — ${t.status === "completed" ? "مكتملة" : t.status === "held_in_escrow" ? "محجوزة في الضمان" : "معلقة"}`,
        });
      });
    }

    // 7. تغيير الحالة
    if (project?.status && project.status !== "open" && !accepted) {
      events.push({
        time: project.updated_date,
        icon: ClipboardList,
        color: "text-slate-600 bg-slate-100",
        title: `تم تغيير الحالة إلى: ${STATUS_LABELS[project.status] || project.status}`,
        desc: "",
      });
    }

    // ترتيب تنازلياً حسب التاريخ
    events.sort((a, b) => {
      const da = a.time ? new Date(a.time) : new Date(0);
      const db = b.time ? new Date(b.time) : new Date(0);
      return db - da;
    });

    setLogs(events);
    setLoading(false);
  };

  const formatDate = (d) => {
    if (!d) return "";
    return new Date(d).toLocaleDateString("ar-SA", {
      year: "numeric", month: "short", day: "numeric",
      hour: "2-digit", minute: "2-digit"
    });
  };

  return (
    <Card className="border-0 shadow-lg" id="project-activity">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-[#C9A66B]" />
            سجل نشاط المشروع
          </span>
          <Button variant="ghost" size="sm" onClick={buildTimeline} className="text-slate-400">
            <RefreshCw className="w-4 h-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {logs.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-slate-400 text-sm">لا يوجد نشاط مسجل بعد</p>
          </div>
        ) : (
          <div className="relative pr-6">
            {/* Vertical line */}
            <div className="absolute right-[19px] top-2 bottom-2 w-0.5 bg-slate-100" />

            {logs.map((log, i) => {
              const Icon = log.icon;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="relative flex items-start gap-3 pb-5 last:pb-0"
                >
                  <div className={`relative z-10 w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${log.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0 pt-1">
                    <p className="text-sm font-medium text-slate-800">{log.title}</p>
                    {log.desc && <p className="text-xs text-slate-500 mt-0.5">{log.desc}</p>}
                    {log.time && <p className="text-xs text-slate-400 mt-1">{formatDate(log.time)}</p>}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}