import { createClientFromRequest } from 'npm:@base44/sdk@0.8.41';

function escapeHtml(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');}

const ROLE_CONFIG = {
  engineer: { entity: 'Engineer', template: 'ترحيب مهندس جديد — بيتلي', subject: 'مرحباً بك كمهندس في بيتلي' },
  surveyor: { entity: 'Engineer', template: 'ترحيب مهندس مساح — بيتلي', subject: 'مرحباً بك كمهندس مساح في بيتلي' },
  firm: { entity: 'EngineeringFirm', template: 'ترحيب بشركة استشارية — بيتلي', subject: 'مرحباً بشركتكم في بيتلي' },
  contractor: { entity: 'Contractor', template: 'ترحيب مقاول جديد — بيتلي', subject: 'مرحباً بك كمقاول في بيتلي' },
  consultant: { entity: 'Consultant', template: 'ترحيب مستشار جديد — بيتلي', subject: 'مرحباً بك كمستشار في بيتلي' },
  supplier: { entity: 'Supplier', template: 'ترحيب مورد جديد — بيتلي', subject: 'مرحباً بك كمورد في بيتلي' },
  legal_consultant: { entity: 'LegalConsultant', template: 'ترحيب مستشار قانوني — بيتلي', subject: 'مرحباً بك كمستشار قانوني في بيتلي' },
  client: { entity: 'Client', template: 'ترحيب مستخدم جديد — بيتلي', subject: 'مرحباً بك في بيتلي' }
};

function roleFromRecord(record, requestedRole){
  if (requestedRole) return requestedRole;
  if (record?.user_type === 'surveyor' || record?.specialization === 'هندسة المساحة') return 'surveyor';
  return 'client';
}

function fallbackBody(name, title, message, ctaText='الدخول إلى حسابي'){
  const safeName = escapeHtml(name || 'عزيزنا المستخدم');
  return `<!doctype html><html lang="ar" dir="rtl"><body style="margin:0;background:#f5f0e8;font-family:Arial,Tahoma,sans-serif;color:#1a1a2e"><div style="max-width:640px;margin:32px auto;background:#fff;border-radius:18px;overflow:hidden;border:1px solid #e5d4b8"><div style="padding:28px;text-align:center;background:linear-gradient(135deg,#4a3f35,#c9a66b);color:#fff"><div style="font-size:34px;font-weight:800">بيتلي</div><div style="font-size:12px;opacity:.9;margin-top:4px">المنظومة الهندسية المتكاملة</div></div><div style="padding:36px 30px;text-align:right"><p style="font-size:16px">مرحباً ${safeName}،</p><h1 style="margin:0 0 18px;color:#4a3f35;font-size:24px">${escapeHtml(title)}</h1><div style="font-size:15px;line-height:1.9;color:#4b5563">${message}</div><div style="text-align:center;margin:30px 0"><a href="https://mybaytly.com" style="display:inline-block;background:#6b5d4f;color:#fff;text-decoration:none;padding:13px 26px;border-radius:10px;font-weight:700">${ctaText}</a></div></div><div style="padding:18px 24px;background:#faf8f4;border-top:1px solid #eee;text-align:center;color:#8a8178;font-size:11px">بيتلي — المنظومة الهندسية المتكاملة<br>للتواصل: info@mybaytly.com</div></div></body></html>`;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json().catch(() => ({}));
    const requestedRole = payload.role || payload.user_type || payload.data?.user_type;
    const id = payload.id || payload.entity_id || payload.data?.id;
    const cfg = ROLE_CONFIG[requestedRole];
    if (!cfg || !id) return Response.json({ error: 'role and entity id are required' }, { status: 400 });

    const records = await base44.asServiceRole.entities[cfg.entity].filter({ id });
    const record = records?.[0];
    if (!record) return Response.json({ error: `${cfg.entity} not found` }, { status: 404 });
    const to = record.email;
    if (!to) return Response.json({ error: 'recipient email is missing' }, { status: 400 });

    const templates = await base44.asServiceRole.entities.EmailTemplate.filter({ name: cfg.template, is_active: true }).catch(() => []);
    const template = templates?.[0];
    const name = record.full_name || record.company_name || record.name || to.split('@')[0];
    let subject = template?.subject || cfg.subject;
    let body = template?.body;
    const replacements = {
      '{{name}}': escapeHtml(name),
      '{{company_name}}': escapeHtml(record.company_name || record.full_name || name),
      '{{project_name}}': escapeHtml(record.project_name || ''),
      '{{project_status}}': escapeHtml(record.project_status || '')
    };
    if (body) Object.entries(replacements).forEach(([key,value]) => { body = body.replaceAll(key, value); });
    if (!body) body = fallbackBody(name, subject.replace(/^مرحباً بك/, 'مرحباً بك'), 'يسعدنا انضمامك إلى منظومة بيتلي. أصبح حسابك جاهزاً، ونتطلع إلى أن تكون تجربتك معنا مهنية وسلسة.');

    await base44.asServiceRole.integrations.Core.SendEmail({
      to,
      from_name: 'بيتلي',
      subject,
      body
    });

    return Response.json({ success: true, recipient: to, role: requestedRole, template: cfg.template });
  } catch (error) {
    console.error('sendWelcomeEmail error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});