import React from "react";
import { motion } from "framer-motion";
import { Copyright as CopyrightIcon, Shield, FileCheck, AlertTriangle, Scale, Award, Lock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

export default function Copyright() {
  const sections = [
    {
      icon: CopyrightIcon,
      title: "1. ملكية المحتوى",
      content: [
        "جميع المحتويات المنشورة على منصة بيتلي، بما في ذلك النصوص، الصور، الشعارات، التصاميم، والعلامات التجارية، هي ملك لمنصة بيتلي أو المستخدمين المعنيين.",
        "العلامة التجارية 'بيتلي - لمسة بيت' والشعار المرتبط بها محميان بموجب قوانين حقوق الملكية الفكرية.",
        "لا يجوز استخدام أو نسخ أو توزيع أي محتوى من المنصة دون إذن كتابي مسبق.",
        "شعار المنصة وهويتها البصرية مسجلان ومحميان قانونياً.",
        "جميع الحقوق محفوظة © 2025 بيتلي - لمسة بيت."
      ]
    },
    {
      icon: FileCheck,
      title: "2. حقوق المهندسين والمصممين",
      content: [
        "يحتفظ المهندسون والمصممون بحقوق الملكية الفكرية الكاملة لأعمالهم المنشورة.",
        "بنشر الأعمال على المنصة، يمنح المهندس المنصة ترخيصاً غير حصري لعرض الأعمال.",
        "يحق للمنصة استخدام الأعمال المنشورة في الترويج والتسويق للمنصة.",
        "لا يجوز للمستخدمين الآخرين نسخ أو استخدام الأعمال دون موافقة المهندس.",
        "المهندسون مسؤولون عن التأكد من عدم انتهاك حقوق الآخرين في أعمالهم.",
        "يحق للمهندس طلب إزالة أعماله من المنصة في أي وقت."
      ]
    },
    {
      icon: Shield,
      title: "3. حماية حقوق العملاء",
      content: [
        "جميع التصاميم والمخططات المسلمة للعملاء هي ملك للعميل بعد السداد الكامل.",
        "لا يحق للمهندس استخدام التصاميم المسلمة للعميل لأغراض أخرى دون موافقة.",
        "يمكن للمهندس عرض التصاميم في معرض أعماله بعد موافقة العميل.",
        "العميل له الحق الكامل في استخدام وتعديل التصاميم المسلمة.",
        "يجب على المهندس تسليم جميع الملفات المصدرية للعميل.",
        "حقوق الملكية الفكرية تنتقل للعميل فور استلام الدفع الكامل."
      ]
    },
    {
      icon: AlertTriangle,
      title: "4. الانتهاكات والمخالفات",
      content: [
        "يُحظر تماماً نسخ أو سرقة تصاميم أو أعمال المستخدمين الآخرين.",
        "يُحظر رفع محتوى ينتهك حقوق الملكية الفكرية لأطراف ثالثة.",
        "في حالة اكتشاف انتهاك، سيتم حذف المحتوى فوراً وقد يتم تعليق الحساب.",
        "يحق للمنصة اتخاذ إجراءات قانونية ضد المنتهكين.",
        "المستخدمون مسؤولون قانونياً عن أي انتهاكات يرتكبونها.",
        "يمكن للمتضررين تقديم شكاوى لإزالة المحتوى المنتهك."
      ]
    },
    {
      icon: Scale,
      title: "5. الإبلاغ عن الانتهاكات",
      content: [
        "إذا وجدت محتوى ينتهك حقوق الملكية الفكرية، يُرجى التواصل معنا فوراً.",
        "يجب تقديم دليل على ملكيتك للمحتوى المنتهك.",
        "سنقوم بمراجعة البلاغ خلال 3-5 أيام عمل.",
        "في حالة ثبوت الانتهاك، سيتم إزالة المحتوى وإنذار المخالف.",
        "الانتهاكات المتكررة تؤدي لإنهاء الحساب نهائياً.",
        "نحتفظ بالحق في اتخاذ الإجراءات القانونية المناسبة."
      ]
    },
    {
      icon: Award,
      title: "6. الترخيص المحدود للاستخدام",
      content: [
        "نمنحك ترخيصاً محدوداً وغير حصري لاستخدام المنصة للأغراض الشخصية.",
        "لا يجوز استخدام المنصة لأغراض تجارية دون إذن مسبق.",
        "يُحظر استخدام أدوات آلية لجمع البيانات من المنصة.",
        "لا يجوز إعادة بيع أو توزيع خدمات المنصة.",
        "الترخيص قابل للإلغاء في حالة انتهاك الشروط.",
        "يمكننا تعديل شروط الترخيص في أي وقت."
      ]
    },
    {
      icon: Lock,
      title: "7. حماية المعلومات السرية",
      content: [
        "المعلومات المتبادلة بين المهندسين والعملاء تعتبر سرية.",
        "يُحظر مشاركة المخططات والتصاميم مع أطراف ثالثة دون موافقة.",
        "المنصة تستخدم تشفيراً متقدماً لحماية البيانات الحساسة.",
        "الموظفون ملزمون بعقود السرية وعدم الإفصاح.",
        "نتخذ إجراءات صارمة لمنع الوصول غير المصرح به.",
        "أي خرق للسرية يعرض المخالف للمساءلة القانونية."
      ]
    },
    {
      icon: FileCheck,
      title: "8. اتفاقية الاستخدام العادل",
      content: [
        "يُسمح باستخدام المنصة للأغراض المشروعة فقط.",
        "يُحظر استخدام المنصة بطرق قد تضر بها أو بالمستخدمين الآخرين.",
        "يجب احترام حقوق الملكية الفكرية لجميع الأطراف.",
        "التعاملات يجب أن تكون شفافة ومهنية.",
        "أي استخدام تعسفي أو مخالف سيؤدي لإنهاء الحساب.",
        "نحتفظ بالحق في التعديل على شروط الاستخدام العادل."
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
          <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-6">
            <Scale className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-[#1a1a2e] mb-4">
            اتفاقية حفظ الحقوق
          </h1>
          <p className="text-slate-600 max-w-2xl mx-auto">
            حماية حقوق الملكية الفكرية والمحتوى الإبداعي على المنصة
          </p>
          <p className="text-sm text-slate-500 mt-2">
            آخر تحديث: {new Date().toLocaleDateString("ar", { year: "numeric", month: "long", day: "numeric" })}
          </p>
        </motion.div>

        <Card className="border-0 shadow-xl mb-8">
          <CardContent className="p-8">
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-r-4 border-purple-500 p-6 rounded-lg mb-8">
              <h3 className="font-bold text-purple-900 mb-3 text-lg">التزامنا بحماية حقوقك</h3>
              <p className="text-purple-800 leading-relaxed">
                في منصة بيتلي، نؤمن بأهمية حماية حقوق الملكية الفكرية والإبداع. 
                هذه الاتفاقية توضح حقوق والتزامات جميع الأطراف (المنصة، المهندسين، العملاء) 
                فيما يتعلق بالمحتوى الإبداعي والتصاميم والأعمال المنشورة.
              </p>
            </div>

            <div className="space-y-8">
              {sections.map((section, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05 }}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                      <section.icon className="w-5 h-5 text-white" />
                    </div>
                    <h2 className="text-xl font-bold text-[#1a1a2e]">{section.title}</h2>
                  </div>
                  
                  <ul className="space-y-3 mr-12">
                    {section.content.map((item, i) => (
                      <li key={i} className="flex items-start gap-3 text-slate-600">
                        <div className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-2 flex-shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                  
                  {index < sections.length - 1 && <Separator className="mt-6" />}
                </motion.div>
              ))}
            </div>

            <div className="bg-red-50 border-r-4 border-red-500 p-6 rounded-lg mt-8">
              <h3 className="font-bold text-red-900 mb-3 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                تحذير قانوني
              </h3>
              <p className="text-red-800 leading-relaxed">
                أي انتهاك لحقوق الملكية الفكرية يُعد مخالفة قانونية ويُعرض المخالف للمساءلة القانونية 
                بموجب قوانين المملكة العربية السعودية. سنتخذ جميع الإجراءات القانونية اللازمة لحماية 
                حقوق المستخدمين والمنصة.
              </p>
            </div>

            <div className="bg-blue-50 border-r-4 border-blue-500 p-6 rounded-lg mt-8">
              <h3 className="font-bold text-blue-900 mb-3">التبليغ عن الانتهاكات</h3>
              <p className="text-blue-800 mb-4">
                إذا كنت تعتقد أن محتوى منشور على المنصة ينتهك حقوق الملكية الفكرية الخاصة بك، 
                يُرجى إرسال بلاغ مفصل يتضمن:
              </p>
              <ul className="space-y-2 text-blue-800 mr-4">
                <li>• وصف المحتوى المنتهك ورابط الوصول إليه</li>
                <li>• إثبات ملكيتك للمحتوى الأصلي</li>
                <li>• معلومات الاتصال الخاصة بك</li>
                <li>• إقرار بصحة المعلومات المقدمة</li>
              </ul>
              <p className="text-blue-800 mt-4">
                📧 أرسل البلاغ إلى: <a href="mailto:bytlylmstbyt@gmail.com" className="font-medium underline">bytlylmstbyt@gmail.com</a>
              </p>
            </div>
          </CardContent>
        </Card>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <Award className="w-12 h-12 mb-4 text-amber-500" />
              <h3 className="font-bold text-[#1a1a2e] mb-2">حماية الإبداع</h3>
              <p className="text-sm text-slate-600">
                نلتزم بحماية إبداعات المهندسين والمصممين من السرقة والانتهاك
              </p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <Shield className="w-12 h-12 mb-4 text-green-500" />
              <h3 className="font-bold text-[#1a1a2e] mb-2">ضمان الحقوق</h3>
              <p className="text-sm text-slate-600">
                نضمن حقوق جميع الأطراف ونتخذ إجراءات صارمة ضد المخالفين
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <div className="mt-8 p-6 bg-slate-100 rounded-xl text-center">
          <p className="text-slate-600">
            للمزيد من المعلومات أو الاستفسارات القانونية، يُرجى التواصل مع الإدارة القانونية على:
          </p>
          <a 
            href="mailto:bytlylmstbyt@gmail.com" 
            className="text-[#C9A66B] font-semibold text-lg mt-2 inline-block hover:underline"
          >
            bytlylmstbyt@gmail.com
          </a>
        </div>
      </div>
    </div>
  );
}