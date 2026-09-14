import React, { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, FileText, Lock, Briefcase } from "lucide-react";

export default function LegalTermsSection({ onAcceptanceChange, isEditMode = false }) {
  const [acceptedTerms, setAcceptedTerms] = useState({
    confidentiality: false,
    responsibility: false,
    intellectual_property: false,
    all_terms: false
  });

  const handleAcceptance = (key, value) => {
    const newState = { ...acceptedTerms, [key]: value };
    
    // Check if all individual terms are accepted
    if (newState.confidentiality && newState.responsibility && newState.intellectual_property) {
      newState.all_terms = true;
    } else {
      newState.all_terms = false;
    }
    
    setAcceptedTerms(newState);
    onAcceptanceChange?.(newState);
  };

  const TermCard = ({ icon: Icon, title, items, keyName }) => (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6"
    >
      <Card className="border-l-4 border-l-[#C9A66B]">
        <CardHeader>
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
              <Icon className="w-5 h-5 text-[#C9A66B]" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-lg">{title}</CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-slate-50 rounded-lg p-4 text-sm text-slate-700 leading-relaxed space-y-3">
            {items.map((item, idx) => (
              <div key={idx} className="flex gap-3">
                <span className="text-[#C9A66B] font-bold flex-shrink-0">•</span>
                <p>{item}</p>
              </div>
            ))}
          </div>

          {!isEditMode && (
            <div className="flex items-center gap-3 pt-4 border-t">
              <Checkbox
                id={`accept-${keyName}`}
                checked={acceptedTerms[keyName]}
                onCheckedChange={(checked) => handleAcceptance(keyName, checked)}
              />
              <Label 
                htmlFor={`accept-${keyName}`}
                className="cursor-pointer flex items-center gap-2 text-sm"
              >
                أوافق على هذا البند
                {acceptedTerms[keyName] && (
                  <Badge className="bg-green-100 text-green-700 text-xs">موافق</Badge>
                )}
              </Label>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200"
      >
        <div className="flex gap-3">
          <AlertCircle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
          <div>
            <h3 className="font-bold text-blue-900 mb-1">الشروط والأحكام القانونية</h3>
            <p className="text-sm text-blue-700">
              يجب عليك قراءة والموافقة على جميع البنود القانونية قبل الانضمام كمستشار قانوني في منصة بيتلي
            </p>
          </div>
        </div>
      </motion.div>

      {/* Confidentiality */}
      <TermCard
        icon={Lock}
        title="بند السرية والخصوصية"
        keyName="confidentiality"
        items={[
          "يلتزم المستشار القانوني بالحفاظ على سرية كاملة لجميع بيانات المهندسين والعملاء والمشاريع المطلع عليها.",
          "عدم الإفصاح عن أي معلومات شخصية أو مالية أو تقنية لأطراف ثالثة دون موافقة صريحة.",
          "استخدام المعلومات المطلع عليها فقط لغرض تقديم الخدمات القانونية المطلوبة.",
          "الالتزام بقوانين حماية البيانات الشخصية والخصوصية المعمول بها في المملكة العربية السعودية."
        ]}
      />

      {/* Responsibility */}
      <TermCard
        icon={Briefcase}
        title="بند المسؤولية"
        keyName="responsibility"
        items={[
          "يتحمل المستشار القانوني مسؤولية كاملة عن جودة المراجعات والاستشارات القانونية المقدمة.",
          "يجب أن تكون المراجعات متوافقة مع القوانين السعودية والمعايير الدولية للممارسة القانونية.",
          "المستشار مسؤول عن اكتشاف الأخطاء والتناقضات في العقود والاتفاقيات.",
          "في حالة إهمال المستشار أو تقصيره، تتحمل منصة بيتلي بالتعويضات اللازمة وتحتفظ بحق المقاضاة."
        ]}
      />

      {/* Intellectual Property */}
      <TermCard
        icon={FileText}
        title="بند حقوق الملكية الفكرية"
        keyName="intellectual_property"
        items={[
          "جميع القوالب والنماذج القانونية المستخدمة في منصة بيتلي هي ملك حصري للمنصة.",
          "لا يحق للمستشار القانوني نسخ أو نقل أو استخدام النماذج القانونية في خدمات خارج المنصة.",
          "جميع الاستشارات والآراء القانونية المقدمة من قبل المستشار محمية بموجب حقوق النشر.",
          "للمنصة الحق في استخدام آراء المستشار وخبرته لتحسين الخدمات دون الإشارة إلى اسمه (إن أمكن)."
        ]}
      />

      {/* Acceptance Summary */}
      {!isEditMode && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-amber-50 border-2 border-amber-200 rounded-lg p-6"
        >
          <div className="space-y-4">
            <h4 className="font-bold text-amber-900">ملخص الموافقة</h4>
            
            <div className="space-y-3">
              {[
                { key: 'confidentiality', label: 'السرية والخصوصية' },
                { key: 'responsibility', label: 'المسؤولية' },
                { key: 'intellectual_property', label: 'حقوق الملكية الفكرية' }
              ].map((item) => (
                <div key={item.key} className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                    acceptedTerms[item.key] 
                      ? 'bg-green-500 border-green-500' 
                      : 'bg-white border-slate-300'
                  }`}>
                    {acceptedTerms[item.key] && (
                      <span className="text-white text-sm">✓</span>
                    )}
                  </div>
                  <span className="text-sm text-amber-900">{item.label}</span>
                </div>
              ))}
            </div>

            {acceptedTerms.all_terms && (
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="mt-4 p-4 bg-green-100 border border-green-300 rounded-lg text-green-800 text-sm font-medium"
              >
                ✓ تم الموافقة على جميع الشروط والأحكام بنجاح
              </motion.div>
            )}

            {!acceptedTerms.all_terms && (
              <p className="text-sm text-amber-700 pt-2">
                يجب الموافقة على جميع البنود القانونية لإكمال التسجيل
              </p>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}