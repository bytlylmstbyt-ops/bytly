import React from "react";
import AudienceLandingTemplate from "@/components/audiences/AudienceLandingTemplate";
import {
  Building2,
  ShieldCheck,
  Layers,
  Wallet,
  FileCheck,
  Users,
} from "lucide-react";

export default function EngineeringFirmsLanding() {
  return (
    <AudienceLandingTemplate
      segment={{
        badge: "مخصص لشركات الهندسة الاستشارية",
        h1: "منصة بيتلي لشركات الهندسة الاستشارية",
        subtitle:
          "أدر مشاريع متعددة، حوكمة فنية، ومراجعات SBC من مكان واحد — ووسّع أعمالك الاستشارية بثقة.",
        mission: "إدارة فنية وحوكمة SBC لمشاريع شركتك الاستشارية من لوحة واحدة.",
        outcome: "تقارير معتمدة وأتعاب تُحرَّر تلقائياً عند اعتماد كل مرحلة دون متابعة يدوية.",
        offer: {
          title: "ما نقدمه لشركتك",
          points: [
            {
              title: "إدارة مشاريع متعددة",
              desc: "لوحة موحدة لمتابعة كل مشاريع شركتك وفرقها وفتراتها المالية.",
            },
            {
              title: "مراجعة فنية وحوكمة SBC",
              desc: "تحقق الالتزام بالكود السعودي وأصدر تقارير فنية معتمدة لكل مرحلة.",
            },
            {
              title: "نماذج BIM وكميات",
              desc: "ارفع وشارك نماذج BIM واحسب الكميات تلقائياً لكل مشروع.",
            },
            {
              title: "محفظة ووثائق آمنة",
              desc: "خزن وثائق الشركة الرسمية والختم الإلكتروني بأمان تام.",
            },
          ],
        },
        process: {
          title: "كيف تبدأ شركتك",
          steps: [
            { title: "سجّل شركتك", desc: "أنشئ حساب الشركة وارفع السجل التجاري والترخيص." },
            { title: "اعتماد المنصة", desc: "نتحقق من وثائقك ونعتمد شركتك خلال 24 ساعة." },
            { title: "أضف مشاريعك", desc: "اربط مشاريعك وفرقك ونماذج BIM في لوحة واحدة." },
            { title: "أصدر المراجعات", desc: "أصدر تقارير فنية وفاتورة أتعاب كل مرحلة تلقائياً." },
          ],
        },
        benefits: {
          title: "لماذا شركات الهندسة تختار بيتلي",
          items: [
            { title: "حوكمة فنية كاملة", desc: "مراجعات SBC موثقة مع تقارير PDF مختومة.", icon: ShieldCheck },
            { title: "نماذج BIM ذكية", desc: "تصفّح وحساب كميات مباشر من النموذج.", icon: Layers },
            { title: "فريق موحد", desc: "أضف أعضاء فريقك ووزّع الصلاحيات بسهولة.", icon: Users },
            { title: "محفظة مالية شفافة", desc: "تتبع الأتعاب والمدفوعات لكل مشروع.", icon: Wallet },
            { title: "وثائق رسمية", desc: "ختم وتوقيع إلكتروني للمستندات.", icon: FileCheck },
            { title: "حضور أقوى", desc: "صفحة شركة عامة تجذب العملاء إليك.", icon: Building2 },
          ],
        },
        proof: {
          title: "أرقام تتحدث",
          stats: [
            { value: "+500", label: "شركة استشارية" },
            { value: "+1,200", label: "مراجعة فنية" },
            { value: "24س", label: "متوسط الاعتماد" },
            { value: "98%", label: "التزام SBC" },
          ],
        },
        cta: {
          title: "هل أنت شركة هندسية استشارية؟",
          ctaSubtitle:
            "انضم إلى شبكة بيتلي من شركات الهندسة المعتمدة وابدأ بإدارة مشاريعك اليوم.",
          primary: { label: "سجّل شركتك", to: "/RegisterFirm" },
          secondary: { label: "طلب عرض سعر", to: "/RequestQuote" },
        },
      }}
    />
  );
}