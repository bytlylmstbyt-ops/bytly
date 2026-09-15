import { supabase } from '@/lib/supabaseClient';

const CHANNELS = [
  { id: 'direct_outreach', name: 'تواصل مباشر', priority: 'لا غنى عنه', audience: 'العملاء وأصحاب المشاريع والمهندسون والمكاتب والشركات الهندسية والمقاولون والموردون', how: 'استهداف شرائح محددة برسائل وقوائم متابعة مبنية على بيانات المنصة، مع تسجيل النتيجة كاقتراح أو مهمة بعد الموافقة.' },
  { id: 'linkedin', name: 'لينكدإن', priority: 'عالية', audience: 'المهندسون والمكاتب والشركات والمطورون والقطاع المهني', how: 'محتوى مهني قصير، لقطات حقيقية من بيتلي، قصص مشاريع، ومحتوى يستهدف احتياجات الهندسة والإنشاءات.' },
  { id: 'sector_events', name: 'فعاليات القطاع', priority: 'متوسطة', audience: 'المطورون والمكاتب والشركات والمقاولون والجهات المهنية', how: 'اختيار الفعاليات ذات الصلة، بناء قائمة لقاءات وشراكات، وقياس فرص العملاء والشركاء الناتجة عنها.' },
  { id: 'seo_geo', name: 'SEO / GEO', priority: 'عالية', audience: 'أصحاب المشاريع والعملاء الباحثون عن خدمات هندسية', how: 'اكتشاف الطلب من بيانات المشاريع والتسجيلات، ثم اقتراح صفحات ومقالات وأسئلة وأجوبة تستهدف نية البحث.' },
  { id: 'paid_ads', name: 'الإعلانات المدفوعة', priority: 'متوسطة', audience: 'شرائح العملاء والمهندسين بحسب المدينة ونوع الخدمة', how: 'اقتراح حملات واختبارات رسائل وجمهور وميزانية، دون نشر أو إنفاق تلقائي.' },
  { id: 'referrals', name: 'الإحالات والشراكات', priority: 'عالية', audience: 'المهندسون والعملاء والمكاتب والشركات والشركاء', how: 'اكتشاف المستخدمين والكيانات ذات النشاط الجيد واقتراح برامج إحالة أو شراكات قابلة للقياس.' },
];

const safeCount = async (table, filter) => {
  let q = supabase.from(table).select('*', { count: 'exact', head: true });
  if (filter) q = filter(q);
  const { count, error } = await q;
  return error ? { count: 0, error: error.message } : { count: count || 0, error: null };
};

export async function getMarketingAgentSnapshot() {
  const [projects, engineers, clients, firms, socialPosts, registrations] = await Promise.all([
    safeCount('projects'),
    safeCount('engineers'),
    safeCount('clients'),
    safeCount('engineering_firms'),
    safeCount('social_posts'),
    safeCount('registration_attempts'),
  ]);

  const [{ data: recentProjects }, { data: recentPosts }, { data: recentRegistrations }] = await Promise.all([
    supabase.from('projects').select('id,title,category,project_type,location,status,created_at,client_id,assigned_engineer_id').order('created_at', { ascending: false }).limit(100),
    supabase.from('social_posts').select('id,platform,status,scheduled_at,published_at,created_at,metrics,content').order('created_at', { ascending: false }).limit(100),
    supabase.from('registration_attempts').select('id,email,status,error_stage,created_at').order('created_at', { ascending: false }).limit(100),
  ]);

  return {
    generated_at: new Date().toISOString(),
    counts: { projects: projects.count, engineers: engineers.count, clients: clients.count, firms: firms.count, social_posts: socialPosts.count, registration_attempts: registrations.count },
    recent_projects: recentProjects || [],
    recent_posts: recentPosts || [],
    recent_registrations: recentRegistrations || [],
    channels: CHANNELS,
  };
}

function groupCount(items, key) {
  return items.reduce((acc, item) => {
    const value = item?.[key] || 'غير محدد';
    acc[value] = (acc[value] || 0) + 1;
    return acc;
  }, {});
}

export function buildMarketingInsights(snapshot) {
  const insights = [];
  const projects = snapshot.recent_projects || [];
  const registrations = snapshot.recent_registrations || [];
  const posts = snapshot.recent_posts || [];

  const categories = groupCount(projects, 'category');
  const locations = groupCount(projects, 'location');
  const topCategory = Object.entries(categories).sort((a, b) => b[1] - a[1])[0];
  const topLocation = Object.entries(locations).sort((a, b) => b[1] - a[1])[0];

  if (topLocation && topLocation[1] >= 2) {
    insights.push({ type: 'market_gap', priority: 'عالية', title: `فرصة استقطاب في ${topLocation[0]}`, evidence: `هذه المدينة تظهر ${topLocation[1]} مشروعًا ضمن آخر البيانات التي حللها الوكيل.`, recommendation: `اختبار حملة تواصل مباشر لاستقطاب مهندسين ومقدمي خدمات في ${topLocation[0]}، ثم قياس التسجيلات المؤهلة.` });
  }
  if (topCategory && topCategory[1] >= 2) {
    insights.push({ type: 'content', priority: 'عالية', title: `محتوى حول ${topCategory[0]}`, evidence: `الفئة ظهرت ${topCategory[1]} مرة ضمن أحدث المشاريع.`, recommendation: `إنشاء موضوع SEO/GEO ومنشور LinkedIn يشرح كيف تحل بيتلي احتياج هذه الفئة.` });
  }

  const failed = registrations.filter(r => ['failed', 'error'].includes(String(r.status).toLowerCase()));
  if (failed.length) {
    insights.push({ type: 'conversion', priority: 'عالية', title: 'تسرب في التسجيل يحتاج معالجة', evidence: `${failed.length} محاولة تسجيل حديثة تحمل حالة فشل.`, recommendation: 'مراجعة مرحلة الخطأ والرسالة للمستخدم قبل إطلاق أي حملة اكتساب جديدة، ثم اقتراح حملة إعادة استهداف فقط بعد إصلاح المسار.' });
  }

  const published = posts.filter(p => String(p.status).toLowerCase() === 'published').length;
  if (published === 0) {
    insights.push({ type: 'channel', priority: 'متوسطة', title: 'لا توجد منشورات منشورة مسجلة بعد', evidence: 'لا توجد منشورات بحالة published في بيانات مركز التسويق.', recommendation: 'اقتراح أول حزمة محتوى LinkedIn تجريبية من 3 منشورات، لكن إبقاء النشر تحت موافقة صاحبة المنصة.' });
  }

  if (!insights.length) {
    insights.push({ type: 'baseline', priority: 'متوسطة', title: 'البيانات الحالية لا تكفي لإثبات فرصة محددة', evidence: 'لم يجد الوكيل نمطًا قويًا وفق قواعد التحليل الحالية.', recommendation: 'جمع بيانات إضافية ثم إعادة التحليل بدل اختلاق أرقام أو افتراضات.' });
  }
  return insights;
}

export async function saveMarketingSuggestions(suggestions, snapshot) {
  const user = (await supabase.auth.getUser()).data?.user;
  if (!user) throw new Error('يجب تسجيل الدخول لحفظ اقتراحات الوكيل.');
  const rows = suggestions.map((s) => ({
    name: `[Marketing Agent] ${s.title}`,
    description: `${s.evidence || ''}\n\nالتوصية: ${s.recommendation || ''}`.trim(),
    is_active: false,
    trigger_type: 'manual',
    category: 'marketing',
    actions: [{ type: 'marketing_suggestion', channel: s.type, priority: s.priority, recommendation: s.recommendation }],
    conditions: { snapshot_generated_at: snapshot.generated_at },
    is_source_workflow: false,
    created_by: user.id,
  }));
  const { data, error } = await supabase.from('automation_rules').insert(rows).select();
  if (error) throw error;
  return data;
}

export { CHANNELS };
