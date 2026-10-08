import { createClient } from '@base44/sdk';
import { appParams } from '@/lib/app-params';
import { supabase } from '@/lib/supabaseClient';
import { publishLinkedInPost } from '@/lib/linkedinSupabaseService';
import { callGemini } from '@/lib/geminiClient';

const { appId, token } = appParams;
const PLATFORM_OWNER_EMAIL = 'bytlylmstbyt@gmail.com';
const PLATFORM_OWNER_ID = '2d1b547d-5ba5-4cdc-a39c-cfb60d2f52bc';
const base44BackendUrl = import.meta.env.VITE_BASE44_APP_BASE_URL || 'https://bytly.base44.app';
const legacyBase44 = createClient({ appId, token, requiresAuth: false, serverUrl: base44BackendUrl, appBaseUrl: base44BackendUrl });
const legacyAuthMe = legacyBase44.auth.me.bind(legacyBase44.auth);
const withHardTimeout = (promise, timeoutMs, message = 'انتهت مهلة الاتصال بالخدمة') => new Promise((resolve, reject) => {
  const timer = setTimeout(() => reject(new Error(message)), timeoutMs);
  Promise.resolve(promise).then(v => { clearTimeout(timer); resolve(v); }, e => { clearTimeout(timer); reject(e); });
});

legacyBase44.auth.me = async () => {
  try {
    if (supabase) {
      let sessionUser = null;
      try { sessionUser = (await withHardTimeout(supabase.auth.getUser(), 10000)).data?.user || null; } catch {}
      if (!sessionUser) { try { sessionUser = (await withHardTimeout(supabase.auth.getSession(), 10000)).data?.session?.user || null; } catch {} }
      if (sessionUser) {
        const email = (sessionUser.email || '').trim().toLowerCase();
        const isOwner = sessionUser.id === PLATFORM_OWNER_ID || email === PLATFORM_OWNER_EMAIL;
        let profile = null;
        try {
          let profileResult = await withHardTimeout(
            supabase.from('profiles').select('role,email,full_name').eq('user_id', sessionUser.id).maybeSingle(),
            10000
          );
          if (!profileResult.data && !profileResult.error) {
            profileResult = await withHardTimeout(
              supabase.from('profiles').select('role,email,full_name').eq('id', sessionUser.id).maybeSingle(),
              10000
            );
          }
          profile = profileResult.data || null;
        } catch {}
        const role = isOwner || profile?.role === 'admin' ? 'admin' : (profile?.role || 'user');
        return {
          id: sessionUser.id,
          user_id: sessionUser.id,
          email: sessionUser.email,
          full_name: profile?.full_name || sessionUser.user_metadata?.full_name || sessionUser.user_metadata?.name || '',
          role,
          profile,
          _authProvider: 'supabase',
        };
      }
    }
  } catch (error) { console.warn('Supabase auth bridge failed; falling back to legacy auth.', error); }
  return legacyAuthMe();
};

// AI compatibility bridge: existing Bytly AI pages keep their UI contracts, while
// InvokeLLM is now routed to the secure Supabase Gemini gateway instead of Base44.
legacyBase44.integrations.Core.InvokeLLM = async ({ prompt, response_json_schema, agent = 'assistant', context = {} } = {}) => {
  const wantsJson = Boolean(response_json_schema);
  const result = await callGemini({
    agent,
    prompt,
    context: { ...context, requested_schema: response_json_schema || null },
    responseFormat: wantsJson ? 'json' : 'text',
  });
  if (wantsJson && result?.raw) {
    try { return JSON.parse(result.raw); } catch {}
  }
  return result;
};

try {
  const legacyAgentConversation = legacyBase44.entities.AIAgentConversation;
  if (legacyAgentConversation) {
    legacyBase44.entities.AIAgentConversation = {
      ...legacyAgentConversation,
      filter: async (filters = {}, sort = "-updated_at", limit = 50) => {
        const email = filters?.asked_by_email || null;
        let q = supabase.from("admin_ai_conversations").select("id,admin_user_id,title,messages_json,attachments_count,created_at,updated_at");
        if (email) {
          const { data: authData } = await withHardTimeout(supabase.auth.getUser(), 10000);
          if (!authData?.user || (authData.user.email || "").toLowerCase() !== String(email).toLowerCase()) return [];
          q = q.eq("admin_user_id", authData.user.id);
        }
        q = q.limit(limit).order("updated_at", { ascending: !String(sort).startsWith("-") });
        const { data, error } = await withHardTimeout(q, 10000, "انتهت مهلة قراءة سجل المحادثات");
        if (error) throw error;
        return data || [];
      },
      create: async (payload = {}) => {
        const { data: authData } = await withHardTimeout(supabase.auth.getUser(), 10000);
        const user = authData?.user;
        if (!user) throw new Error("يجب تسجيل الدخول أولاً");
        const row = {
          admin_user_id: user.id,
          title: payload.title || "محادثة جديدة",
          messages_json: typeof payload.messages_json === "string" ? JSON.parse(payload.messages_json || "[]") : (payload.messages_json || []),
          attachments_count: Number(payload.attachments_count || 0),
        };
        const { data, error } = await withHardTimeout(supabase.from("admin_ai_conversations").insert(row).select("*").single(), 10000);
        if (error) throw error;
        return data;
      },
      update: async (id, payload = {}) => {
        const patch = {
          ...(payload.title !== undefined ? { title: payload.title } : {}),
          ...(payload.messages_json !== undefined ? { messages_json: typeof payload.messages_json === "string" ? JSON.parse(payload.messages_json || "[]") : payload.messages_json } : {}),
          ...(payload.attachments_count !== undefined ? { attachments_count: Number(payload.attachments_count || 0) } : {}),
          updated_at: new Date().toISOString(),
        };
        const { data, error } = await withHardTimeout(supabase.from("admin_ai_conversations").update(patch).eq("id", id).select("*").single(), 10000);
        if (error) throw error;
        return data;
      },
    };
  }
} catch (conversationBridgeError) {
  console.warn("Admin conversation Supabase bridge unavailable.", conversationBridgeError);
}

legacyBase44.integrations.Core.UploadFile = async ({ file }) => {
  if (!supabase) throw new Error('Supabase غير مهيأ');
  if (!file) throw new Error('لم يتم اختيار ملف');
  const safeName = String(file.name || 'asset').replace(/[^a-zA-Z0-9._-]/g, '_');
  const path = `platform/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safeName}`;
  const { data, error } = await withHardTimeout(supabase.storage.from('platform-assets').upload(path, file, { upsert: false, contentType: file.type || 'application/octet-stream', cacheControl: '3600' }), 120000, 'انتهت مهلة رفع الملف');
  if (error) throw new Error(`فشل رفع الملف إلى التخزين: ${error.message || 'خطأ غير معروف'}`);
  return { file_url: supabase.storage.from('platform-assets').getPublicUrl(data?.path || path).data.publicUrl };
};

const legacySyncState = legacyBase44.entities.SyncState;
legacyBase44.entities.SyncState = {
  ...legacySyncState,
  list: async () => {
    const { data, error } = await withHardTimeout(supabase.from('sync_states').select('*').order('last_sync', { ascending: false }), 10000, 'انتهت مهلة قراءة حالات التكامل');
    if (error) throw new Error(error.message || 'تعذر قراءة حالات التكامل');
    return data || [];
  },
};

const legacySocialPost = legacyBase44.entities.SocialPost;
legacyBase44.entities.SocialPost = {
  ...legacySocialPost,
  list: async (sort = '-created_at', limit = 100) => {
    let query = supabase.from('social_posts').select('*').limit(limit);
    query = query.order(sort.replace(/^-/, ''), { ascending: !sort.startsWith('-') });
    const { data, error } = await withHardTimeout(query, 10000, 'انتهت مهلة قراءة المنشورات');
    if (error) throw new Error(error.message || 'تعذر قراءة المنشورات');
    return data || [];
  },
  filter: async (filters = {}, sort = '-scheduled_at', limit = 50) => {
    let query = supabase.from('social_posts').select('*');
    Object.entries(filters || {}).forEach(([key, value]) => { query = value === null ? query.is(key, null) : query.eq(key, value); });
    query = query.limit(limit).order(sort.replace(/^-/, ''), { ascending: !sort.startsWith('-') });
    const { data, error } = await withHardTimeout(query, 10000, 'انتهت مهلة قراءة المنشورات المجدولة');
    if (error) throw new Error(error.message || 'تعذر قراءة المنشورات المجدولة');
    return data || [];
  },
  create: async payload => {
    const row = { ...payload };
    delete row.id;
    if (!row.created_by) { try { row.created_by = (await supabase.auth.getUser()).data?.user?.id || null; } catch {} }
    const { data, error } = await withHardTimeout(supabase.from('social_posts').insert(row).select('*').single(), 10000, 'انتهت مهلة حفظ المنشور');
    if (error) throw new Error(error.message || 'تعذر حفظ المنشور');
    return data;
  },
  update: async (id, payload) => {
    const { data, error } = await withHardTimeout(supabase.from('social_posts').update({ ...payload, updated_at: new Date().toISOString() }).eq('id', id).select('*').single(), 10000, 'انتهت مهلة تحديث المنشور');
    if (error) throw new Error(error.message || 'تعذر تحديث المنشور');
    return data;
  },
  delete: async id => {
    const { error } = await withHardTimeout(supabase.from('social_posts').delete().eq('id', id), 10000, 'انتهت مهلة حذف المنشور');
    if (error) throw new Error(error.message || 'تعذر حذف المنشور');
    return true;
  },
};

const legacyEngineer = legacyBase44.entities.Engineer;
legacyBase44.entities.Engineer = {
  ...legacyEngineer,
  filter: async (filters = {}) => {
    const email = filters?.email?.toLowerCase?.();
    try {
      let q = supabase.from('engineers').select('*');
      Object.entries(filters).forEach(([k,v]) => { if (v != null) q = q.eq(k, v); });
      const { data, error } = await withHardTimeout(q, 10000, 'انتهت مهلة قراءة بيانات المهندس');
      if (!error && data?.length) return data;
    } catch {}
    try {
      let q = supabase.from('base44_engineer_migration_staging').select('*');
      if (email) q = q.ilike('email', email);
      else Object.entries(filters).forEach(([k,v]) => { if (v != null && ['full_name','phone','city','specialization'].includes(k)) q = q.eq(k,v); });
      const { data, error } = await withHardTimeout(q, 10000, 'انتهت مهلة قراءة بيانات المهندس القديمة');
      if (!error && data?.length) return data;
    } catch {}
    return [];
  },
  create: async payload => {
  const { data: sessionData } = await withHardTimeout(supabase.auth.getSession(), 10000, 'انتهت مهلة جلسة الدخول');
  const authUser = sessionData?.session?.user;
  if (!authUser) throw new Error('يجب تسجيل الدخول أولاً');
  const row = { full_name: payload.full_name, email: authUser.email || payload.email || null, phone: payload.phone || null, city: payload.city || null, country: payload.country || null, specialization: payload.specialization || null, bio: payload.bio || null, registration_number: payload.registration_number || null, years_experience: Number(payload.years_experience) || 0, completed_projects: Number(payload.completed_projects) || 0, graduation_certificate_url: payload.graduation_certificate_url || null, saudi_engineers_council_certificate_url: payload.saudi_engineers_council_certificate_url || null, profile_image: payload.profile_image || null, is_verified: false, is_real: true, status: 'pending', rating: 0, total_reviews: 0, wallet_balance: 0, subscription_type: payload.subscription_type || 'none', is_subscription_active: Boolean(payload.is_subscription_active), subscription_start_date: payload.subscription_start_date || null, trial_end_date: payload.trial_end_date || null, user_id: authUser.id, source: 'supabase' };
  const { data, error } = await withHardTimeout(supabase.from('engineers').insert(row).select('*').single(), 15000, 'انتهت مهلة حفظ بيانات التسجيل');
  if (error) throw new Error(error.message || 'تعذر حفظ تسجيل المهندس');
  return data;
}};

const resolveLegacyId = async (entity, currentId) => {
  if (!currentId || !supabase) return currentId;
  try {
    const table = entity === 'Engineer' ? 'engineers' : entity === 'Client' ? 'clients' : 'projects';
    const staging = entity === 'Engineer' ? 'base44_engineer_migration_staging' : entity === 'Client' ? 'base44_client_migration_staging' : 'base44_project_migration_staging';
    const { data: row } = await supabase.from(table).select('email').eq('id', currentId).maybeSingle();
    if (!row?.email) return currentId;
    const { data: legacy } = await supabase.from(staging).select('base44_id').eq('email', row.email).maybeSingle();
    return legacy?.base44_id || currentId;
  } catch { return currentId; }
};

const legacyPermitApplication = legacyBase44.entities.PermitApplication;
legacyBase44.entities.PermitApplication = {
  ...legacyPermitApplication,
  filter: async (filters = {}, sort = "-created_date", limit = 100) => {
    let q = supabase.from("permit_applications").select("*").limit(limit);
    Object.entries(filters || {}).forEach(([k, v]) => {
      if (v === null) q = q.is(k, null);
      else if (Array.isArray(v)) q = q.in(k, v);
      else q = q.eq(k, v);
    });
    const sortColumn = String(sort || "").replace(/^-/, "") || "created_at";
    const { data, error } = await withHardTimeout(
      q.order(sortColumn === "created_date" ? "created_at" : sortColumn, { ascending: !String(sort).startsWith("-") }),
      10000,
      "انتهت مهلة قراءة طلبات رخص البناء"
    );
    if (error) throw new Error(error.message || "تعذر قراءة طلبات رخص البناء");
    return (data || []).map(row => ({ ...row, created_date: row.created_at }));
  },
  create: async payload => {
    const { data: authData } = await withHardTimeout(supabase.auth.getUser(), 10000, "انتهت مهلة جلسة الدخول");
    const user = authData?.user;
    if (!user) throw new Error("يجب تسجيل الدخول أولاً");
    const row = { ...payload, created_by: user.id, client_email: payload.client_email || user.email, drawings_files: Array.isArray(payload.drawings_files) ? payload.drawings_files : [] };
    delete row.id; delete row.created_date;
    const { data, error } = await withHardTimeout(supabase.from("permit_applications").insert(row).select("*").single(), 15000, "انتهت مهلة حفظ طلب رخصة البناء");
    if (error) throw new Error(error.message || "تعذر حفظ طلب رخصة البناء");
    return { ...data, created_date: data.created_at };
  },
  update: async (id, payload) => {
    const patch = { ...payload }; delete patch.id; delete patch.created_date;
    const { data, error } = await withHardTimeout(supabase.from("permit_applications").update(patch).eq("id", id).select("*").single(), 10000, "انتهت مهلة تحديث طلب رخصة البناء");
    if (error) throw new Error(error.message || "تعذر تحديث طلب رخصة البناء");
    return { ...data, created_date: data.created_at };
  },
};

const legacyContract = legacyBase44.entities.Contract;
legacyBase44.entities.Contract = {
  ...legacyContract,
  filter: async filters => {
    const mapped = { ...(filters || {}) };
    if (mapped.engineer_id) mapped.engineer_id = await resolveLegacyId('Engineer', mapped.engineer_id);
    if (mapped.client_id) mapped.client_id = await resolveLegacyId('Client', mapped.client_id);
    if (mapped.project_id) mapped.project_id = await resolveLegacyId('Project', mapped.project_id);
    try {
      let q = supabase.from('project_contracts').select('*');
      Object.entries(filters || {}).forEach(([k,v]) => { q = v === null ? q.is(k,null) : Array.isArray(v) ? q.in(k,v) : q.eq(k,v); });
      const { data, error } = await withHardTimeout(q,10000,'انتهت مهلة قراءة العقود');
      if (!error && data?.length) return data;
    } catch {}
    try { return await withHardTimeout(legacyContract.filter(mapped), 7000, 'انتهت مهلة قراءة العقود القديمة'); } catch { return []; }
  },
  list: async (sort='-created_date', limit=100) => {
    try {
      const { data, error } = await withHardTimeout(supabase.from('project_contracts').select('*').limit(limit).order('created_at',{ascending:!sort.startsWith('-')}),10000,'انتهت مهلة قراءة العقود');
      if (!error && data?.length) return data;
    } catch {}
    try { return await withHardTimeout(legacyContract.list(sort, limit), 7000, 'انتهت مهلة قائمة العقود القديمة'); } catch { return []; }
  }
};

const legacyProject = legacyBase44.entities.Project;
legacyBase44.entities.Project = { ...legacyProject,
  filter: async filters => {
    const mapped = { ...(filters || {}) };
    if (mapped.client_id) mapped.client_id = await resolveLegacyId('Client', mapped.client_id);
    if (mapped.assigned_engineer_id) mapped.assigned_engineer_id = await resolveLegacyId('Engineer', mapped.assigned_engineer_id);
    try {
      let q=supabase.from('projects').select('*');
      Object.entries(filters||{}).forEach(([k,v])=>{q=v===null?q.is(k,null):Array.isArray(v)?q.in(k,v):q.eq(k,v)});
      const {data,error}=await withHardTimeout(q,10000,'انتهت مهلة قراءة المشروع');
      if(!error && data?.length) return data;
    } catch {}
    try { return await withHardTimeout(legacyProject.filter(mapped), 7000, 'انتهت مهلة قراءة المشاريع القديمة'); } catch { return []; }
  },
  list: async(sort='-created_date',limit=100)=>{
    try {
      const {data,error}=await withHardTimeout(supabase.from('projects').select('*').limit(limit).order('created_at',{ascending:!sort.startsWith('-')}),10000,'انتهت مهلة قراءة المشاريع');
      if(!error && data?.length) return data;
    } catch {}
    try { return await withHardTimeout(legacyProject.list(sort,limit), 7000, 'انتهت مهلة قائمة المشاريع القديمة'); } catch { return []; }
  },
  update: async(id,payload)=>{const {data,error}=await withHardTimeout(supabase.from('projects').update({...payload,updated_at:new Date().toISOString()}).eq('id',id).select('*').single(),10000,'انتهت مهلة تحديث المشروع');if(error)throw new Error(error.message);return data},
  create: async payload=>{const row={...payload};delete row.id;delete row.created_date;const {data,error}=await withHardTimeout(supabase.from('projects').insert(row).select('*').single(),10000,'انتهت مهلة إنشاء المشروع');if(error)throw new Error(error.message);return data},
  delete: async id=>{const {error}=await withHardTimeout(supabase.from('projects').delete().eq('id',id),10000,'انتهت مهلة حذف المشروع');if(error)throw new Error(error.message);return true},
};

const legacyClient = legacyBase44.entities.Client;
legacyBase44.entities.Client = {
  ...legacyClient,
  filter: async filters => {
    try {
      let q = supabase.from('clients').select('*');
      Object.entries(filters||{}).forEach(([k,v])=>{q=v===null?q.is(k,null):Array.isArray(v)?q.in(k,v):q.eq(k,v)});
      const {data,error}=await withHardTimeout(q,10000,'انتهت مهلة قراءة العميل');
      if(!error && data?.length) return data;
    } catch {}
    try {
      let q = supabase.from('base44_client_migration_staging').select('*');
      if (filters?.email) q = q.ilike('email', filters.email);
      const {data,error}=await withHardTimeout(q,10000,'انتهت مهلة قراءة بيانات العميل القديمة');
      if(!error && data?.length) return data;
    } catch {}
    return [];
  }
};

const legacyPortfolio = legacyBase44.entities.Portfolio;
legacyBase44.entities.Portfolio = {...legacyPortfolio,create:async payload=>{const {data,error}=await withHardTimeout(supabase.from('portfolios').insert({engineer_id:payload.engineer_id||null,title:payload.title||'عمل سابق',description:payload.description||null,images:Array.isArray(payload.images)?payload.images:[]}).select('*').single(),10000,'انتهت مهلة حفظ الأعمال السابقة');if(error)throw new Error(error.message);return data}};

const legacyPlatformSettings = legacyBase44.entities.PlatformSettings;
legacyBase44.entities.PlatformSettings = {...legacyPlatformSettings,list:async()=>{const {data,error}=await withHardTimeout(supabase.from('platform_settings').select('*').order('updated_at',{ascending:false}).limit(1),10000,'انتهت مهلة قراءة إعدادات المنصة');if(error)throw error;return data||[]},create:async p=>{const {data,error}=await withHardTimeout(supabase.from('platform_settings').insert(p).select('*').single(),10000,'انتهت مهلة حفظ إعدادات المنصة');if(error)throw error;return data},update:async(id,p)=>{const {data,error}=await withHardTimeout(supabase.from('platform_settings').update({...p,updated_at:new Date().toISOString()}).eq('id',id).select('*').single(),10000,'انتهت مهلة تحديث إعدادات المنصة');if(error)throw error;return data}};


const resolveUserIdByEmail = async email => {
  if (!email) return null;
  const { data } = await withHardTimeout(
    supabase.from('profiles').select('user_id,email').ilike('email', String(email).trim()).maybeSingle(),
    10000
  );
  return data?.user_id || null;
};

const legacyProposal = legacyBase44.entities.Proposal;
legacyBase44.entities.Proposal = {
  ...legacyProposal,
  filter: async (filters = {}) => {
    let q = supabase.from('project_offers').select('*');
    if (filters.project_id) q = q.eq('project_id', filters.project_id);
    if (filters.status) q = q.eq('status', filters.status);
    const { data, error } = await withHardTimeout(q.order('created_at', { ascending: false }), 10000, 'انتهت مهلة قراءة العروض');
    if (error) throw new Error(error.message || 'تعذر قراءة العروض');
    return (data || []).map(row => ({
      ...row,
      engineer_id: row.engineer_user_id,
      price: row.amount,
      delivery_days: row.duration_days,
      cover_letter: row.proposal,
      attachments: row.attachments || [],
      portfolio_items: row.portfolio_items || []
    }));
  },
  create: async payload => {
    const { data: authData } = await withHardTimeout(supabase.auth.getUser(), 10000);
    const user = authData?.user;
    if (!user) throw new Error('يجب تسجيل الدخول أولاً');
    const row = {
      project_id: payload.project_id,
      engineer_user_id: user.id,
      amount: Number(payload.price ?? payload.amount ?? 0),
      currency: payload.currency || 'SAR',
      duration_days: Number(payload.delivery_days ?? payload.duration_days ?? 0) || null,
      proposal: payload.cover_letter ?? payload.proposal ?? null,
      status: payload.status || 'pending',
      attachments: Array.isArray(payload.attachments) ? payload.attachments : [],
      portfolio_items: Array.isArray(payload.portfolio_items) ? payload.portfolio_items : []
    };
    const { data, error } = await withHardTimeout(supabase.from('project_offers').insert(row).select('*').single(), 15000);
    if (error) throw new Error(error.message || 'تعذر حفظ العرض');
    return { ...data, engineer_id: user.id, price: data.amount, delivery_days: data.duration_days, cover_letter: data.proposal };
  },
  update: async (id, payload) => {
    const patch = {};
    if (payload.status !== undefined) patch.status = payload.status;
    if (payload.price !== undefined || payload.amount !== undefined) patch.amount = Number(payload.price ?? payload.amount);
    if (payload.delivery_days !== undefined || payload.duration_days !== undefined) patch.duration_days = Number(payload.delivery_days ?? payload.duration_days);
    if (payload.cover_letter !== undefined || payload.proposal !== undefined) patch.proposal = payload.cover_letter ?? payload.proposal;
    const { data, error } = await withHardTimeout(supabase.from('project_offers').update(patch).eq('id', id).select('*').single(), 10000);
    if (error) throw new Error(error.message || 'تعذر تحديث العرض');
    return data;
  }
};

const legacyReview = legacyBase44.entities.Review;
legacyBase44.entities.Review = {
  ...legacyReview,
  filter: async (filters = {}) => {
    let q = supabase.from('project_reviews').select('*');
    if (filters.project_id) q = q.eq('project_id', filters.project_id);
    if (filters.engineer_id) q = q.eq('reviewee_user_id', filters.engineer_id);
    const { data, error } = await withHardTimeout(q.order('created_at', { ascending: false }), 10000);
    if (error) throw new Error(error.message || 'تعذر قراءة التقييمات');
    return data || [];
  },
  create: async payload => {
    const { data: authData } = await withHardTimeout(supabase.auth.getUser(), 10000);
    const user = authData?.user;
    if (!user) throw new Error('يجب تسجيل الدخول أولاً');
    const row = {
      project_id: payload.project_id,
      reviewer_user_id: user.id,
      reviewee_user_id: payload.reviewee_user_id || payload.engineer_id || null,
      rating: Number(payload.rating || 5),
      comment: payload.comment || null
    };
    const { data, error } = await withHardTimeout(supabase.from('project_reviews').insert(row).select('*').single(), 10000);
    if (error) throw new Error(error.message || 'تعذر حفظ التقييم');
    return data;
  }
};

const legacyNotification = legacyBase44.entities.Notification;
legacyBase44.entities.Notification = {
  ...legacyNotification,
  filter: async (filters = {}, sort = '-created_at', limit = 100) => {
    let q = supabase.from('notifications').select('*').limit(limit);
    if (filters.user_id) q = q.eq('user_id', filters.user_id);
    if (filters.recipient_email) {
      const uid = await resolveUserIdByEmail(filters.recipient_email);
      if (!uid) return [];
      q = q.eq('user_id', uid);
    }
    if (filters.type) q = q.eq('type', filters.type);
    q = q.order(sort.replace(/^-/, ''), { ascending: !String(sort).startsWith('-') });
    const { data, error } = await withHardTimeout(q, 10000);
    if (error) throw new Error(error.message || 'تعذر قراءة الإشعارات');
    return data || [];
  },
  create: async payload => {
    const { data: authData } = await withHardTimeout(supabase.auth.getUser(), 10000);
    const actor = authData?.user;
    if (!actor) throw new Error('يجب تسجيل الدخول أولاً');
    const row = {
      user_id: payload.user_id || await resolveUserIdByEmail(payload.recipient_email) || actor.id,
      type: payload.type || 'system',
      title: payload.title || '',
      body: payload.message || payload.body || '',
      entity_type: payload.entity_type || null,
      entity_id: payload.related_entity_id || payload.related_project_id || null
    };
    const { data, error } = await withHardTimeout(supabase.from('notifications').insert(row).select('*').single(), 10000);
    if (error) throw new Error(error.message || 'تعذر إنشاء الإشعار');
    return data;
  },
  update: async (id, payload) => {
    const patch = {};
    if (payload.is_read !== undefined) patch.read_at = payload.is_read ? new Date().toISOString() : null;
    if (payload.read_at !== undefined) patch.read_at = payload.read_at;
    const { data, error } = await withHardTimeout(supabase.from('notifications').update(patch).eq('id', id).select('*').single(), 10000);
    if (error) throw new Error(error.message || 'تعذر تحديث الإشعار');
    return data;
  }
};

const legacyTransaction = legacyBase44.entities.Transaction;
legacyBase44.entities.Transaction = {
  ...legacyTransaction,
  filter: async (filters = {}) => {
    let q = supabase.from('wallet_transactions').select('*');
    if (filters.project_id) q = q.eq('project_id', filters.project_id);
    if (filters.user_id) q = q.eq('user_id', filters.user_id);
    if (filters.type) q = q.eq('type', filters.type);
    const { data, error } = await withHardTimeout(q.order('created_at', { ascending: false }), 10000);
    if (error) throw new Error(error.message || 'تعذر قراءة المعاملات');
    return data || [];
  }
};

const createContractFromProposalSupabase = async proposalId => {
  const { data: authData } = await withHardTimeout(supabase.auth.getUser(), 10000);
  if (!authData?.user) throw new Error('يجب تسجيل الدخول أولاً');
  const { data: offer, error: offerError } = await withHardTimeout(supabase.from('project_offers').select('*').eq('id', proposalId).single(), 10000);
  if (offerError) throw new Error(offerError.message || 'تعذر قراءة العرض');
  const { data: project, error: projectError } = await withHardTimeout(supabase.from('projects').select('*').eq('id', offer.project_id).single(), 10000);
  if (projectError) throw new Error(projectError.message || 'تعذر قراءة المشروع');
  const { data: existing } = await withHardTimeout(supabase.from('project_contracts').select('*').eq('offer_id', proposalId).maybeSingle(), 10000);
  if (existing) return { success: true, contract: existing };
  const row = {
    project_id: project.id,
    offer_id: offer.id,
    client_user_id: project.client_user_id,
    provider_user_id: offer.engineer_user_id,
    client_id: project.client_user_id,
    engineer_id: offer.engineer_user_id,
    title: 'عقد مشروع ' + (project.title || ''),
    contract_number: 'BYTLY-' + new Date().getFullYear() + '-' + String(Date.now()).slice(-8),
    amount: offer.amount,
    currency: offer.currency || 'SAR',
    status: 'pending_signature',
    terms: offer.proposal || null,
    contract_type: 'project_start',
    service_description: offer.proposal || project.description || null,
    total_amount: offer.amount,
    payment_terms: 'حسب مراحل المشروع المتفق عليها',
    start_date: project.start_date || null,
    delivery_date: project.deadline || null,
    contract_version: 1,
    provider_type: 'engineer',
    description: project.description || null
  };
  const { data: contract, error } = await withHardTimeout(supabase.from('project_contracts').insert(row).select('*').single(), 15000);
  if (error) throw new Error(error.message || 'تعذر إنشاء العقد');
  return { success: true, contract };
};

const legacyFunctions = legacyBase44.functions;
legacyBase44.functions = {
  ...legacyFunctions,
  invoke: async (name, payload) => {
    if (name === 'createContractFromProposal') return { data: await createContractFromProposalSupabase(payload?.proposal_id) };
    if (name === 'bookReviewMeeting') {
      const action = payload?.action || 'book';
      const date = payload?.date || payload?.appointment_date;
      const targetEmail = payload?.engineer_email || payload?.target_email || null;
      if (action === 'available') {
        let q = supabase.from('consultation_appointments').select('appointment_time').eq('appointment_date', date).neq('status', 'cancelled');
        if (targetEmail) q = q.eq('target_email', targetEmail);
        const { data, error } = await withHardTimeout(q, 10000, 'انتهت مهلة قراءة المواعيد');
        if (error) throw new Error(error.message || 'تعذر قراءة المواعيد');
        const booked_slots = (data || []).map(x => String(x.appointment_time).slice(0,5));
        const all = ['09:00','09:30','10:00','10:30','11:00','11:30','13:00','13:30','14:00','14:30','15:00','15:30','16:00','16:30','17:00'];
        return { data: { available_slots: all.filter(x => !booked_slots.includes(x)), booked_slots } };
      }
      const { data: authData } = await withHardTimeout(supabase.auth.getUser(), 10000);
      const user = authData?.user;
      if (!user) throw new Error('يجب تسجيل الدخول أولاً');
      const targetUser = targetEmail ? (await withHardTimeout(supabase.from('profiles').select('user_id').ilike('email', targetEmail).maybeSingle(), 10000)).data?.user_id : null;
      const row = {
        project_id: payload?.project_id || null, created_by: user.id, client_user_id: user.id,
        provider_user_id: targetUser || null, target_id: payload?.target_id || null,
        target_name: payload?.target_name || null, target_email: targetEmail,
        appointment_date: payload.appointment_date, appointment_time: payload.appointment_time,
        consultation_type: payload.consultation_type || 'video_call',
        appointment_type: payload.consultation_type || 'video_call',
        topic: payload.topic, notes: payload.notes || null, client_phone: payload.client_phone || null,
        status: 'pending', meet_link: null, calendar_link: null
      };
      const { data, error } = await withHardTimeout(supabase.from('consultation_appointments').insert(row).select('*').single(), 15000, 'انتهت مهلة حجز الاجتماع');
      if (error) throw new Error(error.message || 'تعذر حجز الاجتماع');
      const day = String(payload.appointment_date).replace(/-/g,'');
      const start = String(payload.appointment_time).replace(':','') + '00';
      const hour = Number(String(payload.appointment_time).slice(0,2)) + 1;
      const end = String(hour).padStart(2,'0') + String(payload.appointment_time).slice(3) + '00';
      const calendarLink = 'https://calendar.google.com/calendar/render?action=TEMPLATE&text=' +
        encodeURIComponent(payload.topic || 'اجتماع Bytly') + '&dates=' + day + 'T' + start + '/' + day + 'T' + end +
        '&details=' + encodeURIComponent(payload.notes || '') + (targetEmail ? '&add=' + encodeURIComponent(targetEmail) : '');
      await withHardTimeout(supabase.from('consultation_appointments').update({ calendar_link: calendarLink }).eq('id', data.id), 10000);
      return { data: { success: true, appointment: { ...data, calendar_link: calendarLink }, google_calendar_link: calendarLink, meet_link: null } };
    }

    if (name === 'createMeetCall') {
      return { data: { success: true, meet_link: null, google_calendar_link: null, calendar_link: null } };
    }

    if (name === 'linkedinService' && payload?.action === 'shareDesignWork') {
      const text = payload?.data?.customCaption;
      const published = await publishLinkedInPost(text);
      return { data: { success: true, message: 'تم النشر على LinkedIn عبر Supabase ✓', postId: published?.postId || null } };
    }
    return legacyFunctions.invoke(name, payload);
  },
};

export const base44 = legacyBase44;
