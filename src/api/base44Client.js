import { createClient } from '@base44/sdk';
import { appParams } from '@/lib/app-params';
import { supabase } from '@/lib/supabaseClient';

const { appId, token } = appParams;
const PLATFORM_OWNER_EMAIL = 'bytlylmstbyt@gmail.com';
const PLATFORM_OWNER_ID = '2d1b547d-ba5d-4cdc-a39c-cfb60d2f52bc';

const base44BackendUrl = import.meta.env.DEV
  ? 'http://localhost:4400'
  : (import.meta.env.VITE_BASE44_APP_BASE_URL || 'https://bytly.base44.app');

const base44Config = { appId, token, requiresAuth: false, serverUrl: base44BackendUrl, appBaseUrl: base44BackendUrl };
const legacyBase44 = createClient(base44Config);
const legacyAuthMe = legacyBase44.auth.me.bind(legacyBase44.auth);

legacyBase44.auth.me = async () => {
  try {
    if (supabase) {
      let sessionUser = null;
      try {
        const { data } = await supabase.auth.getUser();
        sessionUser = data?.user || null;
      } catch {}
      if (!sessionUser) {
        const { data } = await supabase.auth.getSession();
        sessionUser = data?.session?.user || null;
      }
      if (sessionUser) {
        const email = (sessionUser.email || '').trim().toLowerCase();
        const isOwner = sessionUser.id === PLATFORM_OWNER_ID || email === PLATFORM_OWNER_EMAIL;
        let profile = null;
        try {
          const { data } = await supabase.from('profiles').select('role,email,full_name').eq('id', sessionUser.id).maybeSingle();
          profile = data || null;
        } catch {}
        return {
          id: sessionUser.id,
          user_id: sessionUser.id,
          email: sessionUser.email,
          full_name: profile?.full_name || sessionUser.user_metadata?.full_name || sessionUser.user_metadata?.name || '',
          role: isOwner || profile?.role === 'admin' ? 'admin' : (profile?.role || 'user'),
          profile,
        };
      }
    }
  } catch (error) {
    console.warn('Supabase auth bridge failed; falling back to legacy auth.', error);
  }
  return legacyAuthMe();
};

try {
  const legacyAgentConversation = legacyBase44.entities.AIAgentConversation;
  if (legacyAgentConversation?.filter) {
    const legacyAgentFilter = legacyAgentConversation.filter.bind(legacyAgentConversation);
    legacyAgentConversation.filter = async (...args) => {
      try {
        return await legacyAgentFilter(...args);
      } catch (error) {
        console.warn('AIAgentConversation history unavailable during migration:', error?.message || error);
        return [];
      }
    };
  }
} catch (error) {
  console.warn('Could not install AIAgentConversation compatibility guard:', error);
}

legacyBase44.integrations.Core.UploadFile = async ({ file }) => {
  if (!supabase) throw new Error('Supabase غير مهيأ');
  if (!file) throw new Error('لم يتم اختيار ملف');
  const safeName = String(file.name || 'asset').replace(/[^a-zA-Z0-9._-]/g, '_');
  const path = `platform/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safeName}`;
  const { data, error } = await supabase.storage.from('platform-assets').upload(path, file, {
    upsert: false,
    contentType: file.type || 'application/octet-stream',
    cacheControl: '3600',
  });
  if (error) {
    console.error('Supabase platform asset upload failed:', error);
    throw new Error(`فشل رفع الملف إلى التخزين: ${error.message || 'خطأ غير معروف'}`);
  }
  const { data: publicData } = supabase.storage.from('platform-assets').getPublicUrl(data?.path || path);
  return { file_url: publicData.publicUrl };
};

// Registration is now written to Supabase directly. This removes the legacy
// Base44 create request from the critical path, which could remain pending.
const legacyEngineer = legacyBase44.entities.Engineer;
legacyBase44.entities.Engineer = {
  ...legacyEngineer,
  create: async (payload) => {
    if (!supabase) throw new Error('Supabase غير مهيأ');
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError) throw authError;
    const authUser = authData?.user;
    if (!authUser) throw new Error('يجب تسجيل الدخول أولاً');

    const row = {
      full_name: payload.full_name,
      email: authUser.email || payload.email || null,
      phone: payload.phone || null,
      city: payload.city || null,
      country: payload.country || null,
      specialization: payload.specialization || null,
      bio: payload.bio || null,
      registration_number: payload.registration_number || null,
      years_experience: Number(payload.years_experience) || 0,
      completed_projects: Number(payload.completed_projects) || 0,
      graduation_certificate_url: payload.graduation_certificate_url || null,
      saudi_engineers_council_certificate_url: payload.saudi_engineers_council_certificate_url || null,
      profile_image: payload.profile_image || null,
      is_verified: false,
      is_real: true,
      status: 'pending',
      rating: 0,
      total_reviews: 0,
      wallet_balance: 0,
      subscription_type: payload.subscription_type || 'none',
      is_subscription_active: Boolean(payload.is_subscription_active),
      subscription_start_date: payload.subscription_start_date || null,
      trial_end_date: payload.trial_end_date || null,
      user_id: authUser.id,
      source: 'supabase',
    };

    const { data, error } = await supabase.from('engineers').insert(row).select('*').single();
    if (error) {
      console.error('Supabase engineer registration failed:', error);
      throw new Error(error.message || 'تعذر حفظ تسجيل المهندس');
    }
    return data;
  },
};

const legacyPortfolio = legacyBase44.entities.Portfolio;
legacyBase44.entities.Portfolio = {
  ...legacyPortfolio,
  create: async (payload) => {
    if (!supabase) throw new Error('Supabase غير مهيأ');
    const { data, error } = await supabase.from('portfolios').insert({
      engineer_id: payload.engineer_id || null,
      title: payload.title || 'عمل سابق',
      description: payload.description || null,
      images: Array.isArray(payload.images) ? payload.images : [],
    }).select('*').single();
    if (error) throw new Error(error.message || 'تعذر حفظ العمل السابق');
    return data;
  },
};

const legacyPlatformSettings = legacyBase44.entities.PlatformSettings;
legacyBase44.entities.PlatformSettings = {
  ...legacyPlatformSettings,
  list: async () => {
    const { data, error } = await supabase.from('platform_settings').select('*').order('updated_at', { ascending: false }).limit(1);
    if (error) throw error;
    return data || [];
  },
  create: async (payload) => {
    const { data, error } = await supabase.from('platform_settings').insert(payload).select('*').single();
    if (error) throw error;
    return data;
  },
  update: async (id, payload) => {
    const { data, error } = await supabase.from('platform_settings').update({ ...payload, updated_at: new Date().toISOString() }).eq('id', id).select('*').single();
    if (error) throw error;
    return data;
  },
};

export const base44 = legacyBase44;
