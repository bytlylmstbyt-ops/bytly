import { supabase } from '@/lib/supabaseClient';

const CHANNELS = [
  { id: 'direct_outreach', name: 'تواصل مباشر', audience: 'العملاء وأصحاب المشاريع والمهندسون والمكاتب والشركات الهندسية والمقاولون والموردون', how: 'استهداف شرائح محددة برسائل وقوائم متابعة مبنية على بيانات المنصة، مع تسجيل النتيجة وقياس التحويل.' },
  { id: 'linkedin', name: 'لينكدإن', audience: 'المهندسون والمكاتب والشركات والمطورون والقطاع المهني', how: 'محتوى مهني قصير، لقطات حقيقية من بيتلي، قصص مشاريع، ورسائل موجهة للجمهور المهني.' },
  { id: 'sector_events', name: 'فعاليات القطاع', audience: 'المطورون والمكاتب والشركات والمقاولون والجهات المهنية', how: 'اختيار الفعاليات ذات الصلة، بناء قائمة لقاءات وشراكات، وقياس الفرص الناتجة عنها.' },
  { id: 'seo_geo', name: 'SEO / GEO', audience: 'أصحاب المشاريع والعملاء الباحثون عن خدمات هندسية', how: 'اكتشاف الطلب من بيانات المشاريع والتسجيلات ثم اقتراح صفحات ومقالات وأسئلة وأجوبة حسب نية البحث.' },
  { id: 'paid_ads', name: 'الإعلانات المدفوعة', audience: 'شرائح العملاء والمهندسين بحسب المدينة ونوع الخدمة', how: 'اقتراح حملات واختبارات جمهور ورسائل وميزانيات، دون نشر أو إنفاق تلقائي.' },
  { id: 'referrals', name: 'الإحالات والشراكات', audience: 'المهندسون والعملاء والمكاتب والشركات والشركاء', how: 'اكتشاف الشرائح النشطة واقتراح برامج إحالة أو شراكات قابلة للقياس.' },
];

const safeCount = async (table, filter) => {
  let q = supabase.from(table).select('*', { count: 'exact', head: true });
  if (filter) q = filter(q);
  const { count, error } = await q;
  return error ? { count: null, error: error.message } : { count: count || 0, error: null };
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
  const errors = [projectsError, postsError, registrationsError, projects.error, engineers.error, clients.error, firms.error, socialPosts.error, registrations.error].filter(Boolean);
  if (errors.length) throw new Error(`تعذر قراءة بيانات التحليل: ${errors[0]}`);
  return {
    generated_at: new Date().toISOString(),
    counts: { projects: projects.count, engineers: engineers.count, clients: clients.count, firms: firms.count, social_posts: socialPosts.count, registration_attempts: registrations.count },
    recent_projects: recentProjects || [], recent_posts: recentPosts || [], recent_registrations: recentRegistrations || [], channels: CHANNELS,
  };
}

function groupCount(items, key) {
  return items.reduce((acc, item) => { const value = item?.[key] || 'غير محدد'; acc[value] = (acc[value] || 0) + 1; return acc; }, {});
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
    { channel: 'linkedin', priority: published === 0 ? 'عالية' : 'متوسطة', audience: 'المهندسون والمكاتب والشركات والمطورون والقطاع المهني', objective: 'بناء ثقة مهنية وتحويل الاهتمام إلى زيارات وتسجيلات مؤهلة.', message_angle: `لقطات حقيقية من بيتلي + حالة استخدام مرتبطة بـ${topCategory} + CTA واحد.`, offer_cta: 'شاهد كيف تعمل بيتلي / أنشئ حسابك', budget_suggestion: '0 ريال للنشر العضوي؛ الإعلان لاحقًا بعد إثبات أفضل رسالة.', kpi: 'الوصول → النقرات → زيارات صفحة التسجيل → التسجيلات المكتملة', cadence: '3 منشورات أسبوعيًا + مراجعة KPI أسبوعية', expected_outcome: 'تحديد الرسائل المهنية الأعلى تفاعلًا قبل التوسع المدفوع.', evidence: `المنشورات المنشورة حاليًا: ${published}. الفئة الأبرز: ${topCategory}.`, score: published === 0 ? 3 : 2 },
    { channel: 'seo_geo', priority: topCategory !== 'الخدمات الهندسية المطلوبة' ? 'عالية' : 'متوسطة', audience: 'أصحاب المشاريع والعملاء الباحثون عن خدمات هندسية', objective: 'التقاط الطلب المتكرر من البحث وتحويله إلى زيارات ومشاريع.', message_angle: `محتوى متخصص حول ${topCategory} مبني على بيانات بيتلي الفعلية.`, offer_cta: 'اطلب خدمة هندسية / ابدأ مشروعك', budget_suggestion: 'منخفض — محتوى وصفحات أولًا.', kpi: 'الزيارات العضوية → CTR → التسجيلات → طلبات المشاريع', cadence: 'صفحة/موضوع واحد أسبوعيًا + تحديث شهري', expected_outcome: 'بناء أصول بحثية تراكمية بدل الاعتماد على الإعلانات فقط.', evidence: `الفئة الأبرز في أحدث المشاريع: ${topCategory}.`, score: scoreFor('seo_geo') },
    { channel: 'paid_ads', priority: failed > 0 ? 'منخفضة مؤقتًا' : 'متوسطة', audience: `جمهور ${topLocation} + شرائح مرتبطة بـ${topCategory}`, objective: 'اختبار رسائل وجماهير قابلة للقياس بعد استقرار التسجيل.', message_angle: 'رسالة واحدة لكل شريحة مع صفحة هبوط ومسار تحويل واضح.', offer_cta: 'أنشئ حسابك الآن', budget_suggestion: 'لا يُصرف تلقائيًا؛ ابدأ باختبار صغير بعد اعتماد الخطة.', kpi: 'CPC → تكلفة التسجيل المكتمل → تكلفة المشروع المؤهل', cadence: 'اختبار أسبوعين ثم قرار استمرار/إيقاف', expected_outcome: 'معرفة تكلفة اكتساب المستخدم المؤهل قبل رفع الميزانية.', evidence: failed > 0 ? `${failed} محاولات تسجيل متعثرة؛ لذلك الأولوية الحالية لإصلاح التحويل.` : 'لا توجد إشارة فشل تسجيل حديثة في العينة الحالية.', score: failed > 0 ? 1 : 2 },
    { channel: 'sector_events', priority: 'متوسطة', audience: 'المطورون والمكاتب والشركات والمقاولون والجهات المهنية', objective: 'فتح علاقات وشراكات وفرص B2B لا يمكن الوصول إليها بالإعلانات وحدها.', message_angle: 'بيتلي كمنظومة هندسية تربط أطراف المشروع في مسار واحد.', offer_cta: 'احجز لقاء تعريفي / شراكة', budget_suggestion: 'حسب الفعالية؛ لا اعتماد قبل تحديد العائد المتوقع.', kpi: 'جهات مستهدفة → لقاءات → فرص مؤهلة → شراكات/مشاريع', cadence: 'بحث شهري + خطة قبل كل فعالية', expected_outcome: 'بناء pipeline للشراكات والصفقات المهنية.', evidence: 'القناة مقترحة كمسار B2B، ولا تُنفذ فعالية قبل اعتمادها وتحديد التكلفة.', score: 2 },
    { channel: 'referrals', priority: 'متوسطة', audience: 'المستخدمون النشطون والمهندسون والعملاء والمكاتب والشركات', objective: 'تحويل الثقة الحالية إلى إحالات قابلة للقياس.', message_angle: 'مكافأة أو ميزة واضحة مقابل إحالة مستخدم مؤهل.', offer_cta: 'رشّح مهندسًا / رشّح صاحب مشروع', budget_suggestion: 'يُحدد بعد تصميم الحافز وحساب تكلفة الاكتساب.', kpi: 'الإحالات → التسجيلات المكتملة → المشاريع الناتجة → تكلفة الإحالة', cadence: 'مراجعة شهرية', expected_outcome: 'قناة اكتساب منخفضة التكلفة نسبيًا إذا ثبتت جودة الإحالات.', evidence: `حجم المنصة الحالي: ${snapshot.counts.clients || 0} عملاء و${snapshot.counts.engineers || 0} مهندسين و${snapshot.counts.firms || 0} شركات هندسية.`, score: 2 },
  ];
  return plans.map(p => ({ ...p, status: 'proposed' }));
}

export async function saveMarketingSuggestions(suggestions, snapshot, channelPlans = buildChannelPlans(snapshot, suggestions)) {
  const user = (await supabase.auth.getUser()).data?.user;
  if (!user) throw new Error('يجب تسجيل الدخول لحفظ اقتراحات الوكيل.');
  const { data: run, error: runError } = await supabase.from('marketing_agent_runs').insert({ status: 'completed', analysis_type: 'platform', data_snapshot: snapshot, insights_count: suggestions.length, completed_at: new Date().toISOString(), created_by: user.id }).select().single();
  if (runError) throw runError;
  const rows = suggestions.map(s => ({ run_id: run.id, channel: s.channel, title: s.title, priority: s.priority, audience: s.audience, objective: s.objective, message_angle: s.message_angle, recommendation: s.recommendation, evidence: s.evidence, evidence_snapshot: snapshot.counts, status: 'proposed' }));
  const { data, error } = await supabase.from('marketing_recommendations').insert(rows).select();
  if (error) throw error;
  const planRows = channelPlans.map(p => ({ run_id: run.id, channel: p.channel, priority: p.priority, audience: p.audience, objective: p.objective, message_angle: p.message_angle, offer_cta: p.offer_cta, budget_suggestion: p.budget_suggestion, kpi: p.kpi, cadence: p.cadence, expected_outcome: p.expected_outcome, evidence: p.evidence, evidence_snapshot: snapshot.counts, status: 'proposed' }));
  const { data: savedPlans, error: planError } = await supabase.from('marketing_channel_plans').insert(planRows).select();
  if (planError) throw planError;
  return { run, recommendations: data, channelPlans: savedPlans || [] };
}

export async function approveRecommendations(ids) {
  const user = (await supabase.auth.getUser()).data?.user;
  if (!user) throw new Error('يجب تسجيل الدخول.');
  const { data, error } = await supabase.from('marketing_recommendations').update({ status: 'approved', approved_at: new Date().toISOString(), approved_by: user.id, updated_at: new Date().toISOString() }).in('id', ids).eq('status', 'proposed').select();
  if (error) throw error;
  return data;
}

export async function approveChannelPlans(ids) {
  const user = (await supabase.auth.getUser()).data?.user;
  if (!user) throw new Error('يجب تسجيل الدخول.');
  const { data, error } = await supabase.from('marketing_channel_plans').update({ status: 'approved', approved_at: new Date().toISOString(), approved_by: user.id, updated_at: new Date().toISOString() }).in('id', ids).eq('status', 'proposed').select();
  if (error) throw error;
  return data;
}

export async function createTasksFromRecommendations(ids) {
  const { data: recs, error } = await supabase.from('marketing_recommendations').select('*').in('id', ids).eq('status', 'approved');
  if (error) throw error;
  if (!recs?.length) return [];
  const user = (await supabase.auth.getUser()).data?.user;
  const rows = recs.map(r => ({ recommendation_id: r.id, title: r.title, description: r.recommendation, channel: r.channel, priority: r.priority, status: 'pending_approval', source: 'marketing_agent', created_by: user?.id }));
  const { data: tasks, error: taskError } = await supabase.from('marketing_tasks').insert(rows).select();
  if (taskError) throw taskError;
  const { error: updateError } = await supabase.from('marketing_recommendations').update({ status: 'converted_to_task', updated_at: new Date().toISOString() }).in('id', ids);
  if (updateError) throw updateError;
  return tasks || [];
}

export { CHANNELS };
