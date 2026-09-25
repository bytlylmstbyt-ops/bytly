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

const legacyFunctions = legacyBase44.functions;
legacyBase44.functions = {
  ...legacyFunctions,
  invoke: async (name, payload) => {
    if (name === 'linkedinService' && payload?.action === 'shareDesignWork') {
      const text = payload?.data?.customCaption;
      const published = await publishLinkedInPost(text);
      return { data: { success: true, message: 'تم النشر على LinkedIn عبر Supabase ✓', postId: published?.postId || null } };
    }
    return legacyFunctions.invoke(name, payload);
  },
};

export const base44 = legacyBase44;
