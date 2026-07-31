import React from "react";
import { motion } from "framer-motion";
import { FileText, Shield, Users, AlertCircle, CheckCircle, Scale } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function Terms() {
  const sections = [
    {
      icon: Users,
      title: "1. القبول والاستخدام",
      content: [
        "باستخدامك لمنصة بيتلي، فإنك توافق على الالتزام بهذه الشروط والأحكام.",
        "يجب أن يكون عمرك 18 عاماً أو أكثر لاستخدام المنصة.",
        "يحق لك إنشاء حساب واحد فقط على المنصة.",
        "أنت مسؤول عن الحفاظ على سرية بيانات حسابك.",
        "يحق لنا تعليق أو إنهاء حسابك في حالة انتهاك الشروط."
      ]
    },
    {
      icon: Shield,
      title: "2. خدمات المنصة",
      content: [
        "توفر المنصة وسيلة للربط بين مقدمي الخدمات (المهندسين والرسامين) وأصحاب المشاريع.",
        "لا تعتبر المنصة طرفاً في العقود المبرمة بين المستخدمين.",
        "المنصة ليست مسؤولة عن جودة الخدمات المقدمة من المهندسين.",
        "نحتفظ بالحق في تعديل أو إيقاف أي خدمة دون إشعار مسبق.",
        "يجب على جميع المستخدمين الالتزام بالقوانين المحلية المعمول بها."
      ]
    },
    {
      icon: FileText,
      title: "3. حسابات المهندسين والمصممين",
      content: [
        "يجب على المهندسين تقديم معلومات صحيحة ودقيقة عند التسجيل.",
        "يجب تقديم شهادات التخرج وأرقام القيد المهني الصحيحة.",
        "تخضع جميع الحسابات للمراجعة والتحقق قبل الموافقة.",
        "يحق للمنصة رفض أو تعليق أي حساب لا يستوفي الشروط.",
        "المهندسون مسؤولون عن تحديث معلومات ملفاتهم الشخصية بشكل دوري.",
        "يجب الالتزام بمعايير الجودة والاحترافية في تقديم الخدمات."
      ]
    },
    {
      icon: Scale,
      title: "4. الرسوم والاشتراكات",
      content: [
        "الاشتراك الشهري: 99 ريال سعودي شهرياً.",
        "الاشتراك السنوي: 799 ريال سعودي سنوياً.",
        "يتم تحصيل رسوم الاشتراك بشكل تلقائي في حالة التجديد التلقائي.",
        "يمكن إلغاء الاشتراك في أي وقت من خلال إعدادات الحساب.",
        "لا يتم رد قيمة الاشتراك في حالة الإلغاء قبل انتهاء المدة.",
        "تحتفظ المنصة بنسبة 10% كعمولة على المشاريع المنجزة.",
        "جميع الأسعار شاملة ضريبة القيمة المضافة."
      ]
    },
    {
      icon: Shield,
      title: "5. نظام الدفع الضامن (Escrow)",
      content: [
        "يتم حجز أموال المشاريع في حساب ضامن حتى إتمام التسليم.",
        "يتم تحرير الأموال بعد موافقة صاحب المشروع على التسليم.",
        "في حالة النزاع، تقوم المنصة بالمراجعة واتخاذ القرار المناسب.",
        "مدة حجز الأموال لا تتجاوز 30 يوماً من تاريخ التسليم.",
        "يحق للمنصة خصم العمولة قبل تحرير الأموال للمهندس.",
        "في حالة فشل المشروع، يتم إعادة الأموال لصاحب المشروع."
      ]
    },
    {
      icon: AlertCircle,
      title: "6. المحتوى والملكية الفكرية",
      content: [
        "يحتفظ المستخدمون بملكية المحتوى الذي ينشرونه على المنصة.",
        "بنشر المحتوى، تمنح المنصة حق استخدامه للترويج والتسويق.",
        "يحظر نشر محتوى مسيء أو مخالف للآداب العامة.",
        "يحظر انتهاك حقوق الملكية الفكرية للآخرين.",
        "يحق للمنصة إزالة أي محتوى مخالف دون إشعار مسبق.",
        "العلامة التجارية 'بيتلي' وجميع العناصر المرتبطة بها ملك للمنصة."
      ]
    },
    {
      icon: Users,
      title: "7. السلوك المقبول",
      content: [
        "يجب على المستخدمين التعامل باحترام ومهنية.",
        "يحظر التحرش أو التهديد أو الإساءة لأي مستخدم.",
        "يحظر استخدام المنصة لأغراض احتيالية أو غير قانونية.",
        "يحظر التلاعب بالتقييمات أو نشر مراجعات وهمية.",
        "يجب الالتزام بمواعيد التسليم المتفق عليها.",
        "يحظر مشاركة معلومات الاتصال خارج المنصة في المراحل الأولى."
      ]
    },
    {
      icon: Scale,
      title: "8. حل النزاعات",
      content: [
        "في حالة وجود نزاع، يجب على الأطراف محاولة الحل الودي أولاً.",
        "يمكن تصعيد النزاع لإدارة المنصة للمراجعة.",
        "قرار المنصة في النزاعات نهائي وملزم للطرفين.",
        "تحتفظ المنصة بحق الوساطة في جميع النزاعات.",
        "في حالة عدم التوصل لحل، يتم اللجوء للجهات القانونية المختصة.",
        "القانون الساري هو قانون المملكة العربية السعودية."
      ]
    },
    {
      icon: FileText,
      title: "9. المسؤولية وإخلاء المسؤولية",
      content: [
        "المنصة توفر خدمة الربط فقط ولا تضمن نتائج المشاريع.",
        "المنصة غير مسؤولة عن أي خسائر ناتجة عن التعاملات.",
        "المستخدمون مسؤولون عن التحقق من جودة الخدمات.",
        "لا تتحمل المنصة مسؤولية التأخيرات أو عدم إكمال المشاريع.",
        "يُستخدم الموقع 'كما هو' دون أي ضمانات صريحة أو ضمنية.",
        "الحد الأقصى لمسؤولية المنصة هو قيمة الرسوم المدفوعة."
      ]
    },
    {
      icon: AlertCircle,
      title: "10. التعديلات على الشروط",
      content: [
        "يحق للمنصة تعديل هذه الشروط في أي وقت.",
        "سيتم إشعار المستخدمين بأي تعديلات جوهرية.",
        "استمرارك في استخدام المنصة يعني موافقتك على التعديلات.",
        "يُنصح بمراجعة الشروط بشكل دوري.",
        "التعديلات تسري من تاريخ نشرها على المنصة."
      ]
    },
    {
      icon: Users,
      title: "11. إنهاء الحساب",
      content: [
        "يمكنك إنهاء حسابك في أي وقت من خلال الإعدادات.",
        "عند إنهاء الحساب، سيتم حذف جميع بياناتك خلال 30 يوماً.",
        "لن يتم استرداد قيمة الاشتراكات المدفوعة عند الإلغاء.",
        "يجب إكمال جميع المشاريع الجارية قبل إغلاق الحساب.",
        "يحق للمنصة الاحتفاظ ببعض البيانات للأغراض القانونية."
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-amber-50/30 py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-[#1a1a2e] to-[#C9A66B] flex items-center justify-center mb-6">
            <FileText className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-[#1a1a2e] mb-4">
            الشروط والأحكام
          </h1>
          <p className="text-slate-600 max-w-2xl mx-auto">
            يرجى قراءة هذه الشروط بعناية قبل استخدام منصة بيتلي
          </p>
          <p className="text-sm text-slate-500 mt-2">
            آخر تحديث: {new Date().toLocaleDateString("ar", { year: "numeric", month: "long", day: "numeric" })}
          </p>
        </motion.div>

        <Card className="border-0 shadow-xl mb-8">
          <CardContent className="p-8">
            <div className="prose prose-slate max-w-none">
              <div className="bg-blue-50 border-r-4 border-blue-500 p-6 rounded-lg mb-8">
                <p className="text-blue-900 font-medium">
                  هذه الشروط والأحكام تحكم استخدامك لمنصة بيتلي ("المنصة"). 
                  باستخدام المنصة، فإنك توافق على الالتزام بهذه الشروط. 
                  إذا كنت لا توافق على أي جزء من هذه الشروط، يُرجى عدم استخدام المنصة.
                </p>
              </div>

              {sections.map((section, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05 }}
                  className="mb-8"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#1a1a2e] to-[#C9A66B] flex items-center justify-center">
                      <section.icon className="w-5 h-5 text-white" />
                    </div>
                    <h2 className="text-xl font-bold text-[#1a1a2e]">{section.title}</h2>
                  </div>
                  <ul className="space-y-3 mr-12">
                    {section.content.map((item, i) => (
                      <li key={i} className="flex items-start gap-3 text-slate-600">
                        <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                  {index < sections.length - 1 && <Separator className="mt-8" />}
                </motion.div>
              ))}

              <div className="bg-amber-50 border-r-4 border-amber-500 p-6 rounded-lg mt-8">
                <h3 className="font-bold text-amber-900 mb-3 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  معلومات الاتصال
                </h3>
                <p className="text-amber-800">
                  لأي استفسارات حول الشروط والأحكام، يرجى التواصل معنا عبر البريد الإلكتروني:
                  <a href="mailto:bytlylmstbyt@gmail.com" className="font-medium underline mr-1">
                    bytlylmstbyt@gmail.com
                  </a>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}