import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, ShieldCheck, FileText, ChevronRight } from 'lucide-react';

const TERMS_CONTENT = [
  {
    title: '1. الأهلية والاعتماد المهني',
    items: [
      'الترخيص المهني: يلتزم المزود بأن يكون حاصلاً على درجة البكالوريوس/الدبلوم في الهندسة المساحية أو ما يعادلها، وأن يكون مسجلاً ومصنفاً رسمياً لدى الجهات الحكومية والمهنية ذات العلاقة (مثل الهيئة السعودية للمهندسين)، مع تقديم ما يثبت سريان العضوية.',
      'الهوية الرقمية: يخضع المزود لإجراءات التحقق من الهوية والبيانات الشخصية والمهنية من قبل إدارة منصة بيتلي قبل تفعيل حسابه واستقبال الطلبات.'
    ]
  },
  {
    title: '2. المعايير الفنية للأجهزة والمعدات المستخدمة',
    items: [
      'دقة الأجهزة: يلتزم المزود باستخدام أجهزة ومعدات مساحية حديثة ومعايرة (مثل: Total Station, GPS/GNSS RTK, 3D Laser Scanners) تضمن دقة القياسات حسب المعايير الهندسية المتعارف عليها.',
      'نسبة الخطأ المسموح بها: يجب ألا تتجاوز نسبة الخطأ في الرفع المساحي الحدود الفنية المعتمدة دولياً ومحلياً لرفع قطع الأراضي والمباني السكنية والتجارية (بما يضمن مطابقة الواقع تماماً مع صك الملكية والتقرير المساحي).'
    ]
  },
  {
    title: '3. نطاق العمل والالتزامات الحقلية (على أرض الواقع)',
    items: [
      'المعاينة الفعلية: يلتزم المزود بالانتقال الفعلي للموقع الجغرافي المحدد في الطلب، ويحظر تماماً الاعتماد على الخرائط الرقمية أو التقديرية دون زيارة الموقع.',
      'توثيق الموقع: يجب على المزود التقاط صور فوتوغرافية واضحة للموقع أثناء عملية الرفع (الأركان، الواجهة، الشوارع المحيطة) وإرفاقها كإثبات زيارة حقلي ضمن التقرير النهائي.',
      'رصد المؤشرات الجغرافية والفنية: يلتزم المزود برصد وتوثيق حدود وأبعاد قطعة الأرض الفعلية ومطابقتها مع الصك، وعروض الشوارع المحيطة والاتجاهات الأربعة بدقة، والارتدادات القائمة (في حال المباني القائمة)، ومناسيب الأرض إذا تطلب الأمر.'
    ]
  },
  {
    title: '4. مواصفات وجودة المخرجات والملفات الرقمية',
    items: [
      'الملفات الهندسية المفتوحة: تسليم المخطط بصيغة أوتوكاد (DWG أو DXF) على أن تكون الرسوم منسقة على طبقات (Layers) واضحة ومحددة (مثل: طبقة الحدود، طبقة الشوارع، طبقة الكتابات والمقاسات).',
      'الملفات الجاهزة للطباعة: تسليم نسخة من الكروكي أو التقرير المساحي بصيغة PDF بجودة عالية قابلة للقراءة والطباعة، موقعة ومختومة برقم اعتماده المهني.',
      'البيانات الرقمية (Smart Metadata): الالتزام بتعبئة الحقول الإلزامية في النموذج الذكي على المنصة (الأبعاد، الزوايا، الارتدادات، عرض الشارع) ومطابقتها تماماً لما هو موجود داخل ملفات الكاد المرفوعة.'
    ]
  },
  {
    title: '5. الحوكمة، المسؤولية الفنية، والضمانات',
    items: [
      'المسؤولية الكاملة عن البيانات: يتحمل المزود المسؤولية القانونية والفنية الكاملة عن أي خطأ في الرفع المساحي أو الكروكي المعتمد من قبله. وفي حال تبين وجود خطأ في المقاسات نتج عنه ضرر في المخططات المعمارية اللاحقة، يحق للمنصة وللعميل مطالبته بتعديل الرفع فوراً دون مقابل، أو اتخاذ الإجراءات القانونية اللازمة.',
      'الالتزام بالجدول الزمني: يلتزم المزود بالتوجه للموقع وتسليم الملفات خلال المدة الزمنية المحددة في تفاصيل الطلب (مثال: خلال 48 إلى 72 ساعة من قبول الطلب).',
      'سرية البيانات: يُحظر على المزود استخدام، مشاركة، أو إعادة نشر أي بيانات أو مخططات تخص عقارات العملاء خارج إطار منصة بيتلي، وتعتبر كافة المخرجات ملكاً خالصاً للعميل وللمنصة.'
    ]
  },
  {
    title: '6. السياسة المالية والإلغاء',
    items: [
      'استحقاق الدفع: يتم تحرير المبلغ المحجوز في نظام الضمان (Escrow) لصالح محفظة المزود فور موافقة العميل (أو المكتب الهندسي المشرف) على المخرجات وتحميلها.',
      'استقطاع المنصة: يوافق المزود على استقطاع منصة بيتلي لنسبتها التشغيلية المتفق عليها من قيمة كل معاملة بنجاح.',
      'الغش والتلاعب: في حال ثبت تزوير البيانات أو رفع ملفات كروكي وهمية أو قديمة دون زيارة الموقع، يتم حظر حساب المزود نهائياً، وتجميد مستحقاته في المحفظة، مع الاحتفاظ بحق المنصة في ملاحقته قضائياً.'
    ]
  }
];

export default function SurveyorTerms() {
  const navigate = useNavigate();
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const user = await base44.auth.me();
      if (!user) { navigate('/login'); return; }
      const profiles = await base44.entities.SurveyorProfile.filter({ email: user.email });
      if (profiles.length === 0) { navigate('/SurveyorGigs'); return; }
      const p = profiles[0];
      setProfile(p);
      if (p.terms_accepted) { navigate('/SurveyorGigs'); return; }
    } catch (e) {
      setError('تعذر تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    if (!agreed) return;
    setSubmitting(true);
    setError('');
    try {
      await base44.entities.SurveyorProfile.update(profile.id, {
        terms_accepted: true,
        terms_accepted_date: new Date().toISOString()
      });
      navigate('/SurveyorGigs');
    } catch (e) {
      setError('فشل حفظ الموافقة. حاول مرة أخرى.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen" dir="rtl">
        <Loader2 className="w-8 h-8 animate-spin text-[#C9A66B]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Header */}
      <div className="bg-gradient-to-l from-[#4A3F35] to-[#6B5D4F] text-white px-6 py-10">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => { if (window.history.length > 1) { navigate(-1); } else { navigate('/'); } }}
            className="md:hidden flex items-center gap-1 text-white/80 hover:text-white mb-6 transition-colors"
            aria-label="رجوع"
            style={{ minHeight: 44 }}
          >
            <ChevronRight className="w-5 h-5" />
            <span className="text-sm">رجوع</span>
          </button>
          <div className="text-center">
          <ShieldCheck className="w-14 h-14 mx-auto mb-4 text-[#C9A66B]" />
          <h1 className="text-2xl md:text-3xl font-bold mb-2">
            اتفاقية الشروط والأحكام الفنية للمساحين
          </h1>
          <p className="text-white/70 text-sm max-w-2xl mx-auto">
            تعتبر هذه الشروط والأحكام الفنية ملحقاً إلزامياً لشروط الاستخدام العامة لمنصة بيتلي (Bytly).
            بموجب موافقتك الإلكترونية على هذه الاتفاقية، تلتزم بكافة المعايير والضوابط الفنية أدناه لتقديم خدمات الرفع المساحي وإعداد الكروكيات.
          </p>
          </div>
        </div>
      </div>

      {/* Terms Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {TERMS_CONTENT.map((section, i) => (
          <Card key={i} className="border-gray-200">
            <CardContent className="p-5">
              <h3 className="text-lg font-bold text-[#4A3F35] mb-3 flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#C9A66B] shrink-0" />
                {section.title}
              </h3>
              <ul className="space-y-3">
                {section.items.map((item, j) => (
                  <li key={j} className="text-sm text-gray-700 leading-relaxed pr-4 border-r-2 border-[#C9A66B]/30 hover:border-[#C9A66B] transition-colors">
                    {item}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}

        {/* Acceptance */}
        <Card className="border-[#C9A66B]/40 bg-[#FDF8F0]">
          <CardContent className="p-6">
            <div className="flex items-start gap-3 mb-4">
              <Checkbox
                id="agree"
                checked={agreed}
                onCheckedChange={(c) => setAgreed(c === true)}
                className="mt-0.5 border-[#C9A66B] data-[state=checked]:bg-[#C9A66B] data-[state=checked]:border-[#C9A66B]"
              />
              <label htmlFor="agree" className="text-sm text-gray-700 cursor-pointer leading-relaxed">
                أقر بأنني اطلعت وفهمت كافة الشروط والأحكام الفنية أعلاه، وأوافق على الالتزام بها بشكل كامل عند تقديم خدمات الرفع المساحي والكروكيات عبر منصة بيتلي. كما أتحمل المسؤولية القانونية والفنية الكاملة عن أي مخالفة لهذه البنود.
              </label>
            </div>

            {error && (
              <p className="text-red-500 text-sm bg-red-50 p-3 rounded mb-4">{error}</p>
            )}

            <Button
              onClick={handleAccept}
              disabled={!agreed || submitting}
              className="w-full bg-[#4A3F35] hover:bg-[#3A2F25] text-white gap-2 h-12"
            >
              {submitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <ShieldCheck className="w-5 h-5" />
              )}
              أوافق على الشروط والأحكام الفنية
            </Button>

            <p className="text-xs text-gray-400 text-center mt-3">
              لن تتمكن من استقبال طلبات الرفع المساحي إلا بعد الموافقة على هذه الشروط
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}