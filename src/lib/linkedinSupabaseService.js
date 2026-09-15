import { supabase } from '@/lib/supabaseClient';

export async function getLinkedInStatus() {
  const { data, error } = await supabase.functions.invoke('linkedin-publish', { body: { action: 'status' } });
  if (error) throw error;
  return data;
}

export async function publishLinkedInPost(text) {
  const { data, error } = await supabase.functions.invoke('linkedin-publish', {
    body: { action: 'publish', text },
  });
  if (error) throw error;
  if (!data?.ok) throw new Error(data?.error || 'تعذر النشر على LinkedIn');
  return data;
}
