import React from "react";
import AudienceLandingTemplate from "@/components/audiences/AudienceLandingTemplate";
import {
  HardHat,
  ShieldCheck,
  Wallet,
  FileSignature,
  CalendarClock,
  Star,
} from "lucide-react";

export default function ContractorsLanding() {
  return (
    <AudienceLandingTemplate
      segment={{
        badge: "مخصص للمقاولين",
        h1: "منصة بيتلي للمقاولين",
        subtitle:
          "مشاريع مطابقة لتخصصك، عقود إلكترونية محمية، ودفعات مضمونة عبر الضمان الإلكتروني — كل شيء في مكان واحد.",
        mission: "الحصول على مشاريع مطابقة لتخصصك مع دفعات محمية عبر الضمان الإلكتروني.",
        outcome: "تدفّق مشاريع مستمر ودفعات مضمونة تُحرَّر عند إنجاز كل مرحلة.",
        offer: {
          title: "ما نقدمه للمقاول",
          points: [
            {
              title: "مشاريع مطابقة لك",
              desc: "إشعارات بمشاريع تناسب تخصصك ومنطقتك الجغرافية فور طرحها.",
            },
            {
              title: "عقود إلكترونية محمية",
              desc: "عقود موثقة بالتوقيع الإلكتروني تحفظ حقوق الطرفين.",
            },
            {
              title: "ضمان مالي للدفعات",
              desc: "أموال العميل محجوزة في الضمان وتُحرَّر مع إنجاز كل مرحلة.",
            },
            {
              title: "محفظة وتسويات",
              desc: "تتبع رصيدك المتاح والمعلق واطلب السحب بضغطة واحدة.",
            },
          ],
        },
        process: {
          title: "كيف تبدأ كمقاول",
          steps: [
            { title: "سجّل حسابك", desc: "أنشئ حساب المقاول وارفق الترخيص والسجل التجاري." },
            { title: "اعتماد سريع", desc: "نتحقق من بياناتك ونعتمد حسابك خلال 24 ساعة." },
            { title: "استلم المشاريع", desc: "تصلك المشاريع المطابقة فور طرحها لتقدّم عرضك." },
            { title: "نفّذ واستلم", desc: "وقّع العقد، نفّذ المراحل، واستلم دفعاتك عبر الضمان." },
          ],
        },
        benefits: {
          title: "لماذا المقاولون يختارون بيتلي",
          items: [
            { title: "مشاريع مستمرة", desc: "تدفّق مشاريع جديد يطابق تخصصك وموقعك.", icon: HardHat },
            { title: "عقود آمنة", desc: "توقيع إلكتروني وبنود قانونية موثقة.", icon: FileSignature },
            { title: "دفعات مضمونة", desc: "ضمان إلكتروني يحمي أموالك حتى التسليم.", icon: ShieldCheck },
            { title: "محفظة شفافة", desc: "رصيد متاح ومعلق وسجل معاملات كامل.", icon: Wallet },
            { title: "جدولة واضحة", desc: "تتبع مواعيد المراحل وتنبيهات الاستحقاق.", icon: CalendarClock },
            { title: "تقييمات تبني سمعتك", desc: "بناء سمعة احترافية عبر تقييمات العملاء.", icon: Star },
          ],
        },
        proof: {
          title: "أرقام تتحدث",
          stats: [
            { value: "+300", label: "مقاول معتمد" },
            { value: "+800", label: "مشروع منجز" },
            { value: "0", label: "نزاعات غير محلولة" },
            { value: "48س", label: "متوسط التسليم" },
          ],
        },
        cta: {
          title: "هل أنت مقاول تبحث عن مشاريع موثوقة؟",
          ctaSubtitle:
            "انضم إلى مقاولي بيتلي المعتمدين وابدأ باستلام المشاريع المطابقة لتخصصك اليوم.",
          primary: { label: "سجّل كمقاول", to: "/RegisterContractor" },
          secondary: { label: "طلب عرض سعر", to: "/RequestQuote" },
        },
      }}
    />
  );
}