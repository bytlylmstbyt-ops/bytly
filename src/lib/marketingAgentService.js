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
    insights.push({ type: 'market_gap', channel: c.id, priority: priorityLabel(score), title: `استقطاب مهندسين ومقدمي خدمات في ${topLocation[0]}`, audience: c.audience, objective: 'تقليل فجوة العرض حول المناطق التي يظهر فيها طلب فعلي.', message_angle: `ابدأ من الطلب الحقيقي الظاهر في ${topLocation[0]} بدل حملة عامة.`, evidence: `ظهرت ${demand} مشاريع ضمن أحدث 100 مشروع محلل.`, recommendation: `بناء قائمة مستهدفة لمهندسي ومقدمي خدمات ${topLocation[0]}، ثم التواصل معهم وقياس التسجيلات المؤهلة.`, channel: c.id });
  }
  if (topCategory) {
    const score = priorityScore({ demand: topCategory[1], contentGap: 1 });
    const c = channelById('seo_geo');
    insights.push({ type: 'content', channel: c.id, priority: priorityLabel(score), title: `محتوى يستهدف الطلب على ${topCategory[0]}`, audience: c.audience, objective: 'تحويل الطلب الموجود إلى اكتشاف عضوي ومحتوى متخصص.', message_angle: `حل مشكلة مرتبطة بـ${topCategory[0]} من واقع استخدام المنصة.`, evidence: `الفئة ظهرت ${topCategory[1]} مرة ضمن أحدث المشاريع المحللة.`, recommendation: `اقتراح صفحة SEO/GEO + مقال + منشور LinkedIn حول ${topCategory[0]}، ثم قياس الزيارات والتحويل إلى تسجيل أو مشروع.`, channel: c.id });
  }
  if (failed.length) {
    const score = priorityScore({ conversionRisk: failed.length });
    const c = channelById('direct_outreach');
    insights.push({ type: 'conversion', channel: c.id, priority: priorityLabel(score), title: 'معالجة تسرب التسجيل قبل توسيع الاكتساب', audience: 'المستخدمون الذين بدأوا التسجيل ولم يكملوه', objective: 'رفع إكمال التسجيل قبل زيادة الإنفاق التسويقي.', message_angle: 'حل العائق أولًا ثم إعادة الاستهداف.', evidence: `${failed.length} محاولة تسجيل حديثة بحالة فشل.`, recommendation: 'تحليل error_stage ورسالة الخطأ، إصلاح المسار، ثم إنشاء رسالة متابعة للمستخدمين المتأثرين فقط.', channel: c.id });
  }
  if (published === 0) {
    const c = channelById('linkedin');
    insights.push({ type: 'channel', channel: c.id, priority: 'عالية', title: 'إطلاق أول حزمة محتوى مهني قابلة للقياس', audience: c.audience, objective: 'بناء حضور مهني حقيقي قبل التوسع في الإعلانات.', message_angle: 'لقطات حقيقية من بيتلي + مشكلة هندسية واضحة + دعوة واحدة للفعل.', evidence: 'لا توجد منشورات بحالة published في بيانات مركز التسويق.', recommendation: 'إعداد 3 منشورات تجريبية، مع KPI لكل منشور، وإبقاء النشر تحت موافقة صاحبة المنصة.', channel: c.id });
  }
  if (!insights.length) {
    insights.push({ type: 'baseline', channel: 'seo_geo', priority: 'متوسطة', title: 'البيانات الحالية لا تكفي لإثبات فرصة محددة', audience: '—', objective: 'رفع جودة القرار قبل التنفيذ.', message_angle: 'لا نفترض ما لا تدعمه البيانات.', evidence: 'لم يظهر نمط قوي وفق قواعد التحليل الحالية.', recommendation: 'جمع بيانات إضافية ثم إعادة التحليل بدل اختلاق أرقام أو افتراضات.', channel: 'seo_geo' });
  }
  return insights.map(x => ({ ...x, status: 'proposed' }));
}

export async function saveMarketingSuggestions(suggestions, snapshot) {
  const user = (await supabase.auth.getUser()).data?.user;
  if (!user) throw new Error('يجب تسجيل الدخول لحفظ اقتراحات الوكيل.');
  const { data: run, error: runError } = await supabase.from('marketing_agent_runs').insert({ status: 'completed', analysis_type: 'platform', data_snapshot: snapshot, insights_count: suggestions.length, completed_at: new Date().toISOString(), created_by: user.id }).select().single();
  if (runError) throw runError;
  const rows = suggestions.map(s => ({ run_id: run.id, channel: s.channel, title: s.title, priority: s.priority, audience: s.audience, objective: s.objective, message_angle: s.message_angle, recommendation: s.recommendation, evidence: s.evidence, evidence_snapshot: snapshot.counts, status: 'proposed' }));
  const { data, error } = await supabase.from('marketing_recommendations').insert(rows).select();
  if (error) throw error;
  return { run, recommendations: data };
}

export async function approveRecommendations(ids) {
  const user = (await supabase.auth.getUser()).data?.user;
  if (!user) throw new Error('يجب تسجيل الدخول.');
  const { data, error } = await supabase.from('marketing_recommendations').update({ status: 'approved', approved_at: new Date().toISOString(), approved_by: user.id, updated_at: new Date().toISOString() }).in('id', ids).eq('status', 'proposed').select();
  if (error) throw error;
  return data;
}

export async function createTasksFromRecommendations(ids) {
  const { data: recs, error } = await supabase.from('marketing_recommendations').select('*').in('id', ids).eq('status', 'approved');
  if (error) throw error;
  if (!recs?.length) return [];
  const user = (await supabase.auth.getUser()).data?.user;
  const rows = recs.map(r => ({ recommendation_id: r.id, title: r.title, description: r.recommendation, channel: r.channel, priority: r.priority, status: 'pending_approval', created_by: user?.id }));
  const { data: tasks, error: taskError } = await supabase.from('marketing_tasks').insert(rows).select();
  if (taskError) throw taskError;
  const { error: updateError } = await supabase.from('marketing_recommendations').update({ status: 'converted_to_task', updated_at: new Date().toISOString() }).in('id', ids);
  if (updateError) throw updateError;
  return tasks || [];
}

export { CHANNELS };
