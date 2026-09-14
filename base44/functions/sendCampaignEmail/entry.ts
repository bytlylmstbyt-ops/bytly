import { createClientFromRequest } from 'npm:@base44/sdk@0.8.46';

/**
 * Admin-only campaign email sender.
 * Sends an email to a list of recipients via the platform Core integration
 * (service-role) and optionally logs the campaign to the EmailCampaign entity.
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    // Only admins may send campaign emails
    if (user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: admin role required' }, { status: 403 });
    }

    const {
      recipients,
      subject,
      body,
      from_name = 'Bytly',
      logCampaign = false,
      campaignForm = null, // optional form data to store in EmailCampaign
    } = await req.json();

    if (!Array.isArray(recipients) || recipients.length === 0) {
      return Response.json({ error: 'recipients must be a non-empty array' }, { status: 400 });
    }
    if (!subject || !body) {
      return Response.json({ error: 'subject and body are required' }, { status: 400 });
    }

    let sent = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const email of recipients) {
      try {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: email,
          subject,
          body,
          from_name,
        });
        sent++;
      } catch (err) {
        failed++;
        errors.push(`${email}: ${err.message}`);
      }
    }

    // Optionally log the campaign
    if (logCampaign && campaignForm) {
      try {
        await base44.asServiceRole.entities.EmailCampaign.create({
          ...campaignForm,
          status: failed === recipients.length ? 'failed' : 'sent',
          total_recipients: recipients.length,
          sent_count: sent,
          failed_count: failed,
          sent_at: new Date().toISOString(),
          recipients: recipients.slice(0, 100),
          error_log: errors.length > 0 ? errors.join('\n').slice(0, 5000) : null,
        });
      } catch (logErr) {
        console.error('Campaign log failed (non-blocking):', logErr);
      }
    }

    return Response.json({ success: true, sent, failed, total: recipients.length });
  } catch (error) {
    console.error('sendCampaignEmail error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});