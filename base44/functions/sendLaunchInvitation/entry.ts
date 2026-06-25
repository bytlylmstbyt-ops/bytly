import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const { recipients, subject, body, from_name } = await req.json();

    if (!Array.isArray(recipients) || recipients.length === 0 || !subject || !body) {
      return Response.json({ error: 'Missing recipients, subject, or body' }, { status: 400 });
    }

    const results = [];
    for (const email of recipients) {
      try {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: email,
          subject,
          body,
          from_name: from_name || 'بيتلي - لمسة بيت'
        });
        results.push({ email, success: true });
      } catch (err) {
        results.push({ email, success: false, error: err.message });
      }
    }

    const sent = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    return Response.json({ sent, failed, results });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});