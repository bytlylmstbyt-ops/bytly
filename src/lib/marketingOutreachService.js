import { supabase } from '@/lib/supabaseClient';

const TABLES = ['clients', 'engineers', 'engineering_firms'];

export async function getOutreachContacts() {
  const results = await Promise.all(TABLES.map(async (table) => {
    const { data, error } = await supabase
      .from(table)
      .select('id,full_name,company_name,email,phone,city,is_real,status,created_at')
      .order('created_at', { ascending: false })
      .limit(100);
    if (error) throw error;
    return (data || []).map((row) => ({
      id: `${table}:${row.id}`,
      source_table: table,
      source_id: row.id,
      name: row.full_name || row.company_name || 'بدون اسم',
      company_name: row.company_name || null,
      account_type: table === 'clients' ? 'عميل' : table === 'engineers' ? 'مهندس' : 'شركة هندسية',
      email: row.email || null,
      phone: row.phone || null,
      city: row.city || null,
      source_status: row.status || null,
      is_real: row.is_real !== false,
    }));
  }));

  const contacts = results.flat().filter((c) => c.is_real);
  const { data: tracked, error: trackedError } = await supabase
    .from('marketing_outreach_contacts')
    .select('*')
    .order('updated_at', { ascending: false });
  if (trackedError) throw trackedError;

  const trackedMap = new Map((tracked || []).map((x) => [`${x.source_table}:${x.source_id}`, x]));
  return contacts.map((c) => ({ ...c, ...(trackedMap.get(c.id) || {}) }));
}

export async function getContactMessages(contactId) {
  const { data, error } = await supabase
    .from('marketing_outreach_messages')
    .select('*')
    .eq('contact_id', contactId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function ensureTrackedContact(contact) {
  const { data, error } = await supabase
    .from('marketing_outreach_contacts')
    .upsert({
      source_table: contact.source_table,
      source_id: contact.source_id,
      name: contact.name,
      company_name: contact.company_name,
      account_type: contact.account_type,
      email: contact.email,
      phone: contact.phone,
      city: contact.city,
      status: contact.status || 'new',
    }, { onConflict: 'source_table,source_id' })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function saveDraftMessage(contact, body, channel = 'direct_outreach') {
  const tracked = await ensureTrackedContact(contact);
  const { data, error } = await supabase
    .from('marketing_outreach_messages')
    .insert({ contact_id: tracked.id, channel, direction: 'outbound', status: 'draft', body })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function markContacted(contact, messageId = null) {
  const tracked = await ensureTrackedContact(contact);
  const { error: contactError } = await supabase
    .from('marketing_outreach_contacts')
    .update({ status: 'contacted', last_contacted_at: new Date().toISOString() })
    .eq('id', tracked.id);
  if (contactError) throw contactError;
  if (messageId) {
    const { error } = await supabase.from('marketing_outreach_messages').update({ status: 'sent', sent_at: new Date().toISOString() }).eq('id', messageId);
    if (error) throw error;
  }
  return true;
}

export function buildClientMessage(contact) {
  const name = contact.name && contact.name !== 'بدون اسم' ? ` ${contact.name}` : '';
  return `السلام عليكم${name}، معك فريق بيتلي. نود تعريفكم بالمنظومة الهندسية المتكاملة التي تساعد أصحاب المشاريع والجهات الهندسية على الوصول إلى الخدمات والكوادر المناسبة وإدارة رحلة المشروع بشكل أوضح. يسعدنا التواصل معكم لمعرفة احتياجكم الحالي وشرح كيف يمكن لبيتلي أن تخدمكم.`;
}
