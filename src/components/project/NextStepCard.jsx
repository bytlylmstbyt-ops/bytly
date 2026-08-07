import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import {
  Users, Scale, FileSignature, CheckCircle2, Star,
  Send, GitCompare, CreditCard, ClipboardList, ArrowLeft,
  Clock, Eye
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

/**
 * بطاقة «الخطوة التالية» — تحدد الإجراء المطلوب من المستخدم الآن
 * بناءً على حالة المشروع، عدد العروض، وجود عقد، ودور المستخدم.
 */
export default function NextStepCard({
  project,
  proposals,
  contracts,
  transactions,
  user,
  userEngineer,
  onScrollToProposals,
  onScrollToContract,
  onScrollToPayments,
}) {
  if (!project || !user) return null;

  const isClient = project.created_by === user.email;
  const isEngineer = userEngineer && project.assigned_engineer_id === userEngineer.id;
  const acceptedProposal = proposals.find(p => p.status === "accepted");
  const hasContract = contracts && contracts.length > 0;
  const signedContract = hasContract && contracts.find(c => c.status === "signed" || c.status === "active");

  // منطق تحديد الخطوة التالية
  let step = null;

  if (project.status === "open") {
    if (isEngineer) {
      const hasSubmitted = proposals.some(p => p.engineer_id === userEngineer.id);
      if (!hasSubmitted) {
        step = {
          icon: Send,
          title: "قدم عرضك الآن",
          desc: "المشروع مفتوح لاستقبال العروض — كن أول من يقدم",
          color: "from-[#6B5D4F] to-[#C9A66B]",
          action: { label: "تقديم عرض", scroll: "proposals" },
        };
      } else {
        step = {
          icon: Clock,
          title: "بانتظار قرار العميل",
          desc: "تم تقديم عرضك بنجاح — العميل يراجع العروض حالياً",
          color: "from-slate-500 to-slate-600",
        };
      }
    } else if (isClient) {
      if (proposals.length === 0) {
        step = {
          icon: Users,
          title: "بانتظار وصول العروض",
          desc: "تم نشر المشروع بنجاح — سيصلك إشعار فور وصول أول عرض",
          color: "from-blue-500 to-blue-600",
        };
      } else if (proposals.length === 1) {
        step = {
          icon: Eye,
          title: "راجع العرض الوارد",
          desc: `وصلك عرض واحد من أحد المهندسين — راجعه واتخذ قرارك`,
          color: "from-[#6B5D4F] to-[#C9A66B]",
          action: { label: "مراجعة العرض", scroll: "proposals" },
        };
      } else {
        step = {
          icon: GitCompare,
          title: "بانتظار اختيار العرض المناسب",
          desc: `وصلك ${proposals.length} عروض — قارنها واختر الأنسب`,
          color: "from-[#6B5D4F] to-[#C9A66B]",
          action: { label: "مقارنة العروض", scroll: "proposals" },
        };
      }
    }
  } else if (project.status === "in_progress") {
    if (!hasContract) {
      step = {
        icon: Scale,
        title: "إنشاء العقد الرسمي",
        desc: "تم اختيار المهندس — أنشئ العقد الرسمي لضمان حقوق الطرفين",
        color: "from-purple-500 to-purple-600",
        action: { label: "إنشاء عقد", scroll: "contract" },
      };
    } else if (!signedContract) {
      step = {
        icon: FileSignature,
        title: "توقيع العقد إلكترونياً",
        desc: "العقد جاهز للتوقيع — وقّع إلكترونياً لتفعيل العمل",
        color: "from-indigo-500 to-indigo-600",
        action: { label: "توقيع العقد", scroll: "contract" },
      };
    } else if (transactions.length === 0) {
      step = {
        icon: CreditCard,
        title: "إنشاء أول دفعة",
        desc: "العقد مُوقّع — أنشئ جدول الدفعات لربطه بالمراحل",
        color: "from-green-500 to-green-600",
        action: { label: "إعداد الدفعات", scroll: "payments" },
      };
    } else {
      step = {
        icon: ClipboardList,
        title: "متابعة التنفيذ",
        desc: "المشروع قيد التنفيذ — تابع المراحل ورفع المخرجات",
        color: "from-blue-500 to-blue-600",
      };
    }
  } else if (project.status === "pending_client_approval") {
    step = {
      icon: CheckCircle2,
      title: "راجع المخرجات ووافق",
      desc: "المخرجات جاهزة — راجعها ووافق لإكمال المشروع",
      color: "from-cyan-500 to-cyan-600",
    };
  } else if (project.status === "completed") {
    step = {
      icon: Star,
      title: "قيّم تجربتك",
      desc: "اكتمل المشروع — شارك تقييمك للمهندس",
      color: "from-amber-500 to-amber-600",
    };
  }

  if (!step) {
    step = {
      icon: ClipboardList,
      title: "المشروع قيد المتابعة",
      desc: "تابع تفاصيل المشروع والمراحل من الأقسام أدناه",
      color: "from-slate-400 to-slate-500",
    };
  }

  const Icon = step.icon;
  const handleAction = () => {
    if (step.action?.scroll === "proposals") onScrollToProposals?.();
    else if (step.action?.scroll === "contract") onScrollToContract?.();
    else if (step.action?.scroll === "payments") onScrollToPayments?.();
  };

  return (
    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="border-0 shadow-lg overflow-hidden">
        <CardContent className="p-0">
          <div className={`bg-gradient-to-r ${step.color} p-4 md:p-5 flex items-center gap-4`}>
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <Icon className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-medium text-white/70 uppercase tracking-wide">الخطوة التالية</span>
              </div>
              <h3 className="text-base md:text-lg font-bold text-white truncate">{step.title}</h3>
              <p className="text-sm text-white/80 line-clamp-2">{step.desc}</p>
            </div>
            {step.action && (
              <Button
                onClick={handleAction}
                size="sm"
                className="bg-white text-slate-800 hover:bg-white/90 shrink-0"
              >
                {step.action.label}
                <ArrowLeft className="w-4 h-4 mr-1" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}