import React from "react";
import { motion } from "framer-motion";
import { Shield, Lock, Eye, Database, UserX, FileCheck, Bell, Cookie } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

export default function Privacy() {
  const sections = [
    {
      icon: Database,
      title: "1. المعلومات التي نجمعها",
      content: [
        {
          subtitle: "معلومات الحساب:",
          items: [
            "الاسم الكامل والبريد الإلكتروني",
            "رقم الهاتف والموقع الجغرافي (المدينة والدولة)",
            "الصور الشخصية وصور الغلاف",
            "شهادات التخرج وأرقام القيد المهني (للمهندسين)",
            "معلومات الدفع والمعاملات المالية"
          ]
        },
        {
          subtitle: "معلومات الاستخدام:",
          items: [
            "سجلات النشاط على المنصة",
            "المشاريع والعروض المقدمة",
            "الرسائل والمحادثات (مشفرة)",
            "التقييمات والمراجعات",
            "معلومات الجهاز وعنوان IP"
          ]
        }
      ]
    },
    {
      icon: Eye,
      title: "2. كيف نستخدم معلوماتك",
      content: [
        {
          subtitle: "نستخدم معلوماتك للأغراض التالية:",
          items: [
            "توفير وتحسين خدمات المنصة",
            "معالجة المعاملات المالية والاشتراكات",
            "التحقق من هوية المهندسين والمصممين",
            "التواصل معك بخصوص حسابك والخدمات",
            "إرسال إشعارات حول المشاريع والرسائل",
            "تحسين تجربة المستخدم وتخصيص المحتوى",
            "حماية المنصة من الاحتيال والأنشطة المشبوهة",
            "تحليل البيانات لتطوير الخدمات"
          ]
        }
      ]
    },
    {
      icon: Lock,
      title: "3. مشاركة المعلومات",
      content: [
        {
          subtitle: "لا نبيع معلوماتك الشخصية. قد نشارك معلوماتك في الحالات التالية:",
          items: [
            "مع مقدمي الخدمات الطرف الثالث (معالجات الدفع، الاستضافة)",
            "عند الحاجة للامتثال للقوانين والأنظمة",
            "لحماية حقوق وسلامة المستخدمين والمنصة",
            "في حالة دمج أو بيع الشركة (بعد إخطارك)",
            "عرض معلومات الملف الشخصي للمستخدمين الآخرين (حسب إعداداتك)"
          ]
        }
      ]
    },
    {
      icon: Shield,
      title: "4. أمن المعلومات",
      content: [
        {
          subtitle: "نتخذ إجراءات أمنية صارمة لحماية بياناتك:",
          items: [
            "تشفير جميع البيانات الحساسة باستخدام SSL/TLS",
            "تشفير كلمات المرور باستخدام خوارزميات قوية",
            "أنظمة حماية متقدمة ضد الاختراقات",
            "نسخ احتياطي منتظم للبيانات",
            "وصول محدود للبيانات من قبل الموظفين المصرح لهم فقط",
            "مراقبة مستمرة للأنشطة المشبوهة",
            "امتثال لمعايير أمن المعلومات الدولية"
          ]
        }
      ]
    },
    {
      icon: Cookie,
      title: "5. ملفات تعريف الارتباط (Cookies)",
      content: [
        {
          subtitle: "نستخدم ملفات تعريف الارتباط لـ:",
          items: [
            "الحفاظ على جلسة تسجيل الدخول",
            "تذكر تفضيلاتك وإعداداتك",
            "تحليل استخدام المنصة",
            "تحسين تجربة المستخدم",
            "يمكنك التحكم في ملفات تعريف الارتباط من خلال متصفحك"
          ]
        }
      ]
    },
    {
      icon: UserX,
      title: "6. حقوقك",
      content: [
        {
          subtitle: "لديك الحقوق التالية فيما يتعلق بمعلوماتك:",
          items: [
            "الوصول إلى معلوماتك الشخصية ومراجعتها",
            "تحديث أو تصحيح معلوماتك في أي وقت",
            "طلب حذف حسابك ومعلوماتك",
            "الاعتراض على معالجة معلوماتك",
            "طلب نسخة من بياناتك (قابلية النقل)",
            "سحب الموافقة على معالجة البيانات",
            "تقديم شكوى للجهات الرقابية المختصة"
          ]
        }
      ]
    },
    {
      icon: Bell,
      title: "7. الاحتفاظ بالبيانات",
      content: [
        {
          subtitle: "مدة الاحتفاظ بالمعلومات:",
          items: [
            "نحتفظ بمعلوماتك طالما كان حسابك نشطاً",
            "بعد حذف الحساب، نحتفظ بالبيانات لمدة 90 يوماً",
            "قد نحتفظ ببعض البيانات لفترات أطول للامتثال القانوني",
            "المعاملات المالية تُحفظ لمدة 7 سنوات",
            "يتم حذف الرسائل والمحادثات بعد سنة من آخر نشاط"
          ]
        }
      ]
    },
    {
      icon: FileCheck,
      title: "8. حماية خصوصية الأطفال",
      content: [
        {
          subtitle: "",
          items: [
            "المنصة غير موجهة للأطفال دون سن 18 عاماً",
            "لا نجمع معلومات من الأطفال عمداً",
            "إذا علمنا بجمع معلومات من طفل، سنحذفها فوراً",
            "يجب على أولياء الأمور مراقبة استخدام أطفالهم للإنترنت"
          ]
        }
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
          <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center mb-6">
            <Shield className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-[#1a1a2e] mb-4">
            سياسة الخصوصية
          </h1>
          <p className="text-slate-600 max-w-2xl mx-auto">
            نحن ملتزمون بحماية خصوصيتك وبياناتك الشخصية
          </p>
          <p className="text-sm text-slate-500 mt-2">
            آخر تحديث: {new Date().toLocaleDateString("ar", { year: "numeric", month: "long", day: "numeric" })}
          </p>
        </motion.div>

        <Card className="border-0 shadow-xl mb-8">
          <CardContent className="p-8">
            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border-r-4 border-blue-500 p-6 rounded-lg mb-8">
              <h3 className="font-bold text-blue-900 mb-3 text-lg">مقدمة</h3>
              <p className="text-blue-800 leading-relaxed">
                في منصة بيتلي، نحترم خصوصيتك ونلتزم بحماية معلوماتك الشخصية. 
                توضح هذه السياسة كيفية جمع واستخدام وحماية ومشاركة معلوماتك عند استخدام منصتنا. 
                نلتزم بالامتثال لقوانين حماية البيانات المعمول بها في المملكة العربية السعودية.
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
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                      <section.icon className="w-5 h-5 text-white" />
                    </div>
                    <h2 className="text-xl font-bold text-[#1a1a2e]">{section.title}</h2>
                  </div>
                  
                  {section.content.map((block, blockIndex) => (
                    <div key={blockIndex} className="mr-12 mb-4">
                      {block.subtitle && (
                        <p className="font-semibold text-slate-700 mb-3">{block.subtitle}</p>
                      )}
                      <ul className="space-y-2">
                        {block.items.map((item, i) => (
                          <li key={i} className="flex items-start gap-3 text-slate-600">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#C9A66B] mt-2 flex-shrink-0" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                  
                  {index < sections.length - 1 && <Separator className="mt-6" />}
                </motion.div>
              ))}
            </div>

            <div className="bg-green-50 border-r-4 border-green-500 p-6 rounded-lg mt-8">
              <h3 className="font-bold text-green-900 mb-3">التواصل معنا</h3>
              <p className="text-green-800 mb-4">
                إذا كان لديك أي أسئلة أو استفسارات حول سياسة الخصوصية أو ترغب في ممارسة حقوقك، 
                يُرجى التواصل معنا:
              </p>
              <div className="space-y-2 text-green-800">
                <p>📧 البريد الإلكتروني: <a href="mailto:bytlylmstbyt@gmail.com" className="font-medium underline">bytlylmstbyt@gmail.com</a></p>
                <p>📍 المملكة العربية السعودية</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          <Card className="border-0 shadow-lg">
            <CardContent className="p-6 text-center">
              <Lock className="w-12 h-12 mx-auto mb-4 text-blue-500" />
              <h3 className="font-bold text-[#1a1a2e] mb-2">تشفير قوي</h3>
              <p className="text-sm text-slate-600">جميع بياناتك محمية بأحدث تقنيات التشفير</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-lg">
            <CardContent className="p-6 text-center">
              <Shield className="w-12 h-12 mx-auto mb-4 text-green-500" />
              <h3 className="font-bold text-[#1a1a2e] mb-2">حماية متقدمة</h3>
              <p className="text-sm text-slate-600">أنظمة أمنية متطورة لحماية معلوماتك</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-lg">
            <CardContent className="p-6 text-center">
              <FileCheck className="w-12 h-12 mx-auto mb-4 text-purple-500" />
              <h3 className="font-bold text-[#1a1a2e] mb-2">الامتثال القانوني</h3>
              <p className="text-sm text-slate-600">نلتزم بجميع قوانين حماية البيانات</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}