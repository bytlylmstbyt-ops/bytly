import { supabase } from '@/lib/supabaseClient';

export const ENGAGEMENT_CHANNELS = {
  direct_outreach: {
    name: 'التواصل المباشر',
    audiences: ['أصحاب المشاريع والعملاء', 'المهندسون والمصممون', 'المكاتب والشركات الهندسية', 'المقاولون والموردون', 'المستثمرون والمطورون'],
    cadence: 'قائمة أسبوعية + متابعة 48–72 ساعة',
    kpi: 'جهات اتصال مؤهلة → ردود → اجتماعات → تسجيلات → مشاريع/صفقات',
  },
  linkedin: {
    name: 'LinkedIn',
    audiences: ['المهندسون', 'الشركات والمكاتب الهندسية', 'المطورون والمستثمرون', 'القطاع المهني الهندسي'],
    cadence: '3 منشورات قصيرة أسبوعيًا + تفاعل يومي مستهدف',
    kpi: 'وصول مهني → زيارات الملف/الموقع → محادثات → تسجيلات واجتماعات',
  },
  sector_events: {
    name: 'فعاليات ومؤتمرات القطاع',
    audiences: ['المطورون', 'شركات المقاولات', 'المكاتب الهندسية', 'الجهات المهنية', 'شركاء التقنية والخدمات'],
    cadence: 'رصد شهري + تحضير قبل الحدث + متابعة خلال 72 ساعة',
    kpi: 'لقاءات مؤهلة → اجتماعات متابعة → شراكات → فرص/صفقات',
  },
};

export function buildEngagementPlaybooks(snapshot = {}) {
  const projects = snapshot.recent_projects || [];
  const registrations = snapshot.recent_registrations || [];
  const posts = snapshot.recent_posts || [];
  const location = projects[0]?.location || 'المدن الأعلى طلبًا';
  const category = projects[0]?.category || 'الخدمات الهندسية';
  const failed = registrations.filter(r => ['failed', 'error'].includes(String(r.status).toLowerCase())).length;
  const published = posts.filter(p => String(p.status).toLowerCase() === 'published').length;

  return [
    {
      channel: 'direct_outreach',
      title: 'حملة تواصل مباشر متعددة الشرائح',
      priority: 'عالية',
      audience: ENGAGEMENT_CHANNELS.direct_outreach.audiences.join('، '),
      objective: 'بناء علاقات حقيقية وتحويل المحادثات إلى اجتماعات وفرص أعمال قابلة للمتابعة.',
      steps: [
        `استخراج قائمة مستهدفة مرتبطة بالطلب الظاهر في ${location} ونوع الخدمة ${category}.`,
        'تقسيم القائمة إلى عملاء، مهندسين، مكاتب/شركات، مقاولين ومطورين بدل إرسال رسالة واحدة للجميع.',
        'إرسال رسالة تعريفية قصيرة مخصصة لكل شريحة، ثم تسجيل الرد والمرحلة التالية في سجل المتابعة.',
        'تحويل المهتمين إلى مكالمة/اجتماع تعريفي ثم تسجيل النتيجة والفرصة.',
      ],
      cta: 'دعوة لاجتماع تعريفي أو إنشاء حساب حسب نوع الجهة.',
      guardrail: 'لا إرسال جماعي آلي ولا رسائل مزعجة؛ الوكيل يقترح القوائم والرسائل فقط، والإنسان يعتمد الإرسال.',
      evidence: `التحليل الحالي يشير إلى ${projects.length} مشروعًا محللًا و${failed} محاولة تسجيل متعثرة.`,
    },
    {
      channel: 'linkedin',
      title: 'سلسلة LinkedIn: بيتلي كما تعمل فعليًا',
      priority: published === 0 ? 'عالية جدًا' : 'عالية',
      audience: ENGAGEMENT_CHANNELS.linkedin.audiences.join('، '),
      objective: 'بناء المصداقية المهنية من خلال إظهار المنتج الحقيقي بدل الاكتفاء بإعلانات عامة.',
      steps: [
        'منشور قصير يعرض لقطة شاشة حقيقية من لوحة تحكم بيتلي مع طمس أي بيانات شخصية أو سرية.',
        'منشور قصير يشرح مشكلة هندسية واحدة وكيف تعالجها بيتلي، مع صورة/لقطة حقيقية.',
        'منشور قصير يعرض رحلة مشروع أو سير عمل داخل المنصة بدون كشف بيانات العملاء.',
        'التفاعل يوميًا مع منشورات المهندسين والشركات المستهدفة وفتح محادثات مهنية عند وجود سياق مناسب.',
      ],
      cta: 'زيارة بيتلي أو طلب عرض تعريفي للمنصة.',
      guardrail: 'لا نشر تلقائي؛ كل لقطة شاشة تمر بمراجعة بشرية للتأكد من عدم كشف بيانات العملاء أو المعلومات الحساسة.',
      evidence: published === 0 ? 'لا توجد منشورات منشورة حاليًا في بيانات مركز التسويق.' : `يوجد ${published} منشور منشور ويمكن البناء على الأداء السابق.`,
    },
    {
      channel: 'sector_events',
      title: 'خطة علاقات القطاع والمؤتمرات',
      priority: 'عالية',
      audience: ENGAGEMENT_CHANNELS.sector_events.audiences.join('، '),
      objective: 'تحويل الفعاليات من حضور عام إلى شبكة علاقات واجتماعات وصفقات قابلة للقياس.',
      steps: [
        'رصد المعارض والمؤتمرات والملتقيات الهندسية والإنشائية ذات الصلة بالسوق السعودي.',
        'قبل كل فعالية: بناء قائمة بالجهات والأشخاص المستهدفين وتحديد سبب التواصل مع كل جهة.',
        'أثناء الفعالية: تقديم بيتلي في محادثة قصيرة وطلب وسيلة متابعة مناسبة بدل الاكتفاء بتبادل البطاقات.',
        'بعد الفعالية خلال 72 ساعة: متابعة كل جهة، تصنيفها كفرصة/شراكة/اجتماع/غير مؤهل، وتحديد الخطوة التالية.',
        'قياس قيمة كل فعالية بعد 30 و90 يومًا لمعرفة أي الفعاليات تستحق العودة إليها.',
      ],
      cta: 'اجتماع تعريفي / تجربة المنصة / شراكة تجارية.',
      guardrail: 'لا يتم حجز أو دفع رسوم مشاركة في فعالية إلا بعد موافقة صريحة على التكلفة والهدف.',
      evidence: 'العلاقات واللقاءات المهنية قناة اكتساب مستقلة عن الإعلانات ويمكن قياسها كفرص واجتماعات وصفقات.',
    },
  ];
}

export async function saveEngagementPlaybooks(playbooks, runId = null) {
  const rows = playbooks.map(p => ({
    run_id: runId,
    channel: p.channel,
    priority: p.priority,
    audience: p.audience,
    objective: p.objective,
    message_angle: p.title,
    offer_cta: p.cta,
    budget_suggestion: p.channel === 'sector_events' ? 'يحدد لكل فعالية بعد الموافقة' : 'منخفض/حسب الموارد الحالية',
    kpi: p.channel === 'direct_outreach' ? ENGAGEMENT_CHANNELS.direct_outreach.kpi : p.channel === 'linkedin' ? ENGAGEMENT_CHANNELS.linkedin.kpi : ENGAGEMENT_CHANNELS.sector_events.kpi,
    cadence: ENGAGEMENT_CHANNELS[p.channel].cadence,
    expected_outcome: p.objective,
    evidence: p.evidence,
    evidence_snapshot: { steps: p.steps, guardrail: p.guardrail },
    status: 'proposed',
  }));
  const { data, error } = await supabase.from('marketing_channel_plans').insert(rows).select('*');
  if (error) throw error;
  return data || [];
}
