import { supabase } from '@/lib/supabaseClient';

const CHANNELS = [
  { id: 'direct_outreach', name: 'تواصل مباشر', audience: 'العملاء وأصحاب المشاريع والمهندسون والمكاتب والشركات الهندسية والمقاولون والموردون', how: 'استهداف شرائح محددة برسائل وقوائم متابعة مبنية على بيانات المنصة، مع تسجيل النتيجة وقياس التحويل.' },
  { id: 'linkedin', name: 'لينكدإن', audience: 'المهندسون والمكاتب والشركات والمطورون والقطاع المهني', how: 'محتوى مهني قصير، لقطات حقيقية من بيتلي، قصص مشاريع، ورسائل موجهة للجمهور المهني.' },
  { id: 'sector_events', name: 'فعاليات القطاع', audience: 'المطورون والمكاتب والشركات والمقاولون والجهات المهنية', how: 'اختيار الفعاليات ذات الصلة، بناء قائمة لقاءات وشراكات، وقياس الفرص الناتجة عنها.' },
  { id: 'seo_geo', name: 'SEO / GEO', audience: 'أصحاب المشاريع والعملاء الباحثون عن خدمات هندسية', how: 'اكتشاف الطلب من بيانات المشاريع والتسجيلات ثم اقتراح صفحات ومقالات وأسئلة وأجوبة حسب نية البحث.' },
  { id: 'paid_ads', name: 'الإعلانات المدفوعة', audience: 'شرائح العملاء والمهندسين بحسب المدينة ونوع الخدمة', how: 'اقتراح حملات واختبارات جمهور ورسائل وميزانيات، دون نشر أو إنفاق تلقائي.' },
  { id: 'referrals', name: 'الإحالات والشراكات', audience: 'المهندسون والعملاء والمكاتب والشركات والشركاء', how: 'اكتشاف الشرائح النشطة واقتراح برامج إحالة أو شراكات قابلة للقياس.' },
];

function errorText(value, depth = 0) {
  if (value == null || depth > 8) return '';
  if (typeof value === 'string') {
    const text = value.trim();
    if (!text || text === '[object Object]' || text.toLowerCase() === 'object object') return '';
    return text;
  }
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (value instanceof Error) return errorText(value.message, depth + 1) || errorText(value.cause, depth + 1);
  if (Array.isArray(value)) return value.map((item) => errorText(item, depth + 1)).filter(Boolean).join(' | ');
  if (typeof value === 'object') {
    for (const key of ['message', 'error', 'details', 'detail', 'hint', 'reason', 'code']) {
      if (value[key] != null) {
        const text = errorText(value[key], depth + 1);
        if (text && text !== '[object Object]' && text !== 'Object object') return text;
      }
    }
    try {
      const json = JSON.stringify(value);
      if (json && json !== '{}') return json;
    } catch {}
  }
  return '';
}

const safeCount = async (table, filter) => {
  let q = supabase.from(table).select('*', { count: 'exact', head: true });
  if (filter) q = filter(q);
  const { count, error } = await q;
  return error ? { count: null, error: errorText(error) || 'تعذر قراءة عدد السجلات.' } : { count: count || 0, error: null };
};

export async function getMarketingAgentSnapshot() {
  const [projects, engineers, clients, firms, socialPosts, registrations] = await Promise.all([
    safeCount('projects'), safeCount('engineers'), safeCount('clients'),
    safeCount('engineering_firms'), safeCount('social_posts'), safeCount('registration_attempts'),
  ]);
  const [{ data: recentProjects, error: projectsError }, { data: recentPosts, error: postsError }, { data: recentRegistrations, error: registrationsError }] = await Promise.all([
    supabase.from('projects').select('id,title,category,project_type,location,status,created_at,client_id,assigned_engineer_id').order('created_at', { ascending: false }).limit(100),
    supabase.from('social_posts').select('id,platform,status,scheduled_at,published_at,created_at,metrics,content').order('created_at', { ascending: false }).limit(100),
    supabase.from('registration_attempts').select('id,email,status,error_stage,created_at').order('created_at', { ascending: false }).limit(100),
  ]);
  const errors = [
    ['projects', projectsError], ['social_posts', postsError], ['registration_attempts', registrationsError],
    ['projects_count', projects.error], ['engineers_count', engineers.error], ['clients_count', clients.error],
    ['engineering_firms_count', firms.error], ['social_posts_count', socialPosts.error], ['registration_attempts_count', registrations.error],
  ].filter(([, value]) => Boolean(value));
  if (errors.length) {
    const [source, value] = errors[0];
    const detail = errorText(value) || 'خطأ غير معروف';
    throw new Error(`تعذر قراءة بيانات التحليل من ${source}: ${detail}`);
  }
  return {
    generated_at: new Date().toISOString(),
    counts: { projects: projects.count, engineers: engineers.count, clients: clients.count, firms: firms.count, social_posts: socialPosts.count, registration_attempts: registrations.count },
    recent_projects: recentProjects || [], recent_posts: recentPosts || [], recent_registrations: recentRegistrations || [], channels: CHANNELS,
  };
}

function toDisplayText(value, fallback = 'غير محدد', depth = 0) {
  if (value == null || value === '') return fallback;
  if (depth > 6) return fallback;
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) {
    const parts = value.map((item) => toDisplayText(item, '', depth + 1)).filter(Boolean);
    return parts.length ? parts.join('، ') : fallback;
  }
  if (typeof value === 'object') {
    for (const key of ['name', 'label', 'title', 'value', 'text', 'city', 'region', 'location', 'content']) {
      if (value[key] != null) {
        const text = toDisplayText(value[key], '', depth + 1);
        if (text) return text;
      }
    }
    try { return JSON.stringify(value, null, 2); } catch { return fallback; }
  }
  return fallback;
}

function groupCount(items, key) {
  return items.reduce((acc, item) => {
    const value = toDisplayText(item?.[key]);
    acc[value] = (acc[value] || 0) + 1;
    return acc;
  }, {});
}
function priorityScore({ demand = 0, supply = 0, conversionRisk = 0, contentGap = 0, executionGap = 0 }) {
  return demand * 3 + Math.max(0, demand - supply) * 4 + conversionRisk * 5 + contentGap * 2 + executionGap * 2;
}
function priorityLabel(score) {
  if (score >= 18) return 'عالية جدًا';
  if (score >= 10) return 'عالية';
  if (score >= 5) return 'متوسطة';
  return 'منخفضة';
}
function channelById(id) { return CHANNELS.find(c => c.id === id); }

export function buildMarketingInsights(snapshot) {
  const projects = snapshot.recent_projects || [];
  const registrations = snapshot.recent_registrations || [];
  const posts = snapshot.recent_posts || [];
  const insights = [];
  const categories = groupCount(projects, 'category');
  const locations = groupCount(projects, 'location');
  const topCategory = Object.entries(categories).sort((a, b) => b[1] - a[1])[0];
  const topLocation = Object.entries(locations).sort((a, b) => b[1] - a[1])[0];
  const failed = registrations.filter(r => ['failed', 'error'].includes(String(r.status).toLowerCase()));
  const published = posts.filter(p => String(p.status).toLowerCase() === 'published').length;
  if (topLocation) {
    const demand = topLocation[1];
    const supply = Math.min(snapshot.counts.engineers || 0, demand);
    const score = priorityScore({ demand, supply, contentGap: published === 0 ? 1 : 0 });
    const c = channelById('direct_outreach');
    insights.push({ type: 'market_gap', channel: c.id, priority: priorityLabel(score), title: `استقطاب مهندسين ومقدمي خدمات في ${topLocation[0]}`, audience: c.audience, objective: 'تقليل فجوة العرض حول المناطق التي يظهر فيها طلب فعلي.', message_angle: `ابدأ من الطلب الحقيقي الظاهر في ${topLocation[0]} بدل حملة عامة.`, evidence: `ظهرت ${demand} مشاريع ضمن أحدث 100 مشروع محلل.`, recommendation: `بناء قائمة مستهدفة لمهندسي ومقدمي خدمات ${topLocation[0]}، ثم التواصل معهم وقياس التسجيلات المؤهلة.` });
  }
  if (topCategory) {
    const score = priorityScore({ demand: topCategory[1], contentGap: 1 });
    const c = channelById('seo_geo');
    insights.push({ type: 'content', channel: c.id, priority: priorityLabel(score), title: `محتوى يستهدف الطلب على ${topCategory[0]}`, audience: c.audience, objective: 'تحويل الطلب الموجود إلى اكتشاف عضوي ومحتوى متخصص.', message_angle: `حل مشكلة مرتبطة بـ${topCategory[0]} من واقع استخدام المنصة.`, evidence: `الفئة ظهرت ${topCategory[1]} مرة ضمن أحدث المشاريع المحللة.`, recommendation: `اقتراح صفحة SEO/GEO + مقال + منشور LinkedIn حول ${topCategory[0]}، ثم قياس الزيارات والتحويل إلى تسجيل أو مشروع.` });
  }
  if (failed.length) {
    const score = priorityScore({ conversionRisk: failed.length });
    const c = channelById('direct_outreach');
    insights.push({ type: 'conversion', channel: c.id, priority: priorityLabel(score), title: 'معالجة تسرب التسجيل قبل توسيع الاكتساب', audience: 'المستخدمون الذين بدأوا التسجيل ولم يكملوه', objective: 'رفع إكمال التسجيل قبل زيادة الإنفاق التسويقي.', message_angle: 'حل العائق أولًا ثم إعادة الاستهداف.', evidence: `${failed.length} محاولة تسجيل حديثة بحالة فشل.`, recommendation: 'تحليل error_stage ورسالة الخطأ، إصلاح المسار، ثم إنشاء رسالة متابعة للمستخدمين المتأثرين فقط.' });
  }
  if (published === 0) {
    const c = channelById('linkedin');
    insights.push({ type: 'channel', channel: c.id, priority: 'عالية', title: 'إطلاق أول حزمة محتوى مهني قابلة للقياس', audience: c.audience, objective: 'بناء حضور مهني حقيقي قبل التوسع في الإعلانات.', message_angle: 'لقطات حقيقية من بيتلي + مشكلة هندسية واضحة + دعوة واحدة للفعل.', evidence: 'لا توجد منشورات بحالة published في بيانات مركز التسويق.', recommendation: 'إعداد 3 منشورات تجريبية، مع KPI لكل منشور، وإبقاء النشر تحت موافقة صاحبة المنصة.' });
  }
  if (!insights.length) insights.push({ type: 'baseline', channel: 'seo_geo', priority: 'متوسطة', title: 'البيانات الحالية لا تكفي لإثبات فرصة محددة', audience: '—', objective: 'رفع جودة القرار قبل التنفيذ.', message_angle: 'لا نفترض ما لا تدعمه البيانات.', evidence: 'لم يظهر نمط قوي وفق قواعد التحليل الحالية.', recommendation: 'جمع بيانات إضافية ثم إعادة التحليل بدل اختلاق أرقام أو افتراضات.' });
  return insights.map(x => ({ ...x, status: 'proposed' }));
}

export function buildChannelPlans(snapshot, insights = buildMarketingInsights(snapshot)) {
  const failed = (snapshot.recent_registrations || []).filter(r => ['failed', 'error'].includes(String(r.status).toLowerCase())).length;
  const projects = snapshot.recent_projects || [];
  const posts = snapshot.recent_posts || [];
  const locations = groupCount(projects, 'location');
  const categories = groupCount(projects, 'category');
  const topLocation = Object.entries(locations).sort((a, b) => b[1] - a[1])[0]?.[0] || 'المدن ذات الطلب الأعلى';
  const topCategory = Object.entries(categories).sort((a, b) => b[1] - a[1])[0]?.[0] || 'الخدمات الهندسية المطلوبة';
  const published = posts.filter(p => String(p.status).toLowerCase() === 'published').length;
  const hasInsight = id => insights.some(i => i.channel === id);
  const scoreFor = id => {
    const matching = insights.filter(i => i.channel === id);
    const weights = { 'عالية جدًا': 4, 'عالية': 3, 'متوسطة': 2, 'منخفضة': 1 };
    return Math.max(1, ...matching.map(i => weights[i.priority] || 1));
  };
  const plans = [
    { channel: 'direct_outreach', priority: scoreFor('direct_outreach') >= 4 ? 'عالية جدًا' : scoreFor('direct_outreach') >= 3 ? 'عالية' : 'متوسطة', audience: `مهندسو ومقدمو خدمات ${topLocation} + المستخدمون المتعثرون في التسجيل`, objective: 'رفع المعروض المؤهل وتحويل التواصل إلى تسجيلات ومشاريع مكتملة.', message_angle: 'البدء من طلب حقيقي داخل بيتلي وليس رسالة جماعية عامة.', offer_cta: 'أنشئ حسابك الآن / تواصل مع بيتلي', budget_suggestion: 'منخفض — تواصل يدوي أولًا قبل أي إنفاق.', kpi: 'عدد جهات الاتصال المؤهلة → الردود → التسجيلات المكتملة → المشاريع الناتجة', cadence: 'قائمة أسبوعية + متابعة خلال 48–72 ساعة', expected_outcome: 'زيادة العرض المؤهل واكتشاف الشرائح الأكثر استجابة.', evidence: `المدينة الأعلى ظهورًا في المشاريع: ${topLocation}; محاولات التسجيل المتعثرة: ${failed}.`, score: scoreFor('direct_outreach') },
    { channel: 'linkedin', priority: published === 0 ? 'عالية' : 'متوسطة', audience: 'المهندسون والمكاتب والشركات والمطورون والقطاع المهني', objective: 'بناء ثقة مهنية وتحويل الاهتمام إلى زيارات وتسجيلات.', message_angle: 'محتوى مهني مرتبط بمشكلة هندسية واقعية.', offer_cta: 'اكتشف Bytly / أنشئ حسابك', budget_suggestion: 'عضوي أولًا؛ ثم اختبار مدفوع بعد وجود محتوى قابل للقياس.', kpi: 'الوصول → التفاعل → النقرات → التسجيلات', cadence: '3 منشورات أسبوعيًا', expected_outcome: 'تكوين قناة محتوى قابلة للقياس.', evidence: `عدد المنشورات المنشورة: ${published}.`, score: scoreFor('linkedin') },
    { channel: 'seo_geo', priority: scoreFor('seo_geo') >= 3 ? 'عالية' : 'متوسطة', audience: `أصحاب المشاريع الباحثون عن ${topCategory}`, objective: 'تحويل نية البحث إلى زيارات مؤهلة وتسجيلات.', message_angle: `محتوى متخصص حول ${topCategory}.`, offer_cta: 'ابحث عن الخدمة الهندسية المناسبة عبر Bytly', budget_suggestion: 'ميزانية محتوى/تحسين منخفضة في البداية.', kpi: 'الظهور → النقرات → الزيارات المؤهلة → التسجيلات', cadence: 'مقال/صفحة أسبوعيًا + تحديثات مستمرة', expected_outcome: 'بناء أصل محتوى قابل للتراكم.', evidence: `أعلى فئة ظاهرة في أحدث المشاريع: ${topCategory}.`, score: scoreFor('seo_geo') },
    { channel: 'paid_ads', priority: 'متوسطة', audience: 'شرائح العملاء والمهندسين حسب الخدمة والموقع', objective: 'اختبار اكتساب مدفوع بعد ضبط مسار التحويل.', message_angle: 'رسالة واحدة لكل شريحة مع صفحة هبوط واضحة.', offer_cta: 'أنشئ حسابك الآن', budget_suggestion: 'اختبار صغير على مراحل، مع سقف إنفاق وموافقة يدوية.', kpi: 'CPC → التسجيل المكتمل → تكلفة التسجيل → المشروع المؤهل', cadence: 'اختبار 7–14 يومًا ثم قرار مبني على البيانات', expected_outcome: 'معرفة الشرائح والرسائل التي تستحق التوسع.', evidence: 'الخطط الإعلانية مقترحة فقط؛ لا يوجد نشر أو إنفاق تلقائي.', score: 1 },
  ];
  return plans.map(p => ({ ...p, has_insight: hasInsight(p.channel), status: 'proposed' }));
}

export async function saveMarketingSuggestions(insights, snapshot, channelPlans) {
  const recommendations = insights.map((x) => ({ title: x.title, type: x.type, channel: x.channel, priority: x.priority, audience: x.audience, objective: x.objective, message_angle: x.message_angle, evidence: x.evidence, recommendation: x.recommendation, status: 'proposed', source: 'marketing-agent', source_snapshot: snapshot }));
  const { data: recData, error: recError } = await supabase.from('marketing_recommendations').insert(recommendations).select('*');
  if (recError) throw new Error(errorText(recError) || 'تعذر حفظ توصيات التسويق.');
  const plans = channelPlans.map((x) => ({ ...x, source_snapshot: snapshot }));
  const { data: planData, error: planError } = await supabase.from('marketing_channel_plans').insert(plans).select('*');
  if (planError) throw new Error(errorText(planError) || 'تعذر حفظ خطط القنوات.');
  return { recommendations: recData || [], channelPlans: planData || [] };
}

export async function approveRecommendations(ids) {
  const { data, error } = await supabase.from('marketing_recommendations').update({ status: 'approved', approved_at: new Date().toISOString() }).in('id', ids).select('*');
  if (error) throw new Error(errorText(error) || 'تعذر اعتماد التوصيات.'); return data || [];
}
export async function approveChannelPlans(ids) {
  const { data, error } = await supabase.from('marketing_channel_plans').update({ status: 'approved', approved_at: new Date().toISOString() }).in('id', ids).select('*');
  if (error) throw new Error(errorText(error) || 'تعذر اعتماد خطط القنوات.'); return data || [];
}
export async function createTasksFromRecommendations(ids) {
  const { data: recs, error: recError } = await supabase.from('marketing_recommendations').select('*').in('id', ids);
  if (recError) throw new Error(errorText(recError) || 'تعذر قراءة التوصيات.');
  if (!recs?.length) return [];
  const tasks = recs.map(r => ({ title: r.title, description: `${r.objective}\n\n${r.recommendation}\n\nالدليل: ${r.evidence}`, status: 'pending_approval', priority: r.priority, source: 'marketing-agent', recommendation_id: r.id }));
  const { data, error } = await supabase.from('marketing_tasks').insert(tasks).select('*');
  if (error) throw new Error(errorText(error) || 'تعذر إنشاء المهام.'); return data || [];
}

export { CHANNELS };
